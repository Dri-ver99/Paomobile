const SUPABASE_URL = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';

// Initialize only once
if (!window.supabase && typeof supabase !== 'undefined') {
    window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else if (!window.supabase) {
    console.error("Supabase SDK not loaded before supabase-init.js!");
}
