const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const code = fs.readFileSync('c:/Users/Lazy/Desktop/Paomobile Web Main/db.js', 'utf8');
const urlMatch = code.match(/const SUPABASE_URL = '(.*?)'/);
const keyMatch = code.match(/const SUPABASE_KEY = '(.*?)'/);

if (!urlMatch || !keyMatch) {
    console.error("Could not find Supabase credentials");
    process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function run() {
    console.log("Fetching products...");
    const { data: products, error } = await supabase.from('products').select('id, img');
    if (error) { console.error("Error", error); return; }
    
    console.log(Found  products.);
    let migratedCount = 0;
    
    for (const p of products) {
        if (p.img && p.img.startsWith('data:image')) {
            console.log(Migrating ID ...);
            try {
                const base64Data = p.img.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = products/migrated__.jpg;
                
                const { error: uploadError } = await supabase.storage.from('images').upload(fileName, buffer, { contentType: 'image/jpeg' });
                if (uploadError) {
                    console.error("  Upload error:", uploadError.message);
                    continue;
                }
                
                const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
                const publicUrl = urlData.publicUrl;
                
                const { error: updateError } = await supabase.from('products').update({ img: publicUrl, images: [publicUrl] }).eq('id', p.id);
                if (updateError) {
                    console.error("  Update error:", updateError.message);
                } else {
                    console.log("  Success:", publicUrl);
                    migratedCount++;
                }
            } catch(e) {
                console.error("  Exception:", e.message);
            }
        }
    }
    console.log(Migration complete! Migrated  products.);
}

run();
