$url = 'https://ivnayulkvlxjnwfwjxmj.supabase.co'
$key = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7'
$headers = @{ 'apikey' = $key; 'Authorization' = 'Bearer ' + $key }
$response = Invoke-RestMethod -Uri "$url/rest/v1/chat_messages?chatId=eq.sattawat2560@gmail.com&select=id" -Headers $headers
$response.Count
