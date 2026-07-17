/**
 * 立绘显示调校：文件夹默认 + 单张覆盖 + 调校尺（样片/标线）
 * 由 PortraitTuner（/portrait-tuner.html）与游戏内 F2 校正器共同维护（均按立绘自身路径存单张覆盖）。
 * 读取见 PortraitAdjust.ts#resolvePortraitAdjust：自身路径 → canonical 兜底 → 文件夹默认。
 *
 * folders 键示例："/assets/daming/"
 * images 键示例："/assets/daming/daming (1).png"
 */
export interface PortraitAdjustValues {
    /** 相对缩放，默认 1 */
    scale?: number;
    /** 水平偏移（设计 px，CombatUI 会乘 COMBAT_UI_SCALE） */
    offsetX?: number;
    /** 垂直偏移（设计 px，正值向下） */
    offsetY?: number;
}

/** 全局默认：胸线水平位置（画布归一化 0–1，左→右） */
export const PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X = 0.5;
/** 全局默认：眼线垂直位置（画布归一化 0–1，顶→底） */
export const PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y = 0.24;

/** 调校工具专用：样片 + 眼线/胸线（CombatUI 不读取） */
export interface PortraitFolderGuide {
    /** 样片路径 */
    samplePath: string;
    /** 眼线 Y：768×1024 画布归一化 0–1（顶→底） */
    eyeLineY: number;
    /** 胸线 X：画布归一化 0–1（左→右） */
    chestLineX: number;
}

/** 文件夹未配置 guide 时的默认值 */
export const PORTRAIT_GUIDE_DEFAULT: PortraitFolderGuide = {
    samplePath: '',
    eyeLineY: PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    chestLineX: PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
};

export interface PortraitAdjustData {
    folders?: Record<string, PortraitAdjustValues>;
    images?: Record<string, PortraitAdjustValues>;
    folderGuides?: Record<string, PortraitFolderGuide>;
}

