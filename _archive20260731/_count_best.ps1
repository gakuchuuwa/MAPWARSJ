$text = Get-Content "src\data\cities_v2.ts" -Raw

# Count city entries - { followed by id: on same or next line
$entries = $text -split '\r?\n'
$cityCount = 0
$big = 0; $med = 0; $small = 0; $pass = 0; $ferry = 0
$inEntry = $false
$currentEntry = ""

foreach($l in $entries) {
    $trimmed = $l.Trim()
    
    # Detect start of a city entry
    if ($trimmed -match '^\{') {
        $inEntry = $true
        $currentEntry = $l
    }
    elseif ($inEntry) {
        $currentEntry += " " + $l
    }
    
    # Detect end of a city entry
    if ($inEntry -and ($trimmed -match '^\},?\s*(//.*)?$' -or $trimmed -match '^\{.*id:.*\},?\s*(//.*)?$')) {
        $cityCount++
        if ($currentEntry -match "type: 'big_city'") { $big++ }
        elseif ($currentEntry -match "type: 'medium_city'") { $med++ }
        elseif ($currentEntry -match "type: 'small_city'") { $small++ }
        elseif ($currentEntry -match "type: 'pass'") { $pass++ }
        elseif ($currentEntry -match "type: 'ferry'") { $ferry++ }
        $inEntry = $false
        $currentEntry = ""
    }
    elseif ($inEntry -and $trimmed -match '^\},?\s*(//.*)?$') {
        # End of multi-line entry
        $cityCount++
        if ($currentEntry -match "type: 'big_city'") { $big++ }
        elseif ($currentEntry -match "type: 'medium_city'") { $med++ }
        elseif ($currentEntry -match "type: 'small_city'") { $small++ }
        elseif ($currentEntry -match "type: 'pass'") { $pass++ }
        elseif ($currentEntry -match "type: 'ferry'") { $ferry++ }
        $inEntry = $false
        $currentEntry = ""
    }
}

Write-Host "=== 城市据点统计 ==="
Write-Host "大城 (big_city)     : $big"
Write-Host "中城 (medium_city)  : $med"
Write-Host "小城 (small_city)   : $small"
Write-Host "关隘 (pass)         : $pass"
Write-Host "渡口 (ferry)        : $ferry"
Write-Host "---------------------"
Write-Host "总计城市            : $cityCount"
Write-Host "(大城+中城+小城+关隘+渡口): $($big+$med+$small+$pass+$ferry)"
