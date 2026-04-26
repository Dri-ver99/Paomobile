/**
 * seller-config.js
 * Shared logic for Spare Parts Category Management across Seller Centre pages.
 */

let sparePartsConfig = { models: [], partTypes: [], mappings: {} };
let editingOriginalPartType = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Active State Logic
    initSidebarActiveStates();

    // Fast Navigation without reload if already on seller-products.html
    const sidebarLinks = document.querySelectorAll('a.menu-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (!href) return;
            const currentPath = window.location.pathname.toLowerCase();
            const isOnProductsPage = currentPath.endsWith('seller-products.html');
            
            if (isOnProductsPage) {
                if (href === 'seller-products.html?action=manage_cat') {
                    e.preventDefault();
                    if (typeof openCategoryModal === 'function') openCategoryModal();
                    if (typeof toggleSellerMobileMenu === 'function') toggleSellerMobileMenu(false);
                } else if (href === 'seller-products.html?action=add') {
                    e.preventDefault();
                    if (typeof openAddModal === 'function') openAddModal();
                    if (typeof toggleSellerMobileMenu === 'function') toggleSellerMobileMenu(false);
                }
            }
        });
    });

    // 2. Check if Firebase and DB are ready
    const checkFirestore = setInterval(() => {
        if (typeof db !== 'undefined' && db) {
            clearInterval(checkFirestore);
            startConfigSync();
            startSellerPresence(); // Initiate real-time status update
        }
    }, 500);
});

// Automatically highlight active sidebar menu based on current URL
function initSidebarActiveStates() {
    try {
        // 1. Normalize current URL parts
        const currentPath = window.location.pathname.split('/').pop() || 'seller-centre.html';
        const currentQuery = window.location.search;
        const currentURL = currentPath + currentQuery;
        
        // Target all sidebar menus (Desktop & Mobile-in-content)
        const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-item, .sidebar-menu .menu-item-home, .mobile-sidebar .menu-item');
        
        let bestMatch = null;
        let bestScore = -1; // -1: none, 1: path, 2: path+query

        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;

            // Score link against current URL
            if (href === currentURL) {
                bestMatch = link;
                bestScore = 2;
            } else if (href === currentPath && bestScore < 1) {
                bestMatch = link;
                bestScore = 1;
            }
        });

        // Apply active class to the best match
        if (bestMatch) {
            bestMatch.classList.add('active');
            
            // Mirror state to the secondary sidebar (Desktop <-> Mobile Overlay)
            const targetHref = bestMatch.getAttribute('href');
            sidebarLinks.forEach(l => {
                if (l.getAttribute('href') === targetHref) l.classList.add('active');
            });
        }
    } catch(e) {
        console.warn("Sidebar highlight error:", e);
    }
}

// Expose globally for other scripts to call
window.updateSidebarActiveState = initSidebarActiveStates;

// Real-time listener for spare parts configuration
function startConfigSync() {
    if (typeof db === 'undefined' || !db) return;
    
    db.collection('settings').doc('spare_parts').onSnapshot(doc => {
        if (doc.exists) {
            sparePartsConfig = doc.data();
            if (!sparePartsConfig.mappings) sparePartsConfig.mappings = {};
            if (!sparePartsConfig.models) sparePartsConfig.models = [];
            if (!sparePartsConfig.partTypes) sparePartsConfig.partTypes = [];
        }
        // หมายเหตุ: ถ้า doc ยังไม่มีใน Firestore ให้คงค่าว่างไว้
        // ระบบจะไม่ seed ค่า default โดยอัตโนมัติ
        // Seller จะเป็นคนกำหนดเองผ่าน Modal เท่านั้น
        refreshCategoryUI();
    }, err => {
        console.error("Config Sync Error:", err);
    });
}

