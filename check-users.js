const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const supabaseKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('users').select('email, phone, uid, id');
    if (error) {
        console.error("Error:", error);
        return;
    }
    console.log("Found users:");
    data.forEach(u => console.log(u.email || u.phone));
}

check();
