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
// auth.js - Shared authentication state script
// Synchronizes UI across pages for logged-in users using localStorage.

(function () {
    const AUTH_KEY = 'paomobile_user';
    const SELLER_EMAIL = 'sattawat2560@gmail.com';
    let isUpdating = false;

    function updateNavForUser() {
        if (isUpdating) return;
        isUpdating = true;

        const userDataString = localStorage.getItem(AUTH_KEY);
        const mobileMenu = document.querySelector('.mobile-menu-inner');
        const navLinks = document.getElementById('navLinks');
        
        let user;
        try {
            user = userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            console.error("[Auth] Session data corrupt.");
            user = null;
        }

        // Only show member UI if verified
        const isFullyLoggedIn = user && user.name && user.isVerified;

        if (!isFullyLoggedIn) {
            console.log("[Auth] No verified session (Guest Mode).");
            
            // Cleanup: remove dynamic elements safely
            document.querySelectorAll('.is-logged-in, .dynamic-logout, #mobile-auth-header, .guest-member-link, .dynamic-member-link, .seller-centre-dropdown-item').forEach(el => el.remove());
            
            document.querySelectorAll('.account-icon-btn').forEach(el => {
                el.setAttribute('href', 'login.html');
                el.style.cursor = 'pointer';
            });

            // 1. Inject "Member" into Desktop Dropdown for Guest
            const dropdown = document.querySelector('.account-dropdown');
            if (dropdown) {
                const promoLink = dropdown.querySelector('a[href*="promotions.html"]');
                if (promoLink) promoLink.innerHTML = '🎁 รับสิทธิประโยชน์สุดพิเศษ <span class="arrow" style="float:right">›</span>';
                
                const purchasesLink = dropdown.querySelector('a[href*="purchases.html"]');
                if (purchasesLink) purchasesLink.innerHTML = '📦 การซื้อของฉัน';

                if (!dropdown.querySelector('.guest-member-link')) {
                    const memberLink = document.createElement('a');
                    memberLink.href = 'member.html';
                    memberLink.className = 'dropdown-item guest-member-link';
                    memberLink.style.cssText = 'color: var(--text) !important; font-size: 0.9em; padding-top: 6px; border-top: 1px dashed #eee; display: block;';
                    memberLink.innerHTML = '💎 Member <span class="arrow" style="float:right">›</span>';
                    
                    if (purchasesLink) {
                        purchasesLink.after(memberLink);
                    } else {
                        dropdown.appendChild(memberLink);
                    }
                }
            }

            // 2. Add Login link to Mobile Menu for guest
            if (mobileMenu) {
                const existingLogin = mobileMenu.querySelector('.guest-login-box');
                if (!existingLogin) {
                    const loginBox = document.createElement('div');
                    loginBox.className = 'guest-login-box';
                    loginBox.style.cssText = 'padding: 16px 18px; margin: 12px 0 25px 0; background: #fff; border: 2px solid #f1f5f9; border-radius: 15px; display: flex !important; align-items: center; justify-content: space-between; box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-decoration: none; cursor: pointer; transition: all 0.2s; position: relative; z-index: 99999; pointer-events: auto !important;';
                    
                    const loginText = document.createElement('span');
                    loginText.innerHTML = '👤 เข้าสู่ระบบ / สมัครสมาชิก';
                    loginText.style.cssText = 'font-weight: 700; color: #000; font-size: 0.95rem; pointer-events: none;';
                    
                    const arrow = document.createElement('span');
                    arrow.innerHTML = '›';
                    arrow.style.cssText = 'font-weight: 800; color: #ee4d2d; font-size: 1.2rem; margin-right: 2px; pointer-events: none;';
                    
                    loginBox.appendChild(loginText);
                    loginBox.appendChild(arrow);
                    
                    const doLogin = (e) => {
                        if (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                        }
                        window.location.assign('login.html');
                    };
                    
                    loginBox.addEventListener('click', doLogin);
                    loginBox.addEventListener('touchstart', doLogin, { passive: false });
                    
                    mobileMenu.prepend(loginBox);
                    
                    loginBox.addEventListener('mouseenter', () => loginBox.style.borderColor = '#ee4d2d');
                    loginBox.addEventListener('mouseleave', () => loginBox.style.borderColor = '#f1f5f9');
                    
                    loginBox.addEventListener('mouseenter', () => loginBox.style.borderColor = '#ee4d2d');
                    loginBox.addEventListener('mouseleave', () => loginBox.style.borderColor = '#f1f5f9');
                }

                // Member link in mobile sub-menu (Refactored to match parent style)
                const orderBtn = Array.from(mobileMenu.querySelectorAll('.menu-item-parent')).find(el => el.textContent.includes('สั่งของ'));
                if (orderBtn) {
                    const wrapper = orderBtn.closest('.menu-item-wrapper');
                    if (wrapper && !wrapper.nextElementSibling?.classList.contains('guest-member-mobile-wrapper')) {
                        const memberWrapper = document.createElement('div');
                        memberWrapper.className = 'menu-item-wrapper guest-member-mobile-wrapper';
                        memberWrapper.style.marginTop = '10px';
                        memberWrapper.innerHTML = `
                            <a href="member.html" class="menu-item-link">💎 Member</a>
                        `;
                        wrapper.after(memberWrapper);
                    }
                }
            }
            
            isUpdating = false;
            return;
        }

        // --- Verified User UI ---
        const normalizedEmail = (user.email || "").toLowerCase().trim();
        const isAdmin = normalizedEmail === SELLER_EMAIL.toLowerCase();
        const firstName = (user.name.includes('@')) ? user.name.split(' ')[0] : user.name;
        
        // Remove guest elements
        document.querySelectorAll('.guest-login-box, .guest-member-link, .guest-member-mobile-link').forEach(el => el.remove());

        const accountIcon = document.querySelector('.account-icon-btn');
        if (accountIcon) {
            accountIcon.setAttribute('href', 'javascript:void(0)');
            accountIcon.style.cursor = 'default';
        }

        const loginLinks = document.querySelectorAll('a[href*="login.html"], .account-dropdown .dropdown-item.bold');
        loginLinks.forEach(el => {
            // el.classList.contains('is-logged-in') check removed to allow re-painting when data changes
            el.removeAttribute('href');
            el.style.cursor = 'default';
            el.classList.add('is-logged-in');
            
            const avatarHtml = user.avatar 
                ? `<img src="${user.avatar}" class="nav-user-avatar" style="width:24px; height:24px; border-radius:50%; margin-right:8px; object-fit:cover; vertical-align:middle;">`
                : `<div class="avatar-letter-placeholder" style="width:24px; height:24px; border-radius:50%; background:var(--gold-500); color:white; display:inline-flex; align-items:center; justify-content:center; margin-right:8px; font-size:12px; font-weight:bold; vertical-align:middle;">${firstName.charAt(0).toUpperCase()}</div>`;
            
            el.innerHTML = `<span class="user-greeting" style="display:inline-flex; align-items:center;">${avatarHtml}${firstName}</span>`;

            const parent = el.parentNode;
            if (parent && parent.classList.contains('account-dropdown')) {
                parent.innerHTML = '';
                parent.style.cssText = `
                    padding: 12px;
                    min-width: 280px;
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important;
                    border-radius: 20px !important;
                `;

                // Fetch dynamic counts
                const userEmail = user.email || '';
                const voucherKey = 'pao_user_vouchers_' + userEmail;
                const voucherList = JSON.parse(localStorage.getItem(voucherKey)) || [];
                const couponCount = voucherList.length;
                const savedPts = localStorage.getItem('pao_user_points_' + userEmail);
                const pointsCount = savedPts !== null ? parseInt(savedPts) : (couponCount * 10);

                // 1. User & Points Card Widget (Dark Gold Banner inside white modal)
                const userCard = document.createElement('div');
                userCard.className = 'nav-user-profile-widget';
                userCard.style.cssText = `
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 14px;
                    padding: 14px;
                    margin-bottom: 12px;
                    color: #fff;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    border: 1px solid rgba(240,192,64,0.3);
                `;
                userCard.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                        ${user.avatar || user.photoURL
                            ? `<img src="${user.avatar || user.photoURL}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:2px solid #F0C040; flex-shrink:0;">`
                            : `<div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #D4A32A, #F0C040); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.1rem; flex-shrink:0;">${firstName.charAt(0).toUpperCase()}</div>`}
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:0.95rem; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${user.name || firstName}</div>
                            <div style="font-size:0.72rem; color:rgba(255,255,255,0.65); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userEmail}</div>
                        </div>
                    </div>
                    
                    <!-- Dynamic Points (Primary Highlight) & Coupons Widget -->
                    <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:6px; background:rgba(255,255,255,0.08); border-radius:10px; padding:10px 8px; border:1px solid rgba(255,255,255,0.1);">
                        <a href="member.html" style="text-decoration:none; color:inherit; text-align:center; border-right:1px solid rgba(255,255,255,0.12); padding-right:4px;">
                            <div style="font-size:0.68rem; color:#f59e0b; font-weight:800; text-transform:uppercase;">⭐ พอยท์สะสม</div>
                            <div style="font-size:1.25rem; font-weight:900; background:linear-gradient(135deg, #F0C040, #D4A32A); -webkit-background-clip:text; -webkit-text-fill-color:transparent; line-height:1.2;">${pointsCount.toLocaleString()}</div>
                        </a>
                        <a href="member.html" style="text-decoration:none; color:inherit; text-align:center; padding-left:4px;">
                            <div style="font-size:0.68rem; color:rgba(255,255,255,0.7); font-weight:600;">🎟️ คูปองของฉัน</div>
                            <div style="font-size:1.25rem; font-weight:900; color:#ee4d2d; line-height:1.2;">${couponCount} <span style="font-size:0.72rem; font-weight:600; color:rgba(255,255,255,0.7);">ใบ</span></div>
                        </a>
                    </div>
                `;
                parent.appendChild(userCard);

                const createMenuItem = (html, href, customCss = '') => {
                    const a = document.createElement('a');
                    a.href = href;
                    a.className = 'dropdown-item';
                    a.style.cssText = `
                        color: #1e293b !important;
                        font-weight: 700; font-size: 0.88rem;
                        padding: 10px 12px; border-radius: 10px;
                        display: flex; justify-content: space-between; align-items: center;
                        transition: all 0.2s; text-decoration: none;
                        ${customCss}
                    `;
                    a.innerHTML = html;
                    a.onmouseenter = () => { a.style.background = '#f8fafc'; a.style.color = '#f59e0b'; };
                    a.onmouseleave = () => { a.style.background = 'transparent'; a.style.color = '#1e293b'; };
                    return a;
                };

                // 2. Member & กระเป๋าคูปอง
                parent.appendChild(createMenuItem('<span>💎 Member & กระเป๋าคูปอง</span><span style="color:#94a3b8">›</span>', 'member.html'));

                // 3. รับสิทธิประโยชน์สุดพิเศษ
                parent.appendChild(createMenuItem('<span>🎁 รับสิทธิประโยชน์สุดพิเศษ</span><span style="color:#94a3b8">›</span>', 'promotions.html'));

                // 4. การซื้อของฉัน
                parent.appendChild(createMenuItem('<span>📦 การซื้อของฉัน</span><span style="color:#94a3b8">›</span>', 'purchases.html'));

                // 5. Seller Centre (Admin only)
                if (isAdmin) {
                    const sellerBtn = createMenuItem('<span>🏪 Seller Centre</span><span style="color:#ee4d2d">›</span>', 'seller-centre.html', 'color: #ee4d2d !important; font-weight: 700; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 12px;');
                    sellerBtn.target = '_blank';
                    parent.appendChild(sellerBtn);
                }

                // 6. ออกจากระบบ (Red - always last)
                const logoutBtn = document.createElement('a');
                logoutBtn.href = 'javascript:void(0)';
                logoutBtn.className = 'dropdown-item';
                logoutBtn.style.cssText = 'color: #ef4444 !important; font-weight: 700; font-size: 0.88rem; padding: 10px 12px; border-radius: 10px; margin-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 10px; display: block; transition: all 0.2s;';
                logoutBtn.innerHTML = '🚪 ออกจากระบบ';
                logoutBtn.onmouseenter = () => { logoutBtn.style.background = '#fff1f2'; };
                logoutBtn.onmouseleave = () => { logoutBtn.style.background = 'transparent'; };
                logoutBtn.addEventListener('click', handleLogout);
                parent.appendChild(logoutBtn);
            }
        });

        if (mobileMenu) {
            const userEmail = user.email || '';
            const voucherKey = 'pao_user_vouchers_' + userEmail;
            const voucherList = JSON.parse(localStorage.getItem(voucherKey)) || [];
            const couponCount = voucherList.length;
            const savedPts = localStorage.getItem('pao_user_points_' + userEmail);
            const pointsCount = savedPts !== null ? parseInt(savedPts) : (couponCount * 10);

            const oldHeader = document.getElementById('mobile-auth-header');
            if (oldHeader) {
                const countSpan = oldHeader.querySelector('.coupon-count-badge');
                const ptsSpan = oldHeader.querySelector('.points-count-badge');
                if (countSpan) countSpan.textContent = couponCount;
                if (ptsSpan) ptsSpan.textContent = pointsCount.toLocaleString();
                isUpdating = false;
                return; 
            }
            
            const header = document.createElement('div');
            header.id = 'mobile-auth-header';
            header.style.cssText = `
                position: relative;
                padding: 16px 18px; 
                background: linear-gradient(135deg, #1d1d1f 0%, #333 100%); 
                margin: 15px 0 25px -25px; 
                border-bottom: 3.5px solid #f59e0b; 
                display: flex; 
                align-items: center; 
                gap: 12px; 
                box-shadow: 10px 10px 30px rgba(0,0,0,0.15); 
                cursor: pointer; 
                width: 92%;
                border-radius: 0 28px 28px 0;
                overflow: hidden;
            `;
            header.onclick = (e) => {
                if (e.target.closest('#btnMobileLogout')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                window.location.href = 'member.html';
            };

            header.innerHTML = `
                <!-- Premium Background Accent -->
                <div style="position:absolute; top:-20px; right:-20px; width:120px; height:120px; background:radial-gradient(circle, rgba(245, 158, 11, 0.15), transparent 70%); border-radius:50%; pointer-events:none;"></div>
                
                <!-- Mega Avatar -->
                <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.5rem; flex-shrink: 0; border: 2.5px solid #fff; box-shadow: 0 0 15px rgba(245, 158, 11, 0.45);">
                    ${user.avatar || user.photoURL ? `<img src="${user.avatar || user.photoURL}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="color:white;">${firstName.charAt(0).toUpperCase()}</span>`}
                </div>
                
                <div style="flex: 1; min-width: 0; z-index: 1;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                        <div style="display:flex; flex-direction:column; gap:2px; min-width:0; flex:1;">
                            <div style="font-size: 0.65rem; color: #f59e0b; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; display:flex; align-items:center; gap:4px;">
                                <span>${isAdmin ? '🛡️' : '👤'}</span> ${isAdmin ? 'ADMIN' : 'MEMBER'}
                            </div>
                            <div style="font-weight: 950; color: #fff; font-size: 1.3rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.5px; line-height: 1.1;">${firstName}</div>
                            
                            <!-- Dynamic Points (Primary) & Coupons Row -->
                            <div style="display:flex; align-items:center; gap:6px; margin-top:6px; flex-wrap:nowrap;">
                                <div style="background:linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(212, 163, 42, 0.2)); border:1px solid rgba(245, 158, 11, 0.5); padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">
                                    <span style="font-size:0.75rem;">⭐</span>
                                    <span class="points-count-badge" style="font-size:0.9rem; font-weight:900; color:#fde68a;">${pointsCount.toLocaleString()}</span>
                                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.8); font-weight:700;">พอยท์</span>
                                </div>
                                <div style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); padding:3px 8px; border-radius:20px; display:inline-flex; align-items:center; gap:3px; white-space:nowrap;">
                                    <span style="font-size:0.75rem;">🎟️</span>
                                    <span class="coupon-count-badge" style="font-size:0.85rem; font-weight:900; color:#ee4d2d;">${couponCount}</span>
                                    <span style="font-size:0.65rem; color:rgba(255,255,255,0.8); font-weight:600;">ใบ</span>
                                </div>
                            </div>
                        </div>
                        <button id="btnMobileLogout" style="background:rgba(255, 255, 255, 0.15); border:none; color: #fff; font-size: 1.2rem; padding: 0; border-radius: 12px; width:40px; height:40px; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(8px); border: 1px solid rgba(255,255,255,0.2); cursor:pointer; pointer-events: auto !important; z-index: 100; flex-shrink:0;">🚪</button>
                    </div>
                </div>
            `;
            mobileMenu.prepend(header);
            
            const btnLogout = document.getElementById('btnMobileLogout');
            if (btnLogout) {
                const triggerLogout = (e) => {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        // prevent immediate consecutive triggers
                        if (window._isLoggingOut) return;
                        window._isLoggingOut = true;
                        handleLogout(e);
                    }
                };
                btnLogout.addEventListener('click', triggerLogout);
                btnLogout.addEventListener('touchstart', triggerLogout, { passive: false });
            }

            // Clean up old mobile member links and seller centre links
            mobileMenu.querySelectorAll('.dynamic-member-mobile-wrapper, .seller-centre-mobile-wrapper').forEach(el => el.remove());

            const orderBtn = Array.from(mobileMenu.querySelectorAll('.menu-item-parent')).find(el => el.textContent.includes('สั่งของ'));
            if (orderBtn) {
                const wrapper = orderBtn.closest('.menu-item-wrapper');
                if (wrapper) {
                    // 1. Member Link
                    const memberWrapper = document.createElement('div');
                    memberWrapper.className = 'menu-item-wrapper dynamic-member-mobile-wrapper';
                    memberWrapper.style.marginTop = '10px';
                    memberWrapper.innerHTML = `
                        <a href="member.html" class="menu-item-link">💎 Member</a>
                    `;
                    wrapper.after(memberWrapper);

                    // 2. Seller Centre Link (Admin only)
                    if (isAdmin) {
                        const sellerWrapper = document.createElement('div');
                        sellerWrapper.className = 'menu-item-wrapper seller-centre-mobile-wrapper';
                        sellerWrapper.style.marginTop = '0px'; 
                        sellerWrapper.innerHTML = `
                            <a href="seller-centre.html" target="_blank" class="menu-item-link" style="color: #ee4d2d !important; font-weight: 700;">🏪 Seller Centre</a>
                        `;
                        memberWrapper.after(sellerWrapper);
                    }
                }
            }
        }

        // ── Removed Aggressive Chat Metadata Sync ──────────────────
        // (Previously caused excessive writes on every page load)
        // ───────────────────────────────────────────────────────────

        isUpdating = false;
    }

    function handleLogout(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        localStorage.removeItem(AUTH_KEY);
        if (window.getSupabaseClient) { 
            window.getSupabaseClient().auth.signOut().then(() => window.location.reload()); 
        } else { 
            window.location.reload(); 
        }
    }

    // Use a more controlled observer
    const observer = new MutationObserver((mutations) => {
        let isNavAction = false;
        for (let m of mutations) {
            if (m.addedNodes.length > 0) {
                for (let n of m.addedNodes) {
                    if (n.nodeType === 1) {
                        // Check if added node is or contains nav elements
                        if (n.classList?.contains('navbar') || 
                            n.classList?.contains('mobile-menu') || 
                            n.querySelector?.('.account-dropdown') || 
                            n.querySelector?.('.mobile-menu-inner')) {
                            isNavAction = true;
                            break;
                        }
                    }
                }
            }
            if (isNavAction) break;
        }
        if (isNavAction) {
            // Disconnect momentarily to avoid feedback loops from ourselves
            observer.disconnect();
            updateNavForUser();
            const nav = document.querySelector('.navbar');
            if (nav) observer.observe(nav, { childList: true, subtree: true });
            const body = document.body;
            if (body) observer.observe(body, { childList: true });
        }
    });

    // Run immediately if DOM might be ready, and on events
    updateNavForUser(); 
    
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', updateNavForUser);
    } else {
        updateNavForUser();
    }
    
    window.addEventListener('load', () => {
        updateNavForUser();
        const nav = document.querySelector('.navbar');
        if (nav) observer.observe(nav, { childList: true, subtree: true });
        const body = document.body;
        if (body) observer.observe(body, { childList: true });
    });

    window.AuthAPI = {
        refreshNav: () => {
            console.log("[AuthAPI] Manual Refresh Triggered");
            updateNavForUser();
        },
        isLoggedIn: () => {
            try {
                const u = JSON.parse(localStorage.getItem(AUTH_KEY));
                return !!(u && u.name && u.isVerified);
            } catch { return false; }
        }
    };
})();
