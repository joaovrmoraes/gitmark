// Checks the curated-library home + Add modal render (mocked auth) against the
// single-service Go server. BASE overridable via env.
import { chromium } from 'playwright'
const BASE = process.env.BASE ?? 'http://localhost:8090'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 1100, height: 850 } })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

await page.route('**/me', (r) =>
  r.fulfill({ json: { user: { login: 'joaovrmoraes', name: 'João', avatarUrl: 'https://github.com/github.png' } } }),
)
// Distinct regex routes so /proxy/repo (single) doesn't shadow /proxy/repos (list).
await page.route(/\/proxy\/repos(\?|$)/, (r) =>
  r.fulfill({ json: [{ id: 1, name: 'bataudit', fullName: 'joaovrmoraes/bataudit', owner: 'joaovrmoraes', description: 'audit tool', private: false, defaultBranch: 'main', updatedAt: new Date().toISOString(), stars: 8 }] }),
)
await page.route(/\/proxy\/repo\?/, (r) =>
  r.fulfill({ json: { id: 9, name: 'BibliotecaDev', fullName: 'KAYOKG/BibliotecaDev', owner: 'KAYOKG', description: 'books', private: false, defaultBranch: 'main', updatedAt: new Date().toISOString(), stars: 1 } }),
)

await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await sleep(1000)
await page.screenshot({ path: '/tmp/lib-1-home.png' })
const url = page.url()
const hasYourLibrary = await page.locator('text=Your library').first().isVisible().catch(() => false)
const hasAdd = await page.locator('button:has-text("Add")').first().isVisible().catch(() => false)

// open Add modal + add a public repo by link
await page.locator('button:has-text("Add")').first().click().catch(() => {})
await sleep(500)
const modalOpened = await page.locator('text=/Paste a public repo link/').isVisible().catch(() => false)
await page.fill('input[placeholder*="github.com"]', 'KAYOKG/BibliotecaDev').catch(() => {})
await page.locator('button:has-text("Add")').last().click().catch(() => {})
await sleep(800)
await page.screenshot({ path: '/tmp/lib-2-added.png' })
const vaultAdded = await page.locator('text=BibliotecaDev').first().isVisible().catch(() => false)

console.log(JSON.stringify({ url, hasYourLibrary, hasAdd, modalOpened, vaultAdded, errors }, null, 2))
await ctx.close()
await browser.close()
