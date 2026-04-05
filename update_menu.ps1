$htmlFiles = Get-ChildItem -Path "c:\Users\Lazy\Desktop\Paomobile Web Main\*.html" -Exclude "*.bak", "index_RECOVERED.html", "mobile_chunk.txt", "mega_chunk.txt"

# Read the replacement strings from files to ensure UTF8 integrity
$megaReplacement = [System.IO.File]::ReadAllText("c:\Users\Lazy\Desktop\Paomobile Web Main\mega_chunk.txt", [System.Text.Encoding]::UTF8)
$mobileReplacement = [System.IO.File]::ReadAllText("c:\Users\Lazy\Desktop\Paomobile Web Main\mobile_chunk.txt", [System.Text.Encoding]::UTF8)

foreach ($file in $htmlFiles) {
    Write-Host "Processing $($file.Name)..."
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # --- MEGA MENU ---
    $trigger = 'select-screen-repair.html'
    $megaHeader = '<div class="mega-menu-inner">'
    
    $index = $content.IndexOf($trigger)
    if ($index -ne -1) {
        $mStart = $content.LastIndexOf($megaHeader, $index)
        if ($mStart -ne -1) {
            $mEndIndex = $content.IndexOf('accessory.html', $mStart)
            if ($mEndIndex -ne -1) {
                $c1 = $content.IndexOf('</div>', $mEndIndex)
                $c2 = $content.IndexOf('</div>', $c1 + 1)
                if ($c2 -ne -1) {
                    $c2 += 6
                    $oldBlock = $content.Substring($mStart, $c2 - $mStart)
                    $newBlock = $megaHeader + "`r`n" + $megaReplacement + "`r`n                        </div>"
                    $content = $content.Replace($oldBlock, $newBlock)
                }
            }
        }
    }

    # --- MOBILE MENU ---
    $mobHeader = '<div class="mobile-sub-menu">'
    $currentPos = 0
    while (($currentPos = $content.IndexOf($mobHeader, $currentPos)) -ne -1) {
        $nextMenuPos = $content.IndexOf($mobHeader, $currentPos + 1)
        if ($nextMenuPos -eq -1) { $nextMenuPos = $content.Length }
        
        $subBlock = $content.Substring($currentPos, $nextMenuPos - $currentPos)
        # CORRECT OPERATOR: -like for string pattern matching
        if ($subBlock -like "*$trigger*") {
             $meIndex = $content.IndexOf('accessory.html', $currentPos)
             if ($meIndex -ne -1) {
                 $meClose = $content.IndexOf('</div>', $meIndex)
                 if ($meClose -ne -1) {
                     $meClose += 6
                     $oldMob = $content.Substring($currentPos, $meClose - $currentPos)
                     $content = $content.Replace($oldMob, $mobileReplacement)
                 }
             }
        }
        $currentPos = $nextMenuPos
    }

    [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
}
