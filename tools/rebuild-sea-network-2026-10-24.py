"""海路网重排（2026-10-24 主人授权：每个港口只连 2–3 个；特长线须符合史实）。

跑法（默认读 src/data/VectorSeaRouteData.ts，结果写临时文件，不直接覆盖仓库）：
  py tools/rebuild-sea-network-2026-10-24.py
  py tools/rebuild-sea-network-2026-10-24.py <输入ts> <输出ts>
验收后再手工覆盖 src/data/VectorSeaRouteData.ts。
口径与史实依据见 docs/02-design/海路网-单一口径-2026-10-24.md。

海路网重建 v2（2026-10-24 主人授权：每港只连 2-3 个港口，特长线须符合史实）。

v1 暴露的问题与修正：
  · 补孤港只看「最近」，会补出穿陆 300km 的假线（阿瑜陀耶—耽摩栗底）→ 改为按穿陆量过滤，
    河港/峡湾港（阿瑜陀耶、汉城、昇龙、伏尔加、阿穆尔、博尔贡…）单独放宽。
  · 端点满了就补不上（班加西/临海停在 1 条）→ 补孤港允许「挤掉」对方最长的一条非史实线。
  · 少数港（底比斯）纯内陆、无港可当 → 退港。
  · 孟加拉湾一圈与印度洋断开 → 按史补「普里—阿努拉德」（法显 414 年多摩梨帝→师子国同路）。
"""
import sys, re, json, math, heapq, tempfile
sys.path.insert(0, 'C:/MAPWARSJ/tools')
import sea_route_core as core

ROOT = 'C:/MAPWARSJ/'
TMP = tempfile.gettempdir().replace('\\', '/') + '/'
DATA = sys.argv[1] if len(sys.argv) > 1 else ROOT + 'src/data/VectorSeaRouteData.ts'   # 输入：待重排的海路文件
CITIES = ROOT + 'src/data/cities_v2.ts'
OUT_TS = sys.argv[2] if len(sys.argv) > 2 else TMP + 'VectorSeaRouteData.rebuilt.ts'
REPORT = TMP + 'sea_rebuild_report.json'

RETIRE = {
    'city_tucapel': '智利比奥比奥内陆据点，非海港（阿劳坎战争内陆要塞）',
    'city_teyuna': '哥伦比亚圣玛尔塔内华达山泰罗纳内陆城，无港口',
    'city_uxmal': '尤卡坦内陆玛雅城（距海约 60km），不临可航水域',
    'city_peitra': '纳巴泰内陆都城（距海约 80km），出海口是加沙/卢基乌斯·科梅',
    'city_quebec': '新法兰西母港是迪耶普/鲁昂/拉罗谢尔（不在城库），与城库内港口无史实航线',
    'city_thebes': '维奥蒂亚内陆城（距海约 30km），无军港；出海口是奥利斯',
}

# ── [v8 2026-10-24 主人「按历史吧，历史是港口就给港口」] 城库里有、历史上是海港/河海港、
#    却没海路的据点，补开港（每个补 2–3 条海路，由补孤港/贪心自动连就近港）。
NEW_PORTS = {
    'city_hamburg':      '汉堡：汉萨同盟北海大港（易北河口）',
    'city_gdansk':       '格但斯克：汉萨同盟波罗的海大港（维斯瓦河口）',
    'city_shiqieqing':   '什切青：汉萨同盟波罗的海港（奥得河口）',
    'city_tuile':        '推罗：腓尼基/罗马地中海大港',
    'city_latajiya':     '拉塔基亚：叙利亚海岸古港（塞琉古 Laodicea）',
    'city_jiasa':        '加沙：地中海东岸古港（迈乌马斯港）',
    'city_peiluximu':    '佩鲁西姆：尼罗河三角洲东支海口（埃及地中海门户）',
    'city_xibo':         '希波：努米底亚/罗马北非港（Hippo Regius）',
    'city_bujiaya':      '布佳亚：柏柏尔/哈夫斯北非港（Béjaïa）',
    'city_matelugang':   '马特鲁港：埃及地中海港（Marsa Matruh）',
    'city_daerban':      '打耳班：里海西岸港（杰尔宾特，里海—伏尔加商路）',
    'city_xiemianjieer': '谢缅杰尔：里海西岸港（可萨汗国 Semender）',
    'city_hangzhou':     '杭州：宋元市舶司海港（钱塘江口）',
    'city_kamakura':     '镰仓：13 世纪日本宋元贸易港（相模湾）',
    'city_haeju':        '瀑池：朝鲜西海岸港（海州）',
    'city_donghai':      '洞海城：越南中海岸港（洞海）',
}

