/**
 * seller-presence.js (Supabase Version)
 * Manages the real-time online/away status for the seller.
 * Included in all Seller Centre pages to ensure consistent "Online" status for customers.
 */
(function() {
    async function startSellerPresence() {
        const supabase = window.supabaseClient;
        if (!supabase) return;

        let isUpdating = false;

        const updateStatus = async (isOnline) => {
            if (isUpdating) return;
            isUpdating = true;
            
            try {
                let email = 'guest-admin';
                const { data: { user } } = await supabase.auth.getUser();
                if (user) email = user.email;

                await supabase.from('status').upsert({
                    id: 'seller',
                    isOnline: isOnline,
                    lastSeen: new Date().toISOString(),
                    email: email
                });
                
                console.log(`[Presence] Seller ${isOnline ? 'ONLINE' : 'AWAY'} (${window.location.pathname.split('/').pop()})`);
            } catch (e) {
                // Silently fail
            } finally {
                isUpdating = false;
            }
        };

        // 1. Initial Heartbeat
        updateStatus(true);

        // 2. Periodic Heartbeat (Every 3 minutes)
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                updateStatus(true);
            }
        }, 180000); // 3 minutes

        // 3. Handle Offline/Online browser events
        window.addEventListener('online', () => updateStatus(true));
    }

    async function startGlobalChatBadgeSync() {
        const supabase = window.supabaseClient;
        if (!supabase) return;

        const updateBadge = async () => {
            const { count, error } = await supabase.from('chats')
                .select('*', { count: 'exact', head: true })
                .gt('unreadCount', 0);
                
            if (error) {
                console.warn("[GlobalBadgeSync] Error:", error);
                return;
            }
            const badge = document.getElementById('chat-unread-total');
            if (badge) {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        };

        await updateBadge();
        supabase.channel('chats-badge')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
                updateBadge();
            })
            .subscribe();
    }

    async function startGlobalOrderBadgeSync() {
        const supabase = window.supabaseClient;
        if (!supabase) return;
        
        const updateBadge = async () => {
            const { count, error } = await supabase.from('orders')
                .select('*', { count: 'exact', head: true })
                .in('status', ['รอชำระเงิน', 'รอตรวจสอบ', 'ที่ต้องจัดส่ง', 'เตรียมจัดส่งแล้ว']);
                
            if (error) return;
            
            const badges = document.querySelectorAll('.order-count-badge');
            badges.forEach(badge => {
                if (count > 0) {
                    badge.textContent = count;
                    badge.style.display = 'inline-block';
                } else {
                    badge.style.display = 'none';
                }
            });
        };

        await updateBadge();
        supabase.channel('orders-badge')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                updateBadge();
            })
            .subscribe();
    }

    // Auto-start when Supabase is ready
    const checkPresenceDb = setInterval(() => {
        if (window.supabaseClient) {
            clearInterval(checkPresenceDb);
            startSellerPresence();
            startGlobalChatBadgeSync();
            startGlobalOrderBadgeSync();
        }
    }, 500);
})();



// Sidebar Active State Logic
function initSidebarActiveStates() {
    try {
        const currentPath = window.location.pathname.split('/').pop() || 'seller-centre.html';
        const currentQuery = window.location.search;
        const currentURL = currentPath + currentQuery;
        const sidebarLinks = document.querySelectorAll('.sidebar-menu .menu-item, .sidebar-menu .menu-item-home, .mobile-sidebar .menu-item');
        let bestMatch = null;
        let bestScore = -1;
        sidebarLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (!href || href.startsWith('javascript:')) return;
            if (href === currentURL) {
                bestMatch = link;
                bestScore = 2;
            } else if (href === currentPath && bestScore < 1) {
                bestMatch = link;
                bestScore = 1;
            }
        });
        if (bestMatch) {
            bestMatch.classList.add('active');
            const targetHref = bestMatch.getAttribute('href');
            sidebarLinks.forEach(l => {
                if (l.getAttribute('href') === targetHref) l.classList.add('active');
            });
        }
    } catch(e) { console.warn('Sidebar highlight error:', e); }
}
window.updateSidebarActiveState = initSidebarActiveStates;
document.addEventListener('DOMContentLoaded', initSidebarActiveStates);
