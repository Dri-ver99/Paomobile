Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    # Navbar Sync
    $content = $content -replace 'href="javascript:void\(0\)" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ', 'href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ'
    $content = $content -replace 'href="#" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ', 'href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ'
    
    # Emojis in Navbar (handling potential variations of the ?? markers)
    $content = $content -replace '\?\? สั่งของ', '🛒 สั่งของ'
    $content = $content -replace '\?\? สินค้ามือ 1', '📱 สินค้ามือ 1'
    $content = $content -replace '\?\? สินค้ามือ 2', '🔁 สินค้ามือ 2'
    $content = $content -replace '\?\? Accessory', '🎧 Accessory'
    $content = $content -replace '\?\? Shopee', '🛒 Shopee'
    
    # Emojis in Content (Service Cards)
    # Using simple replacements first for common markers
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*ซ่อมจอ)', '<div class="ssc-icon">🔧</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*เปลี่ยนแบต)', '<div class="ssc-icon">🔋</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*ซ่อมบอร์ด)', '<div class="ssc-icon">🔬</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*ลำโพง)', '<div class="ssc-icon">🔊</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*ชุดชาร์จ)', '<div class="ssc-icon">🔌</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*ฝาหลัง)', '<div class="ssc-icon">📱</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*Face ID)', '<div class="ssc-icon">🆔</div>'
    $content = $content -replace '<div class="ssc-icon">\?\?</div>(?=.*กล้อง)', '<div class="ssc-icon">📸</div>'
    
    # Footer and CTA icons
    $content = $content -replace '\?\? สอบถามเพิ่มเติม', '💬 สอบถามเพิ่มเติม'
    $content = $content -replace 'Made with \?\? in Thailand', 'Made with 🧡 in Thailand'
    $content = $content -replace '© 2026 Paomobile. All rights reserved.', '© 2026 Paomobile. All rights reserved.'
    # Fix copyright symbol if it was corrupted to ?
    $content = $content -replace '\? 2026 Paomobile', '© 2026 Paomobile'

    [System.IO.File]::WriteAllText($_.FullName, $content)
    Write-Host "Restored icons for $($_.Name)"
}
