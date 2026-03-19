$pattern = '<a href="[^"]*" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ\s*<span class="arrow">.*?</span></a>'
$replacement = '<a href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">›</span></a>'

Get-ChildItem -Recurse -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -match $pattern) {
        $newContent = [regex]::Replace($content, $pattern, $replacement)
        if ($newContent -ne $content) {
            Set-Content $_.FullName $newContent -Encoding UTF8 -NoNewline
            Write-Output "Updated: $($_.FullName)"
        }
    }
}
