$filePath = "c:\Users\Lazy\Desktop\Paomobile Web Main\promotions.html"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$tis620 = [System.Text.Encoding]::GetEncoding(874)
$text = $tis620.GetString($bytes)
[System.IO.File]::WriteAllText($filePath, $text, [System.Text.Encoding]::UTF8)
Write-Host "Fixed encoding for $filePath"
