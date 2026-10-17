/**

 * 13 战斗平衡实测（无渲染）——规则**逐条对齐 src/ui/Scene13WarLayer.ts**（2026-08-11）。

 * 用途：回答「现在平衡了吗」这类问题必须实测，贴身交换率算不出放风筝和射程的价值。

 *

 * 用法：node tools/war_sim.mjs

 */



import fs from 'fs';

const SIDE = [+(process.env.BONUS ?? 1), 1 / +(process.env.BONUS ?? 1)];   // 八环 sideBonus 模拟

const GANG_K = 0.15, GANG_CAP = 3;   // 围殴加成（对齐游戏层 gangMul：被 N 人围攻 ×(1+0.15×min(3,N-1))）

const gangMul = (v) => 1 + GANG_K * Math.min(GANG_CAP, Math.max(0, v.atkers - 1));
/** 迎面拒马（镜像游戏层）：BRACE=0 关闭；BRACE_TAKEN 默认 0.5 */
const BRACE_ON = process.env.BRACE !== '0';
const BRACE_TAKEN = +(process.env.BRACE_TAKEN ?? 0.5);
const isPikeT = (t) => !!t && ((t.armorTags ?? []).includes(27) || (t.bonus?.[8] ?? 0) >= 6);
const isCavT = (t) => !!t && (t.cls === 'cav' || (t.armorTags ?? []).includes(8));



// 🔴 [2026-10-13] 兵种数值改为**直接引用游戏数据**，不再手抄。
//   血训 47「两份必定漂移」的直接后果：本文件原有一份手抄表，速度整体停在旧值
//   （轻步兵 55 vs 游戏 36、重骑兵 130 vs 54），量出来的结论不是游戏的结论。
//   `WarTypes.ts` 是纯数据叶子模块（零 import，注释写明「谁都能安全 import」），
//   实测 7 个字段与手抄表逐字段一致（仅 spd 有漂移）⇒ 可原样替换，不涉及字段翻译。

// 🔴 用法：本文件现在 import 游戏 .ts。**本机 Node v24 原生就能跑**（实测 `node tools/war_sim.mjs`
//   与 `npx tsx tools/war_sim.mjs` 输出逐字一致）。但若换到旧版 Node（< 22.6，无原生 TS 支持），
//   必须改用 `npx tsx tools/war_sim.mjs` —— 28 个下游脚本同理。

import { WAR_TYPES } from '../src/data/WarTypes.ts';

/** ⚠️ 名字仍叫 TYPES：下游约 50 个脚本 `import { TYPES }`，改名会连锁打断。值即游戏表。 */
export const TYPES = WAR_TYPES;


// 短别名（war_sim CLI 用短键，映射到游戏全键）

// 视野值 SIGHT（LOS = DE line_of_sight × 40 px），从 scratch/de_los_map.json 抽取。

// 拆 SIGHT/REACH（2026-08-17）：寻敌/丢目标迟滞用 SIGHT，出手扣血用 REACH。

const SIGHT_MAP = {

    arambai: 280, arbalest: 280, archer: 240, armored: 160, armored_elephant: 280,

    axe: 120, ballista: 360, ballista_elephant: 280, boyar: 200, camel_heavy: 200,

    cav_archer: 200, cav_archer_heavy: 240, champion: 200, chukonu: 240, composite_bowman: 280,

    coustillier: 200, crossbow: 280, crossbowman: 280, eastern_swordsman: 160, elephant: 280,

    elephant_archer: 280, elite_chukonu: 240, elite_composite_bowman: 280, elite_fire_archer: 440,

    elite_fire_lancer: 240, elite_guardsman: 160, elite_kipchak: 240, elite_liao_dao: 120,

    elite_steppe_lancer: 200, elite_tarkan: 280, elite_white_feather_guard: 200, fire_archer: 400,

    fire_lancer: 200, general_cavalry: 200, heavy_cavalry: 160, heavy_infantry: 160, heavy_pikeman: 160,

    hei_kuang: 160, hei_kuang_heavy: 160, horse_archer: 200, imperial_skirmisher: 280, iron_pagoda: 200,

    jian_swordsman: 160, kamayuk: 160, karambit_warrior: 120, karambit_warrior_elite: 120, keshik: 200,

    kipchak: 240, lancer: 160, legionary: 200, liao_dao: 120, light_infantry: 160,

    light_cavalry: 160, longbowman_elite: 320, mangudai: 240, mangudai_elite: 240, ninja: 160,

    paladin: 200, pattiyoda_longbowman: 200, pikeman: 160, rattan_archer: 240, rattan_archer_elite: 240,

    samurai: 160, samurai_elite: 200, savar: 200, shield: 200, spear: 160,

    steppe_lancer: 200, swordsman: 160, tarkan: 200, throwing_axeman: 200, tiger_rider: 200,

    war_elephant: 280, white_feather_guard: 160, xianbei_raider: 240,

};



const KEY_ALIAS = { melee: 'light_infantry', heavy: 'heavy_infantry', cav: 'heavy_cavalry', ranged: 'archer' };

const statsOf = (k) => TYPES[KEY_ALIAS[k] ?? k] ?? TYPES.light_infantry;

/** 单次出手伤害（DE 公式）：max(1, 攻 + 加成伤害 − 近防/远防) */

const dmgVs = (shooter, target) => {

    const armor = shooter.dmgType === 'melee' ? target.meleeArmor : target.pierceArmor;

    let bonus = 0;

    if (shooter.bonus && target.armorTags) for (const tag of target.armorTags) if (shooter.bonus[tag]) bonus += shooter.bonus[tag];

    return Math.max(1, shooter.atk + bonus - armor);

};



const VW = 1920, VH = 1080;

const ENG = +(process.env.ENG ?? 65), SEP = 17, SEP_SPD = 120, MARCH_R = 300;

const CELL_S = 20, CELL_M = 80, CELL_R = 220;

const FIELD_CAP = 600, DT = 1 / 30;

// MAXSEC：仿真上限秒数（默认 900）。正常局 110~170s 结束，扫种子时设 300 就够分辨「结束/不结束」，省一半机时。

const MAX_SEC = +(process.env.MAXSEC ?? 900);   // FIELD_CAP 仅供 BATCH=0 旧固定速率对照（每方上限）

const SIDE_CAP = 360;   // 每方开局数 + 补兵批量（10 口 × 36 = 每口 6×6 方正；成批补；2026-09-23 9口→10口）

const TRIGGER = 180;    // 补兵触发线：一方场上 < 180 才补（SIDE_CAP 360 的一半）

const WING_BACK = 240, WING_SIDE = 330;   // 两翼抄后：绕到敌军重心后方/翼侧偏移（同步主游戏）

const BATCH_CD = 2;              // 批次冷却（秒），对齐主游戏 BATCH_COOLDOWN

// 🔴 2026-08-13 search 方向矩阵实验：SEARCH_DIR = 1（gx 小→大，原版）/ -1（大→小）。nearest 距离中性，方向无实质影响

const SEARCH_DIR = +(process.env.SEARCH_DIR ?? 1);

// GANG=0 关围殴加成（验证 gangMul 对镜像偏袒的影响）

const GANG = process.env.GANG !== '0';

// SEARCH_MODE：0=逮到就返回 / 1=nearest 24上限 / 2=nearest 全翻 / 3=环形最近邻（默认，= 主游戏现行实现）

// 🔴 2026-08-17 默认由 0 改 3，与 Scene13WarLayer.search 对齐。0 和 1 都因扫描顺序偏袒攻方

//    （实测同兵种对镜：0 → 攻方 16:0；1 → 9:3；3 → 6:6）。2 与 3 结果严格等价，3 更快。

//    旧注释称「1、2 破坏克制边」，08-13 数值定稿后已复现不出来（三种模式下 cav 都赢 ranged）。

const SEARCH_MODE = +(process.env.SEARCH_MODE ?? 3);

// ROW_SHUFFLE：1=排位随机（默认，对齐主游戏 shuffleRows）/ 0=固定排位（melee前/cav中/ranged后，对照）

const ROW_SHUFFLE = process.env.ROW_SHUFFLE !== '0';

