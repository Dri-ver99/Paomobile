$browser = New-Object -ComObject InternetExplorer.Application
$browser.Visible = $false
$browser.Navigate("file:///c:/Users/Lazy/Desktop/Paomobile%20Web%20Main/test-syntax.html")
while ($browser.Busy) { Start-Sleep -Milliseconds 100 }
Start-Sleep -Seconds 1
Write-Host "Title:" $browser.Document.title
$browser.Quit()
