// --- Robust Error Handling & Diagnosis ---
window.addEventListener('error', function(e) {
    console.error("❌ Script Error:", e.message, "at", e.filename, ":", e.lineno);
});

let allProducts = [];
let deletedMockIds = JSON.parse(localStorage.getItem('deleted_mock_ids') || '[]');
let currentCategory = 'all';

function initTabs() {
    if (typeof setFilterCategory === 'function') {
        setFilterCategory(currentCategory);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat');
    if (catParam) currentCategory = catParam;

    initAuth();
    // Start sync immediately to show mock data at least, while waiting for Auth
    startSync();

    // 2. Handle Tab Clicks
    const tabContainer = document.getElementById('categoryTabs');
    if (tabContainer) {
        tabContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab-btn');
            if (btn && btn.dataset.cat) {
                setFilterCategory(btn.dataset.cat);
            }
        });
    }

    // 3. Handle cross-page actions
    setTimeout(() => {
        const action = urlParams.get('action');
        if (action === 'add') {
            if (typeof openAddModal === 'function') openAddModal();
        } else if (action === 'manage_cat') {
            if (typeof openCategoryModal === 'function') openCategoryModal();
        }
    }, 50);
});

function initAuth() {
    const indicator = document.getElementById('statusIndicator');
    const authEmail = document.getElementById('authEmail');
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const SELLER_EMAIL = "sattawat2560@gmail.com";
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';

    // 0. Instant Local Admin UI Update (Zero-Flash for Admin)
    if (localAdminActive) {
        if (authEmail) authEmail.textContent = SELLER_EMAIL + " (จำสิทธิ์ 🔒)";
        if (indicator) indicator.className = 'admin-status-dot online';
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        const submitBtn = document.getElementById('btnSubmitForm');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.textContent = "💾 บันทึกสินค้า";
        }
        const catBtn = document.getElementById('btnManageCat');
        if (catBtn) catBtn.disabled = false;
    }

    firebase.auth().onAuthStateChanged(user => {
        if (user || localAdminActive) {
            const email = user ? (user.email || (user.providerData && user.providerData[0] && user.providerData[0].email) || "").toLowerCase() : SELLER_EMAIL.toLowerCase();
            const isAdmin = email.trim() === SELLER_EMAIL.toLowerCase().trim();
            
            if (authEmail) authEmail.textContent = email + (user ? "" : " (จำสิทธิ์ 🔒)");
            if (indicator) {
                indicator.classList.remove('online', 'warning', 'offline');
                indicator.classList.add(isAdmin ? 'online' : 'warning');
            }
            
            // Clear Timeout
            if (window.authCheckTimeout) clearTimeout(window.authCheckTimeout);

            if (isAdmin) {
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                const submitBtn = document.getElementById('btnSubmitForm');
                if (submitBtn) {
                   submitBtn.disabled = false;
                   submitBtn.style.opacity = "1";
                   submitBtn.textContent = "💾 บันทึกสินค้า";
                }
                const catBtn = document.getElementById('btnManageCat');
                if (catBtn) catBtn.disabled = false;
                localStorage.setItem('paomobile_admin_active', 'true');
            } else {
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'block';
            }
            startSync();
            if (typeof startConfigSync === 'function') startConfigSync(); 
        } else {
            const isFileProtocol = window.location.protocol === 'file:';
            if (indicator) indicator.className = 'admin-status-dot offline';
            if (authEmail) authEmail.textContent = isFileProtocol ? "โหมด Local" : "กรุณาล็อกอิน Admin";
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    });

    // Safety Timeout: 3 seconds to check Auth
    window.authCheckTimeout = setTimeout(() => {
        if (authEmail && authEmail.textContent.includes('กำลังตรวจสอบ')) {
            authEmail.textContent = "ออฟไลน์ (เปิดไฟล์จากเครื่อง 🏠)";
            if (indicator) indicator.className = 'admin-status-dot offline';
            console.warn("Auth check timed out. Showing offline status.");
        }
    }, 3000);
}

window.sellerLogin = function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });
    firebase.auth().signInWithPopup(provider).catch(err => {
        if (window.location.protocol === 'file:') {
            alert("⚠️ ล็อกอินไม่ได้เนื่องจากเปิดไฟล์ตรงๆ กรุณาใช้ปุ่ม 'บังคับสิทธิ์ Admin (Local)' แทนครับ");
        }
    });
};

