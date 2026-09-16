const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.env.NATP_TYPESCRIPT_PATH ||
  'C:/Program Files/Huawei/DevEco Studio/sdk/default/openharmony/ets/build-tools/ets-loader/node_modules/typescript');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'entry/src/main/ets/model/StoreState.ets'), 'utf8')
  .replace(/^@Observed\s*$/gm, '');
const code = ts.transpileModule(source, {
  fileName: 'StoreState.ts',
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const exported = {};
vm.runInNewContext(code, {
  exports: exported,
  require(name) {
    if (name === '../data/MockProducts') { return { MOCK_PRODUCTS: [] }; }
    throw new Error('Unexpected import: ' + name);
  }
});
const { StoreState } = exported;
function store() {
  const state = new StoreState();
  state.login('Test');
  state.products = [{ id: 'test-only', name: '仅测试', englishName: 'Test', price: 0.1,
    originalPrice: 0.1, image: '', category: 'CLOTHING', description: '', sizes: ['S', 'M'],
    stock: 5, isLimited: false, isNew: false }];
  return state;
}
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS ' + name); }
test('empty catalog, cart and order stay empty', () => {
  const s = new StoreState();
  assert.equal(s.products.length, 0);
  assert.equal(s.total(), 0);
  assert.equal(s.checkout(), false);
});
test('missing products, invalid sizes and quantities cannot enter cart', () => {
  const s = store();
  assert.equal(s.addCart('missing', 'S', 1), false);
  assert.equal(s.addCart('test-only', 'XL', 1), false);
  for (const n of [0, -1, 0.5, NaN, Infinity, 6]) {
    assert.equal(s.addCart('test-only', 'S', n), false);
  }
});
test('same size merges; different sizes stay separate', () => {
  const s = store();
  s.addCart('test-only', 'S', 1);
  s.addCart('test-only', 'S', 1);
  s.addCart('test-only', 'M', 1);
  assert.equal(s.cart.length, 2);
  assert.equal(s.cartCount(), 3);
  assert.equal(s.total(), 0.3);
});
test('stock limit applies across all sizes', () => {
  const s = store();
  s.addCart('test-only', 'S', 3);
  assert.equal(s.addCart('test-only', 'M', 3), false);
  assert.equal(s.addCart('test-only', 'M', 2), true);
});
test('quantity cannot drop below one or exceed stock', () => {
  const s = store();
  s.addCart('test-only', 'S', 1);
  s.changeQuantity('test-only', 'S', -1);
  assert.equal(s.cartCount(), 1);
  s.changeQuantity('test-only', 'S', 4);
  s.changeQuantity('test-only', 'S', 1);
  assert.equal(s.cartCount(), 5);
  s.removeCart('test-only', 'S');
  assert.equal(s.cartCount(), 0);
});
test('favorite toggles and rejects nonexistent products', () => {
  const s = store();
  s.toggleFavorite('missing');
  assert.equal(s.favorites.length, 0);
  s.toggleFavorite('test-only');
  assert.equal(s.favorites.length, 1);
  s.toggleFavorite('test-only');
  assert.equal(s.favorites.length, 0);
});
test('checkout requires address and creates awaiting-delivery order once', () => {
  const s = store();
  s.addCart('test-only', 'S', 2);
  assert.equal(s.checkout(), false);
  s.address = '测试收货地址';
  assert.equal(s.checkout(), true);
  assert.equal(s.orders[0].status, '待收货');
  assert.equal(s.orders[0].total, 0.2);
  assert.equal(s.cartCount(), 0);
  assert.equal(s.checkout(), false);
});
test('buy now only checks out selected item and retains existing cart', () => {
  const s = store();
  s.addCart('test-only', 'S', 2);
  assert.equal(s.prepareBuy('test-only', 'M', 1), true);
  assert.equal(s.checkoutCount(), 1);
  assert.equal(s.checkoutTotal(), 0.1);
  s.address = '测试收货地址';
  assert.equal(s.checkout(), true);
  assert.equal(s.orders[0].count, 1);
  assert.equal(s.cartCount(), 2);
  assert.equal(s.directBuy, undefined);
});
test('stock changed before checkout is rechecked across sizes', () => {
  const s = store();
  s.addCart('test-only', 'S', 2);
  s.addCart('test-only', 'M', 2);
  s.products[0].stock = 3;
  s.address = '测试收货地址';
  assert.equal(s.checkout(), false);
  assert.equal(s.cartCount(), 4);
});
test('logout clears private session data and disables purchases', () => {
  const s = store();
  s.addCart('test-only', 'S', 1);
  s.toggleFavorite('test-only');
  s.address = '测试收货地址';
  s.checkout();
  s.prepareBuy('test-only', 'M', 1);
  s.logout();
  assert.equal(s.loggedIn, false);
  assert.equal(s.username, '');
  assert.equal(s.orders.length, 0);
  assert.equal(s.favorites.length, 0);
  assert.equal(s.address, '');
  assert.equal(s.directBuy, undefined);
  assert.equal(s.addCart('test-only', 'S', 1), false);
  assert.equal(s.prepareBuy('test-only', 'M', 1), false);
});
console.log('All ' + passed + ' store checks passed. UI and ArkUI reactivity require device verification.');
