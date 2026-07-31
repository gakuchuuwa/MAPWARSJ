$content = Get-Content 'src/data/cities_v2.ts' -Raw

# Split by city blocks
$blocks = $content -split '(?<=\})\s*(?=\{|\r?\n\s*\{)'

foreach ($block in $blocks) {
    if ($block -match "type:\s*'medium_city'") {
        $name = ""
        $id = ""
        $region = ""
        $note = ""
        $tier = ""
        
        if ($block -match "name:\s*'([^']+)'") { $name = $matches[1] }
        if ($block -match "id:\s*'([^']+)'") { $id = $matches[1] }
        if ($block -match "region:\s*'([^']+)'") { $region = $matches[1] }
        if ($block -match "note:\s*'([^']+)'") { $note = $matches[1] }
        if ($block -match "tier:\s*([^,\s}]+)") { $tier = $matches[1] }
        
        Write-Host "$name`t| $id`t| region=$region`t| tier=$tier`t| $note"
    }
}
