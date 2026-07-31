import os

with open('existing_names.txt', 'r', encoding='utf-8') as f:
    used_names = set(f.read().splitlines())

# List of candidates. We need 50 valid ones.
candidates = [
    # ally_add_troops_opening
    ("树上开花", "ally_add_troops_opening", 0.1, "always", "opening_roll", "《三十六计》典故：田单守即墨，伪装神兵相助"),
    ("增垒示强", "ally_add_troops_opening", 0.15, "always", "opening_roll", "《史记·李牧列传》李牧大破匈奴前的示弱后突然增兵"),
    ("尽起国中", "ally_add_troops_opening", 0.2, "always", "opening_roll", "《史记·白起列传》长平之战秦昭王临时征发河内男丁"),
    ("草木皆兵", "ally_add_troops_opening", 0.1, "always", "opening_roll", "《晋书·苻坚载记》八公山上草木，皆以为晋兵"),
    ("投鞭断流", "ally_add_troops_opening", 0.15, "always", "opening_roll", "《晋书·苻坚载记》以吾之众旅，投鞭于江，足断其流"),
    ("望梅止渴", "ally_add_troops_opening", 0.05, "always", "opening_roll", "《世说新语》曹操行军望梅止渴，军士大振"),
    ("撒豆成兵", "ally_add_troops_opening", 0.1, "always", "opening_roll", "《水浒传》等古典小说中的幻术，隐喻奇兵突现"),
    ("八百壮士", "ally_add_troops_opening", 0.15, "always", "opening_roll", "四行仓库八百壮士，誓死坚守，震撼敌军"),
    ("背城借一", "ally_add_troops_opening", 0.15, "always", "opening_roll", "《左传·成公二年》请收合馀烬，背城借一"),
    ("孤注一掷", "ally_add_troops_opening", 0.1, "ratio_underdog", "opening_roll", "《晋书·何无忌传》刘裕倾其所有，孤注一掷"),
    
    # cancel_enemy_terrain_buff
    ("调虎离山", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三十六计》典故：虞诩在陈仓诱敌出山"),
    ("断道绝险", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三国志·张郃传》街亭之战张郃断马谡汲水之道"),
    ("暗渡陈仓", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《史记·淮阴侯列传》韩信绕开正面险要，出奇兵平定三秦"),
    ("引蛇出洞", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三十六计》战术，引诱敌人离开坚固阵地"),
    ("水淹七军", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三国志·关羽传》关羽决水淹于禁七军，无视其平地优势"),
    ("破阵摧坚", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三国志·孙坚传》坚亲冒矢石，破阵摧坚"),
    ("白马救围", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "《三国志·关羽传》关羽策马刺颜良于万众之中，解白马之围"),
    ("平地起雷", "cancel_enemy_terrain_buff", 1, "always", "opening_roll", "隐喻在平原野战中突然发动的奇袭，粉碎敌军阵型"),
    
    # halve_enemy_terrain_buff
    ("围魏救赵", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "《史记·孙子吴起列传》孙膑避实就虚，攻其必救"),
    ("擒贼擒王", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "《三十六计》摧其坚，夺其魁，以解其体"),
    ("风声鹤唳", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "《晋书·谢玄传》苻坚败军闻风声鹤唳，皆以为王师已至"),
    ("四面楚歌", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "《史记·项羽本纪》项王军壁垓下，四面皆楚歌"),
    ("威震逍遥", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "《三国志·张辽传》张辽威震逍遥津，挫败孙权攻城优势"),
    ("敲山震虎", "halve_enemy_terrain_buff", 0.5, "always", "opening_roll", "隐语战术，通过攻击旁侧来动摇敌方主力据点"),
    
    # nullify_enemy_opening_cut
    ("退避三舍", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《左传·僖公二十二年》城濮之战晋文公主动后退避开楚军锋芒"),
    ("结营凭险", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·陆逊传》夷陵之战陆逊坚守不出，拒敌锋锐"),
    ("按甲休兵", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《吕氏春秋》不战而屈人之兵，免去接战损失"),
    ("隔岸观火", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三十六计》阳乖属豫，阴乱属巽，不损己方分毫"),
    ("假痴不癫", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三十六计》宁伪作不知不为，不伪作假知妄为"),
    ("偃旗息鼓", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·赵云传》赵云汉水空营计，偃旗息鼓拒曹操"),
    ("刮骨疗毒", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·关羽传》关羽从容刮骨，军心不乱，无视开局创伤"),
    ("单刀赴会", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·鲁肃传》肃邀羽相见，各驻兵马百步上，免遭暗算"),
    ("壁垒森严", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "形容营垒防御极其严密，令敌军无隙可乘"),
    ("步步为营", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·司马懿传》懿每与蜀战，必步步为营，极度谨慎"),
    ("坚如磐石", "nullify_enemy_opening_cut", 1, "always", "opening_roll", "《玉台新咏》防守如同磐石般不可动摇"),
    
    # steal_enemy_skill
    ("抛砖引玉", "steal_enemy_skill", 1, "always", "opening_roll", "《三十六计》类以诱之，击蒙也，诱使敌方暴露底牌并夺之"),
    ("反客为主", "steal_enemy_skill", 1, "always", "opening_roll", "《三十六计》乘隙插足，扼其主机，将敌方优势化为己用"),
    ("偷梁换柱", "steal_enemy_skill", 1, "always", "opening_roll", "《三十六计》频更其阵，抽其主力，窃取敌方战术核心"),
    ("临阵倒戈", "steal_enemy_skill", 1, "always", "opening_roll", "《尚书·武成》牧野之战商军前徒倒戈，敌军战术反助我方"),
    ("草船借箭", "steal_enemy_skill", 1, "always", "opening_roll", "《三国演义》诸葛亮大雾江中借箭，化敌之攻为己之备"),
    ("借东风势", "steal_enemy_skill", 1, "always", "opening_roll", "《三国演义》诸葛亮借东风，窃取天时为己方火攻之利"),
    ("移花接木", "steal_enemy_skill", 1, "always", "opening_roll", "巧妙偷换手段，将敌方施加的技能转移化用"),
    ("顺手牵羊", "steal_enemy_skill", 1, "always", "opening_roll", "《三十六计》微隙在所必乘，微利在所必得"),
    
    # reflect_enemy_opening_cut
    ("苦肉诈降", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·黄盖传》赤壁之战借挨打骗取信任反戈一击"),
    ("减灶诱敌", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "《史记·孙子吴起列传》马陵之战孙膑减灶诱庞涓，以退为进斩之"),
    ("火烧连营", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "《三国志·陆逊传》陆逊退避后纵火烧连营，将敌方前压化为反噬"),
    ("请君入瓮", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "《资治通鉴》周兴酷吏被来俊臣以其人之道还治其人之身"),
    ("借力打力", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "太极拳理，将敌方开局猛攻的动能反弹给对方"),
    ("诱敌伏击", "reflect_enemy_opening_cut", 1, "always", "opening_roll", "故意暴露出破绽承受小损，换取合围全歼的巨大战果"),
    
    # partial_negate_enemy_skill
    ("欲擒故纵", "partial_negate_enemy_skill", 0.5, "always", "opening_roll", "《三十六计》逼则反兵，走则减势，削弱敌方技能威力"),
    ("连环妙计", "partial_negate_enemy_skill", 0.5, "always", "opening_roll", "《三十六计》将多兵众，不可以敌，使其自累，化解半数攻势"),
    ("锦囊妙计", "partial_negate_enemy_skill", 0.5, "always", "opening_roll", "《三国演义》诸葛亮预留锦囊，在关键时刻化解敌方计谋"),
    ("纸上谈兵", "partial_negate_enemy_skill", 0.5, "always", "opening_roll", "《史记·廉颇蔺相如列传》看破赵括死板战术，令其战术效果大减"),
    ("割须弃袍", "partial_negate_enemy_skill", 0.5, "always", "opening_roll", "《三国演义》曹操狼狈逃窜，但也借此化解了马超的致命一击"),
    
    # negate_enemy_skill
    ("指桑骂槐", "negate_enemy_skill", 1, "always", "opening_roll", "《三十六计》大凌小者，警以诱之，打断敌方战术节奏"),
    ("辕门射戟", "negate_enemy_skill", 1, "always", "opening_roll", "《三国志·吕布传》吕布射戟解纪灵之围，强行中止敌方攻势"),
    ("击鼓骂曹", "negate_enemy_skill", 1, "always", "opening_roll", "《三国演义》祢衡裸衣击鼓，气场压制敌方，废除其战术"),
    ("兵不厌诈", "negate_enemy_skill", 1, "always", "opening_roll", "《韩非子·难一》战阵之间，不厌诈伪，以此看破敌方诡计"),
    ("反间奇谋", "negate_enemy_skill", 1, "always", "opening_roll", "利用敌方内部矛盾，使敌方战术布置直接瘫痪"),
]

final_skills = []
for c in candidates:
    if c[0] not in used_names:
        final_skills.append(c)
    if len(final_skills) >= 50:
        break

if len(final_skills) < 50:
    print(f"Only found {len(final_skills)} unique candidates!")

new_entries = []
start_id = 736
for c in final_skills:
    sid = f"ts_{start_id:03d}"
    start_id += 1
    code = f"    {sid}: {{ id: '{sid}', displayName: '{c[0]}', condition: '{c[3]}', phase: '{c[4]}', baseEffect: '{c[1]}', magnitude: {c[2]}, sourceQuote: '{c[5]}' }},"
    new_entries.append(code)

with open('src/data/TacticalSkillCatalog.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find where TACTICAL_SKILL_CATALOG_V1 ends
insert_idx = -1
for i in range(len(lines)-1, -1, -1):
    if lines[i].strip() == '];':
        # we need to insert right before this
        insert_idx = i
        break

if insert_idx == -1:
    print("Could not find the end of the array.")
else:
    # insert the new entries
    lines = lines[:insert_idx] + [e + "\n" for e in new_entries] + lines[insert_idx:]
    with open('src/data/TacticalSkillCatalog.ts', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print(f"Successfully added {len(new_entries)} skills to TacticalSkillCatalog.ts")

