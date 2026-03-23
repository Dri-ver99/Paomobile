Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap("C:\Users\Lazy\Desktop\Paomobile Web Main\Thai Qr.png")
$c = $bmp.GetPixel(0,0)
Write-Output "#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B
$bmp.Dispose()
