$goldStandard = '<div class="footer-col"><h4>บริการเสริม</h4><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%9F%E0%B8%B4%E0%B8%A5%E0%B9%8C%E0%B8%A1%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%88%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ติดฟิล์มกระจก</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20%2F%20%E0%B8%A5%E0%B8%87%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B9%81%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ล้างเครื่อง / ลงโปรแกรม</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%81%E0%B8%B9%E0%B9%82%E0%B8%82%E0%B9%8A%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">กู้ข้อมูล</a><a href="accessory.html">เคส / อุปกรณ์เสริม</a></div>'

$files = Get-ChildItem -Filter *.html
$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding utf8
    $modified = $false
    
    # Replace the "Additional Services" column using regex to catch both normal and Mojibake versions
    $pattern = '(?s)<div class="footer-col"><h4>(?:บริการเสริม|เธšเธฃเธดเธ เธฒเธฃเน€\s?เธชเน€เธฃเธดเธก|เธšเธฃเธดเธ เธฒเธฃเน€เธชเธฃเธดเธก)</h4>.*?</div>'
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $goldStandard)
        $modified = $true
    }
    
    # Fix other corrupted headers if individual replacement is needed
    if ($content -contains 'เธšเธฃเธดเธ เธฒเธฃ') {
        $content = $content.Replace('เธšเธฃเธดเธ เธฒเธฃ', 'บริการ')
        $modified = $true
    }
    if ($content -contains 'เธ•เธดเธ”เธ•เนˆเธญเน€เธฃเธฒ') {
        $content = $content.Replace('เธ•เธดเธ”เธ•เนˆเธญเน€เธฃเธฒ', 'ติดต่อเรา')
        $modified = $true
    }

    if ($modified) {
        Set-Content $file.FullName -Value $content -Encoding utf8
        Write-Host "✅ Fixed: $($file.Name)"
        $count++
    }
}

Write-Host "`nDone! Fixed $count files."
