/**
 * seller-vouchers.js
 * Logic for managing vouchers in Seller Centre using Firestore
 */

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('firestore-status');
    const voucherForm = document.getElementById('voucherForm');
    const voucherListBody = document.getElementById('voucherListBody');
    const emptyState = document.getElementById('v-empty');

    // Unified DB Reference
    const db = window.db || (typeof firebase !== 'undefined' ? firebase.firestore() : null);
    if (!db) {
        console.error("Firestore DB not initialized");
        if (statusEl) statusEl.innerHTML = '<span style="color:red">&bull; Firestore Error: SDK Missing</span>';
        return;
    }

    // 1. Auth & Load Logic
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    let authUnsubscribe = null;

    if (firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const authEmail = document.getElementById('authEmail');
            const authIndicator = document.getElementById('statusIndicator');
            const loginBtn = document.getElementById('adminLoginBtn');
            const logoutBtn = document.getElementById('adminLogoutBtn');
            const saveBtn = document.getElementById('btnSaveVoucher');

            const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';

            if (user || localAdminActive) {
                const email = user ? (user.email || "").toLowerCase() : SELLER_EMAIL.toLowerCase();
            const isAdmin = email === SELLER_EMAIL.toLowerCase();

            if (authEmail) authEmail.textContent = email + (user ? "" : " (จำสิทธิ์ 🔒)");
            if (authIndicator) authIndicator.className = 'admin-status-dot ' + (isAdmin ? 'online' : 'warning');
            
            // Toggle Auth Warning Banner (New v2026)
            const authWarning = document.getElementById('auth-cloud-warning');
            if (authWarning) {
                authWarning.style.display = (isAdmin && user) ? 'none' : 'flex';
            }

            if (isAdmin) {
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.style.opacity = '1';
                }
                localStorage.setItem('paomobile_admin_active', 'true');
                startVoucherSync();
            } else {
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'block';
                if (statusEl) statusEl.innerHTML = '<span style="color:#faad14">&bull; สิทธิ์ไม่เพียงพอ</span>';
            }
        } else {
            const isFileProtocol = window.location.protocol === 'file:';
            if (authEmail) authEmail.textContent = isFileProtocol ? "โหมด Local" : "กรุณาล็อกอิน Admin";
            if (authIndicator) authIndicator.className = 'admin-status-dot offline';
            
            // Show Auth Warning in Local Mode
            const authWarning = document.getElementById('auth-cloud-warning');
            if (authWarning) authWarning.style.display = 'flex';

            if (loginBtn) {
                loginBtn.style.display = 'block';
                loginBtn.onclick = sellerLogin;
            }
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.style.opacity = '0.5';
            }
            voucherListBody.innerHTML = '';
            emptyState.style.display = 'block';
        }
    });
}

