import os
import glob

# Corrupted footer text block
CORRUPTED_HTML = '''<div class="footer-col"><h4>เธšเธฃเธดเธ เธฒเธฃเน€เธชเธฃเธดเธก</h4><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%9F%E0%B8%B4%E0%B8%A5%E0%B9%8C%E0%B8%A1%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%88%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">เธ•เธดเธ”เธŸเธดเธฅเนŒเธกเธ เธฃเธฐเธˆเธ </a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20%2F%20%E0%B8%A5%E0%B8%87%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B9%81%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">เธฅเน‰เธฒเธ‡เน€เธ„เธฃเธทเนˆเธญเธ‡ / เธฅเธ‡เน‚เธ›เธฃเน เธ เธฃเธก</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%81%E0%B8%B9%E0%B9%82%E0%B8%82%E0%B9%8A%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">เธ เธนเน‰เธ‚เน‰เธญเธกเธนเธฅ</a><a href="accessory.html">เน€เธ„เธช / เธญเธธเธ›เธ เธฃเธ“เนŒเน€เธชเธฃเธดเธก</a></div>'''

# Restored footer text block
RESTORED_HTML = '''<div class="footer-col"><h4>บริการเสริม</h4><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%9F%E0%B8%B4%E0%B8%A5%E0%B9%8C%E0%B8%A1%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%88%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ติดฟิล์มกระจก</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20%2F%20%E0%B8%A5%E0%B8%87%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B9%81%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ล้างเครื่อง / ลงโปรแกรม</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%81%E0%B8%B9%E0%B9%82%E0%B8%82%E0%B9%8A%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">กู้ข้อมูล</a><a href="accessory.html">เคส / อุปกรณ์เสริม</a></div>'''

fixed_files = 0
for file in glob.glob('*.html'):
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if CORRUPTED_HTML in content:
            content = content.replace(CORRUPTED_HTML, RESTORED_HTML)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            fixed_files += 1
            print(f'Fixed encoding in: {file}')
    except Exception as e:
        print(f"Error processing {file}: {e}")

print(f'Total {fixed_files} files rewritten!')
