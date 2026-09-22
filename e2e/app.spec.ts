import {expect, test} from '@playwright/test';

test.describe('Lista de Compras', () => {
  test.beforeEach(async ({page}) => {
    await page.goto('/shopping');
    await page.evaluate(() => indexedDB.deleteDatabase('shopping'));
    await page.reload();
  });

  test('cria lista, adiciona item, marca e exporta', async ({page}) => {
    await page.getByRole('button', {name: /adicionar compras/i}).click();
    await page.getByLabel('Nome').fill('Feira Semanal');
    await page.getByRole('button', {name: 'Salvar'}).click();

    await expect(page.getByText('Feira Semanal')).toBeVisible();

    await page.getByRole('link', {name: /ver itens de feira semanal/i}).click();
    await page.getByRole('button', {name: /adicionar item/i}).click();

    await page.getByLabel('Nome do item').fill('Arroz');
    await page.getByLabel('Valor (R$)').fill('25,00');
    await page.getByRole('button', {name: 'Salvar'}).click();

    await expect(page.getByText('Arroz')).toBeVisible();

    await page.getByRole('button', {name: /marcar arroz/i}).click();
    await expect(page.getByText('1/1')).toBeVisible();

    await page.getByRole('button', {name: 'Exportar'}).click();
  });

  test('duplica lista', async ({page}) => {
    await page.getByRole('button', {name: /adicionar compras/i}).click();
    await page.getByLabel('Nome').fill('Original');
    await page.getByRole('button', {name: 'Salvar'}).click();

    await page.getByRole('button', {name: 'Duplicar lista'}).click();
    await expect(page.getByText('Lista duplicada.')).toBeVisible();
    await expect(page.getByText('Original (cópia)')).toBeVisible();
  });

  test('modo compra marca item', async ({page}) => {
    await page.getByRole('button', {name: /adicionar compras/i}).click();
    await page.getByLabel('Nome').fill('Mercado');
    await page.getByRole('button', {name: 'Salvar'}).click();

    await page.getByRole('link', {name: /ver itens de mercado/i}).click();
    await page.getByRole('button', {name: /adicionar item/i}).click();
    await page.getByLabel('Nome do item').fill('Leite');
    await page.getByLabel('Valor (R$)').fill('5,00');
    await page.getByRole('button', {name: 'Salvar'}).click();

    await page.getByRole('button', {name: 'Modo compra'}).click();
    await page.getByRole('button', {name: /marcar leite/i}).click();
    await expect(page.getByText('Compra concluída!')).toBeVisible();
  });
});
