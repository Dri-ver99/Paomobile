const ITEMS_PER_PAGE = 12;

const ProductSync = {
    init: function(category) {
        this.category = category;
        this.grid = document.querySelector('.products-grid');
        this.noResults = document.getElementById('noResults');
        this.searchInput = document.getElementById('productSearch');
        this.currentPage = 1;
        this.activeFilter = { model: null, type: null };
        this.deletedIds = [];
        this.hasLoadedOnce = false;
        this.allProducts = [];

        if (!this.grid) return;

        this.listen();
        this.initSearch();
        this.attachListeners();
    },

    // ── Listen to Firestore with onSnapshot (reliable on Vercel) ──
    listen: function() {
        if (typeof db === 'undefined' || !db) {
            setTimeout(() => this.listen(), 500);
            return;
        }

        // Listen for deleted product IDs
        db.collection('settings').doc('deleted_products').onSnapshot(doc => {
            if (doc.exists) {
                this.deletedIds = doc.data().deletedIds || [];
                if (this.hasLoadedOnce) this.render();
            }
        }, err => console.warn("[Sync] Deleted list error:", err));


        // Build query — load ALL products (no server-side filter to avoid index issues)
        let query = db.collection('products').limit(500);

        // Build category list for client-side filtering
        this.categoryList = null;
        if (this.category && this.category !== 'all') {
            if (this.category === 'parts') this.categoryList = ['parts', 'อะไหล่'];
            else if (this.category === 'new') this.categoryList = ['new', 'มือ 1', 'มือหนึ่ง'];
            else if (this.category === 'used') this.categoryList = ['used', 'มือ 2', 'มือสอง'];
            else if (this.category === 'accessory') this.categoryList = ['accessory', 'อุปกรณ์', 'อุปกรณ์เสริม'];
            else this.categoryList = [this.category];
        }

        // Load up to 500 items but strip heavy data immediately
        query.onSnapshot(snapshot => {
            let products = snapshot.docs.map(doc => {
                const raw = { id: doc.id, ...doc.data() };
                // ★ Strip heavy data to save memory ★
                return this.lightweightProduct(raw);
            });

            // ★ Client-side category filter ★
            if (this.categoryList) {
                products = products.filter(p => this.categoryList.includes(p.category));
            }

            console.log(`[Sync] Loaded ${products.length} products for "${this.category}" (from ${snapshot.size} total)`);
            this.allProducts = products;
            this.hasLoadedOnce = true;
            this.currentPage = 1;
            this.render();
            this.autoOpenFromUrl();

        }, err => {
            console.error("[Sync] Snapshot error:", err);
            if (this.noResults) {
                this.noResults.style.display = 'block';
                this.noResults.innerHTML = '❌ โหลดสินค้าไม่สำเร็จ กรุณารีเฟรชหน้านี้';
            }
        });
    },

    // ── Strip heavy data (Base64 images in variations, long descriptions) ──
    lightweightProduct: function(p) {
        if (!p) return p;
        const op = { ...p };
        // Keep ALL images for modal carousel (don't limit!)
        // Strip Base64 images from variations only (each can be 1-5 MB)
        if (Array.isArray(op.variations)) {
            op.variations = op.variations.map(v => {
                if (!v) return v;
                const ov = { ...v };
                if (typeof ov.img === 'string' && ov.img.startsWith('data:image')) ov.img = '';
                if (Array.isArray(ov.images)) ov.images = [];
                return ov;
            });
        }
        // Truncate long descriptions (modal fetches full version from Firestore)
        if (op.description && op.description.length > 300) {
            op.description = op.description.substring(0, 300) + '...';
        }
        if (op.specs && op.specs.length > 500) {
            op.specs = op.specs.substring(0, 500) + '...';
        }
        return op;
    },

    // ── Render: filter + paginate + build cards ──
    render: function() {
        if (!this.grid) return;

        let filtered = this.allProducts || [];

        // Apply sidebar filter (partModel + partType)
        if (this.activeFilter.model) {
            filtered = filtered.filter(p =>
                (p.partModel || '').toLowerCase() === this.activeFilter.model.toLowerCase()
            );
            if (this.activeFilter.type) {
                filtered = filtered.filter(p =>
                    (p.partType || '').toLowerCase() === this.activeFilter.type.toLowerCase()
                );
            }
        }

        // Apply search filter
        const searchVal = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        if (searchVal) {
            filtered = filtered.filter(p =>
                (p.name || '').toLowerCase().includes(searchVal) ||
                (p.brand && typeof p.brand === 'string' && p.brand.toLowerCase().includes(searchVal)) ||
                (p.partModel && typeof p.partModel === 'string' && p.partModel.toLowerCase().includes(searchVal)) ||
                (p.partType && typeof p.partType === 'string' && p.partType.toLowerCase().includes(searchVal)) ||
                (p.tags && Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(searchVal)))
            );
        }

        // Apply deleted filter
        if (this.deletedIds && this.deletedIds.length > 0) {
            filtered = filtered.filter(p => !this.deletedIds.includes(p.id));
        }

        if (filtered.length === 0) {
            this.grid.style.display = 'none';
            if (this.noResults) {
                this.noResults.style.display = 'block';
                this.noResults.innerHTML = this.hasLoadedOnce
                    ? `🔍 ไม่พบ${this.category === 'parts' ? 'อะไหล่' : 'สินค้า'}ที่ค้นหา`
                    : '⏳ กำลังโหลดสินค้า...';
            }
            this.removePagination();
            return;
        }

        this.grid.style.display = 'grid';
        if (this.noResults) this.noResults.style.display = 'none';

        // ★ Pagination: show only current page's items ★
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        if (this.currentPage > totalPages) this.currentPage = totalPages;
        if (this.currentPage < 1) this.currentPage = 1;

        const start = (this.currentPage - 1) * ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

        // Render only current page's cards
        this.grid.innerHTML = pageItems.map((p, i) => this.createCardHTML(p, i)).join('');

        // Render pagination bar
        this.renderPagination(filtered.length, totalPages);
    },

    // ── Pagination bar ──
    renderPagination: function(totalItems, totalPages) {
        this.removePagination();
        if (totalPages <= 1) return;

        const container = document.createElement('div');
        container.id = 'paginationBar';
        container.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;padding:32px 0 16px;width:100%;';

        const hasPrev = this.currentPage > 1;
        const hasNext = this.currentPage < totalPages;

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← ก่อนหน้า';
        prevBtn.disabled = !hasPrev;
        prevBtn.style.cssText = `padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:${!hasPrev ? '#f5f5f5' : '#1a1a2e'};color:${!hasPrev ? '#aaa' : '#fff'};cursor:${!hasPrev ? 'default' : 'pointer'};font-family:inherit;font-size:0.9rem;font-weight:600;transition:all 0.2s;`;
        if (hasPrev) prevBtn.onclick = () => { this.currentPage--; this.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

        const info = document.createElement('span');
        info.style.cssText = 'color:#666;font-size:0.9rem;font-weight:500;';
        info.textContent = `หน้า ${this.currentPage} / ${totalPages} (${totalItems} รายการ)`;

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'ถัดไป →';
        nextBtn.disabled = !hasNext;
        nextBtn.style.cssText = `padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:${!hasNext ? '#f5f5f5' : '#1a1a2e'};color:${!hasNext ? '#aaa' : '#fff'};cursor:${!hasNext ? 'default' : 'pointer'};font-family:inherit;font-size:0.9rem;font-weight:600;transition:all 0.2s;`;
        if (hasNext) nextBtn.onclick = () => { this.currentPage++; this.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

        container.appendChild(prevBtn);
        container.appendChild(info);
        container.appendChild(nextBtn);
        this.grid.parentNode.insertBefore(container, this.grid.nextSibling);
    },

    removePagination: function() {
        const old = document.getElementById('paginationBar');
        if (old) old.remove();
    },

    // ── Product card HTML ──
    createCardHTML: function(p, index) {
        let priceStr;
        if (p.variations && p.variations.length > 0) {
            const varPrices = p.variations.map(v => v.price || 0).filter(pr => pr > 0);
            if (varPrices.length > 0) {
                const minP = Math.min(...varPrices);
                const maxP = Math.max(...varPrices);
                priceStr = minP === maxP ? minP.toLocaleString() : `${minP.toLocaleString()} - ฿${maxP.toLocaleString()}`;
            } else {
                priceStr = p.price ? p.price.toLocaleString() : "0";
            }
        } else {
            priceStr = p.price ? p.price.toLocaleString() : "0";
        }

        const badgeClass = p.badge === 'ใหม่' ? 'new' : (p.badge === 'ขายดี' ? 'hot' : 'used');
        const badgeHTML = p.badge ? `<div class="product-badge ${badgeClass}">${p.badge}</div>` : "";

        const isAboveFold = index < 8;
        const loadingAttr = isAboveFold ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"';

        let imgHTML = p.img
            ? `<img src="${p.img}" alt="${p.name}" ${loadingAttr} style="opacity:0;transition:opacity 0.4s ease-in;" onload="this.style.opacity=1">`
            : `<div class="product-emoji-placeholder" style="font-size:3rem;height:100%;display:flex;align-items:center;justify-content:center;">${p.emoji || '📦'}</div>`;

        // Store product data for modal
        if (!window._paoProductMap) window._paoProductMap = {};
        window._paoProductMap[p.id] = {
            id: p.id,
            name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price, brand: p.brand || p.partModel || "",
            img: p.img || "", images: p.images || (p.img ? [p.img] : []),
            description: p.description || "", emoji: p.emoji || "📱",
            specs: p.specs || "", variations: p.variations || [],
            isOutOfStock: !!p.isOutOfStock
        };

        const cartObj = JSON.stringify({
            id: p.id, name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price, img: p.img || "", emoji: p.emoji || "📱", source: this.category || 'index'
        }).replace(/"/g, '&quot;');

        const hasVariations = p.variations && p.variations.length > 0;
        let cartBtnHTML;
        if (p.isOutOfStock) {
            cartBtnHTML = `<button class="btn-add-cart disabled" onclick="event.stopPropagation()">หมดชั่วคราว</button>`;
        } else if (hasVariations) {
            cartBtnHTML = `<button class="btn-add-cart" onclick="event.stopPropagation(); var prod = window._paoProductMap && window._paoProductMap['${p.id}']; if(prod && window.ProductDetail) ProductDetail.open(prod);">เลือกตัวเลือก</button>`;
        } else {
            cartBtnHTML = `<button class="btn-add-cart" onclick="event.stopPropagation(); CartAPI.add(${cartObj})">+ เพิ่มลงตะกร้า</button>`;
        }

        const soldOutClass = p.isOutOfStock ? 'sold-out' : '';
        return `
            <div class="product-card ${soldOutClass}" data-pid="${p.id}">
                <div class="product-img ${soldOutClass}">${badgeHTML}${imgHTML}</div>
                <div class="product-info">
                    <div class="product-brand">${p.brand || p.partModel || ''}</div>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-specs">${p.specs || 'แตะเพื่อดูรูปภาพเพิ่มเติม'}</div>
                    <div class="product-price">฿${priceStr}</div>
                </div>
                ${cartBtnHTML}
            </div>
        `;
    },

    // ── Click handler for product cards ──
    attachListeners: function() {
        if (!this.grid) return;
        this.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card || e.target.closest('.btn-add-cart')) return;
            const pid = card.getAttribute('data-pid');
            if (!pid) return;
            const product = window._paoProductMap && window._paoProductMap[pid];
            if (product && window.ProductDetail) window.ProductDetail.open(product);
        });
    },

    // ── Search input ──
    initSearch: function() {
        if (!this.searchInput) return;
        const self = this;
        let debounce;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => { self.currentPage = 1; self.render(); }, 200);
        });

        const clearBtn = document.getElementById('heroSearchClear');
        if (clearBtn) {
            this.searchInput.addEventListener('input', () => {
                clearBtn.style.display = this.searchInput.value ? 'block' : 'none';
            });
            clearBtn.addEventListener('click', () => {
                this.searchInput.value = "";
                clearBtn.style.display = 'none';
                this.activeFilter = { model: null, type: null };
                document.querySelectorAll('.brand-item').forEach(i => i.classList.remove('active'));
                this.currentPage = 1;
                this.render();
            });
        }
    },

    // ── Sidebar filter ──
    filterByDynamicParts: function(model, type = null) {
        this.activeFilter = { model, type };
        this.currentPage = 1;
        if (this.searchInput) this.searchInput.value = "";
        this.render();
        if (window.innerWidth <= 992) {
            const grid = document.querySelector('.products-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    },

    filterByTag: function(tag) {
        if (this.searchInput) this.searchInput.value = tag;
        this.currentPage = 1;
        this.render();
    },

    // ── Auto-open product from URL (?id=xxx) ──
    autoOpenFromUrl: function() {
        if (this.__autoOpened) return;
        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (!productId) return;
        this.__autoOpened = true;

        const found = this.allProducts && this.allProducts.find(p => p.id === productId);
        const openModal = (product) => {
            const tryOpen = (n) => {
                if (n <= 0) return;
                if (window.ProductDetail) window.ProductDetail.open(product);
                else setTimeout(() => tryOpen(n - 1), 100);
            };
            tryOpen(30);
        };

        if (found) { openModal(found); return; }
        if (typeof db !== 'undefined' && db) {
            db.collection('products').doc(productId).get().then(doc => {
                if (doc.exists) openModal({ id: doc.id, ...doc.data() });
            }).catch(() => {});
        }
    }
};
