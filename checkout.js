const getActiveUserId = () => { try { const u = JSON.parse(localStorage.getItem('paomobile_user')); return u ? (u.uid || u.phone || 'default') : 'guest'; } catch { return 'guest'; } };
console.log("[v1.2.1] Checkout script loading...");

const getAddressKey = () => 'pao_user_addresses_' + getActiveUserId();
const getCartKey = () => 'pao_cart_' + getActiveUserId();

        let userAddresses = JSON.parse(localStorage.getItem(getAddressKey()) || '[]');
        let savedAddress = userAddresses.find(a => a.isDefault) || userAddresses[0] || null;
        let cartItems = [];
        let shippingCost = 0;
        let appliedDiscount = 0;
        let appliedVoucherCode = '';
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
                            <div class="co-item-variation">${item.variationName || ''}</div>
                        </div>
                    </div>
                    <div class="co-item-price" data-label="ราคาต่อชิ้น">฿${(item.price || 0).toLocaleString()}</div>
                    <div class="co-item-qty" data-label="จำนวน">${item.qty || 1}</div>
                    <div class="co-item-subtotal" data-label="ราคารวม">฿${((Number(String(item.price).replace(/,/g, '')) || 0) * (item.qty || 1)).toLocaleString()}</div>
                </div>
            `).join('');
        }


        function updateTotals() {
            const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
            
            // Handle Free Shipping Voucher
            let finalShipping = shippingCost;
            let finalDiscount = appliedDiscount;
            
            // Check if current voucher is a shipping type (v1.2.2)
            const merged = getMergedVouchers();
            const currentV = merged[appliedVoucherCode];
            const isShipVoucher = appliedVoucherCode === 'FREE' || appliedVoucherCode === 'FREESHIP' || (currentV && currentV.type === 'ship');
            
            if (isShipVoucher) {
                finalShipping = 0;
            }
            
            const total = subtotal + finalShipping - finalDiscount;
            const count = cartItems.reduce((s, i) => s + i.qty, 0);

            // Update UI
            const itemCountEl = document.getElementById('itemCount');
            if (itemCountEl) itemCountEl.textContent = count;
            
            const sectionTotalEl = document.getElementById('sectionTotal');
            if (sectionTotalEl) sectionTotalEl.textContent = '฿' + total.toLocaleString();
            
            const subtotalEl = document.getElementById('s-subtotal');
            if (subtotalEl) subtotalEl.textContent = '฿' + subtotal.toLocaleString();
            
            const shippingEl = document.getElementById('s-shipping');
            if (shippingEl) shippingEl.textContent = '฿' + finalShipping.toLocaleString();
            
            // Voucher Display Row (Summary)
            const discountRow = document.getElementById('s-discount-row');
            if (discountRow) {
                if (isShipVoucher) {
                    discountRow.style.display = 'flex';
                    const spanFirst = discountRow.querySelector('span:first-child');
                    if(spanFirst) spanFirst.textContent = 'ส่วนลดค่าจัดส่ง';
                    document.getElementById('s-discount').textContent = '-฿' + (shippingCost).toLocaleString();
                } else if (appliedDiscount > 0) {
                    discountRow.style.display = 'flex';
                    const spanFirst = discountRow.querySelector('span:first-child');
                    if(spanFirst) spanFirst.textContent = 'ส่วนลดจากโค้ด';
                    document.getElementById('s-discount').textContent = '-฿' + appliedDiscount.toLocaleString();
                } else {
                    discountRow.style.display = 'none';
                }
            }

            // Voucher Trigger Button (Main Section)
            const vStatus = document.getElementById('voucherStatus');
            if (vStatus) {
                if (appliedVoucherCode) {
                    let label = `${appliedVoucherCode} (-฿${appliedDiscount})`;
                    if (isShipVoucher) {
                        label = `ฟรีค่าจัดส่ง (-฿${shippingCost})`;
                    }
                    vStatus.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="border: 1px solid #ee4d2d; color:#ee4d2d; padding: 2px 8px; border-radius: 2px; font-size: 0.85rem;">${label}</span>
                            <span style="color:#757575; font-size:0.9rem;">แก้ไข</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#757575" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    `;
                } else {
                    vStatus.innerHTML = `
                        <span>กดใช้โค้ด</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    `;
                }
            }

            const totalEl = document.getElementById('s-total');
            if (totalEl) totalEl.textContent = '฿' + (total > 0 ? total : 0).toLocaleString();
        }

        // --- Voucher Modal Logic (Shopee Style) ---
        let tempVoucherCode = '';
        const STATIC_VOUCHERS = {
            'FREE': { value: 0, type: 'ship' },
            'PAO50': { value: 50, type: 'discount' },
            'PAO100': { value: 100, type: 'discount' },
            'NEWUSER': { value: 30, type: 'discount' },
            'SALE10': { value: 10, type: 'discount' }
        };

        // Get user's personal vouchers and combine with static ones
        function getMergedVouchers() {
            const user = JSON.parse(localStorage.getItem('paomobile_user'));
            const email = user ? user.email : '';
            const personalVouchers = JSON.parse(localStorage.getItem('pao_user_vouchers_' + email) || '[]');
            
            // v1.6.0 - Only show vouchers collected from Member (Filter out uncollected static ones)
            let merged = {}; 
            
            personalVouchers.forEach(v => {
                // v1.6.2 - Filter out expired vouchers from merging
                const now = new Date();
                if (v.expiry && v.expiry !== '-') {
                    const expDate = new Date(v.expiry + 'T23:59:59');
                    if (expDate < now) return;
                }

                // Use static definition as fallback if available for detail consistency
                const base = STATIC_VOUCHERS[v.code] || { value: 0, type: 'discount', minPurchase: 0 };
                merged[v.code] = {
                    title: v.title || base.title || 'Voucher',
                    value: (v.value !== undefined) ? v.value : base.value,
                    type: (v.type !== undefined) ? v.type : base.type,
                    minPurchase: (v.minPurchase !== undefined) ? v.minPurchase : (base.minPurchase || 0),
                    expiry: v.expiry || base.expiry || '-'
                };
            });
            return merged;
        }

        async function openVoucherModal() {
            const overlay = document.getElementById('voucherModalOverlay');
            if (overlay) overlay.classList.add('open');
            document.body.style.overflow = 'hidden';
            tempVoucherCode = appliedVoucherCode;

            // v1.8.0 - Sync with Firestore before rendering (with 3-second timeout)
            if (window.db) {
                try {
                    const user = JSON.parse(localStorage.getItem('paomobile_user'));
                    if (user && user.email) {
                        const email = user.email.trim();
                        const syncPromise = (async () => {
                            const redemptionsSnap = await db.collection('vouchers_redemptions').where('email', '==', email).get();
                            const claimedCodes = [...new Set(redemptionsSnap.docs.map(doc => doc.data().code))]; // Unique codes
                            
                            let refreshedVouchers = [];
                            if (claimedCodes.length > 0) {
                                // v1.8.2 - Batch sync support for 10+ vouchers
                                const chunkSize = 10;
                                for (let i = 0; i < claimedCodes.length; i += chunkSize) {
                                    const chunk = claimedCodes.slice(i, i + chunkSize);
                                    const vouchersSnap = await db.collection('vouchers').where('code', 'in', chunk).get();
                                    vouchersSnap.forEach(doc => refreshedVouchers.push({ ...doc.data(), id: doc.id }));
                                }
                            }
                            const vKey = 'pao_user_vouchers_' + email;
                            localStorage.setItem(vKey, JSON.stringify(refreshedVouchers));
                            console.log("[v1.8.2] Voucher Cloud Sync Success (Batch):", refreshedVouchers.length);
                        })();

                        await Promise.race([
                            syncPromise,
                            new Promise(resolve => setTimeout(resolve, 3000))
                        ]);
                    }
                } catch (e) {
                    console.warn("[v1.8.0] Voucher sync failed or timed out, using cache:", e);
                }
            }
            
            // v1.3.3 - Fetch usage counts from Firestore to hide used vouchers
            let usageCounts = {};
            if (window.db) {
                try {
                    const user = JSON.parse(localStorage.getItem('paomobile_user'));
                    const email = user ? user.email : '';
                    const snap = await db.collection('orders')
                        .where('customerEmail', '==', email)
                        .get();
                    
                    snap.docs.forEach(doc => {
                        const d = doc.data();
                        if (d.status !== 'ยกเลิกแล้ว' && d.appliedVoucherCode) {
                            usageCounts[d.appliedVoucherCode] = (usageCounts[d.appliedVoucherCode] || 0) + 1;
                        }
                        if (d.status !== 'ยกเลิกแล้ว' && d.voucherCode) {
                             usageCounts[d.voucherCode] = (usageCounts[d.voucherCode] || 0) + 1;
                        }
                    });
                } catch (e) {
                    console.error("Failed to fetch voucher usage:", e);
                }
            }

            renderPersonalVouchers(usageCounts);
            refreshVoucherListUI();
        }

        function renderPersonalVouchers(usageCounts = {}) {
            const shipContainer = document.getElementById('shippingVoucherList');
            const discountContainer = document.getElementById('voucherListContainer');
            if (!shipContainer || !discountContainer) return;

            const merged = getMergedVouchers();
            const personalVouchers = Object.keys(merged).map(code => ({
                code: code,
                ...merged[code]
            }));

            let shipHtml = '';
            let discountHtml = '';
            
            const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const today = new Date();
            today.setHours(0,0,0,0);

            personalVouchers.forEach(v => {
                const now = new Date();
                const isExpired = v.expiry && v.expiry !== '-' && new Date(v.expiry + 'T23:59:59') < now;
                if (isExpired) return;

                const isShip = v.code === 'FREESHIP' || v.code === 'FREE' || v.type === 'ship';
                const usedToday = usageCounts[v.code] || 0;
                const limit = v.usageLimit || 1;
                if (usedToday >= limit) return;

                const isEligible = subtotal >= (v.minPurchase || 0);
                const minText = v.minPurchase > 0 ? `ขั้นต่ำ ฿${v.minPurchase.toLocaleString()}` : 'ไม่มีขั้นต่ำ';
                const opacity = isEligible ? '1' : '0.4';
                const cursor = isEligible ? 'pointer' : 'not-allowed';
                const warningMsg = isEligible ? '' : `<div style="color:#ee4d2d; font-size:0.7rem; margin-top:4px; font-weight:500;">ยอดซื้อไม่ถึงขั้นต่ำ ฿${v.minPurchase.toLocaleString()}</div>`;

                const vTypeLabel = isShip ? 'ส่งฟรี' : (v.isPersonal ? 'ส่วนลด' : 'คูปอง');
                
                // Show discount amount as title if available (v1.6.3)
                let vTitle = isShip ? 'ส่งฟรี' : (v.title || v.code);
                if (v.type === 'discount' && v.value) {
                    vTitle = `ส่วนลด ฿${v.value.toLocaleString()}`;
                }
                
                const vExpiry = v.expiry && v.expiry !== '-' ? v.expiry : '31.12.2569';
                
                // v1.8.2 - Precise Expiring soon alert (Consistent with member.html)
                let expiryAlert = '';
                if (v.expiry && v.expiry !== '-') {
                    const expDate = new Date(v.expiry + 'T23:59:59');
                    const diffTime = expDate - now;
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

                    if (diffTime > 0 && diffTime < (3 * 24 * 60 * 60 * 1000)) {
                        let timeStr = diffDays >= 1 ? `${diffDays} วัน` : `${diffHours} ชม.`;
                        expiryAlert = `<div style="color: #e11d48; font-size: 0.7rem; font-weight: 700; margin-top: 2px;">⏰ จะหมดอายุใน ${timeStr}</div>`;
                    }
                }

                const cardHtml = `
                    <div class="v-item-card-wrapper" style="opacity: ${opacity}; cursor: ${cursor}; margin-bottom: 8px;">
                        <div class="v-item-card" onclick="${isEligible ? `selectVoucherListItem('${v.code}')` : ''}" style="min-height: 80px; padding: 0;">
                            <div class="v-item-left ${isShip ? 'shipping' : ''}" style="width: 70px; padding: 10px 5px;">
                                <div class="v-item-icon-box">
                                    ${isShip ? 
                                        '<svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M1 3h15v13H1V3zm16 10h4l3-3V7h-7v6zM5 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg>' : 
                                        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4"></path><path d="M22 15v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4"></path><path d="M2 9a3 3 0 0 1 0 6"></path><path d="M22 9a3 3 0 0 0 0 6"></path><line x1="9" y1="9" x2="15" y2="15"></line><circle cx="9" cy="15" r="1"></circle><circle cx="15" cy="9" r="1"></circle></svg>'
                                    }
                                </div>
                                <div class="v-item-label" style="font-size: 0.65rem;">${vTypeLabel}</div>
                            </div>
                            <div class="v-item-right" style="padding: 10px 15px; flex:1; display:flex; align-items:center; justify-content:space-between;">
                                <div class="v-info-box">
                                    <div class="v-info-title" style="font-size: 0.85rem; font-weight: 700; margin-bottom: 2px;">${vTitle}</div>
                                    <div class="v-info-tag" style="font-size: 0.65rem; color:#64748b;">${minText}</div>
                                    <div class="v-info-expiry" style="font-size: 0.6rem; color:#94a3b8;">ใช้ได้ถึง: ${vExpiry}</div>
                                    ${expiryAlert}
                                    ${warningMsg}
                                </div>
                                <div class="v-radio-box"><div class="v-radio" data-code="${v.code}"></div></div>
                            </div>
                        </div>
                    </div>
                `;

                if (isShip) shipHtml += cardHtml;
                else discountHtml += cardHtml;
            });
            
            if (shipHtml === '') shipHtml = '<div style="padding: 10px 0; color:#999; font-size:0.9rem;">ไม่มีโค้ดส่งฟรีที่ใช้งานได้</div>';
            if (discountHtml === '') discountHtml = '<div style="padding: 10px 0; color:#999; font-size:0.9rem;">ไม่มีคูปองส่วนลดที่ใช้งานได้</div>';
            
            shipContainer.innerHTML = shipHtml;
            discountContainer.innerHTML = discountHtml;
        }

        function closeVoucherModal() {
            const overlay = document.getElementById('voucherModalOverlay');
            if (overlay) overlay.classList.remove('open');
            document.body.style.overflow = '';
        }

        function toggleModalApplyBtn() {
            const input = document.getElementById('modalVoucherInput');
            const btn = document.getElementById('modalApplyBtn');
            if (input && btn) {
                if (input.value.trim().length > 0) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        }

        async function applyModalVoucherManual() {
            const input = document.getElementById('modalVoucherInput');
            if (!input) return;
            const code = input.value.trim().toUpperCase();
            if (!code) return;

            const btn = document.getElementById('modalApplyBtn');
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '...';

            try {
                // 1. Check if user already has it locally (quick check)
                const merged = getMergedVouchers();
                if (merged[code] !== undefined) {
                    selectVoucherListItem(code);
                    input.value = '';
                    toggleModalApplyBtn();
                } else if (window.db) {
                    // 2. Not found locally, try to find in Firestore 'vouchers' (Seller Created)
                    const user = JSON.parse(localStorage.getItem('paomobile_user'));
                    if (!user || !user.email) {
                        alert("กรุณาเข้าสู่ระบบเพื่อรับคูปองครับ");
                        return;
                    }

                    const snap = await db.collection('vouchers').where('code', '==', code).get();
                    if (snap.empty) {
                        alert('ไม่พบรหัสโค้ดนี้ในระบบครับ');
                    } else {
                        const vData = snap.docs[0].data();
                        const email = user.email;
                        const now = new Date();

                        // v1.8.5 - Strict Expiration Check (Matching member.html)
                        if (!vData.isPermanent && vData.expiry && vData.expiry !== '-') {
                            const expDate = new Date(vData.expiry + 'T23:59:59');
                            if (expDate < now) {
                                alert('ขออภัย คูปองนี้หมดอายุการใช้งานแล้วครับ ⏰');
                                return;
                            }
                        }
                        
                        // 3. Redeem now in Cloud
                        const checkSnap = await db.collection('vouchers_redemptions')
                            .where('code', '==', code)
                            .where('email', '==', email)
                            .get();
                        
                        if (checkSnap.empty) {
                            await db.collection('vouchers_redemptions').add({
                                code, email, at: firebase.firestore.FieldValue.serverTimestamp()
                            });
                            console.log("[v1.8.5] Redeemed via Checkout:", code);
                        }

                        // 4. v1.8.5 - INSTANT SYNC: Manually update local cache to avoid fetch latency
                        const vKey = 'pao_user_vouchers_' + email;
                        let personalVouchers = JSON.parse(localStorage.getItem(vKey) || '[]');
                        if (!personalVouchers.some(v => v.code === code)) {
                            personalVouchers.push({ ...vData, id: snap.docs[0].id });
                            localStorage.setItem(vKey, JSON.stringify(personalVouchers));
                        }

                        // 5. Update UI & Select
                        renderPersonalVouchers(); // Uses newly updated localStorage
                        selectVoucherListItem(code);
                        input.value = '';
                        toggleModalApplyBtn();
                        alert(`ยินดีด้วย! 🎉 เก็บโค้ด "${vData.title || code}" สำเร็จและใช้ได้ทันทีครับ!`);
                    }
                } else {
                    alert('ไม่พบรหัสโค้ดนี้ และไม่สามารถเชื่อมต่อฐานข้อมูลได้ครับ');
                }
            } catch (err) {
                console.error(err);
                alert('เกิดข้อผิดพลาดในการตรวจสอบคูปอง: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        }

        function selectVoucherListItem(code) {
            tempVoucherCode = (tempVoucherCode === code) ? '' : code;
            refreshVoucherListUI();
        }

        function refreshVoucherListUI() {
            document.querySelectorAll('.v-radio').forEach(radio => {
                const code = radio.dataset.code;
                if (code === tempVoucherCode) {
                    radio.classList.add('selected');
                } else {
                    radio.classList.remove('selected');
                }
            });
        }

        async function confirmVoucherSelection() {
            if (tempVoucherCode) {
                const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
                const merged = getMergedVouchers();
                const vData = merged[tempVoucherCode];
                
                if (vData && subtotal < (vData.minPurchase || 0)) {
                    alert(`โค้ดนี้ใช้ได้เมื่อมียอดซื้อขั้นต่ำ ฿${vData.minPurchase.toLocaleString()} ขึ้นไปครับ`);
                    return;
                }

                // v1.3.1 - Usage Limit Check (Firestore)
                if (window.db && tempVoucherCode) {
                    try {
                        const user = JSON.parse(localStorage.getItem('paomobile_user'));
                        const email = user ? user.email : '';
                        
                        // Count existing non-cancelled orders for this code/user
                        const snap = await db.collection('orders')
                            .where('customerEmail', '==', email)
                            .where('appliedVoucherCode', '==', tempVoucherCode)
                            .get();
                        
                        const usedCount = snap.docs.filter(doc => doc.data().status !== 'ยกเลิกแล้ว').length;
                        const limit = vData.usageLimit || 1;

                        if (usedCount >= limit) {
                            alert(`ขออภัยครับ คุณใช้สิทธิ์โค้ด ${tempVoucherCode} ครบ ${limit} ครั้งตามกำหนดแล้วครับ`);
                            return;
                        }
                    } catch (e) {
                        console.error("Usage validation failed:", e);
                    }
                }
            }

            appliedVoucherCode = tempVoucherCode;
            const merged = getMergedVouchers();
            const vData = merged[appliedVoucherCode];
            appliedDiscount = vData ? vData.value : 0;
            updateTotals();
            closeVoucherModal();
        }

        // Auto-apply pending voucher from member profile
        async function checkPendingVoucher() {
            const pendingCode = localStorage.getItem('pao_pending_voucher');
            if (pendingCode) {
                const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
                const merged = getMergedVouchers();
                const vData = merged[pendingCode];
                
                if (vData !== undefined) {
                    if (subtotal < (vData.minPurchase || 0)) {
                        alert(`คูปอง ${pendingCode} ไม่สามารถใช้ได้ เนื่องจากยอดซื้อไม่ถึงขั้นต่ำ ฿${vData.minPurchase.toLocaleString()}`);
                    } else {
                        // v1.3.1 - Usage Limit Check
                        let canUse = true;
                        if (window.db) {
                            try {
                                const user = JSON.parse(localStorage.getItem('paomobile_user'));
                                const email = user ? user.email : '';
                                const snap = await db.collection('orders')
                                    .where('customerEmail', '==', email)
                                    .where('appliedVoucherCode', '==', pendingCode)
                                    .get();
                                const usedCount = snap.docs.filter(doc => doc.data().status !== 'ยกเลิกแล้ว').length;
                                const limit = vData.usageLimit || 1;
                                if (usedCount >= limit) {
                                    alert(`โค้ด ${pendingCode} ถูกใช้เกินจำนวนสิทธิ์ที่กำหนดแล้วครับ`);
                                    canUse = false;
                                }
                            } catch (e) { console.error(e); }
                        }
                        
                        if (canUse) {
                            appliedVoucherCode = pendingCode;
                            appliedDiscount = vData.value || 0;
                            console.log("[Checkout] Auto-applied pending voucher:", pendingCode);
                            updateTotals(); // Ensure UI updates
                        }
                    }
                }
                localStorage.removeItem('pao_pending_voucher');
            }
        }

        window.openVoucherModal = openVoucherModal;
        window.closeVoucherModal = closeVoucherModal;
        window.toggleModalApplyBtn = toggleModalApplyBtn;
        window.applyModalVoucherManual = applyModalVoucherManual;
        window.selectVoucherListItem = selectVoucherListItem;
        window.confirmVoucherSelection = confirmVoucherSelection;
        window.checkPendingVoucher = checkPendingVoucher;

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
            if (cartItems.length === 0) {
                alert('ตะกร้าสินค้าว่างเปล่า กรุณาเลือกสินค้าใหม่ครับ');
                window.location.href = 'index.html';
                return;
            }

            if (!savedAddress) {
                alert('กรุณาเพิ่มหรือเลือกที่อยู่จัดส่ง');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const activeTab = document.querySelector('.pay-tab.active');
            const method = activeTab ? activeTab.dataset.method : 'transfer';
            const methodLabel = activeTab ? activeTab.textContent.trim() : 'โอนเงินธนาคาร';
            
            // Detailed Bank Info (v1.2.11)
            let selectedBank = 'N/A';
            if (method === 'transfer') {
                const bankOpt = document.querySelector('input[name="bankOption"]:checked');
                if (bankOpt) {
                    const label = bankOpt.closest('label').querySelector('.sub-text').textContent.trim();
                    selectedBank = label.replace('โอนเงิน (', '').replace(')', '');
                }
            } else if (method === 'promptpay') {
                selectedBank = 'PromptPay';
            }

            // Shipping Method (v1.2.11)
            const activeShip = document.querySelector('.inline-ship-opt.selected');
            const shippingMethod = activeShip ? activeShip.querySelector('span:first-of-type').textContent.replace('🎯 ', '').replace('🚚 ', '').trim() : 'รับที่ร้าน';

            // initial status
            let orderStatus = 'ที่ต้องชำระ';
            if (method === 'cod') {
                orderStatus = 'ที่ต้องจัดส่ง';
            }

            // Create Order Object
            const subtotal = cartItems.reduce((s, i) => s + (i.price * i.qty), 0);
            const total = Math.max(0, subtotal + shippingCost - appliedDiscount);
            const orderId = 'PAO-' + Date.now().toString(36).toUpperCase().slice(-8);
            
            const orderSourceSet = new Set(cartItems.map(i => i.source).filter(Boolean));
            const orderSourceStr = orderSourceSet.size > 0 ? Array.from(orderSourceSet).join(', ') : 'ไม่ระบุหน้า';

            const newOrder = {
                id: orderId,
                orderDate: new Date().toISOString(),
                status: orderStatus,
                items: cartItems.map(i => ({
                    name: i.name,
                    price: i.price,
                    qty: i.qty,
                    variationName: i.variationName || "",
                    img: i.img || 'logo.png',
                    source: i.source || 'ไม่ระบุ'
                })),
                orderPage: window.location.pathname.split('/').pop() || 'index.html',
                total: total,
                method: methodLabel,
                paymentMethod: methodLabel,    // v1.2.13
                paymentBank: selectedBank,      // v1.2.13
                voucherCode: appliedVoucherCode,
                discountAmount: appliedDiscount,
                orderSource: orderSourceStr
            };

            // Use Direct Cloud Sync Logic (Simple & Robust)
            const syncToCloud = async (data) => {
                const firestoreDB = (typeof db !== 'undefined') ? db : (window.firebase ? firebase.firestore() : null);
                if (!firestoreDB) {
                    console.error("[v1.2.10] Firestore not found");
                    return false;
                }
                try {
                    console.log("[v1.2.10] Sending to Cloud:", data.id);
                    await firestoreDB.collection('orders').doc(data.id).set(data);
                    console.log("[v1.2.10] Cloud Sync Success");
                    return true;
                } catch (err) {
                    console.error("[v1.2.10] Cloud Sync Error:", err);
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
                    const user = JSON.parse(localStorage.getItem('paomobile_user'));
                    const userEmail = user ? user.email : '';

                    // 1. Prepare Data
                    const globalOrderData = {
                        ...newOrder,
                        customer: getActiveUserId(),
                        customerEmail: userEmail,
                        customerProfileName: user ? (user.name || "") : "", // v1.7.0 - Capture profile nickname
                        customerName: savedAddress ? savedAddress.name : 'N/A',
                        customerPhone: savedAddress ? savedAddress.phone : 'N/A',
                        customerAddress: savedAddress ? `${savedAddress.addr1} ตำบล${savedAddress.district} อำเภอ${savedAddress.amphoe} จังหวัด${savedAddress.province} ${savedAddress.zip}` : 'N/A',
                        shippingMethod: shippingMethod,
                        paymentMethod: methodLabel,
                        paymentBank: selectedBank,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    // 2. Save Locally (Immediate)
                    const existingOrders = JSON.parse(localStorage.getItem(getOrdersKey()) || '[]');
                    existingOrders.unshift(newOrder);
                    localStorage.setItem(getOrdersKey(), JSON.stringify(existingOrders));

                    const allOrders = JSON.parse(localStorage.getItem('pao_global_orders') || '[]');
                    allOrders.unshift(globalOrderData);
                    localStorage.setItem('pao_global_orders', JSON.stringify(allOrders));

                    // 2.1 Check and remove used personal voucher (v1.2.1)
                    if (appliedVoucherCode) {
                        const user = JSON.parse(localStorage.getItem('paomobile_user'));
                        const email = user ? user.email : '';
                        const V_KEY = 'pao_user_vouchers_' + email;
                        let pVouchers = JSON.parse(localStorage.getItem(V_KEY)) || [];
                        const vIdx = pVouchers.findIndex(v => v.code === appliedVoucherCode);
                        if (vIdx !== -1) {
                            pVouchers.splice(vIdx, 1);
                            localStorage.setItem(V_KEY, JSON.stringify(pVouchers));
                            console.log("[Checkout] Personal voucher consumed:", appliedVoucherCode);
                        }
                    }

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
                        const bankOpt = document.querySelector('input[name="bankOption"]:checked');
                        const bankVal = bankOpt ? bankOpt.value : 'scb';
                        window.location.href = `payment-transfer.html?amount=${total}&ref=${orderId}&bank=${bankVal}`;
                    } else {
                        // Success Modal for COD (v1.2.14)
                        const successOverlay = document.getElementById('successOverlay');
                        if (successOverlay) {
                            successOverlay.classList.add('show');
                            // Auto redirect after 3 seconds
                            setTimeout(() => {
                                window.location.href = 'purchases.html?tab=ship';
                            }, 3000);
                        } else {
                            // Fallback if modal missing
                            alert('ขอบคุณที่สั่งซื้อสินค้า! (v1.2.10)\nรายการถูกส่งเข้าสู่ระบบ Seller Centre เรียบร้อยแล้วคับ');
                            window.location.href = 'purchases.html?tab=ship';
                        }
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
            
            // v1.2.11 - Prevent empty checkout (e.g. back button after payment)
            if (cartItems.length === 0) {
                console.log("[v1.2.11] Empty cart detected, redirecting to Purchases...");
                window.location.href = 'purchases.html?tab=pay';
                return;
            }

            renderAddress();
            renderCheckoutItems();
            checkPendingVoucher(); // Check for pre-selected vouchers from Member Profile
            updateTotals();
            initAddressLookup();
        });