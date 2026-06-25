// Drives the built app to a PDF with a fully mocked backend (no OAuth needed)
// and checks the PDF actually renders. Requires `vite preview` on :4173.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE = 'http://localhost:4173'
const PDF = readFileSync('/tmp/test.pdf')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 } })
const page = await ctx.newPage()

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// ---- mock backend ----
await page.route('**/me', (r) =>
  r.fulfill({ json: { user: { login: 'tester', name: 'Tester', avatarUrl: 'https://github.com/github.png' } } }),
)
await page.route('**/proxy/tree*', (r) =>
  r.fulfill({
    json: [
      { path: 'README.md', type: 'blob', size: 10, sha: 'a' },
      { path: 'docs', type: 'tree', size: 0, sha: 'c' },
      { path: 'docs/report.pdf', type: 'blob', size: 10, sha: 'b' },
    ],
  }),
)
await page.route('**/proxy/content*', (r) =>
  r.fulfill({ json: { path: 'README.md', content: '# Hello\n\nMarkdown renders fine. Now open the PDF.' } }),
)
await page.route('**/proxy/raw*', (r) =>
  r.fulfill({ contentType: 'application/pdf', body: PDF }),
)

try {
  await page.goto(`${BASE}/browse/test/repo`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.prose', { timeout: 15000 })
  await sleep(1000)
  await page.screenshot({ path: '/tmp/pdftest-1-readme.png' })

  // Open Contents → click the PDF
  await page.click('button[aria-label="Contents"]')
  await sleep(600)
  await page.click('button:has-text("report")')
  await sleep(800)

  // The PDF must render to a <canvas>. Fail loudly if it never appears.
  let pdfOk = false
  try {
    await page.waitForSelector('canvas', { timeout: 15000 })
    await sleep(1500)
    pdfOk = true
  } catch {
    pdfOk = false
  }
  await page.screenshot({ path: '/tmp/pdftest-2-pdf.png' })

  // Check it's not stuck on a spinner
  const stuckSpinner = await page.locator('text=/Turning the page|Opening the PDF|Loading PDF/').count()

  // Try next page
  const nextBtn = page.locator('button:has-text("Next")')
  if (await nextBtn.count()) {
    await nextBtn.first().click()
    await sleep(1500)
    await page.screenshot({ path: '/tmp/pdftest-3-page2.png' })
  }

  const canvasCount = await page.locator('canvas').count()
  const footer = await page.locator('text=/Page .* of/').first().textContent().catch(() => null)

  console.log(JSON.stringify({ pdfOk, canvasCount, stuckSpinner, footer, errors }, null, 2))
} catch (err) {
  console.log('TEST ERROR:', err.message)
  console.log('console errors:', errors)
  await page.screenshot({ path: '/tmp/pdftest-fail.png' })
} finally {
  await ctx.close()
  await browser.close()
}
