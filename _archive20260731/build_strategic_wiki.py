import re
import os

file_path = 'src/data/GeneralSkills.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Extract the STRATEGIC_SKILLS dictionary body
match = re.search(r'export const STRATEGIC_SKILLS: Record<string, StrategicSkill> = \{(.*?)\n\};\n', text, re.DOTALL)
if not match:
    print("Could not find STRATEGIC_SKILLS")
    exit(1)

body = match.group(1)
entries = re.findall(r"str_\d+:\s*\{(.*?)\},", body, re.DOTALL)

skills = []
for entry in entries:
    def extract(key):
        m = re.search(key + r"\s*:\s*([^,\n]+)", entry)
        if m:
            val = m.group(1).strip()
            if val.startswith("'") or val.startswith('"'):
                return val[1:-1]
            return val
        return ''
        
    id_str = extract("id")
    grid = extract("grid")
    name = extract("displayName")
    effect = extract("effect")
    mag = extract("magnitude")
    note = extract("note")
    hidden = extract("hiddenPostBattlePct")
    
    if id_str:
        skills.append({
            'id': id_str,
            'grid': grid,
            'name': name,
            'effect': effect,
            'magnitude': mag,
            'note': note,
            'hidden': hidden
        })

# Group them into categories. We can roughly group by their IDs or by name.
# According to the game's old encyclopedia and grid:
# S③, S④, S⑨ -> 军团攻系
# S①, S⑩, S⑪, S⑫ -> 军团速系
# S⑤, S⑥ -> 据点兵系
# S⑦, S⑧ -> 据点防系
# S⑬, S⑭ -> 补给系 (used to be 奇策)
# S⑮ -> 奇策系
# S② was merged into S③, so it might not exist.

groups = {
    '军团攻系': [],
    '军团速系': [],
    '据点兵系': [],
    '据点防系': [],
    '补给系': [],
    '奇策系': [],
    '其他': []
}

mapping = {
    'str_03': '军团攻系', 'str_04': '军团攻系', 'str_09': '军团攻系',
    'str_01': '军团速系', 'str_10': '军团速系', 'str_11': '军团速系', 'str_12': '军团速系',
    'str_05': '据点兵系', 'str_06': '据点兵系',
    'str_07': '据点防系', 'str_08': '据点防系',
    'str_13': '补给系', 'str_14': '补给系',
    'str_15': '奇策系'
}

for s in skills:
    cat = mapping.get(s['id'], '其他')
    groups[cat].append(s)

lines = []
lines.append("# 武将战略技能 (Strategic Skills - 15技)\n")
lines.append("战略技能属于大地图维度的光环或被动，分为六大系（15 技）。所有具有地图增益和连续作战设定的技能（主要为军团攻、速系），均按照最新底层设定附带了 **0.5% 的胜后隐藏续航**（无需扎营即可随回合缓慢回血），以保证远征名将不被零碎磨死。\n")

for cat_name, cat_skills in groups.items():
    if not cat_skills: continue
    lines.append(f"## {cat_name} ({len(cat_skills)}技)")
    for s in cat_skills:
        hidden_text = f" | 隐藏续航: `{s['hidden']}`" if s['hidden'] else ""
        lines.append(f"### {s['name']} `[{s['id']}]`")
        lines.append(f"- **底层效果**: `{s['effect']}` (参数: {s['magnitude']}){hidden_text}")
        lines.append(f"- **说明**: {s['note']}\n")

with open("C:/MAPWARSJ/乱斗游戏/03_武将技/武将战略技能.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Successfully created 武将战略技能.md")
