const getActiveUserId = () => { try { const u = JSON.parse(localStorage.getItem('paomobile_user')); return u ? (u.uid || u.phone || 'default') : 'guest'; } catch { return 'guest'; } };
console.log("[v1.2.1] Checkout script loading...");

const getAddressKey = () => 'pao_user_addresses_' + getActiveUserId();
const getCartKey = () => 'pao_cart_' + getActiveUserId();

        let userAddresses = JSON.parse(localStorage.getItem(getAddressKey()) || '[]');
        let savedAddress = userAddresses.find(a => a.isDefault) || userAddresses[0] || null;
        let cartItems = [];
        let shippingCost = 0;
        let locState = { province:'', amphoe:'', district:'', zip:'' };
        let currentLocTab = 'province';
        let editingAddressIndex = -1;

        // --- Google Maps JS API Setup ---
        let gmFullMap, gmMiniMap, gmGeocoder;
        
        function initGoogleMaps() {
            if(!window.google) return;
            const defaultPos = { lat: 13.7563, lng: 100.5018 }; // Bangkok
            gmGeocoder = new google.maps.Geocoder();
            
            gmFullMap = new google.maps.Map(document.getElementById('fullMapGoogle'), {
                center: defaultPos,
                zoom: 17,
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'greedy'
            });
            
            gmFullMap.addListener('dragend', () => {
                if(!gmGeocoder) return;
                const pos = gmFullMap.getCenter();
                gmGeocoder.geocode({ location: pos }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const addrText = document.getElementById('mapModalAddressText');
                        if(addrText) addrText.textContent = results[0].formatted_address;
                    }
                });
            });
        }

        function updateGoogleMapsForAddress(text) {
            if(gmGeocoder && gmFullMap) {
                gmGeocoder.geocode({ address: text + " ประเทศไทย" }, (results, status) => {
                    if(status === 'OK' && results[0]) {
                        gmFullMap.setCenter(results[0].geometry.location);
                        const mapModalText = document.getElementById('mapModalAddressText');
                        if(mapModalText) mapModalText.textContent = results[0].formatted_address;
                    }
                });
            } else {
                // Fallback text if Map API fails
                const mapModalText = document.getElementById('mapModalAddressText');
                if(mapModalText) mapModalText.textContent = text;
            }
        }
        
        function confirmMapLocation() {
            const mapModalText = document.getElementById('mapModalAddressText');
            if(mapModalText && mapModalText.textContent !== 'คุณยังไม่ได้เลือกแผนที่') {
                const newAddr = mapModalText.textContent;
                const fAddr1 = document.getElementById('f-addr1');
                if(fAddr1) fAddr1.value = newAddr;
                updateGoogleMapsForAddress(newAddr);
            }
            closeFullMap();
        }
        // ---------------------------------

        function loadCart() {
            try {
                const raw = localStorage.getItem(getCartKey()) || '[]';
                const all = JSON.parse(raw);
                cartItems = all.filter(i => i.selected !== false);
            } catch(e) { cartItems = []; }
        }

        function renderCheckoutItems() {
            const list = document.getElementById('checkoutItemsList');
            if (!list) return;
            if (cartItems.length === 0) {
                list.innerHTML = '<div style="padding:40px; text-align:center; color: #757575;">ไม่มีสินค้าที่เลือกสั่งซื้อ</div>';
                return;
            }
            list.innerHTML = cartItems.map(item => `
                <div class="co-item-row">
                    <div class="co-item-main">
                        <img src="${item.img || 'logo.png'}" class="co-item-img" onerror="this.src='logo.png'">
                        <div class="co-item-info">
                            <div class="co-item-name">${item.name}</div>
                            <div class="co-item-variation">${item.variation || ''}</div>
                        </div>
                    </div>
                    <div class="co-item-price" data-label="ราคาต่อชิ้น">฿${item.price.toLocaleString()}</div>
                    <div class="co-item-qty" data-label="จำนวน">${item.qty}</div>
                    <div class="co-item-subtotal" data-label="ราคารวม">฿${(item.price * item.qty).toLocaleString()}</div>
                </div>
            `).join('');
        }

        function updateTotals() {
            const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const total = subtotal + shippingCost;
            const count = cartItems.reduce((s, i) => s + i.qty, 0);

            // Update UI
            document.getElementById('itemCount').textContent = count;
            document.getElementById('sectionTotal').textContent = '฿' + (subtotal + shippingCost).toLocaleString();
            document.getElementById('s-subtotal').textContent = '฿' + subtotal.toLocaleString();
            document.getElementById('s-shipping').textContent = '฿' + shippingCost.toLocaleString();
            document.getElementById('s-total').textContent = '฿' + total.toLocaleString();
        }

        function updateShipping(el) {
            shippingCost = parseInt(el.value) || 0;
            // Update selected class
            document.querySelectorAll('.inline-ship-opt').forEach(opt => opt.classList.remove('selected'));
            el.closest('.inline-ship-opt').classList.add('selected');
            updateTotals();
        }

        function selectPayment(btn, methodLabel) {
            document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            const method = btn.dataset.method;
            document.querySelectorAll('.pay-detail').forEach(d => d.classList.add('hidden'));
            const target = document.getElementById('detail-' + method);
            if (target) target.classList.remove('hidden');
        }

        const getOrdersKey = () => 'pao_orders_' + getActiveUserId();

        function confirmOrder() {
            if (!savedAddress) {
                alert('กรุณาเพิ่มหรือเลือกที่อยู่จัดส่ง');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const activeTab = document.querySelector('.pay-tab.active');
            const method = activeTab ? activeTab.dataset.method : 'transfer';
            const methodLabel = activeTab ? activeTab.textContent.trim() : 'โอนเงินธนาคาร';

            // initial status
            let orderStatus = 'ที่ต้องชำระ';
            if (method === 'cod') {
                orderStatus = 'ที่ต้องจัดส่ง';
            }

            // Create Order Object
            const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const total = subtotal + shippingCost;
            const orderId = 'PAO-' + Date.now().toString(36).toUpperCase().slice(-8);
            
            const newOrder = {
                id: orderId,
                orderDate: new Date().toISOString(),
                status: orderStatus,
                items: cartItems.map(i => ({
                    name: i.name,
                    price: i.price,
                    qty: i.qty,
                    img: i.img || 'logo.png'
                })),
                total: total,
                method: methodLabel
            };

            // Use Direct Cloud Sync Logic (Simple & Robust)
            const syncToCloud = async (data) => {
                const firestoreDB = (typeof db !== 'undefined') ? db : (window.firebase ? firebase.firestore() : null);
                if (!firestoreDB) {
                    console.error("[v1.2.4] Firestore not found");
                    return false;
                }
                try {
                    console.log("[v1.2.4] Sending to Cloud:", data.id);
                    await firestoreDB.collection('orders').doc(data.id).set(data);
                    console.log("[v1.2.4] Cloud Sync Success");
                    return true;
                } catch (err) {
                    console.error("[v1.2.4] Cloud Sync Error:", err);
                    alert("⚠️ คำเตือน: ออเดอร์บันทึกสำเร็จแต่ส่งเข้า Cloud ไม่ได้ (Error: " + err.code + ")");
                    return false;
                }
            };

            const finalizeOrder = async () => {
                // Change button to processing
                const confirmBtn = document.getElementById('confirmOrderBtn');
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = '🕒 กำลังสั่งซื้อ...';
                }

                try {
                    // 1. Prepare Data
                    const globalOrderData = {
                        ...newOrder,
                        customer: getActiveUserId(),
                        customerName: savedAddress ? savedAddress.name : 'N/A',
                        customerPhone: savedAddress ? savedAddress.phone : 'N/A',
                        customerAddress: savedAddress ? `${savedAddress.addr1} ตำบล${savedAddress.district} อำเภอ${savedAddress.amphoe} จังหวัด${savedAddress.province} ${savedAddress.zip}` : 'N/A',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // 2. Save Locally (Immediate)
                    const existingOrders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
                    existingOrders.unshift(newOrder);
                    localStorage.setItem(getOrdersKey(), JSON.stringify(existingOrders));

                    const allOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                    allOrders.unshift(globalOrderData);
                    localStorage.setItem('pao_global_orders', JSON.stringify(allOrders));

                    // 3. Save to Cloud (MUST WAIT)
                    await syncToCloud(globalOrderData);

                    // 4. Clear Cart
                    const rawCart = localStorage.getItem(getCartKey()) || '[]';
                    const fullCart = JSON.parse(rawCart);
                    const remainingCart = fullCart.filter(i => i.selected === false);
                    localStorage.setItem(getCartKey(), JSON.stringify(remainingCart));

                    // 5. Redirect based on method
                    if (method === 'promptpay') {
                        window.location.href = 'payment-qr.html?amount=' + total + '&ref=' + orderId;
                    } else if (method === 'transfer') {
                        window.location.href = 'payment-transfer.html?amount=' + total + '&ref=' + orderId;
                    } else {
                        alert('ขอบคุณที่สั่งซื้อสินค้า! (v1.2.4)\nรายการถูกส่งเข้าสู่ระบบ Seller Centre เรียบร้อยแล้วคับ');
                        window.location.href = 'purchases.html';
                    }
                } catch (e) {
                    console.error("Order process failed:", e);
                    alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ กรุณาลองใหม่อีกครั้ง');
                    if (confirmBtn) {
                        confirmBtn.disabled = false;
                        confirmBtn.innerHTML = 'สั่งสินค้า';
                    }
                }
            };

            finalizeOrder();
        }

        let addressLookup = {};

        function normalize(str) {
          if (!str) return '';
          return str.toString().trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
        }

        function initAddressLookup() {
          if (typeof thaiAddressData !== 'undefined') {
            thaiAddressData.forEach(p => {
              addressLookup[normalize(p.name_th)] = p;
            });
          }
        }
        function toggleLocationPicker() {
          const panel = document.getElementById('locationPickerPanel');
          const trigger = document.getElementById('locationPickerTrigger');
          if (!panel || !trigger) return;
          const isOpen = panel.style.display !== 'none';
          if (isOpen) { closeLocationPicker(); }
          else {
            panel.style.display = 'block';
            trigger.style.borderColor = '#ee4d2d';
            trigger.style.borderBottomLeftRadius = '0';
            trigger.style.borderBottomRightRadius = '0';
            switchLocTab('province');
            setTimeout(() => { const si = document.getElementById('locationSearchInput'); if(si) si.focus(); }, 50);
          }
        }

        function closeLocationPicker() {
          const panel = document.getElementById('locationPickerPanel');
          const trigger = document.getElementById('locationPickerTrigger');
          if (panel) panel.style.display = 'none';
          if (trigger) { trigger.style.borderColor = '#e2e8f0'; trigger.style.borderRadius = '2px'; }
        }

        function switchLocTab(tab) {
          currentLocTab = tab;
          ['province','amphoe','district','zip'].forEach(t => {
            const el = document.getElementById('tab-' + t);
            if (!el) return;
            el.style.color = '#757575';
            el.style.borderBottom = 'none';
            el.style.fontWeight = 'normal';
          });
          const active = document.getElementById('tab-' + tab);
          if (active) {
            active.style.color = '#ee4d2d';
            active.style.borderBottom = '2px solid #ee4d2d';
            active.style.marginBottom = '-2px';
            active.style.fontWeight = '500';
          }
          const si = document.getElementById('locationSearchInput');
          if (si) {
            si.value = '';
            setTimeout(() => si.focus(), 50);
          }
          const list = document.getElementById('locationList');
          if (list) list.scrollTop = 0;
          renderLocList();
        }

        function filterLocationList() { renderLocList(); }

        function renderLocList() {
          const searchEl = document.getElementById('locationSearchInput');
          const q = searchEl ? searchEl.value.toLowerCase() : '';
          const list = document.getElementById('locationList');
          if (thaiAddressData.length === 0) {
            list.innerHTML = '<div style="padding:20px;text-align:center;color:#aaa;">กำลังโหลดข้อมูล...</div>';
            return;
          }

          let items = [];
          if (currentLocTab === 'province') {
            items = thaiAddressData.map(p => p.name_th);
          } else if (currentLocTab === 'amphoe') {
            const prov = addressLookup[normalize(locState.province)];
            items = prov ? prov.districts.map(d => d.name_th) : [];
          } else if (currentLocTab === 'district') {
            const prov = addressLookup[normalize(locState.province)];
            const amp = prov ? prov.districts.find(d => normalize(d.name_th) === normalize(locState.amphoe)) : null;
            items = amp ? amp.sub_districts.map(s => s.name_th) : [];
          } else if (currentLocTab === 'zip') {
            const prov = addressLookup[normalize(locState.province)];
            const amp = prov ? prov.districts.find(d => normalize(d.name_th) === normalize(locState.amphoe)) : null;
            const dist = amp ? amp.sub_districts.find(s => normalize(s.name_th) === normalize(locState.district)) : null;
            items = dist && dist.zip_code ? [dist.zip_code.toString()] : [];
          }
          const filtered = q ? items.filter(i => i.includes(q)) : items;
          if (filtered.length === 0) {
            list.innerHTML = `<div style="padding:20px;text-align:center;color:#aaa;font-size:0.9rem;">ไม่พบข้อมูล ${currentLocTab==='amphoe'?'ในจังหวัด '+locState.province : ''}</div>`;
            return;
          }
          const prefix = currentLocTab === 'province' ? 'จังหวัด' : '';
          list.innerHTML = filtered.map(item => {
            const isSelected = (
              (currentLocTab==='province' && locState.province===item) ||
              (currentLocTab==='amphoe' && locState.amphoe===item) ||
              (currentLocTab==='district' && locState.district===item) ||
              (currentLocTab==='zip' && locState.zip===item)
            );
            const color = isSelected ? '#ee4d2d' : '#333';
            const bg = isSelected ? '#fff8f7' : '#fff';
            const check = isSelected ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ee4d2d" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '';
            const safeItem = item.replace(/'/g, "\\'");
            return `<div onclick="selectLocItem(event, '${safeItem}')" style="padding:13px 16px;cursor:pointer;border-bottom:1px solid #f5f5f5;color:${color};background:${bg};display:flex;justify-content:space-between;align-items:center;">${prefix}${item}${check}</div>`;
          }).join('');
        }

        function selectLocItem(event, value) {
          if (event) event.stopPropagation();
          if (currentLocTab === 'province') {
            locState = { province: value, amphoe: '', district: '', zip: '' };
            document.getElementById('f-province').value = value;
            ['f-amphoe','f-district','f-zip'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
            const ta = document.getElementById('tab-amphoe'); if(ta) ta.disabled = false;
            const td = document.getElementById('tab-district'); if(td) td.disabled = true;
            const tz = document.getElementById('tab-zip'); if(tz) tz.disabled = true;
            switchLocTab('amphoe');
          } else if (currentLocTab === 'amphoe') {
            locState.amphoe = value; locState.district = ''; locState.zip = '';
            document.getElementById('f-amphoe').value = value;
            ['f-district','f-zip'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
            const td = document.getElementById('tab-district'); if(td) td.disabled = false;
            const tz = document.getElementById('tab-zip'); if(tz) tz.disabled = true;
            switchLocTab('district');
          } else if (currentLocTab === 'district') {
            locState.district = value; locState.zip = '';
            document.getElementById('f-district').value = value;
            const fz = document.getElementById('f-zip'); if(fz) fz.value = '';
            const tz = document.getElementById('tab-zip'); if(tz) tz.disabled = false;
            
            // Get zip code from data
            const prov = addressLookup[normalize(locState.province)];
            const amp = prov ? prov.districts.find(d => normalize(d.name_th) === normalize(locState.amphoe)) : null;
            const dist = amp ? amp.sub_districts.find(s => normalize(s.name_th) === normalize(value)) : null;
            
            if (dist && dist.zip_code) {
              const zip = dist.zip_code.toString();
              locState.zip = zip;
              const fz2 = document.getElementById('f-zip');
              if (fz2) fz2.value = zip;
              updatePickerTriggerText();
              closeLocationPicker();
              return;
            }
            switchLocTab('zip');
          } else if (currentLocTab === 'zip') {
            locState.zip = value;
            const fz = document.getElementById('f-zip'); if(fz) fz.value = value;
            updatePickerTriggerText();
            closeLocationPicker();
            return;
          }
          updatePickerTriggerText();
        }

        function updatePickerTriggerText() {
          const el = document.getElementById('locationPickerText');
          if (!el) return;
          const parts = [locState.province, locState.amphoe, locState.district, locState.zip].filter(Boolean);
          if (parts.length > 0) { el.textContent = parts.join(', '); el.style.color = '#222'; }
          else { el.textContent = 'จังหวัด, เขต/อำเภอ, แขวง/ตำบล, รหัสไปรษณีย์'; el.style.color = '#aaa'; }
        }

        document.addEventListener('click', function(e) {
          const trigger = document.getElementById('locationPickerTrigger');
          const panel = document.getElementById('locationPickerPanel');
          // If the element was removed from DOM (orphaned) during re-render, don't close
          if (!document.contains(e.target)) return;
          if (trigger && panel && !trigger.contains(e.target) && !panel.contains(e.target)) closeLocationPicker();
        });

        window.toggleLocationPicker = toggleLocationPicker;
        window.switchLocTab = switchLocTab;
        window.filterLocationList = filterLocationList;
        window.selectLocItem = selectLocItem;
        // Tag and Autocomplete logic
        function selectTagNew(btn, tag) {
            document.querySelectorAll('.tag-btn-new').forEach(b => {
                b.style.borderColor = '#e2e8f0';
                b.style.color = '#555';
            });
            btn.style.borderColor = '#ee4d2d';
            btn.style.color = '#ee4d2d';
            locState.tag = tag;
        }

        const fAddr1 = document.getElementById('f-addr1');
        if (fAddr1) {
            // Suggestion logic removed as per user request to let them type manually
        }
        
        function fillAutocomplete(text) {
            document.getElementById('f-addr1').value = text;
            document.getElementById('addrAutocomplete').style.display = 'none';

            updateGoogleMapsForAddress(text);
            
            // Try to auto-update Location Picker from smart parsed text
            const provMatch = text.match(/จังหวัด\s*([ก-๙]+)/) || text.match(/(กรุงเทพมหานคร)/);
            if (provMatch) {
               const pName = provMatch[1] || provMatch[0];
               const dMatch = text.match(/(?:อำเภอ|เขต)\s*([ก-๙]+)/);
               const sMatch = text.match(/(?:ตำบล|แขวง)\s*([ก-๙]+)/);
               const zMatch = text.match(/([0-9]{5})/);
               
               if(dMatch && sMatch) {
                   locState.province = pName;
                   locState.amphoe = dMatch[1];
                   locState.district = sMatch[1];
                   if(zMatch) locState.zip = zMatch[1];
                   updatePickerTriggerText();
               }
            }
        }

        // legacy static map funcs removed

        document.getElementById('addrModal').addEventListener('click', function(e) { if (e.target===this) closeAddrModal(); });

                function renderAddress() {
            const b = document.getElementById('addressBody');
            if (!b) return;
            if (savedAddress) {
                b.innerHTML = `
                <div class="address-display">
                    <div class="address-details" style="font-size: 0.95rem; color: #222; line-height: 1.5;">
                        <span style="font-weight: 600;">${savedAddress.name || ''}</span> &nbsp; 
                        <span style="color: #757575;">(+66) ${savedAddress.phone ? String(savedAddress.phone).replace(/^0/, '') : ''}</span><br>
                        ${savedAddress.addr1 || ''} ตำบล${savedAddress.district || ''} อำเภอ${savedAddress.amphoe || ''} จังหวัด${savedAddress.province || ''} ${savedAddress.zip || ''}
                    </div>
                </div>`;
            } else {
                b.innerHTML = '<div class="address-empty">ไม่มีที่อยู่จัดส่ง โปรดเพิ่มที่อยู่ใหม่</div>';
            }
        }

        function openAddrListModal() {
            renderAddressList();
            const m = document.getElementById('addrModal');
            if(m) m.style.display = 'flex';
            
            const list = document.getElementById('addressListView');
            const form = document.getElementById('addressFormView');
            if(list) list.style.display = 'flex';
            if(form) form.style.display = 'none';
        }

        function renderAddressList() {
            const list = document.getElementById('builtInAddressList');
            if (!list) return;
            if (!userAddresses || userAddresses.length === 0) {
                list.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">ยังไม่มีที่อยู่บันทึกไว้</div>';
                return;
            }
            list.innerHTML = userAddresses.map((a, i) => {
                const isSelected = (savedAddress === a);
                const isDef = a.isDefault ? '<span style="color: #ee4d2d; border: 1px solid #ee4d2d; padding: 1px 6px; font-size: 0.75rem; border-radius: 2px;">ค่าเริ่มต้น</span>' : '';
                return `
                <div class="address-item-row" style="padding: 20px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 16px;">
                    <div style="margin-top:2px;">
                        <input type="radio" name="sel_addr" ${isSelected ? 'checked' : ''} onclick="selectAddress(${i})" style="accent-color: #ee4d2d; transform: scale(1.3); cursor: pointer;">
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                            <div style="font-size: 1.05rem; display:flex; align-items:center; gap:8px;">
                                <strong style="color: #222;">${a.name || ''}</strong>
                                <span style="color: #757575; font-size: 0.95rem;">| (+66) ${a.phone ? String(a.phone).replace(/^0/, '') : ''}</span>
                            </div>
                            <button onclick="editAddress(${i})" style="background: none; border: none; color: #007aff; cursor: pointer; font-size: 0.95rem;">แก้ไข</button>
                        </div>
                        <div style="color: #757575; font-size: 0.95rem; line-height: 1.6;">
                            ${a.addr1 || ''}<br>
                            ตำบล${a.district || ''} อำเภอ${a.amphoe || ''} จังหวัด${a.province || ''} ${a.zip || ''}
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 8px; align-items: center;">
                            ${a.tag ? `<span style="border:1px solid #ee4d2d; color:#ee4d2d; font-size:0.75rem; padding:1px 6px; border-radius:2px;">${a.tag}</span>` : ''}
                            ${isDef}
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        function selectAddress(index) {
            savedAddress = userAddresses[index];
            renderAddress();
            closeAddrModal();
        }

        function editAddress(index) {
            editingAddressIndex = index;
            const a = userAddresses[index];
            document.getElementById('f-name').value = a.name;
            document.getElementById('f-phone').value = a.phone;
            document.getElementById('f-addr1').value = a.addr1;
            document.getElementById('f-isDefault').checked = !!a.isDefault;
            
            locState = { province: a.province, amphoe: a.amphoe, district: a.district, zip: a.zip, tag: a.tag || 'บ้าน' };
            updatePickerTriggerText();
            document.getElementById('addrFormTitle').textContent = 'แก้ไขที่อยู่';
            openAddrFormModal(index);
        }

        function saveAddress() {
            const name = document.getElementById('f-name').value.trim();
            const phone = document.getElementById('f-phone').value.trim();
            const addr1 = document.getElementById('f-addr1').value.trim();
            const prov = locState.province;
            const amp = locState.amphoe;
            const dist = locState.district;
            const zip = locState.zip;
            const isDefault = document.getElementById('f-isDefault').checked;
            
            const phoneRegex = /^0[0-9]{9}$/;
            if (!name) { alert('กรุณาระบุชื่อ-นามสกุล'); return; }
            if (!phone || !phoneRegex.test(phone)) { alert('กรุณาระบุหมายเลขโทรศัพท์ให้ถูกต้อง (10 หลัก ขึ้นต้นด้วย 0)'); return; }
            if (!prov || !amp || !dist || !zip) { 
                alert('กรุณาเลือกที่อยู่ (จังหวัด, อำเภอ, ตำบล) ให้ครบถ้วน'); 
                return; 
            }
            
            const tag = locState.tag || 'บ้าน';
            const newAddr = { name, phone, addr1, province: prov, amphoe: amp, district: dist, zip, isDefault, tag };
            
            if (isDefault) {
                userAddresses.forEach(a => a.isDefault = false);
            }
            
            if (editingAddressIndex >= 0) {
                userAddresses[editingAddressIndex] = newAddr;
                if (!savedAddress || isDefault) savedAddress = newAddr;
            } else {
                userAddresses.push(newAddr);
                if (!savedAddress || isDefault) savedAddress = newAddr;
            }
            
            localStorage.setItem(getAddressKey(), JSON.stringify(userAddresses));
            renderAddress();
            if (document.getElementById('addressListView') && !document.getElementById('addressListView').classList.contains('hidden')) {
                renderAddressList();
            }
            closeAddrFormModal();
        }

        function deleteCurrentAddress() {
            if (editingAddressIndex >= 0) {
                const m = document.getElementById('customConfirmModalOverlay');
                if(m) m.style.display = 'flex';
            }
        }

        function closeConfirmDelete() {
            const m = document.getElementById('customConfirmModalOverlay');
            if(m) m.style.display = 'none';
        }

        function executeDeleteAddress() {
            closeConfirmDelete();
            if (editingAddressIndex >= 0) {
                userAddresses.splice(editingAddressIndex, 1);
                if(savedAddress) {
                    const stillExists = userAddresses.find(a => a.name === savedAddress.name && a.phone === savedAddress.phone && a.addr1 === savedAddress.addr1);
                    if(!stillExists) {
                        savedAddress = userAddresses.find(a => a.isDefault) || userAddresses[0] || null;
                    }
                }
                localStorage.setItem(getAddressKey(), JSON.stringify(userAddresses));
                renderAddress();
                if (document.getElementById('addressListView')) {
                    renderAddressList();
                }
                closeAddrFormModal();
            }
        }


        function openAddrFormModal(id) {
            const delBtn = document.getElementById('btnDeleteAddr');
            if (id === -1 || id === undefined) {
                editingAddressIndex = -1;
                if(delBtn) delBtn.style.display = 'none';
                document.getElementById('f-name').value = '';
                document.getElementById('f-phone').value = '';
                document.getElementById('f-addr1').value = '';
                document.getElementById('f-isDefault').checked = (userAddresses.length === 0);
                locState = { province: '', amphoe: '', district: '', zip: '', tag: 'บ้าน' };
                updatePickerTriggerText();
                document.getElementById('addrFormTitle').textContent = 'เพิ่มที่อยู่ใหม่';
                
                // Reset tags to Default "บ้าน"
                const tags = document.querySelectorAll('.tag-btn-new');
                if (tags && tags.length > 0) selectTagNew(tags[0], 'บ้าน');
            } else {
                 editingAddressIndex = id;
                 if(delBtn) delBtn.style.display = 'block';
                 const a = userAddresses[id];
                 if (a && a.tag) {
                     const tags = document.querySelectorAll('.tag-btn-new');
                     tags.forEach(b => {
                         if (b.innerText.trim() === a.tag) selectTagNew(b, a.tag);
                     });
                 }
            }
            const list = document.getElementById('addressListView');
            const form = document.getElementById('addressFormView');
            if(list) list.style.display = 'none';
            if(form) form.style.display = 'flex';
        }
        
        function closeAddrFormModal() {
            const list = document.getElementById('addressListView');
            const form = document.getElementById('addressFormView');
            if(form) form.style.display = 'none';
            if(list) list.style.display = 'flex';
            editingAddressIndex = -1;
            // hide autocomplete if open
            const menu = document.getElementById('addrAutocomplete');
            if(menu) menu.style.display = 'none';
        }
        
        function closeAddrModal() {
            const m = document.getElementById('addrModal');
            if(m) m.style.display = 'none';
        }

        function openFullMap() {
            const m = document.getElementById('fullMapModalOverlay');
            if(m) m.style.display = 'flex';
            
            if(window.google && gmFullMap) {
                google.maps.event.trigger(gmFullMap, 'resize');
                const addr = document.getElementById('f-addr1').value;
                if(addr && gmGeocoder) {
                    gmGeocoder.geocode({ address: addr + " ประเทศไทย" }, (results, status) => {
                        if(status === 'OK' && results[0]) {
                            gmFullMap.setCenter(results[0].geometry.location);
                        }
                    });
                }
            }
        }
        function closeFullMap() { 
            const m = document.getElementById('fullMapModalOverlay');
            if(m) m.style.display = 'none'; 
        }
        function selectTag(btn, tag) {
            document.querySelectorAll('.tag-btn').forEach(b => { b.style.borderColor='#e2e8f0'; b.style.color='#555'; });
            btn.style.borderColor='#ee4d2d'; btn.style.color='#ee4d2d';
        }

        // init
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user is guest - force login if strictly required
            if (getActiveUserId() === 'guest') {
                alert('กรุณาเข้าสู่ระบบก่อนดำเนินการสั่งซื้อ');
                window.location.href = 'login.html?redirect=checkout.html';
                return;
            }

            loadCart();
            renderAddress();
            renderCheckoutItems();
            updateTotals();
            initAddressLookup();
        });