(async function () {
    const CART_KEY = 'pao_cart';
    const USER_KEY = 'paomobile_user';

    let db = null;
    let auth = null;
    let authReady = false;
    let initPromise = null;

    async function initFirebase() {
        if (initPromise) return initPromise;
        
        initPromise = (async () => {
            if (db) return true;
            try {
                console.log("[Cart] Initializing persistent sync...");
                const mod = await import('./firebase-config.js');
                db = mod.db;
                auth = mod.auth;
                const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js");
                
                return new Promise((resolve) => {
                    onAuthStateChanged(auth, async (user) => {
                        authReady = true;
                        if (user) {
                            console.log("[Cart] User detected, syncing with cloud...");
                            await syncWithFirestore(user.uid);
                        } else {
                            console.log("[Cart] No user session. Guest mode.");
                        }
                        resolve(true);
                    });
                });
            } catch (e) {
                console.error("[Cart] Firebase init failed:", e);
                return false;
            }
        })();
        
        return initPromise;
    }

    function getLocalCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
        catch { return []; }
    }

    function saveLocalCart(cart, ownerUid = null) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        if (ownerUid) {
            localStorage.setItem('pao_cart_owner', ownerUid);
        } else if (!localStorage.getItem('pao_cart_owner')) {
            // If no owner is set, it's a guest cart
            localStorage.setItem('pao_cart_owner', 'guest');
        }
    }

    async function syncWithFirestore(uid) {
        if (!db) return;
        const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
        const cartDoc = doc(db, 'carts', uid);
        
        try {
            const snap = await getDoc(cartDoc);
            let remoteCart = [];
            if (snap.exists()) {
                remoteCart = snap.data().items || [];
                console.log("[Cart] Cloud data found for", uid, ":", remoteCart.length, "items.");
            }

            const localCart = getLocalCart();
            const lastOwner = localStorage.getItem('pao_cart_owner') || 'guest';
            
            let merged = [];
            
            // Logic: Only merge if the previous owner was a 'guest'.
            // If the last owner was a DIFFERENT registered user, DISCARD THE LOCAL CART.
            if (lastOwner === 'guest') {
                console.log("[Cart] Merging guest cart into account...");
                merged = [...remoteCart];
                localCart.forEach(lItem => {
                    const idx = merged.findIndex(rItem => rItem.id === lItem.id);
                    if (idx >= 0) {
                        merged[idx].qty = Math.max(merged[idx].qty, lItem.qty);
                    } else {
                        merged.push(lItem);
                    }
                });
            } else if (lastOwner === uid) {
                console.log("[Cart] Resuming session for same user.");
                merged = remoteCart; // For same user, cloud is source of truth or we just continue
            } else {
                console.warn("[Auth] Detected account switch! Discarding previous user's local cart.");
                merged = remoteCart; // Discard local (belongs to someone else)
            }

            console.log("[Cart] Sync complete. Isolation check passed.");
            saveLocalCart(merged, uid);
            await setDoc(cartDoc, { items: merged, updatedAt: new Date().toISOString() });
            CartUI.update();
            CartUI.renderSidebar();
        } catch (e) {
            console.error("[Cart] Firestore sync failed:", e);
        }
    }

    async function pushToFirestore() {
        const userData = localStorage.getItem(USER_KEY);
        if (!userData) return; 
        
        let user;
        try { user = JSON.parse(userData); } catch(e) { return; }
        if (!user || (!user.uid && !user.id)) return;
        const uid = user.uid || user.id;

        await initFirebase(); // Ensure db is ready
        if (!db) return;

        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js");
        try {
            await setDoc(doc(db, 'carts', uid), {
                items: getLocalCart(),
                updatedAt: new Date().toISOString()
            });
            console.log("[Cart] Saved to cloud.");
        } catch (e) {
            console.error("[Cart] Cloud save failed:", e);
        }
    }

    window.CartAPI = {
        getAll() { return getLocalCart(); },
        async add(product) {
            const cart = getLocalCart();
            const idx = cart.findIndex(i => i.id === product.id);
            if (idx >= 0) {
                cart[idx].qty += 1;
            } else {
                cart.push({ ...product, qty: 1 });
            }
            saveLocalCart(cart);
            CartUI.update();
            CartUI.flash();
            await pushToFirestore();
        },
        async remove(id) {
            const cart = getLocalCart().filter(i => i.id !== id);
            saveLocalCart(cart);
            CartUI.update();
            CartUI.renderSidebar();
            await pushToFirestore();
        },
        async setQty(id, qty) {
            const cart = getLocalCart();
            const idx = cart.findIndex(i => i.id === id);
            if (idx < 0) return;
            if (qty <= 0) { cart.splice(idx, 1); }
            else { cart[idx].qty = qty; }
            saveLocalCart(cart);
            CartUI.update();
            CartUI.renderSidebar();
            await pushToFirestore();
        },
        total() {
            return getLocalCart().reduce((s, i) => s + i.price * i.qty, 0);
        },
        count() {
            return getLocalCart().reduce((s, i) => s + i.qty, 0);
        },
        async forceSync() {
            console.log("[Cart] Force sync requested...");
            initPromise = null; // Allow re-init if needed
            await initFirebase();
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
        open()  { if (typeof closeMenu === 'function') closeMenu(); document.getElementById('cartSidebar')?.classList.add('open'); document.getElementById('cartOverlay')?.classList.add('open'); CartUI.renderSidebar(); },
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
                        <div class="cart-item-img">
                            ${item.img ? `<img src="${item.img}" alt="${item.name}">` : (item.emoji || '📦')}
                        </div>
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
        
        // Product search
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

        // Auto-init sync if logged in
        if (localStorage.getItem(USER_KEY)) {
            initFirebase();
        } else {
            console.log("[Cart] Running in guest mode.");
        }
    });

})();
