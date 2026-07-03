const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') || f.endsWith('.js'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    content = content.replace(/const\s*{\s*signInWithEmailAndPassword[^}]*}\s*=\s*window\.firebaseAuth;/g, '');
    content = content.replace(/const\s*auth\s*=\s*window\.auth;/g, 'const supabase = window.supabaseClient;');
    content = content.replace(/const\s*db\s*=\s*window\.db;/g, '');
    
    // Auth replacements
    content = content.replace(/await\s+signInWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)/g, 'await supabase.auth.signInWithPassword({ email: $1, password: $2 })');
    content = content.replace(/await\s+createUserWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)/g, 'await supabase.auth.signUp({ email: $1, password: $2 })');
    content = content.replace(/await\s+sendPasswordResetEmail\(\s*auth\s*,\s*([^)]+)\)/g, 'await supabase.auth.resetPasswordForEmail($1)');
    content = content.replace(/auth\.currentUser/g, '(await supabase.auth.getSession()).data.session?.user');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Migrated auth in ${file}`);
    }
}
