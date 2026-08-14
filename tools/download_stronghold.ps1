$ErrorActionPreference = 'Stop'

$outDir = 'C:\MAPWARSJ\public\SUCAI\STRONGHOLD_RESOURCES'
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$assets = @(
    @{ Name = 'European_Troops.zip'; Url = 'https://www.spriters-resource.com/media/assets/61/64404.zip?updated=1755473492'; Referer = 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64404/' },
    @{ Name = 'Arabian_Troops.zip'; Url = 'https://www.spriters-resource.com/media/assets/61/64386.zip?updated=1755473489'; Referer = 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64386/' },
    @{ Name = 'Military_Buildings.zip'; Url = 'https://www.spriters-resource.com/media/assets/61/64401.zip?updated=1755473491'; Referer = 'https://www.spriters-resource.com/pc_computer/strongholdcrusader/asset/64401/' }
)

foreach ($item in $assets) {
    $dest = Join-Path $outDir $item.Name
    Write-Host "📥 正在下载《要塞》资源: $($item.Name)..."
    try {
        $headers = @{
            'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            'Referer' = $item.Referer
            'Accept' = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        }
        Invoke-WebRequest -Uri $item.Url -OutFile $dest -Headers $headers -TimeoutSec 30
        $size = (Get-Item $dest).Length
        Write-Host "✅ 下载成功: $($item.Name) ($size 字节)"
    } catch {
        Write-Host "❌ 下载失败: $($_.Exception.Message)"
    }
}
