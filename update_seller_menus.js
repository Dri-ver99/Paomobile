const fs = require('fs');

const desktopNavTemplate = `    <aside class="sidebar">
        <div class="sidebar-header">
            <a href="seller-centre.html" class="sidebar-logo">
                <img src="logo.png" alt="Paomobile">
                <span>Seller Centre</span>
            </a>
        </div>
        <nav class="sidebar-menu">
            <div class="menu-section" style="margin-bottom: 20px; padding-top: 0;">
                <a href="index.html" class="menu-item-home" style="margin-top: 0;">
                    <span class="menu-icon">🏠</span> กลับหน้าหลักร้านค้า
                </a>
            </div>
            <div class="menu-section">
                <p class="menu-title">เมนูหลัก</p>
                <a href="seller-centre.html" class="menu-item {active_centre}"><span class="menu-icon">📊</span> แผงควบคุม (Dashboard)</a>
                <a href="seller-chat.html" class="menu-item {active_chat}" style="position:relative;"><span class="menu-icon">💬</span> แชทกับลูกค้า <span id="chat-unread-total" style="display:none; position:absolute; right:15px; top:50%; transform:translateY(-50%); background:#ef4444; color:#fff; font-size:10px; padding:2px 6px; border-radius:10px; font-weight:700;">0</span></a>
                <a href="seller-vouchers.html" class="menu-item {active_vouchers}"><span class="menu-icon">🎫</span> จัดการโค้ดส่วนลด</a>
                <a href="seller-customers.html" class="menu-item {active_customers}"><span class="menu-icon">👥</span> รายชื่อลูกค้า</a>
                <a href="seller-repairs.html" class="menu-item {active_repairs}"><span class="menu-icon">🔧</span> จัดการงานซ่อม</a>
                <a href="{promo_href}" class="menu-item" {promo_onclick}><span class="menu-icon">🎁</span> จัดการโปรโมชั่น</a>
            </div>
            <div class="menu-section">
                <p class="menu-title">คำสั่งซื้อ</p>
                <a href="seller-orders.html" class="menu-item {active_orders}"><span class="menu-icon">📦</span> คำสั่งซื้อของฉัน</a>
                <a href="seller-orders.html?tab=toship" class="menu-item"><span class="menu-icon">🚚</span> ที่ต้องจัดส่ง</a>
                <a href="seller-orders.html?tab=processed" class="menu-item"><span class="menu-icon">➡️</span> เตรียมจัดส่ง</a>
                <a href="seller-orders.html?tab=cancelled" class="menu-item"><span class="menu-icon">🚫</span> ขอยกเลิก/คืนเงิน/คืนสินค้า</a>
            </div>
            <div class="menu-section">
                <p class="menu-title">สินค้า</p>
                <a href="seller-products.html" class="menu-item {active_products}"><span class="menu-icon">🛍️</span> สินค้าของฉัน</a>
                <a href="seller-products.html" class="menu-item"><span class="menu-icon">➕</span> เพิ่มสินค้าใหม่</a>
                <a href="seller-products.html" class="menu-item"><span class="menu-icon">⚙️</span> จัดการหมวดหมู่อะไหล่</a>
            </div>
        </nav>
    </aside>`;

