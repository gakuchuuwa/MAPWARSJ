$lines = Get-Content "src\data\cities_v2.ts"
$counts=@{}
foreach($l in $lines) {
    if($l -match "type: '([^']+)'") {
        $t = $matches[1]
        if(-not $counts.ContainsKey($t)) { $counts[$t] = 0 }
        $counts[$t]++
    }
}
$total = 0
$counts.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host ("  " + $_.Name + ": " + $_.Value)
    $total += $_.Value
}
Write-Host ("  --------")
Write-Host ("  TOTAL: " + $total)
