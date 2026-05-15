import { chromium } from 'playwright';

const baseUrl = process.env.SIM_BASE_URL ?? 'http://127.0.0.1:4173';
const simulatorName = process.env.SIM_NAME ?? 'Photoelectric Effect';
const outputPath = process.env.SIM_SCREENSHOT_PATH ?? 'artifacts/screenshots/photoelectric.png';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120000 });
  const card = page.getByRole('button', { name: new RegExp(simulatorName, 'i') });
  await card.waitFor({ state: 'visible', timeout: 30000 });
  await card.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: outputPath, fullPage: true });
  console.log(`Saved screenshot to ${outputPath}`);
} finally {
  await browser.close();
}
