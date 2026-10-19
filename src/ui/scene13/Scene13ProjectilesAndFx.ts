import type { WarType } from '../../data/WarTypes';
import { UNIT_PX } from './Scene13CombatMath';

export const DEATH_ANIM = 3;
export const ARROW_DUR = 0.42;
/**
 * 各兵种发射/出手相位表（0~8 相位）：shootPhase = DE type_50.frame_delay（攻击前摇帧）÷ attack_graphic.frame_count（动画总帧）× 8。
 * 放箭帧不再是「动画中点」一刀切——每个远程兵种的拉弓/撒放时机不同（掷矛手 3.38、骑射手 6.22、弓兵 4.0、火枪 4.0）。
 * 全表由 scratch/extract_de_shootphase.py 用 genieutils 从 empires2_x2_p1.dat 抽出（2026-08-17）。
 */
export const SHOOT_PHASE_BY_TYPE: Record<string, number> = {
    // ── [2026-08-18 补齐] 新补录远程兵种：同族继承；无同族者用弓兵基准 3.73（DE 无对应单位，无法取真值） ──
    antiquity_cavalry_archer: 3.73,
    antiquity_heavy_cavalry_archer: 3.73,
    antiquity_heavy_scorpion: 1.6,
    antiquity_mangonel: 0.5,
    antiquity_onager: 0.5,
    antiquity_scorpion: 1.6,
    antiquity_siege_onager: 0.5,
    antiquity_siege_tower: 3.73,
    antiquity_skirmisher: 3.38,
    bowman: 3.73,
    elite_antiquity_skirmisher: 3.38,
    elite_peltast: 3.73,
    flamethrower: 3.73,
    gastraphetes: 3.73,
    helepolis: 3.73,
    laminated_bowman: 3.73,
    recurve_bowman: 3.73,
    siege_tower: 3.73,
    tarantine_cavalry: 3.2,
    varangian_jarl: 3.2,
    elite_varangian_jarl: 3.2,
    // [2026-08-17 补全] 用 DE 真实数据精确对齐每个远程兵种的放箭相位：
    //   shootPhase = type_50.frame_delay（攻击前摇帧）÷ attack_graphic.frame_count（动画总帧）× 8。
    //   替代此前只登记 26 个特殊兵种、其余远程全吃 DEFAULT=4 大锅饭的表（「远程动作和箭不同步」的次要根因）。
    //   异常兜底：投石车 frame_delay=0（数据缺）保留观察值 0.5；精英/皇家苏丹亲兵 frame_delay=0（bug）沿用普通版 3.2；
    //   精锐斯基泰骑射手 frame_delay=46 > 动画 45 帧 → clamp 7.5。
    mangonel: 0.5,
    onager: 0.5,
    siege_onager: 0.5,
    heavy_rocket_cart: 0.13,
    rocket_cart: 0.13,
    war_chariot_ranged: 0.8,
    bombard_cannon: 0.93,
    houfnice: 0.93,
    ballista: 1.6,
    elite_mameluke: 1.6,
    elite_organ_gun: 1.6,
    heavy_scorpion: 1.6,
    organ_gun: 1.6,
    scorpion: 1.6,
    siege_ballista: 1.6,
    traction_trebuchet: 1.78,
    conquistador: 2.31,
    elite_conquistador: 2.31,
    chukonu: 2.53,
    elite_chukonu: 2.53,
    fire_archer: 2.67,
    longbowman_elite: 2.67,
    elite_fire_archer: 2.67,
    pattiyoda_longbowman: 2.67,
    elite_pattiyoda_longbowman: 2.67,
    amazon_archer: 2.67,
    elite_plumed_archer: 2.67,
    longbowman: 2.67,
    plumed_archer: 2.67,
    kipchak: 2.8,
    elite_kipchak: 2.8,
    mounted_trebuchet: 2.8,
    mangudai: 3.07,
    mangudai_elite: 3.07,
    elite_composite_bowman: 3.2,
    composite_bowman: 3.2,
    dagnajan_elephant: 3.2,
    ballista_elephant: 3.2,
    elephant_archer: 3.2,
    elite_ballista_elephant: 3.2,
    elite_elephant_archer: 3.2,
    elite_genitour: 3.2,
    genitour: 3.2,
    janissary: 3.2,
    elite_janissary: 3.2,
    royal_janissary: 3.2,
    mameluke: 3.2,
    elite_guecha_warrior: 3.33,
    guecha_warrior: 3.33,
    imperial_skirmisher: 3.38,
    elite_skirmisher: 3.38,
    skirmisher: 3.38,
    thracian_peltast: 3.38,
    arbalest: 3.56,
    elite_hussite_wagon: 3.56,
    hussite_wagon: 3.56,
    elite_ratha_ranged: 3.73,
    grenadier: 3.73,
    ratha_ranged: 3.73,
    rhodian_slinger: 3.73,
    slinger: 3.73,
    arambai: 4.0,
    crossbowman: 4.0,
    heavy_crossbowman: 4.0,
    mounted_crossbowman: 4.0,
    mounted_crossbowman_heavy: 4.0,
    outlaw: 4.0,
    khan: 6.22,
    archer: 4.0,
    crossbow: 4.0,
    blackwood_archer: 4.0,
    camel_archer: 4.0,
    chakram_thrower: 4.0,
    elite_arambai: 4.0,
    elite_blackwood_archer: 4.0,
    elite_camel_archer: 4.0,
    elite_chakram_thrower: 4.0,
    elite_gbeto: 4.0,
    elite_genoese_crossbowman: 4.0,
    gbeto: 4.0,
    genoese_crossbowman: 4.0,
    hand_cannoneer: 4.0,
    immortal_ranged: 4.0,
    elite_immortal_ranged: 4.0,
    rattan_archer: 4.09,
    rattan_archer_elite: 4.09,
    cretan_archer: 4.27,
    throwing_axeman: 4.98,
    elite_throwing_axeman: 4.98,
    bactrian_archer: 5.07,
    bolas_rider: 5.07,
    elite_bolas_rider: 5.07,
    phalangite: 5.07,
    elite_phalangite: 5.07,
    elite_war_wagon: 5.69,
    war_wagon: 5.69,
    cav_archer_heavy: 6.13,
    cav_archer: 6.22,
    xianbei_raider: 6.22,
    horse_archer: 6.22,
    scythian_horse_archer: 6.22,
    elite_scythian_horse_archer: 7.5,
};
export const DEFAULT_SHOOT_PHASE = 4;
/**
 * 开火点高度（锚点**上方**的屏幕像素）。默认值 `UNIT_PX * 0.45` = **步兵胸口高度**，
 * 只对身高一个 UNIT_PX（64px）的步行兵成立；塔类攻城器械照它射出 = 弩箭从**塔身下段**（车轮上方）飞出来。
 * 🔴 [2026-10-02 主人报障「战术模式攻城塔的攻击武器是弩箭，但是射出的位置不对」后查证]
 *   DE 贴图 `_meta.json` 实测：SIEGTWR / ANTIQUITY_SIEGETOWER / HELEPOLIS 的画面高 fh=160~176、
 *   hotspot hy=140~152 —— 塔比士兵（fh≈72）高出一倍多，锚点却在塔基。
 *   逐帧像素 + 十字线叠图实测（scratch/_tower_inspect）：
 *     · 攻城塔（SIEGTWR / 古典攻城塔，两套贴图同形）：**塔顶平台地板**在锚点上方 ≈110px；
 *     · 赫勒波利斯：塔顶弩机只在**发射帧**（attack 第 20 帧；helepolis shootPhase 3.73 × 45 帧）露出，
 *       位于锚点上方 ≈138px（另在朝向前方偏 ≈29px 处，此处不取：开火点须留在塔之轴线上，
 *       否则 8 向贴图一切换，弹道起点就在塔顶左右跳）。
 *   三者 sz 均为 1（与士兵同尺度），故 1 贴图像素 = 1 屏幕像素；乘 sz 以备日后改尺度。
 *   不在表里的兵种（含象兵/战车等）**一律维持原值**，不动。
 */
export const MUZZLE_LIFT_BY_TYPE: Record<string, number> = {
    siege_tower: 110,
    antiquity_siege_tower: 110,
    helepolis: 138,
};
/** DE 抛射物缩放 = 士兵同款（UNIT_PX / 64）。DE 素材像素已反映真实比例（标枪 56px 是箭 28px 的 2 倍），统一缩放即可。 */
export const PROJ_SCALE = UNIT_PX / 64;
/** 火枪弹丸渲染放大：DE 原弹丸仅 4×8 像素（渲染 9px 肉眼不可见），原先放大到可见（游戏合理，主人 2026-08-20 定）。
 *  🔴 [2026-10-11 主人令「所有，全部，都是1.0，一个也不能剩下」] 2.6 → **1.0**（弹丸也按 DE 原生像素画）。 */
export const PROJ_SCALE_OVERRIDE: Record<string, number> = {
    PROJ_SHOT: 1.0,
};
/** 多种 DE 弹丸单位可以共用同一张 SLD，但保留独立 key 以使用各自的飞行参数。 */
export const PROJ_ASSET_KEY: Record<string, string> = {
    PROJ_CROSSBOW: 'PROJ_ARROW',   // [2026-09-14] 弩兵：画的是 DE 小箭，只是飞得比弓箭平（见 PROJ_ARC_RATIO）
    PROJ_WAR_WAGON: 'PROJ_BOLT',
    PROJ_HELEPOLIS: 'PROJ_BOLT',
    PROJ_GUNPOWDER: 'PROJ_SHOT',
    PROJ_FIRE_LANCER: 'PROJ_SHOT',
    PROJ_BOMBARD_BALL: 'PROJ_BALL',
};
/**
 * 远程兵 → DE 抛射物素材（缺省 = 箭 PROJ_ARROW）。
 * 箭：弓手/弩手/长弓/诸葛弩/骑射手/突骑/复合弓/藤弓/钦察/象弓（默认，不必列）；
 * 火箭：火弓；标枪：掷矛手；飞镖：阿兰拜；飞斧：掷斧兵；
 * 弩箭：元戎弩/重弩战象/**高丽战车**（平直穿透）。
 */
