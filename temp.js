
>     <script>
          (function () {
              const getActiveUserId = () => { try { const u = JSON.parse(localStorage.getItem('paomobile_user')); 
return u ? (u.uid || u.phone || 'default') : 'guest'; } catch { return 'guest'; } };
              const getOrdersKey = () => 'pao_orders_' + getActiveUserId();
  
              let ordersData = []; // Combined local and cloud orders
  
              function loadLocalOnly() {
                  const local = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
                  ordersData = local.length > 0 ? local : mockData;
                  ordersData = processExpirations(ordersData);
                  const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                  renderOrders(ordersData, activeTab);
              }
  
              function processExpirations(orders) {
                  let updated = false;
                  orders.forEach(o => {
                      if (o.status === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ' && o.orderDate) {
                          const elapsed = Date.now() - new Date(o.orderDate).getTime();
                          if (elapsed > 30 * 60 * 1000) {
                              o.status = 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง';
                              updated = true;
  
                              // Sync to Cloud
                              const userId = getActiveUserId();
                              if (userId !== 'guest' && typeof db !== 'undefined' && db.collection) {
                                  db.collection('orders').doc(o.id).update({ status: 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง' 
})
                                      .catch(err => console.warn("Background expiry sync failed for", o.id, err));
                              }
                          }
                      }
                  });
  
                  if (updated) {
                      localStorage.setItem(getOrdersKey(), JSON.stringify(orders));
                      try {
                          const rawGlobal = localStorage.getItem('pao_global_orders') || '[]';
                          let globalOrders = JSON.parse(rawGlobal);
                          let gUpdated = false;
                          globalOrders.forEach(go => {
                              if (go.status === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ' && go.orderDate && (Date.now() - 
new Date(go.orderDate).getTime() > 30 * 60 * 1000)) {
                                  go.status = 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง';
                                  gUpdated = true;
                              }
                          });
                          if (gUpdated) { localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders)); }
                      } catch (e) { }
                  }
                  return orders;
              }
  
              // Firestore Sync (v1.2.10)
              function startCloudSync() {
                  const userId = getActiveUserId();
                  if (userId === 'guest') {
                      console.log("[v1.2.10] Guest mode: Cloud sync disabled.");
                      loadLocalOnly();
                      return;
                  }
  
                  console.log("[v1.2.11] Starting Cloud Sync for user:", userId);
  
                  // Pre-render local data for instant visibility
                  const localOrders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
                  if (localOrders.length > 0) {
                      ordersData = localOrders;
                      const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                      renderOrders(ordersData, activeTab);
                  }
  
                  db.collection('orders')
                      .where('customer', '==', userId)
                      .onSnapshot(snapshot => {
                          const cloudOrders = snapshot.docs.map(doc => ({
                              ...doc.data(),
                              id: doc.id
                          }));
  
                          // Merge with local (local as priority for unsynced orders if any)
                          const localOrders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
  
                          // Deduplicate: Use Map with ID as key
                          const mergedMap = new Map();
  
                          // Pass 1: Local
                          localOrders.forEach(o => mergedMap.set(o.id, o));
  
                          // Pass 2: Cloud 
                          cloudOrders.forEach(o => {
                              if (mergedMap.has(o.id)) {
                                  const localO = mergedMap.get(o.id);
                                  
                                  // โ… Advanced Merging Logic: Prevent "Stale" cloud status from overwriting "More 
Advanced" local status
                                  const statusPriority = {
                                      'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ': 1,
                                      'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ': 2,
                                      'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง': 3,
                                      'Processed': 3,
                                      'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ': 4,
                                      'เธชเธณเน€เธฃเนเธเนเธฅเนเธง': 5,
                                      'Completed': 5,
                                      'เธขเธเน€เธฅเธดเธเนเธฅเนเธง': 6,
                                      'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ': 6
                                  };
  
                                  const localWeight = statusPriority[localO.status] || 0;
                                  const cloudWeight = statusPriority[o.status] || 0;
  
                                  if (localWeight > cloudWeight) {
                                      return; // Don't overwrite with a less advanced status from cloud
                                  }
                              }
                              mergedMap.set(o.id, o);
                          });
  
                          ordersData = Array.from(mergedMap.values()).sort((a, b) => {
                              const dateA = new Date(a.orderDate || a.createdAt?.toDate?.() || 0);
                              const dateB = new Date(b.orderDate || b.createdAt?.toDate?.() || 0);
                              return dateB - dateA; // Newest first
                          });
  
                          // โ… Centralized Expiration Check (Fixes cloud-only order expiry)
                          ordersData = processExpirations(ordersData);
  
                          // โ… Sync back to Local Storage to ensure priority logic works on next snapshot
                          localStorage.setItem(getOrdersKey(), JSON.stringify(ordersData));
  
                          console.log("[v1.2.12] Sync Success: Found", ordersData.length, "orders");
                          const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                          renderOrders(ordersData, activeTab);
                      }, err => {
                          console.error("[v1.2.10] Sync Error:", err);
                          loadLocalOnly();
                      });
              }
  
              // Tab handler with URL param support
              function initTabs() {
                  const params = new URLSearchParams(window.location.search);
                  const targetTab = params.get('tab');
                  if (targetTab) {
                      const tabMap = {
                          'pay': 'pay',
                          'unpaid': 'pay', // v1.2.11 support both
                          'ship': 'ship',
                          'receive': 'receive',
                          'completed': 'completed',
                          'cancel': 'cancel',
                          'return': 'return'
                      };
                      const filter = tabMap[targetTab] || 'all';
                      document.querySelectorAll('.order-tab').forEach(t => {
                          if (t.dataset.filter === filter) {
                              t.classList.add('active');
                          } else {
                              t.classList.remove('active');
                          }
                      });
                  }
              }
              initTabs();
  
              // Sync globally on load
              startCloudSync();
              const mockData = [
                  {
                      id: 'PAO-L97U8JWK-W2X',
                      orderDate: new Date().toISOString(),
                      status: 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ',
                      items: [
                          { name: 'เธเธธเธ”เธเธฒเธฃเนเธ Why 20W Type C To C', price: 599, qty: 1, img: 'Why 
20w-1.jpg' },
                          { name: 'เธชเธฒเธขเธเธฒเธฃเนเธ Why 60W Type C To C', price: 399, qty: 1, img: 'Why 60W-1 
Type C To C - 1.jpg' }
                      ],
                      total: 998,
                      method: 'QR เธเธฃเนเธญเธกเน€เธเธขเน'
                  },
                  {
                      id: 'PAO-L97U8P3Y-Q8N',
                      orderDate: new Date(Date.now() - 3600000).toISOString(),
                      status: 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ',
                      items: [
                          { name: 'เธซเธนเธเธฑเธ Anidary ANT004', price: 699, qty: 1, img: 'earphone-1.jpg' }
                      ],
                      total: 699,
                      method: 'เน€เธเนเธเน€เธเธดเธเธเธฅเธฒเธขเธ—เธฒเธ'
                  }
              ];
  
              function formatDeadline(isoString) {
                  const d = new Date(new Date(isoString).getTime() + 30 * 60 * 1000);
                  const dd = ('0' + d.getDate()).slice(-2);
                  const mm = ('0' + (d.getMonth() + 1)).slice(-2);
                  const yy = d.getFullYear() + 543;
                  const hh = ('0' + d.getHours()).slice(-2);
                  const mi = ('0' + d.getMinutes()).slice(-2);
                  return `${dd}-${mm}-${yy} ${hh}:${mi}`;
              }
  
              function updateTabCounts(allOrders) {
                  const counts = { all: 0, pay: 0, ship: 0, receive: 0, completed: 0, cancel: 0, return: 0 };
                  counts.all = allOrders.length;
                  allOrders.forEach(o => {
                      const s = (o.status || '').trim();
                      if (s === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ') counts.pay++;
                      else if (s === 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ') counts.ship++;
                      else if (s === 'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ' || s === 
'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง' || s === 'Processed') counts.receive++;
                      else if (s === 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง' || s === 'Completed') counts.completed++;
                      else if (s === 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง') counts.cancel++;
                      else if (s === 'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ') counts.return++;
                  });
  
                  document.querySelectorAll('.order-tab').forEach(tab => {
                      const f = tab.dataset.filter;
                      const baseLabels = { all: 'เธ—เธฑเนเธเธซเธกเธ”', pay: 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ', 
ship: 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ', receive: 'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ', completed: 
'เธชเธณเน€เธฃเนเธเนเธฅเนเธง', cancel: 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง', return: 
'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ' };
                      if (f && baseLabels[f]) {
                          tab.textContent = baseLabels[f] + (counts[f] > 0 ? ` (${counts[f]})` : '');
                      }
                  });
              }
  
              function renderOrders(orders, filter = 'all') {
                  const container = document.getElementById('ordersList');
                  if (!container) return;
  
                  // Sync status badge update
                  updateTabCounts(orders);
  
                  const displayOrders = orders;
  
                  const searchInput = document.getElementById('orderSearchInput');
                  const q = searchInput ? searchInput.value.toLowerCase().trim() : '';
  
                  const filtered = displayOrders.filter(o => {
                      // 1. Tab Filter
                      let tabMatch = false;
                      const s = (o.status || '').trim();
                      if (filter === 'all') tabMatch = true;
                      else if (filter === 'pay') tabMatch = (s === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ');
                      else if (filter === 'ship') tabMatch = (s === 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ');
                      else if (filter === 'receive') tabMatch = (s === 'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ' || s 
=== 'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง' || s === 'Processed');
                      else if (filter === 'completed') tabMatch = (s === 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง' || s === 
'Completed');
                      else if (filter === 'cancel') tabMatch = (s === 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง');
                      else if (filter === 'return') tabMatch = (s === 
'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ');
  
                      if (!tabMatch) return false;
  
                      // 2. Search Filter
                      if (!q) return true;
                      const idMatch = (o.id || '').toLowerCase().includes(q);
                      const nameMatch = (o.items || []).some(item => (item.name || '').toLowerCase().includes(q));
                      return idMatch || nameMatch;
                  });
  
                  if (filtered.length === 0) {
                      container.innerHTML = `
                          <div style="text-align: center; padding: 100px 20px; color: #757575; background: #fff; 
border-radius: 4px; border: 1px solid #eee;">
                              <div style="font-size: 4rem; margin-bottom: 20px;">๐“ฆ</div>
                              <div style="font-size: 
1.1rem;">เธขเธฑเธเนเธกเนเธกเธตเธฃเธฒเธขเธเธฒเธฃเธชเธฑเนเธเธเธทเนเธญเนเธเนเธ–เธเธเธตเน</div>
                          </div>
                      `;
                      return;
                  }
  
                  try {
                      container.innerHTML = filtered.map(order => {
                          const items = order.items || [];
                          const status = order.status || 'เธฃเธญเธ”เธณเน€เธเธดเธเธเธฒเธฃ';
                          return `
                      <div class="order-card" style="border: 1px solid #eee; margin-bottom: 20px; border-radius: 8px; 
overflow: visible; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.03);">
                          <div class="order-card-body" style="padding: 15px 20px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; 
margin-bottom: 12px; border-bottom: 1px solid #f9f9f9; padding-bottom: 10px;">
                                  <div style="font-size: 0.85rem; color: #757575; font-family: monospace; display: 
flex; align-items: center;">
                                      เธฃเธซเธฑเธชเธเธณเธชเธฑเนเธเธเธทเนเธญ: ${order.id}
                                  </div>
                                  <div class="order-status" style="font-weight: 600; color: #ee4d2d; font-size: 
0.9rem;">${status}</div>
                              </div>
                              ${items.map((item, idx) => `
                                  <div class="order-item" style="border-bottom: none; padding: 10px 0;">
                                      <img src="${item.img || 'logo.png'}" alt="${item.name || 'เธชเธดเธเธเนเธฒ'}" 
class="item-img" onerror="this.src='logo.png'" style="width: 70px; height: 70px;">
                                      <div class="item-details">
                                          <div class="item-name" style="font-weight: 400; font-size: 0.95rem; color: 
#222;">${item.name || 'เนเธกเนเธฃเธฐเธเธธเธเธทเนเธญเธชเธดเธเธเนเธฒ'}</div>
                                          <div class="item-variation" style="color: #888;">เธเธณเธเธงเธ: 
x${item.qty || 1}</div>
                                      </div>
                                      <div class="item-price-info">
                                          <div class="price-final" style="color: #ee4d2d; font-weight: 
500;">เธฟ${(item.price || 0).toLocaleString()}</div>
                                      </div>
                                  </div>
                              `).join('')}
                          </div>
                          <div class="order-total-row" style="padding: 15px 20px; background: #fafafa; border-top: 1px 
dashed #eee; display: flex; justify-content: flex-end; align-items: center; gap: 15px; margin: 0; flex-wrap: wrap;">
                              ${order.trackingNum ? `
                              <div style="flex: 1; display: flex; align-items: center; gap: 12px; min-width: 250px;">
                                  <div style="background: #fff; border: 1.5px solid #ee4d2d; padding: 6px 15px; 
border-radius: 8px; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 6px rgba(238, 77, 45, 0.1);">
                                      <div style="font-size: 0.95rem; color: #555;">เน€เธฅเธเธเธฑเธชเธ”เธธ: <strong 
onclick="window.copyTrackingNumber('${order.trackingNum}', this)" 
title="เธเธฅเธดเธเน€เธเธทเนเธญเธเธฑเธ”เธฅเธญเธ" style="font-family: monospace; color: #ee4d2d; font-size: 
1.1rem; cursor: pointer; padding: 2px 5px; border-radius: 4px; transition: background 
0.2s;">${order.trackingNum}</strong></div>
                                      ${order.trackingLink ? `
                                          <a href="${order.trackingLink}" target="_blank" style="background: #ee4d2d; 
color: #fff; text-decoration: none; padding: 6px 18px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; 
transition: all 0.2s; box-shadow: 0 2px 4px rgba(238, 77, 45, 0.2); display: inline-block; position: relative; 
z-index: 10;">เน€เธเนเธเธเธฑเธชเธ”เธธ</a>
                                      ` : ''}
                                  </div>
                              </div>
                              ` : (status === 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ' || status === 
'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง' || status === 'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ' ? `
                              <div style="flex: 1; display: flex; align-items: center; gap: 8px;">
                                  <div style="color: #faad14; font-size: 1.2rem;">โ—</div>
                                  <div style="font-size: 0.95rem; color: #555;">
                                      ${((order.status || '').trim() === 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ') ? 
'เธฃเธญเธเธนเนเธเธฒเธขเธเธฑเธ”เธชเนเธเนเธฅเธฐเนเธเนเธเน€เธฅเธเธเธฑเธชเธ”เธธ...' : 
'เธเธฑเธชเธ”เธธเธเธณเธฅเธฑเธเน€เธ”เธดเธเธ—เธฒเธเนเธเธซเธฒเธเธธเธ“...'}
                                  </div>
                              </div>
                              ` : '')}
                              ${(() => {
                                  const calcSubtotal = order.subtotal !== undefined ? order.subtotal : 
items.reduce((sum, item) => sum + ((item.price||0) * (item.qty||1)), 0);
                                  const calcBaseShipping = order.baseShippingCost !== undefined ? 
order.baseShippingCost : 50;
                                  let html = `<div id="breakdown-${order.id}" style="display: none; width: 100%; 
flex-direction: column; align-items: flex-end; gap: 8px; margin-bottom: 12px; margin-top: 5px; font-size: 0.9rem; 
color: #555;">`;
                                  html += `<div style="display: flex; justify-content: flex-end; width: 100%; 
max-width: 380px;"><span style="flex:1; text-align:right; margin-right: 
20px;">เธฃเธงเธกเธเนเธฒเธชเธดเธเธเนเธฒ</span><span style="min-width: 60px; text-align: right; color: #222; 
font-weight: 500;">เธฟ${calcSubtotal.toLocaleString()}</span></div>`;
                                  if (calcBaseShipping > 0) {
                                      html += `<div style="display: flex; justify-content: flex-end; width: 100%; 
max-width: 380px;"><span style="flex:1; text-align:right; margin-right: 20px;">เธเนเธฒเธเธฑเธ”เธชเนเธ</span><span 
style="min-width: 60px; text-align: right; color: #222; font-weight: 
500;">เธฟ${calcBaseShipping.toLocaleString()}</span></div>`;
                                  }
                                  if (order.discountAmount > 0) {
                                      const dCode = order.appliedDiscountCode || order.voucherCode;
                                      html += `<div style="display: flex; justify-content: flex-end; width: 100%; 
max-width: 380px;"><span style="flex:1; text-align:right; margin-right: 
20px;">เธชเนเธงเธเธฅเธ”เธเนเธฒเธชเธดเธเธเนเธฒ ${dCode ? `(${dCode})` : ''}</span><span style="min-width: 60px; 
text-align: right; color: #ee4d2d; font-weight: 500;">-เธฟ${order.discountAmount.toLocaleString()}</span></div>`;
                                  }
                                  if (order.appliedShipCode) {
                                      html += `<div style="display: flex; justify-content: flex-end; width: 100%; 
max-width: 380px;"><span style="flex:1; text-align:right; margin-right: 20px;">เนเธเนเธ”เธชเนเธเธเธฃเธต 
(${order.appliedShipCode})</span><span style="min-width: 60px; text-align: right; color: #00bfa5; font-weight: 
500;">-เธฟ${calcBaseShipping.toLocaleString()}</span></div>`;
                                  } else if (order.baseShippingCost === undefined && order.total <= (calcSubtotal - 
(order.discountAmount||0)) && calcBaseShipping > 0) {
                                      html += `<div style="display: flex; justify-content: flex-end; width: 100%; 
max-width: 380px;"><span style="flex:1; text-align:right; margin-right: 
20px;">เนเธเนเธ”เธชเนเธเธเธฃเธต</span><span style="min-width: 60px; text-align: right; color: #00bfa5; 
font-weight: 500;">-เธฟ${calcBaseShipping.toLocaleString()}</span></div>`;
                                  }
                                  html += `</div>`;
                                  return html;
                              })()}
                              <div onclick="toggleBreakdown('${order.id}')" style="width: 100%; display: flex; 
justify-content: flex-end; align-items: center; gap: 6px; cursor: pointer; user-select: none;">
                                  <div class="total-label" style="font-size: 0.95rem; color: 
#555;">${status.includes('เธเธณเธฃเธฐ') ? 'เธเธณเธเธงเธเน€เธเธดเธเธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ:' : 
'เธขเธญเธ”เธเธณเธชเธฑเนเธเธเธทเนเธญเธ—เธฑเนเธเธซเธกเธ”:'}</div>
                                  <div class="total-price" style="font-weight: 600; color: #ee4d2d; font-size: 
${status.includes('เธเธณเธฃเธฐ') ? '1.4rem' : '1.3rem'};">เธฟ${(order.total || 0).toLocaleString()}</div>
                                  <svg id="chevron-${order.id}" style="width: 16px; height: 16px; color: #888; 
transition: transform 0.3s ease; margin-left: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path 
stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                              </div>
                          </div>
                          <div class="order-card-footer" style="padding: 15px 20px; border-top: 1px solid #f5f5f5; 
background: #fff; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                                  <div style="font-size: 0.85rem; color: #757575;">
                                      ${status === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ' && order.orderDate ? 
`เธเธณเธฃเธฐเน€เธเธดเธเธเธฒเธขเนเธ ${formatDeadline(order.orderDate)} เนเธ”เธข ${order.paymentMethod || 
order.method || 'QR เธเธฃเนเธญเธกเน€เธเธขเน'}${order.paymentBank ? ` (${order.paymentBank})` : ''}` : 
`เธฃเธซเธฑเธชเธเธณเธชเธฑเนเธเธเธทเนเธญ: <strong style="color: #444;">${order.id}</strong>`}
                                  </div>
  
                                  <div class="order-actions" style="gap: 12px; display: flex; align-items: center;">
                                      ${status === 'เธ—เธตเนเธ•เนเธญเธเธเธณเธฃเธฐ' ? `
                                          <button class="btn-purchase btn-purchase-primary" 
                                              onclick="window.goToPayment && window.goToPayment({id: '${order.id}', 
total: ${order.total}, method: '${order.method || ''}', paymentMethod: '${order.paymentMethod || ''}', paymentBank: 
'${order.paymentBank || ''}'})" 
                                              style="border-radius: 4px; border: none; background: #ee4d2d; color: 
#fff; font-weight: 500; padding: 8px 20px; font-size: 0.95rem;">เธเธณเธฃเธฐเน€เธเธดเธเธ•เธญเธเธเธตเน</button>
                                          <div style="position: relative; display: inline-block;">
                                              <button class="btn-purchase" onclick="toggleDropdown('${order.id}', 
event)" style="border-radius: 4px; background: #fff; color: #555; border: 1px solid #ddd; padding: 8px 16px; 
font-size: 0.95rem;">เน€เธเธดเนเธกเน€เธ•เธดเธก ห…</button>
                                              <div id="dropdown-${order.id}" class="more-dropdown" style="display: 
none; position: absolute; top: 100%; right: 0; background: #fff; border: 1px solid #ee4d2d; box-shadow: 0 4px 12px 
rgba(0,0,0,0.15); border-radius: 2px; padding: 8px 0; min-width: 190px; z-index: 100; margin-top: 5px;">
                                                  <div onclick="cancelOrderUser('${order.id}')" style="padding: 10px 
16px; cursor: pointer; color: #555; font-size: 0.9rem;">เธขเธเน€เธฅเธดเธเธเธณเธชเธฑเนเธเธเธทเนเธญ</div>
                                                  <div onclick="changePaymentUser('${order.id}', 
'${order.paymentMethod || 'QR เธเธฃเนเธญเธกเน€เธเธขเน'}')" style="padding: 10px 16px; cursor: pointer; color: 
#555; font-size: 0.9rem;">เน€เธเธฅเธตเนเธขเธเธเนเธญเธเธ—เธฒเธเธเธฒเธฃเธเธณเธฃเธฐเน€เธเธดเธ</div>
                                              </div>
                                          </div>
                                      ` : (['เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ', 
'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ', 'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง', 
'Processed'].includes(status) ? `
                                          ${(status === 'เธ—เธตเนเธ•เนเธญเธเนเธ”เนเธฃเธฑเธ' || status === 
'เน€เธ•เธฃเธตเธขเธกเธเธฑเธ”เธชเนเธเนเธฅเนเธง' || status === 'Processed') ? `
                                              <button class="btn-purchase btn-purchase-primary" 
                                                  onclick="window.markAsCompletedUser('${order.id}')" 
                                                  style="border-radius: 4px; border: none; background: #ee4d2d; color: 
#fff; font-weight: 500; padding: 8px 20px; font-size: 0.95rem;">เธเธฑเธ”เธชเนเธเธชเธณเน€เธฃเนเธ</button>
                                          ` : ''}
                                      ` : `
                                          <button class="btn-purchase" onclick="window.requestReturn('${order.id}')" 
style="border-radius: 4px; background: #fff; color: #555; border: 1px solid #ddd; padding: 8px 16px; font-size: 
0.95rem;">เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ</button>
                                          <button class="btn-purchase btn-purchase-primary" 
onclick="window.buyAgain('${order.id}')" style="border-radius: 4px; border: none; background: #ee4d2d; color: #fff; 
font-weight: 500; padding: 8px 20px; font-size: 0.95rem;">เธเธทเนเธญเธญเธตเธเธเธฃเธฑเนเธ</button>
                                      `)}
                                      <button class="btn-purchase" 
onclick="window.open('https://line.me/R/ti/p/@pao789', '_blank')" style="border-radius: 4px; background: #fff; color: 
#555; border: 1px solid #ddd; padding: 8px 16px; font-size: 0.95rem;">เธ•เธดเธ”เธ•เนเธญเธเธนเนเธเธฒเธข</button>
                                  </div>
                          </div>
                      </div>`;
                      }).join('');
                  } catch (err) {
                      console.error("Rendering error:", err);
                      container.innerHTML = `<div style="padding:20px; 
color:red;">เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเนเธชเธ”เธเธเธฅเธฃเธฒเธขเธเธฒเธฃ</div>`;
                  }
              }
  
              // Expiration Process runs during startCloudSync and loadLocalOnly
  
              // Automatic loading is now handled by startCloudSync()
  
              // Click to copy function
              window.copyTrackingNumber = function (num, el) {
                  navigator.clipboard.writeText(num).then(() => {
                      const originalColor = el.style.color;
                      const originalBg = el.style.background;
                      el.style.color = '#fff';
                      el.style.background = '#ee4d2d';
  
                      const tooltip = document.createElement('div');
                      tooltip.innerText = 'เธเธฑเธ”เธฅเธญเธเน€เธฃเธตเธขเธเธฃเนเธญเธข!';
                      tooltip.style.position = 'fixed';
                      tooltip.style.left = '50%';
                      tooltip.style.top = '100px';
                      tooltip.style.transform = 'translateX(-50%)';
                      tooltip.style.background = 'rgba(0,0,0,0.8)';
                      tooltip.style.color = '#fff';
                      tooltip.style.padding = '8px 20px';
                      tooltip.style.borderRadius = '20px';
                      tooltip.style.zIndex = '1000';
                      tooltip.style.fontSize = '0.9rem';
                      tooltip.style.pointerEvents = 'none';
                      document.body.appendChild(tooltip);
  
                      setTimeout(() => {
                          el.style.color = originalColor;
                          el.style.background = originalBg;
                          tooltip.style.opacity = '0';
                          tooltip.style.transition = 'opacity 0.5s ease';
                          setTimeout(() => tooltip.remove(), 500);
                      }, 1500);
                  });
              };
  
              // Search event
              const searchInputEl = document.getElementById('orderSearchInput');
              if (searchInputEl) {
                  searchInputEl.addEventListener('input', function () {
                      const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                      renderOrders(ordersData, activeTab);
                  });
              }
  
              // Tab events
              document.querySelectorAll('.order-tab').forEach(tab => {
                  tab.addEventListener('click', function () {
                      document.querySelectorAll('.order-tab').forEach(t => t.classList.remove('active'));
                      this.classList.add('active');
                      // Removed logic that overwrote ordersData status from localStorage
                      renderOrders(ordersData, this.dataset.filter);
                  });
              });
  
              // Listen for localStorage changes from seller dashboard (cross-tab)
              window.addEventListener('storage', function (e) {
                  if (e.key === getOrdersKey() || e.key === 'pao_global_orders') {
                      const freshOrders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
                      if (freshOrders.length > 0) {
                          freshOrders.forEach(fo => {
                              const idx = ordersData.findIndex(o => o.id === fo.id);
                              if (idx > -1) ordersData[idx] = fo;
                          });
                          const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                          renderOrders(ordersData, activeTab);
                      }
                  }
              });
  
              setInterval(function () {
                  let changed = false;
  
                  // 1. Check expiration continuously in the background
                  if (ordersData && ordersData.length > 0) {
                      const oldStatusStr = JSON.stringify(ordersData.map(o => o.status));
                      ordersData = processExpirations(ordersData);
                      const newStatusStr = JSON.stringify(ordersData.map(o => o.status));
  
                      if (oldStatusStr !== newStatusStr) {
                          changed = true;
                      }
                  }
  
                  if (changed) {
                      const activeTab = document.querySelector('.order-tab.active')?.dataset.filter || 'all';
                      renderOrders(ordersData, activeTab);
                  }
              }, 3000);
  
  
              window.buyAgain = function (orderId) {
                  const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                  const currentOrders = JSON.parse(rawOrders);
                  let order = currentOrders.find(o => o.id === orderId);
  
                  // Fallback to mock data check if not found in real orders
                  if (!order) {
                      order = mockData.find(o => o.id === orderId);
                  }
  
                  if (!order) {
                      alert('เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” 
เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธณเธชเธฑเนเธเธเธทเนเธญ');
                      return;
                  }
  
                  const cartKey = 'pao_cart_' + getActiveUserId();
                  let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
  
                  order.items.forEach(item => {
                      const idx = cart.findIndex(i => i.name === item.name && i.variation === item.variation);
                      if (idx >= 0) {
                          cart[idx].qty += item.qty;
                          cart[idx].selected = true;
                      } else {
                          cart.push({
                              id: item.name, // Use name as ID roughly
                              name: item.name,
                              price: item.price,
                              qty: item.qty,
                              img: item.img,
                              variation: item.variation || '',
                              selected: true
                          });
                      }
                  });
  
                  localStorage.setItem(cartKey, JSON.stringify(cart));
                  window.location.href = 'cart.html';
              };
  
              // Dropdown Toggle
              window.toggleDropdown = function (orderId, event) {
                  event.stopPropagation();
                  const dropdown = document.getElementById('dropdown-' + orderId);
                  if (dropdown) {
                      const isVisible = dropdown.style.display === 'block';
                      document.querySelectorAll('.more-dropdown').forEach(el => el.style.display = 'none');
                      dropdown.style.display = isVisible ? 'none' : 'block';
                  }
              };
  
              // Breakdown Toggle
              // Breakdown Toggle
              window.toggleBreakdown = function(orderId) {
                  const breakdown = document.getElementById('breakdown-' + orderId);
                  const chevron = document.getElementById('chevron-' + orderId);
                  if (breakdown) {
                      const isVisible = breakdown.style.display !== 'none';
                      if (isVisible) {
                          breakdown.style.display = 'none';
                          if (chevron) chevron.style.transform = 'rotate(0deg)';
                      } else {
                          breakdown.style.display = 'flex';
                          if (chevron) chevron.style.transform = 'rotate(180deg)';
                      }
                  }
              };
  
              document.addEventListener('click', function (e) {
                  document.querySelectorAll('.more-dropdown').forEach(el => el.style.display = 'none');
              });
  
              // Cancel Order Logic
              let currentCancelOrderId = null;
  
              window.enableCancelConfirmBtn = function () {
                  const btn = document.getElementById('btnConfirmCancel');
                  if (btn) btn.disabled = false;
              };
  
              window.cancelOrderUser = function (orderId) {
                  currentCancelOrderId = orderId;
                  const overlay = document.getElementById('cancelModalOverlay');
                  const modal = document.getElementById('cancelModal');
                  const btnConfirm = document.getElementById('btnConfirmCancel');
  
                  if (overlay && modal) {
                      overlay.style.display = 'block';
                      modal.style.display = 'block';
                  }
                  if (btnConfirm) btnConfirm.disabled = true;
  
                  document.querySelectorAll('input[name="cancelReason"]').forEach(el => el.checked = false);
              };
  
              window.closeCancelModal = function () {
                  const overlay = document.getElementById('cancelModalOverlay');
                  const modal = document.getElementById('cancelModal');
                  if (overlay) overlay.style.display = 'none';
                  if (modal) modal.style.display = 'none';
                  currentCancelOrderId = null;
              };
  
              window.executeCancelOrder = function () {
                  if (!currentCancelOrderId) return;
  
                  const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                  let currentOrders = JSON.parse(rawOrders);
                  let order = currentOrders.find(o => o.id === currentCancelOrderId);
  
                  if (order) {
                      order.status = 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง';
                      // Optional: You could save the selected reason to the order object here:
                      // const selectedReason = document.querySelector('input[name="cancelReason"]:checked')?.value;
                      // order.cancelReason = selectedReason;
  
                      localStorage.setItem(getOrdersKey(), JSON.stringify(currentOrders));
                      // Global sync
                      try {
                          let globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                          let go = globalOrders.find(o => o.id === currentCancelOrderId);
                          if (go) {
                              go.status = 'เธขเธเน€เธฅเธดเธเนเธฅเนเธง';
                              localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
                          }
                      } catch (e) { }
  
                      renderOrders(currentOrders, document.querySelector('.order-tab.active')?.dataset.filter || 
'all');
                  }
  
                  closeCancelModal();
              };
  
              // โ… Mark Order as Completed (Success)
              let currentSuccessOrderId = null;
  
              window.markAsCompletedUser = function (orderId) {
                  currentSuccessOrderId = orderId;
                  const overlay = document.getElementById('scModalOverlay');
                  const modal = document.getElementById('scModal');
                  if (overlay && modal) {
                      overlay.style.display = 'block';
                      setTimeout(() => {
                          modal.classList.add('show');
                      }, 10);
                  }
              };
  
              window.closeSuccessModal = function () {
                  const overlay = document.getElementById('scModalOverlay');
                  const modal = document.getElementById('scModal');
                  if (modal) modal.classList.remove('show');
                  setTimeout(() => {
                      if (overlay) overlay.style.display = 'none';
                      currentSuccessOrderId = null;
                  }, 300);
              };
  
              window.confirmSuccessOrder = function () {
                  if (!currentSuccessOrderId) return;
                  const orderId = currentSuccessOrderId.trim();
                  
                  try {
                      const updateObj = { status: 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง' };
                      
                      // 1. Firebase Sync
                      if (typeof db !== 'undefined' && db.collection) {
                          db.collection('orders').doc(orderId).update(updateObj)
                              .then(() => console.log("[Cloud] Status updated to Completed:", orderId))
                              .catch(err => console.error("[Cloud Error] Failed to update status:", err));
                      }
                      
                      // 2. Local Storage Sync (Primary User Orders)
                      const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                      let currentOrders = JSON.parse(rawOrders);
                      let foundLocal = false;
                      currentOrders.forEach(o => {
                          if (o.id && o.id.trim() === orderId) {
                              o.status = 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง';
                              foundLocal = true;
                          }
                      });
  
                      if (!foundLocal) {
                          // Capture the order from in-memory data if it wasn't in local storage yet
                          const orderFromMem = ordersData.find(o => o.id && o.id.trim() === orderId);
                          if (orderFromMem) {
                              const newLocalOrder = { ...orderFromMem, status: 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง' };
                              currentOrders.push(newLocalOrder);
                              foundLocal = true;
                          }
                      }
  
                      if (foundLocal) {
                          localStorage.setItem(getOrdersKey(), JSON.stringify(currentOrders));
                      }
                      
                      // 3. Global Sync Fallback (pao_global_orders)
                      try {
                          let globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                          let foundGlobal = false;
                          globalOrders.forEach(go => {
                              if (go.id && go.id.trim() === orderId) {
                                  go.status = 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง';
                                  foundGlobal = true;
                              }
                          });
                          if (foundGlobal) {
                              localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
                          }
                      } catch (e) { }
  
                      // 4. Update In-Memory Data and UI
                      const idx = ordersData.findIndex(o => o.id && o.id.trim() === orderId);
                      if (idx > -1) {
                          ordersData[idx].status = 'เธชเธณเน€เธฃเนเธเนเธฅเนเธง';
                      }
                      
                      // Force switch to "Completed" tab
                      document.querySelectorAll('.order-tab').forEach(t => {
                          if (t.dataset.filter === 'completed') {
                              t.classList.add('active');
                          } else {
                              t.classList.remove('active');
                          }
                      });
                      
                      // Update badges and render
                      updateTabCounts(ordersData);
                      renderOrders(ordersData, 'completed');
                      
                      // โ… Notify other tabs (Seller Centre) to refresh immediately
                      try {
                          const bc = new BroadcastChannel('pao_order_sync');
                          bc.postMessage({ type: 'REFRESH_ORDERS', orderId: orderId });
                      } catch (e) { }
  
                      closeSuccessModal();
                      
                  } catch (e) {
                      console.error("Critical: confirmSuccessOrder failed:", e);
                      // Fallback: simple refresh if everything fails
                      closeSuccessModal();
                      setTimeout(() => window.location.reload(), 500);
                  }
              };
  
              // Change Payment Logic
              let currentChangePaymentOrderId = null;
              let newlySelectedPayment = 'QR เธเธฃเนเธญเธกเน€เธเธขเน';
  
              window.goToPayment = function (order) {
                  if (!order || !order.id) return;
                  const pm = (order.paymentMethod || order.method || '').toLowerCase();
                  const pb = (order.paymentBank || '').toLowerCase();
                  const combined = pm + ' ' + pb;
                  const total = order.total || 0;
                  const ref = order.id;
  
                  // Check if it's a bank transfer
                  const isTransfer = combined.includes('เนเธญเธ') ||
                      combined.includes('bank') ||
                      combined.includes('transfer') ||
                      combined.includes('เนเธ—เธขเธเธฒเธ“เธดเธเธขเน') ||
                      combined.includes('scb') ||
                      combined.includes('เธเธชเธดเธเธฃ') ||
                      combined.includes('kbank');
  
                  if (isTransfer) {
                      let bank = 'scb';
                      if (combined.includes('เธเธชเธดเธเธฃ') || combined.includes('kbank')) bank = 'kbank';
                      window.location.href = `payment-transfer.html?amount=${total}&ref=${ref}&bank=${bank}`;
                  } else {
                      // Default to QR for all other types of online payment
                      window.location.href = `payment-qr.html?amount=${total}&ref=${ref}`;
                  }
              };
  
              window.changePaymentUser = function (id, currentMethod) {
                  currentChangePaymentOrderId = id;
                  const overlay = document.getElementById('paymentModalOverlay');
                  const modal = document.getElementById('paymentModal');
                  if (overlay && modal) {
                      overlay.style.display = 'block';
                      modal.style.display = 'block';
                      // We need to find the correct label for selection if it's a bank transfer
                      let initialSelection = currentMethod || 'QR เธเธฃเนเธญเธกเน€เธเธขเน';
  
                      // If current storage says "เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ" we need to 
check which bank to highlight
                      if (initialSelection === 'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ') {
                          const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                          const currentOrders = JSON.parse(rawOrders);
                          const order = currentOrders.find(o => o.id === id);
                          if (order && order.paymentBank) {
                              if (order.paymentBank.toLowerCase() === 'scb') initialSelection = 
'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ (เนเธ—เธขเธเธฒเธ“เธดเธเธขเน)';
                              else if (order.paymentBank.toLowerCase() === 'kbank') initialSelection = 
'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ (เธเธชเธดเธเธฃเนเธ—เธข)';
                          }
                      }
  
                      selectChangePayment(initialSelection);
                  }
                  // Close dropdown
                  document.querySelectorAll('.more-dropdown').forEach(el => el.style.display = 'none');
              };
  
              window.closePaymentModal = function () {
                  const overlay = document.getElementById('paymentModalOverlay');
                  const modal = document.getElementById('paymentModal');
                  if (overlay) overlay.style.display = 'none';
                  if (modal) modal.style.display = 'none';
                  currentChangePaymentOrderId = null;
              };
  
              window.selectChangePayment = function (method) {
                  newlySelectedPayment = method;
                  document.querySelectorAll('.pm-opt-btn').forEach(btn => {
                      // Extract text content excluding the SVG tick
                      const btnText = btn.cloneNode(true);
                      const tick = btnText.querySelector('.pm-tick');
                      if (tick) tick.remove();
  
                      if (btnText.innerText.trim() === method) {
                          btn.classList.add('active');
                      } else {
                          btn.classList.remove('active');
                      }
                  });
                  document.getElementById('selectedPaymentText').innerText = method;
              };
  
              window.executeChangePayment = function () {
                  if (!currentChangePaymentOrderId) return;
  
                  const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                  let currentOrders = JSON.parse(rawOrders);
                  let order = currentOrders.find(o => o.id === currentChangePaymentOrderId);
  
                  if (order) {
                      order.paymentMethod = newlySelectedPayment;
  
                      if (newlySelectedPayment.includes('เนเธ—เธขเธเธฒเธ“เธดเธเธขเน')) {
                          order.paymentMethod = 'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ';
                          order.paymentBank = 'SCB';
                      } else if (newlySelectedPayment.includes('เธเธชเธดเธเธฃ')) {
                          order.paymentMethod = 'เนเธญเธเน€เธเธดเธเธเนเธฒเธเธเธเธฒเธเธฒเธฃ';
                          order.paymentBank = 'KBank';
                      } else if (newlySelectedPayment === 'เน€เธเนเธเน€เธเธดเธเธเธฅเธฒเธขเธ—เธฒเธ') {
                          order.status = 'เธ—เธตเนเธ•เนเธญเธเธเธฑเธ”เธชเนเธ';
                          order.paymentBank = '';
                      } else {
                          order.paymentBank = '';
                      }
  
                      // Ensure orderDate is preserved (counting from original creation)
                      // It is already preserved as we are not modifying it.
  
                      localStorage.setItem(getOrdersKey(), JSON.stringify(currentOrders));
  
                      // Global sync
                      try {
                          let globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                          let go = globalOrders.find(o => o.id === currentChangePaymentOrderId);
                          if (go) {
                              go.paymentMethod = order.paymentMethod;
                              go.paymentBank = order.paymentBank;
                              if (order.status) go.status = order.status;
                              localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
                          }
                      } catch (e) { }
  
                      renderOrders(currentOrders, document.querySelector('.order-tab.active')?.dataset.filter || 
'all');
                  }
                  closePaymentModal();
              };
              // Slip Lightbox Functions
              window.viewSlipLightbox = function (url) {
                  const lightbox = document.getElementById('slipLightbox');
                  const img = document.getElementById('lightboxImg');
                  if (lightbox && img) {
                      img.src = url;
                      lightbox.classList.add('show');
                      document.body.style.overflow = 'hidden'; // Prevent scroll
                  }
              };
  
              window.closeSlipLightbox = function () {
                  const lightbox = document.getElementById('slipLightbox');
                  if (lightbox) {
                      lightbox.classList.remove('show');
                      document.body.style.overflow = ''; // Restore scroll
                  }
              };
  
              window.buyAgain = function (orderId) {
                  const order = ordersData.find(o => o.id === orderId);
                  if (order && order.items && window.CartAPI) {
                      order.items.forEach(item => {
                          window.CartAPI.add(item);
                      });
                      setTimeout(() => {
                          if (window.CartUI) window.CartUI.open();
                          else 
alert('เน€เธเธดเนเธกเธชเธดเธเธเนเธฒเธฅเธเธ•เธฐเธเธฃเนเธฒเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเธฃเธฑเธ!');
                      }, 100);
                  } else {
                      alert('เนเธกเนเธชเธฒเธกเธฒเธฃเธ–เธ—เธณเธฃเธฒเธขเธเธฒเธฃเนเธ”เนเนเธเธเธ“เธฐเธเธตเน 
เธเธฃเธธเธ“เธฒเธฅเธญเธเนเธซเธกเนเธญเธตเธเธเธฃเธฑเนเธเธเธฃเธฑเธ');
                  }
              };
  
              window.requestReturn = function (orderId) {
                  currentReturnOrderId = orderId;
                  const overlay = document.getElementById('returnModalOverlay');
                  const modal = document.getElementById('returnModal');
                  if (overlay && modal) {
                      overlay.style.display = 'block';
                      setTimeout(() => modal.classList.add('show'), 10);
                  }
              };
  
              window.closeReturnModal = function () {
                  const overlay = document.getElementById('returnModalOverlay');
                  const modal = document.getElementById('returnModal');
                  if (modal) modal.classList.remove('show');
                  setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 300);
                  currentReturnOrderId = null;
              };
  
              window.executeReturnOrder = function (reasonTitle) {
                  if (!currentReturnOrderId) return;
                  const orderId = currentReturnOrderId.trim();
                  
                  try {
                      const updateObj = { 
                          status: 'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ',
                          returnReason: reasonTitle,
                          returnDate: new Date().toISOString()
                      };
                      
                      // 1. Firebase Sync
                      if (typeof db !== 'undefined' && db.collection) {
                          db.collection('orders').doc(orderId).update(updateObj)
                              .catch(err => console.error("[Cloud Error] Refund update failed:", err));
                      }
                      
                      // 2. Local Storage Sync
                      const rawOrders = localStorage.getItem(getOrdersKey()) || '[]';
                      let currentOrders = JSON.parse(rawOrders);
                      let foundLocal = false;
                      currentOrders.forEach(o => {
                          if (o.id && o.id.trim() === orderId) {
                              o.status = 'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ';
                              o.returnReason = reasonTitle;
                              foundLocal = true;
                          }
                      });
                      if (foundLocal) localStorage.setItem(getOrdersKey(), JSON.stringify(currentOrders));
                      
                      // 3. Global Sync Fallback
                      try {
                          let globalOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                          globalOrders.forEach(go => {
                              if (go.id && go.id.trim() === orderId) {
                                  go.status = 'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ';
                                  go.returnReason = reasonTitle;
                              }
                          });
                          localStorage.setItem('pao_global_orders', JSON.stringify(globalOrders));
                      } catch (e) { }
  
                      // 4. UI Update
                      const idx = ordersData.findIndex(o => o.id && o.id.trim() === orderId);
                      if (idx > -1) {
                          ordersData[idx].status = 'เธเธทเธเน€เธเธดเธ/เธเธทเธเธชเธดเธเธเนเธฒ';
                          ordersData[idx].returnReason = reasonTitle;
                      }
                      
                      // Force switch to "Return" tab
                      document.querySelectorAll('.order-tab').forEach(t => {
                          if (t.dataset.filter === 'return') t.classList.add('active');
                          else t.classList.remove('active');
                      });
                      
                      updateTabCounts(ordersData);
                      renderOrders(ordersData, 'return');
                      
                      // โ… Notify other tabs (Seller Centre) to refresh immediately
                      try {
                          const bc = new BroadcastChannel('pao_order_sync');
                          bc.postMessage({ type: 'REFRESH_ORDERS', orderId: orderId });
                      } catch (e) { }
  
                      closeReturnModal();
                      
                  } catch (e) {
                      console.error("Return execution failed:", e);
                      closeReturnModal();
                  }
              };
  
              let currentReturnOrderId = null;
          })();
      </script>
  
      <!-- Success Confirmation Modal -->
      <div class="sc-modal-overlay" id="scModalOverlay" onclick="closeSuccessModal()"></div>
      <div class="sc-modal" id="scModal">
          <div class="sc-icon-wrapper">๐“ฆ</div>
          <h3 class="sc-title">เธขเธทเธเธขเธฑเธเธเธฒเธฃเธฃเธฑเธเธชเธดเธเธเนเธฒ</h3>
          <p class="sc-desc">เธเธธเธ“เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเนเธฅเธฐเธ•เธฃเธงเธเธชเธญเธเธเธฑเธชเธ”เธธ
เน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเนเธเนเนเธซเธกเธเธฑเธ?</p>
          <div class="sc-actions">
              <button class="btn-sc-confirm" 
onclick="confirmSuccessOrder()">เธขเธทเธเธขเธฑเธเธงเนเธฒเนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเนเธฅเนเธง</button>
              <button class="btn-sc-cancel" onclick="closeSuccessModal()">เธขเธเน€เธฅเธดเธ</button>
          </div>
      </div>
  
      <!-- Return Reason Modal -->
      <div class="sc-modal-overlay" id="returnModalOverlay" onclick="closeReturnModal()"></div>
      <div class="sc-modal" id="returnModal" style="max-width: 500px; padding: 0; overflow: hidden;">
          <div style="padding: 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; 
align-items: center; background: #fff; position: sticky; top: 0; z-index: 10;">
              <h3 style="margin: 0; font-size: 1.1rem; font-weight: 
600;">เน€เธฅเธทเธญเธเน€เธซเธ•เธธเธเธฅเธเธฒเธฃเธเธทเธเธชเธดเธเธเนเธฒ</h3>
              <span onclick="closeReturnModal()" style="cursor: pointer; font-size: 1.5rem; color: #999; line-height: 
1;">&times;</span>
          </div>
          <div class="return-modal-list">
              <div class="return-option" 
onclick="executeReturnOrder('เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเธ—เธตเนเธกเธตเธเธงเธฒเธกเน€เธชเธตเธขเธซเธฒเธข 
เธซเธฃเธทเธญเธชเธเธฒเธเนเธกเนเธ”เธต')">
                  <div class="return-icon">๐ฉน</div>
                  <div class="return-text">
                      <div 
class="return-title">เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเธ—เธตเนเธกเธตเธเธงเธฒเธกเน€เธชเธตเธขเธซเธฒเธข 
เธซเธฃเธทเธญเธชเธเธฒเธเนเธกเนเธ”เธต</div>
                      <div 
class="return-desc">เธชเธดเธเธเนเธฒเธ—เธตเนเนเธ”เนเธฃเธฑเธเธกเธตเธฃเนเธญเธเธฃเธญเธขเธเธตเธ”เธเนเธงเธ 
เนเธ•เธเธซเธฑเธ เธฃเธฑเนเธง/เธซเธ เธซเธฃเธทเธญเธเธฒเธฃเธ—เธณเธเธฒเธเนเธกเนเธชเธกเธเธนเธฃเธ“เน 
เธซเธฃเธทเธญเธชเธดเธเธเนเธฒเธซเธกเธ”เธญเธฒเธขเธธ</div>
                  </div>
                  <div class="return-arrow">โ€บ</div>
              </div>
              <div class="return-option" 
onclick="executeReturnOrder('เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเธกเธฒเธเธดเธ” 
เธซเธฃเธทเธญเนเธกเนเนเธเนเธชเธดเธเธเนเธฒเธ—เธตเนเธชเธฑเนเธ')">
                  <div class="return-icon">๐ซ</div>
                  <div class="return-text">
                      <div class="return-title">เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเธกเธฒเธเธดเธ” 
เธซเธฃเธทเธญเนเธกเนเนเธเนเธชเธดเธเธเนเธฒเธ—เธตเนเธชเธฑเนเธ</div>
                      <div class="return-desc">เธชเธดเธเธเนเธฒเธ—เธตเนเนเธ”เนเธฃเธฑเธเธกเธฒเนเธกเนเนเธเนเธช
เธดเธเธเนเธฒเธ—เธตเนเธชเธฑเนเธ / เธกเธตเธเธงเธฒเธกเนเธ•เธเธ•เนเธฒเธเธเธฒเธเธฃเธฒเธขเธฅเธฐเน€เธญเธตเธขเธ” 
/ เธเธดเธ”เธฅเธดเธเธชเธดเธ—เธเธดเน</div>
                  </div>
                  <div class="return-arrow">โ€บ</div>
              </div>
              <div class="return-option" 
onclick="executeReturnOrder('เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเนเธกเนเธเธฃเธ 
เธซเธฃเธทเธญเธขเธฑเธเนเธกเนเนเธ”เนเธฃเธฑเธเธเธฑเธชเธ”เธธ')">
                  <div class="return-icon">๐“ฆ</div>
                  <div class="return-text">
                      <div class="return-title">เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเนเธกเนเธเธฃเธ 
เธซเธฃเธทเธญเธขเธฑเธเนเธกเนเนเธ”เนเธฃเธฑเธเธเธฑเธชเธ”เธธ</div>
                      <div class="return-desc">เนเธ”เนเธฃเธฑเธเธชเธดเธเธเนเธฒเนเธกเนเธเธฃเธเธ•เธฒเธกเธเธณเธ
เธงเธเธ—เธตเนเธชเธฑเนเธ / เธกเธตเธเธดเนเธเธชเนเธงเธเธเธฒเธเธเธดเนเธเธซเธฒเธขเนเธ / 
เนเธ”เนเธฃเธฑเธเธเธฅเนเธญเธเน€เธเธฅเนเธฒ</div>
                  </div>
                  <div class="return-arrow">โ€บ</div>
              </div>
              <div class="return-option" onclick="executeReturnOrder('เธญเธทเนเธเน')">
                  <div class="return-icon">โ๏ธ</div>
                  <div class="return-text">
                      <div class="return-title">เธญเธทเนเธเน</div>
                  </div>
                  <div class="return-arrow">โ€บ</div>
              </div>
          </div>
      </div>
  <script src="premium-alerts.js"></script>
  </body>
  
  </html>


