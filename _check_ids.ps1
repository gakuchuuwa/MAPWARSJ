$lines = Get-Content "src\data\cities_v2.ts"
$idTypes = @{}
foreach($l in $lines) {
    if ($l -match "\{ id: '([^']+)'") {
        $id = $matches[1]
        $prefix = $id.Substring(0, [Math]::Min(8, $id.Length))
        if (-not $idTypes.ContainsKey($prefix)) { $idTypes[$prefix] = 0 }
        $idTypes[$prefix]++
    }
}
$idTypes.GetEnumerator() | Sort-Object Name | ForEach-Object {
    Write-Host "$($_.Name)... : $($_.Value)"
}
