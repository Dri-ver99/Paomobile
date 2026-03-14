import os
import glob
import re

directory = r"c:\Users\Lazy\Desktop\Paomobile Web Main"

for filepath in glob.glob(os.path.join(directory, "*.html")):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # 1. Desktop index style
        content = re.sub(
            r'<li>\s*<a href="#reviews">รีวิว</a>\s*</li>',
            r'''<li class="has-mega-menu">
          <a href="#reviews" class="review-desktop-link">รีวิว</a>
          <div class="mega-menu">
            <div class="mega-menu-inner" style="min-width: 200px;">
              <div class="mega-column">
                <a href="#reviews" class="mega-link">รีวิวลูกค้า</a>
                <a href="#showcase" class="mega-link">รีวิวงานซ่อม</a>
              </div>
            </div>
          </div>
        </li>''',
            content
        )
        
        # 2. Desktop subpage style
        content = re.sub(
            r'<li>\s*<a href="index\.html#reviews">รีวิว</a>\s*</li>',
            r'''<li class="has-mega-menu">
          <a href="index.html#reviews" class="review-desktop-link">รีวิว</a>
          <div class="mega-menu">
            <div class="mega-menu-inner" style="min-width: 200px;">
              <div class="mega-column">
                <a href="index.html#reviews" class="mega-link">รีวิวลูกค้า</a>
                <a href="index.html#showcase" class="mega-link">รีวิวงานซ่อม</a>
              </div>
            </div>
          </div>
        </li>''',
            content
        )
        
        # 3. Mobile index style
        content = re.sub(
            r'^\s*<a href="#reviews">รีวิว</a>\s*$',
            r'''      <a href="#reviews">รีวิว</a>
      <a href="#reviews" style="padding-left: 24px; font-size: 0.9em; opacity: 0.8;">- รีวิวลูกค้า</a>
      <a href="#showcase" style="padding-left: 24px; font-size: 0.9em; opacity: 0.8;">- รีวิวงานซ่อม</a>''',
            content,
            flags=re.MULTILINE
        )
        
        # 4. Mobile subpage style
        content = re.sub(
            r'^\s*<a href="index\.html#reviews">รีวิว</a>\s*$',
            r'''      <a href="index.html#reviews">รีวิว</a>
      <a href="index.html#reviews" style="padding-left: 24px; font-size: 0.9em; opacity: 0.8;">- รีวิวลูกค้า</a>
      <a href="index.html#showcase" style="padding-left: 24px; font-size: 0.9em; opacity: 0.8;">- รีวิวงานซ่อม</a>''',
            content,
            flags=re.MULTILINE
        )
        
        # Clean up the marker class
        content = content.replace(' class="review-desktop-link"', '')
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {os.path.basename(filepath)}")
    except Exception as e:
        print(f"Failed to process {os.path.basename(filepath)}: {e}")
