let ordersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (typeof updateSidebarActiveState === 'function') updateSidebarActiveState();

    // --- v1.2.11 Instant Local Load ---
    updateDashboard();

    // Show baseline products (17) or cached count immediately
    const elProd = document.getElementById('insight-products');
    if (elProd) elProd.textContent = localStorage.getItem('pao_total_products_count') || 17;

    // --- v1.2.1 Auth & Firestore Initialization ---
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const statusIndicator = document.getElementById('firestore-status');
            
            if (user) {
                console.log("[v1.2.11] Dashboard User detected:", user.email);
                if (statusIndicator) {
                    statusIndicator.style.background = "#1890ff"; // Blue
                    statusIndicator.innerHTML = `&bull; Firestore: กำลังซิงค์ข้อมูล...`;
                }
                if (typeof db !== 'undefined') {
                    startFirestoreSync();
                }
            } else {
                console.warn("[v1.2.1] No user logged in.");
                if (statusIndicator) {
                    statusIndicator.style.background = "#faad14";
                    statusIndicator.innerHTML = `&bull; Firestore: กรุณาล็อกอิน <button onclick="firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())" style="margin-left:8px; border:none; background:#ee4d2d; color:#fff; padding:2px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer;">ล็อกอิน</button>`;
                }
                updateDashboard();
            }
        });
    } else {
        updateDashboard();
    }

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
            
            const statusIndicator = document.getElementById('firestore-status');
            if (statusIndicator) {
                statusIndicator.style.background = "#52c41a"; // Green
                statusIndicator.innerHTML = `&bull; Firestore: เชื่อมต่อแล้ว (v1.2.10) - พบ ${ordersData.length} ออเดอร์`;
            }
            
            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            updateDashboard();
        }, (err) => {
            console.error("[v1.2.10] Sync Error:", err);
            const statusIndicator = document.getElementById('firestore-status');
            if (statusIndicator) {
                statusIndicator.style.background = "#ff4d4f"; // Red
                statusIndicator.innerHTML = `&bull; Firestore: Error v1.2.10 (${err.code})`;
            }
            updateDashboard();
        });

        // Products Sync (for stats)
        db.collection('products').onSnapshot(snapshot => {
            const count = snapshot.size;
            // Use 17 as baseline if collection is empty
            const totalProductsCount = count > 0 ? count : 17; 
            const el = document.getElementById('insight-products');
            if (el) el.textContent = totalProductsCount;
            localStorage.setItem('pao_total_products_count', totalProductsCount);
        }, err => {
            console.warn("[v1.2.11] Product sync failed, using baseline:", err);
            const el = document.getElementById('insight-products');
            if (el) el.textContent = 17;
        });
    }

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
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const cachedProductCount = localStorage.getItem('pao_total_products_count') || 17;

    const elements = [
        { el: document.getElementById('stat-unpaid'), val: stats.unpaid },
        { el: document.getElementById('stat-to-ship'), val: stats.toShip },
        { el: document.getElementById('stat-processed'), val: stats.processed },
        { el: document.getElementById('stat-refund'), val: stats.refund },
        { el: document.getElementById('insight-sales'), val: '฿' + (totalSales || 0).toLocaleString() },
        { el: document.getElementById('insight-orders'), val: orders.length },
        { el: document.getElementById('insight-products'), val: cachedProductCount }
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
                    
                    return `
                        <tr style="border-bottom: 1px solid #fafafa;">
                            <td style="padding: 12px 0; color: #4080ff; font-family: monospace;">${order.id}</td>
                            <td style="padding: 12px 0;">
                                <div style="font-weight: 500;">${firstItemName}${others}</div>
                                <div style="font-size: 0.75rem; color: #999;">ลูกค้า: ${order.customerName || 'ไม่ระบุชื่อ'} (${order.customerPhone || '-'})</div>
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
    if(!confirm('ยืนยันแจ้งส่งพัสดุ หมายเลข ' + orderId + ' ?\nสถานะจะเปลี่ยนเป็น "ที่ต้องได้รับ" คับ')) return;
    
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
        document.getElementById('modalCustomerName').textContent = order.customerName || 'N/A';
        document.getElementById('modalCustomerPhone').textContent = order.customerPhone || 'N/A';
        document.getElementById('modalCustomerAddress').textContent = order.customerAddress || 'ไม่มีข้อมูลที่อยู่จัดส่ง';
        
        document.getElementById('orderDetailsModal').style.display = 'flex';
    }
}

function closeOrderDetails() {
    document.getElementById('orderDetailsModal').style.display = 'none';
}

function updateSidebarActiveState() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        const itemHref = item.getAttribute('href');
        if (!itemHref) return;
        
        const itemPath = itemHref.split('?')[0];
        const itemParams = new URLSearchParams(itemHref.split('?')[1] || '');
        const itemTab = itemParams.get('tab');
        
        item.classList.remove('active');
        
        // Match path
        if (currentPath === itemPath) {
            // Match tab if specified in link
            if (itemTab) {
                if (tab === itemTab) {
                    item.classList.add('active');
                }
            } else if (!tab && itemPath === 'seller-orders.html') {
                // Main orders link (no tab in link AND no tab in URL)
                item.classList.add('active');
            } else if (itemPath === 'seller-centre.html') {
                // Dashboard link
                item.classList.add('active');
            }
        }
    });
}