export const PROJ_TYPE: Record<string, string> = {
    // ── [2026-10-18 主人定] 9 位非攻击性英雄：统一设为简单魔法系效果（PROJ_MAGIC 简洁法球，不再使用杂乱的喷火特效）──
    hero_zhugeliang: 'PROJ_MAGIC',
    hero_jadwiga: 'PROJ_MAGIC',
    hero_tamar: 'PROJ_MAGIC',
    hero_friartuck: 'PROJ_MAGIC',
    hero_imam: 'PROJ_MAGIC',
    hero_chandbardai: 'PROJ_MAGIC',
    hero_belaiv: 'PROJ_MAGIC',
    hero_shahking: 'PROJ_MAGIC',
    hero_jayanegara: 'PROJ_MAGIC',
    // ── [2026-08-18 补] 这些范围伤远程原本没映射，会退回默认的 PROJ_ARROW（投石车射箭矢）──
    antiquity_mangonel: 'PROJ_MANGONEL',
    antiquity_onager: 'PROJ_MANGONEL',
    antiquity_siege_onager: 'PROJ_MANGONEL',
    antiquity_scorpion: 'PROJ_BOLT',
    antiquity_heavy_scorpion: 'PROJ_BOLT',
    antiquity_siege_tower: 'PROJ_HELEPOLIS',   // DE: SIEGTWR → Projectile Helepolis → p_bolt（塔上弩机）
    flamethrower: 'PROJ_FIRE',         // 猛火油柜喷火：用火焰抛射物（30 帧火舌，非弹丸）
    helepolis: 'PROJ_HELEPOLIS',           // 攻城塔射弩箭
    // 🔴 [2026-08-18 修·主人报「车的攻击效果还是射箭」] 胡斯战车是**火铳车**，不射箭：
    //    DE 里它有专属弹丸 `Projectile Hussite Wagon`(id 1733)，我们没登记 → 落回默认 PROJ_ARROW。
    //    改用火器弹丸 PROJ_SHOT。
    hussite_wagon: 'PROJ_HUSSITE_WAGON',
    elite_hussite_wagon: 'PROJ_HUSSITE_WAGON',
    // ══ [2026-08-20] 全部「车」类攻击特效按 DE 本体逐个重核 ══
    //   判据 = genieutils 解析 `empires2_x2_p1.dat` 的 projectile_unit_id → 弹丸单位 → graphic 文件名，
    //   **不是注释、不是记忆**（探针 scratch/probe_wagons.py，导出表 units_proj.tsv）。实测：
    //     WAGON(高丽战车)      → 373  Projectile War Galley        → p_bolt          = 弩箭
    //     HUSSITEWAGON(胡斯)   → 1733 Projectile Hussite Wagon     → p_hussite_wagon = 专属火铳弹
    //     WARCHAR(先秦战车)    → Projectile War Chariot(Barrage)   → p_spear_small   = 小标枪
    //     ORGAN(风琴炮)        → 1789 Projectile Organ Gun         → p_shot          = 火器弹（已对）
    //     RCKTCRT(火箭车)      → Projectile Rocket Cart            → p_arrow_fire    = 火箭（已对）
    //     SCBAL/HWBAL/ELEBALI  → Scorpion/HeavyScorpion/BallistaEle→ p_bolt          = 弩箭（已对）
    //     SIEGTWR(攻城塔)      → Projectile Helepolis              → p_bolt          = 弩箭
    //   高丽战车此前写着「射箭是对的，不动」——那是 AI 自己下的错误结论，已作废。
    //   通用 PROJ_BOLT 仍供弩炮使用；高丽战车单列 PROJ_WAR_WAGON，保留弹丸 373 的 0.05 弧度。
    war_wagon: 'PROJ_WAR_WAGON',
    elite_war_wagon: 'PROJ_WAR_WAGON',
    // 先秦远程战车：DE `WARCHAR` → `Projectile War Chariot (Barrage/Focus Fire)` → p_spear_small
    //   = **小标枪**，不是箭。此前没映射、落回 PROJ_ARROW。
    // 🔴 [2026-09-17 主人定] 先秦战车改配精锐连弩的武器：投射物由小掷矛换成弩矢，与 elite_chukonu 同一件
    war_chariot_ranged: 'PROJ_CROSSBOW',
    // 攻城塔：DE `SIEGTWR` → `Projectile Helepolis` → p_bolt（塔上弩机，非弓手羽箭）
    siege_tower: 'PROJ_HELEPOLIS',
    fire_archer: 'PROJ_ARROW_FIRE',
    elite_fire_archer: 'PROJ_ARROW_FIRE',
    rocket_cart: 'PROJ_ARROW_FIRE',
    heavy_rocket_cart: 'PROJ_ARROW_FIRE',
    tarantine_cavalry: 'PROJ_SPEAR',
    varangian_jarl: 'PROJ_SPEAR',
    hero_harald: 'PROJ_SPEAR',
    elite_varangian_jarl: 'PROJ_SPEAR',
    // 🔴 [2026-09-14 主人「弩箭是不是应该直一点？和标枪」] 弩兵此前与弓兵共用 PROJ_ARROW，
    //    于是跟着吃 0.3 的弓箭弧度 —— 而弩射程最远（280~320），min(len×0.3,100) 让它峰值 84~96px，
    //    **比弓兵还高一倍**，正好反了：弩射得远恰恰因为初速高、弹道平。
    //    ⚠️ 但**不能挂 PROJ_BOLT**：那是弩炮的粗弩矛（52×12、**仅 1 帧**，朝哪射都同一个角度），
    //       而 DE 里弩手与诸葛弩射的就是小箭（见下方注释「箭：弓手/弩手/…/诸葛弩」）。
    //    故新建逻辑弹丸 PROJ_CROSSBOW：**素材仍用 PROJ_ARROW 小箭**（11 帧带方向），
    //    只借独立 key 拿自己的飞行参数（0.09 平直）—— 正是 PROJ_ASSET_KEY 那层间接的用途。
    crossbowman: 'PROJ_CROSSBOW',
    heavy_crossbowman: 'PROJ_CROSSBOW',
    mounted_crossbowman: 'PROJ_CROSSBOW',
    mounted_crossbowman_heavy: 'PROJ_CROSSBOW',
    arbalest: 'PROJ_CROSSBOW',
    chukonu: 'PROJ_CROSSBOW',
    elite_chukonu: 'PROJ_CROSSBOW',
    genoese_crossbowman: 'PROJ_CROSSBOW',
    elite_genoese_crossbowman: 'PROJ_CROSSBOW',
    gastraphetes: 'PROJ_CROSSBOW',
    skirmisher: 'PROJ_SPEAR',
    elite_skirmisher: 'PROJ_SPEAR',
    imperial_skirmisher: 'PROJ_SPEAR',
    genitour: 'PROJ_SPEAR',
    elite_genitour: 'PROJ_SPEAR',
    thracian_peltast: 'PROJ_SPEAR',
    elite_peltast: 'PROJ_SPEAR',
    antiquity_skirmisher: 'PROJ_SPEAR',
    elite_antiquity_skirmisher: 'PROJ_SPEAR',
    guecha_warrior: 'PROJ_SPEAR',
    elite_guecha_warrior: 'PROJ_SPEAR',
    arambai: 'PROJ_DART',
    elite_arambai: 'PROJ_DART',
    throwing_axeman: 'PROJ_THROWING_AXE',
    elite_throwing_axeman: 'PROJ_THROWING_AXE',
    ballista: 'PROJ_BOLT',
    ballista_elephant: 'PROJ_BOLT',
    elite_ballista_elephant: 'PROJ_BOLT',
    scorpion: 'PROJ_BOLT',
    heavy_scorpion: 'PROJ_BOLT',
    siege_ballista: 'PROJ_BOLT',
    // 投石兵/投索兵（投掷轻石弹：标准弧线、落地无爆炸；复用重炮石弹素材但弹道独立）
    slinger: 'PROJ_SLING',
    rhodian_slinger: 'PROJ_SLING',
    bolas_rider: 'PROJ_SLING',
    elite_bolas_rider: 'PROJ_SLING',
    // 飞刀/弯刀
    gbeto: 'PROJ_DART',
    elite_gbeto: 'PROJ_DART',
    // DE dat 实测：CHAKRAM → 1756 Projectile Chakram → p_chakram_x1；
    // ECHAKRAM → 1783 Projectile EliteChakram → p_chakram_elite_x1。两者均为直线弹道、速度 6。
    chakram_thrower: 'PROJ_CHAKRAM',
    elite_chakram_thrower: 'PROJ_CHAKRAM_ELITE',
    mameluke: 'PROJ_DART',
    elite_mameluke: 'PROJ_DART',
    // 投石机/抛石机（投石弹/巨石，高抛弧线 + 落地碎石泥土冲击）
    mangonel: 'PROJ_MANGONEL',
    onager: 'PROJ_MANGONEL',
    siege_onager: 'PROJ_MANGONEL',
    traction_trebuchet: 'PROJ_ROCK',
    mounted_trebuchet: 'PROJ_ROCK',
    // 热兵器（2026-08-16 主人定：火枪/火炮/掷弹兵用 DE 独立抛射物）
    hand_cannoneer: 'PROJ_GUNPOWDER',
    janissary: 'PROJ_GUNPOWDER',
    elite_janissary: 'PROJ_GUNPOWDER',
    royal_janissary: 'PROJ_GUNPOWDER',
    conquistador: 'PROJ_GUNPOWDER',
    elite_conquistador: 'PROJ_GUNPOWDER',
    organ_gun: 'PROJ_GUNPOWDER',
    elite_organ_gun: 'PROJ_GUNPOWDER',
    bombard_cannon: 'PROJ_BOMBARD_BALL',
    houfnice: 'PROJ_BOMBARD_BALL',
    grenadier: 'PROJ_GRENADE',
};
/** DE 本体逐单位命中率；0% 散射武器在本引擎中单独按散射结算，不放进整轮 miss 判定。 */
export const ACCURACY_BY_TYPE: Record<string, number> = {
    tarantine_cavalry: 90,
    varangian_jarl: 90,
    elite_varangian_jarl: 90,
    kipchak: 90,
    elite_kipchak: 90,
    elite_fire_archer: 85,
    xianbei_raider: 80,
    imperial_skirmisher: 95,
    mangudai: 95,
    mangudai_elite: 95,
    composite_bowman: 100,
    elite_composite_bowman: 100,
    ballista_elephant: 100,
    elite_ballista_elephant: 100,
    elephant_archer: 70,
    elite_elephant_archer: 85,
    bactrian_archer: 90,
    camel_archer: 95,
    elite_camel_archer: 95,
    conquistador: 65,
    elite_conquistador: 70,
    cretan_archer: 90,
    elite_arambai: 30,
    elite_blackwood_archer: 90,
    elite_bolas_rider: 95,
    genoese_crossbowman: 90,
    elite_genoese_crossbowman: 100,
    janissary: 50,
    elite_janissary: 65,
    royal_janissary: 65,
    elite_plumed_archer: 90,
    ratha_ranged: 80,
    elite_ratha_ranged: 90,
    elite_scythian_horse_archer: 80,
    war_wagon: 100,
    elite_war_wagon: 100,
    scorpion: 100,
    heavy_scorpion: 100,
    siege_ballista: 100,
    thracian_peltast: 95,
    traction_trebuchet: 30,
    flamethrower: 75,
    helepolis: 100,
    siege_tower: 100,
    antiquity_siege_tower: 100,
    immortal_ranged: 70,
    elite_immortal_ranged: 80,
    grenadier: 100,
};

