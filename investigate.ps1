$cleanIndex = Get-Content 'index.html' -Raw
$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -eq 'index.html') { continue }
    
    $content = Get-Content $file.FullName -Raw
    
    # We will try to replace the broken navbar and footer using regex 
    # capturing the clean blocks from index.html because all files share it
    
    $navRegex = '(?s)<!-- ===== NAVBAR ===== -->.*?<!-- ===== PAGE HEADER ===== -->'
    $footerRegex = '(?s)<!-- ===== FOOTER ===== -->.*?</html>'
    
    $cleanNav = [regex]::Match($cleanIndex, $navRegex).Value
    $cleanFooter = [regex]::Match($cleanIndex, $footerRegex).Value
    
    # But wait, the content in between (like the service cards) is ALSO broken text. 
    # e.g. "เธšเธฃเธดเธ เธฒเธฃเธ‹เนˆเธญเธก"
    
    # We need a proper char replacement map for this specific corruption
    # Actually, if we just run a Node.js script using portable Node or something? Wait, node isn't installed.
    # What if we use a different approach?
    # We have copies of the original files in the git repo or backups? No.
    # We can just manually fix the strings. There aren't that many unique strings.
}
