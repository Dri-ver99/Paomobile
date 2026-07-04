$content = Get-Content 'c:/Users/Lazy/Desktop/Paomobile Web Main/script.js' -Raw
$url = ''
$key = ''
if ($content -match 'SUPABASE_URL\s*=\s*[''"]([^''"]+)[''"]') { $url = $matches[1] }
if ($content -match 'SUPABASE_ANON_KEY\s*=\s*[''"]([^''"]+)[''"]') { $key = $matches[1] }
if ($url -and $key) {
    $headers = @{ 'apikey' = $key; 'Authorization' = 'Bearer ' + $key }
    $response = Invoke-RestMethod -Uri "$url/rest/v1/chat_messages?select=*&type=eq.card&order=timestamp_ms.desc&limit=5" -Headers $headers
    $response | ConvertTo-Json -Depth 5
} else { 'Keys not found' }
