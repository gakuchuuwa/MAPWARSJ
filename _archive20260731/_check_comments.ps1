$lines = Get-Content "src\data\cities_v2.ts"
$i = 0
foreach($l in $lines) {
    $i++
    if ($l -match "type: 'small_city'" -and $l -notmatch "id: 'city_") {
        Write-Host "Line $i : $l"
    }
}
Write-Host "=== Done ==="
