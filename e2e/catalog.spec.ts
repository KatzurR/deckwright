import { expect, test, type Page } from '@playwright/test';

const rows = (page: Page) => page.getByRole('listbox').getByRole('option');

/** Catalog with the real SRD data: search, filter, multiple selection, adopt into a deck (SPEC §6.3). */

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('open-tabletop-cards');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  }));
  await page.reload();
});

test('search in both languages, filter, select and adopt into a new deck', async ({ page }) => {
  await page.getByRole('button', { name: 'SRD-Katalog' }).click();
  const search = page.getByLabel('Suche nach Name (Deutsch oder Englisch)');
  await expect(search).toBeVisible();
  // 339 + 50 + 316 + 258 + 15 entries
  await expect(page.getByText('978 Einträge')).toBeVisible();

  // German and English names find the same entries (substring match, prefix matches first):
  // Feuerball, Spätzündender Feuerball, Halskette/Zauberstab der Feuerbälle.
  await search.fill('Feuerball');
  await expect(rows(page)).toHaveCount(4);
  await expect(rows(page).first()).toContainText('Fireball');
  await search.fill('fireball');
  await expect(rows(page)).toHaveCount(4);
  await expect(rows(page).first()).toContainText('Feuerball');

  // Select it; hovering shows the card preview.
  await rows(page).first().click();
  await expect(rows(page).first()).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.catalog__preview .otc-card__title')).toHaveText('Feuerball');

  // Filters: level 0 wizard evocation cantrips; the selection survives a new search.
  await search.fill('');
  await page.getByLabel('Typ').selectOption('spell');
  await page.getByLabel('Grad').selectOption('0');
  await page.getByLabel('Schule').selectOption('evocation');
  await page.getByLabel('Klasse').selectOption('wizard');
  const cantrips = rows(page);
  await expect(cantrips.first()).toBeVisible();
  const count = await cantrips.count();
  expect(count).toBeGreaterThan(2);
  for (const meta of await page.locator('.catalog__meta').allTextContents()) expect(meta).toContain('Zaubertrick');
  await cantrips.nth(0).click();
  await cantrips.nth(1).click();
  await expect(page.getByTestId('catalog-add')).toHaveText('3 Karten übernehmen');

  // No deck exists yet: the cards go into a new deck.
  await expect(page.getByTestId('catalog-target')).toHaveValue('');
  await page.getByTestId('catalog-add').click();
  await expect(page.getByText(/3 Karten zu „.*“ hinzugefügt\./)).toBeVisible();
  await expect(page.locator('.card-tile')).toHaveCount(3);
  await expect(page.locator('.card-tile .otc-card__title').filter({ hasText: 'Feuerball' })).toHaveCount(1);

  // Persisted.
  await page.reload();
  await expect(page.locator('.card-tile')).toHaveCount(3);
});

test('adopt a feature and a magic item into an existing deck', async ({ page }) => {
  await page.getByRole('button', { name: 'Neues Deck' }).click();
  await page.getByRole('button', { name: 'Aus dem Katalog' }).click();
  const search = page.getByLabel('Suche nach Name (Deutsch oder Englisch)');

  await search.fill('Handauflegen');
  await rows(page).first().click();
  // Class features keep only their rules text (no class table rows).
  const preview = page.locator('.catalog__preview .otc-card');
  await expect(preview.first()).toContainText('Heilkraft');
  await expect(preview.first()).not.toContainText('Zauberplätze pro Zaubergrad');

  await search.fill('Wand of Wonder');
  await rows(page).first().click();
  await expect(page.getByTestId('catalog-add')).toHaveText('2 Karten übernehmen');
  await page.getByTestId('catalog-add').click();

  await expect(page.locator('.card-tile')).toHaveCount(2);
  await expect(page.locator('.card-tile .otc-card__title').first()).toBeVisible();
});
