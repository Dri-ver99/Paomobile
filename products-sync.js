// ── Static baseline products (always shown, not deletable from UI) ──────────
const MOCK_PRODUCTS_BASELINE = [
  { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", emoji: "📱", description: "iPhone 15 มาพร้อม Dynamic Island, กล้องหลัก 48MP และ USB-C", specs: "หน้าจอ 6.1\" · ชิป A16 · รับประกัน 1 ปี", badge: "ใหม่" },
  { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", emoji: "📱", description: "iPhone 15 Pro ชิป A17 Pro ดีไซน์ไทเทเนียม กล้องหลัก 48MP", specs: "หน้าจอ 6.1\" · ชิป A17 Pro · ไทเทเนียม", badge: "ขายดี" },
  { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", emoji: "📲", description: "Galaxy S24 มาพร้อม Galaxy AI ที่จะช่วยให้การใช้ชีวิตสะดวกสบายยิ่งขึ้น", specs: "หน้าจอ 6.2\" · Snapdragon 8 Gen 3 · AI", badge: "ใหม่" },
  { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", emoji: "📲", description: "Xiaomi 14 พัฒนาร่วมกับ Leica กล้องประสิทธิภาพสูง", specs: "หน้าจอ 6.36\" · Snapdragon 8 Gen 3 · Leica", badge: "" },
  { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", emoji: "📱", description: "iPhone 13 มือสองสภาพนางฟ้า 90% การันตีแบตเตอรี่ 88%", specs: "สภาพ 90% · แบต 88% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", emoji: "📱", description: "iPhone 12 มือสอง สภาพดี 85% แบตเตอรี่ 82%", specs: "สภาพ 85% · แบต 82% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", description: "Galaxy S23 มือสอง สภาพสวย 92% แบตเตอรี่ 90%", specs: "สภาพ 92% · แบต 90% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", description: "Galaxy A54 มือสอง สภาพดี 88% แบตเตอรี่ 85%", specs: "สภาพ 88% · แบต 85% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", description: "OPPO Reno 8 Pro มือสอง สภาพใช้งาน 87%", specs: "สภาพ 87% · แบต 83% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 60W-1 Type C To C - 1.jpg", images: ["Why 60W-1 Type C To C - 1.jpg", "Why 60W-1 Type C To C - 2.jpg", "Why 60W-1 Type C To C - 3.jpg"], description: "สายชาร์จ Why 60W Type C To C ชาร์จเร็วและเสถียร รับประกัน 1 เดือน", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "ใหม่" },
  { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 20w-1.jpg", images: ["Why 20w-1.jpg", "Why 20w-2.jpg", "Why 20w-3.jpg"], description: "ชุดชาร์จ Why ขนาด 20W ชาร์จเร็วและเสถียร รับประกัน 1 เดือน", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "ใหม่" },
  { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", emoji: "🎧", img: "earphone-1.jpg", images: ["earphone-1.jpg", "earphone-2.jpg", "earphone-3.jpg", "earphone-4.jpg"], description: "หูฟัง Anidary ANT004 คุณภาพดี เบสแน่น ดีไซน์สวย", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "" },
  { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", emoji: "🔌", img: "ANS006-1.jpg", images: ["ANS006-1.jpg", "ANS006-2.jpg", "ANS006-3.jpg"], description: "ชุดชาร์จ Anidary ANS006 คุณภาพดี รับประกัน 1 เดือน", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "" },
  { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", emoji: "🔌", img: "Why-1.jpg", images: ["Why-1.jpg", "Why-2.jpg", "Why-3.jpg", "Why-4.jpg"], description: "สายชาร์จ Why USB ความยาว 1.0 เมตร มีให้เลือก Micro, Type-C และ iPhone", specs: "ประเภทพอร์ต: Micro / Type-C / iPhone", badge: "" },
  { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", emoji: "🔌", img: "USB-I 12W-1.jpg", images: ["USB-I 12W-1.jpg", "USB-I 12W-2.jpg", "USB-I 12W-3.jpg"], description: "สายชาร์จ Anidary ANC001 USB to Lightning คุณภาพสูง ทนทาน", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "" },
  { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", images: ["Anidary Type c To c - 1.jpg", "Anidary Type c To c - 2.jpg", "Anidary Type c To c - 3.jpg", "Anidary Type c To c - 4.jpg"], description: "สายชาร์จ Anidary ANC007 Type C to C ชาร์จเร็วและเสถียร แข็งแรงทนทาน", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "" },
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", images: ["Anidary Type c To c - 1.jpg", "Anidary Type c To c - 2.jpg", "Anidary Type c To c - 3.jpg", "Anidary Type c To c - 4.jpg"], description: "โปรโมชั่นพิเศษ! สายชาร์จ Anidary ANC007 Type C to C ในราคาเพียง 1 บาทเท่านั้น!", specs: "แตะเพื่อดูรูปภาพเพิ่มเติม", badge: "โปรโมชั่น 1฿" },
  
  // --- Baseline Spare Parts ---
  { id: "part-screen-iph13", name: "จอ iPhone 13 (งานแท้)", price: 3500, brand: "Apple", category: "parts", emoji: "🔧", description: "หน้าจอ iPhone 13 งานแท้ สีสันคมชัด ทัชลื่น รับประกัน 6 เดือน", specs: "งานแท้ · รับประกัน 6 เดือน", badge: "ยอดนิยม" },
  { id: "part-batt-iph11", name: "แบตเตอรี่ iPhone 11 (เพิ่มความจุ)", price: 1200, brand: "Apple", category: "parts", emoji: "🔋", description: "แบตเตอรี่ iPhone 11 เกรดมอก. เพิ่มความจุ ใช้งานได้นานกว่าเดิม", specs: "มอก. · เพิ่มความจุ · รับประกัน 1 ปี", badge: "ขายดี" },
  { id: "part-screen-s23u", name: "จอ Samsung S23 Ultra (OLED)", price: 6500, brand: "Samsung", category: "parts", emoji: "🔧", description: "หน้าจอ Samsung S23 Ultra งาน OLED สีสวยสดใส รองรับการสแกนนิ้ว", specs: "OLED · รองรับสแกนนิ้ว · รับประกัน 6 เดือน", badge: "เกรดพรีเมียม" },
  { id: "part-charging-iph12", name: "ชุดแพรชาร์จ iPhone 12", price: 890, brand: "Apple", category: "parts", emoji: "🔌", description: "แพรตูดชาร์จ iPhone 12 แก้ปัญหาชาร์จไม่เข้า ไมค์ไม่ดัง", specs: "ของใหม่ · รับประกัน 3 เดือน", badge: "" }
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

        if (!this.grid) return;
        this.listen();
        this.initSearch();
    },

    listen: function() {
        const baselineForCategory = MOCK_PRODUCTS_BASELINE.filter(p => p.category === this.category);
        const baselineIds = new Set(baselineForCategory.map(p => p.id));
        const cacheKey = `pao_cache_${this.category}`;

        // 1. Instant Cache Render
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                this.allProducts = JSON.parse(cached);
                this.render();
            } else {
                this.allProducts = baselineForCategory;
                this.render();
            }
        } catch (e) {
            this.allProducts = baselineForCategory;
            this.render();
        }

        if (typeof db === 'undefined' || !db) return;

        // 2. Data Sync (Real-time update)
        db.collection('products')
            .where('category', '==', this.category)
            .onSnapshot(snapshot => {
                console.log(`[Sync] Real-time data received for ${this.category}: ${snapshot.size} items`);
                const firestoreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const firestoreIds = new Set(firestoreProducts.map(p => p.id));

                const newOnes = firestoreProducts.filter(p => !baselineIds.has(p.id));
                const mergedBaseline = baselineForCategory.map(p =>
                    firestoreIds.has(p.id) ? firestoreProducts.find(f => f.id === p.id) : p
                );

                const finalProducts = [...newOnes, ...mergedBaseline];
                this.allProducts = finalProducts;
                this.render();
                localStorage.setItem(cacheKey, JSON.stringify(finalProducts));
            }, err => {
                console.error("[Sync] Firestore Listen Error:", err);
            });
    },

    render: function() {
        if (!this.allProducts || !this.grid) return;

        const searchVal = this.searchInput ? this.searchInput.value.toLowerCase() : "";
        let filtered = this.allProducts;

        if (searchVal) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchVal) ||
                (p.brand && p.brand.toLowerCase().includes(searchVal)) ||
                (p.partModel && p.partModel.toLowerCase().includes(searchVal)) ||
                (p.partType && p.partType.toLowerCase().includes(searchVal)) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(searchVal)))
            );
        }

        // Apply Dynamic Category Filter (Real-time persistent)
        if (this.activeFilter.model && this.activeFilter.type) {
            filtered = filtered.filter(p => 
                p.partModel === this.activeFilter.model && 
                p.partType === this.activeFilter.type
            );
        }

        if (filtered.length === 0) {
            this.grid.style.display = 'none';
            if (this.noResults) this.noResults.style.display = 'block';
            this.removePagination();
            return;
        }

        this.grid.style.display = 'grid';
        if (this.noResults) this.noResults.style.display = 'none';

        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const page = Math.max(1, Math.min(this.currentPage, totalPages));
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

        this.grid.innerHTML = pageItems.map(p => this.createCardHTML(p)).join('');
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

    createCardHTML: function(p) {
        const priceStr = p.price ? p.price.toLocaleString() : "0";
        const badgeClass = p.badge === 'ใหม่' ? 'new' : (p.badge === 'ขายดี' ? 'hot' : 'used');
        const badgeHTML = p.badge ? `<div class="product-badge ${badgeClass}">${p.badge}</div>` : "";
        let imgHTML = p.img ? `<img src="${p.img}" alt="${p.name}">` : `<div class="product-emoji-placeholder" style="font-size: 3rem; height: 100%; display: flex; align-items: center; justify-content: center;">${p.emoji || '📦'}</div>`;

        const detailObj = JSON.stringify({
            id: p.id,
            name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price,
            brand: p.brand || p.partModel || "",
            img: p.img || "",
            images: p.images || [p.img],
            description: p.description || "",
            emoji: p.emoji || "📱",
            specs: p.specs || ""
        }).replace(/"/g, '&quot;');

        const cartObj = JSON.stringify({
            id: p.id,
            name: p.name + (this.category === 'used' ? ' (มือ 2)' : ''),
            price: p.price,
            img: p.img || "",
            emoji: p.emoji || "📱"
        }).replace(/"/g, '&quot;');

        return `
            <div class="product-card" onclick="ProductDetail.open(${detailObj})">
                <div class="product-img">${badgeHTML}${imgHTML}</div>
                <div class="product-info">
                    <div class="product-brand">${p.brand || p.partModel || ''}</div>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-specs">${p.specs || 'แตะเพื่อดูรูปภาพเพิ่มเติม'}</div>
                    <div class="product-price">฿${priceStr}</div>
                </div>
                <button class="btn-add-cart" onclick="event.stopPropagation(); CartAPI.add(${cartObj})">+ เพิ่มลงตะกร้า</button>
            </div>
        `;
    },

    initSearch: function() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener('input', () => this.render());
        const clearBtn = document.getElementById('searchClear');
        if (clearBtn) {
            this.searchInput.addEventListener('input', () => clearBtn.style.display = this.searchInput.value ? 'block' : 'none');
            clearBtn.addEventListener('click', () => { this.searchInput.value = ""; clearBtn.style.display = 'none'; this.render(); });
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

    filterByDynamicParts: function(model, type) {
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
    }
};
