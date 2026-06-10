$cities = @('开源','岐山','长安','咸阳','渭南','潼关','函谷关','绳池','渑池','洛阳','天井关','长子')
foreach ($city in $cities) {
    Write-Output "--- $city ---"
    Select-String -Path "C:\MAPWARSJ\史料\01秦朝\*.txt" -Pattern $city -Context 2,2
}