const ARRIVE_EPS = +(process.env.ARRIVE ?? 8);

const SEP_DEPTH = process.env.SEPD !== '0';   // 推力按重叠深度缩放

const KEEP = +(process.env.KEEP ?? 1.44);

// 【战场白热化】与游戏层 ATTRITION_* 同步：90s 内 ×1，之后每 90s +1，封顶 ×3。

const ATTR_START = +(process.env.ATTR_START ?? 60), ATTR_RAMP = +(process.env.ATTR_RAMP ?? 45), ATTR_CAP = +(process.env.ATTR_CAP ?? 4);

const attrMul = (t) => { const o = t - ATTR_START; return o <= 0 ? 1 : Math.min(ATTR_CAP, 1 + o / ATTR_RAMP); };      // 保持目标的半径平方倍数（迟滞）

const BATCH = process.env.BATCH !== '0';

const FIGHT_T = +(process.env.FIGHT_T ?? 4);      // 缠斗多久脱离

// 🔴 2026-08-17 默认由 2 改 0.4，对齐主游戏 Scene13WarLayer.ts 缠斗脱离后的 `m.next = 0.4`。

//    量具与被测对象参数不一致会让调出来的数值在游戏里不成立。

const BREAK_T = +(process.env.BREAK_T ?? 0.4);    // 脱离后多久不重新缠斗

const CAP2 = +(process.env.CAP ?? 500);

// KITE：设了就给**所有兵种**开风筝做实验（触发距离已固定为贴脸 ENG=65，与游戏层同构）。不设 = 用各兵种自带 kite（弓骑 70）。

const KITE_OVERRIDE = process.env.KITE === undefined ? null : +process.env.KITE;

// 【放风筝】段落式后撤（与游戏层 KITE_* 同步）：跑够 DIST 且拉开到 SAFE 才停下回身站撸；跨段累计到 CAP 仍没甩开 = 放弃。

const KITE_RETREAT_DIST = 100, KITE_SAFE = 70, KITE_RETREAT_CAP = 300;

// AIM_JITTER（2026-08-17 实验）：每个兵出生时分到一个**固定**的落点偏移（半径 px，0=关=现行游戏行为）。

// 起因：骑兵对骑兵实测 6 种子里 4 个打到 900s 不结束，「原地打转 80%、战线SD 30px」——

// 全军朝同一个坐标（敌军重心／敌口）走，几百人挤成一个点，内部的人身边全是自己人、

// 65px 内找不到敌人，软推挤又把他们来回顶 = 谁也打不着谁。给每人一个固定散开点即可破点成面。

const AIM_JITTER = +(process.env.AIM_JITTER ?? 0);

// WING=0 关掉两翼抄后（游戏 aimAt 无此逻辑，见下方 wing 赋值处的说明）

const WING_ON = process.env.WING !== '0';

// LANE_ASYM=1：强兵一方压上路、另一方压下路（测「两支强军正好错开、谁也碰不到谁」）

const LANE_ASYM = +(process.env.LANE_ASYM ?? 0);

// SPREAD=n：目标已被 n 人攻击就换次近的（0=关）。围殴加成 4 人封顶，故 4 是自然值。

// 🔴 [2026-08-25] 默认值已**对齐游戏层**（第四条缺腿）：原来 SPREAD 默认 0（关），

//    而 Scene13WarLayer 的 SPREAD_CAP = GANG_CAP+1 = 4 一直开着 —— 拿默认值跑出来的数

//    根本不是游戏里的行为。改参数前先确认口径，别再拿错口径的结果下结论。

const SPREAD = +(process.env.SPREAD ?? 4);

// 🔴 [2026-08-25] 索敌探针开关。PROBE=1 输出寻敌指标；KEEP_CLAIMS=1 把 keep 的 claims 闸补上

//    （游戏层 Scene13WarLayer.keep 一直有，war_sim 原来没有 —— 不补就测不出它的抖动代价）。

const PROBE = !!+(process.env.PROBE ?? 0);

const KEEP_CLAIMS = !!+(process.env.KEEP_CLAIMS ?? 0);

const CLAIMS_LIVE = !!+(process.env.CLAIMS_LIVE ?? 1);

// NOGAP=1：目标失效那一帧立即重找（不等 0.2s 节流），只有「搜了但没搜到」才节流。

const NOGAP = +(process.env.NOGAP ?? 0);

// SEP_SMOOTH：推挤力低通平滑（同步游戏 Scene13WarLayer）。0=关（旧行为）。

// 治「站着的兵原地哆嗦」：邻居集合每帧变→合力方向翻→原地高频振。加惯性后抖动 -80%、人群反而散得更开。

const SEP_SMOOTH = +(process.env.SEP_SMOOTH ?? 0.15);

// 🔴 [2026-08-26 主人「挤来挤去产生平移」「更不要挤着颤抖」] 两个实验开关：

//   SEP_ALL=1   去掉 `seen<6` 截断 —— 邻居集合每帧变是颤抖的根子（注释自己写了）

//   SEP_FIGHT=x 交战中(st!==0)的兵推力乘 x（DE 里打架的单位站定，不该被推着平移）

// 🔴 [2026-10-14 镜像偏袒根因] 默认改为 1（不截断）。`seen<6` 截断 + 扫描从左上往右下 ⇒ 左边的邻居先数满、
//   右边的常被漏掉 ⇒ 推力系统性偏右。换边实验：偏袒跟位置走、不跟编号走（骑兵恒右胜、远程恒左胜）。
//   实测 200 种子镜像（WING=0/SPREAD=4/AIM_JITTER=120，N=1350）：
//     截断 6：远程 131:69 · 骑兵 60:140 · 近战 83:117 ｜ 不截断：103:97 · 100:100 · 92:108（p 均 > 0.28），用时不变。
//   SEP_ALL=0 可切回旧口径做对照。
const SEP_ALL = !!+(process.env.SEP_ALL ?? 1);

const SEP_FIGHT = +(process.env.SEP_FIGHT ?? 0.5);

// SEP_MASS=1：推力 ∝ 1/占地面积（(r/8)^2）——步兵推不动战车/攻城器械（主人：「人物可以把战车平推开」）

const SEP_MASS = !!+(process.env.SEP_MASS ?? 1);

const massOf = (k) => SEP_MASS ? Math.max(1, (radiusOf(k) / 8) ** 2) : 1;

// UNIT_RADIUS：DE 真实占地半径（collision_size × 40px），同步游戏 Scene13WarLayer。

// RADIUS=0 可切回「全兵种共用 SEP/2」的旧行为做对照。

const RADIUS_ON = process.env.RADIUS !== '0';

const _rad = JSON.parse(fs.readFileSync('scratch/de_radius_map.json', 'utf-8'));

const radiusOf = (key) => (RADIUS_ON && _rad[key] ? _rad[key].radius_px : SEP / 2);

// SLIDE：被己方兵挡住时沿垂直方向侧滑绕行的速度比例（0=关，退回「站住不动」）

const SLIDE_RATE = +(process.env.SLIDE ?? 0.8);

// SLIDE_W：绕行时侧向分量占比（0=完全不绕、1=纯绕圈）。

const SLIDE_W = +(process.env.SLIDE_W ?? 0.6);

// KEEP_HP：目标血量低于此比例时不执行「打满 N 秒换人」（免得敌人只剩一口气却掉头走）

const KEEP_HP = +(process.env.KEEP_HP ?? 0);



// ── 【列阵推进】MARCH=1 开启（2026-08-18 主人定，对齐帝国时代 DE 的阵型行军）────────────

//   开局那批（每方 300）在出兵口列成方阵，**整体平移**压向敌方，期间不脱离队形去追人；

//   远程在队形里够得着就照打（不出列）——不禁火，否则远程白白损失一整段射击窗口。

//   两军「前锋线」逼近到 MARCH_REL 时全军同时解除，无缝切回现有的索敌散开逻辑。

//   只有开局那批列阵：补兵永远发生在混战正酣时，让新兵列队穿过自己人的战团 = 08-10 判死的挡路问题。

const MARCH = process.env.MARCH === '1';

