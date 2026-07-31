$content = [System.Collections.ArrayList]@(Get-Content 'src/data/cities_v2.ts')

# Perform targeted replacements per city by line number.
# Line numbers are 0-based for array indexing

# 1. 统万城 (line 1440, 0-based: 1439)
$idx = 1439
$content[$idx] = "    { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', lat: 37.99, lng: 108.86, type: 'medium_city', troops: 10000, tier: 1 },"

# 2. 龙泉府 (line 1444, 0-based: 1443)
$idx = 1443
$content[$idx] = "    { id: 'city_ningan', name: '龙泉府', factionId: 'bohai', lat: 44.120000, lng: 129.140000, type: 'medium_city', region: 'NORTHEAST', troops: 10000, tier: 1 },"

# 3. 伏俟城 (line 1510, 0-based: 1509)
$idx = 1509
$content[$idx] = "    { id: 'city_fusicheng', name: '伏俟城', factionId: 'tuyu_d', lat: 36.760890, lng: 99.742126, type: 'medium_city', troops: 10000, tier: 1 },"

# 4. 曲阜 (line 1498, 0-based: 1497)
$idx = 1497
$content[$idx] = "    { id: 'city_qufu', name: '曲阜', factionId: 'kong_d', lat: 35.6, lng: 116.98, type: 'medium_city', troops: 10000, tier: 1 },"

# 5. 飞鸟宫 (line 2319, 0-based: 2318)
$idx = 2318
$content[$idx] = "    { id: 'city_asuka', name: '飞鸟宫', factionId: 'yamato', lat: 34.336668, lng: 135.689392, type: 'medium_city', troops: 10000, tier: 1 },"

# 6. 洪州 (line 2791, 0-based: 2790)
$idx = 2790
$content[$idx] = "    { id: 'city_hongzhou', name: '洪州', factionId: 'yuzhang', lat: 28.6828, lng: 115.8575, type: 'medium_city', troops: 10000, tier: 1 },"

# 7. 邕州 (line 1671, 0-based: 1670)
$idx = 1670
$content[$idx] = "    { id: 'city_yongzhou', name: '邕州', factionId: 'nongzhigao', lat: 22.81, lng: 108.31, type: 'medium_city', troops: 10000, tier: 1 },"

# 8. 高昌 (line 2667, 0-based: 2666)
$idx = 2666
$content[$idx] = "    { id: 'city_gaochangcheng', name: '高昌', factionId: 'qu_clan', lat: 42.8533, lng: 89.53, type: 'medium_city', troops: 10000, tier: 1 },"

# 9. 兴庆府 (line 2709, 0-based: 2708)
$idx = 2708
$content[$idx] = "    { id: 'city_xingqingfu2', name: '兴庆府', factionId: 'dangxiang', lat: 38.470000, lng: 106.270000, type: 'medium_city', troops: 10000, tier: 1 },"

# 10. 于阗 (line 2738, 0-based: 2737)
$idx = 2737
$content[$idx] = "    { id: 'city_yutian2', name: '于阗', factionId: 'yutian', lat: 37.11, lng: 79.91, type: 'medium_city', troops: 10000, tier: 1 },"

# 11. 撒马尔罕 (line 2672, 0-based: 2671)
$idx = 2671
$content[$idx] = "    { id: 'city_samaerhan', name: '撒马尔罕', factionId: 'tiemuer', lat: 39.652500, lng: 66.971400, type: 'medium_city', troops: 10000, tier: 1 },"

# Multi-line format entries - change specific lines

# 12. 枹罕 (line 1421 = type, line 1422 = troops, 0-based: 1420, 1421)
$content[1420] = "        type: 'medium_city',"
$content[1421] = "        troops: 10000,"
# add tier: 1, before note
$content[1422] = "        tier: 1,"
$content[1423] = "        note: '西秦(乞伏氏)都城, 乞伏乾归自金城迁都枹罕, 后乞伏炽磐扩建为西秦国都; 十六国陇西鲜卑政权中心'"

# 13. 濮阳 (line 1535 = type, 1536 = troops, 0-based: 1534, 1535)
$content[1534] = "        type: 'medium_city',"
$content[1535] = "        troops: 10000,"
$content[1536] = "        tier: 1,"
$content[1537] = "        note: '卫国都城(今河南濮阳), 周初康叔封地, 春秋后期沦为小国, 前209年秦废卫君角'"

# 14. 朝歌 (line 1565 = type, 1566 = troops, 0-based: 1564, 1565)
$content[1564] = "        type: 'medium_city',"
$content[1565] = "        troops: 10000,"
$content[1566] = "        tier: 1,"
$content[1567] = "        note: '殷国司马卬都城(今河南淇县), 古商朝殷都/牧野之战故地'"

# 15. 下邳 (line 1586 = type, 1587 = troops, 0-based: 1585, 1586)
$content[1585] = "        type: 'medium_city',"
$content[1586] = "        troops: 10000,"
$content[1587] = "        tier: 1,"
$content[1588] = "        note: '吕布集团都城(今江苏睢宁北), 三国吕布据此为徐州之主'"

# 16. 信都 (line 1506 = type, 1507 = troops, 0-based: 1505, 1506)
$content[1505] = "        type: 'medium_city',"
$content[1506] = "        troops: 10000,"
$content[1507] = "        tier: 1,"
$content[1508] = "        note: '东魏北齐高氏起兵之地(今河北冀州), 高欢据信都起兵讨尔朱氏, 为北齐政权奠基'"

# 17. 新郑 (line 2313 = type, 2314 = troops, 0-based: 2312, 2313)
$content[2312] = "        type: 'medium_city',"
$content[2313] = "        troops: 10000,"
$content[2314] = "        tier: 1,"
$content[2315] = "        note: '古华夏九州之豫州, 战国时期韩国国都, 十大古都之一'"

# 18. 昇龙 (line 2325 = type, 2326 = troops, 0-based: 2324, 2325)
$content[2324] = "        type: 'medium_city',"
$content[2325] = "        troops: 10000,"
$content[2326] = "        tier: 1,"
$content[2327] = "        note: '大越国都，历代安南政权核心'"

# 19. 碎叶城 (line 1649 = type, 1650 = troops, 1651 = tier: 4, 0-based: 1648, 1649, 1650)
$content[1648] = "        type: 'medium_city',"
$content[1649] = "        troops: 10000,"
$content[1650] = "        tier: 1,"
$content[1651] = "        note: '突骑施汗国牙帐(碎叶城/今吉尔吉斯托克马克), 西突厥故地、中亚最著名的唐城遗址'"

# 20. 库伦 (line 1908 = type + troops, 0-based: 1907)
$content[1907] = "        lat: 47.92, lng: 106.91, type: 'medium_city', troops: 10000, tier: 1,"

# 21. 上海 (line 1964 = type + troops, 0-based: 1963)
$content[1963] = "        lat: 31.23, lng: 121.47, type: 'medium_city', troops: 10000, tier: 1,"

# 22. 富春 (line 2220 = type + troops + tier: 4, 0-based: 2219)
$content[2219] = "        lat: 16.4667, lng: 107.5833, type: 'medium_city', troops: 10000, tier: 1,"

# 23. 阆中 (line 2238 = type + troops + tier: 4, 0-based: 2237)
$content[2237] = "        lat: 31.5806, lng: 105.9722, type: 'medium_city', troops: 10000, tier: 1,"

# Write back
$content | Set-Content 'src/data/cities_v2.ts' -Encoding UTF8
Write-Host "All 23 cities upgraded successfully!"
