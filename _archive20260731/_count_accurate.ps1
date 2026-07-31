$lines = Get-Content "src\data\cities_v2.ts"
$big = 0; $med = 0; $small = 0; $pass = 0; $ferry = 0; $battle = 0
$totalCities = 0
foreach($l in $lines) {
    # Match lines that start a city object (has id: and is inside braces)
    if ($l -match "\{ id: 'city_|'id: 'city_") {
        $totalCities++
        if ($l -match "type: 'big_city'") { $big++ }
        elseif ($l -match "type: 'medium_city'") { $med++ }
        elseif ($l -match "type: 'small_city'") { $small++ }
        elseif ($l -match "type: 'pass'") { $pass++ }
        elseif ($l -match "type: 'ferry'") { $ferry++ }
        elseif ($l -match "type: 'battlefield'") { $battle++ }
    }
}
Write-Host "=== 城市据点统计 ==="
Write-Host "大城 (big_city)     : $big"
Write-Host "中城 (medium_city)  : $med"
Write-Host "小城 (small_city)   : $small"
Write-Host "关隘 (pass)         : $pass"
Write-Host "渡口 (ferry)        : $ferry"
Write-Host "战场 (battlefield)  : $battle"
Write-Host "---------------------"
Write-Host "总计                : $totalCities"
