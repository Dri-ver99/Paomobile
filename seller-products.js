let allProducts = [];
let currentCategory = 'all';
let sparePartsConfig = { models: [], partTypes: [] };

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAuth();
    // Start sync immediately to show mock data at least, while waiting for Auth
    startSync();
});

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            renderProducts();
        });
    });
}

function initAuth() {
    firebase.auth().onAuthStateChanged(user => {
        const indicator = document.getElementById('statusIndicator');
        const statusTxt = document.getElementById('statusText');
        
        if (user) {
            // Attempt to get email from primary or provider data
            const email = (user.email || (user.providerData && user.providerData[0] && user.providerData[0].email) || "").toLowerCase();
            const isAdmin = email === "sattawat2560@gmail.com";
            
            console.log("[Auth] User logged in:", email, "isAdmin:", isAdmin, "UID:", user.uid);

            if (isAdmin) {
                indicator.style.background = "#52c41a";
                statusTxt.textContent = "แอดมิน: " + (user.displayName || email);
                const submitBtn = document.getElementById('btnSubmitForm');
                if (submitBtn) {
                   submitBtn.disabled = false;
                   submitBtn.style.opacity = "1";
                }
            } else {
                indicator.style.background = "#ff4d4f";
                const displayInfo = email || user.uid.substring(0,8) + "...";
                statusTxt.innerHTML = "ไม่มีสิทธิ์ (" + displayInfo + ') <button onclick="logout()" style="border:none; background:#888; color:#fff; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:0.7rem;">Logout</button>';
            }

            startSync();
            if (typeof startConfigSync === 'function') startConfigSync(); 
        } else {
            indicator.style.background = "#faad14";
            statusTxt.innerHTML = 'กรุณาล็อกอิน <button onclick="login()" style="border:none; background:#ee4d2d; color:#fff; padding:2px 8px; border-radius:4px; cursor:pointer;">Login</button>';
        }
    });
}

function login() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' }); // Always ask which account to use
    firebase.auth().signInWithPopup(provider);
}

function logout() {
    firebase.auth().signOut().then(() => {
        window.location.reload();
    });
}

