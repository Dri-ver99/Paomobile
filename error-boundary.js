/**
 * Paomobile Global Error Boundary & Resilience System
 * v1.0.0 — Prevents single script failures from crashing the entire UI.
 */
(function() {
    window.addEventListener('error', function(event) {
        // Log to console for debugging
        console.error('🔥 Paomobile Global Error caught:', {
            message: event.message,
            source: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });

        // Visual notification removed per user request (was annoying on non-critical errors)
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.warn('⚡ Unhandled Promise Rejection:', event.reason);
    });

    // Add CSS for fade-in
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pb-fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    console.log('🛡️ Paomobile Error Boundary Active.');
})();
