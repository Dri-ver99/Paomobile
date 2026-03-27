let allProducts = [];
let currentCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAuth();
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
            indicator.style.background = "#52c41a";
            statusTxt.textContent = "Firestore: เชื่อมต่อแล้ว (" + user.email.split('@')[0] + ")";
            startSync();
        } else {
            indicator.style.background = "#faad14";
            statusTxt.innerHTML = 'กรุณาล็อกอิน <button onclick="login()" style="border:none; background:#ee4d2d; color:#fff; padding:2px 8px; border-radius:4px; cursor:pointer;">Login</button>';
        }
    });
}

function login() {
    firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
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
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", emoji: "🔌", img: "Anidary Type c To c - 1.jpg", badge: "โปรโมชั่น 1฿" }
];

function startSync() {
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
                    <div class="product-sku-txt">${p.brand} ${p.badge ? `· <span style="color:#ee4d2d">${p.badge}</span>` : ''}</div>
                </div>
            </td>
            <td><span class="category-tag tag-${p.category}">${getCategoryName(p.category)}</span></td>
            <td><div class="price-txt">฿${p.price.toLocaleString()}</div></td>
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

function refreshImgPreviews() {
    const row = document.getElementById('imgPreviewRow');
    if (!row) return;
    row.innerHTML = uploadedImages.map((src, i) => `
        <div style="position:relative;">
            <img src="${src}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:2px solid ${i===0?'#ee4d2d':'#ddd'};">
            ${i===0 ? '<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(238,77,45,0.85);color:#fff;font-size:0.6rem;text-align:center;border-radius:0 0 6px 6px;padding:2px;">หน้าหลัก</div>' : ''}
            <button onclick="removeImg(${i})" style="position:absolute;top:-6px;right:-6px;background:#333;color:#fff;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;font-size:0.7rem;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
    `).join('');
    // Update hidden inputs
    document.getElementById('formImg').value = uploadedImages[0] || '';
    document.getElementById('formImagesJSON').value = JSON.stringify(uploadedImages);
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
