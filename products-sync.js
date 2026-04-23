const MOCK_PRODUCTS_BASELINE = [
  // New Products
  { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", img: "", emoji: "📱", badge: "ใหม่", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a16"] },
  { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", img: "", emoji: "📱", badge: "ขายดี", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a17", "pro"] },
  { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", img: "", emoji: "📲", badge: "AI", tags: ["samsung", "ซัมซุง", "galaxy", "s24", "มือ1", "มือ 1", "ai"] },
  { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", img: "", emoji: "📲", badge: "Leica", tags: ["xiaomi", "เสียวหมี่", "leica", "มือ1", "มือ 1"] },
  
  // Used Products
  { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", img: "", emoji: "📱", badge: "สภาพนางฟ้า", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", img: "", emoji: "📱", badge: "ราคาคุ้ม", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", badge: "มือสอง", tags: ["samsung", "ซัมซุง", "galaxy", "s23", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", badge: "มือสอง", tags: ["samsung", "ซัมซุง", "a54", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", badge: "มือสอง", tags: ["oppo", "ออปโป้", "reno", "มือสอง", "มือ2", "มือ 2"] },

  // Accessory
  { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", img: "Why 60W-1 Type C To C - 1.jpg", emoji: "🔌", badge: "ขายดี", tags: ["สายชาร์จ", "why", "60w", "type c", "ชาร์จเร็ว", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", img: "Why 20w-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "why", "20w", "type c", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", img: "earphone-1.jpg", emoji: "🎧", tags: ["หูฟัง", "anidary", "earphone", "ant004", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", img: "ANS006-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "anidary", "ans006", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", img: "Why-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "why", "usb", "1m", "micro", "lightning", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", img: "USB-I 12W-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc001", "lightning", "iphone", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc007", "type c", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", badge: "โปรแรง", tags: ["สายชาร์จ", "anidary", "anc007", "โปรโมชั่น", "ราคาพิเศษ", "อุปกรณ์เสริม", "accessory"] }
];
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

        if (!this.grid) return;

        // Force clear cache if we switched to a v4.1 catalog structure (reverted)
        if (!localStorage.getItem('pao_cache_v4_sys_revert')) {
            localStorage.clear();
            localStorage.setItem('pao_cache_v4_sys_revert', 'true');
        }

        this.listen();
        this.initSearch();
        this.attachListeners();
    },

    listen: function() {
        const baselineForCategory = MOCK_PRODUCTS_BASELINE.filter(p => p.category === this.category);
        const baselineIds = new Set(baselineForCategory.map(p => p.id));
        const cacheKey = `pao_cache_${this.category}`;

        // 1. Instant Cache Render (Zero-Flash)
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                this.allProducts = JSON.parse(cached);
                this.render();
                this.autoOpenFromUrl();
            } else {
                // DO NOT render baseline immediately if it's empty or placeholder-heavy
                // Instead, keep the "Loading..." state visible in HTML until Firestore returns
                this.allProducts = baselineForCategory;
                if (this.allProducts.length > 0) {
                    this.render();
                }
            }
        } catch (e) {
            this.allProducts = [];
        }

        if (typeof db === 'undefined' || !db) {
            setTimeout(() => this.listen(), 500);
            return;
        };

        db.collection('settings').doc('deleted_products').onSnapshot(doc => {
            if (doc.exists) {
                this.deletedIds = doc.data().deletedIds || [];
                this.render();
            }
        }, err => console.warn("[Sync] Deleted List Sync Error:", err));

        // 2. Optimized Real-time Firestore Listen
        let query = db.collection('products');
        
        // Server-side filtering with Synonym Support (Thai/English)
        if (this.category && this.category !== 'all') {
            let categoryList = [this.category];
            
            // Map synonyms for broader server-side matching
            if (this.category === 'new') categoryList = ['new', 'มือ 1', 'มือหนึ่ง'];
            else if (this.category === 'used') categoryList = ['used', 'มือ 2', 'มือสอง'];
            else if (this.category === 'accessory') categoryList = ['accessory', 'อุปกรณ์', 'อุปกรณ์เสริม'];
            else if (this.category === 'parts') categoryList = ['parts', 'อะไหล่'];
            
            query = query.where('category', 'in', categoryList);
        }
        
        // Add a limit for safety (prevents massive accidental reads)
        query = query.limit(1000); 

        this.unsubscribe = query.onSnapshot(snapshot => {
            const firestoreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Client-side fallback for synonyms (if any were missed by the server query)
            const isMatch = (p) => {
                const pCat = (p.category || "").toLowerCase().trim();
                const targetCat = (this.category || "").toLowerCase().trim();
                
                if (targetCat === 'all') return true;
                if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง';
                if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง';
                if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม';
                if (targetCat === 'parts') return pCat === 'parts' || pCat === 'อะไหล่';
                
                return pCat === targetCat;
            };

                const matchingFirestore = firestoreProducts.filter(isMatch);
                const firestoreIds = new Set(matchingFirestore.map(p => p.id));

                const newOnes = matchingFirestore.filter(p => !baselineIds.has(p.id));
                const mergedBaseline = baselineForCategory.map(p =>
                    firestoreIds.has(p.id) ? firestoreProducts.find(f => f.id === p.id) : p
                );

                const finalProducts = [...newOnes, ...mergedBaseline];
                this.allProducts = finalProducts;
                this.hasLoadedOnce = true;
                
                this.debounceRender();
                
                localStorage.setItem(cacheKey, JSON.stringify(finalProducts));
                this.autoOpenFromUrl();
            }, err => {
                console.error("[Sync] Firestore Listen Error:", err);
                this.hasLoadedOnce = true;
                this.render();
            });
    },

    debounceRender: function() {
        if (this.__renderTimer) clearTimeout(this.__renderTimer);
        this.__renderTimer = setTimeout(() => this.render(), 50);
    },

    render: function() {
        if (!this.allProducts || !this.grid) return;

        const searchVal = this.searchInput ? this.searchInput.value.toLowerCase().trim() : "";
        let filtered = this.allProducts;

        if (searchVal) {
            // Reset Dynamic Filter if searching (ensures results are found outside current category)
            if (this.activeFilter.model || this.activeFilter.type) {
                this.activeFilter = { model: null, type: null };
                document.querySelectorAll('.brand-item').forEach(i => i.classList.remove('active'));
            }

            filtered = filtered.filter(p =>
                (p.name || "").toLowerCase().includes(searchVal) ||
                (p.brand && typeof p.brand === 'string' && p.brand.toLowerCase().includes(searchVal)) ||
                (p.partModel && typeof p.partModel === 'string' && p.partModel.toLowerCase().includes(searchVal)) ||
                (p.partType && typeof p.partType === 'string' && p.partType.toLowerCase().includes(searchVal)) ||
                (p.tags && Array.isArray(p.tags) && p.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(searchVal)))
            );
        }

        // Apply Dynamic Category Filter (Real-time persistent)
        if (this.activeFilter.model) {
            filtered = filtered.filter(p => p.partModel === this.activeFilter.model);
            
            // If sub-type is also selected, filter by it too
            if (this.activeFilter.type) {
                filtered = filtered.filter(p => p.partType === this.activeFilter.type);
            }
        }

        // Apply Filter for Global Deletions
        if (this.deletedIds && this.deletedIds.length > 0) {
            filtered = filtered.filter(p => !this.deletedIds.includes(p.id));
        }

        if (filtered.length === 0) {
            this.grid.style.display = 'none';
            if (this.noResults) {
                this.noResults.style.display = 'block';
                // Only show "No results" if we've actually finished our first real load from Firestore
                // otherwise keep whatever "Loading" message is in the HTML.
                if (this.hasLoadedOnce) {
                    this.noResults.innerHTML = `🔍 ไม่พบ${this.category === 'parts' ? 'อะไหล่' : 'สินค้า'}ที่ค้นหา`;
                }
            }
            this.removePagination();
            return;
        }

        this.grid.style.display = 'grid';
        if (this.noResults) this.noResults.style.display = 'none';

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const page = Math.max(1, Math.min(this.currentPage, totalPages));
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

        this.grid.innerHTML = pageItems.map((p, index) => this.createCardHTML(p, index)).join('');
        this.renderPagination(page, totalPages, filtered.length);
    },

    renderPagination: function(page, totalPages, totalItems) {
        this.removePagination();
        if (totalPages <= 1) return;

        const container = document.createElement('div');
        container.id = 'paginationBar';
        container.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:12px;padding:32px 0 16px;width:100%;grid-column:1/-1;';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← ก่อนหน้า';
        prevBtn.disabled = page <= 1;
        prevBtn.style.cssText = `padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:${page <= 1 ? '#f5f5f5' : '#1a1a2e'};color:${page <= 1 ? '#aaa' : '#fff'};cursor:${page <= 1 ? 'default' : 'pointer'};font-family:inherit;font-size:0.9rem;font-weight:600;transition:all 0.2s;`;
        prevBtn.onclick = () => { this.currentPage = page - 1; this.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

        const info = document.createElement('span');
        info.style.cssText = 'color:#666;font-size:0.9rem;font-weight:500;';
        info.textContent = `หน้า ${page} / ${totalPages}  (${totalItems} รายการ)`;

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'ถัดไป →';
        nextBtn.disabled = page >= totalPages;
        nextBtn.style.cssText = `padding:10px 20px;border-radius:8px;border:1px solid #ddd;background:${page >= totalPages ? '#f5f5f5' : '#1a1a2e'};color:${page >= totalPages ? '#aaa' : '#fff'};cursor:${page >= totalPages ? 'default' : 'pointer'};font-family:inherit;font-size:0.9rem;font-weight:600;transition:all 0.2s;`;
        nextBtn.onclick = () => { this.currentPage = page + 1; this.render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

        container.appendChild(prevBtn);
        container.appendChild(info);
        container.appendChild(nextBtn);
        this.grid.parentNode.insertBefore(container, this.grid.nextSibling);
    },

    removePagination: function() {
        const old = document.getElementById('paginationBar');
        if (old) old.remove();
    },

    createCardHTML: function(p, index = 0) {
        // Price display: range if variations have different prices
        let priceStr;
        const variations = p.variations;
        if (variations && variations.length > 0) {
            const varPrices = variations.map(v => v.price || 0).filter(pr => pr > 0);
            if (varPrices.length > 0) {
                const minP = Math.min(...varPrices);
                const maxP = Math.max(...varPrices);
                priceStr = minP === maxP 
                    ? minP.toLocaleString() 
                    : `${minP.toLocaleString()} - ฿${maxP.toLocaleString()}`;
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
        
        let imgHTML = p.img ? `<img src="${p.img}" alt="${p.name}" ${loadingAttr} style="opacity: 0; transition: opacity 0.4s ease-in;" onload="this.style.opacity=1">` : `<div class="product-emoji-placeholder" style="font-size: 3rem; height: 100%; display: flex; align-items: center; justify-content: center;">${p.emoji || '📦'}</div>`;

        // Store product data using index reference (avoid HTML encoding issues)
        if (!window._paoProductMap) window._paoProductMap = {};
        window._paoProductMap[p.id] = {
            id: p.id,
            name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price,
            brand: p.brand || p.partModel || "",
            img: p.img || "",
            images: p.images || (p.img ? [p.img] : []),
            description: p.description || "",
            emoji: p.emoji || "📱",
            specs: p.specs || "",
            variations: p.variations || [],
            isOutOfStock: !!p.isOutOfStock
        };

        const cartObj = JSON.stringify({
            id: p.id,
            name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price,
            img: p.img || "",
            emoji: p.emoji || "📱",
            source: this.category || 'index'
        }).replace(/"/g, '&quot;');

        const hasVariations = p.variations && p.variations.length > 0;
        
        // If product has variations, the cart button should open the modal to let customer choose
        let cartBtnHTML;
        if (p.isOutOfStock) {
            cartBtnHTML = `<button class="btn-add-cart disabled" onclick="event.stopPropagation()">หมดชั่วคราว</button>`;
        } else if (hasVariations) {
            cartBtnHTML = `<button class="btn-add-cart" onclick="event.stopPropagation(); var prod = window._paoProductMap && window._paoProductMap['${p.id}']; if(prod && window.ProductDetail) ProductDetail.open(prod);">เลือกตัวเลือก</button>`;
        } else {
            cartBtnHTML = `<button class="btn-add-cart" onclick="event.stopPropagation(); CartAPI.add(${cartObj})">+ เพิ่มลงตะกร้า</button>`;
        }

        const soldOutClass = p.isOutOfStock ? 'sold-out' : '';
        const imgSoldOutClass = p.isOutOfStock ? 'sold-out' : '';

        return `
            <div class="product-card ${soldOutClass}" data-pid="${p.id}">
                <div class="product-img ${imgSoldOutClass}">${badgeHTML}${imgHTML}</div>
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

    attachListeners: function() {
        if (!this.grid) return;
        
        // Universal delegation for ALL categories using the product map
        this.grid.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (!card) return;
            if (e.target.closest('.btn-add-cart')) return;
            
            const pid = card.getAttribute('data-pid');
            if (!pid) return;
            
            const product = window._paoProductMap && window._paoProductMap[pid];
            if (product && window.ProductDetail) {
                window.ProductDetail.open(product);
            }
        });
    },

    initSearch: function() {
        if (!this.searchInput) return;
        const triggerRender = () => { this.currentPage = 1; this.render(); };
        
        // Use multiple events for maximum mobile compatibility
        ['input', 'keyup', 'change'].forEach(evt => {
            this.searchInput.addEventListener(evt, triggerRender);
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
                triggerRender(); 
            });
        }
    },

    filterByTag: function(tag) {
        if (this.searchInput) this.searchInput.value = tag;
        const sidebarSearch = document.getElementById('sidebarSearch');
        if (sidebarSearch) sidebarSearch.value = tag;
        this.render();
        if (window.innerWidth <= 992) {
            const grid = document.querySelector('.products-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    },

    filterByDynamicParts: function(model, type = null) {
        // Set persistent filter
        this.activeFilter = { model, type };
        
        // Clear search to avoid confusion
        if (this.searchInput) {
            this.searchInput.value = "";
            const clearBtn = document.getElementById('searchClear');
            if (clearBtn) clearBtn.style.display = 'none';
        }

        // Trigger real-time render
        this.currentPage = 1;
        this.render();

        if (window.innerWidth <= 992) {
            const grid = document.querySelector('.products-grid');
            if (grid) grid.scrollIntoView({ behavior: 'smooth' });
        }
    },

    autoOpenFromUrl: function() {
        if (this.__autoOpened) return;

        const params = new URLSearchParams(window.location.search);
        const productId = params.get('id');
        if (!productId) return;

        this.__autoOpened = true;
        const self = this;

        // Step 2: Open modal once product found — retry until ProductDetail is loaded
        const openModal = (product) => {
            const tryOpen = (n) => {
                if (n <= 0) return;
                if (window.ProductDetail && typeof window.ProductDetail.open === 'function') {
                    // For parts: sync sidebar brand
                    if (self.category === 'parts' && product.partModel) {
                        self.activeFilter.model = product.partModel;
                        self.activeFilter.type = product.partType || null;
                        const brandItem = document.querySelector(`.brand-item[data-brand="${CSS.escape(product.partModel)}"]`);
                        if (brandItem) {
                            document.querySelectorAll('.brand-item').forEach(i => i.classList.remove('active'));
                            brandItem.classList.add('active');
                        }
                        self.render();
                    }
                    window.ProductDetail.open(product);
                } else {
                    setTimeout(() => tryOpen(n - 1), 100);
                }
            };
            tryOpen(30);
        };

        // Step 1: Wait for allProducts to contain the product, else fall back to Firestore
        const tryFind = (n) => {
            const found = self.allProducts && self.allProducts.find(p => p.id === productId);
            if (found) {
                openModal(found);
                return;
            }
            if (n > 0) {
                setTimeout(() => tryFind(n - 1), 150);
                return;
            }
            // Final fallback: fetch directly from Firestore
            if (typeof db !== 'undefined' && db) {
                db.collection('products').doc(productId).get().then(doc => {
                    if (doc.exists) openModal({ id: doc.id, ...doc.data() });
                }).catch(err => console.warn('[AutoOpen] Firestore fetch failed:', err));
            }
        };

        tryFind(20); // retry up to ~3 sec, then Firestore fallback
    }
};
