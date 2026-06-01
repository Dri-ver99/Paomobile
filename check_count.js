const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('db.js', 'utf8');
const urlMatch = code.match(/const SUPABASE_URL = '(.*?)'/);
const keyMatch = code.match(/const SUPABASE_ANON_KEY = '(.*?)'/);
if(urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1], keyMatch[1]);
    supabase.from('products').select('id', { count: 'exact', head: true }).then(res => {
        console.log('Count:', res.count, 'Error:', res.error);
    });
} else {
    console.log('Cannot find keys');
}
