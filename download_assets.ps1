$baseUrl = "https://irisxhq.vercel.app"
$targetDir = "d:\my PF\vigo\iris-web\public"

$files = @(
    "/img/logo.png",
    "/img/bright-neon-bg.png",
    "/Scroll/1.png",
    "/Scroll/2.png",
    "/Scroll/3.png",
    "/Scroll/4.png",
    "/Scroll/5.png",
    "/Scroll/6.png",
    "/Scroll/7.png",
    "/Scroll/original/iris.png"
)

foreach ($file in $files) {
    $url = $baseUrl + $file
    $outPath = $targetDir + $file.Replace('/', '\')
    $dir = Split-Path $outPath
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
    }
    Write-Host "Downloading $url to $outPath"
    try {
        Invoke-WebRequest -Uri $url -OutFile $outPath
    } catch {
        Write-Host "Failed to download $url"
    }
}
