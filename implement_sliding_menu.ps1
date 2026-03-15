
$baseDir = "c:\Users\Lazy\Desktop\Paomobile Web Main"
$utf8WithBom = New-Object System.Text.UTF8Encoding $true

function Get-Thai {
    param([string]$hex)
    $chars = $hex -split ' ' | ForEach-Object { [char][int]("0x" + $_) }
    return -join $chars
}

# Thai Strings - Corrected Final v2
$shop = Get-Thai "0E23 0E49 0E32 0E19"
$used = Get-Thai "0E21 0E37 0E2D 0E16 0E37 0E2D 0E21 0E37 0E2D 0E2A 0E2D 0E07"
$acc = Get-Thai "0E2D 0E38 0E1B 0E01 0E23 0E13 0E4C 0E40 0E2A 0E23 0E34 0E21"
$srv = Get-Thai "0E1A 0E23 0E34 0E01 0E32 0E23"
$ent = Get-Thai "0E04 0E27 0E32 0E21 0E1A 0E31 0E19 0E40 0E17 0E34 0E07"
$brn = Get-Thai "0E2A 0E32 0E02 0E32"

$m1 = Get-Thai "0E2A 0E34 0E19 0E04 0E49 0E32 0E21 0E37 0E2D 0020 0031"
$m2 = Get-Thai "0E2A 0E34 0E19 0E04 0E49 0E32 0E21 0E37 0E2D 0020 0032"
# "รุ่นทั้งหมด" -> ร 0E23, ุ 0E38, ่ 0E48, น 0E19, ท 0E17, ั 0E31, ้ 0E49, ง 0E07, ห 0E2B, ม 0E21, ด 0E14
$allModel = Get-Thai "0E23 0E38 0E48 0E19 0E17 0E31 0E49 0E07 0E2B 0E21 0E14"

$fixScreen = Get-Thai "0E0B 0E48 0E2D 0E21 0E2B 0E19 0E49 0E32 0E08 0E2D"
$fixBat = Get-Thai "0E40 0E1B 0E25 0E35 0E48 0E22 0E19 0E41 0E1A 0E15 0E40 0E15 0E2D 0E23 0E35 0E48"
$fixBoard = Get-Thai "0E0B 0E48 0E2D 0E21 0E1A 0E2D 0E23 0E4C 0E14"

# "รีวิวลูกค้า" -> ร 0E23, ี 0E35, ว 0E27, ิ 0E34, ว 0E27, ล 0E25, ู 0E39, ก 0E01, ค 0E04, ้ 0E49, า 0E32
$revCust = Get-Thai "0E23 0E35 0E27 0E34 0E27 0E25 0E39 0E01 0E04 0E49 0E32"
$revFix = Get-Thai "0E23 0E35 0E27 0E34 0E27 0E07 0E32 0E19 0E0B 0E48 0E2D 0E21"

$ctaTxt = Get-Thai "0E1A 0E23 0E34 0E01 0E32 0E23 0E0A 0E48 0E27 0E22 0E40 0E2B 0E25 0E37 0E2D"
$backTxt = Get-Thai "0E2B 0E19 0E49 0E32 0E2B 0E25 0E31 0E01"

# Emoji 💬 (U+1F4AC)
$emoji = [char]0xD83D + [char]0xDCAC

$newMobileMenuStructure = @"
    <button class="mobile-close" id="mobileClose" aria-label="Close">✕</button>
    <div class="mobile-menu-panels" id="mobileMenuPanels">
      <!-- Main Panel -->
      <div class="mobile-panel" id="mainPanel">
        <div class="mobile-menu-inner">
          <a href="index.html">$shop</a>
          <div class="menu-item-wrapper">
            <div class="menu-item-parent">iPhone</div>
            <div class="mobile-sub-menu">
              <a href="new-products.html">$m1</a>
              <a href="used-products.html">$m2</a>
              <a href="iphone.html">$allModel</a>
            </div>
          </div>
          <a href="accessory.html">$acc</a>
          <div class="menu-item-wrapper">
            <div class="menu-item-parent">$srv</div>
            <div class="mobile-sub-menu">
              <a href="screen-repair.html">$fixScreen</a>
              <a href="select-battery.html">$fixBat</a>
              <a href="select-board-repair.html">$fixBoard</a>
            </div>
          </div>
          <div class="menu-item-wrapper">
            <div class="menu-item-parent">$ent</div>
            <div class="mobile-sub-menu">
              <a href="index.html#reviews">$revCust</a>
              <a href="index.html#showcase">$revFix</a>
            </div>
          </div>
          <a href="index.html#branches">$brn</a>
          <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary mobile-cta">💬 $ctaTxt @pao789</a>
        </div>
      </div>
      <!-- Sub Panel -->
      <div class="mobile-panel" id="subPanel">
        <div class="mobile-panel-header">
          <button class="mobile-back-btn" id="mobileBackBtn">❮ <span style="font-size: 16px; margin-left: 5px;">$backTxt</span></button>
          <span class="mobile-panel-title" id="subMenuTitle"></span>
        </div>
        <div class="mobile-menu-inner" id="subMenuContent">
          <!-- Injected via JS -->
        </div>
      </div>
    </div>
"@

$htmlFiles = Get-ChildItem -Path $baseDir -Filter "*.html" -File
foreach ($file in $htmlFiles) {
    if ($file.Name -match "^25-years - Copy") { continue }
    
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    # Target the entire content of the mobile menu aside
    $pattern = '(?s)<aside class="mobile-menu" id="mobileMenu">.*?</aside>'
    $replacement = "<aside class=`"mobile-menu`" id=`"mobileMenu`">`n$newMobileMenuStructure`n  </aside>"
    
    if ($content -match $pattern) {
        $content = [regex]::Replace($content, $pattern, $replacement)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8WithBom)
    }
}

Write-Host "Corrected Thai spelling and finalized sliding menu in $($htmlFiles.Count) files."
