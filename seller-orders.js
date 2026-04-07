let currentTab = 'all';
let ordersData = []; // Global store for Firestore orders

document.addEventListener('DOMContentLoaded', () => {
    // Check URL params for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        currentTab = tabParam.replace(/^-+/, ''); // Remove leading dashes if any
    }

    initTabs();
    if (window.updateSidebarActiveState) window.updateSidebarActiveState();
    
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const orderCountStatus = document.getElementById('orderCountStatus');
    const lastUpdateStatus = document.getElementById('lastUpdateStatus');

    // --- v1.2 Auth & Firestore Initialization ---
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const authEmail = document.getElementById('authEmail');
            const authIndicator = document.getElementById('statusIndicator');
            const loginBtn = document.getElementById('adminLoginBtn');
            const logoutBtn = document.getElementById('adminLogoutBtn');
            
            const SELLER_EMAIL = 'sattawat2560@gmail.com';
            const localAdminActive = localStorage.getItem('paomobile_admin_active') === 'true';

            if (user || localAdminActive) {
                const email = user ? (user.email || "").toLowerCase() : SELLER_EMAIL;
                const isAdmin = email === SELLER_EMAIL;
                
                if (authEmail) authEmail.textContent = email + (user ? "" : " (จำสิทธิ์ 🔒)");
                if (authIndicator) authIndicator.className = 'admin-status-dot ' + (isAdmin ? 'online' : 'warning');
                
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

                loadLocalStorageFallback();
            }
        });
    } else {
        loadLocalStorageFallback();
    }

    window.sellerLogin = () => {
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err => alert("Login Error: " + err.message));
    };

    window.sellerLogout = () => {
        localStorage.removeItem('paomobile_admin_active');
        firebase.auth().signOut().then(() => window.location.reload());
    };

    // Helper to view slip in a simple lightbox
    window.viewSlipLightbox = (src) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 100005;
            display: flex; align-items: center; justify-content: center; cursor: zoom-out;
            padding: 20px; backdrop-filter: blur(8px);
        `;
        overlay.onclick = () => document.body.removeChild(overlay);
        
        const img = document.createElement('img');
        img.src = src;
        img.style.cssText = 'max-width: 100%; max-height: 100%; border-radius: 8px; box-shadow: 0 0 40px rgba(0,0,0,0.5);';
        
        const closeHint = document.createElement('div');
        closeHint.textContent = 'แตะที่ใดก็ได้เพื่อปิด';
        closeHint.style.cssText = 'position: absolute; bottom: 20px; color: #fff; font-size: 0.9rem; background: rgba(0,0,0,0.5); padding: 8px 16px; border-radius: 20px; font-family: sans-serif;';
        
        overlay.appendChild(img);
        overlay.appendChild(closeHint);
        document.body.appendChild(overlay);
    };

    function startFirestoreSync() {
        console.log("[v1.2.11] Starting real-time sync...");
        
        const localGlobal = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        if (localGlobal.length > 0) {
            ordersData = localGlobal;
            renderOrders();
            updateTabBadges();
        }

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
            
            const localGlobal = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
            const localMap = new Map();
            localGlobal.forEach(o => localMap.set(o.id, o));
            
            fetchedOrders = fetchedOrders.map(o => {
                if (localMap.has(o.id)) {
                    const localO = localMap.get(o.id);
                    const advanced = ['ที่ต้องจัดส่ง', 'เตรียมจัดส่งแล้ว', 'ที่ต้องได้รับ', 'สำเร็จแล้ว'];
                    if (advanced.includes(localO.status) && o.status === 'ที่ต้องชำระ') {
                        return { ...o, status: localO.status };
                    }
                }
                return o;
            });
            
            ordersData = processExpirations(fetchedOrders);
            
            const statusToast = document.getElementById('statusText');
            if (statusToast) {
                statusToast.innerHTML = 'Cloud: เชื่อมต่อสำเร็จ ✅';
            }
            const statusInd = document.getElementById('statusIndicator');
            if (statusInd) statusInd.style.background = '#52c41a';

            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            renderOrders();
            updateTabBadges();
        }, err => {
            console.error("[v1.2.7] Sync Error:", err);
            const statusToast = document.getElementById('statusText');
            if (statusToast) {
                let msg = 'แชร์ไฟล์/ออฟไลน์ ⚠️';
                if (err.code === 'permission-denied') msg = 'จำกัดการเข้าถึง 🔒 (ต้องล็อกอิน)';
                statusToast.innerHTML = `Cloud: ${msg}`;
            }
            const statusInd = document.getElementById('statusIndicator');
            if (statusInd) statusInd.style.background = '#ff4d4f';
            
            loadLocalStorageFallback();
        });
    }

    function loadLocalStorageFallback() {
        ordersData = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        ordersData = processExpirations(ordersData);
        renderOrders();
        updateTabBadges();
    }

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
                        db.collection('orders').doc(o.id).update({ status: 'ยกเลิกแล้ว' })
                            .catch(err => console.warn("Admin background expiry sync failed for", o.id, err));
                    }
                }
            }
        });
        return orders;
    }

    setInterval(function() {
        if (ordersData && ordersData.length > 0) {
            const oldStatusStr = JSON.stringify(ordersData.map(o => o.status));
            ordersData = processExpirations(ordersData);
            const newStatusStr = JSON.stringify(ordersData.map(o => o.status));
            
            if (oldStatusStr !== newStatusStr) {
                renderOrders();
                updateTabBadges();
            }
        }
    }, 3000);

    const bc = new BroadcastChannel('pao_order_sync');
    bc.onmessage = (event) => {
        if (event.data && event.data.type === 'REFRESH_ORDERS') {
            if (event.data.updatedOrder) {
                const updated = event.data.updatedOrder;
                let found = false;
                ordersData = ordersData.map(o => {
                    if (o.id === updated.id) {
                        found = true;
                        return { ...o, ...updated };
                    }
                    return o;
                });
                
                if (found) {
                    localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
                    renderOrders();
                    updateTabBadges();
                }
            }
            forceManualSync(true); 
        }
    };
});

function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.dataset.tab === currentTab) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.addEventListener('click', (e) => {
            btns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            const url = new URL(window.location);
            url.searchParams.set('tab', currentTab);
            window.history.pushState({}, '', url);
            renderOrders();
            updateTabBadges();
            if (window.updateSidebarActiveState) window.updateSidebarActiveState();
        });
    });
}

function renderOrders() {
    const container = document.getElementById('full-orders-list');
    if (!container) return;
    const orders = ordersData;

    let filtered = orders;
    if (currentTab === 'unpaid') filtered = orders.filter(o => o.status === 'ที่ต้องชำระ' || o.status === 'Pending' || o.status === 'DEBUG-TEST');
    else if (currentTab === 'toship') filtered = orders.filter(o => o.status === 'ที่ต้องจัดส่ง' || o.status === 'To Ship');
    else if (currentTab === 'processed') filtered = orders.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed' || o.status === 'ที่ต้องได้รับ' || o.status === 'To Receive');
    else if (currentTab === 'completed') filtered = orders.filter(o => o.status === 'สำเร็จแล้ว' || o.status === 'Completed');
    else if (currentTab === 'cancelled') filtered = orders.filter(o => o.status === 'ยกเลิกแล้ว' || o.status === 'Cancelled' || o.status === 'คืนเงิน/คืนสินค้า' || o.status === 'Return');

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 60px 20px; text-align: center; color: #999;">ไม่พบคำสั่งซื้อในสถานะนี้</div>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th style="width: 15%">หมายเลขคำสั่งซื้อ</th>
                    <th style="width: 30%">สินค้า</th>
                    <th style="width: 15%; text-align: center;">ยอดรวม</th>
                    <th style="width: 15%; text-align: center;">สถานะ</th>
                    <th style="width: 25%; text-align: right;">จัดการ</th>
                </tr>
            </thead>
            <tbody>
                ${filtered.map(order => {
                    const items = order.items || [];
                    const firstItemName = items.length > 0 ? items[0].name : (order.status === 'DEBUG-TEST' ? 'รายการทดสอบ (Debug)' : 'ไม่ระบุสินค้า');
                    const others = items.length > 1 ? ` <br><span style="font-size:0.8rem; color:#888;">และรายการอื่นอีก ${items.length - 1} รายการ</span>` : '';
                    
                    const sourceText = order.orderSource ? order.orderSource : 'ไม่ระบุ';
                    const sourcePills = sourceText.split(',').map(s => {
                        let label = s.trim();
                        let color = '#757575', bg = '#f5f5f5', border = '#ddd';
                        if (label === 'parts') { label = 'อะไหล่'; color = '#d97706'; bg = '#fef3c7'; border = '#fde68a'; }
                        else if (label === 'used') { label = 'มือสอง'; color = '#059669'; bg = '#d1fae5'; border = '#a7f3d0'; }
                        else if (label === 'accessory') { label = 'อุปกรณ์'; color = '#2563eb'; bg = '#dbeafe'; border = '#bfdbfe'; }
                        return `<span style="display:inline-block; margin-top:6px; margin-right:4px; padding: 2px 8px; font-size: 0.75rem; border-radius: 4px; background:${bg}; color:${color}; border:1px solid ${border};">${label}</span>`;
                    }).join('');

                    return `
                        <tr>
                            <td data-label="หมายเลขคำสั่งซื้อ" style="color: #4080ff; font-family: monospace; font-size: 0.95rem;">${order.id}</td>
                            <td data-label="สินค้า">
                                <div style="font-weight: 500;">${firstItemName}${others}</div>
                                <div style="font-size: 0.8rem; color: #757575; margin-top: 4px;">ลูกค้า: ${order.customerName || 'ไม่ระบุชื่อ'} (${order.customerPhone || '-'})</div>
                                <div>${sourcePills}</div>
                            </td>
                            <td data-label="ยอดรวม" style="text-align: center; font-weight: 600; font-size: 1rem; color: #ee4d2d;">฿${(order.total || 0).toLocaleString()}</td>
                            <td data-label="สถานะ" style="text-align: center;">
                                <span class="status-tag" style="${getStatusStyle(order.status)}">${order.status}</span>
                            </td>
                            <td data-label="จัดการ" style="text-align: right;">
                                ${order.status === 'ที่ต้องชำระ' ? `<span style="font-size:0.8rem; color:#888;">รอการชำระเงิน/AI ตรวจสอบ</span>` : ''}
                                ${order.status === 'ที่ต้องจัดส่ง' ? `<button class="btn-ship" onclick="shipOrder('${order.id}')">จัดส่ง</button>` : ''}
                                ${order.status === 'เตรียมจัดส่งแล้ว' ? `<button class="btn-ship" onclick="confirmSent('${order.id}')" style="background: #1890ff;">แจ้งเลขพัสดุ</button>` : ''}
                                ${order.status === 'ที่ต้องได้รับ' ? `<button class="btn-ship" onclick="confirmSent('${order.id}')" style="background: #2f54eb;">แก้ไขเลขพัสดุ</button>` : ''}
                                ${order.status === 'ที่ต้องได้รับ' ? `<button class="btn-ship" onclick="markAsCompleted('${order.id}')" style="background: #52c41a;">สำเร็จแล้ว</button>` : ''}
                                <button class="btn-detail" onclick="viewOrderDetails('${order.id}')">รายละเอียด</button>
                                <button class="btn-detail" onclick="deleteOrder('${order.id}')" style="background: #fff; color: #ff4d4f; border-color: #ff4d4f; margin-left:5px;">ลบ</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function deleteOrder(orderId) {
    if (!confirm('🚨 ยืนยันการลบออเดอร์ ' + orderId + ' ใช่ไหมคับ?')) return;
    if (window.db) {
        db.collection('orders').doc(orderId).delete()
            .then(() => alert("ลบทิ้งเรียบร้อยแล้วคับ!"))
            .catch(err => alert("ลบไม่สำเร็จ (Error): " + err.message));
    } else {
        const gOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const filtered = gOrders.filter(o => o.id !== orderId);
        localStorage.setItem('pao_global_orders', JSON.stringify(filtered));
        renderOrders();
        alert("ลบเรียบร้อย");
    }
}

