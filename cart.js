(function () {
const CART_KEY = 'pao_cart';
function loadCart() {
try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
catch { return []; }
}
function saveCart(cart) {
localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
window.CartAPI = {
getAll() { return loadCart(); },
add(product) {
const cart = loadCart();
const idx = cart.findIndex(i => i.id === product.id);
if (idx >= 0) {
cart[idx].qty += 1;
} else {
cart.push({ ...product, qty: 1 });
}
saveCart(cart);
CartUI.update();
CartUI.flash();
},
remove(id) {
saveCart(loadCart().filter(i => i.id !== id));
CartUI.update();
CartUI.renderSidebar();
},
setQty(id, qty) {
const cart = loadCart();
const idx = cart.findIndex(i => i.id === id);
if (idx < 0) return;
if (qty <= 0) { cart.splice(idx, 1); }
else { cart[idx].qty = qty; }
saveCart(cart);
CartUI.update();
CartUI.renderSidebar();
},
total() {
return loadCart().reduce((s, i) => s + i.price * i.qty, 0);
},
count() {
return loadCart().reduce((s, i) => s + i.qty, 0);
}
};
window.CartUI = {
update() {
const n = CartAPI.count();
document.querySelectorAll('.cart-badge').forEach(el => {
el.textContent = n;
el.style.display = n > 0 ? 'flex' : 'none';
});
},
flash() {
document.querySelectorAll('.cart-icon-btn').forEach(btn => {
btn.classList.add('cart-flash');
setTimeout(() => btn.classList.remove('cart-flash'), 600);
});
},
open()  { document.getElementById('cartSidebar')?.classList.add('open'); document.getElementById('cartOverlay')?.classList.add('open'); CartUI.renderSidebar(); },
close() { document.getElementById('cartSidebar')?.classList.remove('open'); document.getElementById('cartOverlay')?.classList.remove('open'); },
renderSidebar() {
const list = document.getElementById('cartItemList');
const totalEl = document.getElementById('cartTotal');
const countEl = document.getElementById('cartCount');
if (!list) return;
const cart = CartAPI.getAll();
if (cart.length === 0) {
list.innerHTML = '<div class="cart-empty"><span>🛒</span><p>ตะกร้าว่างเปล่า</p></div>';
} else {
list.innerHTML = cart.map(item => `
<div class="cart-item" data-id="${item.id}">
<div class="cart-item-img">${item.emoji || '📦'}</div>
<div class="cart-item-info">
<div class="cart-item-name">${item.name}</div>
<div class="cart-item-price">฿${item.price.toLocaleString()}/ชิ้น</div>
<div class="cart-item-controls">
<button class="qty-btn" onclick="CartAPI.setQty('${item.id}', ${item.qty - 1})">−</button>
<span class="qty-num">${item.qty}</span>
<button class="qty-btn" onclick="CartAPI.setQty('${item.id}', ${item.qty + 1})">+</button>
</div>
</div>
<div class="cart-item-subtotal">฿${(item.price * item.qty).toLocaleString()}</div>
<button class="cart-item-remove" onclick="CartAPI.remove('${item.id}')" title="ลบ">✕</button>
</div>
`).join('');
}
const total = CartAPI.total();
const count = CartAPI.count();
if (totalEl) totalEl.textContent = '฿' + total.toLocaleString();
if (countEl) countEl.textContent = count + ' ชิ้น';
}
};
document.addEventListener('DOMContentLoaded', () => {
CartUI.update();
document.querySelectorAll('.cart-icon-btn').forEach(btn => {
btn.addEventListener('click', CartUI.open);
});
document.getElementById('cartOverlay')?.addEventListener('click', CartUI.close);
document.getElementById('cartCloseBtn')?.addEventListener('click', CartUI.close);
const searchInput = document.getElementById('productSearch');
if (searchInput) {
searchInput.addEventListener('input', () => {
const q = searchInput.value.trim().toLowerCase();
document.querySelectorAll('.product-card').forEach(card => {
const name = card.dataset.name?.toLowerCase() || '';
const tags = card.dataset.tags?.toLowerCase() || '';
card.style.display = (!q || name.includes(q) || tags.includes(q)) ? '' : 'none';
});
const visible = [...document.querySelectorAll('.product-card')].filter(c => c.style.display !== 'none');
const noResult = document.getElementById('noResults');
if (noResult) noResult.style.display = visible.length === 0 ? 'block' : 'none';
});
}
});
})();