const MARCH_REL = +(process.env.MARCH_REL ?? 160);   // 解除距离（px）：步兵视野量级，两军相隔约三个身位

const MARCH_FILES = +(process.env.MARCH_FILES ?? 6); // 每口方阵的横向列数（沿 y）

const MARCH_SP = +(process.env.MARCH_SP ?? 24);      // 槽位间距（px）：须 ≥ 两兵半径之和，否则软推挤会把队形挤散
/* ── 🔴 [2026-10-03 主人令「每一队战斗的时候就分散，移动的时候就回归队形」] 分队归队（对齐游戏层）────────
 * 与 src/ui/Scene13WarLayer.ts 的 `laneSlotTarget` 同一口径：脱战的队员回本队领队的阵型槽位，
 * 「无敌人」满 LANE_REGROUP_SEC 秒才准归队（挡住索敌 0.2s 节流那批假空窗，依据见游戏层该常数注释）。
 * REGROUP=0 关掉（＝ 2026-10-03 改前的行为），默认开 —— A/B 就靠这个开关（scratch/regroup_ab.mjs）。
 * ⚠️ 与游戏层两处已知简化，不许假装一致：
 *   ① 领队取「本队第一个活人」—— war_sim 没有旗手概念，游戏里优先旗手；
 *   ② 这里不做「玩家本人不当领队 / 点地面令优先」那两条 —— war_sim 里没有玩家。
 * 关掉这一条时本文件必须与**加这几行之前逐局一致** —— 证明法：scratch/_noop_check.mjs 把我的 5 处新增
 * 按原样撤回去重建一份「未改版」，两版同跑 9 组 × 6 种子（N=1350）：**54 局胜方/时长/余兵/超时全同**。
 * ⚠️ 别拿 scratch/march_ab_march.json（2026-08-18）当基准对账：本模拟器在那之后被改过多次（时长系统性变短，
 *    例：镜像·步兵中位 182s → 143s），历史 JSON 已经不是「同一份尺子」了。
 */
const REGROUP_ON = process.env.REGROUP !== '0';
const LANE_REGROUP_SEC = +(process.env.LANE_REGROUP_SEC ?? 1.0);

// MARCH_BATCH=0：只有开局那批排方阵，补兵回到随机散布。

// 用途：MARCH 一个开关同时管「开局列阵行军」和「补兵方阵出生」两件事，两臂对比隔离不出后者；

// 这个旋钮把它拆开做三臂（基线 / 只开局列阵 / 开局列阵+补兵方阵）。默认 1 = 与游戏一致。

const MARCH_BATCH = process.env.MARCH_BATCH !== '0';

// ROUTE=1：启用「巡逻航路」（敌方底边→中心→己方对角边），替代「走敌口/扑重心」的兜底

const ROUTE = process.env.ROUTE === '1';   // 1=交叉(攻上/守下) 2=同路(双方都在上路)

const HK = (x, y) => (x + 4096) * 8192 + (y + 4096);