function getStatusStyle(status) {
    if (status === 'ที่ต้องชำระ' || status === 'Pending') return 'background: #fff1f0; border-color: #ffa39e; color: #f5222d;';
    if (status === 'ที่ต้องจัดส่ง' || status === 'To Ship') return 'background: #e6f7ff; border-color: #91d5ff; color: #1890ff;';
    if (status === 'เตรียมจัดส่งแล้ว' || status === 'Processed') return 'background: #fffbe6; border-color: #ffe58f; color: #faad14;';
    if (status === 'ที่ต้องได้รับ' || status === 'To Receive') return 'background: #f0f5ff; border-color: #adc6ff; color: #2f54eb;';
    if (status === 'สำเร็จแล้ว' || status === 'Completed') return 'background: #f6ffed; border-color: #b7eb8f; color: #52c41a;';
    if (status === 'ยกเลิกแล้ว' || status === 'Cancelled' || status === 'Return') return 'background: #f5f5f5; border-color: #d9d9d9; color: #8c8c8c;';
    return '';
}

function shipOrder(orderId) {
    if(!confirm('ยืนยันการจัดส่ง หมายเลข ' + orderId + ' ?')) return;
    updateOrderStatus(orderId, 'เตรียมจัดส่งแล้ว');
}

function markAsCompleted(orderId) {
    if(!confirm('ยืนยันออเดอร์สำเร็จแล้วใช่ไหม?')) return;
    updateOrderStatus(orderId, 'สำเร็จแล้ว');
}

