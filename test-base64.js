const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://ivnayulkvlxjnwfwjxmj.supabase.co', 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7');
sb.from('products').select('id, img').then(r => {
    let hasBase64 = false;
    for (let p of r.data || []) {
        if (p.img && p.img.startsWith('data:image')) {
            console.log(p.id + ' still has Base64!');
            hasBase64 = true;
        }
    }
    if (!hasBase64) console.log('No base64 found!');
});
