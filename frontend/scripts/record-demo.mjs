// Records a ~28s GitMark DESKTOP walkthrough as webm (1366x850, VP8) — matches
// the BatAudit tutorial format. "Kindle for repos": bookshelf → open a book →
// turn pages → sepia → contents. Uses system Chromium (no browser download).
// Run with both servers up:  node scripts/record-demo.mjs
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../../.demo')
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const VIEWPORT = { width: 1366, height: 850 }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

const click = async (sel) => {
  const el = page.locator(sel).first()
  await el.scrollIntoViewIfNeeded().catch(() => {})
  await el.hover().catch(() => {})
  await sleep(400)
  await el.click()
}

try {
  // 1. Sign in
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await sleep(1700)
  await click('text=Continue with GitHub')

  // 2. Bookshelf
  await page.waitForSelector('text=Your library', { timeout: 15000 })
  await sleep(2200)

  // 3. Open a book
  await click('button:has-text("bataudit"):visible')
  await page.waitForSelector('.prose', { timeout: 20000 })
  await sleep(2400)

  // 4. Turn pages (footer + arrows trigger the page-turn animation)
  await click('button:has-text("Next")')
  await sleep(1900)
  await click('button:has-text("Next")')
  await sleep(1900)
  await click('button:has-text("Prev")')
  await sleep(1700)

  // 5. Sepia reading mode
  await click('button[aria-label="Reading theme"]')
  await sleep(700)
  await click('button:has-text("Sepia")')
  await sleep(2200)

  // 6. Contents drawer → jump to a chapter
  await click('button[aria-label="Contents"]')
  await sleep(1500)
  const chap = page.locator('aside button:has-text("CHANGELOG"), aside button:has-text("CONTRIBUTING")').first()
  if (await chap.count()) {
    await chap.click()
    await page.waitForSelector('.prose', { timeout: 15000 })
    await sleep(2200)
  }

  // 7. Dark reading mode finale
  await click('button[aria-label="Reading theme"]')
  await sleep(600)
  await click('button:has-text("Dark")')
  await sleep(2200)
} catch (err) {
  console.error('walkthrough error:', err)
} finally {
  await context.close()
  await browser.close()
  console.log('video written to', OUT_DIR)
}
