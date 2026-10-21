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
        "/assets/CENTRAL/shang_fuhao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL/tang_lishimin.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/yangshao_zhoubo.png": {
            "scale": 1.22,
            "offsetX": 13,
            "offsetY": -9
        },
        "/assets/CENTRAL/yin_dixin.png": {
            "scale": 0.97,
            "offsetX": 20,
            "offsetY": -35
        },
        "/assets/KHMER/siam_nalixuan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL/wuzhou_d_wuzetian.png": {
            "scale": 1.38,
            "offsetX": 1,
            "offsetY": 23
        },
        "/assets/CENTRAL/song_zhaokuangyin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/KHITAN/heyuan_d_heichichangzhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/chunshen_huangxie.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL/dongxian_sunbin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/wu_sunwu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/gouding_wubo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/JIANGNAN/jinling_tandaoji.png": {
            "scale": 1.15,
            "offsetX": 19,
            "offsetY": -2
        },
        "/assets/BURMESE/dai_daoyingmeng.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/WEI/lingqiu_zhaowuling.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/huaiyang_zhouyafu.png": {
            "scale": 1.02,
            "offsetX": 12,
            "offsetY": 20
        },
        "/assets/JIANGNAN/dacheng_chenkai.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/CENTRAL/qianzhou_lisheng.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/shangzhou_shangyang.png": {
            "scale": 1.12,
            "offsetX": 4,
            "offsetY": -8
        },
        "/assets/KHITAN/shazhou_zhangyichao.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/chanzhou_chairong.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WEI/zhuozhou_anlushan.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/WEI/linyu_wusangui.png": {
            "scale": 1.07,
            "offsetX": 11,
            "offsetY": -6
        },
        "/assets/BASHU/jingdong_taohong.png": {
            "scale": 0.98,
            "offsetX": 1,
            "offsetY": -27
        },
        "/assets/CENTRAL/han_baoyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/JIANGNAN/chu_guanyu.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/jingmen_zhaoyun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/luoyue_zhengce.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/CENTRAL/qin_simacuo.png": {
            "scale": 1.24,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/CENTRAL/zhou_jifa.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/BASHU/dangzhou_qiangduan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/MONGOL/tiele_qibiheli.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/fengzhou_wujie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/WEI/jinzhou_lichengliang.png": {
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
        "/assets/WEI/dizhou_wangyanzhang.png": {
            "scale": 0.95,
            "offsetX": 15,
            "offsetY": 6
        },
        "/assets/BASHU/baiman_gaoshengtai.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -51
        },
        "/assets/CENTRAL/zhong_xiexuan.png": {
            "scale": 1.02,
            "offsetX": 14,
            "offsetY": 16
        },
        "/assets/JIANGNAN/huang_d_sunshuao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/yanchuan_d_yuefei.png": {
            "scale": 1.2,
            "offsetX": 6,
            "offsetY": -28
        },
        "/assets/KHMER/champa_zhipenge.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/KHMER/luohu_ganmuding.png": {
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
            "scale": 0.98,
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
        "/assets/KHITAN/liangzhou_zhanggui.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/gar_lunqinling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/MONGOL/borjigin_tuolei.png": {
            "scale": 1.15,
            "offsetX": 11,
            "offsetY": -14
        },
        "/assets/XIANBEI/liao_d_yelvabaoji.png": {
            "scale": 1.03,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/JAPAN/edo_dechuanjiakang.png": {
            "scale": 0.9,
            "offsetX": 7,
            "offsetY": -11
        },
        "/assets/MONGOL/wulianghai_chelingwubashen.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/JIANGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/MONGOL/huige_gulipeiluo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTHEAST/bohai_dazuorong.png": {
            "scale": 1,
            "offsetX": 11,
            "offsetY": 14
        },
        "/assets/KHITAN/chijin_qiewangshijia.png": {
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
        "/assets/JIANGNAN/yue_goujian.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/NORTHEAST/manzhou_nuerhachi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -55
        },
        "/assets/NORTHEAST/aisin_d_huangtaiji.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/MONGOL/pugu_ashinaguduolu.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/NORTHEAST/manzhou_d_duoergun.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/bailian_wangconger.png": {
            "scale": 1.41,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/keerkezi_manasi.png": {
            "scale": 1,
            "offsetX": 17,
            "offsetY": -20
        },
        "/assets/CENTRAL/yangzhou_wangping.png": {
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
        "/assets/BASHU/pingnan_muying.png": {
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
        "/assets/JIANGNAN/ouyue_zouyao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WEI/gongsun_d_gongsundu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/huizhou_zhugeliang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL/xiangzhou_lvwenhuan.png": {
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
        "/assets/CENTRAL/zhao_lianpo.png": {
            "scale": 0.85,
            "offsetX": 8,
            "offsetY": 5
        },
        "/assets/JAPAN/shimotsuke_yudougongguanggang.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -41
        },
        "/assets/PERSIAN/hali_gedaerzi.png": {
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
        "/assets/MONGOL/kaerka_abadaihan.png": {
            "scale": 0.99,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/CENTRAL/sima_d_simayi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -8
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
        "/assets/CENTRAL/huizhou_yaosi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL/xiayang_d_dengyu.png": {
            "scale": 1.1,
            "offsetX": 5,
            "offsetY": 17
        },
        "/assets/CENTRAL/pizhou_lvbu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/WEI/hejian_gongsunzan.png": {
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
        "/assets/CENTRAL/beidi_yaochang.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/CENTRAL/yingzhou_d_liuqi.png": {
            "scale": 1.08,
            "offsetX": -2,
            "offsetY": -35
        },
        "/assets/JIANGNAN/lu_zhangliao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/qi_simarangju.png": {
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
        "/assets/CENTRAL/xin_baiqi.png": {
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
        "/assets/JIANGNAN/chenzhou_d_zhanghao.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JIANGNAN/jingjiang_qushisi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/TIBET/dangchang_liangmiding.png": {
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
        "/assets/BASHU/miao_amishi.png": {
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
        "/assets/JIANGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JIANGNAN/chaozhou_d_mafa.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/qu_d_quyi.png": {
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
        "/assets/JIANGNAN/chen2_zhaofan.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL/yuzhou_zuti.png": {
            "scale": 0.9,
            "offsetX": 1,
            "offsetY": 4
        },
        "/assets/JIANGNAN/xiang_d_xiangdakun.png": {
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
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/WESTERN/shi_clan_moheduotutun.png": {
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
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WESTERN/kokand_alimukuli.png": {
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
        "/assets/PERSIAN/kalan_suhela.png": {
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
        "/assets/PERSIAN/baha_gaiwamu.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__闲置__CENTRAL_05.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/duanzhou_d_caojin.png": {
            "scale": 0.89,
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
        "/assets/WEI/shatuo_likeyong.png": {
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
        "/assets/WEI/zhe_d_zheyuqing.png": {
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
        "/assets/WEI/gaoqi_d_gaohuan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/sunqin_sunchuanting.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/suzhou_d_shikefa.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEI/ming_d_zhudi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL/jinan_tiexuan.png": {
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
        "/assets/KHMER/basha_d_daogengmeng.png": {
            "scale": 1.29,
            "offsetX": -31,
            "offsetY": 53
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_21.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/BASHU/kunming_yi_lucheng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_26.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/BASHU/mu_lijiang_muzeng.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/BURMESE/pyu_moluo.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/KHMER/shuizhen_qudaren.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MALAY/taiyuan_menglai.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/BURMESE/hantawadi_mangyinglong.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/TIBET/humi_zhentan.png": {
            "scale": 1.06,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/XIANBEI/chile_hulvjin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WEI/erzhu_erzhurong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/HEXI/__闲置__HEXI_14.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/HEXI/__闲置__HEXI_20.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/__闲置__HEXI_15.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/KHITAN/xingxingxia_guoxiaoke.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/XIANBEI/da_yuan_kuokuotiemuer.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KHITAN/yingli_jilasiyi.png": {
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
            "scale": 0.88,
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
        "/assets/NORTHEAST/luzhou_zhangwenxiu.png": {
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
        "/assets/BASHU/buyi_d_weichaoyuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/JIANGNAN/cen_d_cenmeng.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL/yangshe_yangshezhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/BASHU/dongzu_wumian.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/guangzhou_liuyin.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/VIETNAMESE/linyi_fanyangmai.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/longwu_huangdaozhou.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/BASHU/miao_qing_yangwanzhe.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/shen_shenbo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEI/yan_leyi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/guide_d_xiaohe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/yingzhou_liuyan.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/litang/__闲置__litang_05.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL/suzhou_huoqubing.png": {
            "scale": 1.02,
            "offsetX": 1,
            "offsetY": -11
        },
        "/assets/KHITAN/ningkou_liling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/XIANBEI/dongsheng_weishang.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -74
        },
        "/assets/CENTRAL/dixiang_wangmang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/KHITAN/quli_chentang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/BASHU/qinghai_yuezhongqi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTHEAST/dawoer_baerdaqi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/XIANBEI/xingan_hailancha.png": {
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
        "/assets/WEI/pinghai_laihuer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEI/qingyuan_bd_zhoudewei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/NORTH/__闲置__NORTH_04.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/WEI/guzhu_tianyu.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 0
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
        "/assets/XIANBEI/keerqin_aoba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/kuye_kuye_qichayi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/KOREA/mao_wenlong_maowenlong.png": {
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
        "/assets/CENTRAL/baibo_guotai.png": {
            "scale": 1,
            "offsetX": 11,
            "offsetY": 20
        },
        "/assets/CENTRAL/dashun_lizicheng.png": {
            "scale": 0.89,
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
        "/assets/MONGOL/bayegu_qulishi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/SLAVIC/bulat_beiduanchaer.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/MONGOL/buriat_tumenjiergale.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/MONGOL/dingling_weilu.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MONGOL/gaoche_afuzhiluo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/geluolu_chisipijia.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/MONGOL/heisha_d_houlihu.png": {
            "scale": 0.9,
            "offsetX": 8,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/huyan_peicen.png": {
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
        "/assets/MONGOL/kiyad_yesugai.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/XIANBEI/kumo_xiwanghuilibao.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/XIANBEI/kumoxi_ahuihui.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/pazhu_redangunsangpa.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL_ASIA/naiman_taiyanghan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/MONGOL/nuoyan_d_sanyinnuoyan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/TIBET/niang_suonanjiabo.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/XIANBEI/ongut_alawusi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/XIANBEI/qidan_shulvping.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/MONGOL/shiwei_saihou.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/XIANBEI/sunite_sousai.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/MONGOL/tatar_mieguzhen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/XIANBEI/tumed_andahan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/MONGOL/tumengken_tumengken.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/MONGOL/tushetu_tuxietuhan.png": {
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
        "/assets/MONGOL/wuli_d_celeng.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/XIANBEI/wuzhumuqin_duoerji.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/TIBET/supi_xinuoluo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/KHITAN/xihai_d_fulianchou.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/MONGOL/yaoluoge_yaoluogepusa.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/XIANBEI/yuan_d_hubilie.png": {
            "scale": 1.13,
            "offsetX": 4,
            "offsetY": -14
        },
        "/assets/MONGOL/yujiulu_yujiulv.png": {
            "scale": 1.25,
            "offsetX": 18,
            "offsetY": -3
        },
        "/assets/KHITAN/tuyu_d_kualv.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/MONGOL/zhadalan_zhamuhe.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/MONGOL/zhuerqi_sachabieqi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/MONGOL/zubu_mogusi.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KHITAN/tufa_d_tufanutan.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/TIBET/gongtang_gongtangcang.png": {
            "scale": 0.91,
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
        "/assets/JIANGNAN/kalun_dexinga.png": {
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
        "/assets/CENTRAL/ruo_wangjian.png": {
            "scale": 1.07,
            "offsetX": 1,
            "offsetY": 11
        },
        "/assets/CENTRAL/sizhou_hanshizhong.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/JIANGNAN/tingzhou_d_chenmin.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/zaoyang_d_menggong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/zhaosong/__闲置__zhaosong_17.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": 24
        },
        "/assets/JIANGNAN/changshaguo_xinqiji.png": {
            "scale": 0.9,
            "offsetX": 3,
            "offsetY": -39
        },
        "/assets/JIANGNAN/luoping_zhangshijie.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WESTERN/chagatai_genggong.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/wazhai_zhanghan.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/liguo_zhaoshe.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/KHITAN/xiutu_jinridi.png": {
            "scale": 0.95,
            "offsetX": 15,
            "offsetY": 18
        },
        "/assets/KHITAN/weiyuan_d_niangengyao.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/KHITAN/lushui_dongzhuo.png": {
            "scale": 1.13,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/CENTRAL/bozhou_d_yujin.png": {
            "scale": 1.03,
            "offsetX": 7,
            "offsetY": 27
        },
        "/assets/KHITAN/shanzhou_wangzhongsi.png": {
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
        "/assets/VIETNAMESE/jing_dingbuling.png": {
            "scale": 1.05,
            "offsetX": -1,
            "offsetY": 21
        },
        "/assets/BASHU/zhuoshi_gaopian.png": {
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
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JIANGNAN/yidou_luxun.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WEI/heng1_yangye.png": {
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
        "/assets/KHITAN/yuezhi_xihou.png": {
            "scale": 1.16,
            "offsetX": -10,
            "offsetY": -7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_15.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/VIETNAMESE/leloi.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JIANGNAN/liuzhou_shenxiyi.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/minyue_wuzhu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/zhongxiang_ganning.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BENGALIS/ahaomu_laqite.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/BURMESE/jingpozu_zaodan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/BASHU/shuizu_panxinjian.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BASHU/wazu_banhongwang.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/dali_duansiping.png": {
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
        "/assets/JIANGNAN/xushouhui_zhaopusheng.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BURMESE/dongxu_mangruiti.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/KHITAN/xining_yangyingju.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/panjun/__闲置__PANJUN_20.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/shuntian_linshuangwen.png": {
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
        "/assets/VIETNAMESE/nong2_nongzhigao.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/HEXI/__闲置__HEXI_07.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEI/li_lx_d_liguang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/__闲置__HEXI_09.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KHITAN/wei2_hunjian.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JIANGNAN/mi_chu_xionglv.png": {
            "scale": 0.9,
            "offsetX": 15,
            "offsetY": -13
        },
        "/assets/WEI/xianyu_hanxin.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL/lulin_liuxiu.png": {
            "scale": 1.07,
            "offsetX": 10,
            "offsetY": 0
        },
        "/assets/JIANGNAN/shaozhou_zhangzhensun.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JIANGNAN/li_s_mayuan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/BASHU/fushi_wangmeng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/LINGNAN/__闲置__LINGNAN_12.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/VIETNAMESE/monong_anong.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/SASANIAN/seljuq_sangjiaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/HEXI/__闲置__HEXI_10.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/qing_quduan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/__闲置__CENTRAL_28.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/CENTRAL/luming_luxiangsheng.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/__闲置__daming_09.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/CENTRAL/huai_zhuyuanzhang.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/HEXI/__闲置__HEXI_16.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/KHITAN/xiazhou_lijiqian.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/KHITAN/guazhou_zhangshougui.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/KHITAN/dangxiang_liyuanhao.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEI/pingyuan_yanzhenqing.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_05.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/WEI/tongzhou_liuzhiyuan.png": {
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
        "/assets/WEI/bing_liji.png": {
            "scale": 0.88,
            "offsetX": 1,
            "offsetY": -40
        },
        "/assets/VIETNAMESE/dayue_chenguojun.png": {
            "scale": 1.02,
            "offsetX": 9,
            "offsetY": 3
        },
        "/assets/WEI/loufan_xuerengui.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEI/cangzhou_liurengong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JIANGNAN/taiping_shidakai.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/panjun/__闲置__PANJUN_22.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/XIANBEI/woye_huangfugui.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/chuzhou_d_huangfuhui.png": {
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
        "/assets/XIANBEI/chahar_yantiemuer.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KHITAN/xianlingqiang_dianling.png": {
            "scale": 1.09,
            "offsetX": 8,
            "offsetY": -2
        },
        "/assets/MONGOL/oirat_ming_gaerdan.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/MONGOL/wala_yexian.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__闲置__STEPPE_47.png": {
            "scale": 1.05,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/MONGOL/wuliangha_subutai.png": {
            "scale": 1.03,
            "offsetX": 6,
            "offsetY": -17
        },
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/XIANBEI/yuwen_yuwentai.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEI/shizhao_d_shihu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/XIANBEI/yingzhou_ying_d_muronghuang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WEI/dingzhou_d_murongchui.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/huite_amuersana.png": {
            "scale": 1.15,
            "offsetX": 10,
            "offsetY": 3
        },
        "/assets/NORTHEAST/wuji_yilizhi.png": {
            "scale": 1.14,
            "offsetX": 7,
            "offsetY": 3
        },
        "/assets/XIANBEI/murong_murongke.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/KOREA/huimo_gaoyanshou.png": {
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
        "/assets/CENTRAL/xiongding_murongyong.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/XIANBEI/baidi_baidizi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/cheshihou_angui.png": {
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
        "/assets/JAPAN/__闲置__JAPAN_17.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL/mushi_muchong.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/CENTRAL/xiao_d_xiaoyan.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -30
        },
        "/assets/BASHU/song2_houjunji.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEI/liwang_liguangbi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/TIBET/jiashi_wangxuance.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEI/tuoba_tuobagui.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/XIANBEI/yunzhong_tuobaliwei.png": {
            "scale": 1.13,
            "offsetX": -22,
            "offsetY": 28
        },
        "/assets/NORTHEAST/xianbei_tuobamao.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/STEPPE/__闲置__STEPPE_56.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/KHITAN/pugu_puguhuaien.png": {
            "scale": 1.03,
            "offsetX": 3,
            "offsetY": -21
        },
        "/assets/CENTRAL/yao_liuyuan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/zangke_xielongyu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_17.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL_ASIA/xiliao_yelvdashi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/KOREA/xuantu_yuangaisuwen.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/XIANBEI/yizhou_wanyanloushi.png": {
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
        "/assets/NORTHEAST/mohe_wanyanzonghan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEI/xuan_xuda.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEI/wuzhou_limu.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/shixing_houandou.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/WEI/yingzhou_d2_licunxu.png": {
            "scale": 0.87,
            "offsetX": 7,
            "offsetY": 4
        },
        "/assets/XIANBEI/kang_liangshidou.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/shuofang_weiqing.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WEI/dai_d_shijingtang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/tuerhute_wobaxi.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/WEI/shanrong_lanyu.png": {
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
        "/assets/WESTERN/pulei_dougu.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/MONGOL/merkit_boyan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEI/zhongshan_yangaoqing.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL/jiyuan_huluguang.png": {
            "scale": 0.93,
            "offsetX": 9,
            "offsetY": -5
        },
        "/assets/MONGOL/kelie_zhaheganbu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/xijue_ganyanshou.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/BASHU/hezhou_wangjian.png": {
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
        "/assets/WEI/wangyan_wangyan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JIANGNAN/haikou_wangzhi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/JIANGNAN/shenshi_wentianxiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/zhuang_d_washifuren.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL/__闲置__CENTRAL_32.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL/wang_d_liuyu.png": {
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
        "/assets/CENTRAL/kong_d_caogui.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JIANGNAN/gumie_liuyu.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/CENTRAL/cai_lishuo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/agui.png": {
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
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WEI/weihaiwei_sudingfang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_34.png": {
            "scale": 0.96,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/JIANGNAN/guizhou_lidingguo.png": {
            "scale": 0.87,
            "offsetX": 4,
            "offsetY": -1
        },
        "/assets/WESTERN/juandu_peixingjian.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/lingwu_guoziyi.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/hepan_gaoxianzhi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JIANGNAN/chizhou_changyuchun.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/JIANGNAN/fangla_fangla.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/BASHU/luodian_shexiang.png": {
            "scale": 0.77,
            "offsetX": 1,
            "offsetY": -4
        },
        "/assets/BASHU/nanzhao_geluofeng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/dian_cuanchongdao.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/PERSIAN/guzgan_abuhalisi.png": {
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
        "/assets/PERSIAN/jiazini_mahamaode.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/nongzhigao_huangshimi.png": {
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
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/daming/__闲置__daming_13.png": {
            "scale": 0.98,
            "offsetX": 9,
            "offsetY": -38
        },
        "/assets/WEI/yi_yuqian.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": 6
        },
        "/assets/CENTRAL/jiaodong_tiandan.png": {
            "scale": 0.92,
            "offsetX": 32,
            "offsetY": -49
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_27.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/MONGOL/jalair_muhuali.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/XIANBEI/baiyang_mengtian.png": {
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
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/BURMESE/pagan_anulvtuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/MONGOL/zhasaketu_zhasakesubadi.png": {
            "scale": 0.95,
            "offsetX": 9,
            "offsetY": 21
        },
        "/assets/KHITAN/duomi_lunkongre.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/galangdiba_wangqindundui.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/mingzheng_jianzandechang.png": {
            "scale": 0.78,
            "offsetX": 6,
            "offsetY": 8
        },
        "/assets/BASHU/hani_d_zhebi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/XIANBEI/zu_d_yuanchonghuan.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/zhaosong/__闲置__zhaosong_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/KHITAN/yanzhou_zhongshiheng.png": {
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
        "/assets/CENTRAL/huan_zhongshidao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTHEAST/dongdan_yelvbei.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/houliao_yelvliuge.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/XIANBEI/yel_yelvxiuge.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL/__闲置__CENTRAL_36.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/tongma_taishici.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_22.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/huangwang_huangchao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/dianguo_zhuangqiao.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/PURU/jibin_jianisejia.png": {
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
        "/assets/JIANGNAN/ketagalan_huangqingyun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/CENTRAL_ASIA/chuyue_shatuonasu.png": {
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
        "/assets/JIANGNAN/liren_funanshe.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/leizhou_limao.png": {
            "scale": 1.02,
            "offsetX": 30,
            "offsetY": -9
        },
        "/assets/JIANGNAN/xinjiang_maji.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/qingqiang_jiangwei.png": {
            "scale": 1,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/BASHU/ailao_leilao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_20.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/VIETNAMESE/zhancheng_zhimin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/KHITAN/gaoliang_geshuhan.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_26.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/CENTRAL/yuan_cj_d_lishuo.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL/liang_d_zhangxun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BASHU/weizhou_weigao.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/dayu_wangshouren.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/manqing/__闲置__NORTHEAST_30.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -62
        },
        "/assets/WEI/jilizhou_chengmingzhen.png": {
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
        "/assets/JIANGNAN/qi_d_qijiguang.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/daming/__闲置__JIANGNAN_20.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WEI/yang_aner_yangan.png": {
            "scale": 1.21,
            "offsetX": 10,
            "offsetY": -18
        },
        "/assets/MONGOL/rouran_shelun.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JIANGNAN/nanyue_zhaotuo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/CENTRAL/yong_lujili.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_98.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/dzungar_galedanceling.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/__闲置__CENTRAL_39.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/KHITAN/cangsong_machao.png": {
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
        "/assets/JIANGNAN/ming_zheng_zhengchenggong.png": {
            "scale": 0.99,
            "offsetX": 10,
            "offsetY": -2
        },
        "/assets/WEI/wei_wuqi.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/jin_xianzhen.png": {
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
        "/assets/CENTRAL/xiqin_wanyanchenheshang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/choros_tuohuan.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JIANGNAN/guangxin_shixie.png": {
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
        "/assets/MONGOL/manghuti_weidaer.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/MONGOL/chenli_d_zuoxianwang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/XIANBEI/weiming_weiminglinggong.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/MONGOL/mengwu_hebulehan.png": {
            "scale": 1.05,
            "offsetX": -18,
            "offsetY": -28
        },
        "/assets/zhaosong/__闲置__zhaosong_25.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL/didao_wangshao.png": {
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
        "/assets/CENTRAL/lai_wangshifan.png": {
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
        "/assets/TIBET/xiaobolu_meijinmang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -53
        },
        "/assets/xianqin/__闲置__xianqin_37.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/quanrong_yiquhai.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/CENTRAL/chimei_fanchong.png": {
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
        "/assets/NORTHEAST/maomingan_suoetu.png": {
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
        "/assets/BURMESE/xingwei_hanba.png": {
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
        "/assets/WEI/you_gengyan.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/BASHU/shengmiao_baoli.png": {
            "scale": 0.94,
            "offsetX": 5,
            "offsetY": -2
        },
        "/assets/KHITAN/yangguan_lihao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/__闲置__CENTRAL_44.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -20
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
        "/assets/CENTRAL_ASIA/xiemian_xiemianwang.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/ORIE/xierwan_farukusha.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/ORIE/dedan_dedanwang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/ORIE/beileinisi_tuolemiershi.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/ORIE/nabatai_aleitasi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/PERSIAN/ansxi_aershake.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/ORIE/guyashu_shamushi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/ORIE/jialatai_deaota.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GREECE/aiaoniya_alisita.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/PERSIAN/kesa_bulan.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/ORIE/aiji_lameisisi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/PERSIAN/safawei_aisimaier.png": {
            "scale": 1.03,
            "offsetX": 7,
            "offsetY": 2
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 1.07,
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
        "/assets/PERSIAN/saerbadaer_lazhake.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_29.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/PERSIAN/aqimeinide_daliushi.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/PERSIAN/safawei_d_abasi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BYZANTINE/bendou_alikesai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/ORIE/heti_muwatali.png": {
            "scale": 1.29,
            "offsetX": -9,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_21.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/ORIE/fulijiya_maidasi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GREECE/ldiya_keluoyisi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/GREECE/pajiama_oumainisi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BYZANTINE/bitiniya_diaoduoer.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_55.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/ORIE/luomu_jilijie.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/ORIE/sailiugu_antiaoke.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/ORIE/womaya_muaweiye.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_42.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/ORIE/xibolai_dawei.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/ORIE/tuolemi_tuolemi.png": {
            "scale": 1.55,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_39.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/ORIE/jialedi_nibujianisa.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/ORIE/paermila_zhinuobiya.png": {
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
        "/assets/ORIE/abasi_mansuer.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": 25
        },
        "/assets/ORIE/xikesuosi_salidi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JAPAN/__闲置__JAPAN_33.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/ORIE/yashu_saergong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/xianqin/__闲置__xianqin_39.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/ORIE/youfaladi_yehaiya.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": 30
        },
        "/assets/CENTRAL/__闲置__CENTRAL_57.png": {
            "scale": 0.95,
            "offsetX": 2,
            "offsetY": 7
        },
        "/assets/ORIE/qiliqiya_pangpei.png": {
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
        "/assets/ORIE/gulaishi_aibu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 25
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
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_17.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -3
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
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_39.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_38.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 38
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
        "/assets/ORIE/ayoubu_salaheding.png": {
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
        "/assets/WEST_ASIA/__闲置__CENTRAL_ASIA_50.png": {
            "scale": 1.03,
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
        "/assets/PERSIAN/xisi_safaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_96.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/PERSIAN/delan_sulun.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/PURU/najie_minande.png": {
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
        "/assets/PERSIAN/kumisi_aerpu.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_119.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/PERSIAN/ribale_faheerdaolai.png": {
            "scale": 1.07,
            "offsetX": -2,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_107.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/PERSIAN/yilihanguo_d_hezan.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__闲置__STEPPE_52.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/PERSIAN/asaibaijiang_xuliewu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/ARMENIANS/wulaertu_ajishenti.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GEORGIANS/gelujiya_tamaer.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/GEORGIANS/keerjisi_bagelate.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/PERSIAN/midi_daiaokaisi.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/XIANBEI/wuyuan_d_chengui.png": {
            "scale": 0.99,
            "offsetX": 1,
            "offsetY": -7
        },
        "/assets/liuhan/__闲置__liuhan_22.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/JIANGNAN/wuxi_shamoke.png": {
            "scale": 1.07,
            "offsetX": 16,
            "offsetY": 13
        },
        "/assets/JIANGNAN/daozhou_yangzaixing.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/MONGOL/xiajiasi_are.png": {
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
        "/assets/MONGOL/jiluo_d_douxian.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/MONGOL/kereyid_wanghan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/XIANBEI/xiongnu_maodun.png": {
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
        "/assets/XIANBEI/wuhuan_tadun.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WESTERN/loulan_suojie.png": {
            "scale": 1,
            "offsetX": -1,
            "offsetY": -12
        },
        "/assets/WESTERN/__闲置__WESTERN_38.png": {
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
        "/assets/JIANGNAN/qianzhong_wubayue.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/kuai_kuaiyue.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JIANGNAN/xiou_yixusong.png": {
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
        "/assets/TIBET/khoshut_gushihan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/spurgyal_dariniansai.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/TIBET/xiangxiong_limixia.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/miaomin_shiliudeng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/BASHU/tian_sizhou_tianyougong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/VIETNAMESE/guangping_ruanwenzhang.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/JIANGNAN/paiyao_huangguasi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/yelang_duotong.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/hor_chisang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JIANGNAN/geng_gengjingzhong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/MALAY/paiwan_alugu.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/KHMER/lancang_faang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/dengmaoqi_dengmaoqi.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/VIETNAMESE/nguyen_guangnan_ruanfuying.png": {
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
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/XIANBEI/yeli_yeliwangrong.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL/yun_wuli.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/VIETNAMESE/muong_shencongyue.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/JAPAN/ayinu_hushemoquan.png": {
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
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 8
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
        "/assets/CENTRAL_ASIA/wusun_liejiaomi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_59.png": {
            "scale": 0.76,
            "offsetX": 2,
            "offsetY": -25
        },
        "/assets/XIANBEI/dada_ming_dayanhan.png": {
            "scale": 0.95,
            "offsetX": 2,
            "offsetY": 42
        },
        "/assets/KHITAN/juqu_d_juqumengxun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/__闲置__TIBET_02.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/BASHU/qiuchi_yangnandang.png": {
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
        "/assets/PERSIAN/aba_shapuer.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/guishuang_qiujiuque.png": {
            "scale": 1.19,
            "offsetX": -2,
            "offsetY": -6
        },
        "/assets/PERSIAN/muer_mujier.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/PERSIAN/yilihanguo_yisimeier.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JIANGNAN/xian_d_xianfuren.png": {
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
        "/assets/KHMER/suke_langanheng.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/HEXI/__闲置__HEXI_17.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/KHITAN/qifu_d_qifuchipan.png": {
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
        "/assets/XIANBEI/zhuxie_zhuxiechixin.png": {
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
        "/assets/JAPAN/gen_koshamain.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/GERMANIC/aersasi_youlian.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LATIN/__多余__LATIN_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/ROMA/gen_julius_caesar.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/LATIN/__多余__LATIN_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/SPANISH/gen_alfonso_ix.png": {
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
        "/assets/BYZANTINE/gen_aspurgus.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/SICILIANS/gen_frederic_ii.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/FRANKS/gen_ansgar.png": {
            "scale": 1.42,
            "offsetX": -1,
            "offsetY": 33
        },
        "/assets/SPARTANS/gen_leonidas.png": {
            "scale": 1.17,
            "offsetX": 7,
            "offsetY": -2
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
        "/assets/PORTUGUESE/gen_afonso_henriques.png": {
            "scale": 1,
            "offsetX": 4,
            "offsetY": 2
        },
        "/assets/GERMANIC/meikelunbao_hengliboluo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/CELTS/gen_domhnall.png": {
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
        "/assets/SPANISH/gen_fernando_iii.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/SPANISH/gen_el_cid.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LATIN/__多余__LATIN_01.png": {
            "scale": 1.44,
            "offsetX": 0,
            "offsetY": 58
        },
        "/assets/SICILIANS/gen_roger_i.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SICILIANS/gen_eleanor.png": {
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
        "/assets/GERMANIC/gen_albert_riga.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BULGARIANS/gen_krum.png": {
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
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BERBER/zhayan_yalimoluo.png": {
            "scale": 1.03,
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
        "/assets/GREECE/gen_magas.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/habusibao_makeximi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 31
        },
        "/assets/LATIN/gen_constantine_great.png": {
            "scale": 1.19,
            "offsetX": 2,
            "offsetY": 29
        },
        "/assets/SAXONS/gen_offa_mercia.png": {
            "scale": 1.2,
            "offsetX": 6,
            "offsetY": 15
        },
        "/assets/FRANKS/gen_robert_ii.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GERMANIC/__闲置__GERMANIC_16.png": {
            "scale": 1.0533,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LITHUANIANS/gen_algirdas.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/GERMANIC/nidelan_weilian.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/VARANGIANS/gen_olaf_skotkonung.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/POLES/gen_casimir_iv.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/FRANKS/gen_charles_martel.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/FRANKS/gen_raymond_v.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/FRANKS/gen_gilles_de_rais.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SICILIANS/gen_city_syracuse.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 16
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
        "/assets/SPANISH/gen_muhammad_i.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LATIN/liguliya_andelieya.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/THRACIAN/gen_simeon_great.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/SLAVIC/saierweiya_sidifendushang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/LITHUANIANS/gen_gastold.png": {
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
        "/assets/DANES/gen_eric_bloodaxe.png": {
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
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 39
        },
        "/assets/FRANKS/gen_charlemagne.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BOHEMIANS/gen_jan_zizka.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GERMANIC/__闲置__GERMANIC_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 38
        },
        "/assets/FRANKS/gen_charles_vii.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/SAXONS/gen_alfred_great.png": {
            "scale": 0.97,
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
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/FRANKS/gen_clovis_i.png": {
            "scale": 1.04,
            "offsetX": 5,
            "offsetY": 12
        },
        "/assets/CELTS/gen_william_wallace.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/FRANKS/gen_black_prince.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/FRANKS/gen_raymond_iv.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LATIN/__闲置__LATIN_21.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/GOTHS/gen_theodoric_great.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GOTHS/gen_alfonso_vi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SPANISH/gen_abd_al_rahman_iii.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/SPANISH/gen_james_i_aragon.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/BRITONS/gen_alain_i.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 10
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
        "/assets/BOHEMIANS/gen_mojmir_i.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/daniebo_luomushenlafu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BOHEMIANS/gen_swatopluk.png": {
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
        "/assets/CENTRAL_ASIA/gen_batu.png": {
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
        "/assets/CENTRAL_ASIA/gen_ulugh_muhammad.png": {
            "scale": 1.26,
            "offsetX": -6,
            "offsetY": 18
        },
        "/assets/LITHUANIANS/gen_vytautas_great.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/tiaodun_qishi_wuerlixi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LITHUANIANS/gen_gediminas.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SLAVIC/peilieya_gongguo_monuomahe.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/GERMANIC/gen_prettenberg.png": {
            "scale": 1.13,
            "offsetX": 6,
            "offsetY": 14
        },
        "/assets/SLAVIC/__闲置__SLAVIC_08.png": {
            "scale": 1.31,
            "offsetX": 7,
            "offsetY": 17
        },
        "/assets/LITHUANIANS/gen_vyacheslav_tartu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SLAVIC/gen_basarab_i.png": {
            "scale": 1.22,
            "offsetX": 16,
            "offsetY": 8
        },
        "/assets/SLAVIC/deniesite_muhanmodegeli.png": {
            "scale": 1.26,
            "offsetX": 1,
            "offsetY": 14
        },
        "/assets/CENTRAL_ASIA/gen_astrakhan_khan.png": {
            "scale": 1.25,
            "offsetX": 9,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/gen_onas_khan.png": {
            "scale": 1.34,
            "offsetX": 5,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/gen_karasakal.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/xierhe_saerjue.png": {
            "scale": 1.23,
            "offsetX": 14,
            "offsetY": -7
        },
        "/assets/SLAVIC/xideweina_buliesilafu.png": {
            "scale": 1.1,
            "offsetX": -5,
            "offsetY": 4
        },
        "/assets/LATIN/__闲置__LATIN_24.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LATIN/__闲置__LATIN_19.png": {
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
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/FRANKS/shengdian_qishi_demolai.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LATIN/maerta_qishi_walaite.png": {
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
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_120.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
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
        "/assets/POLES/gen_przemysl_ii.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/SLAVIC/siluoboda_duonieci.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/LATIN/__闲置__LATIN_23.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BENGALIS/boluo_damoboluo.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/fanyanna_xieer.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/MUGHAL/deli_alawuding.png": {
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
        "/assets/PURU/kongque_zhantuoluo.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/PURU/mojietuo_pinbisuoluo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/MUGHAL/mowoer_akeba.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/INDIA/xike_lanjite.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BENGALIS/sumo_sumowang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/FRANKS/gen_villaret.png": {
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
        "/assets/KHITAN/lanzhou_zhaochongguo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/liuhan/__闲置__liuhan_26.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/KHITAN/xiyuduhu_banchao.png": {
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
        "/assets/KHITAN/dafeichuan_nuohebo.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_110.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CUMAN/qincha_baqiman.png": {
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
        "/assets/STEPPE/__闲置__STEPPE_63.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WESTERN/kangju_chebishi.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 7
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
        "/assets/KHMER/funan_fanman.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -2
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
        "/assets/MUGHAL/babuer_babuer.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/DANES/danmai_abusalong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/ruidian_si_biergeyaer.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/SPANISH/kasidiliya_afangsuoshiyi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/PORTUGUESE/duluo_sangqiao.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/ORIE/teluoyi_heketuoer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/ORIE/alabo_qiyade.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_28.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/BURMESE/mon_monuhe.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 3
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
        "/assets/STEPPE/__闲置__STEPPE_65.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/MONGOL/menggu_d_chengjisihan.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -29
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
        "/assets/WESTERN/kepantuo_dulimi.png": {
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
        "/assets/WEI/liangshidu_longjia.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/NORTHEAST/ewenki_gentemuer.png": {
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
        "/assets/XIANBEI/dingxiang_d_lijing.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/__闲置__LINGNAN_05.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -6
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
        "/assets/WESTERN/dayuzi_yinalechihei.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WEI/yansui_wangwei.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/SLAVIC/__闲置__SLAVIC_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/SLAVIC/shaiyue_aerpade.png": {
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
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL_ASIA/yidier_yidiewang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/__闲置__STEPPE_73.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/salai_salaiwang.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/__闲置__STEPPE_74.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MONGOL/huihu_dunmohedagan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/__闲置__STEPPE_75.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/ogodei_chuoermahan.png": {
            "scale": 1.08,
            "offsetX": 22,
            "offsetY": -6
        },
        "/assets/MONGOL/xueyantuo_yinan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/daming/__闲置__daming_16.png": {
            "scale": 0.94,
            "offsetX": 19,
            "offsetY": 37
        },
        "/assets/XIANBEI/dongshengwei_wangyue.png": {
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
        "/assets/SLAVIC/gen_nikola_zrinski.png": {
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
        "/assets/MONGOL/tuva_qinggunzabu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_79.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/ashide_ashidejieli.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/__闲置__STEPPE_80.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/ashina_ashinayandou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_81.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL_ASIA/duolu_ashinahelu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_82.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MONGOL/tujue_ashinatumen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_31.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/KHMER/chenla_duyebamo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
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
        "/assets/BYZANTINE/gen_basil_ii.png": {
            "scale": 1.02,
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
        "/assets/JIANGNAN/panyao_pandaxiao.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GREECE/yipilusi_piluoshi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/BULGARIANS/baojialiya_aseni.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GREECE/talanduo_aqita.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/LATIN/safuyi_ameidi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/GREECE/bosi_puluosi_liukong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/FRANKS/saipulusi_juyi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/__闲置__LATIN_15.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 24
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
        "/assets/KHITAN/guiyi_caoyijin.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/TURKS/osman_mehmed_ii.png": {
            "scale": 1.12,
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
        "/assets/BASHU/qian_songjingyang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/__闲置__LINGNAN_21.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/BASHU/nanzhong_mazhong.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_36.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_37.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BURMESE/konbaung_yongjiya.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -33
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
        "/assets/XIANBEI/helian_helianbobo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/STEPPE/__闲置__STEPPE_83.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEI/shizhou_liucong.png": {
            "scale": 1.09,
            "offsetX": 10,
            "offsetY": -10
        },
        "/assets/liuhan/__闲置__liuhan_29.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/KHITAN/guangwu_xinwuxian.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/liuhan/__闲置__liuhan_30.png": {
            "scale": 1.02,
            "offsetX": 9,
            "offsetY": -30
        },
        "/assets/KHITAN/ganzhou_dourong.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": -29
        },
        "/assets/CENTRAL/han_d_liubang.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/xibo_d_tubote.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_35.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BURMESE/ava_minye_kyawswa.png": {
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
        },
        "/assets/AMERICA/aztec_kuaotemoke.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MAYANS/gen_jasawchan.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MAPUCHE/gen_lautaro.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MUISCA/gen_saguamanchica.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/TUPI/gen_arariboia.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -54
        },
        "/assets/AFRICA/manding_songdiyata.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/MALAY/malacca_bailimisula.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/GURJARAS/gen_mihirabhoja.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SPANISH/xibanya_pisaluo.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/INDIA/__闲置__india_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/INDIA/__多余__INDIA_01.png": {
            "scale": 1.03,
            "offsetX": -7,
            "offsetY": -14
        },
        "/assets/INDIA/__多余__INDIA_02.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/INDIA/__闲置__INDIA_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/ETHIOPIANS/gen_ezana.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/BENGALIS/meitai_hagenba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_111.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_25.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_27.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_01.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/ARMENIANS/wulaertu_guo_saerdu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/STEPPE/__闲置__STEPPE_78.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/__闲置__STEPPE_84.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/STEPPE/__多余__STEPPE_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/MAGYAR/xiongyati_yannuoshi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/GERMANIC/__多余__GERMANIC_02.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/GERMANIC/pomeilaniya_bojisilafu.png": {
            "scale": 1.25,
            "offsetX": 12,
            "offsetY": 29
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_02.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SASANIAN/sashan_aerdaxier.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/__多余__SLAVIC_01.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/SLAVIC/xieerpuhuofu_gongguo_yongzhefulaji.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/__多余__STEPPE_01.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/HUNS/xiongren_atila.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/GERMANIC/__多余__GERMANIC_01.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/BERBER/__多余__BERBER_01.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/BERBER/talike_talike.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/AMERICA/__闲置__AMERICA_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/AMERICA/__多余__AMERICA_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/AMERICA/__多余__AMERICA_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/AMERICA/__多余__AMERICA_03.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/AMERICA/__多余__AMERICA_04.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/AMERICA/__多余__AMERICA_05.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/AMERICA/__多余__AMERICA_06.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/AMERICA/__多余__AMERICA_07.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/AMERICA/__闲置__AMERICA_04.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/AMERICA/__闲置__AMERICA_03.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/AMERICA/__闲置__AMERICA_02.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/AFRICA/gen_bentejui.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/PORTUGUESE/gen_noli.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/PORTUGUESE/gen_tome_sousa.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/PORTUGUESE/gen_cipriano_figueiredo.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/INDIA/4e400b15-4ab8-459d-86cd-dba94bdb809d.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/INDIA/__多余__INDIA_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/INDIA/__多余__INDIA_04.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/INDIA/__多余__INDIA_05.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/LATIN/__多余__LATIN_04.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/__闲置__LATIN_20.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/AFRICA/__多余__AFRICA_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/PURU/jiaye_punafamo.png": {
            "scale": 1.15,
            "offsetX": -12,
            "offsetY": 5
        },
        "/assets/PURU/pidisha_pidisha.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/ORIE/wuer_wuernamu.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_03.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/ROMA/disidelusi_disidelusi.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/AFRICA/jienei_jienei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/GERMANIC/__多余__GERMANIC_03.png": {
            "scale": 1.15,
            "offsetX": -6,
            "offsetY": 11
        },
        "/assets/GREECE/fujisi_fujiweng.png": {
            "scale": 1.21,
            "offsetX": -17,
            "offsetY": 53
        },
        "/assets/INDIA/adile_adilesha.png": {
            "scale": 1.01,
            "offsetX": -7,
            "offsetY": 12
        },
        "/assets/INDIA/kanata_lamalaya.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/INDIA/aolisha_anatabamo.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/AFRICA/__多余__AFRICA_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/AFRICA/kushi_amanilunnasi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/DIANQIAN/__多余__DIANQIAN_01.png": {
            "scale": 1.05,
            "offsetX": -3,
            "offsetY": 4
        },
        "/assets/KHMER/liaozu_saitatila.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/GERMANIC/__多余__GERMANIC_04.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_28.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WEST_ASIA/__多余__WEST_ASIA_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/FRANKS/gen_baodewen_iv.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/SLAVIC/__多余__SLAVIC_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SLAVIC/__闲置__SLAVIC_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/INCA/aimala_katali.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -1
        },
        "/assets/AMERICA/54a7b0d4-53b4-436a-82e5-f691606c836d.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/TUPI/gualani_nicolas.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/AMERICA/284a4093-ed85-4ceb-958c-76574fb2fb62.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/MUISCA/yilaka_tundama.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/TURKS/lumiliya_lalashahin.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/f6b4e1a8-c6d2-4a83-893c-06778ad9e37f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/BENGALIS/varendra_devapala.png": {
            "scale": 1.13,
            "offsetX": -7,
            "offsetY": -16
        },
        "/assets/MALAY/gen_panangkaran.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/AFRICA/__多余__AFRICA_03.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/ORIE/samaila_muataisuimu.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/GERMANIC/pelianci_hengliershi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CELTS/mangsite_bulaienbolu.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/GERMANIC/bulabante_yuehanyishi.png": {
            "scale": 1.15,
            "offsetX": -6,
            "offsetY": 11
        },
        "/assets/SPANISH/jialebi_brasilesuo.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SLAVIC/eluosi_diguo_peter.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/ETHIOPIANS/zhagewei_gebulei.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/AFRICA/adal_gelani.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/MALAY/ternate_babula.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/MALAY/sulu_paduka.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/SPANISH/xishudongyin_lijiasipi.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/PURU/sengjialuo_dutugamo.png": {
            "scale": 1.02,
            "offsetX": 7,
            "offsetY": -28
        },
        "/assets/PORTUGUESE/puxiangyindu_albukeerke.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SPANISH/xingelana_dawila.png": {
            "scale": 0.99,
            "offsetX": 13,
            "offsetY": -29
        },
        "/assets/SPANISH/xiyindu_batuoluome.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GURJARAS/suomunate_kumalapala.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/zhaosong/__闲置__zhaosong_28.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/WEI/changshan_yangyanzhao.png": {
            "scale": 1.06,
            "offsetX": 12,
            "offsetY": -19
        },
        "/assets/TIBET/__闲置__TIBET_04.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/TIBET/tsangpa_pengcuonanjie.png": {
            "scale": 1.07,
            "offsetX": 11,
            "offsetY": -1
        },
        "/assets/PORTUGUESE/gen_henry_navigator.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/PURU/gen_bolusi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_113.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL_ASIA/anushidgin_yile.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_114.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/PERSIAN/dulan_d_aihamaide.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LATIN/__闲置__LATIN_18.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BERBER/gen_hamilcar.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LATIN/gen_hamilcar.png": {
            "scale": 1.09,
            "offsetX": -1,
            "offsetY": -2
        },
        "/assets/MACEDONIAN/gen_alexander_great.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/PERSIAN/xiaofulijiya_aerxitis.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/GERMANIC/__闲置__GERMANIC_19.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CELTS/gen_onuist_i.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GERMANIC/gen_onuist_i.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/FRANKS/gen_kaernute_kotuatousi.png": {
            "scale": 1.19,
            "offsetX": -7,
            "offsetY": 30
        },
        "/assets/BRITONS/keernuwaye_geladelong.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/GREEK/__闲置__LATIN_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/GREEK/__闲置__LATIN_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/GREEK/__多余__GREEK_01.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/GREEK/__多余__GREEK_02.png": {
            "scale": 1.21,
            "offsetX": -17,
            "offsetY": 53
        },
        "/assets/THRACIAN/aodesuosi_aodesuosi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/GREEK/__多余__GREEK_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GREEK/__闲置__GREEK_01.png": {
            "scale": 1.44,
            "offsetX": 0,
            "offsetY": 58
        },
        "/assets/SLAVIC/mengtainiya_radu_iii.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/GREEK/__多余__GREEK_04.png": {
            "scale": 1.17,
            "offsetX": 7,
            "offsetY": -2
        },
        "/assets/GREEK/__多余__GREEK_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/GREEK/__多余__GREEK_06.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/GREEK/__闲置__GREEK_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/GREEK/__多余__GREEK_07.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/GREECE/yilisi_yifeituosi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GREEK/__多余__GREEK_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GREEK/__多余__GREEK_09.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/GREECE/gen_chabrias.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/THRACIAN/gen_seuthes_iii.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SPANISH/__多余__SPANISH_06.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/SPANISH/__多余__SPANISH_07.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/SPANISH/__多余__SPANISH_03.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/SPANISH/__多余__SPANISH_08.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/SPANISH/foluolida_meinendeshi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SPANISH/__多余__SPANISH_01.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SPANISH/__多余__SPANISH_02.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SPANISH/__多余__SPANISH_09.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SPANISH/__多余__SPANISH_04.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/SPANISH/__多余__SPANISH_05.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SPANISH/__多余__SPANISH_10.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/SPANISH/__多余__SPANISH_11.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SPANISH/trastamara_feidinanershi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/PORTUGUESE/gen_joao_i.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/PERSIAN/__多余__PERSIAN_07.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/PERSIAN/__多余__PERSIAN_01.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/PERSIAN/__多余__PERSIAN_02.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/PERSIAN/__多余__PERSIAN_08.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/PERSIAN/__多余__PERSIAN_03.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/PERSIAN/__多余__PERSIAN_06.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/PERSIAN/__多余__PERSIAN_10.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/PERSIAN/__多余__PERSIAN_11.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/PERSIAN/__多余__PERSIAN_04.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/PERSIAN/__多余__PERSIAN_05.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/PERSIAN/__多余__PERSIAN_12.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/PERSIAN/__多余__PERSIAN_13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/PERSIAN/__多余__PERSIAN_14.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/PERSIAN/__多余__PERSIAN_15.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/PERSIAN/yisatisi_falukezhade.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/PERSIAN/kerman_bam_yagebu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MAYANS/gen_chan_chak.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/AFRICA/__闲置__AFRICA_02.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/AFRICA/__闲置__AFRICA_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_01.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_02.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_03.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_04.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_05.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_06.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_07.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/BURMESE/luchuan_sirenfa.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_09.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_10.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_11.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_12.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/MALAY/gen_adityawarman.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/INDIA/gen_ibrahim_qutb.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WEST_ASIA/__多余__WEST_ASIA_02.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": 25
        },
        "/assets/GEORGIANS/gen_sargis_jaqeli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/FRANKS/gen_francis_i.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BULGARIANS/gen_ivan_sratsimir.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/AFRICA/a8086659-75b7-434b-b8ec-4bf3dd259ff9.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/ETHIOPIANS/gen_fasilides.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/SLAVIC/__闲置__SLAVIC_05.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/POLES/gen_casimir_great.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/INCA/gen_pachacuti.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/POLES/gen_boleslaw_brave.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/INCA/gen_topa_inca.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/GREECE/gen_epaminondas.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GREEK/gen_epaminondas.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/GREEK/__多余__GREEK_15.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/ATHENIANS/gen_themistocles.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_58.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/ORIE/sumeier_zhajixi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_59.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/PERSIAN/huluo_jiyasiding.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BENGALIS/chatigangren_wumeide.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BENGALIS/gen_bir_hambir.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/WEI/ranwei_d_ranmin.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BURGUNDIANS/bogendi_chali.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SOUTHEAST_ASIA/__闲置__MALAY_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CELTS/tuomengde_aobulaien.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_116.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/SLAVIC/__多余__SLAVIC_04.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/SLAVIC/__闲置__SLAVIC_06.png": {
            "scale": 1.21,
            "offsetX": 17,
            "offsetY": 15
        },
        "/assets/POLES/bolan_suobiesiji.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/GERMANIC/__闲置__GERMANIC_17.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/GERMANIC/gen_henry_v.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/STEPPE/__闲置__STEPPE_89.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/SAXONS/gen_henry_v.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_117.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/an_xibanni.png": {
            "scale": 1.15,
            "offsetX": 6,
            "offsetY": -17
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_30.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/JIANGNAN/min_wangshenzhi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/SOUTHEAST_ASIA/__多余__SOUTHEAST_ASIA_13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/MALAY/sanfoqi_dapunta.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/__闲置__STEPPE_87.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/STEPPE/__闲置__STEPPE_88.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/STEPPE/__多余__STEPPE_04.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/GREECE/sijitai_ateas.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/ETHIOPIANS/gen_yodit.png": {
            "scale": 1.42,
            "offsetX": -18,
            "offsetY": 18
        },
        "/assets/AFRICA/suosuo_sumangulu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/INDIA/taimier_lajialamu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/MUGHAL/gen_man_singh_tomar.png": {
            "scale": 1.06,
            "offsetX": 3,
            "offsetY": -5
        },
        "/assets/INDIA/zhelouqi_pulitewei.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/INDIA/zhuluo_lajialajiayishi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/FRANKS/gen_bernard_armagnac.png": {
            "scale": 1.06,
            "offsetX": -12,
            "offsetY": -5
        },
        "/assets/LATIN/__闲置__LATIN_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/FRANKS/gen_joanofarc.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/SICILIANS/gen_robert_guiscard.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/LATIN/zeta_bolangjiabin.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/SPANISH/gen_urdaneta.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/SAXONS/gen_stuyvesant.png": {
            "scale": 1.04,
            "offsetX": 3,
            "offsetY": 0
        },
        "/assets/FRANKS/gen_champlain.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTH/__闲置__daming_11.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/panjun/baodi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/GREECE/gen_datis.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/POLES/gen_jadwiga.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/LITHUANIANS/gen_kestutis.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/MAPUCHE/gen_casimiro_bigua.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/TUPI/gen_cunhambebe.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/INCA/gen_cuchacique.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/INCA/gen_minchancaman.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/MUISCA/gen_pacanchiq.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/MAPUCHE/gen_galvarino.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/MAPUCHE/gen_guacolda.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/VIETNAMESE/gen_dinhle.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/MALAY/gen_sang_nila_utama.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BURMESE/gen_maha_thiha_thura.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/STEPPE/__闲置__STEPPE_91.png": {
            "scale": 1.05,
            "offsetX": 1,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/gen_kuchlug.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/SLAVIC/gen_girgen.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/__闲置__WESTERN_40.png": {
            "scale": 0.77,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WESTERN/shache_xian_suoche_shachexian.png": {
            "scale": 1.11,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/WESTERN/__多余__WESTERN_01.png": {
            "scale": 1.11,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/WESTERN/shache_shachexian.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/GREECE/gen_artemisia.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/ATHENIANS/gen_lysander.png": {
            "scale": 1.38,
            "offsetX": -2,
            "offsetY": 43
        },
        "/assets/SLAVIC/duobuluojia_yiwaiyiluo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/SLAVIC/image.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/BYZANTINE/jialiboli_kaluoyang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WEST_ASIA/daliushi_iii.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_60.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/PERSIAN/daliushi_iii.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/daliushi_iii.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/ORIE/kanan_azemier.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_61.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/ORIE/feilisidin_batisi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/PERSIAN/aqimeinide_aertabazanuosi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/ORIE/gen_thoros.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/STEPPE/__闲置__STEPPE_92.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/STEPPE/__闲置__STEPPE_93.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/MONGOL/hongirad_dexuechan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/ORIE/gen_cleitus.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/ATHENIANS/gen_brasidas.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/TURKS/gen_osman_i.png": {
            "scale": 1.18,
            "offsetX": -26,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_118.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/zhaowu_timuermieli.png": {
            "scale": 0.96,
            "offsetX": 11,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 0.94,
            "offsetX": 19,
            "offsetY": -10
        },
        "/assets/WESTERN/gen_qutlugh.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_31.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/JIANGNAN/qiufu_qiufu.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/WEI/linhu_mafang.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_43.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_44.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_42.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/NORTH/__闲置__NORTH_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/jianzhou_nvzhen_limanzhu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/GREECE/sijitai_satraces.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/STEPPE/__闲置__STEPPE_94.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/MONGOL/chechen_chechenhanshuolei.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/chechen_chechenhanshuolei.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JAPAN/fujiwara_tengyuanxiuheng.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/genji_yuanlaichao.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/ATHENIANS/gen_aristides.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/__闲置__CENTRAL_65.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/zhengzhou_chenqingzhi.png": {
            "scale": 1.21,
            "offsetX": -7,
            "offsetY": 0
        },
        "/assets/STEPPE/__闲置__STEPPE_95.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/XIANBEI/donghu_tuiyin.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/PERSIAN/maer_d_bahelamuchubin.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/SASANIAN/zhageluosi_guanjiang.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/PERSIAN/ailan_shuteluke.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/THRACIAN/dasaleiti_kleitos.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/THRACIAN/jite_shouling.png": {
            "scale": 1.1,
            "offsetX": -6,
            "offsetY": 8
        },
        "/assets/GREECE/dibisi_phoinix.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/GREECE/yiaoniya_hegesistratus.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/GREECE/halikanasu_memnon.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/PERSIAN/__闲置__PERSIAN_01.png": {
            "scale": 1.1,
            "offsetX": -17,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/suogediyana_alimazeshi.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/PURU/aswaka_cleophis.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/PURU/aornos_aphrikes.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/PURU/malli_malavapala.png": {
            "scale": 1.08,
            "offsetX": -3,
            "offsetY": 16
        },
        "/assets/CENTRAL/caoren.png": {
            "scale": 1.25,
            "offsetX": -9,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/julushi_kataniesi.png": {
            "scale": 1.29,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_63.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/SASANIAN/lulisitan_shoujiang.png": {
            "scale": 1.16,
            "offsetX": 1,
            "offsetY": -17
        },
        "/assets/INDIA/__闲置__INDIA_04.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/PURU/muertan_naxierding.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/PURU/muxikani_muxikanuosi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/INDIA/pandiya_jiatawaerman.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/PURU/pangzha_halixinge.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/INDIA/shiyuzu_aboluoduoluosi.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/INDIA/xinde_nieakusi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/PURU/xindu_bahelamuhan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/ORIE/ameng_jisi.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/BULGARIANS/duonaobaojia_tzimiskes.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_62.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/ORIE/maidina_halide.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GREECE/hesitiya_yiasong.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/MACEDONIAN/gen_philip_ii.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/GREECE/gen_artaphernes.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/MACEDONIAN/gen_parmenion.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/PERSIAN/kuida_chakar.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BRITONS/gen_edward_longshanks.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CELTS/gen_dafydd.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LATIN/lunbadi_alboin.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/ORIE/kapaduoxiya_sabiktas.png": {
            "scale": 1.14,
            "offsetX": -9,
            "offsetY": -5
        },
        "/assets/MALAY/gen_hurao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/ORIE/emesene_xierkuhe.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/GERMANIC/__闲置__GERMANIC_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/PERSIAN/eerbulushi_beisusi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/sute_sipitaminisi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BURGUNDIANS/gen_john_fearless.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/AFRICA/__闲置__AFRICA_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/LATIN/kelimiya_aobeituosikuaer.png": {
            "scale": 1.28,
            "offsetX": 2,
            "offsetY": 0
        },
        "/assets/CENTRAL/porbazhyn_mouyu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/SLAVIC/eguo_zasekin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/CENTRAL/zhou_jifu.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/__多余__WEST_ASIA_03.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/ORIE/aosiruowen_abujiaer.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/ORIE/bfe2_shalmaneser_iii.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/ORIE/teluoyi_maniya.png": {
            "scale": 1.14,
            "offsetX": -2,
            "offsetY": 28
        },
        "/assets/ORIE/meisuobudamiya_shoujiang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/bfe3_57.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/ORIE/xuliya_shoujiang.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/bfe3_76.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -8
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
