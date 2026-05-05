$jsFiles = Get-ChildItem -Filter "*.js" | Where-Object { $_.Name -notmatch "premium-alerts" }
foreach ($file in $jsFiles) {
    $lines = [System.IO.File]::ReadAllLines($file.FullName, [System.Text.Encoding]::UTF8)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '\balert\s*\(') {
            Write-Host "$($file.Name) : Line $($i+1) : $($lines[$i].Trim())"
        }
    }
}