function updateOrderStatus(orderId, newStatus, trackingNum = null, trackingLink = null) {
    try {
        const updateObj = { status: newStatus };
        if (trackingNum) updateObj.trackingNum = trackingNum;
        if (trackingLink) updateObj.trackingLink = trackingLink;

        if (window.db) {
            db.collection('orders').doc(orderId).update(updateObj)
                .catch(err => console.error("Firestore update failed:", err));
        }

        const globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const idx = globalOrders.findIndex(o => o.id === orderId);
        if(idx > -1) {
            globalOrders[idx] = { ...globalOrders[idx], ...updateObj };
            localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
        }
    } catch(e) {
        console.error("Failed to update status:", e);
    }
}

let currentModalOrderId = null;

function confirmSent(orderId) {
    viewOrderDetails(orderId, true);
}

function viewOrderDetails(orderId, isDispatch = false) {
    const order = ordersData.find(o => o.id === orderId);
    if (!order) return;
    currentModalOrderId = orderId;
    
    // UI elements
    const modal = document.getElementById('orderDetailsModal');
    const detailSection = document.getElementById('detailInfoSection');
    const shipSection = document.getElementById('shipInputSection');
    const shipBtn = document.getElementById('btnShipConfirm');
    const saveBtn = document.getElementById('btnSaveTracking');
    const inputNum = document.getElementById('modalTrackingNum');
    const inputLink = document.getElementById('modalTrackingLink');
    const modalTitle = document.getElementById('modalTitle');

    // Populate data (always, for both modes)
    document.getElementById('modalCustomerName').textContent = order.customerName || 'ไม่ระบุชื่อ';
    document.getElementById('modalCustomerProfile').textContent = order.customerProfileName || order.customerNickname || order.customerEmail || 'ไม่มีข้อมูล';
    document.getElementById('modalCustomerPhone').textContent = order.customerPhone || 'N/A';
    document.getElementById('modalShippingMethod').textContent = order.shippingMethod || 'รับที่ร้าน';
    document.getElementById('modalCustomerAddress').textContent = order.customerAddress || 'ไม่มีข้อมูลที่อยู่';
    document.getElementById('modalPaymentFull').textContent = `${order.paymentMethod || '-'} ${order.paymentBank ? '(' + order.paymentBank + ')' : ''}`;

    // Slip Info
    const slipGroup = document.getElementById('slipInfoGroup');
    const slipThumb = document.getElementById('modalSlipThumb');
    if (order.paymentSlip || order.paymentSlipUrl) {
        slipGroup.style.display = 'block';
        slipThumb.src = order.paymentSlip || order.paymentSlipUrl;
        document.getElementById('modalSlipLink').onclick = (e) => { e.preventDefault(); viewSlipLightbox(slipThumb.src); };
    } else {
        slipGroup.style.display = 'none';
    }

    // Voucher Info & Summary Discount Row
    const vGroup = document.getElementById('voucherInfoGroup');
    const summaryDiscountRow = document.getElementById('summaryDiscountRow');
    if (order.appliedVoucherCode || order.discountAmount) {
        vGroup.style.display = 'block';
        document.getElementById('modalVoucherCode').textContent = order.appliedVoucherCode || 'โค้ดส่วนลด';
        document.getElementById('modalDiscountAmount').textContent = `-฿${(order.discountAmount || 0).toLocaleString()}`;
        if (summaryDiscountRow) {
            summaryDiscountRow.style.display = 'flex';
            document.getElementById('modalSummaryDiscount').textContent = `-฿${(order.discountAmount || 0).toLocaleString()}`;
        }
    } else {
        vGroup.style.display = 'none';
        if (summaryDiscountRow) {
            summaryDiscountRow.style.display = 'none';
        }
    }

    const safeDiscount = order.discountAmount || 0;
    const safeTotal = order.total || 0;
    const calcSubtotal = order.subtotal || (safeTotal + safeDiscount);
    
    document.getElementById('modalSubtotal').textContent = `฿${calcSubtotal.toLocaleString()}`;
    document.getElementById('modalNetTotal').textContent = `฿${safeTotal.toLocaleString()}`;

    // --- MODE: Dispatch (แจ้งเลขพัสดุ) ---
    const paymentSummarySection = document.getElementById('paymentAndSummarySection');
    
    if (isDispatch) {
        modalTitle.textContent = 'แจ้งเลขพัสดุ';
        detailSection.style.display = 'block'; // Always show customer details
        if (paymentSummarySection) paymentSummarySection.style.display = 'none'; // Hide finance details
        shipSection.style.display = 'block';
        inputNum.value = order.trackingNum || '';
        inputLink.value = order.trackingLink || '';

        if (order.status === 'เตรียมจัดส่งแล้ว') {
            shipBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
        } else {
            shipBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        }
    }
    // --- MODE: Detail (รายละเอียด) ---
    else {
        modalTitle.textContent = 'รายละเอียดการจัดส่ง';
        detailSection.style.display = 'block';
        if (paymentSummarySection) paymentSummarySection.style.display = 'block'; // Show finance details
        shipSection.style.display = 'none';
        shipBtn.style.display = 'none';
        saveBtn.style.display = 'none';
    }

    modal.style.display = 'flex';
}