const mobileNavTemplate = `            <div class="mobile-sidebar-content">
                <nav class="sidebar-menu">
                    <div class="menu-section">
                        <a href="index.html" class="menu-item-home"><span class="menu-icon">🏠</span> กลับหน้าหลักร้านค้า</a>
                        <a href="seller-centre.html" class="menu-item {active_centre}"><span class="menu-icon">📊</span> แผงควบคุม</a>
                        <a href="seller-chat.html" class="menu-item {active_chat}"><span class="menu-icon">💬</span> แชทกับลูกค้า</a>
                        <a href="seller-vouchers.html" class="menu-item {active_vouchers}"><span class="menu-icon">🎫</span> โค้ดส่วนลด</a>
                        <a href="seller-customers.html" class="menu-item {active_customers}"><span class="menu-icon">👥</span> รายชื่อลูกค้า</a>
                        <a href="seller-repairs.html" class="menu-item {active_repairs}"><span class="menu-icon">🔧</span> จัดการงานซ่อม</a>
                        <a href="{promo_href}" class="menu-item" {promo_onclick_mobile}><span class="menu-icon">🎁</span> จัดการโปรโมชั่น</a>
                    </div>
                    <div class="menu-section">
                        <p class="menu-title">คำสั่งซื้อ</p>
                        <a href="seller-orders.html" class="menu-item {active_orders}"><span class="menu-icon">📦</span> คำสั่งซื้อของฉัน</a>
                        <a href="seller-orders.html?tab=toship" class="menu-item"><span class="menu-icon">🚚</span> ที่ต้องจัดส่ง</a>
                    </div>
                    <div class="menu-section">
                        <p class="menu-title">สินค้า</p>
                        <a href="seller-products.html" class="menu-item {active_products}"><span class="menu-icon">🛍️</span> สินค้าของฉัน</a>
                        <a href="seller-products.html" class="menu-item"><span class="menu-icon">➕</span> เพิ่มสินค้าใหม่</a>
                    </div>
                </nav>
            </div>`;

const files = [
    'seller-centre.html',
    'seller-chat.html',
    'seller-customers.html',
    'seller-orders.html',
    'seller-products.html',
    'seller-repairs.html',
    'seller-vouchers.html'
];

files.forEach(filename => {
    if (!fs.existsSync(filename)) return;
    let content = fs.readFileSync(filename, 'utf-8');

    const active_map = {
        '{active_centre}': filename === 'seller-centre.html' ? 'active' : '',
        '{active_chat}': filename === 'seller-chat.html' ? 'active' : '',
        '{active_customers}': filename === 'seller-customers.html' ? 'active' : '',
        '{active_orders}': filename === 'seller-orders.html' ? 'active' : '',
        '{active_products}': filename === 'seller-products.html' ? 'active' : '',
        '{active_repairs}': filename === 'seller-repairs.html' ? 'active' : '',
        '{active_vouchers}': filename === 'seller-vouchers.html' ? 'active' : ''
    };

    const promo_href = filename === 'seller-centre.html' ? '#promotion-card' : 'seller-centre.html#promotion-card';
    const promo_onclick = filename === 'seller-centre.html' ? 'onclick="document.getElementById(\'promotion-card\').scrollIntoView({behavior:\'smooth\'}); return false;"' : '';
    const promo_onclick_mobile = filename === 'seller-centre.html' ? 'onclick="toggleSellerMobileMenu(false); document.getElementById(\'promotion-card\').scrollIntoView({behavior:\'smooth\'}); return false;"' : '';

    let desktop_new = desktopNavTemplate;
    let mobile_new = mobileNavTemplate;

    for (const [k, v] of Object.entries(active_map)) {
        desktop_new = desktop_new.replace(new RegExp(k, 'g'), v);
        mobile_new = mobile_new.replace(new RegExp(k, 'g'), v);
    }
    
    desktop_new = desktop_new.replace('{promo_href}', promo_href).replace('{promo_onclick}', promo_onclick);
    mobile_new = mobile_new.replace('{promo_href}', promo_href).replace('{promo_onclick_mobile}', promo_onclick_mobile);

    desktop_new = desktop_new.replace(/ class="menu-item "/g, ' class="menu-item"').replace(/  ><span/g, '><span');
    mobile_new = mobile_new.replace(/ class="menu-item "/g, ' class="menu-item"').replace(/  ><span/g, '><span');

    content = content.replace(/    <aside class="sidebar">[\s\S]*?<\/aside>/, desktop_new);
    content = content.replace(/            <div class="mobile-sidebar-content">[\s\S]*?<\/div>/, mobile_new);

    fs.writeFileSync(filename, content, 'utf-8');
    console.log(`Updated ${filename}`);
});
