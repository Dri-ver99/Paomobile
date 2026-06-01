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
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", badge: "โปรแรง", tags: ["สายชาร์จ", "anidary", "anc007", "โปรโมชั่น", "ราคาพิเศษ", "อุปกรณ์เสริม", "accessory"] },
  { id: "p-1777193687630", name: "แบตเตอรี่ OnePlus 10R / 10 Pro (BLP-925)", brand: "OnePlus", category: "parts", partModel: "OnePlus", partType: "แบตเตอรี่", price: 750, emoji: "📦", img: "https://ivnayulkvlxjnwfwjxmj.supabase.co/storage/v1/object/public/images/products/migrated_1780218284135_sds5z.jpg" },
  { id: "p-1779185468516", name: "แพรตูดชาร์จ Realme C21Y", brand: "Realme", category: "parts", partModel: "OPPO", partType: "แพรตูดชาร์จ", price: 350, emoji: "📦", img: "https://ivnayulkvlxjnwfwjxmj.supabase.co/storage/v1/object/public/images/products/migrated_1780218704627_pbr0e.jpg" },
  { id: "p-1777194124544", name: "แบตเตอรี่ OPPO A57 4G / A57s / A58 5G / A77 5G / A78 5G / A97 5G / C51 / Realme 11x 5G (BLP-923)", brand: "OPPO", category: "parts", partModel: "OPPO", partType: "แบตเตอรี่", price: 550, emoji: "📦", img: "https://ivnayulkvlxjnwfwjxmj.supabase.co/storage/v1/object/public/images/products/migrated_1780218287406_yh82y.jpg" },
  { id: "p-1779255207369", name: "แพรตูดชาร์จ Realme C51 / C53", brand: "Realme", category: "parts", partModel: "OPPO", partType: "แพรตูดชาร์จ", price: 400, emoji: "📦", img: "https://ivnayulkvlxjnwfwjxmj.supabase.co/storage/v1/object/public/images/products/migrated_1780218710319_1ul3u.jpg" }
];
const ITEMS_PER_PAGE = 12;