/**
 * DE accuracy（准确率，%）——远程投射物命中目标概率，不是 100%。
 * 已查 DE 本体（fandom 兵种面板核对 empires2_x2_p1.dat 数值）：
 *   火枪 75% / 弓箭 80% / 弩 85% / 掷矛·投石 90% / 骑射 50% / 长弓 70% /
 *   阿兰拜飞镖 20%（散射极大）。
 *   飞斧·飞刀·弯刀·投石车·火炮·火箭车 = dmgType 'melee' → DE 恒 100% 命中（本函数直接返回 100）。
 * 只有 dmgType 'pierce' 的投射物才可能 miss；'melee'（近战/飞斧/投石）DE 无准确率概念。
 */
export function accuracyOf(key: string, wt: WarType): number {
    if (CASTER_TYPES.has(key)) return 95;
    const exact = ACCURACY_BY_TYPE[key];
    if (exact !== undefined) return exact;
    if (wt.dmgType === 'melee') return 100;
    // DE 风琴炮本体 accuracy=0：含义是弹丸按 dispersion 散射并沿途碰撞，不是“整轮必定落空”。
    // 本引擎的 accuracy 是整轮伤害开关，故这里必须保持伤害开启，散布在发射段单独按 DE 0.6 格处理。
    if (key === 'organ_gun' || key === 'elite_organ_gun') return 100;
    if (key === 'hussite_wagon') return 85;
    if (key === 'elite_hussite_wagon') return 90;
    const proj = PROJ_TYPE[key] ?? 'PROJ_ARROW';
    // 火器（火枪/苏丹亲兵/征服者/风琴炮/掷弹兵/胡斯战车）
    if (proj === 'PROJ_GUNPOWDER' || proj === 'PROJ_BOMBARD_BALL' || proj === 'PROJ_GRENADE' || proj === 'PROJ_HUSSITE_WAGON') return 75;
    // 阿兰拜飞镖（DE 20%，散射极大）
    if (key === 'arambai' || key === 'elite_arambai') return 20;
    // 长弓（DE 70%）
    if (key === 'longbowman' || key === 'longbowman_elite' || key === 'pattiyoda_longbowman' || key === 'elite_pattiyoda_longbowman') return 70;
    // 弩（弩兵/劲弩/热那亚弩/连弩/腹弩/弩炮/弩炮战象/高丽战车/攻城塔）
    // 🔴 [2026-09-17 主人定] 先秦战车改用连弩武器 → 准确率随之归入弩档 85（原在下面掷矛档 90）
    if (key.includes('crossbow') || key.includes('arbalest') || key.includes('ballista') || key.includes('scorpion') || key.includes('gastraphetes') || key.includes('chukonu') || key.includes('war_wagon') || key === 'siege_tower' || key === 'helepolis' || key === 'war_chariot_ranged') return 85;
    // 掷矛/标枪/投石（掷矛手/标枪骑兵/色雷斯标枪/格查勇士/投石兵/套索骑兵）
    if (key.includes('skirmisher') || key.includes('peltast') || key.includes('genitour') || key.includes('slinger') || key.includes('bolas') || key.includes('guecha')) return 90;
    // 骑射（cls=cav 且默认箭，DE 骑射手 50%，移动中射击）
    if (wt.cls === 'cav') return 50;
    // 普通步弓（含火箭/火弓/象弓）
    return 80;
}
/** 平直弹道抛射物（弩炮箭/攻城塔弩/火枪弹/飞轮/魔法弹）：不抛弧、直线飞行。 */
export const PROJ_FLAT = new Set(['PROJ_BOLT', 'PROJ_HELEPOLIS', 'PROJ_SHOT', 'PROJ_FIRE', 'PROJ_CHAKRAM', 'PROJ_CHAKRAM_ELITE', 'FLAMETHROWER_FLAME', 'PROJ_MAGIC']);
/** 高抛弧线抛射物（炮弹/手榴弹/投石）：弧高翻倍（投石式高抛）。 */
export const PROJ_HIGH_ARC = new Set(['PROJ_BALL', 'PROJ_BOMBARD_BALL', 'PROJ_MANGONEL', 'PROJ_ROCK', 'PROJ_GRENADE']);
/** DE projectile_arc 实值；高丽战车弹丸 373 = 0.05。 */
export const PROJ_ARC_RATIO: Record<string, number> = {
    // 🔴 [2026-09-12 主人「要和 DE 一致」] 全表按 DE 本体 dat **实测**的 projectile_arc 重填
    //    （抽取脚本 scratch/de_proj_arc5.py：type_50.projectile_unit_id → 弹丸 unit.projectile.projectile_arc）。
    //    DE 真值要点：**箭/弩/掷矛是负数（≈−0.03~−0.08＝几乎平射、微下坠）**，只有投石/巨投/火箭车才是大抛物线。
    PROJ_WAR_WAGON: 0.05,      // DE 高丽战车弹丸 0.05 ✓（原值就对）
    PROJ_HELEPOLIS: 0.01,      // DE 攻城塔弹丸 0.01 ✓（原值就对）
    PROJ_GUNPOWDER: 0.05,      // DE Projectile Gunpowder (Primary) 0.05 ✓（原值就对）
    PROJ_FIRE_LANCER: 0.55,    // 🔴 DE Projectile Rocket Cart = **0.55**（原写 0.05，差 11 倍 ✗ 已改正）
    PROJ_HUSSITE_WAGON: 0.05,  // DE 0.05 ✓
    /* 🔴 [2026-09-17 主人报障「手推炮的炮弹在空中的轨迹会飘」→「请全部修复」] 0.04 → 0.15。
     * 病根是**参数与设计意图自相矛盾**：本弹丸被列在 PROJ_HIGH_ARC 里（注释写着「炮弹/手榴弹/投石：
     * 高抛弧线」），实际弧度却只有 0.04 —— 比火枪弹的 0.05 还平，同集合的手榴弹 0.4、投石默认 0.5、
     * 火箭车 0.55，它比它们平十倍以上。
     * 0.04 的来历见原注释：「正数 0.04，**消除原 -0.05 钻地下坠**」——只是把负数翻成正数免得钻地，
     * 顺手取的极小正数，不是 DE 真值，于是曲射炮打出了平射弹道。
     *
     * 实算（弧高 = min(距离×系数, 160)，峰值 = 4×弧高×0.25 = 弧高）：
     *   改前 0.04：满射程 480px → 弧高 19px；最小射程 200px → 8px。弹速 680px/s，
     *              等于一颗球花 0.29~0.71 秒、几乎走直线平移过去 —— 这就是「飘」。
     *   改后 0.15：满射程 480px → 72px；最小射程 200px → 30px。抛得起来、砸得下去。
     *
     * ⚠️ 0.15 是我定的起步值，不是 DE 真值（Projectile Bombard Cannon id368 的 projectile_arc
     *    手上没有，按铁律不编）。取值依据只有「比火枪 0.05 高、比投石 0.5 低」这个区间常识。
     *    嫌不够高就往 0.2~0.3 调，嫌太夸张就回 0.1；本行同时管 houfnice 手推榴弹炮。
     * ⚠️ 另三条假设已实测排除，别再往那边查：地形抬升逐帧查询（相邻跳变仅 2.8px，平滑）、
     *    飞行时长随机（本弹丸走 PROJ_SPEED_PX 恒定速度分支，不加随机）、
     *    素材帧质心漂移（30 帧质心跨度 X 0.39px / Y 0.13px）。 */
    PROJ_BOMBARD_BALL: 0.15,
    PROJ_GRENADE: 0.4,         // 与投石同类（DE 未单独抽到掷弹弹丸，保留 0.4）
    // ── [2026-09-14 主人定] 按初速分三档：**弩最直 < 标枪 < 弓**（弓走默认 0.3，不写在表里）──
    //    判据是物理而非 DE 数值：弩初速最高、弹道最平；标枪人力投掷但投距近；弓居中。
    //    实算峰值（弧高 = min(射程×系数, 100)，峰值 = 4×弧高×0.25）：
    //      弩兵 280 → 25px ｜ 热那亚弩手 320 → 29px ｜ 标枪 150 → 27px ｜ 弓兵 160 → 48px
    PROJ_CROSSBOW: 0.09,       // 弩兵（弩/诸葛弩/热那亚弩/腹弩）：初速最高，弹道最平
    PROJ_SPEAR: 0.18,          // 标枪/投矛：比弓箭直，仍看得出抛投
    PROJ_SPEAR_SMALL: 0.18,    // 小标枪（战车投矛）同档
    // ── [2026-09-12 新增] 平射弹按 DE 的负 arc ──
    // 🔴 [2026-09-14 主人定]「看看战略地图上军团的射箭弧度（哪个是好的）」——**以战略地图那套为准**。
    //    战略地图 ProjectileRenderer 的公式与这里**逐字相同**：arcHeight = min(dist × 0.3, 100)，
    //    visualZ = 4 × arcHeight × p × (1−p)；区别只在系数恒为 **0.3**，且永不取负。
    //    09-12 那次「照 DE dat 实值重填」把弓/弩箭填成 −0.06，而本渲染器 y = groundY − lift − arc，
    //    **负 arc = 弹道沉到地面以下**，实算中点低于地面约 9.6px（士兵才 40px 高）→ 箭一路穿地。
    //    现把这两项**整个删除**，回落到默认 0.3：弓箭 / 弩箭（弩兵与弓兵共用 PROJ_ARROW）/ 标枪
    //    三者与战略地图一模一样。⚠️ DE 的 projectile_arc 与本渲染器的屏幕弧高不是一个语义，别再照搬数值。
    // ── 投石族按 DE 细分（原先统一走"高抛翻倍 0.5"✗）──
    PROJ_MANGONEL: 0.40,       // DE Projectile Mangonel (Primary) = **0.40**
    PROJ_ROCK: 0.65,           // DE Projectile Trebuchet = **0.65**（巨型投石车，抛物线最高）
    PROJ_BALL: 0.40,           // 攻城炮石弹（按投石车同档）
};
/** 具有火药发射炮口焰/枪口焰的火器单位。 */
/**
 * 【无攻击动画的兵种】—— **由数据生成，别手改**：`node scratch/build_no_attack_anim.mjs` 重新生成后整段替换。
 *
 * 判据 = 素材目录里 `attack_N.png` 与 `idle_N.png` **字节相同**（扫 339 个目录，命中 7 个）。
 * 根因不是抽取漏了，是 AoE2 DE 本身没画：dat 铁证 —— 高丽战车 `WarWagon (Attack)` 图 id 7233 与
 * `WarWagon (Idle)` 图 id 7239 的 file_name 都是 `u_cav_warwagon_idleA_x1`（精锐版 2480/2482 同理）。
 *
 * 🔴 **别改回运行时用 URL 比较**（我 2026-08-18 第一版就栽在这，判定恒 false、补救分支一次没进过）：
 *    抽取时同一份源图被写成了**两个不同文件名**（attack_*.png / idle_*.png），
 *    `atkUrls.join('|') === IDLE.join('|')` 永远不成立。
 *    「DE 里攻击图 = 待命图」指的是**同一个源文件**，不是同一个 URL。
 * 🔴 也别改成运行时逐像素比：那要 getImageData 读整条帧带（战车 5940×116），
 *    而 13 开场卡 12.8 秒的旧账正是 getImageData 造成的。离线生成一次，运行时零成本。
 */
