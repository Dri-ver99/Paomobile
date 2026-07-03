$enc = [System.Text.Encoding]::GetEncoding(874)
$allBytes = [byte[]](0..255)
$allChars = $enc.GetChars($allBytes)
$map = @{}
for ($i = 0; $i -lt 256; $i++) {
    $map[[int]$allChars[$i]] = [byte]$i
}

$files = Get-ChildItem -Path . -Include *.html,*.js -Recurse
foreach ($f in $files) {
    # Read the corrupted file as UTF-8
    $corruptedBytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $str = [System.Text.Encoding]::UTF8.GetString($corruptedBytes)
    
    # We will build the original UTF-8 bytes array
    $list = New-Object System.Collections.Generic.List[byte]
    
    # The first char might be BOM
    $start = 0
    if ($str.Length -gt 0 -and [int]$str[0] -eq 65279) {
        $start = 1
        # Add BOM bytes manually
        $list.Add(0xEF)
        $list.Add(0xBB)
        $list.Add(0xBF)
    }
    
    $valid = $true
    for ($i = $start; $i -lt $str.Length; $i++) {
        $charCode = [int]$str[$i]
        if ($map.ContainsKey($charCode)) {
            $list.Add($map[$charCode])
        } else {
            # Character was not in the CP874 mapping!
            # This means it might not be Mojibake, or it's a completely different corruption.
            # But wait, some characters could be outside the CP874 range if they were inserted AFTER corruption.
            # E.g., if I inserted Supabase code? The Supabase code is standard ASCII, which is in CP874.
            # What if there are emojis? Emojis would not be mapped.
            Write-Host "Warning: unmappable char $charCode in $($f.Name)"
            $valid = $false
            break
        }
    }
    
    if ($valid) {
        [System.IO.File]::WriteAllBytes($f.FullName, $list.ToArray())
        Write-Host "Fixed $($f.Name)"
    }
}
