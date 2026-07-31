$text = Get-Content "src\data\cities_v2.ts" -Raw

# Count all occurrences of type: 'big_city' 
$count = [regex]::Matches($text, "type: 'big_city'").Count
Write-Host "type: 'big_city' 出现次数: $count"

# Also list all entries with their names
$lines = Get-Content "src\data\cities_v2.ts"
$currentName = ""
$currentType = ""
for($i = 0; $i -lt $lines.Length; $i++) {
    $l = $lines[$i]
    
    if ($l -match "name: '([^']+)'") {
        $currentName = $matches[1]
    }
    
    if ($l -match "type: '([^']+)'") {
        $currentType = $matches[1]
    }
    
    # Check if this is the end of a city entry (single line or multi-line)
    if ($l -match "^\s*\}," -or $l -match "^\s*\}\s*$") {
        if ($currentName -ne "" -and $currentType -eq "big_city") {
            Write-Host "  $currentName"
        }
        $currentName = ""
        $currentType = ""
    }
    
    # Single-line entries
    if ($l -match "\{ id: 'city_'") {
        if ($l -match "name: '([^']+)'") { $currentName = $matches[1] }
        if ($l -match "type: '([^']+)'") { $currentType = $matches[1] }
        if ($l -match "\}," -and $currentType -eq "big_city") {
            Write-Host "  $currentName (single-line)"
        }
        if ($l -match "\},") {
            $currentName = ""
            $currentType = ""
        }
    }
}
