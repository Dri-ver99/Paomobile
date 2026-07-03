$dir = Get-Location
$files = Get-ChildItem -Path $dir -Include *.html,*.js -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    
    $content = $content -replace '(?m)const\s*\{\s*signInWithEmailAndPassword[^}]*\}\s*=\s*window\.firebaseAuth;', ''
    $content = $content -replace '(?m)const\s*auth\s*=\s*window\.auth;', 'const supabase = window.supabaseClient;'
    $content = $content -replace '(?m)const\s*db\s*=\s*window\.db;', ''
    $content = $content -replace 'await\s+signInWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)', 'await supabase.auth.signInWithPassword({ email: $1, password: $2 })'
    $content = $content -replace 'await\s+createUserWithEmailAndPassword\(\s*auth\s*,\s*([^,]+),\s*([^)]+)\)', 'await supabase.auth.signUp({ email: $1, password: $2 })'
    $content = $content -replace 'await\s+sendPasswordResetEmail\(\s*auth\s*,\s*([^)]+)\)', 'await supabase.auth.resetPasswordForEmail($1)'
    $content = $content -replace 'auth\.currentUser', '(await supabase.auth.getSession()).data.session?.user'

    if ($content -cne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        Write-Host "Migrated auth in $($file.Name)"
    }
}
