$tag = '<script src="premium-alerts.js"></script>'
$skip = @('setup-promo1.html','test-firestore.html','cleanup_orders.html','debug-sync.html','diag.html','force_cleanup.html','25-years - Copy.html')
$count = 0

Get-ChildItem -Path . -Filter "*.html" | ForEach-Object {
    $file = $_.FullName
    $name = $_.Name

    if ($skip -contains $name) { return }

    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

    if ($content -match [regex]::Escape($tag)) {
        Write-Host "SKIP (already has it): $name"
        return
    }

    if ($content -match '</body>') {
        $newContent = $content -replace '</body>', "$tag`n</body>"
        [System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
        $count++
        Write-Host "INJECTED: $name"
    } else {
        Write-Host "NO </body> found: $name"
    }
}

Write-Host "`nDone! Injected into $count files."