export const NO_ATTACK_ANIM = new Set([
    'elite_hussite_wagon',       // ELITEHUSSITEWAGON
    'elite_war_wagon',           // ELITEWARWAGON
    'flaming_camel',             // FLAMINGCAMEL（自爆兵，走 SUICIDE_TYPES 爆炸，不进放箭分支）
    'hussite_wagon',             // HUSSITEWAGON
    'petard',                    // PETARD（同上）
    'war_chariot_ranged',        // WARCHARIOT
    'war_wagon',                 // WARWAGON
    'hero_zhugeliang',
    'hero_belaiv',
    'hero_shahking',
    'hero_jayanegara',
    'hero_bucephalus',
]);

/** 无攻击动画的车辆开火时的尘烟配色（素色木屑/尘土，区别于火器的橙黄炮口焰） */
export const SHOT_DUST_COLORS = ['#D8CDB8', '#B9A98C', '#8C7F66', '#EDE6D6'] as const;

/**
 * 🔴 [2026-10-18 主人定] 全部 9 位非攻击性英雄统一归入简单魔法系形态（CASTER_TYPES）：
 *   · 诸葛亮（谋士）、雅德维加／塔玛尔（女王）、塔克修士／伊玛目／昌德·菩达一（僧侣／诗人）、贝拉四世／沙阿王／贾亚纳加拉（无武器国王）
 *   · 投射物 = `PROJ_MAGIC`（简洁干净的微光法球 + 短流光尾迹，不再使用粗大杂乱的喷火特效）
 *   · 施法微光 = `GREEK_FIRE_COLORS`（已改为清爽的青白/淡金奥术微光）
 */