const MOCK_PRODUCTS_BASELINE = [
  { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", emoji: "📱", specs: "หน้าจอ 6.1\" · ชิป A16 · รับประกัน 1 ปี", badge: "ใหม่" },
  { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", emoji: "📱", specs: "หน้าจอ 6.1\" · ชิป A17 Pro · ไทเทเนียม", badge: "ขายดี" },
  { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", emoji: "📲", specs: "หน้าจอ 6.2\" · Snapdragon 8 Gen 3 · AI", badge: "ใหม่" },
  { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", emoji: "📲", specs: "หน้าจอ 6.36\" · Snapdragon 8 Gen 3 · Leica", badge: "" },
  { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", emoji: "📱", specs: "สภาพ 90% · แบต 88% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", emoji: "📱", specs: "สภาพ 85% · แบต 82% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", specs: "สภาพ 92% · แบต 90% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", specs: "สภาพ 88% · แบต 85% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", specs: "สภาพ 87% · แบต 83% · รับประกัน 3 เดือน", badge: "มือ 2" },
  { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 60W-1 Type C To C - 1.jpg", badge: "ใหม่" },
  { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", emoji: "🔌", img: "Why 20w-1.jpg", badge: "ใหม่" },
  { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", emoji: "🎧", img: "earphone-1.jpg", badge: "" },
  { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", emoji: "🔌", img: "ANS006-1.jpg", badge: "" },
  { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", emoji: "🔌", img: "Why-1.jpg", badge: "" },
  { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", emoji: "🔌", img: "USB-I 12W-1.jpg", badge: "" },
  { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", badge: "" },
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", badge: "โปรโมชั่น 1฿" },
  
  // --- Baseline Spare Parts ---
  { id: "part-screen-iph13", name: "จอ iPhone 13 (งานแท้)", price: 3500, brand: "Apple", category: "parts", emoji: "🔧", specs: "งานแท้ · รับประกัน 6 เดือน", badge: "ยอดนิยม" },
  { id: "part-batt-iph11", name: "แบตเตอรี่ iPhone 11 (เพิ่มความจุ)", price: 1200, brand: "Apple", category: "parts", emoji: "🔋", specs: "มอก. · เพิ่มความจุ · รับประกัน 1 ปี", badge: "ขายดี" },
  { id: "part-screen-s23u", name: "จอ Samsung S23 Ultra (OLED)", price: 6500, brand: "Samsung", category: "parts", emoji: "🔧", specs: "OLED · รองรับสแกนนิ้ว · รับประกัน 6 เดือน", badge: "เกรดพรีเมียม" },
  { id: "part-charging-iph12", name: "ชุดแพรชาร์จ iPhone 12", price: 890, brand: "Apple", category: "parts", emoji: "🔌", specs: "ของใหม่ · รับประกัน 3 เดือน", badge: "" }
];

function startSync() {
    if (typeof db === 'undefined' || !db) {
        // Fallback to mock data immediately if db isn't ready
        allProducts = [...MOCK_PRODUCTS_BASELINE];
        renderProducts();
        setTimeout(startSync, 1000); // Retry sync when db is ready
        return;
    }

    db.collection('products').onSnapshot(snapshot => {
        const firestoreProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Merge: start with baseline mock data, then overlay any Firestore products (new additions or edits)
        const mergedMap = new Map();
        MOCK_PRODUCTS_BASELINE.forEach(p => mergedMap.set(p.id, p));
        firestoreProducts.forEach(p => mergedMap.set(p.id, p));
        allProducts = Array.from(mergedMap.values());

        // Show migration banner only if there are NO Firestore products at all
        const migrationBanner = document.getElementById('migrationBanner');
        migrationBanner.style.display = firestoreProducts.length === 0 ? 'flex' : 'none';

        document.getElementById('productCountStatus').textContent = "สินค้าทั้งหมด: " + allProducts.length;
        renderProducts();
    }, err => {
        console.error("Firestore error, showing mock data only:", err);
        allProducts = [...MOCK_PRODUCTS_BASELINE];
        document.getElementById('productCountStatus').textContent = "สินค้าทั้งหมด: " + allProducts.length + " (ออฟไลน์)";
        renderProducts();
    });
}

function renderProducts() {
    const tbody = document.getElementById('product-list-body');
    const searchVal = document.getElementById('productSearch').value.toLowerCase();

    let filtered = allProducts;
    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category === currentCategory);
    }
    if (searchVal) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(searchVal) || 
            p.brand.toLowerCase().includes(searchVal) ||
            p.category.toLowerCase().includes(searchVal)
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">ไม่พบสินค้าในหมวดหมู่นี้</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td class="product-img-cell">
                ${p.img ? `<img src="${p.img}" class="product-img-mini">` : `<div class="product-img-mini">${p.emoji || '📦'}</div>`}
            </td>
            <td>
                <div class="product-name-info">
                    <div class="product-name-txt">${p.name}</div>
                    <div class="product-sku-txt">
                        ${p.brand} 
                        ${p.badge ? `· <span style="color:#ee4d2d">${p.badge}</span>` : ''}
                        ${p.category === 'parts' && p.partModel ? `· <span style="color:#2f54eb; font-weight:600;">[${p.partModel}]</span>` : ''}
                        ${p.category === 'parts' && p.partType ? `<br><small style="color:#888;">${p.partType}</small>` : ''}
                    </div>
                </div>
            </td>
            <td><span class="category-tag tag-${p.category}">${getCategoryName(p.category)}</span></td>
            <td><div class="price-txt">฿${(p.price || 0).toLocaleString()}</div></td>
            <td class="actions-cell">
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
             style="position:relative; width:70px; height:70px; border-radius:8px; border:2px solid ${i===0?'#ee4d2d':'#ddd'}; overflow:hidden; background:#eee;">
            <img src="${src}" style="width:100%; height:100%; object-fit:cover;">
            ${i===0 ? '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(238,77,45,0.85);color:#fff;font-size:0.6rem;text-align:center;padding:2px;">หน้าหลัก</div>' : ''}
            <button type="button" onclick="removeImg(${i})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.5);color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;">✕</button>
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
// ────────────────────────────────────────────────────────────────────

function openAddModal() {
    document.getElementById('modalTitle').textContent = "เพิ่มสินค้าใหม่";
    document.getElementById('formProductId').value = "";
    document.getElementById('productForm').reset();
    uploadedImages = [];
    refreshImgPreviews();
    togglePartsFields(); // Reset parts fields visibility
    
    // Safety: Disable save button if not logged in as Admin
    const submitBtn = document.getElementById('btnSubmitForm');
    if (submitBtn) {
        const user = firebase.auth().currentUser;
        const isAdmin = user && user.email && user.email.toLowerCase() === "sattawat2560@gmail.com";
        submitBtn.disabled = !isAdmin;
        submitBtn.style.opacity = isAdmin ? "1" : "0.5";
    }

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

    document.getElementById('productModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitForm');
    btn.disabled = true;
    btn.textContent = "กำลังบันทึก...";

    const id = document.getElementById('formProductId').value;
    const imagesArr = uploadedImages.length ? uploadedImages : [];
    const data = {
        name: document.getElementById('formName').value,
        brand: document.getElementById('formBrand').value,
        price: parseFloat(document.getElementById('formPrice').value),
        category: document.getElementById('formCategory').value,
        description: document.getElementById('formDescription').value,
        emoji: document.getElementById('formEmoji').value || "📦",
        img: imagesArr[0] || document.getElementById('formImg').value || "",
        images: imagesArr,
        badge: document.getElementById('formBadge').value,
        specs: document.getElementById('formSpecs').value,
        partModel: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartModel').value : "",
        partType: document.getElementById('formCategory').value === 'parts' ? document.getElementById('formPartType').value : "",
        lastUpdatedBy: firebase.auth().currentUser ? firebase.auth().currentUser.email : "unknown",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (id) {
            // Use set+merge so it creates the doc if it doesn't exist (e.g. baseline products)
            await db.collection('products').doc(id).set({ ...data, id }, { merge: true });
        } else {
            const newDoc = db.collection('products').doc();
            await newDoc.set({ ...data, id: newDoc.id });
        }
        closeModal();
    } catch (err) {
        alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "บันทึกสินค้า";
    }
}

async function deleteProduct(id) {
    if (!confirm("🚨 ยืนยันการลบสินค้าชิ้นนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้")) return;
    try {
        await db.collection('products').doc(id).delete();
    } catch (err) {
        alert("ลบไม่สำเร็จ: " + err.message);
    }
}

function filterProducts() {
    renderProducts();
}

async function runMigration() {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการนำเข้าสินค้าเริ่มต้น 17 รายการเข้าสู่ระบบ?")) return;
    
    const migrationBtn = document.querySelector('#migrationBanner button');
    migrationBtn.disabled = true;
    migrationBtn.textContent = "กำลังนำเข้า...";

    try {
        const res = await fetch('products-data.json');
        const products = await res.json();
        
        const batch = db.batch();
        products.forEach(p => {
            const ref = db.collection('products').doc(p.id);
            batch.set(ref, {
                ...p,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        alert("นำเข้าข้อมูลสำเร็จแล้วคับ!");
    } catch (err) {
        alert("Migration Failed: " + err.message);
    } finally {
        migrationBtn.disabled = false;
        migrationBtn.textContent = "นำเข้าสินค้าทันที";
    }
}

// ── Dynamic Category Management Logic ──────────────────────────────
function startConfigSync() {
    if (typeof db === 'undefined') return;
    db.collection('settings').doc('spare_parts').onSnapshot(doc => {
        if (doc.exists) {
            sparePartsConfig = doc.data();
            if (!sparePartsConfig.mappings) sparePartsConfig.mappings = {};
        } else {
            // Initial seed if doc doesn't exist
            const initial = {
                models: ["iPhone", "Samsung", "Xiaomi", "OPPO", "Vivo"],
                partTypes: ["หน้าจอ", "แบตเตอรี่", "แพรชาร์จ"],
                mappings: {
                    "iPhone": ["หน้าจอ", "แบตเตอรี่"],
                    "Samsung": ["หน้าจอ"]
                }
            };
            db.collection('settings').doc('spare_parts').set(initial);
            sparePartsConfig = initial;
        }
        refreshCategoryUI();
    });
}

function refreshCategoryUI() {
    // 1. Update manage modal lists
    const mList = document.getElementById('modelsList');
    const pList = document.getElementById('partTypesList');
    const targetCheckboxes = document.getElementById('targetModelsCheckboxes');
    
    // Render Main Models with delete buttons
    if (mList) {
        mList.innerHTML = (sparePartsConfig.models || []).map(m => `
            <div style="background:#f0f2f5; padding:5px 12px; border-radius:20px; display:flex; align-items:center; gap:8px; font-size:0.85rem; border:1px solid #d9d9d9;">
                <span>${m}</span>
                <span onclick="deleteConfigItem('models', '${m}')" style="color:#ff4d4f; cursor:pointer; font-weight:bold; font-size:1.1rem;">×</span>
            </div>
        `).join('') || '<div style="color:#ccc">ไม่มีข้อมูล</div>';
    }

    // Render Checkboxes for mapping
    if (targetCheckboxes) {
        if ((sparePartsConfig.models || []).length > 0) {
            targetCheckboxes.innerHTML = sparePartsConfig.models.map(m => `
                <label style="display:flex; align-items:center; gap:6px; background:#fff; padding:4px 10px; border:1px solid #ddd; border-radius:15px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">
                    <input type="checkbox" name="targetModel" value="${m}" style="accent-color:#ee4d2d;">
                    ${m}
                </label>
            `).join('');
        } else {
            targetCheckboxes.innerHTML = '<div style="font-size: 0.8rem; color: #999; padding: 10px;">กรุณาเพิ่มรุ่นโทรศัพท์ด้านบนก่อน...</div>';
        }
    }

    // Render Part Types with their associated models
    if (pList) {
        const mappings = sparePartsConfig.mappings || {};
        pList.innerHTML = (sparePartsConfig.partTypes || []).map(t => {
            // Find which models have this part type
            const associatedModels = Object.keys(mappings).filter(m => mappings[m] && mappings[m].includes(t));
            
            return `
                <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:#A68A64;">🔧 ${t}</span>
                        <div style="display:flex; gap:10px;">
                            <span onclick="editMapping('${t}')" style="color:#1890ff; cursor:pointer; font-size:0.85rem; font-weight:600;">แก้ไข</span>
                            <span onclick="deleteConfigItem('partTypes', '${t}')" style="color:#ff4d4f; cursor:pointer; font-size:0.85rem; font-weight:600;">ลบ</span>
                        </div>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:5px;">
                        ${associatedModels.length > 0 ? 
                            associatedModels.map(am => `<span style="background:#fef4e8; color:#A68A64; font-size:0.7rem; padding:2px 8px; border-radius:10px; border:1px solid #f5dab1;">${am}</span>`).join('') :
                            '<span style="color:#ccc; font-size:0.7rem;">(ยังไม่ได้จับคู่รุ่น)</span>'
                        }
                    </div>
                </div>
            `;
        }).join('') || '<div style="color:#ccc">ยังไม่มีประเภทอะไหล่</div>';
    }

    // 2. Update product form selects (filtering models based on the current product or just showing all)
    const mSelect = document.getElementById('formPartModel');
    const pSelect = document.getElementById('formPartType');
    
    if (mSelect) {
        mSelect.innerHTML = '<option value="">-- เลือกรุ่นโทรศัพท์ --</option>' + 
            (sparePartsConfig.models || []).map(m => `<option value="${m}">${m}</option>`).join('');
    }
    if (pSelect) {
        // Initial load shows all, but we can filter this dynamically later if needed
        pSelect.innerHTML = '<option value="">-- เลือกประเภทอะไหล่ --</option>' + 
            (sparePartsConfig.partTypes || []).map(t => `<option value="${t}">${t}</option>`).join('');
    }
}

async function addConfigItem(type) {
    const inputId = type === 'models' ? 'newModelInput' : 'newPartTypeInput';
    const input = document.getElementById(inputId);
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    const currentArr = sparePartsConfig[type] || [];
    if (currentArr.includes(val) && type === 'models') {
        alert("มีชื่อรุ่นนี้อยู่แล้วครับ");
        return;
    }

    try {
        let updates = {};
        if (type === 'models') {
            updates.models = [...currentArr, val];
        } else {
            // Adding or Updating a Part Type with Mapping
            const selectedModels = Array.from(document.querySelectorAll('input[name="targetModel"]:checked')).map(cb => cb.value);
            if (selectedModels.length === 0) {
                alert("กรุณาเลือกรุ่นโทรศัพท์ที่ต้องการให้แสดงอย่างน้อย 1 รุ่นครับ");
                return;
            }

            // 1. Update partTypes array (if unique)
            if (!currentArr.includes(val)) {
                updates.partTypes = [...currentArr, val];
            }

            // 2. Update mappings object (STRICT SYNC: remove old associations first)
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            
            // First, remove this part type from ALL models to ensure we only have the currently selected ones
            Object.keys(newMappings).forEach(m => {
                newMappings[m] = (newMappings[m] || []).filter(item => item !== val);
            });

            // Then, add it to only the selected models
            selectedModels.forEach(m => {
                if (!newMappings[m]) newMappings[m] = [];
                if (!newMappings[m].includes(val)) newMappings[m].push(val);
            });
            updates.mappings = newMappings;
        }

        await db.collection('settings').doc('spare_parts').update(updates);
        input.value = "";
        // Uncheck all checkboxes if it was a part type
        if (type === 'partTypes') {
            document.querySelectorAll('input[name="targetModel"]').forEach(cb => cb.checked = false);
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
}

function editMapping(partType) {
    const input = document.getElementById('newPartTypeInput');
    if (!input) return;

    // 1. Set input value
    input.value = partType;

    // 2. Reset checkboxes
    const checkboxes = document.querySelectorAll('input[name="targetModel"]');
    checkboxes.forEach(cb => cb.checked = false);

    // 3. Check those associated with this partType
    const mappings = sparePartsConfig.mappings || {};
    Object.keys(mappings).forEach(m => {
        if (mappings[m] && mappings[m].includes(partType)) {
            const cb = Array.from(checkboxes).find(c => c.value === m);
            if (cb) cb.checked = true;
        }
    });

    // 4. Scroll up to the input area for better UX
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input.focus();
}

async function deleteConfigItem(type, val) {
    if (!confirm(`ยืนยันการลบ "${val}" ใช่หรือไม่?`)) return;
    try {
        let updates = {};
        if (type === 'models') {
            updates.models = (sparePartsConfig.models || []).filter(item => item !== val);
            // Also clean up mappings for this model
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            delete newMappings[val];
            updates.mappings = newMappings;
        } else {
            updates.partTypes = (sparePartsConfig.partTypes || []).filter(item => item !== val);
            // Also clean up this part type from all models in mappings
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            Object.keys(newMappings).forEach(m => {
                newMappings[m] = newMappings[m].filter(t => t !== val);
            });
            updates.mappings = newMappings;
        }
        await db.collection('settings').doc('spare_parts').update(updates);
    } catch (e) {
        alert("Error: " + e.message);
    }
}

function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'none';
}

function togglePartsFields() {
    const select = document.getElementById('formCategory');
    if (!select) return;
    const cat = select.value;
    const fields = document.getElementById('partsFields');
    if (fields) fields.style.display = (cat === 'parts') ? 'grid' : 'none';
}
