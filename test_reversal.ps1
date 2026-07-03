$cp874 = [System.Text.Encoding]::GetEncoding(874)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)

# Build a reverse map: Char -> Byte
$reverseMap = @{}

# Map 0x00 - 0xFF using CP874
$bytes = [byte[]](0..255)
$chars874 = $cp874.GetChars($bytes)
for ($i = 0; $i -lt 256; $i++) {
    $c = $chars874[$i]
    if ($c -ne '?') {
        $reverseMap[[int]$c] = [byte]$i
    }
}

# Override 0x80 - 0x9F using CP1252 (because the user's editor fell back to CP1252 for undefined CP874 bytes)
$chars1252 = $cp1252.GetChars($bytes)
for ($i = 0x80; $i -le 0x9F; $i++) {
    $c = $chars1252[$i]
    if ($c -ne '?') {
        $reverseMap[[int]$c] = [byte]$i
    }
}

# Now reverse a test string!
$testMojibake = "เธ‹เนˆเธญเธกเธกเธทเธญเธ–เธทเธญ"
$list = New-Object System.Collections.Generic.List[byte]
foreach ($c in $testMojibake.ToCharArray()) {
    if ($reverseMap.ContainsKey([int]$c)) {
        $list.Add($reverseMap[[int]$c])
    } else {
        Write-Host "Unmappable char: $([int]$c)"
    }
}

$originalUtf8 = [System.Text.Encoding]::UTF8.GetString($list.ToArray())
Write-Host "Reversed text: $originalUtf8"
