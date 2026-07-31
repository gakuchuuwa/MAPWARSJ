$lines = Get-Content "src\data\cities_v2.ts"
$i = 0
foreach($l in $lines) {
    $i++
    if ($l -match "type: 'big_city'") {
        Write-Host "Line $i : $l"
    }
}
