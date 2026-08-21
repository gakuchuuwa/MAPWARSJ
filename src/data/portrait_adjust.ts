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
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/litang/tang_lishimin.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/liuhan/yangshao_zhoubo.png": {
            "scale": 1.22,
            "offsetX": 13,
            "offsetY": -9
        },
        "/assets/xianqin/yin_dixin.png": {
            "scale": 0.97,
            "offsetX": 20,
            "offsetY": -35
        },
        "/assets/DIANQIAN/siam_nalixuan_pugan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/wuzhou/wuzhou_d_wuzetian.png": {
            "scale": 1.38,
            "offsetX": 1,
            "offsetY": 23
        },
        "/assets/zhaosong/song_zhaokuangyin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/litang/heyuan_d_heichichangzhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/xianqin/chunshen_huangxie.png": {
            "scale": 0.93,
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
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/JIANGNAN/jinling_tandaoji.png": {
            "scale": 1.15,
            "offsetX": 19,
            "offsetY": -2
        },
        "/assets/DIANQIAN/dai_daoyingmeng.png": {
            "scale": 0.9,
            "offsetX": 8,
            "offsetY": -33
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
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/litang/qianzhou_lisheng.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/yingqin/shangzhou_shangyang.png": {
            "scale": 1.12,
            "offsetX": 4,
            "offsetY": -8
        },
        "/assets/litang/shazhou_zhangyichao.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/chanzhou_chairong.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/zhuozhou_anlushan.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/daming/linyu_wusangui.png": {
            "scale": 1.07,
            "offsetX": 11,
            "offsetY": -6
        },
        "/assets/DIANQIAN/jingdong_taohong.png": {
            "scale": 0.98,
            "offsetX": 1,
            "offsetY": -27
        },
        "/assets/xianqin/han_baoyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/BASHU/chu_guanyu.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTH/jingmen_zhaoyun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/DIANQIAN/luoyue_zhengce.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/yingqin/qin_simacuo.png": {
            "scale": 1.24,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTH/dangzhou_qiangduan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/tiele_qibiheli.png": {
            "scale": 0.82,
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
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/ruzhou_sunjian.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTH/dizhou_wangyanzhang.png": {
            "scale": 0.95,
            "offsetX": 15,
            "offsetY": 6
        },
        "/assets/DIANQIAN/baiman_gaoshengtai.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -51
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.02,
            "offsetX": 14,
            "offsetY": 16
        },
        "/assets/CENTRAL/huang_d_jiakui.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/zhaosong/yanchuan_d_yuefei.png": {
            "scale": 1.16,
            "offsetX": 4,
            "offsetY": -28
        },
        "/assets/DIANQIAN/champa_zhipenge.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/DIANQIAN/luohu_ganmuding.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/KOREA/baiji_jiebo.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/tiemuer_tiemuer.png": {
            "scale": 0.97,
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
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/gar_lunqinling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/borjigin_tuolei.png": {
            "scale": 1.15,
            "offsetX": 11,
            "offsetY": -14
        },
        "/assets/STEPPE/liao_d_yelvabaoji.png": {
            "scale": 1.03,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/JAPAN/edo_dechuanjiakang.png": {
            "scale": 0.9,
            "offsetX": 7,
            "offsetY": -11
        },
        "/assets/WESTERN/wulianghai_chelingwubashen.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/LINGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/STEPPE/huige_gulipeiluo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTHEAST/bohai_dazuorong.png": {
            "scale": 1,
            "offsetX": 11,
            "offsetY": 14
        },
        "/assets/HEXI/chijin_qiewangshijia.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/cao_d_caocao.png": {
            "scale": 0.97,
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
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/heng_hetengjiao.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/NORTHEAST/eluoke_amuhaer.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/NORTHEAST/jilimi_takuna.png": {
            "scale": 0.85,
            "offsetX": 8,
            "offsetY": -14
        },
        "/assets/xianqin/yue_goujian.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/manqing/manzhou_nuerhachi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/manqing/aisin_d_huangtaiji.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/pugu_ashinaguduolu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/manqing/manzhou_d_duoergun.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -4
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
            "scale": 0.91,
            "offsetX": 7,
            "offsetY": 5
        },
        "/assets/JIANGNAN/hongzhou_zhuwenzheng.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/linshihong_linshihong.png": {
            "scale": 1.08,
            "offsetX": 7,
            "offsetY": 21
        },
        "/assets/BASHU/chenghan_lite.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/BASHU/shu_liubei.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/liuhan/__闲置__liuhan_16.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/daming/pingnan_musheng.png": {
            "scale": 0.91,
            "offsetX": 9,
            "offsetY": -6
        },
        "/assets/BASHU/qingyi_fanchangsheng.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JAPAN/hashiba_fengchenxiuji.png": {
            "scale": 1.06,
            "offsetX": 5,
            "offsetY": -83
        },
        "/assets/JIANGNAN/fang_guozhen_fangguozhen.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/xianqin/ouyue_zouyao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/NORTH/gongsun_d_gongsundu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/huizhou_zhugeliang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 20
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
        "/assets/CENTRAL/__闲置__CENTRAL_12.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/xianqin/zhao_lianpo.png": {
            "scale": 0.85,
            "offsetX": 8,
            "offsetY": 5
        },
        "/assets/JAPAN/shimotsuke_yudougongguanggang.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -41
        },
        "/assets/CENTRAL_ASIA/hali_gedaerzi.png": {
            "scale": 0.85,
            "offsetX": 13,
            "offsetY": 26
        },
        "/assets/WESTERN/yuchi_weichiyao.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/yumi_anguo.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/STEPPE/kaerka_abadaihan.png": {
            "scale": 0.99,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/CENTRAL/sima_d_simayi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JIANGNAN/min_wangshenzhi.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/JIANGNAN/quanzhou_liucongxiao.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/lizhou_d_liaohua.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/HEXI/huizhou_yaosi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/liuhan/xiayang_d_dengyu.png": {
            "scale": 1.1,
            "offsetX": 5,
            "offsetY": 17
        },
        "/assets/CENTRAL/pizhou_lvbu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/wumeng_azi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -19
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
        "/assets/zhaosong/yingzhou_d_liuqi.png": {
            "scale": 1.08,
            "offsetX": -2,
            "offsetY": -35
        },
        "/assets/CENTRAL/lu_zhangliao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/qi_simarangju.png": {
            "scale": 1.05,
            "offsetX": 4,
            "offsetY": 5
        },
        "/assets/KOREA/sheng_d_liyiqi.png": {
            "scale": 0.99,
            "offsetX": -2,
            "offsetY": -3
        },
        "/assets/KOREA/zhen_zhenxuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/yingqin/xin_baiqi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/long2_weixiaokuan.png": {
            "scale": 1.14,
            "offsetX": 3,
            "offsetY": 1
        },
        "/assets/BASHU/ba_bamanzi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/baishui_yanghuai.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/chenzhou_d_zhanghao.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/jingjiang_qushisi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BASHU/dangchang_liangmiding.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/BASHU/daxi_ming_zhangxianzhong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BASHU/guo_jixin.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/miao_amishi.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/liao_houhongyuan.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/BASHU/qianhui_baiyanhu.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/ran_d_ranshouzhong.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/chaozhou_d_mafa.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/NORTH/qu_d_quyi.png": {
            "scale": 0.84,
            "offsetX": 5,
            "offsetY": -40
        },
        "/assets/BASHU/sou_gaodingyuan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BASHU/shuixi_anbangyan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/chen2_zhaofan.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTH/yuzhou_zuti.png": {
            "scale": 0.9,
            "offsetX": 1,
            "offsetY": 4
        },
        "/assets/BASHU/xiang_d_xiangdakun.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/BASHU/yang_bozhou_yangyinglong.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/zuo_d_wufu.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 43
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/wuhu_dukake.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/yada_ahexiong.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/yiwu_hanshen.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/shi_clan_moheduotutun.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/guge_chizhaxichabade.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/kazakh_hasimu.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/kokand_alimukuli.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/tuoming_tuomin.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/WESTERN/shule_aersilan.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/kalan_suhela.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/jie_sijinti.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/faqiang_niechizanpu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/pishan_daihu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/baha_gaiwamu.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/anushidgin_yile.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL/__闲置__CENTRAL_05.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LINGNAN/duanzhou_d_caojin.png": {
            "scale": 0.85,
            "offsetX": 16,
            "offsetY": 6
        },
        "/assets/zhaosong/__闲置__zhaosong_24.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -14
        },
        "/assets/CENTRAL/__闲置__CENTRAL_43.png": {
            "scale": 0.94,
            "offsetX": 3,
            "offsetY": 7
        },
        "/assets/CENTRAL/shatuo_likeyong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/mi_mizhu.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/__闲置__CENTRAL_40.png": {
            "scale": 0.93,
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
        "/assets/CENTRAL/__闲置__CENTRAL_41.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTH/zhe_d_zheyuqing.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BASHU/wanzhou_shangguankui.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/BASHU/zi_changhong.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/gaoqi_d_gaohuan.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -5
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
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -55
        },
        "/assets/daming/__闲置__JIANGNAN_22.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -78
        },
        "/assets/daming/__闲置__daming_14.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/DIANQIAN/basha_d_daogengmeng.png": {
            "scale": 1.29,
            "offsetX": -31,
            "offsetY": 53
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_21.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/DIANQIAN/kunming_yi_lucheng.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_26.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/mu_lijiang_muzeng.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/DIANQIAN/pyu_moluo.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/shuizhen_qudaren.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/DIANQIAN/taiyuan_menglai.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/DIANQIAN/hantawadi_mangyinglong.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/TIBET/humi_zhentan.png": {
            "scale": 1.06,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/HEXI/chile_hulvjin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/__闲置__CENTRAL_23.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/erzhu_erzhurong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/HEXI/__闲置__HEXI_14.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/HEXI/hunxie_xuziwei.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/__闲置__HEXI_15.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WESTERN/shache_xian_suoche_shachexian.png": {
            "scale": 0.77,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/HEXI/xingxingxia_guoxiaoke.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/da_yuan_kuokuotiemuer.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/HEXI/__闲置__HEXI_05.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/totomi_jiujingzhongci.png": {
            "scale": 0.97,
            "offsetX": 3,
            "offsetY": -28
        },
        "/assets/JAPAN/__闲置__JAPAN_06.png": {
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
        "/assets/JAPAN/__闲置__JAPAN_14.png": {
            "scale": 1.12,
            "offsetX": 21,
            "offsetY": -11
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
            "offsetY": -55
        },
        "/assets/JAPAN/jinchuan_jinchuanyiyuan.png": {
            "scale": 1.07,
            "offsetX": 21,
            "offsetY": -14
        },
        "/assets/JAPAN/kai_wutianxinxuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/JAPAN/kakizaki_liqiqingguang.png": {
            "scale": 0.92,
            "offsetX": 1,
            "offsetY": -2
        },
        "/assets/JAPAN/mino_dagujiji.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/JAPAN/otomo_d_lihuadaoxue.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/owari_zhitianxinchang.png": {
            "scale": 0.96,
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
        "/assets/JAPAN/zhuqian_shaoerzineng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/JIANGNAN/fu2_zhoudi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/hu_d_husansheng.png": {
            "scale": 0.97,
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
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JIANGNAN/qian_d_yudayou.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/qiufu_qiufu.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/JIANGNAN/shanyue_sunce.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/wan_liuyuan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/wan_lukang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/wang_s_wanghua.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JIANGNAN/wenling_shilang.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JIANGNAN/xie_xiefangde.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/JIANGNAN/yezongliu_yezongliu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/JIANGNAN/ying_caojingzong.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -13
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
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/hui_bunaihou.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/KOREA/jingcheng_d_yuyouzhao.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/KOREA/joseon_lichenggui.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/KOREA/lelang_wangqi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/KOREA/luzhou_zhangwenxiu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KOREA/naju_d_wangjian_wangye.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/KOREA/sambyeol_lishunchen.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/ssangseong_cuiying.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/KOREA/ssangseong_lizichun.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/buyi_d_weichaoyuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/cen_d_cenmeng.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/yangshe_yangshezhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/LINGNAN/dongzu_wumian.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/guangzhou_liuyin.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/longwu_huangdaozhou.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/miao_qing_yangwanzhe.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/xianqin/yan_leyi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/guide_d_xiaohe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/yingzhou_liuyan.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/litang/__闲置__litang_05.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/liuhan/suzhou_huoqubing.png": {
            "scale": 1.02,
            "offsetX": 1,
            "offsetY": -11
        },
        "/assets/liuhan/ningkou_liling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/liuhan/dongsheng_weishang.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -74
        },
        "/assets/liuhan/dixiang_wangmang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/liuhan/quli_chentang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/manqing/qinghai_yuezhongqi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTHEAST/dawoer_baerdaqi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/manqing/xingan_hailancha.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
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
        "/assets/NORTH/__闲置__NORTH_04.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -21
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
            "scale": 0.89,
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
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/NORTHEAST/nifuhe_baerhudai.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/NORTHEAST/nuergan_kangwang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/suolun_bomuboguoer.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/NORTHEAST/sushen_tudiji.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/wure_wuzhaodu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/NORTHEAST/yehe_jintaiji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/dongping_langtan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/panjun/__闲置__panjun_24.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/panjun/__闲置__PANJUN_14.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/panjun/__闲置__PANJUN_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/panjun/baibo_guotai.png": {
            "scale": 1,
            "offsetX": 11,
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
        "/assets/LINGNAN/__闲置__WESTERN_24.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -22
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
        "/assets/STEPPE/bayegu_qulishi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/bulat_beiduanchaer.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/buriat_tumenjiergale.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/chechen_chechenhanshuolei.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/STEPPE/dingling_weilu.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/donghu_tuiyin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/TIBET/tsangpa_pengcuonanjie.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/STEPPE/gaoche_afuzhiluo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/geluolu_chisipijia.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/heisha_d_houlihu.png": {
            "scale": 0.9,
            "offsetX": 8,
            "offsetY": 2
        },
        "/assets/STEPPE/hongirad_dexuechan.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/STEPPE/huyan_peicen.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/TIBET/ali_gandancaiwang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/TIBET/gongbu_gongbumangbuzhi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/kiyad_yesugai.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/kumo_xiwanghuilibao.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/pazhu_redangunsangpa.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/STEPPE/naiman_taiyanghan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/nuoyan_d_sanyinnuoyan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/TIBET/niang_suonanjiabo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/STEPPE/ongut_alawusi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/qidan_shulvping.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/shiwei_saihou.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/sunite_sousai.png": {
            "scale": 0.97,
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
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/STEPPE/tushetu_tuxietuhan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/kangba_suonuomugunbu.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/qiuci_baiba.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/wuli_d_celeng.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/wuzhumuqin_duoerji.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/TIBET/supi_xinuoluo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -8
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
        "/assets/STEPPE/yuan_d_hubilie.png": {
            "scale": 1.13,
            "offsetX": 4,
            "offsetY": -14
        },
        "/assets/STEPPE/yujiulu_yujiulv.png": {
            "scale": 1.25,
            "offsetX": 18,
            "offsetY": -3
        },
        "/assets/TIBET/tuyu_d_kualv.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/zhadalan_zhamuhe.png": {
            "scale": 0.92,
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
        "/assets/TIBET/tufa_d_tufanutan.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/TIBET/gongtang_gongtangcang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
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
        "/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png": {
            "scale": 0.92,
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
            "scale": 1,
            "offsetX": 32,
            "offsetY": 5
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
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/bailong_suomai.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/duerbote_duerbote_taiji.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/kala_satuke.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/ruoqiang_quhulai.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/xiye_zihe.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/wuzhou/__闲置__wuzhou_02.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/wuzhou/__闲置__wuzhou_04.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/wuzhou/__闲置__wuzhou_08.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -7
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
        "/assets/xianqin/__闲置__xianqin_06.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/xianqin/__闲置__xianqin_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/xianqin/__闲置__xianqin_11.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/yingqin/__闲置__yingqin_01.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
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
            "scale": 0.99,
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
        "/assets/zhaosong/__闲置__zhaosong_17.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": 24
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
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/liuhan/chagatai_genggong.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/yingqin/wazhai_zhanghan.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/xianqin/liguo_zhaoshe.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 1
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
        "/assets/HEXI/lushui_dongzhuo.png": {
            "scale": 1.13,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/CENTRAL/bozhou_d_yujin.png": {
            "scale": 1.03,
            "offsetX": 7,
            "offsetY": 27
        },
        "/assets/litang/shanzhou_wangzhongsi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/tujia_d_qinliangyu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_42.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL/__闲置__CENTRAL_14.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -14
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
        "/assets/liuhan/__闲置__liuhan_13.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/LINGNAN/jing_dingbuling.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/litang/li_s_gaopian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/JIANGNAN/liu_yingbu.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JIANGNAN/ouyang_ouyangwei.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_11.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JIANGNAN/sui_yangjian.png": {
            "scale": 1.05,
            "offsetX": 13,
            "offsetY": -12
        },
        "/assets/JIANGNAN/danyang_huanwen.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 3
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
        "/assets/JIANGNAN/__闲置__JIANGNAN_01.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/JIANGNAN/yiyang_d_mengzongzheng.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/yuezhi_xihou.png": {
            "scale": 1.16,
            "offsetX": -10,
            "offsetY": -7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_15.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LINGNAN/leloi.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/liuzhou_shenxiyi.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/minyue_wuzhu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/zhongxiang_ganning.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/ahaomu_laqite.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/DIANQIAN/jingpozu_zaodan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/DIANQIAN/shuizu_panxinjian.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/DIANQIAN/wazu_banhongwang.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/DIANQIAN/dali_duansiping.png": {
            "scale": 0.99,
            "offsetX": 10,
            "offsetY": 5
        },
        "/assets/LINGNAN/__闲置__LINGNAN_08.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JIANGNAN/sunwu_d_sunquan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/panjun/xushouhui_zhaopusheng.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/DIANQIAN/dongxu_mangruiti.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/manqing/xining_yangyingju.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
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
        "/assets/JIANGNAN/hao_d_weirui.png": {
            "scale": 1.01,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/LINGNAN/__闲置__LINGNAN_11.png": {
            "scale": 0.93,
            "offsetX": -13,
            "offsetY": 26
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/HEXI/__闲置__HEXI_07.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/liuhan/li_lx_d_liguang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/HEXI/__闲置__HEXI_09.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/zhaosong/wei2_hunjian.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/xianqin/mi_chu_xiongl.png": {
            "scale": 0.9,
            "offsetX": 15,
            "offsetY": -13
        },
        "/assets/liuhan/xianyu_hanxin.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/lulin_liuxiu.png": {
            "scale": 1.07,
            "offsetX": 10,
            "offsetY": 0
        },
        "/assets/LINGNAN/shaozhou_zhangzhensun.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/li_s_mayuan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL/fushi_wangmeng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/LINGNAN/__闲置__LINGNAN_12.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/LINGNAN/monong_anong.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/HEXI/__闲置__HEXI_10.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/zhaosong/qing_quduan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/__闲置__CENTRAL_28.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/daming/luming_luxiangsheng.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/__闲置__daming_09.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/HEXI/__闲置__HEXI_16.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/HEXI/xiazhou_lijiqian.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/HEXI/guazhou_zhangshougui.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/dangxiang_liyuanhao.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/litang/pingyuan_yanzhenqing.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_05.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/CENTRAL/tongzhou_liuzhiyuan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/she_ethnic_leiwanxing.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JIANGNAN/wuling_xiangdancheng.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/LINGNAN/__闲置__LINGNAN_13.png": {
            "scale": 0.82,
            "offsetX": 10,
            "offsetY": 9
        },
        "/assets/litang/bing_liji.png": {
            "scale": 0.88,
            "offsetX": 1,
            "offsetY": -40
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 0.98,
            "offsetX": 4,
            "offsetY": 3
        },
        "/assets/litang/loufan_xuerengui.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTH/cangzhou_liurengong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/panjun/taiping_shidakai.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/panjun/__闲置__PANJUN_22.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/woye_huangfugui.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/chuzhou_d_huangfuhui.png": {
            "scale": 1.43,
            "offsetX": 10,
            "offsetY": 27
        },
        "/assets/CENTRAL/jingzhou_gs_huangfusong.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL/__闲置__CENTRAL_25.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/__闲置__CENTRAL_27.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/__闲置__CENTRAL_29.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/__闲置__CENTRAL_30.png": {
            "scale": 1.26,
            "offsetX": 21,
            "offsetY": -34
        },
        "/assets/CENTRAL/__闲置__CENTRAL_31.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/chahar_yantiemuer.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/xianlingqiang_dianling.png": {
            "scale": 1.15,
            "offsetX": 4,
            "offsetY": -5
        },
        "/assets/STEPPE/oirat_ming_gaerdan.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/wala_yexian.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__闲置__STEPPE_47.png": {
            "scale": 1.05,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/STEPPE/wuliangha_subutai.png": {
            "scale": 1.03,
            "offsetX": 6,
            "offsetY": -17
        },
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/yuwen_yuwentai.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/STEPPE/shizhao_d_shihu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/yingzhou_ying_d_muronghuang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/dingzhou_murongchui.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/huite_amuersana.png": {
            "scale": 1.15,
            "offsetX": 10,
            "offsetY": 3
        },
        "/assets/NORTHEAST/wuji_yilizhi.png": {
            "scale": 1.14,
            "offsetX": 7,
            "offsetY": 3
        },
        "/assets/STEPPE/murong_murongke.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/huimo_gaoyanshou.png": {
            "scale": 1.12,
            "offsetX": 3,
            "offsetY": -7
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_14.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/NORTHEAST/hezhe_shaerhuda.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/xiongding_murongyong.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/STEPPE/baidi_baidizi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/cheshihou_angui.png": {
            "scale": 0.93,
            "offsetX": 3,
            "offsetY": 0
        },
        "/assets/BASHU/wudu_dengai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JAPAN/fujiwara_yuanyijing.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JAPAN/__闲置__JAPAN_19.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/__闲置__JAPAN_20.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/JAPAN/__闲置__JAPAN_17.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/NORTH/mushi_muchong.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/JIANGNAN/xiao_d_xiaoyan.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -30
        },
        "/assets/litang/song2_houjunji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/litang/liwang_liguangbi.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/litang/jiashi_wangxuance.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/tuoba_tuobagui.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/yunzhong_tuobaliwei.png": {
            "scale": 1.13,
            "offsetX": -22,
            "offsetY": 28
        },
        "/assets/STEPPE/xianbei_tuobamao.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/STEPPE/__闲置__STEPPE_56.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/litang/lingzhou_puguhuaien.png": {
            "scale": 1.03,
            "offsetX": 3,
            "offsetY": -21
        },
        "/assets/STEPPE/yao_liuyuan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/zangke_xielongyu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_17.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/STEPPE/xiliao_yeldashi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/KOREA/xuantu_yuangaisuwen.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/yizhou_wanyanloushi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/dazhen_wanyantiege.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/jurchen_wanyanzongbi.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_28.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_34.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/NORTHEAST/mohe_wanyanzonghan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/daming/xuan_xuda.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/xianqin/wuzhou_limu.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/shixing_houandou.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/CENTRAL/yingzhou_d2_licunxu.png": {
            "scale": 0.87,
            "offsetX": 7,
            "offsetY": 4
        },
        "/assets/zhaosong/kang_liangshidou.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/shuofang_weiqing.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/dai_d_shijingtang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/tuerhute_wobaxi.png": {
            "scale": 1.13,
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
        "/assets/liuhan/pulei_dougu.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/merkit_boyan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/litang/zhongshan_yangaoqing.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/jiyuan_huluguang.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/kelie_zhaheganbu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/STEPPE/xijue_zhizhichanyu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/zhaosong/hezhou_wangjian.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": 7
        },
        "/assets/BASHU/cuanshi_cuanlongyan.png": {
            "scale": 0.8809,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/NORTH/__闲置__NORTH_03.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTH/wangyan_wangyan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/haikou_wangzhi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/zhaosong/shenshi_wentianxiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/zhuang_d_washifuren.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/__闲置__CENTRAL_32.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JIANGNAN/wang_d_liuyu.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/shaozhou_d_mayin.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/yue_d_lusu.png": {
            "scale": 1.11,
            "offsetX": -1,
            "offsetY": -3
        },
        "/assets/xianqin/kong_d_caogui.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/manqing/gumie_lizhifang.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": -8
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
        "/assets/CENTRAL/__闲置__CENTRAL_33.png": {
            "scale": 0.71,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL/hongnong_jun_yangsu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/litang/weihaiwei_sudingfang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_34.png": {
            "scale": 0.96,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/daming/guizhou_lidingguo.png": {
            "scale": 0.87,
            "offsetX": 4,
            "offsetY": -1
        },
        "/assets/litang/juandu_peixingjian.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/xinping_guoziyi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/hepan_gaoxianzhi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_16.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/daming/chizhou_changyuchun.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/panjun/fangla_fangla.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/LINGNAN/luodian_shexiangfuren.png": {
            "scale": 0.77,
            "offsetX": 1,
            "offsetY": -4
        },
        "/assets/DIANQIAN/nanzhao_geluofeng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/dian_duansiping.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/guzgan_abuhalisi.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/mamon_mameng.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_97.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_18.png": {
            "scale": 0.9,
            "offsetX": 22,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/nongzhigao_huangshimi.png": {
            "scale": 1.03,
            "offsetX": 14,
            "offsetY": 24
        },
        "/assets/JIANGNAN/taizhou_libian.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JAPAN/gonggu_gonggudaozhu.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/daming/__闲置__daming_13.png": {
            "scale": 0.98,
            "offsetX": 9,
            "offsetY": -38
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": 6
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 0.92,
            "offsetX": 32,
            "offsetY": -49
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_27.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/STEPPE/jalair_muhuali.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/yingqin/baiyang_mengtian.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_19.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/yang_zhou_yangxingmi.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/DIANQIAN/pagan_anultuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/STEPPE/zhasaketu_zhasakesubadi.png": {
            "scale": 0.95,
            "offsetX": 9,
            "offsetY": 21
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
            "scale": 0.78,
            "offsetX": 6,
            "offsetY": 8
        },
        "/assets/DIANQIAN/hani_d_zhebi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/daming/zu_d_yuanchonghuan.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
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
        "/assets/zhaosong/__闲置__zhaosong_16.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/zhaosong/__闲置__zhaosong_20.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/zhaosong/__闲置__zhaosong_21.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhaosong/__闲置__zhaosong_22.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/zhaosong/__闲置__zhaosong_27.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/huan_zhongshidao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
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
        "/assets/STEPPE/yel_yelxiuge.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_36.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/tongma_taishici.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_22.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/panjun/huangwang_huangchao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/xianqin/dianguo_zhuangqiao.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/jibin_jianisejia.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/__闲置__JAPAN_24.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/JAPAN/echigo_shangshanqianxin.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JAPAN/iga_d_baididanbo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/panjun/__闲置__PANJUN_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/panjun/ketagalan_huangqingyun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/JAPAN/__闲置__JAPAN_26.png": {
            "scale": 0.84,
            "offsetX": 7,
            "offsetY": -20
        },
        "/assets/JAPAN/date_d_yidazhengzong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/liren_funanshe.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/leizhou_limao.png": {
            "scale": 0.98,
            "offsetX": 30,
            "offsetY": -9
        },
        "/assets/LINGNAN/xinjiang_maji.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/qingqiang_jiangwei.png": {
            "scale": 1.04,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/DIANQIAN/ailao_leilao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_20.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/LINGNAN/zhancheng_zhimin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/litang/gaoliang_geshuhan.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_26.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/litang/yuan_cj_d_lishuo.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/litang/liang_d_zhangxun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/litang/weizhou_weigao.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/dayu_wangshouren.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/manqing/__闲置__NORTHEAST_30.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -62
        },
        "/assets/NORTHEAST/jilizhou_chengmingzhen.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL/__闲置__CENTRAL_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/__闲置__CENTRAL_19.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/daming/qi_d_qijiguang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/daming/__闲置__JIANGNAN_20.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/panjun/yang_aner_yanganer.png": {
            "scale": 1.21,
            "offsetX": 10,
            "offsetY": -18
        },
        "/assets/STEPPE/rouran_shelun.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/yingqin/nanyue_zhaotuo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/xianqin/yong_lujili.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_98.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/dzungar_galedanceling.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/__闲置__CENTRAL_39.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/cangsong_machao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/__闲置__xianqin_36.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/xianqin/__闲置__xianqin_34.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/daming/__闲置__JIANGNAN_21.png": {
            "scale": 1.1,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/BASHU/ming_zheng_zhengchenggong.png": {
            "scale": 0.99,
            "offsetX": 10,
            "offsetY": -2
        },
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/xianqin/__闲置__xianqin_29.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/__闲置__xianqin_30.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/xianqin/__闲置__xianqin_31.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/xiqin_wanyanchenheshang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/guangxin_shixie.png": {
            "scale": 0.82,
            "offsetX": 1,
            "offsetY": -12
        },
        "/assets/JAPAN/__闲置__JAPAN_27.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JAPAN/chosokabe_changzongwobuyuanqin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/litang/__闲置__litang_10.png": {
            "scale": 1.07,
            "offsetX": 11,
            "offsetY": -5
        },
        "/assets/xianqin/__闲置__xianqin_33.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/TIBET/lang_clan_jiangqujianzan.png": {
            "scale": 1.11,
            "offsetX": 12,
            "offsetY": -15
        },
        "/assets/STEPPE/__闲置__STEPPE_69.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_36.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/manghuti_weidaer.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/chenli_d_zuoxianwang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/HEXI/weiming_weiminglinggong.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/mengwu_hebulehan.png": {
            "scale": 1.05,
            "offsetX": -18,
            "offsetY": -28
        },
        "/assets/zhaosong/__闲置__zhaosong_25.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/zhaosong/didao_wangshao.png": {
            "scale": 0.92,
            "offsetX": 19,
            "offsetY": 0
        },
        "/assets/TIBET/daca_dacajilong.png": {
            "scale": 1.1,
            "offsetX": 23,
            "offsetY": 14
        },
        "/assets/BASHU/kui_gongsunshu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/BASHU/cong_puhu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/JIANGNAN/ruochu_doulian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_20.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/xiaobolu_meijinmang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -53
        },
        "/assets/xianqin/__闲置__xianqin_37.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/xianqin/quanrong_yiquhai.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/LINGNAN/chimei_fanchong.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/badakhshan_yaerbeige.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/JAPAN/__闲置__JAPAN_28.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JAPAN/yizhi_beigou.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/osumi_ganfujianxu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JAPAN/__闲置__JAPAN_30.png": {
            "scale": 1.11,
            "offsetX": 22,
            "offsetY": -8
        },
        "/assets/JAPAN/so_zongyizhi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_37.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/manqing/maomingan_suoetu.png": {
            "scale": 1,
            "offsetX": 13,
            "offsetY": -25
        },
        "/assets/KOREA/xinluo_jinyuxin.png": {
            "scale": 0.89,
            "offsetX": 2,
            "offsetY": 0
        },
        "/assets/KOREA/__闲置__KOREA_09.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/KOREA/goryeo_jianghanzan.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/DIANQIAN/xingwei_hanba.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/adao_d_mafushou.png": {
            "scale": 1.11,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/liuhan/__闲置__liuhan_23.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/liuhan/you_gengyan.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LINGNAN/shengmiao_baoli.png": {
            "scale": 0.94,
            "offsetX": 5,
            "offsetY": -2
        },
        "/assets/HEXI/yangguan_lihao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/__闲置__CENTRAL_44.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/xianqin/__闲置__xianqin_38.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/wuzhou/__闲置__wuzhou_20.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JAPAN/__闲置__JAPAN_32.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/kaga_d_xiajianlailian.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/wuzhou/__闲置__wuzhou_25.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/liuhan/__闲置__liuhan_24.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/daming/__闲置__JIANGNAN_23.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/wuzhou/__闲置__wuzhou_22.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/wuzhou/__闲置__wuzhou_23.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/CENTRAL/__闲置__CENTRAL_45.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/wuzhou/__闲置__wuzhou_24.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BASHU/yueyi_zhangyi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/mangshi_mangewang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/xiemian_xiemianwang.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/xierwan_falukesha.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/dedan_dedanwang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/beileinisi_tuolemiershi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/nabatai_aleitasi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/ansxi_aershake.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/guyashu_shamuxiada.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/jialatai_deaotalusi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/aiaoniya_alisita.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/STEPPE/kesa_bulankehan.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/ailan_shuteluke.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/aiji_lameixisi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/safawei_aisimaier.png": {
            "scale": 1.03,
            "offsetX": 7,
            "offsetY": 2
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__闲置__CENTRAL_46.png": {
            "scale": 0.96,
            "offsetX": 13,
            "offsetY": 7
        },
        "/assets/CENTRAL/__闲置__CENTRAL_47.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/saerbadaer_lazhake.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_29.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/aqimeinide_daliushi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL_ASIA/safawei_d_abasi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/bendou_alikesai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/heti_muwatali.png": {
            "scale": 1.29,
            "offsetX": -9,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_21.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/WEST_ASIA/fulijiya_maidasi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/ldiya_keluoyisi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WEST_ASIA/pajiama_oumainisi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WEST_ASIA/bitiniya_diaoduoer.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_55.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/luomu_jilijie.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_40.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/sailiugu_antiaoke.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WEST_ASIA/womaya_muaweiye.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_42.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WEST_ASIA/xibolai_dawei.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/tuolemi_tuolemi.png": {
            "scale": 1.51,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_39.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/jialedi_nibujianisa.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/paermila_zhinuobiya.png": {
            "scale": 1,
            "offsetX": 1,
            "offsetY": 5
        },
        "/assets/litang/__闲置__litang_14.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_02.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/abasi_mansuer.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/xikesuosi_salidi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JAPAN/__闲置__JAPAN_33.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/yashu_saergong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/xianqin/__闲置__xianqin_39.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/youfaladi_yehaiya.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": 30
        },
        "/assets/CENTRAL/__闲置__CENTRAL_57.png": {
            "scale": 0.95,
            "offsetX": 2,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/qiliqiya_pangpei.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/__闲置__STEPPE_50.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_46.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/gulaishi_aibusufuyang.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/maidina_halide.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_48.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_50.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_51.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_52.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_54.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_03.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_04.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_06.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_07.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_08.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_09.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_11.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_12.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_13.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_16.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_17.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_18.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__闲置__WEST_ASIA_20.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_22.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/zhaosong/__闲置__zhaosong_26.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_24.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_29.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_30.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_31.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_32.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_33.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_35.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_36.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_37.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_39.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_38.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_40.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_41.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_42.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_43.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_44.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/ayoubu_salaheding.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_45.png": {
            "scale": 0.77,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_21.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_25.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_24.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_26.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_27.png": {
            "scale": 1.44,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_28.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_29.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_30.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/INDIA/__闲置__CENTRAL_ASIA_31.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_47.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_50.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_53.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_55.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_57.png": {
            "scale": 1.47,
            "offsetX": 0,
            "offsetY": 48
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_61.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_62.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_64.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_65.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_66.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_68.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/STEPPE/__闲置__CENTRAL_ASIA_72.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_73.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_74.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_76.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_77.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__CENTRAL_ASIA_83.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_88.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_91.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_93.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL_ASIA/an_xibanni.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/saman_yisimayi.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/yanda_touluoman.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/xisi_yakubu.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_96.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/delan_sulun.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/dulan_d_aihamaide.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/huluo_jiyasiding.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/najie_minande.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_104.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/wugu_d_tugelile.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/kumisi_aerpu.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_106.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/ribale_faheerdaolai.png": {
            "scale": 1.07,
            "offsetX": -2,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_107.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/yilihanguo_d_hezan.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__闲置__STEPPE_52.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/asaibaijiang_xuliewu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/wulaertu_ajishenti.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/gelujiya_tamaer.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/keerjisi_bagelate.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/midi_daiaokaisi.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/liuhan/wuyuan_d_chengui.png": {
            "scale": 0.99,
            "offsetX": 1,
            "offsetY": -7
        },
        "/assets/liuhan/__闲置__liuhan_22.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/LINGNAN/wuxi_shamoke.png": {
            "scale": 1.07,
            "offsetX": 16,
            "offsetY": 13
        },
        "/assets/NORTH/linhu_mafang.png": {
            "scale": 1.21,
            "offsetX": -7,
            "offsetY": 0
        },
        "/assets/LINGNAN/daozhou_yangzaixing.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/STEPPE/xiajiasi_are.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/shaodang_mitang.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/golog_wandezhaxi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/TIBET/nanjie_nanjiewangqiu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/TIBET/nandou_sushili.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/liuhan/jiluo_d_douxian.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/kereyid_tuowolin.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/xiongnu_maodun.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/monpa_luozhujiacuo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/gling_gesaer.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/lopi_abo.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/TIBET/jiantang_sangjiejiacuo.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/wuhuan_tadun.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WESTERN/loulan_suojie.png": {
            "scale": 1,
            "offsetX": -1,
            "offsetY": -12
        },
        "/assets/WESTERN/gaochang_quwentai.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/__闲置__WESTERN_37.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/boren_ada.png": {
            "scale": 0.9709,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/daming/__闲置__daming_12.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_15.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_34.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/KOREA/woju_yinguan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/jibei_wangkuang.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL_ASIA/huarazim_mohemo.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BASHU/qianzhong_wubayue.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/kuai_kuaiyue.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/xiou_yixusong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/qiong_rengui.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/she_shechongming.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/wenzhou_fangguozhen.png": {
            "scale": 1,
            "offsetX": 9,
            "offsetY": -5
        },
        "/assets/JIANGNAN/kejia_huangfeng.png": {
            "scale": 1.18,
            "offsetX": 12,
            "offsetY": -1
        },
        "/assets/TIBET/gaxa_zhashenduanzhubu.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/khoshut_tulubaihu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/spurgyal_dariniansai.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/TIBET/xiangxiong_limixia.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/miaomin_shiliudeng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LINGNAN/tian_sizhou_tianyougong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/paiyao_huangguasi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/yelang_duotong.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/hor_chisang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LINGNAN/geng_gengjingzhong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/paiwan_alugu.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/lancang_faang.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LINGNAN/dengmaoqi_dengmaoqi.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/TIBET/xiadun_awanglangjie.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/TIBET/ladakh_senggelangjie.png": {
            "scale": 0.95,
            "offsetX": 23,
            "offsetY": 2
        },
        "/assets/WESTERN/yanqi_longtuqizhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/wensu_guyi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WESTERN/weitou_douti.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/JAPAN/ryukyu_shangbazhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/HEXI/yeli_yeliwangrong.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/xianqin/yun_wuli.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/LINGNAN/muong_shencongyue.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/LINGNAN/ayinu_hushemoquan.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/WESTERN/yarkand_latifu.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/dayuan_wugua.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/TIBET/khon_basiba.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/weili_weilifan.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/qiemo_anmoshenpan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/ganden_zongkaba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/nvguo_mojie.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/shanshan_weituqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/__闲置__WESTERN_28.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WESTERN/wusun_liejiaomi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_59.png": {
            "scale": 0.76,
            "offsetX": 2,
            "offsetY": -25
        },
        "/assets/STEPPE/dada_ming_batumengke.png": {
            "scale": 0.95,
            "offsetX": 2,
            "offsetY": 42
        },
        "/assets/HEXI/juqu_d_juqumengxun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/__闲置__TIBET_02.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/TIBET/qiuchi_yangnandang.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_49.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_78.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/guishuang_qiujiuque.png": {
            "scale": 1.19,
            "offsetX": -2,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/muer_mujier.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/yilihanguo_yisimeier.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/xian_d_xianying.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_23.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_24.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_25.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/HEXI/__闲置__HEXI_17.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/qifu_d_qifuchipan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/sai_gaijiayun.png": {
            "scale": 0.71,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_108.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/khoja_apakehezhuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WESTERN/__闲置__WESTERN_31.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WESTERN/__闲置__WESTERN_33.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/zhuxie_zhuxiechixin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/WESTERN/pisha_weichisheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/tajikezu_kuerban.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WESTERN/__闲置__WESTERN_35.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WESTERN/yiduhu_baershu.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WESTERN/__闲置__WESTERN_36.png": {
            "scale": 0.88,
            "offsetX": 11,
            "offsetY": -12
        },
        "/assets/WESTERN/tujishi_sulu.png": {
            "scale": 1.06,
            "offsetX": 11,
            "offsetY": 1
        },
        "/assets/NORTHEAST/ayinu_ezo_keshamayin.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/GERMANIC/aersasi_youlian.png": {
            "scale": 0.8904,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/boootiya_yibaminongda.png": {
            "scale": 1.42,
            "offsetX": 0,
            "offsetY": 54
        },
        "/assets/LATIN/feiniqi_hamierka.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LATIN/__闲置__LATIN_09.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/luoma_diguo_kaisa.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/LATIN/__闲置__LATIN_08.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/LATIN/xila_dimisituokeli.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/leangongguo_afangsuojiushi.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/LATIN/kejila_shulunbao.png": {
            "scale": 1.19,
            "offsetX": 7,
            "offsetY": 17
        },
        "/assets/LATIN/bohepingyuan_diaoduolike.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/__闲置__LATIN_03.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/SLAVIC/taolika_asipuergesi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/LATIN/xixiliwangguo_feitelieershi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GERMANIC/piketai_aoengesi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/GERMANIC/weixi_ansijiaer.png": {
            "scale": 1.42,
            "offsetX": -1,
            "offsetY": 33
        },
        "/assets/LATIN/lagoniya_lieaonida.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LATIN/__闲置__LATIN_10.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/SLAVIC/lagusa_delagan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/GERMANIC/bafaliya_taxiluosanshi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/GERMANIC/ruidian_yota_kaerjiushi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/putaoya_afangsuo.png": {
            "scale": 1,
            "offsetX": 4,
            "offsetY": 2
        },
        "/assets/GERMANIC/meikelunbao_hengliboluo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/GERMANIC/__闲置__GERMANIC_04.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GERMANIC/gaer_duomunaer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/GERMANIC/didi_weilianyishi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LATIN/anuo_wugelinuo.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/guadaer_feiernanduo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/balunxiya_xide.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/__闲置__LATIN_04.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LATIN/moxina_luojie.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LATIN/sading_ailaiaonuola.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/BERBER/yidelisi_yidelisi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/qiekase_weishenniao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/SLAVIC/baojian_qishi_aerbote.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/saierdika_kelumu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/SLAVIC/bosiniya_tefuerteke.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/BERBER/mulabite_tashenfen.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/zhibuluotuo_enlike.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BERBER/zhayan_yalimoluo.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/BERBER/babali_babaluosa.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/BERBER/hamade_hamade.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_109.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BERBER/aguelabu_aokeba.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/BERBER/telibolisi_delagute.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BERBER/jileinaijia_majiasi.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/habusibao_makeximi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/GERMANIC/mozeer_junshitanding.png": {
            "scale": 1.13,
            "offsetX": 2,
            "offsetY": 29
        },
        "/assets/GERMANIC/maixiya_aofa.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/fulandesi_luobeierershi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/__闲置__GERMANIC_17.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/GERMANIC/__闲置__GERMANIC_16.png": {
            "scale": 1.0533,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/SLAVIC/weijiebusike_gongguo_aoergeerde.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/GERMANIC/nidelan_weilian.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/GERMANIC/nuosi_aolafu.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/GERMANIC/boumeilaniyan_kaximier.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/GERMANIC/falanji_chalimate.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/LATIN/langgeduoke_leimengwushi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LATIN/aermolika_jierdeleisi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LATIN/xilagu_ajiasuokeli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/tuosikana_luolunzuo.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LATIN/yadelaiya_danduoluo.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LATIN/kanpaniya_kaluo.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LATIN/jiatailuoniya_weifuleide.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LATIN/nasier_muhanmode.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LATIN/liguliya_andelieya.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/SLAVIC/seleisi_ximeiang.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/SLAVIC/saierweiya_sidifendushang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/SLAVIC/bolisiya_jiasituoerde.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/SLAVIC/teweier_gongguo_mihayier.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/zhituo_rituomier.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/GERMANIC/wende_jieluobojue.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/GERMANIC/pufaerci_ludeweixi.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/GERMANIC/__闲置__GERMANIC_15.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/GERMANIC/hansa_kelaosi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GERMANIC/__闲置__GERMANIC_01.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/weijing_york_xuefuailike.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/GERMANIC/asikanani_aerbulei.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/huohengsuolun_feitelieyishi.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/__闲置__GERMANIC_02.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/GERMANIC/jialuolin_chalidadi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/boximiya_yangjiesika.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GERMANIC/__闲置__GERMANIC_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 38
        },
        "/assets/LATIN/gaolu_chaliqishi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/GERMANIC/__闲置__GERMANIC_05.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/GERMANIC/anggelu_aerfuleide.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/__闲置__GERMANIC_06.png": {
            "scale": 1.0318,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/GERMANIC/rierman_aotuoyishi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GERMANIC/__闲置__GERMANIC_07.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GERMANIC/batawei_xiweilisi.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/LATIN/gaolu_luoma_keluowei.png": {
            "scale": 1.04,
            "offsetX": 5,
            "offsetY": 12
        },
        "/assets/GERMANIC/kanbuliya_weilianhualaishi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/LATIN/aquidan_heitaizi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/puluowangsi_leimengsishi.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LATIN/lunbadi_sifuerzha.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/LATIN/donggete_diaoduolike.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/xigete_afangsuoliushi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LATIN/andaluoxiya_abudula.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/LATIN/alagong_haimei.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/bulietani_alan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/__闲置__GERMANIC_11.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/__闲置__GERMANIC_09.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/GERMANIC/__闲置__GERMANIC_12.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/__闲置__GERMANIC_13.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GERMANIC/__闲置__GERMANIC_08.png": {
            "scale": 0.98,
            "offsetX": -1,
            "offsetY": 1
        },
        "/assets/SLAVIC/fulajimier_gongguo_andelie.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SLAVIC/pusikefu_gongheguo_daomantasi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/SLAVIC/jialixiya_dannier.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/SLAVIC/qiernigeweifu_gongguo_musidi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/GERMANIC/damolaweiya_moyimier.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/daniebo_luomushenlafu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/GERMANIC/molaweiya_siwatuo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SLAVIC/luosi_yaluosilafu.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/SLAVIC/liulike_niefusiji.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/SLAVIC/gesake_hemeili.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/SLAVIC/beisilafu_xieergai.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/SLAVIC/jinzhang_badou.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/SLAVIC/suzidaer_kangsitandingnuo.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/SLAVIC/moerdaweiya_sidifendadi.png": {
            "scale": 1.22,
            "offsetX": 11,
            "offsetY": 8
        },
        "/assets/SLAVIC/mosike_gongguo_dunsikeyi.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/SLAVIC/walajiyia_fuladesanshi.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/SLAVIC/baojiaer_wuluhei.png": {
            "scale": 1.26,
            "offsetX": -6,
            "offsetY": 18
        },
        "/assets/SLAVIC/piyasite_kaqimiri.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/SLAVIC/nieman_weituofute.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/tiaodun_qishi_wuerlixi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SLAVIC/litaowan_gediminasi.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SLAVIC/peilieya_gongguo_monuomahe.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/SLAVIC/liwoniya_puleitebeige.png": {
            "scale": 1.13,
            "offsetX": 6,
            "offsetY": 14
        },
        "/assets/SLAVIC/dajiya_deqiebalusi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/kelimiya_hajigelai.png": {
            "scale": 1.31,
            "offsetX": 7,
            "offsetY": 17
        },
        "/assets/SLAVIC/chude_weiqiesilafu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SLAVIC/bolan_yagaiwo.png": {
            "scale": 1.17,
            "offsetX": 17,
            "offsetY": 15
        },
        "/assets/LATIN/mengtainiya_basalabu.png": {
            "scale": 1.22,
            "offsetX": 16,
            "offsetY": 8
        },
        "/assets/SLAVIC/deniesite_muhanmodegeli.png": {
            "scale": 1.26,
            "offsetX": 1,
            "offsetY": 14
        },
        "/assets/STEPPE/fuerjia_asitela.png": {
            "scale": 1.25,
            "offsetX": 9,
            "offsetY": -10
        },
        "/assets/STEPPE/nuogai_ounasihan.png": {
            "scale": 1.34,
            "offsetX": 5,
            "offsetY": 1
        },
        "/assets/STEPPE/bashekeer_kalasakaer.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/STEPPE/xierhe_saierzhu.png": {
            "scale": 1.23,
            "offsetX": 14,
            "offsetY": -7
        },
        "/assets/SLAVIC/xideweina_buliesilafu.png": {
            "scale": 1.1,
            "offsetX": -5,
            "offsetY": 4
        },
        "/assets/LATIN/kelite_fukasi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LATIN/maqidun_kashande.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GERMANIC/shiwaben_shengwuerlixi.png": {
            "scale": 1.0547,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GERMANIC/ruishi_ciwenli.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GERMANIC/shengdian_qishi_demolai.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GERMANIC/maerta_qishi_lawalaite.png": {
            "scale": 0.8774,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/zizhou_wangjian.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/__闲置__CENTRAL_26.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_49.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/__闲置__CENTRAL_51.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL/__闲置__CENTRAL_52.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/__闲置__CENTRAL_53.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL/__闲置__CENTRAL_54.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/__闲置__CENTRAL_56.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL/__闲置__CENTRAL_55.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL/__闲置__CENTRAL_58.png": {
            "scale": 1.55,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/__闲置__CENTRAL_59.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_95.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_08.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LATIN/__闲置__LATIN_07.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LATIN/__闲置__LATIN_11.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/dabolan_puremeisi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/SLAVIC/siluoboda_duonieci.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/LATIN/aosiruowen_baodewen.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/INDIA/boluo_damoboluo.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/INDIA/fanyanna_xieer.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/INDIA/deli_alawuding.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/INDIA/jiashi_d_jiashiwang.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/INDIA/jieri_jieriwang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/INDIA/kongque_zhantuoluojiduo.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/INDIA/mojietuo_pinpisuoluo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/INDIA/mowoer_akeba.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/INDIA/xike_lanjite.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/INDIA/sumo_sumowang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LATIN/luodesi_weilalei.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": 0
        },
        "/assets/SLAVIC/__闲置__SLAVIC_01.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/SLAVIC/yedi_sabuluofu.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/JAPAN/__闲置__JAPAN_29.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/JAPAN/__闲置__JAPAN_31.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/__闲置__JAPAN_34.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/JAPAN/yamato_nanmuzhengcheng.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/KOREA/__闲置__KOREA_10.png": {
            "scale": 1.17,
            "offsetX": -5,
            "offsetY": 0
        },
        "/assets/liuhan/lanzhou_zhaochongguo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/liuhan/__闲置__liuhan_26.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/liuhan/xiyuduhu_banchao.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__闲置__STEPPE_48.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/STEPPE/__闲置__STEPPE_49.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/__闲置__STEPPE_57.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_58.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/dafeichuan_murongnuohebo.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_110.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/qincha_baqiman.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/KOREA/xingliao_dayanlin.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/__闲置__STEPPE_46.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_61.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/__闲置__STEPPE_62.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/STEPPE/__闲置__STEPPE_63.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/kangju_chebishi.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/__多余__JAPAN_01.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__多余__LINGNAN_11.png": {
            "scale": 0.77,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_09.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTHEAST/elunchunzu_gaishan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/__闲置__JAPAN_35.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/beihai_shamusheyun.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/__闲置__LINGNAN_16.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/funan_fanman.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/TIBET/__闲置__TIBET_03.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/gurkha_badouersaye.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_17.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/babuer_babuer.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/GERMANIC/danmai_abusalong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/ruidian_si_biergeyaer.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/kasidiliya_afangsuoshiyishi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LATIN/duluo_sangqiaoyishi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LATIN/teluoyi_heketuoer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/alabo_qiyade.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_28.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/DIANQIAN/mon_monuhe.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/__多余__LINGNAN_08.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_25.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_27.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_28.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/LINGNAN/__多余__LINGNAN_21.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_29.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/STEPPE/__闲置__STEPPE_64.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/STEPPE/__闲置__STEPPE_67.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/__闲置__STEPPE_68.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/__闲置__STEPPE_65.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/STEPPE/menggu_d_chengjisihan.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/__闲置__WESTERN_38.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/WESTERN/weiwuer_yusubu.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WESTERN/__闲置__WESTERN_39.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/wuzhou/kepantuo_dulimi.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/KOREA/__闲置__KOREA_13.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/KOREA/sabeol_jinshimin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/KOREA/__闲置__KOREA_14.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -54
        },
        "/assets/KOREA/chen3_jizhun.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_40.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/dongxia_puxianwannu.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/litang/__闲置__litang_17.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTH/__闲置__NORTH_05.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/xianqin/liangshidu_longjia.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/manqing/ewenki_gentemuer.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/__闲置__litang_11.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/litang/__闲置__litang_16.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/litang/__闲置__litang_15.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/litang/dingxiang_d_lijing.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/__多余__LINGNAN_19.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/LINGNAN/__闲置__LINGNAN_05.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/xianqin/__多余__xianqin_01.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/xianqin/__闲置__liuhan_21.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/GERMANIC/__闲置__GERMANIC_14.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/dayuzi_yinalechihei.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/TIBET/__多余__TIBET_04.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/WESTERN/__多余__WESTERN_01.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/WESTERN/__多余__WESTERN_04.png": {
            "scale": 0.85,
            "offsetX": 13,
            "offsetY": 26
        },
        "/assets/WESTERN/__多余__WESTERN_02.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/daming/yansui_wangwei.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/SLAVIC/__闲置__SLAVIC_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/GERMANIC/shaiyue_aerpade.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/STEPPE/__闲置__STEPPE_70.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/__闲置__STEPPE_71.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/yidier_yuesefu.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/__闲置__STEPPE_73.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/salai_aidigu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/__闲置__STEPPE_74.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/huihu_dunmohedagan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/__闲置__STEPPE_75.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/ogodei_chuoermahan.png": {
            "scale": 1.08,
            "offsetX": 22,
            "offsetY": -6
        },
        "/assets/TIBET/__多余__CENTRAL_ASIA_04.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/WESTERN/__多余__WESTERN_05.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/xueyantuo_yinan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/daming/__闲置__daming_16.png": {
            "scale": 0.94,
            "offsetX": 19,
            "offsetY": 37
        },
        "/assets/daming/dongshengwei_wangyue.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/__闲置__LINGNAN_17.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BASHU/xinggu_cuanxi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_30.png": {
            "scale": 1.04,
            "offsetX": 13,
            "offsetY": 19
        },
        "/assets/BASHU/wuman_cuangui.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/tan_d_qinhou.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/GERMANIC/keluodiya_zilinsiji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/SLAVIC/dunhe_tatalinuofu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/STEPPE/__闲置__STEPPE_77.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/__多余__TIBET_02.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/tuva_qinggunzabu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/TIBET/__多余__TIBET_01.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__闲置__STEPPE_79.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/STEPPE/ashide_ashidejieli.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/__闲置__STEPPE_80.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/ashina_ashinayandou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_81.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/duolu_ashinahelu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_82.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/tujue_ashinatumen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_31.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/DIANQIAN/chenla_duyebamo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/NORTHEAST/yilou_naoya.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/feiyaka_cemutehe.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/LATIN/__多余__LATIN_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/__闲置__LATIN_14.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LATIN/__闲置__LATIN_13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LATIN/baizanting_fulajimier.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/__闲置__BASHU_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/BASHU/bandun_fanmu.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WEST_ASIA/sumeier_zhajixi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/LINGNAN/panyao_pandaxiao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/yipilusi_piluoshi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LATIN/baojialiya_asenyishi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/talanduo_aqita.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GERMANIC/safuyi_ameidiao.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LATIN/bosi_puluosi_liukongyishi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LATIN/saipulusi_juyi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/__闲置__LATIN_15.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/__多余__WEST_ASIA_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_57.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_56.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/HEXI/guiyi_caoyijin.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WEST_ASIA/osman_muhanmodeershi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/BERBER/buni_hanniba.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/__闲置__NORTHEAST_41.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL/__闲置__CENTRAL_60.png": {
            "scale": 1.53,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/__闲置__LINGNAN_20.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL/qian_songjingyang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/__闲置__LINGNAN_21.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/CENTRAL/nanzhong_mazhong.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_33.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_34.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/DIANQIAN/konbaung_yongjiya.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/NORTH/__闲置__NORTH_06.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/huo_songlaosheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/__闲置__HEXI_18.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/HEXI/__闲置__HEXI_19.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/helian_helianbobo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/STEPPE/__闲置__STEPPE_83.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/HEXI/shizhou_liucong.png": {
            "scale": 1.09,
            "offsetX": 10,
            "offsetY": -10
        },
        "/assets/liuhan/__闲置__liuhan_29.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/liuhan/guangwu_xinwuxian.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/liuhan/__闲置__liuhan_30.png": {
            "scale": 1.02,
            "offsetX": 9,
            "offsetY": -30
        },
        "/assets/liuhan/ganzhou_dourong.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": -29
        },
        "/assets/liuhan/__多余__liuhan_01.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": -29
        },
        "/assets/liuhan/han_d_liubang.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/xibo_d_tubote.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/DIANQIAN/9a9ba598-ab68-4412-a898-196f32a96e45.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/1af8a43a-ff22-45e8-bbdc-0b00319c7207.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_35.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/ava_sijifa.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_45.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/nanai_zhahaluo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 4
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
