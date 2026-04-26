// --- Robust Error Handling & Diagnosis ---
window.addEventListener('error', function(e) {
    console.error("❌ Script Error:", e.message, "at", e.filename, ":", e.lineno);
});

// ── Premium Modal System (replaces native alert/confirm) ──────────────

function sellerAlert(message, type = 'info') {
    return new Promise(resolve => {
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', delete: '🗑️', merge: '🔗' };
        const colors = { success: '#52c41a', error: '#ff4d4f', warning: '#faad14', info: '#1890ff', delete: '#ff4d4f', merge: '#764ba2' };
        const icon = icons[type] || icons.info;
        const color = colors[type] || colors.info;

        const overlay = document.createElement('div');
        overlay.id = 'sellerAlertOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

        overlay.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
                <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:24px;">${message}</div>
                <button id="sAlertOkBtn" style="background:${color};color:#fff;border:none;padding:12px 40px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:120px;transition:all 0.2s;">ตกลง</button>
            </div>
        `;

        // Add animation styles if not present
        if (!document.getElementById('sModalStyles')) {
            const style = document.createElement('style');
            style.id = 'sModalStyles';
            style.textContent = `
                @keyframes sModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sModalSlideIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                #sAlertOkBtn:hover { filter: brightness(1.1); transform: scale(1.02); }
                #sConfirmOkBtn:hover { filter: brightness(1.1); transform: scale(1.02); }
                #sConfirmCancelBtn:hover { background: #f5f5f5 !important; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        const okBtn = overlay.querySelector('#sAlertOkBtn');
        okBtn.focus();
        okBtn.onclick = () => { overlay.remove(); resolve(); };
        overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(); } };
    });
}

function sellerConfirm(message, type = 'warning') {
    return new Promise(resolve => {
        const icons = { warning: '⚠️', delete: '🗑️', merge: '🔗', info: 'ℹ️' };
        const colors = { warning: '#faad14', delete: '#ff4d4f', merge: '#764ba2', info: '#1890ff' };
        const icon = icons[type] || icons.warning;
        const color = colors[type] || colors.warning;

        const overlay = document.createElement('div');
        overlay.id = 'sellerConfirmOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

        overlay.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
                <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:28px;">${message}</div>
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button id="sConfirmCancelBtn" style="background:#fff;color:#666;border:1px solid #ddd;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยกเลิก</button>
                    <button id="sConfirmOkBtn" style="background:${color};color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยืนยัน</button>
                </div>
            </div>
        `;

        // Add animation styles if not present
        if (!document.getElementById('sModalStyles')) {
            const style = document.createElement('style');
            style.id = 'sModalStyles';
            style.textContent = `
                @keyframes sModalFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes sModalSlideIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                #sAlertOkBtn:hover { filter: brightness(1.1); transform: scale(1.02); }
                #sConfirmOkBtn:hover { filter: brightness(1.1); transform: scale(1.02); }
                #sConfirmCancelBtn:hover { background: #f5f5f5 !important; }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);
        overlay.querySelector('#sConfirmOkBtn').onclick = () => { overlay.remove(); resolve(true); };
        overlay.querySelector('#sConfirmCancelBtn').onclick = () => { overlay.remove(); resolve(false); };
    });
}

function sellerPrompt(message, placeholder = '') {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.id = 'sellerPromptOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);animation:sModalFadeIn 0.2s ease;';

        overlay.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:32px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);text-align:center;animation:sModalSlideIn 0.3s ease;">
                <div style="font-size:40px;margin-bottom:16px;">⌨️</div>
                <div style="font-size:0.95rem;color:#333;line-height:1.7;white-space:pre-line;margin-bottom:20px;">${message}</div>
                <input type="text" id="sPromptInput" placeholder="${placeholder}" style="width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1rem;margin-bottom:24px;text-align:center;outline:none;font-family:inherit;" autocomplete="off">
                <div style="display:flex;gap:12px;justify-content:center;">
                    <button id="sPromptCancelBtn" style="background:#fff;color:#666;border:1px solid #ddd;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ยกเลิก</button>
                    <button id="sPromptOkBtn" style="background:#1890ff;color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:inherit;min-width:100px;transition:all 0.2s;">ตกลง</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        const input = overlay.querySelector('#sPromptInput');
        input.focus();

        const finish = (val) => { overlay.remove(); resolve(val); };
        
        overlay.querySelector('#sPromptOkBtn').onclick = () => finish(input.value);
        overlay.querySelector('#sPromptCancelBtn').onclick = () => finish(null);
        input.onkeyup = (e) => { if(e.key === 'Enter') finish(input.value); };
    });
}

let allProducts = [];
let deletedMockIds = JSON.parse(localStorage.getItem('deleted_mock_ids') || '[]');
let currentCategory = 'all';
let productUnsubscribe = null; // Track current Firestore listener
let selectedProductIds = new Set(); // Multi-select tracking

function initTabs() {
    if (typeof setFilterCategory === 'function') {
        setFilterCategory(currentCategory);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // 0. Enable Firestore Persistence for Seller Centre (Compat)
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
            firebase.firestore().enablePersistence({ synchronizeTabs: true }).catch(err => {
                if (err.code == 'failed-precondition') {
                    console.warn("[Persistence] Multiple tabs active.");
                } else if (err.code == 'unimplemented') {
                    console.warn("[Persistence] Browser not supported.");
                }
            });
        } catch (e) { /* Already enabled */ }
    }

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
    firebase.auth().signInWithPopup(provider).catch(async err => {
        if (window.location.protocol === 'file:') {
            await sellerAlert("ล็อกอินไม่ได้เนื่องจากเปิดไฟล์ตรงๆ กรุณาใช้ปุ่ม 'บังคับสิทธิ์ Admin (Local)' แทนครับ", 'warning');
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
            const countStatus = document.getElementById('productCountStatus');
            if (countStatus) countStatus.textContent = "สินค้าทั้งหมด: " + allProducts.length + " (โหลดจากแคช ⚡)";
            filterProducts();
        } catch(e) { allProducts = [...MOCK_PRODUCTS_BASELINE]; }
    } else {
        allProducts = [...MOCK_PRODUCTS_BASELINE];
        filterProducts();
    }

    if (typeof db === 'undefined' || !db) {
        setTimeout(startSync, 1000); 
        return;
    }

    // A. Sync logic for deleted items (separate listener)
    db.collection('settings').doc('deleted_products').onSnapshot(doc => {
        if (doc.exists) {
            const globalDeleted = doc.data().deletedIds || [];
            deletedMockIds = [...new Set([...deletedMockIds, ...globalDeleted])];
            localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));
        }
    });

    // B. Start the category-specific sync (Initial)
    restartFirestoreListener();
}

