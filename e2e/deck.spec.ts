import { expect, test, type Page } from '@playwright/test';

/** Deck view: reorder by drag & drop and with the arrow buttons; the order is persisted. */

const titles = (page: Page) => page.locator('.card-tile .otc-card__title').allTextContents();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('open-tabletop-cards');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  }));
  await page.reload();
  await page.getByTestId('import-input').setInputFiles('e2e/fixtures/sample-deck.otc.json');
  await expect(page.locator('.card-tile .otc-card')).toHaveCount(7);
});

test('reorder cards by drag & drop and with the arrow buttons', async ({ page }) => {
  expect((await titles(page)).slice(0, 3)).toEqual(['Feuerball', 'Langschwert', 'Langbogen']);

  // Drag the first card onto the third position.
  await page.locator('.card-tile').nth(0).dragTo(page.locator('.card-tile').nth(2));
  await expect.poll(async () => (await titles(page)).slice(0, 3)).toEqual(['Langschwert', 'Langbogen', 'Feuerball']);

  // Arrow buttons move one position.
  await page.locator('.card-tile').nth(2).getByRole('button', { name: 'Nach vorne' }).click();
  await expect.poll(async () => (await titles(page)).slice(0, 3)).toEqual(['Langschwert', 'Feuerball', 'Langbogen']);
  await expect(page.locator('.card-tile').nth(0).getByRole('button', { name: 'Nach vorne' })).toBeDisabled();

  await page.reload();
  await expect.poll(async () => (await titles(page)).slice(0, 3)).toEqual(['Langschwert', 'Feuerball', 'Langbogen']);
});
