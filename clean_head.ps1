$clean = Get-Content 'index.html' -Raw

# Grab the clean title block
$titleStart = "<title>"
$titleEnd = "</title>"
$cleanTitleStr = $clean.Substring($clean.IndexOf($titleStart), $clean.IndexOf($titleEnd) - $clean.IndexOf($titleStart) + $titleEnd.Length)

# Grab the clean meta description block
$descStart = '<meta name="description"'
$descEnd = ' />'
$cleanDescStr = "  " + $clean.Substring($clean.IndexOf($descStart), $clean.IndexOf($descEnd, $clean.IndexOf($descStart)) - $clean.IndexOf($descStart) + $descEnd.Length)

$files = Get-ChildItem -Filter *.html
foreach ($f in $files) {
    if ($f.Name -eq 'index.html') { continue }
    
    $c = Get-Content $f.FullName -Raw
    
    # Notice that the exact title and description differ by brand, but since the translations were universally broken,
    # the easiest repair without manual per-file work is just to assign them all a clean generic title for now, 
    # OR replace only the broken fragments using proper Base64 strings to avoid PowerShell syntax failure.
    
    # Wait, powershell hash literals break because the characters look like quotes or operators.
    # What if we put them in a text file and read from it?
    
}