// CSS for Skeleton Loader
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes skeleton-loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
    `;
    document.head.appendChild(style);
}

console.error("PRODUCTS-SYNC.JS PARSED!");

const ProductSync = {
    init: function(category) {
        console.error("PRODUCTSYNC INIT STARTED WITH CATEGORY:", category);
        this.category = category;
        this.grid = document.getElementById('productGrid') || document.querySelector('.products-grid');
        this.noResults = document.getElementById('noResults') || document.getElementById('noResultsMsg');
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
        this.allProducts = null;
        this.hasLoadedOnce = false;

        // INSTANT LOCAL PREVIEW FIX
        if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
            console.log("[Sync] INSTANT LOCAL PREVIEW.");
            let sourceData = MOCK_PRODUCTS_BASELINE;
            if (window.FALLBACK_LIVE_DATA) {
                sourceData = Array.isArray(window.FALLBACK_LIVE_DATA) ? window.FALLBACK_LIVE_DATA : (window.FALLBACK_LIVE_DATA.value || MOCK_PRODUCTS_BASELINE);
            }
            this.allProducts = sourceData.filter(p => {
                const pCat = (p.category || "").toLowerCase().trim();
                const targetCat = (this.category || "").toLowerCase().trim();
                if (targetCat === 'all') return true;
                if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง';
                if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง';
                if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม';
                if (targetCat === 'parts') return pCat === 'parts' || pCat === 'อะไหล่';
                return pCat === targetCat;
            });
            
            // Read local deletions
            try {
                const localDeletions = JSON.parse(localStorage.getItem('deleted_mock_ids'));
                if (Array.isArray(localDeletions)) {
                    this.deletedIds = localDeletions;
                }
            } catch(e) {}
            
            this.hasLoadedOnce = true;
            this.render();
            return; // Safe to return because we injected all products locally
        }

        const baselineForCategory = MOCK_PRODUCTS_BASELINE.filter(p => p.category === this.category);
        const baselineIds = new Set(baselineForCategory.map(p => p.id));
        const cacheKey = `pao_cache_${this.category}`;

        // 1. Instant Cache Render (Zero-Flash) with TTL
        let isCacheValid = false;
        try {
            const cached = localStorage.getItem(cacheKey);
            const cachedTime = localStorage.getItem(cacheKey + '_time');
            // 15 minutes TTL
            if (cached && cachedTime && (Date.now() - parseInt(cachedTime) < 15 * 60 * 1000)) {
                isCacheValid = true;
            }

            if (cached) {
                this.allProducts = JSON.parse(cached);
                this.render();
                this.autoOpenFromUrl();
            } else {
                // DO NOT render baseline immediately if it's empty or placeholder-heavy
                // Instead, keep the "Loading..." state visible in HTML until Firestore returns
                // Try FALLBACK_LIVE_DATA first
                const checkFallback = (fallbackArray) => {
                    this.allProducts = fallbackArray;
                };

                if (this.allProducts && this.allProducts.length === 0 && window.FALLBACK_LIVE_DATA) {
                    const fallbackArray = Array.isArray(window.FALLBACK_LIVE_DATA) ? window.FALLBACK_LIVE_DATA : (window.FALLBACK_LIVE_DATA.value || []);
                    checkFallback(fallbackArray);
                    console.log("[Sync] errCb: Fallback to window.FALLBACK_LIVE_DATA. Found:", this.allProducts.length);
                }
                
                if (this.allProducts && this.allProducts.length > 0) {
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
                const data = doc.data();
                this.deletedIds = (data.value && data.value.deletedIds) ? data.value.deletedIds : (data.deletedIds || []);
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
        
        // Limit increased from 60 to 400 to load many products while avoiding Supabase statement timeouts
        query = query.limit(1000);
        
        // Add a limit for safety (prevents massive accidental reads)
        // Use onSnapshot for instant loading via Firestore local cache and real-time updates
        query.onSnapshot(snapshot => {
            console.log("ONSNAPSHOT RETURNED DOCS:", snapshot.docs.length);
            const firestoreProducts = snapshot.docs.map(doc => {
                const data = doc.data();
                if (data.img && typeof data.img === 'string' && !data.img.startsWith('http') && !data.img.startsWith('data:image')) {
                    if (data.img.length > 100 && !data.img.toLowerCase().includes('.jpg') && !data.img.toLowerCase().includes('.png') && !data.img.toLowerCase().includes('.webp')) {
                        data.img = 'data:image/jpeg;base64,' + data.img;
                    }
                }
                if (data.images && Array.isArray(data.images)) {
                    data.images = data.images.map(img => {
                        if (img && typeof img === 'string' && !img.startsWith('http') && !img.startsWith('data:image')) {
                            if (img.length > 100 && !img.toLowerCase().includes('.jpg') && !img.toLowerCase().includes('.png') && !img.toLowerCase().includes('.webp')) {
                                return 'data:image/jpeg;base64,' + img;
                            }
                        }
                        return img;
                    });
                }
                return { id: doc.id, ...data };
            });
            
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

            // ── Seller-Edit-First Merge Logic ──
            const mergedMap = new Map();

            // 1. Start with baseline (lowest priority)
            baselineForCategory.forEach(p => mergedMap.set(p.id, p));

            // 2. Overwrite with live Firestore data (highest priority)
            matchingFirestore.forEach(p => mergedMap.set(p.id, p));

            const finalProducts = Array.from(mergedMap.values());
            this.allProducts = finalProducts;
            this.hasLoadedOnce = true;
            
            this.debounceRender();

            // Always refresh cache with latest Firestore data so next page load
            // shows the most up-to-date Seller edits.
            try {
                let optimizedCache = finalProducts.map(p => {
                    const op = { ...p };
                    if (op.description && op.description.length > 200) {
                        op.description = op.description.substring(0, 200) + '...';
                    }
                    if (op.images && op.images.length > 1) {
                        op.images = op.images.slice(0, 1);
                    }
                    // Prevent giant base64 strings from blowing up cache
                    if (op.img && op.img.length > 1000 && op.img.startsWith('data:image')) {
                        op.img = ""; 
                        op.hasImg = false;
                    }
                    return op;
                });
                
                localStorage.setItem(cacheKey, JSON.stringify(optimizedCache));
                localStorage.setItem(cacheKey + '_time', Date.now().toString());
            } catch(e) {
                console.warn('[Sync] Cache save failed', e);
                // If cache is still full, clear it so stale data doesn't persist
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(cacheKey + '_time');
            }

            this.autoOpenFromUrl();
        }, err => {
            console.error("[Sync] Firestore Fetch Error:", err);
            this.hasLoadedOnce = true;
            this.fetchError = err;
            if (!this.allProducts || this.allProducts.length === 0) {
                this.allProducts = baselineForCategory; // Fallback to baseline
            }
            if (this.noResults && this.allProducts.length === 0) {
                this.noResults.innerHTML = `<div style="text-align:center; padding:60px 20px; width:100%;"><h3 style="color:red; margin-bottom:10px;">Error fetching products</h3><p style="color:#666;">${err.message || JSON.stringify(err)}</p></div>`;
            }
            this.render();
        });
    },

    debounceRender: function() {
        if (this.__renderTimer) clearTimeout(this.__renderTimer);
        this.__renderTimer = setTimeout(() => this.render(), 50);
    },

    render: function() {
        console.log("RENDER CALLED. allProducts length:", this.allProducts ? this.allProducts.length : 'null');
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
                if (this.hasLoadedOnce && !this.fetchError) {
                    let buttonHtml = '';
                    if (this.searchInput && this.searchInput.value) {
                        buttonHtml = "<button onclick=\"const i = document.getElementById('productSearch'); if(i){ i.value=''; i.dispatchEvent(new Event('input')); }\" style=\"padding: 12px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; border: none; border-radius: 99px; font-size: 1.05rem; font-weight: 600; font-family: 'Noto Sans Thai', sans-serif; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.2);\" onmouseover=\"this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(234, 88, 12, 0.3)';\" onmouseout=\"this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(234, 88, 12, 0.2)';\">ล้างคำค้นหา</button>";
                    } else {
                        buttonHtml = "<a href=\"index.html\" style=\"padding: 12px 32px; background: linear-gradient(135deg, #111827, #374151); color: #fff; text-decoration: none; border-radius: 99px; font-size: 1.05rem; font-weight: 600; font-family: 'Noto Sans Thai', sans-serif; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(17, 24, 39, 0.15);\" onmouseover=\"this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 25px rgba(17, 24, 39, 0.25)';\" onmouseout=\"this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(17, 24, 39, 0.15)';\">กลับหน้าหลัก</a>";
                    }

                    this.noResults.innerHTML = `
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px 20px 60px; background: transparent; margin: -20px auto 40px; max-width: 600px; width: 100%;">
                            
                            <div style="width: 140px; height: 140px; background: radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0) 70%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: emptyFloat 3s ease-in-out infinite;">
                                <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            
                            <h3 style="color: #111827; margin-bottom: 12px; font-size: 1.4rem; font-weight: 700; font-family: 'Noto Sans Thai', sans-serif; text-align: center;">ไม่พบ${this.category === 'parts' ? 'อะไหล่' : 'สินค้า'}ที่คุณต้องการ</h3>
                            
                            <p style="color: #6b7280; font-size: 1rem; text-align: center; max-width: 400px; line-height: 1.6; margin-bottom: 28px; font-family: 'Noto Sans Thai', sans-serif;">
                                ${this.searchInput && this.searchInput.value ? 'ลองเปลี่ยนคำค้นหาใหม่ดูอีกครั้ง หรือเลือกดูสินค้าทั้งหมดในร้านได้เลยครับ' : 'ขออภัยครับ ยังไม่มีสินค้ารายการนี้ในระบบในขณะนี้'}
                            </p>
                            
                            ` + buttonHtml + `
                            
                            <style>
                                @keyframes emptyFloat {
                                    0% { transform: translateY(0px); }
                                    50% { transform: translateY(-10px); }
                                    100% { transform: translateY(0px); }
                                }
                            </style>
                        </div>
                    `;
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
        if (typeof this.lazyLoadImages === 'function') {
            this.lazyLoadImages(pageItems);
        }
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

    lazyLoadImages: async function(pageItems) {
        const missing = pageItems.filter(p => !p.img && p.hasImg !== false);
        if (missing.length === 0) return;
        
        const ids = missing.map(p => p.id);
        try {
            const { data, error } = await window.supabase.from('products').select('id, img').in('id', ids);
            if (data) {
                data.forEach(d => {
                    const prod = this.allProducts.find(p => p.id === d.id);
                    if (prod) {
                        let fetchedImg = d.img || null;
                        if (fetchedImg && typeof fetchedImg === 'string' && !fetchedImg.startsWith('http') && !fetchedImg.startsWith('data:image')) {
                            if (fetchedImg.length > 100 && !fetchedImg.toLowerCase().includes('.jpg') && !fetchedImg.toLowerCase().includes('.png') && !fetchedImg.toLowerCase().includes('.webp')) {
                                fetchedImg = 'data:image/jpeg;base64,' + fetchedImg;
                            }
                        }
                        prod.img = fetchedImg;
                        prod.hasImg = true;
                        if (prod.img) {
                            const card = document.querySelector(`.product-card[data-pid="${d.id}"] .product-img`);
                            if (card) {
                                const placeholder = card.querySelector('.product-emoji-placeholder') || card.querySelector('.product-img-skeleton');
                                if (placeholder) {
                                    let imgSrc = prod.img;
                                    if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
                                        imgSrc = encodeURI(imgSrc);
                                    }
                                    const imgEl = document.createElement('img');
                                    imgEl.src = imgSrc;
                                    imgEl.alt = prod.name;
                                    imgEl.style.opacity = '0';
                                    imgEl.style.transition = 'opacity 0.4s ease-in';
                                    imgEl.onload = () => imgEl.style.opacity = '1';
                                    card.innerHTML = '';
                                    card.appendChild(imgEl);
                                }
                            }
                            if (window._paoProductMap && window._paoProductMap[d.id]) {
                                window._paoProductMap[d.id].img = prod.img;
                                if (!window._paoProductMap[d.id].images || window._paoProductMap[d.id].images.length === 0) {
                                    window._paoProductMap[d.id].images = [prod.img];
                                }
                            }
                        }
                    }
                });
            }
        } catch(e) { console.error('Failed to lazy load images', e); }
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
        
        let imgSrc = p.img || '';
        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:image')) {
            if (imgSrc.length > 100 && !imgSrc.toLowerCase().includes('.jpg') && !imgSrc.toLowerCase().includes('.png') && !imgSrc.toLowerCase().includes('.webp')) {
                imgSrc = 'data:image/jpeg;base64,' + imgSrc;
            } else {
                imgSrc = encodeURI(imgSrc);
            }
        }
        let imgHTML = p.img ? `<img src="${imgSrc}" alt="${p.name}" ${loadingAttr} style="opacity: 0; transition: opacity 0.4s ease-in;" onload="this.style.opacity=1" onerror="this.style.opacity=1; console.error('Failed to load image:', this.src)">` : `<div class="product-img-skeleton" style="width: 100%; height: 100%; background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-loading 1.5s infinite; border-radius: 8px;"></div>`;

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
            cartBtnHTML = `<button class="btn-add-cart" onclick="event.stopPropagation(); CartAPI.add(window._paoProductMap['${p.id}'])">+ เพิ่มลงตะกร้า</button>`;
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

window.ProductSync = ProductSync;








