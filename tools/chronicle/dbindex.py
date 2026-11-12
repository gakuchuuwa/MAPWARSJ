"""编年史导入用 · 游戏库索引（纯文本解析，不执行 TS）

产出 scratch/_chr/index.json：
  battles  : battleId -> {generalId,battleName,battleYear,battleMonth,battleType,role,targetName,targetCityId,targetLat,targetLng,enemyFactionId,enemyGeneralId,...}
  generals : generalId -> {generalName, factionId, cityId}
  cities   : cityId -> {name, lat, lng, type}
"""
import json, re, os

ROOT = r'C:\MAPWARSJ'
SCALARS = ['generalId', 'battleId', 'battleName', 'battleYear', 'battleMonth', 'battleType', 'role',
           'targetName', 'targetCityId', 'rewardCityId', 'targetLat', 'targetLng', 'myTroops',
           'enemyTroops', 'enemyFactionId', 'enemyFactionName', 'enemyGeneralId']


def strip_comments(s):
    # 去块注释与行注释（保留字符串内的 //）
    out = []
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in "'\"":
            q = c
            out.append(c)
            i += 1
            while i < n:
                out.append(s[i])
                if s[i] == '\\':
                    i += 1
                    if i < n:
                        out.append(s[i])
                elif s[i] == q:
                    i += 1
                    break
                i += 1
            continue
        if c == '/' and i + 1 < n and s[i + 1] == '/':
            while i < n and s[i] != '\n':
                i += 1
            continue
        if c == '/' and i + 1 < n and s[i + 1] == '*':
            i += 2
            while i + 1 < n and not (s[i] == '*' and s[i + 1] == '/'):
                i += 1
            i += 2
            continue
        out.append(c)
        i += 1
    return ''.join(out)


def find_blocks(src, key_re):
    """在源码里找 `key: { ... }` 块，返回 (key, block_body, start) 列表"""
    res = []
    for m in re.finditer(key_re, src, re.M):
        key = m.group(1)
        i = m.end() - 1
        if src[i] not in '{[':
            continue
        open_ch = src[i]
        close_ch = '}' if open_ch == '{' else ']'
        depth = 0
        j = i
        in_str = None
        while j < len(src):
            ch = src[j]
            if in_str:
                if ch == '\\':
                    j += 2
                    continue
                if ch == in_str:
                    in_str = None
            elif ch in "'\"":
                in_str = ch
            elif ch == open_ch:
                depth += 1
            elif ch == close_ch:
                depth -= 1
                if depth == 0:
                    break
            j += 1
        res.append((key, src[i + 1:j], m.start()))
    return res


def scalars(body):
    d = {}
    for f in SCALARS:
        m = re.search(r'(?<![\w])' + f + r'["\']?\s*:\s*(\'[^\']*\'|"[^"]*"|-?\d+(?:\.\d+)?|true|false)', body)
        if not m:
            continue
        v = m.group(1)
        if v[0] in '\'"':
            d[f] = v[1:-1]
        elif v in ('true', 'false'):
            d[f] = v == 'true'
        else:
            d[f] = float(v) if '.' in v else int(v)
    return d


def parse_battles(path, source):
    src = strip_comments(open(path, encoding='utf-8').read())
    out = {}
    blocks = find_blocks(src, r'^\s{4}\'?([A-Za-z0-9_@\-]+)\'?\s*:\s*\{')
    for key, body, _ in blocks:
        d = scalars(body)
        if 'battleName' not in d:
            continue
        bid = d.get('battleId') or key
        d['battleId'] = bid
        d['source'] = source
        d['key'] = key
        if not d.get('generalId'):
            continue
        out[bid] = d
    return out


def parse_extra(path):
    src = strip_comments(open(path, encoding='utf-8').read())
    out = {}
    blocks = find_blocks(src, r'^\s{4}[\'"]?([A-Za-z0-9_@\-]+)[\'"]?\s*:\s*\[')
    for key, body, _ in blocks:
        i = 0
        depth = 0
        start = None
        objs = []
        in_str = None
        while i < len(body):
            ch = body[i]
            if in_str:
                if ch == '\\':
                    i += 2
                    continue
                if ch == in_str:
                    in_str = None
            elif ch in "'\"":
                in_str = ch
            elif ch == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0 and start is not None:
                    objs.append(body[start + 1:i])
                    start = None
            i += 1
        for ob in objs:
            d = scalars(ob)
            if 'battleName' not in d:
                continue
            d['battleId'] = d.get('battleId') or key
            d['source'] = 'extra'
            d['key'] = key
            if not d.get('generalId'):
                d['generalId'] = key
            out[d['battleId']] = d
    return out


def parse_generals(path):
    src = strip_comments(open(path, encoding='utf-8').read())
    out = {}
    for m in re.finditer(r"generalId:\s*'([^']+)'(.*?)(?=generalId:\s*'|\Z)", src, re.S):
        gid, rest = m.group(1), m.group(2)
        nm = re.search(r"generalName:\s*'([^']*)'", rest)
        fid = re.search(r"factionId:\s*'([^']*)'", rest)
        cid = re.search(r"cityId:\s*'([^']*)'", rest)
        out[gid] = {
            'generalId': gid,
            'generalName': nm.group(1) if nm else '',
            'factionId': fid.group(1) if fid else '',
            'cityId': cid.group(1) if cid else '',
        }
    return out


def parse_cities(path):
    src = strip_comments(open(path, encoding='utf-8').read())
    out = {}
    for m in re.finditer(r"\{\s*id:\s*'(city_[^']+)',\s*name:\s*'([^']*)'(.*?)\}", src):
        cid, name, rest = m.group(1), m.group(2), m.group(3)
        lat = re.search(r'lat:\s*(-?\d+(?:\.\d+)?)', rest)
        lng = re.search(r'lng:\s*(-?\d+(?:\.\d+)?)', rest)
        typ = re.search(r"type:\s*'([^']*)'", rest)
        out[cid] = {
            'id': cid, 'name': name,
            'lat': float(lat.group(1)) if lat else None,
            'lng': float(lng.group(1)) if lng else None,
            'type': typ.group(1) if typ else '',
        }
    return out


def main():
    battles = {}
    battles.update(parse_battles(os.path.join(ROOT, 'src/data/GeneralFirstBattles.ts'), 'first'))
    battles.update(parse_extra(os.path.join(ROOT, 'src/data/GeneralExtraClassicBattles.ts')))
    generals = parse_generals(os.path.join(ROOT, 'src/data/FactionGenerals.ts'))
    cities = parse_cities(os.path.join(ROOT, 'src/data/cities_v2.ts'))
    idx = {'battles': battles, 'generals': generals, 'cities': cities}
    os.makedirs(os.path.join(ROOT, 'scratch/_chr'), exist_ok=True)
    json.dump(idx, open(os.path.join(ROOT, 'scratch/_chr/index.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('battles', len(battles), 'generals', len(generals), 'cities', len(cities))


if __name__ == '__main__':
    main()
