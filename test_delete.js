const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const code = fs.readFileSync('db.js', 'utf8');
const urlMatch = code.match(/const SUPABASE_URL = '(.*?)'/);
const keyMatch = code.match(/const SUPABASE_ANON_KEY = '(.*?)'/);
if(urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1], keyMatch[1]);
    
    // Fetch a sample order
    supabase.from('orders').select('id').limit(1).then(res => {
        if(res.data && res.data.length > 0) {
            console.log('Sample Order ID:', res.data[0].id);
        } else {
            console.log('No orders found:', res.error);
        }
    });
}
