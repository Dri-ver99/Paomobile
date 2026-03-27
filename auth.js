// auth.js - Shared authentication state script
// Synchronizes UI across pages for logged-in users using localStorage.

(function () {
    const AUTH_KEY = 'paomobile_user';
    const SELLER_EMAIL = 'sattawat2560@gmail.com';

    function updateNavForUser() {
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

        // Cleanup: remove dynamic elements if state changed


        // Only show member UI if verified
        const isFullyLoggedIn = user && user.name && user.isVerified;

        if (!isFullyLoggedIn) {
            console.log("[Auth] No verified session (Guest Mode).");
            
            // Cleanup: remove dynamic logout or greeting if present
            document.querySelectorAll('.is-logged-in, .dynamic-logout, #mobile-auth-header').forEach(el => el.remove());
            document.querySelectorAll('.account-icon-btn').forEach(el => {
                el.setAttribute('href', 'login.html');
                el.style.cursor = 'pointer';
            });

            // Add Login link to Mobile Menu if missing for guest
            if (mobileMenu && !mobileMenu.querySelector('a[href*="login.html"]')) {
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.innerHTML = '👤 เข้าสู่ระบบ / สมัครสมาชิก';
                loginLink.style.cssText = 'font-weight: 600; color: var(--gold-primary); border-top: 1px solid #f1f5f9; margin-top: 10px; padding-top: 15px; display: flex !important; justify-content: center; align-items: center; gap: 8px; width: 100%;';
                mobileMenu.appendChild(loginLink);
            }
            return;
        }

        // --- Verified User UI Injection ---
        const firstName = (user.name.includes('@')) ? user.name.split(' ')[0] : user.name;
        console.log("[Auth] Active Session:", firstName);

        // 1. SELECTORS
        const allLinks = document.querySelectorAll('a[href*="login.html"], .account-dropdown .dropdown-item.bold, .mobile-menu a[href*="login.html"]');
        const accountIcon = document.querySelector('.account-icon-btn');

        // A. Update Account Icon (Disable link redirect)
        if (accountIcon) {
            accountIcon.setAttribute('href', 'javascript:void(0)');
            accountIcon.style.cursor = 'default';
        }

        // B. Update/Replace Login Links
        allLinks.forEach(el => {
            if (el.classList.contains('is-logged-in')) return;

            const text = el.textContent || "";
            if (text.includes('เข้าสู่ระบบ') || text.includes('สมัครสมาชิก') || el.classList.contains('bold')) {
                el.removeAttribute('href');
                el.style.cursor = 'default';
                el.style.color = 'var(--text-main, #111)';
                el.innerHTML = `<span class="user-greeting">👤 ${firstName}</span>`;
                el.classList.add('is-logged-in');

                // Add Logout button if sibling doesn't exist
                let parent = el.parentNode;
                if (!parent.querySelector('.dynamic-logout')) {
                    const logoutBtn = document.createElement('a');
                    logoutBtn.href = 'javascript:void(0)';
                    logoutBtn.className = 'dropdown-item dynamic-logout';
                    logoutBtn.style.cssText = 'color: #ef4444 !important; font-size: 0.9em; margin-top: 4px; display: block; border-top: 1px solid #eee; padding-top: 8px;';
                    logoutBtn.textContent = '← ออกจากระบบ';
                    logoutBtn.addEventListener('click', handleLogout);
                    parent.insertBefore(logoutBtn, el.nextSibling);
                }
            }
        });

        // C. Inject User Profile into Mobile Menu
        if (mobileMenu && !document.getElementById('mobile-auth-header')) {
            const header = document.createElement('div');
            header.id = 'mobile-auth-header';
            header.style.cssText = 'padding: 20px; background: #f8fafc; border-radius: 12px; margin: 5px 15px 15px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px;';
            header.innerHTML = `
                <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2);">
                    ${firstName.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.85em; color: #64748b;">สวัสดีคุณ</div>
                    <div style="font-weight: 600; color: #1e293b; font-size: 1rem;">${firstName}</div>
                </div>
                <button id="btnMobileLogout" style="background:none; border:none; color: #ef4444; font-size: 0.85em; font-weight: 500; cursor: pointer;">ออกจากระบบ</button>
            `;
            mobileMenu.prepend(header);
            const mobileLogout = document.getElementById('btnMobileLogout');
            if (mobileLogout) mobileLogout.addEventListener('click', handleLogout);
        }

        // D. Inject Seller Centre Button if authorized (Inside Dropdown)
        if (user.email === SELLER_EMAIL) {
            const dropdown = document.querySelector('.account-dropdown');
            const purchasesLink = dropdown ? dropdown.querySelector('a[href*="purchases.html"]') : null;
            
            if (purchasesLink && !dropdown.querySelector('.seller-centre-dropdown-item')) {
                const sellerLink = document.createElement('a');
                sellerLink.href = 'seller-centre.html';
                sellerLink.target = '_blank';
                sellerLink.className = 'dropdown-item seller-centre-dropdown-item';
                sellerLink.innerHTML = '<span>Seller Centre</span> <span class="arrow">›</span>';
                sellerLink.style.cssText = 'color: #ee4d2d !important; font-weight: 700; border-top: 1px solid #eee; margin-top: 5px; padding-top: 12px;';
                purchasesLink.after(sellerLink);
            }
        }


    }

    function handleLogout(e) {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("[Auth] Logging out...");
        localStorage.setItem('pao_logout_pending', 'true');
        localStorage.removeItem('paomobile_user');
        // Scoped cart data and owners remain preserved for this account

        window.location.href = 'login.html';
    }

    // --- AGGRESSIVE DETECTION (MutationObserver) ---
    const observer = new MutationObserver(() => {
        updateNavForUser();
    });

    // Start watching
    window.addEventListener('load', () => {
        updateNavForUser();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // --- GLOBAL API FOR OTHER SCRIPTS ---
    window.AuthAPI = {
        isLoggedIn: function() {
            const userDataString = localStorage.getItem(AUTH_KEY);
            if (!userDataString) return false;
            try {
                const user = JSON.parse(userDataString);
                return !!(user && user.name && user.isVerified);
            } catch (e) {
                return false;
            }
        },
        redirectToLogin: function() {
            window.location.href = 'login.html';
        }
    };

    // Immediate check
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavForUser);
    } else {
        updateNavForUser();
    }
})();
