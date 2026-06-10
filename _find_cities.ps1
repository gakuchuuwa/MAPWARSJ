$lines = Get-Content 'src/data/cities_v2.ts'
$ids = @(
    'city_xinzheng','city_zhaoge','city_tongwancheng','city_ningan',
    'city_fuhan','city_fusicheng','city_gaochangcheng','city_xingqingfu2',
    'city_shenglong','city_fuchun','city_asuka','city_xiapi',
    'city_qufu','city_puyang','city_xindu','city_hongzhou',
    'city_yongzhou','city_langzhong_gucheng','city_shanghai','city_suiye',
    'city_yutian2','city_kulun','city_samaerhan'
)
foreach ($id in $ids) {
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $id) {
            Write-Host ("$id => line $($i+1): $($lines[$i])")
            break
        }
    }
}
