$content = Get-Content 'src/data/cities_v2.ts'
$i = 0
$results = @()
while($i -lt $content.Count) {
    if ($content[$i] -match "type:\s*'medium_city'") {
        # Search backwards up to 15 lines for name field
        $name = "UNKNOWN"
        for($j = $i; $j -ge [Math]::Max(0, $i-15); $j--) {
            if ($content[$j] -match "name:\s*'([^']+)'") {
                $name = $matches[1]
                break
            }
        }
        $results += [PSCustomObject]@{Line=$i+1; Name=$name}
    }
    $i++
}
$results | Format-Table -AutoSize
Write-Host ("Total: " + $results.Count)
