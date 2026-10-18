// Renders the per-page share images (1200×630) into assets/og/.
// Usage: node scripts/og/render.mjs   (needs Playwright with Chromium)
// Edit the copy and layouts in scripts/og/template.html.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const template = pathToFileURL(path.join(here, 'template.html')).href;
const outDir = path.join(here, '../../assets/og');
const keys = ['default', 'home', 'about', 'services', 'work', 'sand-dollar', 'contact'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const key of keys) {
  await page.goto(`${template}?p=${key}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, `og-${key}.png`) });
  console.log(`assets/og/og-${key}.png`);
}
await browser.close();
