$oldSearchHtml = @"
    <!-- Search Modal -->
    <div class="site-search-overlay" id="searchOverlay">
        <button class="search-close-btn" id="searchClose" aria-label="Close Search">✕</button>
        <div class="search-modal-container">
            <div class="search-hero-input">
                <span class="search-hero-icon">🔍</span>
                <input type="text" id="searchInput" placeholder="ค้นหา เครื่องมือ 1, เครื่องมือ 2, รุ่นมือถือ..." autocomplete="off">
                <button class="search-clear-btn" id="searchClear" aria-label="Clear Search">✕</button>
            </div>
            <div class="search-results-area" id="searchResults"></div>
        </div>
    </div>
</body>
"@

$rootPath = "c:\Users\Lazy\Desktop\Paomobile Web Main"
$htmlFiles = Get-ChildItem -Path $rootPath -Filter "*.html" -Recurse

foreach ($fileItem in $htmlFiles) {
    if ($fileItem.Name -like "tmp_*") { continue }
    
    $file = $fileItem.FullName
    $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    
    # Identify the block I inserted (it had "Premium Overlay" in the comment)
    $patternInserted = '(?s)<!-- Search Modal (Premium Overlay) -->.*?</body>'
    
    if ($content -match $patternInserted) {
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $patternInserted, $oldSearchHtml)
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Reverted: $($fileItem.Name)"
    }
}
