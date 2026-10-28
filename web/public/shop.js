let PRODUCTS = [];
const productById = id => PRODUCTS.find(product => product.id === id);
const variants = product => product.sizes.length ? product.sizes : ['ONE SIZE'];
const itemCount = lines => lines.reduce((sum, line) => sum + line.quantity, 0);
const totalCents = lines => lines.reduce((sum, line) => sum + Math.round(productById(line.id).price * 100) * line.quantity, 0);
const addressValid = value => value.receiver.trim() && /^1[3-9]\d{9}$/.test(value.phone.trim()) && value.address.trim().length >= 5;

const copy = {
  website: ['乐队官网 ↗', 'BAND WEBSITE ↗'], orders: ['我的订单', 'ORDERS'], cart: ['购物车', 'CART'],
  slogan: ['穿透全世界，把现场穿在身上。', 'BREAK THROUGH THE WORLD. WEAR THE LIVE ENERGY.'],
  shop: ['探索周边 →', 'SHOP THE COLLECTION →'],
  demo: ['数据库版商店 · 商品、购物车和订单由服务器保存。当前为模拟付款，不扣款、不发货，请使用演示收货信息。', 'DATABASE STORE · Server-saved products, carts and orders. Demo payment only: no charges or shipping. Use demo shipping details.'],
  favorites: ['只看收藏', 'FAVORITES'], stageTitle: ['不是背景音乐。是一种态度。', 'NOT BACKGROUND MUSIC. A WAY OF LIFE.'],
  stageCopy: ['用吉他啸叫掀翻屋顶，用鼓点砸碎沉闷。', 'Guitars tear the roof off. Drums break the silence.'], about: ['关于 NATP →', 'ABOUT NATP →'],
  ALL: ['全部', 'ALL'], CLOTHING: ['服饰', 'CLOTHING'], MUSIC: ['音乐', 'MUSIC'], GEAR: ['吉他周边', 'GEAR'], ACCESSORIES: ['生活配件', 'ACCESSORIES'], POSTERS: ['海报', 'POSTERS'], LIMITED: ['限定', 'LIMITED'],
  items: ['件周边', 'ITEMS'], new: ['新品', 'NEW'], limited: ['限定', 'LIMITED'], soldout: ['暂不可售', 'UNAVAILABLE'],
  favorite: ['收藏', 'Favorite'], unfavorite: ['取消收藏', 'Remove favorite'], emptyFavorites: ['还没有收藏，去看看喜欢的周边吧。', 'No favorites yet. Find something you love.'],
  size: ['尺码 / 规格', 'SIZE / VARIANT'], quantity: ['数量', 'QUANTITY'], oneSize: ['均码 / 标准款', 'ONE SIZE / STANDARD'],
  add: ['加入购物车', 'ADD TO CART'], buy: ['立即购买', 'BUY NOW'], added: ['已加入购物车', 'ADDED TO CART'],
  stockError: ['数量无效或已超过演示库存', 'Invalid quantity or demo stock limit reached.'],
  unavailable: ['适配机型待确认，暂不接受购买。', 'Device compatibility is unconfirmed. Currently unavailable.'],
  emptyCart: ['购物车还是空的。把喜欢的声音带回家。', 'Your cart is empty. Take the noise home.'],
  total: ['合计', 'TOTAL'], remove: ['删除', 'REMOVE'], checkout: ['去结算 →', 'CHECKOUT →'], keepShopping: ['继续逛逛', 'KEEP SHOPPING'],
  checkoutTitle: ['确认订单', 'CHECKOUT'], receiver: ['收件人（演示）', 'RECIPIENT (DEMO)'], phone: ['手机号（演示）', 'PHONE (DEMO)'], address: ['收货地址（演示）', 'ADDRESS (DEMO)'],
  pay: ['模拟付款 →', 'PAY (DEMO) →'], back: ['← 返回', '← BACK'], addressError: ['请填写收件人、有效的中国大陆手机号和至少 5 个字符的地址。', 'Enter a recipient, valid mainland China mobile number and address (at least 5 characters).'],
  paid: ['模拟付款成功', 'DEMO PAYMENT SUCCESSFUL'], awaiting: ['待收货', 'AWAITING DELIVERY'],
  paidNote: ['未扣款，也不会发货。订单已存入数据库，刷新或重启服务后仍可查询。当前浏览器的访客会话有效期 30 天；清除 Cookie 后无法找回。', 'No charge or shipping. Database orders survive reloads and server restarts. Access uses this browser’s 30-day guest session; clearing cookies loses access.'],
  viewOrders: ['查看订单 →', 'VIEW ORDERS →'], noOrders: ['暂无订单，购买后可在此查看已保存的订单。', 'No orders yet. Saved orders will appear here.'],
  storageError: ['浏览器无法保存购物车；本次仍可购物，刷新后可能丢失。', 'Browser storage unavailable. You can shop, but changes may be lost on reload.'],
  loading: ['正在连接商店数据库…', 'CONNECTING TO THE STORE…'], retry: ['重新连接', 'RECONNECT'],
  offline: ['商店服务未连接，请启动后端后重试。不会创建本地假订单。', 'Store service unavailable. Start the backend and retry. No local fake orders will be created.'],
  privacy: ['提交后收货信息将加密存入服务器数据库。请使用演示信息，可在我的订单中删除当前访客数据。', 'Shipping details will be encrypted in the server database. Use demo details; erase guest data from Orders.'],
  erase: ['删除我的访客数据', 'ERASE MY GUEST DATA'], eraseConfirm: ['确定删除本访客的全部订单、地址、收藏和购物车？不可撤销。', 'Delete all orders, address, favorites and cart for this guest? This cannot be undone.'],
  erased: ['访客数据已删除', 'GUEST DATA ERASED'],
  INVALID_QUANTITY: ['数量无效', 'Invalid quantity.'], INVALID_SIZE: ['请选择有效尺码', 'Choose a valid size.'],
  OUT_OF_STOCK: ['库存不足，请减少数量或重新选择商品。', 'Not enough stock. Reduce quantity or choose another item.'],
  CART_CHANGED: ['购物车已变化，请返回购物车重新结算。', 'Cart changed. Return to the cart and check out again.'],
  PRICE_CHANGED: ['价格已变化，请返回商品页重新确认。', 'Price changed. Review the product and check out again.'],
  INVALID_ADDRESS: ['收货信息不完整或格式不正确', 'Invalid shipping details.'],
  IDEMPOTENCY_CONFLICT: ['此请求已处理，请先查看订单。', 'This request was already processed. Check Orders first.'],
  SESSION_EXPIRED: ['会话已过期，请刷新页面。', 'Session expired. Reload this page.'],
  FORBIDDEN: ['安全校验失败，请刷新页面。', 'Security check failed. Reload this page.'],
  TOO_MANY_REQUESTS: ['操作过于频繁，请稍后重试。', 'Too many requests. Please retry later.'],
  NETWORK: ['连接失败，结果尚未确认。请重试相同请求或查看订单，勿重复发起新订单。', 'Connection failed; outcome unconfirmed. Retry this request or check Orders before creating a new order.'],
  SERVER_ERROR: ['服务暂时不可用，请稍后重试。', 'The service is temporarily unavailable. Please retry.'],
  receipt: ['演示订单号', 'DEMO ORDER ID'], details: ['查看商品', 'View product']
};
const $ = selector => document.querySelector(selector);
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let csrf = '', ready = false, busy = false, savedAddress = null, checkoutKey = '', checkoutTotal = 0;
function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
let language = read('natp-shop-language', 'zh') === 'en' ? 'en' : 'zh';
let cart = [];
let favorites = [];
let category = 'ALL';
let favoritesOnly = false;
let orders = [];
let checkoutLines = [];
let checkoutMode = 'cart';
let toastTimer;
let lastFocus;
const dialog = $('#store-dialog');
const content = $('#dialog-content');
const t = key => copy[key]?.[language === 'en' ? 1 : 0] || key;
const name = product => language === 'en' ? product.englishName : product.name;
const money = cents => '¥' + (cents / 100).toFixed(2);
const sizeText = size => size === 'ONE SIZE' ? t('oneSize') : size;
const button = (action, text, kind = 'secondary', extra = '') => `<button type="button" class="button button-${kind}" data-action="${action}" ${extra}>${text}</button>`;

