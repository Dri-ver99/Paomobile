const MOCK_PRODUCTS_BASELINE = [];
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

        // Force clear old mock caches for all categories
        if (!localStorage.getItem('pao_cache_v8_clean_all_mock')) {
            localStorage.removeItem('pao_cache_new');
            localStorage.removeItem('pao_cache_new_time');
            localStorage.removeItem('pao_cache_used');
            localStorage.removeItem('pao_cache_used_time');
            localStorage.removeItem('pao_cache_accessory');
            localStorage.removeItem('pao_cache_accessory_time');
            localStorage.removeItem('pao_seller_cache');
            localStorage.setItem('pao_cache_v8_clean_all_mock', 'true');
        }

        this.listen();
        this.initSearch();
        this.attachListeners();
    },

    // filterByDynamicParts is defined below (near line 496) — single definition to avoid conflicts

    listen: function() {
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
                this.allProducts = baselineForCategory;
                if (this.allProducts.length > 0) {
                    this.render();
                }
            }
        } catch (e) {
            this.allProducts = [];
        }

        // (Legacy Firebase db check removed for Supabase)

        const supabase = window.supabaseClient;
        if (!supabase) {
            setTimeout(() => this.listen(), 500);
            return;
        }

        const handleDeletedSettings = (data) => {
            if (data) {
                this.deletedIds = data.deletedIds || (data.value && data.value.deletedIds) || [];
                this.render();
            }
        };

        supabase.from('settings').select('*').eq('id', 'deleted_products').single().then(({data}) => handleDeletedSettings(data));

        supabase.channel('public:settings:products-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.deleted_products' }, payload => {
                handleDeletedSettings(payload.new);
            }).subscribe();

        // 2. Optimized Real-time Supabase Listen
        let query = supabase.from('products').select('*');
        
        // Server-side filtering with Synonym Support (Thai/English)
        if (this.category && this.category !== 'all') {
            let categoryList = [this.category];
            
            // Map synonyms for broader server-side matching
            if (this.category === 'new') categoryList = ['new', 'มือ 1', 'มือหนึ่ง', 'สินค้าใหม่'];
            else if (this.category === 'used') categoryList = ['used', 'มือ 2', 'มือสอง', 'สินค้ามือสอง'];
            else if (this.category === 'accessory') categoryList = ['accessory', 'อุปกรณ์', 'อุปกรณ์เสริม'];
            else if (this.category === 'parts') categoryList = ['parts', 'อะไหล่', 'อะไหล่มือถือ', 'อะไหล่โทรศัพท์'];
            
            query = query.in('category', categoryList);
        }
        
        // Add a limit for safety (prevents massive accidental reads)
        query = query.limit(1000); 

        const fetchProducts = async () => {
            const { data: snapshotDocs, error } = await query;
            if (error) { console.warn("Supabase fetch error:", error); return; }
            if (!snapshotDocs) return;

            const firestoreProducts = snapshotDocs.map(doc => ({ ...doc }));
            
            // Client-side fallback for synonyms (if any were missed by the server query)
            const isMatch = (p) => {
                const pCat = (p.category || "").toLowerCase().trim();
                const targetCat = (this.category || "").toLowerCase().trim();
                
                if (targetCat === 'all') return true;
                if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง' || pCat === 'สินค้าใหม่';
                if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง' || pCat === 'สินค้ามือสอง';
                if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม';
                if (targetCat === 'parts') return pCat === 'parts' || pCat === 'อะไหล่' || pCat === 'อะไหล่มือถือ' || pCat === 'อะไหล่โทรศัพท์';
                
                return pCat === targetCat;
            };

            const matchingFirestore = firestoreProducts.filter(isMatch);

            // ── Seller-Edit-First Merge Logic ──
            const mergedMap = new Map();

            // 1. Start with baseline (lowest priority)
            baselineForCategory.forEach(p => mergedMap.set(p.id, p));

            // 2. Overwrite with latest DB data (highest priority)
            matchingFirestore.forEach(p => mergedMap.set(p.id, p));

            const finalProducts = Array.from(mergedMap.values());
            this.allProducts = finalProducts;
            this.hasLoadedOnce = true;
            
            this.debounceRender();

            // Always refresh cache with latest DB data so next page load
            // shows the most up-to-date Seller edits.
            try {
                // Strip massive data to prevent QuotaExceededError which breaks the fast-load cache
                const optimizedCache = finalProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    brand: p.brand,
                    category: p.category,
                    partModel: p.partModel,
                    partType: p.partType,
                    img: p.img,
                    emoji: p.emoji,
                    badge: p.badge,
                    isOutOfStock: p.isOutOfStock,
                    tags: p.tags,
                    specs: p.specs,
                    variations: p.variations ? p.variations.map(v => ({ price: v.price })) : undefined
                }));
                localStorage.setItem(cacheKey, JSON.stringify(optimizedCache));
                localStorage.setItem(cacheKey + '_time', Date.now().toString());
            } catch (e) {
                console.warn("[Sync] Cache write fail:", e);
            }

            this.autoOpenFromUrl();
        };

        fetchProducts();

        supabase.channel('public:products:products-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
                fetchProducts();
            }).subscribe();
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
        if (this.activeFilter.model || this.activeFilter.type) {
            const targetModel = (this.activeFilter.model || '').toLowerCase().trim();
            const targetType = (this.activeFilter.type || '').toLowerCase().trim();

            filtered = filtered.filter(p => {
                let matchModel = true;
                if (targetModel) {
                    const pModel = ((p.partModel || '') + ' ' + (p.brand || '') + ' ' + (p.name || '') + ' ' + (p.tags || []).join(' ')).toLowerCase().trim();
                    const tm = targetModel.toLowerCase().trim();

                    if (tm === 'iphone' || tm === 'apple') {
                        matchModel = pModel.includes('iphone') || pModel.includes('apple') || pModel.includes('ไอโฟน');
                    } else if (tm === 'ipad') {
                        matchModel = pModel.includes('ipad') || pModel.includes('ไอแพด');
                    } else if (tm === 'samsung') {
                        matchModel = pModel.includes('samsung') || pModel.includes('ซัมซุง') || pModel.includes('galaxy');
                    } else if (tm === 'oppo') {
                        matchModel = pModel.includes('oppo') || pModel.includes('ออปโป้');
                    } else if (tm === 'realme') {
                        matchModel = pModel.includes('realme') || pModel.includes('เรียลมี');
                    } else if (tm === 'xiaomi') {
                        matchModel = pModel.includes('xiaomi') || pModel.includes('เสียวหมี่') || pModel.includes('redmi') || pModel.includes('poco');
                    } else if (tm === 'vivo') {
                        matchModel = pModel.includes('vivo') || pModel.includes('วีโว่');
                    } else if (tm === 'huawei') {
                        matchModel = pModel.includes('huawei') || pModel.includes('หัวเว่ย');
                    } else {
                        matchModel = pModel.includes(tm) || tm.includes((p.brand || '___').toLowerCase());
                    }
                }

                let matchType = true;
                if (targetType) {
                    const rawPType = (p.partType || '').toLowerCase().trim();
                    const pType = (rawPType + ' ' + (p.name || '') + ' ' + (p.tags || []).join(' ')).toLowerCase().trim();

                    // Direct match on partType first if available
                    if (rawPType && (rawPType === targetType || rawPType.includes(targetType) || targetType.includes(rawPType))) {
                        matchType = true;
                    } else if (targetType.includes('หน้าจอ') || targetType.includes('จอ') || targetType.includes('lcd') || targetType.includes('oled')) {
                        matchType = pType.includes('หน้าจอ') || pType.includes('จอ') || pType.includes('lcd') || pType.includes('oled');
                    } else if (targetType.includes('แบต')) {
                        matchType = pType.includes('แบต') || pType.includes('battery');
                    } else if (targetType.includes('สวิตช์') || targetType.includes('volume') || targetType.includes('เปิด/ปิด') || targetType.includes('ปุ่ม')) {
                        matchType = pType.includes('สวิตช์') || pType.includes('volume') || pType.includes('เปิด') || pType.includes('ปิด') || pType.includes('ปุ่ม') || (pType.includes('แพร') && (pType.includes('สวิต') || pType.includes('vol')));
                    } else if (targetType.includes('ตูดชาร์จ') || targetType.includes('ชาร์จ')) {
                        matchType = pType.includes('ชาร์จ') || pType.includes('แพรชาร์จ') || pType.includes('ตูดชาร์จ') || pType.includes('charge');
                    } else if (targetType.includes('กล้อง')) {
                        matchType = pType.includes('กล้อง') || pType.includes('camera');
                    } else if (targetType.includes('แพร')) {
                        matchType = pType.includes('แพร') || pType.includes('flex');
                    } else {
                        const keywords = targetType.replace(/[()\/+]/g, ' ').split(/\s+/).filter(w => w.length > 1);
                        matchType = keywords.length === 0 || keywords.some(kw => pType.includes(kw));
                    }
                }

                return matchModel && matchType;
            });
        }

        // Apply Filter for Global Deletions
        if (this.deletedIds && this.deletedIds.length > 0) {
            filtered = filtered.filter(p => !this.deletedIds.includes(p.id));
        }

        if (filtered.length === 0) {
            this.grid.innerHTML = '';
            this.grid.style.display = 'none';
            if (this.noResults) {
                this.noResults.style.display = 'block';
                const label = this.activeFilter.type || this.activeFilter.model || '';
                let emptyIcon = '📦';
                let emptyTitle = 'ยังไม่มีสินค้าในหมวดหมู่นี้';
                let emptyBtnText = 'ดูสินค้าทั้งหมด';

                if (this.category === 'parts') {
                    emptyIcon = '🔧';
                    emptyTitle = label ? `ยังไม่มีอะไหล่ในหมวดหมู่ "${label}"` : 'ยังไม่มีอะไหล่ในหมวดหมู่นี้';
                    emptyBtnText = 'ดูอะไหล่ทั้งหมด';
                } else if (this.category === 'new') {
                    emptyIcon = '📱';
                    emptyTitle = label ? `ยังไม่มีสินค้ามือ 1 ในหมวดหมู่ "${label}"` : 'ยังไม่มีสินค้ามือ 1 ในขณะนี้';
                } else if (this.category === 'used') {
                    emptyIcon = '🔁';
                    emptyTitle = label ? `ยังไม่มีสินค้ามือ 2 ในหมวดหมู่ "${label}"` : 'ยังไม่มีสินค้ามือ 2 ในขณะนี้';
                } else if (this.category === 'accessory') {
                    emptyIcon = '🎧';
                    emptyTitle = label ? `ยังไม่มีอุปกรณ์เสริมในหมวดหมู่ "${label}"` : 'ยังไม่มีสินค้าอุปกรณ์เสริมในขณะนี้';
                } else if (label) {
                    emptyTitle = `ยังไม่มีสินค้าในหมวดหมู่ "${label}"`;
                }

                this.noResults.innerHTML = `
                    <div style="text-align:center; padding:50px 20px; width:100%; max-width:600px; margin:0 auto;">
                        <div style="font-size:3.5rem; margin-bottom:12px;">${emptyIcon}</div>
                        <h3 style="font-size:1.25rem; color:#18181b; font-weight:700; margin-bottom:8px;">${emptyTitle}</h3>
                        <p style="color:#71717a; font-size:0.92rem; margin-bottom:20px; line-height:1.6;">ขณะนี้ยังไม่มีสินค้าในระบบ คุณสามารถเลือกดูหมวดหมู่อื่น หรือค้นหาสินค้ารายการอื่นได้ครับ</p>
                        <button onclick="ProductSync.filterByDynamicParts(null, null)" class="btn btn-primary" style="padding:10px 24px; border-radius:100px; font-weight:600;">${emptyBtnText}</button>
                    </div>
                `;
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
        
        let imgSrc = p.img ? (p.img.startsWith('http') ? p.img : encodeURI(p.img)) : '';
        let imgHTML = p.img ? `<img src="${imgSrc}" alt="${p.name}" ${loadingAttr}>` : `<div class="product-emoji-placeholder" style="font-size: 3rem; height: 100%; display: flex; align-items: center; justify-content: center;">${p.emoji || '📦'}</div>`;

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

        const clearBtns = document.querySelectorAll('#heroSearchClear, #searchClear, .search-clear');
        clearBtns.forEach(clearBtn => {
            const updateClearVisibility = () => {
                clearBtn.style.display = this.searchInput.value ? 'flex' : 'none';
            };
            this.searchInput.addEventListener('input', updateClearVisibility);
            this.searchInput.addEventListener('keyup', updateClearVisibility);
            this.searchInput.addEventListener('change', updateClearVisibility);
            updateClearVisibility();

            clearBtn.addEventListener('click', (e) => { 
                e.preventDefault();
                e.stopPropagation();
                this.searchInput.value = ""; 
                clearBtn.style.display = 'none'; 
                this.activeFilter = { model: null, type: null };
                document.querySelectorAll('.brand-item').forEach(i => i.classList.remove('active'));
                triggerRender();
                this.searchInput.focus();
            });
        });
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

    filterByDynamicParts: function(model, type) {
        // Normalize values: empty strings become null
        model = model || null;
        type = type || null;

        console.log('[Parts] filterByDynamicParts called:', { model, type });

        // Set persistent filter
        this.activeFilter = { model: model, type: type };
        
        // Clear search to avoid confusion
        if (this.searchInput) {
            this.searchInput.value = "";
        }
        // Clear both search clear buttons (hero + overlay)
        const heroSearchClear = document.getElementById('heroSearchClear');
        if (heroSearchClear) heroSearchClear.style.display = 'none';
        const searchClear = document.getElementById('searchClear');
        if (searchClear) searchClear.style.display = 'none';

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
            // Final fallback: fetch directly from Supabase
            const supabase = window.supabaseClient;
            if (supabase) {
                supabase.from('products').select('*').eq('id', productId).single().then(({data, error}) => {
                    if (data && !error) openModal({ id: data.id, ...data });
                }).catch(err => console.warn('[AutoOpen] Supabase fetch failed:', err));
            }
        };

        tryFind(20); // retry up to ~3 sec, then Firestore fallback
    }
};

window.ProductSync = ProductSync;
