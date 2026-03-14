import os

broken_html = """    <div class="hero-bg">
      <img src="bg-shop.png" alt="" class="hero-bg-img" />
      <div class="hero-bg-overlay"></div>
    </div>
        <div class="stat-item" data-animate="fade-up" data-delay="300">"""

fixed_html = """    <div class="hero-bg">
      <img src="bg-shop.png" alt="" class="hero-bg-img" />
      <div class="hero-bg-overlay"></div>
    </div>
    <div class="container hero-container">
      <div class="hero-content" data-animate="fade-up">
        <div class="badge">
          <span class="badge-dot"></span>
          ซ่อมจอ iPhone เริ่มต้น ฿1,500
        </div>
        <h1>ซ่อมมือถือ<br /><span class="accent">มืออาชีพ</span></h1>
        <p class="hero-sub">
          Paomobile รับซ่อมมือถือทุกยี่ห้อ ทุกอาการ
          ช่างผู้เชี่ยวชาญ · อะไหล่แท้ · รับประกันงานซ่อม
        </p>
        <div class="hero-buttons">
          <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary btn-lg">
            💬 ปรึกษาฟรี @pao789
          </a>
          <a href="#services" class="btn btn-ghost btn-lg">
            ดูบริการ →
          </a>
        </div>
      </div>
      <div class="hero-visual" data-animate="fade-up" data-delay="200">
        <div class="hero-card">
          <div class="hero-card-glow"></div>
          <div class="swiper heroSwiper" style="width: 100%; max-width: 420px; margin: 0 auto; overflow: hidden; border-radius: calc(var(--radius-xl) - 8px);">
            <div class="swiper-wrapper">
              <div class="swiper-slide"><img src="ร้าน 1.jpg" alt="ภาพร้านซ่อมมือถือ 1" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 2.jpg" alt="ภาพร้านซ่อมมือถือ 2" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 3.jpg" alt="ภาพร้านซ่อมมือถือ 3" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 4.jpg" alt="ภาพร้านซ่อมมือถือ 4" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 5.jpg" alt="ภาพร้านซ่อมมือถือ 5" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 6.jpg" alt="ภาพร้านซ่อมมือถือ 6" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
              <div class="swiper-slide"><img src="ร้าน 7.jpg" alt="ภาพร้านซ่อมมือถือ 7" style="aspect-ratio: 4/5; width: 100%; object-fit: cover;" /></div>
            </div>
          </div>
        </div>
        <div class="floating-badge fb-1" data-animate="pop" data-delay="600">
          <span class="fb-emoji">⚡</span>
          <div>
            <strong>ซ่อมไว</strong>
            <small>30 - 60 นาที</small>
          </div>
        </div>
        <div class="floating-badge fb-2" data-animate="pop" data-delay="800">
          <span class="fb-emoji">🛡️</span>
          <div>
            <strong>รับประกัน</strong>
            <small>3 เดือน</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Strip -->
    <div class="stats-strip">
      <div class="container stats-container">
        <div class="stat-item" data-animate="fade-up" data-delay="300">"""

file_path = "c:\\Users\\Lazy\\Desktop\\Paomobile Web Main\\index.html"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(broken_html, fixed_html)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Fixed!")