function restartFirestoreListener() {
    if (typeof db === 'undefined' || !db) return;
    
    // Stop old listener if exists
    if (productUnsubscribe) {
        productUnsubscribe();
        productUnsubscribe = null;
    }

    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusIndicator');
    if (statusText) statusText.textContent = "กำลังซิงค์ Cloud...";
    if (statusDot) statusDot.style.background = '#ffc107'; // yellow/loading

    let query = db.collection('products');
    
    // Server-side filtering logic matching products-sync.js exactly
    if (currentCategory && currentCategory !== 'all') {
        let categoryList = [currentCategory];
        if (currentCategory === 'new') categoryList = ['new', 'มือ 1', 'มือหนึ่ง'];
        else if (currentCategory === 'used') categoryList = ['used', 'มือ 2', 'มือสอง'];
        else if (currentCategory === 'accessory') categoryList = ['accessory', 'อุปกรณ์', 'อุปกรณ์เสริม'];
        else if (currentCategory === 'parts') categoryList = ['parts', 'อะไหล่'];
        
        query = query.where('category', 'in', categoryList);
    }
    
    // Add a limit for safety (same as customer side)
    query = query.limit(2000); 
    
    productUnsubscribe = query.onSnapshot(snapshot => {
        console.log(`[Seller Sync] Success: Received ${snapshot.size} items from Cloud for ${currentCategory}`);
        
        const firestoreProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Robust Merge Logic (Mirroring products-sync.js logic more closely)
        const isOriginalMock = (p) => {
            const isMock = MOCK_PRODUCTS_BASELINE.some(m => m.id === p.id);
            if (!isMock) return false;
            if (p.id.endsWith('-orig')) return true;
            return !deletedMockIds.includes(p.id);
        };

        const mergedMap = new Map();
        
        // 1. First, populate with non-deleted baseline items that match current category
        MOCK_PRODUCTS_BASELINE.forEach(p => {
             const isOriginalPart = p.id.endsWith('-orig');
             if (isOriginalPart || !deletedMockIds.includes(p.id)) {
                 // Check if it matches current category (synonym aware)
                 let matches = true;
                 if (currentCategory !== 'all') {
                     const pCat = (p.category || "").toLowerCase();
                     const target = currentCategory.toLowerCase();
                     if (target === 'new') matches = (pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง');
                     else if (target === 'used') matches = (pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง');
                     else if (target === 'accessory') matches = (pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม');
                     else if (target === 'parts') matches = (pCat === 'parts' || pCat === 'อะไหล่');
                     else matches = (pCat === target);
                 }
                 if (matches) mergedMap.set(p.id, p);
             }
        });
        
        // 2. Overwrite or add with Cloud data
        firestoreProducts.forEach(p => mergedMap.set(p.id, p));
        
        allProducts = Array.from(mergedMap.values());

        // Cache update
        try {
            localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts));
        } catch (e) {}

        // UI update
        const statusDot = document.getElementById('statusIndicator');
        const countStatus = document.getElementById('productCountStatus');
        const statusTxt = document.getElementById('statusText');

        if (statusDot) statusDot.style.background = '#52c41a';
        if (statusTxt) statusTxt.textContent = "เชื่อมต่อ Cloud เรียบร้อย ✅";
        if (countStatus) {
            countStatus.textContent = "สินค้าทั้งหมด: " + allProducts.length + " (เชื่อมต่อ Cloud ✅)";
        }
        
        updateBrandsDatalist();
        filterProducts();
    }, err => {
        console.error("Seller snapshot error:", err);
        const statusDot = document.getElementById('statusIndicator');
        const statusTxt = document.getElementById('statusText');
        const countStatus = document.getElementById('productCountStatus');

        if (statusDot) statusDot.style.background = '#ff4d4f';
        if (statusTxt) statusTxt.textContent = "การเชื่อมต่อขัดข้อง: " + err.code;
        if (countStatus) countStatus.textContent = "สินค้าทั้งหมด: " + allProducts.length + " (ออฟไลน์ ⚠️)";
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
    if (currentCategory === cat) return;
    currentCategory = cat;
    
    // Update Tab UI
    const tabs = document.querySelectorAll('.tabs-nav .tab-btn');
    tabs.forEach(t => {
        if (t.dataset.cat === cat) t.classList.add('active');
        else t.classList.remove('active');
    });

    // Mirroring Customer system: restart listener on tab change
    restartFirestoreListener();
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
            if (targetCat === 'new') return pCat === 'new' || pCat === 'มือ 1' || pCat === 'มือหนึ่ง';
            if (targetCat === 'used') return pCat === 'used' || pCat === 'มือ 2' || pCat === 'มือสอง';
            if (targetCat === 'accessory') return pCat === 'accessory' || pCat === 'อุปกรณ์' || pCat === 'อุปกรณ์เสริม';
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
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">ไม่พบสินค้าในหมวดหมู่นี้</td></tr>';
        return;
    }

    // Track which visible IDs exist for "select all" logic
    window._currentFilteredIds = filtered.map(p => p.id);

    tbody.innerHTML = filtered.map(p => {
        const isSelected = selectedProductIds.has(p.id);
        return `
        <tr data-id="${p.id}" class="${isSelected ? 'selected-row' : ''}">
            <td class="product-checkbox-cell">
                <input type="checkbox" class="product-checkbox" ${isSelected ? 'checked' : ''} onchange="toggleSelectProduct('${p.id}')">
            </td>
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
            <td class="mobile-hide-on-card"><div class="price-txt price-editable" onclick="openInlinePrice('${p.id}')">${getDisplayPrice(p)} <span class="edit-icon">✏️</span></div></td>
            <td class="actions-cell">
                <div class="mobile-card-details" style="display:none;">
                    <span class="category-tag tag-${p.category}">${getCategoryName(p.category)}</span>
                    <div class="price-txt price-editable" onclick="openInlinePrice('${p.id}')">${getDisplayPrice(p)} <span class="edit-icon">✏️</span></div>
                </div>
                <button class="btn-edit" onclick="openEditModal('${p.id}')">แก้ไข</button>
                <button class="btn-delete" onclick="deleteProduct('${p.id}')">ลบ</button>
            </td>
        </tr>
    `;
    }).join('');

    // Sync "select all" checkbox state
    syncSelectAllCheckbox();
}

function getCategoryName(cat) {
    if (cat === 'new') return 'มือ 1';
    if (cat === 'used') return 'มือ 2';
    if (cat === 'accessory') return 'Accessory';
    if (cat === 'parts') return 'อะไหล่';
    return cat;
}

// Price display helper: shows range if variations have different prices
function getDisplayPrice(product) {
    const variations = product.variations;
    if (variations && variations.length > 0) {
        const prices = variations.map(v => v.price || 0).filter(p => p > 0);
        if (prices.length > 0) {
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            if (minPrice === maxPrice) {
                return `฿${minPrice.toLocaleString()}`;
            } else {
                return `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`;
            }
        }
    }
    return `฿${(product.price || 0).toLocaleString()}`;
}

// ── Variations Management ──────────────────────────────────────────
let variationImages = {}; // Track base64 strings for each variation row

window.addVariationRow = function(data = null) {
    const container = document.getElementById('variationContainer');
    const hint = document.getElementById('noVariationHint');
    if (!container) return;
    
    if (hint) hint.style.display = 'none';
    
    // Show auto-calc hint on price field
    const priceHint = document.getElementById('priceAutoHint');
    if (priceHint) priceHint.style.display = 'inline';
    
    const rowId = data?.id || "v-" + Date.now() + Math.random().toString(16).slice(2, 5);
    const row = document.createElement('div');
    row.className = 'variation-row';
    row.dataset.id = rowId;
    row.style.cssText = "display: flex; gap: 20px; align-items: start; background: #fff; padding: 18px; border-radius: 12px; border: 1px solid #ddd; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.04);";
    
    // Initial image state
    if (data && data.img) variationImages[rowId] = data.img;

    row.innerHTML = `
        <div style="flex-shrink: 0;">
            <div style="position: relative; width: 80px; height: 80px; border-radius: 10px; border: 1px dashed #bbb; overflow: hidden; background: #fff; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 4px rgba(0,0,0,0.05);">
                <div style="width: 100%; height: 100%; cursor: pointer;" onclick="variationImages['${rowId}'] ? viewFullImage(variationImages['${rowId}']) : this.parentElement.nextElementSibling.click()">
                    ${variationImages[rowId] ? `<img src="${variationImages[rowId]}" style="width: 100%; height: 100%; object-fit: contain;">` : '<span style="font-size: 2rem; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">🖼️</span>'}
                </div>
                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.65rem; text-align: center; padding: 4px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.8)'" onmouseout="this.style.background='rgba(0,0,0,0.6)'" onclick="this.parentElement.nextElementSibling.click()">เปลี่ยนรูป</div>
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
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button type="button" onclick="moveVariationUp(this)" style="background: #e6f7ff; border: 1px solid #91d5ff; color: #1890ff; cursor: pointer; font-size: 0.8rem; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#1890ff'; this.style.color='#fff';" onmouseout="this.style.background='#e6f7ff'; this.style.color='#1890ff';" title="เลื่อนขึ้น">▲</button>
            <button type="button" onclick="moveVariationDown(this)" style="background: #e6f7ff; border: 1px solid #91d5ff; color: #1890ff; cursor: pointer; font-size: 0.8rem; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#1890ff'; this.style.color='#fff';" onmouseout="this.style.background='#e6f7ff'; this.style.color='#1890ff';" title="เลื่อนลง">▼</button>
            <button type="button" onclick="removeVariationRow(this)" style="background: #fff1f0; border: 1px solid #ffa39e; color: #ff4d4f; cursor: pointer; font-size: 1.2rem; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" onmouseover="this.style.background='#ff4d4f'; this.style.color='#fff';" onmouseout="this.style.background='#fff1f0'; this.style.color='#ff4d4f';" title="ลบตัวเลือก">&times;</button>
        </div>
    `;
    
    container.appendChild(row);
}

window.moveVariationUp = function(btn) {
    const row = btn.closest('.variation-row');
    const prev = row.previousElementSibling;
    if (prev && prev.classList.contains('variation-row')) {
        row.parentNode.insertBefore(row, prev);
    }
}

window.moveVariationDown = function(btn) {
    const row = btn.closest('.variation-row');
    const next = row.nextElementSibling;
    if (next && next.classList.contains('variation-row')) {
        row.parentNode.insertBefore(next, row);
    }
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
    
    // Hide auto-calc hint if no variations left
    if (container && container.children.length === 0) {
        const priceHint = document.getElementById('priceAutoHint');
        if (priceHint) priceHint.style.display = 'none';
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
            previewContainer.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: contain;">`;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function deleteAllProducts() {
    if (!await sellerConfirm('🚨 คำเตือนสูงสุด: คุณแน่ใจหรือไม่ว่าต้องการ "ลบสินค้าทั้งหมด" จากระบบ Cloud?\n\nการกระทำนี้ไม่สามารถย้อนคืนได้ และจะทำให้หน้าเว็บร้านค้าว่างเปล่าทันที!', 'delete')) return;
    
    // Safety Double-Check
    const confirmCode = await sellerPrompt('กรุณาพิมพ์คำว่า "CONFIRM DELETE" เพื่อยืนยันการลบสินค้าทั้งหมดออกจากระบบ:', 'CONFIRM DELETE');
    if (confirmCode !== 'CONFIRM DELETE') {
        await sellerAlert('รหัสยืนยันไม่ถูกต้อง ยกเลิกการลบครับ', 'error');
        return;
    }

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
        
        await sellerAlert('ลบสินค้าทั้งหมดเรียบร้อยแล้วครับ! ระบบกำลังรีโหลด...', 'success');
        window.location.reload();
    } catch (err) {
        console.error('Delete All Error:', err);
        await sellerAlert('เกิดข้อผิดพลาดในการลบ: ' + err.message, 'error');
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
function viewFullImage(indexOrUrl) {
    let src;
    let labelText = '';
    
    if (typeof indexOrUrl === 'string') {
        src = indexOrUrl;
        labelText = 'รูปภาพ';
    } else {
        src = uploadedImages[indexOrUrl];
        labelText = `รูปภาพที่ ${indexOrUrl + 1} ${indexOrUrl === 0 ? '(รูปหน้าหลัก)' : ''}`;
    }
    
    if (!src) return;
    
    const modal = document.getElementById('imageViewerModal');
    const fullImg = document.getElementById('fullSizeImg');
    const caption = document.getElementById('ivCaption');
    
    fullImg.src = src;
    if (caption) caption.textContent = labelText;
    
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
    
    // Reset price auto-calc hint
    const priceHint = document.getElementById('priceAutoHint');
    if (priceHint) priceHint.style.display = 'none';

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
    const priceHintEdit = document.getElementById('priceAutoHint');
    if (p.variations && p.variations.length > 0) {
        document.getElementById('noVariationHint').style.display = 'none';
        if (priceHintEdit) priceHintEdit.style.display = 'inline';
        p.variations.forEach(v => addVariationRow(v));
    } else {
        document.getElementById('noVariationHint').style.display = 'block';
        if (priceHintEdit) priceHintEdit.style.display = 'none';
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
        
        // Collect variations first
        const variations = Array.from(document.querySelectorAll('.variation-row')).map(row => {
            const rid = row.dataset.id;
            return {
                id: rid,
                name: row.querySelector('.v-name').value,
                price: parseFloat(row.querySelector('.v-price').value) || 0,
                img: variationImages[rid] || "",
                isOutOfStock: row.querySelector('.v-stock').checked
            };
        });
        
        // Auto-calculate price from variations if price field is empty
        let mainPrice = parseFloat(document.getElementById('formPrice').value);
        if ((isNaN(mainPrice) || mainPrice === 0) && variations.length > 0) {
            const varPrices = variations.map(v => v.price).filter(p => p > 0);
            if (varPrices.length > 0) {
                mainPrice = Math.min(...varPrices); // Use lowest price as main price
            } else {
                mainPrice = 0;
            }
        }
        if (isNaN(mainPrice)) mainPrice = 0;
        
        const data = {
            id: id,
            name: document.getElementById('formName').value,
            brand: document.getElementById('formBrand').value,
            price: mainPrice,
            category: document.getElementById('formCategory').value,
            description: document.getElementById('formDescription').value,
            emoji: document.getElementById('formEmoji').value || "📦",
            img: imagesArr[0] || document.getElementById('formImg').value || "",
            images: imagesArr,
            badge: document.getElementById('formBadge').value,
            specs: document.getElementById('formSpecs').value,
            partModel: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartModel').value : "",
            partType: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartType').value : "",
            variations: variations,
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

        // --- Invalidate Customer-Side Caches ---
        // Clear all customer page caches so they always fetch fresh data from Firestore
        // instead of showing the stale pre-edit version.
        ['new', 'used', 'accessory', 'parts', 'all'].forEach(cat => {
            localStorage.removeItem(`pao_cache_${cat}`);
        });
        console.log("🗑️ Customer caches cleared — customers will see the latest data on next load.");
        
        // Auto-switch to the category of the saved product so it is immediately visible
        if (typeof setFilterCategory === 'function') {
            setFilterCategory(data.category);
        } else if (typeof filterProducts === 'function') {
            filterProducts();
        }
        
        // --- Reset button & close modal IMMEDIATELY (don't wait for cloud sync) ---
        if (btn) {
            btn.disabled = false;
            btn.textContent = "💾 บันทึกสินค้า";
        }
        closeModal();

        // --- 2. Background Cloud Sync (fire-and-forget, does NOT block UI) ---
        if (typeof db !== 'undefined' && db && checkCloudPermission()) {
            db.collection('products').doc(id).set(data, { merge: true })
                .then(() => console.log("☁️ Cloud Sync Successful"))
                .catch(syncErr => console.error("❌ Cloud Sync Error:", syncErr));
        } else {
            console.warn("⚠️ Cloud sync skipped - product saved locally only. Customers won't see it until synced.");
        }
    } catch (err) {
        console.error("❌ Submission Error:", err);
        // Always reset button on error so user can retry
        if (btn) {
            btn.disabled = false;
            btn.textContent = "💾 บันทึกสินค้า";
        }
        await sellerAlert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message, 'error');
    }
}

async function deleteProduct(id) {
    if (!await sellerConfirm('ยืนยันการลบสินค้านี้?', 'delete')) return;
    
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

    // --- Invalidate Customer-Side Caches ---
    ['new', 'used', 'accessory', 'parts', 'all'].forEach(cat => {
        localStorage.removeItem(`pao_cache_${cat}`);
    });
    
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
        await sellerAlert('นำเข้าข้อมูลสินค้า 21 รายการเรียบร้อยแล้วครับ!', 'success');
        window.location.reload();
        await sellerAlert('กู้คืนข้อมูล Cloud สำเร็จแล้วครับ! สินค้าทั้งหมดกลับมาแล้ว', 'success');
        localStorage.removeItem('pao_seller_cache');
        window.location.reload();
    } catch (err) {
        await sellerAlert('กู้คืนไม่สำเร็จ: ' + err.message, 'error');
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



// ── Multi-Select & Bulk Edit System ─────────────────────────────────

function toggleSelectProduct(id) {
    if (selectedProductIds.has(id)) {
        selectedProductIds.delete(id);
    } else {
        selectedProductIds.add(id);
    }
    
    // Update row visual
    const row = document.querySelector(`tr[data-id="${id}"]`);
    if (row) {
        row.classList.toggle('selected-row', selectedProductIds.has(id));
    }
    
    syncSelectAllCheckbox();
    updateBulkActionBar();
}

function toggleSelectAll() {
    const filteredIds = window._currentFilteredIds || [];
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.has(id));
    
    if (allSelected) {
        // Deselect all visible
        filteredIds.forEach(id => selectedProductIds.delete(id));
    } else {
        // Select all visible
        filteredIds.forEach(id => selectedProductIds.add(id));
    }
    
    // Re-render to update checkboxes
    filterProducts();
    updateBulkActionBar();
}

function syncSelectAllCheckbox() {
    const filteredIds = window._currentFilteredIds || [];
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedProductIds.has(id));
    const someSelected = filteredIds.some(id => selectedProductIds.has(id));
    
    // Header checkbox
    const headerCb = document.getElementById('selectAllCheckbox');
    if (headerCb) {
        headerCb.checked = allSelected;
        headerCb.indeterminate = someSelected && !allSelected;
    }
    
    // Bottom bar checkbox
    const barCb = document.getElementById('bulkSelectAll');
    if (barCb) {
        barCb.checked = allSelected;
        barCb.indeterminate = someSelected && !allSelected;
    }
}

function updateBulkActionBar() {
    const bar = document.getElementById('bulkActionBar');
    const countEl = document.getElementById('bulkCount');
    const count = selectedProductIds.size;
    
    if (countEl) countEl.textContent = count;
    
    if (bar) {
        if (count > 0) {
            bar.classList.add('visible');
        } else {
            bar.classList.remove('visible');
        }
    }
}

function clearSelection() {
    selectedProductIds.clear();
    filterProducts();
    updateBulkActionBar();
}

// --- Bulk Edit Modals ---

function openBulkPriceModal() {
    const count = selectedProductIds.size;
    if (count === 0) return;
    document.getElementById('bulkPriceInput').value = '';
    document.getElementById('bulkPriceInfo').innerHTML = `✅ จะอัปเดตราคาให้ <strong>${count}</strong> รายการ`;
    document.getElementById('bulkPriceModal').classList.add('active');
}

function openBulkBrandModal() {
    const count = selectedProductIds.size;
    if (count === 0) return;
    document.getElementById('bulkBrandInput').value = '';
    document.getElementById('bulkBrandInfo').innerHTML = `✅ จะอัปเดตแบรนด์ให้ <strong>${count}</strong> รายการ`;
    document.getElementById('bulkBrandModal').classList.add('active');
}

function openBulkCategoryModal() {
    const count = selectedProductIds.size;
    if (count === 0) return;
    document.getElementById('bulkCategoryInput').value = 'new';
    document.getElementById('bulkCategoryInfo').innerHTML = `✅ จะอัปเดตหมวดหมู่ให้ <strong>${count}</strong> รายการ`;
    
    // Reset parts sub-options
    const partsDiv = document.getElementById('bulkPartsSubOptions');
    if (partsDiv) partsDiv.style.display = 'none';
    
    document.getElementById('bulkCategoryModal').classList.add('active');
}

function onBulkCategoryChange() {
    const val = document.getElementById('bulkCategoryInput').value;
    const partsDiv = document.getElementById('bulkPartsSubOptions');
    if (!partsDiv) return;
    
    if (val === 'parts') {
        partsDiv.style.display = 'block';
        // Populate partModel dropdown from sparePartsConfig
        const modelSelect = document.getElementById('bulkPartModelInput');
        if (modelSelect && typeof sparePartsConfig !== 'undefined') {
            const models = sparePartsConfig.models || [];
            modelSelect.innerHTML = '<option value="">-- ไม่เปลี่ยนรุ่น --</option>' +
                models.map(m => `<option value="${m}">${m}</option>`).join('');
        }
        // Reset partType
        const typeSelect = document.getElementById('bulkPartTypeInput');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">-- เลือกรุ่นก่อน --</option>';
        }
    } else {
        partsDiv.style.display = 'none';
    }
}

function onBulkPartModelChange() {
    const model = document.getElementById('bulkPartModelInput').value;
    const typeSelect = document.getElementById('bulkPartTypeInput');
    if (!typeSelect || typeof sparePartsConfig === 'undefined') return;
    
    if (!model) {
        typeSelect.innerHTML = '<option value="">-- เลือกรุ่นก่อน --</option>';
        return;
    }
    
    // Get allowed part types for this model from mappings
    let allowedTypes = [];
    if (sparePartsConfig.mappings && sparePartsConfig.mappings[model]) {
        allowedTypes = sparePartsConfig.mappings[model];
    } else {
        // Fallback: show all part types
        allowedTypes = sparePartsConfig.partTypes || [];
    }
    
    typeSelect.innerHTML = '<option value="">-- ไม่เปลี่ยนประเภท --</option>' +
        allowedTypes.map(t => `<option value="${t}">${t}</option>`).join('');
}

function closeBulkModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

async function applyBulkPrice() {
    const newPrice = parseFloat(document.getElementById('bulkPriceInput').value);
    if (isNaN(newPrice) || newPrice < 0) {
        await sellerAlert('กรุณาใส่ราคาที่ถูกต้องครับ', 'warning');
        return;
    }
    
    if (!checkCloudPermission()) return;
    
    const ids = Array.from(selectedProductIds);
    
    // 1. Local update
    ids.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) {
            product.price = newPrice;
            product.updatedAt = new Date().toISOString();
        }
    });
    
    // 2. Cache update
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Re-render
    filterProducts();
    closeBulkModal('bulkPriceModal');
    
    // 4. Cloud batch sync
    try {
        if (typeof db !== 'undefined' && db) {
            const batch = db.batch();
            ids.forEach(id => {
                batch.update(db.collection('products').doc(id), {
                    price: newPrice,
                    updatedAt: new Date().toISOString()
                });
            });
            await batch.commit();
            console.log(`☁️ Bulk price update: ${ids.length} items → ฿${newPrice}`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud bulk price update failed:', err);
    }
    
    await sellerAlert(`อัปเดตราคาเป็น ฿${newPrice.toLocaleString()} สำเร็จ ${ids.length} รายการ`, 'success');
}

async function applyBulkBrand() {
    const newBrand = document.getElementById('bulkBrandInput').value.trim();
    if (!newBrand) {
        await sellerAlert('กรุณาใส่ชื่อแบรนด์ครับ', 'warning');
        return;
    }
    
    if (!checkCloudPermission()) return;
    
    const ids = Array.from(selectedProductIds);
    
    // 1. Local update
    ids.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) {
            product.brand = newBrand;
            product.updatedAt = new Date().toISOString();
        }
    });
    
    // 2. Cache update
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Re-render
    filterProducts();
    updateBrandsDatalist();
    closeBulkModal('bulkBrandModal');
    
    // 4. Cloud batch sync
    try {
        if (typeof db !== 'undefined' && db) {
            const batch = db.batch();
            ids.forEach(id => {
                batch.update(db.collection('products').doc(id), {
                    brand: newBrand,
                    updatedAt: new Date().toISOString()
                });
            });
            await batch.commit();
            console.log(`☁️ Bulk brand update: ${ids.length} items → ${newBrand}`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud bulk brand update failed:', err);
    }
    
    await sellerAlert(`อัปเดตแบรนด์เป็น "${newBrand}" สำเร็จ ${ids.length} รายการ`, 'success');
}

// ── Bulk Edit Specs ────────────────────────────────────────────────────
function openBulkSpecsModal() {
    const count = selectedProductIds.size;
    if (count === 0) return;
    document.getElementById('bulkSpecsInput').value = '';
    document.getElementById('bulkSpecsInfo').innerHTML = `✅ จะอัปเดตข้อมูลเพิ่มเติมให้ <strong>${count}</strong> รายการ`;
    document.getElementById('bulkSpecsModal').classList.add('active');
    setTimeout(() => document.getElementById('bulkSpecsInput').focus(), 100);
}

async function applyBulkSpecs() {
    const newSpecs = document.getElementById('bulkSpecsInput').value.trim();
    // อนุญาตให้ส่งค่าว่างได้ (ลบข้อมูลเพิ่มเติมได้)
    if (!checkCloudPermission()) return;
    
    const ids = Array.from(selectedProductIds);
    const now = new Date().toISOString();
    
    // 1. Local update
    ids.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) {
            product.specs = newSpecs;
            product.updatedAt = now;
        }
    });
    
    // 2. Cache update
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Re-render
    filterProducts();
    closeBulkModal('bulkSpecsModal');
    
    // 4. Cloud batch sync
    try {
        if (typeof db !== 'undefined' && db) {
            const batch = db.batch();
            ids.forEach(id => {
                batch.update(db.collection('products').doc(id), {
                    specs: newSpecs,
                    updatedAt: now
                });
            });
            await batch.commit();
            console.log(`☁️ Bulk specs update: ${ids.length} items`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud bulk specs update failed:', err);
    }
    
    const preview = newSpecs ? `"${newSpecs.slice(0, 30)}${newSpecs.length > 30 ? '...' : ''}"` : '(ว่าง)';
    await sellerAlert(`อัปเดตข้อมูลเพิ่มเติมเป็น ${preview} สำเร็จ ${ids.length} รายการ`, 'success');
}

async function applyBulkCategory() {
    const newCategory = document.getElementById('bulkCategoryInput').value;
    if (!newCategory) {
        await sellerAlert('กรุณาเลือกหมวดหมู่ครับ', 'warning');
        return;
    }
    
    if (!checkCloudPermission()) return;
    
    const ids = Array.from(selectedProductIds);
    const catName = getCategoryName(newCategory);
    
    // Get parts sub-fields if applicable
    let newPartModel = '';
    let newPartType = '';
    if (newCategory === 'parts') {
        const modelInput = document.getElementById('bulkPartModelInput');
        const typeInput = document.getElementById('bulkPartTypeInput');
        newPartModel = modelInput ? modelInput.value : '';
        newPartType = typeInput ? typeInput.value : '';
    }
    
    // 1. Local update
    ids.forEach(id => {
        const product = allProducts.find(p => p.id === id);
        if (product) {
            product.category = newCategory;
            product.updatedAt = new Date().toISOString();
            if (newCategory === 'parts') {
                if (newPartModel) product.partModel = newPartModel;
                if (newPartType) product.partType = newPartType;
            } else {
                product.partModel = '';
                product.partType = '';
            }
        }
    });
    
    // 2. Cache update
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Re-render
    filterProducts();
    closeBulkModal('bulkCategoryModal');
    
    // 4. Cloud batch sync
    try {
        if (typeof db !== 'undefined' && db) {
            const batch = db.batch();
            ids.forEach(id => {
                const updateData = {
                    category: newCategory,
                    updatedAt: new Date().toISOString()
                };
                if (newCategory === 'parts') {
                    if (newPartModel) updateData.partModel = newPartModel;
                    if (newPartType) updateData.partType = newPartType;
                } else {
                    updateData.partModel = '';
                    updateData.partType = '';
                }
                batch.update(db.collection('products').doc(id), updateData);
            });
            await batch.commit();
            console.log(`☁️ Bulk category update: ${ids.length} items → ${catName}${newPartModel ? ' / ' + newPartModel : ''}${newPartType ? ' / ' + newPartType : ''}`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud bulk category update failed:', err);
    }
    
    let msg = `✅ อัปเดตหมวดหมู่เป็น "${catName}" สำเร็จ ${ids.length} รายการ`;
    if (newPartModel) msg += `\nรุ่น: ${newPartModel}`;
    if (newPartType) msg += `\nประเภท: ${newPartType}`;
    await sellerAlert(msg, 'success');
}

async function bulkDeleteSelected() {
    const count = selectedProductIds.size;
    if (count === 0) return;
    
    if (!await sellerConfirm(`คุณต้องการลบสินค้าที่เลือก ${count} รายการ ใช่หรือไม่?\n\nการกระทำนี้ไม่สามารถย้อนคืนได้!`, 'delete')) return;
    
    if (!checkCloudPermission()) return;
    
    const ids = Array.from(selectedProductIds);
    
    // 1. Local delete
    allProducts = allProducts.filter(p => !selectedProductIds.has(p.id));
    
    // 2. Cache
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Clear selection & re-render
    selectedProductIds.clear();
    filterProducts();
    updateBulkActionBar();
    
    // 4. Cloud batch delete
    try {
        if (typeof db !== 'undefined' && db) {
            const batch = db.batch();
            const mockIdsToDelete = [];
            
            ids.forEach(id => {
                batch.delete(db.collection('products').doc(id));
                const isMock = MOCK_PRODUCTS_BASELINE.some(m => m.id === id);
                if (isMock) mockIdsToDelete.push(id);
            });
            
            if (mockIdsToDelete.length > 0) {
                deletedMockIds = [...new Set([...deletedMockIds, ...mockIdsToDelete])];
                localStorage.setItem('deleted_mock_ids', JSON.stringify(deletedMockIds));
                batch.set(db.collection('settings').doc('deleted_products'), {
                    deletedIds: firebase.firestore.FieldValue.arrayUnion(...mockIdsToDelete),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            
            await batch.commit();
            console.log(`🗑️ Bulk delete: ${ids.length} items`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud bulk delete failed:', err);
    }
    
    await sellerAlert(`ลบสินค้าสำเร็จ ${count} รายการ`, 'success');
}

// ── Inline Price Edit ────────────────────────────────────────────────

let _inlinePriceEditId = null;

function openInlinePrice(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    // If product has variations, open full edit modal (prices are per-variation)
    if (product.variations && product.variations.length > 0) {
        openEditModal(productId);
        return;
    }
    
    _inlinePriceEditId = productId;
    
    document.getElementById('inlinePriceProductName').textContent = product.name;
    document.getElementById('inlinePriceValue').value = product.price || 0;
    document.getElementById('inlinePriceOverlay').classList.add('active');
    
    // Auto-focus and select the input
    setTimeout(() => {
        const input = document.getElementById('inlinePriceValue');
        input.focus();
        input.select();
    }, 100);
}

function closeInlinePrice() {
    document.getElementById('inlinePriceOverlay').classList.remove('active');
    _inlinePriceEditId = null;
}

async function saveInlinePrice() {
    if (!_inlinePriceEditId) return;
    
    const newPrice = parseFloat(document.getElementById('inlinePriceValue').value);
    if (isNaN(newPrice) || newPrice < 0) {
        await sellerAlert('กรุณาใส่ราคาที่ถูกต้องครับ', 'warning');
        return;
    }
    
    const id = _inlinePriceEditId;
    
    // 1. Local update
    const product = allProducts.find(p => p.id === id);
    if (product) {
        product.price = newPrice;
        product.updatedAt = new Date().toISOString();
    }
    
    // 2. Cache
    try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}
    
    // 3. Close modal & re-render
    closeInlinePrice();
    filterProducts();
    
    // 4. Cloud sync
    try {
        if (typeof db !== 'undefined' && db && checkCloudPermission()) {
            await db.collection('products').doc(id).update({
                price: newPrice,
                updatedAt: new Date().toISOString()
            });
            console.log(`☁️ Inline price update: ${id} → ฿${newPrice}`);
        }
    } catch(err) {
        console.warn('⚠️ Cloud inline price update failed:', err);
    }
}

// ── Merge Products System ─────────────────────────────────────────────

async function mergeSelectedProducts() {
    const count = selectedProductIds.size;
    if (count < 2) {
        await sellerAlert('กรุณาเลือกสินค้าอย่างน้อย 2 รายการเพื่อรวมครับ', 'warning');
        return;
    }

    const ids = Array.from(selectedProductIds);
    const products = ids.map(id => allProducts.find(p => p.id === id)).filter(Boolean);

    if (products.length < 2) {
        await sellerAlert('ไม่พบสินค้าที่เลือก กรุณาลองใหม่ครับ', 'error');
        return;
    }

    // Confirm merge
    const nameList = products.map(p => `• ${p.name}`).join('\n');
    if (!await sellerConfirm(`รวมสินค้า ${count} รายการเป็นสินค้าเดียว?\n\n${nameList}\n\nสินค้าตัวเดิมจะถูกลบ และสร้างสินค้าใหม่จากข้อมูลที่เลือก`, 'merge')) return;

    // Use first product as the base
    const base = products[0];
    const mergedId = "p-merged-" + Date.now();

    // Combine names
    const mergedName = products.map(p => p.name).join(' + ');

    // Collect all images from all products
    const allImages = [];
    products.forEach(p => {
        if (p.images && p.images.length > 0) {
            p.images.forEach(img => { if (img && !allImages.includes(img)) allImages.push(img); });
        } else if (p.img) {
            if (!allImages.includes(p.img)) allImages.push(p.img);
        }
    });

    // Create variations from each selected product
    const mergedVariations = products.map((p, idx) => {
        return {
            id: "v-merged-" + Date.now() + "-" + idx,
            name: p.name,
            price: p.price || 0,
            img: p.img || (p.images && p.images[0]) || "",
            isOutOfStock: p.isOutOfStock || false
        };
    });

    // Calculate main price from lowest variation
    const prices = mergedVariations.map(v => v.price).filter(p => p > 0);
    const mainPrice = prices.length > 0 ? Math.min(...prices) : 0;

    // Create merged product data
    const mergedProduct = {
        id: mergedId,
        name: mergedName,
        brand: base.brand || '',
        price: mainPrice,
        category: base.category || 'new',
        description: products.map(p => p.description || '').filter(Boolean).join('\n\n'),
        emoji: base.emoji || '📦',
        img: allImages[0] || base.img || '',
        images: allImages,
        badge: base.badge || '',
        specs: base.specs || '',
        partModel: base.partModel || '',
        partType: base.partType || '',
        variations: mergedVariations,
        isOutOfStock: false,
        lastUpdatedBy: (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser.email : "local-seller",
        updatedAt: new Date().toISOString()
    };

    // Open in Edit Modal so seller can review before saving
    // First, add the merged product to allProducts temporarily
    allProducts.unshift(mergedProduct);

    // Set up the form
    document.getElementById('productModal').style.display = 'flex';
    document.getElementById('modalTitle').textContent = '🔗 รวมสินค้า — ตรวจสอบและบันทึก';
    document.getElementById('formProductId').value = mergedId;
    document.getElementById('formName').value = mergedName;
    document.getElementById('formBrand').value = mergedProduct.brand;
    document.getElementById('formPrice').value = '';
    document.getElementById('formCategory').value = mergedProduct.category;
    document.getElementById('formDescription').value = mergedProduct.description;
    document.getElementById('formEmoji').value = mergedProduct.emoji;
    document.getElementById('formImg').value = '';
    document.getElementById('formBadge').value = mergedProduct.badge;
    document.getElementById('formSpecs').value = mergedProduct.specs;

    // Set up images - use existing refreshImgPreviews() for consistent rendering
    uploadedImages = allImages;
    refreshImgPreviews();

    // Set up category-specific fields
    if (typeof togglePartsFields === 'function') {
        togglePartsFields();
    }
    if (mergedProduct.category === 'parts') {
        setTimeout(() => {
            const partModelEl = document.getElementById('formPartModel');
            const partTypeEl = document.getElementById('formPartType');
            if (partModelEl) partModelEl.value = mergedProduct.partModel;
            if (partTypeEl) {
                if (typeof updatePartTypeDropdown === 'function') updatePartTypeDropdown();
                setTimeout(() => { partTypeEl.value = mergedProduct.partType; }, 200);
            }
        }, 100);
    }

    // Set up variations
    variationImages = {};
    const container = document.getElementById('variationContainer');
    if (container) container.innerHTML = '';
    const hint = document.getElementById('noVariationHint');
    if (hint) hint.style.display = 'none';

    mergedVariations.forEach(v => {
        addVariationRow(v);
    });

    // Set up stock status
    const stockSelect = document.getElementById('formStockStatus');
    if (stockSelect) stockSelect.value = 'in_stock';

    // Show auto-calc price hint
    const priceHint = document.getElementById('priceAutoHint');
    if (priceHint) priceHint.style.display = 'inline';

    // Store original IDs to delete after successful save
    window._mergeOriginalIds = ids;
    window._isMergeMode = true;

    // Clear selection
    selectedProductIds.clear();
    updateBulkActionBar();
}

// Override handleFormSubmit to handle merge cleanup
const _originalHandleFormSubmit = handleFormSubmit;
async function handleMergeAwareSubmit(e) {
    await _originalHandleFormSubmit(e);

    // After successful save, delete original products if in merge mode
    if (window._isMergeMode && window._mergeOriginalIds) {
        const idsToDelete = window._mergeOriginalIds;

        // Remove original products from local state
        allProducts = allProducts.filter(p => !idsToDelete.includes(p.id));

        // Update cache
        try { localStorage.setItem('pao_seller_cache', JSON.stringify(allProducts)); } catch(e) {}

        // Cloud delete originals
        try {
            if (typeof db !== 'undefined' && db && checkCloudPermission()) {
                const batch = db.batch();
                idsToDelete.forEach(id => {
                    batch.delete(db.collection('products').doc(id));
                });
                await batch.commit();
                console.log(`🔗 Merge cleanup: deleted ${idsToDelete.length} original products`);
            }
        } catch(err) {
            console.warn('⚠️ Cloud merge cleanup failed:', err);
        }

        // Clean up merge state
        window._mergeOriginalIds = null;
        window._isMergeMode = false;

        // Re-render
        filterProducts();
    }
}

// Replace the form submit handler
window.handleFormSubmit = handleMergeAwareSubmit;

// ── Global Exports ──────────────────────────────────────────────────
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
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

// Multi-select exports
window.toggleSelectProduct = toggleSelectProduct;
window.toggleSelectAll = toggleSelectAll;
window.clearSelection = clearSelection;
window.openBulkPriceModal = openBulkPriceModal;
window.openBulkBrandModal = openBulkBrandModal;
window.openBulkCategoryModal = openBulkCategoryModal;
window.openBulkSpecsModal = openBulkSpecsModal;
window.closeBulkModal = closeBulkModal;
window.applyBulkPrice = applyBulkPrice;
window.applyBulkBrand = applyBulkBrand;
window.applyBulkCategory = applyBulkCategory;
window.applyBulkSpecs = applyBulkSpecs;
window.bulkDeleteSelected = bulkDeleteSelected;
window.onBulkCategoryChange = onBulkCategoryChange;
window.onBulkPartModelChange = onBulkPartModelChange;
window.openInlinePrice = openInlinePrice;
window.closeInlinePrice = closeInlinePrice;
window.saveInlinePrice = saveInlinePrice;
window.mergeSelectedProducts = mergeSelectedProducts;

