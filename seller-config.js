/* โ”€โ”€ Premium Alert Override (auto-injected) โ”€โ”€ */
(function() {
    if (window.__alertOverrideInjected) return;
    window.__alertOverrideInjected = true;
    var _nativeAlert = window.alert;
    window.alert = function(msg) {
        if (window.sellerAlert) {
            // Detect type from message content
            var type = 'info';
            if (msg && (msg.includes('Error') || msg.includes('error') || msg.includes('เนเธกเนเธชเธณเน€เธฃเนเธ') || msg.includes('โ') || msg.includes('โ ๏ธ') || msg.includes('เธฅเธ') || msg.includes('เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”'))) type = 'error';
            else if (msg && (msg.includes('โ…') || msg.includes('เธชเธณเน€เธฃเนเธ') || msg.includes('เน€เธฃเธตเธขเธเธฃเนเธญเธข') || msg.includes('เธเธฑเธเธ—เธถเธ'))) type = 'success';
            else if (msg && (msg.includes('โ ๏ธ') || msg.includes('เธเธฃเธธเธ“เธฒ') || msg.includes('เธฃเธฐเธงเธฑเธ'))) type = 'warning';
            window.sellerAlert(String(msg), type);
        } else {
            _nativeAlert(msg);
        }
    };
})();
/* โ”€โ”€ End Premium Alert Override โ”€โ”€ */
/**
 * seller-config.js
 * Shared logic for Spare Parts Category Management across Seller Centre pages.
 */

let sparePartsConfig = { models: [], partTypes: [], mappings: {} };
let isConfigLoaded = false;
let editingOriginalPartType = null;

if (typeof document !== 'undefined' && !document.getElementById('seller-category-style')) {
    const style = document.createElement('style');
    style.id = 'seller-category-style';
    style.innerHTML = `
        .model-checkbox-label { transition: all 0.2s; }
        .model-checkbox-label:has(input:checked) { background: #ee4d2d !important; color: #fff !important; border-color: #ee4d2d !important; }
    `;
    document.head.appendChild(style);
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    

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

    // 2. Start config sync directly (Supabase handles its own init)
    setTimeout(() => {
        if (typeof startConfigSync === 'function') startConfigSync();
    }, 500);
});

// Automatically highlight active sidebar menu based on current URL


// Real-time listener for spare parts configuration
function startConfigSync() {
    const supabase = window.supabaseClient;
    if (!supabase) return;
    
    const fetchConfig = async () => {
        const { data: doc, error } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
        if (error && error.code !== 'PGRST116') { // PGRST116 is multiple/no rows found (no rows)
            console.error("Config Sync Error:", error);
            return;
        }
        
        isConfigLoaded = true;
        if (doc) {
            // Prefer root columns (which are updated by the app), fallback to doc.value for legacy
            const configData = (doc.models || doc.partTypes) ? doc : (doc.value || doc);
            sparePartsConfig = {
                models: configData.models || [],
                partTypes: configData.partTypes || [],
                mappings: configData.mappings || {}
            };
        }
        refreshCategoryUI();
    };

    fetchConfig();
    supabase.channel('public:settings:spare_parts')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'id=eq.spare_parts' }, payload => {
            fetchConfig();
        }).subscribe();
}

