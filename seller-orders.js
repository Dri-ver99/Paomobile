let currentTab = 'all';
let ordersData = []; // Global store for Firestore orders

document.addEventListener('DOMContentLoaded', () => {
    // Check URL params for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        currentTab = tabParam;
    }

    initTabs();
    
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const orderCountStatus = document.getElementById('orderCountStatus');
    const lastUpdateStatus = document.getElementById('lastUpdateStatus');

    // 1. Sync from Firestore (Real-time)
    if (typeof db !== 'undefined') {
        console.log("[Firestore] Starting real-time listener...");
        db.collection('orders').onSnapshot(snapshot => {
            let fetchedOrders = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id 
            }));
            
            // Sort client-side so orders without createdAt still show up (at the bottom)
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                return dateB - dateA;
            });
            
            ordersData = fetchedOrders;
            
            // Update Diagnostic UI
            if (statusText) statusText.textContent = "Firestore: เชื่อมต่อแล้ว (Real-time)";
            if (statusIndicator) statusIndicator.style.background = "#52c41a"; // Green
            if (orderCountStatus) orderCountStatus.textContent = "ออเดอร์ในระบบ: " + ordersData.length;
            if (lastUpdateStatus) lastUpdateStatus.textContent = "อัปเดตล่าสุด: " + new Date().toLocaleTimeString();

            console.log("[Firestore] Received " + ordersData.length + " orders.");
            renderOrders();
            updateTabBadges();
        }, err => {
            console.error("[Firestore] Snapshot Error:", err);
            if (statusText) statusText.textContent = "Firestore Error: " + err.code;
            if (statusIndicator) statusIndicator.style.background = "#ff4d4f"; // Red
            
            if (err.code === 'permission-denied') {
                alert("Firestore Error: Permission Denied\n\nสาเหตุ: บัญชีของคุณไม่มีสิทธิ์อ่านข้อมูลออเดอร์ทั้งหมด\nวิธีแก้: กรุณาเข้าไปที่ Firebase Console > Firestore > Rules แล้วอัปเดต Security Rules ให้เรียบร้อยครับ");
            } else {
                alert("Firestore Error: " + err.message);
            }
            // Fallback to localStorage if Firestore fails
            ordersData = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
            renderOrders();
            updateTabBadges();
        });
    } else {
        console.warn("[Firestore] DB is not initialized. Falling back to local storage.");
        if (statusText) statusText.textContent = "Firestore: ไม่ได้ติดตั้ง (เชื่อมต่อไม่ได้)";
        if (statusIndicator) statusIndicator.style.background = "#ff4d4f"; // Red

        ordersData = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        renderOrders();
        updateTabBadges();
    }
});

function initTabs() {
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.dataset.tab === currentTab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }

        btn.addEventListener('click', (e) => {
            btns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            
            // Update URL without reload
            const url = new URL(window.location);
            url.searchParams.set('tab', currentTab);
            window.history.pushState({}, '', url);

            renderOrders();
            updateTabBadges();
        });
    });
}

