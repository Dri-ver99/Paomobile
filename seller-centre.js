let ordersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (window.updateSidebarActiveState) window.updateSidebarActiveState();

    // --- v1.2.11 Instant Local Load (Zero-Flash) ---
    // Load last known counts immediately
    const elInsightProd = document.getElementById('insight-products');
    const elStatProd = document.getElementById('stat-total-products');
    const prodCount = localStorage.getItem('pao_total_products_count') || 17;
    if (elInsightProd) elInsightProd.textContent = prodCount;
    if (elStatProd) elStatProd.textContent = prodCount;

    const elSales = document.getElementById('insight-sales');
    if (elSales) elSales.textContent = localStorage.getItem('pao_last_sales_total') || '฿0';

    // Initial render from local orders cache
    updateDashboard();

    // --- v1.2.1 Auth & Firestore Initialization ---
    if (typeof firebase !== 'undefined' && firebase.auth) {
        // v1.2.14 Update status immediately if db exists
        if (typeof db !== 'undefined') {
            const statusToast = document.getElementById('firestore-status');
            if (statusToast) statusToast.innerHTML = '&bull; Firestore: กำลังซิงค์ข้อมูล... ⏳';
        }

        firebase.auth().onAuthStateChanged(user => {
            const authEmail = document.getElementById('authEmail');
            const authIndicator = document.getElementById('authIndicator');
            const loginBtn = document.getElementById('adminLoginBtn');
            const logoutBtn = document.getElementById('adminLogoutBtn');
            
            const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';
            const SELLER_EMAIL = "sattawat2560@gmail.com";
            
            if (user || localAdminActive) {
                const email = user ? (user.email || (user.providerData && user.providerData[0] && user.providerData[0].email) || "").toLowerCase() : SELLER_EMAIL.toLowerCase();
                const isAdmin = email.trim() === SELLER_EMAIL.toLowerCase().trim();
                
                if (authEmail) authEmail.textContent = email + (user ? "" : " (จำสิทธิ์ 🔒)");
                if (authIndicator) {
                    authIndicator.classList.remove('online', 'warning', 'offline');
                    authIndicator.classList.add(isAdmin ? 'online' : 'warning');
                }

                if (isAdmin) {
                    if (loginBtn) loginBtn.style.display = 'none';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                    
                    // v1.2.12 - Warn if only local bypass is active
                    const authWarn = document.getElementById('auth-cloud-warning');
                    if (authWarn) {
                        authWarn.style.display = (!user) ? 'block' : 'none';
                    }

                    if (typeof db !== 'undefined') startFirestoreSync();
                    localStorage.setItem('paomobile_admin_active', 'true');
                } else {
                    if (loginBtn) loginBtn.style.display = 'block';
                    if (logoutBtn) logoutBtn.style.display = 'block';
                }
            } else {
                const isFileProtocol = window.location.protocol === 'file:';
                if (authEmail) authEmail.textContent = isFileProtocol ? "โบนัสโหมด (Guest)" : "กรุณาล็อกอิน Admin";
                if (authIndicator) authIndicator.className = 'admin-status-dot offline';
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
                
                const authWarn = document.getElementById('auth-cloud-warning');
                if (authWarn) authWarn.style.display = 'none';
                
                updateDashboard();
            }
        });
    } else {
        updateDashboard();
    }

    window.sellerLogin = () => {
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err => alert("Login Error: " + err.message));
    };

    window.sellerLogout = () => {
        localStorage.removeItem('paomobile_admin_active');
        firebase.auth().signOut().then(() => window.location.reload());
    };

    function startFirestoreSync() {
        console.log("[v1.2.1] Starting real-time sync...");
        
        // Orders Sync
        db.collection('orders').onSnapshot(snapshot => {
            let fetchedOrders = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id 
            }));
            
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                return dateB - dateA;
            });
            
            ordersData = processExpirations(fetchedOrders);
            
            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            const statusToast = document.getElementById('firestore-status');
            if (statusToast) {
                statusToast.innerHTML = '<span style="color:#52c41a;">&bull;</span> Cloud: เชื่อมต่อสำเร็จ ✅';
                statusToast.style.borderColor = '#b7eb8f';
                statusToast.style.background = '#f6ffed';
            }
            updateDashboard();
        }, (err) => {
            console.error("[v1.2.10] Sync Error:", err);
            const statusToast = document.getElementById('firestore-status');
            if (statusToast) {
                let msg = 'ออฟไลน์ ⚠️';
                if (err.code === 'permission-denied') {
                    msg = 'จำกัดการเข้าถึง 🔒 (โปรดล็อกอิน Google)';
                    statusToast.style.borderColor = '#faad14';
                    statusToast.style.background = '#fffbe6';
                    statusToast.innerHTML = `<span style="color:#faad14;">&bull;</span> Cloud: ${msg}`;
                } else {
                    statusToast.innerHTML = `<span style="color:#ff4d4f;">&bull;</span> Cloud: ${msg}`;
                    statusToast.style.borderColor = '#ffa39e';
                    statusToast.style.background = '#fff1f0';
                }
            }
            updateDashboard();
        });

        // Products Sync (for stats)
        db.collection('products').onSnapshot(snapshot => {
            let outOfStockCount = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.stock === 0 || data.stock === "0") {
                    outOfStockCount++;
                }
            });
            const count = snapshot.size;
            const totalProductsCount = count > 0 ? count : 17; 
            
            localStorage.setItem('pao_total_products_count', totalProductsCount);
            localStorage.setItem('pao_outstock_count', outOfStockCount);
            
            const elTotalProducts = document.getElementById('stat-total-products');
            if (elTotalProducts) elTotalProducts.textContent = totalProductsCount;
            const elOutstock = document.getElementById('stat-outstock');
            if (elOutstock) elOutstock.textContent = outOfStockCount;
        }, err => {
            console.warn("[v1.2.11] Product sync failed:", err);
        });

        // Chat Unread Sync
        db.collection('chats').onSnapshot(snapshot => {
            const totalUnread = snapshot.docs.reduce((sum, doc) => sum + (doc.data().unreadCount || 0), 0);
            const badge = document.getElementById('chat-unread-total');
            if (badge) {
                if (totalUnread > 0) {
                    badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        }, err => {
            console.warn("Chat unread sync error:", err);
        });

        // Promotion List Sync
        loadPromoList();
    }

    // v1.2.15 - Public Syncs (Run even if admin sync hangs/blocked)
    if (typeof db !== 'undefined') {
        loadPromoList();
        
        // Voucher Sync (Public Read) - Client-side sort to avoid index issues
        db.collection('vouchers').onSnapshot(snapshot => {
            const elVouchers = document.getElementById('stat-vouchers');
            if (elVouchers) elVouchers.textContent = snapshot.size;
            localStorage.setItem('pao_total_vouchers_count', snapshot.size);
            
            const docs = snapshot.docs.map(doc => doc.data());
            // Client-side sort by createdAt desc
            docs.sort((a, b) => {
                const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                const db = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                return db - da;
            });
            renderQuickVouchers(docs);
        }, err => {
            console.error("Voucher sync error:", err);
            const list = document.getElementById('quick-qr-list');
            if (list) list.innerHTML = `<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #ef4444; font-size: 0.8rem;">⚠️ โหลดคูปองไม่ได้: ${err.message}</div>`;
        });
    }
    
    // v1.2.13 - Ensure promo list runs even if sync hangs (public read allowed)
    if (typeof db !== 'undefined') loadPromoList();

    function renderQuickVouchers(vouchers) {
        const list = document.getElementById('quick-qr-list');
        if (!list) return;

        if (vouchers.length === 0) {
            list.innerHTML = '<div style="grid-column: 1/-1; padding: 20px; text-align: center; color: #999;">คุณยังไม่มีคูปอง</div>';
            return;
        }

        // Only show first 8 vouchers in quick list
        const displayVouchers = vouchers.slice(0, 8);
        list.innerHTML = displayVouchers.map(v => `
            <div class="quick-qr-item">
                <div class="quick-qr-code">${v.code}</div>
                <div class="quick-qr-title">${v.title}</div>
                <button class="btn-gen-qr-small" onclick="generateSecureQR('${v.code}')">🎫 สร้าง QR</button>
            </div>
        `).join('');
    }

    // Secure QR Logic (Reused from seller-vouchers.js)
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
            const baseUrl = window.location.href.split('seller-centre.html')[0];
            const redeemUrl = `${baseUrl}redeem.html?id=${qrRef.id}`;
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

    // Expiration Logic for Dashboard
    function processExpirations(orders) {
        if (typeof db === 'undefined') return orders;

        orders.forEach(o => {
            if (o.status === 'ที่ต้องชำระ' && (o.orderDate || o.createdAt)) {
                let timeVal = 0;
                if (o.orderDate) {
                    timeVal = new Date(o.orderDate).getTime();
                } else if (o.createdAt && o.createdAt.toMillis) {
                    timeVal = o.createdAt.toMillis();
                } else if (o.createdAt && o.createdAt.seconds) {
                    timeVal = o.createdAt.seconds * 1000;
                }

                if (timeVal > 0) {
                    const elapsed = Date.now() - timeVal;
                    if (elapsed > 30 * 60 * 1000) {
                        o.status = 'ยกเลิกแล้ว';
                        // Sync to Cloud automatically
                        db.collection('orders').doc(o.id).update({ status: 'ยกเลิกแล้ว' })
                            .catch(err => console.warn("Admin background expiry sync failed for", o.id, err));
                    }
                }
            }
        });
        return orders;
    }

    // Polling interval for expirations
    setInterval(function() {
        if (ordersData && ordersData.length > 0) {
            const oldStatusStr = JSON.stringify(ordersData.map(o => o.status));
            ordersData = processExpirations(ordersData);
            const newStatusStr = JSON.stringify(ordersData.map(o => o.status));
            
            if (oldStatusStr !== newStatusStr) {
                updateDashboard();
            }
        }
    }, 3000);
});

