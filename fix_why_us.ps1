$filePath = "c:\Users\Lazy\Desktop\Paomobile Web Main\index.html"
$text = [IO.File]::ReadAllText($filePath, [Text.Encoding]::UTF8)

$brokenHtml = @"
  </section>
            และราคาที่ยุติธรรม</p>

          <div class="why-features">
"@

$fixedHtml = @"
  </section>

  <!-- ===== WHY US ===== -->
  <section class="why-us" id="why-us">
    <div class="container">
      <div class="why-layout">
        <div class="why-image" data-animate="fade-up">
          <div class="swiper whySwiper" style="width: 100%; border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-lg);">
            <div class="swiper-wrapper">
              <div class="swiper-slide"><img src="ร้าน 7.jpg" alt="ร้าน 7" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 1.jpg" alt="ร้าน 1" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 2.jpg" alt="ร้าน 2" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 3.jpg" alt="ร้าน 3" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 4.jpg" alt="ร้าน 4" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 5.jpg" alt="ร้าน 5" style="width: 100%; height: auto; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 6.jpg" alt="ร้าน 6" style="width: 100%; height: auto; object-fit: cover;" /></div>
            </div>
          </div>
        </div>
        <div class="why-content" data-animate="fade-up" data-delay="200">
          <span class="label">ทำไมต้อง Paomobile</span>
          <h2>ร้านซ่อมมือถือ<br />ที่คุณไว้วางใจได้</h2>
          <p class="why-desc">เรามุ่งมั่นให้บริการซ่อมมือถือที่ดีที่สุด ด้วยทีมช่างผู้เชี่ยวชาญ อะไหล่แท้
            และราคาที่ยุติธรรม</p>

          <div class="why-features">
"@

$text = $text -replace "`r`n", "`n"
$brokenHtml = $brokenHtml -replace "`r`n", "`n"
$fixedHtml = $fixedHtml -replace "`r`n", "`n"

$text = $text.Replace($brokenHtml, $fixedHtml)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($filePath, $text, $utf8NoBom)
Write-Host "Fixed the why-us section HTML"
