// auth.js - Shared authentication state script
// Synchronizes UI across pages for logged-in users using Firebase Auth + localStorage.

(function () {
    const AUTH_KEY = 'paomobile_user';
    const SELLER_EMAIL = 'sattawat2560@gmail.com';

    // 1. Initial UI setup from local storage (Fast)
    function initUI() {
        updateNavForUser();
        
        // 2. Setup Firebase Sentry (Wait for db.js to initialize)
        const checkFirebase = setInterval(() => {
            if (window.firebaseAuth && window.auth) {
                clearInterval(checkFirebase);
                setupFirebaseObserver();
            }
        }, 500);
        
        // Kill check after 10s if Firebase doesn't load (failsafe)
        setTimeout(() => clearInterval(checkFirebase), 10000);
    }

    function setupFirebaseObserver() {
        const { onAuthStateChanged } = window.firebaseAuth;
        const auth = window.auth;

        console.log("[Auth] Firebase Sentry Active.");

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("[Auth] Firebase: Logged In (" + user.email + ")");
                
                // Fetch/Sync profile from Firestore if needed
                let displayName = user.displayName;
                let email = user.email || "";
                
                // If it's a phone number masked as email
                if (email.endsWith('@paomobile.auth')) {
                    email = email.split('@')[0];
                    displayName = email;
                }

                const userData = {
                    uid: user.uid,
                    name: displayName || email.split('@')[0] || 'Member',
                    email: email,
                    photo: user.photoURL || "",
                    isVerified: user.emailVerified || user.providerData.some(p => p.providerId === 'google.com') || email.length === 10
                };

                // Only update and refresh if the data actually changed
                const currentLocal = localStorage.getItem(AUTH_KEY);
                if (currentLocal !== JSON.stringify(userData)) {
                    localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
                    updateNavForUser();
                }
            } else {
                console.log("[Auth] Firebase: Logged Out");
                if (localStorage.getItem(AUTH_KEY)) {
                    localStorage.removeItem(AUTH_KEY);
                    updateNavForUser();
                }
            }
        });
    }

    function updateNavForUser() {
        const userDataString = localStorage.getItem(AUTH_KEY);
        const mobileMenu = document.querySelector('.mobile-menu-inner');
        
        let user;
        try {
            user = userDataString ? JSON.parse(userDataString) : null;
        } catch (e) {
            user = null;
        }

        // Only show member UI if verified (or skip verification for guests)
        const isFullyLoggedIn = user && user.name && user.isVerified;

        if (!isFullyLoggedIn) {
            // Cleanup: remove dynamic elements if state changed
            document.querySelectorAll('.is-logged-in, .dynamic-logout, #mobile-auth-header').forEach(el => el.remove());
            document.querySelectorAll('.account-icon-btn').forEach(el => {
                el.setAttribute('href', 'login.html');
                el.style.cursor = 'pointer';
            });

            // Add Login link to Mobile Menu if missing
            if (mobileMenu && !mobileMenu.querySelector('a[href*="login.html"]')) {
                const loginLink = document.createElement('a');
                loginLink.href = 'login.html';
                loginLink.innerHTML = '👤 เข้าสู่ระบบ / สมัครสมาชิก';
                loginLink.style.cssText = 'font-weight: 600; color: var(--gold-primary); border-top: 1px solid #f1f5f9; margin-top: 10px; padding-top: 15px; display: flex !important; justify-content: center; align-items: center; gap: 8px; width: 100%;';
                mobileMenu.appendChild(loginLink);
            }
            return;
        }

        // --- Logged In UI ---
        const firstName = user.name.split(' ')[0];
        
        const allLinks = document.querySelectorAll('a[href*="login.html"], .account-dropdown .dropdown-item.bold, .mobile-menu a[href*="login.html"]');
        const accountIcon = document.querySelector('.account-icon-btn');

        if (accountIcon) {
            accountIcon.setAttribute('href', 'javascript:void(0)');
            accountIcon.style.cursor = 'default';
        }

        allLinks.forEach(el => {
            if (el.classList.contains('is-logged-in')) return;

            const text = el.textContent || "";
            if (text.includes('เข้าสู่ระบบ') || text.includes('สมัครสมาชิก') || el.classList.contains('bold')) {
                el.removeAttribute('href');
                el.style.cursor = 'default';
                el.style.color = 'var(--text-main, #111)';
                el.innerHTML = `<span class="user-greeting">👤 ${firstName}</span>`;
                el.classList.add('is-logged-in');

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

    async function handleLogout(e) {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log("[Auth] Logging out...");
        
        if (window.firebaseAuth && window.auth) {
            try {
                await window.firebaseAuth.signOut(window.auth);
            } catch (err) {
                console.error("[Auth] Firebase signOut failed:", err);
            }
        }
        
        localStorage.removeItem(AUTH_KEY);
        window.location.href = 'login.html';
    }

    // --- Boot ---
    const observer = new MutationObserver(() => updateNavForUser());

    window.addEventListener('load', () => {
        initUI();
        observer.observe(document.body, { childList: true, subtree: true });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initUI);
    } else {
        initUI();
    }
})();
