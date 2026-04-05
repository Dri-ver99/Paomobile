$desktopHTML = [System.IO.File]::ReadAllText('C:\Users\Lazy\Desktop\Paomobile Web Main\desktop_chunk.txt', [System.Text.Encoding]::UTF8)
$mobileHTML = [System.IO.File]::ReadAllText('C:\Users\Lazy\Desktop\Paomobile Web Main\mobile_chunk.txt', [System.Text.Encoding]::UTF8)

$desktopRegexStr = '(?s)<li class="has-mega-menu">\s*<a href="index\.html#services">บริการ</a>.*?</li>'
$mobileRegexStr = '(?s)<div class="menu-item-wrapper">\s*<div class="menu-item-parent">บริการ</div>.*?</div>\s*</div>'

$dRegex = [regex]$desktopRegexStr
$mRegex = [regex]$mobileRegexStr

$htmlFiles = Get-ChildItem -Path "C:\Users\Lazy\Desktop\Paomobile Web Main" -Filter "*.html"
$modCount = 0

foreach ($file in $htmlFiles) {
    $fileContent = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    $original = $fileContent
    
    $fileContent = $dRegex.Replace($fileContent, $desktopHTML)
    $fileContent = $mRegex.Replace($fileContent, $mobileHTML)
    
    if ($fileContent -ne $original) {
        $modCount++
        [System.IO.File]::WriteAllText($file.FullName, $fileContent, [System.Text.Encoding]::UTF8)
    }
}
Write-Host "Done. Modified $modCount files."
