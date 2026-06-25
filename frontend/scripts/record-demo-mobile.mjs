// Records a ~28s GitMark MOBILE walkthrough as webm (phone viewport, touch).
// "Kindle for repos": bookshelf → open a book → swipe pages → sepia → contents.
// Run with both servers up:  node scripts/record-demo-mobile.mjs
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, '../../.demo-mobile')
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const VIEWPORT = { width: 390, height: 844 }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
})
const context = await browser.newContext({
  viewport: VIEWPORT,
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  recordVideo: { dir: OUT_DIR, size: VIEWPORT },
})
const page = await context.newPage()

const tap = async (sel) => {
  const el = page.locator(sel).first()
  await el.scrollIntoViewIfNeeded().catch(() => {})
  await sleep(450)
  await el.click()
}

// Dispatch a real horizontal swipe on the reader page (exercises the touch
// handler, not just the buttons).
async function swipe(dir = 'left') {
  await page.evaluate((d) => {
    const el = document.querySelector('[data-reader-page]')
    if (!el) return
    const y = 400
    const from = d === 'left' ? 320 : 70
    const to = d === 'left' ? 70 : 320
    const mk = (type, x) =>
      new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })],
        changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: y })],
      })
    el.dispatchEvent(mk('touchstart', from))
    el.dispatchEvent(mk('touchend', to))
  }, dir)
}

try {
  // 1. Sign in
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await sleep(1700)
  await tap('text=Continue with GitHub')

  // 2. Bookshelf
  await page.waitForSelector('h1:has-text("Your library"):visible', { timeout: 15000 })
  await sleep(1800)
  await page.mouse.wheel(0, 280)
  await sleep(1000)
  await page.mouse.wheel(0, -280)
  await sleep(700)

  // 3. Open a book
  await tap('button:has-text("bataudit"):visible')
  await page.waitForSelector('.prose', { timeout: 20000 })
  await sleep(2400)

  // 4. Turn pages by swiping
  await swipe('left')
  await sleep(2000)
  await swipe('left')
  await sleep(2000)
  await swipe('right')
  await sleep(1800)

  // 5. Sepia reading mode
  await tap('button[aria-label="Reading theme"]')
  await sleep(700)
  await tap('button:has-text("Sepia")')
  await sleep(2200)

  // 6. Contents (table of contents drawer) → jump to a chapter
  await tap('button[aria-label="Contents"]')
  await sleep(1400)
  const chap = page.locator('aside button:has-text("CHANGELOG"), aside button:has-text("CONTRIBUTING")').first()
  if (await chap.count()) {
    await chap.click()
    await page.waitForSelector('.prose', { timeout: 15000 })
    await sleep(2200)
  }

  // 7. Dark reading mode finale
  await tap('button[aria-label="Reading theme"]')
  await sleep(600)
  await tap('button:has-text("Dark")')
  await sleep(2200)
} catch (err) {
  console.error('mobile walkthrough error:', err)
} finally {
  await context.close()
  await browser.close()
  console.log('video written to', OUT_DIR)
}
