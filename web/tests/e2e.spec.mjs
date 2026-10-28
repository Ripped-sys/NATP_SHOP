import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.mjs';

let app, directory, databasePath, base, port;
test.beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'natp-browser-'));
  databasePath = path.join(directory, 'store.sqlite');
  app = createApp({ databasePath });
  await new Promise(resolve => app.server.listen(0,'127.0.0.1',resolve));
  port = app.server.address().port; base = `http://127.0.0.1:${port}`;
});
test.afterEach(async () => { await app.close(); await rm(directory,{ recursive:true,force:true }); });
function inspect(fn) { const db = new DatabaseSync(databasePath,{ readOnly:true }); try { return fn(db); } finally { db.close(); } }
async function ready(page) { await expect(page.locator('#connection')).toBeHidden(); await expect(page.locator('.product-card')).toHaveCount(17); }
async function fillAddress(page) {
  await page.locator('[name="receiver"]').fill('E2E Demo');
  await page.locator('[name="phone"]').fill('13800000000');
  await page.locator('[name="address"]').fill('Demo address 123, no delivery');
}
async function openProduct(page,id) { await page.locator(`[data-product="${id}"]`).first().click(); await expect(page.locator('#store-dialog')).toBeVisible(); }

test('desktop: band homepage to database checkout, reload, restart and visitor isolation', async ({page,browser},info) => {
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'/');
  await page.getByRole('link',{name:'Merch / 周边',exact:true}).click();
  await ready(page);
  await page.screenshot({path:info.outputPath('store-desktop.png')});
  await page.locator('[data-category="POSTERS"]').click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.locator('[data-category="CLOTHING"]').click();
  await page.locator('[data-favorite="natp-live-hoodie"]').click();
  await expect(page.locator('[data-favorite="natp-live-hoodie"]')).toHaveAttribute('aria-pressed','true');
  await openProduct(page,'natp-live-hoodie');
  await page.locator('#detail-size').selectOption('XL');
  await page.locator('#detail-quantity').fill('41');
  await page.locator('[data-action="add"]').click();
  await expect(page.locator('#detail-error')).toContainText('库存不足');
  await page.locator('#detail-quantity').fill('2');
  await page.locator('[data-action="add"]').click();
  await expect(page.locator('#cart-count')).toHaveText('2');
  await page.reload(); await ready(page);
  await expect(page.locator('#cart-count')).toHaveText('2');
  await expect(page.locator('[data-favorite="natp-live-hoodie"]')).toHaveAttribute('aria-pressed','true');
  await page.locator('#open-cart').click();
  await page.locator('[data-action="plus"]').click();
  await expect(page.locator('.cart-total')).toContainText('777.00');
  await page.locator('[data-action="minus"]').click();
  await expect(page.locator('.cart-total')).toContainText('518.00');
  await page.locator('[data-action="checkout"]').click();
  await page.locator('[type="submit"]').click();
  await expect(page.locator('#checkout-form')).toBeVisible();
  expect(inspect(db=>db.prepare('SELECT count(*) n FROM orders').get().n)).toBe(0);
  await fillAddress(page);
  await page.locator('[name="phone"]').fill('123');
  await page.locator('[type="submit"]').click();
  await expect(page.locator('#checkout-form')).toBeVisible();
  await page.locator('[name="phone"]').fill('13800000000');
  await page.locator('[type="submit"]').click();
  await expect(page.locator('#dialog-title')).toHaveText('模拟付款成功');
  await expect(page.locator('.order-status')).toHaveText('待收货');
  await expect(page.locator('#cart-count')).toHaveText('0');
  await page.screenshot({path:info.outputPath('payment-success.png')});
  const order=inspect(db=>db.prepare('SELECT id,total_cents,payment_mode,shipping_encrypted FROM orders').get());
  expect(order.total_cents).toBe(51800); expect(order.payment_mode).toBe('demo');
  expect(order.shipping_encrypted).not.toContain('Demo address');
  expect(inspect(db=>db.prepare('SELECT stock FROM products WHERE id=?').get('natp-live-hoodie').stock)).toBe(38);
  await page.reload(); await ready(page);
  await page.locator('#open-orders').click(); await expect(page.locator('.order-row')).toHaveCount(1);
  await expect(page.locator('.order-row')).toContainText(order.id);
  await app.close(); app=createApp({databasePath}); await new Promise(resolve=>app.server.listen(port,'127.0.0.1',resolve));
  await page.reload(); await ready(page); await page.locator('#open-orders').click();
  await expect(page.locator('.order-row')).toContainText(order.id);
  await expect(page.locator('.order-row')).toContainText('Demo address');
  await page.screenshot({path:info.outputPath('persisted-order.png')});
  const other=await browser.newContext();
  const otherPage=await other.newPage(); await otherPage.goto(base+'/shop.html'); await ready(otherPage);
  await otherPage.locator('#open-orders').click(); await expect(otherPage.locator('.order-row')).toHaveCount(0);
  await other.close();
  expect(errors).toEqual([]);
});

