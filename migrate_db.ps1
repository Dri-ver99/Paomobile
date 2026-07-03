$dir = Get-Location
$files = Get-ChildItem -Path $dir -Include *.html,*.js -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $original = $content
    
    # 1. db.collection('table').doc(id).get() -> (await supabase.from('table').select('*').eq('id', id).single()).data
    $content = [regex]::Replace($content, 'db\.collection\((.*?)\)\.doc\((.*?)\)\.get\(\)', '(await supabase.from($1).select(''*'').eq(''id'', $2).maybeSingle()).data')
    
    # 2. db.collection('table').doc(id).set(data) -> await supabase.from('table').upsert({ id: id, ...data })
    # This is tricky because `data` might not be spreadable directly if it's not a pure object in the syntax, but usually it's an object variable.
    $content = [regex]::Replace($content, 'db\.collection\((.*?)\)\.doc\((.*?)\)\.set\((.*?)\)', 'await supabase.from($1).upsert({ id: $2, ...$3 })')
    
    # 3. db.collection('table').doc(id).update(data) -> await supabase.from('table').update($3).eq('id', $2)
    $content = [regex]::Replace($content, 'db\.collection\((.*?)\)\.doc\((.*?)\)\.update\((.*?)\)', 'await supabase.from($1).update($3).eq(''id'', $2)')
    
    # 4. db.collection('table').doc(id).delete() -> await supabase.from('table').delete().eq('id', $2)
    $content = [regex]::Replace($content, 'db\.collection\((.*?)\)\.doc\((.*?)\)\.delete\(\)', 'await supabase.from($1).delete().eq(''id'', $2)')
    
    # 5. db.collection('table').get() -> (await supabase.from('table').select('*')).data
    $content = [regex]::Replace($content, 'db\.collection\((.*?)\)\.get\(\)', '(await supabase.from($1).select(''*'')).data')

    if ($content -cne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        Write-Host "Migrated db.collection in $($file.Name)"
    }
}
