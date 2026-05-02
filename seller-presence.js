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
                // Ensure we have Auth instance if needed, but here we just need Firestore
                const user = firebase.auth().currentUser;
                const statusRef = db.collection('status').doc('seller');
                
                await statusRef.set({
                    isOnline: isOnline,
                    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
                    platform: 'web-seller-centre',
                    url: window.location.pathname.split('/').pop(),
                    email: user ? user.email : 'guest-admin'
                }, { merge: true });
                
                console.log(`[Presence] Seller ${isOnline ? 'ONLINE' : 'AWAY'} (${window.location.pathname.split('/').pop()})`);
            } catch (e) {
                // Silently fail
            } finally {
                isUpdating = false;
            }
        };

        // 1. Initial Heartbeat
        updateStatus(true);

        // 2. Periodic Heartbeat (Every 45 seconds)
        // Keep online even if in background, as long as the tab is open
        setInterval(() => {
            updateStatus(true);
        }, 45000);

        // 3. Handle Offline/Online browser events
        window.addEventListener('online', () => updateStatus(true));
        // We don't set false on offline immediately because it might be a temporary blip
        // and the heartbeat will stop anyway if the connection is truly lost.
    }

    // Auto-start when DB is ready
    const checkPresenceDb = setInterval(() => {
        if (typeof db !== 'undefined' && db) {
            clearInterval(checkPresenceDb);
            startSellerPresence();
        }
    }, 500);
})();
