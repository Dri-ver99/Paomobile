
# Define the replacements map, ordered from longest to shortest keys to avoid partial matches
$replacements = [ordered]@{
    'เธฅเน‰เธฒเธ‡เน€เธ„เธฃเธทเนˆเธญเธ‡ / เธฅเธ‡เน‚เธ›เธฃเน เธ เธฃเธก' = 'ล้างเครื่อง / ลงโปรแกรม'
    'เน€เธ„เธส / เธญเธธเธ›เธ เธฃเธ“เนŒเน€เธชเธฃเธดเธก' = 'เคส / อุปกรณ์เสริม'
    'เธšเธฃเธดเธ เธฒเธฃเน€เธชเธฃเธดเธก' = 'บริการเสริม'
    'เธ•เธดเธ”เธŸเธดเธฅเนŒเธกเธ เธฃเธฐเธˆเธ ' = 'ติดฟิล์มกระจก'
    'เธ เธนเน‰เธ‚เน‰เธญเธกเธนเธฅ' = 'กู้ข้อมูล'
    'เธšเธฃเธดเธ เธฒเธฃ' = 'บริการ'
}

$filesFixed = 0
# Get all HTML files recursively
Get-ChildItem -Path . -Filter *.html -Recurse | ForEach-Object {
    $filePath = $_.FullName
    try {
        # Try reading as UTF-8 first (common for these files)
        $encoding = New-Object System.Text.UTF8Encoding($false)
        $content = [System.IO.File]::ReadAllText($filePath, $encoding)
        $modified = $false
        
        # Apply replacements
        foreach ($key in $replacements.Keys) {
            if ($content.Contains($key)) {
                $content = $content.Replace($key, $replacements[$key])
                $modified = $true
            }
        }

        if ($modified) {
            # Save as UTF-8 without BOM
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($filePath, $content, $utf8NoBom)
            Write-Host "✅ Fixed encoding in: $($_.Name)"
            $filesFixed++
        }
    } catch {
        Write-Host "❌ Error processing $($_.Name): $($_.Exception.Message)"
    }
}

Write-Host "`nTotal $filesFixed files updated!"
