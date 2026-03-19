import os
import re

# Regex to match the promotion link with either javascript:void(0) or promotions.html
# and either › or ? or other single char in the arrow span.
pattern = re.compile(r'<a href="([^"]*)" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">(.)</span></a>')

replacement = '<a href="promotions.html" class="dropdown-item" style="padding-bottom: 8px;">รับสิทธิประโยชน์สุดพิเศษ <span class="arrow">›</span></a>'

def update_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = pattern.sub(replacement, content)
                    
                    if new_content != content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {file_path}")
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    update_files('.')
