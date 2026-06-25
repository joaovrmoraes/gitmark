// Verifies a malicious markdown file cannot run script in the reader.
// Requires `vite preview` serving the latest build on :4173.
import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const MALICIOUS = [
  '# Pwned?',
  '',
  '<img src=x onerror="window.__xss=(window.__xss||0)+1">',
  '<script>window.__xss=(window.__xss||0)+1<\/script>',
  '<a id="evil" href="javascript:window.__xss=(window.__xss||0)+1">click</a>',
  '<svg onload="window.__xss=(window.__xss||0)+1"></svg>',
  '',
  'Normal **markdown** still renders.',
].join('\n')

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } })
const page = await ctx.newPage()

await page.route('**/me', (r) =>
  r.fulfill({ json: { user: { login: 't', name: 't', avatarUrl: 'https://github.com/github.png' } } }),
)
await page.route('**/proxy/tree*', (r) =>
  r.fulfill({ json: [{ path: 'README.md', type: 'blob', size: 1, sha: 'a' }] }),
)
await page.route('**/proxy/content*', (r) =>
  r.fulfill({ json: { path: 'README.md', content: MALICIOUS } }),
)

await page.goto(`${BASE}/browse/t/t`, { waitUntil: 'networkidle' })
await page.waitForSelector('.prose', { timeout: 15000 })
await sleep(800)

// Try to trigger the javascript: link too
await page.locator('#evil').click({ timeout: 1000 }).catch(() => {})
await sleep(500)

const xss = await page.evaluate(() => window.__xss ?? 0)
const hasScriptTag = await page.locator('.prose script').count()
const hasOnerror = await page.evaluate(() => !!document.querySelector('.prose [onerror], .prose [onload]'))
const normalRenders = await page.locator('.prose strong:has-text("markdown")').count()

console.log(JSON.stringify({ xssFired: xss, hasScriptTag, hasOnerror, normalRenders }, null, 2))
console.log(xss === 0 && hasScriptTag === 0 && !hasOnerror ? 'XSS BLOCKED ✅' : 'XSS NOT BLOCKED ❌')

await ctx.close()
await browser.close()
