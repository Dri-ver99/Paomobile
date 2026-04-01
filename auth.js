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
                    loginBox.style.cssText = 'padding: 15px; margin: 10px 15px; background: #fff; border: 1px dashed var(--gold-primary, #D4A32A); border-radius: 12px; text-align: center;';
                    
                    const loginLink = document.createElement('a');
                    loginLink.href = 'login.html';
                    loginLink.innerHTML = 'เข้าสู่ระบบ / สมัครสมาชิก';
                    loginLink.style.cssText = 'font-weight: 700; color: var(--gold-primary, #D4A32A); display: block; text-decoration: none; font-size: 1rem;';
                    loginBox.appendChild(loginLink);
                    mobileMenu.prepend(loginBox);
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
                // Aggressive Cleanup: Remove EVERYTHING except the user greeting link itself
                Array.from(parent.children).forEach(child => {
                    if (child !== el) child.remove();
                });

                // Add Divider
                const divider = document.createElement('div');
                divider.className = 'dropdown-divider';
                parent.appendChild(divider);

                // 2. รับสิทธิประโยชน์
                const promoLink = document.createElement('a');
                promoLink.href = 'promotions.html';
                promoLink.className = 'dropdown-item dynamic-promo-link';
                promoLink.style.paddingBottom = '8px';
                promoLink.innerHTML = '🎁 รับสิทธิประโยชน์สุดพิเศษ <span class="arrow" style="float:right">›</span>';
                parent.appendChild(promoLink);

                // 3. การซื้อของฉัน
                const purchasesLink = document.createElement('a');
                purchasesLink.href = 'purchases.html';
                purchasesLink.className = 'dropdown-item dynamic-purchases-link';
                purchasesLink.style.cssText = 'color: var(--text) !important; font-size: 0.9em; padding-top: 6px;';
                purchasesLink.innerHTML = '📦 การซื้อของฉัน';
                parent.appendChild(purchasesLink);

                // 4. Member 
                const memberLink = document.createElement('a');
                memberLink.href = 'member.html';
                memberLink.className = 'dropdown-item dynamic-member-link';
                memberLink.style.cssText = 'color: var(--text) !important; font-size: 0.9em; margin-top: 4px; display: block; border-top: 1px dashed #eee; padding-top: 8px;';
                memberLink.innerHTML = '💎 Member <span class="arrow" style="float:right">›</span>';
                parent.appendChild(memberLink);

                // 5. Seller Centre (Admin only - move above logout)
                if (isAdmin) {
                    const sellerLink = document.createElement('a');
                    sellerLink.href = 'seller-centre.html';
                    sellerLink.target = '_blank';
                    sellerLink.className = 'dropdown-item seller-centre-dropdown-item';
                    sellerLink.innerHTML = `<div style="display:flex; align-items:center; gap:10px;">🏪 <span>Seller Centre</span></div><span class="arrow">›</span>`;
                    sellerLink.style.cssText = 'color: #ee4d2d !important; font-weight: 700; border-top: 1px solid #eee; margin-top: 5px; padding-top: 12px;';
                    parent.appendChild(sellerLink);
                }

                // 6. ออกจากระบบ (Red - always last)
                const logoutBtn = document.createElement('a');
                logoutBtn.href = 'javascript:void(0)';
                logoutBtn.className = 'dropdown-item dynamic-logout';
                logoutBtn.style.cssText = 'color: #ef4444 !important; font-size: 0.9em; margin-top: 4px; display: block; border-top: 1px solid #eee; padding-top: 8px;';
                logoutBtn.innerHTML = '🚪 ออกจากระบบ';
                logoutBtn.addEventListener('click', handleLogout);
                parent.appendChild(logoutBtn);
            }
        });

        // Mobile Menu Header - Allow re-painting
        if (mobileMenu) {
            const oldHeader = document.getElementById('mobile-auth-header');
            if (oldHeader) oldHeader.remove();
            
            const header = document.createElement('div');
            header.id = 'mobile-auth-header';
            header.style.cssText = 'padding: 15px 20px; background: #fff; border-radius: 12px; margin: 5px 15px 15px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 14px;';
            header.innerHTML = `
                <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); overflow: hidden; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.4rem; flex-shrink: 0;">
                    ${user.avatar ? `<img src="${user.avatar}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="color:white;">${firstName.charAt(0).toUpperCase()}</span>`}
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.8em; color: #64748b; margin-bottom: 2px;">สวัสดีคุณ</div>
                    <div style="font-weight: 700; color: #1e293b; font-size: 1.1rem; line-height: 1.2;">${firstName}</div>
                </div>
                <button id="btnMobileLogout" style="background:rgba(239, 68, 68, 0.1); border:none; color: #ef4444; font-size: 0.8em; font-weight: 600; padding: 6px 12px; border-radius: 20px;">🚪</button>
            `;
            mobileMenu.prepend(header);
            document.getElementById('btnMobileLogout')?.addEventListener('click', handleLogout);

            // Clean up old mobile member links
            mobileMenu.querySelectorAll('.dynamic-member-mobile-wrapper').forEach(el => el.remove());

            const orderBtn = Array.from(mobileMenu.querySelectorAll('.menu-item-parent')).find(el => el.textContent.includes('สั่งของ'));
            if (orderBtn) {
                const wrapper = orderBtn.closest('.menu-item-wrapper');
                if (wrapper) {
                    const memberWrapper = document.createElement('div');
                    memberWrapper.className = 'menu-item-wrapper dynamic-member-mobile-wrapper';
                    memberWrapper.style.marginTop = '10px';
                    memberWrapper.innerHTML = `
                        <a href="member.html" class="menu-item-link">💎 Member</a>
                    `;
                    wrapper.after(memberWrapper);
                }
            }
        }

        // Global Chat Metadata Sync (Ensure Seller sees latest Photo/Name)
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && user && user.email) {
            const db = firebase.firestore();
            const normalizedEmail = user.email.trim().toLowerCase();
            db.collection('chats').doc(normalizedEmail).set({
                userName: user.name || user.email,
                userAvatar: user.avatar || "",
                userEmail: normalizedEmail,
                // don't overwrite lastMessage or lastTimestamp here
            }, { merge: true }).catch(err => console.warn("[AuthSync] Chat metadata sync failed:", err));
        }

        isUpdating = false;
    }

    function handleLogout(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        localStorage.removeItem(AUTH_KEY);
        window.location.reload();
    }

    // Use a more controlled observer
    const observer = new MutationObserver((mutations) => {
        let isNavAction = false;
        for (let m of mutations) {
            if (m.addedNodes.length > 0) {
                for (let n of m.addedNodes) {
                    if (n.nodeType === 1 && (n.classList?.contains('navbar') || n.classList?.contains('mobile-menu') || n.querySelector?.('.account-dropdown'))) {
                        isNavAction = true; break;
                    }
                }
            }
            if (isNavAction) break;
        }
        if (isNavAction) updateNavForUser();
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
