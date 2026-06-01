const fs = require('fs');
let html = fs.readFileSync('seller-chat.html', 'utf8');

// The sidebar in seller-chat.html is identical to seller-products.html.
const productsHtml = fs.readFileSync('seller-products.html', 'utf8');
const sidebarRegex = /<aside class="sidebar">[\s\S]*?<\/aside>/;
const productsSidebar = productsHtml.match(sidebarRegex)[0];

html = html.replace(sidebarRegex, productsSidebar);

// Also replace the mobile sidebar
const mobileSidebarRegex = /<div id="mobileSidebarOverlay"[\s\S]*?<\/nav>\s*<\/div>\s*<\/div>\s*<\/div>/;
const productsMobileSidebar = productsHtml.match(mobileSidebarRegex);
if(productsMobileSidebar) {
  html = html.replace(mobileSidebarRegex, productsMobileSidebar[0]);
}

// Fix other specific garbled strings
html = html.replace(/<h2>\?\? \?\?\?\?\?\?\?\?\?\?\? \(Shopee Style\)<\/h2>/, '<h2>💬 จัดการแชทลูกค้า (Shopee Style)</h2>');
html = html.replace(/<h3>Chat <span[^>]*>\?<\/span><\/h3>/, '<h3>Chat <span style="font-size: 1.1rem; color: var(--shopee-orange);">💬</span></h3>');
html = html.replace(/<div class="warning-icon">\?\?<\/div>/, '<div class="warning-icon">⚠️</div>');
html = html.replace(/<button class="warning-btn" onclick="sellerLogin\(\)">\?\? \?\?\?\?\?<\/button>/, '<button class="warning-btn" onclick="sellerLogin()">ล็อกอิน Admin (Cloud)</button>');
html = html.replace(/<span class="search-icon">\?\?<\/span>/, '<span class="search-icon">🔍</span>');
html = html.replace(/<span style="font-size: 4rem; margin-bottom: 20px;">\?\?<\/span>/, '<span style="font-size: 4rem; margin-bottom: 20px;">💬</span>');
html = html.replace(/<div style="font-size: 1.1rem; font-weight: 500;">\?\? \?\?\?\?\?\?\?\?\?\?\?\?\?<\/div>/, '<div style="font-size: 1.1rem; font-weight: 500;">ไม่มีสิทธิ์เข้าถึงข้อมูล</div>');
html = html.replace(/<span class="picker-close" onclick="closeProductPicker\(\)">\?<\/span>/, '<span class="picker-close" onclick="closeProductPicker()">×</span>');
html = html.replace(/<option value="all">\?\? \?\?\?\?\?\?\?\?\?<\/option>/, '<option value="all">หมวดหมู่ทั้งหมด</option>');
html = html.replace(/<option value="new">\?\? \?\?\? 1<\/option>/, '<option value="new">มือ 1</option>');
html = html.replace(/<option value="used">\?\? \?\?\? 2<\/option>/, '<option value="used">มือ 2</option>');
html = html.replace(/<option value="parts">\?\? \?\?\?\?\?\?<\/option>/, '<option value="parts">อะไหล่</option>');
html = html.replace(/<option value="accessory">\?\? Accessory<\/option>/, '<option value="accessory">Accessory</option>');
html = html.replace(/chatList\.innerHTML = '<div style="text-align:center; padding:60px 40px; color:#666;">\?\? \?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?\?<\/div>';/, 'chatList.innerHTML = \'<div style="text-align:center; padding:60px 40px; color:#666;">เลือกบทสนทนาเพื่อเริ่มตอบแชทครับ</div>\';');
html = html.replace(/chatList\.innerHTML = '<div style="padding:40px; text-align:center; color:#ef4444;">\? ' \+ err\.message \+ '<\/div>';/, 'chatList.innerHTML = \'<div style="padding:40px; text-align:center; color:#ef4444;">❌ \' + err.message + \'</div>\';');

// Make seller-chat.html the active tab in the sidebars
html = html.replace(/<a href="seller-products\.html" class="menu-item active">/g, '<a href="seller-products.html" class="menu-item">');
html = html.replace(/<a href="seller-chat\.html" class="menu-item"/g, '<a href="seller-chat.html" class="menu-item active"');

// Save it with UTF-8
fs.writeFileSync('seller-chat.html', html, 'utf8');
console.log('Fixed seller-chat.html');