export const CASTER_TYPES = new Set([
    'hero_zhugeliang', 'hero_jadwiga', 'hero_tamar',
    'hero_friartuck', 'hero_imam', 'hero_chandbardai',
    'hero_belaiv', 'hero_shahking', 'hero_jayanegara',
]);
/** 魔法英雄施法微光配色（清爽青白与淡金星光，替代原杂乱火焰色） */
export const GREEK_FIRE_COLORS = ['#E8F8FF', '#7CE8FF', '#FFE699', '#FFFFFF'] as const;
export const FIREARM_TYPES = new Set([
    'hussite_wagon', 'elite_hussite_wagon',   // 胡斯火铳车（2026-08-18）
    'bombard_cannon', 'houfnice', 'hand_cannoneer',
    'janissary', 'elite_janissary', 'royal_janissary',
    'conquistador', 'elite_conquistador', 'organ_gun', 'elite_organ_gun',
]);
/** 抛射物基准朝向偏移（素材竖向朝上 vs 横向朝东）：火枪弹竖向，旋转需 +90°。 */
export const PROJ_ANGLE_OFFSET: Record<string, number> = {
    PROJ_SHOT: Math.PI / 2,
    PROJ_GUNPOWDER: Math.PI / 2,
    PROJ_FIRE: Math.PI / 4,    // 猛火油柜喷火：素材等轴测斜 45°，补偿 π/4 使火舌正向水平喷射
    FLAMETHROWER_FLAME: Math.PI / 4,   // 希腊火：同一套火焰素材，同样斜 45°
};
/** 连弩/火箭车连发箭数（AoE2 wiki：诸葛弩 3/5 支；风琴炮 5 弹；火箭车 5 支；其余远程每轮 1 支）。 */
export const PROJ_VOLLEY: Record<string, number> = {
    chukonu: 3,
    elite_chukonu: 5,
    // 🔴 [2026-09-17 主人定] 先秦战车配精锐连弩的武器特效 → 连发支数照抄 elite_chukonu 的 5。
    //    只是视觉连发：伤害仍按单发算（乘弹数只对 ORGAN_GUN_TYPES 生效，见 projectileDamageCount）。
    war_chariot_ranged: 5,
    organ_gun: 5,        // 风琴炮一次齐射 5 弹（AoE2 DE）
    elite_organ_gun: 6,
    rocket_cart: 5,      // 火箭车/一窝蜂一次齐射 5 支火箭
    heavy_rocket_cart: 5,
};
export const ORGAN_GUN_TYPES = new Set(['organ_gun', 'elite_organ_gun']);
/** DE 当前数据：风琴炮 accuracy_dispersion = 0.6 格；项目 1 格 = 40px。 */
export const ORGAN_GUN_DISPERSION_PX = 0.6 * 40;
/** 连发每支箭的发射间隔（秒），诸葛弩 3/5 支依次射出。 */
export const PROJ_VOLLEY_DELAY = 0.08;
/** 抛射物飞行基准时长（秒）：火枪弹丸极速穿梭（0.22s），重弩矢沉重平射（0.49s，DE 速度 6.0 vs 普通箭 7.0/0.42s），重炮/石弹沉重高抛（0.65s），手榴弹（0.55s），其余标准羽箭（0.42s）。 */
export const PROJ_DUR: Record<string, number> = {
    PROJ_SHOT: 0.22,
    PROJ_BOLT: 0.49,
    PROJ_BALL: 0.65,
    PROJ_MANGONEL: 0.65,
    PROJ_ROCK: 0.65,
    PROJ_GRENADE: 0.55,
};
/** DE 弹丸速度换算到战斗层：1 DE 格 = 40px；火枪弹丸适度调快 (750px/s)。 */
export const PROJ_SPEED_PX: Record<string, number> = {
    // 🔴 [2026-08-26 按 DE dat 实测补齐] 弩矢原本没进本表 → 走 PROJ_DUR 的**固定 0.49s**，
    //    等于「不论远近都飞同样久」，而 DE 弹丸是**恒定速度**、飞行时间随距离变。
    //    dat 实测（empires2_x2_p1.dat → type_50.projectile_unit_id → 弹丸单位 speed）：
    //      蝎弩 SCBAL→367 speed 6.0 arc 0.0 ／ 弩炮战象 ELEBALI→1167 speed 6.0 arc 0.0
    //      高丽战车 WAGON→373 speed 6.0 arc 0.05 ／ 攻城塔 SIEGTWR→2445 speed **7.0** arc 0.01
    //    🔴 攻城塔是 7.0 不是 6.0 —— 它和弩炮共用 p_bolt 素材，但弹速不同，
    //    所以单列 PROJ_HELEPOLIS，否则给 PROJ_BOLT 一加速度就把攻城塔拖慢了。
    //    ⚠️ 但**不能直接套 DE 的格/秒**：项目的箭矢整体比 DE 快 —— 普通箭 ARROW_DUR 0.42s
    //    飞 160px = 381px/s，而 DE 普通箭只有 7.0 格/秒 = 280px/s（快约 36%，是既定的
    //    快节奏演出尺度）。照搬 DE 的 6.0 会让弩箭比普通箭还慢 37%，射满 5 格要 0.83s，
    //    实机看就是拖沓（主人 2026-08-26：「弩箭的速度太慢了」）。
    //    所以按项目尺度整体提速，只保留 DE 的**相对快慢**（攻城塔 7.0 > 弩矢 6.0）：
    //      弩矢   14 格/秒 = 560px/s → 弩炮战象(200px) 0.36s、蝎弩/床弩(280px) 0.50s
    //      攻城塔 16 格/秒 = 640px/s → 塔上弩机(240px) 0.375s，仍比弩矢快 1/6，与 DE 同序
    PROJ_BOLT: 14 * 40,
    PROJ_HELEPOLIS: 16 * 40,
    PROJ_WAR_WAGON: 14 * 40,
    PROJ_SHOT: 7.5 * 40,
    PROJ_MAGIC: 12 * 40,
    // 火枪弹必须近乎瞬达：旧值 300px/s，满射程 280px 要飞约 0.93s，视觉像弹丸飘行。
    // 提至 1200px/s 后满射程约 0.23s，与上方 PROJ_DUR 的 0.22s 演出尺度一致。
    PROJ_GUNPOWDER: 30 * 40,
    PROJ_FIRE_LANCER: 7.5 * 40,
    PROJ_HUSSITE_WAGON: 7 * 40,
    // 手推攻城火炮/榴弹炮炮弹（DE: BCANN id36 / HOUFNICE id1709 → Projectile Bombard Cannon id368）。
    // 🔴 [2026-09-15 核对 DE 本体 dat 后改准] 原注释两个数字都是错的：写「满射程 560px 要飞 3.5s」，
    //    但 560 是 bombard_cannon 的**视野**（SIGHT_MAP），射程是 480px = 12 格；3.5s 则是
    //    DE 里 HLORR(14 格) 的时间，不是手推炮的。验算脚本 scratch/_de_bombard_speed.py。
    //    DE 实测：射程 12 格 / 最小射程 5 格 / 装填 6.5s / 弹速 4.0 格·秒 → 满射程飞 3.00s。
    //    本项目射程 480px、最小射程 200px、装填 6.5s。
    //    🔴 [2026-09-16 主人定] 手推炮弹速提速至 680 px/s（17 格/秒），满射程飞行时间压缩至约 0.7 秒。
    PROJ_BOMBARD_BALL: 17 * 40,
    PROJ_GRENADE: 4.5 * 40,
};
/** DE 弹丸素材逐帧时长（秒）；未列出的单帧/定向素材不播放序列。 */
export const PROJ_FRAME_DUR: Record<string, number> = {
    PROJ_BALL: 0.0155,
    PROJ_BOMBARD_BALL: 0.0155,
    PROJ_MANGONEL: 0.0155,
    PROJ_ROCK: 0.0155,
    PROJ_GRENADE: 0.0155,
    PROJ_HUSSITE_WAGON: 1 / 60,
};
/** 炸药自爆单位（DE 爆破兵/火焰骆驼：冲入敌阵一旦近身引爆，造成毁灭性 AoE 伤害并自爆牺牲）。 */
export const SUICIDE_TYPES = new Set(['petard', 'flaming_camel']);
/**
 * 🔴 [2026-10-13 全面审计抓出·自爆对建筑] 自爆伤害打到**建筑**时的倍率。
 *
 * 🔴 取 **1**（＝与对兵同一口径，不额外放大）。
 *   曾想取 8 放大「毁灭性」，但算了一遍发现不对：自爆的 bonus 本来就是**对建筑的点名值**
 *   （petard `11:1200`、flaming_camel `11:800`），`mult` 只为对齐 `dt` 量纲而设（普通攻击链里它是攻速量级）。
 *   实测（petard，甲照 `WALL_GATE_STATS`）：
 *     · 对石墙：25 + 1200 − 8  = 1197 /轮 ⇒ 1080 血 **1.20 轮**破（外围石墙）；
 *     · 对石城门：25 + 1200 − 6 = 1199 /轮 ⇒ 1650 血 **2.76 轮**破（石城门）。
 *   即：**自爆兵对「墙」一炸一段、对「城门」要两三炸**，正合 DE 里 petard「破墙开路、不是万能钥匙」的定位。
 *   取 8 会让墙与门都被**单发秒破**，那是新型攻城核武、不是爆破兵 —— 故不取。
 */
export const SUICIDE_BLD_MULT = 1;
/** 具有最小射程盲区的远程/器械单位（原版 DE：投石车 min range 3 格、巨投 min range 4 格；1 格 = 40px，与 rng 同换算）。
 *  🔴 [2026-09-18 主人定·攻城武器无法近身攻击] 远程重型攻城武器严禁近身肉搏，贴脸时伤害归零。 */
export const MIN_RANGE_TYPES: Record<string, number> = {
    // 投石车系列（DE 最小射程 3 格 = 120px）
    mangonel: 120,
    onager: 120,
    siege_onager: 120,
    antiquity_mangonel: 120,
    antiquity_onager: 120,
    antiquity_siege_onager: 120,

    // 投石机系列（DE 最小射程 4 格 = 160px）
    traction_trebuchet: 160,
    mounted_trebuchet: 160,
    trebuchet: 160,

    // 火炮/榴弹炮系列（DE 最小射程 5 格 = 200px）
    bombard_cannon: 200,
    houfnice: 200,

    // 火箭车系列（远程齐射器械，最小射程 3 格 = 120px）
    rocket_cart: 120,
    heavy_rocket_cart: 120,

    // 弩炮类器械（车身近身盲区 1 格 = 40px，近身贴脸无法开火）
    scorpion: 40,
    heavy_scorpion: 40,
    antiquity_scorpion: 40,
    antiquity_heavy_scorpion: 40,
    siege_ballista: 40,

    // 风琴炮/掷弹兵（DE 最小射程 1 格 = 40px）
    organ_gun: 40,
    elite_organ_gun: 40,
    grenadier: 40,
};
/** 火矛手（DE 充能喷火兵）：进战先喷 3 发低精度短程火枪弹，30 秒充能（AoE2 DE update 141935）。 */
export const FIRE_LANCER_TYPES = new Set(['fire_lancer', 'elite_fire_lancer']);
export const FIRE_LANCER_VOLLEY = 3;
export const FIRE_LANCER_CHARGE = 30;

/** 穿墙（攀爬城垣/潜行渗透）特种兵白名单：
 *  🔴 [2026-10-13 主人令] 忍者 + 马来爪刀勇士 + 凯尔特靛蓝突袭者 + 图皮战棍勇士（各含普通与精锐） */
export const WALL_PASS_TYPES = new Set([
    'ninja',
    'karambit_warrior', 'karambit_warrior_elite',
    'woad_raider', 'elite_woad_raider',
    'ibirapema_warrior', 'elite_ibirapema_warrior',
]);

