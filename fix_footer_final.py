import os

replacements = [
    ('เธฅเน‰เธฒเธ‡เน€เธ„เธฃเธทเนˆเธญเธ‡ / เธฅเธ‡เน‚เธ›เธฃเน เธ เธฃเธก', 'ล้างเครื่อง / ลงโปรแกรม'),
    ('เน€เธ„เธส / เธญเธธเธ›เธ เธฃเธ“เนŒเน€เธชเธฃเธดเธก', 'เคส / อุปกรณ์เสริม'),
    ('เธšเธฃเธดเธ เธฒเธฃเน€เธชเธฃเธดเธก', 'บริการเสริม'),
    ('เธ•เธดเธ”เธŸเธดเธฅเนŒเธกเธ เธฃเธฐเธˆเธ ', 'ติดฟิล์มกระจก'),
    ('เธ เธนเน‰เธ‚เน‰เธญเธกเธนเธฅ', 'กู้ข้อมูล'),
    ('เธšเธฃเธดเธ เธฒเธฃ', 'บริการ')
]

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        modified = False
        for corrupted, fixed in replacements:
            if corrupted in content:
                content = content.replace(corrupted, fixed)
                modified = True
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {os.path.basename(filepath)}")
            return True
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
    return False

if __name__ == "__main__":
    count = 0
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.html'):
                if fix_file(os.path.join(root, file)):
                    count += 1
    print(f"\nTotal files fixed: {count}")
