// Copies the pdf.js worker into /public so it's served as a static asset,
// always matching the installed pdfjs-dist version. Runs on predev/prebuild.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const src = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs')
mkdirSync('public', { recursive: true })
copyFileSync(src, 'public/pdf.worker.min.mjs')
console.log('[copy-pdf-worker] public/pdf.worker.min.mjs <-', src)
