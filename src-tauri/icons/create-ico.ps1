Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('C:\Users\ibane\Desktop\proyecto_personal\mamada-reproductor\src-tauri\icons\icon.png')
$icon = [System.Drawing.Icon]::FromHandle($img.GetHicon())
$fs = [System.IO.File]::Create('C:\Users\ibane\Desktop\proyecto_personal\mamada-reproductor\src-tauri\icons\icon.ico')
$icon.Save($fs)
$fs.Close()
Write-Host 'ICO created'