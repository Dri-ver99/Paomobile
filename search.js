// ─── Product catalogue (mirrors MOCK_PRODUCTS_BASELINE in products-sync.js) ───
const SEARCH_PRODUCTS = [
  { id: "new-iph15-128", name: "iPhone 15 128GB", price: 28900, brand: "Apple", category: "new", img: "", emoji: "📱", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a16"] },
  { id: "new-iph15pro-256", name: "iPhone 15 Pro 256GB", price: 42900, brand: "Apple", category: "new", img: "", emoji: "📱", tags: ["iphone", "ไอโฟน", "apple", "แอปเปิล", "มือ1", "มือ 1", "a17", "pro"] },
  { id: "new-s24-256", name: "Samsung Galaxy S24 256GB", price: 29900, brand: "Samsung", category: "new", img: "", emoji: "📲", tags: ["samsung", "ซัมซุง", "galaxy", "s24", "มือ1", "มือ 1", "ai"] },
  { id: "new-xm14-256", name: "Xiaomi 14 256GB", price: 24900, brand: "Xiaomi", category: "new", img: "", emoji: "📲", tags: ["xiaomi", "เสียวหมี่", "leica", "มือ1", "มือ 1"] },
  { id: "used-iph13-128", name: "iPhone 13 128GB (มือ 2)", price: 14900, brand: "Apple", category: "used", img: "", emoji: "📱", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-iph12-64", name: "iPhone 12 64GB (มือ 2)", price: 9900, brand: "Apple", category: "used", img: "", emoji: "📱", tags: ["iphone", "ไอโฟน", "apple", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-s23-256", name: "Samsung Galaxy S23 256GB (มือ 2)", price: 16500, brand: "Samsung", category: "used", emoji: "📲", tags: ["samsung", "ซัมซุง", "galaxy", "s23", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-a54-128", name: "Samsung Galaxy A54 128GB (มือ 2)", price: 7900, brand: "Samsung", category: "used", emoji: "📲", tags: ["samsung", "ซัมซุง", "a54", "มือสอง", "มือ2", "มือ 2"] },
  { id: "used-reno8pro-256", name: "OPPO Reno 8 Pro 256GB (มือ 2)", price: 8500, brand: "OPPO", category: "used", emoji: "📲", tags: ["oppo", "ออปโป้", "reno", "มือสอง", "มือ2", "มือ 2"] },
  { id: "acc-why-60w", name: "สายชาร์จ Why 60W Type C To C", price: 399, brand: "Why", category: "accessory", img: "Why 60W-1 Type C To C - 1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "why", "60w", "type c", "ชาร์จเร็ว", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-why-20w", name: "ชุดชาร์จ Why 20W Type C To C", price: 599, brand: "Why", category: "accessory", img: "Why 20w-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "why", "20w", "type c", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-headphone-gallery", name: "หูฟัง Anidary ANT004", price: 699, brand: "Anidary", category: "accessory", img: "earphone-1.jpg", emoji: "🎧", tags: ["หูฟัง", "anidary", "earphone", "ant004", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-ans006-gallery", name: "ชุดชาร์จ Anidary ANS006", price: 599, brand: "Anidary", category: "accessory", img: "ANS006-1.jpg", emoji: "🔌", tags: ["ชุดชาร์จ", "anidary", "ans006", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-why-cable-1m", name: "สายชาร์จ Why USB 1.0M", price: 159, brand: "Why", category: "accessory", img: "Why-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "why", "usb", "1m", "micro", "lightning", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-anc001", name: "สายชาร์จ Anidary ANC001 USB to Lightning", price: 299, brand: "Anidary", category: "accessory", img: "USB-I 12W-1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc001", "lightning", "iphone", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-ctoc", name: "สายชาร์จ Anidary ANC007 Type C to C", price: 249, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc007", "type c", "อุปกรณ์เสริม", "accessory"] },
  { id: "acc-anidary-ctoc-1baht", name: "สายชาร์จ Anidary ANC007 Type C to C (Promo 1฿)", price: 1, brand: "Anidary", category: "accessory", img: "Anidary Type c To c - 1.jpg", emoji: "🔌", tags: ["สายชาร์จ", "anidary", "anc007", "โปรโมชั่น", "ราคาพิเศษ", "อุปกรณ์เสริม", "accessory"] },
];

// ─── Service/page entries ──────────────────────────────────────────────────────
const SEARCH_SERVICES = [
  { title: "ซ่อม iPhone / iPad", url: "iphone.html", icon: "📱", tags: ["apple", "ไอโฟน", "ไอแพด", "แอปเปิล", "ซ่อมจอไอโฟน", "เปลี่ยนแบตไอโฟน"] },
  { title: "ซ่อม Samsung", url: "samsung.html", icon: "📱", tags: ["ซัมซุง", "galaxy", "กาแล็คซี่", "s24", "s23", "z fold", "z flip"] },
  { title: "ซ่อม Xiaomi / POCO", url: "xiaomi.html", icon: "📱", tags: ["เสียวหมี่", "เรดหมี่", "redmi", "mi", "poco", "เสียวมี่"] },
  { title: "ซ่อม OPPO", url: "oppo.html", icon: "📱", tags: ["ออปโป้", "reno", "find x", "อ๊อปโป้"] },
  { title: "ซ่อม Vivo", url: "vivo.html", icon: "📱", tags: ["วีโว่", "v30", "v29", "x100"] },
  { title: "ซ่อม Huawei", url: "huawei.html", icon: "📱", tags: ["หัวเว่ย", "mate", "p60", "p50"] },
  { title: "ซ่อม Realme", url: "realme.html", icon: "📱", tags: ["เรียลมี", "gt"] },
  { title: "ซ่อม OnePlus", url: "oneplus.html", icon: "📱", tags: ["วันพลัส", "nord"] },
  { title: "ซ่อม Nokia", url: "nokia.html", icon: "📱", tags: ["โนเกีย"] },
  { title: "เปลี่ยนจอ / ซ่อมจอแตก", url: "select-screen-repair.html", icon: "🔧", tags: ["ซ่อมจอ", "เปลี่ยนจอ", "จอทัชไม่ได้", "จอแตก", "จอลาย", "จอดำ", "ลอกจอ"] },
  { title: "เปลี่ยนแบตเตอรี่", url: "select-battery.html", icon: "🔋", tags: ["เปลี่ยนแบต", "แบตเสื่อม", "แบตบวม", "แบตหมดไว", "เปอร์เซ็นต์แบต"] },
  { title: "ซ่อมบอร์ด / เมนบอร์ด", url: "select-board-repair.html", icon: "🔬", tags: ["ซ่อมบอร์ด", "เมนบอร์ด", "เปิดไม่ติด", "ชาร์จไม่เข้า", "ตกน้ำ", "เครื่องดับ"] },
  { title: "ซ่อมลำโพง / ไมค์", url: "select-speaker-repair.html", icon: "🔊", tags: ["ลำโพงไม่ดัง", "ไมค์ช็อต", "ไมค์เบา", "ไม่ได้ยินเสียง", "ซ่อมไมค์", "ซ่อมลำโพง"] },
  { title: "สินค้ามือ 1", url: "new-products.html", icon: "📦", tags: ["เครื่องมือ1", "เครื่อง1", "มือ 1", "สั่งของ", "ซื้อเครื่องใหม่", "โทรศัพท์ใหม่", "สินค้าใหม่"] },
  { title: "สินค้ามือ 2", url: "used-products.html", icon: "📦", tags: ["เครื่องมือ2", "เครื่อง2", "มือ 2", "มือสอง", "โทรศัพท์มือสอง", "เครื่องมือสอง"] },
  { title: "Accessory / อุปกรณ์เสริม", url: "accessory.html", icon: "🎧", tags: ["accessory", "อุปกรณ์เสริม", "สายชาร์จ", "หูฟัง", "ชุดชาร์จ"] },
  { title: "Tiktok", url: "https://www.tiktok.com/@paomobile.chanal?_r=1&_t=ZS-94eLN3HMFdP", icon: "📹", tags: ["tiktok", "ติ๊กท็อก", "วิดีโอ"] },
  { title: "สาขา / แผนที่ร้าน", url: "index.html#branches", icon: "📍", tags: ["สาขา", "ติดต่อ", "ร้านอยู่ไหน", "แผนที่", "ตึกคอม", "นาเกลือ", "สยาม", "แหลมฉบัง", "มหาชล"] },
  { title: "ติดต่อสอบถาม (LINE)", url: "https://line.me/R/ti/p/@pao789", icon: "💬", tags: ["line", "ไลน์", "ติดต่อ", "สอบถาม", "แชท"] },
  { title: "รีวิวลูกค้า", url: "index.html#reviews", icon: "⭐", tags: ["รีวิว", "pantip", "ดีไหม", "ผลงาน", "รีวิวซ่อม"] },
  { title: "🔧 อะไหล่มือถือ", url: "parts.html", icon: "🛠️", tags: ["อะไหล่", "จอ", "แบต", "เครื่องมือ", "หน้าจอ", "ช่างซ่อม", "parts"] },
];

// ─── Category → page mapping ───────────────────────────────────────────────────
const PRODUCT_PAGE = { new: "new-products.html", used: "used-products.html", accessory: "accessory.html", parts: "parts.html" };

document.addEventListener('DOMContentLoaded', () => {
  const searchBtn     = document.getElementById('searchBtn');
  const searchOverlay = document.getElementById('searchOverlay');
  const searchClose   = document.getElementById('searchClose');
  const searchInput   = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const searchClear   = document.getElementById('searchClear');

  if (!searchOverlay) return;

  let deletedIds = [];
  let firestoreProducts = [];
  let allSearchableProducts = [...SEARCH_PRODUCTS];

  if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    const db = firebase.firestore();
    
    // 1. Sync Deleted IDs
    db.collection('settings').doc('deleted_products').onSnapshot(doc => {
      if (doc.exists) {
        deletedIds = doc.data().deletedIds || [];
        updateMergedProducts();
      }
    });

    // 2. Sync All Products (Multi-category Search)
    db.collection('products').onSnapshot(snapshot => {
      firestoreProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`[SearchSync] Synced ${firestoreProducts.length} global products`);
      updateMergedProducts();
      // Re-trigger search if input has value
      if (searchInput && searchInput.value) {
          renderResults(searchInput.value.trim().toLowerCase());
      }
    }, err => console.warn("[SearchSync] Product sync error:", err));
  }

  function updateMergedProducts() {
      const baselineIds = new Set(SEARCH_PRODUCTS.map(p => p.id));
      const newFromFirestore = firestoreProducts.filter(p => !baselineIds.has(p.id));
      
      // Merge: Baseline (potentially updated by Firestore) + New Firestore ones
      const merged = SEARCH_PRODUCTS.map(p => {
          const match = firestoreProducts.find(f => f.id === p.id);
          return match ? { ...p, ...match } : p;
      });

      allSearchableProducts = [...merged, ...newFromFirestore];
  }

  // ── Open / close ──────────────────────────────────────────────────────────
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      searchOverlay.classList.add('open');
      setTimeout(() => searchInput && searchInput.focus(), 100);
      document.body.style.overflow = 'hidden';
      renderResults('');
    });
  }

  const closeSearch = () => {
    searchOverlay.classList.remove('open');
    if (searchInput) searchInput.value = '';
    document.body.style.overflow = '';
  };

  if (searchClose) searchClose.addEventListener('click', closeSearch);
  searchOverlay.addEventListener('click', (e) => { if (e.target === searchOverlay) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay.classList.contains('open')) closeSearch();
  });
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (searchInput) searchInput.focus();
      renderResults('');
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderResults(e.target.value.trim().toLowerCase()));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function renderResults(query) {
    if (!searchResults) return;
    searchResults.innerHTML = '';

    if (!query) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <span style="font-size:2.5rem;display:block;margin-bottom:12px;">🔍</span>
          <p>พิมพ์ชื่อสินค้า, แบรนด์ หรือบริการที่ต้องการค้นหา</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:20px;">
            <span class="search-suggestion" onclick="setSuggestion('iPhone')">iPhone</span>
            <span class="search-suggestion" onclick="setSuggestion('อะไหล่')">🔧 อะไหล่</span>
            <span class="search-suggestion" onclick="setSuggestion('สายชาร์จ')">สายชาร์จ</span>
            <span class="search-suggestion" onclick="setSuggestion('เปลี่ยนแบต')">เปลี่ยนแบต</span>
            <span class="search-suggestion" onclick="setSuggestion('มือ 2')">มือ 2</span>
          </div>
        </div>`;
      return;
    }

    // Filter products
    let filteredProducts = allSearchableProducts.filter(p => {
      // Global Delete Filter
      if (deletedIds.includes(p.id)) return false;

      const q = query;
      const tags = Array.isArray(p.tags) ? p.tags : (p.tags ? p.tags.split(',').map(t => t.trim()) : []);
      const desc = (p.description || '').toLowerCase();
      const specs = (p.specs || '').toLowerCase();

      return p.name.toLowerCase().includes(q)
        || (p.brand && p.brand.toLowerCase().includes(q))
        || (p.partModel && p.partModel.toLowerCase().includes(q))
        || (p.partType && p.partType.toLowerCase().includes(q))
        || desc.includes(q)
        || specs.includes(q)
        || tags.some(t => t.toLowerCase().includes(q));
    });

    // Filter services (static)
    const filteredServices = SEARCH_SERVICES.filter(s => {
      const q = query;
      return s.title.toLowerCase().includes(q)
        || s.tags.some(t => t.toLowerCase().includes(q));
    });

    const totalResults = filteredProducts.length + filteredServices.length;

    if (totalResults === 0) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <span style="font-size:2.5rem;display:block;margin-bottom:12px;">🤔</span>
          <p>ไม่พบผลการค้นหาสำหรับ "<strong>${query}</strong>"</p>
          <p style="font-size:0.85rem;margin-top:8px;">ลองค้นหาด้วยคำอื่น หรือสอบถามเราโดยตรง</p>
          <a href="https://line.me/R/ti/p/@pao789" target="_blank" class="btn btn-primary" style="margin-top:16px;">💬 สอบถามผ่าน LINE</a>
        </div>`;
      return;
    }

    // ── Product section ──
    if (filteredProducts.length > 0) {
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'sr-section-label';
      sectionLabel.textContent = `🛍️ สินค้า (${filteredProducts.length})`;
      searchResults.appendChild(sectionLabel);

      filteredProducts.forEach(p => {
        const url = PRODUCT_PAGE[p.category] || 'new-products.html';
        const a = document.createElement('a');
        // Deep Linking: append ?id=... to auto-open modal on page load
        a.href = `${url}?id=${p.id}`;
        a.className = 'search-result-item';

        // Thumbnail: real image or emoji fallback
        const thumbHTML = p.img
          ? `<img src="${p.img}" alt="${p.name}" class="sr-product-img">`
          : `<div class="sr-icon">${p.emoji || '📦'}</div>`;

        a.innerHTML = `
          ${thumbHTML}
          <div class="sr-content">
            <div class="sr-title">${p.name}</div>
            <div class="sr-brand">${p.brand || (p.category === 'parts' ? p.partModel : '')}</div>
            <div class="sr-price">฿${(p.price || 0).toLocaleString()}</div>
          </div>
          <span class="sr-arrow">→</span>`;
        a.addEventListener('click', closeSearch);
        searchResults.appendChild(a);
      });
    }

    // ── Service section ──
    if (filteredServices.length > 0) {
      const sectionLabel = document.createElement('div');
      sectionLabel.className = 'sr-section-label';
      sectionLabel.textContent = `🔧 บริการ & หน้าต่างๆ (${filteredServices.length})`;
      searchResults.appendChild(sectionLabel);

      filteredServices.forEach(s => {
        const a = document.createElement('a');
        a.href = s.url;
        a.className = 'search-result-item';
        if (s.url.startsWith('http')) a.target = '_blank';
        const shortUrl = s.url.replace('.html', '').replace('index', 'หน้าหลัก').replace('https://', '');
        a.innerHTML = `
          <div class="sr-icon">${s.icon}</div>
          <div class="sr-content">
            <div class="sr-title">${s.title}</div>
            <div class="sr-url">${shortUrl}</div>
          </div>
          <span class="sr-arrow">→</span>`;
        a.addEventListener('click', () => { if (!s.url.startsWith('http')) closeSearch(); });
        searchResults.appendChild(a);
      });
    }
  }

  // Global helper for suggestion chips
  window.setSuggestion = function(val) {
    if (searchInput) { searchInput.value = val; searchInput.dispatchEvent(new Event('input')); }
  };
});
