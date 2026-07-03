const fs = require('fs');
const files = ['checkout.html', 'login.html', 'promotions.html'];

const replacements = [
    { from: '?? สั่งของ', to: '?? สั่งของ' },
    { from: '?? สินค้ามือ 1', to: '?? สินค้ามือ 1' },
    { from: '?? สินค้ามือ 2', to: '?? สินค้ามือ 2' },
    { from: '?? อะไหล่มือถือ', to: '?? อะไหล่มือถือ' },
    { from: '?? Accessory', to: '?? Accessory' },
    { from: '?? Shopee', to: '??? Shopee' },
    { from: 'class="mega-link">??', to: 'class="mega-link">???' },
    { from: '<h3>?? ตะกร้าสินค้า</h3>', to: '<h3>?? ตะกร้าสินค้า</h3>' },
    { from: '<span>??</span><p>ตะกร้าว่างเปล่า</p>', to: '<span>??</span><p>ตะกร้าว่างเปล่า</p>' },
    { from: '<span class="header-emoji">??</span> ที่อยู่ในการจัดส่ง', to: '<span class="header-emoji">??</span> ที่อยู่ในการจัดส่ง' },
    { from: '<span class="header-emoji">???</span> สั่งซื้อสินค้าแล้ว', to: '<span class="header-emoji">???</span> สั่งซื้อสินค้าแล้ว' },
    { from: '<span>?? รับที่ร้าน Paomobile</span>', to: '<span>?? รับที่ร้าน Paomobile</span>' },
    { from: '<span>?? ส่งพัสดุ (Kerry / Flash)</span>', to: '<span>?? ส่งพัสดุ (Kerry / Flash)</span>' },
    { from: '<span class="benefit-emoji">??</span>', to: '<span class="benefit-emoji">??</span>' },
    { from: '<span class="header-emoji">??</span> วิธีการชำระเงิน', to: '<span class="header-emoji">??</span> วิธีการชำระเงิน' },
    { from: '?? ก่อนสำคัญกับคืน/คืนสินค้า:', to: '?? ก่อนสำคัญกับคืน/คืนสินค้า:' },
    { from: '<span style="color: #2e7d32; font-weight: bold; flex-shrink: 0;">??</span>', to: '<span style="color: #2e7d32; font-weight: bold; flex-shrink: 0;">?</span>' },
    { from: '<span style="font-size: 1.5rem; line-height: 1;">??</span>', to: '<span style="font-size: 1.5rem; line-height: 1;">???</span>' },
    { from: '?? LINE: @pao789', to: '?? LINE: @pao789' },
    { from: '?? Facebook', to: '?? Facebook' },
    { from: '?? Instagram', to: '?? Instagram' }
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        for (const {from, to} of replacements) {
            content = content.split(from).join(to);
        }
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('Fixed emojis');
