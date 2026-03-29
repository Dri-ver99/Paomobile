/**
 * seller-vouchers.js
 * Logic for managing vouchers in Seller Centre using Firestore
 */

document.addEventListener('DOMContentLoaded', () => {
    const statusEl = document.getElementById('firestore-status');
    const voucherForm = document.getElementById('voucherForm');
    const voucherListBody = document.getElementById('voucherListBody');
    const emptyState = document.getElementById('v-empty');

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
            const authIndicator = document.getElementById('authIndicator');
            const loginBtn = document.getElementById('adminLoginBtn');
            const logoutBtn = document.getElementById('adminLogoutBtn');
            const saveBtn = document.getElementById('btnSaveVoucher');

            if (user) {
                console.log("[Auth] User detected:", user.email);
                if (authEmail) authEmail.textContent = user.email;
                if (authIndicator) authIndicator.style.background = (user.email === SELLER_EMAIL) ? '#52c41a' : '#faad14';
                
                if (user.email === SELLER_EMAIL) {
                    if (loginBtn) loginBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                    if (saveBtn) saveBtn.disabled = false;
                    startVoucherSync();
                } else {
                    alert("⚠️ คำเตือน: คุณไม่ได้ล็อกอินด้วยสิทธิ์ผู้ขาย (sattawat2560@gmail.com)\nคุณอาจจะไม่สามารถบันทึกข้อมูลได้ครับ");
                    if (loginBtn) loginBtn.style.display = 'block';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                }
            } else {
                console.warn("[Auth] No user logged in.");
                if (authEmail) authEmail.textContent = "ไม่ได้ล็อกอิน (Guest)";
                if (authIndicator) authIndicator.style.background = '#ff4d4f';
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (saveBtn) saveBtn.disabled = true;
                
                // Clear list if any
                voucherListBody.innerHTML = '';
                emptyState.style.display = 'block';
            }
        });
    }

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
                const isDiscount = v.type === 'discount';
                const typeLabel = isDiscount ? 'ส่วนลดสินค้า' : 'ส่งพัสดุฟรี';
                const typeClass = isDiscount ? 'tag-discount' : 'tag-ship';
                
                html += `
                    <tr id="row-${doc.id}">
                        <td>
                            <div style="font-weight: 600; color: #222;">${v.code}</div>
                            <div style="font-size: 0.8rem; color: #888;">${v.title}</div>
                        </td>
                        <td><span class="v-type-tag ${typeClass}">${typeLabel}</span></td>
                        <td><strong style="color: #ee4d2d;">฿${v.value}</strong></td>
                        <td>${v.redemptionLimit || 1} / ${v.usageLimit || 1}</td>
                        <td>฿${v.minPurchase || 0}</td>
                        <td>${formatDate(v.expiry)}</td>
                        <td>
                            <div style="display:flex; gap:5px;">
                                <button class="btn-gen-qr" onclick="generateSecureQR('${v.code}')" title="สร้าง Secure QR">🎫 สแกนรับ</button>
                                <button class="btn-delete" onclick="deleteVoucher('${doc.id}', '${v.code}')" title="ลบคูปอง">🗑️</button>
                            </div>
                        </td>
                    </tr>
                `;
            });
            voucherListBody.innerHTML = html;
        }, (err) => {
            console.error("Snapshot error:", err);
            if (statusEl) statusEl.innerHTML = `<span style="color:red">&bull; Firestore Error: ${err.code}</span>`;
            if (err.code === 'permission-denied') {
                alert("สิทธิ์ไม่ถูกต้อง: ระบบไม่สามารถโหลดข้อมูลคูปองได้ กรุณาใช้เมล sattawat2560@gmail.com เท่านั้นครับ");
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

        // Basic Validation
        if (!/^[A-Z0-9]+$/.test(code)) {
            alert("รหัสโค้ดต้องเป็นภาษาอังกฤษหรือตัวเลขเท่านั้นครับ");
            return;
        }

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '🕒 กำลังบันทึก...';

            const vouchersCol = db.collection('vouchers');
            
            // Check if code exists globally
            const existing = await vouchersCol.where('code', '==', code).get();
            if (!existing.empty) {
                alert("รหัสเครื่องนี้มีอยู่แล้วในระบบครับ กรุณาเปลี่ยนรหัสใหม่");
                saveBtn.disabled = false;
                saveBtn.textContent = '💾 บันทึกและเปิดใช้งาน';
                return;
            }

            await vouchersCol.add({
                code,
                title,
                desc,
                type,
                value,
                redemptionLimit,
                usageLimit,
                minPurchase,
                expiry,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("สร้างคูปองเรียบร้อยแล้วครับ!");
            voucherForm.reset();
        } catch (error) {
            console.error("Error adding voucher:", error);
            if (error.code === 'permission-denied') {
                alert("❌ บันทึกไม่สำเร็จ: สิทธิ์ไม่ถูกต้อง\nกรุณาตรวจสอบว่าคุณล็อกอินด้วยเมล sattawat2560@gmail.com หรือยังค๊าบ");
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
        if (confirm(`คุณต้องการลบคูปอง "${code}" ใช่หรือไม่?`)) {
            try {
                await db.collection('vouchers').doc(id).delete();
                console.log("Voucher deleted:", code);
            } catch (err) {
                alert("ลบไม่สำเร็จ: " + err.message);
            }
        }
    };

    // v1.3.2 - Secure QR Logic
    let timerInterval = null;

    window.generateSecureQR = async (code) => {
        try {
            const btn = event.target;
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '🕒';

            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
            const qrRef = await db.collection('voucher_qrs').add({
                voucherCode: code,
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
            
            // Show Modal
            document.getElementById('qrModalOverlay').style.display = 'flex';
            
            // Start Timer
            startQRTimer(expiresAt);

            btn.disabled = false;
            btn.textContent = originalText;
        } catch (err) {
            console.error(err);
            alert("ไม่สามารถสร้าง QR ได้: " + err.message);
        }
    };

    function startQRTimer(expiry) {
        clearInterval(timerInterval);
        const timerEl = document.getElementById('qrTimer');
        
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
    };

    window.copyQRLink = () => {
        const text = document.getElementById('qrLinkText').textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.querySelector('.btn-copy');
            btn.textContent = 'คัดลอกแล้ว!';
            setTimeout(() => { btn.textContent = 'คัดลอก'; }, 2000);
        });
    };

    // v1.3.2 - Persistent Domain Settings
    window.saveSettings = () => {
        const url = document.getElementById('setting-base-url').value.trim();
        if (url) {
            localStorage.setItem('paomobile_base_url', url);
            alert("บันทึกโดเมนเว็บไซต์เรียบร้อยแล้วค่ะ! QR Code ที่สร้างต่อจากนี้จะใช้ลิงก์นี้ค่ะ");
        }
    };

    // Load saved settings
    const savedUrl = localStorage.getItem('paomobile_base_url');
    if (savedUrl) {
        document.getElementById('setting-base-url').value = savedUrl;
    }
});