function renderOrders() {
    const container = document.getElementById('full-orders-list');
    const orders = ordersData;

    // Helper: find name by phone if missing
    const getNameByPhone = (phone) => {
        if (!phone || phone === 'N/A') return null;
        const match = orders.find(o => o.customerPhone === phone && o.customerName && o.customerName !== 'N/A');
        return match ? match.customerName : null;
    };

    let filtered = orders;
    if (currentTab === 'unpaid') {
        filtered = orders.filter(o => o.status === 'ที่ต้องชำระ' || o.status === 'Pending');
    } else if (currentTab === 'toship') {
        filtered = orders.filter(o => o.status === 'ที่ต้องจัดส่ง' || o.status === 'To Ship');
    } else if (currentTab === 'processed') {
        filtered = orders.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed');
    } else if (currentTab === 'receive') {
        filtered = orders.filter(o => o.status === 'ที่ต้องได้รับ' || o.status === 'To Receive');
    } else if (currentTab === 'completed') {
        filtered = orders.filter(o => o.status === 'สำเร็จแล้ว' || o.status === 'Completed');
    } else if (currentTab === 'cancelled') {
        filtered = orders.filter(o => o.status === 'ยกเลิกแล้ว' || o.status === 'Cancelled' || o.status === 'คืนเงิน/คืนสินค้า' || o.status === 'Return');
    }

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
                    const firstItem = order.items[0] || { name: 'Unknown' };
                    const others = order.items.length > 1 ? ` <br><span style="font-size:0.8rem; color:#888;">ละรายการอื่นอีก ${order.items.length - 1} รายการ</span>` : '';
                    
                    // Tracking info display (v1.2)
                    let trackingHTML = '';
                    if (order.status === 'ที่ต้องได้รับ' || order.status === 'สำเร็จแล้ว') {
                        if (order.trackingNum) {
                            trackingHTML = `
                                <div style="margin-top: 8px; padding: 6px; background: #f9f9f9; border-radius: 4px; border: 1px dashed #ddd; font-size: 0.8rem;">
                                    <strong>เลขพัสดุ:</strong> ${order.trackingNum}
                                    <br>
                                    <a href="${order.trackingLink}" target="_blank" style="color: #ee4d2d; text-decoration: none; font-weight: 500;">
                                        🔍 เช็คสถานะคลิกที่นี่
                                    </a>
                                </div>
                            `;
                        }
                    }

                    return `
                        <tr>
                            <td style="color: #4080ff; font-family: monospace; font-size: 0.95rem;">${order.id}</td>
                            <td>
                                <div style="font-weight: 500;">${firstItem.name}${others}</div>
                                <div style="font-size: 0.8rem; color: #757575; margin-top: 4px;">ลูกค้า: ${order.customerName && order.customerName !== 'N/A' ? order.customerName : (getNameByPhone(order.customerPhone) || 'ไม่ระบุชื่อ')} (${order.customerPhone || '-'})</div>
                                ${trackingHTML}
                            </td>
                            <td style="text-align: center; font-weight: 600; font-size: 1rem; color: #ee4d2d;">฿${(order.total || 0).toLocaleString()}</td>
                            <td style="text-align: center;">
                                <span class="status-tag" style="${getStatusStyle(order.status)}">${order.status === 'ยกเลิกแล้ว' ? 'ขอยกเลิก/คืนเงิน/คืน' : order.status}</span>
                            </td>
                            <td style="text-align: right;">
                                ${order.status === 'ที่ต้องจัดส่ง' ? `<button class="btn-ship" onclick="shipOrder('${order.id}')">จัดส่ง</button>` : ''}
                                ${order.status === 'เตรียมจัดส่งแล้ว' ? `<button class="btn-ship" onclick="confirmSent('${order.id}')" style="background: #1890ff;">แจ้งส่งพัสดุ</button>` : ''}
                                ${order.status === 'ที่ต้องได้รับ' ? `<button class="btn-ship" onclick="markAsCompleted('${order.id}')" style="background: #52c41a; border-radius: 20px; padding: 6px 15px;">สำเร็จแล้ว</button>` : ''}
                                <button class="btn-detail" onclick="viewOrderDetails('${order.id}')">รายละเอียด</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getStatusStyle(status) {
    if (status === 'ที่ต้องชำระ' || status === 'Pending') return 'background: #fff1f0; border-color: #ffa39e; color: #f5222d;';
    if (status === 'ที่ต้องจัดส่ง' || status === 'To Ship') return 'background: #e6f7ff; border-color: #91d5ff; color: #1890ff;';
    if (status === 'เตรียมจัดส่งแล้ว' || status === 'Processed') return 'background: #fffbe6; border-color: #ffe58f; color: #faad14;';
    if (status === 'ที่ต้องได้รับ' || status === 'To Receive') return 'background: #f0f5ff; border-color: #adc6ff; color: #2f54eb;';
    if (status === 'สำเร็จแล้ว' || status === 'Completed') return 'background: #f6ffed; border-color: #b7eb8f; color: #52c41a;';
    if (status === 'ยกเลิกแล้ว' || status === 'ขอยกเลิก/คืนเงิน/คืน' || status === 'Cancelled' || status === 'คืนเงิน/คืนสินค้า' || status === 'Return') return 'background: #f5f5f5; border-color: #d9d9d9; color: #8c8c8c;';
    return '';
}

function shipOrder(orderId) {
    if(!confirm('ยืนยันเตรียมการจัดส่ง (แพ็คสินค้า) หมายเลข ' + orderId + ' ใช่หรือไม่?')) return;
    updateOrderStatus(orderId, 'เตรียมจัดส่งแล้ว');
}

function markAsCompleted(orderId) {
    if(!confirm('ยืนยันว่ารายการสั่งซื้อ ' + orderId + ' สำเร็จเรียบร้อยแล้วใช่หรือไม่?')) return;
    updateOrderStatus(orderId, 'สำเร็จแล้ว');
}

function confirmSent(orderId) {
    // Just open the modal now, the modal handles the logic
    viewOrderDetails(orderId);
}

function updateOrderStatus(orderId, newStatus, trackingNum = null, trackingLink = null) {
    try {
        const updateObj = { status: newStatus };
        if (trackingNum) updateObj.trackingNum = trackingNum;
        if (trackingLink) updateObj.trackingLink = trackingLink;

        // 1. Update Firestore (Cloud)
        if (window.db) {
            db.collection('orders').doc(orderId).update(updateObj)
                .then(() => console.log("Firestore updated successfully"))
                .catch(err => {
                    console.error("Firestore update failed:", err);
                    alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลบน Cloud");
                });
        }

        // 2. Local fallback sync logic
        const globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const gIdx = globalOrders.findIndex(o => o.id === orderId);
        
        if(gIdx > -1) {
            globalOrders[gIdx].status = newStatus;
            if (trackingNum) globalOrders[gIdx].trackingNum = trackingNum;
            if (trackingLink) globalOrders[gIdx].trackingLink = trackingLink;
            
            const customerId = globalOrders[gIdx].customer;
            
            // Sync with specific user list
            if (customerId && customerId !== 'guest') {
                const userOrdersKey = 'pao_orders_' + customerId;
                const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
                const uIdx = userOrders.findIndex(o => o.id === orderId);
                if (uIdx > -1) {
                    userOrders[uIdx].status = newStatus;
                    if (trackingNum) userOrders[uIdx].trackingNum = trackingNum;
                    if (trackingLink) userOrders[uIdx].trackingLink = trackingLink;
                    localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
                }
            }
            localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
            // No need to call renderOrders() here as onSnapshot will trigger it
        }
    } catch(e) {
        console.error("Failed to update status:", e);
    }
}

let currentModalOrderId = null;

function viewOrderDetails(orderId) {
    const order = ordersData.find(o => o.id === orderId);
    
    if (order) {
        currentModalOrderId = orderId;
        document.getElementById('modalCustomerName').textContent = order.customerName || 'N/A';
        document.getElementById('modalCustomerPhone').textContent = order.customerPhone || 'N/A';
        document.getElementById('modalCustomerAddress').textContent = order.customerAddress || 'ไม่มีข้อมูลที่อยู่จัดส่ง';
        
        // Handle Tracking Fields logic
        const shipSection = document.getElementById('shipInputSection');
        const shipBtn = document.getElementById('btnShipConfirm');
        const saveBtn = document.getElementById('btnSaveTracking');
        const inputNum = document.getElementById('modalTrackingNum');
        const inputLink = document.getElementById('modalTrackingLink');
        
        if (order.status === 'เตรียมจัดส่งแล้ว') {
            shipSection.style.display = 'block';
            shipBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            inputNum.value = order.trackingNum || '';
            inputLink.value = order.trackingLink || 'https://track.thailandpost.co.th/';
            inputNum.readOnly = false;
            inputLink.readOnly = false;
        } else if (order.status === 'ที่ต้องได้รับ') {
            shipSection.style.display = 'block';
            shipBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block'; // Show save button for editing only in "To Receive"
            inputNum.value = order.trackingNum || '';
            inputLink.value = order.trackingLink || '';
            inputNum.readOnly = false; // Allow editing
            inputLink.readOnly = false;
        } else if (order.status === 'สำเร็จแล้ว') {
            shipSection.style.display = 'block';
            shipBtn.style.display = 'none';
            saveBtn.style.display = 'none'; // No editing for completed orders
            inputNum.value = order.trackingNum || 'ไม่มีข้อมูล';
            inputLink.value = order.trackingLink || '-';
            inputNum.readOnly = true; // Read Only
            inputLink.readOnly = true;
        } else {
            shipSection.style.display = 'none';
            shipBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            inputNum.readOnly = false;
            inputLink.readOnly = false;
        }
        
        document.getElementById('orderDetailsModal').style.display = 'flex';
    }
}

function handleModalShip() {
    if (!currentModalOrderId) return;
    
    const num = document.getElementById('modalTrackingNum').value.trim();
    const link = document.getElementById('modalTrackingLink').value.trim();
    
    if (!num || !link) {
        alert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ');
        return;
    }
    
    if (!confirm('ยืนยันแจ้งส่งพัสดุหมายเลข ' + currentModalOrderId + ' ใช่หรือไม่?')) return;
    
    updateOrderStatus(currentModalOrderId, 'ที่ต้องได้รับ', num, link);
    closeOrderDetails();
}

function handleSaveTrackingEdit() {
    if (!currentModalOrderId) return;
    
    const num = document.getElementById('modalTrackingNum').value.trim();
    const link = document.getElementById('modalTrackingLink').value.trim();
    
    if (!num || !link) {
        alert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ');
        return;
    }
    
    if (!confirm('คุณมั่นใจจะเปลี่ยนรายละเอียดใช่ไหมคับ')) return;
    
    // Maintain same status, just update tracking info
    const globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
    const order = globalOrders.find(o => o.id === currentModalOrderId);
    const currentStatus = order ? order.status : 'ที่ต้องได้รับ';
    
    updateOrderStatus(currentModalOrderId, currentStatus, num, link);
    closeOrderDetails();
}

function closeOrderDetails() {
    document.getElementById('orderDetailsModal').style.display = 'none';
    currentModalOrderId = null;
    // Reset fields for next use
    document.getElementById('modalTrackingNum').readOnly = false;
    document.getElementById('modalTrackingLink').readOnly = false;
}

function updateTabBadges() {
    const orders = ordersData;
    
    const counts = {
        unpaid: orders.filter(o => o.status === 'ที่ต้องชำระ' || o.status === 'Pending').length,
        toship: orders.filter(o => o.status === 'ที่ต้องจัดส่ง' || o.status === 'To Ship').length,
        processed: orders.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed').length,
        receive: orders.filter(o => o.status === 'ที่ต้องได้รับ' || o.status === 'To Receive').length
    };

    Object.keys(counts).forEach(key => {
        const badge = document.getElementById(`badge-${key}`);
        if (badge) {
            if (counts[key] > 0) {
                badge.innerText = counts[key];
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    });
}
