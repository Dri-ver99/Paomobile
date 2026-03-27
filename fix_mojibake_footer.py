import os
import glob
import re

# The "Gold Standard" footer block for the "Additional Services" column
GOLD_STANDARD_BLOCK = '<div class="footer-col"><h4>บริการเสริม</h4><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%95%E0%B8%B4%E0%B8%94%E0%B8%9F%E0%B8%B4%E0%B8%A5%E0%B9%8C%E0%B8%A1%E0%B8%81%E0%B8%A3%E0%B8%B0%E0%B8%88%E0%B8%81%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ติดฟิล์มกระจก</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%A5%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%80%E0%B8%84%E0%B8%A3%E0%B8%B7%E0%B9%88%E0%B8%AD%E0%B8%87%20%2F%20%E0%B8%A5%E0%B8%87%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B9%81%E0%B8%81%E0%B8%A3%E0%B8%A1%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">ล้างเครื่อง / ลงโปรแกรม</a><a href="https://line.me/R/ti/p/@pao789?text=%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%AC%E0%B8%81%E0%B8%B9%E0%B9%82%E0%B8%82%E0%B9%8A%E0%B8%AD%E0%B8%A1%E0%B8%B9%E0%B8%A5%E0%B8%84%E0%B8%A3%E0%B8%B1%E0%B8%9A" target="_blank">กู้ข้อมูล</a><a href="accessory.html">เคส / อุปกรณ์เสริม</a></div>'

# Regex to find the "Additional Services" column in various states
# Group 1 will be the entire column content
FOOTER_COL_REGEX = re.compile(r'<div class="footer-col"><h4>(?:บริการเสริม|เธšเธฃเธดเธ เธฒเธฃเน€\s?เธชเน€เธฃเธดเธก|เธšเธฃเธดเธ เธฒเธฃเน€เธชเธฃเธดเธก)</h4>.*?</div>', re.DOTALL)

def fix_content(content):
    original = content
    
    # Replace any variation of the "Additional Services" column with the Gold Standard
    content = FOOTER_COL_REGEX.sub(GOLD_STANDARD_BLOCK, content)
    
    # Also fix headers in other columns if corrupted
    content = content.replace('<h4>เธšเธฃเธดเธ เธฒเธฃ</h4>', '<h4>บริการ</h4>')
    content = content.replace('<h4>เธ•เธดเธ”เธ•เนˆเธญเน€เธฃเธฒ</h4>', '<h4>ติดต่อเรา</h4>')
    
    return content, content != original

def main():
    fixed_count = 0
    html_files = glob.glob('*.html')
    print(f"Scanning {len(html_files)} HTML files...")
    
    for file_path in html_files:
        if file_path == 'implementation_plan.md': continue # Skip self or artifacts if found (unlikely with glob *.html)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content, modified = fix_content(content)
            
            if modified:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"✅ Standardized footer in: {file_path}")
                fixed_count += 1
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
    
    print(f"\nCompleted! Total {fixed_count} files standardized.")

if __name__ == "__main__":
    main()
