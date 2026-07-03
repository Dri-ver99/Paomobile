const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://ivnayulkvlxjnwfwjxmj.supabase.co', 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7');
async function run() {
  const { data, error } = await supabase.from('users').delete().neq('id', '0');
  console.log("Delete result:", { data, error });
}
run();