window.sellerLogout = function() {
    localStorage.removeItem('paomobile_admin_active');
    firebase.auth().signOut().then(() => window.location.reload());
};

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

function startSync() {
    // 1. Instant Cache/Baseline Render (Zero-Flash)
    const cached = localStorage.getItem('pao_seller_cache');
    if (cached) {
        try {
            allProducts = JSON.parse(cached);
            document.getElementById('productCountStatus').textContent = "สินค้าทั้งหมด: " + allProducts.length + " (โหลดจากแคช ⚡)";
            filterProducts();
        } catch(e) { allProducts = [...MOCK_PRODUCTS_BASELINE]; }
    } else {
        allProducts = [...MOCK_PRODUCTS_BASELINE];
        filterProducts();
    }

    if (typeof db === 'undefined' || !db) {
        setTimeout(startSync, 1000); // Retry sync when db is ready
        return;
    }

    // sync logic for deleted items
    db.collection('settings').doc('deleted_products').onSnapshot(doc => {
        if (doc.exists) {
            const globalDeleted = doc.data().deletedIds || [];
            deletedMockIds = [...new Set([...deletedMockIds, ...globalDeleted])];
            localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));
        }
    });

    // 2. Real-time Firebase Sync
    db.collection('products').onSnapshot(snapshot => {
        console.log(`[Real-time] Received update: ${snapshot.size} items from Cloud`);
        const firestoreProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Merge: baseline + firestore
        const mergedMap = new Map();
        MOCK_PRODUCTS_BASELINE.forEach(p => {
            // Restore logic: If it's one of the 4 original parts, we ignore the local "deleted" flag
            const isOriginalPart = p.id.endsWith('-orig');
            if (isOriginalPart || !deletedMockIds.includes(p.id)) {
                mergedMap.set(p.id, p);
            }
        });
        
        firestoreProducts.forEach(p => mergedMap.set(p.id, p));
        allProducts = Array.from(mergedMap.values());

        // Cache for next time with QuotaExceededError protection
        try {
            localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts));
        } catch (e) {
            try {
                // If full data is too big, cache only the text data (light version)
                const lightProducts = allProducts.map(p => ({ ...p, img: "", images: [] }));
                localStorage.setItem('pao_seller_cache', JSON.stringify(lightProducts));
            } catch (e2) { /* Totally full */ }
        }
        
        // Instant visual update
        const countStatus = document.getElementById('productCountStatus');
        if (countStatus) {
            countStatus.textContent = "สินค้าทั้งหมด: " + allProducts.length + " (เชื่อมต่อ Cloud ✅)";
        }
        
        updateBrandsDatalist();
        filterProducts();
    }, err => {
        console.error("Firestore error:", err);
        const countStatus = document.getElementById('productCountStatus');
        if (countStatus) {
            countStatus.textContent = "สินค้าทั้งหมด: " + (allProducts ? allProducts.length : 0) + " (ออฟไลน์ ⚠️)";
        }
    });
}

function togglePartsFields() {
    const select = document.getElementById('formCategory');
    if (!select) return;
    const cat = select.value;
    const fields = document.getElementById('partsFields');
    if (fields) {
        fields.style.display = (cat === 'parts') ? 'grid' : 'none';
        
        // Auto-select first available if currently empty
        if (cat === 'parts') {
            const mSelect = document.getElementById('formPartModel');
            if (mSelect && !mSelect.value && sparePartsConfig.models && sparePartsConfig.models.length > 0) {
                mSelect.value = sparePartsConfig.models[0];
                refreshPartTypeDropdown();
            }
        }
    }
}

function setFilterCategory(cat) {
    currentCategory = cat;
    
    // Update Tab UI
    const tabs = document.querySelectorAll('.tabs-nav .tab-btn');
    tabs.forEach(t => {
        // Match by data-cat attribute
        if (t.dataset.cat === cat) t.classList.add('active');
        else t.classList.remove('active');
    });

    filterProducts();
}
window.setFilterCategory = setFilterCategory;

function updateBrandsDatalist() {
    const datalist = document.getElementById('brandsList');
    if (!datalist) return;
    
    const brands = [...new Set(allProducts.map(p => p.brand).filter(b => b))].sort();
    datalist.innerHTML = brands.map(b => `<option value="${b}">`).join('');
}