function handleModalShip() {
    const num = document.getElementById('modalTrackingNum').value.trim();
    const link = document.getElementById('modalTrackingLink').value.trim();
    if (!num || !link) { alert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ'); return; }
    updateOrderStatus(currentModalOrderId, 'ที่ต้องได้รับ', num, link);
    closeOrderDetails();
}

function handleSaveTrackingEdit() {
    const num = document.getElementById('modalTrackingNum').value.trim();
    const link = document.getElementById('modalTrackingLink').value.trim();
    if (!num || !link) { alert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ'); return; }
    const order = ordersData.find(o => o.id === currentModalOrderId);
    updateOrderStatus(currentModalOrderId, order.status, num, link);
    closeOrderDetails();
}

function closeOrderDetails() {
    document.getElementById('orderDetailsModal').style.display = 'none';
    currentModalOrderId = null;
}

function viewSlipLightbox(url) {
    const lb = document.getElementById('slipLightbox');
    const img = document.getElementById('lightboxImg');
    if (lb && img) { img.src = url; lb.style.display = 'flex'; setTimeout(() => lb.style.opacity = '1', 10); }
}

function closeSlipLightbox() {
    const lb = document.getElementById('slipLightbox');
    if (lb) { lb.style.opacity = '0'; setTimeout(() => lb.style.display = 'none', 300); }
}

function forceManualSync() {
    if (window.db) {
        db.collection('orders').get().then(snapshot => {
            ordersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            ordersData.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            renderOrders();
            updateTabBadges();
        });
    }
}

function updateTabBadges() {
    const unpaid = ordersData.filter(o => o.status === 'ที่ต้องชำระ' || o.status === 'Pending').length;
    const toship = ordersData.filter(o => o.status === 'ที่ต้องจัดส่ง' || o.status === 'To Ship').length;
    const processed = ordersData.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed').length;
    
    const badgeUnpaid = document.getElementById('badge-unpaid');
    if (badgeUnpaid) {
        badgeUnpaid.innerText = unpaid;
        badgeUnpaid.style.display = unpaid > 0 ? 'flex' : 'none';
    }
    
    const badgeToship = document.getElementById('badge-toship');
    if (badgeToship) {
        badgeToship.innerText = toship;
        badgeToship.style.display = toship > 0 ? 'flex' : 'none';
    }
    
    const badgeProcessed = document.getElementById('badge-processed');
    if (badgeProcessed) {
        badgeProcessed.innerText = processed;
        badgeProcessed.style.display = processed > 0 ? 'flex' : 'none';
    }
}

