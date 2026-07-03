const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ivnayulkvlxjnwfwjxmj.supabase.co', 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7');
async function test() {
    let query = supabase.from('products').select('id');
    const q1 = await query.range(0, 1);
    console.log("q1:", q1.data.length);
    const q2 = await query.range(2, 3);
    console.log("q2:", q2.data ? q2.data.length : q2.error);
}
test();
