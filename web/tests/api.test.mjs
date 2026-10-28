import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../server/app.mjs';

const hoodie = { id: 'natp-live-hoodie', size: 'L', quantity: 2 };
const shipping = { receiver: 'Demo Tester', phone: '13800000000', address: 'Demo street 123, no shipping' };
async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'natp-api-'));
  const databasePath = path.join(directory, 'store.sqlite');
  let app = createApp({ databasePath });
  async function start() { await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); }
  await start();
  t.after(async () => { await app.close(); await rm(directory, { recursive: true, force: true }); });
  const base = () => `http://127.0.0.1:${app.server.address().port}`;
  async function guest() {
    const response = await fetch(base() + '/api/session');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
    return { cookie: response.headers.get('set-cookie').split(';')[0], ...(await response.json()) };
  }
  async function request(user, route, method = 'GET', body, extra = {}) {
    const response = await fetch(base() + route, { method, headers: { ...(user ? { Cookie: user.cookie, 'X-CSRF-Token': user.csrf } : {}), Origin: base(), 'Content-Type': 'application/json', ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, body: await response.json() };
  }
  return { guest, request, databasePath, base,
    async restart() { await app.close(); app = createApp({ databasePath }); await start(); },
    inspect(fn) { const db = new DatabaseSync(databasePath, { readOnly: true }); try { return fn(db); } finally { db.close(); } }
  };
}
const pay = (items = [hoodie], mode = 'cart') => ({ items, mode, shipping, expectedTotal: 25900 * items.reduce((n, item) => n + item.quantity, 0) });

test('catalog, assets and persistence of cart/favorites across server restart', async t => {
  const f = await fixture(t), a = await f.guest();
  const catalog = await f.request(a, '/api/products');
  assert.equal(catalog.body.products.length, 17);
  for (const p of catalog.body.products) assert.equal((await fetch(f.base() + '/' + p.image.slice(2))).status, 200);
  assert.equal((await f.request(a, '/api/cart','POST',hoodie)).status, 200);
  await f.request(a, '/api/favorites','POST',{ id: hoodie.id, saved: true });
  await f.restart();
  const session = await f.request(a, '/api/session');
  assert.deepEqual(session.body.cart, [hoodie]);
  assert.deepEqual(session.body.favorites, [hoodie.id]);
});
test('reject invalid quantities, variants, sold-out products and stock across sizes', async t => {
  const f = await fixture(t), a = await f.guest();
  for (const quantity of [0, -1, .5, 1000]) assert.equal((await f.request(a,'/api/cart','POST',{ ...hoodie, quantity })).status, 400);
  assert.equal((await f.request(a,'/api/cart','POST',{ ...hoodie, size: 'BAD' })).status, 400);
  assert.equal((await f.request(a,'/api/cart','POST',{ id: 'na+tp-phone-case', size: 'ONE SIZE', quantity: 1 })).status, 409);
  assert.equal((await f.request(a,'/api/cart','POST',{ ...hoodie, quantity: 30 })).status, 200);
  assert.equal((await f.request(a,'/api/cart','POST',{ ...hoodie, size: 'S', quantity: 11 })).status, 409);
  assert.equal((await f.request(a,'/api/cart')).body.cart[0].quantity, 30);
});
test('checkout stores encrypted shipping, snapshots, stock and idempotency atomically', async t => {
  const f = await fixture(t), a = await f.guest(), key = randomUUID();
  await f.request(a,'/api/cart','POST',hoodie);
  const first = await f.request(a,'/api/orders','POST',pay(),{ 'Idempotency-Key': key });
  assert.equal(first.status, 201);
  assert.equal(first.body.order.total, 51800);
  assert.equal(first.body.order.status, 'awaiting-delivery');
  assert.equal(first.body.order.paymentMode, 'demo');
  assert.deepEqual(first.body.order.shipping, shipping);
  const again = await f.request(a,'/api/orders','POST',pay(),{ 'Idempotency-Key': key });
  assert.equal(again.body.order.id, first.body.order.id);
  assert.equal((await f.request(a,'/api/orders','POST',{ ...pay(), expectedTotal: 1 },{ 'Idempotency-Key': key })).status, 409);
  assert.equal((await f.request(a,'/api/cart')).body.cart.length, 0);
  f.inspect(db => {
    assert.equal(db.prepare('SELECT count(*) n FROM orders').get().n, 1);
    assert.equal(db.prepare('SELECT stock FROM products WHERE id=?').get(hoodie.id).stock, 38);
    assert.equal(db.prepare('SELECT shipping_encrypted FROM orders').get().shipping_encrypted.includes(shipping.address), false);
    assert.equal(db.prepare('SELECT encrypted_data FROM addresses').get().encrypted_data.includes(shipping.phone), false);
    assert.equal(db.prepare('SELECT unit_price_cents FROM order_items').get().unit_price_cents, 25900);
  });
  await f.restart();
  const orders = (await f.request(a,'/api/orders')).body.orders;
  assert.equal(orders.length, 1); assert.equal(orders[0].id, first.body.order.id);
  assert.deepEqual((await f.request(a,'/api/session')).body.address, shipping);
  assert.equal((await f.request(a,'/api/products')).body.products.find(p => p.id === hoodie.id).stock, 38);
});
test('invalid address, changed cart and client price spoofing cannot create orders', async t => {
  const f = await fixture(t), a = await f.guest();
  await f.request(a,'/api/cart','POST',hoodie);
  const post = body => f.request(a,'/api/orders','POST',body,{ 'Idempotency-Key': randomUUID() });
  assert.equal((await post({ ...pay(), shipping: { ...shipping, phone: 'bad' } })).status, 400);
  assert.equal((await post({ ...pay(), expectedTotal: 1, total: 1 })).body.error, 'PRICE_CHANGED');
  assert.equal((await post(pay([{ ...hoodie, quantity: 1 }]))).body.error, 'CART_CHANGED');
  assert.equal((await f.request(a,'/api/orders')).body.orders.length, 0);
  assert.deepEqual((await f.request(a,'/api/cart')).body.cart, [hoodie]);
});
test('direct purchase retains cart and different guests cannot read orders', async t => {
  const f = await fixture(t), a = await f.guest(), b = await f.guest();
  await f.request(a,'/api/cart','POST',hoodie);
  const result = await f.request(a,'/api/orders','POST',pay([{ ...hoodie, quantity: 1 }],'direct'),{ 'Idempotency-Key': randomUUID() });
  assert.equal(result.status, 201);
  assert.deepEqual(result.body.cart, [hoodie]);
  assert.equal((await f.request(b,'/api/orders')).body.orders.length, 0);
  assert.equal((await f.request(b,'/api/orders/' + result.body.order.id)).status, 404);
  assert.equal((await f.request(null,'/api/orders')).status, 401);
});
test('simultaneous buyers cannot oversell the last stock', async t => {
  const f = await fixture(t), a = await f.guest(), b = await f.guest();
  const body = pay([{ ...hoodie, quantity: 40 }], 'direct');
  const results = await Promise.all([a,b].map(user => f.request(user,'/api/orders','POST',body,{ 'Idempotency-Key': randomUUID() })));
  assert.deepEqual(results.map(r => r.status).sort(), [201,409]);
  f.inspect(db => { assert.equal(db.prepare('SELECT stock FROM products WHERE id=?').get(hoodie.id).stock, 0); assert.equal(db.prepare('SELECT count(*) n FROM orders').get().n, 1); });
});
test('CSRF, origins, injection, static path safety and data erasure', async t => {
  const f = await fixture(t), a = await f.guest();
  assert.equal((await f.request(a,'/api/cart','POST',hoodie,{ 'X-CSRF-Token': '' })).status, 403);
  assert.equal((await f.request(a,'/api/cart','POST',hoodie,{ Origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await f.request(a,'/api/cart','POST',{ ...hoodie, id: "' OR 1=1--" })).status, 404);
  for (const route of ['/server/store.mjs','/.data/store.sqlite','/assets/merch/../../.env','/%2e%2e/server/app.mjs','/assets/merch/unknown.png']) assert.equal((await fetch(f.base()+route)).status,404);
  await f.request(a,'/api/cart','POST',hoodie);
  await f.request(a,'/api/orders','POST',pay(),{ 'Idempotency-Key': randomUUID() });
  assert.equal((await f.request(a,'/api/session','DELETE',{})).status, 200);
  assert.equal((await f.request(a,'/api/orders')).status, 401);
  f.inspect(db => {
    for (const table of ['orders','order_items','addresses','cart_items','sessions']) assert.equal(db.prepare(`SELECT count(*) n FROM ${table}`).get().n,0);
  });
});
