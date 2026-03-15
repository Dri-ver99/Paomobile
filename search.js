
/* ================================================================
   SEARCH SYSTEM LOGIC
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClear = document.getElementById('searchClear');

  // Search Data Index
  const searchData = [
    // Phones & Tablets (Brand Pages)
    { title: "ซ่อม iPhone / iPad", url: "iphone.html", tags: ["apple", "ไอโฟน", "ไอแพด", "แอปเปิล", "ซ่อมจอไอโฟน", "เปลี่ยนแบตไอโฟน"] },
    { title: "ซ่อม Samsung", url: "samsung.html", tags: ["ซัมซุง", "galaxy", "กาแล็คซี่", "s24", "s23", "z fold", "z flip"] },
    { title: "ซ่อม Xiaomi / POCO", url: "xiaomi.html", tags: ["เสียวหมี่", "เรดหมี่", "redmi", "mi", "poco", "เสียวมี่"] },
    { title: "ซ่อม OPPO", url: "oppo.html", tags: ["ออปโป้", "reno", "find x", "อ๊อปโป้"] },
    { title: "ซ่อม Vivo", url: "vivo.html", tags: ["วีโว่", "v30", "v29", "x100"] },
    { title: "ซ่อม Huawei", url: "huawei.html", tags: ["หัวเว่ย", "mate", "p60", "p50"] },
    { title: "ซ่อม Realme", url: "realme.html", tags: ["เรียลมี", "gt"] },
    { title: "ซ่อม OnePlus", url: "oneplus.html", tags: ["วันพลัส", "nord"] },
    { title: "ซ่อม Nokia", url: "nokia.html", tags: ["โนเกีย"] },

    // Services
    { title: "เปลี่ยนจอ / ซ่อมจอแตก", url: "select-screen-repair.html", tags: ["ซ่อมจอ", "เปลี่ยนจอ", "จอทัชไม่ได้", "จอแตก", "จอลาย", "จอดำ", "ลอกจอ"] },
    { title: "เปลี่ยนแบตเตอรี่", url: "select-battery.html", tags: ["เปลี่ยนแบต", "แบตเสื่อม", "แบตบวม", "แบตหมดไว", "เปอร์เซ็นต์แบต"] },
    { title: "ซ่อมบอร์ด / เมนบอร์ด", url: "select-board-repair.html", tags: ["ซ่อมบอร์ด", "เมนบอร์ด", "เปิดไม่ติด", "ชาร์จไม่เข้า", "ตกน้ำ", "เครื่องดับ"] },
    { title: "ซ่อมลำโพง / ไมค์", url: "select-speaker-repair.html", tags: ["ลำโพงไม่ดัง", "ไมค์ช็อต", "ไมค์เบา", "ไม่ได้ยินเสียง", "ซ่อมไมค์", "ซ่อมลำโพง"] },

    // Shop / Products
    { title: "สั่งสินค้ามือ 1", url: "new-products.html", tags: ["เครื่องมือ 1", "เครื่องมือ1", "เครื่อง1", "มือ 1", "สั่งของ", "ซื้อเครื่องใหม่", "โทรศัพท์ใหม่", "สินค้าใหม่"] },
    { title: "สั่งสินค้ามือ 2", url: "used-products.html", tags: ["เครื่องมือ 2", "เครื่องมือ2", "เครื่อง2", "มือ 2", "สั่งของ", "มือสอง", "โทรศัพท์มือสอง", "เครื่องมือสอง"] },
    { title: "ร้าน Shopee", url: "https://s.shopee.co.th/qejQcQeWI", tags: ["shopee", "ช้อปปี้", "สั่งออนไลน์"] },

    // Info
    { title: "สาขา / แผนที่ร้าน", url: "index.html#branches", tags: ["สาขา", "ติดต่อ", "ร้านอยู่ไหน", "แผนที่", "ตึกคอม", "นาเกลือ", "สยาม", "แหลมฉบัง", "มหาชล"] },
    { title: "ติดต่อสอบถาม (LINE)", url: "https://line.me/R/ti/p/@pao789", tags: ["line", "ไลน์", "ติดต่อ", "สอบถาม", "แชท"] },
    { title: "รีวิวลูกค้า", url: "index.html#reviews", tags: ["รีวิว", "pantip", "ดีไหม", "ผลงาน", "รีวิวซ่อม"] }
  ];

  // Open Search
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchOverlay.classList.add('open');
      setTimeout(() => searchInput.focus(), 100);
      document.body.style.overflow = 'hidden';
      renderResults(''); // Show all/initial state
    });
  }

  // Close Search
  const closeSearch = () => {
    searchOverlay.classList.remove('open');
    searchInput.value = '';
    document.body.style.overflow = '';
  };

  if (searchClose) searchClose.addEventListener('click', closeSearch);
  
  if (searchOverlay) {
    searchOverlay.addEventListener('click', (e) => {
      if (e.target === searchOverlay) closeSearch();
    });
  }

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && searchOverlay.classList.contains('open')) {
      closeSearch();
    }
  });

  // Clear Input
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      renderResults('');
    });
  }

  // Handle Input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderResults(e.target.value.trim().toLowerCase());
    });
  }

  // Render Results
  function renderResults(query) {
    if (!searchResults) return;
    
    searchResults.innerHTML = '';

    if (!query) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <span style="font-size:2.5rem; display:block; margin-bottom:12px;">&#x1F50D;</span>
          <p>พิมพ์รุ่นมือถือ, เครื่องมือ 1, เครื่องมือ 2 หรือบริการที่ต้องการค้นหา</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:20px;">
            <span class="search-suggestion" onclick="document.getElementById('searchInput').value='iPhone'; document.getElementById('searchInput').dispatchEvent(new Event('input'))">iPhone</span>
            <span class="search-suggestion" onclick="document.getElementById('searchInput').value='เปลี่ยนแบต'; document.getElementById('searchInput').dispatchEvent(new Event('input'))">เปลี่ยนแบต</span>
            <span class="search-suggestion" onclick="document.getElementById('searchInput').value='เครื่องมือ 1'; document.getElementById('searchInput').dispatchEvent(new Event('input'))">เครื่องมือ 1</span>
            <span class="search-suggestion" onclick="document.getElementById('searchInput').value='เครื่องมือ 2'; document.getElementById('searchInput').dispatchEvent(new Event('input'))">เครื่องมือ 2</span>
          </div>
        </div>
      `;
      return;
    }

    const filtered = searchData.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query);
      const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(query));
      return titleMatch || tagMatch;
    });

    if (filtered.length === 0) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <span style="font-size:2.5rem; display:block; margin-bottom:12px;">&#x1F914;</span>
          <p>ไม่พบผลการค้นหาสำหรับ "<strong>${query}</strong>"</p>
          <p style="font-size:0.85rem; margin-top:8px;">ลองค้นหาด้วยคำอื่น หรือสอบถามเราโดยตรง</p>
          <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary" style="margin-top:16px;">💬 สอบถามผ่าน LINE</a>
        </div>
      `;
      return;
    }

    filtered.forEach(item => {
      const a = document.createElement('a');
      a.href = item.url;
      a.className = 'search-result-item';
      
      let icon = '📱';
      if (item.title.includes('แบต')) icon = '🔋';
      else if (item.title.includes('จอ')) icon = '🔧';
      else if (item.title.includes('บอร์ด')) icon = '🔬';
      else if (item.title.includes('ช้อปปี้') || item.title.includes('Shopee')) icon = '🛒';
      else if (item.title.includes('มือ 1') || item.title.includes('มือ 2')) icon = '📦';
      else if (item.title.includes('LINE') || item.title.includes('ติดต่อ')) icon = '💬';
      else if (item.title.includes('สาขา')) icon = '📍';

      a.innerHTML = `
        <span class="sr-icon">${icon}</span>
        <div class="sr-content">
          <div class="sr-title">${item.title}</div>
          <div class="sr-url">${item.url.replace('.html', '').replace('index', 'หน้าหลัก').replace('https://', '')}</div>
        </div>
        <span class="sr-arrow">→</span>
      `;
      
      // If clicking inside the overlay, close it
      a.addEventListener('click', () => {
        if (!item.url.startsWith('http')) { // Only close for local links, new tabs let it stay
          closeSearch();
        }
      });

      searchResults.appendChild(a);
    });
  }
});
