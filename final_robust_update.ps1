
$baseDir = "c:\Users\Lazy\Desktop\Paomobile Web Main"
$utf8WithBom = New-Object System.Text.UTF8Encoding $true

# HTML Entities for consistent rendering
$shop = "&#3619;&#3657;&#3634;&#3609;" # ร้าน
$used = "&#3617;&#3639;&#3629;&#3606;&#3639;&#3629;&#3617;&#3639;&#3629;&#3626;&#3629;&#3591;" # มือถือมือสอง
$acc = "&#3629;&#3640;&#3611;&#3585;&#3619;&#3603;&#3660;&#3648;&#3626;&#3619;&#3636;&#3617;" # อุปกรณ์เสริม
$srv = "&#3610;&#3619;&#3636;&#3585;&#3634;&#3619;" # บริการ
$ent = "&#3588;&#3623;&#3634;&#3617;&#3610;&#3633;&#3609;&#3648;&#3607;&#3636;&#3591;" # ความบันเทิง
$brn = "&#3626;&#3634;&#3586;&#3634;" # สาขา

$m1 = "&#3626;&#3636;&#3609;&#3588;&#3657;&#3634;&#3617;&#3639;&#3629; 1" # สินค้ามือ 1
$m2 = "&#3626;&#3636;&#3609;&#3588;&#3657;&#3634;&#3617;&#3639;&#3629; 2" # สินค้ามือ 2
$allModel = "&#3619;&#3640;&#3656;&#3609;&#3617;&#3633;&#3657;&#3591;&#3627;&#3617;&#3604;" # รุ่นทั้งหมด

$fixScreen = "&#3595;&#3656;&#3629;&#3617;&#3627;&#3619;&#3657;&#3634;&#3592;&#3629;" # ซ่อมหน้าจอ
$fixBat = "&#3648;&#3611;&#3621;&#3635;&#3656;&#3618;&#3609;&#3649;&#3610;&#3605;&#3648;&#3605;&#3629;&#3619;&#3635;&#3656;" # เปลี่ยนแบตเตอรี่
$fixBoard = "&#3595;&#3656;&#3629;&#3617;&#3610;&#3629;&#3619;&#3660;&#3610;" # ซ่อมบอร์ด

$revCust = "&#3619;&#3635;&#3623;&#3636;&#3623;&#3621;&#3641;&#3585;&#3588;&#3657;&#3634;" # รีวิวลูกค้า
$revFix = "&#3619;&#3635;&#3623;&#3636;&#3623;&#3593;&#3634;&#3609;&#3595;&#3656;&#3629;&#3617;" # รีวิวงานซ่อม

$ctaTxt = "&#3610;&#3619;&#3636;&#3585;&#3634;&#3619;&#3593;&#3656;&#3623;&#3618;&#3648;&#3627;&#3621;&#3639;&#3629;" # บริการช่วยเหลือ
$backTxt = "&#3627;&#3619;&#3657;&#3634;&#3627;&#3621;&#3633;&#3585;" # หน้าหลัก

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
          <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary mobile-cta">&#128172; $ctaTxt @pao789</a>
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

Write-Host "Applied HTML entity encoding for all Thai text in $($htmlFiles.Count) files."
