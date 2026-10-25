import struct
import tempfile
import os
import time
import zlib
import json
import re
from pathlib import Path

from AoE2ScenarioParser.scenarios import aoe2_scenario
from AoE2ScenarioParser.scenarios.aoe2_scenario import AoE2Scenario, _get_version_directory_path, _decompress_bytes
from AoE2ScenarioParser.scenarios.aoe2_de_scenario import AoE2DEScenario
from AoE2ScenarioParser.helper.incremental_generator import IncrementalGenerator
from AoE2ScenarioParser.objects.aoe2_object_manager import AoE2ObjectManager
import AoE2ScenarioParser.settings as settings

settings.PRINT_STATUS_UPDATES = False
settings.SHOW_SCENARIO_VERSION_WARNINGS = False

AoE2ObjectManager.setup = lambda self: None

def fast_load_content_sections(self, raw_file_igenerator):
    self._decompressed_file_data = _decompress_bytes(raw_file_igenerator.get_remaining_bytes())
    data_igenerator = IncrementalGenerator(name='Scenario Data', file_content=self._decompressed_file_data)
    wanted = {"DataHeader", "Messages"}
    for section_name in self.structure.keys():
        if section_name == "FileHeader":
            continue
        if section_name not in wanted:
            break
        self._create_and_load_section(section_name, data_igenerator)

AoE2Scenario._load_content_sections = fast_load_content_sections

def clean_version(scenario_version, avail):
    clean_v = str(scenario_version).split('\x00')[0].strip()
    try:
        val = float(clean_v)
    except:
        val = 1.54
        clean_v = '1.54'
    if clean_v not in avail:
        clean_v = min(avail, key=lambda x: abs(float(x) - val))
    return clean_v

def patched_get_structure(game_version, scenario_version):
    vdir = _get_version_directory_path() / game_version
    avail = sorted([p.name.replace('v', '') for p in vdir.iterdir() if p.name.startswith('v')])
    cv = clean_version(scenario_version, avail)
    with (vdir / f'v{cv}' / 'structure.json').open() as f:
        return json.load(f)

def patched_get_version_dep(game_version, scenario_version, name):
    vdir = _get_version_directory_path() / game_version
    avail = sorted([p.name.replace('v', '') for p in vdir.iterdir() if p.name.startswith('v')])
    cv = clean_version(scenario_version, avail)
    with (vdir / f'v{cv}' / f'{name}.json').open() as f:
        return json.load(f)

aoe2_scenario._get_structure = patched_get_structure
AoE2Scenario._get_structure = staticmethod(patched_get_structure)
aoe2_scenario._get_version_dependent_structure_file = patched_get_version_dep

DE_ROOT = Path(r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\_common")
CAMPAIGN_DIR = DE_ROOT / "campaign"
ZH_DIR = Path(r"C:\Program Files (x86)\Steam\steamapps\common\AoE2DE\resources\zh\strings\key-value")

def read_str16(d, p):
    assert d[p:p + 2] == b"`\n", f"bad str16 marker at {p}"
    n = struct.unpack_from("<H", d, p + 2)[0]
    return d[p + 4:p + 4 + n].decode("utf-8", "replace"), p + 4 + n

def split_campaign(path):
    d = path.read_bytes()
    assert d[:4] == b"2.00", f"未知战役版本 {d[:4]!r}"
    ndep = struct.unpack_from("<I", d, 4)[0]
    p = 8 + 4 * ndep
    cname = d[p:p + 256].split(b"\0")[0].decode("utf-8", "replace")
    p += 256
    count = struct.unpack_from("<I", d, p)[0]
    p += 4
    out = []
    for _ in range(count):
        size, offset = struct.unpack_from("<II", d, p)
        name, p = read_str16(d, p + 8)
        fname, p = read_str16(d, p)
        out.append((name, fname, d[offset:offset + size]))
    return cname, out

def load_zh_strings():
    strings = {}
    for f in ZH_DIR.glob('*.txt'):
        content = f.read_text(encoding='utf-8-sig', errors='replace')
        lines = content.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i]
            m = re.match(r'^(\d+)\s+"(.*)', line)
            if m:
                sid = int(m.group(1))
                val = m.group(2)
                while not val.endswith('"') and i + 1 < len(lines):
                    i += 1
                    val += '\n' + lines[i]
                if val.endswith('"'):
                    val = val[:-1]
                val = val.replace(r'\n', '\n').replace(r'\"', '"')
                strings[sid] = val
            i += 1
    return strings

