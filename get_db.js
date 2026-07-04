const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const content = fs.readFileSync('./script.js', 'utf8');

const urlMatch = content.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = content.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if(urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1], keyMatch[1]);
    supabase.from('chat_messages').select('*').order('timestamp_ms', {ascending: false}).limit(10).then(res => {
        console.log(JSON.stringify(res.data, null, 2));
    });
} else {
    console.log('Keys not found');
}