function notify(message) {
  const toast = $('#toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('visible'), 3500);
}
function persist() {
  try { localStorage.setItem('natp-shop-language', JSON.stringify(language)); } catch {}
  $('#cart-count').textContent = itemCount(cart);
}
async function api(route, method = 'GET', body, headers = {}) {
  let response;
  try {
    response = await fetch('/api/' + route, { method, credentials: 'same-origin', signal: AbortSignal.timeout(12000),
      headers: { ...(method !== 'GET' ? { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf } : {}), ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}) });
  } catch { throw new Error('NETWORK'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('SERVER_ERROR'); }
  if (!response.ok) throw new Error(data.error || 'SERVER_ERROR');
  return data;
}
async function run(action, errorSelector = '#dialog-error') {
  if (busy || !ready) return;
  busy = true;
  const controls = [...document.querySelectorAll('button')].map(el => [el, el.disabled]);
  controls.forEach(([el]) => { el.disabled = true; });
  dialog.setAttribute('aria-busy', 'true');
  try { await action(); }
  catch (error) {
    const message = t(copy[error.message] ? error.message : 'SERVER_ERROR');
    if (dialog.open && $(errorSelector)) $(errorSelector).textContent = message; else notify(message);
  } finally {
    busy = false; dialog.removeAttribute('aria-busy');
    controls.forEach(([el, disabled]) => { if (el.isConnected) el.disabled = disabled; });
  }
}
async function sync() {
  const session = await api('session');
  csrf = session.csrf; cart = session.cart; favorites = session.favorites; savedAddress = session.address;
  PRODUCTS = (await api('products')).products;
  persist(); renderCatalog();
}
async function initialize() {
  ready = false; $('#connection').hidden = false; $('#connection-message').textContent = t('loading');
  $('#open-cart').disabled = true; $('#open-orders').disabled = true; $('#retry-connection').disabled = true;
  try {
    await sync(); await api('cart');
    ready = true; $('#connection').hidden = true;
    $('#open-cart').disabled = false; $('#open-orders').disabled = false;
  } catch { $('#connection-message').textContent = t('offline'); }
  finally { $('#retry-connection').disabled = false; }
}
$('#retry-connection').addEventListener('click', initialize);
function show(html) {
  content.innerHTML = html + '<p id="dialog-error" class="form-error" role="alert"></p>';
  if (!dialog.open) { lastFocus = document.activeElement; dialog.showModal(); }
  dialog.scrollTop = 0;
  const title = $('#dialog-title');
  if (title) { title.tabIndex = -1; title.focus(); }
}
function title(text) { return `<h2 id="dialog-title">${escapeHTML(text)}</h2>`; }
function close() { if (!busy) dialog.close(); }
dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
dialog.addEventListener('close', () => { content.replaceChildren(); checkoutLines = []; lastFocus?.focus(); });
$('#close-dialog').addEventListener('click', close);
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } });

function renderCatalog() {
  const categories = ['ALL', 'CLOTHING', 'MUSIC', 'GEAR', 'ACCESSORIES', 'POSTERS', 'LIMITED'];
  $('#categories').innerHTML = categories.map(value => `<button type="button" data-category="${value}" aria-pressed="${category === value}">${t(value)}</button>`).join('');
  const products = PRODUCTS.filter(p => (category === 'ALL' || (category === 'LIMITED' ? p.isLimited : p.category === category)) && (!favoritesOnly || favorites.includes(p.id)));
  $('#result-count').textContent = `${String(products.length).padStart(2, '0')} / ${t('items')}`;
  $('#favorites-only').setAttribute('aria-pressed', favoritesOnly);
  $('#products').innerHTML = products.length ? products.map(p => {
    const saved = favorites.includes(p.id);
    return `<article class="product-card">
      <button type="button" class="product-picture" data-product="${p.id}" aria-label="${t('details')} ${escapeHTML(name(p))}">
        <img src="${p.image}" alt="${escapeHTML(name(p))}" width="600" height="600" loading="lazy">
        ${!p.stock || p.isLimited ? `<span class="product-tag">${t(p.stock ? 'limited' : 'soldout')}</span>` : ''}
      </button>
      <button type="button" class="favorite-button" data-favorite="${p.id}" aria-pressed="${saved}" aria-label="${t(saved ? 'unfavorite' : 'favorite')} ${escapeHTML(name(p))}"><svg viewBox="0 0 24 24" aria-hidden="true" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg></button>
      <div class="product-meta"><span>${p.category}</span><span>NATP / ${String(PRODUCTS.indexOf(p) + 1).padStart(2,'0')}</span></div>
      <button type="button" class="product-name" data-product="${p.id}">${escapeHTML(name(p))}</button><p class="product-price">${money(Math.round(p.price * 100))}</p>
    </article>`;
  }).join('') : `<p class="empty">${t('emptyFavorites')}</p>`;
}
function renderLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $('#language').textContent = language === 'zh' ? 'EN' : '中文';
  renderCatalog();
}
$('#language').addEventListener('click', () => { language = language === 'zh' ? 'en' : 'zh'; renderLanguage(); persist(); });
$('#categories').addEventListener('click', event => {
  const control = event.target.closest('[data-category]');
  if (!control) return;
  category = control.dataset.category; renderCatalog();
  $(`[data-category="${category}"]`).focus();
});
$('#favorites-only').addEventListener('click', () => { favoritesOnly = !favoritesOnly; renderCatalog(); });
$('#products').addEventListener('click', event => {
  if (!ready || busy) return;
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) {
    const id = favorite.dataset.favorite;
    run(async () => {
      favorites = (await api('favorites', 'POST', { id, saved: !favorites.includes(id) })).favorites;
      renderCatalog();
    });
    return;
  }
  const product = event.target.closest('[data-product]');
  if (product) showProduct(product.dataset.product);
});

