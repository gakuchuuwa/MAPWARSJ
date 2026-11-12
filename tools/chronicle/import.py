"""战争编年史 · 导入器（xlsx → src/data/chronicle/ChronicleSegmentNN.ts）

用法：
    python tools/chronicle/dbindex.py          # 先出一份游戏库索引 scratch/_chr/index.json
    python tools/chronicle/import.py [--xlsx <path>]

真源：docs/战争编年史（纯史实重写）/战争编年史_双段播报总表_2026-11-12.xlsx
人工裁定：tools/chronicle/overrides.json（主将 / 地名别名 / 非战斗写法）
产出：src/data/chronicle/ChronicleSegment01..09.ts
      docs/02-design/systems/编年史-导入审计-2026-11-12.md
      scratch/_chr/import_report.json
原则：解析不了就记 MISSING 并进审计清单，不猜、不编战斗、不编武将。
"""
import json, os, re, sys, collections

ROOT = r'C:\MAPWARSJ'
DEFAULT_XLSX = os.path.join(ROOT, 'docs', '战争编年史（纯史实重写）', '战争编年史_双段播报总表_2026-11-12.xlsx')
INDEX = os.path.join(ROOT, 'scratch', '_chr', 'index.json')
OVERRIDES = os.path.join(ROOT, 'tools', 'chronicle', 'overrides.json')
OUT_DIR = os.path.join(ROOT, 'src', 'data', 'chronicle')
REPORT_MD = os.path.join(ROOT, 'docs', '02-design', 'systems', '编年史-导入审计-2026-11-12.md')
REPORT_JSON = os.path.join(ROOT, 'scratch', '_chr', 'import_report.json')

SEASON = {'春': 0, '夏': 1, '秋': 2, '冬': 3}
BATTLE_WORDS = ['野战', '攻城', '守城', '水战', '关隘', '两栖', '平叛', '光复', '围城', '受降', '袭城',
                '决战', '会战', '反击', '双战', '岛战', '水陆', '围城战', '歼灭', '抗登陆']
ID_RE = re.compile(r'\(([a-zA-Z0-9_@\-]+)\)')


def load_xlsx(path):
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb['双段播报总表']
    hdr = [str(c) for c in next(ws.iter_rows(min_row=1, max_row=1, values_only=True))]
    rows = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or not r[0]:
            continue
        d = {}
        for i, h in enumerate(hdr):
            v = r[i] if i < len(r) else None
            d[h] = '' if v is None else (str(v) if not isinstance(v, (int, float)) else v)
        rows.append(d)
    ai = []
    if len(wb.sheetnames) > 1:
        w = wb[wb.sheetnames[1]]
        for r in w.iter_rows(min_row=2, values_only=True):
            if r and r[0]:
                ai.append([('' if x is None else str(x)) for x in r])
    return rows, ai


def num(v, default=None):
    try:
        f = float(str(v).strip())
        return int(f) if abs(f - int(f)) < 1e-9 else f
    except Exception:
        return default


def split_tokens(s):
    s = str(s or '')
    parts = re.split(r'[/、;；]', s)
    return [p.strip() for p in parts if p and p.strip()]


def build_places(site_index, overrides):
    """古典地名 → cityId：先查人工别名，再精确同名。"""
    alias = overrides.get('place', {})

    def resolve(site):
        if site in alias:
            return alias[site]
        hits = [c for c in site_index.values() if c['name'] == site]
        if hits:
            return hits[0]['id']
        return None

    return resolve


SPLIT_PLACE = re.compile(r'[、，,/]|至|与|和|→|＋|\+')
STRIP_SUFFIX = ['平原', '河谷', '山谷', '谷地', '草场', '城下', '城郊', '外海', '海面', '海峡', '海岛城', '岛',
                '城', '要塞', '隘口', '山麓', '北麓', '南岸', '北岸', '河畔', '渡口', '岩堡', '王庭', '王宫',
                '卫城', '盐碱荒原', '苇荡', '山地', '山区', '港', '郊野', '北郊', '南郊', '草原', '附近']


def place_sites(place):
    p = re.sub(r'（[^）]*）|\([^)]*\)', ' ', str(place or ''))
    out = []
    for s in SPLIT_PLACE.split(p):
        s = (s or '').strip()
        for suf in STRIP_SUFFIX:
            if s.endswith(suf) and len(s) > len(suf) + 1:
                s = s[:-len(suf)]
        if s:
            out.append(s)
    return out


