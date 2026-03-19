import os
import glob
import re

html_files = glob.glob("*.html")

replacements = [
    (r'href="(javascript:void\(0\)|#)" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ', 
     'href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ'),
    (r'\?\? สั่งของ', '🛒 สั่งของ'),
    (r'\?\? สินค้ามือ 1', '📱 สินค้ามือ 1'),
    (r'\?\? สินค้ามือ 2', '🔁 สินค้ามือ 2'),
    (r'\?\? Accessory', '🎧 Accessory'),
    (r'\?\? Shopee', '🛒 Shopee'),
    (r'\?\? สอบถามเพิ่มเติม', '💬 สอบถามเพิ่มเติม'),
    (r'Made with \?\? in Thailand', 'Made with 🧡 in Thailand'),
    (r'\? 2026 Paomobile', '© 2026 Paomobile'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>ซ่อมจอ)', '<div class="ssc-icon">🔧</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>เปลี่ยนแบต)', '<div class="ssc-icon">🔋</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>ซ่อมบอร์ด)', '<div class="ssc-icon">🔬</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>ซ่อมลำโพง)', '<div class="ssc-icon">🔊</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>เปลี่ยนชุดชาร์จ)', '<div class="ssc-icon">🔌</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>เปลี่ยนฝาหลัง)', '<div class="ssc-icon">📱</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>ซ่อม Face ID)', '<div class="ssc-icon">🆔</div>'),
    (r'<div class="ssc-icon">\?\?</div>(?=.{1,100}<h3>ซ่อมกล้อง)', '<div class="ssc-icon">📸</div>')
]

for file_path in html_files:
    if file_path in ['temp_restore']: continue # Skip dir if caught
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        orig_content = content
        for p, r in replacements:
            content = re.sub(p, r, content, flags=re.DOTALL)
            
        if content != orig_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Restored icons/links for {file_path}")
    except Exception as e:
        print(f"Failed to process {file_path}: {e}")
