$lines = Get-Content "src\data\cities_v2.ts"
$big = 0; $med = 0; $small = 0; $pass = 0; $ferry = 0
$cityCount = 0

# Method: collect each entry between { and },
# then check its combined text for type

# Split by comma-newline pattern to get individual entries
# Actually, let's use a simpler approach:
# Find all blocks that contain "id: 'city_" 
# by looking for { ... }, patterns

$inCity = $false
$currentBlock = ""
foreach($l in $lines) {
    $t = $l.Trim()
    
    # Skip non-data lines
    if ($t -eq "" -or $t -match '^//' -or $t -match '^export' -or $t -match '^import' -or $t -match '^\]' -or $t -match '^;$') {
        if ($inCity) { 
            $currentBlock += " " + $l
        }
        continue
    }
    
    # Check if this line starts a city entry
    if ($t -match '^\{' -and $t -match 'id:') {
        # Single-line entry: { id: 'xxx', ... },
        $cityCount++
        if ($t -match "type: 'big_city'") { $big++ }
        elseif ($t -match "type: 'medium_city'") { $med++ }
        elseif ($t -match "type: 'small_city'") { $small++ }
        elseif ($t -match "type: 'pass'") { $pass++ }
        elseif ($t -match "type: 'ferry'") { $ferry++ }
    }
    elseif ($t -match '^\{' -and $t -notmatch 'id:') {
        # Multi-line entry starts
        $inCity = $true
        $currentBlock = $l
    }
    elseif ($inCity) {
        $currentBlock += " " + $l
        if ($t -match '^\},?\s*(//.*)?$') {
            # End of multi-line entry
            $cityCount++
            if ($currentBlock -match "type: 'big_city'") { $big++ }
            elseif ($currentBlock -match "type: 'medium_city'") { $med++ }
            elseif ($currentBlock -match "type: 'small_city'") { $small++ }
            elseif ($currentBlock -match "type: 'pass'") { $ferry++ }
            elseif ($currentBlock -match "type: 'ferry'") { $ferry++ }
            $inCity = $false
            $currentBlock = ""
        }
    }
}

Write-Host "=== 最终统计 ==="
Write-Host "大城 (big_city)     : $big"
Write-Host "中城 (medium_city)  : $med"
Write-Host "小城 (small_city)   : $small"
Write-Host "关隘 (pass)         : $pass"
Write-Host "渡口 (ferry)        : $ferry"
Write-Host "---------------------"
Write-Host "总计                : $cityCount"