function filterProducts() {
    const tbody = document.getElementById('product-list-body');
    if (!tbody) return;
    const searchVal = document.getElementById('productSearch').value.toLowerCase().trim();

    console.log(`[Filter] Category: ${currentCategory}, Search: "${searchVal}"`);

    let filtered = allProducts;
    
    // 1. Filter by Category
    if (currentCategory && currentCategory !== 'all') {
        filtered = filtered.filter(p => {
            const pCat = (p.category || "").toLowerCase().trim();
            const targetCat = (currentCategory || "").toLowerCase().trim();
            
            // Map common synonyms for robustness
            if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1';
            if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2';
            if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์';
            if (targetCat === 'parts') return pCat === 'parts' || pCat === 'อะไหล่';
            
            return pCat === targetCat;
        });
    }
    
    // 2. Filter by Search
    if (searchVal) {
        filtered = filtered.filter(p => 
            (p.name || "").toLowerCase().includes(searchVal) || 
            (p.brand || "").toLowerCase().includes(searchVal) ||
            (p.category || "").toLowerCase().includes(searchVal) ||
            (p.partModel || "").toLowerCase().includes(searchVal) ||
            (p.partType || "").toLowerCase().includes(searchVal)
        );
    }

    console.log(`[Filter] Results: ${filtered.length} items`);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">ไม่พบสินค้าในหมวดหมู่นี้</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr data-id="${p.id}">
            <td class="product-img-cell">
                ${p.img ? `<img src="${p.img}" class="product-img-mini">` : `<div class="product-img-mini">${p.emoji || '📦'}</div>`}
            </td>
            <td>
                <div class="product-name-info">
                    <div class="product-name-txt">${p.name} ${p.isOutOfStock ? '<span style="color:#ff4d4f; font-size:0.7rem; border:1px solid #ff4d4f; padding:1px 4px; border-radius:4px; margin-left:5px;">OUT OF STOCK</span>' : ''}</div>
                    <div class="product-sku-txt">
                        ${p.brand} 
                        ${p.badge ? `· <span style="color:#ee4d2d">${p.badge}</span>` : ''}
                        ${p.category === 'parts' && p.partModel ? `· <span style="color:#2f54eb; font-weight:600;">[${p.partModel}]</span>` : ''}
                        ${p.category === 'parts' && p.partType ? `<br><small style="color:#888;">${p.partType}</small>` : ''}
                    </div>
                </div>
            </td>
            <td class="mobile-hide-on-card"><span class="category-tag tag-${p.category}">${getCategoryName(p.category)}</span></td>
            <td class="mobile-hide-on-card"><div class="price-txt">฿${(p.price || 0).toLocaleString()}</div></td>
            <td class="actions-cell">
                <div class="mobile-card-details" style="display:none;">
                    <span class="category-tag tag-${p.category}">${getCategoryName(p.category)}</span>
                    <div class="price-txt">฿${(p.price || 0).toLocaleString()}</div>
                </div>
                <button class="btn-edit" onclick="openEditModal('${p.id}')">แก้ไข</button>
                <button class="btn-delete" onclick="deleteProduct('${p.id}')">ลบ</button>
            </td>
        </tr>
    `).join('');
}

function getCategoryName(cat) {
    if (cat === 'new') return 'มือ 1';
    if (cat === 'used') return 'มือ 2';
    if (cat === 'accessory') return 'Accessory';
    if (cat === 'parts') return 'อะไหล่';
    return cat;
}

// ── Variations Management ──────────────────────────────────────────
let variationImages = {}; // Track base64 strings for each variation row

window.addVariationRow = function(data = null) {
    const container = document.getElementById('variationContainer');
    const hint = document.getElementById('noVariationHint');
    if (!container) return;
    
    if (hint) hint.style.display = 'none';
    
    const rowId = data?.id || "v-" + Date.now() + Math.random().toString(16).slice(2, 5);
    const row = document.createElement('div');
    row.className = 'variation-row';
    row.dataset.id = rowId;
    row.style.cssText = "display: flex; gap: 20px; align-items: start; background: #fff; padding: 18px; border-radius: 12px; border: 1px solid #ddd; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.04);";
    
    // Initial image state
    if (data && data.img) variationImages[rowId] = data.img;

    row.innerHTML = `
        <div style="flex-shrink: 0;">
            <div style="position: relative; width: 80px; height: 80px; border-radius: 10px; border: 1px dashed #bbb; overflow: hidden; background: #f8f9fa; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="this.nextElementSibling.click()">
                ${variationImages[rowId] ? `<img src="${variationImages[rowId]}" style="width: 100%; height: 100%; object-fit: cover;">` : '<span style="font-size: 2rem;">🖼️</span>'}
                <div style="absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.5); color: #fff; font-size: 0.65rem; text-align: center; padding: 4px; pointer-events: none;">เปลี่ยนรูป</div>
            </div>
            <input type="file" accept="image/*" style="display: none;" onchange="handleVariationImgUpload(event, '${rowId}')">
        </div>
        
        <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div style="grid-column: span 2;">
                <label style="display: block; font-size: 0.75rem; color: #888; margin-bottom: 4px; font-weight: 600;">ชื่อตัวเลือกสินค้า</label>
                <input type="text" placeholder="เช่น สีขาว, 128GB, งานเครื่องแท้..." value="${data?.name || ''}" class="v-name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem; font-weight: 600;">
            </div>
            
            <div>
                <label style="display: block; font-size: 0.75rem; color: #888; margin-bottom: 4px; font-weight: 600;">ราคาของตัวเลือกนี้ (฿)</label>
                <div style="position: relative;">
                    <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; color: #999;">฿</span>
                    <input type="number" placeholder="0" value="${data?.price || ''}" class="v-price" style="width: 100%; padding: 10px 10px 10px 25px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; font-size: 0.95rem; font-weight: 700; color: #ee4d2d;">
                </div>
            </div>
            
            <div style="grid-column: span 2; display: flex; align-items: center; gap: 8px; background: #fffcf5; padding: 10px; border-radius: 8px; border: 1px solid #f9da8b;">
                <input type="checkbox" class="v-stock" id="stock-${rowId}" ${data?.isOutOfStock ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                <label for="stock-${rowId}" style="font-size: 0.85rem; font-weight: 700; color: #856404; cursor: pointer;">ทำเครื่องหมายว่า "หมด" (Out of Stock)</label>
            </div>
        </div>
        
        <button type="button" onclick="removeVariationRow(this)" style="background: #fff1f0; border: 1px solid #ffa39e; color: #ff4d4f; cursor: pointer; font-size: 1rem; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#ff4d4f'; this.style.color='#fff';" onmouseout="this.style.background='#fff1f0'; this.style.color='#ff4d4f';">&times;</button>
    `;
    
    container.appendChild(row);
}

window.removeVariationRow = function(btn) {
    const row = btn.closest('.variation-row');
    const rowId = row.dataset.id;
    delete variationImages[rowId];
    row.remove();
    
    const container = document.getElementById('variationContainer');
    const hint = document.getElementById('noVariationHint');
    if (container && container.children.length === 0 && hint) {
        hint.style.display = 'block';
    }
}

window.handleVariationImgUpload = function(event, rowId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX = 600; // Smaller for variations
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
                if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                else { w = Math.round(w * MAX / h); h = MAX; }
            }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            variationImages[rowId] = dataUrl;
            
            // Update preview
            const row = document.querySelector(`.variation-row[data-id="${rowId}"]`);
            const previewContainer = row.querySelector('div[onclick]');
            previewContainer.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function deleteAllProducts() {
    if (!confirm('🚨 คำเตือนสูงสุด: คุณแน่ใจหรือไม่ว่าต้องการ "ลบสินค้าทั้งหมด" จากระบบ Cloud?\n\nการกระทำนี้ไม่สามารถย้อนคืนได้ และจะทำให้หน้าเว็บร้านค้าว่างเปล่าทันที!')) return;
    if (!confirm('กดยืนยันอีกครั้งเพื่อเริ่มการลบสินค้าทั้งหมด...')) return;
    
    const indicator = document.getElementById('statusIndicator');
    if (indicator) indicator.style.background = '#faad14'; // Warning color
    
    try {
        if (typeof db === 'undefined' || !db || !checkCloudPermission()) return;
        
        // 1. Clear Local State
        allProducts = [];
        localStorage.removeItem('pao_seller_cache');
        
        // 2. Add Baseline product IDs to "deleted" list to hide them too
        const baselineIds = MOCK_PRODUCTS_BASELINE.map(p => p.id);
        deletedMockIds = [...new Set([...deletedMockIds, ...baselineIds])];
        localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));
        
        // 3. Batch delete from Firestore
        const productsRef = db.collection('products');
        const snapshot = await productsRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        
        // Update deleted settings
        batch.set(db.collection('settings').doc('deleted_products'), {
            deletedIds: deletedMockIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        await batch.commit();
        
        alert('✅ ลบสินค้าทั้งหมดเรียบร้อยแล้วครับ! ระบบกำลังรีโหลด...');
        window.location.reload();
    } catch (err) {
        console.error('Delete All Error:', err);
        alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
    }
}
window.deleteAllProducts = deleteAllProducts;

// ── Image Upload State ──────────────────────────────────────────────
let uploadedImages = []; // array of base64 data URLs

function handleImgUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Compress/resize before storing
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let w = img.width, h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
                uploadedImages.push(dataUrl);
                refreshImgPreviews();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    // Reset so same file can be re-uploaded if needed
    event.target.value = '';
}

let draggedImgIndex = null;

function refreshImgPreviews() {
    const row = document.getElementById('imgPreviewRow');
    if (!row) return;
    
    row.innerHTML = uploadedImages.map((src, i) => `
        <div class="img-drag-item" 
             draggable="true" 
             ondragstart="handleDragStart(${i})" 
             ondragover="handleDragOver(event, ${i})" 
             ondragleave="handleDragLeave(event)"
             ondrop="handleDrop(event, ${i})"
             ondragend="handleDragEnd(event)"
             style="position:relative; width:70px; height:70px; border-radius:8px; border:2px solid ${i===0?'#ee4d2d':'#ddd'}; overflow:hidden; background:#eee; cursor:zoom-in;"
             onclick="viewFullImage(${i})">
            <img src="${src}" style="width:100%; height:100%; object-fit:cover;">
            ${i===0 ? '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(238,77,45,0.85);color:#fff;font-size:0.6rem;text-align:center;padding:2px;">หน้าหลัก</div>' : ''}
            <button type="button" onclick="event.stopPropagation(); removeImg(${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;z-index:10;">✕</button>
        </div>
    `).join('');
    // Update hidden inputs
    document.getElementById('formImg').value = uploadedImages[0] || '';
    document.getElementById('formImagesJSON').value = JSON.stringify(uploadedImages);
}

function handleDragStart(index) {
    draggedImgIndex = index;
    // Delay adding class so the ghost image is visible
    setTimeout(() => {
        const items = document.querySelectorAll('.img-drag-item');
        if (items[index]) items[index].classList.add('dragging');
    }, 0);
}

function handleDragOver(e, index) {
    e.preventDefault();
    const items = document.querySelectorAll('.img-drag-item');
    items.forEach(item => item.classList.remove('drag-over'));
    if (index !== draggedImgIndex) {
        items[index].classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e, targetIndex) {
    e.preventDefault();
    if (draggedImgIndex === null || draggedImgIndex === targetIndex) return;

    // Reorder the array
    const movedItem = uploadedImages.splice(draggedImgIndex, 1)[0];
    uploadedImages.splice(targetIndex, 0, movedItem);
    
    refreshImgPreviews();
}

function handleDragEnd(e) {
    draggedImgIndex = null;
    document.querySelectorAll('.img-drag-item').forEach(item => {
        item.classList.remove('dragging');
        item.classList.remove('drag-over');
    });
}

function removeImg(index) {
    uploadedImages.splice(index, 1);
    refreshImgPreviews();
}
// ── Image Viewer Functions ─────────────────────────────────────────
function viewFullImage(index) {
    const src = uploadedImages[index];
    if (!src) return;
    
    const modal = document.getElementById('imageViewerModal');
    const fullImg = document.getElementById('fullSizeImg');
    const caption = document.getElementById('ivCaption');
    
    fullImg.src = src;
    caption.textContent = `รูปภาพที่ ${index + 1} ${index === 0 ? '(รูปหน้าหลัก)' : ''}`;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}

function closeImageViewer() {
    const modal = document.getElementById('imageViewerModal');
    modal.classList.remove('open');
    setTimeout(() => {
        modal.style.display = 'none';
        document.getElementById('fullSizeImg').src = '';
    }, 300);
}
// ────────────────────────────────────────────────────────────────────

function openAddModal() {
    document.getElementById('modalTitle').textContent = "เพิ่มสินค้าใหม่";
    document.getElementById('formProductId').value = "";
    document.getElementById('productForm').reset();
    uploadedImages = [];
    refreshImgPreviews();
    togglePartsFields(); // Reset parts fields visibility

    // Reset Variations
    document.getElementById('variationContainer').innerHTML = '';
    document.getElementById('noVariationHint').style.display = 'block';
    variationImages = {};

    // Safety: Disable save button if not logged in as Admin
    const submitBtn = document.getElementById('btnSubmitForm');
    if (submitBtn) {
        const user = firebase.auth().currentUser;
        const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
        const isAdmin = (user && user.email && user.email.toLowerCase() === "sattawat2560@gmail.com") || localAdminActive;
        
        submitBtn.disabled = !isAdmin;
        submitBtn.style.opacity = isAdmin ? "1" : "0.5";
        if (isAdmin) submitBtn.textContent = "💾 บันทึกสินค้า";
    }

    // Reset stock status
    const stockSelect = document.getElementById('formStockStatus');
    if (stockSelect) stockSelect.value = "in_stock";

    document.getElementById('productModal').style.display = 'flex';
}

function openEditModal(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    document.getElementById('modalTitle').textContent = "แก้ไขสินค้า";
    document.getElementById('formProductId').value = p.id;
    document.getElementById('formName').value = p.name;
    document.getElementById('formBrand').value = p.brand || '';
    document.getElementById('formPrice').value = p.price;
    document.getElementById('formCategory').value = p.category;
    document.getElementById('formDescription').value = p.description || "";
    document.getElementById('formEmoji').value = p.emoji || "";
    document.getElementById('formBadge').value = p.badge || "";
    document.getElementById('formSpecs').value = p.specs || "";

    // Load Stock Status
    const stockSelect = document.getElementById('formStockStatus');
    if (stockSelect) {
        stockSelect.value = p.isOutOfStock ? "out_of_stock" : "in_stock";
    }

    // Spare parts specific loading
    if (p.category === 'parts') {
        document.getElementById('formPartModel').value = p.partModel || "";
        document.getElementById('formPartType').value = p.partType || "";
    }
    togglePartsFields();

    // Restore uploaded images from existing product data
    if (p.images && p.images.length) {
        uploadedImages = [...p.images];
    } else if (p.img) {
        uploadedImages = [p.img];
    } else {
        uploadedImages = [];
    }
    refreshImgPreviews();
    document.getElementById('formPartType').value = p.partType || ""; // Then set the value
    
    // Variations loading
    const vContainer = document.getElementById('variationContainer');
    vContainer.innerHTML = '';
    variationImages = {};
    if (p.variations && p.variations.length > 0) {
        document.getElementById('noVariationHint').style.display = 'none';
        p.variations.forEach(v => addVariationRow(v));
    } else {
        document.getElementById('noVariationHint').style.display = 'block';
    }

    document.getElementById('productModal').style.display = 'flex';
}

function updatePartTypeDropdown() {
    refreshPartTypeDropdown();
}

function refreshPartTypeDropdown() {
    const model = document.getElementById('formPartModel').value;
    const pSelect = document.getElementById('formPartType');
    if (!pSelect) return;

    // Get current selection to try and preserve it if still valid
    const currentVal = pSelect.value;
    
    let allowedTypes = [];
    if (model && sparePartsConfig.mappings && sparePartsConfig.mappings[model]) {
        allowedTypes = sparePartsConfig.mappings[model];
    } else {
        // If no model selected or no mapping, show all as fallback
        allowedTypes = sparePartsConfig.partTypes || [];
    }

    pSelect.innerHTML = '<option value="">-- เลือกประเภทอะไหล่ --</option>' + 
        allowedTypes.map(t => `<option value="${t}">${t}</option>`).join('');
    
    // Restore value if it's in the new list
    if (allowedTypes.includes(currentVal)) {
        pSelect.value = currentVal;
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitForm');
    if (btn) {
        btn.disabled = true;
        btn.textContent = "กำลังบันทึก...";
    }

    try {
        const id = document.getElementById('formProductId').value || ("p-" + Date.now());
        const imagesArr = uploadedImages.length ? uploadedImages : [];
        const data = {
            id: id,
            name: document.getElementById('formName').value,
            brand: document.getElementById('formBrand').value,
            price: parseFloat(document.getElementById('formPrice').value) || 0,
            category: document.getElementById('formCategory').value,
            description: document.getElementById('formDescription').value,
            emoji: document.getElementById('formEmoji').value || "📦",
            img: imagesArr[0] || document.getElementById('formImg').value || "",
            images: imagesArr,
            badge: document.getElementById('formBadge').value,
            specs: document.getElementById('formSpecs').value,
            partModel: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartModel').value : "",
            partType: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartType').value : "",
            variations: Array.from(document.querySelectorAll('.variation-row')).map(row => {
                const rid = row.dataset.id;
                return {
                    id: rid,
                    name: row.querySelector('.v-name').value,
                    price: parseFloat(row.querySelector('.v-price').value) || 0,
                    img: variationImages[rid] || "",
                    isOutOfStock: row.querySelector('.v-stock').checked
                };
            }),
            isOutOfStock: document.getElementById('formStockStatus').value === 'out_of_stock',
            lastUpdatedBy: (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser.email : "local-seller",
            updatedAt: new Date().toISOString()
        };

        // --- 1. Immediate Local Update (Zero-Flash) ---
        if (!Array.isArray(allProducts)) allProducts = [];
        const existingIndex = allProducts.findIndex(p => p.id === id);
        if (existingIndex > -1) {
            allProducts[existingIndex] = data;
        } else {
            allProducts.unshift(data); // Add to top
        }
        
        // Save to Cache with protection against QuotaExceededError (LocalStorage limit)
        try {
            localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts));
        } catch (e) {
            console.warn("⚠️ LocalStorage full, saving partial cache without images...");
            try {
                // Fallback: Save a lightweight version without heavy image strings to keep the list functional
                const lightProducts = allProducts.map(p => ({ ...p, img: "", images: [] }));
                localStorage.setItem('pao_seller_cache', JSON.stringify(lightProducts));
            } catch (e2) {
                console.error("❌ LocalStorage completely failed:", e2);
            }
        }
        
        // Auto-switch to the category of the saved product so it is immediately visible
        if (typeof setFilterCategory === 'function') {
            setFilterCategory(data.category);
        } else if (typeof filterProducts === 'function') {
            filterProducts();
        }
        
        closeModal();

        // --- 2. Background Cloud Sync (Optional) ---
        if (typeof db !== 'undefined' && db && checkCloudPermission()) {
            await db.collection('products').doc(id).set(data, { merge: true });
            console.log("☁️ Cloud Sync Successful");
        }
    } catch (err) {
        console.error("❌ Submission Error:", err);
        alert("เกิดข้อผิดพลาดในการบันทึก: " + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "💾 บันทึกสินค้า";
        }
    }
}

async function deleteProduct(id) {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return;
    
    // --- 1. Immediate Local Delete ---
    allProducts = allProducts.filter(p => p.id !== id);
    
    // Save to Cache with protection against QuotaExceededError
    try {
        localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts));
    } catch (e) {
        try {
            const lightProducts = allProducts.map(p => ({ ...p, img: "", images: [] }));
            localStorage.setItem('pao_seller_cache', JSON.stringify(lightProducts));
        } catch (e2) { /* Totally full */ }
    }
    
    filterProducts();

    // --- 2. Background Cloud Sync ---
    try {
        if (typeof db !== 'undefined' && db && checkCloudPermission()) {
            // A. If it's a real Cloud product, delete it
            await db.collection('products').doc(id).delete();
            
            // B. If it's a Mock Baseline product, add it to the global deleted list
            const isMock = MOCK_PRODUCTS_BASELINE.some(m => m.id === id);
            if (isMock) {
                if (!deletedMockIds.includes(id)) {
                    deletedMockIds.push(id);
                    localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));
                    
                    await db.collection('settings').doc('deleted_products').set({
                        deletedIds: firebase.firestore.FieldValue.arrayUnion(id),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                }
            }
            
            console.log("🗑️ Cloud Delete Successful");
        }
    } catch(err) {
        console.warn("⚠️ Cloud Delete Failed. Deleted locally only.", err);
    }
}
window.deleteProduct = deleteProduct;

// Clear cache if needed (V2 update)
// localStorage.removeItem('pao_seller_cache');

async function runMigration() {
    if (!confirm("🚨 ยืนยันการนำเข้าข้อมูลเดิมทั้งหมด (21 รายการ) คืนสู่ Cloud ใช่หรือไม่?")) return;
    
    // Check Permission first!
    if (!checkCloudPermission()) return;

    const migrationBtn = document.querySelector('#migrationBanner button');
    migrationBtn.disabled = true;
    migrationBtn.textContent = "กำลังกู้คืนข้อมูล...";

    try {
        const batch = db.batch();
        MOCK_PRODUCTS_BASELINE.forEach(p => {
            const ref = db.collection('products').doc(p.id);
            batch.set(ref, {
                ...p,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
        
        // 2. Also clear deletion flags for THESE baseline items
        const baselineIds = MOCK_PRODUCTS_BASELINE.map(p => p.id);
        deletedMockIds = deletedMockIds.filter(id => !baselineIds.includes(id));
        localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));

        // 3. Update the global deleted list in Cloud to clear them too
        await db.collection('settings').doc('deleted_products').set({
            deletedIds: deletedMockIds,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        await batch.commit();
        alert("✅ นำเข้าข้อมูลสินค้า 21 รายการเรียบร้อยแล้วครับ!");
        window.location.reload();
        alert("✅ กู้คืนข้อมูล Cloud สำเร็จแล้วครับ! สินค้าทั้งหมดกลับมาแล้ว");
        localStorage.removeItem('pao_seller_cache');
        window.location.reload();
    } catch (err) {
        alert("กู้คืนไม่สำเร็จ: " + err.message);
    } finally {
        migrationBtn.disabled = false;
        migrationBtn.textContent = "นำเข้าสินค้าทันที";
    }
}

// ── Permission Helper ─────────────────────────────────────────────
function checkCloudPermission() {
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    const user = firebase.auth().currentUser;
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
    
    const isAdmin = (user && !user.isAnonymous && user.email === SELLER_EMAIL) || localAdminActive;

    if (!isAdmin) {
        const currentEmail = user ? (user.isAnonymous ? "Anonymous/Guest" : user.email) : "ยังไม่ได้ล็อกอิน";
        
        const modalHtml = `
            <div id="permissionModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:9999; backdrop-filter:blur(5px);">
                <div style="background:white; padding:40px; border-radius:20px; max-width:400px; text-align:center; box-shadow:0 20px 40px rgba(0,0,0,0.3);">
                    <div style="font-size:50px; margin-bottom:20px;">🛡️</div>
                    <h3 style="margin:0 0 15px 0; color:#333;">ต้องใช้สิทธิ์ Admin ครับ</h3>
                    <p style="color:#666; margin-bottom:25px; line-height:1.6;">คุณล็อกอินด้วย: <b>${currentEmail}</b><br>ซึ่งไม่มีสิทธิ์แก้ไขข้อมูลบน Cloud ครับ<br><br>กรุณาล็อกอินด้วย <b>${SELLER_EMAIL}</b> เพื่อจัดการหมวดหมู่และสินค้าครับ</p>
                    <button onclick="window.location.href='login.html'" style="background:#A68A64; color:white; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:600; width:100%; margin-bottom:10px;">ไปที่หน้าล็อกอิน</button>
                    ${window.location.protocol === 'file:' ? `<button onclick="localStorage.setItem('paomobile_admin_active','true'); window.location.reload();" style="background:#28a745; color:white; border:none; padding:12px 25px; border-radius:10px; cursor:pointer; font-weight:600; width:100%; margin-bottom:10px;">🛡️ บังคับสิทธิ์ Admin (Local)</button>` : ''}
                    <button onclick="document.getElementById('permissionModal').remove()" style="background:none; border:none; color:#999; cursor:pointer; font-size:14px;">ปิดหน้าต่างนี้</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return false;
    }
    return true;
}

// Note: openCategoryModal, closeCategoryModal, addConfigItem, deleteConfigItem 
// and startConfigSync are moved to seller-config.js for global access.



// ── Global Exports ──────────────────────────────────────────────────
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.handleFormSubmit = handleFormSubmit;
window.handleImgUpload = handleImgUpload;
window.togglePartsFields = togglePartsFields;
window.updatePartTypeDropdown = updatePartTypeDropdown;
window.removeImg = removeImg;
window.viewFullImage = viewFullImage;
window.closeImageViewer = closeImageViewer;
window.runMigration = runMigration;
window.deleteProduct = deleteProduct;
window.sellerLogin = sellerLogin;
window.sellerLogout = sellerLogout;
