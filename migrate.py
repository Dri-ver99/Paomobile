import os
import re
import glob

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. Replace db.collection("...").doc(id).get() with supabase.from("...").select('*').eq('id', id).single()
    # Actually, it's safer to use manual regex for common patterns
    
    content = re.sub(r'const\s*{\s*signInWithEmailAndPassword[^}]*}\s*=\s*window\.firebaseAuth;', '', content)
    content = re.sub(r'const\s*auth\s*=\s*window\.auth;', 'const supabase = window.supabaseClient;', content)
    content = re.sub(r'const\s*db\s*=\s*window\.db;', '', content)
    
    # auth calls
    content = re.sub(r'await\s+signInWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)', r'await supabase.auth.signInWithPassword({ email: \1, password: \2 })', content)
    content = re.sub(r'await\s+createUserWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)', r'await supabase.auth.signUp({ email: \1, password: \2 })', content)
    content = re.sub(r'await\s+sendPasswordResetEmail\(\s*auth\s*,\s*([^)]+)\)', r'await supabase.auth.resetPasswordForEmail(\1)', content)

    # db queries
    # db.collection("users").where(..., "==", ...).limit(1).get()
    # This might be tricky with regex.

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Migrated auth in {filepath}")

for filepath in glob.glob("*.html"):
    migrate_file(filepath)

for filepath in glob.glob("*.js"):
    migrate_file(filepath)