// ── Settings Management ──
window.saveSettings = function() {
    const baseUrl = document.getElementById('setting-base-url').value.trim();
    if (!baseUrl) {
        alert("กรุณาระบุ URL เว็บไซต์ครับ");
        return;
    }
    localStorage.setItem('paomobile_base_url', baseUrl);
    alert("✅ บันทึกโดเมนเว็บไซต์เรียบร้อยแล้วครับ!");
};

    // --- Authentication Functions (Exported to window) ---
    window.sellerLogin = function() {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                console.log("[Auth] Admin login success:", result.user.email);
            })
            .catch(error => {
                console.error("[Auth] Login Failed:", error);
                alert("ล็อกอินไม่สำเร็จ: " + error.message);
            });
    };

    window.sellerLogout = function() {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
            localStorage.removeItem('paomobile_admin_active');
            firebase.auth().signOut().then(() => {
                window.location.reload();
            });
        }
    };

    function startVoucherSync() {
        if (authUnsubscribe) authUnsubscribe(); // Prevent duplicate listeners

        const vouchersCol = db.collection('vouchers');
        authUnsubscribe = vouchersCol.orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
            if (statusEl) statusEl.innerHTML = '<span style="color:#52c41a">&bull; Firestore: เชื่อมต่อแล้ว</span>';
            
            if (snapshot.empty) {
                voucherListBody.innerHTML = '';
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            let html = '';
            snapshot.forEach((doc) => {
                const v = doc.data();
                const id = doc.id;
                const isDiscount = v.type === 'discount';
                const typeLabel = isDiscount ? 'ส่วนลดสินค้า' : 'ส่งพัสดุฟรี';
                const typeClass = isDiscount ? 'tag-discount' : 'tag-ship';
                
                const showHomeIcon = v.showOnHomepage ? '<span style="color:#27ae60">✅ เปิด</span>' : '<span style="color:#999">❌ ปิด</span>';

                html += `
                    <tr id="row-${id}">
                        <td data-label="รหัส / ชื่อ">
                            <div style="font-weight: 600; color: #222;">${v.code}</div>
                            <div style="font-size: 0.8rem; color: #888;">${v.title}</div>
                        </td>
                        <td data-label="ประเภท"><span class="v-type-tag ${typeClass}">${typeLabel}</span></td>
                        <td data-label="ส่วนลด"><strong style="color: #ee4d2d;">฿${v.value}</strong></td>
                        <td data-label="หน้าแรก" style="text-align: center; font-size: 0.8rem;">${showHomeIcon}</td>
                        <td data-label="ขั้นต่ำ">฿${v.minPurchase || 0}</td>
                        <td data-label="หมดอายุ" style="color: ${v.isPermanent ? '#27ae60' : 'inherit'}; font-weight: ${v.isPermanent ? '600' : 'normal'};">
                            ${v.isPermanent ? '♾️ ถาวร' : formatDate(v.expiry)}
                        </td>
                        <td data-label="จัดการ">
                            <div style="display:flex; gap:5px; justify-content: flex-end;">
                                <button class="btn-gen-qr" onclick="prepareQRModal('${v.code}', '${v.expiry || ''}')" title="สร้าง Secure QR">🎫 สแกน</button>
                                <button class="btn-gen-qr" style="background:#f39c12" onclick="editVoucher('${id}')" title="จัดการการแสดงผล/แก้ไข">✏️</button>
                                <button class="btn-delete" onclick="deleteVoucher('${id}', '${v.code}')" title="ลบคูปอง">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            voucherListBody.innerHTML = html;
        }, (err) => {
            console.error("Snapshot error:", err);
            if (statusEl) statusEl.innerHTML = `<span style="color:red">&bull; Firestore Error: ${err.code}</span>`;
            
            // Check for permission denied and update UI
            if (err.code === 'permission-denied') {
                const authWarning = document.getElementById('auth-cloud-warning');
                if (authWarning) authWarning.style.display = 'flex';
                
                const currentUser = firebase.auth().currentUser;
                const email = currentUser ? (currentUser.email || "Unknown") : "Not Logged In";
                // alert("สิทธิ์ไม่ถูกต้อง: ระบบไม่สามารถโหลดข้อมูลได้\n\nอีเมลปัจจุบัน: " + email + "\nกรุณาล็อกอินใหม่ด้วยเมล sattawat2560@gmail.com เท่านั้นครับ");
            }
        });
    }

    window.sellerLogin = () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider)
            .then(result => {
                console.log("Login success:", result.user.email);
            })
            .catch(error => {
                console.error("Login failed:", error);
                alert("เข้าสู่ระบบไม่สำเร็จ: " + error.message);
            });
    };

    window.sellerLogout = () => {
        if (confirm("ต้องการออกจากระบบใช่หรือไม่?")) {
            firebase.auth().signOut();
        }
    };

    // 2. Handle Form Submission
    voucherForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const saveBtn = document.getElementById('btnSaveVoucher');
        const code = document.getElementById('v-code').value.trim().toUpperCase();
        const title = document.getElementById('v-title').value.trim();
        const desc = document.getElementById('v-desc').value.trim();
        const type = document.getElementById('v-type').value;
        const value = parseInt(document.getElementById('v-value').value);
        const redemptionLimit = parseInt(document.getElementById('v-redemptionLimit').value) || 1;
        const usageLimit = parseInt(document.getElementById('v-usageLimit').value) || 1;
        const minPurchase = parseInt(document.getElementById('v-minPurchase').value) || 0;
        const expiry = document.getElementById('v-expiry').value;
        const isPermanent = document.getElementById('v-isPermanent').checked;
        const showOnHomepage = document.getElementById('v-showOnHomepage').checked;

        // Basic Validation (Allow any alphanumeric, autocase to upper)
        if (!/^[a-zA-Z0-9]+$/.test(code)) {
            alert("รหัสโค้ดต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้นครับ (เช่น SALE99)");
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '⏳ กำลังบันทึก...';

            const vouchersCol = db.collection('vouchers');
            const voucherData = {
                code,
                title,
                desc,
                type,
                value,
                redemptionLimit,
                usageLimit,
                minPurchase,
                expiry: isPermanent ? '' : expiry,
                isPermanent: !!isPermanent,
                showOnHomepage,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (window.editingVoucherId) {
                // Update
                await vouchersCol.doc(window.editingVoucherId).update(voucherData);
                alert("อัปเดตคูปองเรียบร้อยแล้วครับ! ✨");
            } else {
                // Create New
                // Check if code exists globally
                const existing = await vouchersCol.where('code', '==', code).get();
                if (!existing.empty) {
                    alert("รหัสโค้ดนี้มีอยู่แล้วในระบบครับ กรุณาเปลี่ยนรหัสใหม่");
                    saveBtn.disabled = false;
                    saveBtn.textContent = '💾 บันทึกและเปิดใช้งาน';
                    return;
                }
                voucherData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await vouchersCol.add(voucherData);
                alert("สร้างคูปองเรียบร้อยแล้วครับ! 🎉");
            }

            cancelEdit(); // Reset form
        } catch (error) {
            console.error("Error adding voucher:", error);
            if (error.code === 'permission-denied') {
                const isLocal = localStorage.getItem('paomobile_admin_active') === 'true' && !firebase.auth().currentUser;
                const currentUser = firebase.auth().currentUser;
                const emailMsg = currentUser ? currentUser.email : (isLocal ? SELLER_EMAIL : "ไม่ได้ล็อกอิน");
                
                let errorMsg = "❌ บันทึกไม่สำเร็จ: สิทธิ์ไม่ถูกต้อง\n\nกรุณาตรวจสอบว่าคุณล็อกอินด้วยเมล sattawat2560@gmail.com หรือยังค๊าบ\n(Email ปัจจุบัน: " + emailMsg + ")";
                
                if (isLocal) {
                    errorMsg += "\n\n⚠️ หมายเหตุ: ขณะนี้คุณกำลังใช้โหมด Local Bypass ข้อมูลจะไม่สามารถเซฟลงถนข้อมูลจริงได้ครับ กรุณารันผ่าน Server ตามที่แนะนำเพื่อบันทึกครับ";
                }
                alert(errorMsg);
            } else {
                alert("เกิดข้อผิดพลาด: " + error.message);
            }
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 บันทึกและเปิดใช้งาน';
        }
    });

    // Helper functions
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    window.deleteVoucher = async (id, code) => {
        if (!confirm(`คุณต้องการลบคูปอง "${code}" ใช่หรือไม่?`)) return;
        
        try {
            const btn = event.target.closest('button');
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '🕒';
            btn.disabled = true;

            await db.collection('vouchers').doc(id).delete();
            console.log("Voucher deleted:", code);
            // No alert needed, onSnapshot will clear the row
        } catch (err) {
            console.error("Delete Error:", err);
            alert("ลบไม่สำเร็จ: " + err.message);
        }
    };

    window.editingVoucherId = null;
    window.lastVData = null; // Store for quick sync

    window.editVoucher = async (id) => {
        window.editingVoucherId = id;
        const modal = document.getElementById('vEditModal');
        const loader = document.getElementById('vEditLoader');
        const content = document.getElementById('vEditContent');
        
        modal.style.display = 'flex';
        loader.style.display = 'block';
        content.style.display = 'none';

        try {
            const doc = await db.collection('vouchers').doc(id).get();
            if (!doc.exists) return;
            const v = doc.data();
            window.lastVData = v;

            document.getElementById('editVHeader').textContent = v.code;
            document.getElementById('editVSub').textContent = v.title;
            document.getElementById('edit-showHome').checked = !!v.showOnHomepage;
            
            // Populate detailed fields
            document.getElementById('edit-value').value = v.value || 0;
            document.getElementById('edit-minPurchase').value = v.minPurchase || 0;
            document.getElementById('edit-expiry').value = v.expiry || '';
            document.getElementById('edit-usageLimit').value = v.usageLimit || 1;

            // Hide details by default when opening
            document.getElementById('vEditDetails').style.display = 'none';
            document.getElementById('btnShowDetails').style.display = 'block';

            loader.style.display = 'none';
            content.style.display = 'block';
        } catch (err) {
            alert("โหลดข้อมูลไม่สำเร็จ: " + err.message);
            closeEditModal();
        }
    };

    window.closeEditModal = () => {
        document.getElementById('vEditModal').style.display = 'none';
    };

    window.toggleEditDetails = () => {
        const details = document.getElementById('vEditDetails');
        const btn = document.getElementById('btnShowDetails');
        if (details.style.display === 'none') {
            details.style.display = 'block';
            btn.style.display = 'none'; // Hide the button once expanded
        } else {
            details.style.display = 'none';
        }
    };

    window.goToFullEdit = () => {
        if (!window.lastVData || !window.editingVoucherId) return;
        const v = window.lastVData;
        
        closeEditModal(); // This hides the modal but keeps editingVoucherId
        
        // Sync main form
        document.getElementById('v-code').value = v.code;
        document.getElementById('v-title').value = v.title;
        document.getElementById('v-desc').value = v.desc || '';
        document.getElementById('v-type').value = v.type;
        document.getElementById('v-value').value = v.value;
        document.getElementById('v-redemptionLimit').value = v.redemptionLimit || 1;
        document.getElementById('v-usageLimit').value = v.usageLimit || 1;
        document.getElementById('v-minPurchase').value = v.minPurchase || 0;
        document.getElementById('v-expiry').value = v.expiry || '';
        document.getElementById('v-isPermanent').checked = !!v.isPermanent;
        // Trigger UI update for the checkbox
        if (typeof toggleExpiry === 'function') toggleExpiry(!!v.isPermanent);
        
        document.getElementById('v-showOnHomepage').checked = !!v.showOnHomepage;

        const saveBtn = document.getElementById('btnSaveVoucher');
        saveBtn.textContent = '💾 อัปเดตข้อมูลคูปอง';
        saveBtn.style.background = '#27ae60';
        
        document.getElementById('voucherForm').scrollIntoView({ behavior: 'smooth' });
        
        if (!document.getElementById('btnCancelEdit')) {
            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'btnCancelEdit';
            cancelBtn.type = 'button';
            cancelBtn.textContent = 'ยกเลิกการแก้ไข';
            cancelBtn.style.cssText = 'width:100%; padding:10px; margin-top:10px; background:#95a5a6; color:white; border:none; border-radius:4px; font-weight:600; cursor:pointer;';
            cancelBtn.onclick = cancelEdit;
            saveBtn.parentNode.appendChild(cancelBtn);
        }
    };

    window.updateVField = async (field, value) => {
        if (!window.editingVoucherId) return;
        try {
            await db.collection('vouchers').doc(window.editingVoucherId).update({
                [field]: value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Firestore] Updated ${field} to ${value}`);
        } catch (err) {
            alert("บันทึกไม่สำเร็จ: " + err.message);
        }
    };

    window.cancelEdit = () => {
        window.editingVoucherId = null;
        voucherForm.reset();
        const saveBtn = document.getElementById('btnSaveVoucher');
        saveBtn.textContent = '💾 บันทึกและเปิดใช้งาน';
        saveBtn.style.background = '#ee4d2d';
        const cancelBtn = document.getElementById('btnCancelEdit');
        if (cancelBtn) cancelBtn.remove();
    };

    // v1.3.2 - Secure QR Logic
    let timerInterval = null;
    let activeQRVoucherCode = null;
    let activeQRVoucherExpiry = null;

    window.prepareQRModal = (code, expiry) => {
        activeQRVoucherCode = code;
        activeQRVoucherExpiry = expiry;

        // Reset Modal State
        document.getElementById('qrConfigArea').style.display = 'block';
        document.getElementById('qrResultArea').style.display = 'none';
        document.getElementById('qrSelDuration').value = '60'; // Default 1h
        
        // Show Modal
        document.getElementById('qrModalOverlay').style.display = 'flex';
    };

    window.generateSecureQR = async () => {
        if (!activeQRVoucherCode) return;

        try {
            const saveBtn = document.getElementById('btnFinalGen');
            const originalText = saveBtn.textContent;
            saveBtn.disabled = true;
            saveBtn.textContent = '🕒 กําลังสร้าง...';

            // Calculate Expiry
            const durationSelection = document.getElementById('qrSelDuration').value;
            let expiresAt;

            if (durationSelection === 'permanent') {
                if (activeQRVoucherExpiry && activeQRVoucherExpiry !== '-') {
                    expiresAt = new Date(activeQRVoucherExpiry + 'T23:59:59');
                } else {
                    // Fallback to 1 year if no expiry set
                    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
                }
            } else {
                const mins = parseInt(durationSelection);
                expiresAt = new Date(Date.now() + mins * 60 * 1000);
            }

            const qrRef = await db.collection('voucher_qrs').add({
                voucherCode: activeQRVoucherCode,
                expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                usedBy: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Construct Link
            const settingsDomain = document.getElementById('setting-base-url').value.trim();
            const baseUrl = settingsDomain || window.location.href.split('seller-vouchers.html')[0];
            const redeemUrl = `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}redeem.html?id=${qrRef.id}`;
            document.getElementById('qrLinkText').textContent = redeemUrl;

            // Generate QR via API
            const qrImg = document.getElementById('qrImage');
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(redeemUrl)}`;
            
            // Switch Areas
            document.getElementById('qrConfigArea').style.display = 'none';
            document.getElementById('qrResultArea').style.display = 'block';
            
            // Start Timer
            startQRTimer(expiresAt, durationSelection === 'permanent');

            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        } catch (err) {
            console.error(err);
            alert("ไม่สามารถสร้าง QR ได้: " + err.message);
            document.getElementById('btnFinalGen').disabled = false;
        }
    };

    function startQRTimer(expiry, isPermanent) {
        clearInterval(timerInterval);
        const timerEl = document.getElementById('qrTimer');
        
        if (isPermanent) {
            timerEl.textContent = "ใช้ได้ถาวร (จนกว่าคูปองหมดอายุ)";
            timerEl.style.color = "#27ae60";
            return;
        }

        timerEl.style.color = "#ee4d2d";
        timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const distance = expiry.getTime() - now;
            
            if (distance < 0) {
                clearInterval(timerInterval);
                timerEl.textContent = "หมดเวลาใช้งาน (Expired)";
                document.getElementById('qrImage').style.opacity = '0.3';
                return;
            }
            
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            timerEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    window.closeQRModal = () => {
        document.getElementById('qrModalOverlay').style.display = 'none';
        document.getElementById('qrImage').style.opacity = '1';
        clearInterval(timerInterval);
        activeQRVoucherCode = null;
        activeQRVoucherExpiry = null;
    };

    window.copyQRLink = () => {
        const text = document.getElementById('qrLinkText').textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.btn-copy');
            btn.textContent = 'คัดลอกแล้ว!';
            setTimeout(() => { btn.textContent = 'คัดลอก'; }, 2000);
        });
    };

    // Load saved settings
    const savedUrl = localStorage.getItem('paomobile_base_url');
    if (savedUrl) {
        document.getElementById('setting-base-url').value = savedUrl;
    }
});