// Refresh the UI within the Category Management Modal
function refreshCategoryUI() {
    const mList = document.getElementById('modelsList');
    const pList = document.getElementById('partTypesList');
    const targetCheckboxes = document.getElementById('targetModelsCheckboxes');
    
    // 1. Render Main Models with Drag & Drop reorder
    if (mList) {
        const models = sparePartsConfig.models || [];
        mList.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; align-items:center;';
        mList.innerHTML = models.map((m, index) => `
            <div class="model-chip" draggable="true" data-index="${index}" data-model="${m}"
                 style="padding:5px 10px 5px 12px; border-radius:20px; background:#fef4e8; border:2px solid #A68A64; display:flex; align-items:center; gap:6px; font-size:0.85rem; cursor:grab; user-select:none; transition:box-shadow 0.15s, opacity 0.15s;">
                <span style="font-size:0.75rem; color:#bbb; margin-right:2px;">⠿</span>
                <span>${m}</span>
                <span onclick="deleteConfigItem('models', '${m}')" style="color:#ff4d4f; cursor:pointer; font-weight:bold; font-size:1.1rem; line-height:1;">×</span>
            </div>
        `).join('') || '<div style="color:#ccc">ไม่มีข้อมูล</div>';
        initModelsDragDrop(mList);
    }

    // 2. Render Checkboxes for mapping
    if (targetCheckboxes) {
        if ((sparePartsConfig.models || []).length > 0) {
            targetCheckboxes.innerHTML = sparePartsConfig.models.map(m => `
                <label class="model-checkbox-label" style="display:flex; align-items:center; gap:6px; background:#fff; padding:4px 10px; border:1px solid #ddd; border-radius:15px; cursor:pointer; font-size:0.8rem; white-space:nowrap;">
                    <input type="checkbox" name="targetModel" value="${m}" style="accent-color:#A68A64;">
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
            // เรียง associatedModels ตามลำดับของ models ที่ Seller กำหนดไว้ (ไม่ใช่ Object.keys ซึ่งไม่รักษาลำดับ)
            const associatedModels = (sparePartsConfig.models || []).filter(m => mappings[m] && mappings[m].includes(t));
            
            return `
                <div style="background:#fff; border:1px solid #eee; border-radius:10px; padding:12px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <input type="checkbox" class="part-type-checkbox" value="${t}" style="width:16px; height:16px; accent-color:#A68A64; cursor:pointer;">
                            <span style="font-weight:600; color:#A68A64;">🔧 ${t}</span>
                        </div>
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
    if (currentArr.includes(val) && type === 'models' && !editingOriginalPartType) {
        const msg = "มีชื่อรุ่นนี้อยู่แล้วครับ";
        if (typeof sellerAlert === 'function') sellerAlert(msg, 'warning');
        else alert(msg);
        return;
    }

    // Admin Check
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
    const user = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
    const isAdmin = localAdminActive || (user && user.email && user.email.toLowerCase() === SELLER_EMAIL.toLowerCase());

    if (!isAdmin) {
        const currentEmail = user ? (user.isAnonymous ? "Guest" : user.email) : "ยังไม่ได้ล็อกอิน";
        const msg = `🚫 คุณต้องใช้สิทธิ์ Admin เพื่อแก้ไขข้อมูลครับ\n(ปัจจุบัน: ${currentEmail})\n\nกรุณาล็อกอินใหม่ หรือกดปุ่ม "บังคับสิทธิ์ Admin" ที่เมนูขวาบนครับ`;
        if (typeof sellerAlert === 'function') sellerAlert(msg, 'warning');
        else alert(msg);
        
        // Try to show the permission modal if it exists in seller-products.js
        if (typeof checkCloudPermission === 'function') {
            checkCloudPermission();
        }
        return;
    }

    try {
        // Prepare renaming confirmation if needed
        if (type === 'partTypes' && editingOriginalPartType && editingOriginalPartType !== val) {
            const confirmMsg = `คุณต้องการเปลี่ยนชื่อจาก "${editingOriginalPartType}" เป็น "${val}" ใช่หรือไม่?\nการเปลี่ยนชื่อจะส่งผลต่อสินค้าที่มีอยู่ทั้งหมดในระบบครับ`;
            let confirmed = false;
            if (typeof sellerConfirm === 'function') confirmed = await sellerConfirm(confirmMsg, 'warning');
            else confirmed = confirm(confirmMsg);
            if (!confirmed) return;
        }

        const selectedModels = type === 'partTypes' ? 
            Array.from(document.querySelectorAll('input[name="targetModel"]:checked')).map(cb => cb.value) : [];
        
        if (type === 'partTypes' && selectedModels.length === 0) {
            const msg = "กรุณาเลือกรุ่นโทรศัพท์ที่ต้องการให้แสดงอย่างน้อย 1 รุ่นครับ";
            if (typeof sellerAlert === 'function') sellerAlert(msg, 'warning');
            else alert(msg);
            return;
        }

        // --- Quota-Efficient Updates ---
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error("Supabase ไม่พร้อมใช้งาน");
        
        let configData = { models: [], partTypes: [], mappings: {} };
        const { data: snap } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
        if (snap) {
            configData = {
                models: snap.models || [],
                partTypes: snap.partTypes || [],
                mappings: snap.mappings || {}
            };
        }

        if (type === 'models') {
            if (!configData.models.includes(val)) {
                configData.models.push(val);
            }
            await supabase.from('settings').upsert({
                id: 'spare_parts',
                models: configData.models,
                partTypes: configData.partTypes,
                mappings: configData.mappings
            });

        } else if (!editingOriginalPartType) {
            if (!configData.partTypes.includes(val)) {
                configData.partTypes.push(val);
            }
            selectedModels.forEach(m => {
                if (!configData.mappings[m]) configData.mappings[m] = [];
                if (!configData.mappings[m].includes(val)) configData.mappings[m].push(val);
            });
            await supabase.from('settings').upsert({
                id: 'spare_parts',
                models: configData.models,
                partTypes: configData.partTypes,
                mappings: configData.mappings
            });

        } else {
            // RENAME partType
            configData.partTypes = configData.partTypes.map(item => item === editingOriginalPartType ? val : item);
            configData.partTypes = [...new Set(configData.partTypes)];

            Object.keys(configData.mappings).forEach(m => {
                const arr = configData.mappings[m] || [];
                const idx = arr.indexOf(editingOriginalPartType);
                if (idx !== -1) arr[idx] = val;
                configData.mappings[m] = arr;
            });

            selectedModels.forEach(m => {
                if (!configData.mappings[m]) configData.mappings[m] = [];
                if (!configData.mappings[m].includes(val)) configData.mappings[m].push(val);
            });

            await supabase.from('settings').upsert({
                id: 'spare_parts',
                models: configData.models,
                partTypes: configData.partTypes,
                mappings: configData.mappings
            });
        }

        // UPDATE LOCAL STATE AND REFRESH UI
        sparePartsConfig = { ...configData };
        refreshCategoryUI();

        // 3. NOTE: ไม่ migrate สินค้าทันที เพราะจะทำให้ quota หมด
        // Seller สามารถแก้ไขสินค้าแต่ละชิ้นได้เองภายหลัง
        // หรือสินค้าใหม่ที่เพิ่มจะใช้ชื่อหมวดหมู่ใหม่โดยอัตโนมัติ

        // Reset form
        input.value = "";
        if (type === 'partTypes') {
            document.querySelectorAll('input[name="targetModel"]').forEach(cb => cb.checked = false);
            resetPartTypeMode();
        }

        if (editingOriginalPartType && editingOriginalPartType !== val) {
            if (typeof sellerAlert === 'function') {
                sellerAlert(`✅ เปลี่ยนชื่อ "${editingOriginalPartType}" → "${val}" สำเร็จแล้วครับ!\n\nหมายเหตุ: สินค้าที่มีอยู่เดิมยังใช้ชื่อหมวดหมู่เก่า กรุณาแก้ไขสินค้าแต่ละชิ้นเองในหน้าจัดการสินค้าครับ`, 'success');
            }
        } else {
            if (typeof sellerAlert === 'function') sellerAlert("บันทึกข้อมูลเรียบร้อยแล้วครับ", "success");
        }
    } catch (e) {
        console.error("Save Error:", e);
        if (e.code === 'permission-denied' || e.message.includes('permissions')) {
            const msg = "🚫 สิทธิ์การเข้าถึงถูกปฏิเสธครับ (Permission Denied)\n\nกรุณากดปุ่ม \"บังคับสิทธิ์ Admin\" ที่มุมขวาบนของหน้าจอ (แถบสถานะ) เพื่อยืนยันตัวตนก่อนนะครับ";
            if (typeof sellerAlert === 'function') sellerAlert(msg, 'error');
            else alert(msg);
        } else {
            if (typeof sellerAlert === 'function') sellerAlert("เกิดข้อผิดพลาด: " + e.message, "error");
            else alert("Error Save: " + e.message);
        }
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
    const submitBtn = document.getElementById('submitCategoryBtn');
    if (submitBtn) {
        submitBtn.textContent = "+ เพิ่มประเภทอะไหล่พร้อมจับคู่รุ่น";
        submitBtn.style.background = "#A68A64";
    }
    const cancelBtn = document.getElementById('cancelPartTypeEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    document.querySelectorAll('input[name="targetModel"]').forEach(cb => cb.checked = false);
}

// Delete Item
async function deleteConfigItem(type, val) {
    const confirmMsg = `ยืนยันการลบ "${val}" ใช่หรือไม่?`;
    let confirmed = false;
    if (typeof sellerConfirm === 'function') confirmed = await sellerConfirm(confirmMsg, 'delete');
    else confirmed = confirm(confirmMsg);
    if (!confirmed) return;
    
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
    const user = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
    const isAdmin = localAdminActive || (user && user.email && user.email.toLowerCase() === SELLER_EMAIL.toLowerCase());

    if (!isAdmin) {
        if (typeof checkCloudPermission === 'function') {
            checkCloudPermission();
        } else {
            alert("🚫 ต้องใช้สิทธิ์ Admin เพื่อลบข้อมูลครับ");
        }
        return;
    }

    try {
        const supabase = window.supabaseClient;
        if (!supabase) throw new Error("Supabase ไม่พร้อมใช้งาน");

        const { data: snap } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
        if (!snap) return;

        let configData = {
            models: snap.models || [],
            partTypes: snap.partTypes || [],
            mappings: snap.mappings || {}
        };

        if (type === 'models') {
            configData.models = configData.models.filter(m => m !== val);
            delete configData.mappings[val];
        } else {
            configData.partTypes = configData.partTypes.filter(item => item !== val);
            Object.keys(configData.mappings).forEach(m => {
                configData.mappings[m] = (configData.mappings[m] || []).filter(t => t !== val);
            });
        }

        await supabase.from('settings').upsert({
            id: 'spare_parts',
            models: configData.models,
            partTypes: configData.partTypes,
            mappings: configData.mappings
        });

        // UPDATE LOCAL STATE AND REFRESH UI
        sparePartsConfig = { ...configData };
        refreshCategoryUI();
    } catch (e) {
        console.error("Delete Error:", e);
        if (e.code === 'permission-denied' || e.message.includes('permissions')) {
            const msg = "🚫 ไม่สามารถลบได้: สิทธิ์การเข้าถึงถูกปฏิเสธครับ\n\nกรุณากดปุ่ม \"บังคับสิทธิ์ Admin\" ที่มุมขวาบนก่อนนะครับ";
            if (typeof sellerAlert === 'function') sellerAlert(msg, 'error');
            else alert(msg);
        } else {
            if (typeof sellerAlert === 'function') sellerAlert("เกิดข้อผิดพลาดในการลบ: " + e.message, "error");
            else alert("Error Delete: " + e.message);
        }
    }
}

// Manually Restore Default Categories
async function restoreDefaultSparePartsConfig() {
    let confirmed = false;
    const confirmMsg = 'ยืนยันการล้างค่า "หมวดหมู่อะไหล่" ทั้งหมด และแทนที่ด้วยค่าเริ่มต้นใช่หรือไม่?';
    if (typeof sellerConfirm === 'function') confirmed = await sellerConfirm(confirmMsg, 'warning');
    else confirmed = confirm(confirmMsg);
    
    if (!confirmed) return;
    
    const defaultModels = ["iPhone", "iPad", "Samsung", "Xiaomi", "OPPO", "Vivo", "Huawei", "OnePlus", "Nokia"];
    const defaultPartTypes = ["หน้าจอ Lcd (แท้)", "หน้าจอ Lcd (OLED)", "แบตเตอรี่", "แพรชาร์จ", "แพรสวิตช์"];
    
    // Auto-map all 5 types to all models for convenience
    const defaultMappings = {};
    defaultModels.forEach(m => {
        defaultMappings[m] = [...defaultPartTypes];
    });

    const initial = {
        models: defaultModels,
        partTypes: defaultPartTypes,
        mappings: defaultMappings
    };

    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        await supabase.from('settings').upsert({
            id: 'spare_parts',
            ...initial
        });
        const successMsg = '✅ คืนค่าหมวดหมู่เริ่มต้นเรียบร้อยแล้วครับ!';
        if (typeof sellerAlert === 'function') sellerAlert(successMsg, 'success');
        else alert(successMsg);
        
        // Reload to show changes
        setTimeout(() => location.reload(), 1000);
    } catch (e) {
        console.error("Restore Error:", e);
        const errorMsg = "Restore Error: " + e.message;
        if (typeof sellerAlert === 'function') sellerAlert(errorMsg, 'error');
        else alert(errorMsg);
    }
}
window.restoreDefaultSparePartsConfig = restoreDefaultSparePartsConfig;

window.movePartTypeUp = async function(index) {
    if (index <= 0) return;

    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const { data: doc } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
        if (!doc) return;
        
        const types = [...(doc.partTypes || [])];
        if (index >= types.length) return;

        const temp = types[index];
        types[index] = types[index - 1];
        types[index - 1] = temp;
        
        await supabase.from('settings').update({ partTypes: types }).eq('id', 'spare_parts');
    } catch(err) {
        console.error("Move Error:", err);
    }
}

window.movePartTypeDown = async function(index) {
    try {
        const supabase = window.supabaseClient;
        if (!supabase) return;

        const { data: doc } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
        if (!doc) return;
        
        const types = [...(doc.partTypes || [])];
        if (index >= types.length - 1) return;

        const temp = types[index];
        types[index] = types[index + 1];
        types[index + 1] = temp;
        
        await supabase.from('settings').update({ partTypes: types }).eq('id', 'spare_parts');
    } catch(err) {
        console.error("Move Error:", err);
    }
}

window.moveModelUp = null; // replaced by drag-drop
window.moveModelDown = null; // replaced by drag-drop

// ── Drag & Drop for Models (หมวดหมู่หลัก) — ใช้ pointer events แทน HTML5 DnD ──
function initModelsDragDrop(container) {
    let dragSrc = null;
    let ghost = null;
    let offsetX = 0, offsetY = 0;

    function getChips() { return [...container.querySelectorAll('.model-chip')]; }

    function createGhost(chip, x, y) {
        ghost = chip.cloneNode(true);
        const r = chip.getBoundingClientRect();
        offsetX = x - r.left;
        offsetY = y - r.top;
        ghost.style.cssText = `
            position:fixed; z-index:999999; pointer-events:none;
            opacity:0.85; box-shadow:0 6px 20px rgba(0,0,0,0.25);
            border-radius:20px; background:#f0f5ff; border:2px solid #A68A64;
            left:${r.left}px; top:${r.top}px;
            width:${r.width}px; height:${r.height}px;
            display:flex; align-items:center; padding:${getComputedStyle(chip).padding};
            font-size:0.85rem; transition:none;
        `;
        document.body.appendChild(ghost);
    }

    function moveGhost(x, y) {
        if (!ghost) return;
        ghost.style.left = (x - offsetX) + 'px';
        ghost.style.top  = (y - offsetY) + 'px';
    }

    function removeGhost() {
        if (ghost) { ghost.remove(); ghost = null; }
    }

    function getChipAt(x, y) {
        const chips = getChips();
        for (const c of chips) {
            if (c === dragSrc) continue;
            const r = c.getBoundingClientRect();
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c;
        }
        return null;
    }

    container.querySelectorAll('.model-chip').forEach(chip => {
        chip.addEventListener('mousedown', e => {
            // ไม่ให้ drag เมื่อคลิกปุ่ม ×
            if (e.target.closest('[onclick]')) return;
            e.preventDefault();
            dragSrc = chip;
            chip.style.opacity = '0.35';
            createGhost(chip, e.clientX, e.clientY);
            getChips().forEach(c => c.style.transition = 'outline 0.1s');
        });
    });

    document.addEventListener('mousemove', e => {
        if (!dragSrc) return;
        moveGhost(e.clientX, e.clientY);

        // Highlight drop target
        const dropzones = container.querySelectorAll('.model-chip');
        dropzones.forEach(dz => {
            dz.style.outline = 'none';
        });
        const target = getChipAt(e.clientX, e.clientY);
        if (target) target.style.outline = '2px dashed #A68A64';
    });

    document.addEventListener('mouseup', async e => {
        if (!dragSrc) return;

        const target = getChipAt(e.clientX, e.clientY);
        dragSrc.style.opacity = '';
        removeGhost();
        getChips().forEach(c => { c.style.outline = ''; c.style.transition = ''; });

        if (target && target !== dragSrc) {
            const chips = getChips();
            const fromIdx = chips.indexOf(dragSrc);
            const toIdx   = chips.indexOf(target);

            const newModels = [...(sparePartsConfig.models || [])];
            const [moved] = newModels.splice(fromIdx, 1);
            newModels.splice(toIdx, 0, moved);

            sparePartsConfig.models = newModels;
            refreshCategoryUI();

            try {
                const supabase = window.supabaseClient;
                if (!supabase) return;
                
                const { data: doc } = await supabase.from('settings').select('*').eq('id', 'spare_parts').single();
                if (!doc) return;

                const dbModels = [...(doc.models || [])];
                const [movedDb] = dbModels.splice(fromIdx, 1);
                dbModels.splice(toIdx, 0, movedDb);

                await supabase.from('settings').update({ models: dbModels }).eq('id', 'spare_parts');
                sparePartsConfig.models = dbModels;
                refreshCategoryUI();
            } catch(err) {
                console.error('Drag-drop save error:', err);
            }
        }

        dragSrc = null;
    });

    // Inject cursor style once
    if (!document.getElementById('modelDragStyle')) {
        const s = document.createElement('style');
        s.id = 'modelDragStyle';
        s.textContent = `.model-chip { cursor: grab; } .model-chip:active { cursor: grabbing; }`;
        document.head.appendChild(s);
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