function run(keyA, keyB, spritesPerSide, seed = 7, spritesPerSideB = 0, opts = {}) {

    // 实验参数覆盖（批量脚本传 opts；命令行仍走 process.env 顶层默认）

    const o = {

        CAP2, BATCH, FIGHT_T, BREAK_T, KEEP, SIDE, SEARCH_DIR, GANG, SEARCH_MODE, ROW_SHUFFLE,

        ...opts,

    };

    const spB = spritesPerSideB || spritesPerSide;

    let rs = seed >>> 0;

    const rnd = () => (rs = (rs * 1664525 + 1013904223) >>> 0) / 4294967296;



    // 排位随机（ROW_SHUFFLE=1 默认，对齐主游戏 shuffleRows）：melee/cav/ranged 三类随机分配到 row 0/1/2，每方独立

    const rowClsOf = [0, 1].map(() => {

        const cls = ['melee', 'cav', 'ranged'];

        if (o.ROW_SHUFFLE) {

            for (let i = cls.length - 1; i > 0; i--) {

                const j = (rnd() * (i + 1)) | 0;

                [cls[i], cls[j]] = [cls[j], cls[i]];

            }

        }

        return cls;   // [row0cls, row1cls, row2cls]

    });



    // 出兵口：每方 9 个，两翼 5 通道（2026-08-13 同步主游戏 FLANK5：步中/骑翼/弩后）

    const FLANK5 = [

        { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 },   // 前排中央 近战×3

        { col: 0, row: 1 }, { col: 2, row: 1 }, { col: 4, row: 1 },   // 上翼骑 / 中军骑 / 下翼骑

        { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 },   // 后排中央 远程×3

    ];

    const spawns = [];

    const mx = VW * 0.07, depth = Math.min(150, VW * 0.075);

    for (const f of [0, 1]) {

        FLANK5.forEach((cell, i) => {

            const back = mx + (2 - cell.row) * depth;

            spawns.push({

                // MIX=1：按排给兵种（前排近战 / 中排骑兵 / 后排远程），模拟真实文化编制；ROW_SHUFFLE=1 时排位随机

                // MIX=1 双方混编；MIX=2 只有红方混编（模拟「中原混编 vs 草原纯骑」这种真实对局）

                // LANE_ASYM=1（2026-08-17 主人提问「攻方上路强、守方下路强会不会正好错开」）：

                //   红方(f=0) 强兵放**上路**(col 0/1)、蓝方(f=1) 强兵放**下路**(col 3/4)，其余全塞弱兵。

                //   PAIR 的第一个 = 强兵，第二个 = 弱兵。

                // opts.portKeys[f][i]：按格位逐口指定兵种（做「4+3+2 编制孰强孰弱」这类对照用）。

                // 给了就一切照它，绕开 LANE_ASYM / MIX 那些整批赋型的老路子。

                f, key: (opts.portKeys && opts.portKeys[f] && opts.portKeys[f][i]) ? opts.portKeys[f][i] : LANE_ASYM

                    ? (LANE_ASYM === 2

                        // 对照组：双方强兵都压**上路**（同一路），用来隔离「错开」这个变量

                        ? (cell.col <= 1 ? keyA : keyB)

                        : (f === 0 ? (cell.col <= 1 ? keyA : keyB) : (cell.col >= 3 ? keyA : keyB)))

                    : (process.env.MIX === '1' || (process.env.MIX === '2' && f === 0))

                        ? rowClsOf[f][cell.row]

                        : (f === 0 ? keyA : keyB),

                x: f === 0 ? back : VW - back,

                y: VH / 2 + (cell.col - 2) * (VH * 0.8 / 5),

                pool: (f === 0 ? spritesPerSide : spB) / 9, acc: 0,

                // WING=0（2026-08-17 加）：关掉「两翼抄后」。⚠️ 这套 wing 逻辑**游戏里根本没有**

                // （Scene13WarLayer.aimAt 只有 最近敌兵→敌口→敌军重心 三级），量具比游戏多长了一条腿，

                // 拿它谈战斗时长会得出游戏里不成立的结论。要与游戏对齐就跑 WING=0。

                wing: WING_ON ? (cell.col === 0 ? 1 : cell.col === 4 ? -1 : 0) : 0,

            });

        });

    }

    // 🔴 [2026-10-14 诊断用] 出生表快照（只读，不影响仿真）
    if (opts.__debug) opts.__debug.spawns = spawns.map((s) => ({ f: s.f, key: s.key, x: s.x, y: s.y, pool: s.pool, wing: s.wing }));

    let men = [];

    const deaths = [];

    let maxField = 0;

    let wig = 0, wigN = 0, frame = 0, flips = 0, flipSec = 0;

    // 🔴 [2026-08-25] 索敌探针（PROBE=1 打开）：回答「寻敌模式要不要优化」必须有数，不能凭观感。

    //   swAll  = 换目标次数（foe 从 A 换成 B，两者都非 null）

    //   noFoe  = 本次采样时 foe==null 的人次

    //   blind  = foe==null **且视野内确实有敌人**的人次 —— 这才是真·索敌失败（看得见却不去打）

    //   dropClaim = keep 因「目标已被 SPREAD 人锁定」而丢目标的次数（游戏层独有的那道闸）

    let swAll = 0, probeN = 0, noFoe = 0, blind = 0, dropClaim = 0;

    let sepMove = 0, sepFlip = 0, sepN = 0, sepBigMove = 0, sepBigN = 0, sepSmallMove = 0, sepSmallN = 0;

    // blindWin = 这些「看得见敌人却没目标」的人里，有多少只是**卡在 0.2s 索敌节流窗内**

    //   （m.next>0，下一次到点就会锁上）。剩下的才是别的原因。

    let blindWin = 0;

    const snap = new Map();

    let batchCd = 0;

    // 列阵推进状态：marching=全场是否还在列阵阶段；adv[f]=该方阵型已推进的距离（px）

    let marching = MARCH;

    const adv = [0, 0];

    const gm = new Map(), gr = new Map(), gs = new Map();

    const put = (map, cell, m) => {

        const k = HK((m.x / cell) | 0, (m.y / cell) | 0);

        let a = map.get(k); if (!a) map.set(k, a = []); a.push(m);

    };

    const search = (m, radius, nearest = false, fullScan = false) => {

        const useR = radius > CELL_M, map = useR ? gr : gm, cell = useR ? CELL_R : CELL_M;

        const span = Math.max(1, Math.ceil(radius / cell));

        const cx = (m.x / cell) | 0, cy = (m.y / cell) | 0, r2 = radius * radius;

        let best = null, bd = r2, seen = 0;

        // 🔴 2026-08-13 镜像局偏袒修复（同步 Scene13WarLayer.search）：gx 大→小。

        //   原版左上优先 + 逮到就返回令攻方（左）兵被往左后拉、守方前压 → 镜像局攻方仅 19-21% 胜率。

        //   SEARCH_DIR=1 可切回原版方向做对照实验。fullScan=true 时 nearest 全翻（无 24 上限，真正距离中性）。

        // SEARCH_MODE=3：以自身为中心环形向外扩展 + 提前退出（精确最近邻，且天然左右对称）。

        // 结果与 fullScan nearest 严格等价，只是不用把 span² 格全翻完。

        if (o.SEARCH_MODE === 3) {

            // SPREAD（2026-08-17 实验）：围殴加成在 4 人封顶（1+0.15×min(3,n-1)），

            // 第 5 个人挤上去一点伤害都不加，纯属白挤 —— 所以「已经被 SPREAD 个人打的」优先跳过，

            // 去找次近的没人打的。找不到空闲目标时**照旧返回最近的那个**（绝不让人没目标）。

            // 判据对双方完全对称，不引入方向偏袒（那是 SEARCH_MODE 0/1 的老毛病）。

            let free = null, fd = r2;

            for (let ring = 0; ring <= span; ring++) {

                // 已有候选且它比下一环任何格子的最小可能距离都近 → 不可能再找到更近的，停

                const cand = SPREAD ? free : best;

                const cd = SPREAD ? fd : bd;

                if (cand) { const floor = (ring - 1) * cell; if (floor > 0 && cd < floor * floor) break; }

                for (let gx = cx - ring; gx <= cx + ring; gx++) for (let gy = cy - ring; gy <= cy + ring; gy++) {

                    if (Math.max(Math.abs(gx - cx), Math.abs(gy - cy)) !== ring) continue;  // 只走本环

                    const a = map.get(HK(gx, gy)); if (!a) continue;

                    for (let i = 0; i < a.length; i++) {

                        const t = a[i];

                        if (t.f === m.f || t.hp <= 0) continue;

                        const d = (t.x - m.x) ** 2 + (t.y - m.y) ** 2;

                        if (d >= r2) continue;

                        if (d < bd) { bd = d; best = t; }

                        // 用 claims（被多少人盯上，含赶路中的）而不是 atkers（只数正在打的）——

                        // 与游戏层 2026-08-19 的修复同步：atkers 会让一群人同时扑向「看着没人」的目标。

                        if (SPREAD && t.claims < SPREAD && d < fd) { fd = d; free = t; }

                    }

                }

            }

            const chosen = (SPREAD && free) ? free : best;

            if (CLAIMS_LIVE && chosen) chosen.claims++;

            return chosen;

        }

        const sd = o.SEARCH_DIR;

        for (let gx = sd === 1 ? cx - span : cx + span; sd === 1 ? gx <= cx + span : gx >= cx - span; gx += sd) for (let gy = cy - span; gy <= cy + span; gy++) {

            const a = map.get(HK(gx, gy)); if (!a) continue;

            for (let i = 0; i < a.length; i++) {

                const o = a[i];

                if (o.f === m.f || o.hp <= 0) continue;

                const d = (o.x - m.x) ** 2 + (o.y - m.y) ** 2;

                if (d >= r2) continue;

                if (!nearest && !fullScan) return o;

                if (d < bd) { bd = d; best = o; }

                if (!fullScan && ++seen >= 24) return best;

            }

        }

        return best;

    };

    // NEAR_PORT（2026-08-17 同步游戏）：已经堵到某敌口门口就跳过它 —— 门口有 pool 也不会出人

    // （出兵要等场上跌破 TRIGGER），死守只会两军各占一端、互相看不见、零阵亡死锁。

    // 必须 > AIM_JITTER(120)，否则带落点偏移停在 120px 外的兵永远判不到「已到门口」。

    const NEAR_PORT = +(process.env.NEAR_PORT ?? 200);

    const nearestEnemySpawn = (p, f) => {

        let best = null, bd = Infinity;

        for (const s of spawns) {

            // 🔴 [2026-08-17 补齐] 必须筛掉**已经空了的**敌口。游戏 Scene13WarLayer.nearestEnemySpawn /

            //    aimAt 都筛 `pool > 0`（游戏 2026-08-11 就修过：认死空口会让整路兵朝空气走、

            //    屏幕另一半全是敌人也不去）。量具原来不筛 = 停在旧版 bug 上，

            //    于是收尾阶段（所有敌口都空了）全军扑向空口站着不动，把一堆局面假报成 900s 死锁。

            if (s.f === f || s.pool <= 0) continue;

            const rdx = s.x - p.x, rdy = s.y - p.y;

            if (NEAR_PORT && rdx * rdx + rdy * rdy < NEAR_PORT * NEAR_PORT) continue;   // 已堵到门口 → 换目标

            const dy = rdy * 6;                               // LANE_W=6（2026-08-13 同步主游戏）

            const d = rdx * rdx + dy * dy;

            if (d < bd) { bd = d; best = s; }

        }

        return best;

    };



    let t = 0;

    const swingX = [];                          // 战线位置采样（每 0.5s 双方存活平均 x 的中点）

    for (; t < MAX_SEC; t += DT) {

        // 出兵

        const onField = [0, 0];

        for (const m of men) if (m.hp > 0) onField[m.f]++;

        // 敌军重心（两翼抄后绕行用，每帧 O(n)）

        const enemyCen = [null, null];

        {

            const cx = [0, 0], cy = [0, 0], cn = [0, 0];

            for (const m of men) if (m.hp > 0) { cx[m.f] += m.x; cy[m.f] += m.y; cn[m.f]++; }

            enemyCen[0] = cn[0] ? { x: cx[0] / cn[0], y: cy[0] / cn[0] } : null;

            enemyCen[1] = cn[1] ? { x: cx[1] / cn[1], y: cy[1] / cn[1] } : null;

        }

        if (BATCH) {

            // 成批补（主游戏现状）：开局双方各出 300；之后一方 < 150 才再补 300

            batchCd -= DT;

            if (batchCd <= 0) {

                for (let f = 0; f < 2; f++) {

                    if (onField[f] >= TRIGGER) continue;

                    const ports = spawns.filter(s => s.f === f && s.pool > 0);

                    if (!ports.length) continue;

                    let batch = SIDE_CAP;   // 一次补 324（固定批量）

                    for (const s of ports) s.slotN = 0;   // 每批重置槽位计数（补兵也排方阵）

                    let pi = 0;

                    while (batch > 0) {

                        const s = ports[pi % ports.length]; pi++;

                        if (s.pool <= 0) { if (ports.every(p => p.pool <= 0)) break; continue; }

                        s.pool--; batch--;

                        // 与游戏 spawnTick 同款兜底：敌口全空时用敌军重心；都没有就停止本批

                        const tgt = nearestEnemySpawn(s, s.f) ?? enemyCen[1 - s.f];

                        if (!tgt) break;

                        // 列阵推进：MARCH=1 时**所有批次**都按口排方阵（rank=沿 x 纵深、file=沿 y 横列）；

                        // 但只有 marching（开局）期间 march=true 整体平移迁就最慢，补兵 march=false 各自走。

                        const inMarch = MARCH && marching;

                        // 方阵出生：开局那批恒排；补兵是否排由 MARCH_BATCH 决定

                        const inGrid = MARCH && (marching || MARCH_BATCH);

                        let dep = 0, sy = 0;

                        if (inGrid) {

                            const i = s.slotN = (s.slotN ?? 0);

                            s.slotN++;

                            const file = i % MARCH_FILES, rank = (i / MARCH_FILES) | 0;

                            dep = rank * MARCH_SP; sy = (file - (MARCH_FILES - 1) / 2) * MARCH_SP;

                        }

                        men.push({ f: s.f, key: s.key,

                            x: inGrid ? s.x + (s.f === 0 ? -dep : dep) : s.x + (rnd() - .5) * 60,

                            y: inGrid ? s.y + sy : s.y + (rnd() - .5) * 110,

                            tx: tgt.x, ty: tgt.y, hp: statsOf(s.key).hp, foe: null, next: rnd() * 0.2, aimT: 0, fightT: 0, claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, wing: s.wing, y0: s.y, wp: 0,

                            march: inMarch, port: inMarch ? s : null, dep, sy, sp: s, noFoeSec: 0,

                            ...(AIM_JITTER ? { jx: (rnd() - .5) * 2 * AIM_JITTER, jy: (rnd() - .5) * 2 * AIM_JITTER } : null) });

                    }

                }

                batchCd = BATCH_CD;

            }

        } else {

            for (const s of spawns) {

                if (s.pool <= 0 || onField[s.f] >= FIELD_CAP) continue;

                s.acc += DT * 1000;

                while (s.acc >= 110 && s.pool > 0 && onField[s.f] < FIELD_CAP) {

                    s.acc -= 110; s.pool--; onField[s.f]++;

                    const tgt = nearestEnemySpawn(s, s.f) ?? enemyCen[1 - s.f];

                    if (!tgt) break;

                    men.push({ f: s.f, key: s.key, sp: s, dep: 0, sy: 0, noFoeSec: 0, x: s.x + (rnd() - .5) * 40, y: s.y + (rnd() - .5) * 90,

                        tx: tgt.x, ty: tgt.y, hp: statsOf(s.key).hp, foe: null, next: rnd() * 0.2, aimT: 0, fightT: 0, claims: 0, claimsNext: 0, atkers: 0, atkNext: 0, wing: s.wing, y0: s.y, wp: 0,

                        ...(AIM_JITTER ? { jx: (rnd() - .5) * 2 * AIM_JITTER, jy: (rnd() - .5) * 2 * AIM_JITTER } : null) });

                }

            }

        }

        // ── 列阵推进：整体平移 + 前锋线接触解除 ──────────────────────────────

        if (marching) {

            // 阵型速度 = 本方列阵兵里**最慢**的那个（阵型行军的定义：全队迁就最慢的人，骑兵不许甩下步兵）

            const spdMin = [Infinity, Infinity];

            let anyMarcher = false;

            for (const m of men) {

                if (m.hp <= 0 || !m.march) continue;

                anyMarcher = true;

                const sp = statsOf(m.key).spd;

                if (sp < spdMin[m.f]) spdMin[m.f] = sp;

            }

            if (!anyMarcher) {

                marching = false;   // 列阵那批打光了（理论上到不了这里），直接放开

            } else {

                for (let f = 0; f < 2; f++) if (spdMin[f] < Infinity) adv[f] += spdMin[f] * DT;

                // 前锋线 = 本方最靠前那排出兵口的 x + 已推进距离（阵型是刚体，可直接由锚点算，不受个别落单兵影响）

                let f0 = -Infinity, f1 = Infinity;

                for (const sp of spawns) {

                    if (sp.f === 0) f0 = Math.max(f0, sp.x + adv[0]);

                    else f1 = Math.min(f1, sp.x - adv[1]);

                }

                if (f1 - f0 < MARCH_REL) {

                    marching = false;

                    for (const m of men) m.march = false;   // 全军同时解除，双方一起炸开接战

                    if (process.env.MARCH_LOG === '1') {

                        let n = 0, dead = 0;

                        for (const m of men) { n++; if (m.hp <= 0) dead++; }

                        console.log(`  [列阵] t=${t.toFixed(1)}s 解除  推进 ${adv[0].toFixed(0)}/${adv[1].toFixed(0)}px  场上 ${n} 人  已阵亡 ${dead}`);

                    }

                }

            }

        }

        // 哈希

        gm.clear(); gr.clear(); gs.clear();

        for (const m of men) { put(gm, CELL_M, m); put(gr, CELL_R, m); put(gs, CELL_S, m); }



        for (const m of men) { m.atkers = m.atkNext; m.atkNext = 0; }

        // 锁定计数结转（与游戏层 WarMan.claims 同步）：含赶路中的，供 search 分流

        // 🔴 [2026-08-25] CLAIMS_LIVE=1 对齐游戏层：Scene13WarLayer 是**本帧从零实时占位**

        //    （每帧清零 → keep 住就 ++ / search 选中就 ++），不是上一帧结转。

        //    结转会让 claims 一开始就"全满"，把挤压夸大 —— 测 keep 闸的代价必须用实时口径。

        if (CLAIMS_LIVE) {

            for (const m of men) m.claims = 0;

        } else {

            for (const m of men) m.claimsNext = 0;

            for (const m of men) { if (m.foe && m.foe.hp > 0) m.foe.claimsNext++; }

            for (const m of men) m.claims = m.claimsNext;

        }

        // 🔴 [2026-10-03] 分队归队：每帧给各队（出兵口 `sp`）选一个领队 = 本队列里第一个活人。
        //    与游戏层 laneLeaders 同一口径（游戏优先旗手，本模拟器没有旗手概念，见 REGROUP_ON 头注）。
        const laneLeader = REGROUP_ON ? new Map() : null;

        if (laneLeader) for (const m of men) {
            if (m.hp <= 0 || !m.sp) continue;
            if (!laneLeader.has(m.sp)) laneLeader.set(m.sp, m);
        }

        // 🔴 [2026-10-14 诊断用] 出兵后、开打前的 men 快照（只读，只记首帧，不影响仿真）
        if (opts.__debug && opts.__debug.men.length === 0) {
            opts.__debug.men = men.map((m) => ({ f: m.f, key: m.key, x: m.x, y: m.y, hp: m.hp, tx: m.tx, ty: m.ty, wing: m.wing }));
        }

        // 🔴 [2026-10-14 修·镜像偏袒 第 1/2 项]
        //   **已知事实**（200 种子，N=1350，WING=0/SPREAD=4/AIM_JITTER=120，逐种子可复现）：
        //     cav 73:127 p=0.0002 ｜ ranged 131:69 p=0.0000 ｜ melee 87:113 p=0.077 —— 偏袒确实存在。
        //   **病灶**：`men` 由出兵循环**按方分块** push（先 f=0 全部、再 f=1 全部），而所有
        //     「按数组顺序逐个处理、且处理结果互相影响」的循环（出手、抢名额、推挤）都按这个顺序走
        //     ⇒ f=0 那一方系统性排在前面。镜像对战本不该有任何左右差。
        //   **修法（两项业内标准做法，互补）**：
        //     ① 两相结算：帧内只登记伤害，帧末统一扣血 ⇒ 堵死「先扣血/先杀人」这条通路。
        //     ② 每帧打乱处理顺序（下面 order）⇒ 堵死其余「先处理」通路（抢名额、抢目标等）。
        //     ⚠️ 必须用**带种子的** rnd()，不许 Math.random —— 否则同种子跑两次结果不同（验收第 3 条）。
        //     ⚠️ 只打乱遍历顺序；`men` 本身、位置、朝向、数值一律不动。
        const dmgAcc = new Map();

        const order = men.slice();
        for (let i = order.length - 1; i > 0; i--) {
            const j = (rnd() * (i + 1)) | 0;
            const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
        }

        for (const m of order) {

            if (m.hp <= 0) continue;

            const T = statsOf(m.key), st = T;

            const SIGHT = SIGHT_MAP[m.key] ?? 160;   // 寻敌/丢目标迟滞（DE LOS）

            const REACH = Math.max(st.rng, ENG);      // 出手扣血（近战贴身 65 / 远程 rng）

            m.next -= DT;

            // 🔴 [2026-08-25] KEEP_CLAIMS=1 对齐游戏层：Scene13WarLayer 的 keep 还带一道

            //    `m.foe.claims < SPREAD_CAP` —— 已锁定的目标本帧被 SPREAD 个人锁满就丢目标重找。

            //    war_sim 原来没有这一项，所以测不出它带来的换目标抖动。

            const keepAlive = m.foe && m.foe.hp > 0

                && (m.foe.x - m.x) ** 2 + (m.foe.y - m.y) ** 2 < SIGHT * SIGHT * KEEP;

            const claimFull = KEEP_CLAIMS && keepAlive && SPREAD && m.foe.claims >= SPREAD;

            if (claimFull) dropClaim++;

            const keep = keepAlive && !claimFull;

            if (CLAIMS_LIVE && keep) m.foe.claims++;

            const pf = m.foe;

            // 刚丢目标（上一刻还有、这一刻 keep 不住）→ NOGAP 下立即重找，消除 0.2s 空窗

            const lost = !keep && !!m.foe;

            // NOGAP=2：只补一次 search（不碰 aim 递减、不重置 next 节奏），

            //   隔离出「空窗」这一个变量 —— NOGAP=1 会连带多消耗一次 aimT，那是另一个变量。

            if (NOGAP === 2 && lost && m.next > 0) {

                m.foe = o.SEARCH_MODE === 0 ? search(m, SIGHT) : search(m, SIGHT, true, o.SEARCH_MODE === 2);

            }

            if (!keep && (m.next <= 0 || (NOGAP === 1 && lost))) {

                m.foe = o.SEARCH_MODE === 0 ? search(m, SIGHT) : search(m, SIGHT, true, o.SEARCH_MODE === 2);

                if (!m.foe && !m.march) {

                    m.aimT -= 0.2;

                    if (m.aimT <= 0) {

                        let aim, shared = true;

                        if (m.wing !== 0) {

                            const cen = enemyCen[1 - m.f];

                            aim = cen ? { x: cen.x + (m.f === 0 ? WING_BACK : -WING_BACK), y: cen.y + (m.wing > 0 ? -WING_SIDE : WING_SIDE) } : null;

                        } else {

                            const near = search(m, MARCH_R, true, o.SEARCH_MODE === 2);

                            // shared=true 表示这个落点是**全军共用的一个坐标**（敌口/敌军重心），

                            // 只有这种才加散开偏移；「最近的那个敌兵」是每人各自的目标，加了反而停在敌人身边打不着。

                            if (near) { aim = near; shared = false; }

                            else if (ROUTE) {

                                // 【巡逻航路】主人 2026-08-17 提：冲到敌方底边找不到人就该换目标，

                                // 依次「敌方底边 → 战场中心 → 己方对角边」，两军航路必然交叉，不可能一直碰不上。

                                // 到达当前航点(<150px)就推进到下一个，循环。任何时候视野内出现敌人，① 优先接管。

                                const wp = m.wp ?? 0;

                                const homeX = m.f === 0 ? VW * 0.07 : VW * 0.93;

                                const foeX = m.f === 0 ? VW * 0.93 : VW * 0.07;

                                const pts = [

                                    { x: foeX, y: m.y0 },                 // ① 敌方底边·本路

                                    { x: VW / 2, y: VH / 2 },             // ② 战场中心

                                    { x: homeX, y: VH - m.y0 },           // ③ 己方对角边

                                    { x: VW / 2, y: VH / 2 },             // ④ 回中心，循环

                                ];

                                const t = pts[wp % pts.length];

                                if ((t.x - m.x) ** 2 + (t.y - m.y) ** 2 < 150 * 150) m.wp = (wp + 1) % pts.length;

                                aim = t; shared = true;

                            }

                            else {

                                aim = nearestEnemySpawn(m, m.f) ?? enemyCen[1 - m.f];

                                shared = true;

                            }

                        }

                        if (aim) {

                            const jx = shared ? (m.jx ?? 0) : 0, jy = shared ? (m.jy ?? 0) : 0;

                            m.tx = aim.x + jx; m.ty = aim.y + jy;

                        }

                        m.aimT = 0.5;

                    }

                }

                m.next = 0.2;

            } else if (!keep) m.foe = null;

            // 🔴 [2026-10-03] 无目标计时 + 分队归队（对齐游戏层 laneSlotTarget / Scene13WarLayer）：
            //    有目标当帧清零、无目标累加；满 LANE_REGROUP_SEC 且本队有领队（不是自己）→
            //    移动目标 = 领队位置 + 自己的槽位偏移（与游戏同一算式，f=1 镜像）。
            //    放在索敌结算之后、列阵分支之前：归队目标**盖掉**同一帧算出来的巡逻/重心目标（与游戏同序）。
            m.noFoeSec = m.foe ? 0 : (m.noFoeSec ?? 0) + DT;

            if (laneLeader && !m.foe && !m.march) {

                const L = laneLeader.get(m.sp);

                if (L && L !== m && m.noFoeSec >= LANE_REGROUP_SEC) {

                    m.tx = L.x + (m.f === 0 ? -(m.dep - L.dep) : (m.dep - L.dep));

                    m.ty = L.y + (m.sy - L.sy);

                }

            }

            if (PROBE && m.foe && pf && m.foe !== pf) swAll++;



            // 列阵推进：移动目标恒为「本口锚点 + 自己的槽位」，不受索敌影响（索敌与开火照旧，见下）

            if (m.march) {

                m.tx = m.port.x + (m.f === 0 ? adv[0] - m.dep : -adv[1] + m.dep);

                m.ty = m.port.y + m.sy;

            }



            if (m.foe) {

                const fdx = m.foe.x - m.x, fdy = m.foe.y - m.y;

                const fdist2 = fdx * fdx + fdy * fdy;

                if (fdist2 >= REACH * REACH) {

                    // 列阵期间够不着**不追**：回槽位继续随队推进（帝国 DE 的 Stand Ground 行军）

                    if (m.march) {

                        const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);

                        const step = st.spd * DT;

                        if (d > Math.max(ARRIVE_EPS, step)) { m.x += dx / d * step; m.y += dy / d * step; }

                        continue;

                    }

                    // 够不着 → 追击（DE「看见就冲上去」；远程够射程前也要走位）

                    // 前方被己方兵挡住 → 沿垂直方向侧滑绕过去（同步游戏；SLIDE=0 退回站住不动）

                    const fd = Math.sqrt(fdist2) || 1;

                    let ux = fdx / fd, uy = fdy / fd;

                    const pxq = m.x + ux * CELL_S, pyq = m.y + uy * CELL_S;

                    const qcx = (pxq / CELL_S) | 0, qcy = (pyq / CELL_S) | 0;

                    let blocked = false;

                    for (let gx = qcx - 1; gx <= qcx + 1 && !blocked; gx++)

                        for (let gy = qcy - 1; gy <= qcy + 1 && !blocked; gy++) {

                            const a = gs.get(HK(gx, gy)); if (!a) continue;

                            for (const o of a) {

                                if (o === m || o.f !== m.f || o.hp <= 0) continue;

                                const rr = radiusOf(m.key) + radiusOf(o.key);

                                const odx = pxq - o.x, ody = pyq - o.y;

                                if (odx * odx + ody * ody < rr * rr) { blocked = true; break; }

                            }

                        }

                    let rate = 1;

                    if (blocked) {

                        if (SLIDE_RATE <= 0) continue;              // 旧行为：站住不动

                        // 混合：前进 (1-w) + 侧滑 w。纯侧滑(w=1)会让全军绕圈不接敌，实测步兵局 175s→414s。

                        const side = (m.jy ?? 0) >= 0 ? 1 : -1;

                        const w = SLIDE_W;

                        const bx = ux * (1 - w) + (-uy * side) * w;

                        const by = uy * (1 - w) + (ux * side) * w;

                        const bl = Math.hypot(bx, by) || 1;

                        ux = bx / bl; uy = by / bl; rate = SLIDE_RATE;

                    }

                    m.x += ux * st.spd * rate * DT;

                    m.y += uy * st.spd * rate * DT;

                    continue;

                }

                m.fightT += DT;   // 只在够得着时才计缠斗时间（慢速大视野兵种追击不消耗 4 秒窗口）

                // KEEP_HP：目标血量低于这个比例就**不换目标**（把快死的人打死再走）。0=关。

                const foeMaxHp = statsOf(m.foe.key).hp;

                const nearlyDead = KEEP_HP > 0 && m.foe.hp < foeMaxHp * KEEP_HP;

                if (m.fightT > FIGHT_T && !nearlyDead) { m.foe = null; m.fightT = 0; m.next = BREAK_T; continue; }

                // 【放风筝】2026-08-22 起与游戏层同构：被近战贴脸（ENG=65）才开撤 → **本帧不出手**，转身跑开；

                // 跑够固定段 KITE_RETREAT_DIST 就停下回身站撸（段落式「站撸→被攻击→撤一段→再站撸」）。

                // 旧实现是「进 kite 预判跑、拉开 kite×1.35 才回身」，观感是「向后平移/逃跑模拟器」（主人报障）。

                const kiteV = KITE_OVERRIDE === null ? T.kite : KITE_OVERRIDE;

                if (kiteV) {

                    const dx = m.x - m.foe.x, dy = m.y - m.foe.y, d = Math.hypot(dx, dy) || 1;

                    if (!m.kiting && d < ENG) { m.kiting = true; m.kiteLeg = 0; }

                    if (m.kiting && !m.kiteGaveUp) {

                        const step = st.spd * DT;

                        m.x += dx / d * step; m.y += dy / d * step;

                        m.fightT = 0;

                        m.kiteLeg = (m.kiteLeg ?? 0) + step;

                        m.kiteDist = (m.kiteDist ?? 0) + step;

                        // 跨段累计到 CAP 仍没甩开 = 追兵同速 → 本场放弃、转身硬拼（优先于「跑够一段就停」）

                        if (m.kiteDist >= KITE_RETREAT_CAP) { m.kiteGaveUp = true; m.kiting = false; }

                        // 跑够一段：拉开到安全距离（d ≥ KITE_SAFE）才算停，否则本段白跑、继续跑

                        else if (m.kiteLeg >= KITE_RETREAT_DIST) {

                            if (d >= KITE_SAFE) { m.kiting = false; m.kiteLeg = 0; m.kiteDist = 0; }

                            else { m.kiteLeg = 0; }

                        }

                        else continue;               // 跑的这一帧不出手

                    }

                }

                const dps = dmgVs(st, statsOf(m.foe.key)) / st.reload;
                // ── 【迎面拒马】镜像 Scene13WarLayer 的 PIKE_BRACE_*（2026-09-12）──
                //    长枪类 = armorTags 含 27 或对骑兵(8)加成>=6；骑兵类 = cls==='cav' 或 armorTags 含 8。
                //    ⚠️ war_sim 不记朝向 → 用「互为当前目标」近似为正面，故本测是规则效果的**上界**。
                let braceTaken = 1;
                if (BRACE_ON && isCavT(st) && isPikeT(statsOf(m.foe.key))) braceTaken = BRACE_TAKEN;   // 上界：一律按正面算

                m.foe.atkNext++;

                // 🔴 [2026-10-14 两相结算] 只登记，不立即扣血（帧末统一结算，消除先手偏袒）。
                dmgAcc.set(m.foe, (dmgAcc.get(m.foe) ?? 0) + dps * DT * o.SIDE[m.f] * (o.GANG ? gangMul(m.foe) : 1) * attrMul(t) * braceTaken);

            } else {

                m.fightT = 0;

                const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);

                const step = st.spd * DT;

                if (d > Math.max(ARRIVE_EPS, step)) { m.x += dx / d * step; m.y += dy / d * step; }

            }

        }

        // 🔴 [2026-10-14 两相结算] 帧末统一扣血：本帧所有出手都已登记完，双方伤害同时落地 ⇒
        //    「谁先被遍历到」不再改变结果。判死仍在下一帧开头（两边一致）。
        for (const [victim, total] of dmgAcc) victim.hp -= total;

        // 软推挤

        const push = SEP_SPD * DT, d2 = SEP * SEP;

        // 🔴 [2026-10-14 修·镜像偏袒 第 3 项] 推挤同样改两相：先按**同一份位置快照**算完全部位移，
        //    再统一应用。原来 `m.x += vx` 是边算边写，后面的人会读到「已被推走」的邻居 ⇒
        //    「谁先被遍历到」会改变推挤结果，又是一条左右偏袒通路。
        //    ⚠️ 只改结算时序，推力公式、`sepX/sepY` 平滑、探针统计一律不动。
        const sepApply = [];

        for (const m of order) {

            if (m.hp <= 0) continue;

            const cx = (m.x / CELL_S) | 0, cy = (m.y / CELL_S) | 0;

            const rm = radiusOf(m.key);

            let ox = 0, oy = 0, seen = 0, nearest2 = Infinity, minGap = SEP;

            const CAP = SEP_ALL ? 1e9 : 6;

            for (let gx = cx - 1; gx <= cx + 1 && seen < CAP; gx++)

                for (let gy = cy - 1; gy <= cy + 1 && seen < CAP; gy++) {

                    const a = gs.get(HK(gx, gy)); if (!a) continue;

                    for (let i = 0; i < a.length && seen < CAP; i++) {

                        const o = a[i];

                        if (o === m || o.hp <= 0) continue;

                        const ddx = m.x - o.x, ddy = m.y - o.y, dd = ddx * ddx + ddy * ddy;

                        const gap = rm + radiusOf(o.key);

                        if (dd >= gap * gap) continue;

                        if (dd < nearest2) { nearest2 = dd; minGap = gap; }

                        seen++;

                        if (dd < 1e-4) { ox += rnd() - .5; oy += rnd() - .5; continue; }

                        const inv = 1 / Math.sqrt(dd); ox += ddx * inv; oy += ddy * inv;

                    }

                }

            let vx = 0, vy = 0;

            if (seen) {

                const l = Math.hypot(ox, oy) || 1;

                const dep = SEP_DEPTH ? Math.max(0, 1 - Math.sqrt(nearest2) / minGap) : 1;

                const fightMul = (SEP_FIGHT !== 1 && m.st !== 0) ? SEP_FIGHT : 1;

                const mul = dep * fightMul / massOf(m.key);

                vx = ox / l * push * mul; vy = oy / l * push * mul;

            }

            if (SEP_SMOOTH > 0) {

                m.sepX = (m.sepX ?? 0) + (vx - (m.sepX ?? 0)) * SEP_SMOOTH;

                m.sepY = (m.sepY ?? 0) + (vy - (m.sepY ?? 0)) * SEP_SMOOTH;

                vx = m.sepX; vy = m.sepY;

            } else if (!seen) continue;

            if (PROBE) {

                const mv = Math.hypot(vx, vy);

                sepMove += mv;

                if (radiusOf(m.key) >= 16) { sepBigMove += mv; sepBigN++; }   // 战车/攻城器械

                else { sepSmallMove += mv; sepSmallN++; }

                const px2 = m._sx ?? 0, py2 = m._sy ?? 0;

                if (px2 * vx < 0 || py2 * vy < 0) sepFlip++;   // 推力方向反转 = 颤抖

                m._sx = vx; m._sy = vy; sepN++;

            }

            sepApply.push([m, vx, vy]);   // 🔴 两相：只登记，循环后统一应用（见本节头注）

        }

        for (const [m, vx, vy] of sepApply) { m.x += vx; m.y += vy; }

        frame++;

        for (const m of men) {

            const hasFoe = !!m.foe;

            if (m._pf !== undefined && m._pf !== hasFoe) flips++;

            m._pf = hasFoe;

        }

        flipSec += DT * men.length;

        for (const m of men) {

            const p = snap.get(m);

            if (!p) { snap.set(m, { x: m.x, y: m.y, path: 0, f0: frame }); continue; }

            p.path += Math.hypot(m.x - p.lx ?? 0, m.y - p.ly ?? 0);

            p.lx = m.x; p.ly = m.y;

            if (frame - p.f0 >= 15) {

                const net = Math.hypot(m.x - p.x, m.y - p.y);

                if (p.path > 20 && net < 6) wig++;

                wigN++;

                snap.set(m, { x: m.x, y: m.y, path: 0, f0: frame, lx: m.x, ly: m.y });

            }

        }

        for (const m of men) if (m.hp <= 0) deaths.push(m.x);

        men = men.filter(m => m.hp > 0);

        if (men.length > maxField) maxField = men.length;

        // 战线位置采样：每 0.5s（15 帧）双方存活单位平均 x 的中点

        if (frame % 15 === 0) {

            const ax = [0, 0], an = [0, 0];

            for (const m of men) if (m.hp > 0) { ax[m.f] += m.x; an[m.f]++; }

            if (an[0] && an[1]) swingX.push((ax[0] / an[0] + ax[1] / an[1]) / 2);

            // 索敌失败采样：foe==null 的人里，有多少其实**视野内就有敌人**（看得见却不去打）。

            // 每 0.5s 一次、O(n²) 只在采样帧付一次，够便宜。

            if (PROBE) for (const m of men) {

                if (m.hp <= 0) continue;

                probeN++;

                if (m.foe) continue;

                noFoe++;

                const S = (SIGHT_MAP[m.key] ?? 160) ** 2;

                for (const t of men) {

                    if (t.f === m.f || t.hp <= 0) continue;

                    if ((t.x - m.x) ** 2 + (t.y - m.y) ** 2 < S) { blind++; if (m.next > 0) blindWin++; break; }

                }

            }

        }



        const alive = [0, 0];

        for (const s of spawns) alive[s.f] += Math.max(0, s.pool);

        for (const m of men) alive[m.f]++;

        if (alive[0] <= 0 || alive[1] <= 0) {

            return { winner: alive[0] <= 0 ? 1 : 0, sec: t, left: alive, deaths, wig, wigN, flips, flipSec, swingX, maxField, swAll, probeN, noFoe, blind, blindWin, dropClaim, sepMove, sepFlip, sepN, sepBigMove, sepBigN, sepSmallMove, sepSmallN };

        }

    }

    const alive = [0, 0];

    for (const s of spawns) alive[s.f] += Math.max(0, s.pool);

    for (const m of men) alive[m.f]++;

    return { winner: alive[0] > alive[1] ? 0 : 1, sec: t, left: alive, timeout: true, deaths, wig, wigN, flips, flipSec, swingX, maxField, swAll, probeN, noFoe, blind, blindWin, dropClaim, sepMove, sepFlip, sepN, sepBigMove, sepBigN, sepSmallMove, sepSmallN };

}