# 史实核查判否/存疑 + v1 补出来的假线
FORBIDDEN = [
    ('city_lundun', 'city_newamsterdam'),   # 存疑：荷兰时代主线是阿姆斯特丹—新阿姆斯特丹
    ('city_lundun', 'city_quebec'),         # 否：1763 年英占后才有伦敦线
    ('city_veracruz', 'city_newamsterdam'), # v1 补出的假线：西属墨西哥湾—荷属大西洋
    ('city_veracruz', 'city_yala'),         # v1 补出的假线：墨西哥湾—巴西
    ('city_ayutthaya', 'city_danmoledi'),   # v1 假线：穿陆 325km（横穿马来半岛）
    ('city_ayutthaya', 'city_jidagang'),    # v1 假线：穿陆 273km
    ('city_nuergan', 'city_katsuyama'),     # v1 假线：穿陆 140km（走黑龙江河道）
    ('city_himeji', 'city_yoshida'),        # v1 假线：穿陆 84km（横穿本州）
    ('city_dasijiliweng', 'city_peierjiameng'),  # v1 假线：穿陆 100km
    ('city_peierjiameng', 'city_yanghe'),        # v1 假线：穿陆 125km
    ('city_madula', 'city_anulade'),       # 老线：穿陆 202km（马杜赖是内陆，港口是科尔凯）
    ('city_sanfoqi', 'city_kalasan'),      # 老线：穿陆 125km（巨港是穆西河河港）
    ('city_hamburg', 'city_calais'),       # v8 补出来的线：汉堡—加莱无汉萨直航，改汉堡—伦敦（钢院）
    ('city_xibo', 'city_cagliari'),        # v8 补出来的线：希波—撒丁岛无史实直航，改希波—迦太基
    ('city_donghai', 'city_yazhou'),       # v8 补出来的线：洞海—珠崖抢近邻，改洞海—阇槃（占城）
    ('city_telde', 'city_ribeira'),        # 特尔德—里贝拉（加那利—佛得角）让位给里斯本—佛得角这条主航段
]

FORCE_KEEP = [
    ('city_acapulco', 'city_hagatna'), ('city_hagatna', 'city_manila'), ('city_telde', 'city_havana'),
    ('city_lisiben', 'city_ribeira'), ('city_ribeira', 'city_salvador'), ('city_banama', 'city_lima'),
    ('city_havana', 'city_katachena'), ('city_angra', 'city_lisiben'), ('city_anulade', 'city_malacca'),
    ('city_bashila', 'city_kalaqi'), ('city_maijia', 'city_zeila'), ('city_maijia', 'city_beileinisi'),
    ('city_jiadisi', 'city_angra'), ('city_junshitandingbao', 'city_waerna'),
    ('city_junshitandingbao', 'city_telabuzong'),
    # [v7] 地中海东部主线：雅典—克里特—亚历山大（粮道/商路）。缺了它，雅典→亚历山大的最短路径会改走
    #      「以弗所下船—陆路—米利都再上船」，军团半路弃船走陆，违背「走海路就一直在海上」。
    ('city_yadian', 'city_knossos'),
    ('city_knossos', 'city_yalishanda'),
]

