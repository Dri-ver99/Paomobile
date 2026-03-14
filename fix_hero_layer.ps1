$filePath = "c:\Users\Lazy\Desktop\Paomobile Web Main\index.html"
$text = [IO.File]::ReadAllText($filePath, [Text.Encoding]::UTF8)

$brokenHtml = @"
  <!-- ===== HERO ===== -->
  <section class="hero" id="hero">
    <div class="hero-bg">
      <img src="bg-shop.png" alt="" class="hero-bg-img" />
      <div class="hero-bg-overlay"></div>
      <a href="https://s.shopee.co.th/qejQcQeWI" target="_blank">🛒 สั่งของ</a>
      <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary mobile-cta">
        💬 สอบถามเพิ่มเติม @pao789
      </a>
    </div>
  </aside>

  <!-- ===== HERO ===== -->
  <section class="hero" id="hero">
    <div class="hero-bg">
      <img src="bg-shop.png" alt="" class="hero-bg-img" />
      <div class="hero-bg-overlay"></div>
    </div>
"@

$fixedHtml = @"
  <!-- ===== HERO ===== -->
  <section class="hero" id="hero">
    <div class="hero-bg">
      <img src="bg-shop.png" alt="" class="hero-bg-img" />
      <div class="hero-bg-overlay"></div>
    </div>
"@

$text = $text -replace "`r`n", "`n"
$brokenHtml = $brokenHtml -replace "`r`n", "`n"
$fixedHtml = $fixedHtml -replace "`r`n", "`n"

$text = $text.Replace($brokenHtml, $fixedHtml)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $text, $utf8NoBom)
Write-Host "Fixed the duplicate hero section"
