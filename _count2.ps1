$lines = Get-Content "src\data\cities_v2.ts"
$big = 0; $med = 0; $small = 0; $pass = 0; $ferry = 0
foreach($l in $lines) {
    if ($l -match "type: 'big_city'") { $big++ }
    elseif ($l -match "type: 'medium_city'") { $med++ }
    elseif ($l -match "type: 'small_city'") { $small++ }
    elseif ($l -match "type: 'pass'") { $pass++ }
    elseif ($l -match "type: 'ferry'") { $ferry++ }
}
Write-Host "big_city: $big"
Write-Host "medium_city: $med"
Write-Host "small_city: $small"
Write-Host "pass: $pass"
Write-Host "ferry: $ferry"
$total = $big + $med + $small + $pass + $ferry
Write-Host "TOTAL: $total"
