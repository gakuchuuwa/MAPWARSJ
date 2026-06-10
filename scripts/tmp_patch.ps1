$content = Get-Content 'C:\MAPWARSJ\src\ai\TargetEvaluator.ts' -Raw
$old = 'roadRegistry.getNearestCityId(currentPosition.lat, currentPosition.lng) || options?.homeCityId'
$new = 'options?.homeCityId || roadRegistry.getNearestCityId(currentPosition.lat, currentPosition.lng)'
$content = $content.Replace($old, $new)
Set-Content 'C:\MAPWARSJ\src\ai\TargetEvaluator.ts' -Value $content -NoNewline
Write-Host 'Done'