export { run };   // TYPES 已在文件头 `export const TYPES = WAR_TYPES` 导出（供 tech_ab.mjs 注入变体兵种）

/** 🔴 [2026-10-14 诊断用·只读] 最近一次 run 的初始态快照（出生表 + 首批兵）。
 *  用途：查「镜像对战左右偏袒」到底是不是初始条件不对称 —— 逐字段比对双方是否严格镜像。
 *  不影响任何仿真逻辑，仅记录。 */
export let LAST_DEBUG = null;

export function debugInit(keyA, keyB, spritesPerSide, seed, spritesPerSideB = 0, opts = {}) {
    LAST_DEBUG = { vw: VW, vh: VH, spawns: [], men: [] };
    const r = run(keyA, keyB, spritesPerSide, seed, spritesPerSideB, { ...opts, __debug: LAST_DEBUG });
    return { result: r, debug: LAST_DEBUG };
}



const NAME = { melee: '近战', heavy: '重步', shield: '近卫', spear: '青州', axe: '蛮斧', armored: '藤甲', cav: '骑兵', lancer: '轻骑', heavy_cavalry: '重骑', general_cavalry: '虎豹', ranged: '远程', horse_archer: '突骑' };

if (import.meta.main) {

const [A, B] = (process.env.PAIR ?? 'melee,melee').split(',');

const r = run(A, B, +(process.env.N ?? 3000), +(process.env.SEED ?? 7), +(process.env.NB ?? 0) || +(process.env.N ?? 3000));

const xs = r.deaths;

const mean = xs.reduce((a, b) => a + b, 0) / xs.length;

const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);