function showProduct(id) {
  const product = productById(id);
  if (!product) return;
  show(`<div class="detail-grid"><img class="detail-image" src="${product.image}" alt="${escapeHTML(name(product))}"><div>
    <p class="eyebrow">${product.category} / NATP OFFICIAL MERCH</p>${title(name(product))}
    <p class="detail-price">${money(Math.round(product.price * 100))}</p>
    <p class="detail-description">${escapeHTML(language === 'en' ? product.englishDescription : product.description)}</p>
    ${product.stock ? `<label>${t('size')}<select id="detail-size">${variants(product).map(size => `<option value="${size}">${sizeText(size)}</option>`).join('')}</select></label>
    <label>${t('quantity')}<input id="detail-quantity" type="number" min="1" max="${product.stock}" value="1" step="1" inputmode="numeric"></label>` : `<p class="muted">${t('unavailable')}</p>`}
    <p class="form-error" id="detail-error" role="alert"></p><div class="dialog-actions">${button('add', t('add'), 'secondary', `data-id="${id}" ${product.stock ? '' : 'disabled'}`)}${button('buy', t('buy'), 'primary', `data-id="${id}" ${product.stock ? '' : 'disabled'}`)}</div>
    <p class="muted">${t('demo')}</p></div></div>`);
}
function showCart() {
  show(title(t('cart')) + (cart.length ? cart.map((line, index) => {
    const p = productById(line.id);
    const atLimit = cart.filter(item => item.id === line.id).reduce((sum, item) => sum + item.quantity, 0) >= p.stock;
    return `<article class="cart-line"><img src="${p.image}" alt="${escapeHTML(name(p))}"><div><h3>${escapeHTML(name(p))}</h3><p class="muted">${sizeText(line.size)} / ${money(Math.round(p.price * 100))}</p><button type="button" class="remove-button" data-action="remove" data-index="${index}" aria-label="${t('remove')} ${escapeHTML(name(p))}">${t('remove')}</button></div>
    <div class="cart-line-actions"><div class="quantity-controls"><button type="button" data-action="minus" data-index="${index}" aria-label="${language === 'zh' ? '减少数量' : 'Decrease quantity'}" ${line.quantity === 1 ? 'disabled' : ''}>−</button><span>${line.quantity}</span><button type="button" data-action="plus" data-index="${index}" aria-label="${language === 'zh' ? '增加数量' : 'Increase quantity'}" ${atLimit ? 'disabled' : ''}>+</button></div></div></article>`;
  }).join('') + `<div class="cart-total"><span>${t('total')}</span><span>${money(totalCents(cart))}</span></div><p class="muted">${t('demo')}</p><div class="dialog-actions">${button('close', t('keepShopping'))}${button('checkout', t('checkout'), 'primary')}</div>` : `<p class="empty">${t('emptyCart')}</p>${button('close', t('keepShopping'))}`));
}
function showCheckout(lines, mode) {
  checkoutLines = lines.map(line => ({ ...line })); checkoutMode = mode;
  checkoutKey = crypto.randomUUID(); checkoutTotal = totalCents(lines);
  show(title(t('checkoutTitle')) + `<p class="muted">${t('demo')}</p><div class="checkout-grid"><form id="checkout-form">
    <label>${t('receiver')}<input name="receiver" maxlength="40" required autocomplete="off"></label>
    <label>${t('phone')}<input name="phone" type="tel" maxlength="11" pattern="1[3-9][0-9]{9}" required autocomplete="off" placeholder="13800000000"></label>
    <label>${t('address')}<textarea name="address" minlength="5" maxlength="200" required autocomplete="off" rows="3"></textarea></label>
    <p class="muted">${t('privacy')}</p><p id="checkout-error" class="form-error" role="alert"></p><div class="dialog-actions">${button('back-checkout', t('back'))}<button type="submit" class="button button-primary">${t('pay')}</button></div></form>
    <div class="checkout-summary">${checkoutLines.map(line => `<p>${escapeHTML(name(productById(line.id)))}<br><span class="muted">${sizeText(line.size)} × ${line.quantity}</span></p>`).join('')}<div class="cart-total"><span>${t('total')}</span><span>${money(totalCents(checkoutLines))}</span></div></div></div>`);
  if (savedAddress) for (const field of ['receiver','phone','address']) $(`[name="${field}"]`).value = savedAddress[field];
}
async function showOrders() {
  orders = (await api('orders')).orders;
  show(title(t('orders')) + `<p class="muted">${t('paidNote')}</p>` + (orders.length ? orders.map(order => `<article class="order-row"><p class="eyebrow">${escapeHTML(order.id)}</p><p class="order-status">${t('awaiting')}</p>${order.items.map(line => `<p>${escapeHTML(name(line))} / ${escapeHTML(sizeText(line.size))} × ${line.quantity}</p>`).join('')}<strong>${money(order.total)}</strong><p class="muted">${escapeHTML(order.shipping.receiver)} / ${escapeHTML(order.shipping.phone)}<br>${escapeHTML(order.shipping.address)}</p></article>`).join('') : `<p class="empty">${t('noOrders')}</p>`) + `<div class="dialog-actions">${button('erase', t('erase'))}</div>`);
}
$('#open-cart').addEventListener('click', () => run(async () => { await sync(); showCart(); }));
$('#open-orders').addEventListener('click', () => run(showOrders));
content.addEventListener('click', event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  run(async () => {
  const action = control.dataset.action;
  if (action === 'close') { dialog.close(); return; }
  if (action === 'orders') { await showOrders(); return; }
  if (action === 'erase') {
    if (!confirm(t('eraseConfirm'))) return;
    await api('session', 'DELETE', {}); dialog.close(); savedAddress = null; orders = [];
    await sync(); notify(t('erased')); return;
  }
  if (action === 'add' || action === 'buy') {
    const id = control.dataset.id;
    const size = $('#detail-size').value;
    const quantity = Number($('#detail-quantity').value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > productById(id).stock) throw new Error('OUT_OF_STOCK');
    if (action === 'add') { cart = (await api('cart', 'POST', { id, size, quantity })).cart; persist(); dialog.close(); notify(t('added')); }
    else showCheckout([{ id, size, quantity }], 'direct');
    return;
  }
  if (action === 'checkout') { if (cart.length) showCheckout(cart, 'cart'); return; }
  if (action === 'back-checkout') { if (checkoutMode === 'direct') showProduct(checkoutLines[0].id); else { await sync(); showCart(); } return; }
  const index = Number(control.dataset.index);
  const line = cart[index];
  if (!line) return;
  if (action === 'remove') cart = (await api('cart', 'DELETE', { id: line.id, size: line.size })).cart;
  if (action === 'minus' && line.quantity > 1) cart = (await api('cart', 'PATCH', { ...line, quantity: line.quantity - 1 })).cart;
  if (action === 'plus') cart = (await api('cart', 'POST', { ...line, quantity: 1 })).cart;
  persist(); showCart();
  }, $('#detail-error') ? '#detail-error' : '#dialog-error');
});
content.addEventListener('submit', event => {
  if (event.target.id !== 'checkout-form') return;
  event.preventDefault();
  const form = event.target;
  const fields = new FormData(form);
  const address = { receiver: String(fields.get('receiver') || ''), phone: String(fields.get('phone') || ''), address: String(fields.get('address') || '') };
  if (!addressValid(address)) { $('#checkout-error').textContent = t('addressError'); return; }
  run(async () => {
    const result = await api('orders', 'POST', { mode: checkoutMode, items: checkoutLines, shipping: address, expectedTotal: checkoutTotal }, { 'Idempotency-Key': checkoutKey });
    const order = result.order;
    cart = result.cart; PRODUCTS = result.products; savedAddress = address; checkoutLines = [];
    persist(); renderCatalog();
  show(`<p class="success-mark" aria-hidden="true">✓</p>${title(t('paid'))}<p class="order-status">${t('awaiting')}</p><p>${t('receipt')} / ${escapeHTML(order.id)}</p><p class="detail-price">${money(order.total)}</p><p class="muted">${t('paidNote')}</p><div class="dialog-actions">${button('orders', t('viewOrders'), 'primary')}${button('close', t('keepShopping'))}</div>`);
  }, '#checkout-error');
});
renderLanguage();
initialize();