FORCE_ADD = [
    ('city_lima', 'city_acapulco'),          # 16 世纪后期 卡亚俄—阿卡普尔科（西属太平洋）
    ('city_junshitandingbao', 'city_telabuzong'),  # 黑海南岸（缺则黑海两半断开）
    ('city_hague', 'city_newamsterdam'),     # 1625 荷兰西印度公司（阿姆斯特丹以海牙为代理）
    ('city_beileinisi', 'city_zeila'),       # 红海南端—亚丁湾（埃及—亚丁航路）
    ('city_puli', 'city_anulade'),           # 孟加拉湾—锡兰（法显 414 年同路，多摩梨帝→师子国）
    ('city_veracruz', 'city_katachena'),     # 西属美洲：韦拉克鲁斯—卡塔赫纳（宝藏船队）
    ('city_nuergan', 'city_baizhu'),         # 阿穆尔河口—萨哈林（明代奴儿干—苦夷航路）
    ('city_ayutthaya', 'city_malacca'),      # 大城—马六甲（15–16 世纪暹罗香料航路）
    ('city_hamburg', 'city_lundun'),         # 汉堡—伦敦：汉萨同盟「钢院」商站（Stalhof）
    ('city_xibo', 'city_jiataji'),           # 希波—迦太基：迦太基故港（Hippo Regius）
    ('city_donghai', 'city_dupan'),          # 洞海—阇槃：越南中岸—占城沿海航路
    # ── 环球两段（2026-10-24 主人问「能环球吗」）──
    ('city_ribeira', 'city_guoa'),           # 好望角线：佛得角—果阿，达伽马 1497–99 卡布拉尔/达伽马航线（约 19500km，绕非洲，穿陆 0）
    ('city_sanjulian', 'city_lima'),         # 麦哲伦海峡线：圣胡利安港—利马（卡亚俄），麦哲伦 1520 过海峡后沿智利北上（约 6900km，穿陆 0）
    ('city_lisiben', 'city_ribeira'),         # 里斯本—佛得角：葡往几内亚/巴西/印度的出航段（1462 起），好望角线起点
    ('city_madula', 'city_puli'),            # 潘地亚—羯陵伽（马杜赖—普里）海岸航路：把印度西岸—信德一圈接回主网，环球才成环（约 2800km）
    ('city_sanjulian', 'city_saovicente'),   # 麦哲伦 1520 沿巴西海岸南下（里约→拉普拉塔→圣胡利安越冬）
    ('city_sanjulian', 'city_guanabara'),    # 同上：里约（瓜纳巴拉）停泊后南下
]

# 河港/峡湾港：出城到海必然被掩膜当成陆地的，放宽穿陆上限
RIVER_PORTS = {
    'city_ayutthaya', 'city_hanseong', 'city_shenglong', 'city_salaichuke', 'city_yidier',
    'city_bashila', 'city_nuergan', 'city_nanghar', 'city_boergong', 'city_antiejiya',
    'city_luoma', 'city_taizhou_zj', 'city_wendeng', 'city_madula', 'city_sanfoqi', 'city_hamburg', 'city_hangzhou',
}
LAND_LIMIT_RIVER = 140.0
LAND_LIMIT = 40.0
MAX_DEG = 3
MIN_DEG = 2


def load_cities():
    src = open(CITIES, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r"id:\s*'(city_[a-z0-9_]+)',\s*name:\s*'([^']+)',\s*factionId:\s*'[^']+',"
                         r"\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+)", src):
        out[m.group(1)] = (m.group(2), float(m.group(3)), float(m.group(4)))
    return out


