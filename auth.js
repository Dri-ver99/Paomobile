// auth.js - Shared authentication state script
// Reads from localStorage (set by login.html after successful Firebase login)
// and updates the account dropdown in the navbar accordingly.

(function () {
    function updateNavForUser() {
        const userData = localStorage.getItem('paomobile_user');
        if (!userData) return;

        let user;
        try { user = JSON.parse(userData); } catch (e) { return; }
        if (!user || !user.name) return;

        // Find the login link
        const loginLink = document.querySelector('.account-dropdown a.dropdown-item[href="login.html"]');
        if (!loginLink) return;

        // Replace text with first name only (looks cleaner on menu)
        const firstName = user.name.split(' ')[0];

        // Style as a user greeting (not a link)
        loginLink.removeAttribute('href');
        loginLink.style.cursor = 'default';
        loginLink.style.color = '#111';
        loginLink.textContent = '👤 ' + firstName;

        // Add logout link right after if not already there
        if (!document.getElementById('nav-logout-btn')) {
            const logoutLink = document.createElement('a');
            logoutLink.id = 'nav-logout-btn';
            logoutLink.href = 'javascript:void(0)';
            logoutLink.className = 'dropdown-item';
            logoutLink.style.cssText = 'color: #e53e3e !important; font-size: 0.9em; padding-top: 4px;';
            logoutLink.textContent = '← ออกจากระบบ';
            logoutLink.addEventListener('click', function () {
                localStorage.removeItem('paomobile_user');
                window.location.href = 'login.html';
            });
            loginLink.parentNode.insertBefore(logoutLink, loginLink.nextSibling);
        }
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateNavForUser);
    } else {
        updateNavForUser();
    }
})();
