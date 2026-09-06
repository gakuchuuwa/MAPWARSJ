// ==================== ç²¾çµå›¾è·¯å¾„ (Sprite Paths) ====================
export const SPRITE_PATHS = {
    // [NEW] General Portraits (Mapped by General ID；缺省走 portrait_defaults 文化区随机池)
    GENERAL_PORTRAITS: {
        // ── 秦势力将领立绘 ──
        'xin_baiqi': '/assets/yingqin/xin_baiqi.png',           // 白起（generalId 已更新）
        // ── 02 大唐将领 ──
        'tang_lishimin': '/assets/litang/tang_lishimin.png',
        // ── 03 武周将领（狄仁杰立绘/档案已移除，跳过）──
        // ── 04 大明将领 ──
        'ming_d_zhudi': '/assets/daming/ming_d_zhudi.png',       // 朱棣（generalId 已更新）
        'jinling_tandaoji': '/assets/JIANGNAN/jinling_tandaoji.png',
        'yingzhou_liuyan': '/assets/LINGNAN/yingzhou_liuyan.png', // 刘龑（generalId 已更新）
        'yangzhou_wangping': '/assets/BASHU/yangzhou_wangping.png',
        'pagan_anulvtuo': '/assets/DIANQIAN/pagan_anultuo.png',   // 文件名少个 v，以磁盘/FactionGenerals 为准
        'qiuci_baiba': '/assets/WESTERN/qiuci_baiba.png',
        'gar_lunqinling': '/assets/TIBET/gar_lunqinling.png',
        'menggu_d_chengjisihan': '/assets/STEPPE/menggu_d_chengjisihan.png',
        'bohai_dazuorong': '/assets/NORTHEAST/bohai_dazuorong.png',
        'goryeo_jianghanzan': '/assets/KOREA/goryeo_jianghanzan.png',
        'ashikaga_zulizunshi': '/assets/JAPAN/ashikaga_zulizunshi.png',
        'tiemuer_tiemuer': '/assets/CENTRAL_ASIA/tiemuer_tiemuer.png',
        'siam_nalixuan': '/assets/DIANQIAN/siam_nalixuan_pugan.png',
        'shang_fuhao': '/assets/xianqin/shang_fuhao.png',
        'pizhou_lvbu': '/assets/CENTRAL/pizhou_lvbu.png',
        'xianyu_hanxin': '/assets/liuhan/xianyu_hanxin.png',    // 韩信（generalId 已更新）
        'wei_wuqi': '/assets/xianqin/wei_wuqi.png',
        'manzhou_nuerhachi': '/assets/manqing/manzhou_nuerhachi.png',
        'xinluo_jinyuxin': '/assets/KOREA/xinluo_jinyuxin.png',
        'seljuq_sangjiaer': '/assets/CENTRAL_ASIA/seljuq_sangjiaer.png',
        'zaoyang_d_menggong': '/assets/zhaosong/zaoyang_d_menggong.png',
    },
    PHALANX: {
        FLAG: {
            POLE: '/SUCAI/S10QZ/1-1.png',
            BODY: '/SUCAI/S10QZ/7-1.png', // 
            TEXT: '/SUCAI/S10QZ/59-1.png', // 59-1 Text
        }
    },
    // [NEW] Granular Unit Asset Configuration
    // Allows defining sprites for specific unit types (e.g. 'huaxia_infantry', 'roman_legion')
    UNIT_ASSETS: {
        'guanyu': {
            // 【guanyu】玩家乱入者（借用关羽 DE 素材 u_cav_hero_guan_yu），2026-09-05 接线：
            //   大地图单骑 + 13 战术模式玩家本体；IDLE 45 帧 / MOVE 30 帧 / ATTACK 45 帧 / DEATH 45 帧（_meta.json）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/death_${dir}.png`),
        },
        'jian_swordman_shielded': {
            // 【jian_swordman_shielded】AoE2 DE 素材，2026-08-18 接线（目录名与 key 的下划线不一致，按编辑器 pathPrefix 取）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIANSWORDMANSHIELDED/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIANSWORDMANSHIELDED/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIANSWORDMANSHIELDED/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIANSWORDMANSHIELDED/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIANSWORDMANSHIELDED/death_${dir}.png`),
        },
        'crusader_knight': {
            // 【crusader_knight】AoE2 DE 素材，2026-08-18 接线（目录名与 key 的下划线不一致，按编辑器 pathPrefix 取）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRUSADERKNIGHT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRUSADERKNIGHT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRUSADERKNIGHT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRUSADERKNIGHT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRUSADERKNIGHT/death_${dir}.png`),
        },
        'antiquity_battering_ram': {
            // 【antiquity_battering_ram】AoE2 DE 素材，2026-08-18 接线（目录名与 key 的下划线不一致，按编辑器 pathPrefix 取）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_BATTERINGRAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_BATTERINGRAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_BATTERINGRAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_BATTERINGRAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_BATTERINGRAM/death_${dir}.png`),
        },
        'halberdier': {
            // 【halberdier】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HALBERDIER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HALBERDIER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HALBERDIER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HALBERDIER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HALBERDIER/death_${dir}.png`),
        },
        'norse_warrior': {
            // 【norse_warrior】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NORSE_WARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NORSE_WARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NORSE_WARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NORSE_WARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NORSE_WARRIOR/death_${dir}.png`),
        },
        'sosso_guard': {
            // 【sosso_guard】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOSSO_GUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOSSO_GUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOSSO_GUARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOSSO_GUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOSSO_GUARD/death_${dir}.png`),
        },
        'elite_greek_cavalry': {
            // 【elite_greek_cavalry】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GREEK_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GREEK_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GREEK_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GREEK_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GREEK_CAVALRY/death_${dir}.png`),
        },
        'levy': {
            // 【levy】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVY/death_${dir}.png`),
        },
        'gastraphetes': {
            // 【gastraphetes】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GASTRAPHETES/death_${dir}.png`),
        },
        'laminated_bowman': {
            // 【laminated_bowman】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAMINATED_BOWMAN/death_${dir}.png`),
        },
        'paragon': {
            // 【paragon】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARAGON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARAGON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARAGON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARAGON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARAGON/death_${dir}.png`),
        },
        'shock_cavalry': {
            // 【shock_cavalry】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOCK_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOCK_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOCK_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOCK_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOCK_CAVALRY/death_${dir}.png`),
        },
        'imperial_cavalry': {
            // 【imperial_cavalry】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_CAVALRY/death_${dir}.png`),
        },
        'equites': {
            // 【equites】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EQUITES/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EQUITES/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EQUITES/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EQUITES/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EQUITES/death_${dir}.png`),
        },
        'sarmatian': {
            // 【sarmatian】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SARMATIAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SARMATIAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SARMATIAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SARMATIAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SARMATIAN/death_${dir}.png`),
        },
        'elite_peltast': {
            // 【elite_peltast】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_PELTAST/death_${dir}.png`),
        },
        'vanguard': {
            // 【vanguard】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VANGUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VANGUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VANGUARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VANGUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VANGUARD/death_${dir}.png`),
        },
        'bowman': {
            // 【bowman】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOWMAN/death_${dir}.png`),
        },
        'raider': {
            // 【raider】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAIDER/death_${dir}.png`),
        },
        'guardsman': {
            // 【guardsman】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUARDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUARDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUARDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUARDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUARDSMAN/death_${dir}.png`),
        },
        'antiquity_skirmisher': {
            // 【antiquity_skirmisher】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SKIRMISHER/death_${dir}.png`),
        },
        'elite_antiquity_skirmisher': {
            // 【elite_antiquity_skirmisher】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_ANTIQUITY_SKIRMISHER/death_${dir}.png`),
        },
        'antiquity_cavalry_archer': {
            // 【antiquity_cavalry_archer】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAVALRY_ARCHER/death_${dir}.png`),
        },
        'antiquity_heavy_cavalry_archer': {
            // 【antiquity_heavy_cavalry_archer】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_CAVALRY_ARCHER/death_${dir}.png`),
        },
        'antiquity_light_cavalry': {
            // 【antiquity_light_cavalry】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_LIGHT_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_LIGHT_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_LIGHT_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_LIGHT_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_LIGHT_CAVALRY/death_${dir}.png`),
        },
        'antiquity_scout_cavalry': {
            // 【antiquity_scout_cavalry】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCOUT_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCOUT_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCOUT_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCOUT_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCOUT_CAVALRY/death_${dir}.png`),
        },
        'antiquity_spearman': {
            // 【antiquity_spearman】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SPEARMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SPEARMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SPEARMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SPEARMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SPEARMAN/death_${dir}.png`),
        },
        'antiquity_capped_ram': {
            // 【antiquity_capped_ram】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAPPED_RAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAPPED_RAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAPPED_RAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAPPED_RAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_CAPPED_RAM/death_${dir}.png`),
        },
        'antiquity_scorpion': {
            // 【antiquity_scorpion】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SCORPION/death_${dir}.png`),
        },
        'antiquity_heavy_scorpion': {
            // 【antiquity_heavy_scorpion】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_HEAVY_SCORPION/death_${dir}.png`),
        },
        'antiquity_mangonel': {
            // 【antiquity_mangonel】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_MANGONEL/death_${dir}.png`),
        },
        'antiquity_onager': {
            // 【antiquity_onager】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_ONAGER/death_${dir}.png`),
        },
        'antiquity_siege_onager': {
            // 【antiquity_siege_onager】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_ONAGER/death_${dir}.png`),
        },
        'antiquity_siege_ram': {
            // 【antiquity_siege_ram】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_RAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_RAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_RAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_RAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_RAM/death_${dir}.png`),
        },
        'antiquity_siege_tower': {
            // 【antiquity_siege_tower】AoE2 DE 素材，2026-08-18 接线（此前只有兵种数值、无素材声明 → 战场上不可见）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANTIQUITY_SIEGE_TOWER/death_${dir}.png`),
        },

        // === HUIHUI FACTION (å›žå›žå¼“éª‘) ===

        // === HUIHUI MIXED (å›žå›žæ­¥éª‘) ===
        // [2026-08-12 删] 'riben_infantry' 已移除：帧号与 'armored'（藤甲兵 562-609）完全相同，
        // 且全项目除自身定义外无任何引用。日本编制走的是 armored，所以日本兵 = 藤甲兵 = 朝鲜兵，
        // 三家共用同一套斗笠刀盾素材（主人 2026-08-12 确认后清理）。
        'xiyang_legion': {
            // [NOTE] S8 ASSETS (ä¸‰å›½8å…µæ¨¡) - HANDLED MANUALLY IN LegionPhalanxDrawer.ts
            // Files 1-80 are stitched at runtime.
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },
        'han_legion': {
            // [NOTE] Handled manually in LegionAssetManager (S8YD + S8GJ)
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },
        'yuenan_legion': {
            // [NOTE] Handled manually in LegionAssetManager (S8YD)
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },
        'qiangzang_legion': {
            // [NOTE] Handled manually in LegionAssetManager (S8YD)
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },
        'zang_legion': {
            // [NOTE] Handled manually in LegionAssetManager (S8YD)
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },
        'gao_legion': {
            // [NOTE] Handled manually in LegionAssetManager (S8YD)
            MOVE: [],
            ATTACK: [],
            IDLE: [],
            DAMAGE: [],
            DEATH: [],
        },

        // [USER CONFIG] Specific Unit Types for Composition
        // 床弩兵 401-456（单兵操作大弩，帧结构同 crossbow；2026-08-04 盘活，拉丁区蝎子弩）
        'archer': {
            // 【步弓手】AoE2 DE 素材（u_arc_archer），2026-08-15 换血 S10DB
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/idle_${dir}.png`),
            // AoE2 无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/attack_${dir}.png`),
            // AoE2 弓手 attack 即拉弓射箭，无独立 SHOOT，复用
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARCHER/death_${dir}.png`),
        },
        // 【日本武士】Samurai（8方向，AoE2 DE SLD 素材提取，2026-08-15 日本文化全决定版）
        'samurai': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_DE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_DE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_DE/idle_${dir}.png`),
            // AoE2 DE 武士无受击动画，DAMAGE 复用攻击帧（受击时表现挥刀姿态）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_DE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_DE/death_${dir}.png`),
        },
        // 【精锐日本武士】Elite Samurai（8方向，AoE2 DE SLD 素材提取，2026-08-15 套用）
        'samurai_elite': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_ELITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_ELITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_ELITE/idle_${dir}.png`),
            // AoE2 精锐武士无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_ELITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAMURAI_ELITE/death_${dir}.png`),
        },
        // 【朝鲜火焰弓箭手】Fire Archer（8方向，AoE2 DE SLD 素材，2026-08-15 朝鲜全决定版）
        'fire_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/idle_${dir}.png`),
            // AoE2 火焰弓箭手无受击动画，DAMAGE/SHOOT 复用攻击帧（拉弓射火箭）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_ARCHER/death_${dir}.png`),
        },
        // 【朝鲜黑光铠骑兵】Hei Kuang（8方向，AoE2 DE SLD 素材，2026-08-15 朝鲜全决定版）
        'hei_kuang': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG/idle_${dir}.png`),
            // AoE2 黑光铠骑兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG/death_${dir}.png`),
        },
        // 【朝鲜刀剑手】Eastern Swordsman（8方向，AoE2 DE SLD 素材，2026-08-15 朝鲜全决定版）
        'eastern_swordsman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EASTERN_SWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EASTERN_SWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EASTERN_SWORDSMAN/idle_${dir}.png`),
            // AoE2 刀剑手无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EASTERN_SWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EASTERN_SWORDSMAN/death_${dir}.png`),
        },
        // 【东北铁浮图】Iron Pagoda 重骑兵（8方向，AoE2 DE SLD 素材，2026-08-15 东北全决定版）
        'iron_pagoda': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IRON_PAGODA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IRON_PAGODA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IRON_PAGODA/idle_${dir}.png`),
            // AoE2 铁浮图无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IRON_PAGODA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IRON_PAGODA/death_${dir}.png`),
        },
        // 【东北钦察】Kipchak 弓骑兵（8方向，AoE2 DE SLD 素材；弓骑有射击，SHOOT 复用攻击帧）
        'kipchak': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/idle_${dir}.png`),
            // AoE2 钦察无受击动画，DAMAGE/SHOOT 复用攻击帧（骑射）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KIPCHAK/death_${dir}.png`),
        },
        // 【东北精锐长弓兵】Elite Longbowman 弓手（8方向，AoE2 DE SLD 素材）
        'longbowman_elite': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/idle_${dir}.png`),
            // AoE2 长弓兵无受击动画，DAMAGE/SHOOT 复用攻击帧（拉弓）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN_ELITE/death_${dir}.png`),
        },
        // 【西域长枪兵】Pikeman 长枪步兵（8方向，AoE2 DE SLD 素材，2026-08-15 西域全决定版）
        'pikeman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PIKEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PIKEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PIKEMAN/idle_${dir}.png`),
            // AoE2 长枪兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PIKEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PIKEMAN/death_${dir}.png`),
        },
        // 【西域骑射手】Cavalry Archer 弓骑（8方向，AoE2 DE SLD 素材；弓骑有射击，SHOOT 复用攻击帧）
        'cav_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/idle_${dir}.png`),
            // AoE2 骑射手无受击动画，DAMAGE/SHOOT 复用攻击帧（骑射）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER/death_${dir}.png`),
        },
        // 【西亚重装骑射手】Heavy Cavalry Archer 重装弓骑（8方向，AoE2 DE SLD 素材，u_cav_archer_heavy；弓骑有射击，SHOOT 复用攻击帧）
        'cav_archer_heavy': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/idle_${dir}.png`),
            // AoE2 重装骑射手无受击动画，DAMAGE/SHOOT 复用攻击帧（骑射）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAV_ARCHER_HEAVY/death_${dir}.png`),
        },
        // 【西域轻骑兵】Light Cavalry 轻骑兵（8方向，AoE2 DE SLD 素材）
        'light_riders': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHT_RIDERS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHT_RIDERS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHT_RIDERS/idle_${dir}.png`),
            // AoE2 轻骑兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHT_RIDERS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHT_RIDERS/death_${dir}.png`),
        },
        // 【江南诸葛弩】Chu Ko Nu 连弩兵（8方向，AoE2 DE SLD 素材；弩手有射击，SHOOT 复用攻击帧）
        'chukonu': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/idle_${dir}.png`),
            // AoE2 诸葛弩无受击动画，DAMAGE/SHOOT 复用攻击帧（连射）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHUKONU/death_${dir}.png`),
        },
        // 【川蜀白毦兵】White Feather Guard 白羽精兵（8方向，AoE2 DE SLD 素材，u_inf_ji_infantry）
        'white_feather_guard': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WHITE_FEATHER_GUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WHITE_FEATHER_GUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WHITE_FEATHER_GUARD/idle_${dir}.png`),
            // AoE2 白毦兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WHITE_FEATHER_GUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WHITE_FEATHER_GUARD/death_${dir}.png`),
        },
        // 【青藏精锐白毦兵】Elite White Feather Guard 精锐白羽精兵（8方向，AoE2 DE SLD 素材）
        'elite_white_feather_guard': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WHITE_FEATHER_GUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WHITE_FEATHER_GUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WHITE_FEATHER_GUARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WHITE_FEATHER_GUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WHITE_FEATHER_GUARD/death_${dir}.png`),
        },
        // 【川蜀藤弓兵】Rattan Archer 藤甲弓手（8方向，AoE2 DE SLD 素材；弓手有射击，SHOOT 复用攻击帧）
        'rattan_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/idle_${dir}.png`),
            // AoE2 藤弓兵无受击动画，DAMAGE/SHOOT 复用攻击帧（拉弓）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER/death_${dir}.png`),
        },
        // 【河西精锐火矛手】Elite Fire Lancer 精锐火矛步兵（8方向，AoE2 DE SLD 素材，u_inf_fire_lancer_elite）
        'elite_fire_lancer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_LANCER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_LANCER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_LANCER/idle_${dir}.png`),
            // AoE2 火矛手无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_LANCER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_LANCER/death_${dir}.png`),
        },
        // 【江南精锐火焰弓箭手】Elite Fire Archer 精锐火焰弓手（8方向，AoE2 DE SLD 素材，u_arc_fire_archer_elite）
        'elite_fire_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/idle_${dir}.png`),
            // AoE2 火焰弓箭手无受击动画，DAMAGE/SHOOT 复用攻击帧（射火箭）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_FIRE_ARCHER/death_${dir}.png`),
        },
        // 【川蜀精锐诸葛弩】Elite Chu Ko Nu 精锐连弩兵（8方向，AoE2 DE SLD 素材，u_arc_chukonu_elite）
        'elite_chukonu': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/idle_${dir}.png`),
            // AoE2 诸葛弩无受击动画，DAMAGE/SHOOT 复用攻击帧（连射）
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CHUKONU/death_${dir}.png`),
        },
        // 【青藏答剌罕骑兵】Tarkan 骑兵（8方向，AoE2 DE SLD 素材，u_cav_tarkan）
        'tarkan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARKAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARKAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARKAN/idle_${dir}.png`),
            // AoE2 答剌罕骑兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARKAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARKAN/death_${dir}.png`),
        },
        // 【青藏精锐答剌罕骑兵】Elite Tarkan 精锐骑兵（8方向，AoE2 DE SLD 素材，u_cav_tarkan_elite）
        'elite_tarkan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TARKAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TARKAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TARKAN/idle_${dir}.png`),
            // AoE2 精锐答剌罕骑兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TARKAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TARKAN/death_${dir}.png`),
        },
        // 【西域精锐近卫军】Elite Guardsman 精锐步兵（8方向，AoE2 DE SLD 素材，u_inf_elite_guardsman）
        'elite_guardsman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GUARDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GUARDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GUARDSMAN/idle_${dir}.png`),
            // AoE2 精锐近卫军无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GUARDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_GUARDSMAN/death_${dir}.png`),
        },
        // 【西域草原枪兵】Steppe Lancer 草原枪骑兵（8方向，AoE2 DE SLD 素材，u_cav_steppe_lancer）
        'steppe_lancer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_LANCER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_LANCER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_LANCER/idle_${dir}.png`),
            // AoE2 草原枪兵无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_LANCER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_LANCER/death_${dir}.png`),
        },
        // 【日本忍者】Ninja 忍者近战步兵（8方向，AoE2 DE SLD 素材，u_inf_ninja）
        'ninja': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NINJA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NINJA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NINJA/idle_${dir}.png`),
            // AoE2 忍者无受击动画，DAMAGE 复用攻击帧
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NINJA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/NINJA/death_${dir}.png`),
        },
        // ============ 2026-08-15 主人定：15 区全决定版剩余 10 文化 ============
        // 【北方辽刀】Liao Dao 契丹长刀步兵（8方向，AoE2 DE SLD 素材，u_inf_liao_dao）
        'liao_dao': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIAO_DAO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIAO_DAO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIAO_DAO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIAO_DAO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIAO_DAO/death_${dir}.png`),
        },
        // 【河西精锐辽刀】Elite Liao Dao 精锐契丹长刀步兵（8方向，AoE2 DE SLD 素材）
        'elite_liao_dao': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LIAO_DAO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LIAO_DAO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LIAO_DAO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LIAO_DAO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LIAO_DAO/death_${dir}.png`),
        },
        // 【北方/中原火矛兵】Fire Lancer 火矛步兵（8方向，AoE2 DE SLD 素材，u_inf_fire_lancer）
        'fire_lancer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_LANCER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_LANCER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_LANCER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_LANCER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_LANCER/death_${dir}.png`),
        },
        // 【北方鲜卑掠骑兵】Xianbei Raider 鲜卑骑兵（8方向，AoE2 DE SLD 素材，u_cav_xianbei_raider）
        'xianbei_raider': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XIANBEI_RAIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XIANBEI_RAIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XIANBEI_RAIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XIANBEI_RAIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XIANBEI_RAIDER/death_${dir}.png`),
        },
        // 【中原虎豹骑】Tiger Cavalry 曹魏精锐骑兵（8方向，AoE2 DE SLD 素材，u_cav_tiger_rider）
        'tiger_rider': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TIGER_RIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TIGER_RIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TIGER_RIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TIGER_RIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TIGER_RIDER/death_${dir}.png`),
        },
        // 【朝鲜刀剑手】DE 吴国刀剑手（2026-08-16 主人定：朝鲜/中原/江南剑士统一 DE 吴国刀剑手，全项目只用帝国时代决定版士兵图）
        'jian_swordsman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/death_${dir}.png`),
        },
        // 【岭南帝王掷矛手】Imperial Skirmisher 越南帝王掷矛手（8方向，AoE2 DE SLD 素材，u_arc_imperialskirmisher）
        'imperial_skirmisher': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIAL_SKIRMISHER/death_${dir}.png`),
        },
        // 【滇缅象兵】War Elephant 战象（8方向，AoE2 DE SLD 素材，u_ele_war_elephant）
        'war_elephant': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_ELEPHANT/death_${dir}.png`),
        },
        // 【滇缅爪刀勇士】Karambit Warrior 马来爪刀兵（8方向，AoE2 DE SLD 素材，u_inf_karambitwarrior）
        'karambit_warrior': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR/death_${dir}.png`),
        },
        // 【滇缅飞镖骑兵】Arambai 缅甸飞镖骑兵（8方向，AoE2 DE SLD 素材，u_cav_arambai）
        'arambai': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARAMBAI/death_${dir}.png`),
        },
        // 【草原蒙古突骑】Mangudai 蒙古弓骑（8方向，AoE2 DE SLD 素材，u_cav_mangudai）
        'mangudai': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI/death_${dir}.png`),
        },
        // 【草原怯薛军】Keshik 蒙古怯薛骑兵（8方向，AoE2 DE SLD 素材，u_cav_keshik）
        'keshik': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESHIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESHIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESHIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESHIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESHIK/death_${dir}.png`),
        },
        // 【中亚贵族铁骑】Boyar 斯拉夫贵族骑兵（8方向，AoE2 DE SLD 素材，u_cav_boyar）
        'boyar': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOYAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOYAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOYAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOYAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOYAR/death_${dir}.png`),
        },
        // 【中亚萨瓦尔】Savar 波斯精锐重骑兵（8方向，AoE2 DE SLD 素材，山丘之王 DLC）
        'savar': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAVAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAVAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAVAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAVAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAVAR/death_${dir}.png`),
        },
        // 【中亚精锐钦察】Elite Kipchak 库曼精锐弓骑（8方向，AoE2 DE SLD 素材，u_cav_kipchak_elite）
        'elite_kipchak': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_KIPCHAK/death_${dir}.png`),
        },
        // 【西亚精锐复合弓箭手】Elite Composite Bowman 亚美尼亚复合弓手（8方向，AoE2 DE SLD 素材，u_arc_composite_bowman_elite）
        'elite_composite_bowman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_COMPOSITE_BOWMAN/death_${dir}.png`),
        },
        // 【西亚重装骆驼兵】Heavy Camel Rider 重装骆驼骑兵（8方向，AoE2 DE SLD 素材，u_cam_camel_heavy）
        'camel_heavy': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_HEAVY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_HEAVY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_HEAVY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_HEAVY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_HEAVY/death_${dir}.png`),
        },
        // 【斯拉夫复合弓箭手】Composite Bowman 亚美尼亚弓手（8方向，AoE2 DE SLD 素材，u_arc_composite_bowman）
        'composite_bowman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPOSITE_BOWMAN/death_${dir}.png`),
        },
        // 【斯拉夫精锐草原枪兵】Elite Steppe Lancer 库曼精锐枪骑兵（8方向，AoE2 DE SLD 素材，u_cav_steppe_lancer_elite）
        'elite_steppe_lancer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_STEPPE_LANCER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_STEPPE_LANCER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_STEPPE_LANCER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_STEPPE_LANCER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_STEPPE_LANCER/death_${dir}.png`),
        },
        // 【斯拉夫掷斧兵】Throwing Axeman 法兰克掷斧兵（8方向，AoE2 DE SLD 素材，u_inf_throwingaxeman）
        'throwing_axeman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THROWING_AXEMAN/death_${dir}.png`),
        },
        // 【日耳曼冠军剑士】Champion 冠军剑士（8方向，AoE2 DE SLD 素材，u_inf_champion）
        'champion': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPION/death_${dir}.png`),
        },
        // 【日耳曼弩手】Crossbowman 弩手（8方向，AoE2 DE SLD 素材，u_arc_crossbowman）
        'crossbowman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CROSSBOWMAN/death_${dir}.png`),
        },
        // 【日耳曼游侠】Paladin 圣骑士（8方向，AoE2 DE SLD 素材，u_cav_paladin）
        'paladin': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PALADIN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PALADIN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PALADIN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PALADIN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PALADIN/death_${dir}.png`),
        },
        // 【拉丁马上轻装兵】Coustillier 勃艮第轻装骑兵（8方向，AoE2 DE SLD 素材，u_cav_coustillier）
        'coustillier': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COUSTILLIER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COUSTILLIER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COUSTILLIER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COUSTILLIER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COUSTILLIER/death_${dir}.png`),
        },
        // 【拉丁重装长枪兵】Heavy Pikeman 重装枪兵（8方向，AoE2 DE SLD 素材，u_inf_heavypikeman）
        'heavy_pikeman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_PIKEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_PIKEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_PIKEMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_PIKEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_PIKEMAN/death_${dir}.png`),
        },
        // 【拉丁劲弩手】Arbalester 劲弩手（8方向，AoE2 DE SLD 素材，u_arc_arbalest）
        'arbalest': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARBALEST/death_${dir}.png`),
        },
        // 【朝鲜精锐黑光铠骑兵】Heavy Hei Kuang 重装黑光铠（8方向，AoE2 DE SLD 素材，u_cav_hei_kuang_heavy）
        'hei_kuang_heavy': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG_HEAVY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG_HEAVY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG_HEAVY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG_HEAVY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEI_KUANG_HEAVY/death_${dir}.png`),
        },
        // 【草原精锐蒙古突骑】Elite Mangudai 精锐蒙古弓骑（8方向，AoE2 DE SLD 素材，u_cav_mangudai_elite；弓骑有射击）
        'mangudai_elite': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGUDAI_ELITE/death_${dir}.png`),
        },
        // 【西域帕提尤达长弓手】Pattiyodha Longbowman 斯里兰卡长弓手（8方向，AoE2 DE SLD 素材，u_arc_pattiyoda_longbowman）
        'pattiyoda_longbowman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PATTIYODA_LONGBOWMAN/death_${dir}.png`),
        },
        // 【岭南皮甲战象】Armored Elephant 装甲战象（8方向，AoE2 DE SLD 素材，u_ele_armored_elephant）
        'armored_elephant': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARMORED_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARMORED_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARMORED_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARMORED_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARMORED_ELEPHANT/death_${dir}.png`),
        },
        // 【滇缅重弩战象】Ballista Elephant 弩炮战象（8方向，AoE2 DE SLD 素材，u_ele_ballista_elephant；远程弩炮）
        'ballista_elephant': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BALLISTA_ELEPHANT/death_${dir}.png`),
        },
        // 【滇缅骑象射手】Elephant Archer 象背弓手（8方向，AoE2 DE SLD 素材，u_ele_elephant_archer；远程象背射击）
        'elephant_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELEPHANT_ARCHER/death_${dir}.png`),
        },
        // 【岭南精锐藤弓兵】Elite Rattan Archer 精锐藤甲弓手（8方向，AoE2 DE SLD 素材，u_arc_rattanarcher_elite）
        'rattan_archer_elite': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATTAN_ARCHER_ELITE/death_${dir}.png`),
        },
        // 【斯拉夫罗马军】Legionary 罗马军团步兵（8方向，AoE2 DE SLD 素材，u_inf_legionary）
        'legionary': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEGIONARY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEGIONARY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEGIONARY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEGIONARY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEGIONARY/death_${dir}.png`),
        },
        // 【中原/江南剑士】DE 吴国刀剑手（2026-08-16 主人定：朝鲜/中原/江南剑士统一 DE 吴国刀剑手）
        'swordsman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDSMAN/death_${dir}.png`),
        },
        // 【枪兵长】Kamayuk 长枪步兵（8方向，AoE2 DE SLD 素材，u_inf_kamayuk）
        'kamayuk': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KAMAYUK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KAMAYUK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KAMAYUK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KAMAYUK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KAMAYUK/death_${dir}.png`),
        },
        // 【滇缅精锐爪刀勇士】Elite Karambit Warrior 马来爪刀近战步兵（8方向，AoE2 DE SLD 素材，u_inf_karambitwarrior_elite）
        'karambit_warrior_elite': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR_ELITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR_ELITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR_ELITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR_ELITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KARAMBIT_WARRIOR_ELITE/death_${dir}.png`),
        },
        // ── 各文化圈专属历史战舰（对照 DE & 史实） ────────────────
        'ELITE_CARAVEL': {
            // 西班牙无敌舰队精锐
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_CARAVEL/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_CARAVEL/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_CARAVEL/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_CARAVEL/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_CARAVEL/death_${d}.png`),
        },
        'BIREME': {
            // 腓尼基双列桨（阿契美尼德）（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/BIREME/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/BIREME/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/BIREME/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/BIREME/idle_${d}.png`),
            DEATH: [],
        },
        'DEMO_RAFT': {
            // 内陆渡河木筏（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DEMO_RAFT/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DEMO_RAFT/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DEMO_RAFT/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DEMO_RAFT/idle_${d}.png`),
            DEATH: [],
        },
        'ELITE_LONGBOAT': {
            // 盖尔长船（凯尔特）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_LONGBOAT/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_LONGBOAT/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_LONGBOAT/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_LONGBOAT/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ELITE_LONGBOAT/death_${d}.png`),
        },
        'FIRE_GALLEY': {
            // 黎凡特-红海火攻快船（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_GALLEY/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_GALLEY/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_GALLEY/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_GALLEY/idle_${d}.png`),
            DEATH: [],
        },
        'GALLEON': {
            // 威尼斯/热那亚大帆船（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEON/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEON/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEON/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEON/idle_${d}.png`),
            DEATH: [],
        },
        'GALLEY': {
            // 金人水军小型战船（东北）（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEY/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEY/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEY/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/GALLEY/idle_${d}.png`),
            DEATH: [],
        },
        'HEAVY_INCENDIARY_SHIP': {
            // 伊洛瓦底江重型内河战船（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_INCENDIARY_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_INCENDIARY_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_INCENDIARY_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_INCENDIARY_SHIP/idle_${d}.png`),
            DEATH: [],
        },
        'HEAVY_LEMBOS': {
            // 哥特/汪达尔重型伦博斯（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_LEMBOS/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_LEMBOS/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_LEMBOS/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HEAVY_LEMBOS/idle_${d}.png`),
            DEATH: [],
        },
        'HULK': {
            // 北海-波罗的海柯克船（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HULK/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HULK/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HULK/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/HULK/idle_${d}.png`),
            DEATH: [],
        },
        'INCENDIARY_SHIP': {
            // 火攻艨艟（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/INCENDIARY_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/INCENDIARY_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/INCENDIARY_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/INCENDIARY_SHIP/idle_${d}.png`),
            DEATH: [],
        },
        'LEMBOS': {
            // 黑海-多瑙河轻型伦博斯（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LEMBOS/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LEMBOS/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LEMBOS/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LEMBOS/idle_${d}.png`),
            DEATH: [],
        },
        'LONGBOAT': {
            // 维京龙首长船
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LONGBOAT/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LONGBOAT/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LONGBOAT/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LONGBOAT/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LONGBOAT/death_${d}.png`),
        },
        'MONOREME': {
            // 罗斯独木船队（斯拉夫）（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MONOREME/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MONOREME/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MONOREME/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MONOREME/idle_${d}.png`),
            DEATH: [],
        },
        'WAR_GALLEY': {
            // 地中海桨帆战船（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_GALLEY/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_GALLEY/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_GALLEY/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_GALLEY/idle_${d}.png`),
            DEATH: [],
        },
        'WAR_HULK': {
            // 英王柯克战船（不列颠）（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_HULK/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_HULK/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_HULK/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_HULK/idle_${d}.png`),
            DEATH: [],
        },
        'WAR_LEMBOS': {
            // 马其顿伦博斯突击舰（DE 素材无 death 动作）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_LEMBOS/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_LEMBOS/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_LEMBOS/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/WAR_LEMBOS/idle_${d}.png`),
            DEATH: [],
        },
        'LOU_CHUAN': {
            // 中国古代大型楼船（中华各区）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LOU_CHUAN/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LOU_CHUAN/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LOU_CHUAN/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LOU_CHUAN/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/LOU_CHUAN/death_${d}.png`),
        },
        'TURTLE_SHIP': {
            // 朝鲜李朝龟甲船（高丽）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TURTLE_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TURTLE_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TURTLE_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TURTLE_SHIP/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TURTLE_SHIP/death_${d}.png`),
        },
        'DRAGON_SHIP': {
            // 维京龙头长船（北欧/蛮族/草原）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DRAGON_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DRAGON_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DRAGON_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DRAGON_SHIP/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DRAGON_SHIP/death_${d}.png`),
        },
        'DROMON': {
            // 希腊火德罗蒙重型战舰（拜占庭/东欧）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DROMON/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DROMON/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DROMON/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DROMON/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/DROMON/death_${d}.png`),
        },
        'TRIREME': {
            // 古典三列桨座战船（希腊城邦）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TRIREME/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TRIREME/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TRIREME/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/TRIREME/idle_${d}.png`),
            DEATH: [],
        },
        'THIRISADAI': {
            // 达罗毗荼多桅楼船（南亚/印度）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/THIRISADAI/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/THIRISADAI/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/THIRISADAI/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/THIRISADAI/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/THIRISADAI/death_${d}.png`),
        },
        'CARAVEL': {
            // 卡拉维尔帆船（西班牙/葡萄牙）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARAVEL/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARAVEL/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARAVEL/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARAVEL/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARAVEL/death_${d}.png`),
        },
        'CARRACK': {
            // 克拉克高舷战舰（西欧/中欧）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARRACK/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARRACK/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARRACK/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CARRACK/idle_${d}.png`),
            DEATH: [],
        },
        'FIRE_SHIP': {
            // 重型突击喷火船（中东/阿拉伯/波斯/北非）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FIRE_SHIP/idle_${d}.png`),
            DEATH: [],
        },
        'CANOE': {
            // 美洲原住民武装独木战舟（美洲）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CANOE/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CANOE/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CANOE/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CANOE/idle_${d}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/CANOE/death_${d}.png`),
        },
        'MERCHANT_SHIP': {
            // 帆布商船（民用贸易商船）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MERCHANT_SHIP/idle_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MERCHANT_SHIP/idle_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MERCHANT_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/MERCHANT_SHIP/idle_${d}.png`),
            DEATH: [],
        },
        'ANT_WAR_GALLEY': {
            // 日本安宅战船（日本）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ANT_WAR_GALLEY/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ANT_WAR_GALLEY/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ANT_WAR_GALLEY/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/ANT_WAR_GALLEY/idle_${d}.png`),
            DEATH: [],
        },
        'FAST_FIRE_SHIP': {
            // 东南亚快速突击战船（东南亚）
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FAST_FIRE_SHIP/move_${d}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FAST_FIRE_SHIP/attack_${d}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FAST_FIRE_SHIP/idle_${d}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(d => `/SUCAI/FAST_FIRE_SHIP/idle_${d}.png`),
            DEATH: [],
        },
        // 【马其顿方阵】Macedonian Phalanx（8方向萨里沙超长矛方阵）
        // 【马其顿伙友重骑兵】Companion Cavalry（8方向突骑）
        'companion_cavalry': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPANION_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPANION_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPANION_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPANION_CAVALRY/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/COMPANION_CAVALRY/death_${dir}.png`),
        },
        // 【克里特弓箭手 / 希腊轻步兵】Cretan Archer
        'cretan_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/damage_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/death_${dir}.png`),
        },
        // 【罗马军团步兵】Roman Legionary（8方向方盾重步兵）
        // 【华夏具装铁骑 / 玄甲军】Huaxia Iron Cavalry（8方向具装重骑）
        // 【草原游牧骑射手 / 曼古歹】Steppe Horse Archer（8方向回身射箭弓骑）
        // 【华夏神臂弩手 / 强弩兵】Huaxia Crossbow（8方向重弩）
        'amazon_archer': {
            // 【亚马逊弓手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONARCHER/death_${dir}.png`),
        },
        'amazon_warrior': {
            // 【亚马逊战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/AMAZONWARRIOR/death_${dir}.png`),
        },
        'bactrian_archer': {
            // 【巴克特里亚弓手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BACTRIAN_ARCHER/death_${dir}.png`),
        },
        'battle_elephant': {
            // 【战斗象】AoE2 DE 素材，2026-08-17 补全接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTLEELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTLEELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTLEELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTLEELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTLEELEPHANT/death_${dir}.png`),
        },
        'bayinnaung_elephant': {
            // 【莽应龙英雄战象】AoE2 DE 素材，2026-08-17 补全接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BAYINNAUNG_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BAYINNAUNG_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BAYINNAUNG_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BAYINNAUNG_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BAYINNAUNG_ELEPHANT/death_${dir}.png`),
        },
        'battering_ram': {
            // 【攻城槌】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTERINGRAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTERINGRAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTERINGRAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTERINGRAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BATTERINGRAM/death_${dir}.png`),
        },
        'berserk': {
            // 【狂战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERSERK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERSERK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERSERK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERSERK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERSERK/death_${dir}.png`),
        },
        'blackwood_archer': {
            // 【黑木弓手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BLACKWOODARCHER/death_${dir}.png`),
        },
        'bolas_rider': {
            // 【流星锤骑手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOLASRIDER/death_${dir}.png`),
        },
        'bombard_cannon': {
            // 【火炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOMBARDCANNON/death_${dir}.png`),
        },
        'camel_archer': {
            // 【骆驼弓骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELARCHER/death_${dir}.png`),
        },
        'camel_raider': {
            // 【骆驼突袭者】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_RAIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_RAIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_RAIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_RAIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMEL_RAIDER/death_${dir}.png`),
        },
        'camel_rider': {
            // 【骆驼兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELRIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELRIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELRIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELRIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELRIDER/death_${dir}.png`),
        },
        'camel_scout': {
            // 【骆驼斥候】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELSCOUT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELSCOUT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELSCOUT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELSCOUT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAMELSCOUT/death_${dir}.png`),
        },
        'capped_ram': {
            // 【覆甲攻城槌】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAPPEDRAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAPPEDRAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAPPEDRAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAPPEDRAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAPPEDRAM/death_${dir}.png`),
        },
        'cataphract': {
            // 【甲胄骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPHRACT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPHRACT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPHRACT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPHRACT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPHRACT/death_${dir}.png`),
        },
        'centurion': {
            // 【百夫长】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CENTURION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CENTURION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CENTURION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CENTURION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CENTURION/death_${dir}.png`),
        },
        'chakram_thrower': {
            // 【ChakramThrower】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAKRAMTHROWER/death_${dir}.png`),
        },
        'champion_runner': {
            // 【冠军剑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/death_${dir}.png`),
        },
        'champion_scout': {
            // 【冠军剑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/death_${dir}.png`),
        },
        'condottiero': {
            // 【雇佣军】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONDOTTIERO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONDOTTIERO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONDOTTIERO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONDOTTIERO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONDOTTIERO/death_${dir}.png`),
        },
        'conquistador': {
            // 【征服者】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CONQUISTADOR/death_${dir}.png`),
        },
        'eagle_scout': {
            // 【鹰斥候】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLESCOUT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLESCOUT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLESCOUT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLESCOUT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLESCOUT/death_${dir}.png`),
        },
        'eagle_warrior': {
            // 【鹰勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLEWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLEWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLEWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLEWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EAGLEWARRIOR/death_${dir}.png`),
        },
        'dagnajan_elephant': {
            // 【达格纳詹英雄战象】AoE2 DE 素材，2026-08-17 补全接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAGNAJAN_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAGNAJAN_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAGNAJAN_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAGNAJAN_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAGNAJAN_ELEPHANT/death_${dir}.png`),
        },
        'ekdromos': {
            // 【埃克德罗摩斯】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EKDROMOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EKDROMOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EKDROMOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EKDROMOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EKDROMOS/death_${dir}.png`),
        },
        'elite_arambai': {
            // 【精锐阿兰拜】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARAMBAI/death_${dir}.png`),
        },
        'elite_ballista_elephant': {
            // 【EliteBallistaElephant】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBALLISTAELEPHANT/death_${dir}.png`),
        },
        'elite_battle_elephant': {
            // 【EliteBattleElephant】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBATTLEELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBATTLEELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBATTLEELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBATTLEELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBATTLEELEPHANT/death_${dir}.png`),
        },
        'elite_berserk': {
            // 【精锐狂战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBERSERK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBERSERK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBERSERK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBERSERK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBERSERK/death_${dir}.png`),
        },
        'elite_blackwood_archer': {
            // 【精锐黑木弓手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBLACKWOODARCHER/death_${dir}.png`),
        },
        'elite_bolas_rider': {
            // 【精锐流星锤骑手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOLASRIDER/death_${dir}.png`),
        },
        'elite_boyar': {
            // 【EliteBoyar】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOYAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOYAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOYAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOYAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEBOYAR/death_${dir}.png`),
        },
        'elite_camel_archer': {
            // 【精锐骆驼弓骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECAMELARCHER/death_${dir}.png`),
        },
        'elite_cataphract': {
            // 【精锐甲胄骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECATAPHRACT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECATAPHRACT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECATAPHRACT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECATAPHRACT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECATAPHRACT/death_${dir}.png`),
        },
        'elite_centurion': {
            // 【精锐百夫长】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECENTURION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECENTURION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECENTURION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECENTURION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECENTURION/death_${dir}.png`),
        },
        'elite_chakram_thrower': {
            // 【EliteChakramThrower】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAKRAMTHROWER/death_${dir}.png`),
        },
        'elite_champi_warrior': {
            // 【EliteChampiWarrior】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAMPIWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAMPIWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAMPIWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAMPIWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECHAMPIWARRIOR/death_${dir}.png`),
        },
        'elite_conquistador': {
            // 【精锐征服者】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECONQUISTADOR/death_${dir}.png`),
        },
        'elite_coustillier': {
            // 【EliteCoustillier】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECOUSTILLIER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECOUSTILLIER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECOUSTILLIER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECOUSTILLIER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITECOUSTILLIER/death_${dir}.png`),
        },
        'elite_eagle_warrior': {
            // 【精锐鹰勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEEAGLEWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEEAGLEWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEEAGLEWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEEAGLEWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEEAGLEWARRIOR/death_${dir}.png`),
        },
        'elite_elephant_archer': {
            // 【EliteElephantArcher】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEELEPHANTARCHER/death_${dir}.png`),
        },
        'elite_gbeto': {
            // 【精锐格贝托】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGBETO/death_${dir}.png`),
        },
        'elite_genitour': {
            // 【精锐杰尼图】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENITOUR/death_${dir}.png`),
        },
        'elite_genoese_crossbowman': {
            // 【精锐热那亚弩手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGENOESECROSSBOWMAN/death_${dir}.png`),
        },
        'elite_ghulam': {
            // 【精锐古拉姆】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGHULAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGHULAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGHULAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGHULAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGHULAM/death_${dir}.png`),
        },
        'elite_guecha_warrior': {
            // 【精锐格查战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEGUECHAWARRIOR/death_${dir}.png`),
        },
        'elite_huskarl': {
            // 【精锐哥特近卫军】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSKARL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSKARL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSKARL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSKARL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSKARL/death_${dir}.png`),
        },
        'elite_hussite_wagon': {
            // 【精锐胡斯战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEHUSSITEWAGON/death_${dir}.png`),
        },
        'elite_ibirapema_warrior': {
            // 【EliteIbirapemaWarrior】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIBIRAPEMAWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIBIRAPEMAWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIBIRAPEMAWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIBIRAPEMAWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIBIRAPEMAWARRIOR/death_${dir}.png`),
        },
        'elite_iron_pagoda': {
            // 【EliteIronPagoda】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIRONPAGODA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIRONPAGODA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIRONPAGODA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIRONPAGODA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEIRONPAGODA/death_${dir}.png`),
        },
        'elite_jaguar_warrior': {
            // 【精锐美洲豹勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJAGUARWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJAGUARWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJAGUARWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJAGUARWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJAGUARWARRIOR/death_${dir}.png`),
        },
        'elite_janissary': {
            // 【精锐苏丹亲兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEJANISSARY/death_${dir}.png`),
        },
        'elite_kamayuk': {
            // 【EliteKamayuk】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKAMAYUK/death_${dir}.png`),
        },
        'elite_keshik': {
            // 【EliteKeshik】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKESHIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKESHIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKESHIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKESHIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKESHIK/death_${dir}.png`),
        },
        'elite_kona': {
            // 【精锐科纳】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONA/death_${dir}.png`),
        },
        'elite_konnik': {
            // 【精锐骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONNIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONNIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONNIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONNIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEKONNIK/death_${dir}.png`),
        },
        'elite_konnik_foot': {
            // 【精锐下马骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEFOOTKONNIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEFOOTKONNIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEFOOTKONNIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEFOOTKONNIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEFOOTKONNIK/death_${dir}.png`),
        },
        'elite_leitis': {
            // 【精锐列提斯】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITELEITIS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITELEITIS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITELEITIS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITELEITIS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITELEITIS/death_${dir}.png`),
        },
        'elite_magyar_huszar': {
            // 【精锐马扎尔骠骑】AoE2 DE 素材，2026-08-25 补齐
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAGYARHUSZAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAGYARHUSZAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAGYARHUSZAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAGYARHUSZAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAGYARHUSZAR/death_${dir}.png`),
        },
        'elite_mameluke': {
            // 【精锐马穆鲁克】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMAMELUKE/death_${dir}.png`),
        },
        'elite_monaspa': {
            // 【精锐莫纳斯帕】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMONASPA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMONASPA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMONASPA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMONASPA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEMONASPA/death_${dir}.png`),
        },
        'elite_obuch': {
            // 【精锐奥布奇】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEOBUCH/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEOBUCH/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEOBUCH/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEOBUCH/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEOBUCH/death_${dir}.png`),
        },
        'elite_organ_gun': {
            // 【精锐风琴炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEORGANGUN/death_${dir}.png`),
        },
        'elite_plumed_archer': {
            // 【精锐羽箭手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEPLUMEDARCHER/death_${dir}.png`),
        },
        'elite_ratha_melee': {
            // 【精锐拉塔战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHAMELEE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHAMELEE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHAMELEE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHAMELEE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHAMELEE/death_${dir}.png`),
        },
        'elite_ratha_ranged': {
            // 【精锐拉塔战车（弓）】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITERATHARANGED/death_${dir}.png`),
        },
        'elite_scythian_horse_archer': {
            // 【精锐斯基泰骑射手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/death_${dir}.png`),
        },
        'elite_serjeant': {
            // 【精锐军士长】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESERJEANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESERJEANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESERJEANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESERJEANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESERJEANT/death_${dir}.png`),
        },
        'elite_shotel_warrior': {
            // 【精锐弯刀勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHOTELWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHOTELWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHOTELWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHOTELWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHOTELWARRIOR/death_${dir}.png`),
        },
        'elite_shrivamsha_rider': {
            // 【精锐什里瓦姆沙骑手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHRIVAMSHARIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHRIVAMSHARIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHRIVAMSHARIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHRIVAMSHARIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESHRIVAMSHARIDER/death_${dir}.png`),
        },
        'elite_skirmisher': {
            // 【精锐掷矛手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITESKIRMISHER/death_${dir}.png`),
        },
        'elite_temple_guard': {
            // 【精锐神庙守卫】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEMPLEGUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEMPLEGUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEMPLEGUARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEMPLEGUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEMPLEGUARD/death_${dir}.png`),
        },
        'elite_teutonic_knight': {
            // 【精锐条顿骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEUTONICKNIGHT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEUTONICKNIGHT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEUTONICKNIGHT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEUTONICKNIGHT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETEUTONICKNIGHT/death_${dir}.png`),
        },
        'elite_throwing_axeman': {
            // 【EliteThrowingAxeman】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETHROWINGAXEMAN/death_${dir}.png`),
        },
        'elite_tiger_cavalry': {
            // 【EliteTigerCavalry】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETIGERCAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETIGERCAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETIGERCAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETIGERCAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITETIGERCAVALRY/death_${dir}.png`),
        },
        'elite_urumi_swordsman': {
            // 【精锐乌拉米剑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEURUMISWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEURUMISWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEURUMISWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEURUMISWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEURUMISWORDSMAN/death_${dir}.png`),
        },
        'elite_war_chariot': {
            // 【精锐战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WAR_CHARIOT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WAR_CHARIOT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WAR_CHARIOT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WAR_CHARIOT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_WAR_CHARIOT/death_${dir}.png`),
        },
        'elite_war_dog': {
            // 【精锐军犬】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARDOG/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARDOG/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARDOG/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARDOG/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARDOG/death_${dir}.png`),
        },
        'elite_war_elephant': {
            // 【EliteWarElephant】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARELEPHANT/death_${dir}.png`),
        },
        'elite_war_wagon': {
            // 【精锐战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWARWAGON/death_${dir}.png`),
        },
        'elite_woad_raider': {
            // 【精锐靛蓝突袭者】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWOADRAIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWOADRAIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWOADRAIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWOADRAIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEWOADRAIDER/death_${dir}.png`),
        },
        'flaming_camel': {
            // 【火焰骆驼】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMINGCAMEL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMINGCAMEL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMINGCAMEL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMINGCAMEL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMINGCAMEL/death_${dir}.png`),
        },
        'flemish_pikeman': {
            // 【佛兰德长枪兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN/death_${dir}.png`),
        },
        'flemish_pikeman_f': {
            // 【佛兰德长枪兵F】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN_F/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN_F/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN_F/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN_F/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLEMISHPIKEMAN_F/death_${dir}.png`),
        },
        'gbeto': {
            // 【格贝托】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GBETO/death_${dir}.png`),
        },
        'genitour': {
            // 【杰尼图】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENITOUR/death_${dir}.png`),
        },
        'genoese_crossbowman': {
            // 【热那亚弩手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENOESECROSSBOWMAN/death_${dir}.png`),
        },
        'ghulam': {
            // 【古拉姆】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GHULAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GHULAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GHULAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GHULAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GHULAM/death_${dir}.png`),
        },
        'greek_noble_cavalry': {
            // 【希腊贵族骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GREEK_NOBLE_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GREEK_NOBLE_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GREEK_NOBLE_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GREEK_NOBLE_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GREEK_NOBLE_CAVALRY/death_${dir}.png`),
        },
        'grenadier': {
            // 【掷弹兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GRENADIER/death_${dir}.png`),
        },
        'guecha_warrior': {
            // 【格查战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUECHAWARRIOR/death_${dir}.png`),
        },
        'hand_cannoneer': {
            // 【手炮手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HANDCANNONEER/death_${dir}.png`),
        },
        'heavy_rocket_cart': {
            // 【重型火箭车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYROCKETCART/death_${dir}.png`),
        },
        'heavy_scorpion': {
            // 【重型弩炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVYSCORPION/death_${dir}.png`),
        },
        'hill_tribesman': {
            // 【山地部落民】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HILL_TRIBESMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HILL_TRIBESMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HILL_TRIBESMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HILL_TRIBESMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HILL_TRIBESMAN/death_${dir}.png`),
        },
        'hippeus': {
            // 【希皮乌斯】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HIPPEUS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HIPPEUS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HIPPEUS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HIPPEUS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HIPPEUS/death_${dir}.png`),
        },
        'hoplite': {
            // 【希腊重装步兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOPLITE/death_${dir}.png`),
        },
        'houfnice': {
            // 【榴弹炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HOUFNICE/death_${dir}.png`),
        },
        'huskarl': {
            // 【哥特近卫军】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSKARL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSKARL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSKARL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSKARL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSKARL/death_${dir}.png`),
        },
        'hussar': {
            // 【骠骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSAR/death_${dir}.png`),
        },
        'hussite_wagon': {
            // 【胡斯战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUSSITEWAGON/death_${dir}.png`),
        },
        'ibirapema_warrior': {
            // 【IbirapemaWarrior】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IBIRAPEMAWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IBIRAPEMAWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IBIRAPEMAWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IBIRAPEMAWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IBIRAPEMAWARRIOR/death_${dir}.png`),
        },
        'immortal': {
            // 【不死军】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMMORTAL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMMORTAL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMMORTAL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMMORTAL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMMORTAL/death_${dir}.png`),
        },
        'immortal_ranged': {
            // 【不死军弓手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RANGED_IMMORTAL/death_${dir}.png`),
        },
        'imperial_camel_rider': {
            // 【印度斯坦帝王骆驼骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCAMELRIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCAMELRIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCAMELRIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCAMELRIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCAMELRIDER/death_${dir}.png`),
        },
        'imperial_centurion': {
            // 【帝王百夫长】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCENTURION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCENTURION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCENTURION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCENTURION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IMPERIALCENTURION/death_${dir}.png`),
        },
        'indian_tribesman': {
            // 【印度部落民】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INDIAN_TRIBESMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INDIAN_TRIBESMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INDIAN_TRIBESMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INDIAN_TRIBESMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INDIAN_TRIBESMAN/death_${dir}.png`),
        },
        'iroquois_warrior': {
            // 【易洛魁战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IROQUOISWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IROQUOISWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IROQUOISWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IROQUOISWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IROQUOISWARRIOR/death_${dir}.png`),
        },
        'jaguar_warrior': {
            // 【美洲豹勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JAGUARWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JAGUARWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JAGUARWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JAGUARWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JAGUARWARRIOR/death_${dir}.png`),
        },
        'janissary': {
            // 【苏丹亲兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANISSARY/death_${dir}.png`),
        },
        'knight': {
            // 【骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KNIGHT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KNIGHT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KNIGHT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KNIGHT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KNIGHT/death_${dir}.png`),
        },
        'kona': {
            // 【科纳】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONA/death_${dir}.png`),
        },
        'konnik': {
            // 【骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONNIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONNIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONNIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONNIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KONNIK/death_${dir}.png`),
        },
        'konnik_foot': {
            // 【下马骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FOOTKONNIK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FOOTKONNIK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FOOTKONNIK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FOOTKONNIK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FOOTKONNIK/death_${dir}.png`),
        },
        'leitis': {
            // 【列提斯】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEITIS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEITIS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEITIS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEITIS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEITIS/death_${dir}.png`),
        },
        'longbowman': {
            // 【长弓兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOWMAN/death_${dir}.png`),
        },
        'magyar_huszar': {
            // 【马扎尔骠骑】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAGYARHUSZAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAGYARHUSZAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAGYARHUSZAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAGYARHUSZAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAGYARHUSZAR/death_${dir}.png`),
        },
        'mameluke': {
            // 【马穆鲁克】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MAMELUKE/death_${dir}.png`),
        },
        'mangonel': {
            // 【投石车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANGONEL/death_${dir}.png`),
        },
        'mercenary_hoplite': {
            // 【雇佣重装步兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_HOPLITE/death_${dir}.png`),
        },
        'militia': {
            // 【民兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MILITIA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MILITIA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MILITIA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MILITIA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MILITIA/death_${dir}.png`),
        },
        'monaspa': {
            // 【莫纳斯帕】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONASPA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONASPA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONASPA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONASPA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONASPA/death_${dir}.png`),
        },
        'mounted_trebuchet': {
            // 【骑乘投石机】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTEDTREBUCHET/death_${dir}.png`),
        },
        'obuch': {
            // 【奥布奇】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OBUCH/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OBUCH/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OBUCH/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OBUCH/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OBUCH/death_${dir}.png`),
        },
        'onager': {
            // 【轻型投石车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER/death_${dir}.png`),
        },
        'organ_gun': {
            // 【风琴炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ORGANGUN/death_${dir}.png`),
        },
        'petard': {
            // 【爆破兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PETARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PETARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PETARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PETARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PETARD/death_${dir}.png`),
        },
        'phalangite': {
            // 【马其顿方阵兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHALANGITE/death_${dir}.png`),
        },
        'plumed_archer': {
            // 【羽箭手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PLUMEDARCHER/death_${dir}.png`),
        },
        'porus_elephant': {
            // 【波鲁斯王英雄战象】AoE2 DE 素材，2026-08-17 补全接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PORUS_ELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PORUS_ELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PORUS_ELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PORUS_ELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PORUS_ELEPHANT/death_${dir}.png`),
        },
        'qizilbash_warrior': {
            // 【克孜尔巴什】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QIZILBASHWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QIZILBASHWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QIZILBASHWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QIZILBASHWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QIZILBASHWARRIOR/death_${dir}.png`),
        },
        'ratha_melee': {
            // 【拉塔战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHAMELEE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHAMELEE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHAMELEE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHAMELEE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHAMELEE/death_${dir}.png`),
        },
        'ratha_ranged': {
            // 【拉塔战车（弓）】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RATHARANGED/death_${dir}.png`),
        },
        'rhodian_slinger': {
            // 【罗得岛投石兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHODIAN_SLINGER/death_${dir}.png`),
        },
        'rhomphaia_warrior': {
            // 【龙牙战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHOMPHAIA_WARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHOMPHAIA_WARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHOMPHAIA_WARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHOMPHAIA_WARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RHOMPHAIA_WARRIOR/death_${dir}.png`),
        },
        'rocket_cart': {
            // 【火箭车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROCKETCART/death_${dir}.png`),
        },
        'royal_janissary': {
            // 【皇家苏丹亲兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROYALJANISSARY/death_${dir}.png`),
        },
        'sacred_band': {
            // 【圣队】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SACRED_BAND/death_${dir}.png`),
        },
        'sannahya': {
            // 【桑纳亚】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SANNAHYA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SANNAHYA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SANNAHYA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SANNAHYA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SANNAHYA/death_${dir}.png`),
        },
        'scorpion': {
            // 【弩炮】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCORPION/death_${dir}.png`),
        },
        'scythian_axe_cavalry': {
            // 【斯基泰斧骑】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_AXE_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_AXE_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_AXE_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_AXE_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_AXE_CAVALRY/death_${dir}.png`),
        },
        'scythian_horse_archer': {
            // 【斯基泰骑射手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCYTHIAN_HORSE_ARCHER/death_${dir}.png`),
        },
        'serjeant': {
            // 【军士长】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SERJEANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SERJEANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SERJEANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SERJEANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SERJEANT/death_${dir}.png`),
        },
        'shotel_warrior': {
            // 【弯刀勇士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOTELWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOTELWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOTELWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOTELWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHOTELWARRIOR/death_${dir}.png`),
        },
        'shrivamsha_rider': {
            // 【什里瓦姆沙骑手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHRIVAMSHARIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHRIVAMSHARIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHRIVAMSHARIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHRIVAMSHARIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHRIVAMSHARIDER/death_${dir}.png`),
        },
        'sickle_warrior': {
            // 【镰刀战士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SICKLE_WARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SICKLE_WARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SICKLE_WARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SICKLE_WARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SICKLE_WARRIOR/death_${dir}.png`),
        },
        'elite_armored_elephant': {
            // 【精锐皮甲战象】AoE2 DE 素材，2026-08-17 补全接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARMOREDELEPHANT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARMOREDELEPHANT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARMOREDELEPHANT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARMOREDELEPHANT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITEARMOREDELEPHANT/death_${dir}.png`),
        },
        'siege_onager': {
            // 【重型投石车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGEONAGER/death_${dir}.png`),
        },
        'siege_ram': {
            // 【攻城槌】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGERAM/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGERAM/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGERAM/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGERAM/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGERAM/death_${dir}.png`),
        },
        'skirmisher': {
            // 【掷矛手】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SKIRMISHER/death_${dir}.png`),
        },
        'slinger': {
            // 【投石兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SLINGER/death_${dir}.png`),
        },
        'sogdian_cataphract': {
            // 【粟特甲胄骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOGDIANCATAPHRACT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOGDIANCATAPHRACT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOGDIANCATAPHRACT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOGDIANCATAPHRACT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SOGDIANCATAPHRACT/death_${dir}.png`),
        },
        'sparabara': {
            // 【斯帕拉巴拉】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPARABARA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPARABARA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPARABARA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPARABARA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPARABARA/death_${dir}.png`),
        },
        'spearman': {
            // 【长矛兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPEARMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPEARMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPEARMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPEARMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SPEARMAN/death_${dir}.png`),
        },
        'strategos': {
            // 【将军卫队】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STRATEGOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STRATEGOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STRATEGOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STRATEGOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STRATEGOS/death_${dir}.png`),
        },
        'sakan_axeman': {
            // 【塔卡巴拉】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAKAN_AXEMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAKAN_AXEMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAKAN_AXEMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAKAN_AXEMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SAKAN_AXEMAN/death_${dir}.png`),
        },
        'temple_guard': {
            // 【神庙守卫】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEMPLEGUARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEMPLEGUARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEMPLEGUARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEMPLEGUARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEMPLEGUARD/death_${dir}.png`),
        },
        'teutonic_knight': {
            // 【条顿骑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEUTONICKNIGHT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEUTONICKNIGHT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEUTONICKNIGHT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEUTONICKNIGHT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TEUTONICKNIGHT/death_${dir}.png`),
        },
        'tarantine_cavalry': {
            // 【塔兰丁骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARANTINE_CAVALRY/death_${dir}.png`),
        },
        'thracian_peltast': {
            // 【色雷斯轻装兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_PELTAST/death_${dir}.png`),
        },
        'traction_trebuchet': {
            // 【牵引投石机】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRACTIONTREBUCHET/death_${dir}.png`),
        },
        'two_handed_swordsman': {
            // 【双手剑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TWOHANDEDSWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TWOHANDEDSWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TWOHANDEDSWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TWOHANDEDSWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TWOHANDEDSWORDSMAN/death_${dir}.png`),
        },
        'urumi_swordsman': {
            // 【乌拉米剑士】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/URUMISWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/URUMISWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/URUMISWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/URUMISWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/URUMISWORDSMAN/death_${dir}.png`),
        },
        'war_chariot': {
            // 【战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_CHARIOT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_CHARIOT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_CHARIOT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_CHARIOT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_CHARIOT/death_${dir}.png`),
        },
        'war_chariot_ranged': {
            // 【远程战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARCHARIOT/death_${dir}.png`),
        },
        'war_dog': {
            // 【军犬】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARDOG/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARDOG/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARDOG/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARDOG/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARDOG/death_${dir}.png`),
        },
        'war_wagon': {
            // 【战车】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARWAGON/death_${dir}.png`),
        },
        'warrior_priest': {
            // 【战士祭司】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARRIORPRIEST/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARRIORPRIEST/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARRIORPRIEST/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARRIORPRIEST/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WARRIORPRIEST/death_${dir}.png`),
        },
        'winged_hussar': {
            // 【翼骑兵】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WINGEDHUSSAR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WINGEDHUSSAR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WINGEDHUSSAR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WINGEDHUSSAR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WINGEDHUSSAR/death_${dir}.png`),
        },
        'woad_raider': {
            // 【靛蓝突袭者】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WOADRAIDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WOADRAIDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WOADRAIDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WOADRAIDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WOADRAIDER/death_${dir}.png`),
        },
        'xolotl_warrior': {
            // 【XolotlWarrior】AoE2 DE 素材，2026-08-16 全兵种批量接入
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XOLOTLWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XOLOTLWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XOLOTLWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XOLOTLWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/XOLOTLWARRIOR/death_${dir}.png`),
        },
        'longswordsman': {
            // 【长剑士】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGSWORDSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGSWORDSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGSWORDSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGSWORDSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGSWORDSMAN/death_${dir}.png`),
        },
        'champi_warrior': {
            // 【尚皮勇士】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIWARRIOR/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIWARRIOR/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIWARRIOR/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIWARRIOR/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIWARRIOR/death_${dir}.png`),
        },
        'champi_runner': {
            // 【尚皮飞毛腿】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPIRUNNER/death_${dir}.png`),
        },
        'champi_scout': {
            // 【尚皮斥候】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CHAMPISCOUT/death_${dir}.png`),
        },
        'jian_swordman_unshielded': {
            // 【双手剑士(华夏)】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDMAN_UNSHIELDED/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDMAN_UNSHIELDED/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDMAN_UNSHIELDED/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDMAN_UNSHIELDED/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JIAN_SWORDMAN_UNSHIELDED/death_${dir}.png`),
        },
        'cavalier': {
            // 【重装骑士】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAVALIER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAVALIER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAVALIER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAVALIER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAVALIER/death_${dir}.png`),
        },

        'flamethrower': {
            // 【猛火油柜】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FLAMETHROWER/death_${dir}.png`),
        },
        'helepolis': {
            // 【赫勒波利斯巨型攻城塔】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HELEPOLIS/death_${dir}.png`),
        },
        'siege_tower': {
            // 【攻城塔】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGETOWER/death_${dir}.png`),
        },
        'recurve_bowman': {
            // 【反曲长弓手】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/attack_${dir}.png`),
            SHOOT: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RECURVE_BOWMAN/death_${dir}.png`),
        },
    },
    // 旧 public/assets/avg/NPC 与 /assets/NPC/ 三帧 PNG 已废弃（勿引用 avg/）。
    // 沙盒/map 军团贴图统一走 LEGION + UNIT_ASSETS（S10DB 八向）。
    GENERAL: {
        IDLE: '/SUCAI/S10B/42-1.png',
        MOVE: '/SUCAI/S10B/43-1.png',
        ATTACK: '/SUCAI/S10B/42-1.png',
        DAMAGE: '/SUCAI/S10B/92-1.png'
    },
    // 【装甲步兵】Man-at-Arms 剑士（8方向，AoE2 DE SLD 素材）
        'manatarms': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANATARMS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANATARMS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANATARMS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANATARMS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MANATARMS/death_${dir}.png`),
        },
        // 【华夏戟兵】华夏戟兵（Pikeman 同兵）（8方向，AoE2 DE SLD 素材）

        // 【精锐华夏戟兵】精锐华夏戟兵（Halberdier 同兵）（8方向，AoE2 DE SLD 素材）

        // 【巽他皇家战士】Sunda Royal Fighter（8方向，AoE2 DE SLD 素材）
        'sunda_royal_fighter': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDA_ROYAL_FIGHTER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDA_ROYAL_FIGHTER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDA_ROYAL_FIGHTER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDA_ROYAL_FIGHTER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDA_ROYAL_FIGHTER/death_${dir}.png`),
        },
        // 【和平使者】Envoy 使者（外交装饰，非战斗）（8方向，AoE2 DE SLD 素材）
        'envoy': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ENVOY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ENVOY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ENVOY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ENVOY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ENVOY/death_${dir}.png`),
        },
        // 【阿兹特克突袭者】阿兹特克突袭者（Xolotl Warrior 同兵）（8方向，AoE2 DE SLD 素材）

        // 【斥候骑兵】Scout Cavalry（8方向，AoE2 DE SLD 素材）
        'scout_cavalry': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCOUTCAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCOUTCAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCOUTCAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCOUTCAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SCOUTCAVALRY/death_${dir}.png`),
        },
        // 【轻骑兵】Light Cavalry（8方向，AoE2 DE SLD 素材）
        'light_cavalry': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHTCAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHTCAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHTCAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHTCAVALRY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIGHTCAVALRY/death_${dir}.png`),
        },
        // 【法兰克圣骑士】Frankish Paladin（8方向，AoE2 DE SLD 素材）
        'frankish_paladin': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FRANKISHPALADIN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FRANKISHPALADIN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FRANKISHPALADIN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FRANKISHPALADIN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FRANKISHPALADIN/death_${dir}.png`),
        },
        // 【首领骑士】Jarl（8方向，AoE2 DE SLD 素材）
        'jarl': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JARL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JARL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JARL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JARL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JARL/death_${dir}.png`),
        },
        // 【攻城床弩车】Ballista 弩炮（Scorpion 同兵）（8方向，AoE2 DE SLD 素材）
        'siege_ballista': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGE_BALLISTA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGE_BALLISTA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGE_BALLISTA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGE_BALLISTA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SIEGE_BALLISTA/death_${dir}.png`),
        },
        // 【强弩兵】Arbalester 劲弩手（8方向，AoE2 DE SLD 素材）
        // 【攻城战象】Armored Elephant 装甲战象（8方向，AoE2 DE SLD 素材）

        // 【桨帆船】8方向，AoE2 DE SLD 素材
        'galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEY/idle_${dir}.png`),
        },
        // 【大战舰】8方向，AoE2 DE SLD 素材
        'war_galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_GALLEY/idle_${dir}.png`),
        },
        // 【古典桨帆船】8方向，AoE2 DE SLD 素材
        'ant_galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_GALLEY/idle_${dir}.png`),
        },
        // 【古典大战舰】8方向，AoE2 DE SLD 素材
        'ant_war_galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_WAR_GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_WAR_GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_WAR_GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_WAR_GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_WAR_GALLEY/idle_${dir}.png`),
        },
        // 【古典桨帆船高级】8方向，AoE2 DE SLD 素材
        'ant_elite_galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_ELITE_GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_ELITE_GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_ELITE_GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_ELITE_GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_ELITE_GALLEY/idle_${dir}.png`),
        },
        // 【喷火桨帆船】8方向，AoE2 DE SLD 素材
        'fire_galley': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_GALLEY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_GALLEY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_GALLEY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_GALLEY/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_GALLEY/idle_${dir}.png`),
        },
        // 【喷火船】8方向，AoE2 DE SLD 素材
        'fire_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FIRE_SHIP/idle_${dir}.png`),
        },
        // 【快速喷火船】8方向，AoE2 DE SLD 素材
        'fast_fire_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FAST_FIRE_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FAST_FIRE_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FAST_FIRE_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FAST_FIRE_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/FAST_FIRE_SHIP/idle_${dir}.png`),
        },
        // 【燃烧战船】8方向，AoE2 DE SLD 素材
        'incendiary_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_SHIP/idle_${dir}.png`),
        },
        // 【重型燃烧战船】8方向，AoE2 DE SLD 素材
        'heavy_incendiary_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_INCENDIARY_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_INCENDIARY_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_INCENDIARY_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_INCENDIARY_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_INCENDIARY_SHIP/idle_${dir}.png`),
        },
        // 【炮舰】8方向，AoE2 DE SLD 素材
        'cannon_galleon': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANNON_GALLEON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANNON_GALLEON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANNON_GALLEON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANNON_GALLEON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANNON_GALLEON/idle_${dir}.png`),
        },
        // 【炮舰高级】8方向，AoE2 DE SLD 素材
        'elite_cannon_galleon': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CANNON_GALLEON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CANNON_GALLEON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CANNON_GALLEON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CANNON_GALLEON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CANNON_GALLEON/idle_${dir}.png`),
        },
        // 【卡拉维尔帆船】8方向，AoE2 DE SLD 素材
        'caravel': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARAVEL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARAVEL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARAVEL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARAVEL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARAVEL/death_${dir}.png`),
        },
        // 【卡拉维尔帆船高级】8方向，AoE2 DE SLD 素材
        'elite_caravel': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CARAVEL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CARAVEL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CARAVEL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CARAVEL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_CARAVEL/death_${dir}.png`),
        },
        // 【爆破舰】8方向，AoE2 DE SLD 素材
        'demo_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_SHIP/idle_${dir}.png`),
        },
        // 【重型爆破舰】8方向，AoE2 DE SLD 素材
        'heavy_demo_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_DEMO_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_DEMO_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_DEMO_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_DEMO_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_DEMO_SHIP/idle_${dir}.png`),
        },
        // 【维京长船】8方向，AoE2 DE SLD 素材
        'longboat': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOAT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOAT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOAT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOAT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LONGBOAT/death_${dir}.png`),
        },
        // 【维京长船高级】8方向，AoE2 DE SLD 素材
        'elite_longboat': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LONGBOAT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LONGBOAT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LONGBOAT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LONGBOAT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LONGBOAT/death_${dir}.png`),
        },
        // 【龟船】8方向，AoE2 DE SLD 素材
        'turtle_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TURTLE_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TURTLE_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TURTLE_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TURTLE_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TURTLE_SHIP/death_${dir}.png`),
        },
        // 【龟船高级】8方向，AoE2 DE SLD 素材
        'elite_turtle_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TURTLE_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TURTLE_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TURTLE_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TURTLE_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_TURTLE_SHIP/death_${dir}.png`),
        },
        // 【龙头战舰】8方向，AoE2 DE SLD 素材
        'dragon_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DRAGON_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DRAGON_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DRAGON_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DRAGON_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DRAGON_SHIP/death_${dir}.png`),
        },
        // 【提利萨代战舰】8方向，AoE2 DE SLD 素材
        'thirisadai': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THIRISADAI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THIRISADAI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THIRISADAI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THIRISADAI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THIRISADAI/death_${dir}.png`),
        },
        // 【投石舰】8方向，AoE2 DE SLD 素材
        'catapult_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_SHIP/idle_${dir}.png`),
        },
        // 【重型投石舰】8方向，AoE2 DE SLD 素材
        'onager_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER_SHIP/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER_SHIP/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER_SHIP/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ONAGER_SHIP/idle_${dir}.png`),
        },
        // 【英雄·亚拉里克】8方向，AoE2 DE SLD 素材
        'hero_alaric': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALARIC/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALARIC/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALARIC/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALARIC/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALARIC/death_${dir}.png`),
        },
        // 【英雄·阿尔吉尔达斯】8方向，AoE2 DE SLD 素材
        'hero_algirdas': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALGIRDAS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALGIRDAS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALGIRDAS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALGIRDAS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ALGIRDAS/death_${dir}.png`),
        },
        // 【英雄·阿拉里博亚】8方向，AoE2 DE SLD 素材
        'hero_arariboiamelee': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARARIBOIAMELEE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARARIBOIAMELEE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARARIBOIAMELEE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARARIBOIAMELEE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARARIBOIAMELEE/death_${dir}.png`),
        },
        // 【英雄·阿里斯塔哥拉斯】8方向，AoE2 DE SLD 素材
        'hero_aristagoras': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTAGORAS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTAGORAS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTAGORAS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTAGORAS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTAGORAS/death_${dir}.png`),
        },
        // 【英雄·阿里斯提德】8方向，AoE2 DE SLD 素材
        'hero_aristides': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTIDES/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTIDES/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTIDES/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTIDES/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARISTIDES/death_${dir}.png`),
        },
        // 【英雄·阿尔塔弗涅斯】8方向，AoE2 DE SLD 素材
        'hero_artaphernes': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARTAPHERNES/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARTAPHERNES/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARTAPHERNES/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARTAPHERNES/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ARTAPHERNES/death_${dir}.png`),
        },
        // 【英雄·阿陶尔夫】8方向，AoE2 DE SLD 素材
        'hero_ataulf': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATAULF/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATAULF/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATAULF/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATAULF/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATAULF/death_${dir}.png`),
        },
        // 【英雄·阿提拉】8方向，AoE2 DE SLD 素材
        'hero_attila': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATTILA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATTILA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATTILA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATTILA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ATTILA/death_${dir}.png`),
        },
        // 【英雄·巴西琉斯(皇帝)】8方向，AoE2 DE SLD 素材
        'hero_basileus': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BASILEUS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BASILEUS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BASILEUS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BASILEUS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BASILEUS/death_${dir}.png`),
        },
        // 【英雄·贝尔纳·德·阿马尼亚克】8方向，AoE2 DE SLD 素材
        'hero_bernardarmagnac': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERNARDARMAGNAC/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERNARDARMAGNAC/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERNARDARMAGNAC/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERNARDARMAGNAC/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BERNARDARMAGNAC/death_${dir}.png`),
        },
        // 【英雄·博希蒙德】8方向，AoE2 DE SLD 素材
        'hero_bohemond': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOHEMOND/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOHEMOND/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOHEMOND/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOHEMOND/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BOHEMOND/death_${dir}.png`),
        },
        // 【英雄·巴西达斯】8方向，AoE2 DE SLD 素材
        'hero_brasidas': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BRASIDAS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BRASIDAS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BRASIDAS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BRASIDAS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BRASIDAS/death_${dir}.png`),
        },
        // 【英雄·曹操】8方向，AoE2 DE SLD 素材
        'hero_caocao': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAOCAO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAOCAO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAOCAO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAOCAO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CAOCAO/death_${dir}.png`),
        },
        // 【英雄·克雷图斯】8方向，AoE2 DE SLD 素材
        'hero_cleitus': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CLEITUS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CLEITUS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CLEITUS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CLEITUS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CLEITUS/death_${dir}.png`),
        },
        // 【英雄·库曼酋长】8方向，AoE2 DE SLD 素材
        'hero_cumanchief': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUMANCHIEF/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUMANCHIEF/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUMANCHIEF/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUMANCHIEF/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUMANCHIEF/death_${dir}.png`),
        },
        // 【英雄·昆汉贝贝】8方向，AoE2 DE SLD 素材
        'hero_cunhambebe': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUNHAMBEBE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUNHAMBEBE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUNHAMBEBE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUNHAMBEBE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUNHAMBEBE/death_${dir}.png`),
        },
        // 【英雄·库西尤潘基】8方向，AoE2 DE SLD 素材
        'hero_cusiyupanqui': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUSIYUPANQUI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUSIYUPANQUI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUSIYUPANQUI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUSIYUPANQUI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CUSIYUPANQUI/death_${dir}.png`),
        },
        // 【英雄·戴菲德】8方向，AoE2 DE SLD 素材
        'hero_dafyddapgruffydd': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAFYDDAPGRUFFYDD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAFYDDAPGRUFFYDD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAFYDDAPGRUFFYDD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAFYDDAPGRUFFYDD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DAFYDDAPGRUFFYDD/death_${dir}.png`),
        },
        // 【英雄·达提斯】8方向，AoE2 DE SLD 素材
        'hero_datis': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DATIS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DATIS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DATIS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DATIS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DATIS/death_${dir}.png`),
        },
        // 【英雄·丁礼】8方向，AoE2 DE SLD 素材
        'hero_dinhle': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DINHLE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DINHLE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DINHLE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DINHLE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DINHLE/death_${dir}.png`),
        },
        // 【英雄·步战亚历山大】8方向，AoE2 DE SLD 素材
        'hero_dismounted_alexander': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DISMOUNTED_ALEXANDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DISMOUNTED_ALEXANDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DISMOUNTED_ALEXANDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DISMOUNTED_ALEXANDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DISMOUNTED_ALEXANDER/death_${dir}.png`),
        },
        // 【英雄·骑马亚历山大】8方向，AoE2 DE SLD 素材
        'hero_mounted_alexander': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTED_ALEXANDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTED_ALEXANDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTED_ALEXANDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTED_ALEXANDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MOUNTED_ALEXANDER/death_${dir}.png`),
        },
        // 【英雄·长腿爱德华】8方向，AoE2 DE SLD 素材
        'hero_edwardlongshanks': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EDWARDLONGSHANKS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EDWARDLONGSHANKS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EDWARDLONGSHANKS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EDWARDLONGSHANKS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/EDWARDLONGSHANKS/death_${dir}.png`),
        },
        // 【英雄·加查·马达】8方向，AoE2 DE SLD 素材
        'hero_gajahmada': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GAJAHMADA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GAJAHMADA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GAJAHMADA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GAJAHMADA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GAJAHMADA/death_${dir}.png`),
        },
        // 【英雄·加尔瓦里诺】8方向，AoE2 DE SLD 素材
        'hero_galvarino': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALVARINO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALVARINO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALVARINO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALVARINO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALVARINO/death_${dir}.png`),
        },
        // 【英雄·阿赖扬将军】8方向，AoE2 DE SLD 素材
        'hero_generalaraiyan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENERALARAIYAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENERALARAIYAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENERALARAIYAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENERALARAIYAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GENERALARAIYAN/death_${dir}.png`),
        },
        // 【英雄·吉达扬】8方向，AoE2 DE SLD 素材
        'hero_gidajan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIDAJAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIDAJAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIDAJAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIDAJAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIDAJAN/death_${dir}.png`),
        },
        // 【英雄·吉尔伯特】8方向，AoE2 DE SLD 素材
        'hero_gilbertdeclare': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GILBERTDECLARE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GILBERTDECLARE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GILBERTDECLARE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GILBERTDECLARE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GILBERTDECLARE/death_${dir}.png`),
        },
        // 【英雄·吉尔根汗】8方向，AoE2 DE SLD 素材
        'hero_girgenkhan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIRGENKHAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIRGENKHAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIRGENKHAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIRGENKHAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GIRGENKHAN/death_${dir}.png`),
        },
        // 【英雄·瓜科尔达】8方向，AoE2 DE SLD 素材
        'hero_guacolda': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUACOLDA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUACOLDA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUACOLDA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUACOLDA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUACOLDA/death_${dir}.png`),
        },
        // 【英雄·关羽】8方向，AoE2 DE SLD 素材
        'hero_guanyu': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GUANYU/death_${dir}.png`),
        },
        // 【英雄·伊瓦伊洛(骑马)】8方向，AoE2 DE SLD 素材
        'hero_ivaylo': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLO/death_${dir}.png`),
        },
        // 【英雄·伊瓦伊洛(步战)】8方向，AoE2 DE SLD 素材
        'hero_ivaylofoot': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLOFOOT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLOFOOT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLOFOOT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLOFOOT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/IVAYLOFOOT/death_${dir}.png`),
        },
        // 【英雄·扬·杰式卡】8方向，AoE2 DE SLD 素材
        'hero_janzizka': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANZIZKA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANZIZKA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANZIZKA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANZIZKA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JANZIZKA/death_${dir}.png`),
        },
        // 【英雄·圣女贞德(全甲战马)】8方向，AoE2 DE SLD 素材
        'hero_joanofarc': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANOFARC/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANOFARC/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANOFARC/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANOFARC/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANOFARC/death_${dir}.png`),
        },
        // 【英雄·奥尔良少女贞德】8方向，AoE2 DE SLD 素材
        'hero_joanthemaid': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANTHEMAID/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANTHEMAID/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANTHEMAID/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANTHEMAID/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOANTHEMAID/death_${dir}.png`),
        },
        // 【英雄·雅盖沃】8方向，AoE2 DE SLD 素材
        'hero_jogaila': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOGAILA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOGAILA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOGAILA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOGAILA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOGAILA/death_${dir}.png`),
        },
        // 【英雄·无畏的约翰】8方向，AoE2 DE SLD 素材
        'hero_johnthefearless': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOHNTHEFEARLESS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOHNTHEFEARLESS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOHNTHEFEARLESS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOHNTHEFEARLESS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/JOHNTHEFEARLESS/death_${dir}.png`),
        },
        // 【英雄·科斯图提斯】8方向，AoE2 DE SLD 素材
        'hero_kestutis': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESTUTIS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESTUTIS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESTUTIS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESTUTIS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KESTUTIS/death_${dir}.png`),
        },
        // 【英雄·忽炭汗】8方向，AoE2 DE SLD 素材
        'hero_kotyankhan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KOTYANKHAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KOTYANKHAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KOTYANKHAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KOTYANKHAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KOTYANKHAN/death_${dir}.png`),
        },
        // 【英雄·屈出律】8方向，AoE2 DE SLD 素材
        'hero_kushluk': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KUSHLUK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KUSHLUK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KUSHLUK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KUSHLUK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/KUSHLUK/death_${dir}.png`),
        },
        // 【英雄·劳塔罗】8方向，AoE2 DE SLD 素材
        'hero_lautaro': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAUTARO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAUTARO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAUTARO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAUTARO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LAUTARO/death_${dir}.png`),
        },
        // 【英雄·黎利】8方向，AoE2 DE SLD 素材
        'hero_leloi': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LELOI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LELOI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LELOI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LELOI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LELOI/death_${dir}.png`),
        },
        // 【英雄·刘备】8方向，AoE2 DE SLD 素材
        'hero_liubei': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIUBEI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIUBEI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIUBEI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIUBEI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LIUBEI/death_${dir}.png`),
        },
        // 【英雄·卢埃林】8方向，AoE2 DE SLD 素材
        'hero_llywelynapgruffydd': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LLYWELYNAPGRUFFYDD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LLYWELYNAPGRUFFYDD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LLYWELYNAPGRUFFYDD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LLYWELYNAPGRUFFYDD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LLYWELYNAPGRUFFYDD/death_${dir}.png`),
        },
        // 【英雄·吕布】8方向，AoE2 DE SLD 素材
        'hero_lubu': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LUBU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LUBU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LUBU/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LUBU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LUBU/death_${dir}.png`),
        },
        // 【英雄·吕山德】8方向，AoE2 DE SLD 素材
        'hero_lysander': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LYSANDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LYSANDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LYSANDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LYSANDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LYSANDER/death_${dir}.png`),
        },
        // 【英雄·马其顿指挥官】8方向，AoE2 DE SLD 素材
        'hero_macedonian_commander': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDONIAN_COMMANDER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDONIAN_COMMANDER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDONIAN_COMMANDER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDONIAN_COMMANDER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDONIAN_COMMANDER/death_${dir}.png`),
        },
        // 【英雄·奥斯曼一世】8方向，AoE2 DE SLD 素材
        'hero_osman': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OSMAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OSMAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OSMAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OSMAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/OSMAN/death_${dir}.png`),
        },
        // 【英雄·帕坎奇克】8方向，AoE2 DE SLD 素材
        'hero_pacanchique': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACANCHIQUE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACANCHIQUE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACANCHIQUE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACANCHIQUE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACANCHIQUE/death_${dir}.png`),
        },
        // 【英雄·帕查库特克】8方向，AoE2 DE SLD 素材
        'hero_pachacuti': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACHACUTI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACHACUTI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACHACUTI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACHACUTI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PACHACUTI/death_${dir}.png`),
        },
        // 【英雄·帕曼纽】8方向，AoE2 DE SLD 素材
        'hero_parmenion': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARMENION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARMENION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARMENION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARMENION/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PARMENION/death_${dir}.png`),
        },
        // 【英雄·佩尔狄卡斯】8方向，AoE2 DE SLD 素材
        'hero_perdiccas': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PERDICCAS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PERDICCAS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PERDICCAS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PERDICCAS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PERDICCAS/death_${dir}.png`),
        },
        // 【英雄·好人菲利普】8方向，AoE2 DE SLD 素材
        'hero_philipthegood': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHILIPTHEGOOD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHILIPTHEGOOD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHILIPTHEGOOD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHILIPTHEGOOD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PHILIPTHEGOOD/death_${dir}.png`),
        },
        // 【英雄·普里特维拉吉】8方向，AoE2 DE SLD 素材
        'hero_prithviraj': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PRITHVIRAJ/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PRITHVIRAJ/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PRITHVIRAJ/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PRITHVIRAJ/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/PRITHVIRAJ/death_${dir}.png`),
        },
        // 【英雄·忽都鲁】8方向，AoE2 DE SLD 素材
        'hero_qutlugh': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QUTLUGH/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QUTLUGH/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QUTLUGH/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QUTLUGH/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/QUTLUGH/death_${dir}.png`),
        },
        // 【英雄·罗贞陀罗·朱罗】8方向，AoE2 DE SLD 素材
        'hero_rajendrachola': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAJENDRACHOLA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAJENDRACHOLA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAJENDRACHOLA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAJENDRACHOLA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/RAJENDRACHOLA/death_${dir}.png`),
        },
        // 【英雄·罗贝尔·吉斯卡尔】8方向，AoE2 DE SLD 素材
        'hero_robertguiscard': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROBERTGUISCARD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROBERTGUISCARD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROBERTGUISCARD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROBERTGUISCARD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROBERTGUISCARD/death_${dir}.png`),
        },
        // 【英雄·罗杰·博索】8方向，AoE2 DE SLD 素材
        'hero_rogerbosso': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROGERBOSSO/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROGERBOSSO/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROGERBOSSO/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROGERBOSSO/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROGERBOSSO/death_${dir}.png`),
        },
        // 【英雄·斯福尔扎】8方向，AoE2 DE SLD 素材
        'hero_sforza': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SFORZA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SFORZA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SFORZA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SFORZA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SFORZA/death_${dir}.png`),
        },
        // 【英雄·沙阿·伊斯玛仪】8方向，AoE2 DE SLD 素材
        'hero_shahismail': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHAHISMAIL/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHAHISMAIL/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHAHISMAIL/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHAHISMAIL/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SHAHISMAIL/death_${dir}.png`),
        },
        // 【英雄·速不台】8方向，AoE2 DE SLD 素材
        'hero_subotai': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUBOTAI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUBOTAI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUBOTAI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUBOTAI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUBOTAI/death_${dir}.png`),
        },
        // 【英雄·苏曼古鲁】8方向，AoE2 DE SLD 素材
        'hero_sumanguru': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUMANGURU/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUMANGURU/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUMANGURU/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUMANGURU/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUMANGURU/death_${dir}.png`),
        },
        // 【英雄·孙策】8方向，AoE2 DE SLD 素材
        'hero_sunce': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNCE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNCE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNCE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNCE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNCE/death_${dir}.png`),
        },
        // 【英雄·松迪亚塔】8方向，AoE2 DE SLD 素材
        'hero_sundjata': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDJATA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDJATA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDJATA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDJATA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNDJATA/death_${dir}.png`),
        },
        // 【英雄·孙坚】8方向，AoE2 DE SLD 素材
        'hero_sunjian': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNJIAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNJIAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNJIAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNJIAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNJIAN/death_${dir}.png`),
        },
        // 【英雄·孙权】8方向，AoE2 DE SLD 素材
        'hero_sunquan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNQUAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNQUAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNQUAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNQUAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/SUNQUAN/death_${dir}.png`),
        },
        // 【英雄·塔里克】8方向，AoE2 DE SLD 素材
        'hero_tariqibnziyad': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARIQIBNZIYAD/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARIQIBNZIYAD/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARIQIBNZIYAD/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARIQIBNZIYAD/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TARIQIBNZIYAD/death_${dir}.png`),
        },
        // 【英雄·托罗斯】8方向，AoE2 DE SLD 素材
        'hero_thoros': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THOROS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THOROS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THOROS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THOROS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THOROS/death_${dir}.png`),
        },
        // 【英雄·色雷斯酋长】8方向，AoE2 DE SLD 素材
        'hero_thracian_chieftain': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_CHIEFTAIN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_CHIEFTAIN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_CHIEFTAIN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_CHIEFTAIN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/THRACIAN_CHIEFTAIN/death_${dir}.png`),
        },
        // 【英雄·君士坦丁沙皇】8方向，AoE2 DE SLD 素材
        'hero_tsarkonstantin': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TSARKONSTANTIN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TSARKONSTANTIN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TSARKONSTANTIN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TSARKONSTANTIN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TSARKONSTANTIN/death_${dir}.png`),
        },
        // 【英雄·容金根】8方向，AoE2 DE SLD 素材
        'hero_ulrichvonjungingen': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ULRICHVONJUNGINGEN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ULRICHVONJUNGINGEN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ULRICHVONJUNGINGEN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ULRICHVONJUNGINGEN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ULRICHVONJUNGINGEN/death_${dir}.png`),
        },
        // 【英雄·穿刺公德古拉】8方向，AoE2 DE SLD 素材
        'hero_vladdracula': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VLADDRACULA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VLADDRACULA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VLADDRACULA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VLADDRACULA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VLADDRACULA/death_${dir}.png`),
        },
        // 【英雄·维陶塔斯大帝】8方向，AoE2 DE SLD 素材
        'hero_vytautasthegreat': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VYTAUTASTHEGREAT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VYTAUTASTHEGREAT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VYTAUTASTHEGREAT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VYTAUTASTHEGREAT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/VYTAUTASTHEGREAT/death_${dir}.png`),
        },
        // 【英雄·威廉·华莱士】8方向，AoE2 DE SLD 素材
        'hero_williamwallace': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WILLIAMWALLACE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WILLIAMWALLACE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WILLIAMWALLACE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WILLIAMWALLACE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WILLIAMWALLACE/death_${dir}.png`),
        },
        // 【英雄·尤迪特】8方向，AoE2 DE SLD 素材
        'hero_yodit': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/YODIT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/YODIT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/YODIT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/YODIT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/YODIT/death_${dir}.png`),
        },
        // 【英雄·张飞】8方向，AoE2 DE SLD 素材
        'hero_zhangfei': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ZHANGFEI/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ZHANGFEI/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ZHANGFEI/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ZHANGFEI/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ZHANGFEI/death_${dir}.png`),
        },
        // 【枪骑兵】8方向，AoE2 DE SLD 素材
        'lancer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LANCER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LANCER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LANCER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LANCER/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LANCER/death_${dir}.png`),
        },
        // 【单层桨座战船】8方向，AoE2 DE SLD 素材
        'monoreme': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONOREME/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONOREME/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONOREME/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONOREME/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MONOREME/idle_${dir}.png`),
        },
        // 【双层桨座战船】8方向，AoE2 DE SLD 素材
        'bireme': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BIREME/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BIREME/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BIREME/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BIREME/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/BIREME/idle_${dir}.png`),
        },
        // 【三层桨座战船】8方向，AoE2 DE SLD 素材
        'trireme': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRIREME/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRIREME/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRIREME/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRIREME/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/TRIREME/idle_${dir}.png`),
        },
        // 【伦波斯轻战船】8方向，AoE2 DE SLD 素材
        'lembos': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEMBOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEMBOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEMBOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEMBOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEMBOS/idle_${dir}.png`),
        },
        // 【作战伦波斯船】8方向，AoE2 DE SLD 素材
        'war_lembos': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_LEMBOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_LEMBOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_LEMBOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_LEMBOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_LEMBOS/idle_${dir}.png`),
        },
        // 【精锐伦波斯船】8方向，AoE2 DE SLD 素材
        'elite_lembos': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LEMBOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LEMBOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LEMBOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LEMBOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ELITE_LEMBOS/idle_${dir}.png`),
        },
        // 【重型伦波斯船】8方向，AoE2 DE SLD 素材
        'heavy_lembos': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_LEMBOS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_LEMBOS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_LEMBOS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_LEMBOS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HEAVY_LEMBOS/idle_${dir}.png`),
        },
        // 【德罗蒙重弩炮舰】8方向，AoE2 DE SLD 素材
        'dromon': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DROMON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DROMON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DROMON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DROMON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DROMON/death_${dir}.png`),
        },
        // 【柯克大战船】8方向，AoE2 DE SLD 素材
        'hulk': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HULK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HULK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HULK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HULK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HULK/idle_${dir}.png`),
        },
        // 【重型柯克战船】8方向，AoE2 DE SLD 素材
        'war_hulk': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_HULK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_HULK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_HULK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_HULK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/WAR_HULK/idle_${dir}.png`),
        },
        // 【大型多桅战船】8方向，AoE2 DE SLD 素材
        'galleon': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/GALLEON/idle_${dir}.png`),
        },
        // 【克拉克重帆船】8方向，AoE2 DE SLD 素材
        'carrack': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARRACK/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARRACK/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARRACK/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARRACK/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CARRACK/idle_${dir}.png`),
        },
        // 【投石帆船】8方向，AoE2 DE SLD 素材
        'catapult_galleon': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_GALLEON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_GALLEON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_GALLEON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_GALLEON/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CATAPULT_GALLEON/idle_${dir}.png`),
        },
        // 【爆破排筏】8方向，AoE2 DE SLD 素材
        'demo_raft': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_RAFT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_RAFT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_RAFT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_RAFT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/DEMO_RAFT/idle_${dir}.png`),
        },
        // 【燃烧排筏】8方向，AoE2 DE SLD 素材
        'incendiary_raft': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_RAFT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_RAFT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_RAFT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_RAFT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/INCENDIARY_RAFT/idle_${dir}.png`),
        },
        // 【独木战舟】8方向，AoE2 DE SLD 素材
        'canoe': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANOE/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANOE/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANOE/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANOE/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CANOE/death_${dir}.png`),
        },
        // 【远洋贸易船】8方向，AoE2 DE SLD 素材
        'merchant_ship': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MERCHANT_SHIP/idle_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MERCHANT_SHIP/idle_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MERCHANT_SHIP/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MERCHANT_SHIP/idle_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MERCHANT_SHIP/idle_${dir}.png`),
        },
        // 【中国楼船】8方向，AoE2 DE SLD 素材
        'lou_chuan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LOU_CHUAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LOU_CHUAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LOU_CHUAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LOU_CHUAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LOU_CHUAN/death_${dir}.png`),
        },
        // 【利维坦巨舰】8方向，AoE2 DE SLD 素材
        'leviathan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVIATHAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVIATHAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVIATHAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVIATHAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/LEVIATHAN/death_${dir}.png`),
        },
        // 【英雄·地米斯托克利】8方向，AoE2 DE SLD 素材
        'hero_themistocles': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_THEMISTOCLES/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_THEMISTOCLES/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_THEMISTOCLES/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_THEMISTOCLES/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_THEMISTOCLES/idle_${dir}.png`),
        },
        // 【英雄·阿尔特米西亚】8方向，AoE2 DE SLD 素材
        'hero_artemisia': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_ARTEMISIA/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_ARTEMISIA/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_ARTEMISIA/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_ARTEMISIA/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_ARTEMISIA/idle_${dir}.png`),
        },
        // 【英雄·狄奥尼索斯】8方向，AoE2 DE SLD 素材
        'hero_dionysus': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_DIONYSUS/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_DIONYSUS/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_DIONYSUS/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_DIONYSUS/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_DIONYSUS/idle_${dir}.png`),
        },
        // 【英雄·埃伊纳指挥官】8方向，AoE2 DE SLD 素材
        'hero_aeginetan': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_AEGINETAN/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_AEGINETAN/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_AEGINETAN/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_AEGINETAN/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HERO_AEGINETAN/idle_${dir}.png`),
        },
} as const;