// ── DE 攻击特效（2026-08-19 替换手绘火花粒子 explode/muzzleFlash/fireLanceVolley）──
// 素材已瘦身到 public/SUCAI_FX/（抽帧 8~10 + 裁透明边 + 16 向降 8 向，7GB→71MB）。
// 单组（爆炸）= 1 张 fly_0.png；多向（炮口焰）= dir00..dir07 各 1 张，各方向 box/anchor 独立。
export const FX_CFG: Record<string, { path: string; dirs: number }> = {
    FX_EXPLOSION: { path: 'IMPACT_EXPLOSIONS/IMPACT_EXPLOSION', dirs: 1 },
    FX_PETARD: { path: 'IMPACT_PETARD', dirs: 1 },
    FX_MUZZLE_BOMBARD: { path: 'MUZZLE_BOMBARDCANNON', dirs: 8 },
    FX_MUZZLE_ORGAN: { path: 'MUZZLE_ORGANGUN', dirs: 8 },
    FX_MUZZLE_HAND: { path: 'MUZZLE_HANDCANNON', dirs: 8 },
    FX_MUZZLE_CONQ: { path: 'MUZZLE_CONQUISTADOR', dirs: 8 },
    FX_MUZZLE_FIRELANCE: { path: 'MUZZLE_FIRE_LANCER', dirs: 8 },
    // 破墙尘土（DE IMPACT_DUST，8 向）
    FX_WALL_DUST: { path: 'IMPACT_DUST', dirs: 8 },
    // 投石/巨石落地碎石烟尘（DE IMPACT_TREBUCHET_SMOKE，1 向）
    FX_TREBUCHET_SMOKE: { path: 'IMPACT_TREBUCHET_SMOKE', dirs: 1 },
    // DE 建筑受损三档动态火焰（damage_graphics：75%/50%/25% 血量阈值）
    FX_FIRE_SMALL: { path: 'FIRE/FIRE_SMALL', dirs: 1 },
    FX_FIRE_SMALL_R: { path: 'FIRE/FIRE_SMALL_RIGHT', dirs: 1 },
    FX_FIRE_WIN_S: { path: 'FIRE/FIRE_WINDOW_SMALL', dirs: 1 },
    FX_FIRE_MEDIUM: { path: 'FIRE/FIRE_MEDIUM', dirs: 1 },
    FX_FIRE_MEDIUM_R: { path: 'FIRE/FIRE_MEDIUM_RIGHT', dirs: 1 },
    FX_FIRE_ROOF: { path: 'FIRE/FIRE_ROOFEDGE', dirs: 1 },
    FX_FIRE_LARGE: { path: 'FIRE/FIRE_LARGE', dirs: 1 },
    FX_FIRE_LARGE_R: { path: 'FIRE/FIRE_LARGE_RIGHT', dirs: 1 },
};
/**
 * 特效缩放（DE 原生像素 → 13 的 UNIT_PX=50 尺度）。
 * 🔴 定这组数只有一把尺子：**画出来的直径相对兵高（50px）是几倍**——瘦身后各特效的帧框
 *    大小差了 4 倍以上（炮口焰裁到 79~108px，自爆焰还有 368px），同一个 scale 值在不同
 *    特效上完全不是一回事，照抄会出事。括号里是按裁后帧框实算的成品尺寸。
 *    2026-08-19 首版曾按「看着差不多」给值，实算后 FX_PETARD 是 442px = 8.8 倍兵高
 *    （屏幕 1/4 高、埋掉二十来个兵的演出），已按下表重定。
 * 仍是初值：真机看一局再微调，但量级已经对了。
 */
export const FX_SCALE: Record<string, number> = {
    // 🔴 [2026-10-11 主人令「所有，全部，都是1.0，一个也不能剩下」] 原 0.30~0.80 的逐项缩放**全部改 1.0**：
    //    特效素材与建筑/兵模同一把尺子（DE 原生像素），不再逐项压小。
    FX_EXPLOSION: 1.0, FX_PETARD: 1.0, FX_MUZZLE_BOMBARD: 1.0, FX_MUZZLE_ORGAN: 1.0,
    FX_MUZZLE_HAND: 1.0, FX_MUZZLE_CONQ: 1.0, FX_MUZZLE_FIRELANCE: 1.0,
    FX_WALL_DUST: 1.0, FX_TREBUCHET_SMOKE: 1.0,
    FX_FIRE_SMALL: 1.0, FX_FIRE_SMALL_R: 1.0, FX_FIRE_WIN_S: 1.0,
    FX_FIRE_MEDIUM: 1.0, FX_FIRE_MEDIUM_R: 1.0, FX_FIRE_ROOF: 1.0,
    FX_FIRE_LARGE: 1.0, FX_FIRE_LARGE_R: 1.0,
};
/** 特效播放总时长（秒）：炮口焰一闪而过，爆炸稍久。 */
export const FX_DUR: Record<string, number> = {
    FX_EXPLOSION: 0.45, FX_PETARD: 0.4,
    FX_MUZZLE_BOMBARD: 0.18, FX_MUZZLE_ORGAN: 0.18, FX_MUZZLE_HAND: 0.15,
    FX_MUZZLE_CONQ: 0.15, FX_MUZZLE_FIRELANCE: 0.25,
    FX_WALL_DUST: 0.5,
    FX_TREBUCHET_SMOKE: 0.45,
};
/** 火器兵种 → 炮口焰特效 key（按口径/枪型区分）。 */
export const FIREARM_MUZZLE: Record<string, string> = {
    bombard_cannon: 'FX_MUZZLE_BOMBARD', houfnice: 'FX_MUZZLE_BOMBARD',
    organ_gun: 'FX_MUZZLE_ORGAN', elite_organ_gun: 'FX_MUZZLE_ORGAN',
    hand_cannoneer: 'FX_MUZZLE_HAND', janissary: 'FX_MUZZLE_HAND',
    elite_janissary: 'FX_MUZZLE_HAND', royal_janissary: 'FX_MUZZLE_HAND',
    conquistador: 'FX_MUZZLE_CONQ', elite_conquistador: 'FX_MUZZLE_CONQ',
    hussite_wagon: 'FX_MUZZLE_HAND', elite_hussite_wagon: 'FX_MUZZLE_HAND',
};