def load_edges():
    text = open(DATA, encoding='utf-8').read()
    feats = []
    for m in re.finditer(r'name:\s*"([^"]+)"[\s\S]*?id:\s*"([^"]+)"[\s\S]*?startConnection:\s*"([^"]+)"[\s\S]*?endConnection:\s*"([^"]+)"[\s\S]*?coordinates:\s*\[([\s\S]*?)\n\s*\]', text):
        name, fid, a, b, body = m.groups()
        pts = [[float(x), float(y)] for x, y in re.findall(r'\[\s*(-?[\d.eE+-]+)\s*,\s*(-?[\d.eE+-]+)\s*\]', body)]
        feats.append({'name': name, 'id': fid, 'a': a, 'b': b, 'coords': pts,
                      'km': core.path_km(pts), 'land': core.route_land_km(pts)})
    return feats


cities = load_cities()
old_edges = load_edges()
print(f'城 {len(cities)} / 旧海路 {len(old_edges)}')
g = core.SeaGraph()


def nearest_candidates(portlist, top=10, cutoff=12000.0):
    cand = {}
    for p in portlist:
        nm, la, ln = cities[p]
        starts = g.port_links(la, ln)
        dist, real, seen = {}, {}, set()
        pq = []
        for i, (w, _) in starts.items():
            dist[i] = w; real[i] = 0.0
            heapq.heappush(pq, (w, i))
        while pq:
            d, u = heapq.heappop(pq)
            if u in seen:
                continue
            seen.add(u)
            if d > cutoff:
                break
            for v, w, r in g.adj[u]:
                nd = d + w
                if nd < dist.get(v, math.inf):
                    dist[v] = nd; real[v] = real[u] + r
                    heapq.heappush(pq, (nd, v))
        row = []
        for q in portlist:
            if q == p:
                continue
            ends = g.port_links(cities[q][1], cities[q][2])
            best = math.inf; bestr = 0
            for i, (w, r) in ends.items():
                if i in dist and dist[i] + w < best:
                    best = dist[i] + w; bestr = real[i] + r
            if best < math.inf:
                row.append((round(bestr), q))
        row.sort()
        cand[p] = row[:top]
    return cand


all_ports = sorted({e['a'] for e in old_edges} | {e['b'] for e in old_edges})
ports = sorted(set([p for p in all_ports if p not in RETIRE]) | set(NEW_PORTS))
print(f'原有港口 {len(all_ports)} → 退港 {len(RETIRE)}、补开港 {len(NEW_PORTS)} 后 {len(ports)}')

forbidden = {frozenset(p) for p in FORBIDDEN}
kept, removed = [], []
for e in old_edges:
    if e['a'] in RETIRE or e['b'] in RETIRE:
        removed.append({'name': e['name'], 'why': '退港'}); continue
    if frozenset((e['a'], e['b'])) in forbidden:
        removed.append({'name': e['name'], 'why': '史实判否/存疑'}); continue
    kept.append(e)
print(f'删旧线 {len(removed)} 条，留 {len(kept)} 条')

force_keep_set = {frozenset(p) for p in FORCE_KEEP}
deg = {p: 0 for p in ports}
adj = {p: set() for p in ports}
edge_of = {}          # frozenset -> edge dict
selected = []
skipped = []


def gen(a, b):
    return g.route(cities[a][1], cities[a][2], cities[b][1], cities[b][2])


def land_limit(a, b):
    return LAND_LIMIT_RIVER if (a in RIVER_PORTS or b in RIVER_PORTS) else LAND_LIMIT


def add_edge(a, b, km, name, reason, coords=None, land=None):
    if b in adj[a]:
        return False
    if deg[a] >= MAX_DEG or deg[b] >= MAX_DEG:
        return False
    adj[a].add(b); adj[b].add(a)
    deg[a] += 1; deg[b] += 1
    edge_of[frozenset((a, b))] = {'a': a, 'b': b, 'km': km, 'name': name, 'reason': reason,
                                  'coords': coords, 'land': land}
    selected.append(edge_of[frozenset((a, b))])
    return True


