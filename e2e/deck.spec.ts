import { expect, test, type Page } from '@playwright/test';

/** Deck view: reorder by drag & drop and with the arrow buttons; the order is persisted. */

const titles = (page: Page) => page.locator('.card-tile .otc-card__title').allTextContents();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('deckwright');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  }));
  await page.reload();
  await page.getByTestId('import-input').setInputFiles('e2e/fixtures/sample-deck.deckwright.json');
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

test('decks stored under the old database name are migrated once', async ({ page }) => {
  // Work on a same-origin page without the app, so no open connection blocks the deletes.
  await page.goto('/favicon.svg');
  // Recreate the pre-rename database ("open-tabletop-cards", schema version 1) with one deck.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const del = indexedDB.deleteDatabase('deckwright');
    del.onerror = () => reject(del.error);
    del.onsuccess = () => {
      const req = indexedDB.open('open-tabletop-cards');
      req.onupgradeneeded = () => {
        const store = req.result.createObjectStore('decks', { keyPath: 'id' });
        store.createIndex('name', 'name');
        store.createIndex('updatedAt', 'updatedAt');
      };
      req.onsuccess = () => {
        const tx = req.result.transaction('decks', 'readwrite');
        tx.objectStore('decks').put({
          id: 'legacy-deck', name: 'Altes Deck', lang: 'de', options: {}, cards: [],
          createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
        });
        tx.oncomplete = () => { req.result.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    };
  }));
  await page.goto('/');
  await expect(page.locator('.deck-list')).toContainText('Altes Deck');
  await expect(page.locator('.deck-list')).not.toContainText('Beispieldeck');

  // Remove the old database again so that later tests start without it.
  await page.goto('/favicon.svg');
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase('open-tabletop-cards');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  }));
});
