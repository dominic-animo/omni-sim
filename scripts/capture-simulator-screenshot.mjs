import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.SIM_BASE_URL ?? 'http://127.0.0.1:4173';
const simulatorName = process.env.SIM_NAME ?? 'Photoelectric Effect';
const outputDir = process.env.SIM_SCREENSHOT_DIR ?? 'artifacts/screenshots/photoelectric';
const modeNames = (process.env.SIM_MODE_NAMES ?? 'Near Threshold|Stopping Voltage|Ultraviolet Burst|Thermal Edge')
  .split('|')
  .map((item) => item.trim())
  .filter(Boolean);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1720, height: 1080 } });

try {
  await fs.mkdir(outputDir, { recursive: true });
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120000 });

  const card = page.getByRole('button', { name: new RegExp(simulatorName, 'i') });
  await card.waitFor({ state: 'visible', timeout: 30000 });
  await card.click();
  await page.waitForTimeout(1400);

  const defaultPath = path.join(outputDir, 'default.png');
  await page.screenshot({ path: defaultPath, fullPage: true });
  console.log(`Saved screenshot to ${defaultPath}`);

  for (const mode of modeNames) {
    const modeButton = page.getByRole('button', { name: new RegExp(mode, 'i') }).first();
    if (await modeButton.isVisible().catch(() => false)) {
      await modeButton.click();
      await page.waitForTimeout(1000);
      const modePath = path.join(outputDir, `${mode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`);
      await page.screenshot({ path: modePath, fullPage: true });
      console.log(`Saved screenshot to ${modePath}`);
    }
  }
} finally {
  await browser.close();
}
