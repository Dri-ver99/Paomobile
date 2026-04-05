$desktopHTML = [System.IO.File]::ReadAllText('C:\Users\Lazy\Desktop\Paomobile Web Main\desktop_chunk.txt', [System.Text.Encoding]::UTF8)
$mobileHTML = [System.IO.File]::ReadAllText('C:\Users\Lazy\Desktop\Paomobile Web Main\mobile_chunk.txt', [System.Text.Encoding]::UTF8)

# The regex uses the id/href which is English only!
# For desktop, we replace the entire <li> element. 
$desktopRegexStr = '(?s)<li class="has-mega-menu">\s*<a href="index\.html#services">.{1,20}</a>.*?</li>'

# For mobile, we replace the specific wrapper block.
$mobileRegexStr = '(?s)(<div class="mobile-menu-inner">.*?<a href="index\.html">.{1,20}</a>\s*)<div class="menu-item-wrapper">.*?<div class="mobile-sub-menu">.*?</div>\s*</div>'

$dRegex = [regex]$desktopRegexStr
$mRegex = [regex]$mobileRegexStr

$htmlFiles = Get-ChildItem -Path "C:\Users\Lazy\Desktop\Paomobile Web Main" -Filter "*.html"
$modCount = 0

foreach ($file in $htmlFiles) {
    if ($file.Name -match "index_RECOVERED") { continue }
    
    $fileContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $fileContent
    
    $fileContent = $dRegex.Replace($fileContent, $desktopHTML)
    # the mobile replacement needs to include the Group 1 match (the stuff before it)
    $fileContent = $mRegex.Replace($fileContent, "`$1" + $mobileHTML)
    
    if ($fileContent -ne $original) {
        $modCount++
        [System.IO.File]::WriteAllText($file.FullName, $fileContent, [System.Text.Encoding]::UTF8)
    }
}
Write-Host "Done. Modified $modCount files."