def evict(endpoint, protect):
    """挤掉 endpoint 最长的一条非史实/非当前补的线；返回是否成功"""
    cands = []
    for q in list(adj[endpoint]):
        e = edge_of[frozenset((endpoint, q))]
        if frozenset((endpoint, q)) in protect:
            continue
        if deg[q] < 3:      # 挤了以后对方会掉到 1，不允许（除非对方本来 2 挤到 1 再补）
            continue
        cands.append((e['km'], q))
    if not cands:
        return False
    cands.sort(reverse=True)
    km, q = cands[0]
    e = edge_of.pop(frozenset((endpoint, q)))
    selected.remove(e)
    adj[endpoint].discard(q); adj[q].discard(endpoint)
    deg[endpoint] -= 1; deg[q] -= 1
    removed.append({'name': e['name'], 'why': '被挤掉（端点到 3 条上限）'})
    return True


protect = force_keep_set | {frozenset(p) for p in FORCE_ADD}
# 2a 史实长线优先占位
for e in kept:
    if frozenset((e['a'], e['b'])) in force_keep_set:
        ded, km = gen(e['a'], e['b'])
        coords = ded if ded else e['coords']
        land = core.route_land_km(coords) if ded else e['land']
        add_edge(e['a'], e['b'], round(km if ded else e['km']), e['name'], '史实长线', coords, land)
for a, b in FORCE_ADD:
    if a in RETIRE or b in RETIRE:
        print(f'  ⚠ 强制新增的港已退港：{a}-{b}'); continue
    if b in adj[a]:
        continue
    ded, km = gen(a, b)
    if not ded:
        print(f'  ✗ 强制新增不连通：{cities[a][0]}-{cities[b][0]}'); continue
    land = core.route_land_km(ded)
    if land > land_limit(a, b):
        print(f'  ⚠ 强制新增穿陆超标：{cities[a][0]}—{cities[b][0]} {land:.0f}km')
    if deg[a] >= MAX_DEG:
        evict(a, protect)
    if deg[b] >= MAX_DEG:
        evict(b, protect)
    add_edge(a, b, round(km), f'{cities[a][0]}-{cities[b][0]}', '史实长线(新增)', ded, land)

# 2b 其余按航程升序
rest = sorted([e for e in kept if frozenset((e['a'], e['b'])) not in force_keep_set], key=lambda e: e['km'])
for e in rest:
    if frozenset((e['a'], e['b'])) in forbidden:
        continue
    if deg[e['a']] >= MAX_DEG or deg[e['b']] >= MAX_DEG:
        skipped.append((e['name'], '端点已满 3 条')); continue
    add_edge(e['a'], e['b'], round(e['km']), e['name'], '短航程优先', e['coords'], e['land'])

# 3) 补孤港（允许挤掉对方最长的一条）
print('计算候选…')
cand = nearest_candidates(ports)
added_by_fill = 0
for round_ in range(4):
    changed = False
    for p in sorted(ports, key=lambda x: deg[x]):
        guard = 0
        while deg[p] < MIN_DEG and guard < 12:
            guard += 1
            done = False
            for km, q in cand.get(p, []):
                if q in RETIRE or q in adj[p] or frozenset((p, q)) in forbidden:
                    continue
                ded, real_km = gen(p, q)
                if not ded:
                    continue
                land = core.route_land_km(ded)
                if land > land_limit(p, q):
                    continue
                if deg[q] >= MAX_DEG and not evict(q, protect):
                    continue
                if add_edge(p, q, round(real_km), f'{cities[p][0]}-{cities[q][0]}', '补孤港', ded, land):
                    added_by_fill += 1
                    changed = True
                    done = True
                    break
            if not done:
                break
            # 重新取候选里已连的跳过即可
    if not changed:
        break
print(f'补孤港新增 {added_by_fill} 条')


# 3b) 连通分量归并：除「里海」「红海—亚丁湾」两块按史保持独立外，其余必须连成一块
def components():
    seen = set(); comps = []
    for n in adj:
        if n in seen or not adj[n]:
            continue
        st = [n]; seen.add(n); comp = []
        while st:
            x = st.pop(); comp.append(x)
            for y in adj[x]:
                if y not in seen:
                    seen.add(y); st.append(y)
        comps.append(comp)
    return comps


