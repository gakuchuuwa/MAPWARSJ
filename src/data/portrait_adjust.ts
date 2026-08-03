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
        "/assets/xianqin/shang_fuhao.png": {
            "scale": 0.8985,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/litang/tang_lishimin.png": {
            "scale": 1.1934,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/liuhan/yangshao_zhoubo.png": {
            "scale": 0.9929,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/xianqin/yin_dixin.png": {
            "scale": 0.8918,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/DIANQIAN/siam_nalixuan_pugan.png": {
            "scale": 0.8766,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/DIANQIAN/chenla_duyebamoqishi.png": {
            "scale": 0.828,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/wuzhou/wuzhou_d_wuzetian.png": {
            "scale": 1.782,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/zhaosong/song_zhaokuangyin.png": {
            "scale": 0.9122,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/heyuan_d_heichichangzhi.png": {
            "scale": 1.2901,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/xianqin/chunshen_huangxie.png": {
            "scale": 1.2506,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/xianqin/dongxian_sunbin.png": {
            "scale": 0.907,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/xianqin/wu_sunwu.png": {
            "scale": 1.1506,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/gouding_wubo.png": {
            "scale": 1.0517,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/JIANGNAN/jinling_tandaoji.png": {
            "scale": 1.1446,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/DIANQIAN/dai_daoyingmeng.png": {
            "scale": 0.9175,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/xianqin/lingqiu_zhaowuling.png": {
            "scale": 1.0738,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/liuhan/huaiyang_zhouyafu.png": {
            "scale": 1.2046,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LINGNAN/dacheng_chenkai.png": {
            "scale": 0.9276,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/liuhan/han_d_liubang.png": {
            "scale": 0.8252,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/litang/qianzhou_lisheng.png": {
            "scale": 1.1834,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/yingqin/shangzhou_shangyang.png": {
            "scale": 1.0144,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/litang/shazhou_zhangyichao.png": {
            "scale": 1.011,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL/chanzhou_chairong.png": {
            "scale": 0.8246,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/zhuozhou_anlushan.png": {
            "scale": 0.8034,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/daming/linyu_wusangui.png": {
            "scale": 0.937,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/DIANQIAN/jingdong_taohong.png": {
            "scale": 0.8648,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/xianqin/han_baoyuan.png": {
            "scale": 1.1964,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/BASHU/chu_guanyu.png": {
            "scale": 1.2072,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTH/jingmen_zhaoyun.png": {
            "scale": 0.9671,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/liuhan/guangwu_xinwuxian.png": {
            "scale": 1.1425,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/DIANQIAN/luoyue_zhengce.png": {
            "scale": 0.7492,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/yingqin/qin_simacuo.png": {
            "scale": 1.0245,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.2421,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTH/dangzhou_qiangduan.png": {
            "scale": 0.913,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/tiele_qibiheli.png": {
            "scale": 0.8609,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/zhaosong/fengzhou_wujie.png": {
            "scale": 0.8109,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/daming/jinzhou_lichengliang.png": {
            "scale": 0.8359,
            "offsetX": 0,
            "offsetY": -54
        },
        "/assets/JIANGNAN/wuwu_d_lvmeng.png": {
            "scale": 0.9202,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/ruzhou_sunjian.png": {
            "scale": 1.0946,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTH/dizhou_wangyanzhang.png": {
            "scale": 0.9656,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/DIANQIAN/baiman_gaoshengtai.png": {
            "scale": 0.8223,
            "offsetX": 0,
            "offsetY": -51
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.1031,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/huang_d_jiakui.png": {
            "scale": 0.9531,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/zhaosong/yanchuan_d_yuefei.png": {
            "scale": 0.8451,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/champa_zhipenge.png": {
            "scale": 0.9094,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/DIANQIAN/luohu_ganmuding.png": {
            "scale": 0.7797,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/KOREA/baiji_jiebo.png": {
            "scale": 0.9087,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/tiemuer_tiemuer.png": {
            "scale": 1.0463,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JAPAN/ashikaga_zulizunshi.png": {
            "scale": 0.8589,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/NORTHEAST/fuyu_weichoutai.png": {
            "scale": 1.3255,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/HEXI/liangzhou_zhanggui.png": {
            "scale": 1.0657,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/TIBET/gar_lunqinling.png": {
            "scale": 0.8855,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/borjigin_tuolei.png": {
            "scale": 1.5673,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/liao_d_yelvabaoji.png": {
            "scale": 0.9035,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/edo_dechuanjiakang.png": {
            "scale": 0.8355,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/menggu_d_chengjisihan.png": {
            "scale": 0.7476,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/KOREA/gaogouli_yizhiwende.png": {
            "scale": 1.0444,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/wulianghai_chelingwubashen.png": {
            "scale": 1.0642,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.9527,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/huige_gulipeiluo.png": {
            "scale": 0.9006,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTHEAST/bohai_dazuorong.png": {
            "scale": 1.2291,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/HEXI/chijin_qiewangshijia.png": {
            "scale": 1.2313,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/cao_d_caocao.png": {
            "scale": 0.9946,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/TIBET/bailang_tangzeng.png": {
            "scale": 0.9495,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTHEAST/aola_menglielun.png": {
            "scale": 1.1008,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/dajin_wanyanaguda.png": {
            "scale": 0.9932,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/JIANGNAN/heng_hetengjiao.png": {
            "scale": 1.0993,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/NORTHEAST/eluoke_amuhaer.png": {
            "scale": 1.1829,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/NORTHEAST/jilimi_takuna.png": {
            "scale": 0.8725,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/xianqin/yue_goujian.png": {
            "scale": 1.0248,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/manqing/manzhou_nuerhachi.png": {
            "scale": 0.9125,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/manqing/aisin_d_huangtaiji.png": {
            "scale": 0.9514,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/pugu_ashinaguduolu.png": {
            "scale": 1.0447,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.3104,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/manqing/manzhou_d_duoergun.png": {
            "scale": 0.9061,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/liuhan/lanzhou_zhaochongguo.png": {
            "scale": 0.8333,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/panjun/bailian_wangconger.png": {
            "scale": 1.3298,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/keerkezi_manasi.png": {
            "scale": 0.8986,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/yangzhou_wangping.png": {
            "scale": 1.0049,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JIANGNAN/hongzhou_zhuwenzheng.png": {
            "scale": 0.8883,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JIANGNAN/linshihong_linshihong.png": {
            "scale": 1.047,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/BASHU/chenghan_lite.png": {
            "scale": 1.0226,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/huo_songlaosheng.png": {
            "scale": 0.8727,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/shu_liubei.png": {
            "scale": 0.8509,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_16.png": {
            "scale": 0.9424,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/daming/pingnan_musheng.png": {
            "scale": 0.8892,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BASHU/qingyi_fanchangsheng.png": {
            "scale": 0.9321,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JAPAN/hashiba_fengchenxiuji.png": {
            "scale": 1.06,
            "offsetX": 5,
            "offsetY": -83
        },
        "/assets/JIANGNAN/fang_guozhen_fangguozhen.png": {
            "scale": 0.9089,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/xianqin/ouyue_zouyao.png": {
            "scale": 1.078,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/NORTH/gongsun_d_gongsundu.png": {
            "scale": 0.9137,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/huizhou_zhugeliang.png": {
            "scale": 1.127,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/zhaosong/xiangzhou_lvwenhuan.png": {
            "scale": 0.998,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JIANGNAN/wuyue_qianliu.png": {
            "scale": 0.848,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_12.png": {
            "scale": 0.9452,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.7856,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/xianqin/zhao_lianpo.png": {
            "scale": 1.1201,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/JAPAN/shimotsuke_yudougongguanggang.png": {
            "scale": 0.7912,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/CENTRAL_ASIA/hali_gedaerzi.png": {
            "scale": 1.1956,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/WESTERN/yuchi_weichiyao.png": {
            "scale": 1.1883,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WESTERN/yumi_anguo.png": {
            "scale": 0.8881,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/STEPPE/tujue_ashinatumen.png": {
            "scale": 1.2839,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/kaerka_abadaihan.png": {
            "scale": 0.916,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/sima_d_simayi.png": {
            "scale": 1.0479,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/min_wangshenzhi.png": {
            "scale": 1.4681,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/JIANGNAN/quanzhou_liucongxiao.png": {
            "scale": 0.8528,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/lizhou_d_liaohua.png": {
            "scale": 1.031,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/HEXI/huizhou_yaosi.png": {
            "scale": 0.9746,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/liuhan/xiayang_d_dengyu.png": {
            "scale": 1.2383,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/pizhou_lvbu.png": {
            "scale": 0.8291,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
            "scale": 0.8669,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/BASHU/wumeng_azi.png": {
            "scale": 0.802,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL/mengcheng_d_gaoqiong.png": {
            "scale": 0.862,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/TIBET/beidi_yaochang.png": {
            "scale": 0.9076,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/zhaosong/yingzhou_d_liuqi.png": {
            "scale": 0.8327,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/CENTRAL/lu_zhangliao.png": {
            "scale": 1.0742,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/qi_simarangju.png": {
            "scale": 1.1379,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/KOREA/sheng_d_liyiqi.png": {
            "scale": 0.9094,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/KOREA/zhen_zhenxuan.png": {
            "scale": 0.9206,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/yingqin/xin_baiqi.png": {
            "scale": 1.0905,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL/long2_weixiaokuan.png": {
            "scale": 1.1402,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/BASHU/ba_bamanzi.png": {
            "scale": 1.1136,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/baishui_yanghuai.png": {
            "scale": 0.8142,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/bandun_fanmu.png": {
            "scale": 1.1081,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/BASHU/chenzhou_d_zhanghao.png": {
            "scale": 0.9508,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/jingjiang_qushisi.png": {
            "scale": 1.0344,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/dangchang_liangmiding.png": {
            "scale": 0.8125,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/BASHU/daxi_ming_zhangxianzhong.png": {
            "scale": 1.1799,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/BASHU/guo_jixin.png": {
            "scale": 0.9961,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LINGNAN/miao_amishi.png": {
            "scale": 0.9032,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/liao_houhongyuan.png": {
            "scale": 0.9269,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/BASHU/qianhui_baiyanhu.png": {
            "scale": 0.9222,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/BASHU/ran_d_ranshouzhong.png": {
            "scale": 1.1968,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 1.0037,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/chaozhou_d_mafa.png": {
            "scale": 1.1541,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTH/qu_d_quyi.png": {
            "scale": 0.8001,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/BASHU/sou_gaodingyuan.png": {
            "scale": 1.0568,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/BASHU/shuixi_anbangyan.png": {
            "scale": 1.0269,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/chen2_zhaofan.png": {
            "scale": 0.9063,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 0.8958,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTH/yuzhou_zuti.png": {
            "scale": 0.9443,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/BASHU/xiang_d_xiangdakun.png": {
            "scale": 0.7681,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/BASHU/yang_bozhou_yangyinglong.png": {
            "scale": 0.8817,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/__\u95f2\u7f6e__BASHU_01.png": {
            "scale": 0.8647,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/tan_d_qinhou.png": {
            "scale": 0.8009,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/BASHU/zuo_d_wufu.png": {
            "scale": 1.1916,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 0.8317,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/wuhu_dukake.png": {
            "scale": 1.0302,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/yada_ahexiong.png": {
            "scale": 1.0491,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/WESTERN/yiwu_hanshen.png": {
            "scale": 1.2847,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png": {
            "scale": 1.343,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/shi_clan_moheduotutun.png": {
            "scale": 0.9286,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/qincha_baqiman.png": {
            "scale": 0.8295,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/TIBET/guge_chizhaxichabade.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/kazakh_hasimu.png": {
            "scale": 1.0679,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/kokand_alimukuli.png": {
            "scale": 1.0523,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/tuoming_tuomin.png": {
            "scale": 1.4265,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/WESTERN/shule_aersilan.png": {
            "scale": 0.9367,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/kalan_suhela.png": {
            "scale": 0.9413,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/jie_sijinti.png": {
            "scale": 1.0934,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/TIBET/faqiang_niechizanpu.png": {
            "scale": 0.8705,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/dayuzi_yinalechihei.png": {
            "scale": 1.2082,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/WESTERN/pishan_daihu.png": {
            "scale": 1.0782,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/baha_gaiwamu.png": {
            "scale": 1.0019,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/anushidgin_yile.png": {
            "scale": 1.3021,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_05.png": {
            "scale": 1.0635,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LINGNAN/duanzhou_d_caojin.png": {
            "scale": 1.0176,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_24.png": {
            "scale": 0.9509,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_43.png": {
            "scale": 0.9682,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL/shatuo_likeyong.png": {
            "scale": 1.0532,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL/mi_mizhu.png": {
            "scale": 1.1089,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_40.png": {
            "scale": 0.9091,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/zhengzhou_chenqingzhi.png": {
            "scale": 0.8207,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/yaozhou_limaozhen.png": {
            "scale": 0.9436,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_41.png": {
            "scale": 0.9281,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTH/zhe_d_zheyuqing.png": {
            "scale": 0.9426,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/BASHU/wanzhou_shangguankui.png": {
            "scale": 0.956,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/BASHU/zi_changhong.png": {
            "scale": 0.9498,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/gaoqi_d_gaohuan.png": {
            "scale": 0.8701,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/sunqin_sunchuanting.png": {
            "scale": 1.0124,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/daming/suzhou_d_shikefa.png": {
            "scale": 0.9776,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/daming/ming_d_zhudi.png": {
            "scale": 0.9782,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/daming/jinan_tiexuan.png": {
            "scale": 0.8177,
            "offsetX": 0,
            "offsetY": -51
        },
        "/assets/daming/__\u95f2\u7f6e__JIANGNAN_22.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -78
        },
        "/assets/daming/__\u95f2\u7f6e__daming_14.png": {
            "scale": 0.8064,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/daming/yansui_wangwei.png": {
            "scale": 1.0201,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/basha_d_daogengmeng.png": {
            "scale": 1.5662,
            "offsetX": 0,
            "offsetY": 40
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_21.png": {
            "scale": 0.8128,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/DIANQIAN/kunming_yi_lucheng.png": {
            "scale": 1.1452,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/luchuan_sirenfa.png": {
            "scale": 0.8839,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_26.png": {
            "scale": 0.9344,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/DIANQIAN/mu_lijiang_muzeng.png": {
            "scale": 0.8885,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/DIANQIAN/pyu_moluo.png": {
            "scale": 0.9868,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/DIANQIAN/shuizhen_qudaren.png": {
            "scale": 0.8358,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/konbaung_yongjiya.png": {
            "scale": 0.8787,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/taiyuan_menglai.png": {
            "scale": 0.9547,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/DIANQIAN/hantawadi_mangyinglong.png": {
            "scale": 1.0686,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/TIBET/humi_zhentan.png": {
            "scale": 1.0324,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/HEXI/chile_hulvjin.png": {
            "scale": 0.9903,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/__\u95f2\u7f6e__CENTRAL_23.png": {
            "scale": 0.9749,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/HEXI/erzhu_erzhurong.png": {
            "scale": 1.0051,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_14.png": {
            "scale": 0.7549,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/HEXI/guiyi_caoyijin.png": {
            "scale": 0.8419,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/HEXI/helian_helianbobo.png": {
            "scale": 0.874,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/HEXI/hunxie_xuziwei.png": {
            "scale": 0.9157,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_15.png": {
            "scale": 0.9057,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/WESTERN/shache_xian_suoche_shachexian.png": {
            "scale": 0.9315,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/HEXI/xingxingxia_guoxiaoke.png": {
            "scale": 0.9054,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/STEPPE/da_yuan_kuokuotiemuer.png": {
            "scale": 1.0074,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 1.036,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_05.png": {
            "scale": 0.8457,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JAPAN/totomi_jiujingzhongci.png": {
            "scale": 0.8572,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_06.png": {
            "scale": 0.8595,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_08.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_09.png": {
            "scale": 0.7988,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_14.png": {
            "scale": 1.2411,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JAPAN/aizu_pushengshixiang.png": {
            "scale": 0.8891,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JAPAN/anmei_yuwandaqin.png": {
            "scale": 1.0135,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JAPAN/higo_d_juchiwuguang.png": {
            "scale": 0.9039,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/iyo_d_cunshangwuji.png": {
            "scale": 0.9763,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/izumo_shanzhonglujie.png": {
            "scale": 0.9552,
            "offsetX": 0,
            "offsetY": -53
        },
        "/assets/JAPAN/jinchuan_jinchuanyiyuan.png": {
            "scale": 0.9765,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JAPAN/kai_wutianxinxuan.png": {
            "scale": 0.8266,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/kakizaki_liqiqingguang.png": {
            "scale": 1.0518,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/mino_dagujiji.png": {
            "scale": 1.2826,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/JAPAN/otomo_d_lihuadaoxue.png": {
            "scale": 0.9407,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JAPAN/owari_zhitianxinchang.png": {
            "scale": 0.7367,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/JAPAN/sagami_beitiaoshikang.png": {
            "scale": 1.1062,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/sanada_d_zhentianxingcun.png": {
            "scale": 1.077,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JAPAN/satsuma_daojinjiajiu.png": {
            "scale": 0.8637,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JAPAN/suwa_d_zoufanglaizhong.png": {
            "scale": 0.8524,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/taira_pingzhisheng.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JAPAN/yamato_nanmuzhengcheng.png": {
            "scale": 1.0627,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/JAPAN/zhuqian_shaoerzineng.png": {
            "scale": 0.7574,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/JIANGNAN/fu2_zhoudi.png": {
            "scale": 1.0596,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/hu_d_husansheng.png": {
            "scale": 0.9294,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JIANGNAN/jiang_s_huanggai.png": {
            "scale": 1.0687,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JIANGNAN/jiujiang_zhouyu.png": {
            "scale": 1.0278,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JIANGNAN/lujian_zhanghuangyan.png": {
            "scale": 0.8476,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/qian_d_yudayou.png": {
            "scale": 1.1714,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JIANGNAN/qiufu_qiufu.png": {
            "scale": 1.1332,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/shanyue_sunce.png": {
            "scale": 0.8542,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/JIANGNAN/wan_liuyuan.png": {
            "scale": 0.8883,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JIANGNAN/wan_lukang.png": {
            "scale": 0.8442,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/wang_s_wanghua.png": {
            "scale": 0.9702,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/wenling_shilang.png": {
            "scale": 0.8866,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JIANGNAN/xie_xiefangde.png": {
            "scale": 0.962,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/yezongliu_yezongliu.png": {
            "scale": 0.9844,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JIANGNAN/ying_caojingzong.png": {
            "scale": 0.8315,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/KOREA/__\u95f2\u7f6e__KOREA_02.png": {
            "scale": 0.9614,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/KOREA/chungju_d_quanli.png": {
            "scale": 0.9683,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/KOREA/danluo_jintongjing.png": {
            "scale": 0.8438,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/KOREA/donghui_nanlv.png": {
            "scale": 0.8783,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/KOREA/gaya_jinshoulu.png": {
            "scale": 0.8717,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/KOREA/hui_bunaihou.png": {
            "scale": 0.8132,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/KOREA/jingcheng_d_yuyouzhao.png": {
            "scale": 0.9511,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/KOREA/joseon_lichenggui.png": {
            "scale": 1.0454,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/KOREA/lelang_wangqi.png": {
            "scale": 0.8384,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/KOREA/luzhou_zhangwenxiu.png": {
            "scale": 1.0537,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KOREA/naju_d_wangjian_wangye.png": {
            "scale": 1.1457,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/KOREA/sabeol_jinshimin.png": {
            "scale": 1.0372,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/KOREA/sambyeol_lishunchen.png": {
            "scale": 0.9313,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/ssangseong_cuiying.png": {
            "scale": 0.8292,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/KOREA/ssangseong_lizichun.png": {
            "scale": 1.0929,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/KOREA/xingliao_dayanlin.png": {
            "scale": 0.8346,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/LINGNAN/buyi_d_weichaoyuan.png": {
            "scale": 0.9853,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/LINGNAN/cen_d_cenmeng.png": {
            "scale": 1.0656,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/yangshe_yangshezhi.png": {
            "scale": 1.1644,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LINGNAN/dongzu_wumian.png": {
            "scale": 1.1136,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/guangzhou_liuyin.png": {
            "scale": 0.8948,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/longwu_huangdaozhou.png": {
            "scale": 1.018,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LINGNAN/miao_qing_yangwanzhe.png": {
            "scale": 1.1946,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.0403,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/LINGNAN/panyao_panhu.png": {
            "scale": 1.1062,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/xianqin/yan_leyi.png": {
            "scale": 0.9817,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/liuhan/guide_d_xiaohe.png": {
            "scale": 0.9402,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/yingzhou_liuyan.png": {
            "scale": 0.795,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/litang/__\u95f2\u7f6e__litang_05.png": {
            "scale": 1.1851,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/liuhan/suzhou_huoqubing.png": {
            "scale": 0.9124,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/liuhan/xiyuduhu_banchao.png": {
            "scale": 1.2057,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/liuhan/ningkou_liling.png": {
            "scale": 1.2064,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/liuhan/dongsheng_weishang.png": {
            "scale": 1.42,
            "offsetX": 0,
            "offsetY": -76
        },
        "/assets/liuhan/dixiang_wangmang.png": {
            "scale": 1.1482,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/liuhan/quli_chentang.png": {
            "scale": 0.9626,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/manqing/qinghai_yuezhongqi.png": {
            "scale": 0.8567,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/dawoer_baerdaqi.png": {
            "scale": 1.2966,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/manqing/xingan_hailancha.png": {
            "scale": 0.8949,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/wula_buzhantai.png": {
            "scale": 0.8342,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/manqing/__\u95f2\u7f6e__manqing_06.png": {
            "scale": 0.8484,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/NORTH/liangshidu_longjia.png": {
            "scale": 1.019,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/NORTH/pinghai_laihuer.png": {
            "scale": 0.9765,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTH/qingyuan_bd_zhoudewei.png": {
            "scale": 0.8838,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/NORTH/__\u95f2\u7f6e__NORTH_04.png": {
            "scale": 0.918,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTH/guzhu_tianyu.png": {
            "scale": 0.9198,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTH/jianzhou_nvzhen_limanzhu.png": {
            "scale": 0.9064,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTHEAST/haixi_nvzhen_baiyindali.png": {
            "scale": 1.2845,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/heishui_nishuli.png": {
            "scale": 0.7648,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/NORTHEAST/jilin_fujun.png": {
            "scale": 0.946,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTHEAST/keerqin_aoba.png": {
            "scale": 0.8787,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTHEAST/kuye_kuye_qichayi.png": {
            "scale": 1.4171,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/mao_wenlong_maowenlong.png": {
            "scale": 1.1367,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/NORTHEAST/nifuhe_baerhudai.png": {
            "scale": 0.9719,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/nuergan_kangwang.png": {
            "scale": 1.4317,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/suolun_bomuboguoer.png": {
            "scale": 0.9334,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTHEAST/sushen_tudiji.png": {
            "scale": 1.1355,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/NORTHEAST/wure_wuzhaodu.png": {
            "scale": 0.9992,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/NORTHEAST/yehe_jintaiji.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTHEAST/yilou_naoya.png": {
            "scale": 1.7128,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/STEPPE/xibo_d_tubote.png": {
            "scale": 1.0614,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTHEAST/dongping_langtan.png": {
            "scale": 1.0424,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/dongxia_puxianwannu.png": {
            "scale": 1.1328,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/NORTHEAST/ewenki_gentemuer.png": {
            "scale": 0.9021,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/NORTHEAST/feiyaka_cemutehe.png": {
            "scale": 0.9092,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/panjun/__\u95f2\u7f6e__panjun_24.png": {
            "scale": 0.8859,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_14.png": {
            "scale": 1.1729,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_18.png": {
            "scale": 1.056,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/panjun/baibo_guotai.png": {
            "scale": 1.2486,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/panjun/dashun_lizicheng.png": {
            "scale": 0.7981,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_04.png": {
            "scale": 0.696,
            "offsetX": 0,
            "offsetY": -86
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__WESTERN_24.png": {
            "scale": 0.8654,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_12.png": {
            "scale": 1.1337,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/TIBET/gar_kham_dengbazeren.png": {
            "scale": 1.0982,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/ashina_ashinayandou.png": {
            "scale": 0.8807,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/bayegu_qulishi.png": {
            "scale": 0.7737,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/STEPPE/bulat_beiduanchaer.png": {
            "scale": 0.9426,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/buriat_tumenjiergale.png": {
            "scale": 0.8817,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/chechen_chechenhanshuolei.png": {
            "scale": 0.9819,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/STEPPE/dingling_weilu.png": {
            "scale": 1.0236,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/donghu_tuiyin.png": {
            "scale": 1.0068,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/TIBET/tsangpa_pengcuonanjie.png": {
            "scale": 0.9989,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/gaoche_afuzhiluo.png": {
            "scale": 0.7482,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/STEPPE/geluolu_chisipijia.png": {
            "scale": 1.4105,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/heisha_d_houlihu.png": {
            "scale": 1.0334,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/hongirad_dexuechan.png": {
            "scale": 1.1306,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/STEPPE/huihu_dunmohedagan.png": {
            "scale": 0.8288,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/huyan_peicen.png": {
            "scale": 1.0357,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/TIBET/ali_gandancaiwang.png": {
            "scale": 0.8371,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/TIBET/gongbu_gongbumangbuzhi.png": {
            "scale": 1.3071,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/__\u95f2\u7f6e__HEXI_19.png": {
            "scale": 0.9024,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/kiyad_yesugai.png": {
            "scale": 0.859,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/kumo_xiwanghuilibao.png": {
            "scale": 1.101,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.8702,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/pazhu_redangunsangpa.png": {
            "scale": 0.9183,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/STEPPE/naiman_taiyanghan.png": {
            "scale": 1.0558,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/nuoyan_d_sanyinnuoyan.png": {
            "scale": 1.1737,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/STEPPE/ogodei_chuoermahan.png": {
            "scale": 1.007,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/TIBET/niang_suonanjiabo.png": {
            "scale": 1.0344,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/STEPPE/ongut_alawusi.png": {
            "scale": 0.9313,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/qidan_shulvping.png": {
            "scale": 1.1708,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/shiwei_saihou.png": {
            "scale": 1.1748,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/sunite_sousai.png": {
            "scale": 0.9319,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/tatar_mieguzhen.png": {
            "scale": 0.9768,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/tumed_andahan.png": {
            "scale": 0.9615,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/tumengken_tumengken.png": {
            "scale": 1.0527,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/tushetu_tuxietuhan.png": {
            "scale": 0.8766,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/TIBET/kangba_suonuomugunbu.png": {
            "scale": 1.0206,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/qiuci_baiba.png": {
            "scale": 0.9557,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/wuli_d_celeng.png": {
            "scale": 0.9729,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/wuzhumuqin_duoerji.png": {
            "scale": 0.9491,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/TIBET/supi_xinuoluo.png": {
            "scale": 0.9004,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/TIBET/xihai_d_fulianchou.png": {
            "scale": 1.4104,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/STEPPE/yaoluoge_yaoluogepusa.png": {
            "scale": 0.9605,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/yuan_d_hubilie.png": {
            "scale": 1.5843,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/yujiulu_yujiulv.png": {
            "scale": 1.059,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/tuyu_d_kualv.png": {
            "scale": 0.8636,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/zhadalan_zhamuhe.png": {
            "scale": 0.864,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/STEPPE/zhuerqi_sachabieqi.png": {
            "scale": 1.2601,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/zubu_mogusi.png": {
            "scale": 0.9068,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/tufa_d_tufanutan.png": {
            "scale": 1.463,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/TIBET/gongtang_gongtangcang.png": {
            "scale": 1.0246,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/TIBET/bailan_pabala.png": {
            "scale": 0.8759,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/TIBET/dalung_sangjiwen.png": {
            "scale": 0.857,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/TIBET/dong_nangqianjiabo.png": {
            "scale": 0.9856,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/TIBET/dulan_dashibatuer.png": {
            "scale": 0.9793,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/TIBET/fuguo_yizeng.png": {
            "scale": 0.8912,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png": {
            "scale": 0.9148,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/TIBET/gurkha_baduersaye.png": {
            "scale": 1.0778,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/TIBET/jinchuan_g_shaluoben.png": {
            "scale": 0.9766,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/TIBET/kalun_dexinga.png": {
            "scale": 0.8014,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/TIBET/karmapa_queyingduoji.png": {
            "scale": 0.7899,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/TIBET/keliya_fuduxin.png": {
            "scale": 1.1295,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/khyungpo_qiongbobangse.png": {
            "scale": 0.9669,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/kongsa_kongsayiduo.png": {
            "scale": 0.9296,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/TIBET/tubo_songzanganbu.png": {
            "scale": 1.202,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/TIBET/yangtong_chisongdezan.png": {
            "scale": 0.8406,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/bailong_suomai.png": {
            "scale": 0.8916,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WESTERN/duerbote_duerbote_taiji.png": {
            "scale": 0.9482,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WESTERN/kala_satuke.png": {
            "scale": 1.2798,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/WESTERN/kepantuo_dulimi.png": {
            "scale": 0.7803,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/WESTERN/ruoqiang_quhulai.png": {
            "scale": 1.0903,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/xiye_zihe.png": {
            "scale": 0.7927,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_02.png": {
            "scale": 1.0416,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_04.png": {
            "scale": 1.0312,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__wuzhou_05.png": {
            "scale": 0.9804,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_06.png": {
            "scale": 0.921,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__wuzhou_07.png": {
            "scale": 0.8781,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_08.png": {
            "scale": 1.0897,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_10.png": {
            "scale": 1.1318,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_11.png": {
            "scale": 1.1257,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_14.png": {
            "scale": 1.0722,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_15.png": {
            "scale": 1.0039,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_16.png": {
            "scale": 0.9981,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_18.png": {
            "scale": 0.9604,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_19.png": {
            "scale": 0.9977,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_06.png": {
            "scale": 1.0509,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_08.png": {
            "scale": 1.1811,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_11.png": {
            "scale": 1.2524,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_01.png": {
            "scale": 1.1244,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_04.png": {
            "scale": 1.3099,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_05.png": {
            "scale": 1.0918,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_06.png": {
            "scale": 0.9781,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_08.png": {
            "scale": 1.1646,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_09.png": {
            "scale": 1.1966,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_10.png": {
            "scale": 1.0676,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/yingqin/ruo_wangjian.png": {
            "scale": 1.0726,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/sizhou_hanshizhong.png": {
            "scale": 0.9252,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/zhaosong/tingzhou_d_chenmin.png": {
            "scale": 0.935,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/zhaosong/zaoyang_d_menggong.png": {
            "scale": 1.0192,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_03.png": {
            "scale": 0.8746,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_17.png": {
            "scale": 1.0946,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LINGNAN/nanzhong_mazhong.png": {
            "scale": 1.0786,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/zhaosong/changshaguo_xinqiji.png": {
            "scale": 0.8857,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/zhaosong/changshan_yangyanzhao.png": {
            "scale": 0.8031,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/zhaosong/chaozhou_d_zhangshijie.png": {
            "scale": 1.2105,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/liuhan/chagatai_genggong.png": {
            "scale": 1.0326,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/yingqin/wazhai_zhanghan.png": {
            "scale": 1.0738,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/xianqin/liguo_zhaoshe.png": {
            "scale": 1.0327,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/TIBET/xiutu_jinridi.png": {
            "scale": 1.0567,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/manqing/weiyuan_d_niangengyao.png": {
            "scale": 1.1072,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/HEXI/lushui_dongzhuo.png": {
            "scale": 1.0899,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__LINGNAN_04.png": {
            "scale": 0.832,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/bozhou_d_yujin.png": {
            "scale": 1.2437,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/litang/shanzhou_wangzhongsi.png": {
            "scale": 0.9013,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/BASHU/tujia_d_qinliangyu.png": {
            "scale": 0.9701,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_42.png": {
            "scale": 1.1552,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_14.png": {
            "scale": 0.9173,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_15.png": {
            "scale": 0.9886,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL/xichu_xiangyu.png": {
            "scale": 0.8978,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_13.png": {
            "scale": 1.2473,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/jing_dingbuling.png": {
            "scale": 1.205,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/litang/li_s_gaopian.png": {
            "scale": 1.1079,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JIANGNAN/liu_yingbu.png": {
            "scale": 0.9045,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/ouyang_ouyangwei.png": {
            "scale": 0.9491,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_11.png": {
            "scale": 1.1145,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JIANGNAN/sui_yangjian.png": {
            "scale": 0.9666,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/danyang_huanwen.png": {
            "scale": 0.9655,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BASHU/yidou_luxun.png": {
            "scale": 1.0385,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/zhaosong/heng1_yangye.png": {
            "scale": 0.8814,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_01.png": {
            "scale": 0.7234,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/JIANGNAN/yiyang_d_mengzongzheng.png": {
            "scale": 1.1058,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/yuezhi_xihou.png": {
            "scale": 1.3868,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_15.png": {
            "scale": 1.003,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LINGNAN/leloi.png": {
            "scale": 0.8906,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/LINGNAN/liuzhou_shenxiyi.png": {
            "scale": 0.937,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/minyue_wuzhu.png": {
            "scale": 1.0517,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/zhongxiang_ganning.png": {
            "scale": 0.8826,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/DIANQIAN/ahaomu_laqite.png": {
            "scale": 0.7538,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/DIANQIAN/jingpozu_zaodan.png": {
            "scale": 1.036,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/DIANQIAN/shuizu_panxinjian.png": {
            "scale": 1.1187,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/DIANQIAN/wazu_banhongwang.png": {
            "scale": 0.815,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/dali_duansiping.png": {
            "scale": 1.0848,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_08.png": {
            "scale": 1.2677,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/JIANGNAN/sunwu_d_sunquan.png": {
            "scale": 0.955,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/panjun/xushouhui_zhaopusheng.png": {
            "scale": 1.1133,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/DIANQIAN/dongxu_mangruiti.png": {
            "scale": 0.9699,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/manqing/xining_yangyingju.png": {
            "scale": 1.1125,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_20.png": {
            "scale": 1.2218,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/panjun/shuntian_linshuangwen.png": {
            "scale": 1.0907,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_15.png": {
            "scale": 0.9146,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JIANGNAN/hao_d_weirui.png": {
            "scale": 0.9944,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_11.png": {
            "scale": 1.2923,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 1.1627,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_07.png": {
            "scale": 0.8977,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/liuhan/ganzhou_dourong.png": {
            "scale": 0.8824,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/liuhan/li_lx_d_liguang.png": {
            "scale": 1.031,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_09.png": {
            "scale": 1.0173,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/zhaosong/wei2_hunjian.png": {
            "scale": 0.7694,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/xianqin/mi_chu_xiongl.png": {
            "scale": 0.8933,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/liuhan/xianyu_hanxin.png": {
            "scale": 1.0872,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/lulin_liuxiu.png": {
            "scale": 1.014,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/shaozhou_zhangzhensun.png": {
            "scale": 1.1694,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/liuhan/li_s_mayuan.png": {
            "scale": 1.0781,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/fushi_wangmeng.png": {
            "scale": 0.9239,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_12.png": {
            "scale": 0.9443,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/LINGNAN/monong_anong.png": {
            "scale": 0.8636,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 1.204,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_10.png": {
            "scale": 0.844,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/zhaosong/qing_quduan.png": {
            "scale": 0.879,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_28.png": {
            "scale": 1.2869,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/daming/luming_luxiangsheng.png": {
            "scale": 1.1856,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/daming/__\u95f2\u7f6e__daming_08.png": {
            "scale": 1.2304,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/__\u95f2\u7f6e__daming_09.png": {
            "scale": 0.9371,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 0.9137,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_16.png": {
            "scale": 0.9196,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/xiazhou_lijiqian.png": {
            "scale": 1.0158,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/HEXI/guazhou_zhangshougui.png": {
            "scale": 1.0328,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/dangxiang_liyuanhao.png": {
            "scale": 1.083,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/litang/pingyuan_yanzhenqing.png": {
            "scale": 1.1787,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_05.png": {
            "scale": 0.8737,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/CENTRAL/tongzhou_liuzhiyuan.png": {
            "scale": 0.9687,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/she_ethnic_leiwanxing.png": {
            "scale": 1.2296,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/wuling_xiangdancheng.png": {
            "scale": 0.8261,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_13.png": {
            "scale": 1.0562,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/litang/bing_liji.png": {
            "scale": 0.795,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 1.1033,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/loufan_xuerengui.png": {
            "scale": 1.0535,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTH/cangzhou_liurengong.png": {
            "scale": 0.9022,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/panjun/taiping_shidakai.png": {
            "scale": 1.1071,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_22.png": {
            "scale": 1.0521,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/woye_huangfugui.png": {
            "scale": 0.9856,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/chuzhou_d_huangfuhui.png": {
            "scale": 1.4695,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL/jingzhou_gs_huangfusong.png": {
            "scale": 1.0466,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_25.png": {
            "scale": 1.1288,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_27.png": {
            "scale": 1.0482,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_29.png": {
            "scale": 1.0824,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_30.png": {
            "scale": 0.9894,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_31.png": {
            "scale": 1.1276,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/chahar_yantiemuer.png": {
            "scale": 1.4132,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/xianlingqiang_dianling.png": {
            "scale": 1.1693,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/oirat_ming_gaerdan.png": {
            "scale": 1.1239,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/STEPPE/wala_yexian.png": {
            "scale": 1.0281,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_47.png": {
            "scale": 1.0073,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/wuliangha_subutai.png": {
            "scale": 0.9094,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.8463,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/yuwen_yuwentai.png": {
            "scale": 1.2518,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/shizhao_d_shihu.png": {
            "scale": 1.023,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/shizhou_liucong.png": {
            "scale": 1.156,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/yingzhou_ying_d_muronghuang.png": {
            "scale": 0.9985,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/STEPPE/dingzhou_murongchui.png": {
            "scale": 0.9808,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/huite_amuersana.png": {
            "scale": 1.1089,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/wuji_yilizhi.png": {
            "scale": 1.3887,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/murong_murongke.png": {
            "scale": 0.9815,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 0.9685,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/ashide_ashidejieli.png": {
            "scale": 0.9926,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/huimo_gaoyanshou.png": {
            "scale": 1.0336,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/NORTHEAST/nanai_zhahaluo.png": {
            "scale": 1.0075,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_14.png": {
            "scale": 1.2029,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/NORTHEAST/hezhe_shaerhuda.png": {
            "scale": 1.1473,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/xiongding_murongyong.png": {
            "scale": 1.2409,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/STEPPE/baidi_baidizi.png": {
            "scale": 1.1147,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/cheshihou_angui.png": {
            "scale": 0.9806,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/BASHU/wudu_dengai.png": {
            "scale": 0.9033,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JAPAN/fujiwara_yuanyijing.png": {
            "scale": 0.9252,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_19.png": {
            "scale": 1.0297,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_20.png": {
            "scale": 1.1094,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_17.png": {
            "scale": 0.876,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/ava_sijifa.png": {
            "scale": 0.8587,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTH/mushi_muchong.png": {
            "scale": 0.8259,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/JIANGNAN/xiao_d_xiaoyan.png": {
            "scale": 0.9329,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_32.png": {
            "scale": 1.3631,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/litang/song2_houjunji.png": {
            "scale": 1.2316,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/litang/anxi_guoxin.png": {
            "scale": 1.0412,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/litang/liwang_liguangbi.png": {
            "scale": 0.8049,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/litang/jiashi_wangxuance.png": {
            "scale": 1.2467,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/tuoba_tuobagui.png": {
            "scale": 0.9709,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/yunzhong_tuobaliwei.png": {
            "scale": 1.1039,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/STEPPE/xianbei_tuobamao.png": {
            "scale": 1.6155,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_56.png": {
            "scale": 1.0929,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/litang/lingzhou_puguhuaien.png": {
            "scale": 0.8277,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/__\u591a\u4f59__STEPPE_01.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/yao_liuyuan.png": {
            "scale": 1.0113,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/zangke_xielongyu.png": {
            "scale": 1.2201,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_17.png": {
            "scale": 0.9392,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/STEPPE/xiliao_yeldashi.png": {
            "scale": 1.0459,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/KOREA/xuantu_yuangaisuwen.png": {
            "scale": 1.1898,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/NORTHEAST/yizhou_wanyanloushi.png": {
            "scale": 0.9947,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/dazhen_wanyantiege.png": {
            "scale": 0.962,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/jurchen_wanyanzongbi.png": {
            "scale": 1.066,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_28.png": {
            "scale": 1.328,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_34.png": {
            "scale": 0.9917,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/mohe_wanyanzonghan.png": {
            "scale": 0.9508,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/daming/xuan_xuda.png": {
            "scale": 1.1529,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/xianqin/wuzhou_limu.png": {
            "scale": 1.0198,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/shixing_houandou.png": {
            "scale": 1.035,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/yingzhou_d2_licunxu.png": {
            "scale": 0.9989,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/zhaosong/kang_liangshidou.png": {
            "scale": 0.8898,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/liuhan/shuofang_weiqing.png": {
            "scale": 1.0238,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/HEXI/dai_d_shijingtang.png": {
            "scale": 1.0824,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/__\u591a\u4f59__WESTERN_02.png": {
            "scale": 1.0302,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WESTERN/tuerhute_wobaxi.png": {
            "scale": 1.0193,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/daming/shanrong_lanyu.png": {
            "scale": 0.9175,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_21.png": {
            "scale": 0.9755,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JAPAN/aki_maoliyuanjiu.png": {
            "scale": 0.8673,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JAPAN/jibei2_qingshuizongzhi.png": {
            "scale": 0.8747,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/pulei_dougu.png": {
            "scale": 0.8507,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/__\u591a\u4f59__STEPPE_02.png": {
            "scale": 1.0504,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/merkit_boyan.png": {
            "scale": 1.1862,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/litang/zhongshan_yangaoqing.png": {
            "scale": 1.3179,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/STEPPE/jiyuan_huluguang.png": {
            "scale": 1.0073,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/kelie_zhaheganbu.png": {
            "scale": 0.9385,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/xijue_zhizhichanyu.png": {
            "scale": 1.3682,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/zhaosong/hezhou_wangjian.png": {
            "scale": 1.0614,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/BASHU/cuanshi_cuanlongyan.png": {
            "scale": 0.9797,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/NORTH/__\u95f2\u7f6e__NORTH_03.png": {
            "scale": 1.0473,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/NORTH/wangyan_wangyan.png": {
            "scale": 0.9632,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/haikou_wangzhi.png": {
            "scale": 0.9339,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/zhaosong/shenshi_wentianxiang.png": {
            "scale": 1.0027,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LINGNAN/zhuang_d_washifuren.png": {
            "scale": 0.8605,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_32.png": {
            "scale": 0.8166,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JIANGNAN/wang_d_liuyu.png": {
            "scale": 0.9285,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/shaozhou_d_mayin.png": {
            "scale": 0.9966,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JIANGNAN/yue_d_lusu.png": {
            "scale": 1.112,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/xianqin/__\u591a\u4f59__xianqin_01.png": {
            "scale": 0.8314,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/xianqin/kong_d_caogui.png": {
            "scale": 1.0134,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/xianqin/__\u591a\u4f59__xianqin_02.png": {
            "scale": 0.8727,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/manqing/gumie_lizhifang.png": {
            "scale": 1.3561,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/NORTH/cai_shile.png": {
            "scale": 1.062,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/manqing/agui_agui.png": {
            "scale": 1.2553,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_33.png": {
            "scale": 0.7614,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL/hongnong_jun_yangsu.png": {
            "scale": 1.0584,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/litang/weihaiwei_sudingfang.png": {
            "scale": 1.1841,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_34.png": {
            "scale": 1.0759,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/daming/guizhou_lidingguo.png": {
            "scale": 0.8659,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/litang/juandu_peixingjian.png": {
            "scale": 0.8993,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/xinping_guoziyi.png": {
            "scale": 1.2088,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/hepan_gaoxianzhi.png": {
            "scale": 0.9001,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_16.png": {
            "scale": 0.9161,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/daming/chizhou_changyuchun.png": {
            "scale": 0.8957,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/panjun/fangla_fangla.png": {
            "scale": 1.352,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/__\u591a\u4f59__WESTERN_04.png": {
            "scale": 1.1956,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/LINGNAN/luodian_shexiangfuren.png": {
            "scale": 0.9188,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/nanzhao_geluofeng.png": {
            "scale": 1.0604,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/dian_duansiping.png": {
            "scale": 0.9624,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png": {
            "scale": 1.0493,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/guzgan_abuhalisi.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/mamon_mameng.png": {
            "scale": 1.1876,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_97.png": {
            "scale": 0.9889,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_18.png": {
            "scale": 0.9686,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 0.9734,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/__\u591a\u4f59__LINGNAN_08.png": {
            "scale": 0.7492,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/LINGNAN/nongzhigao_huangshimi.png": {
            "scale": 1.1545,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/JIANGNAN/taizhou_libian.png": {
            "scale": 0.9186,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/daming/dongshengwei_wangyue.png": {
            "scale": 1.1056,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/JAPAN/gonggu_gonggudaozhu.png": {
            "scale": 1.1987,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/daming/__\u95f2\u7f6e__daming_13.png": {
            "scale": 1.1954,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.9867,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 1.0935,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_27.png": {
            "scale": 0.8842,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/STEPPE/__\u591a\u4f59__STEPPE_03.png": {
            "scale": 1.2554,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/jalair_muhuali.png": {
            "scale": 1.0196,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/yingqin/baiyang_mengtian.png": {
            "scale": 1.1549,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_19.png": {
            "scale": 1.0228,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/yang_zhou_yangxingmi.png": {
            "scale": 0.7976,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/DIANQIAN/pagan_anultuo.png": {
            "scale": 1.1083,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/STEPPE/zhasaketu_zhasakesubadi.png": {
            "scale": 1.0302,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/TIBET/duomi_lunkongre.png": {
            "scale": 1.0338,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/TIBET/galangdiba_wangqindundui.png": {
            "scale": 0.9836,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/mingzheng_jianzandechang.png": {
            "scale": 0.8898,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/DIANQIAN/hani_d_zhebi.png": {
            "scale": 0.7128,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/daming/__\u95f2\u7f6e__JIANGNAN_19.png": {
            "scale": 0.8553,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/daming/zu_d_yuanchonghuan.png": {
            "scale": 1.1813,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_18.png": {
            "scale": 0.9128,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/zhaosong/yanzhou_zhongshiheng.png": {
            "scale": 1.0636,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_16.png": {
            "scale": 1.2597,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_20.png": {
            "scale": 1.3107,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_21.png": {
            "scale": 1.2725,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_22.png": {
            "scale": 1.2668,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_27.png": {
            "scale": 0.9492,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/zhaosong/huan_zhongshidao.png": {
            "scale": 0.9921,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/DIANQIAN/__\u591a\u4f59__DIANQIAN_04.png": {
            "scale": 1.4265,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/STEPPE/dongdan_yelbei.png": {
            "scale": 1.1261,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/houliao_yelliuge.png": {
            "scale": 0.9011,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/STEPPE/yel_yelxiuge.png": {
            "scale": 0.9384,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_36.png": {
            "scale": 1.0556,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JIANGNAN/tongma_taishici.png": {
            "scale": 0.7935,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_22.png": {
            "scale": 0.9617,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/panjun/huangwang_huangchao.png": {
            "scale": 0.9222,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/kangju_chebishi.png": {
            "scale": 0.8764,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/xianqin/dianguo_zhuangqiao.png": {
            "scale": 0.8918,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL_ASIA/jibin_jianisejia.png": {
            "scale": 1.0295,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_24.png": {
            "scale": 0.8018,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/JAPAN/echigo_shangshanqianxin.png": {
            "scale": 0.9857,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/JAPAN/iga_d_baididanbo.png": {
            "scale": 1.5065,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/panjun/__\u95f2\u7f6e__PANJUN_23.png": {
            "scale": 0.8437,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/panjun/ketagalan_huangqingyun.png": {
            "scale": 1.2512,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/TIBET/__\u591a\u4f59__TIBET_01.png": {
            "scale": 1.0614,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WESTERN/__\u591a\u4f59__WESTERN_05.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.2087,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/KOREA/chen3_jizhun.png": {
            "scale": 0.697,
            "offsetX": 0,
            "offsetY": -54
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_26.png": {
            "scale": 0.7719,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/JAPAN/date_d_yidazhengzong.png": {
            "scale": 1.002,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/liren_funanshe.png": {
            "scale": 1.2227,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/__\u591a\u4f59__LINGNAN_11.png": {
            "scale": 0.8605,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/leizhou_limao.png": {
            "scale": 1.0824,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/xinjiang_maji.png": {
            "scale": 0.9355,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/qingqiang_jiangwei.png": {
            "scale": 1.0705,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/DIANQIAN/ailao_leilao.png": {
            "scale": 0.8676,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_20.png": {
            "scale": 0.9025,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/DIANQIAN/mon_monuhe.png": {
            "scale": 0.9597,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/LINGNAN/zhancheng_zhimin.png": {
            "scale": 1.0271,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/litang/gaoliang_geshuhan.png": {
            "scale": 1.204,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_22.png": {
            "scale": 1.213,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_26.png": {
            "scale": 1.2491,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/TIBET/__\u591a\u4f59__TIBET_04.png": {
            "scale": 0.8295,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/litang/yuan_cj_d_lishuo.png": {
            "scale": 1.1286,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/litang/liang_d_zhangxun.png": {
            "scale": 1.2031,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/litang/weizhou_weigao.png": {
            "scale": 1.1911,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/dayu_wangshouren.png": {
            "scale": 1.0047,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_23.png": {
            "scale": 0.8901,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/manqing/__\u95f2\u7f6e__NORTHEAST_30.png": {
            "scale": 0.7263,
            "offsetX": 0,
            "offsetY": -65
        },
        "/assets/NORTHEAST/jilizhou_chengmingzhen.png": {
            "scale": 1.0792,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_22.png": {
            "scale": 0.9914,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_19.png": {
            "scale": 0.9133,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/daming/qi_d_qijiguang.png": {
            "scale": 0.9395,
            "offsetX": 0,
            "offsetY": -50
        },
        "/assets/daming/__\u95f2\u7f6e__JIANGNAN_20.png": {
            "scale": 0.8795,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/panjun/yang_aner_yanganer.png": {
            "scale": 1.0343,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/rouran_shelun.png": {
            "scale": 1.1087,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/yingqin/nanyue_zhaotuo.png": {
            "scale": 0.9354,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/xianqin/yong_lujili.png": {
            "scale": 0.8243,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_98.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/dzungar_galedanceling.png": {
            "scale": 1.0233,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_39.png": {
            "scale": 0.9687,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/HEXI/cangsong_machao.png": {
            "scale": 0.8154,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_36.png": {
            "scale": 0.8993,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_34.png": {
            "scale": 0.8459,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/daming/__\u95f2\u7f6e__JIANGNAN_21.png": {
            "scale": 0.956,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BASHU/ming_zheng_zhengchenggong.png": {
            "scale": 1.1205,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 1.2133,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 1.1451,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_29.png": {
            "scale": 0.9084,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_30.png": {
            "scale": 1.0231,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_31.png": {
            "scale": 0.9473,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_32.png": {
            "scale": 1.1213,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/xiqin_wanyanchenheshang.png": {
            "scale": 1.2175,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.1787,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/guangxin_shixie.png": {
            "scale": 0.8585,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_27.png": {
            "scale": 0.9228,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/JAPAN/chosokabe_changzongwobuyuanqin.png": {
            "scale": 1.0542,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/litang/__\u95f2\u7f6e__litang_10.png": {
            "scale": 1.1684,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_33.png": {
            "scale": 1.5019,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/TIBET/lang_clan_jiangqujianzan.png": {
            "scale": 1.0666,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/aertai_baibuhua.png": {
            "scale": 1.4004,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_36.png": {
            "scale": 1.0102,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/manghuti_weidaer.png": {
            "scale": 1.5645,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/chenli_d_zuoxianwang.png": {
            "scale": 1.3499,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/HEXI/weiming_weiminglinggong.png": {
            "scale": 0.9513,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/mengwu_hebulehan.png": {
            "scale": 1.0302,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_25.png": {
            "scale": 1.4467,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/didao_wangshao.png": {
            "scale": 0.9904,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/daca_dacajilong.png": {
            "scale": 1.2027,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/HEXI/__\u95f2\u7f6e__CENTRAL_21.png": {
            "scale": 0.9313,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/BASHU/kui_gongsunshu.png": {
            "scale": 1.0121,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 0.919,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/BASHU/cong_puhu.png": {
            "scale": 1.1091,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JIANGNAN/ruochu_doulian.png": {
            "scale": 0.9706,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_20.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/xiaobolu_meijinmang.png": {
            "scale": 1.1324,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_37.png": {
            "scale": 1.4461,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/xianqin/quanrong_yiquhai.png": {
            "scale": 0.8314,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/LINGNAN/chimei_fanchong.png": {
            "scale": 0.9017,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/badakhshan_yaerbeige.png": {
            "scale": 1.2719,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_28.png": {
            "scale": 0.9742,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/yizhi_beigou.png": {
            "scale": 0.9137,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JAPAN/osumi_ganfujianxu.png": {
            "scale": 1.0028,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_30.png": {
            "scale": 1.2877,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/so_zongyizhi.png": {
            "scale": 0.9963,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/LINGNAN/funan_fanman.png": {
            "scale": 0.9514,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_37.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/manqing/maomingan_suoetu.png": {
            "scale": 1.0792,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/KOREA/__\u95f2\u7f6e__KOREA_08.png": {
            "scale": 0.9728,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/KOREA/xinluo_jinyuxin.png": {
            "scale": 0.9418,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/KOREA/__\u95f2\u7f6e__KOREA_09.png": {
            "scale": 1.3171,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/KOREA/goryeo_jianghanzan.png": {
            "scale": 0.9308,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/DIANQIAN/xingwei_hanba.png": {
            "scale": 0.8356,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/beihai_shamusheyun.png": {
            "scale": 0.7894,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/WESTERN/adao_d_mafushou.png": {
            "scale": 0.9248,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_23.png": {
            "scale": 0.8991,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/liuhan/you_gengyan.png": {
            "scale": 0.9037,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/LINGNAN/shengmiao_baoli.png": {
            "scale": 1.1917,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/yangguan_lihao.png": {
            "scale": 1.0169,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_44.png": {
            "scale": 0.8129,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 0.7301,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_38.png": {
            "scale": 0.9814,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_20.png": {
            "scale": 0.8701,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_32.png": {
            "scale": 0.8615,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/kaga_d_xiajianlailian.png": {
            "scale": 0.9842,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_25.png": {
            "scale": 0.8017,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_24.png": {
            "scale": 1.0218,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/daming/__\u95f2\u7f6e__JIANGNAN_23.png": {
            "scale": 0.8914,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_22.png": {
            "scale": 0.8182,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_23.png": {
            "scale": 1.1253,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_45.png": {
            "scale": 1.0237,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/wuzhou/__\u95f2\u7f6e__wuzhou_24.png": {
            "scale": 1.1187,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/BASHU/yueyi_zhangyi.png": {
            "scale": 1.257,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL_ASIA/__\u591a\u4f59__CENTRAL_ASIA_07.png": {
            "scale": 1.5326,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/mangshi_mangewang.png": {
            "scale": 1.2495,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/STEPPE/salai_salaiwang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/yidier_yidierwang.png": {
            "scale": 1.1057,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WEST_ASIA/xiemian_xiemianwang.png": {
            "scale": 0.9648,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/xierwan_falukesha.png": {
            "scale": 1.1308,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WEST_ASIA/dedan_dedanwang.png": {
            "scale": 1.282,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/beileinisi_tuolemiershi.png": {
            "scale": 1.1436,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/jiashi_d_jiashiwang.png": {
            "scale": 1.0909,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL_ASIA/sumo_sumowang.png": {
            "scale": 0.9387,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/boluo_damoboluo.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/mojietuo_pinpisuoluo.png": {
            "scale": 1.1423,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/kongque_zhantuoluojiduo.png": {
            "scale": 1.3037,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/jieri_jieriwang.png": {
            "scale": 1.211,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/mowoer_akeba.png": {
            "scale": 1.4233,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/__\u591a\u4f59__CENTRAL_ASIA_06.png": {
            "scale": 1.3621,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/deli_alawuding.png": {
            "scale": 1.1727,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/xike_lanjite.png": {
            "scale": 1.5883,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/nabatai_aleitasi.png": {
            "scale": 1.3229,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/CENTRAL_ASIA/__\u591a\u4f59__CENTRAL_ASIA_05.png": {
            "scale": 1.5687,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/ansxi_aershake.png": {
            "scale": 1.326,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/guyashu_shamuxiada.png": {
            "scale": 1.237,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/jialatai_deaotalusi.png": {
            "scale": 1.1176,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/aiaoniya_alisita.png": {
            "scale": 1.1311,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/kesa_bulankehan.png": {
            "scale": 1.1145,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/ailan_shuteluke.png": {
            "scale": 1.2438,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/aiji_lameixisi.png": {
            "scale": 1.0101,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/safawei_aisimaier.png": {
            "scale": 0.9672,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 1.2609,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_46.png": {
            "scale": 1.235,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_47.png": {
            "scale": 0.8848,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/saerbadaer_lazhake.png": {
            "scale": 1.2252,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_29.png": {
            "scale": 1.1123,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/aqimeinide_daliushi.png": {
            "scale": 1.2982,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL/ranwei_d_ranmin.png": {
            "scale": 1.0103,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/safawei_d_abasi.png": {
            "scale": 1.2814,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/bendou_alikesai.png": {
            "scale": 1.1101,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/heti_muwatali.png": {
            "scale": 1.1316,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_21.png": {
            "scale": 0.9891,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WEST_ASIA/fulijiya_maidasi.png": {
            "scale": 1.2177,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/ldiya_keluoyisi.png": {
            "scale": 1.1087,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/pajiama_oumainisi.png": {
            "scale": 0.9156,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/bitiniya_diaoduoer.png": {
            "scale": 0.8311,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_55.png": {
            "scale": 0.9538,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/luomu_jilijie.png": {
            "scale": 1.0121,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_40.png": {
            "scale": 1.0929,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/sailiugu_antiaoke.png": {
            "scale": 1.0615,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/womaya_muaweiye.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_42.png": {
            "scale": 1.008,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/xibolai_dawei.png": {
            "scale": 1.2008,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/WEST_ASIA/tuolemi_tuolemi.png": {
            "scale": 1.3712,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_39.png": {
            "scale": 1.3547,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/jialedi_nibujianisa.png": {
            "scale": 1.0217,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/yingqin/__\u95f2\u7f6e__yingqin_12.png": {
            "scale": 0.9078,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WEST_ASIA/paermila_zhinuobiya.png": {
            "scale": 1.1221,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/__\u95f2\u7f6e__litang_14.png": {
            "scale": 1.2421,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_02.png": {
            "scale": 0.9835,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/abasi_mansuer.png": {
            "scale": 1.1821,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/WEST_ASIA/xikesuosi_salidi.png": {
            "scale": 1.0383,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_33.png": {
            "scale": 1.0752,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/yashu_saergong.png": {
            "scale": 1.2333,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/xianqin/__\u95f2\u7f6e__xianqin_39.png": {
            "scale": 1.3437,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/youfaladi_yehaiya.png": {
            "scale": 1.4239,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_57.png": {
            "scale": 1.0348,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/qiliqiya_pangpei.png": {
            "scale": 1.0398,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_50.png": {
            "scale": 0.9653,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_46.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/WEST_ASIA/gulaishi_aibusufuyang.png": {
            "scale": 1.64,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/maidina_halide.png": {
            "scale": 1.3307,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_48.png": {
            "scale": 1.0582,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_50.png": {
            "scale": 1.5709,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_51.png": {
            "scale": 1.1342,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_52.png": {
            "scale": 1.5577,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_54.png": {
            "scale": 0.7735,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_53.png": {
            "scale": 1.2769,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_03.png": {
            "scale": 0.7576,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_04.png": {
            "scale": 0.9594,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_05.png": {
            "scale": 1.0393,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_06.png": {
            "scale": 1.0552,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_07.png": {
            "scale": 1.2187,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_08.png": {
            "scale": 0.9964,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_09.png": {
            "scale": 1.0933,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_11.png": {
            "scale": 1.2262,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_12.png": {
            "scale": 1.3799,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_13.png": {
            "scale": 0.924,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_14.png": {
            "scale": 1.0287,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_16.png": {
            "scale": 1.4745,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_17.png": {
            "scale": 1.1326,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_18.png": {
            "scale": 1.2718,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_19.png": {
            "scale": 1.3656,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/STEPPE/__\u95f2\u7f6e__WEST_ASIA_20.png": {
            "scale": 1.1497,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/sumeier_jierjiameishen.png": {
            "scale": 1.105,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_22.png": {
            "scale": 1.1823,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/zhaosong/__\u95f2\u7f6e__zhaosong_26.png": {
            "scale": 0.897,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_23.png": {
            "scale": 1.2893,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_24.png": {
            "scale": 1.2467,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_25.png": {
            "scale": 1.3788,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_27.png": {
            "scale": 1.1601,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_29.png": {
            "scale": 1.0714,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_30.png": {
            "scale": 0.8151,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_31.png": {
            "scale": 0.9962,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_32.png": {
            "scale": 1.3781,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_33.png": {
            "scale": 1.0624,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_35.png": {
            "scale": 0.9829,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_36.png": {
            "scale": 0.9695,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_37.png": {
            "scale": 1.2818,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_39.png": {
            "scale": 1.2232,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_38.png": {
            "scale": 1.5288,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_40.png": {
            "scale": 1.3477,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_41.png": {
            "scale": 0.8803,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_42.png": {
            "scale": 0.9223,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_43.png": {
            "scale": 0.9589,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_44.png": {
            "scale": 1.4191,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/ayoubu_salaheding.png": {
            "scale": 1.301,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_45.png": {
            "scale": 0.9837,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_21.png": {
            "scale": 0.8859,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_22.png": {
            "scale": 1.1754,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_25.png": {
            "scale": 1.3515,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_24.png": {
            "scale": 1.4348,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_26.png": {
            "scale": 1.1441,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_27.png": {
            "scale": 1.3741,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_28.png": {
            "scale": 1.1318,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_29.png": {
            "scale": 1.2845,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_30.png": {
            "scale": 1.4713,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/india/__\u95f2\u7f6e__CENTRAL_ASIA_31.png": {
            "scale": 1.1454,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_47.png": {
            "scale": 0.9969,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_50.png": {
            "scale": 1.3035,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_53.png": {
            "scale": 1.4249,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_55.png": {
            "scale": 1.0264,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_57.png": {
            "scale": 1.8764,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_59.png": {
            "scale": 0.8899,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_61.png": {
            "scale": 1.1197,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_62.png": {
            "scale": 1.2936,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_64.png": {
            "scale": 1.3113,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_65.png": {
            "scale": 0.9545,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_66.png": {
            "scale": 1.0518,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_68.png": {
            "scale": 1.1823,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_71.png": {
            "scale": 1.1647,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/STEPPE/__\u95f2\u7f6e__CENTRAL_ASIA_72.png": {
            "scale": 1.2772,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_73.png": {
            "scale": 0.8553,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_74.png": {
            "scale": 1.2274,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_75.png": {
            "scale": 0.9868,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_76.png": {
            "scale": 1.7182,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_77.png": {
            "scale": 0.9048,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/__\u95f2\u7f6e__CENTRAL_ASIA_83.png": {
            "scale": 1.0825,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_88.png": {
            "scale": 1.0923,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_91.png": {
            "scale": 1.3869,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_93.png": {
            "scale": 0.9647,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL_ASIA/an_xibanni.png": {
            "scale": 1.2529,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/saman_yisimayi.png": {
            "scale": 1.3922,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/yanda_touluoman.png": {
            "scale": 1.0195,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/xisi_yakubu.png": {
            "scale": 1.3028,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_96.png": {
            "scale": 0.9605,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/delan_sulun.png": {
            "scale": 0.9977,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/dulan_d_aihamaide.png": {
            "scale": 1.0933,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/huluo_jiyasiding.png": {
            "scale": 1.106,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/najie_minande.png": {
            "scale": 1.0034,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_104.png": {
            "scale": 1.3517,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL_ASIA/wugu_d_tugelile.png": {
            "scale": 1.1288,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/kumisi_aerpu.png": {
            "scale": 1.1019,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_106.png": {
            "scale": 0.9265,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/ribale_faheerdaolai.png": {
            "scale": 1.0064,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_107.png": {
            "scale": 1.2004,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__\u591a\u4f59__STEPPE_04.png": {
            "scale": 1.1997,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/yilihanguo_d_hezan.png": {
            "scale": 1.0904,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_52.png": {
            "scale": 0.8658,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/asaibaijiang_xuliewu.png": {
            "scale": 1.2221,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/wulaertu_ajishenti.png": {
            "scale": 1.1914,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/gelujiya_tamaer.png": {
            "scale": 1.3091,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/keerjisi_bagelate.png": {
            "scale": 1.4501,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL_ASIA/midi_daiaokaisi.png": {
            "scale": 1.305,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/liuhan/wuyuan_d_chengui.png": {
            "scale": 0.9101,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_19.png": {
            "scale": 0.8257,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_20.png": {
            "scale": 1.066,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_22.png": {
            "scale": 0.7849,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/LINGNAN/wuxi_shamoke.png": {
            "scale": 1.1098,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/linhu_mafang.png": {
            "scale": 1.2105,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/daozhou_yangzaixing.png": {
            "scale": 0.9716,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/STEPPE/__\u591a\u4f59__STEPPE_05.png": {
            "scale": 1.2934,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/STEPPE/xiajiasi_are.png": {
            "scale": 1.0274,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/duolu_ashinahelu.png": {
            "scale": 1.052,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/TIBET/shaodang_mitang.png": {
            "scale": 0.9904,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/golog_wandezhaxi.png": {
            "scale": 1.0311,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/TIBET/nanjie_nanjiewangqiu.png": {
            "scale": 0.8469,
            "offsetX": 0,
            "offsetY": -58
        },
        "/assets/TIBET/nandou_sushili.png": {
            "scale": 1.2017,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/jiluo_d_douxian.png": {
            "scale": 0.8381,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/kereyid_tuowolin.png": {
            "scale": 1.008,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/xiongnu_maodun.png": {
            "scale": 1.231,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/TIBET/monpa_luozhujiacuo.png": {
            "scale": 0.9336,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/gling_gesaer.png": {
            "scale": 1.193,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/TIBET/__\u591a\u4f59__TIBET_02.png": {
            "scale": 1.1708,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/TIBET/lopi_abo.png": {
            "scale": 0.8265,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/TIBET/jiantang_sangjiejiacuo.png": {
            "scale": 1.207,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/STEPPE/wuhuan_tadun.png": {
            "scale": 1.1832,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WESTERN/loulan_suojie.png": {
            "scale": 0.9814,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/gaochang_quwentai.png": {
            "scale": 1.0543,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_37.png": {
            "scale": 1.2867,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/STEPPE/xueyantuo_yinan.png": {
            "scale": 0.8405,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BASHU/boren_ada.png": {
            "scale": 1.0409,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/daming/__\u95f2\u7f6e__daming_12.png": {
            "scale": 0.9005,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_15.png": {
            "scale": 1.0343,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_34.png": {
            "scale": 1.2589,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__WEST_ASIA_47.png": {
            "scale": 1.234,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/KOREA/woju_yinguan.png": {
            "scale": 0.9261,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/jibei_wangkuang.png": {
            "scale": 1.102,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/huarazim_mohemo.png": {
            "scale": 1.4268,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/BASHU/qianzhong_wubayue.png": {
            "scale": 1.1449,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/kuai_kuaiyue.png": {
            "scale": 0.9267,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/xiou_yixusong.png": {
            "scale": 0.9206,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/qiong_rengui.png": {
            "scale": 0.9785,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/she_shechongming.png": {
            "scale": 0.9494,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JIANGNAN/wenzhou_fangguozhen.png": {
            "scale": 0.9417,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/zhaosong/__\u591a\u4f59__zhaosong_01.png": {
            "scale": 1.0027,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JIANGNAN/kejia_huangfeng.png": {
            "scale": 1.1711,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/gaxa_zhashenduanzhubu.png": {
            "scale": 1.0482,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/khoshut_tulubaihu.png": {
            "scale": 1.0102,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/__\u591a\u4f59__TIBET_08.png": {
            "scale": 0.8705,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/TIBET/spurgyal_dariniansai.png": {
            "scale": 1.3288,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/TIBET/xiangxiong_limixia.png": {
            "scale": 1.0663,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LINGNAN/miaomin_shiliudeng.png": {
            "scale": 1.2637,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/LINGNAN/tian_sizhou_tianyougong.png": {
            "scale": 1.1929,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/xinggu_cuanxi.png": {
            "scale": 1.1563,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 0.9609,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/paiyao_huangguasi.png": {
            "scale": 0.9556,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/yelang_duotong.png": {
            "scale": 1.1823,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/TIBET/__\u591a\u4f59__TIBET_09.png": {
            "scale": 1.1943,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/hor_chisang.png": {
            "scale": 1.1835,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LINGNAN/qian_songjingyang.png": {
            "scale": 0.8953,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LINGNAN/geng_gengjingzhong.png": {
            "scale": 1.0172,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/__\u591a\u4f59__DIANQIAN_06.png": {
            "scale": 1.056,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/paiwan_alugu.png": {
            "scale": 1.0861,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/lancang_faang.png": {
            "scale": 1.2209,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LINGNAN/dengmaoqi_dengmaoqi.png": {
            "scale": 1.2614,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
            "scale": 1.1142,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/xiadun_awanglangjie.png": {
            "scale": 1.2814,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/fanyanna_xieer.png": {
            "scale": 0.9039,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/TIBET/ladakh_senggelangjie.png": {
            "scale": 1.0837,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WESTERN/__\u591a\u4f59__WESTERN_01.png": {
            "scale": 0.8295,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/yanqi_longtuqizhi.png": {
            "scale": 0.9426,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/wensu_guyi.png": {
            "scale": 0.8919,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WESTERN/weitou_douti.png": {
            "scale": 0.9724,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JAPAN/ryukyu_shangbazhi.png": {
            "scale": 1.1888,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/yeli_yeliwangrong.png": {
            "scale": 0.9003,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/xianqin/yun_wuli.png": {
            "scale": 0.8684,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/LINGNAN/muong_shencongyue.png": {
            "scale": 0.993,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/LINGNAN/ayinu_hushemoquan.png": {
            "scale": 1.149,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png": {
            "scale": 1.0048,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/yarkand_latifu.png": {
            "scale": 1.0986,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WESTERN/dayuan_wugua.png": {
            "scale": 1.0937,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/DIANQIAN/wuman_cuangui.png": {
            "scale": 1.031,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/TIBET/khon_basiba.png": {
            "scale": 1.0968,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/weili_weilifan.png": {
            "scale": 1.1364,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WESTERN/qiemo_anmoshenpan.png": {
            "scale": 1.0859,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/TIBET/ganden_zongkaba.png": {
            "scale": 1.0967,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/TIBET/nvguo_mojie.png": {
            "scale": 1.1943,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WESTERN/shanshan_weituqi.png": {
            "scale": 1.2657,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_28.png": {
            "scale": 1.1237,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/wusun_liejiaomi.png": {
            "scale": 1.1512,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_59.png": {
            "scale": 0.7609,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/dada_ming_batumengke.png": {
            "scale": 1.1458,
            "offsetX": 0,
            "offsetY": 38
        },
        "/assets/HEXI/juqu_d_juqumengxun.png": {
            "scale": 1.0757,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/__\u95f2\u7f6e__TIBET_01.png": {
            "scale": 1.0389,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/TIBET/__\u95f2\u7f6e__TIBET_02.png": {
            "scale": 1.4148,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/TIBET/qiuchi_yangnandang.png": {
            "scale": 0.7967,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_49.png": {
            "scale": 0.9842,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_78.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 1.0504,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/guishuang_qiujiuque.png": {
            "scale": 1.0666,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/muer_mujier.png": {
            "scale": 1.0298,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/yilihanguo_yisimeier.png": {
            "scale": 0.9171,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/LINGNAN/xian_d_xianying.png": {
            "scale": 1.056,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/__\u591a\u4f59__LINGNAN_19.png": {
            "scale": 0.7681,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_23.png": {
            "scale": 1.3129,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_24.png": {
            "scale": 1.4276,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/DIANQIAN/__\u95f2\u7f6e__DIANQIAN_25.png": {
            "scale": 1.0842,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 1.1213,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/HEXI/__\u95f2\u7f6e__HEXI_17.png": {
            "scale": 1.1743,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/qifu_d_qifuchipan.png": {
            "scale": 0.9575,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WESTERN/sai_gaijiayun.png": {
            "scale": 0.9887,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/weiwuer_yusubu.png": {
            "scale": 1.4161,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_108.png": {
            "scale": 1.2069,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/khoja_apakehezhuo.png": {
            "scale": 1.1852,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_31.png": {
            "scale": 1.1511,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_32.png": {
            "scale": 1.3673,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_33.png": {
            "scale": 1.3962,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_60.png": {
            "scale": 1.1554,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/zhuxie_zhuxiechixin.png": {
            "scale": 1.0327,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/WESTERN/pisha_weichisheng.png": {
            "scale": 0.8907,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/tajikezu_kuerban.png": {
            "scale": 1.3051,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_35.png": {
            "scale": 1.2101,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WESTERN/yiduhu_baershu.png": {
            "scale": 0.9528,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_36.png": {
            "scale": 0.9068,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/tujishi_sulu.png": {
            "scale": 1.0848,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/NORTHEAST/ayinu_ezo_keshamayin.png": {
            "scale": 1.6871,
            "offsetX": 0,
            "offsetY": 40
        },
        "/assets/GERMANIC/aersasi_youlian.png": {
            "scale": 1.1316,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/boootiya_yibaminongda.png": {
            "scale": 1.5997,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/LATIN/feiniqi_hamierka.png": {
            "scale": 0.9422,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_09.png": {
            "scale": 1.1792,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/luoma_diguo_kaisa.png": {
            "scale": 1.3387,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_08.png": {
            "scale": 1.4462,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/LATIN/xila_dimisituokeli.png": {
            "scale": 1.0508,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/LATIN/leangongguo_afangsuojiushi.png": {
            "scale": 1.7084,
            "offsetX": 0,
            "offsetY": 40
        },
        "/assets/LATIN/kejila_shulunbao.png": {
            "scale": 1.318,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/bohepingyuan_diaoduolike.png": {
            "scale": 1.212,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_03.png": {
            "scale": 1.445,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/SLAVIC/taolika_asipuergesi.png": {
            "scale": 1.3417,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/LATIN/xixiliwangguo_feitelieershi.png": {
            "scale": 1.2853,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/GERMANIC/piketai_aoengesi.png": {
            "scale": 1.0559,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/GERMANIC/weixi_ansijiaer.png": {
            "scale": 1.5379,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LATIN/lagoniya_lieaonida.png": {
            "scale": 1.0568,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_10.png": {
            "scale": 0.8949,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/SLAVIC/lagusa_delagan.png": {
            "scale": 1.1674,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/GERMANIC/bafaliya_taxiluosanshi.png": {
            "scale": 0.9719,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/GERMANIC/ruidian_yota_kaerjiushi.png": {
            "scale": 1.1758,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/putaoya_afangsuo.png": {
            "scale": 0.9543,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/meikelunbao_hengliboluo.png": {
            "scale": 1.3902,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_04.png": {
            "scale": 1.2842,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/GERMANIC/gaer_duomunaer.png": {
            "scale": 0.9613,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/GERMANIC/didi_weilianyishi.png": {
            "scale": 1.1161,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/anuo_wugelinuo.png": {
            "scale": 1.1383,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LATIN/guadaer_feiernanduo.png": {
            "scale": 1.1977,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/balunxiya_xide.png": {
            "scale": 1.1763,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_01.png": {
            "scale": 1.1734,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_02.png": {
            "scale": 1.4481,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_04.png": {
            "scale": 0.979,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LATIN/moxina_luojie.png": {
            "scale": 1.1497,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LATIN/sading_ailaiaonuola.png": {
            "scale": 1.2683,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LATIN/yidelisi_yidelisi.png": {
            "scale": 1.2862,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/SLAVIC/baizanting_fulajimier.png": {
            "scale": 1.3201,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/SLAVIC/qiekase_weishenniao.png": {
            "scale": 1.0591,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SLAVIC/baojian_qishi_aerbote.png": {
            "scale": 1.1847,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/saierdika_kelumu.png": {
            "scale": 1.0949,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/SLAVIC/bosiniya_tefuerteke.png": {
            "scale": 1.366,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LATIN/mulabite_tashenfen.png": {
            "scale": 1.1324,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/zhibuluotuo_enlike.png": {
            "scale": 1.3074,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LATIN/zhayan_yalimoluo.png": {
            "scale": 1.2017,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LATIN/babali_babaluosa.png": {
            "scale": 0.8805,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LATIN/hamade_hamade.png": {
            "scale": 1.2142,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/buni_hanniba.png": {
            "scale": 1.3345,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_109.png": {
            "scale": 1.1346,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/aguelabu_aokeba.png": {
            "scale": 1.1381,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LATIN/telibolisi_delagute.png": {
            "scale": 0.9063,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/LATIN/jileinaijia_majiasi.png": {
            "scale": 1.0453,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/GERMANIC/habusibao_makeximi.png": {
            "scale": 1.3767,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/GERMANIC/mozeer_junshitanding.png": {
            "scale": 1.5099,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/GERMANIC/maixiya_aofa.png": {
            "scale": 1.3908,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/fulandesi_luobeierershi.png": {
            "scale": 0.9639,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/GERMANIC/weijing_bergen_siweier.png": {
            "scale": 0.9633,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_16.png": {
            "scale": 1.0623,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/SLAVIC/weijiebusike_gongguo_aoergeerde.png": {
            "scale": 1.2644,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/GERMANIC/mazhaer_aerpade.png": {
            "scale": 1.0464,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/GERMANIC/nidelan_weilian.png": {
            "scale": 1.1753,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/nuosi_aolafu.png": {
            "scale": 0.9414,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GERMANIC/boumeilaniyan_kaximier.png": {
            "scale": 1.1824,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/GERMANIC/falanji_chalimate.png": {
            "scale": 1.071,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LATIN/langgeduoke_leimengwushi.png": {
            "scale": 1.1396,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LATIN/aermolika_jierdeleisi.png": {
            "scale": 1.143,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LATIN/xilagu_ajiasuokeli.png": {
            "scale": 1.0379,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/LATIN/tuosikana_luolunzuo.png": {
            "scale": 1.2125,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LATIN/yadelaiya_danduoluo.png": {
            "scale": 1.0366,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LATIN/kanpaniya_kaluo.png": {
            "scale": 1.374,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LATIN/jiatailuoniya_weifuleide.png": {
            "scale": 1.0194,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LATIN/nasier_muhanmode.png": {
            "scale": 1.4304,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LATIN/liguliya_andelieya.png": {
            "scale": 1.4582,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/SLAVIC/seleisi_ximeiang.png": {
            "scale": 1.407,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/SLAVIC/saierweiya_sidifendushang.png": {
            "scale": 1.3773,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/SLAVIC/bolisiya_jiasituoerde.png": {
            "scale": 1.0598,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SLAVIC/teweier_gongguo_mihayier.png": {
            "scale": 1.1601,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/SLAVIC/zhituo_rituomier.png": {
            "scale": 1.2349,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/wende_jieluobojue.png": {
            "scale": 1.2697,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/GERMANIC/pufaerci_ludeweixi.png": {
            "scale": 1.3423,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_15.png": {
            "scale": 1.3431,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/GERMANIC/hansa_kelaosi.png": {
            "scale": 1.2563,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_01.png": {
            "scale": 1.2155,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/weijing_york_xuefuailike.png": {
            "scale": 1.129,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/asikanani_aerbulei.png": {
            "scale": 1.036,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/huohengsuolun_feitelieyishi.png": {
            "scale": 1.1188,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_02.png": {
            "scale": 1.4384,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/GERMANIC/jialuolin_chalidadi.png": {
            "scale": 1.4558,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/GERMANIC/boximiya_yangjiesika.png": {
            "scale": 1.1406,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_03.png": {
            "scale": 1.4327,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/LATIN/gaolu_chaliqishi.png": {
            "scale": 1.3157,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_05.png": {
            "scale": 1.2308,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/GERMANIC/anggelu_aerfuleide.png": {
            "scale": 1.096,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_06.png": {
            "scale": 1.2976,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/GERMANIC/rierman_aotuoyishi.png": {
            "scale": 1.4294,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_07.png": {
            "scale": 1.2971,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GERMANIC/batawei_xiweilisi.png": {
            "scale": 1.186,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LATIN/gaolu_luoma_keluowei.png": {
            "scale": 1.136,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/GERMANIC/kanbuliya_weilianhualaishi.png": {
            "scale": 1.3143,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/LATIN/aquidan_heitaizi.png": {
            "scale": 1.1955,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LATIN/puluowangsi_leimengsishi.png": {
            "scale": 1.126,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LATIN/lunbadi_sifuerzha.png": {
            "scale": 1.4062,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/LATIN/donggete_diaoduolike.png": {
            "scale": 1.2262,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/xigete_afangsuoliushi.png": {
            "scale": 0.9889,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LATIN/andaluoxiya_abudula.png": {
            "scale": 1.2674,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/LATIN/alagong_haimei.png": {
            "scale": 0.9927,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/bulietani_alan.png": {
            "scale": 0.9524,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/SLAVIC/shaiyue_duoboyi.png": {
            "scale": 0.9544,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_11.png": {
            "scale": 0.9842,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_09.png": {
            "scale": 1.0537,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_12.png": {
            "scale": 1.1006,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_13.png": {
            "scale": 0.9677,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_08.png": {
            "scale": 0.9616,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_05.png": {
            "scale": 1.121,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_01.png": {
            "scale": 0.8381,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/SLAVIC/fulajimier_gongguo_andelie.png": {
            "scale": 1.0846,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/SLAVIC/pusikefu_gongheguo_daomantasi.png": {
            "scale": 0.8319,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_02.png": {
            "scale": 0.8037,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_03.png": {
            "scale": 0.8515,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/SLAVIC/jialixiya_dannier.png": {
            "scale": 1.0218,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/SLAVIC/qiernigeweifu_gongguo_musidi.png": {
            "scale": 0.8528,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_04.png": {
            "scale": 1.0643,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_05.png": {
            "scale": 0.8579,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/SLAVIC/__\u95f2\u7f6e__SLAVIC_06.png": {
            "scale": 0.8576,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/GERMANIC/damolaweiya_moyimier.png": {
            "scale": 1.0695,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/SLAVIC/daniebo_luomushenlafu.png": {
            "scale": 0.8883,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/GERMANIC/molaweiya_siwatuo.png": {
            "scale": 1.0913,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SLAVIC/luosi_yaluosilafu.png": {
            "scale": 1.3614,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SLAVIC/liulike_niefusiji.png": {
            "scale": 0.9956,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/SLAVIC/gesake_hemeili.png": {
            "scale": 1.3554,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/SLAVIC/beisilafu_xieergai.png": {
            "scale": 1.2355,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/jinzhang_badou.png": {
            "scale": 1.0504,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/SLAVIC/suzidaer_kangsitandingnuo.png": {
            "scale": 1.2221,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/SLAVIC/moerdaweiya_sidifendadi.png": {
            "scale": 1.2699,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/SLAVIC/mosike_gongguo_dunsikeyi.png": {
            "scale": 1.1842,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/SLAVIC/walajiyia_fuladesanshi.png": {
            "scale": 1.1523,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/SLAVIC/baojiaer_wuluhei.png": {
            "scale": 1.5687,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SLAVIC/piyasite_kaqimiri.png": {
            "scale": 1.5368,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/SLAVIC/nieman_weituofute.png": {
            "scale": 1.2572,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/GERMANIC/tiaodun_qishi_wuerlixi.png": {
            "scale": 1.0226,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SLAVIC/litaowan_gediminasi.png": {
            "scale": 1.2437,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SLAVIC/peilieya_gongguo_monuomahe.png": {
            "scale": 1.5199,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/SLAVIC/liwoniya_puleitebeige.png": {
            "scale": 1.4335,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/SLAVIC/dajiya_deqiebalusi.png": {
            "scale": 1.2181,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/kelimiya_hajigelai.png": {
            "scale": 1.5326,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SLAVIC/chude_weiqiesilafu.png": {
            "scale": 1.2555,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SLAVIC/bolan_yagaiwo.png": {
            "scale": 1.4294,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LATIN/mengtainiya_basalabu.png": {
            "scale": 1.2677,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SLAVIC/deniesite_muhanmodegeli.png": {
            "scale": 1.3621,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/fuerjia_asitela.png": {
            "scale": 1.2554,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/nuogai_ounasihan.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/bashekeer_kalasakaer.png": {
            "scale": 1.2934,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/STEPPE/xierhe_saierzhu.png": {
            "scale": 1.1997,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/SLAVIC/xideweina_buliesilafu.png": {
            "scale": 1.0947,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/pangzha_halixinge.png": {
            "scale": 0.9833,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LATIN/__\u591a\u4f59__LATIN_02.png": {
            "scale": 0.8905,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LATIN/kelite_fukasi.png": {
            "scale": 0.8905,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LATIN/__\u591a\u4f59__LATIN_01.png": {
            "scale": 1.1777,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LATIN/maqidun_kashande.png": {
            "scale": 1.1777,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/GERMANIC/__\u591a\u4f59__GERMANIC_02.png": {
            "scale": 1.0547,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/GERMANIC/__\u591a\u4f59__GERMANIC_01.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/shiwaben_shengwuerlixi.png": {
            "scale": 1.4023,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/GERMANIC/__\u591a\u4f59__GERMANIC_03.png": {
            "scale": 0.8774,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/GERMANIC/__\u591a\u4f59__GERMANIC_04.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GERMANIC/ruishi_ciwenli.png": {
            "scale": 1.0663,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GERMANIC/shengdian_qishi_demolai.png": {
            "scale": 1.0343,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/GERMANIC/maerta_qishi_lawalaite.png": {
            "scale": 0.8578,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/zizhou_wangjian.png": {
            "scale": 1.1072,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_08.png": {
            "scale": 0.9396,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_26.png": {
            "scale": 1.0387,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_49.png": {
            "scale": 0.9593,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_50.png": {
            "scale": 1.029,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_51.png": {
            "scale": 1.0376,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_52.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_53.png": {
            "scale": 1.3892,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_54.png": {
            "scale": 1.132,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_55.png": {
            "scale": 1.2939,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_56.png": {
            "scale": 1.0968,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL/__\u95f2\u7f6e__CENTRAL_58.png": {
            "scale": 1.4566,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_17.png": {
            "scale": 1.2155,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/__\u95f2\u7f6e__CENTRAL_ASIA_95.png": {
            "scale": 0.9152,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_10.png": {
            "scale": 1.0416,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/__\u95f2\u7f6e__GERMANIC_14.png": {
            "scale": 1.4299,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_29.png": {
            "scale": 0.7288,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/JAPAN/__\u95f2\u7f6e__JAPAN_31.png": {
            "scale": 0.9604,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_25.png": {
            "scale": 1.0524,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_27.png": {
            "scale": 0.8881,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JIANGNAN/__\u95f2\u7f6e__JIANGNAN_28.png": {
            "scale": 0.9883,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/JIANGNAN/chen_chenbaxian.png": {
            "scale": 0.9016,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LATIN/__\u95f2\u7f6e__LATIN_07.png": {
            "scale": 0.9466,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LATIN/luodesi_weilalei.png": {
            "scale": 0.9419,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/__\u95f2\u7f6e__LINGNAN_05.png": {
            "scale": 1.1747,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/NORTH/__\u95f2\u7f6e__LINGNAN_14.png": {
            "scale": 0.9076,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/NORTH/__\u95f2\u7f6e__daming_11.png": {
            "scale": 0.9235,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_09.png": {
            "scale": 0.8802,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_15.png": {
            "scale": 1.1169,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_33.png": {
            "scale": 0.9963,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTHEAST/__\u95f2\u7f6e__NORTHEAST_38.png": {
            "scale": 1.0308,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/elunchunzu_gaishan.png": {
            "scale": 1.0788,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SLAVIC/ouka_youli.png": {
            "scale": 0.965,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/__\u95f2\u7f6e__HEXI_11.png": {
            "scale": 0.8497,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_46.png": {
            "scale": 0.9424,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_48.png": {
            "scale": 1.3255,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_49.png": {
            "scale": 1.0054,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_57.png": {
            "scale": 1.1124,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/__\u95f2\u7f6e__STEPPE_58.png": {
            "scale": 1.0076,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/dafeichuan_murongnuohebo.png": {
            "scale": 0.9337,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/tuva_qinggunzabu.png": {
            "scale": 0.911,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/TIBET/__\u591a\u4f59__CENTRAL_ASIA_04.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/TIBET/__\u591a\u4f59__WESTERN_08.png": {
            "scale": 1.0206,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/__\u95f2\u7f6e__WESTERN_29.png": {
            "scale": 1.2021,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_26.png": {
            "scale": 1.0862,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_28.png": {
            "scale": 1.1367,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WEST_ASIA/__\u95f2\u7f6e__WEST_ASIA_49.png": {
            "scale": 0.9296,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WEST_ASIA/bendou_d_mitelidati.png": {
            "scale": 0.9578,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WEST_ASIA/dibisi_tutemosi.png": {
            "scale": 1.1034,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/litang/__\u95f2\u7f6e__litang_08.png": {
            "scale": 0.9506,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/litang/__\u95f2\u7f6e__litang_11.png": {
            "scale": 1.1721,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/litang/__\u95f2\u7f6e__litang_15.png": {
            "scale": 0.9504,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/litang/dingxiang_d_lijing.png": {
            "scale": 1.0344,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/__\u95f2\u7f6e__liuhan_21.png": {
            "scale": 1.1195,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/manqing/__\u95f2\u7f6e__NORTHEAST_38.png": {
            "scale": 0.9014,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/manqing/__\u95f2\u7f6e__manqing_08.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/manqing/__\u95f2\u7f6e__manqing_09.png": {
            "scale": 1.2359,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/panjun/baodi.png": {
            "scale": 1.0768,
            "offsetX": 0,
            "offsetY": 8
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