test('mobile: English direct purchase retains cart, saved address and guest erasure', async ({page},info) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto(base+'/'); await page.locator('[data-nav-toggle]').click();
  await page.getByRole('link',{name:'Merch / 周边',exact:true}).click(); await ready(page);
  await page.locator('#language').click(); await expect(page.locator('html')).toHaveAttribute('lang','en');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('store-mobile.png')});
  await openProduct(page,'na+tp-phone-case'); await expect(page.locator('[data-action="buy"]')).toBeDisabled(); await page.keyboard.press('Escape');
  await openProduct(page,'natp-logo-sticker'); await page.locator('[data-action="add"]').click();
  await expect(page.locator('#cart-count')).toHaveText('1');
  await openProduct(page,'natp-live-album'); await page.locator('[data-action="buy"]').click();
  await fillAddress(page); await page.locator('[type="submit"]').click();
  await expect(page.locator('#dialog-title')).toHaveText('DEMO PAYMENT SUCCESSFUL');
  await expect(page.locator('#cart-count')).toHaveText('1');
  await page.reload(); await ready(page);
  await openProduct(page,'natp-live-album'); await page.locator('[data-action="buy"]').click();
  await expect(page.locator('[name="receiver"]')).toHaveValue('E2E Demo');
  await page.keyboard.press('Escape'); await page.locator('#open-cart').click();
  await page.locator('[data-action="remove"]').click(); await expect(page.locator('.empty')).toContainText('Your cart is empty');
  await page.keyboard.press('Escape'); await page.locator('#open-orders').click();
  page.once('dialog',dialog=>dialog.accept()); await page.locator('[data-action="erase"]').click();
  await expect(page.locator('#store-dialog')).not.toBeVisible();
  await page.locator('#open-orders').click(); await expect(page.locator('.order-row')).toHaveCount(0);
  expect(inspect(db=>db.prepare('SELECT count(*) n FROM addresses').get().n)).toBe(0);
});

test('lost payment response retries the same order instead of charging/decrementing twice', async ({page}) => {
  await page.goto(base+'/shop.html'); await ready(page);
  await openProduct(page,'natp-live-album'); await page.locator('[data-action="buy"]').click(); await fillAddress(page);
  await page.route('**/api/orders',async route=>{ const response=await route.fetch(); expect(response.status()).toBe(201); await route.abort('failed'); },{times:1});
  await page.locator('[type="submit"]').click(); await expect(page.locator('#checkout-error')).toContainText('连接失败');
  expect(inspect(db=>db.prepare('SELECT count(*) n FROM orders').get().n)).toBe(1);
  await page.locator('[type="submit"]').click(); await expect(page.locator('#dialog-title')).toHaveText('模拟付款成功');
  expect(inspect(db=>db.prepare('SELECT count(*) n FROM orders').get().n)).toBe(1);
  expect(inspect(db=>db.prepare('SELECT stock FROM products WHERE id=?').get('natp-live-album').stock)).toBe(49);
});

test('backend outage shows a real error and reconnects without fake local orders', async ({page}) => {
  await page.route('**/api/products',route=>route.abort());
  await page.goto(base+'/shop.html'); await expect(page.locator('#connection-message')).toContainText('商店服务未连接');
  await expect(page.locator('#open-cart')).toBeDisabled();
  expect(inspect(db=>db.prepare('SELECT count(*) n FROM orders').get().n)).toBe(0);
  await page.unroute('**/api/products'); await page.locator('#retry-connection').click(); await ready(page);
  await expect(page.locator('#open-cart')).toBeEnabled();
});
