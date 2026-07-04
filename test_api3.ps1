$url = 'https://ivnayulkvlxjnwfwjxmj.supabase.co'
$key = 'sb_publishable_ZZPe_GiGq-5W780KOI64yg_zzsjWvq7'
$headers = @{ 'apikey' = $key; 'Authorization' = 'Bearer ' + $key }
$chatId = [uri]::EscapeDataString("ซารายาพาราด")
$response = Invoke-RestMethod -Uri "$url/rest/v1/chat_messages?select=*&chatId=eq.$chatId&order=timestamp_ms.desc&limit=20" -Headers $headers
$response | ConvertTo-Json -Depth 5