export const DEFAULT_PORTRAIT_ADJUST: PortraitAdjustData = {
    "folders": {
        "/assets/BASHU/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/HEXI/": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JIANGNAN/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/KOREA/": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LINGNAN/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/NORTH/": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTHEAST/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/daming/": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/litang/": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/liuhan/": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/manqing/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/panjun/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/pugan/": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/wuzhou/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/xianqin/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/yingqin/": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        }
    },
    "images": {
        "/assets/panjun/chimei_fanchong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/litang/lingwu_guoziyi.png": {
            "scale": 1.09,
            "offsetX": 11,
            "offsetY": -3
        },
        "/assets/xianqin/shang_fuhao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/litang/tang_lishimin.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/liuhan/yangshao_zhoubo.png": {
            "scale": 1.22,
            "offsetX": 13,
            "offsetY": -9
        },
        "/assets/xianqin/yin_dixin.png": {
            "scale": 1.06,
            "offsetX": 20,
            "offsetY": -35
        },
        "/assets/DIANQIAN/siam_nalixuan_pugan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/DIANQIAN/chenla_duyebamoqishi.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/wuzhou/wuzhou_d_wuzetian.png": {
            "scale": 1.44,
            "offsetX": 1,
            "offsetY": 23
        },
        "/assets/zhaosong/song_zhaokuangyin.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/litang/heyuan_d_heichichangzhi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/xianqin/chunshen_huangxie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/xianqin/dongxian_sunbin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/xianqin/wu_sunwu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/LINGNAN/gouding_wubo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/JIANGNAN/jinling_tandaoji.png": {
            "scale": 1.15,
            "offsetX": 19,
            "offsetY": -2
        },
        "/assets/DIANQIAN/dai_daoyingmeng.png": {
            "scale": 1.02,
            "offsetX": 8,
            "offsetY": -35
        },
        "/assets/xianqin/lingqiu_zhaowuling.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/huaiyang_zhouyafu.png": {
            "scale": 1.02,
            "offsetX": 12,
            "offsetY": 20
        },
        "/assets/LINGNAN/dacheng_chenkai.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/liuhan/han_d_liubang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/litang/qianzhou_lisheng.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/yingqin/shangzhou_shangyang.png": {
            "scale": 1.12,
            "offsetX": 4,
            "offsetY": -8
        },
        "/assets/litang/shazhou_zhangyichao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/chanzhou_chairong.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL/zhuozhou_anlushan.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 1.04,
            "offsetX": 13,
            "offsetY": 7
        },
        "/assets/STEPPE/dada_ming_dayanhan.png": {
            "scale": 0.84,
            "offsetX": 13,
            "offsetY": -26
        },
        "/assets/daming/linyu_wusangui.png": {
            "scale": 1.07,
            "offsetX": 11,
            "offsetY": -6
        },
        "/assets/DIANQIAN/jingdong_taohong.png": {
            "scale": 1.07,
            "offsetX": 1,
            "offsetY": -27
        },
        "/assets/HEXI/chijin_qiewangshijia.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/xianqin/han_baoyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/BASHU/chu_guanyu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTH/jingmen_zhaoyun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/liuhan/guangwu_xinwuxian.png": {
            "scale": 0.98,
            "offsetX": 4,
            "offsetY": -41
        },
        "/assets/DIANQIAN/luoyue_zhengce.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/yingqin/qin_simacuo.png": {
            "scale": 1.24,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTH/dangzhou_qiangduan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/tiele_qibiheli.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/zhaosong/fengzhou_wujie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/daming/jinzhou_lichengliang.png": {
            "scale": 1.08,
            "offsetX": 10,
            "offsetY": -63
        },
        "/assets/JIANGNAN/wuwu_d_lvmeng.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/ruzhou_sunjian.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTH/dizhou_wangyanzhang.png": {
            "scale": 0.95,
            "offsetX": 15,
            "offsetY": 6
        },
        "/assets/DIANQIAN/baiman_gaoshengtai.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -50
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": 18
        },
        "/assets/CENTRAL/bozhou_d_luzhonglian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/zhaosong/yue_d_yuefei.png": {
            "scale": 1.18,
            "offsetX": 4,
            "offsetY": -28
        },
        "/assets/DIANQIAN/champa_zhipenge.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WESTERN/anxi_guoxin.png": {
            "scale": 1.1,
            "offsetX": 11,
            "offsetY": 1
        },
        "/assets/DIANQIAN/luohu_ganmuding.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/KOREA/baiji_jiebo.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/tiemuer_tiemuer.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/JAPAN/ashikaga_zulizunshi.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/NORTHEAST/fuyu_weichoutai.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/HEXI/liangzhou_zhanggui.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/gar_lunqinling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/borjigin_tuolei.png": {
            "scale": 1.24,
            "offsetX": 11,
            "offsetY": -14
        },
        "/assets/STEPPE/liao_d_yelvabaoji.png": {
            "scale": 1.03,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/JAPAN/edo_dechuanjiakang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/menggu_d_chengjisihan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/KOREA/gaogouli_yizhiwende.png": {
            "scale": 1.17,
            "offsetX": -5,
            "offsetY": 0
        },
        "/assets/WESTERN/wulianghai_chelingwubashen.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/LINGNAN/muong_shencongyue.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/huige_gulipeiluo.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTHEAST/bohai_dazuorong.png": {
            "scale": 1.04,
            "offsetX": 11,
            "offsetY": 14
        },
        "/assets/HEXI/lushui_beigongboyu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/badakhshan_yaerbeige.png": {
            "scale": 1.04,
            "offsetX": 22,
            "offsetY": -10
        },
        "/assets/CENTRAL/cao_d_caocao.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/bailang_tangzeng.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTHEAST/aola_menglielun.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/NORTHEAST/dajin_wanyanaguda.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/heng_hetengjiao.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/NORTHEAST/eluoke_amuhaer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/jilimi_takuna.png": {
            "scale": 0.85,
            "offsetX": 8,
            "offsetY": -14
        },
        "/assets/xianqin/yue_goujian.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/manqing/manzhou_nuerhachi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/manqing/aisin_d_huangtaiji.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/JAPAN/so_zongyizhi.png": {
            "scale": 1.11,
            "offsetX": 22,
            "offsetY": -8
        },
        "/assets/STEPPE/pugu_ashinaguduolu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/manqing/manzhou_d_duoergun.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/TIBET/ladakh_senggelangjie.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/liuhan/lanzhou_zhaochongguo.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/panjun/bailian_wangconger.png": {
            "scale": 1.41,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WESTERN/keerkezi_manasi.png": {
            "scale": 1,
            "offsetX": 17,
            "offsetY": -20
        },
        "/assets/BASHU/yangzhou_wangping.png": {
            "scale": 0.99,
            "offsetX": 7,
            "offsetY": 5
        },
        "/assets/JIANGNAN/hongzhou_zhuwenzheng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/linshihong_linshihong.png": {
            "scale": 1.11,
            "offsetX": 7,
            "offsetY": 21
        },
        "/assets/BASHU/chenghan_lite.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/NORTH/huo_songlaosheng.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/BASHU/shu_liubei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/liuhan/zhi_state_caocan.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/daming/pingnan_musheng.png": {
            "scale": 0.99,
            "offsetX": 9,
            "offsetY": -6
        },
        "/assets/BASHU/qingyi_fanchangsheng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JAPAN/hashiba_fengchenxiuji.png": {
            "scale": 1.06,
            "offsetX": 5,
            "offsetY": -83
        },
        "/assets/JIANGNAN/fang_guozhen_fangguozhen.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/xianqin/ouyue_zouyao.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/NORTH/gongsun_d_gongsundu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/huizhou_zhugeliang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/zhaosong/xiangzhou_lvwenhuan.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JIANGNAN/wuyue_qianliu.png": {
            "scale": 0.84,
            "offsetX": 9,
            "offsetY": -4
        },
        "/assets/CENTRAL/tongzhou_yangzhiji.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/xianqin/zhao_lianpo.png": {
            "scale": 0.96,
            "offsetX": 8,
            "offsetY": 5
        },
        "/assets/JAPAN/shimotsuke_yudougongguanggang.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -41
        },
        "/assets/CENTRAL_ASIA/hali_gedaerzi.png": {
            "scale": 0.99,
            "offsetX": 13,
            "offsetY": 30
        },
        "/assets/WESTERN/yuchi_weichiyao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/yumi_anguo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/tujue_ashinatumen.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/kaerka_abadaihan.png": {
            "scale": 1.08,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/CENTRAL/sima_d_simayi.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JIANGNAN/min_wangshenzhi.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/JIANGNAN/quanzhou_liucongxiao.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/daming/ming_zheng_zhengchenggong.png": {
            "scale": 1.1,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/BASHU/lizhou_d_liaohua.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/HEXI/quanrong_yiquhai.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/HEXI/huizhou_yaosi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/liuhan/xiayang_d_dengyu.png": {
            "scale": 1.14,
            "offsetX": 5,
            "offsetY": 17
        },
        "/assets/CENTRAL/pizhou_lvbu.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/BASHU/wuxi_shamoke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/wumeng_azi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/tan_d_qinhou.png": {
            "scale": 0.96,
            "offsetX": 5,
            "offsetY": -41
        },
        "/assets/BASHU/she_shechongming.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL/mengcheng_d_gaoqiong.png": {
            "scale": 1.03,
            "offsetX": 20,
            "offsetY": -18
        },
        "/assets/TIBET/beidi_yaochang.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/BASHU/miaomin_shiliudeng.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/zhaosong/yingzhou_d_liuqi.png": {
            "scale": 1.16,
            "offsetX": 11,
            "offsetY": -35
        },
        "/assets/CENTRAL/lu_zhangliao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/qi_simarangju.png": {
            "scale": 1.08,
            "offsetX": 4,
            "offsetY": 5
        },
        "/assets/KOREA/xinluo_jinyuxin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KOREA/sheng_d_liyiqi.png": {
            "scale": 1.03,
            "offsetX": -2,
            "offsetY": -3
        },
        "/assets/KOREA/zhen_zhenxuan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/yingqin/xin_baiqi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/long2_weixiaokuan.png": {
            "scale": 1.21,
            "offsetX": 3,
            "offsetY": 1
        },
        "/assets/BASHU/ba_bamanzi.png": {
            "scale": 1,
            "offsetX": -19,
            "offsetY": -16
        },
        "/assets/BASHU/baishui_yanghuai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/paiyao_huangguasi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/bandun_fanmu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/boren_ada.png": {
            "scale": 1.02,
            "offsetX": 10,
            "offsetY": -2
        },
        "/assets/BASHU/chenzhou_d_zhanghao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/BASHU/cong_puhu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/jingjiang_qushisi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/panjun/__闲置__PANJUN_11.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/dangchang_liangmiding.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/LINGNAN/xiou_yixusong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/BASHU/daxi_ming_zhangxianzhong.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BASHU/guo_jixin.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/BASHU/kuai_kuaiyue.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/BASHU/kui_gongsunshu.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/miao_amishi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/liao_houhongyuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/BASHU/qianhui_baiyanhu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/qianzhong_wubayue.png": {
            "scale": 1.09,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/LINGNAN/guangxin_shixie.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/tian_sizhou_tianyougong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/qiuchi_yangnandang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/yelang_duotong.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/ran_d_ranshouzhong.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/chaozhou_d_mafa.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTH/qu_d_quyi.png": {
            "scale": 0.9,
            "offsetX": 5,
            "offsetY": -40
        },
        "/assets/BASHU/sou_gaodingyuan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BASHU/shuixi_anbangyan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/chen2_zhaofan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/LINGNAN/闲置202606280332.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTH/yuzhou_zuti.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/litang/liang_d_zhangxun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/xiang_d_xiangdakun.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/BASHU/yang_bozhou_yangyinglong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/LINGNAN/shixing_houandou.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/yueyi_zhangyi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/zhongxiang_zhongxiang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/BASHU/zhuoshi_zhuowangsun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/shengmiao_baoli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/zuo_d_wufu.png": {
            "scale": 1.21,
            "offsetX": 19,
            "offsetY": 43
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/wugu_d_tugelile.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/wuhu_dukake.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WESTERN/wensu_guyi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/WESTERN/weiwuer_yusubu.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/CENTRAL_ASIA/yada_ahexiong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/yanda_touluoman.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WESTERN/yiwu_hanshen.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL_ASIA/shi_clan_moheduotutun.png": {
            "scale": 1.36,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/wusun_liejiaomi.png": {
            "scale": 1.36,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/qincha_baqiman.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/yanqi_longtuqizhi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/TIBET/guge_chizhaxichabade.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/WESTERN/yarkand_abudulatifu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/pangzha_halixinge.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/WESTERN/sai_gaijiayun.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/CENTRAL_ASIA/najie_minande.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/CENTRAL_ASIA/kazakh_hasimu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL_ASIA/khoja_apakehezhuo.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/kokand_alimukuli.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/loulan_suojie.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/tuoming_tuomin.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/shule_aersilan.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/kalan_suhela.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/jie_sijinti.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/faqiang_niechizanpu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/dayuzi_yinalechihei.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/delan_sulun.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/fanyanna_xieer.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/pishan_daihu.png": {
            "scale": 0.99,
            "offsetX": 13,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/huarazim_mohemo.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/baha_gaiwamu.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WESTERN/weitou_douti.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/anushidgin_yile.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL_ASIA/an_xibanni.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/CENTRAL_ASIA/adao_d_mafushou.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__闲置__CENTRAL_04.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_05.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/__闲置__CENTRAL_06.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/__闲置__CENTRAL_07.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL/202606280349.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -14
        },
        "/assets/CENTRAL/kong_d_kongrong.png": {
            "scale": 1.02,
            "offsetX": 3,
            "offsetY": 7
        },
        "/assets/CENTRAL/shatuo_likeyong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/mi_mizhu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/wang_d_wangdao.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/zhengzhou_chenqingzhi.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/yaozhou_limaozhen.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_01.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/NORTH/zhe_d_zheyuqing.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BASHU/wanzhou_shangguankui.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/BASHU/zi_changhong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/gaoqi_d_gaohuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/sunqin_sunchuanting.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/daming/suzhou_d_shikefa.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/daming/ming_d_zhudi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/daming/jinan_tiexuan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -55
        },
        "/assets/daming/0cdd94d9-c6cb-4014-921f-a0fd5899c976.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": -81
        },
        "/assets/daming/__闲置__daming_01.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/daming/__闲置__daming_02.png": {
            "scale": 1.37,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/DIANQIAN/basha_d_daogengmeng.png": {
            "scale": 1.35,
            "offsetX": -31,
            "offsetY": 53
        },
        "/assets/LINGNAN/202606282316.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/pugan/__闲置__pugan_03.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/pugan/__闲置__pugan_02.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/DIANQIAN/kunming_yi_lucheng.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/luchuan_sirenfa.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -66
        },
        "/assets/pugan/__闲置__pugan_01.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/mu_lijiang_muzeng.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/DIANQIAN/pyu_moluo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/qiong_rengui.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/xiadun_xiazhongawanglangjie.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/shuizhen_qudaren.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/pugan/__闲置__pugan_06.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/taiyuan_menglai.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/DIANQIAN/wuman_cuanguiwang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/pugan/__闲置__pugan_04.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/HEXI/__闲置__HEXI_01.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/TIBET/humi_zhentan.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/WESTERN/xiliao_yelvdashi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/HEXI/chile_hulvjin.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/HEXI/dai_d_tuobashiyijian.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/erzhu_erzhurong.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/HEXI/fushi_fuhong.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/HEXI/guiyi_caoyijin.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/helian_helianbobo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/hunxie_xuziwei.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/juyan_d_liling.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/weiming_lijiqian.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/shache_xian_suoche_shachexian.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/HEXI/xingxingxia_guoxiaoke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/yeli_yeliwangrong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/da_yuan_kuokuotiemuer.png": {
            "scale": 1.19,
            "offsetX": 1,
            "offsetY": -2
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/HEXI/zhai_han_dongyi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/JAPAN/__闲置__JAPAN_01.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/JAPAN/__闲置__JAPAN_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/__闲置__JAPAN_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/__闲置__JAPAN_06.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/__闲置__JAPAN_07.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/__闲置__JAPAN_08.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/JAPAN/__闲置__JAPAN_09.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JAPAN/__闲置__JAPAN_11.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JAPAN/__闲置__JAPAN_13.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/__闲置__JAPAN_14.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/aizu_pushengshixiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/anmei_yuwandaqin.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JAPAN/ayinu_hushemoquan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JAPAN/beihai_shamusheyun.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/chosokabe_changzongwobuyuanqin.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JAPAN/higo_d_juchiwuguang.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JAPAN/iyo_d_cunshangwuji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JAPAN/izumo_shanzhonglujie.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/JAPAN/jinchuan_jinchuanyiyuan.png": {
            "scale": 1.07,
            "offsetX": 21,
            "offsetY": -14
        },
        "/assets/JAPAN/kaga_d_xiajianlailian.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/kai_wutianxinxuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/JAPAN/kakizaki_liqiqingguang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JAPAN/mino_dagujiji.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/JAPAN/osumi_ganfujianxu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/JAPAN/otomo_d_lihuadaoxue.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/owari_zhitianxinchang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/JAPAN/sagami_beitiaoshikang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/sanada_d_zhentianxingcun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JAPAN/satsuma_daojinjiajiu.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/suwa_d_zoufanglaizhong.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/taira_pingzhisheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/yamato_nanmuzhengcheng.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/JAPAN/yizhi_beigou.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JAPAN/zhuqian_shaoerzineng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/JIANGNAN/fu2_zhoudi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/hu_d_husansheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/jiang_s_huanggai.png": {
            "scale": 1.36,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/jiujiang_zhouyu.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/lujian_zhanghuangyan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JIANGNAN/qian_d_yudayou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/qiufu_qiufu.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/JIANGNAN/ruochu_doulian.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/shanyue_sunce.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/she_ethnic_leiwanxing.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/wan_liuyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/wan_lukang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/wang_s_wanghua.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JIANGNAN/wenling_shilang.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JIANGNAN/wuling_xiangdancheng.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/JIANGNAN/xie_xiefangde.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/JIANGNAN/yezongliu_yezongliu.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/JIANGNAN/ying_caojingzong.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/KOREA/__闲置__KOREA_02.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/KOREA/chungju_d_quanli.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/KOREA/danluo_jintongjing.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/KOREA/donghui_nanlv.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/KOREA/gaya_jinshoulu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/goryeo_jianghanzan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/hui_bunaihou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/KOREA/jingcheng_d_yuyouzhao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/KOREA/joseon_lichenggui.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/KOREA/lelang_wangqi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/KOREA/luzhou_zhangwenxiu.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KOREA/naju_d_wangjian_wangye.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/KOREA/sabeol_jinshimin.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/KOREA/sambyeol_lishunchen.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/ssangseong_cuiying.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/KOREA/ssangseong_lizichun.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/woju_yinguan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/KOREA/xingliao_dayanlin.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/buyi_d_weichaoyuan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/cen_d_cenmeng.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": -12
        },
        "/assets/LINGNAN/daozhou_yangzaixing.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/xianqin/__闲置__xianqin_02.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/dengmaoqi_dengmaoqi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/dongzu_wumian.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/panjun/__闲置__PANJUN_05.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/geng_gengjingzhong.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/guangzhou_liuyin.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/jing_dingbuling.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/longwu_huangdaozhou.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/panjun/__闲置__PANJUN_01.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/miao_qing_yangwanzhe.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/xianqin/linhu_mafang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/panyao_panhu.png": {
            "scale": 1.06,
            "offsetX": 22,
            "offsetY": 26
        },
        "/assets/LINGNAN/qian_songjingyang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/LINGNAN/shaozhou_zhangzhensun.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/xianqin/yan_leyi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/guide_d_xiaohe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/xinjiang_maji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/yingzhou_liuyan.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/litang/__闲置__litang_05.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/liuhan/suzhou_huoqubing.png": {
            "scale": 1.07,
            "offsetX": 1,
            "offsetY": -11
        },
        "/assets/liuhan/xiyuduhu_banchao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/liuhan/__闲置__liuhan_01.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/liuhan/__闲置__liuhan_04.png": {
            "scale": 1.37,
            "offsetX": 0,
            "offsetY": -73
        },
        "/assets/liuhan/__闲置__liuhan_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/liuhan/__闲置__liuhan_06.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/liuhan/dixiang_wangmang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/liuhan/quli_chentang.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/manqing/qinghai_yuezhongqi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/manqing/__闲置__manqing_01.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/manqing/__闲置__manqing_02.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/manqing/__闲置__manqing_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/manqing/__闲置__manqing_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/manqing/__闲置__manqing_05.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/NORTHEAST/wula_buzhantai.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/manqing/__闲置__manqing_06.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/NORTH/liangshidu_longjia.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/NORTH/pinghai_laihuer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTH/qingyuan_bd_zhoudewei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTH/shanrong_lanyu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/NORTH/you_gengyan.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/guzhu_tianyu.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTH/jianzhou_nvzhen_limanzhu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/haixi_nvzhen_baiyindali.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/NORTHEAST/heishui_nishuli.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTHEAST/jilin_fujun.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/NORTHEAST/keerqin_aoba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/kuye_kuye_qichayi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/NORTHEAST/mao_wenlong_maowenlong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/NORTHEAST/nifuhe_baerhudai.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/nuergan_kangwang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/NORTHEAST/suolun_bomuboguoer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/NORTHEAST/sushen_tudiji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/NORTHEAST/wure_wuzhaodu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/NORTHEAST/yehe_jintaiji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/yilou_naoya.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_02.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/xibo_d_tubote.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/nvguo_mojie.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/NORTHEAST/dongping_langtan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/NORTHEAST/dongxia_puxianwannu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/ewenki_gentemuer.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/NORTHEAST/feiyaka_cemutehe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/panjun/__闲置__PANJUN_13.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/panjun/jibei_xuxuan.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/panjun/__闲置__PANJUN_14.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/panjun/__闲置__PANJUN_17.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/panjun/__闲置__PANJUN_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/panjun/__闲置__PANJUN_19.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/panjun/baibo_guotai.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": 20
        },
        "/assets/panjun/dashun_lizicheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/panjun/__闲置__PANJUN_04.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/panjun/__闲置__PANJUN_06.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/WESTERN/__闲置__WESTERN_01.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/panjun/__闲置__PANJUN_12.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/TIBET/gar_kham_dengbazeren.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/qiemo_anmoshenpan.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/ashina_ashinayandou.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/b45b886b-2bd2-490c-b637-2be609461f8e.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/bayegu_qulishi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/TIBET/gling_lingesar.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/bulat_beiduanchaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/TIBET/xiaobolu_meijinmang.png": {
            "scale": 1.26,
            "offsetX": -3,
            "offsetY": -9
        },
        "/assets/STEPPE/buriat_tumenjiergale.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/chechen_chechenhanshuolei.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/TIBET/lopi_abo.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/STEPPE/chenli_d_wutang.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/STEPPE/dingling_weilu.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/donghu_tuiyin.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/duolu_ashinahelu.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/tsangpa_pengcuonanjie.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/gaoche_afuzhiluo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/geluolu_chisipijia.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/golog_wandezhaxi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/heisha_d_houlihu.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/lang_clan_jiangqujianzan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/hongirad_dexuechan.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/STEPPE/huihu_dunmohedagan.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/huyan_peicen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/TIBET/ali_gandancaiwang.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/jiluo_d_douxian.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/TIBET/gongbu_gongbumangbuzhi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/kereyid_wanghan.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/STEPPE/kiyad_yesugai.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/kumo_xiwanghuilibao.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/TIBET/nandou_sushili.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/mengwu_hebulehan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/TIBET/pazhu_redangunsangpa.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/STEPPE/naiman_taiyanghan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/jiantang_sangjiejia.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/nuoyan_d_sanyinnuoyan.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/STEPPE/ogodei_chuoermahan.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/niang_suonanjiabo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/STEPPE/ongut_alawusi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/qidan_shulvping.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/TIBET/gaxa_zhashi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/yangguan_lihao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/shiwei_saihou.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/sunite_sousai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/STEPPE/tatar_mieguzhen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/tumed_andahan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/tumengken_tumengken.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/STEPPE/tushetu_tuxietuhan.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/tuva_qinggunzabu.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/kangba_suonuomugunbu.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/shanshan_weituqi.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/daca_dacajilong.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/wuhuan_tadun.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/WESTERN/qiuci_baiba.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/wuli_d_celeng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/shaodang_mitang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/wuyuan_d_chengui.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/khoshut_gushihan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/wuzhumuqin_duoerji.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/TIBET/nanjie_nanjiewangqiu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/STEPPE/xiongnu_maodun.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/TIBET/supi_xinuoluo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/xueyantuo_yinan.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/TIBET/xihai_d_fulianchou.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/STEPPE/yaoluoge_yaoluogepusa.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/WESTERN/zhuxie_zhuxiechixin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/yuan_d_hubilie.png": {
            "scale": 1.15,
            "offsetX": 4,
            "offsetY": -14
        },
        "/assets/STEPPE/yujiulu_yujiulv.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WESTERN/huite_amuersana.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/TIBET/tuyu_d_kualv.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/zhadalan_zhamuhe.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/TIBET/xiangxiong_limixia_x.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/STEPPE/zhuerqi_sachabieqi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/zubu_mogusi.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/monpa_meire.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/445d9924-1004-4813-bce9-964405472d5b.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/TIBET/anding_wei_buyantiemuer.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/TIBET/bailan_pabala.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/TIBET/dalung_sangjiwen.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/dong_nangqianjiabo.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/TIBET/dulan_dashibatuer.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/fuguo_yizeng.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/ganden_zongkaba.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/gurkha_baduersaye.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/jinchuan_g_shaluoben.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/TIBET/kalun_dexinga.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/WESTERN/weili_weilifan.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/TIBET/karmapa_queyingduoji.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/TIBET/keliya_fuduxin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/khyungpo_qiongbobangse.png": {
            "scale": 1.04,
            "offsetX": 32,
            "offsetY": 6
        },
        "/assets/TIBET/kongsa_kongsayiduo.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/tubo_songzanganbu.png": {
            "scale": 1.09,
            "offsetX": 7,
            "offsetY": 9
        },
        "/assets/TIBET/yangtong_chisongdezan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/bailong_suomai.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/duerbote_duerbote_taiji.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/kala_satuke.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/WESTERN/kepantuo_dulimi.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/ruoqiang_quhulai.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/tujishi_sulukehan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/xiye_zihe.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/WESTERN/yiduhu_baershu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/wuzhou/__闲置__wuzhou_02.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/wuzhou/__闲置__wuzhou_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/wuzhou/__闲置__wuzhou_04.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/wuzhou/__闲置__wuzhou_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/wuzhou/__闲置__wuzhou_06.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/wuzhou/__闲置__wuzhou_07.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/wuzhou/__闲置__wuzhou_08.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/wuzhou/__闲置__wuzhou_09.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/wuzhou/__闲置__wuzhou_10.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/wuzhou/__闲置__wuzhou_11.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/wuzhou/__闲置__wuzhou_12.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/wuzhou/__闲置__wuzhou_13.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/wuzhou/__闲置__wuzhou_14.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/wuzhou/__闲置__wuzhou_15.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/wuzhou/__闲置__wuzhou_16.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/wuzhou/__闲置__wuzhou_17.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/wuzhou/__闲置__wuzhou_18.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/wuzhou/__闲置__wuzhou_19.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/xianqin/__闲置__xianqin_01.png": {
            "scale": 0.75,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/xianqin/__闲置__xianqin_04.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/xianqin/__闲置__xianqin_06.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/xianqin/__闲置__xianqin_07.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/xianqin/__闲置__xianqin_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/xianqin/__闲置__xianqin_11.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/yingqin/__闲置__yingqin_01.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/yingqin/__闲置__yingqin_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/yingqin/__闲置__yingqin_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/yingqin/__闲置__yingqin_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/yingqin/__闲置__yingqin_06.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/yingqin/__闲置__yingqin_08.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/yingqin/__闲置__yingqin_09.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/yingqin/__闲置__yingqin_10.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/yingqin/__闲置__yingqin_11.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/yingqin/ruo_wangjian.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/zhaosong/sizhou_hanshizhong.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/zhaosong/tingzhou_d_chenmin.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/zhaosong/zaoyang_d_menggong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/zhaosong/__闲置__zhaosong_03.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhaosong/__闲置__zhaosong_08.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/__闲置__zhaosong_09.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/zhaosong/__闲置__zhaosong_11.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/zhaosong/__闲置__zhaosong_12.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/zhaosong/changshaguo_xinqiji.png": {
            "scale": 0.9,
            "offsetX": 3,
            "offsetY": -39
        },
        "/assets/zhaosong/changshan_yangyanzhao.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/zhaosong/chaozhou_d_zhangshijie.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/BASHU/__闲置__BASHU_01.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/liuhan/chagatai_genggong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/liuhan/__闲置__liuhan_07.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/liuhan/__闲置__liuhan_08.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/liuhan/you_gengkuang.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/yingqin/wazhai_zhanghan.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/xianqin/liguo_zhaoshe.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/xianqin/image (3).png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/dayuan_wugua.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/image (3).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/xiutu_jinridi.png": {
            "scale": 0.95,
            "offsetX": 15,
            "offsetY": 18
        },
        "/assets/manqing/weiyuan_d_niangengyao.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JAPAN/totomi_jiujingzhongci.png": {
            "scale": 0.97,
            "offsetX": 3,
            "offsetY": -28
        },
        "/assets/HEXI/lushui_dongzhuo.png": {
            "scale": 1.19,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/LINGNAN/__闲置__LINGNAN_05.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/__闲置__LINGNAN_04.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL/bozhou_d_yujin.png": {
            "scale": 1.21,
            "offsetX": 7,
            "offsetY": 30
        },
        "/assets/litang/933b26bc-2039-4370-a3d9-52ac5074f9da.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/litang/liwang_liguangbi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/image (3).png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/BASHU/tujia_d_qinliangyu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_09.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL/__闲置__CENTRAL_10.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/__闲置__CENTRAL_12.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/__闲置__CENTRAL_14.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/__闲置__CENTRAL_15.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL/image (6).png": {
            "scale": 1.41,
            "offsetX": -42,
            "offsetY": -25
        },
        "/assets/xianqin/__闲置__xianqin_15.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL/xichu_xiangyu.png": {
            "scale": 1.32,
            "offsetX": -33,
            "offsetY": -30
        },
        "/assets/liuhan/dongsheng_weishang.png": {
            "scale": 1.42,
            "offsetX": 0,
            "offsetY": -76
        },
        "/assets/HEXI/__��置__HEXI_06.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/ningkou_lubode.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/LINGNAN/__闲置__LINGNAN_06.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/litang/li_s_gaopian.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/JIANGNAN/image (3).png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JIANGNAN/image (4).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JIANGNAN/image (5).png": {
            "scale": 1.31,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/image (6).png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JIANGNAN/danyang_huanwen.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/BASHU/__闲置__BASHU_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/BASHU/yidou_luxun.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/heng1_yangye.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTH/__闲置__NORTH_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/xianqin/yangshe_yangshezhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_03.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WESTERN/__闲置__WESTERN_09.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/gaochang_quwentai.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_01.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_01.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/JIANGNAN/yiyang_d_mengzongzheng.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/yuezhi_xihou.png": {
            "scale": 1.25,
            "offsetX": -10,
            "offsetY": -6
        },
        "/assets/LINGNAN/image (7).png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LINGNAN/lancang_faang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/LINGNAN/leloi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/liuzhou_shenxiyi.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/minyue_wuzhu.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_07.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -50
        },
        "/assets/LINGNAN/funan_fanman.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_01.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_03.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_02.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/zhongxiang_ganning.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/ahaomu_laqite.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/DIANQIAN/jingpozu_zaodan.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/DIANQIAN/shuizu_panxinjian.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/wazu_banhongwang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/DIANQIAN/4ed4d425-3088-4492-871f-44685847ef73.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__闲置__LINGNAN_08.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/DIANQIAN/dali_duansiping.png": {
            "scale": 1.04,
            "offsetX": 10,
            "offsetY": 5
        },
        "/assets/CENTRAL/__闲置__CENTRAL_16.png": {
            "scale": 1.04,
            "offsetX": 2,
            "offsetY": 7
        },
        "/assets/xianqin/yun_wuli.png": {
            "scale": 1.2,
            "offsetX": -7,
            "offsetY": -47
        },
        "/assets/JIANGNAN/sunwu_d_sunquan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/panjun/xushouhui_zhaopusheng.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/DIANQIAN/hantawadi_mangyinglong.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/DIANQIAN/dongxu_mangruiti.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/TIBET/__闲置__TIBET_07.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/manqing/xining_yangyingju.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LINGNAN/__闲置__LINGNAN_09.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/panjun/__闲置__PANJUN_20.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/panjun/shuntian_linshuangwen.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/__闲置__zhaosong_15.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/zhaosong/kejia_wentianxiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/HEXI/__闲置__HEXI_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/__闲置__xianqin_17.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/mi_chu_xionglv.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JIANGNAN/hao_d_weirui.png": {
            "scale": 1.02,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/LINGNAN/__闲置__LINGNAN_11.png": {
            "scale": 0.98,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/xianqin/__闲置__xianqin_18.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/HEXI/__闲置__HEXI_07.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/ganzhou_dourong.png": {
            "scale": 1.08,
            "offsetX": 9,
            "offsetY": -30
        },
        "/assets/HEXI/__闲置__HEXI_08.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/zhaosong/didao_wangshao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/li_lx_d_liguang.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/HEXI/__闲置__HEXI_09.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/zhaosong/wei2_hunjian.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/xianqin/mi_chu_xiongl.png": {
            "scale": 0.96,
            "offsetX": 15,
            "offsetY": -13
        },
        "/assets/BASHU/__闲置__BASHU_05.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/liuhan/5d263c36-ae08-49a9-91c4-aeb9ff112d0d.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/2ba01e9a-2f66-42ae-aad5-05fd10277c80.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/liuhan/ae7ceac2-35d9-4622-840f-925adb4672a6.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/e4a392ed-0c67-4c60-bb74-36d971cb0de5.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/liuhan/image (3).png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/liuhan/ningkou_liling.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/fe065421-8138-421d-8529-65c11b533366.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/fushi_wangmeng.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/LINGNAN/__闲置__LINGNAN_12.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/monong_anong.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_02.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/__闲置__WESTERN_10.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/guishuang_qiujiuque.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/HEXI/__闲置__HEXI_10.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/zhaosong/qing_quduan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/cd898a76-c2bd-4e43-865a-7955b80a131a.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 39
        },
        "/assets/daming/__闲置__daming_05.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -78
        },
        "/assets/daming/luming_luxiangsheng.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/86286716-10b4-4fe2-81f7-c13a19de923f.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/daming/863017b5-b221-4c39-9740-c41c1be2bc99.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/daming/e8efd876-6d2c-4361-96a3-8ac51d086b9d.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/daming/__闲置__daming_07.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WESTERN/__闲置__WESTERN_08.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/HEXI/__闲置__HEXI_04.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/__闲置__HEXI_05.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/HEXI/__闲置__HEXI_06.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/b80a8ff1-565b-4bbd-b68e-2cb07949897b.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/HEXI/eecf4ee9-ec8e-499a-9db2-f8bd0e4813ad.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/HEXI/guazhou_zhangshougui.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/__���������__HEXI_11.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/HEXI/dangxiang_liyuanhao.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/litang/pingyuan_yanzhenqing.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_05.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL/__闲置__CENTRAL_17.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/tongzhou_liuzhiyuan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/__闲置__STEPPE_11 (4).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/JIANGNAN/1eb41bd5-28e6-421d-9882-5e670e8cad91.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/JIANGNAN/4d0dadb2-850d-4430-8635-dfd049badbbd.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/LINGNAN/__闲置__LINGNAN_13.png": {
            "scale": 1.02,
            "offsetX": 10,
            "offsetY": -2
        },
        "/assets/litang/bing_liji.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/LINGNAN/5cd1cab7-d441-49ce-83b0-f56bf865de90.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/liuhan/xianyu_hanxin.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/litang/6f7b4bd1-2624-47f0-9566-e72bab3383b7.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/litang/loufan_xuerengui.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTH/cangzhou_liurengong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/panjun/314e32cf-e77f-4ae9-8ba4-fdbbb854e9c1.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/panjun/2365145d-4382-4b13-bbf5-b012841a816b.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/panjun/__闲置__PANJUN_21.png": {
            "scale": 1,
            "offsetX": 11,
            "offsetY": 20
        },
        "/assets/panjun/taiping_shidakai.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/421c32ce-68bc-4bb0-913c-b0c91f66c5dd.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/74520659-1209-44a3-8aed-e0fb4a97d1a2.png": {
            "scale": 1.43,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/CENTRAL/8bf641ba-9926-4c3b-a9f0-6904c4aa086c.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL/9261ba93-3594-4d29-a361-ca00f2fb0913.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/c5d601eb-00ba-436a-a7ef-ec78b96cc899.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/ee53a39a-d90d-49b2-ac8d-60d9c17985ac.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/f20803cb-5ba5-46c5-abfa-20613cce89a5.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/CENTRAL/faa232b4-98d9-4644-9e6c-9fd4a10b55c0.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/__闲置__STEPPE_19.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/NORTHEAST/xingan_hailancha.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/yel_yelvxiuge.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/__闲置__TIBET_08.png": {
            "scale": 1.17,
            "offsetX": 1,
            "offsetY": -2
        },
        "/assets/TIBET/xianlingqiang_dianling.png": {
            "scale": 1.15,
            "offsetX": 4,
            "offsetY": -5
        },
        "/assets/STEPPE/__闲置__STEPPE_21.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/STEPPE/oirat_ming_gaerdan.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/__闲置__STEPPE_22.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/xiajiasi_are.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/wala_yexian.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/6ffc995c-a920-45a6-9a6a-5cb6b1622195.png": {
            "scale": 1.08,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/STEPPE/wuliangha_subutai.png": {
            "scale": 1.03,
            "offsetX": 6,
            "offsetY": -17
        },
        "/assets/JAPAN/__闲置__JAPAN_16.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_04.png": {
            "scale": 1.42,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/STEPPE/__闲置__STEPPE_09.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/__闲���__STEPPE_11.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_17.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/0922ac91-5b31-4416-9804-4ca62b2ee88d.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/STEPPE/1f3ef791-caef-43ab-84c3-4f75d51154da.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/53dbecdd-f8df-4e50-bc2c-cebba9837d6a.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/STEPPE/60ca865b-890d-4dbe-b2e3-77ce38c9967c.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/72872c34-4021-4873-a89b-67bdcc7d4b47.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/7d5762a6-c49f-416c-9182-400cf75f08d5.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/8a9ff1d1-acf1-452e-985c-de4b1d53e894.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/a390257b-aa16-4af2-a10f-2ff64b32ba9f.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/STEPPE/a45eff53-6163-4553-9d3c-78d51d4ce306.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/STEPPE/ashide_ashidejieli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/hor_chisang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/b1aa3574-037e-4d9c-8ba4-6055e9457889.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/b9d275aa-b98a-4d60-94f6-542c69b06f3c.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/d63618f2-024f-4a92-a711-3eb4c5748f27.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/f2031e79-07f3-4bd2-85ef-757697c5c9e1.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/ef5ba038-cc0e-4045-91e3-bf382ed4cace.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/STEPPE/image (8).png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/__闲置__CENTRAL_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/__闲置__HEXI_12.png": {
            "scale": 0.98,
            "offsetX": 3,
            "offsetY": 0
        },
        "/assets/STEPPE/shizhao_d_shihu.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/dingzhou_murongchui.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/yingzhou_ying_d_muronghuang.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/NORTH/__闲置__NORTH_06.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BASHU/__闲置__BASHU_06.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/wudu_dengai.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/__闲置__JAPAN_15.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JAPAN/48fb6c70-ae5d-49df-9eab-cb95ae2cb1ba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JAPAN/7f03722d-7790-489a-b88b-5d3f3feb180a.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JAPAN/bf33686d-bf7b-4932-baf0-baaf6871f620.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/JAPAN/__闲置__JAPAN_17.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/fujiwara_yuanyijing.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/DIANQIAN/pagan_anulvtuo.png": {
            "scale": 1.02,
            "offsetX": 3,
            "offsetY": -43
        },
        "/assets/liuhan/lulin_liuxiu.png": {
            "scale": 1.07,
            "offsetX": 10,
            "offsetY": 0
        },
        "/assets/NORTH/__闲置__NORTH_07.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/NORTH/mushi_muchong.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_07.png": {
            "scale": 1.2,
            "offsetX": 12,
            "offsetY": -1
        },
        "/assets/JIANGNAN/xiao_d_xiaoyan.png": {
            "scale": 1.13,
            "offsetX": 4,
            "offsetY": -30
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_06.png": {
            "scale": 1.11,
            "offsetX": 4,
            "offsetY": 13
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_07.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/litang/3d3a1cda-411e-4644-a66a-5b9d8ae814c3.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/litang/anxi_guoxin.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/litang/c19773f7-25bc-4197-909d-2166c9545fd9.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/litang/f0d64fbd-6b9d-4584-a588-f740a4ec3394.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/TIBET/__闲置__TIBET_09.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/litang/jiashi_wangxuance.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_24.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/yuwen_yuwentai.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/STEPPE/__闲置__STEPPE_25.png": {
            "scale": 1.03,
            "offsetX": -18,
            "offsetY": -28
        },
        "/assets/STEPPE/tuoba_tuobagui.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_26.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/yunzhong_tuobaliwei.png": {
            "scale": 1.22,
            "offsetX": -22,
            "offsetY": 30
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_08.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/xianbei_tuobamao.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/STEPPE/murong_murongke.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/STEPPE/__闲置__STEPPE_28.png": {
            "scale": 1.08,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/STEPPE/xiongding_murongyong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/STEPPE/__闲置__STEPPE_32.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/litang/lingzhou_puguhuaien.png": {
            "scale": 1.07,
            "offsetX": 3,
            "offsetY": -21
        },
        "/assets/litang/pugu_puguhuaien.png": {
            "scale": 1.07,
            "offsetX": 3,
            "offsetY": -21
        },
        "/assets/STEPPE/__闲置__STEPPE_33.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/STEPPE/chahar_yantiemuer.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/yao_liuyuan.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_16.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/LINGNAN/zangke_xielongyu.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/litang/song2_houjunji.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/__闲置__STEPPE_30.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/c92a7393-bf14-403d-a90e-7f9671721d03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_17.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/WESTERN/__闲置__WESTERN_14.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/xiliao_yeldashi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/__闲置__STEPPE_34.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/KOREA/xuantu_yuangaisuwen.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/2dce8f19-3676-4a0a-ad1f-1681c9b30fb3.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_19.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/yizhou_wanyanloushi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/3f2c529a-23f6-41e2-9caf-8c8e0d475fd4.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/dazhen_wanyantiege.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/61191f6b-a9fe-44ae-829e-7023c5a8524f.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_21.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTHEAST/jurchen_wanyanzongbi.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_22.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/xiqin_wanyanchenheshang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/d8a391c9-11db-4971-b6c4-9c33c54bafce.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/e1d99529-303b-417a-bac1-2a0f351cf552.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_23.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/mohe_wanyanzonghan.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/STEPPE/baidi_baidizi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/daming/xuan_xuda.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/__闲置__STEPPE_35.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/xianqin/wuzhou_limu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTH/__闲置__NORTH_02.png": {
            "scale": 1.15,
            "offsetX": 21,
            "offsetY": -11
        },
        "/assets/CENTRAL/yingzhou_d2_licunxu.png": {
            "scale": 0.95,
            "offsetX": 7,
            "offsetY": 4
        },
        "/assets/zhaosong/__闲置__zhaosong_17.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": 24
        },
        "/assets/zhaosong/kang_liangshidou.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/f93afb4f-8aa3-4f0a-a44e-a55b9b6a6895.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/liuhan/__闲置__liuhan_14.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/liuhan/shuofang_weiqing.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/834bfad2-d9b4-437b-9b25-cdea395f3174.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_05.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/37a789b9-c992-4ad7-8704-97c37ab07555.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL_ASIA/cd31f427-daff-441f-8442-bb5f0f485fd5.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/chongfu/__闲置__CENTRAL_ASIA_03.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL_ASIA/xisi_yakubusafaer.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_06.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/mamon_mameng.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/dai_d_shijingtang.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/__闲置__WESTERN_15.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WESTERN/tuerhute_wobaxi.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/daming/shanrong_lanyu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JAPAN/__闲置__JAPAN_21.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JAPAN/aki_maoliyuanjiu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JAPAN/jibei2_qingshuizongzhi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_14.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/JIANGNAN/sui_yangjian.png": {
            "scale": 1.1,
            "offsetX": 13,
            "offsetY": -12
        },
        "/assets/STEPPE/__闲置__STEPPE_36.png": {
            "scale": 1.41,
            "offsetX": 0,
            "offsetY": 42
        },
        "/assets/liuhan/pulei_dougu.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/__闲置__STEPPE_37.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/merkit_boyan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/litang/487e6abd-6c33-4c4b-af83-151cb4a0241b.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/litang/1176b643-44eb-4fd6-a0cd-de3119fa8ebf.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/litang/zhongshan_yangaoqing.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/__闲置__STEPPE_29.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/jiyuan_huluguang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/kelie_zhaheganbu.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/TIBET/spurgyal_dariniansai.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/xianqin/__闲置__xianqin_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/CENTRAL/huang_d_jiakui.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/liuhan/__闲置__liuhan_15.png": {
            "scale": 0.86,
            "offsetX": 12,
            "offsetY": -79
        },
        "/assets/STEPPE/xijue_zhizhichanyu.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/litang/dingxiang_d_lijing.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/zhaosong/hezhou_wangjian.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": 7
        },
        "/assets/BASHU/cuanshi_cuanlongyan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__闲置__LINGNAN_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/xinggu_cuanxi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/nanzhong_mazhong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTH/__闲置__NORTH_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/NORTH/wangyan_wangyan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_19.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__闲置__LINGNAN_20.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/haikou_wangzhi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/LINGNAN/__闲置__LINGNAN_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/__闲置__LINGNAN_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/zhuang_d_washifuren.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL/__闲置__CENTRAL_32.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/zhaosong/yanchuan_d_yuefei.png": {
            "scale": 1.18,
            "offsetX": 4,
            "offsetY": -28
        },
        "/assets/liuhan/__闲置__liuhan_16.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/liuhan/li_s_mayuan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JIANGNAN/43feabe5-8631-46c6-8142-cd21b9a55d9b.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_15.png": {
            "scale": 1,
            "offsetX": 9,
            "offsetY": -5
        },
        "/assets/JIANGNAN/wang_d_liuyu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_11.png": {
            "scale": 1.33,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JIANGNAN/shaozhou_d_mayin.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/256f5692-ae13-43b4-b4f9-6d4f3fcde1f2.png": {
            "scale": 1.14,
            "offsetX": -1,
            "offsetY": -3
        },
        "/assets/JIANGNAN/yue_d_lusu.png": {
            "scale": 1.14,
            "offsetX": -1,
            "offsetY": -3
        },
        "/assets/xianqin/__闲置__xianqin_13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/xianqin/2a9cdb35-74ab-46dc-a251-a299886e3e5f.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/xianqin/huo_songlaosheng.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/xianqin/kong_d_caogui.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/manqing/c37ad1b0-954c-4129-93ef-673a6ef6a391.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/manqing/gumie_lizhifang.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/NORTH/7dd90b55-118c-4a15-8abc-3278f4a49073.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/NORTH/cai_shile.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/manqing/agui_agui.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL/beca0063-3022-4b61-9191-ef9d9ed760ae.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/__闲置__CENTRAL_33.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL/hongnong_jun_yangsu.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/litang/image (3).png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_34.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -14
        },
        "/assets/litang/weihaiwei_sudingfang.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/__闲置__LINGNAN_24.png": {
            "scale": 1,
            "offsetX": -19,
            "offsetY": -16
        },
        "/assets/daming/guizhou_lidingguo.png": {
            "scale": 0.95,
            "offsetX": 4,
            "offsetY": -1
        },
        "/assets/WESTERN/__闲置__WESTERN_16.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/litang/8b599600-7767-442a-ba74-244a39b9ffdf.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/bdbe41bd-e912-42ac-8917-13c6fa83bdfc.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/litang/fa3d3b7a-a752-42c1-b564-87fef1dbd270.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/litang/f183819f-e5ec-42fb-9814-f6c3ff119d0c.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/hepan_gaoxianzhi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_16.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/daming/chizhou_changyuchun.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 1.21,
            "offsetX": 14,
            "offsetY": -3
        },
        "/assets/litang/__闲置__litang_02.png": {
            "scale": 1.29,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/litang/juandu_peixingjian.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/panjun/fangla_fangla.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/WESTERN/__闲置__WESTERN_17.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/saman_yisimayi.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/__闲置__LINGNAN_25.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LINGNAN/luodian_shexiangfuren.png": {
            "scale": 0.93,
            "offsetX": 1,
            "offsetY": -6
        },
        "/assets/LINGNAN/luodian_shexiang.png": {
            "scale": 0.93,
            "offsetX": 1,
            "offsetY": -6
        },
        "/assets/DIANQIAN/20e2a9c2-62bb-4bae-b424-0f6a6bec4105.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/DIANQIAN/30af1504-6d64-4b14-90e6-cf3ef0f41365.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/DIANQIAN/dian_duansiping.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/TIBET/__闲置__TIBET_12.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/TIBET/qifu_d_qifuchipan.png": {
            "scale": 1.17,
            "offsetX": 11,
            "offsetY": -4
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_24.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/wuji_yilizhi.png": {
            "scale": 1.2,
            "offsetX": 7,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/guzgan_abuhalisi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/9ef0f16d-448b-4e10-873e-4e5027693e11.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/80a96ee1-15f1-42cd-b88d-afb2dda3c6b8.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/ad4adc41-8c01-45e5-8585-f0fbd013e135.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/CENTRAL_ASIA/be23071b-7d43-482c-ac93-57a4956eb02f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_08.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/__闲置__LINGNAN_26.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/LINGNAN/nongzhigao_huangshimi.png": {
            "scale": 1.11,
            "offsetX": 14,
            "offsetY": 24
        },
        "/assets/CENTRAL/__闲置__CENTRAL_28.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_18.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/JIANGNAN/taizhou_libian.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JIANGNAN/li_bian.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/daming/dongshengwei_wangyue.png": {
            "scale": 0.97,
            "offsetX": 19,
            "offsetY": 42
        },
        "/assets/JAPAN/__闲置__JAPAN_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/JAPAN/gonggu_gonggudaozhu.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/daming/image (3).png": {
            "scale": 1.07,
            "offsetX": 10,
            "offsetY": 6
        },
        "/assets/daming/__闲置__daming_13.png": {
            "scale": 0.98,
            "offsetX": 9,
            "offsetY": 5
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": 6
        },
        "/assets/xianqin/__闲置__xianqin_24.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 1.02,
            "offsetX": 32,
            "offsetY": -54
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_11.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/DIANQIAN/nanzhao_geluofeng.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/__闲置__STEPPE_38.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/__闲置__STEPPE_39.png": {
            "scale": 1,
            "offsetX": 2,
            "offsetY": 42
        },
        "/assets/STEPPE/jalair_muhuali.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/yingqin/baiyang_mengtian.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_19.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/yang_zhou_yangxingmi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_20.png": {
            "scale": 0.98,
            "offsetX": 5,
            "offsetY": 0
        },
        "/assets/JIANGNAN/liu_yingbu.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_12.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_13.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/DIANQIAN/pagan_anultuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/LINGNAN/__闲置__LINGNAN_27.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 43
        },
        "/assets/DIANQIAN/paiwan_alugu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/JAPAN/__闲置__JAPAN_20.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/__闲置__STEPPE_40.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/zhasaketu_zhasakesubadi.png": {
            "scale": 0.95,
            "offsetX": 9,
            "offsetY": 21
        },
        "/assets/CENTRAL/ranwei_d_ranmin.png": {
            "scale": 0.92,
            "offsetX": 2,
            "offsetY": 17
        },
        "/assets/CENTRAL_ASIA/dulan_d_aihamaide.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/TIBET/__闲置__TIBET_14.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/TIBET/duomi_lunkongre.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/galangdiba_wangqindundui.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/mingzheng_jianzandechang.png": {
            "scale": 0.83,
            "offsetX": 6,
            "offsetY": 8
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_16.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/DIANQIAN/hani_d_zhebi.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/daming/__闲置__JIANGNAN_19.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/daming/zu_d_yuanchonghuan.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/KOREA/__闲置__KOREA_05.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/daming/yansui_wangwei.png": {
            "scale": 1.29,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/shizhou_liucong.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/STEPPE/weiming_huhanxie.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/zhaosong/__闲置__zhaosong_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/zhaosong/yanzhou_zhongshiheng.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/zhaosong/__闲置__litang_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/zhaosong/__闲置__zhaosong_16.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/zhaosong/18eaf042-a6c4-41ce-96f2-c9b9fc832c33.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/zhaosong/2def5641-f003-4d6a-83ba-103fd2852af5.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhaosong/cc34312f-2973-450a-ac98-6df292382241.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/zhaosong/d9e9abd1-e534-4b2d-b246-885e73a28366.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/__闲置__zhaosong_19.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": -13
        },
        "/assets/zhaosong/huan_zhongshidao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_17.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/DIANQIAN/ava_sijifa.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTHEAST/huimo_gaoyanshou.png": {
            "scale": 1.12,
            "offsetX": 3,
            "offsetY": -7
        },
        "/assets/zhaosong/shenshi_wentianxiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/shenshi_shenqingzhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTH/c425ce42-7fc4-4e93-abf1-7e5ad7fde4aa.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
            "scale": 1.05,
            "offsetX": 9,
            "offsetY": -25
        },
        "/assets/STEPPE/3113431b-d5dd-43bd-8493-333ad7a3738a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/STEPPE/10c6eef2-3174-4004-b7f9-ebaeaaae4f4b.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/dongdan_yelbei.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/houliao_yelliuge.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/STEPPE/image (3).png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/STEPPE/yel_yelxiuge.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_36.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/tongma_taishici.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": -33
        },
        "/assets/JAPAN/__闲置__JAPAN_19.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_21.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/ouyang_ouyangwei.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/panjun/huangwang_huangchao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_10.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/CENTRAL_ASIA/kangju_chebishi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_18.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/xianqin/dianguo_zhuangqiao.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_11.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/huluo_jiyasiding.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/wuzhou/xian_d_xianfuren.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_12.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_13.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/jibin_jianisejia.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/__闲置__JAPAN_24.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/JAPAN/echigo_shangshanqianxin.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JAPAN/__闲置__JAPAN_25.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JAPAN/iga_d_baididanbo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/panjun/__闲置__PANJUN_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/panjun/ketagalan_huangqingyun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/TIBET/__闲置__TIBET_16.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/khon_basiba.png": {
            "scale": 0.94,
            "offsetX": 8,
            "offsetY": -9
        },
        "/assets/TIBET/__闲置__TIBET_17.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/TIBET/gongtang_gongtangcang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/WESTERN/__闲置__WESTERN_19.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/__闲置__WESTERN_20.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/KOREA/__闲置__KOREA_06.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/KOREA/chen3_jizhun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/HEXI/__闲置__CENTRAL_20.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/juqu_d_juqumengxun.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/__闲置__JAPAN_26.png": {
            "scale": 0.84,
            "offsetX": 7,
            "offsetY": -20
        },
        "/assets/JAPAN/date_d_yidazhengzong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/__闲置__LINGNAN_28.png": {
            "scale": 0.99,
            "offsetX": 7,
            "offsetY": 5
        },
        "/assets/LINGNAN/liren_funanshe.png": {
            "scale": 1.18,
            "offsetX": 20,
            "offsetY": -5
        },
        "/assets/LINGNAN/__闲置__LINGNAN_29.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/leizhou_limao.png": {
            "scale": 1.12,
            "offsetX": 30,
            "offsetY": -10
        },
        "/assets/LINGNAN/__闲置__LINGNAN_30.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/LINGNAN/duanzhou_d_caojin.png": {
            "scale": 1,
            "offsetX": 16,
            "offsetY": 8
        },
        "/assets/BASHU/__闲置__BASHU_04.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/qingqiang_jiangwei.png": {
            "scale": 1.09,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/DIANQIAN/ailao_leilao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_20.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_21.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/DIANQIAN/mon_monuhe.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/LINGNAN/__闲置__LINGNAN_31.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LINGNAN/zhancheng_zhimin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/litang/282afd3a-12fa-48b4-8c86-2c07ee12abe6.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/litang/gaoliang_geshuhan.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_22.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/DIANQIAN/konbaung_yongjiya.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_26.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/NORTHEAST/dawoer_baerdaqi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_27.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/__闲置__TIBET_18.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/TIBET/tufa_d_tufanutan.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL/__闲置__CENTRAL_37.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/litang/yuan_cj_d_lishuo.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/litang/__闲置__litang_04.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/litang/weizhou_weigao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/__闲置__LINGNAN_32.png": {
            "scale": 0.93,
            "offsetX": 1,
            "offsetY": -6
        },
        "/assets/LINGNAN/dayu_wangshouren.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_23.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/wenzhou_fangguozhen.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/wenzhou_zhangcong.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_28.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/hezhe_shaerhuda.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_29.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/nanai_zhahaluo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_30.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -62
        },
        "/assets/NORTHEAST/jilizhou_chengmingzhen.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LINGNAN/__闲置__LINGNAN_33.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/ryukyu_shangbazhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__闲置__CENTRAL_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL/__闲置__CENTRAL_19.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/HEXI/__闲置__CENTRAL_21.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL/woye_huangfugui.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_24.png": {
            "scale": 1.1,
            "offsetX": 9,
            "offsetY": -12
        },
        "/assets/CENTRAL/chuzhou_d_huangfuhui.png": {
            "scale": 1.45,
            "offsetX": 10,
            "offsetY": 27
        },
        "/assets/CENTRAL/__闲置__CENTRAL_38.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/CENTRAL/jingzhou_gs_huangfusong.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/daming/__闲置__JIANGNAN_18.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/daming/1f2009c0-955d-436a-9f93-d7e736239d9b.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/daming/__闲置__JIANGNAN_20.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/daming/qi_d_qijiguang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/LINGNAN/__闲置__LINGNAN_34.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/panjun/yang_aner_yanganer.png": {
            "scale": 1.21,
            "offsetX": 10,
            "offsetY": -18
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_31.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/maomingan_suoetu.png": {
            "scale": 0.97,
            "offsetX": 6,
            "offsetY": -9
        },
        "/assets/STEPPE/__闲置__STEPPE_43.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/rouran_shelun.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/__闲置__LINGNAN_35.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/yingqin/nanyue_zhaotuo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/xianqin/yong_lujili.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/WESTERN/__闲置__WESTERN_21.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/dzungar_galedanceling.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/HEXI/__闲置__CENTRAL_18.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/__闲置__CENTRAL_39.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/cangsong_machao.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -37
        }
    },
    "folderGuides": {
        "/assets/hexi/": {
            "samplePath": "",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/beifang/": {
            "samplePath": "",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/riben/": {
            "samplePath": "",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/yingqin/": {
            "samplePath": "",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        }
    }
};
