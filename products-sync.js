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
        const cacheKey = `pao_cache_${this.category}`;

        // 1. Instant Cache Render (Zero-Flash)
        try {
            const cached = localStorage.getItem(cacheKey);
            const cachedTime = localStorage.getItem(cacheKey + '_time');
            if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 15 * 60 * 1000)) {
                this.allProducts = JSON.parse(cached);
                this.render();
                this.autoOpenFromUrl();
            } else {
                this.allProducts = baselineForCategory;
                if (this.allProducts.length > 0) this.render();
            }
        } catch (e) { this.allProducts = []; }

        const firestore = window.db || (typeof db !== 'undefined' ? db : null);
        if (!firestore) {
            setTimeout(() => this.listen(), 500);
            return;
        };

        // ── 0. Diagnostic Timeout: If no data after 2s, try fallback .get() immediately ──
        setTimeout(() => {
            if (!this.hasLoadedOnce) {
                console.log("[Sync] Switching to fast-fetch mode...");
                if (this.noResults) {
                    this.noResults.innerHTML = `⏳ กำลังโหลดสินค้าอย่างรวดเร็ว...`;
                }
                this.currentQuery.get().then(snapshot => {
                    if (!this.hasLoadedOnce) this.handleSnapshot(snapshot);
                }).catch(err => {
                    console.error("[Sync] Fast-fetch failed:", err);
                    if (this.noResults && !this.hasLoadedOnce) {
                        this.noResults.innerHTML = `❌ ไม่สามารถโหลดข้อมูลได้ <button onclick="location.reload()" style="background:#ee4d2d; color:white; border:none; padding:5px 10px; border-radius:5px; margin-left:10px; cursor:pointer; font-family:inherit;">ลองอีกครั้ง</button>`;
                    }
                });
            }
        }, 2000);

        // ── 1. Setup Query ──
        let query = firestore.collection('products');
        
        // Use broad server-side filter for speed
        if (this.category && this.category !== 'all') {
            let categoryList = [this.category];
            if (this.category === 'new') categoryList = ['new', 'มือ 1', 'มือหนึ่ง'];
            else if (this.category === 'used') categoryList = ['used', 'มือ 2', 'มือสอง'];
            else if (this.category === 'accessory') categoryList = ['accessory', 'อุปกรณ์', 'อุปกรณ์เสริม'];
            else if (this.category === 'parts') categoryList = ['parts', 'spare-parts', 'อะไหล่', 'อะไหล่มือถือ', 'spareparts'];
            
            query = query.where('category', 'in', categoryList);
        }
        
        // Limit to 300 for faster initial load
        query = query.limit(300);
        this.currentQuery = query;

        // ── 2. Snapshot Listeners ──
        firestore.collection('settings').doc('deleted_products').onSnapshot(doc => {
            if (doc.exists) {
                this.deletedIds = doc.data().deletedIds || [];
                this.render();
            }
        }, err => console.warn("[Sync] Deleted List Sync Error:", err));

        this.queryUnsubscribe = query.onSnapshot(snapshot => {
            this.handleSnapshot(snapshot);
        }, err => {
            console.error("[Sync] Firestore Fetch Error:", err);
            this.hasLoadedOnce = true;
            this.render();
        });
    },

    handleSnapshot: function(snapshot) {
        // Prevent double processing if .get() and onSnapshot both return
        if (this.hasLoadedOnce && snapshot.metadata && snapshot.metadata.fromCache) return;

        const firestoreProducts = snapshot.docs.map(doc => {
            const data = { id: doc.id, ...doc.data() };
            return (typeof window.optimizeProduct === 'function') ? window.optimizeProduct(data) : data;
        });

        // Robust Client-side Matching
        const isMatch = (p) => {
            const pCat = (p.category || "").toLowerCase().trim();
            const targetCat = (this.category || "").toLowerCase().trim();
            if (targetCat === 'all') return true;
            if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง';
            if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง';
            if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม';
            if (targetCat === 'parts') {
                const partsSynonyms = ['parts', 'spare-parts', 'อะไหล่', 'อะไหล่มือถือ', 'spareparts'];
                if (partsSynonyms.includes(pCat)) return true;
                if (p.partModel || p.partType) return true; // Fallback
                return false;
            }
            return pCat === targetCat;
        };

        const matchingFirestore = firestoreProducts.filter(isMatch);
        console.log(`[Sync] Data arrived. Received ${firestoreProducts.length}, Matched ${matchingFirestore.length} for ${this.category}`);

        const mergedMap = new Map();
        // Baseline for fallback
        const baselineForCategory = MOCK_PRODUCTS_BASELINE.filter(p => p.category === this.category);
        baselineForCategory.forEach(p => mergedMap.set(p.id, p));
        // Overwrite with live Firestore data
        matchingFirestore.forEach(p => mergedMap.set(p.id, p));

        const finalProducts = Array.from(mergedMap.values()).filter(p => !this.deletedIds.includes(p.id));
        this.allProducts = finalProducts;
        this.hasLoadedOnce = true;
        this.debounceRender();

        // Cache update
        const cacheKey = `pao_cache_${this.category}`;
        try {
            const optimizedCache = finalProducts.map(p => {
                const op = { ...p };
                if (op.description && op.description.length > 400) op.description = op.description.substring(0, 400) + '...';
                if (op.images && op.images.length > 2) op.images = op.images.slice(0, 2);
                return op;
            });
            localStorage.setItem(cacheKey, JSON.stringify(optimizedCache));
            localStorage.setItem(cacheKey + '_time', Date.now().toString());
        } catch(e) {}

        this.autoOpenFromUrl();
    },

    initSearch: function() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.currentPage = 1;
                this.debounceRender();
            });
        }
    },

    attachListeners: function() {
        // Handle sub-category clicks if any
    },

    filterByDynamicParts: function(model, type = null) {
        this.activeFilter = { model, type };
        this.currentPage = 1;
        
        // Update URL to reflect filter
        const url = new URL(window.location);
        if (model) url.searchParams.set('model', model);
        else url.searchParams.delete('model');
        if (type) url.searchParams.set('type', type);
        else url.searchParams.delete('type');
        window.history.replaceState({}, '', url);

        this.render();
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
            filtered = filtered.filter(p => {
                const name = (p.name || "").toLowerCase();
                const brand = (p.brand || "").toLowerCase();
                const tags = (p.tags || []).join(" ").toLowerCase();
                return name.includes(searchVal) || brand.includes(searchVal) || tags.includes(searchVal);
            });
        }

        if (this.activeFilter.model) {
            filtered = filtered.filter(p => p.partModel === this.activeFilter.model);
            if (this.activeFilter.type) {
                filtered = filtered.filter(p => p.partType === this.activeFilter.type);
            }
        }

        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        if (this.currentPage > totalPages && totalPages > 0) this.currentPage = totalPages;

        if (filtered.length === 0) {
            this.grid.style.display = 'none';
            if (this.noResults) {
                this.noResults.style.display = 'block';
                if (this.hasLoadedOnce) {
                    this.noResults.innerHTML = `🔍 ไม่พบ${this.category === 'parts' ? 'อะไหล่' : 'สินค้า'}ที่ค้นหา`;
                }
            }
            return;
        }

        if (this.noResults) this.noResults.style.display = 'none';
        this.grid.style.display = 'grid';

        const start = (this.currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        this.grid.innerHTML = pageItems.map(p => {
            const id = p.id;
            const img = (p.images && p.images[0]) || p.img || "";
            const name = p.name || "ไม่มีชื่อสินค้า";
            const price = p.price || 0;
            const promoPrice = p.promoPrice;
            const badge = p.badge || "";
            const emoji = p.emoji || "📦";

            let imageHtml = img 
                ? `<img src="${img}" alt="${name}" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'product-emoji\'>${emoji}</div>';">`
                : `<div class="product-emoji">${emoji}</div>`;

            return `
                <div class="product-card" onclick="ProductDetail.open('${id}')">
                    <div class="product-image">
                        ${badge ? `<span class="product-badge">${badge}</span>` : ""}
                        ${imageHtml}
                    </div>
                    <div class="product-info">
                        <div class="product-brand">${p.brand || ""}</div>
                        <h3 class="product-title">${name}</h3>
                        <div class="product-price-row">
                            <span class="product-price">฿${(promoPrice || price).toLocaleString()}</span>
                            ${promoPrice ? `<span class="product-price-old">฿${price.toLocaleString()}</span>` : ""}
                        </div>
                        <div class="product-footer">
                            <span class="add-to-cart-btn"><span class="plus">+</span> เพิ่มลงตะกร้า</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.renderPagination(totalPages);
    },

    renderPagination: function(totalPages) {
        let container = document.getElementById('pagination');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pagination';
            container.className = 'pagination';
            this.grid.after(container);
        }

        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        let html = '';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="ProductSync.setPage(${i})">${i}</button>`;
        }
        container.innerHTML = html;
    },

    setPage: function(page) {
        this.currentPage = page;
        this.render();
        window.scrollTo({ top: this.grid.offsetTop - 100, behavior: 'smooth' });
    },

    autoOpenFromUrl: function() {
        const params = new URLSearchParams(window.location.search);
        const openId = params.get('p');
        if (openId && typeof ProductDetail !== 'undefined') {
            setTimeout(() => ProductDetail.open(openId), 500);
        }
        
        const model = params.get('model');
        const type = params.get('type');
        if (model || type) {
            this.activeFilter = { model, type };
            this.render();
        }
    }
};