// Refresh the UI within the Category Management Modal
function refreshCategoryUI() {
    const mList = document.getElementById('modelsList');
    const pList = document.getElementById('partTypesList');
    const targetCheckboxes = document.getElementById('targetModelsCheckboxes');
    
    // 1. Render Main Models with delete buttons
    if (mList) {
        mList.innerHTML = (sparePartsConfig.models || []).map(m => `
            <div style="background:#f0f2f5; padding:5px 12px; border-radius:20px; display:flex; align-items:center; gap:8px; font-size:0.85rem; border:1px solid #d9d9d9;">
                <span>${m}</span>
                <span onclick="deleteConfigItem('models', '${m}')" style="color:#ff4d4f; cursor:pointer; font-weight:bold; font-size:1.1rem;">×</span>
            </div>
        `).join('') || '<div style="color:#ccc">ไม่มีข้อมูล</div>';
    }

    // 2. Render Checkboxes for mapping
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

    if (pList) {
        const mappings = sparePartsConfig.mappings || {};
        pList.innerHTML = (sparePartsConfig.partTypes || []).map((t, index) => {
            const associatedModels = Object.keys(mappings).filter(m => mappings[m] && mappings[m].includes(t));
            
            return `
                <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:600; color:#A68A64;">🔧 ${t}</span>
                        <div style="display:flex; gap:10px; align-items: center;">
                            <span onclick="movePartTypeUp(${index})" style="color:#888; cursor:pointer; font-size:1.1rem; padding:0 4px; visibility: ${index === 0 ? 'hidden' : 'visible'};" title="เลื่อนขึ้น">🔼</span>
                            <span onclick="movePartTypeDown(${index})" style="color:#888; cursor:pointer; font-size:1.1rem; padding:0 4px; visibility: ${index === (sparePartsConfig.partTypes || []).length - 1 ? 'hidden' : 'visible'};" title="เลื่อนลง">🔽</span>
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

    // 4. Update product form selects in seller-products.html (if present)
    const mSelect = document.getElementById('formPartModel');
    if (mSelect) {
        const currentVal = mSelect.value;
        mSelect.innerHTML = '<option value="">-- เลือกรุ่นโทรศัพท์ --</option>' + 
            (sparePartsConfig.models || []).map(m => `<option value="${m}">${m}</option>`).join('');
        mSelect.value = currentVal; // Try Restore
    }
    
    // Call external refresh if needed (for seller-products.js)
    if (typeof refreshPartTypeDropdown === 'function') {
        refreshPartTypeDropdown();
    }
}

// Add Item (Models or Part Types)
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
            // RENAMING CHECK
            if (editingOriginalPartType && editingOriginalPartType !== val) {
                if (!confirm(`คุณต้องการเปลี่ยนชื่อจาก "${editingOriginalPartType}" เป็น "${val}" ใช่หรือไม่?\nการเปลี่ยนชื่อจะส่งผลต่อสินค้าที่มีอยู่ทั้งหมดในระบบครับ`)) {
                    return;
                }
            }

            const selectedModels = Array.from(document.querySelectorAll('input[name="targetModel"]:checked')).map(cb => cb.value);
            if (selectedModels.length === 0) {
                alert("กรุณาเลือกรุ่นโทรศัพท์ที่ต้องการให้แสดงอย่างน้อย 1 รุ่นครับ");
                return;
            }

            // 1. Update partTypes array
            if (editingOriginalPartType) {
                updates.partTypes = currentArr.map(item => item === editingOriginalPartType ? val : item);
                updates.partTypes = [...new Set(updates.partTypes)];
            } else {
                if (!currentArr.includes(val)) {
                    updates.partTypes = [...currentArr, val];
                }
            }

            // 2. Update mappings object
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            if (editingOriginalPartType) {
                Object.keys(newMappings).forEach(m => {
                    newMappings[m] = (newMappings[m] || []).filter(item => item !== editingOriginalPartType);
                });
            } else {
                Object.keys(newMappings).forEach(m => {
                    newMappings[m] = (newMappings[m] || []).filter(item => item !== val);
                });
            }

            selectedModels.forEach(m => {
                if (!newMappings[m]) newMappings[m] = [];
                if (!newMappings[m].includes(val)) newMappings[m].push(val);
            });
            updates.mappings = newMappings;

            // 3. Update all existing PRODUCTS (Data Migration)
            if (editingOriginalPartType && editingOriginalPartType !== val) {
                const batch = db.batch();
                const productsToUpdate = await db.collection('products').where('partType', '==', editingOriginalPartType).get();
                productsToUpdate.forEach(doc => {
                    batch.update(doc.ref, { partType: val });
                });
                await batch.commit();
            }
        }

        const SELLER_EMAIL = 'sattawat2560@gmail.com';
        const user = firebase.auth().currentUser;
        const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
        
        const isAdmin = (user && user.email && user.email.toLowerCase() === SELLER_EMAIL.toLowerCase()) || localAdminActive;

        if (!isAdmin) {
            if (typeof checkCloudPermission === 'function') {
                checkCloudPermission();
            } else {
                alert("🚫 คุณต้องใช้สิทธิ์ Admin เพื่อแก้ไขข้อมูลครับ\n(ล็อกอิน: " + (user ? user.email : 'ยังไม่ได้ล็อกอิน') + ")");
            }
            return;
        }

        await db.collection('settings').doc('spare_parts').set(updates, { merge: true });
        
        // Reset form
        input.value = "";
        if (type === 'partTypes') {
            document.querySelectorAll('input[name="targetModel"]').forEach(cb => cb.checked = false);
            resetPartTypeMode();
        }
    } catch (e) {
        alert("Error Save: " + e.message);
    }
}

// Edit Existing Mapping
function editMapping(partType) {
    const input = document.getElementById('newPartTypeInput');
    const submitBtn = document.getElementById('partTypeSubmitBtn');
    const cancelBtn = document.getElementById('cancelPartTypeEditBtn');
    if (!input) return;

    editingOriginalPartType = partType;
    input.value = partType;
    if (submitBtn) {
        submitBtn.textContent = "💾 บันทึกการแก้ไขหมวดหมู่";
        submitBtn.style.background = "#28a745";
    }
    if (cancelBtn) cancelBtn.style.display = 'block';

    const checkboxes = document.querySelectorAll('input[name="targetModel"]');
    checkboxes.forEach(cb => cb.checked = false);

    const mappings = sparePartsConfig.mappings || {};
    Object.keys(mappings).forEach(m => {
        if (mappings[m] && mappings[m].includes(partType)) {
            const cb = Array.from(checkboxes).find(c => c.value === m);
            if (cb) cb.checked = true;
        }
    });

    input.focus();
}

function resetPartTypeMode() {
    editingOriginalPartType = null;
    const input = document.getElementById('newPartTypeInput');
    const submitBtn = document.getElementById('partTypeSubmitBtn');
    const cancelBtn = document.getElementById('cancelPartTypeEditBtn');
    
    if (input) input.value = "";
    if (submitBtn) {
        submitBtn.textContent = "+ เพิ่มประเภทอะไหล่พร้อมจับคู่รุ่น";
        submitBtn.style.background = "#A68A64";
    }
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    document.querySelectorAll('input[name="targetModel"]').forEach(cb => cb.checked = false);
}

// Delete Item
async function deleteConfigItem(type, val) {
    if (!confirm(`ยืนยันการลบ "${val}" ใช่หรือไม่?`)) return;
    
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    const user = firebase.auth().currentUser;
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
    const isAdmin = (user && user.email && user.email.toLowerCase() === SELLER_EMAIL.toLowerCase()) || localAdminActive;

    if (!isAdmin) {
        if (typeof checkCloudPermission === 'function') {
            checkCloudPermission();
        } else {
            alert("🚫 ต้องใช้สิทธิ์ Admin เพื่อลบข้อมูลครับ");
        }
        return;
    }

    try {
        let updates = {};
        if (type === 'models') {
            updates.models = (sparePartsConfig.models || []).filter(item => item !== val);
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            delete newMappings[val];
            updates.mappings = newMappings;
        } else {
            updates.partTypes = (sparePartsConfig.partTypes || []).filter(item => item !== val);
            const newMappings = { ...(sparePartsConfig.mappings || {}) };
            Object.keys(newMappings).forEach(m => {
                newMappings[m] = (newMappings[m] || []).filter(t => t !== val);
            });
            updates.mappings = newMappings;
        }
        await db.collection('settings').doc('spare_parts').update(updates);
    } catch (e) {
        alert("Error Delete: " + e.message);
    }
}

// Manually Restore Default Categories
async function restoreDefaultSparePartsConfig() {
    if (!confirm('ยืนยันหน้าจอการล้างค่า "หมวดหมู่อะไหล่" ทั้งหมด และแทนที่ด้วยค่าเริ่มต้นใช่หรือไม่?')) return;
    
    const initial = {
        models: ["iPhone", "Samsung", "Xiaomi", "OPPO", "Vivo", "Realme", "Huawei", "อื่นๆ"],
        partTypes: ["หน้าจอ", "แบตเตอรี่", "แพรชาร์จ", "กล้องหลัง", "กล้องหน้า", "กระจกฝาหลัง"],
        mappings: {
            "iPhone": ["หน้าจอ", "แบตเตอรี่", "แพรชาร์จ", "กล้องหลัง"],
            "Samsung": ["หน้าจอ", "แบตเตอรี่"],
            "Xiaomi": ["หน้าจอ", "แบตเตอรี่"],
            "OPPO": ["หน้าจอ", "แบตเตอรี่"],
            "Vivo": ["หน้าจอ", "แบตเตอรี่"]
        }
    };

    try {
        if (typeof db === 'undefined' || !db) return;
        
        await db.collection('settings').doc('spare_parts').set(initial);
        alert('✅ คืนค่าหมวดหมู่เริ่มต้นเรียบร้อยแล้วครับ!');
    } catch (e) {
        alert("Restore Error: " + e.message);
    }
}
window.restoreDefaultSparePartsConfig = restoreDefaultSparePartsConfig;

window.movePartTypeUp = async function(index) {
    if (index <= 0) return;
    const types = [...(sparePartsConfig.partTypes || [])];
    const temp = types[index];
    types[index] = types[index - 1];
    types[index - 1] = temp;
    
    try {
        await db.collection('settings').doc('spare_parts').set({ partTypes: types }, { merge: true });
    } catch(err) {
        console.error("Move Error:", err);
    }
}

window.movePartTypeDown = async function(index) {
    const types = [...(sparePartsConfig.partTypes || [])];
    if (index >= types.length - 1) return;
    const temp = types[index];
    types[index] = types[index + 1];
    types[index + 1] = temp;
    
    try {
        await db.collection('settings').doc('spare_parts').set({ partTypes: types }, { merge: true });
    } catch(err) {
        console.error("Move Error:", err);
    }
}

// Modal Handlers
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) {
        modal.style.display = 'flex';
        refreshCategoryUI(); // Ensure fresh data on open
    }
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.style.display = 'none';
    resetPartTypeMode();
}

/**
 * ── SELLER PRESENCE SYSTEM ──────────────────────────────────────────
 * Updates Firestore with seller's online status and last seen timestamp.
 * Consolidates heartbeat to prevent multiple redundant writes.
 */
async function startSellerPresence() {
    if (typeof db === 'undefined' || !db) return;

    let isUpdating = false;

    const updateStatus = async (isOnline) => {
        if (isUpdating) return;
        isUpdating = true;
        
        try {
            const user = firebase.auth().currentUser;
            const statusRef = db.collection('status').doc('seller');
            
            await statusRef.set({
                isOnline: isOnline,
                lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                platform: 'web-seller-centre',
                email: user ? user.email : 'guest-admin'
            }, { merge: true });
            
            console.log(`[Presence] Seller ${isOnline ? 'ONLINE' : 'AWAY'} (v2)`);
        } catch (e) {
            // Silently fail to avoid clogging UI logs
        } finally {
            isUpdating = false;
        }
    };

    // 1. Initial Heartbeat with small delay for initial Auth state
    setTimeout(() => updateStatus(true), 2000);

    // 2. Periodic Heartbeat (Every 45 seconds for quota balance)
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateStatus(true);
        }
    }, 45000);

    // 3. Handle Visibility Change
    document.addEventListener('visibilitychange', () => {
        updateStatus(document.visibilityState === 'visible');
    });

    // 4. Handle Offline/Online browser events
    window.addEventListener('online', () => updateStatus(true));
    window.addEventListener('offline', () => updateStatus(false));
}

