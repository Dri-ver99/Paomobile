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
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(err => sellerAlert("Login Error: " + err.message, 'error'));
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

    async function startFirestoreSync() {
        console.log("[v2.0.0] Starting real-time sync (Supabase)...");
        
        const localGlobal = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        if (localGlobal.length > 0) {
            ordersData = localGlobal;
            renderOrders();
            updateTabBadges();
        }

        if (!window.supabase) return;

        const fetchAndMerge = async () => {
            const { data: cloudOrders, error } = await window.supabase.from('orders').select('*');
            if (error) {
                console.error("[v2.0.0] Sync Error:", error);
                const statusToast = document.getElementById('statusText');
                if (statusToast) statusToast.innerHTML = `Cloud: Sync Error ⚠️`;
                const statusInd = document.getElementById('statusIndicator');
                if (statusInd) statusInd.style.background = '#ff4d4f';
                loadLocalStorageFallback();
                return;
            }

            let fetchedOrders = cloudOrders || [];
            fetchedOrders.sort((a, b) => {
                const dateA = new Date(a.orderDate || a.createdAt || 0);
                const dateB = new Date(b.orderDate || b.createdAt || 0);
                return dateB - dateA;
            });
            
            const localMap = new Map();
            localGlobal.forEach(o => localMap.set(o.id, o));
            
            fetchedOrders = fetchedOrders.map(o => {
                if (localMap.has(o.id)) {
                    const localO = localMap.get(o.id);
                    const statusPriority = {
                        'ที่ต้องชำระ': 1, 'ที่ต้องจัดส่ง': 2, 'เตรียมจัดส่งแล้ว': 3, 'Processed': 3,
                        'ที่ต้องได้รับ': 4, 'สำเร็จแล้ว': 5, 'Completed': 5, 'ยกเลิกแล้ว': 6, 'คืนเงิน/คืนสินค้า': 6
                    };

                    const localWeight = statusPriority[localO.status] || 0;
                    const cloudWeight = statusPriority[o.status] || 0;

                    if (localWeight > cloudWeight) {
                        return { 
                            ...o, 
                            status: localO.status,
                            trackingNum: localO.trackingNum || o.trackingNum,
                            trackingLink: localO.trackingLink || o.trackingLink,
                            cancelReason: localO.cancelReason || o.cancelReason,
                            returnReason: localO.returnReason || o.returnReason
                        };
                    }
                }
                return o;
            });
            
            ordersData = processExpirations(fetchedOrders);
            
            const statusToast = document.getElementById('statusText');
            if (statusToast) statusToast.innerHTML = 'Cloud: เชื่อมต่อสำเร็จ ✅';
            const statusInd = document.getElementById('statusIndicator');
            if (statusInd) statusInd.style.background = '#52c41a';

            localStorage.setItem('pao_global_orders', JSON.stringify(ordersData));
            renderOrders();
            updateTabBadges();
        };

        fetchAndMerge();

        // Realtime Subscription
        window.supabase.channel('public:orders_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                fetchAndMerge();
            })
            .subscribe();
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
                        if (window.supabase) {
                            window.supabase.from('orders').update({ status: 'ยกเลิกแล้ว' }).eq('id', o.id)
                                .then(({error}) => { if (error) console.warn("Admin background expiry sync failed for", o.id, error) });
                            
                            // Restore vouchers
                            const email = o.customerEmail;
                            if (email) {
                                const codes = [...new Set([o.appliedDiscountCode, o.appliedShipCode, o.voucherCode].filter(Boolean))];
                                if (codes.length > 0) {
                                    const inserts = codes.map(c => ({ id: 'red-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5), email, code: c }));
                                    window.supabase.from('vouchers_redemptions').insert(inserts).then(() => {});
                                }
                            }
                        }
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
                    const itemsHtml = items.map(item => {
                        let itemName = item.name || 'ไม่ระบุชื่อสินค้า';
                        let variantText = '';
                        if (item.options && typeof item.options === 'string') {
                            variantText = ` <span style="color:#ee4d2d; font-size: 0.85rem;">[${item.options}]</span>`;
                        } else if (item.variant) {
                            variantText = ` <span style="color:#ee4d2d; font-size: 0.85rem;">[${item.variant}]</span>`;
                        } else if (item.color) {
                            variantText = ` <span style="color:#ee4d2d; font-size: 0.85rem;">[${item.color}]</span>`;
                        }
                        return `<div style="font-weight: 500; font-size: 0.9rem; line-height: 1.4; margin-bottom: 4px;">
                                   <span style="display:inline-block; min-width: 24px; color:#555; font-weight:600;">x${item.quantity || 1}</span> 
                                   <span style="color:#222;">${itemName}</span>${variantText}
                                </div>`;
                    }).join('');
                    
                    const emptyItemStr = order.status === 'DEBUG-TEST' ? 'รายการทดสอบ (Debug)' : 'ไม่ระบุสินค้า';
                    const displayHtml = items.length > 0 ? itemsHtml : `<div style="font-weight: 500; font-size: 0.9rem;">${emptyItemStr}</div>`;
                    
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
                                ${displayHtml}
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

async function deleteOrder(orderId) {
    if (!(await sellerConfirm('🚨 ยืนยันการลบออเดอร์ ' + orderId + ' ใช่ไหมคับ?', 'delete'))) return;
    if (window.supabase) {
        window.supabase.from('orders').delete().eq('id', orderId)
            .then(({error}) => {
                if(error) sellerAlert("ลบไม่สำเร็จ (Error): " + error.message, 'error');
                else {
                    sellerAlert("ลบทิ้งเรียบร้อยแล้วคับ!", 'success');
                    
                    // Instant UI Update
                    ordersData = ordersData.filter(o => o.id !== orderId);
                    const globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                    const filtered = globalOrders.filter(o => o.id !== orderId);
                    localStorage.setItem('pao_global_orders', JSON.stringify(filtered));
                    renderOrders();
                    if (typeof updateTabBadges === 'function') updateTabBadges();
                    
                    // Restore vouchers
                    const o = ordersData.find(x => x.id === orderId) || filtered.find(x => x.id === orderId);
                    if (o && o.customerEmail) {
                        const email = o.customerEmail;
                        const codes = [...new Set([o.appliedDiscountCode, o.appliedShipCode, o.voucherCode].filter(Boolean))];
                        if (codes.length > 0) {
                            const inserts = codes.map(c => ({ id: 'red-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5), email, code: c }));
                            window.supabase.from('vouchers_redemptions').insert(inserts).then(() => {});
                        }
                    }
                }
            });
    } else {
        const gOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const filtered = gOrders.filter(o => o.id !== orderId);
        localStorage.setItem('pao_global_orders', JSON.stringify(filtered));
        renderOrders();
        sellerAlert("ลบเรียบร้อย", 'success');
    }
}

function getStatusStyle(status) {
    if (status === 'ที่ต้องชำระ' || status === 'Pending') return 'background: #fff1f0; border-color: #ffa39e; color: #f5222d;';
    if (status === 'ที่ต้องจัดส่ง' || status === 'To Ship') return 'background: #e6f7ff; border-color: #91d5ff; color: #1890ff;';
    if (status === 'เตรียมจัดส่งแล้ว' || status === 'Processed') return 'background: #fffbe6; border-color: #ffe58f; color: #faad14;';
    if (status === 'ที่ต้องได้รับ' || status === 'To Receive') return 'background: #f0f5ff; border-color: #adc6ff; color: #2f54eb;';
    if (status === 'สำเร็จแล้ว' || status === 'Completed') return 'background: #f6ffed; border-color: #b7eb8f; color: #52c41a;';
    if (status === 'ยกเลิกแล้ว' || status === 'Cancelled' || status === 'Return' || status === 'คืนเงิน/คืนสินค้า') return 'background: #f5f5f5; border-color: #d9d9d9; color: #8c8c8c;';
    return '';
}

async function shipOrder(orderId) {
    if(!(await sellerConfirm('ยืนยันการจัดส่ง หมายเลข ' + orderId + ' ?', 'info'))) return;
    updateOrderStatus(orderId, 'เตรียมจัดส่งแล้ว');
}

async function markAsCompleted(orderId) {
    if(!(await sellerConfirm('ยืนยันออเดอร์สำเร็จแล้วใช่ไหม?', 'success'))) return;
    updateOrderStatus(orderId, 'สำเร็จแล้ว');
}

function updateOrderStatus(orderId, newStatus, trackingNum = null, trackingLink = null) {
    try {
        const updateObj = { status: newStatus };
        if (trackingNum) updateObj.trackingNum = trackingNum;
        if (trackingLink) updateObj.trackingLink = trackingLink;

        if (window.supabase) {
            const docId = orderId.trim();
            window.supabase.from('orders').update(updateObj).eq('id', docId)
                .then(({error}) => {
                    if (error) console.error("Supabase update failed for", docId, error);
                    else console.log("[Seller Sync] Supabase updated:", docId, newStatus);
                });
        }

        const globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
        const idx = globalOrders.findIndex(o => o.id === orderId);
        if(idx > -1) {
            globalOrders[idx] = { ...globalOrders[idx], ...updateObj };
            localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
            
            // Broadcast the update so customer tabs update instantly
            try {
                const bc = new BroadcastChannel('pao_order_sync');
                bc.postMessage({ type: 'SELLER_ORDER_UPDATE', updatedOrder: globalOrders[idx] });
            } catch (e) {}
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
    const profileEl = document.getElementById('modalCustomerProfile');
    profileEl.textContent = order.customerProfileName || order.customerNickname || order.customerEmail || 'ไม่มีข้อมูล';
    profileEl.onclick = () => {
        const contactId = order.customerEmail || order.uid;
        if (contactId) {
            window.location.href = `seller-chat.html?id=${contactId.toLowerCase().trim()}`;
        } else {
            sellerAlert("ไม่พบลิงก์ติดต่อกับลูกค้ารายนี้ครับ", 'warning');
        }
    };
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

    // Return / Cancel Reason Info
    const returnGroup = document.getElementById('returnReasonGroup');
    let reasonText = order.cancelReason || order.returnReason;
    
    const isCancelledState = order.status === 'ยกเลิกแล้ว' || order.status === 'Cancelled';
    const isReturnState = order.status === 'คืนเงิน/คืนสินค้า' || order.status === 'Return';

    // Fallback for older orders that were cancelled/returned before we started tracking reasons
    if (!reasonText && (isCancelledState || isReturnState)) {
        reasonText = isCancelledState ? 'ไม่ได้ระบุเหตุผล (ออเดอร์เก่า / กดยกเลิกอัตโนมัติ)' : 'ไม่ได้ระบุเหตุผล';
    }
    
    if (reasonText && (isCancelledState || isReturnState || order.cancelReason || order.returnReason)) {
        if (returnGroup) {
            returnGroup.style.display = 'block';
            const titleEl = returnGroup.querySelector('div:first-child');
            if (titleEl) {
                titleEl.innerHTML = (isCancelledState || order.cancelReason) ? '⚠️ เหตุผลการยกเลิกคำสั่งซื้อ' : '⚠️ เหตุผลการคืนสินค้า';
            }
            document.getElementById('modalReturnReason').textContent = reasonText;
        }
    } else {
        if (returnGroup) returnGroup.style.display = 'none';
    }

    // Voucher Info & Summary Discount Row
    const vGroup = document.getElementById('voucherInfoGroup');
    const summaryDiscountRow = document.getElementById('summaryDiscountRow');
    const vDiscRow = document.getElementById('modalVoucherDiscountRow');
    const vShipRow = document.getElementById('modalVoucherShipRow');
    
    // Check if either ship code or discount code was used
    if (order.appliedVoucherCode || order.appliedDiscountCode || order.appliedShipCode || order.discountAmount) {
        vGroup.style.display = 'block';
        
        const discCode = order.appliedDiscountCode || order.appliedVoucherCode;
        if (discCode || order.discountAmount) {
            if (vDiscRow) vDiscRow.style.display = 'flex';
            document.getElementById('modalVoucherCode').textContent = discCode || 'คูปองทั่วไป';
            document.getElementById('modalDiscountAmount').textContent = `-฿${(order.discountAmount || 0).toLocaleString()}`;
        } else {
            if (vDiscRow) vDiscRow.style.display = 'none';
        }
        
        if (order.appliedShipCode) {
            if (vShipRow) vShipRow.style.display = 'flex';
            document.getElementById('modalShipCode').textContent = order.appliedShipCode;
            // Assuming default shipping is 50, otherwise we'd need to save actual shipping discount.
            document.getElementById('modalShipDiscountAmount').textContent = `ส่งฟรี (-฿50)`;
        } else {
            if (vShipRow) vShipRow.style.display = 'none';
        }

        if (summaryDiscountRow) {
            summaryDiscountRow.style.display = 'none'; // We hide this since we replaced it with summaryDiscountsContainer in html
        }
    } else {
        vGroup.style.display = 'none';
        if (summaryDiscountRow) {
            summaryDiscountRow.style.display = 'none';
        }
    }

    const summaryDiscountsContainer = document.getElementById('summaryDiscountsContainer');
    if (summaryDiscountsContainer) {
        summaryDiscountsContainer.innerHTML = '';
        if (order.appliedDiscountCode && order.discountAmount > 0) {
            summaryDiscountsContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 1rem;">
                    <span style="color: #666; font-weight: 500;">ส่วนลด (${order.appliedDiscountCode})</span>
                    <span style="color: #cf1322; font-weight: 600;">-฿${order.discountAmount.toLocaleString()}</span>
                </div>
            `;
        } else if (order.discountAmount > 0) {
            summaryDiscountsContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 1rem;">
                    <span style="color: #666; font-weight: 500;">ส่วนลด</span>
                    <span style="color: #cf1322; font-weight: 600;">-฿${order.discountAmount.toLocaleString()}</span>
                </div>
            `;
        }

        if (order.appliedShipCode) {
            summaryDiscountsContainer.innerHTML += `
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 1rem;">
                    <span style="color: #666; font-weight: 500;">โค้ดส่งฟรี (${order.appliedShipCode})</span>
                    <span style="color: #0891b2; font-weight: 600;">-฿50</span>
                </div>
            `;
        }
    }

    const safeDiscount = order.discountAmount || 0;
    const safeTotal = order.total || 0;
    const itemsSubtotal = (order.items || []).reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    let baseShippingFee = (safeTotal + safeDiscount) - itemsSubtotal;
    if (order.appliedShipCode) {
        baseShippingFee = 50; // Since appliedShipCode makes finalShipping = 0, we restore base to 50 to match the -50 discount display
    }
    if (baseShippingFee < 0) baseShippingFee = 0;

    document.getElementById('modalSubtotal').textContent = `฿${itemsSubtotal.toLocaleString()}`;
    document.getElementById('modalShippingFee').textContent = baseShippingFee > 0 ? `+฿${baseShippingFee.toLocaleString()}` : `฿0`;
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
    if (!num || !link) { sellerAlert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ', 'warning'); return; }
    updateOrderStatus(currentModalOrderId, 'ที่ต้องได้รับ', num, link);
    closeOrderDetails();
}

function handleSaveTrackingEdit() {
    const num = document.getElementById('modalTrackingNum').value.trim();
    const link = document.getElementById('modalTrackingLink').value.trim();
    if (!num || !link) { sellerAlert('กรุณากรอกทั้งเลขพัสดุและลิงค์เช็คพัสดุ', 'warning'); return; }
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

function forceManualSync(fromBroadcast = false) {
    if (window.supabase) {
        window.supabase.from('orders').select('*').then(({data, error}) => {
            if (error || !data) return;
            let fetchedOrders = data;
            
            // Apply the same advanced merging logic to prevent overwriting local advanced states
            const localGlobal = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
            const localMap = new Map();
            localGlobal.forEach(o => localMap.set(o.id, o));
            
            fetchedOrders = fetchedOrders.map(o => {
                if (localMap.has(o.id)) {
                    const localO = localMap.get(o.id);
                    const statusPriority = {
                        'ที่ต้องชำระ': 1, 'ที่ต้องจัดส่ง': 2, 'เตรียมจัดส่งแล้ว': 3, 'Processed': 3,
                        'ที่ต้องได้รับ': 4, 'สำเร็จแล้ว': 5, 'Completed': 5, 'ยกเลิกแล้ว': 6, 'คืนเงิน/คืนสินค้า': 6
                    };
                    const localWeight = statusPriority[localO.status] || 0;
                    const cloudWeight = statusPriority[o.status] || 0;

                    if (localWeight > cloudWeight || (fromBroadcast && localWeight >= cloudWeight)) {
                        return { 
                            ...o, 
                            status: localO.status,
                            trackingNum: localO.trackingNum || o.trackingNum,
                            trackingLink: localO.trackingLink || o.trackingLink,
                            cancelReason: localO.cancelReason || o.cancelReason,
                            returnReason: localO.returnReason || o.returnReason
                        };
                    }
                }
                return o;
            });

            ordersData = fetchedOrders;
            ordersData.sort((a,b) => {
                const dateA = new Date(a.orderDate || a.createdAt || 0);
                const dateB = new Date(b.orderDate || b.createdAt || 0);
                return dateB - dateA;
            });
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