PROTECTED_SEEDS = {'city_baku', 'city_maijia'}
MERGE_MAX_KM = 1500.0   # 只并「同一海域内」的碎块：直布罗陀 798、北海道—萨哈林 577、交州—番禺 600、果阿—锡兰 1426；大西洋↔太平洋（合恩角 1 万 km）不硬连   # 里海（湖）/ 红海—亚丁湾（无亚丁港）
merged = 0
for round_ in range(6):
    comps = components()
    cid = {}
    for i, c in enumerate(comps):
        for p in c:
            cid[p] = i
    prot = {cid[p] for p in PROTECTED_SEEDS if p in cid}
    free = [i for i in range(len(comps)) if i not in prot]
    if len(free) <= 1:
        break
    best = None
    for p in ports:
        ip = cid.get(p)
        if ip is None:
            continue
        if ip in prot:
            continue
        for km, q in cand.get(p, []):
            iq = cid.get(q)
            if iq is None or iq == ip or iq in prot:
                continue
            if km > MERGE_MAX_KM:
                continue
            if best is None or km < best[0]:
                best = (km, p, q)
    if not best:
        print('  ⚠ 找不到可连的分量对')
        break
    km, p, q = best
    ded, real_km = gen(p, q)
    if not ded:
        print(f'  ⚠ 分量归并候选不连通：{cities[p][0]}—{cities[q][0]}')
        # 屏蔽这一对再试
        cand[p] = [(k, x) for (k, x) in cand[p] if x != q]
        continue
    land = core.route_land_km(ded)
    protect_edges = protect | set()
    if deg[q] >= MAX_DEG:
        evict(q, protect)
    if deg[p] >= MAX_DEG:
        evict(p, protect)
    if add_edge(p, q, round(real_km), f'{cities[p][0]}-{cities[q][0]}', '分量归并', ded, land):
        merged += 1
        print(f'  归并：{cities[p][0]}—{cities[q][0]}（{real_km:.0f}km 穿陆{land:.0f}km）')
    else:
        cand[p] = [(k, x) for (k, x) in cand[p] if x != q]
print(f'分量归并新增 {merged} 条')

# 归并后可能又出现度不足，再补一轮
for p in sorted(ports, key=lambda x: deg[x]):
    guard = 0
    while deg[p] < MIN_DEG and guard < 12:
        guard += 1
        done = False
        for km, q in cand.get(p, []):
            if q in RETIRE or q in adj[p] or frozenset((p, q)) in forbidden:
                continue
            ded, real_km = gen(p, q)
            if not ded:
                continue
            land = core.route_land_km(ded)
            if land > land_limit(p, q):
                continue
            if deg[q] >= MAX_DEG and not evict(q, protect):
                continue
            if add_edge(p, q, round(real_km), f'{cities[p][0]}-{cities[q][0]}', '补孤港', ded, land):
                added_by_fill += 1
                done = True
                break
        if not done:
            break

bad = [(p, deg[p]) for p in ports if deg[p] > MAX_DEG or deg[p] < MIN_DEG]
print(f'度不合规：{len(bad)} 座')
for p, d in bad:
    print(f'  {cities[p][0]}({p}) 度={d}：' + '、'.join(cities[q][0] for q in adj[p]))

