import os
import re

target_dir = r"c:\Users\Lazy\Desktop\Paomobile Web Main"
pattern = re.compile(r'<a href="javascript:void\(0\)" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">›</span></a>')
replacement = '<a href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">›</span></a>'

count = 0
for filename in os.listdir(target_dir):
    if filename.endswith(".html"):
        path = os.path.join(target_dir, filename)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if pattern.search(content):
                new_content = pattern.sub(replacement, content)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated: {filename}")
                count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Total files updated: {count}")
