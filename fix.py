import os
import glob

# Try reading as Windows-1252 and writing as UTF-8
for f in glob.glob('*.html'):
    if f == 'index.html':
        continue
    
    try:
        # The file was originally saved by powershell's Set-Content -Encoding UTF8
        # but the content was interpreted as Windows-1252.
        # This means the bytes on disk are valid UTF-8, but represent characters from Windows-1252.
        
        with open(f, 'r', encoding='utf-8') as file:
            wrong_string = file.read()
            
        # Convert wrong string back to bytes using latin1 (iso-8859-1 / win-1252 equivalent)
        raw_bytes = wrong_string.encode('latin1')
        
        # Now decode those original bytes as UTF-8 (which they originally were)
        correct_string = raw_bytes.decode('utf-8')
        
        # Write back correctly
        with open(f, 'w', encoding='utf-8') as out_file:
            out_file.write(correct_string)
            
        print(f"Fixed {f}")
    except Exception as e:
        print(f"Skipped {f}: {e}")
