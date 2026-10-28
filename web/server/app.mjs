import { createServer } from 'node:http';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { openStore, StoreError } from './store.mjs';
import { PRODUCTS } from './catalog-seed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const nativeMedia = path.resolve(root, '../entry/src/main/resources/base/media');
const merchFiles = new Set(PRODUCTS.map(p => path.basename(p.image)));
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
const json = (res, status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
const safeEqual = (a, b) => typeof a === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(a) && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function readBody(req) {
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) throw new StoreError('JSON_REQUIRED', 415);
  let bytes = 0; const chunks = [];
  for await (const chunk of req) { bytes += chunk.length; if (bytes > 16384) throw new StoreError('BODY_TOO_LARGE', 413); chunks.push(chunk); }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data;
  } catch { throw new StoreError('INVALID_JSON'); }
}

export function createApp({ databasePath = path.join(root, '.data/store.sqlite'), encryptionKey = process.env.DATA_ENCRYPTION_KEY,
  production = process.env.NODE_ENV === 'production', publicOrigin = process.env.PUBLIC_ORIGIN } = {}) {
  if (production && (!publicOrigin || new URL(publicOrigin).protocol !== 'https:')) throw new Error('Production requires an HTTPS PUBLIC_ORIGIN.');
  const origin = publicOrigin ? new URL(publicOrigin).origin : null;
  const store = openStore(databasePath, { encryptionKey, production });
  const rate = new Map();
  function limit(key, max) {
    const now = Date.now();
    if (rate.size > 5000) for (const [key, entry] of rate) if (entry.until < now) rate.delete(key);
    const entry = rate.get(key);
    if (!entry || entry.until < now) { rate.set(key, { count: 1, until: now + 60000 }); return; }
    if (++entry.count > max) throw new StoreError('TOO_MANY_REQUESTS', 429);
  }
  const cookie = token => `natp_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? 2592000 : 0}${production ? '; Secure' : ''}`;
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; media-src 'self'; frame-src https://player.bilibili.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const url = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(url.pathname);
      if (!['GET','HEAD','POST','PATCH','DELETE'].includes(req.method)) throw new StoreError('METHOD_NOT_ALLOWED', 405);
      if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true, storage: 'sqlite', paymentMode: 'demo' });
      if (pathname.startsWith('/api/')) {
        limit(req.socket.remoteAddress || 'local', 600);
        const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('natp_session='))?.slice(13);
        let session = store.session(token);
        if (pathname === '/api/session' && req.method === 'GET') {
          if (!session) { limit(`session:${req.socket.remoteAddress}`, 30); session = store.createSession(); res.setHeader('Set-Cookie', cookie(session.token)); }
          return json(res, 200, { csrf: session.csrf, cart: store.cart(session.id), favorites: store.favorites(session.id), address: store.address(session.id), sessionDays: 30 });
        }
        if (pathname === '/api/products' && req.method === 'GET') return json(res, 200, { products: store.products() });
        if (!session) throw new StoreError('SESSION_EXPIRED', 401);
        if (!['GET','HEAD'].includes(req.method)) {
          const expectedOrigin = origin || `http://${req.headers.host}`;
          if (req.headers.origin !== expectedOrigin || req.headers['sec-fetch-site'] === 'cross-site' || !safeEqual(req.headers['x-csrf-token'], session.csrf)) throw new StoreError('FORBIDDEN', 403);
        }
        if (pathname === '/api/cart') {
          if (req.method === 'GET') return json(res, 200, { cart: store.cart(session.id) });
          if (['POST','PATCH','DELETE'].includes(req.method)) {
            const actions = { POST: 'add', PATCH: 'set', DELETE: 'delete' };
            return json(res, 200, { cart: store.changeCart(session.id, await readBody(req), actions[req.method]) });
          }
        }
        if (pathname === '/api/favorites' && req.method === 'POST') return json(res, 200, { favorites: store.setFavorite(session.id, await readBody(req)) });
        if (pathname === '/api/orders') {
          if (req.method === 'GET') return json(res, 200, { orders: store.orders(session.id) });
          if (req.method === 'POST') {
            limit(`orders:${session.id}`, 30);
            const order = store.checkout(session.id, await readBody(req), req.headers['idempotency-key']);
            return json(res, 201, { order, cart: store.cart(session.id), products: store.products() });
          }
        }
        if (pathname.startsWith('/api/orders/') && req.method === 'GET') return json(res, 200, { order: store.getOrder(session.id, pathname.slice(12)) });
        if (pathname === '/api/session' && req.method === 'DELETE') {
          store.erase(session.id); res.setHeader('Set-Cookie', cookie('')); return json(res, 200, { ok: true });
        }
        throw new StoreError('NOT_FOUND', 404);
      }
      if (!['GET','HEAD'].includes(req.method)) throw new StoreError('METHOD_NOT_ALLOWED', 405);
      if (pathname === '/shop' || pathname === '/shop/') { res.writeHead(302, { Location: '/shop.html' }); return res.end(); }
      let target;
      let base = publicRoot;
      if (pathname.startsWith('/assets/merch/')) {
        const name = pathname.slice('/assets/merch/'.length);
        if (!merchFiles.has(name)) throw new StoreError('NOT_FOUND', 404);
        base = nativeMedia; target = path.join(base, name);
      } else {
        const file = pathname === '/' ? 'index.html' : pathname.slice(1);
        if (file.split('/').some(part => part.startsWith('.')) || file.includes('\\')) throw new StoreError('NOT_FOUND', 404);
        target = path.resolve(base, file);
      }
      const resolved = await realpath(target);
      if (!resolved.startsWith(base + path.sep) || !types[path.extname(resolved)]) throw new StoreError('NOT_FOUND', 404);
      const data = await readFile(resolved);
      res.writeHead(200, { 'Content-Type': types[path.extname(resolved)], 'Content-Length': data.length, 'Cache-Control': path.extname(resolved) === '.html' ? 'no-cache' : 'public, max-age=300' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (res.writableEnded) return;
      if (error instanceof StoreError) return json(res, error.status, { error: error.code });
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error instanceof URIError) return json(res, 404, { error: 'NOT_FOUND' });
      console.error('Request failed:', error.code || error.name);
      json(res, 500, { error: 'SERVER_ERROR' });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return { server, store, async close() { server.closeIdleConnections(); await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())); store.close(); } };
}
