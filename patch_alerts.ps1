# Script to replace all alert() calls with premium sellerAlert() in JS files
# Uses a wrapper pattern: wraps alert() calls to use sellerAlert() when available

$files = @(
    "checkout.js",
    "script.js",
    "seller-centre.js",
    "seller-chat.js",
    "seller-config.js",
    "seller-orders.js",
    "seller-vouchers.js",
    "seller-products.js",
    "auth.js"
)

$replaced = 0
$fileCount = 0

foreach ($fileName in $files) {
    $fullPath = Join-Path (Get-Location) $fileName
    if (-not (Test-Path $fullPath)) {
        Write-Host "SKIP (not found): $fileName"
        continue
    }

    $content = [System.IO.File]::ReadAllText($fullPath, [System.Text.Encoding]::UTF8)
    $original = $content

    # Replace standalone: alert('...') -> (window.sellerAlert ? sellerAlert('...','info') : alert('...'))
    # We do a regex replacement for simple cases
    # Pattern: alert( followed by content and closing );
    # We'll use a simpler approach: add a polyfill/override at the TOP of each file

    # Check if already has our override
    if ($content -match "window\.__alertOverrideInjected") {
        Write-Host "SKIP (already patched): $fileName"
        continue
    }

    # Inject override at the very beginning of the file
    $override = @"
/* ── Premium Alert Override (auto-injected) ── */
(function() {
    if (window.__alertOverrideInjected) return;
    window.__alertOverrideInjected = true;
    var _nativeAlert = window.alert;
    window.alert = function(msg) {
        if (window.sellerAlert) {
            // Detect type from message content
            var type = 'info';
            if (msg && (msg.includes('Error') || msg.includes('error') || msg.includes('ไม่สำเร็จ') || msg.includes('❌') || msg.includes('⚠️') || msg.includes('ลบ') || msg.includes('ข้อผิดพลาด'))) type = 'error';
            else if (msg && (msg.includes('✅') || msg.includes('สำเร็จ') || msg.includes('เรียบร้อย') || msg.includes('บันทึก'))) type = 'success';
            else if (msg && (msg.includes('⚠️') || msg.includes('กรุณา') || msg.includes('ระวัง'))) type = 'warning';
            window.sellerAlert(String(msg), type);
        } else {
            _nativeAlert(msg);
        }
    };
})();
/* ── End Premium Alert Override ── */

"@

    $newContent = $override + $content

    [System.IO.File]::WriteAllText($fullPath, $newContent, [System.Text.Encoding]::UTF8)
    $fileCount++
    Write-Host "PATCHED: $fileName"
}

Write-Host ""
Write-Host "Done! Patched $fileCount files."
