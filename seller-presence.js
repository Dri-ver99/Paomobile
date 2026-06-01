/**
 * seller-presence.js
 * Manages the real-time online/away status for the seller.
 * Included in all Seller Centre pages to ensure consistent "Online" status for customers.
 */
(function() {
    async function startSellerPresence() {
        if (typeof db === 'undefined' || !db) return;

        let isUpdating = false;

        const updateStatus = async (isOnline) => {
            if (isUpdating) return;
            isUpdating = true;
            
            try {
                // Supabase doesn't need firebase auth here since we update a public setting or RPC
                const userEmail = localStorage.getItem('paomobile_user') ? JSON.parse(localStorage.getItem('paomobile_user')).email : 'guest-admin';
                
                await window.supabase.from('settings').upsert({
                    id: 'seller_status',
                    value: {
                        isOnline: isOnline,
                        lastSeen: new Date().toISOString(),
                        platform: 'web-seller-centre',
                        url: window.location.pathname.split('/').pop(),
                        email: userEmail
                    }
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

        // 2. Periodic Heartbeat (Every 3 minutes) to heavily reduce Writes Quota
        // Only update if the document is visible to prevent unnecessary writes while tab is in background
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                updateStatus(true);
            }
        }, 180000); // 3 minutes

        // 3. Handle Offline/Online browser events
        window.addEventListener('online', () => updateStatus(true));
        // We don't set false on offline immediately because it might be a temporary blip
        // and the heartbeat will stop anyway if the connection is truly lost.
    }

    function startGlobalChatBadgeSync() {
        if (!window.supabase) return;
        
        const fetchBadge = async () => {
            const { data } = await window.supabase.from('chats').select('*').gt('unreadCount', 0);
            const badge = document.getElementById('chat-unread-total');
            if (badge) {
                if (data && data.length > 0) {
                    badge.textContent = data.length;
                    badge.style.display = 'block';
                } else {
                    badge.style.display = 'none';
                }
            }
        };
        fetchBadge();
        window.supabase.channel('public:chats_global_badge')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchBadge)
            .subscribe();
    }

    // Auto-start when DB is ready
    const checkPresenceDb = setInterval(() => {
        if (typeof db !== 'undefined' && db) {
            clearInterval(checkPresenceDb);
            startSellerPresence();
            startGlobalChatBadgeSync();
        }
    }, 500);
})();