function updateDashboard() {
    const orders = ordersData.length > 0 ? ordersData : JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
    
    // 1. Update Stats Counts (Include fallback for ALL orders)
    const stats = {
        unpaid: 0,
        toShip: 0,
        processed: 0,
        refund: 0,
        receive: 0,
        violated: 0
    };

    orders.forEach(order => {
        const s = order.status || 'Pending';
        if (s === 'ที่ต้องชำระ' || s === 'Pending' || s === 'DEBUG-TEST') stats.unpaid++;
        else if (s === 'ที่ต้องจัดส่ง' || s === 'To Ship') stats.toShip++;
        else if (s === 'เตรียมจัดส่งแล้ว' || s === 'Processed') stats.processed++;
        else if (s === 'ที่ต้องได้รับ' || s === 'To Receive') stats.receive++;
        else if (s === 'ยกเลิกแล้ว' || s === 'ขอยกเลิก/คืนเงิน/คืน' || s === 'Cancelled' || s === 'คืนเงิน/คืนสินค้า' || s === 'Return') stats.refund++;
    });

    // 2. Update Business Insights (Sales & Products)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayOrdersCount = 0;
    let todaySalesTotal = 0;
    let totalSales = 0;

    orders.forEach(order => {
        let orderDate = null;
        if (order.createdAt && order.createdAt.toDate) {
            orderDate = order.createdAt.toDate();
        } else if (order.createdAt && order.createdAt.seconds) {
            orderDate = new Date(order.createdAt.seconds * 1000);
        } else if (order.orderDate) {
            orderDate = new Date(order.orderDate);
        }

        if (order.status !== 'ยกเลิกแล้ว') {
            totalSales += (order.total || 0);
            if (orderDate && orderDate >= today) {
                todayOrdersCount++;
                todaySalesTotal += (order.total || 0);
            }
        }
    });

    // Save sales for Zero-Flash top display
    localStorage.setItem('pao_last_sales_total', '฿' + totalSales.toLocaleString());

    const cachedProductCount = localStorage.getItem('pao_total_products_count') || 17;
    const cachedVouchersCount = localStorage.getItem('pao_total_vouchers_count') || 0; 
    const cachedOutstockCount = localStorage.getItem('pao_outstock_count') || 0; 

    const elements = [
        { el: document.getElementById('stat-unpaid'), val: stats.unpaid },
        { el: document.getElementById('stat-toship'), val: stats.toShip },
        { el: document.getElementById('stat-processed'), val: stats.processed },
        { el: document.getElementById('stat-cancelled'), val: stats.refund },
        { el: document.getElementById('stat-total-products'), val: cachedProductCount },
        { el: document.getElementById('insight-products'), val: cachedProductCount },
        { el: document.getElementById('stat-vouchers'), val: cachedVouchersCount },
        { el: document.getElementById('insight-today-orders'), val: todayOrdersCount },
        { el: document.getElementById('insight-today-sales'), val: '฿' + todaySalesTotal.toLocaleString() },
        { el: document.getElementById('insight-total-orders'), val: orders.length },
        { el: document.getElementById('insight-sales'), val: '฿' + totalSales.toLocaleString() }
    ];

    elements.forEach(item => {
        if (item.el) {
            if (item.el.textContent !== String(item.val)) {
                item.el.style.opacity = '0';
                item.el.style.transform = 'translateY(-5px)';
                setTimeout(() => {
                    item.el.textContent = item.val;
                    item.el.style.opacity = '1';
                    item.el.style.transform = 'translateY(0)';
                }, 150);
            }
        }
    });

    // 3. Render Recent Orders List
    renderRecentOrders(orders);
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recent-orders-list');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">ยังไม่มีคำสั่งซื้อในขณะนี้</div>';
        return;
    }

    const latest = orders.slice(0, 5);

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
            <thead>
                <tr style="text-align: left; border-bottom: 1px solid #eee; color: #888;">
                    <th style="padding: 10px 0;">รหัสสั่งซื้อ</th>
                    <th style="padding: 10px 0;">สินค้า</th>
                    <th style="padding: 10px 0;">ลูกค้า & ที่มา</th>
                    <th style="padding: 10px 0; text-align: center;">ยอดรวม</th>
                    <th style="padding: 10px 0; text-align: right;">สถานะ</th>
                    <th style="padding: 10px 0; text-align: right;">จัดการ</th>
                </tr>
            </thead>
            <tbody>
                ${latest.map(order => {
                    const items = order.items || [];
                    const firstItemName = items.length > 0 ? items[0].name : (order.status === 'DEBUG-TEST' ? 'รายการทดสอบ (Debug)' : 'ไม่ระบุสินค้า');
                    const others = items.length > 1 ? ` และอีก ${items.length - 1} รายการ` : '';
                    const orderTotal = typeof order.total === 'number' ? order.total.toLocaleString() : '0';
                    const sourceCounts = {};
                    items.forEach(it => {
                        const s = it.source || 'ไม่ระบุ';
                        sourceCounts[s] = (sourceCounts[s] || 0) + (it.qty || 1);
                    });

                    const sourcePills = Object.keys(sourceCounts).map(s => {
                        let label = s.trim();
                        let count = sourceCounts[s];
                        let color = '#757575', bg = '#f5f5f5', border = '#ddd';
                        if (label === 'parts') { label = 'อะไหล่'; color = '#d97706'; bg = '#fef3c7'; border = '#fde68a'; }
                        else if (label === 'used') { label = 'มือสอง'; color = '#059669'; bg = '#d1fae5'; border = '#a7f3d0'; }
                        else if (label === 'accessory') { label = 'อุปกรณ์'; color = '#2563eb'; bg = '#dbeafe'; border = '#bfdbfe'; }
                        return `<span style="display:inline-block; margin-top:4px; padding: 2px 6px; font-size: 0.7rem; border-radius: 4px; background:${bg}; color:${color}; border:1px solid ${border}; font-weight:600;">${label} (${count})</span>`;
                    }).join(' ');

                    return `
                        <tr style="border-bottom: 1px solid #fafafa;">
                            <td style="padding: 12px 0; color: #4080ff; font-family: monospace;">${order.id}</td>
                            <td style="padding: 12px 0; max-width: 180px;">
                                <div style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${firstItemName}${others}">${firstItemName}${others}</div>
                            </td>
                            <td style="padding: 12px 0;">
                                <div style="font-size: 0.8rem; color: #333;">${order.customerName || 'ไม่ระบุชื่อ'}</div>
                                <div style="font-size: 0.75rem; color: #999;">${order.customerPhone || '-'}</div>
                                <div>${sourcePills}</div>
                            </td>
                            <td style="padding: 12px 0; text-align: center; font-weight: 600;">฿${orderTotal}</td>
                            <td style="padding: 12px 0; text-align: right;">
                                <span class="status-tag" style="${getStatusStyle(order.status)}">${order.status || 'ที่ต้องชำระ'}</span>
                            </td>
                            <td style="padding: 12px 0; text-align: right;">
                                <button onclick="location.href='seller-orders.html'" style="background:#fff; color:#4080ff; border:1px solid #4080ff; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; margin-right:4px;">ดูรายละเอียด</button>
                                <button onclick="deleteOrder('${order.id}')" style="background:#fff; color:#ff4d4f; border:1px solid #ff4d4f; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">ลบทิ้ง</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function deleteOrder(orderId) {
    if (!confirm('🚨 ยืนยันการลบออเดอร์ ' + orderId + ' ใช่ไหมคับ? (ลบแล้วกู้ไม่ได้นะค๊าบ)')) return;
    
    if (window.db) {
        db.collection('orders').doc(orderId).delete()
            .then(() => alert("ลบทิ้งเรียบร้อยแล้วคับ!"))
            .catch(err => alert("ลบไม่สำเร็จ (Error): " + err.message));
    } else {
        // Fallback local delete
        const gOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const filtered = gOrders.filter(o => o.id !== orderId);
        localStorage.setItem('pao_global_orders', JSON.stringify(filtered));
        updateDashboard();
        alert("ลบในเครื่องเรียบร้อย (ไม่ได้ซิงค์ Cloud)");
    }
}

function getStatusStyle(status) {
    if (status === 'ที่ต้องชำระ' || status === 'Pending' || status === 'DEBUG-TEST') return 'background: #fff1f0; border-color: #ffa39e; color: #f5222d;';
    if (status === 'ที่ต้องจัดส่ง') return 'background: #e6f7ff; border-color: #91d5ff; color: #1890ff;';
    if (status === 'เตรียมจัดส่งแล้ว') return 'background: #fffbe6; border-color: #ffe58f; color: #faad14;';
    if (status === 'ที่ต้องได้รับ') return 'background: #f0f5ff; border-color: #adc6ff; color: #2f54eb;';
    if (status === 'สำเร็จแล้ว') return 'background: #f6ffed; border-color: #b7eb8f; color: #52c41a;';
    if (status === 'ยกเลิกแล้ว' || status === 'ขอยกเลิก/คืนเงิน/คืน' || status === 'Cancelled' || status === 'คืนเงิน/คืนสินค้า' || status === 'Return') return 'background: #f5f5f5; border-color: #d9d9d9; color: #8c8c8c;';
    return '';
}

// Order Management Actions
function shipOrder(orderId) {
    if(!confirm('ยืนยันแจ้งเลขพัสดุ หมายเลข ' + orderId + ' ?\nสถานะจะเปลี่ยนเป็น "ที่ต้องได้รับ" คับ')) return;
    
    if (typeof db !== 'undefined') {
        db.collection('orders').doc(orderId).update({ status: 'ที่ต้องได้รับ' })
            .then(() => {
                alert('อัปเดตสถานะ "ที่ต้องได้รับ" สำเร็จแล้วคับ!');
            })
            .catch(err => {
                console.error("Firestore update failed:", err);
                alert("Error: " + err.message);
            });
    } else {
        alert('ไม่ได้เชื่อมต่อ Firestore คับ');
    }
}

function viewOrderDetails(orderId) {
    const orders = ordersData.length > 0 ? ordersData : JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (order) {
        // Populate standard fields (v1.7.6 Updated IDs)
        document.getElementById('modalCustomerName').textContent = order.customerName || 'ไม่ระบุชื่อ';
        
        const profileEl = document.getElementById('modalCustomerProfile');
        profileEl.textContent = order.customerProfileName || order.customerNickname || order.customerEmail || 'ไม่มีข้อมูล';
        profileEl.onclick = () => {
            if (order.customerEmail) {
                window.location.href = `seller-chat.html?id=${order.customerEmail.toLowerCase().trim()}`;
            }
        };

        const addrEl = document.getElementById('modalCustomerAddress');
        if (addrEl) addrEl.textContent = order.customerAddress || 'ไม่มีข้อมูลที่อยู่จัดส่ง';
        
        const payMethod = order.paymentMethod || order.method || '-';
        const payBank = order.paymentBank || '';
        const paySlip = order.paymentSlip || order.paymentSlipUrl || '';
        
        let paymentFullText = payMethod;
        if (payBank && payBank !== 'N/A' && payBank !== '-') {
            paymentFullText += ` (${payBank})`;
        }
        document.getElementById('modalPaymentFull').textContent = paymentFullText;
        
        const slipGroup = document.getElementById('slipInfoGroup');
        const slipThumb = document.getElementById('modalSlipThumb');
        const slipLink = document.getElementById('modalSlipLink');
        
        if (paySlip && paySlip !== 'N/A' && paySlip !== '') {
            slipGroup.style.display = 'block';
            if (slipThumb) slipThumb.src = paySlip;
            if (slipLink) {
                slipLink.onclick = (e) => {
                    e.preventDefault();
                    viewSlipLightbox(paySlip);
                };
            }
        } else {
            slipGroup.style.display = 'none';
        }

        const vGroup = document.getElementById('voucherInfoGroup');
        const vCode = order.appliedVoucherCode || order.voucherCode || '';
        if (vCode) {
            vGroup.style.display = 'block';
            const codeSpan = document.getElementById('modalVoucherCode');
            if (codeSpan) codeSpan.textContent = vCode;
        } else {
            vGroup.style.display = 'none';
        }

        const netTotalEl = document.getElementById('modalNetTotal');
        if (netTotalEl) netTotalEl.textContent = `฿${(order.total || 0).toLocaleString()}`;

        // Source Breakdown & Page Entry (v1.7.7)
        const sourceCounts = {};
        (order.items || []).forEach(it => {
            const s = it.source || 'ไม่ระบุ';
            sourceCounts[s] = (sourceCounts[s] || 0) + (it.qty || 1);
        });

        const breakdownArea = document.getElementById('modalSourceBreakdown');
        if (breakdownArea) {
            breakdownArea.innerHTML = Object.keys(sourceCounts).map(s => {
                let label = s.trim();
                let count = sourceCounts[s];
                let color = '#757575', bg = '#f5f5f5', border = '#ddd';
                if (label === 'parts') { label = 'อะไหล่'; color = '#d97706'; bg = '#fef3c7'; border = '#fde68a'; }
                else if (label === 'used') { label = 'มือสอง'; color = '#059669'; bg = '#d1fae5'; border = '#a7f3d0'; }
                else if (label === 'accessory') { label = 'อุปกรณ์'; color = '#2563eb'; bg = '#dbeafe'; border = '#bfdbfe'; }
                return `<span style="padding: 2px 8px; font-size: 0.75rem; border-radius: 6px; background:${bg}; color:${color}; border:1px solid ${border}; font-weight:700;">${label} (${count})</span>`;
            }).join('');
        }

        const pageEl = document.getElementById('modalOrderPage');
        if (pageEl) {
            const map = {
                'index.html': 'หน้าหลัก',
                'parts.html': 'เลือกซื้ออะไหล่',
                'accessory.html': 'อุปกรณ์เสริม',
                'new-products.html': 'มือถือกดซื้อเอง',
                'used-products.html': 'มือถือมือสอง',
                'checkout.html': 'หน้ารถเข็น/สั่งโดยตรง'
            };
            pageEl.textContent = map[order.orderPage] || order.orderPage || 'ไม่ระบุ';
        }
        
        document.getElementById('orderDetailModal').style.display = 'flex';
    }
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

function viewSlipLightbox(url) {
    const lb = document.getElementById('slipLightbox');
    const img = document.getElementById('lightboxImg');
    if (lb && img) {
        img.src = url;
        lb.style.display = 'flex';
        setTimeout(() => lb.style.opacity = '1', 10);
    }
}

function closeSlipLightbox() {
    const lb = document.getElementById('slipLightbox');
    if (lb) {
        lb.style.opacity = '0';
        setTimeout(() => lb.style.display = 'none', 300);
    }
}


// ============================================================
//  PROMOTION MANAGEMENT — Multi-Promo (v2.0)
// ============================================================

const DEFAULT_PROMOS = [
    {
        title:    'ผ่อนซ่อมโทรศัพท์ ดาวน์เริ่มต้น 30%',
        subDesc:  '✨ ผ่อนไปใช้ไปได้เลย! • ใช้เพียงบัตรประชาชนใบเดียว',
        desc:     'ซ่อมจบทุกอาการด้วยอะไหล่คุณภาพมาตรฐาน\n✅ รับประกันงานซ่อมทุกชิ้นส่วน\n⚡ ซ่อมไว รอรับได้เลย\n❤️ ดูแลทุกเครื่องเหมือนเครื่องของเราเอง',
        imageUrl: 'Promotion-1.jpg',
        ctaLink:  'https://line.me/R/ti/p/@pao789',
        active:   true,
        order:    0
    },
    {
        title:    'โปรโมชั่น Accessory ยิ่งซื้อเยอะ ยิ่งคุ้ม!',
        subDesc:  '🛒 รับส่วนลดทันทีสูงสุด 20% เมื่อซื้อครบเงื่อนไข',
        desc:     '💰 ซื้อครบ 500 บาท ลดทันที 10%\n💰 ซื้อครบ 1,000 บาท ลดทันที 15%\n💰 ซื้อครบ 2,000 บาท ลดทันที 20%\n✅ ของแท้คุณภาพดี • รับประกันทุกชิ้น • คุ้มค่าราคาโดนใจ',
        imageUrl: 'Promotion-2.jpg',
        ctaLink:  'https://line.me/R/ti/p/@pao789',
        active:   true,
        order:    1
    }
];

let _currentPromoId = null;
let _currentPromoImgBase64 = null;

/* ── Render promotion list in dashboard card ── */
function loadPromoList() {
    if (typeof db === 'undefined') return;

    // No orderBy to avoid requiring a Firestore index — sort client-side
    db.collection('promotions').onSnapshot(snapshot => {
        const area  = document.getElementById('promo-list-area');
        const count = document.getElementById('promo-count');
        if (count) count.textContent = snapshot.size;
        if (!area) return;

        if (snapshot.empty) {
            area.innerHTML = `<div style="text-align:center;padding:30px 20px;color:#94a3b8;">
                <div style="font-size:2.5rem;margin-bottom:10px;">🎁</div>
                <div style="font-weight:600;margin-bottom:6px;">ยังไม่มีโปรโมชั่นบนคลาวด์</div>
                <div style="font-size:0.85rem;margin-bottom:15px;">คุณสามารถใช้เทมเพลตเริ่มต้น หรือกดเพิ่มใหม่ได้คับ</div>
                <button onclick="seedDefaultPromos()" style="background:#f8fafc; border:1.5px solid #e2e8f0; padding:8px 16px; border-radius:10px; font-size:0.8rem; font-weight:700; cursor:pointer; color:#475569;">
                    ✨ ใช้โปรโมชั่นเริ่มต้น (2 รายการ)
                </button>
            </div>`;
            return;
        }

        // Sort client-side by order field
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

        area.innerHTML = docs.map((p, idx) => {
            const imgSrc   = p.imageBase64 || p.imageUrl || '';
            const isActive = p.active !== false;
            const sc = isActive ? {bg:'#f0fdf4',c:'#16a34a',b:'#bbf7d0',t:'✅ แสดง'} : {bg:'#fff1f0',c:'#dc2626',b:'#fca5a5',t:'⛔ ซ่อน'};
            return `<div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #f1f5f9;border-radius:12px;margin-bottom:8px;background:#fafafa;"
                         onmouseenter="this.style.borderColor='#e2e8f0'" onmouseleave="this.style.borderColor='#f1f5f9'">
                <div style="width:72px;height:48px;border-radius:8px;overflow:hidden;background:#e2e8f0;flex-shrink:0;">
                    ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🖼️</div>'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#0f172a;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.title || '(ไม่มีชื่อ)'}</div>
                    <span style="font-size:0.7rem;background:${sc.bg};color:${sc.c};border:1px solid ${sc.b};padding:1px 8px;border-radius:20px;font-weight:600;">${sc.t}</span>
                </div>
                <span style="font-size:0.72rem;color:#94a3b8;flex-shrink:0;">สไลด์ ${idx+1}</span>
                <div style="display:flex;gap:6px;flex-shrink:0;">
                    <button onclick="openPromoEditor('${p.id}')" style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;padding:5px 10px;border-radius:7px;font-size:0.75rem;font-weight:600;cursor:pointer;">✏️ แก้ไข</button>
                    <button onclick="deletePromotion('${p.id}')" style="background:#fff1f0;color:#dc2626;border:1px solid #fca5a5;padding:5px 10px;border-radius:7px;font-size:0.75rem;font-weight:600;cursor:pointer;">🗑️</button>
                </div>
            </div>`;
        }).join('');
    }, err => {
        console.error('[Promo] List error:', err);
        const area = document.getElementById('promo-list-area');
        if (area) area.innerHTML = `<div style="color:#dc2626;padding:16px;font-size:0.85rem;">❌ โหลดไม่ได้: ${err.message}</div>`;
    });
}

/* ── Open editor modal ── */
window.openPromoEditor = async function(docId) {
    _currentPromoId = docId || null;
    _currentPromoImgBase64 = null;

    document.getElementById('promoEditorModal').style.display = 'flex';

    const titleEl = document.getElementById('promoModalTitle');
    if (titleEl) titleEl.textContent = docId ? '✏️ แก้ไขโปรโมชั่น' : '➕ เพิ่มโปรโมชั่นใหม่';

    const deleteBtn = document.getElementById('promoDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = docId ? 'flex' : 'none';

    // Clear all fields
    ['promoTitle','promoSubDesc','promoDesc','promoCTALink',
     'pkg1Name','pkg1Price','pkg2Name','pkg2Price','pkg2OldPrice','pkg2Badge']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    resetModalImgPreview();
    const activeChk = document.getElementById('promoActive');
    if (activeChk) { activeChk.checked = true; syncToggleUI(true); }

    if (docId) {
        try {
            const doc = await db.collection('promotions').doc(docId).get();
            const d = doc.exists ? doc.data() : {};
            const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            set('promoTitle', d.title); set('promoSubDesc', d.subDesc);
            set('promoDesc', d.desc);   set('promoCTALink', d.ctaLink);
            set('pkg1Name', d.pkg1Name); set('pkg1Price', d.pkg1Price);
            set('pkg2Name', d.pkg2Name); set('pkg2Price', d.pkg2Price);
            set('pkg2OldPrice', d.pkg2OldPrice); set('pkg2Badge', d.pkg2Badge);
            if (activeChk) { activeChk.checked = (d.active !== false); syncToggleUI(activeChk.checked); }
            if (d.imageBase64 || d.imageUrl) showModalImgPreview(d.imageBase64 || d.imageUrl);
        } catch(e) { console.warn('[Promo] Load error:', e); }
    }
    if (activeChk) activeChk.onchange = () => syncToggleUI(activeChk.checked);
};

function syncToggleUI(on) {
    const track = document.getElementById('promoToggleTrack');
    const thumb = document.getElementById('promoToggleThumb');
    if (track) track.style.background = on ? '#22c55e' : '#ccc';
    if (thumb) thumb.style.left = on ? '27px' : '3px';
}

window.closePromoEditor = function() {
    document.getElementById('promoEditorModal').style.display = 'none';
    _currentPromoImgBase64 = null; _currentPromoId = null;
};

window.handlePromoImgUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('⚠️ รูปใหญ่เกิน 5MB'); return; }
    const reader = new FileReader();
    reader.onload = e => { _currentPromoImgBase64 = e.target.result; showModalImgPreview(_currentPromoImgBase64); };
    reader.readAsDataURL(file);
};

function showModalImgPreview(src) {
    const img = document.getElementById('promoImgPreviewImg');
    const ph  = document.getElementById('promoImgUploadPlaceholder');
    if (img && ph) { img.src = src; img.style.display = 'block'; ph.style.display = 'none'; }
}
function resetModalImgPreview() {
    const img = document.getElementById('promoImgPreviewImg');
    const ph  = document.getElementById('promoImgUploadPlaceholder');
    if (img && ph) { img.src = ''; img.style.display = 'none'; ph.style.display = 'flex'; }
}

/* ── Save promotion ── */
window.savePromotion = async function() {
    const btn = document.getElementById('promoSaveBtn');
    btn.disabled = true; btn.textContent = '⏳ กำลังบันทึก...';

    // Safe server timestamp (works in both compat and modular)
    const ts = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date();

    const g = id => document.getElementById(id)?.value.trim() || '';
    const payload = {
        title: g('promoTitle'), subDesc: g('promoSubDesc'), desc: g('promoDesc'),
        ctaLink: g('promoCTALink'), pkg1Name: g('pkg1Name'), pkg1Price: g('pkg1Price'),
        pkg2Name: g('pkg2Name'), pkg2Price: g('pkg2Price'),
        pkg2OldPrice: g('pkg2OldPrice'), pkg2Badge: g('pkg2Badge'),
        active: document.getElementById('promoActive')?.checked ?? true,
        updatedAt: ts
    };
    if (_currentPromoImgBase64) payload.imageBase64 = _currentPromoImgBase64;

    try {
        if (typeof db === 'undefined') throw new Error('Firestore (db) ยังไม่พร้อม กรุณาล็อกอินก่อน');
        if (_currentPromoId) {
            await db.collection('promotions').doc(_currentPromoId).set(payload, { merge: true });
        } else {
            const snap = await db.collection('promotions').get();
            payload.order = snap.size;
            payload.createdAt = ts;
            await db.collection('promotions').add(payload);
        }
        btn.textContent = '✅ บันทึกแล้ว!';
        setTimeout(() => { btn.disabled = false; btn.textContent = '💾 บันทึก & อัปเดต'; closePromoEditor(); }, 1000);
    } catch(e) {
        console.error('[Promo] Save error:', e);
        alert('❌ บันทึกไม่สำเร็จ: ' + e.message);
        btn.disabled = false; btn.textContent = '💾 บันทึก & อัปเดต';
    }
};

/* ── Delete promotion ── */
window.deletePromotion = async function(docId) {
    const id = docId || _currentPromoId;
    if (!id || !confirm('🗑️ ลบโปรโมชั่นนี้ใช่ไหมคับ?')) return;
    try {
        await db.collection('promotions').doc(id).delete();
        if (_currentPromoId === id) closePromoEditor();
    } catch(e) { alert('❌ ลบไม่สำเร็จ: ' + e.message); }
};

/* ── Seed default promotions ── */
window.seedDefaultPromos = async function() {
    if (!confirm('ต้องการเพิ่มโปรโมชั่นเริ่มต้น 2 รายการ (ผ่อนซ่อม & Accessory) ลงในระบบคลาวด์ใช่ไหมคับ?')) return;
    
    try {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ กำลังส่งข้อมูล...';

        for (const p of DEFAULT_PROMOS) {
            await db.collection('promotions').add({
                ...p,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        alert('✅ เพิ่มโปรโมชั่นเริ่มต้นสำเร็จแล้วคับ!');
        btn.textContent = originalText;
        btn.disabled = false;
    } catch (e) {
        console.error(e);
        alert('❌ เพิ่มไม่สำเร็จ: ' + e.message + '\n(โปรดตรวจสอบว่าคุณล็อกอิน Admin หรือยัง)');
        btn.disabled = false;
    }
};

// Auto-start list when Firestore is ready — called from startFirestoreSync above
// (No DOMContentLoaded fallback needed: db is only ready after auth)