// 坐标取自本机 DE empires2_x2_p1.dat 各建筑 damage_graphics.deltas (相对于建筑锚点 s.x, drawY 的 x1 像素偏移)
export const DE_FIRE_DELTAS: Record<string, ReadonlyArray<ReadonlyArray< readonly [string, number, number]>>> = {
    HOUSE: [
        [['FX_FIRE_SMALL', -50, -7], ['FX_FIRE_SMALL', -35, -64], ['FX_FIRE_SMALL', -12, -80], ['FX_FIRE_SMALL', 63, -18], ['FX_FIRE_SMALL', -5, 29]],
        [['FX_FIRE_MEDIUM', -52, -3], ['FX_FIRE_MEDIUM', -4, 15], ['FX_FIRE_MEDIUM', -34, -64], ['FX_FIRE_MEDIUM', -12, -76], ['FX_FIRE_MEDIUM', 66, -20], ['FX_FIRE_MEDIUM', 23, -45]],
        [['FX_FIRE_LARGE', -2, 14], ['FX_FIRE_LARGE', 65, -33], ['FX_FIRE_LARGE', -49, -5], ['FX_FIRE_LARGE', -9, -85], ['FX_FIRE_MEDIUM', -36, -62], ['FX_FIRE_MEDIUM', 17, -73]],
    ],
    MILL: [
        [['FX_FIRE_SMALL', -91, -20], ['FX_FIRE_SMALL', 2, 24], ['FX_FIRE_SMALL', 86, -65], ['FX_FIRE_SMALL', 53, -137], ['FX_FIRE_SMALL', 8, -152], ['FX_FIRE_SMALL', 35, -39]],
        [['FX_FIRE_MEDIUM', -88, -17], ['FX_FIRE_MEDIUM', 2, 23], ['FX_FIRE_MEDIUM', 87, -65], ['FX_FIRE_MEDIUM', 49, -137], ['FX_FIRE_MEDIUM', 1, -150], ['FX_FIRE_MEDIUM', 26, -31], ['FX_FIRE_LARGE', 34, -7]],
        [['FX_FIRE_LARGE', 33, -3], ['FX_FIRE_LARGE', -93, -17], ['FX_FIRE_LARGE', 8, -153], ['FX_FIRE_MEDIUM', 36, -140], ['FX_FIRE_MEDIUM', 69, -73], ['FX_FIRE_MEDIUM', 91, -61], ['FX_FIRE_MEDIUM', -25, 18], ['FX_FIRE_MEDIUM', -64, 0], ['FX_FIRE_MEDIUM', -92, -66]],
    ],
    BARRACKS: [
        [['FX_FIRE_SMALL', -36, -111], ['FX_FIRE_SMALL', 113, -59], ['FX_FIRE_SMALL', 34, -80], ['FX_FIRE_SMALL', 17, 0], ['FX_FIRE_SMALL', 47, -15], ['FX_FIRE_SMALL', -117, -59], ['FX_FIRE_SMALL', -23, -173]],
        [['FX_FIRE_MEDIUM', -36, -104], ['FX_FIRE_MEDIUM', 37, -75], ['FX_FIRE_MEDIUM', 94, -55], ['FX_FIRE_MEDIUM', -15, -172], ['FX_FIRE_MEDIUM', 16, 3], ['FX_FIRE_MEDIUM', -118, -52], ['FX_FIRE_MEDIUM_R', -16, -30], ['FX_FIRE_MEDIUM_R', 124, -75], ['FX_FIRE_MEDIUM_R', 1, 52]],
        [['FX_FIRE_LARGE_R', 0, 53], ['FX_FIRE_LARGE_R', 18, -35], ['FX_FIRE_LARGE_R', -35, -104], ['FX_FIRE_LARGE_R', 72, -53], ['FX_FIRE_LARGE_R', 118, -62], ['FX_FIRE_LARGE_R', -116, -58], ['FX_FIRE_MEDIUM_R', 37, -77], ['FX_FIRE_MEDIUM_R', -22, -173], ['FX_FIRE_MEDIUM_R', 31, -6], ['FX_FIRE_MEDIUM_R', 48, 35], ['FX_FIRE_MEDIUM_R', -37, 46]],
    ],
    ARCHERY_RANGE: [
        [['FX_FIRE_SMALL_R', -130, -8], ['FX_FIRE_SMALL_R', -72, -87], ['FX_FIRE_SMALL_R', -32, 38], ['FX_FIRE_SMALL_R', -4, 53], ['FX_FIRE_SMALL_R', 117, 0], ['FX_FIRE_SMALL_R', 9, -36], ['FX_FIRE_SMALL_R', 20, -106], ['FX_FIRE_SMALL_R', 31, -143]],
        [['FX_FIRE_MEDIUM', -130, -13], ['FX_FIRE_MEDIUM', -35, 34], ['FX_FIRE_MEDIUM', 118, -3], ['FX_FIRE_MEDIUM', 11, -32], ['FX_FIRE_MEDIUM', -69, -89], ['FX_FIRE_MEDIUM', 24, -105], ['FX_FIRE_MEDIUM', 32, -155], ['FX_FIRE_MEDIUM', -26, -118], ['FX_FIRE_MEDIUM', 121, -54], ['FX_FIRE_LARGE_R', 44, -33]],
        [['FX_FIRE_LARGE_R', -1, 63], ['FX_FIRE_LARGE_R', -40, 38], ['FX_FIRE_LARGE_R', -129, -8], ['FX_FIRE_LARGE_R', -76, -94], ['FX_FIRE_LARGE_R', 126, -8], ['FX_FIRE_LARGE_R', 25, -105], ['FX_FIRE_MEDIUM_R', 46, -96], ['FX_FIRE_MEDIUM_R', -28, -25], ['FX_FIRE_MEDIUM_R', 18, -34], ['FX_FIRE_MEDIUM_R', -16, -121], ['FX_FIRE_MEDIUM_R', 75, -16]],
    ],
    STABLE: [
        [['FX_FIRE_SMALL', -117, -22], ['FX_FIRE_SMALL', -66, 31], ['FX_FIRE_SMALL', 60, 28], ['FX_FIRE_SMALL', 128, -23], ['FX_FIRE_SMALL', 18, -23], ['FX_FIRE_SMALL', 58, -73]],
        [['FX_FIRE_MEDIUM', -118, -21], ['FX_FIRE_MEDIUM', -56, 30], ['FX_FIRE_MEDIUM', -7, -39], ['FX_FIRE_MEDIUM', 70, 9], ['FX_FIRE_MEDIUM', 44, -57], ['FX_FIRE_MEDIUM', 124, -18], ['FX_FIRE_MEDIUM', -72, -90], ['FX_FIRE_LARGE', -64, -10], ['FX_FIRE_LARGE', 9, 41]],
        [['FX_FIRE_LARGE', -113, -44], ['FX_FIRE_LARGE', -81, -84], ['FX_FIRE_LARGE', -10, 20], ['FX_FIRE_LARGE', 61, 26], ['FX_FIRE_LARGE', 60, -74], ['FX_FIRE_LARGE', 132, -24], ['FX_FIRE_MEDIUM', -56, -7], ['FX_FIRE_MEDIUM', -63, -92], ['FX_FIRE_MEDIUM', -71, 20], ['FX_FIRE_MEDIUM', 79, -22], ['FX_FIRE_MEDIUM', 115, -36]],
    ],
    BLACKSMITH: [
        [['FX_FIRE_SMALL_R', -61, -82], ['FX_FIRE_SMALL_R', 75, -14], ['FX_FIRE_SMALL_R', 91, -89], ['FX_FIRE_SMALL_R', 119, -12], ['FX_FIRE_SMALL_R', -28, -24], ['FX_FIRE_SMALL_R', 34, -32]],
        [['FX_FIRE_MEDIUM_R', -101, -19], ['FX_FIRE_MEDIUM_R', -80, 11], ['FX_FIRE_MEDIUM_R', -55, -88], ['FX_FIRE_MEDIUM_R', 2, -47], ['FX_FIRE_MEDIUM_R', -29, -28], ['FX_FIRE_MEDIUM_R', 34, -29], ['FX_FIRE_MEDIUM_R', 93, -88], ['FX_FIRE_MEDIUM_R', 118, -29], ['FX_FIRE_LARGE', 72, -14]],
        [['FX_FIRE_LARGE', -92, -10], ['FX_FIRE_LARGE', -61, -77], ['FX_FIRE_LARGE', -30, -30], ['FX_FIRE_LARGE', 34, -29], ['FX_FIRE_LARGE', 78, 0], ['FX_FIRE_LARGE', 85, -88], ['FX_FIRE_MEDIUM', 56, -108], ['FX_FIRE_MEDIUM', 90, -64], ['FX_FIRE_MEDIUM', 112, -83], ['FX_FIRE_MEDIUM', -54, -39], ['FX_FIRE_MEDIUM', 119, -18]],
    ],
    MONASTERY: [
        [['FX_FIRE_SMALL', -92, -119], ['FX_FIRE_SMALL', -14, 37], ['FX_FIRE_SMALL', -20, -24], ['FX_FIRE_SMALL', 90, 1], ['FX_FIRE_SMALL', -52, -99]],
        [['FX_FIRE_MEDIUM', 42, 33], ['FX_FIRE_MEDIUM', -11, 35], ['FX_FIRE_MEDIUM', -88, -120], ['FX_FIRE_MEDIUM', -95, -191], ['FX_FIRE_MEDIUM', 78, 0], ['FX_FIRE_MEDIUM', -9, -21], ['FX_FIRE_MEDIUM', -70, -30], ['FX_FIRE_MEDIUM_R', 118, -11], ['FX_FIRE_MEDIUM', -52, -99]],
        [['FX_FIRE_LARGE', 100, -4], ['FX_FIRE_LARGE_R', -88, -121], ['FX_FIRE_LARGE', 30, -66], ['FX_FIRE_LARGE', 4, -150], ['FX_FIRE_MEDIUM_R', -9, 35], ['FX_FIRE_MEDIUM_R', -32, -87], ['FX_FIRE_MEDIUM_R', -21, -13], ['FX_FIRE_MEDIUM_R', 52, 23], ['FX_FIRE_MEDIUM_R', -57, -132], ['FX_FIRE_MEDIUM', -60, -195], ['FX_FIRE_MEDIUM', -76, 20]],
    ],
    TOWN_CENTER: [
        [['FX_FIRE_SMALL', -140, 15], ['FX_FIRE_SMALL', 35, -161], ['FX_FIRE_SMALL', 39, -69], ['FX_FIRE_SMALL', 99, 37], ['FX_FIRE_SMALL', 151, -60], ['FX_FIRE_SMALL', -48, -29], ['FX_FIRE_SMALL', 184, -4]],
        [['FX_FIRE_MEDIUM', -141, 16], ['FX_FIRE_MEDIUM', -176, 1], ['FX_FIRE_MEDIUM', -59, -21], ['FX_FIRE_MEDIUM', 33, -67], ['FX_FIRE_MEDIUM', 40, -151], ['FX_FIRE_MEDIUM', 95, 35], ['FX_FIRE_MEDIUM', 185, 4], ['FX_FIRE_MEDIUM', 152, -62], ['FX_FIRE_LARGE', -4, -53]],
        [['FX_FIRE_LARGE', -172, -2], ['FX_FIRE_LARGE', 2, -46], ['FX_FIRE_LARGE', 3, -172], ['FX_FIRE_LARGE', 99, -10], ['FX_FIRE_LARGE', 154, -55], ['FX_FIRE_LARGE_R', 78, -89], ['FX_FIRE_LARGE_R', -44, -140], ['FX_FIRE_MEDIUM_R', -150, -58], ['FX_FIRE_MEDIUM_R', -19, -173], ['FX_FIRE_MEDIUM_R', 29, -61], ['FX_FIRE_MEDIUM_R', 61, -27], ['FX_FIRE_MEDIUM_R', -93, -9], ['FX_FIRE_MEDIUM_R', -71, -108]],
    ],
    MARKET: [
        [['FX_FIRE_SMALL', -140, -70], ['FX_FIRE_SMALL', -79, -67], ['FX_FIRE_SMALL', -41, -159], ['FX_FIRE_SMALL', 12, -140], ['FX_FIRE_SMALL', 33, -64], ['FX_FIRE_SMALL', 102, -40], ['FX_FIRE_SMALL', 135, 12], ['FX_FIRE_SMALL', 30, 66], ['FX_FIRE_SMALL', -67, 36]],
        [['FX_FIRE_MEDIUM', -84, -62], ['FX_FIRE_MEDIUM', -140, -67], ['FX_FIRE_MEDIUM', -70, 43], ['FX_FIRE_MEDIUM', 4, 22], ['FX_FIRE_MEDIUM', -35, -88], ['FX_FIRE_MEDIUM', -25, -167], ['FX_FIRE_MEDIUM', 67, -60], ['FX_FIRE_MEDIUM', 134, 9], ['FX_FIRE_LARGE_R', 39, -35], ['FX_FIRE_LARGE_R', -48, -38]],
        [['FX_FIRE_LARGE_R', -5, 67], ['FX_FIRE_LARGE_R', 41, -18], ['FX_FIRE_LARGE_R', -20, -18], ['FX_FIRE_LARGE_R', -76, 39], ['FX_FIRE_LARGE', -143, -59], ['FX_FIRE_LARGE', -101, -43], ['FX_FIRE_LARGE', 6, -168], ['FX_FIRE_LARGE', 28, -103], ['FX_FIRE_MEDIUM_R', 68, -70], ['FX_FIRE_MEDIUM_R', 141, -35], ['FX_FIRE_MEDIUM_R', -25, -172], ['FX_FIRE_MEDIUM_R', -129, -115]],
    ],
    SIEGE_WORKSHOP: [
        [['FX_FIRE_SMALL_R', -158, -22], ['FX_FIRE_SMALL_R', -118, -52], ['FX_FIRE_SMALL_R', -90, -94], ['FX_FIRE_SMALL_R', -90, 14], ['FX_FIRE_SMALL_R', 43, -63], ['FX_FIRE_SMALL_R', 23, -133], ['FX_FIRE_SMALL_R', 67, 39], ['FX_FIRE_SMALL_R', -37, 59], ['FX_FIRE_SMALL_R', 137, -14]],
        [['FX_FIRE_MEDIUM_R', -157, -22], ['FX_FIRE_MEDIUM_R', -118, -101], ['FX_FIRE_MEDIUM_R', -37, -119], ['FX_FIRE_MEDIUM_R', -36, 56], ['FX_FIRE_MEDIUM_R', -96, 11], ['FX_FIRE_MEDIUM_R', 145, -31], ['FX_FIRE_LARGE_R', 42, -60], ['FX_FIRE_LARGE_R', -53, -65], ['FX_FIRE_LARGE_R', 61, 36]],
        [['FX_FIRE_LARGE_R', -30, 60], ['FX_FIRE_LARGE_R', 67, 29], ['FX_FIRE_LARGE_R', -50, -63], ['FX_FIRE_LARGE', 135, -28], ['FX_FIRE_LARGE', -154, -19], ['FX_FIRE_MEDIUM', -135, -8], ['FX_FIRE_MEDIUM', -98, -101], ['FX_FIRE_MEDIUM', -141, -41], ['FX_FIRE_MEDIUM', 61, -15], ['FX_FIRE_MEDIUM', 120, -22], ['FX_FIRE_MEDIUM', 24, -130]],
    ],
    UNIVERSITY: [
        [['FX_FIRE_SMALL_R', -171, -10], ['FX_FIRE_SMALL_R', -97, -8], ['FX_FIRE_SMALL_R', -43, 26], ['FX_FIRE_SMALL_R', -100, -71], ['FX_FIRE_SMALL_R', 61, -159], ['FX_FIRE_SMALL_R', 171, -63], ['FX_FIRE_SMALL_R', 114, -65], ['FX_FIRE_SMALL_R', 35, -9], ['FX_FIRE_SMALL_R', 103, 29]],
        [['FX_FIRE_MEDIUM_R', -161, -14], ['FX_FIRE_MEDIUM_R', -96, -8], ['FX_FIRE_MEDIUM_R', -102, -73], ['FX_FIRE_MEDIUM_R', 35, -10], ['FX_FIRE_MEDIUM_R', 89, -90], ['FX_FIRE_MEDIUM_R', 59, -160], ['FX_FIRE_MEDIUM_R', 107, 25], ['FX_FIRE_MEDIUM_R', 170, -14], ['FX_FIRE_LARGE', -38, 56], ['FX_FIRE_LARGE', 16, -72]],
        [['FX_FIRE_LARGE', -45, 52], ['FX_FIRE_LARGE', 19, -66], ['FX_FIRE_LARGE', 176, -68], ['FX_FIRE_LARGE', -66, -14], ['FX_FIRE_LARGE', -152, 1], ['FX_FIRE_LARGE', -91, -84], ['FX_FIRE_LARGE', 64, -157], ['FX_FIRE_MEDIUM_R', -6, -103], ['FX_FIRE_MEDIUM_R', 115, -68], ['FX_FIRE_MEDIUM_R', -73, 40], ['FX_FIRE_MEDIUM_R', 34, -15], ['FX_FIRE_MEDIUM_R', 85, -99], ['FX_FIRE_MEDIUM_R', 139, 9]],
    ],
    TOWER: [
        [['FX_FIRE_SMALL', -16, 6], ['FX_FIRE_SMALL', -42, -128], ['FX_FIRE_SMALL', -16, -115], ['FX_FIRE_SMALL', 5, -185], ['FX_FIRE_SMALL', 50, -125]],
        [['FX_FIRE_MEDIUM', -14, 7], ['FX_FIRE_MEDIUM', -43, -128], ['FX_FIRE_MEDIUM', 9, -192], ['FX_FIRE_MEDIUM', 48, -127], ['FX_FIRE_MEDIUM', 37, -2], ['FX_FIRE_LARGE_R', 3, -122]],
        [['FX_FIRE_LARGE', -7, 4], ['FX_FIRE_LARGE_R', -28, -124], ['FX_FIRE_LARGE_R', 37, -131], ['FX_FIRE_MEDIUM_R', 14, -118], ['FX_FIRE_MEDIUM_R', 5, -187], ['FX_FIRE_MEDIUM_R', -28, -42]],
    ],
    OUTPOST: [
        [['FX_FIRE_SMALL_R', -27, -66], ['FX_FIRE_SMALL_R', 4, -1], ['FX_FIRE_SMALL_R', 27, -38], ['FX_FIRE_SMALL_R', 19, -73]],
        [['FX_FIRE_MEDIUM', 6, 0], ['FX_FIRE_MEDIUM', -28, -79], ['FX_FIRE_MEDIUM', 22, -70], ['FX_FIRE_MEDIUM', 25, -38], ['FX_FIRE_LARGE', -7, -80]],
        [['FX_FIRE_LARGE', 22, -75], ['FX_FIRE_LARGE', 11, -1], ['FX_FIRE_LARGE', -7, -74], ['FX_FIRE_MEDIUM', -23, -90], ['FX_FIRE_MEDIUM', 27, -33], ['FX_FIRE_MEDIUM', -27, -4]],
    ],
    CASTLE: [
        [['FX_FIRE_SMALL', 124, -92], ['FX_FIRE_SMALL', -43, -191], ['FX_FIRE_SMALL', 143, -230], ['FX_FIRE_SMALL', -135, -68], ['FX_FIRE_SMALL', 42, -82]],
        [['FX_FIRE_MEDIUM', -135, -65], ['FX_FIRE_MEDIUM', -43, -192], ['FX_FIRE_MEDIUM', 42, -80], ['FX_FIRE_MEDIUM', 144, -231], ['FX_FIRE_MEDIUM', 126, -95], ['FX_FIRE_SMALL', -53, -192], ['FX_FIRE_SMALL', -26, -9], ['FX_FIRE_SMALL_R', -8, -173], ['FX_FIRE_MEDIUM_R', -27, -183]],
        [['FX_FIRE_LARGE', -38, -191], ['FX_FIRE_LARGE_R', -16, -182], ['FX_FIRE_LARGE', 142, -235], ['FX_FIRE_LARGE_R', 132, -94], ['FX_FIRE_LARGE', -126, -64], ['FX_FIRE_LARGE', 53, -84], ['FX_FIRE_MEDIUM_R', 85, -98], ['FX_FIRE_MEDIUM_R', -148, -113], ['FX_FIRE_MEDIUM_R', -4, -172], ['FX_FIRE_MEDIUM', -60, -189], ['FX_FIRE_SMALL', 15, -160], ['FX_FIRE_SMALL_R', -54, -67], ['FX_FIRE_MEDIUM_R', -25, -10]],
    ],
    WONDER: [
        [['FX_FIRE_SMALL_R', -158, -235], ['FX_FIRE_SMALL_R', -99, -332], ['FX_FIRE_SMALL_R', 120, -164], ['FX_FIRE_SMALL_R', 42, -105], ['FX_FIRE_SMALL_R', 158, -68], ['FX_FIRE_SMALL_R', 170, 8], ['FX_FIRE_SMALL_R', -4, -41], ['FX_FIRE_SMALL_R', -151, -92], ['FX_FIRE_SMALL_R', -13, -302], ['FX_FIRE_SMALL_R', -106, -121]],
        [['FX_FIRE_MEDIUM_R', 44, -34], ['FX_FIRE_MEDIUM_R', -94, -61], ['FX_FIRE_MEDIUM_R', 40, -106], ['FX_FIRE_MEDIUM_R', 104, -139], ['FX_FIRE_MEDIUM_R', 167, -99], ['FX_FIRE_MEDIUM_R', 178, 3], ['FX_FIRE_MEDIUM_R', 166, -164], ['FX_FIRE_MEDIUM_R', -15, -310], ['FX_FIRE_MEDIUM_R', -155, -236], ['FX_FIRE_MEDIUM_R', -122, -259], ['FX_FIRE_LARGE', -3, -105], ['FX_FIRE_LARGE', 45, -200], ['FX_FIRE_LARGE', -193, -14]],
        [['FX_FIRE_LARGE', -40, 55], ['FX_FIRE_LARGE', -117, 24], ['FX_FIRE_LARGE', -195, -16], ['FX_FIRE_LARGE', -40, -105], ['FX_FIRE_LARGE', -102, -122], ['FX_FIRE_LARGE', 176, 6], ['FX_FIRE_LARGE', 50, -169], ['FX_FIRE_LARGE', 103, -75], ['FX_FIRE_LARGE', 163, -169], ['FX_FIRE_LARGE', 144, -264], ['FX_FIRE_LARGE_R', -23, -335], ['FX_FIRE_LARGE_R', -16, -214], ['FX_FIRE_LARGE_R', 39, -40], ['FX_FIRE_LARGE', -103, -210]],
    ],
    GATE: [
        [['FX_FIRE_SMALL', -72, 54], ['FX_FIRE_SMALL', 68, -55], ['FX_FIRE_SMALL', -72, -21], ['FX_FIRE_SMALL', 50, -81], ['FX_FIRE_SMALL', 4, 8]],
        [['FX_FIRE_MEDIUM', -72, 56], ['FX_FIRE_MEDIUM', 68, -57], ['FX_FIRE_MEDIUM_R', -72, -15], ['FX_FIRE_MEDIUM_R', 50, -81], ['FX_FIRE_MEDIUM_R', 6, 0]],
        [['FX_FIRE_LARGE', 6, -1], ['FX_FIRE_LARGE_R', -70, 54], ['FX_FIRE_LARGE_R', 72, -53], ['FX_FIRE_MEDIUM', -70, -13]],
    ],
};
