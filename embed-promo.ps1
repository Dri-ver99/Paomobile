$imgPath  = Join-Path $PSScriptRoot "Promotion-1.jpg"
$htmlPath = Join-Path $PSScriptRoot "setup-promo1.html"

$b64     = [System.Convert]::ToBase64String([System.IO.File]::ReadAllBytes($imgPath))
$dataUrl = "data:image/jpeg;base64," + $b64

# Read the template (written by write_to_file with proper UTF-8)
$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

# Replace placeholder
$html = $html.Replace("__IMG_DATA__", $dataUrl)

# Write back with UTF-8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($htmlPath, $html, $utf8NoBom)

$size = (Get-Item $htmlPath).Length
Write-Host "Done! File size: $size bytes"