def parse_scenario_bytes(raw_bytes):
    with tempfile.NamedTemporaryFile(suffix='.aoe2scenario', delete=False) as tf:
        tf.write(raw_bytes)
        tf_path = tf.name
    try:
        scen = AoE2DEScenario.from_file(tf_path)
        dh = scen.sections['DataHeader']
        msg = scen.sections['Messages']
        
        civs = []
        if hasattr(dh, 'player_data_1'):
            for p1 in dh.player_data_1:
                civs.append({
                    'active': getattr(p1, 'active', None),
                    'human': getattr(p1, 'human', None),
                    'civ': getattr(p1, 'civilization', None)
                })
                
        return {
            'tribe_names': list(dh.tribe_names),
            'string_table_player_names': list(dh.string_table_player_names),
            'civs': civs,
            'hints_id': getattr(msg, 'hints', -1),
            'scouts_id': getattr(msg, 'scouts', -1),
            'instructions_id': getattr(msg, 'instructions', -1),
            'ascii_hints': getattr(msg, 'ascii_hints', ''),
            'ascii_scouts': getattr(msg, 'ascii_scouts', ''),
            'ascii_instructions': getattr(msg, 'ascii_instructions', '')
        }
    finally:
        if os.path.exists(tf_path):
            os.remove(tf_path)

def main():
    t0 = time.time()
    print("Loading Chinese strings...")
    zh = load_zh_strings()
    print(f"Loaded {len(zh)} Chinese strings.")
    
    index_path = Path("public/de-maps/campaign/index.json")
    index_data = json.loads(index_path.read_text(encoding='utf-8'))
    print(f"Index has {len(index_data)} scenarios.")
    
    campaign_names = {}
    for p in CAMPAIGN_DIR.glob('*_layout.json'):
        try:
            d = json.loads(p.read_text(encoding='utf-8'))
            bg = d.get('BackgroundMaterial', '')
            c_key = p.stem.replace('_layout', '')
            campaign_names[c_key] = bg
        except:
            pass
            
    campaign_scens = {}
    for item in index_data:
        c = item['campaign']
        if c not in campaign_scens:
            if c == '0_E3_Scenario':
                raw = (CAMPAIGN_DIR / "0_E3_Scenario.aoe2scenario").read_bytes()
                campaign_scens[c] = [(item['name'], item['name'], raw)]
            else:
                camp_path = CAMPAIGN_DIR / f"{c}.aoe2campaign"
                cname, scens = split_campaign(camp_path)
                campaign_scens[c] = scens

    results = []
    success_cnt = 0
    err_cnt = 0
    
    for item in index_data:
        sid = item['id']
        c = item['campaign']
        lvl = item['level']
        scens = campaign_scens.get(c, [])
        idx = lvl - 1
        if idx >= len(scens):
            print(f"Index out of range for {sid}: level {lvl}, len {len(scens)}")
            err_cnt += 1
            continue
            
        name, fname, raw = scens[idx]
        try:
            parsed = parse_scenario_bytes(raw)
            success_cnt += 1
            
            def get_text(sid_num, ascii_val):
                if isinstance(sid_num, int) and sid_num in zh:
                    return zh[sid_num]
                return ascii_val or ""
                
            hints_zh = get_text(parsed['hints_id'], parsed['ascii_hints'])
            scouts_zh = get_text(parsed['scouts_id'], parsed['ascii_scouts'])
            instructions_zh = get_text(parsed['instructions_id'], parsed['ascii_instructions'])
            
            players = []
            for i, tname in enumerate(parsed['tribe_names']):
                if not tname and i > 0:
                    continue
                str_id = parsed['string_table_player_names'][i] if i < len(parsed['string_table_player_names']) else -1
                name_zh = zh.get(str_id, tname)
                civ_info = parsed['civs'][i] if i < len(parsed['civs']) else {}
                players.append({
                    'slot': i,
                    'name_en': tname,
                    'name_zh': name_zh,
                    'string_id': str_id,
                    'active': civ_info.get('active'),
                    'human': civ_info.get('human'),
                    'civ': civ_info.get('civ')
                })
                
            results.append({
                'id': sid,
                'campaign': c,
                'campaign_title': campaign_names.get(c, c),
                'level': lvl,
                'scenario_file': fname,
                'internal_name': name,
                'players': players,
                'hints_zh': hints_zh,
                'scouts_zh': scouts_zh,
                'instructions_zh': instructions_zh
            })
        except Exception as e:
            print(f"Error parsing {sid}: {e}")
            err_cnt += 1
            
    print(f"Done in {time.time() - t0:.2f}s! Success: {success_cnt}, Errors: {err_cnt}")
    out_file = Path("scratch/de_scenarios_all_meta.json")
    out_file.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Written all metadata to {out_file} (size: {out_file.stat().st_size} bytes)")

if __name__ == '__main__':
    main()