xs.sort((a, b) => a - b);

const q = (p) => Math.round(xs[Math.floor(xs.length * p)]);

console.log(`${A} vs ${B}  缠斗${FIGHT_T}s/脱离${BREAK_T}s  上限${CAP2}`);

console.log(`  尸体数 ${xs.length}  横向标准差 ${Math.round(sd)}px（越大越铺得开）`);

console.log(`  中间 90% 落在 x = ${q(0.05)} ~ ${q(0.95)}  （宽 ${q(0.95) - q(0.05)}px，屏宽 1920）`);

console.log(`  打/走切换 ${(r.flips / Math.max(1, r.flipSec)).toFixed(2)} 次/人·秒  原地打转 ${(r.wig / Math.max(1, r.wigN) * 100).toFixed(1)}%  用时 ${r.sec | 0}s  余兵 ${Math.round(r.left[0]*10)}:${Math.round(r.left[1]*10)}  胜方=${r.winner === 0 ? A : B}`);

if (PROBE) {

    const sec = Math.max(1, r.sec);

    const men = Math.max(1, r.maxField);

    console.log(`  索敌: 换目标 ${(r.swAll / sec / men).toFixed(2)} 次/人·秒  无目标 ${(r.noFoe / Math.max(1, r.probeN) * 100).toFixed(1)}%  其中视野内有敌人(真索敌失败) ${(r.blind / Math.max(1, r.probeN) * 100).toFixed(1)}%  claims挤掉目标 ${r.dropClaim}`);

    console.log(`        其中卡在 0.2s 索敌节流窗内（下次到点就锁上） ${(r.blindWin / Math.max(1, r.blind) * 100).toFixed(1)}%`);

    const secs = Math.max(1, r.sec);

    console.log(`  推挤: 平移 ${(r.sepMove / Math.max(1, r.sepN) * 30).toFixed(1)} px/人·秒  方向反转 ${(r.sepFlip / Math.max(1, r.sepN) * 100).toFixed(1)}%（越低越不抖）`);

    if (r.sepBigN) console.log(`        大件(战车/攻城器械) ${(r.sepBigMove / r.sepBigN * 30).toFixed(1)} px/秒   步骑 ${(r.sepSmallMove / Math.max(1,r.sepSmallN) * 30).toFixed(1)} px/秒`);

}

// 战线摆动（swingX 采样序列）

const sxs = r.swingX || [];

if (sxs.length > 3) {

    const sm = sxs.reduce((a, b) => a + b, 0) / sxs.length;

    const ssd = Math.sqrt(sxs.reduce((a, b) => a + (b - sm) ** 2, 0) / sxs.length);

    let rev = 0, prevDir = 0;

    for (let i = 1; i < sxs.length; i++) {

        const dir = sxs[i] - sxs[i - 1];

        if (dir !== 0) { if (dir * prevDir < 0) rev++; prevDir = dir; }

    }

    console.log(`  战线: 位置SD ${ssd.toFixed(0)}px  中点 ${sm.toFixed(0)}  方向反转 ${rev} 次（采样 ${sxs.length}）`);

}

}

