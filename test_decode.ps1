$corrupted = "เน€เธ˜เธŸ"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($corrupted)
# Let's see what happens if we treat these bytes as windows-1252? No, the string "เน€เธ˜เธŸ" is what we see.
# The original bytes were UTF-8. PowerShell read them with Windows-874 default encoding, so they became Windows-874 characters.
# Then they were saved as UTF-8.
# To reverse:
# 1. Read the corrupted string.
# 2. Convert it back to bytes using Windows-874 encoding.
# 3. Read those bytes using UTF-8 encoding.

$win874 = [System.Text.Encoding]::GetEncoding(874)
$utf8 = [System.Text.Encoding]::UTF8

$fixed1 = $utf8.GetString($win874.GetBytes("เน€เธ˜เธŸ6,900"))
Write-Host "Decode 874: $fixed1"

$win1252 = [System.Text.Encoding]::GetEncoding(1252)
$fixed2 = $utf8.GetString($win1252.GetBytes("เน€เธ˜เธŸ6,900"))
Write-Host "Decode 1252: $fixed2"

$utf8bytes = $utf8.GetBytes("เน€เธ˜เธŸ6,900")
$fixed3 = $utf8.GetString($utf8bytes)
Write-Host "Decode UTF8->UTF8: $fixed3"

$fixed4 = $win874.GetString($utf8.GetBytes("เน€เธ˜เธŸ6,900"))
Write-Host "Decode UTF8->874: $fixed4"
