$targetDir = "c:\Users\Lazy\Desktop\Paomobile Web Main"
$files = Get-ChildItem -Path $targetDir -Filter *.html
# This regex matches the link even if the arrow character is different
$regex = '<a href="javascript:void\(0\)" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">.</span></a>'
$replacement = '<a href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">›</span></a>'

$count = 0
foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    if ($content -match $regex) {
        $newContent = $content -replace $regex, $replacement
        $newContent | Set-Content -Path $file.FullName -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
        $count++
    }
}
Write-Host "Total files updated: $count"
