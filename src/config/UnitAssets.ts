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
        // 【岭南/朝鲜/江南刀剑手】Jian Swordsman 吴国刀剑手（8方向，AoE2 DE SLD 素材，u_inf_jian_swordman_shielded）
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
        'macedon_phalanx': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDON/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDON/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDON/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDON/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/MACEDON/death_${dir}.png`),
        },
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
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/CRETAN_ARCHER/death_${dir}.png`),
        },
        // 【罗马军团步兵】Roman Legionary（8方向方盾重步兵）
        'roman_legionary': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROMAN_LEGION/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROMAN_LEGION/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROMAN_LEGION/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROMAN_LEGION/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/ROMAN_LEGION/death_${dir}.png`),
        },
        // 【华夏具装铁骑 / 玄甲军】Huaxia Iron Cavalry（8方向具装重骑）
        'huaxia_iron_cavalry': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_IRON_CAVALRY/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_IRON_CAVALRY/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_IRON_CAVALRY/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_IRON_CAVALRY/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_IRON_CAVALRY/death_${dir}.png`),
        },
        // 【草原游牧骑射手 / 曼古歹】Steppe Horse Archer（8方向回身射箭弓骑）
        'steppe_horse_archer': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_HORSE_ARCHER/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_HORSE_ARCHER/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_HORSE_ARCHER/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_HORSE_ARCHER/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/STEPPE_HORSE_ARCHER/death_${dir}.png`),
        },
        // 【华夏神臂弩手 / 强弩兵】Huaxia Crossbow（8方向重弩）
        'huaxia_crossbow': {
            MOVE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_CROSSBOW/move_${dir}.png`),
            ATTACK: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_CROSSBOW/attack_${dir}.png`),
            IDLE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_CROSSBOW/idle_${dir}.png`),
            DAMAGE: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_CROSSBOW/damage_${dir}.png`),
            DEATH: [0, 1, 2, 3, 4, 5, 6, 7].map(dir => `/SUCAI/HUAXIA_CROSSBOW/death_${dir}.png`),
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
