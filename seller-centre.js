let ordersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');

    // 1. Sync from Firestore (Real-time)
    if (typeof db !== 'undefined') {
        console.log("[Firestore] Dashboard: Starting real-time listener...");
        db.collection('orders').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            ordersData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id 
            }));
            
            const statusIndicator = document.getElementById('firestore-status');
            if (statusIndicator) {
                statusIndicator.style.background = "#52c41a"; // Green
                statusIndicator.innerHTML = `&bull; Firestore: เชื่อมต่อแล้ว (พบ ${ordersData.length} ออเดอร์)`;
            }
            
            console.log("[Firestore] Dashboard: Received " + ordersData.length + " orders.");
            updateDashboard();
        }, (err) => {
            console.error("[Firestore] Connection error:", err);
            const statusIndicator = document.getElementById('firestore-status');
            if (statusIndicator) statusIndicator.style.background = "#ff4d4f"; // Red
            
            if (err.code === 'permission-denied') {
                alert("Firestore Error: Permission Denied\n\nสาเหตุ: บัญชีของคุณไม่มีสิทธิ์เข้าถึงออเดอร์ทั้งหมด\nวิธีแก้: กรุณาล็อกอินด้วย sattawat2560@gmail.com และอัปเดต Security Rules ครับ");
            } else {
                alert("Firestore Error: " + err.message);
            }
        });
    } else {
        console.warn("[Firestore] DB is not initialized. Using fallback data.");
        updateDashboard();
    }
});

function updateDashboard() {
    const orders = ordersData.length > 0 ? ordersData : JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
    
    // 1. Update Stats Counts
    const stats = {
        unpaid: 0,
        toShip: 0,
        processed: 0,
        refund: 0,
        receive: 0,
        violated: 0
    };

    orders.forEach(order => {
        const s = order.status;
        if (s === 'ที่ต้องชำระ' || s === 'Pending') stats.unpaid++;
        else if (s === 'ที่ต้องจัดส่ง' || s === 'To Ship') stats.toShip++;
        else if (s === 'เตรียมจัดส่งแล้ว' || s === 'Processed') stats.processed++;
        else if (s === 'ที่ต้องได้รับ' || s === 'To Receive') stats.receive++;
        else if (s === 'ยกเลิกแล้ว' || s === 'ขอยกเลิก/คืนเงิน/คืน' || s === 'Cancelled' || s === 'คืนเงิน/คืนสินค้า' || s === 'Return') stats.refund++;
    });

    // Update UI numbers
    const elUnpaid = document.getElementById('stat-unpaid');
    const elToShip = document.getElementById('stat-to-ship');
    const elProcessed = document.getElementById('stat-processed');
    const elRefund = document.getElementById('stat-refund');
    
    if (elUnpaid) elUnpaid.textContent = stats.unpaid;
    if (elToShip) elToShip.textContent = stats.toShip;
    if (elProcessed) elProcessed.textContent = stats.processed;
    if (elRefund) elRefund.textContent = stats.refund;

    // 2. Update Business Insights (Sales)
    const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const elSales = document.getElementById('insight-sales');
    if (elSales) elSales.textContent = '฿' + totalSales.toLocaleString();

    const elOrderCount = document.getElementById('insight-orders');
    if (elOrderCount) elOrderCount.textContent = orders.length;

    // 3. Render Recent Orders List
    renderRecentOrders(orders);
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recent-orders-list');
    if (!container) return;

    // Helper: find name by phone if missing
    const getNameByPhone = (phone) => {
        if (!phone || phone === 'N/A') return null;
        const match = orders.find(o => o.customerPhone === phone && o.customerName && o.customerName !== 'N/A');
        return match ? match.customerName : null;
    };

    if (orders.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">ยังไม่มีคำสั่งซื้อในขณะนี้</div>';
        return;
    }

    // Show only last 5 for dashboard overview
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
                    const firstItem = order.items[0] || { name: 'Unknown' };
                    const others = order.items.length > 1 ? ` และอีก ${order.items.length - 1} รายการ` : '';
                    return `
                        <tr style="border-bottom: 1px solid #fafafa;">
                            <td style="padding: 12px 0; color: #4080ff; font-family: monospace;">${order.id}</td>
                            <td style="padding: 12px 0;">
                                <div style="font-weight: 500;">${firstItem.name}${others}</div>
                                <div style="font-size: 0.75rem; color: #999;">ลูกค้า: ${order.customerName && order.customerName !== 'N/A' ? order.customerName : (getNameByPhone(order.customerPhone) || 'ไม่ระบุชื่อ')} (${order.customerPhone || '-'})</div>
                            </td>
                            <td style="padding: 12px 0; text-align: center; font-weight: 600;">฿${order.total.toLocaleString()}</td>
                            <td style="padding: 12px 0; text-align: right;">
                                <span class="status-tag" style="${getStatusStyle(order.status)}">${order.status === 'ยกเลิกแล้ว' ? 'ขอยกเลิก/คืนเงิน/คืน' : order.status}</span>
                            </td>
                            <td style="padding: 12px 0; text-align: right;">
                                ${order.status === 'ที่ต้องจัดส่ง' ? `<button onclick="shipOrder('${order.id}')" style="background:#ee4d2d; color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer; margin-right:4px;">จัดส่ง</button>` : ''}
                                <button onclick="viewOrderDetails('${order.id}')" style="background:#fff; color:#4080ff; border:1px solid #4080ff; padding:3px 8px; border-radius:4px; font-size:0.75rem; cursor:pointer;">รายละเอียด</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getStatusStyle(status) {
    if (status === 'ที่ต้องชำระ') return 'background: #fff1f0; border-color: #ffa39e; color: #f5222d;';
    if (status === 'ที่ต้องจัดส่ง') return 'background: #e6f7ff; border-color: #91d5ff; color: #1890ff;';
    if (status === 'เตรียมจัดส่งแล้ว') return 'background: #fffbe6; border-color: #ffe58f; color: #faad14;';
    if (status === 'ที่ต้องได้รับ') return 'background: #f0f5ff; border-color: #adc6ff; color: #2f54eb;';
    if (status === 'สำเร็จแล้ว') return 'background: #f6ffed; border-color: #b7eb8f; color: #52c41a;';
    if (status === 'ยกเลิกแล้ว' || status === 'ขอยกเลิก/คืนเงิน/คืน' || status === 'Cancelled' || status === 'คืนเงิน/คืนสินค้า' || status === 'Return') return 'background: #f5f5f5; border-color: #d9d9d9; color: #8c8c8c;';
    return '';
}

// Order Management Actions
function shipOrder(orderId) {
    if(!confirm('ยืนยันเตรียมการจัดส่งสำหรับหมายเลขคำสั่งซื้อ ' + orderId + ' ใช่หรือไม่?')) return;
    
    if (typeof db !== 'undefined') {
        db.collection('orders').doc(orderId).update({ status: 'เตรียมจัดส่งแล้ว' })
            .then(() => {
                alert('อัปเดตสถานะสำเร็จ!');
            })
            .catch(err => {
                console.error("Firestore update failed:", err);
                alert("Error: " + err.message);
            });
    } else {
        alert('Firestore not connected. Update failed.');
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
