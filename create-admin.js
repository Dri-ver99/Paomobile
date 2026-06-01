const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const supabaseKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    console.log("Registering sattawat2560@gmail.com...");
    const { data, error } = await supabase.auth.signUp({
        email: 'sattawat2560@gmail.com',
        password: 'Admin1234!',
        options: {
            data: {
                name: 'Admin'
            }
        }
    });

    if (error) {
        console.error("Error creating user:", error);
    } else {
        console.log("Success! User ID:", data.user?.id);
    }
}

createAdmin();