def main():
    xlsx = DEFAULT_XLSX
    if '--xlsx' in sys.argv:
        xlsx = sys.argv[sys.argv.index('--xlsx') + 1]
    rows, ai_rows = load_xlsx(xlsx)
    idx = json.load(open(INDEX, encoding='utf-8'))
    battles, generals, cities = idx['battles'], idx['generals'], idx['cities']
    ov = json.load(open(OVERRIDES, encoding='utf-8'))
    lead_ov = ov.get('lead', {})
    ignore = set(ov.get('battleIgnore', []))
    resolve_place = build_places(cities, ov)

    # 武将名索引（2 字以上，用于从接力链正文里认人）
    name_index = {}
    for gid, g in generals.items():
        nm = (g.get('generalName') or '').strip()
        if len(nm) >= 2:
            name_index.setdefault(nm, gid)

    events = []
    report = {'events': [], 'missingLead': [], 'unresolvedBattle': [], 'placeMissing': [],
              'pendingBattle': [], 'copyIssues': [], 'renames': ai_rows}

    prev_lead = ''
    for seq, r in enumerate(rows, 1):
        eid = str(r['事件ID']).strip()
        m = re.match(r'chron_(\d+)_(\d+)_(\d+)', eid)
        seg, baton, order_in_baton = int(m.group(1)), int(m.group(2)), int(m.group(3))
        baton_label = str(r['棒次'])
        baton_nums = [int(x) for x in re.findall(r'\d+', baton_label)]
        baton_num = baton_nums[0] if baton_nums else baton
        year = num(r['导入年份year'], 0)
        season = SEASON.get(str(r['季节season']).strip(), 0)
        month = num(r['月份month'])

        # ---- 战斗 ----
        steps, script_scenes, unresolved = [], [], []
        for tok in split_tokens(r['关联经典战ID']):
            if tok in ignore or tok.startswith('编年史'):
                mm = re.search(r'([a-zA-Z0-9_]+@-?\d+)', tok)
                if mm and mm.group(1) not in battles:
                    unresolved.append(mm.group(1))
                continue
            if tok.startswith('亚历山大剧本'):
                script_scenes.append(tok)
                continue
            if tok in battles:
                steps.append(tok)
            else:
                unresolved.append(tok)

        # 去重：同一 battleName|battleYear 只留一条（主将本人的那条优先）
        lead = lead_ov.get(eid, '')
        uniq, seen = [], {}
        for bid in steps:
            b = battles[bid]
            key = (b['battleName'], b['battleYear'])
            if key in seen:
                if lead and b.get('generalId') == lead and battles[seen[key]].get('generalId') != lead:
                    uniq[uniq.index(seen[key])] = bid
                    seen[key] = bid
                continue
            seen[key] = bid
            uniq.append(bid)

        enemy_ids = [x for x in ID_RE.findall(str(r['对阵敌方']))]
        enemy_ids = [x for x in dict.fromkeys(enemy_ids) if x != lead]

        battle_steps = []
        for i, bid in enumerate(uniq, 1):
            b = battles[bid]
            role = b.get('role', 'attacker')
            if lead and b.get('enemyGeneralId') == lead:
                role = 'defender' if role == 'attacker' else 'attacker'
            battle_steps.append({
                'order': i,
                'battleId': bid,
                'role': role,
                'label': b['battleName'],
                'briefing': 'event' if i == 1 else 'battle',
            })

        kind = 'battle' if (battle_steps or script_scenes) else 'operation'
        raw_type = str(r['事件类型'])
        pending = (not battle_steps) and (not script_scenes) and any(w in raw_type for w in BATTLE_WORDS)

        # 主将兜底：没人工裁定的，① 链里第一个非敌方 id；② 链正文里最早出现的库内武将名
        if not lead:
            chain_txt = str(r['武将人物接力链'])
            chain_ids = ID_RE.findall(chain_txt)
            foe_ids = set(ID_RE.findall(str(r['对阵敌方'])))
            cands = [c for c in chain_ids if c not in foe_ids]
            lead = cands[0] if cands else (chain_ids[0] if chain_ids else '')
            if not lead:
                best = None
                for nm, gid in name_index.items():
                    p = chain_txt.find(nm)
                    if p < 0:
                        continue
                    if best is None or p < best[0] or (p == best[0] and len(nm) > len(best[1])):
                        best = (p, nm, gid)
                if best:
                    lead = best[2]
        if lead and not lead.startswith('MISSING:') and lead not in generals:
            report['missingLead'].append((eid, lead, '写在链里但不在武将库'))
            lead = 'MISSING:' + lead

        camera = ''
        if battle_steps:
            camera = battles[battle_steps[0]['battleId']].get('generalId', '')
        if not camera and lead and not lead.startswith('MISSING:'):
            camera = lead

        # ---- 地名 ----
        place_name = str(r['古典地点']).strip()
        city_id = None
        for s in place_sites(place_name):
            city_id = resolve_place(s)
            if city_id:
                break
        place = {'name': place_name}
        if city_id:
            place['cityId'] = city_id
        lat = lng = None
        if battle_steps:
            b = battles[battle_steps[0]['battleId']]
            lat, lng = b.get('targetLat'), b.get('targetLng')
            if b.get('targetCityId') and 'cityId' not in place:
                place['cityId'] = b['targetCityId']
        if lat is not None and lng is not None:
            place['lat'], place['lng'] = lat, lng
        if 'cityId' not in place and 'lat' not in place:
            place['anchorMissing'] = True
            report['placeMissing'].append((eid, place_name))

        strategic = [str(r['战略播报']).strip()] if str(r['战略播报']).strip() else []
        tactical = [str(r['战术播报']).strip()] if str(r['战术播报']).strip() else []
        for label, arr in (('战略', strategic), ('战术', tactical)):
            for t in arr:
                n = len(re.sub(r'\s', '', t))
                if n < 89 or n > 144:
                    report['copyIssues'].append((eid, label, n))
                if re.search(r'[0-9]', t) or re.search(r'[（）()]', t):
                    report['copyIssues'].append((eid, label + '·含数字或括号', t[:24]))

        ev = {
            'id': eid,
            'segment': seg,
            'baton': baton_num,
            'year': year,
            'season': season,
            'kind': kind,
            'rawType': raw_type,
            'title': str(r['事件名称']).strip(),
            'place': place,
            'leadGeneralId': lead,
            'battles': battle_steps,
            'strategic': strategic,
            'tactical': tactical,
            'source': str(r['史料出处']).strip(),
        }
        if month is not None:
            ev['month'] = month
        if camera:
            ev['cameraGeneralId'] = camera
        if enemy_ids:
            ev['enemyGeneralIds'] = enemy_ids
        if battle_steps:
            ef = battles[battle_steps[0]['battleId']].get('enemyFactionId')
            if ef:
                ev['enemyFactionId'] = ef
        url = str(r['史源链接']).strip()
        if url:
            ev['sourceUrl'] = url
        note = str(r['AI改名与导入标注']).strip()
        if note:
            ev['note'] = note
        if pending:
            ev['pendingBattle'] = True
            report['pendingBattle'].append((eid, ev['title'], raw_type))
        if script_scenes:
            ev['scriptScene'] = ' / '.join(script_scenes)
        if '→' in baton_label:
            ev['relay'] = {}
        events.append(ev)

    # 排序：段 → 年 → 月（缺省 0）→ 原顺序
    events.sort(key=lambda e: (e['segment'], e['year'], e.get('month') or 0))

    # relay 咬合：from = 上一事件主角，to = 下一事件主角
    for i, e in enumerate(events):
        if 'relay' not in e:
            continue
        prev = events[i - 1]['leadGeneralId'] if i > 0 else ''
        nxt = events[i + 1]['leadGeneralId'] if i + 1 < len(events) else ''
        if prev and nxt and prev != nxt:
            e['relay'] = {'from': prev, 'to': nxt}
        else:
            del e['relay']

    for e in events:
        if e['leadGeneralId'].startswith('MISSING:'):
            report['missingLead'].append((e['id'], e['leadGeneralId'], '缺库主角（未绑定，待增补）'))
        if e['battles'] and any(True for _ in e['battles']):
            pass

    # ---- 写 TS ----
    by_seg = collections.OrderedDict()
    for e in events:
        by_seg.setdefault(e['segment'], []).append(e)
    os.makedirs(OUT_DIR, exist_ok=True)
    written = []
    for seg, evs in by_seg.items():
        title = SEG_TITLES.get(seg, f'第{seg}段')
        path = os.path.join(OUT_DIR, f'ChronicleSegment{seg:02d}.ts')
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write('/* 自动生成，勿手改：tools/chronicle/import.py ← 战争编年史_双段播报总表_2026-11-12.xlsx */\n')
            f.write("import type { ChronicleEvent } from './ChronicleTypes';\n\n")
            f.write(f'/** {title}（{evs[0]["year"]} — {evs[-1]["year"]}，{len(evs)} 场事件） */\n')
            f.write(f'export const CHRONICLE_SEGMENT_{seg:02d}: readonly ChronicleEvent[] = [\n')
            for e in evs:
                f.write(emit_event(e))
            f.write('];\n')
        written.append((seg, path, len(evs)))

    # ---- 审计报告 ----
    with open(REPORT_JSON, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    write_report(report, events, written, by_seg)
    print('segments', [(s, n) for s, _, n in written])
    print('events', len(events), 'battle', sum(1 for e in events if e['kind'] == 'battle'),
          'operation', sum(1 for e in events if e['kind'] == 'operation'))
    print('missingLead', len(report['missingLead']), 'placeMissing', len(report['placeMissing']),
          'pendingBattle', len(report['pendingBattle']), 'copyIssues', len(report['copyIssues']))


SEG_TITLES = {
    1: '第一段 · 波斯至亚历山大（前550—前323）',
    2: '第二段 · 继业者至战国秦汉白登（前322—前200）',
    3: '第三段 · 匈奴北道至罗马安息与汉武北伐（前199—前87）',
    4: '第四段 · 西域都护至陈汤昆阳（前86—公元23）',
    5: '第五段 · 东汉突骑至三国虎豹骑（24—220）',
    6: '第六段 · 三国街亭至淝水参合陂（221—395）',
    7: '第七段 · 北魏虎骑至白袍军与府兵一统（396—589）',
    8: '第八段 · 隋唐玄甲至香积寺（590—763）',
    9: '第九段 · 沙陀鸦儿军至高平立宋（764—960）',
}


def q(s):
    return json.dumps(s, ensure_ascii=False)


def emit_event(e):
    lines = ['    {']
    lines.append(f'        id: {q(e["id"])}, segment: {e["segment"]}, baton: {e["baton"]},')
    if 'relay' in e:
        r = e['relay']
        lines.append('        relay: {' + ', '.join(
            [f'{k}: {q(v)}' for k, v in r.items() if v is not None]) + '},')
    lines.append(f'        year: {e["year"]}, season: {e["season"]},' + (f' month: {e["month"]},' if 'month' in e else ''))
    lines.append(f'        kind: {q(e["kind"])}, rawType: {q(e["rawType"])}, title: {q(e["title"])},')
    p = e['place']
    ptxt = ', '.join([f'{k}: {q(v) if isinstance(v, str) else (str(v).lower() if isinstance(v, bool) else v)}'
                      for k, v in p.items()])
    lines.append(f'        place: {{ {ptxt} }},')
    lines.append(f'        leadGeneralId: {q(e["leadGeneralId"])},')
    if e.get('cameraGeneralId'):
        lines.append(f'        cameraGeneralId: {q(e["cameraGeneralId"])},')
    if e.get('enemyGeneralIds'):
        lines.append('        enemyGeneralIds: [' + ', '.join(q(x) for x in e['enemyGeneralIds']) + '],')
    if e.get('enemyFactionId'):
        lines.append(f'        enemyFactionId: {q(e["enemyFactionId"])},')
    if e['battles']:
        lines.append('        battles: [')
        for s in e['battles']:
            lines.append('            { order: %d, battleId: %s, role: %s, label: %s, briefing: %s },'
                         % (s['order'], q(s['battleId']), q(s['role']), q(s['label']), q(s['briefing'])))
        lines.append('        ],')
    else:
        lines.append('        battles: [],')
    if e.get('scriptScene'):
        lines.append(f'        scriptScene: {q(e["scriptScene"])},')
    lines.append('        strategic: [' + ', '.join(q(x) for x in e['strategic']) + '],')
    lines.append('        tactical: [' + ', '.join(q(x) for x in e['tactical']) + '],')
    lines.append(f'        source: {q(e["source"])},')
    if e.get('sourceUrl'):
        lines.append(f'        sourceUrl: {q(e["sourceUrl"])},')
    if e.get('note'):
        lines.append(f'        note: {q(e["note"])},')
    if e.get('pendingBattle'):
        lines.append('        pendingBattle: true,')
    lines.append('    },')
    return '\n'.join(lines) + '\n'


def write_report(report, events, written, by_seg):
    L = []
    L.append('# 战争编年史 · 导入审计（2026-11-12）\n')
    L.append('> 生成：`python tools/chronicle/dbindex.py && python tools/chronicle/import.py`\n')
    L.append('> 真源：`docs/战争编年史（纯史实重写）/战争编年史_双段播报总表_2026-11-12.xlsx`'
             f'（第 1—{written[-1][0]} 段，{len(events)} 场）\n')
    L.append(f'> 产出：`src/data/chronicle/ChronicleSegment01..{written[-1][0]:02d}.ts` + `ChronicleRegistry.ts`\n')
    L.append('\n## 一、总量\n')
    L.append('| 段 | 事件 | 战斗 | 叙事 | 年份 |')
    L.append('|---|---:|---:|---:|---|')
    tot = [0, 0, 0]
    for seg, path, n in written:
        evs = by_seg[seg]
        b = sum(1 for e in evs if e['kind'] == 'battle')
        o = n - b
        tot[0] += n; tot[1] += b; tot[2] += o
        L.append(f'| 第{seg}段 | {n} | {b} | {o} | {evs[0]["year"]} — {evs[-1]["year"]} |')
    L.append(f'| 合计 | {tot[0]} | {tot[1]} | {tot[2]} | |')
    L.append('\n## 二、缺库主角（播报照念，镜头需代理；待主人批「增补」）\n')
    L.append('| 事件 | 当期名 | 说明 |')
    L.append('|---|---|---|')
    seen = set()
    for eid, lead, why in report['missingLead']:
        nm = lead.replace('MISSING:', '')
        key = (nm, why)
        if key in seen:
            continue
        seen.add(key)
        L.append(f'| {eid} | {nm} | {why} |')
    L.append('\n## 三、亚历山大剧本场景（有坐标与攻守，还不是经典战条目）\n')
    scenes = [e for e in events if e.get('scriptScene')]
    if scenes:
        L.append('| 事件 | 名称 | 剧本场景 |')
        L.append('|---|---|---|')
        for e in scenes:
            L.append(f'| {e["id"]} | {e["title"]} | {e["scriptScene"]} |')
    else:
        L.append('无。')
    L.append('\n## 三之二、类型是战斗但库里无战斗数据（先按叙事推进）\n')
    L.append('| 事件 | 名称 | 类型 |')
    L.append('|---|---|---|')
    for eid, title, typ in report['pendingBattle']:
        L.append(f'| {eid} | {title} | {typ} |')
    L.append('\n## 四、地名待定位（播报名保留古典地名，缺运行时锚点）\n')
    L.append('| 事件 | 古典地点 |')
    L.append('|---|---|')
    for eid, name in report['placeMissing']:
        L.append(f'| {eid} | {name} |')
    L.append('\n## 五、文案字数/字符异常（89–144 字、零括号零阿拉伯数字）\n')
    if report['copyIssues']:
        L.append('| 事件 | 段 | 情况 |')
        L.append('|---|---|---|')
        for row in report['copyIssues']:
            L.append('| ' + ' | '.join(str(x) for x in row) + ' |')
    else:
        L.append('无。')
    L.append('\n## 六、AI 改名与实体对齐清单（53 条，逐条见 xlsx 第二页）\n')
    L.append('导入器只做「不误绑」：凡同名异代（保卢斯 / 米特里达梯 / 欧迈尼斯）一律写 `MISSING:`，不绑现库同名武将。\n')
    L.append('清单里对**现库**的改名/势力修正/据点显示名，按三档授权另批处理，本批未改。\n')
    with open(REPORT_MD, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(L) + '\n')


if __name__ == '__main__':
    main()
