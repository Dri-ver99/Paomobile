const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const supabaseKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';
const sbClient = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing query...');
    const start = Date.now();
    const { data, error } = await sbClient.from('products').select('*').limit(1500);
    const end = Date.now();
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(Success! Fetched  products in ms);
    }
}
test();
