const sbUrl = 'https://ivnayulkvlxjnwfwjxmj.supabase.co';
const sbKey = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7';

fetch(`${sbUrl}/rest/v1/promotions`, {
    method: 'POST',
    headers: {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify({
        id: "promo_test1",
        title: "Test",
        description: JSON.stringify({ subDesc: "test" }),
        img: "",
        discount: 0
    })
})
.then(res => res.json())
.then(data => {
    console.log("Response:", data);
})
.catch(err => console.error("Error:", err));
