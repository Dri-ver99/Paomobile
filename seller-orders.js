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
    updateSidebarActiveState();
    
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    const orderCountStatus = document.getElementById('orderCountStatus');
    const lastUpdateStatus = document.getElementById('lastUpdateStatus');

    // --- v1.2 Auth & Firestore Initialization ---
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const adminLoginBtn = document.getElementById('adminLoginBtn');
            const statusText = document.getElementById('statusText');
            const statusIndicator = document.getElementById('statusIndicator');

            if (user) {
                console.log("[v1.2] User detected:", user.email);
                if (adminLoginBtn) adminLoginBtn.style.display = 'none';
                
                // Proceed to fetch if initialized
                if (typeof db !== 'undefined') {
                    startFirestoreSync();
                }
            } else {
                console.warn("[v1.2.10] No user logged in. Firestore will be blocked.");
                if (statusText) statusText.textContent = "Firestore: กรุณาล็อกอิน (v1.2.10)";
                if (statusIndicator) statusIndicator.style.background = "#faad14"; // Orange
                if (adminLoginBtn) adminLoginBtn.style.display = 'block';
                
                // Fallback to local storage
                loadLocalStorageFallback();
            }
        });
    } else {
        loadLocalStorageFallback();
    }

    function startFirestoreSync() {
        console.log("[v1.2.11] Starting real-time sync...");
        
        // v1.2.11 - Pre-render local data for instant visibility
        const localGlobal = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        if (localGlobal.length > 0) {
            console.log("[v1.2.11] Pre-rendering local orders...");
            ordersData = localGlobal;
            renderOrders();
            updateTabBadges();
        }

        db.collection('orders').onSnapshot(snapshot => {
            let fetchedOrders = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id 
            }));
            
            // Sort client-side
            fetchedOrders.sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt)) : new Date(0);
                return dateB - dateA;
            });
            
            // ✅ Preserve optimistic local status (v1.4)
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
            
            // Update UI
            if (statusIndicator) statusIndicator.style.background = '#52c41a';
            if (statusText) statusText.textContent = "Firestore: เชื่อมต่อแล้ว (v1.2.11)";
            if (orderCountStatus) orderCountStatus.textContent = "ออเดอร์ในระบบ: " + ordersData.length;
            
            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            renderOrders();
            updateTabBadges();
        }, err => {
            console.error("[v1.2.7] Sync Error:", err);
            if (statusText) statusText.textContent = "Firestore Error (v1.2.7)";
            if (statusIndicator) statusIndicator.style.background = "#ff4d4f"; // Red
            
            if (err.code === 'permission-denied') {
                const currentUser = firebase.auth().currentUser;
                const emailMsg = currentUser ? currentUser.email : "ไม่ได้ล็อกอิน";
                alert("สิทธิ์ไม่ถูกต้อง (v1.2.7)\n\nกรุณาใช้เมล sattawat2560@gmail.com เท่านั้นครับ\n(Email ปัจจุบัน: " + emailMsg + ")");
                if (adminLoginBtn) adminLoginBtn.style.display = 'block';
            }
            loadLocalStorageFallback();
        });
    }

    function loadLocalStorageFallback() {
        ordersData = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        ordersData = processExpirations(ordersData);
        renderOrders();
        updateTabBadges();
    }

    // Expiration Logic for Seller Dashboard
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

    // Poll for expirations continuously in background
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

    // v1.4.8 - BroadcastChannel for Instant 1:1 Parity with Customer
    const bc = new BroadcastChannel('pao_order_sync');
    bc.onmessage = (event) => {
        console.log("[v1.4.8] Broadcast received:", event.data);
        if (event.data && event.data.type === 'REFRESH_ORDERS') {
            // OPTIMISTIC UPDATE: If we have an 'updatedOrder' object, use it!
            if (event.data.updatedOrder) {
                const updated = event.data.updatedOrder;
                let found = false;
                ordersData = ordersData.map(o => {
                    if (o.id === updated.id) {
                        found = true;
                        return { ...o, ...updated }; // Merge optimistic fields
                    }
                    return o;
                });
                
                // If not found in current list, maybe we should still fetch or wait for snapshot
                console.log("[v1.4.8] Optimistic Merge Result:", found ? "Success" : "Order ID not in current view");
                
                if (found) {
                    localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
                    renderOrders();
                    updateTabBadges();
                    if (statusText) statusText.textContent = `Firestore: เชื่อมต่อแล้ว (v1.2.11) - อัปเดตจากลูกค้าเมื่อ ${new Date().toLocaleTimeString()}`;
                }
            }
            
            // Still trigger a cloud sync in background as a safety
            forceManualSync(true); 
        }
    };
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

    let filtered = orders;
    if (currentTab === 'unpaid') {
        filtered = orders.filter(o => o.status === 'ที่ต้องชำระ' || o.status === 'Pending' || o.status === 'DEBUG-TEST');
    } else if (currentTab === 'toship') {
        filtered = orders.filter(o => o.status === 'ที่ต้องจัดส่ง' || o.status === 'To Ship');
    } else if (currentTab === 'processed') {
        filtered = orders.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed' || o.status === 'ที่ต้องได้รับ' || o.status === 'To Receive');
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
                    const items = order.items || [];
                    const firstItemName = items.length > 0 ? items[0].name : (order.status === 'DEBUG-TEST' ? 'รายการทดสอบ (Debug)' : 'ไม่ระบุสินค้า');
                    const others = items.length > 1 ? ` <br><span style="font-size:0.8rem; color:#888;">และรายการอื่นอีก ${items.length - 1} รายการ</span>` : '';
                    
                    // Tracking info not shown in seller table (shown in modal instead)
                    let trackingHTML = '';

                    return `
                        <tr>
                            <td style="color: #4080ff; font-family: monospace; font-size: 0.95rem;">${order.id}</td>
                            <td>
                                <div style="font-weight: 500;">${firstItemName}${others}</div>
                                <div style="font-size: 0.8rem; color: #757575; margin-top: 4px;">ลูกค้า: ${order.customerName || 'ไม่ระบุชื่อ'} (${order.customerPhone || '-'})</div>
                                ${trackingHTML}
                            </td>
                            <td style="text-align: center; font-weight: 600; font-size: 1rem; color: #ee4d2d;">฿${(order.total || 0).toLocaleString()}</td>
                            <td style="text-align: center;">
                                <span class="status-tag" style="${getStatusStyle(order.status)}">${order.status}</span>
                            </td>
                            <td style="text-align: right;">
                                ${order.status === 'ที่ต้องชำระ' ? `<span style="font-size:0.8rem; color:#888;">รอการชำระเงิน/AI ตรวจสอบ</span>` : ''}
                                ${order.status === 'ที่ต้องจัดส่ง' ? `<button class="btn-ship" onclick="shipOrder('${order.id}')">จัดส่ง</button>` : ''}
                                ${order.status === 'เตรียมจัดส่งแล้ว' ? `<button class="btn-ship" onclick="confirmSent('${order.id}')" style="background: #1890ff;">แจ้งส่งพัสดุ</button>` : ''}
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
    if (!confirm('🚨 ยืนยันการลบออเดอร์ ' + orderId + ' ใช่ไหมคับ? (ลบแล้วกู้ไม่ได้นะค๊าบ)')) return;
    
    if (window.db) {
        db.collection('orders').doc(orderId).delete()
            .then(() => alert("ลบทิ้งเรียบร้อยแล้วคับ!"))
            .catch(err => alert("ลบไม่สำเร็จ (Error): " + err.message));
    } else {
        const gOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const filtered = gOrders.filter(o => o.id !== orderId);
        localStorage.setItem('pao_global_orders', JSON.stringify(filtered));
        renderOrders();
        alert("ลบคลังในเครื่องเรียบร้อย");
    }
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
    if(!confirm('ยืนยันการจัดส่ง หมายเลข ' + orderId + ' ?\nรายการจะถูกย้ายไปที่หน้า "ที่ต้องได้รับ" ของลูกค้า ทันที')) return;
    updateOrderStatus(orderId, 'เตรียมจัดส่งแล้ว');
}

function markAsCompleted(orderId) {
    if(!confirm('ยืนยันว่ารายการสั่งซื้อ ' + orderId + ' สำเร็จเรียบร้อยแล้วใช่หรือไม่?')) return;
    updateOrderStatus(orderId, 'สำเร็จแล้ว');
}

function confirmPayment(orderId) {
    if(!confirm('ยืนยันว่าลูกค้าได้ชำระเงินสำหรับออเดอร์ ' + orderId + ' เรียบร้อยแล้วใช่หรือไม่?\n(ออเดอร์จะถูกย้ายไปที่หน้า "ที่ต้องจัดส่ง")')) return;
    updateOrderStatus(orderId, 'ที่ต้องจัดส่ง');
}

function confirmSent(orderId) {
    // Open modal in dispatch mode (simplified view)
    viewOrderDetails(orderId, true);
}

function updateOrderStatus(orderId, newStatus, trackingNum = null, trackingLink = null) {
    try {
        const updateObj = { status: newStatus };
        if (trackingNum) updateObj.trackingNum = trackingNum;
        if (trackingLink) updateObj.trackingLink = trackingLink;

        // 1. Update Firestore (Cloud)
        const firestoreDB = (typeof db !== 'undefined') ? db : (window.db ? window.db : null);
        if (firestoreDB) {
            firestoreDB.collection('orders').doc(orderId).update(updateObj)
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

function viewOrderDetails(orderId, isDispatch = false) {
    const order = ordersData.find(o => o.id === orderId);
    
    if (order) {
        currentModalOrderId = orderId;
        // Toggle Visibility for Dispatch Mode (v1.2.13)
        const shippingMethodEl = document.getElementById('modalShippingMethod');
        const paymentFullEl = document.getElementById('modalPaymentFull');
        
        // Always show these in all tabs (v1.4.9)
        if (shippingMethodEl) shippingMethodEl.closest('div').style.display = 'block';
        if (paymentFullEl) paymentFullEl.closest('div').style.display = 'block';

        document.getElementById('modalCustomerName').textContent = order.customerName || 'ไม่ระบุชื่อ';
        const profileEl = document.getElementById('modalCustomerProfile');
        profileEl.textContent = order.customerProfileName || order.customerEmail || 'ไม่มีข้อมูล';
        profileEl.onclick = () => {
            if (order.customerEmail) {
                const chatId = order.customerEmail.toLowerCase().trim();
                window.location.href = `seller-chat.html?id=${chatId}`;
            } else {
                alert("ไม่พบข้อมูลอีเมลสำหรับเปิดหน้าแชท");
            }
        };
        document.getElementById('modalCustomerPhone').textContent = order.customerPhone || 'N/A';
        document.getElementById('modalShippingMethod').textContent = order.shippingMethod || 'รับที่ร้าน';
        document.getElementById('modalCustomerAddress').textContent = order.customerAddress || 'ไม่มีข้อมูลที่อยู่จัดส่ง';
        
        // --- Payment Info (v1.2.11) ---
        const payMethod = order.paymentMethod || order.method || '-';
        const payBank = order.paymentBank || '';
        const paySlip = order.paymentSlip || '';
        
        let paymentFullText = payMethod;
        if (payBank && payBank !== 'N/A' && payBank !== '-') {
            paymentFullText += ` (${payBank})`;
        }
        document.getElementById('modalPaymentFull').textContent = paymentFullText;
        
        const slipGroup = document.getElementById('slipInfoGroup');
        
        if (paySlip) {
            slipGroup.style.display = 'block';
            const slipThumb = document.getElementById('modalSlipThumb');
            slipThumb.src = paySlip;
            slipThumb.style.cursor = 'pointer';
            // Handle large Base64 by using a click listener instead of a direct link
            const slipLink = document.getElementById('modalSlipLink');
            slipLink.href = "javascript:void(0)";
            slipLink.onclick = () => {
                viewSlipLightbox(paySlip);
            };
        } else {
            slipGroup.style.display = 'none';
        }

        // --- Voucher Info (v1.5.0) ---
        const vCode = order.appliedVoucherCode || order.voucherCode || '';
        const vDiscount = order.discountAmount || 0;
        const vGroup = document.getElementById('voucherInfoGroup');

        if (vCode || vDiscount > 0) {
            vGroup.style.display = 'block';
            document.getElementById('modalVoucherCode').textContent = vCode || 'สแกนรับ (Private)';
            document.getElementById('modalDiscountAmount').textContent = `-฿${vDiscount.toLocaleString()}`;
        } else {
            vGroup.style.display = 'none';
        }

        // --- Order Summary (v1.6.0) ---
        const items = order.items || [];
        const subtotal = items.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
        const netTotal = order.total || subtotal; // Use stored total as source of truth
        const totalDiscount = vDiscount; // Current known discount source

        document.getElementById('modalSubtotal').textContent = `฿${subtotal.toLocaleString()}`;
        document.getElementById('modalNetTotal').textContent = `฿${netTotal.toLocaleString()}`;
        
        const discRow = document.getElementById('summaryDiscountRow');
        if (totalDiscount > 0) {
            discRow.style.display = 'flex';
            document.getElementById('modalSummaryDiscount').textContent = `-฿${totalDiscount.toLocaleString()}`;
        } else {
            discRow.style.display = 'none';
        }

        // Handle Tracking Fields logic (v1.2.13)
        const shipSection = document.getElementById('shipInputSection');
        const shipBtn = document.getElementById('btnShipConfirm');
        const saveBtn = document.getElementById('btnSaveTracking');
        const inputNum = document.getElementById('modalTrackingNum');
        const inputLink = document.getElementById('modalTrackingLink');
        
        // Ensure tracking fields are visible if in dispatch mode
        if (isDispatch || order.status === 'เตรียมจัดส่งแล้ว' || order.status === 'ที่ต้องได้รับ' || order.status === 'สำเร็จแล้ว') {
            shipSection.style.display = 'block';
            inputNum.value = order.trackingNum || '';
            inputLink.value = order.trackingLink || '';
            
            if (isDispatch || order.status === 'เตรียมจัดส่งแล้ว') {
                shipBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
                inputNum.readOnly = false;
                inputLink.readOnly = false;
            } else if (order.status === 'ที่ต้องได้รับ') {
                shipBtn.style.display = 'none';
                saveBtn.style.display = 'inline-block';
                inputNum.readOnly = false;
                inputLink.readOnly = false;
            } else { // สำเร็จแล้ว
                shipBtn.style.display = 'none';
                saveBtn.style.display = 'none';
                inputNum.readOnly = true;
                inputLink.readOnly = true;
                if (!order.trackingNum) inputNum.value = 'ไม่มีข้อมูล';
            }
        } else {
            shipSection.style.display = 'none';
            shipBtn.style.display = 'none';
            saveBtn.style.display = 'none';
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

// v1.2.11 - Force Manual Sync with Cloud
function forceManualSync(isSilent = false) {
    const btn = (!isSilent && event && event.target && event.target.tagName === 'BUTTON') ? event.target : null;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '🔄 กำลังโหลด...';
    }

    if (typeof db !== 'undefined') {
        db.collection('orders').get({ source: 'server' }).then(snapshot => {
            console.log("[v1.2.11] Cloud Fetch Success:", snapshot.size);
            let fetchedOrders = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id 
            }));
            
            // Apply sorting (Newest first)
            fetchedOrders.sort((a, b) => {
                const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
                const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
                return dateB - dateA;
            });

            // v1.4.8 - PROTECT OPTIMISTIC STATUS: 
            // If local storage has 'ที่ต้องจัดส่ง' but cloud still has 'ที่ต้องชำระ', keep local!
            const localOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
            ordersData = fetchedOrders.map(o => {
                const local = localOrders.find(lo => lo.id === o.id);
                if (local && local.status === 'ที่ต้องจัดส่ง' && o.status === 'ที่ต้องชำระ') {
                    console.log("[v1.4.8] Keeping optimistic status for:", o.id);
                    return { ...o, status: 'ที่ต้องจัดส่ง' };
                }
                return o;
            });

            ordersData = processExpirations(ordersData);
            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            
            renderOrders();
            updateTabBadges();
            
            if (btn) {
                btn.innerHTML = '✅ รีเฟรชสำเร็จ';
                setTimeout(() => {
                    btn.disabled = false;
                    btn.innerHTML = '🔄 รีเฟรชข้อมูล';
                }, 1500);
            }
            if (statusText) statusText.textContent = `Firestore: เชื่อมต่อแล้ว (v1.2.11) - อัปเดตเมื่อ ${new Date().toLocaleTimeString()}`;
        }).catch(err => {
            console.error("Manual Sync Failed:", err);
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '❌ รีเฟรชล้มเหลว: ' + (err.code || 'ERR');
            }
            if (!isSilent) alert("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + err.message);
        });
    }
}

// Ensure the initial script actually runs v1.2.11
console.log("[v1.2.11] Seller Orders Logic Loaded");
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
        processed: orders.filter(o => o.status === 'เตรียมจัดส่งแล้ว' || o.status === 'Processed' || o.status === 'ที่ต้องได้รับ' || o.status === 'To Receive').length
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


function viewSlipLightbox(url) {
    const lightbox = document.getElementById('slipLightbox');
    const img = document.getElementById('lightboxImg');
    if (lightbox && img) {
        img.src = url;
        lightbox.style.display = 'flex';
        // Force reflow
        lightbox.offsetHeight;
        lightbox.style.opacity = '1';
        const content = lightbox.querySelector('div');
        if (content) content.style.transform = 'scale(1)';
        document.body.style.overflow = 'hidden';
    }
}

function closeSlipLightbox() {
    const lightbox = document.getElementById('slipLightbox');
    if (lightbox) {
        lightbox.style.opacity = '0';
        const content = lightbox.querySelector('div');
        if (content) content.style.transform = 'scale(0.9)';
        setTimeout(() => {
            lightbox.style.display = 'none';
            document.getElementById('lightboxImg').src = '';
            document.body.style.overflow = '';
        }, 300);
    }
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

// v1.2.11 - Special Cleanup Function for duckview96@gmail.com
async function cleanupUserOrders() {
    if (!confirm("🚨 ยืนยันการลบออเดอร์ทั้งหมดของ duckview96@gmail.com ใช่ไหมคับ?")) return;
    
    const targetEmail = "duckview96@gmail.com";
    const firestoreDB = (typeof db !== 'undefined') ? db : (window.db ? window.db : null);
    
    if (!firestoreDB) {
        alert("Firestore not initialized");
        return;
    }

    try {
        console.log("[Cleanup] Searching for user:", targetEmail);
        
        // 1. Find UID
        const uSnap = await firestoreDB.collection("users").where("email", "==", targetEmail).get();
        let uids = [];
        uSnap.forEach(doc => uids.push(doc.id));
        
        let deleteCount = 0;

        // 2. Delete by UIDs
        for (const uid of uids) {
            const oSnap = await firestoreDB.collection("orders").where("customer", "==", uid).get();
            for (const oDoc of oSnap.docs) {
                await firestoreDB.collection("orders").doc(oDoc.id).delete();
                deleteCount++;
            }
        }

        // 3. Delete by direct email fallback
        const oSnapEmail = await firestoreDB.collection("orders").where("customer", "==", targetEmail).get();
        for (const oDoc of oSnapEmail.docs) {
            await firestoreDB.collection("orders").doc(oDoc.id).delete();
            deleteCount++;
        }

        alert(`ลบออเดอร์ของ ${targetEmail} เรียบร้อยแล้วคับ!\nรวมทั้งหมด: ${deleteCount} รายการ`);
        
    } catch (err) {
        console.error("Cleanup failed:", err);
        alert("เกิดข้อผิดพลาด: " + err.message);
    }
}
