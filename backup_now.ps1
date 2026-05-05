$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = ".\BACKUP_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$files = @(
    "cart.js",
    "product-modal.js",
    "parts.html",
    "search.js",
    "seller-config.js",
    "seller-products.js",
    "seller-centre.js",
    "seller-chat.js",
    "seller-orders.js",
    "seller-vouchers.js",
    "checkout.js",
    "script.js",
    "auth.js",
    "products-sync.js",
    "premium-alerts.js"
)

# Also backup all HTML files (since we injected premium-alerts.js into them)
$htmlFiles = Get-ChildItem -Filter "*.html" | Select-Object -ExpandProperty Name
$allFiles = ($files + $htmlFiles) | Sort-Object -Unique

$count = 0
foreach ($f in $allFiles) {
    if (Test-Path $f) {
        Copy-Item $f "$backupDir\$f" -Force
        $count++
        Write-Host "Backed up: $f"
    }
}

Write-Host ""
Write-Host "✅ Done! Backed up $count files to: $backupDir"
