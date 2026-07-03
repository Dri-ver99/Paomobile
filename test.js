const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const supabaseKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';
const supabase = createClient(supabaseUrl, supabaseKey);
async function test() {
  const { data, error } = await supabase.from('products').select('id, img').limit(1);
  console.log('Error:', error);
  console.log('Data length:', data ? data.length : 0);
  if(data && data[0]) console.log('Img type:', typeof data[0].img, 'Img start:', data[0].img ? data[0].img.substring(0, 30) : 'null');
}
test();
