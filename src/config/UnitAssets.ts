// ==================== ç²¾çµå›¾è·¯å¾„ (Sprite Paths) ====================
export const SPRITE_PATHS = {
    PLAYER_ZHONGHUA: {
        // [NEW 8-DIRECTION SYSTEM] S10DB Assets
        // 0:South -> 7:SE (Standard S10DB mapping)
        // Move: 460-467
        // Attack: 468-475
        // Idle: 484-491
        // Damage: 492-499
        // Death: 500-507
        // Format: /SUCAI/S10DB/{ID}-1.png

        MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
        ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
        IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),
        // Keep 'frames' for compatibility if needed, but we should switch to using the arrays above.
        // We can alias frames to IDLE for safety
        frames: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
    },
    // [NEW] Use same assets for standard LEGION units
    LEGION: {
        MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
        ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
        IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),
    },
    // [NEW] Player General Sprite (S10DB)
    PLAYER_GENERAL: {
        MOVE: [240, 241, 242, 243, 244, 245, 246, 247].map(id => `/SUCAI/S10DB/${id}-1.png`),
        ATTACK: [248, 249, 250, 251, 252, 253, 254, 255].map(id => `/SUCAI/S10DB/${id}-1.png`),
        IDLE: [256, 257, 258, 259, 260, 261, 262, 263].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DAMAGE: [264, 265, 266, 267, 268, 269, 270, 271].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DEATH: [272, 273, 274, 275, 276, 277, 278, 279].map(id => `/SUCAI/S10DB/${id}-1.png`),
    },
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
        // format: /SUCAI/S10DB/{ID}-1.png
        // 8 directions: South(0) -> SE(7)
        // éª‘å…µè´´å›¾ (Cavalry sprites): 154-193
        MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
        ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
        IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
        DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
        FLAG: {
            POLE: '/SUCAI/S10QZ/1-1.png',
            BODY: '/SUCAI/S10QZ/7-1.png', // 
            TEXT: '/SUCAI/S10QZ/59-1.png', // 59-1 Text
        }
    },
    // [NEW] Granular Unit Asset Configuration
    // Allows defining sprites for specific unit types (e.g. 'huaxia_infantry', 'roman_legion')
    UNIT_ASSETS: {
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
        'mixed': {
            // 第一排：轻步兵
            MOVE: [1, 2, 3, 4, 5, 6, 7, 8].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [9, 10, 11, 12, 13, 14, 15, 16].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [25, 26, 27, 28, 29, 30, 31, 32].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [33, 34, 35, 36, 37, 38, 39, 40].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [41, 42, 43, 44, 45, 46, 47, 48].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // 第二排：轻骑兵
            SECONDARY: {
                MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
            },

            // 第三排：弓步兵
            TERTIARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'huaxia_infantry': {
            // Using 8-direction mapping (S10DB IDs)
            // 0:S, 1:SE, 2:E, 3:NE, 4:N, 5:NW, 6:W, 7:SW
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Secondary sprites for Mixed formations (e.g. Back Row Crossbows)
            // Secondary: CROSSBOWS (342-397)
            SECONDARY: {
                MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'huaxia_mixed': {
            // Huaxia Mixed (NEW): Front Infantry, Middle Cavalry, Back Crossbows
            // PRIMARY (Front): Infantry (460..)
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // SECONDARY (Middle): Cavalry (154..)
            SECONDARY: {
                MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
            },

            // TERTIARY (Back): Crossbows (342..) - Huaxia Special
            TERTIARY: {
                MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'huaxia_cavalry': {
            // Huaxia Cavalry: Pure Cavalry
            MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },

        // === HUIHUI FACTION (å›žå›žå¼“éª‘) ===
        'huihui_cavalry': {
            // Huihui Cavalry: Beidi Mounted Archers (åŒ—ç‹„å¼“éª‘å…µ)
            // 6-person cavalry formation, combat cycle: shoot -> charge -> attack
            MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
            CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
            SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },

        // === HUIHUI MIXED (å›žå›žæ­¥éª‘) ===
        'huihui_mixed': {
            // Huihui Mixed: Uses generically Zhonghua Mixed assets (Infantry + Cavalry + Archers)
            // PRIMARY (Front): Infantry (460..)
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // SECONDARY (Middle): Cavalry (154..)
            // SECONDARY (Middle): Huihui Cavalry (Mounted Archer)
            SECONDARY: {
                MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
                CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`), // Added SHOOT just in case
                DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
            },

            // TERTIARY (Back): Archers (283..)
            TERTIARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'zhonghua_infantry': {
            // Zhonghua Infantry: Front Infantry, Back Archers
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            SECONDARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'tianchao_infantry': {
            // Tianchao Infantry (Wu): Same as Zhonghua Infantry for now
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            SECONDARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'zhonghua_mixed': {
            // Zhonghua Mixed (NEW): Front Infantry, Middle Cavalry, Back Archers
            // PRIMARY (Front): Infantry (460..)
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // SECONDARY (Middle): Cavalry (154..)
            SECONDARY: {
                MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
            },

            // TERTIARY (Back): Crossbowmen (342..)
            TERTIARY: {
                MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'song_infantry': {
            // Song Infantry: Front (103..), Back (342.. Crossbows)
            // PRIMARY (Front)
            MOVE: [103, 104, 105, 106, 107, 108, 109, 110].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [111, 112, 113, 114, 115, 116, 117, 118].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [127, 128, 129, 130, 131, 132, 133, 134].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [135, 136, 137, 138, 139, 140, 141, 142].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [143, 144, 145, 146, 147, 148, 149, 150].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // SECONDARY (Back): Crossbows (342..) - Same as Zhonghua Mixed/Infantry secondary logical equivalent
            SECONDARY: {
                MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'shu_infantry': {
            // Shu Infantry: Front (52-99), Back (342.. Crossbows)
            // PRIMARY (Front)
            MOVE: [52, 53, 54, 55, 56, 57, 58, 59].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [60, 61, 62, 63, 64, 65, 66, 67].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [76, 77, 78, 79, 80, 81, 82, 83].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [84, 85, 86, 87, 88, 89, 90, 91].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [92, 93, 94, 95, 96, 97, 98, 99].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // SECONDARY (Back): Crossbows (342..)
            SECONDARY: {
                MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'zhou_infantry': {
            // Zhou Infantry (Huaxia 3x3 logic)
            // Front (Primary): 460.. (Zhonghua Inf)
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`), // Using 468-475 standard
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back (Secondary): Archers (283..)
            SECONDARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'yue_infantry': {
            // Yue Infantry (Huaxia 3x3)
            // Front (Primary): 52.. (Custom Infantry)
            MOVE: [52, 53, 54, 55, 56, 57, 58, 59].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [60, 61, 62, 63, 64, 65, 66, 67].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [76, 77, 78, 79, 80, 81, 82, 83].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [84, 85, 86, 87, 88, 89, 90, 91].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [92, 93, 94, 95, 96, 97, 98, 99].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back (Secondary): Archers (283..)
            SECONDARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        // [2026-08-12 删] 'riben_infantry' 已移除：帧号与 'armored'（藤甲兵 562-609）完全相同，
        // 且全项目除自身定义外无任何引用。日本编制走的是 armored，所以日本兵 = 藤甲兵 = 朝鲜兵，
        // 三家共用同一套斗笠刀盾素材（主人 2026-08-12 确认后清理）。
        'e_infantry': {
            // E Infantry (Huaxia 3x3)
            // Front (Primary): 103.. (Custom Infantry)
            MOVE: [103, 104, 105, 106, 107, 108, 109, 110].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [111, 112, 113, 114, 115, 116, 117, 118].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [127, 128, 129, 130, 131, 132, 133, 134].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [135, 136, 137, 138, 139, 140, 141, 142].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [143, 144, 145, 146, 147, 148, 149, 150].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back (Secondary): Archers (283..)
            SECONDARY: {
                MOVE: [283, 284, 285, 286, 287, 288, 289, 290].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [291, 292, 293, 294, 295, 296, 297, 298].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [307, 308, 309, 310, 311, 312, 313, 314].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [315, 316, 317, 318, 319, 320, 321, 322].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [323, 324, 325, 326, 327, 328, 329, 330].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [331, 332, 333, 334, 335, 336, 337, 338].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'zhonghua_cavalry': {
            // Zhonghua Cavalry: Pure Cavalry
            MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'chaoxian_cavalry': {
            // Chaoxian Cavalry (Yan): From Zhonghua Cavalry
            MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'liang_cavalry': {
            // Liang Axe Cavalry
            MOVE: [197, 198, 199, 200, 201, 202, 203, 204].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [205, 206, 207, 208, 209, 210, 211, 212].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [213, 214, 215, 216, 217, 218, 219, 220].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [221, 222, 223, 224, 225, 226, 227, 228].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [229, 230, 231, 232, 233, 234, 235, 236].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'wei_cavalry': {
            // Wei Tiger Cavalry
            MOVE: [240, 241, 242, 243, 244, 245, 246, 247].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [248, 249, 250, 251, 252, 253, 254, 255].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [256, 257, 258, 259, 260, 261, 262, 263].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [264, 265, 266, 267, 268, 269, 270, 271].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [272, 273, 274, 275, 276, 277, 278, 279].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'tujue_cavalry': {
            // Tujue Mixed Cavalry (Front: Axe, Back: Mounted Archer)
            // Front: Same as Liang (197..)
            MOVE: [197, 198, 199, 200, 201, 202, 203, 204].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [205, 206, 207, 208, 209, 210, 211, 212].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [213, 214, 215, 216, 217, 218, 219, 220].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [221, 222, 223, 224, 225, 226, 227, 228].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [229, 230, 231, 232, 233, 234, 235, 236].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back: Mounted Archers (664..)
            SECONDARY: {
                MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
                CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'tian_cavalry': {
            // Tian Mixed Cavalry (Front: Wei Assets, Back: Mounted Archer)
            // Front: Same as Wei (240..)
            MOVE: [240, 241, 242, 243, 244, 245, 246, 247].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [248, 249, 250, 251, 252, 253, 254, 255].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [256, 257, 258, 259, 260, 261, 262, 263].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [264, 265, 266, 267, 268, 269, 270, 271].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [272, 273, 274, 275, 276, 277, 278, 279].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back: Mounted Archers (664..)
            SECONDARY: {
                MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
                CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
        'xiyu_cavalry': {
            // Xiyu Mixed Cavalry (Front: 154.., Back: Mounted Archer 664..)
            // Front Row
            MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),

            // Back Row: Mounted Archers (664..) - Same as Tujue/Tian back row
            SECONDARY: {
                MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
                ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
                IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
                CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
                SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`),
                DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
            }
        },
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
        'crossbow': {
            MOVE: [342, 343, 344, 345, 346, 347, 348, 349].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [350, 351, 352, 353, 354, 355, 356, 357].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [366, 367, 368, 369, 370, 371, 372, 373].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [374, 375, 376, 377, 378, 379, 380, 381].map(id => `/SUCAI/S10DB/${id}-1.png`),
            SHOOT: [382, 383, 384, 385, 386, 387, 388, 389].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [390, 391, 392, 393, 394, 395, 396, 397].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        // 床弩兵 401-456（单兵操作大弩，帧结构同 crossbow；2026-08-04 盘活，拉丁区蝎子弩）
        'ballista': {
            MOVE: [401, 402, 403, 404, 405, 406, 407, 408].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [409, 410, 411, 412, 413, 414, 415, 416].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [425, 426, 427, 428, 429, 430, 431, 432].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [433, 434, 435, 436, 437, 438, 439, 440].map(id => `/SUCAI/S10DB/${id}-1.png`),
            SHOOT: [441, 442, 443, 444, 445, 446, 447, 448].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [449, 450, 451, 452, 453, 454, 455, 456].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
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
        'light_infantry': {
            MOVE: [1, 2, 3, 4, 5, 6, 7, 8].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [9, 10, 11, 12, 13, 14, 15, 16].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [25, 26, 27, 28, 29, 30, 31, 32].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [33, 34, 35, 36, 37, 38, 39, 40].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [41, 42, 43, 44, 45, 46, 47, 48].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'heavy_infantry': {
            MOVE: [52, 53, 54, 55, 56, 57, 58, 59].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [60, 61, 62, 63, 64, 65, 66, 67].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [76, 77, 78, 79, 80, 81, 82, 83].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [84, 85, 86, 87, 88, 89, 90, 91].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [92, 93, 94, 95, 96, 97, 98, 99].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'shield': {
            MOVE: [103, 104, 105, 106, 107, 108, 109, 110].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [111, 112, 113, 114, 115, 116, 117, 118].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [127, 128, 129, 130, 131, 132, 133, 134].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [135, 136, 137, 138, 139, 140, 141, 142].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [143, 144, 145, 146, 147, 148, 149, 150].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'spear': {
            MOVE: [460, 461, 462, 463, 464, 465, 466, 467].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [468, 469, 470, 471, 472, 473, 474, 475].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [484, 485, 486, 487, 488, 489, 490, 491].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [492, 493, 494, 495, 496, 497, 498, 499].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [500, 501, 502, 503, 504, 505, 506, 507].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'axe': {
            MOVE: [511, 512, 513, 514, 515, 516, 517, 518].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [519, 520, 521, 522, 523, 524, 525, 526].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [535, 536, 537, 538, 539, 540, 541, 542].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [543, 544, 545, 546, 547, 548, 549, 550].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [551, 552, 553, 554, 555, 556, 557, 558].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'armored': {
            MOVE: [562, 563, 564, 565, 566, 567, 568, 569].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [570, 571, 572, 573, 574, 575, 576, 577].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [586, 587, 588, 589, 590, 591, 592, 593].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [594, 595, 596, 597, 598, 599, 600, 601].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [602, 603, 604, 605, 606, 607, 608, 609].map(id => `/SUCAI/S10DB/${id}-1.png`),
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
        // 【北方印加枪兵长】Kamayuk 印加长枪步兵（8方向，AoE2 DE SLD 素材，u_inf_kamayuk）
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
        'lancer': {
            // [User Request] Simple 'lancer' mapped to light cavalry assets
            MOVE: [154, 155, 156, 157, 158, 159, 160, 161].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [162, 163, 164, 165, 166, 167, 168, 169].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [170, 171, 172, 173, 174, 175, 176, 177].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [178, 179, 180, 181, 182, 183, 184, 185].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [186, 187, 188, 189, 190, 191, 192, 193].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'heavy_cavalry': {
            MOVE: [197, 198, 199, 200, 201, 202, 203, 204].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [205, 206, 207, 208, 209, 210, 211, 212].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [213, 214, 215, 216, 217, 218, 219, 220].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [221, 222, 223, 224, 225, 226, 227, 228].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [229, 230, 231, 232, 233, 234, 235, 236].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'general_cavalry': {
            MOVE: [240, 241, 242, 243, 244, 245, 246, 247].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [248, 249, 250, 251, 252, 253, 254, 255].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [256, 257, 258, 259, 260, 261, 262, 263].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [264, 265, 266, 267, 268, 269, 270, 271].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [272, 273, 274, 275, 276, 277, 278, 279].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'horse_archer': {
            MOVE: [664, 665, 666, 667, 668, 669, 670, 671].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [672, 673, 674, 675, 676, 677, 678, 679].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [680, 681, 682, 683, 684, 685, 686, 687].map(id => `/SUCAI/S10DB/${id}-1.png`),
            CHARGE: [688, 689, 690, 691, 692, 693, 694, 695].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [696, 697, 698, 699, 700, 701, 702, 703].map(id => `/SUCAI/S10DB/${id}-1.png`),
            SHOOT: [704, 705, 706, 707, 708, 709, 710, 711].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [712, 713, 714, 715, 716, 717, 718, 719].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'elephant': {
            // [USER REQUEST] 象兵: 613-660 (8 frames per action, 6 actions total)
            // Block 1 (MOVE): 613-620
            // Block 2 (ATTACK): 621-628
            // Block 3 (IDLE):   629-636 = 待命
            // Block 4 (CHARGE): 637-644 = 冲锋
            // Block 5 (DAMAGE): 645-652
            // Block 6 (DEATH):  653-660
            // 🔴 [2026-08-12 修错标] IDLE 原本指向 637（= 冲锋组），所以象兵「待命」一直在播冲锋动作。
            //    主人 2026-08-12 复述并授权修正：629-636 才是待命。此改动同时影响 8/9/10 与 13。
            MOVE: [613, 614, 615, 616, 617, 618, 619, 620].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [621, 622, 623, 624, 625, 626, 627, 628].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [629, 630, 631, 632, 633, 634, 635, 636].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [645, 646, 647, 648, 649, 650, 651, 652].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [653, 654, 655, 656, 657, 658, 659, 660].map(id => `/SUCAI/S10DB/${id}-1.png`),
            CHARGE: [637, 638, 639, 640, 641, 642, 643, 644].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'ship_small': {
            // 【船贴图三档】按军团兵力选档（NavalShipTiers.ts）：
            //   小船=小型运兵船(<2万) / 中船=中型战船(2-5万) / 大船=蓝顶楼船(≥5万)
            // 小船 实际文件 = 863-902。旧注释"860-899"有误：860-862 磁盘上不存在，
            // 900-902 是块内 DEATH 尾帧、不是预留位。错位曾导致小船 MOVE 前 3 向永远空帧。
            MOVE: [863, 864, 865, 866, 867, 868, 869, 870].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [871, 872, 873, 874, 875, 876, 877, 878].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [879, 880, 881, 882, 883, 884, 885, 886].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [887, 888, 889, 890, 891, 892, 893, 894].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [895, 896, 897, 898, 899, 900, 901, 902].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'ship_medium': {
            // 中船: 906-945（磁盘实测齐全）
            MOVE: [906, 907, 908, 909, 910, 911, 912, 913].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [914, 915, 916, 917, 918, 919, 920, 921].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [922, 923, 924, 925, 926, 927, 928, 929].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [930, 931, 932, 933, 934, 935, 936, 937].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [938, 939, 940, 941, 942, 943, 944, 945].map(id => `/SUCAI/S10DB/${id}-1.png`),
        },
        'ship_large': {
            // 大船: 949-988（磁盘实测齐全；992-994 为散件未接线）
            MOVE: [949, 950, 951, 952, 953, 954, 955, 956].map(id => `/SUCAI/S10DB/${id}-1.png`),
            ATTACK: [957, 958, 959, 960, 961, 962, 963, 964].map(id => `/SUCAI/S10DB/${id}-1.png`),
            IDLE: [965, 966, 967, 968, 969, 970, 971, 972].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DAMAGE: [973, 974, 975, 976, 977, 978, 979, 980].map(id => `/SUCAI/S10DB/${id}-1.png`),
            DEATH: [981, 982, 983, 984, 985, 986, 987, 988].map(id => `/SUCAI/S10DB/${id}-1.png`),
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
        'takabara': {
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
        'ant_scout': {
            // 【古典斥候骑兵】AoE2 DE 素材
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_SCOUT/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_SCOUT/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_SCOUT/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_SCOUT/attack_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ANT_SCOUT/death_${dir}.png`),
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
    }
} as const;
