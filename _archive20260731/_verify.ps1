$lines = Get-Content "src\data\cities_v2.ts"
$bigCities = @()
foreach($l in $lines) {
    if ($l -match "type: 'big_city'") {
        # Find the city name
        if ($l -match "name: '([^']+)'") {
            $bigCities += $matches[1]
        }
    }
}
Write-Host "大城数量: $($bigCities.Count)"
Write-Host "列表:"
$bigCities | ForEach-Object { Write-Host "  - $_" }