# 4) 生成折线（全部重算，旧的更优则用旧的）
print('\n生成折线…')
old_by_pair = {frozenset((e['a'], e['b'])): e for e in old_edges}
final = []
fail = []
for i, s in enumerate(selected):
    a, b = s['a'], s['b']
    old = old_by_pair.get(frozenset((a, b)))
    ded, km = gen(a, b)
    land_new = core.route_land_km(ded) if ded else 1e9
    if old is not None and old['land'] < land_new:
        coords, land, kmf, src = old['coords'], old['land'], old['km'], '旧折线更优'
    elif ded:
        coords, land, kmf, src = ded, land_new, core.path_km(ded), '新算'
    elif old is not None:
        coords, land, kmf, src = old['coords'], old['land'], old['km'], '新算失败用旧线'
        fail.append((s['name'], '新算失败，沿用旧线'))
    else:
        fail.append((s['name'], '新算失败且无旧线')); continue
    final.append({'name': s['name'], 'id': (old['id'] if old else f"sea_{a}_{b}_20261024"),
                  'a': a, 'b': b, 'coords': coords, 'km': round(kmf), 'land': round(land, 1),
                  'reason': s['reason'], 'src': src})
    if (i + 1) % 50 == 0:
        print(f'  {i+1}/{len(selected)}')

print(f'折线完成 {len(final)} 条；失败 {len(fail)}')
for n, r in fail:
    print(f'  ✗ {n}：{r}')

adjf = {}
for f in final:
    adjf.setdefault(f['a'], set()).add(f['b'])
    adjf.setdefault(f['b'], set()).add(f['a'])
seen = set(); comps = []
for n in adjf:
    if n in seen:
        continue
    st = [n]; seen.add(n); comp = []
    while st:
        x = st.pop(); comp.append(x)
        for y in adjf[x]:
            if y not in seen:
                seen.add(y); st.append(y)
    comps.append(comp)
comps.sort(key=len, reverse=True)

report = {
    'ports': len(ports), 'edges': len(final),
    'deg_dist': {str(k): sum(1 for p in ports if deg[p] == k) for k in sorted({deg[p] for p in ports})},
    'retired': RETIRE, 'removed': removed, 'skipped': skipped, 'fail': fail,
    'by_reason': {r: sum(1 for f in final if f['reason'] == r) for r in {f['reason'] for f in final}},
    'components': [len(c) for c in comps],
    'component_names': ['、'.join(cities.get(x, (x,))[0] for x in c) for c in comps],
    'land_top': sorted([{'name': f['name'], 'land': f['land'], 'km': f['km']} for f in final], key=lambda x: -x['land'])[:15],
    'longest': sorted([{'name': f['name'], 'km': f['km'], 'land': f['land']} for f in final], key=lambda x: -x['km'])[:25],
    'bad_degree': [(cities[p][0], d) for p, d in bad],
}
json.dump(report, open(REPORT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def fmt(f):
    out = '        {\n            type: "Feature",\n            properties: {\n'
    out += f'                name: "{f["name"]}",\n                type: "sea",\n                id: "{f["id"]}",\n'
    out += f'                startConnection: "{f["a"]}",\n                endConnection: "{f["b"]}"\n'
    out += '            },\n            geometry: {\n                type: "LineString",\n                coordinates: [\n'
    for c in f['coords']:
        out += f'                    [{c[0]}, {c[1]}],\n'
    out += '                ]\n            }\n        },\n'
    return out


ts = 'export interface SeaRouteFeature {\n    type: \'Feature\';\n    properties: {\n'
ts += '        name: string;\n        type: \'sea\';\n        color?: string;\n        id: string;\n'
ts += '        startYear?: number;\n        endYear?: number;\n        startConnection?: string;\n        endConnection?: string;\n'
ts += '    };\n    geometry: {\n        type: \'LineString\';\n        coordinates: [number, number][];\n    };\n}\n\n'
ts += 'export const SEA_ROUTE_DATA: { type: \'FeatureCollection\', features: SeaRouteFeature[] } = {\n'
ts += '    type: \'FeatureCollection\',\n    features: [\n'
ts += ''.join(fmt(f) for f in final)
ts += '    ]\n};\n'
open(OUT_TS, 'w', encoding='utf-8').write(ts)
print(f'\n输出 {OUT_TS}（{len(ts)} 字节）')
print('度分布:', report['deg_dist'])
print('分量:', report['components'])
print('按原因:', report['by_reason'])










