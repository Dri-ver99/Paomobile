$exclude = @("index.html", "promotions.html", "25-years.html", "login.html", "reset-password.html")
Get-ChildItem -Path "c:\Users\Lazy\Desktop\Paomobile Web Main\*.html" | ForEach-Object {
    if ($exclude -notcontains $_.Name) {
        $filePath = $_.FullName
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        # 874 is Windows-874 (Thai)
        $encoding = [System.Text.Encoding]::GetEncoding(874)
        $text = $encoding.GetString($bytes)
        [System.IO.File]::WriteAllText($filePath, $text, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed encoding for $($_.Name)"
    }
}
