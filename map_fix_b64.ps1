# We will Base64 encode the bad strings and good strings to avoid ANY parser issues.

function Rep($content, $b64Bad, $b64Good) {
    $badBytes = [System.Convert]::FromBase64String($b64Bad)
    $goodBytes = [System.Convert]::FromBase64String($b64Good)
    
    $badStr = [System.Text.Encoding]::UTF8.GetString($badBytes)
    $goodStr = [System.Text.Encoding]::UTF8.GetString($goodBytes)
    
    return $content.Replace($badStr, $goodStr)
}

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -eq 'index.html') { continue }
    
    $c = Get-Content $file.FullName -Raw
    
    # Text Mapping via Base64 (so the script file itself is clean ASCII)
    
    # บริการซ่อม (เธšเธฃเธดเธ เธฒเธฃเธ‹เนˆเธญเธก) 
    $c = Rep $c "4LiK4LiA4Li04LiB4Liy4LiA4LiL4Lia4LiI4LiB4LiB4Lia" "4Lia4Lij4Li04LiB4Liy4Lij4LiL4LmI4Lit4Lih"
    # ครบวงจร 
    $c = Rep $c "4LiE4Lij4Lia4Lin4LiH4LiI4Lij" "4LiE4Lij4Lia4Lin4LiH4LiI4Lij" # Oh wait I need the actual bad bytes. Let's just automate it in a different way.
}
