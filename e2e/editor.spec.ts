import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('open-tabletop-cards');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  }));
  await page.reload();
});

test('create a custom card with live preview, validation and continuation cards', async ({ page }) => {
  await page.getByRole('button', { name: 'Neues Deck' }).click();
  await page.getByLabel('Neue Karte').selectOption('condition');
  // validation: name and text are required
  await page.getByTestId('editor-save').click();
  await expect(page.getByText('Bitte die markierten Felder prüfen.')).toBeVisible();

  await page.getByLabel('Name (DE)').fill('Benommen');
  await page.getByLabel('Regeltext (DE)').fill('- **Wankend:** Du bist im Nachteil.');
  await expect(page.getByTestId('fit-status')).toHaveText('Der Text passt auf die Karte.');
  await expect(page.locator('.editor__preview .otc-card__title')).toHaveText('Benommen');

  const long = Array.from({ length: 30 }, (_, i) => `Absatz ${i + 1}: Dieser Regeltext ist absichtlich sehr lang, damit er nicht auf eine einzelne Karte passt.`).join('\n\n');
  await page.getByLabel('Regeltext (DE)').fill(long);
  await expect(page.getByTestId('fit-status')).toContainText('zu lang für eine Karte');
  await expect(page.locator('.editor__preview .otc-card')).not.toHaveCount(1);
  await expect(page.locator('.editor__preview .otc-card__title').nth(1)).toContainText('Benommen (2/');

  await page.getByTestId('editor-save').click();
  await expect(page.locator('.card-tile')).toHaveCount(1);
  await expect(page.locator('.card-tile .badge')).toBeVisible();

  // persisted in IndexedDB
  await page.reload();
  await expect(page.locator('.card-tile')).toHaveCount(1);
});
