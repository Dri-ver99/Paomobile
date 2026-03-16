// auth.js - Shared authentication state script
// Synchronizes UI across pages for logged-in users using localStorage.

(function () {
    const AUTH_KEY = 'paomobile_user';

    function updateNavForUser() {
        const userData = localStorage.getItem(AUTH_KEY);
        const user = userData ? JSON.parse(userData) : null;
        
        // 1. SELECTORS
        // - Desktop dropdown links
        // - Mobile menu links
        // - Any link pointing to login.html
        const allLinks = document.querySelectorAll('a[href*="login.html"], .account-dropdown .dropdown-item.bold');
        const mobileMenu = document.querySelector('.mobile-menu-inner');
        const accountIcon = document.querySelector('.account-icon-btn');

        if (user && user.name) {
            const firstName = user.name.split(' ')[0];
            console.log("[Auth] Active Session:", firstName);

            // A. Update Account Icon (Disable link redirect)
            if (accountIcon) {
                accountIcon.setAttribute('href', 'javascript:void(0)');
                accountIcon.style.cursor = 'default';
            }

            // B. Update/Replace Login Links
            allLinks.forEach(el => {
                const text = el.textContent || "";
                if (text.includes('เข้าสู่ระบบ') || text.includes('สมัครสมาชิก') || el.classList.contains('bold')) {
                    el.removeAttribute('href');
                    el.style.cursor = 'default';
                    el.style.color = 'var(--text-main, #111)';
                    el.innerHTML = `<span class="user-greeting">👤 ${firstName}</span>`;
                    el.classList.add('is-logged-in');

                    // Add Logout button if sibling doesn't exist
                    if (!el.parentNode.querySelector('.dynamic-logout')) {
                        const logoutBtn = document.createElement('a');
                        logoutBtn.href = 'javascript:void(0)';
                        logoutBtn.className = 'dropdown-item dynamic-logout';
                        logoutBtn.style.cssText = 'color: #ef4444 !important; font-size: 0.9em; margin-top: 4px; display: block; border-top: 1px solid #eee; padding-top: 8px;';
                        logoutBtn.textContent = '← ออกจากระบบ';
                        logoutBtn.addEventListener('click', handleLogout);
                        el.parentNode.insertBefore(logoutBtn, el.nextSibling);
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
                document.getElementById('btnMobileLogout').addEventListener('click', handleLogout);
            }
        } else {
            // GUEST MODE
            console.log("[Auth] Guest Mode");
            
            // Add Login link to Mobile Menu if missing
            if (mobileMenu && !mobileMenu.querySelector('a[href*="login.html"]')) {
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.innerHTML = '👤 เข้าสู่ระบบ / สมัครสมาชิก';
                loginLink.style.cssText = 'font-weight: 600; color: var(--gold-primary); border-top: 1px solid #f1f5f9; margin-top: 10px; padding-top: 15px;';
                mobileMenu.appendChild(loginLink);
            }
        }
    }

    function handleLogout() {
        localStorage.setItem('pao_logout_pending', 'true');
        localStorage.removeItem('paomobile_user');
        localStorage.removeItem('pao_cart');
        localStorage.removeItem('pao_cart_owner');
        window.location.href = 'login.html';
    }

    // --- AGGRESSIVE DETECTION (MutationObserver) ---
    // This catches elements that appear late or are added by other scripts
    const observer = new MutationObserver(() => {
        updateNavForUser();
    });

    // Start watching
    window.addEventListener('load', () => {
        updateNavForUser();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // Immediate check
    updateNavForUser();
})();
