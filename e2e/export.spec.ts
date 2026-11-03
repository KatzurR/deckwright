import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';
import { PDFDocument, PDFName } from 'pdf-lib';
import { pngDpi, pngSize } from '../src/export/png';

const SAMPLE = 'e2e/fixtures/sample-deck.otc.json';
const MM_TO_PX = 96 / 25.4;

async function importSample(page: Page) {
  await page.goto('/');
  await page.getByTestId('import-input').setInputFiles(SAMPLE);
  await expect(page.locator('.card-tile')).toHaveCount(7);
  await expect(page.locator('.card-tile .otc-card')).toHaveCount(7);
}

async function download(page: Page, trigger: () => Promise<void>): Promise<Buffer> {
  const [dl] = await Promise.all([page.waitForEvent('download'), trigger()]);
  return readFileSync((await dl.path())!);
}

test.beforeEach(async ({ page }) => {
  // fresh IndexedDB per test
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('open-tabletop-cards');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  }));
});

test('PNG export: one 744 × 1039 px image at 300 dpi per card, zipped', async ({ page }) => {
  await importSample(page);
  await page.getByRole('button', { name: 'Drucken & Export …' }).click();
  await page.getByLabel('PNG-Bilder (ZIP)').check();
  const zip = await download(page, () => page.getByTestId('export-start').click());
  const files = unzipSync(new Uint8Array(zip));
  const names = Object.keys(files).sort();
  expect(names).toHaveLength(7);
  expect(names[0]).toBe('01-feuerball.png');
  for (const name of names) {
    expect(pngSize(files[name])).toEqual({ w: 744, h: 1039 });
    expect(pngDpi(files[name])).toBe(300);
  }
});

for (const [paper, bleed, w, h] of [['a4', false, 595.28, 841.89], ['letter', true, 612, 792]] as const) {
  test(`PDF export: ${paper}${bleed ? ' with bleed' : ''}, exact page size, 9 slots per sheet`, async ({ page }) => {
    await importSample(page);
    await page.getByRole('button', { name: 'Drucken & Export …' }).click();
    await page.getByLabel('PDF-Bogen').check();
    await page.getByLabel('Papierformat').selectOption(paper);
    if (bleed) await page.getByLabel('3 mm Beschnittzugabe').check();
    const bytes = await download(page, () => page.getByTestId('export-start').click());
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const size = doc.getPage(0).getSize();
    expect(size.width).toBeCloseTo(w, 1);
    expect(size.height).toBeCloseTo(h, 1);
    const xobjects = doc.getPage(0).node.Resources()!.lookup(PDFName.of('XObject')) as unknown as { keys(): unknown[] };
    expect(xobjects.keys()).toHaveLength(7);
    expect(doc.getTitle()).toBe('Beispieldeck');
  });
}

test('browser print: sheets and cards have exact physical sizes', async ({ page }) => {
  await importSample(page);
  await page.getByRole('button', { name: 'Drucken & Export …' }).click();
  await page.getByLabel('Direkt drucken (Browser)').check();
  await page.getByLabel('Papierformat').selectOption('a4');
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByTestId('export-start').click();
  await page.emulateMedia({ media: 'print' });
  const sheet = page.locator('.otc-print__sheet').first();
  await expect(sheet).toBeVisible();
  const box = (await sheet.boundingBox())!;
  expect(box.width).toBeCloseTo(210 * MM_TO_PX, 0);
  expect(box.height).toBeCloseTo(297 * MM_TO_PX, 0);
  const card = (await page.locator('.otc-print__cell .otc-card').first().boundingBox())!;
  expect(card.width).toBeCloseTo(63 * MM_TO_PX, 0);
  expect(card.height).toBeCloseTo(88 * MM_TO_PX, 0);
  expect(card.x - box.x).toBeCloseTo(10.5 * MM_TO_PX, 0);
  expect(card.y - box.y).toBeCloseTo(16.5 * MM_TO_PX, 0);
  await expect(page.locator('.otc-print__mark')).toHaveCount(16);
  await expect(page.locator('.otc-print__attribution')).toContainText('Systemreferenzdokument 5.2.1');
  // the app UI is hidden in print
  await expect(page.locator('#root')).toBeHidden();
});

test('deck JSON export and import restore the deck completely', async ({ page }) => {
  await importSample(page);
  const json = await download(page, () => page.getByRole('button', { name: 'Als JSON exportieren' }).click());
  const exported = JSON.parse(json.toString('utf8'));
  const original = JSON.parse(readFileSync(SAMPLE, 'utf8'));
  expect(exported.formatVersion).toBe(1);
  expect(exported.deck.cards).toEqual(original.deck.cards);
  expect(exported.deck.name).toBe(original.deck.name);
});
