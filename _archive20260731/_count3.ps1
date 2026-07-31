$lines = Get-Content "src\data\cities_v2.ts"
$cityCount = 0
foreach($l in $lines) {
    if ($l -match "\{ id: 'city_") { $cityCount++ }
}
Write-Host "Cities with { id: 'city_': $cityCount"
