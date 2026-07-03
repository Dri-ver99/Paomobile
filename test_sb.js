const sbUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const sbKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';

fetch(`${sbUrl}/rest/v1/promotions?select=*`, {
    headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`
    }
})
.then(res => res.json())
.then(data => {
    console.log("Response:", data);
})
.catch(err => console.error("Error:", err));
