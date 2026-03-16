// auth.js - Shared authentication state script
// Reads from localStorage (set by login.html after successful Firebase login)
// and updates the account dropdown/menu in the navbar accordingly.

(function () {
    function updateNavForUser() {
        const userData = localStorage.getItem('paomobile_user');
        console.log("[Auth] Checking user session...", userData ? "Found" : "Not Found");
        if (!userData) return;

        let user;
        try { 
            user = JSON.parse(userData); 
            console.log("[Auth] Session data:", user);
        } catch (e) { 
            console.error("[Auth] Session Corrupted:", e);
            return; 
        }
        
        if (!user || (!user.name && !user.email)) {
            console.warn("[Auth] Incomplete user object found.");
            return;
        }

        const displayName = user.name || (user.email ? user.email.split('@')[0] : 'Member');
        const firstName = displayName.split(' ')[0];

        // 1. UPDATE ALL LOGIN LINKS (Desktop & Mobile)
        // Look for links with href="login.html" OR text matching common login terms
        const loginElements = document.querySelectorAll('a[href*="login.html"], .dropdown-item.bold, .mobile-menu-inner a[href="login.html"]');
        
        loginElements.forEach(el => {
            if (el.textContent.includes('เข้าสู่ระบบ') || el.textContent.includes('สมัครสมาชิก') || el.href.includes('login.html')) {
                console.log("[Auth] Updating element:", el);
                
                // Style as a user greeting
                el.removeAttribute('href');
                el.style.cursor = 'default';
                el.style.color = '#111';
                el.innerHTML = '<span class="user-name">👤 ' + firstName + '</span>';
                el.classList.add('logged-in-user');

                // Add logout link right after if not already there in the same container
                const logoutId = 'logout-' + Math.random().toString(36).substr(2, 5);
                if (!el.parentNode.querySelector('.nav-logout-btn')) {
                    const logoutLink = document.createElement('a');
                    logoutLink.href = 'javascript:void(0)';
                    logoutLink.className = el.className + ' nav-logout-btn';
                    logoutLink.style.cssText = 'color: #e53e3e !important; font-size: 0.9em; padding-top: 4px; display: block;';
                    logoutLink.textContent = '← ออกจากระบบ';
                    logoutLink.addEventListener('click', function (e) {
                        e.preventDefault();
                        handleGlobalLogout();
                    });
                    el.parentNode.insertBefore(logoutLink, el.nextSibling);
                }
            }
        });

        // 2. INJECT INTO MOBILE MENU (If not already there)
        const mobileMenuInner = document.querySelector('.mobile-menu-inner');
        if (mobileMenuInner && !document.getElementById('mobile-user-status')) {
            const userStatus = document.createElement('div');
            userStatus.id = 'mobile-user-status';
            userStatus.style.cssText = 'padding: 15px; background: #f8fafc; border-radius: 12px; margin: 10px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px;';
            userStatus.innerHTML = `
                <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--gold-primary); color: white; display:flex; align-items:center; justify-content:center; font-weight:bold;">
                    ${firstName.charAt(0).toUpperCase()}
                </div>
                <div style="flex:1">
                    <div style="font-size: 0.9em; color: #64748b;">สวัสดีคุณ</div>
                    <div style="font-weight: 600; color: #1e293b;">${firstName}</div>
                </div>
                <a href="javascript:void(0)" id="mobile-logout-trigger" style="color: #e53e3e; font-size: 0.85em; font-weight: 500;">ออกจากระบบ</a>
            `;
            mobileMenuInner.prepend(userStatus);
            
            document.getElementById('mobile-logout-trigger').addEventListener('click', handleGlobalLogout);
        }
    }

    function handleGlobalLogout() {
        console.log("[Auth] Handling global logout...");
        localStorage.setItem('pao_logout_pending', 'true');
        localStorage.removeItem('paomobile_user');
        localStorage.removeItem('pao_cart'); 
        localStorage.removeItem('pao_cart_owner'); 
        window.location.href = 'login.html';
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavForUser);
    } else {
        updateNavForUser();
    }
})();
