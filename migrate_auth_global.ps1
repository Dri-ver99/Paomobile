$files = Get-ChildItem -Filter "*.html"
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    $modified = $false

    # Remove Firebase CDN scripts
    if ($content -match '<script src="https://www.gstatic.com/firebasejs[^>]*></script>') {
        $content = $content -replace '(?i)<script src="https://www.gstatic.com/firebasejs[^>]*></script>\s*', ''
        $modified = $true
    }

    # Add Supabase scripts before </head> if not present
    if ($content -notmatch 'supabase-js@2') {
        if ($content -match '</head>') {
            $supabaseScripts = "<script src=`"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`"></script>`n<script src=`"db.js`"></script>`n</head>"
            $content = $content -replace '</head>', $supabaseScripts
            $modified = $true
        }
    } else {
        # If supabase is there but not db.js
        if ($content -notmatch 'src="db.js"') {
            $content = $content -replace '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>', "<script src=`"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`"></script>`n    <script src=`"db.js`"></script>"
            $modified = $true
        }
    }

    if ($modified) {
        Set-Content $f.FullName $content
        Write-Host "Updated $($f.Name)"
    }
}
