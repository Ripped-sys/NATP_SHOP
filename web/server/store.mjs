import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { PRODUCTS } from './catalog-seed.mjs';

export class StoreError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const fail = (code, status) => { throw new StoreError(code, status); };
const digest = value => createHash('sha256').update(value).digest('hex');
const sessionLifetime = 30 * 24 * 60 * 60 * 1000;
const canonical = lines => [...lines].sort((a, b) => `${a.id}:${a.size}`.localeCompare(`${b.id}:${b.size}`));

export function openStore(filename, { encryptionKey, production = false } = {}) {
  const directory = path.dirname(filename);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (!encryptionKey) {
    if (production) throw new Error('DATA_ENCRYPTION_KEY is required in production (64 hex characters).');
    const keyPath = path.join(directory, 'encryption.key');
    if (!existsSync(keyPath)) writeFileSync(keyPath, randomBytes(32).toString('hex'), { flag: 'wx', mode: 0o600 });
    encryptionKey = readFileSync(keyPath, 'utf8').trim();
  }
  if (!/^[0-9a-f]{64}$/i.test(encryptionKey)) throw new Error('Invalid DATA_ENCRYPTION_KEY.');
  const key = Buffer.from(encryptionKey, 'hex');
  const encrypt = value => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const bytes = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), bytes]).toString('base64');
  };
  const decrypt = value => {
    const data = Buffer.from(value, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'));
  };
  const db = new DatabaseSync(filename);
  chmodSync(filename, 0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, data TEXT NOT NULL, price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
      stock INTEGER NOT NULL CHECK(stock >= 0)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY, csrf TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cart_items (
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id), size TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 999), PRIMARY KEY(session_id, product_id, size)
    );
    CREATE TABLE IF NOT EXISTS favorites (
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id), PRIMARY KEY(session_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS addresses (
      session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE, encrypted_data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      idempotency_key TEXT NOT NULL, request_hash TEXT NOT NULL, total_cents INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status='awaiting-delivery'), payment_mode TEXT NOT NULL CHECK(payment_mode='demo'),
      shipping_encrypted TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE(session_id, idempotency_key)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, product_id TEXT NOT NULL,
      name TEXT NOT NULL, english_name TEXT NOT NULL, image TEXT NOT NULL, size TEXT NOT NULL,
      quantity INTEGER NOT NULL, unit_price_cents INTEGER NOT NULL, PRIMARY KEY(order_id, product_id, size)
    );
    CREATE INDEX IF NOT EXISTS orders_by_session ON orders(session_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    PRAGMA user_version=1;`);
  const keyCheck = db.prepare("SELECT value FROM metadata WHERE key='encryption_check'").get();
  try {
    if (keyCheck && decrypt(keyCheck.value) !== 'NATP') throw new Error('Wrong encryption key');
    if (!keyCheck) db.prepare('INSERT INTO metadata VALUES (?, ?)').run('encryption_check', encrypt('NATP'));
  } catch { db.close(); throw new Error('Database encryption key does not match. Restore the original key.'); }
  const insert = db.prepare('INSERT OR IGNORE INTO products(id,data,price_cents,stock) VALUES (?,?,?,?)');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const product of PRODUCTS) insert.run(product.id, JSON.stringify(product), Math.round(product.price * 100), product.stock);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); db.close(); throw error; }

  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  const toProduct = row => ({ ...JSON.parse(row.data), price: row.price_cents / 100, stock: row.stock });
  const products = () => db.prepare('SELECT * FROM products ORDER BY rowid').all().map(toProduct);
  function product(id) {
    if (typeof id !== 'string' || id.length > 100) fail('PRODUCT_NOT_FOUND', 404);
    const row = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!row) fail('PRODUCT_NOT_FOUND', 404);
    return toProduct(row);
  }
  function line(value) {
    if (!value || typeof value !== 'object' || !Number.isInteger(value.quantity) || value.quantity < 1 || value.quantity > 999) fail('INVALID_QUANTITY');
    const p = product(value.id);
    if (!(p.sizes.length ? p.sizes : ['ONE SIZE']).includes(value.size)) fail('INVALID_SIZE');
    return { id: p.id, size: value.size, quantity: value.quantity };
  }
  function address(value) {
    if (!value || typeof value !== 'object' || ['receiver','phone','address'].some(k => typeof value[k] !== 'string')) fail('INVALID_ADDRESS');
    const result = { receiver: value.receiver.trim(), phone: value.phone.trim(), address: value.address.trim() };
    if (!result.receiver || result.receiver.length > 40 || !/^1[3-9]\d{9}$/.test(result.phone) || result.address.length < 5 || result.address.length > 200) fail('INVALID_ADDRESS');
    return result;
  }
  function requireStock(lines) {
    const quantities = new Map();
    for (const item of lines) quantities.set(item.id, (quantities.get(item.id) || 0) + item.quantity);
    for (const [id, quantity] of quantities) if (product(id).stock < quantity) fail('OUT_OF_STOCK', 409);
    return quantities;
  }
  const cart = session => db.prepare('SELECT product_id AS id, size, quantity FROM cart_items WHERE session_id=? ORDER BY rowid').all(session);
  const favorites = session => db.prepare('SELECT product_id FROM favorites WHERE session_id=? ORDER BY rowid').all(session).map(row => row.product_id);
  function getOrder(session, id) {
    const row = db.prepare('SELECT * FROM orders WHERE session_id=? AND id=?').get(session, id);
    if (!row) fail('ORDER_NOT_FOUND', 404);
    return { id: row.id, total: row.total_cents, status: row.status, paymentMode: row.payment_mode, createdAt: row.created_at,
      items: db.prepare('SELECT product_id AS id,name,english_name AS englishName,image,size,quantity,unit_price_cents AS unitPrice FROM order_items WHERE order_id=? ORDER BY rowid').all(id),
      shipping: decrypt(row.shipping_encrypted) };
  }
  function checkout(session, body, idempotencyKey) {
    if (!body || !['cart', 'direct'].includes(body.mode) || !Array.isArray(body.items) || !body.items.length || body.items.length > 100) fail('INVALID_ORDER');
    if (typeof idempotencyKey !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(idempotencyKey)) fail('INVALID_IDEMPOTENCY_KEY');
    const shipping = address(body.shipping);
    const items = canonical(body.items.map(line));
    if (new Set(items.map(item => `${item.id}:${item.size}`)).size !== items.length) fail('INVALID_ORDER');
    if (body.mode === 'direct' && items.length !== 1) fail('INVALID_ORDER');
    if (!Number.isSafeInteger(body.expectedTotal) || body.expectedTotal < 0) fail('INVALID_TOTAL');
    const requestHash = digest(JSON.stringify({ mode: body.mode, items, shipping, total: body.expectedTotal }));
    return transaction(() => {
      const existing = db.prepare('SELECT id,request_hash FROM orders WHERE session_id=? AND idempotency_key=?').get(session, idempotencyKey);
      if (existing) {
        if (existing.request_hash !== requestHash) fail('IDEMPOTENCY_CONFLICT', 409);
        return getOrder(session, existing.id);
      }
      if (body.mode === 'cart' && JSON.stringify(canonical(cart(session))) !== JSON.stringify(items)) fail('CART_CHANGED', 409);
      const quantities = requireStock(items);
      const total = items.reduce((sum, item) => sum + Math.round(product(item.id).price * 100) * item.quantity, 0);
      if (total !== body.expectedTotal) fail('PRICE_CHANGED', 409);
      const id = `NATP-${randomUUID()}`;
      const encrypted = encrypt(shipping);
      db.prepare('INSERT INTO orders VALUES (?,?,?,?,?,?,?,?,?)').run(id, session, idempotencyKey, requestHash, total, 'awaiting-delivery', 'demo', encrypted, Date.now());
      // Order snapshots remain accurate if product names or prices change later.
      for (const item of items) {
        const p = product(item.id);
        db.prepare('INSERT INTO order_items VALUES (?,?,?,?,?,?,?,?)').run(id, p.id, p.name, p.englishName, p.image, item.size, item.quantity, Math.round(p.price * 100));
      }
      for (const [id, quantity] of quantities) db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(quantity, id);
      db.prepare('INSERT INTO addresses VALUES (?,?) ON CONFLICT(session_id) DO UPDATE SET encrypted_data=excluded.encrypted_data').run(session, encrypted);
      if (body.mode === 'cart') db.prepare('DELETE FROM cart_items WHERE session_id=?').run(session);
      return getOrder(session, id);
    });
  }
  return {
    products, cart, favorites, checkout, getOrder,
    session(token) {
      if (typeof token !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(token)) return null;
      return db.prepare('SELECT id,csrf FROM sessions WHERE id=? AND expires_at>?').get(digest(token), Date.now()) || null;
    },
    createSession() {
      db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
      const token = randomBytes(32).toString('base64url');
      const id = digest(token), csrf = randomBytes(32).toString('base64url');
      db.prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(id, csrf, Date.now(), Date.now() + sessionLifetime);
      return { token, id, csrf };
    },
    changeCart(session, data, action) {
      return transaction(() => {
        if (action === 'delete') {
          if (typeof data?.id !== 'string' || typeof data?.size !== 'string') fail('INVALID_ITEM');
          db.prepare('DELETE FROM cart_items WHERE session_id=? AND product_id=? AND size=?').run(session, data.id, data.size);
          return cart(session);
        }
        const item = line(data);
        const current = cart(session);
        const previous = current.find(row => row.id === item.id && row.size === item.size);
        if (action === 'add') item.quantity += previous?.quantity || 0;
        if (item.quantity > 999) fail('INVALID_QUANTITY');
        const next = [...current.filter(row => row.id !== item.id || row.size !== item.size), item];
        requireStock(next.filter(row => row.id === item.id));
        db.prepare('INSERT INTO cart_items VALUES (?,?,?,?) ON CONFLICT(session_id,product_id,size) DO UPDATE SET quantity=excluded.quantity').run(session, item.id, item.size, item.quantity);
        return cart(session);
      });
    },
    setFavorite(session, data) {
      product(data?.id);
      if (typeof data.saved !== 'boolean') fail('INVALID_FAVORITE');
      if (data.saved) db.prepare('INSERT OR IGNORE INTO favorites VALUES (?,?)').run(session, data.id);
      else db.prepare('DELETE FROM favorites WHERE session_id=? AND product_id=?').run(session, data.id);
      return favorites(session);
    },
    orders(session) { return db.prepare('SELECT id FROM orders WHERE session_id=? ORDER BY created_at DESC LIMIT 100').all(session).map(row => getOrder(session, row.id)); },
    address(session) { const row = db.prepare('SELECT encrypted_data FROM addresses WHERE session_id=?').get(session); return row ? decrypt(row.encrypted_data) : null; },
    erase(session) { db.prepare('DELETE FROM sessions WHERE id=?').run(session); },
    close() { db.close(); }
  };
}
