// supabase-config.js — Initializes Supabase client for Seller Centre pages
// Loaded AFTER the Supabase CDN script tag
(function() {
    const SUPABASE_URL = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';

    // Guard: only create once
    if (window.supabaseClient) return;

    // The CDN UMD script exposes `supabase` globally with a `.createClient` method
    const sbLib = (typeof supabase !== 'undefined') ? supabase : window.supabase;
    if (!sbLib || !sbLib.createClient) {
        console.error('[supabase-config] Supabase SDK not loaded! Make sure the CDN script tag is before this file.');
        return;
    }

    window.supabaseClient = sbLib.createClient(SUPABASE_URL, SUPABASE_KEY);
    // Also set legacy aliases for compatibility with other scripts (db.js, script.js, etc.)
    window.supabaseClientInstance = window.supabaseClient;
    window.supabase = window.supabaseClient;

    console.log('[supabase-config] ✅ Supabase client initialized successfully');
})();
