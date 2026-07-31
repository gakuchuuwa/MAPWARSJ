$lines = Get-Content "src\data\cities_v2.ts"
$big = 0; $med = 0; $small = 0; $pass = 0; $ferry = 0
foreach($l in $lines) {
    # Match lines that are actual city data with type field
    if ($l -match "type: 'big_city'") { $big++ }
    if ($l -match "type: 'medium_city'") { $med++ }
    if ($l -match "type: 'small_city'") { $small++ }
    if ($l -match "type: 'pass'") { $pass++ }
    if ($l -match "type: 'ferry'") { $ferry++ }
}
Write-Host "=== 城市类型统计 ==="
Write-Host "big_city    : $big"
Write-Host "medium_city : $med"
Write-Host "small_city  : $small"
Write-Host "pass        : $pass"
Write-Host "ferry       : $ferry"
$total = $big + $med + $small + $pass + $ferry
Write-Host "---------------------"
Write-Host "TOTAL       : $total"
