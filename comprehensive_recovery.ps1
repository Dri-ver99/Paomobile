
$files = Get-ChildItem -Path "c:\Users\Lazy\Desktop\Paomobile Web Main" -Include *.html, *.js, *.css -Recurse
$enc874 = [System.Text.Encoding]::GetEncoding(874)
$utf8 = [System.Text.Encoding]::UTF8

foreach ($f in $files) {
    try {
        $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
        $hasHighBytes = $false
        foreach ($b in $bytes) { if ($b -gt 127) { $hasHighBytes = $true; break } }
        
        if (-not $hasHighBytes) { continue } # Pure ASCII, no need to fix

        Write-Host "Analyzing $($f.Name)..."
        
        # Try UTF-8
        $s_utf8 = $utf8.GetString($bytes)
        $utf8Errors = ($s_utf8.ToCharArray() | Where-Object { [int]$_ -eq 65533 }).Count
        
        # Try CP874
        $s_874 = $enc874.GetString($bytes)
        
        # Heuristic: If UTF-8 has error characters or looks mangled, and 874 has Thai keywords
        $isMangled = $s_utf8 -match "เน€เธ" -or $s_utf8 -match "เธžเธตเน‰" -or $s_utf8 -match "โ‚ฌ"
        $hasThaiIn874 = $s_874 -match "ซ่อม" -or $s_874 -match "มือถือ" -or $s_874 -match "ร้าน" -or $s_874 -match "ราคา" -or $s_874 -match "สาขา"
        
        if ($utf8Errors -gt 0 -or $isMangled) {
            if ($hasThaiIn874) {
                Write-Host "  -> Recovering from CP874 bytes."
                [System.IO.File]::WriteAllText($f.FullName, $s_874, $utf8)
            } else {
                # Try double-reverse un-mangle if it was mangled UTF-8
                Write-Host "  -> Attempting Double-Reverse Un-mangle."
                try {
                    $unmangled = $utf8.GetString($enc874.GetBytes($s_utf8))
                    if ($unmangled -match "ซ่อม" -or $unmangled -match "มือถือ" -or $unmangled -match "ราคา") {
                        [System.IO.File]::WriteAllText($f.FullName, $unmangled, $utf8)
                        Write-Host "     Success!"
                    } else {
                        Write-Host "     Could not verify recovery. Skipping."
                    }
                } catch {
                    Write-Host "     Failed."
                }
            }
        } elseif ($hasThaiIn874 -and -not ($s_utf8 -match "ซ่อม" -or $s_utf8 -match "มือถือ")) {
             # Case where it's CP874 but valid UTF-8 (rare but possible with some chars)
             Write-Host "  -> Converting CP874 to UTF-8."
             [System.IO.File]::WriteAllText($f.FullName, $s_874, $utf8)
        }

    } catch {
        Write-Host "  Error processing $($f.Name): $($_.Exception.Message)"
    }
}
