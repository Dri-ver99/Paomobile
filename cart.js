(async function () {
    const USER_KEY = 'paomobile_user';
    const getActiveUserId = () => {
        try { const u = JSON.parse(localStorage.getItem(USER_KEY)); return u ? (u.uid || u.id || u.phone || 'default') : 'guest'; }
        catch { return 'guest'; }
    };
    const getCartKey = () => 'pao_cart_' + getActiveUserId();

    let initPromise = null;

    async function initFirebase() {
        if (initPromise) return initPromise;

        initPromise = (async () => {
            try {
                const supabase = window.supabaseClient;
                if (!supabase) return false;
                
                const sessionRes = await supabase.auth.getSession().catch(() => null);
                const user = sessionRes?.data?.session?.user;
                const localUser = localStorage.getItem(USER_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) || '{}') : null;
                const activeUser = user || localUser;
                const uid = activeUser ? (activeUser.uid || activeUser.id) : null;

                if (uid) {
                    await syncWithFirestore(uid);
                }
                return true;
            } catch (e) {
                console.warn("[Cart] DB init warning:", e);
                return false;
            }
        })();

        return initPromise;
    }

    function getLocalCart() {
        try { return JSON.parse(localStorage.getItem(getCartKey())) || []; }
        catch { return []; }
    }

    function saveLocalCart(cart, timestamp = null) {
        localStorage.setItem(getCartKey(), JSON.stringify(cart));
        if (timestamp) {
            localStorage.setItem(getCartKey() + '_updated', timestamp.toString());
        } else {
            localStorage.setItem(getCartKey() + '_updated', Date.now().toString());
        }
    }

    async function syncWithFirestore(uid) {
        const supabase = window.supabaseClient;
        if (!supabase) return;

        try {
            const { data: snap } = await supabase.from('carts').select('*').eq('id', uid).maybeSingle();
            let remoteCart = [];
            let remoteUpdated = 0;
            if (snap) {
                remoteCart = snap.cart || [];
                remoteUpdated = snap.cartUpdatedAt ? new Date(snap.cartUpdatedAt).getTime() : 0;
            }

            const localCart = getLocalCart();
            const localUpdatedStr = localStorage.getItem(getCartKey() + '_updated');
            const localUpdated = localUpdatedStr ? parseInt(localUpdatedStr, 10) : 0;

            if (localUpdated > remoteUpdated) {
                console.log("[Cart] Local data is newer. Pushing to cloud.");
                await supabase.from('carts').upsert({
                    id: uid,
                    cart: localCart,
                    cartUpdatedAt: new Date(localUpdated).toISOString()
                });
            } else if (remoteUpdated > localUpdated) {
                console.log("[Cart] Cloud data is newer. Syncing to local.");
                saveLocalCart(remoteCart, remoteUpdated);
                if (window.CartUI) {
                    CartUI.update();
                    CartUI.renderSidebar();
                    CartUI.renderFullPage();
                }
            }
        } catch (e) {
            console.warn("[Cart] Sync warning:", e);
        }
    }

    async function pushToFirestore() {
        const userData = localStorage.getItem(USER_KEY);
        if (!userData) return;

        let user;
        try { user = JSON.parse(userData); } catch (e) { return; }
        if (!user || (!user.uid && !user.id)) return;
        const uid = user.uid || user.id;

        const supabase = window.supabaseClient;
        if (!supabase) return;

        try {
            await supabase.from('carts').upsert({
                id: uid,
                cart: getLocalCart(),
                cartUpdatedAt: new Date().toISOString()
            });
            console.log("[Cart] Saved to cloud.");
        } catch (e) {
            console.warn("[Cart] Cloud save warning:", e);
        }
    }

    window.CartAPI = {
        getAll() { return getLocalCart(); },
        async add(product) {
            const cart = getLocalCart();
            const idx = cart.findIndex(i => i.id === product.id);
            if (idx >= 0) {
                cart[idx].qty += 1;
                cart[idx].selected = true; // Ensure it's selected when added again
            } else {
                cart.push({ ...product, qty: 1, selected: true });
            }
            saveLocalCart(cart);
            CartUI.update();
            CartUI.flash();
            CartUI.renderFullPage();
            await pushToFirestore();
        },
        async remove(id) {
            await CartAPI._doRemove(id);
        },
        async _doRemove(id) {
            const cart = getLocalCart().filter(i => i.id !== id);
            saveLocalCart(cart);
            CartUI.update();
            CartUI.renderSidebar();
            CartUI.renderFullPage();
            await pushToFirestore();
        },
        async removeSelected() {
            const cart = getLocalCart().filter(i => i.selected === false);
            saveLocalCart(cart);
            CartUI.update();
            CartUI.renderSidebar();
            CartUI.renderFullPage();
            await pushToFirestore();
        },
        async setQty(id, qty) {
            const cart = getLocalCart();
            const idx = cart.findIndex(i => i.id === id);
            if (idx < 0) return;

            if (qty <= 0) {
                await CartAPI._doRemove(id);
                return;
            }

            cart[idx].qty = qty;
            saveLocalCart(cart);
            CartUI.update();
            CartUI.renderSidebar();
            CartUI.renderFullPage();
            await pushToFirestore();
        },
        toggleSelect(id, state = null) {
            const cart = getLocalCart();
            const idx = cart.findIndex(i => i.id === id);
            if (idx >= 0) {
                cart[idx].selected = (state !== null) ? state : !cart[idx].selected;
                saveLocalCart(cart);
                CartUI.renderFullPage();
                CartUI.renderSidebar();
                pushToFirestore();
            }
        },
        toggleSelectAll(state) {
            const cart = getLocalCart();
            cart.forEach(item => item.selected = state);
            saveLocalCart(cart);
            CartUI.renderFullPage();
            CartUI.renderSidebar();
            pushToFirestore();
        },
        total() {
            return getLocalCart().filter(i => i.selected !== false).reduce((s, i) => s + i.price * i.qty, 0);
        },
        count() {
            return getLocalCart().filter(i => i.selected !== false).reduce((s, i) => s + i.qty, 0);
        },
        countAll() {
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
            const n = CartAPI.countAll();
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
        isOpen() {
            return document.getElementById('cartSidebar')?.classList.contains('open') || false;
        },
        open() { 
            if (typeof closeMenu === 'function') closeMenu(); 
            document.getElementById('cartSidebar')?.classList.add('open'); 
            document.getElementById('cartOverlay')?.classList.add('open'); 
            CartUI.renderSidebar(); 
            const closeBtn = document.getElementById('cartCloseBtn') || document.querySelector('.cart-close-btn');
            if (closeBtn) closeBtn.onclick = (e) => { e?.stopPropagation(); CartUI.close(); };
            const overlay = document.getElementById('cartOverlay');
            if (overlay) overlay.onclick = (e) => { e?.stopPropagation(); CartUI.close(); };
        },
        close() { 
            document.getElementById('cartSidebar')?.classList.remove('open'); 
            document.getElementById('cartOverlay')?.classList.remove('open'); 
        },
        toggle() {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },
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
                            ${item.img ? `<img src="${item.img.startsWith('http') ? item.img : encodeURI(item.img)}" alt="${item.name}">` : (item.emoji || '📦')}
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

            // Ensure only "View Full Cart" button exists in sidebar footer (Remove LINE button)
            const footer = document.querySelector('.cart-sidebar-footer');
            if (footer) {
                // Remove existing LINE button if present
                const lineBtn = footer.querySelector('a[href*="line.me"]');
                if (lineBtn) lineBtn.remove();

                // Check if cart link already exists, otherwise create it
                let cartLink = footer.querySelector('a[href="cart.html"]');
                if (!cartLink) {
                    cartLink = document.createElement('a');
                    cartLink.href = 'cart.html';
                    cartLink.className = 'btn btn-outline';
                    cartLink.style.width = '100%';
                    cartLink.style.justifyContent = 'center';
                    cartLink.style.marginTop = '12px';
                    cartLink.innerHTML = '🛒 ดูตะกร้าสินค้าทั้งหมด';
                    footer.appendChild(cartLink);
                } else {
                    // Ensure it's centered and has proper margin if it already exists
                    cartLink.style.width = '100%';
                    cartLink.style.justifyContent = 'center';
                    cartLink.style.marginTop = '12px';
                    cartLink.style.display = 'flex';
                }
            }
        },
        renderFullPage() {
            const list = document.getElementById('cartPageList');
            const totalEl = document.getElementById('cartPageTotal');
            const countEl = document.getElementById('cartPageCount');
            if (!list) return;

            const cart = CartAPI.getAll();
            if (cart.length === 0) {
                list.innerHTML = `
                    <div class="cart-items-group">
                        <div class="cart-empty-message" style="padding: 100px; text-align: center; background: #fff;">
                            <p style="font-size: 1.2rem; color: #757575;">ตะกร้าสินค้าของคุณว่างเปล่า</p>
                            <a href="accessory.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">ไปช้อปเลย</a>
                        </div>
                    </div>`;
            } else {
                const allSelected = cart.every(i => i.selected !== false);
                list.innerHTML = `
                    <div class="cart-items-group">
                        <div class="cart-shop-header">
                            <label class="shopee-checkbox">
                                <input type="checkbox" id="selectAllHeader" ${allSelected ? 'checked' : ''} onchange="CartAPI.toggleSelectAll(this.checked)">
                                <span class="checkbox-box"></span>
                            </label>
                            <span class="shop-badge">ร้านแนะนำ</span>
                            <span>Paomobile Official Store</span>
                        </div>
                        ${cart.map(item => `
                            <div class="cart-item-row" data-id="${item.id}">
                                <div class="item-checkbox">
                                    <label class="shopee-checkbox">
                                        <input type="checkbox" ${item.selected !== false ? 'checked' : ''} onchange="CartAPI.toggleSelect('${item.id}', this.checked)">
                                        <span class="checkbox-box"></span>
                                    </label>
                                </div>
                                <div class="item-main">
                                    <img src="${item.img ? (item.img.startsWith('http') ? item.img : encodeURI(item.img)) : 'logo.png'}" alt="${item.name}" class="item-img">
                                    <div class="item-info">
                                        <div class="item-name">${item.name}</div>
                                        <div class="item-variation">${item.variation || ''}</div>
                                    </div>
                                </div>
                                <div class="item-price" data-label="ราคาต่อชิ้น">฿${item.price.toLocaleString()}</div>
                                <div class="item-qty" data-label="จำนวน">
                                    <div class="item-qty-selector">
                                        <button class="item-qty-btn" onclick="CartAPI.setQty('${item.id}', ${item.qty - 1})">−</button>
                                        <input type="text" class="item-qty-input" value="${item.qty}" readonly>
                                        <button class="item-qty-btn" onclick="CartAPI.setQty('${item.id}', ${item.qty + 1})">+</button>
                                    </div>
                                </div>
                                <div class="item-subtotal" data-label="ราคารวม">฿${(item.price * item.qty).toLocaleString()}</div>
                                <div class="item-actions" data-label="แอคชั่น">
                                    <button class="item-remove-btn" onclick="CartAPI.remove('${item.id}')">ลบออก</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Update footer selection state
                const selectAllFooter = document.getElementById('selectAllFooter');
                if (selectAllFooter) selectAllFooter.checked = allSelected;
            }
            const total = CartAPI.total();
            const count = CartAPI.count();
            const totalItemsCount = CartAPI.countAll();

            if (totalEl) totalEl.textContent = '฿' + total.toLocaleString();
            if (countEl) countEl.textContent = count;

            // Update total summary count in footer if exists
            const summaryCountEl = document.getElementById('cartSummaryCount');
            if (summaryCountEl) summaryCountEl.textContent = totalItemsCount;
        },
        async checkout() {
            const cart = CartAPI.getAll();
            if (cart.length === 0) {
                if (window.sellerAlert) await sellerAlert('ตะกร้าสินค้าว่างเปล่า\nกรุณาเลือกสินค้าก่อนสั่งซื้อ', 'warning');
                else alert('ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าก่อนสั่งซื้อ');
                return;
            }
            const hasSelected = cart.some(i => i.selected !== false);
            if (!hasSelected) {
                if (window.sellerAlert) await sellerAlert('กรุณาเลือกสินค้าที่ต้องการสั่งซื้ออย่างน้อย 1 ชิ้น', 'warning');
                else alert('กรุณาเลือกสินค้าที่ต้องการสั่งซื้ออย่างน้อย 1 ชิ้น');
                return;
            }

            // --- Authentication Guard ---
            if (window.AuthAPI && !window.AuthAPI.isLoggedIn()) {
                if (window.sellerAlert) await sellerAlert('กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อสินค้า', 'info');
                else alert('กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อสินค้า');
                window.AuthAPI.redirectToLogin();
                return;
            }

            window.location.href = 'checkout.html';
        },
        showDeleteConfirm(name, onConfirm) {
            const modal = document.getElementById('deleteConfirmModal');
            const nameEl = document.getElementById('deleteItemName');
            const confirmBtn = document.getElementById('confirmDeleteBtn');

            if (modal && nameEl && confirmBtn) {
                nameEl.textContent = name;
                confirmBtn.onclick = () => {
                    onConfirm();
                    this.hideDeleteConfirm();
                };
                modal.classList.add('open');
            }
        },
        hideDeleteConfirm() {
            const modal = document.getElementById('deleteConfirmModal');
            if (modal) {
                modal.classList.remove('open');
            }
        }
    };

    function initCartUI() {
        if (window.CartUI) {
            CartUI.update();
        }

        // Bind explicit click handlers to close buttons & overlay
        document.querySelectorAll('#cartCloseBtn, .cart-close-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.CartUI) CartUI.close();
            };
        });

        const overlay = document.getElementById('cartOverlay');
        if (overlay) {
            overlay.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.CartUI) CartUI.close();
            };
        }
    }

    // Global click listener for cart toggle & closing when clicking close btn or outside
    document.addEventListener('click', (e) => {
        const closeBtn = e.target.closest('#cartCloseBtn, .cart-close-btn');
        if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (window.CartUI) {
                CartUI.close();
            }
            return;
        }

        const cartBtn = e.target.closest('#cartBtn, .cart-icon-btn, [aria-label="ตะกร้าสินค้า"]');
        const cartSidebar = document.getElementById('cartSidebar');
        const path = e.composedPath ? e.composedPath() : [];
        const isInsideSidebar = cartSidebar && (
            cartSidebar.contains(e.target) || 
            !document.documentElement.contains(e.target) || 
            path.includes(cartSidebar)
        );

        if (cartBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (window.CartUI) {
                CartUI.toggle();
            }
            return;
        }

        // Close cart sidebar when clicking outside on empty space / overlay
        if (window.CartUI && CartUI.isOpen() && !isInsideSidebar) {
            CartUI.close();
        }
    });

    // Robust init: handle both pre/post DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCartUI);
    } else {
        initCartUI();
    }

    document.addEventListener('DOMContentLoaded', () => {

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

        // --- Hammer Fix: Premium Mobile Full-Screen Cart ---
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .cart-sidebar {
                    width: 100% !important;
                    height: 100dvh !important;
                    max-height: 100dvh !important;
                    border-left: none !important;
                    border-radius: 0 !important;
                    z-index: 99999 !important;
                    transform: translateX(100%) !important;
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
                }
                .cart-sidebar.open {
                    transform: translateX(0) !important;
                }
                .cart-sidebar-header {
                    padding: 110px 24px 20px !important;
                    border-bottom: 1.5px solid rgba(0,0,0,0.05) !important;
                }
                .cart-sidebar-header h3 {
                    font-size: 1.4rem !important;
                    font-weight: 700 !important;
                }
                #cartCloseBtn, .cart-close-btn {
                    position: fixed !important;
                    top: 32px !important;
                    right: 20px !important;
                    width: 44px !important;
                    height: 44px !important;
                    background: rgba(255, 255, 255, 0.95) !important;
                    color: #333333 !important;
                    border-radius: 50% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    font-size: 1.2rem !important;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.12) !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(10px) !important;
                    z-index: 100000 !important;
                    border: 1.5px solid rgba(0,0,0,0.08) !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                }
                #cartCloseBtn:active, .cart-close-btn:active {
                    transform: scale(0.9);
                    background: #f0f0f0 !important;
                }
                .cart-item-list {
                    padding: 16px 20px !important;
                }
                .cart-sidebar-footer {
                    padding: 24px !important;
                    padding-bottom: calc(24px + env(safe-area-inset-bottom)) !important;
                    border-top: 1.5px solid rgba(0,0,0,0.05) !important;
                    background: #fff !important;
                }
            }
        `;
        document.head.appendChild(style);
    });

})();

