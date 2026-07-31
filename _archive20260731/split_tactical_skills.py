import re
import os

file_path = 'src/data/TacticalSkillCatalog.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

effect_to_six = {
    'ally_power_mult': 'gongzhan',
    'first_sortie_power_mult': 'gongzhan',
    'enemy_sub_troops_opening': 'shengzhan',
    'dual_sub_troops_opening': 'shengzhan',
    'luck_variance_self': 'dizhan',
    'luck_variance_enemy': 'dizhan',
    'luck_lock_self': 'dizhan',
    'ally_add_troops_opening': 'hunzhan',
    'steal_enemy_skill': 'hunzhan',
    'negate_enemy_skill': 'hunzhan',
    'partial_negate_enemy_skill': 'hunzhan',
    'reflect_enemy_opening_cut': 'hunzhan',
    'nullify_enemy_opening_cut': 'hunzhan',
    'cancel_enemy_terrain_buff': 'hunzhan',
    'halve_enemy_terrain_buff': 'hunzhan',
    'win_casualty_reduction': 'bingzhan',
    'elite_casualty_reduction': 'bingzhan',
    'post_recovery_rate': 'bingzhan',
    'lose_enemy_casualty_boost': 'baizhan',
    'recompute_comeback': 'baizhan',
    'lose_zero_enemy_recovery': 'baizhan',
    'ally_add_troops_comeback': 'baizhan',
    'first_sortie_comeback_mult': 'baizhan',
}

six_to_tri = {
    'gongzhan': 'advantage',
    'shengzhan': 'advantage',
    'dizhan': 'balance',
    'hunzhan': 'balance',
    'bingzhan': 'disadvantage',
    'baizhan': 'disadvantage'
}

underdog_conditions = {
    'ratio_underdog',
    'self_troops_below_enemy_pct',
    'side_comeback',
    'lose_as_underdog'
}

variance_effects = {
    'luck_variance_self',
    'luck_variance_enemy',
    'luck_lock_self',
    'recompute_comeback'
}

six_info = {
    'gongzhan': {'file': '战术技_1_攻战计.md', 'title': '攻战计 (加己攻)', 'desc': '核心机制：强化己方战力（如乘数加成）。在标准映射下属于【优势技】。'},
    'shengzhan': {'file': '战术技_2_胜战计.md', 'title': '胜战计 (减敌兵)', 'desc': '核心机制：直接削减敌方兵力。在标准映射下属于【优势技】。'},
    'dizhan': {'file': '战术技_3_敌战计.md', 'title': '敌战计 (更随机)', 'desc': '核心机制：扩大或锁定随机数方差。在标准映射下属于【均势技】。'},
    'hunzhan': {'file': '战术技_4_混战计.md', 'title': '混战计 (克夺反)', 'desc': '核心机制：克制、偷取或废除敌方技能，以及新加入的开局增兵。在标准映射下属于【均势技】。'},
    'bingzhan': {'file': '战术技_5_并战计.md', 'title': '并战计 (减己损)', 'desc': '核心机制：减少战损或增加战后恢复。在标准映射下属于【劣势技】。'},
    'baizhan': {'file': '战术技_6_败战计.md', 'title': '败战计 (败不垒)', 'desc': '核心机制：殊死一搏，输了也让敌人付出巨大代价。在标准映射下属于【劣势技】。'}
}

categorized = {k: [] for k in six_info.keys()}

matches = re.finditer(r'\{\s*(id:\s*[\'"]ts_.*?)\}', text, re.DOTALL)

for m in matches:
    entry_text = m.group(1)
    
    def extract(key):
        mm = re.search(key + r"\s*:\s*([^,\n}]+)", entry_text)
        if mm:
            val = mm.group(1).strip()
            if val.startswith("'") or val.startswith('"'):
                return val[1:-1]
            return val
        return ''

    name = extract("displayName")
    condition = extract("condition")
    effect = extract("baseEffect")
    magnitude = extract("magnitude")
    quote = extract("sourceQuote")
    
    if name and effect and condition:
        six_set = effect_to_six.get(effect, 'baizhan')
        
        tri_class = six_to_tri.get(six_set, 'disadvantage')
        override_reason = ""
        
        if condition in underdog_conditions:
            tri_class = 'disadvantage'
            override_reason = "因触发条件(兵力劣势/逆境)被强制降格为劣势技"
        elif effect in variance_effects:
            tri_class = 'disadvantage'
            override_reason = "因方差/投机效果被强制降格为劣势技"
            
        categorized[six_set].append({
            'name': name,
            'condition': condition,
            'effect': effect,
            'magnitude': magnitude,
            'quote': quote,
            'tri_class': tri_class,
            'override_reason': override_reason
        })

out_dir = "C:/MAPWARSJ/乱斗游戏/03_武将技"

for six_key, info in six_info.items():
    skills = categorized[six_key]
    lines = []
    lines.append(f"# {info['title']} (共 {len(skills)} 技)\n")
    lines.append(f"{info['desc']}\n")
    lines.append("注意：根据三势归属体系的最新三层判定：\n- 第 1 层：条件为劣势条件 → 强制劣势\n- 第 2 层：方差/投机效果 → 强制劣势\n- 第 3 层：六种默认归类\n")
    
    for s in skills:
        tri_label = '劣势技' if s['tri_class'] == 'disadvantage' else ('均势技' if s['tri_class'] == 'balance' else '优势技')
        override_tag = f" **(⚠️{s['override_reason']})**" if s['override_reason'] else ""
        lines.append(f"### {s['name']} 〔{tri_label}〕{override_tag}")
        lines.append(f"- **触发条件**: `{s['condition']}`")
        lines.append(f"- **底层效果**: `{s['effect']}` (参数: {s['magnitude']})")
        if s['quote']:
            lines.append(f"- **历史典故**: {s['quote']}")
        lines.append("")
        
    file_path = os.path.join(out_dir, info['file'])
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

print("Successfully rebuilt 6 category files.")
