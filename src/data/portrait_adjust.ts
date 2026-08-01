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
            "scale": 0.97,
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
            "scale": 0.96,
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
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/liuhan/han_d_liubang.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": -29
        },
        "/assets/litang/qianzhou_lisheng.png": {
            "scale": 1.03,
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
        "/assets/xianqin/han_baoyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/BASHU/chu_guanyu.png": {
            "scale": 1.06,
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
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/yingqin/qin_simacuo.png": {
            "scale": 1.24,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.2,
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
            "scale": 1.14,
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
            "offsetY": -50
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.04,
            "offsetX": 14,
            "offsetY": 18
        },
        "/assets/CENTRAL/bozhou_d_luzhonglian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 2
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
            "scale": 1.01,
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
        "/assets/LINGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -15
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
            "scale": 0.94,
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
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/manqing/manzhou_d_duoergun.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
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
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/huo_songlaosheng.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/shu_liubei.png": {
            "scale": 0.9,
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
            "scale": 0.98,
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
        "/assets/CENTRAL/tongzhou_yangzhiji.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/xianqin/zhao_lianpo.png": {
            "scale": 0.95,
            "offsetX": 8,
            "offsetY": 5
        },
        "/assets/JAPAN/shimotsuke_yudougongguanggang.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -41
        },
        "/assets/CENTRAL_ASIA/hali_gedaerzi.png": {
            "scale": 0.87,
            "offsetX": 13,
            "offsetY": 28
        },
        "/assets/WESTERN/yuchi_weichiyao.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/yumi_anguo.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -20
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
        "/assets/BASHU/lizhou_d_liaohua.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/HEXI/huizhou_yaosi.png": {
            "scale": 1.04,
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
            "scale": 1.05,
            "offsetX": 4,
            "offsetY": 5
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
            "scale": 0.97,
            "offsetX": -19,
            "offsetY": -15
        },
        "/assets/BASHU/baishui_yanghuai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/bandun_fanmu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/chenzhou_d_zhanghao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 3
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
        "/assets/BASHU/daxi_ming_zhangxianzhong.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BASHU/guo_jixin.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/miao_amishi.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/BASHU/liao_houhongyuan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/BASHU/qianhui_baiyanhu.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/ran_d_ranshouzhong.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 0.97,
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
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -33
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
        "/assets/BASHU/xiang_d_xiangdakun.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/BASHU/yang_bozhou_yangyinglong.png": {
            "scale": 1,
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
        "/assets/BASHU/zuo_d_wufu.png": {
            "scale": 1.21,
            "offsetX": 19,
            "offsetY": 43
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/wuhu_dukake.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/yada_ahexiong.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/yiwu_hanshen.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/shi_clan_moheduotutun.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/qincha_baqiman.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/TIBET/guge_chizhaxichabade.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/kazakh_hasimu.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/kokand_alimukuli.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/tuoming_tuomin.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 30
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
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/faqiang_niechizanpu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/dayuzi_yinalechihei.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WESTERN/pishan_daihu.png": {
            "scale": 0.99,
            "offsetX": 13,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/baha_gaiwamu.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/anushidgin_yile.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/CENTRAL/__闲置__CENTRAL_05.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": 13
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
            "scale": 1.05,
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
            "scale": 1.31,
            "offsetX": -31,
            "offsetY": 53
        },
        "/assets/LINGNAN/202606282316.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/pugan/__��置__pugan_03.png": {
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
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/HEXI/dai_d_tuobashiyijian.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/erzhu_erzhurong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/HEXI/fushi_fuhong.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/HEXI/guiyi_caoyijin.png": {
            "scale": 0.81,
            "offsetX": 10,
            "offsetY": -30
        },
        "/assets/HEXI/helian_helianbobo.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/hunxie_xuziwei.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/juyan_d_liling.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/shache_xian_suoche_shachexian.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/HEXI/xingxingxia_guoxiaoke.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/da_yuan_kuokuotiemuer.png": {
            "scale": 1.19,
            "offsetX": 1,
            "offsetY": -2
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 0.97,
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
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/qiufu_qiufu.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/JIANGNAN/shanyue_sunce.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -26
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
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 12
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
            "offsetY": 14
        },
        "/assets/xianqin/__闲置__xianqin_02.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/dongzu_wumian.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/panjun/__闲置__PANJUN_05.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/guangzhou_liuyin.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/longwu_huangdaozhou.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/panjun/__闲置__PANJUN_01.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/LINGNAN/miao_qing_yangwanzhe.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/panyao_panhu.png": {
            "scale": 1.03,
            "offsetX": 22,
            "offsetY": 26
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
        "/assets/LINGNAN/yingzhou_liuyan.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/litang/__闲置__litang_05.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/liuhan/suzhou_huoqubing.png": {
            "scale": 1.05,
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
        "/assets/NORTH/__闲置__NORTH_04.png": {
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
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 21
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
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/panjun/__闲置__PANJUN_13.png": {
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
        "/assets/STEPPE/bulat_beiduanchaer.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -26
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
            "scale": 0.81,
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
        "/assets/STEPPE/heisha_d_houlihu.png": {
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
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
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
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/wuzhumuqin_duoerji.png": {
            "scale": 0.96,
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
            "scale": 1.15,
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
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/kala_satuke.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/WESTERN/kepantuo_dulimi.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -15
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
        "/assets/xianqin/__闲置__xianqin_01.png": {
            "scale": 0.75,
            "offsetX": 0,
            "offsetY": -15
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
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/liuhan/chagatai_genggong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 18
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
            "scale": 1.13,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/LINGNAN/__闲置__LINGNAN_04.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL/bozhou_d_yujin.png": {
            "scale": 1.11,
            "offsetX": 7,
            "offsetY": 27
        },
        "/assets/litang/933b26bc-2039-4370-a3d9-52ac5074f9da.png": {
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
            "scale": 1.16,
            "offsetX": -10,
            "offsetY": -7
        },
        "/assets/LINGNAN/image (7).png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
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
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
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
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/DIANQIAN/dali_duansiping.png": {
            "scale": 1.04,
            "offsetX": 10,
            "offsetY": 5
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
            "scale": 0.88,
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
            "scale": 0.93,
            "offsetX": -13,
            "offsetY": 26
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/xianqin/__闲置__xianqin_18.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/HEXI/__闲置__HEXI_07.png": {
            "scale": 0.97,
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
        "/assets/liuhan/li_lx_d_liguang.png": {
            "scale": 1.03,
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
        "/assets/BASHU/__闲置__BASHU_05.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 0.91,
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
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/LINGNAN/monong_anong.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_02.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/__闲置__WESTERN_10.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
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
        "/assets/CENTRAL/cd898a76-c2bd-4e43-865a-7955b80a131a.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 39
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
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WESTERN/__闲置__WESTERN_08.png": {
            "scale": 1.1,
            "offsetX": 4,
            "offsetY": -4
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
            "scale": 1.11,
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
            "scale": 0.82,
            "offsetX": 10,
            "offsetY": 9
        },
        "/assets/litang/bing_liji.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/LINGNAN/5cd1cab7-d441-49ce-83b0-f56bf865de90.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 0.97,
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
            "scale": 1.07,
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
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
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
            "scale": 0.95,
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
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 16
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
            "scale": 1.17,
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
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/litang/song2_houjunji.png": {
            "scale": 1.07,
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
        "/assets/xianqin/wuzhou_limu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/NORTH/__闲置__NORTH_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/yingzhou_d2_licunxu.png": {
            "scale": 0.93,
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
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/dai_d_shijingtang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/__闲置__WESTERN_15.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
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
            "scale": 1.02,
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
        "/assets/CENTRAL/huang_d_jiakui.png": {
            "scale": 1.01,
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
        "/assets/zhaosong/hezhou_wangjian.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": 7
        },
        "/assets/BASHU/cuanshi_cuanlongyan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/LINGNAN/__闲置__LINGNAN_18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
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
        "/assets/LINGNAN/__闲置__LINGNAN_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/__闲置__LINGNAN_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/zhuang_d_washifuren.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL/__闲置__CENTRAL_32.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/zhaosong/yanchuan_d_yuefei.png": {
            "scale": 1.16,
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
        "/assets/JIANGNAN/wang_d_liuyu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_11.png": {
            "scale": 1.33,
            "offsetX": 0,
            "offsetY": -16
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
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/xianqin/2a9cdb35-74ab-46dc-a251-a299886e3e5f.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/xianqin/__多余__xianqin_02.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
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
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/__闲置__LINGNAN_24.png": {
            "scale": 1,
            "offsetX": -19,
            "offsetY": -16
        },
        "/assets/daming/guizhou_lidingguo.png": {
            "scale": 0.87,
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
        "/assets/LINGNAN/__闲置__LINGNAN_25.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LINGNAN/luodian_shexiangfuren.png": {
            "scale": 0.77,
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
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/guzgan_abuhalisi.png": {
            "scale": 1,
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
            "scale": 1.03,
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
            "scale": 0.94,
            "offsetX": 19,
            "offsetY": 37
        },
        "/assets/JAPAN/gonggu_gonggudaozhu.png": {
            "scale": 1.05,
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
            "offsetY": -38
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": 6
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 0.98,
            "offsetX": 32,
            "offsetY": -52
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
        "/assets/JIANGNAN/__闲�����������������__JIANGNAN_20.png": {
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
        "/assets/JAPAN/__闲置__JAPAN_20.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
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
            "scale": 0.9,
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
        "/assets/CENTRAL_ASIA/kangju_chebishi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
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
            "offsetY": -19
        },
        "/assets/panjun/ketagalan_huangqingyun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/TIBET/__闲置__TIBET_17.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
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
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/KOREA/chen3_jizhun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -59
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
            "scale": 0.85,
            "offsetX": 16,
            "offsetY": 6
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
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_20.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_21.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -45
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
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/litang/282afd3a-12fa-48b4-8c86-2c07ee12abe6.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/litang/gaoliang_geshuhan.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_22.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 2
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
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/__闲置__TIBET_18.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/tufa_d_tufanutan.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 34
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
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_23.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -17
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
            "scale": 1.47,
            "offsetX": 10,
            "offsetY": 27
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
            "scale": 1.01,
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
            "scale": 1,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/3ec87a35-56eb-44f4-94fc-fc03ae6c2cf7.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/xianqin/cb100820-155f-4f48-8c7f-425727ed9a39.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/xianqin/__闲置__xianqin_25.png": {
            "scale": 1.21,
            "offsetX": 14,
            "offsetY": -3
        },
        "/assets/daming/__闲置__JIANGNAN_21.png": {
            "scale": 1.1,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/BASHU/ming_zheng_zhengchenggong.png": {
            "scale": 1.02,
            "offsetX": 10,
            "offsetY": -2
        },
        "/assets/xianqin/10349d1d-e207-4753-8962-530f563bb9b0.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/xianqin/4973a163-7946-43f2-9043-c4c799414d34.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/xianqin/833a8a5f-8a12-410e-a531-f3e8c2c3d3b1.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/8eb702ce-762e-4fc3-8391-39621018761a.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/xianqin/931cf26d-b89b-4654-a5b2-4d5aa5311d28.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/xianqin/c97f3cdc-39ba-4bef-9e8c-6233d05592fe.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/__闲置__WESTERN_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_32.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/xiqin_wanyanchenheshang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/LINGNAN/__闲置__LINGNAN_36.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/guangxin_shixie.png": {
            "scale": 0.78,
            "offsetX": 1,
            "offsetY": -12
        },
        "/assets/NORTH/__闲置__NORTH_05.png": {
            "scale": 1.05,
            "offsetX": 9,
            "offsetY": -25
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
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
        "/assets/litang/__闲置__litang_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/litang/lingwu_guoziyi.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/xianqin/__闲置__xianqin_33.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/xianqin/__闲置__xianqin_34.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/__闲置__CENTRAL_41.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/TIBET/lang_clan_jiangqujianzan.png": {
            "scale": 1.11,
            "offsetX": 12,
            "offsetY": -15
        },
        "/assets/STEPPE/aertai_baibuhua.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/BASHU/__多余__BASHU_03.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_36.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/STEPPE/manghuti_weidaer.png": {
            "scale": 1.42,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/STEPPE/__多余__STEPPE_02.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/chenli_d_zuoxianwang.png": {
            "scale": 1.08,
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
        "/assets/JIANGNAN/wuling_xiangdancheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/she_ethnic_leiwanxing.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/zhaosong/__闲置__zhaosong_25.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/zhaosong/didao_wangshao.png": {
            "scale": 0.96,
            "offsetX": 19,
            "offsetY": 0
        },
        "/assets/TIBET/daca_dacajilong.png": {
            "scale": 1.1,
            "offsetX": 23,
            "offsetY": 14
        },
        "/assets/HEXI/__闲置__CENTRAL_21.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/HEXI/xiazhou_lijiqian.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/BASHU/kui_gongsunshu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/CENTRAL/__闲置__CENTRAL_29.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/litang/xinping_guoziyi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/BASHU/cong_puhu.png": {
            "scale": 1.04,
            "offsetX": 1,
            "offsetY": -16
        },
        "/assets/LINGNAN/__闲置__zhaosong_12.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/JIANGNAN/ruochu_doulian.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_20.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/xianqin/__闲置__xianqin_36.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -16
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
            "scale": 1.2,
            "offsetX": -7,
            "offsetY": -47
        },
        "/assets/LINGNAN/chimei_fanchong.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_18.png": {
            "scale": 0.92,
            "offsetX": 22,
            "offsetY": -10
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
        "/assets/JAPAN/__闲置__JAPAN_29.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/JAPAN/osumi_ganfujianxu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/konbaung_yongjiya.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -15
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
        "/assets/LINGNAN/funan_fanman.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
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
        "/assets/KOREA/__闲置__KOREA_08.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/KOREA/xinluo_jinyuxin.png": {
            "scale": 0.96,
            "offsetX": 2,
            "offsetY": 0
        },
        "/assets/KOREA/__闲置__KOREA_09.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/KOREA/goryeo_jianghanzan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL/__闲置__CENTRAL_30.png": {
            "scale": 1.19,
            "offsetX": 21,
            "offsetY": -34
        },
        "/assets/DIANQIAN/xingwei_hanba.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/LINGNAN/shixing_houandou.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": -8
        },
        "/assets/JAPAN/__闲���__JAPAN_31.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/beihai_shamusheyun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/WESTERN/adao_d_mafushou.png": {
            "scale": 1.06,
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
        "/assets/manqing/xingan_hailancha.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/shengmiao_baoli.png": {
            "scale": 0.94,
            "offsetX": 5,
            "offsetY": -2
        },
        "/assets/HEXI/chijin_qiewangshijia.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/__闲置__CENTRAL_23.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/yangguan_lihao.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/BASHU/__多余__BASHU_04.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL/__闲置__CENTRAL_44.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/__闲置__STEPPE_47.png": {
            "scale": 1.08,
            "offsetX": 4,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/safawei_tahemasipu.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/daming/__闲置__JIANGNAN_22.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -78
        },
        "/assets/STEPPE/yilihanguo_xuliewu.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/xianqin/__闲置__xianqin_38.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/litang/__闲置__litang_10.png": {
            "scale": 1.09,
            "offsetX": 11,
            "offsetY": -3
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
        "/assets/wuzhou/__闲置__wuzhou_21.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/liuhan/__闲置__liuhan_24.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -10
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
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/wuzhou/__闲置__wuzhou_24.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/BASHU/__闲置__BASHU_18.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/yueyi_zhangyi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/1e11582e-6b31-457e-8515-39c4af2d270d.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL_ASIA/mangshi_mangewang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/STEPPE/52b980a4-e46a-473e-a80c-e349f6df17b4.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/salai_salaiwang.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/71c17c9a-044b-4462-9af7-df9abd999d0b.png": {
            "scale": 1.08,
            "offsetX": 5,
            "offsetY": -6
        },
        "/assets/STEPPE/yidier_yidierwang.png": {
            "scale": 1.08,
            "offsetX": 5,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/04f63cb4-9e9d-433e-8cdd-ce23fb91d8a0.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/xiemian_xiemianwang.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/38b1fb8e-384c-4d11-bd0b-8953a9a07d81.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/xierwan_falukesha.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/89abad37-0097-4668-8cfd-926ff3828e33.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/dedan_dedanwang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/watermarked_img_9448316089595463675.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/beileinisi_tuolemiershi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/037b6634-83dd-470d-922c-40da5fc095b9.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL_ASIA/jiashi_d_jiashiwang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL_ASIA/b241362f-1cdf-40a3-b845-5f91cf20e9f0.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/sumo_sumowang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/bba5410e-6fd7-4b39-a981-cb6cc66119f7.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/boluo_damoboluo.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/cc8a3c65-513d-49b2-9cf5-4b1b73618062.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/mojietuo_pinpisuoluo.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/8a31a13d-e022-4357-bf51-05e73f91511b.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/kongque_zhantuoluojiduo.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/0d660295-a334-4810-8bde-7a4db566fdff.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/jieri_jieriwang.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/824a8345-8e53-470c-a410-8a55da9a9bd8.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/mowoer_akeba.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/195c69d8-64ea-495f-97b4-34af318c162d.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/deli_alawuding.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/dbfc26d0-7166-45b3-ab34-96b618ef6417.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/CENTRAL_ASIA/xike_lanjite.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/c1e6d25e-191f-4a06-b811-2ac44a20f3ba.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/nabatai_aleitasi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/124ccda6-b7a3-49e4-92cd-b1cb1cd56414.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL_ASIA/ansxi_aershake.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/b2e245a9-4155-4120-800e-01e43e56f3a0.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/guyashu_shamuxiada.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/841c3799-9bd1-4b9b-8931-b78fdd2dbaec.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/jialatai_deaotalusi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/18b49925-d432-4f51-ac22-06d3f3779ca1.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/aiaoniya_alisita.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/STEPPE/af38ae33-a9aa-4302-b48d-1c5a159ca610.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/kesa_bulankehan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/42c18a97-0e24-4462-a749-be0f53a934d5.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/ailan_shuteluke.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/50882fe1-b9b5-4e02-a867-e46bc2e738bd.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/aiji_lameixisi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/0604bac4-9e05-4d86-957f-188ca135e7a3.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/safawei_aisimaier.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL/56e93ff0-cc7b-4a6c-9946-3ec6a505245e.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL/__闲置__CENTRAL_46.png": {
            "scale": 1.04,
            "offsetX": 13,
            "offsetY": 7
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/litang/liwang_liguangbi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/CENTRAL/__闲置__CENTRAL_47.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/saerbadaer_lazhake.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/JIANGNAN/__闲置__JIANGNAN_29.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/aqimeinide_daliushi.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL/f17c53ef-ac01-4203-9023-a4e1d2b4a534.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/__闲置__CENTRAL_48.png": {
            "scale": 0.92,
            "offsetX": 2,
            "offsetY": 17
        },
        "/assets/CENTRAL/ranwei_d_ranmin.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL_ASIA/0c7b399b-4d49-4aa9-9b53-961a83773e0b.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_01.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/safawei_d_abasi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/WEST_ASIA/b0c01728-0dd4-4fcc-82d0-ef444bac260b.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_32.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/bendou_alikesai.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_33.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/ca8054c2-81e6-400b-b4b6-2ae5fea3dfa6.png": {
            "scale": 1.09,
            "offsetX": -9,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_34.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WEST_ASIA/heti_muwatali.png": {
            "scale": 1.29,
            "offsetX": -9,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/014ef5c5-1aa7-46c9-b548-f4da60d19ecb.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/a8375fd2-b696-488e-ade3-eabfe4943df1.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_35.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/WEST_ASIA/fulijiya_maidasi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/231d7eab-b216-4961-9f24-7c593808d436.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_36.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WEST_ASIA/ldiya_keluoyisi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/WEST_ASIA/42008e9c-6509-4076-8b18-8ed2f000a742.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_37.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/pajiama_oumainisi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WEST_ASIA/5d17f241-9f2e-47bc-b994-a749faa8276d.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_38.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/bitiniya_diaoduoer.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/7a93fd16-ebd4-4baa-9a13-f8d48386179d.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_39.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/baizhanting_beilisaliu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/f018133f-83e2-4b9f-8cfe-ab73b0eb4b47.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_40.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/luomu_jilijie.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/d7d30199-8c43-4489-bca8-e5b799658113.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_41.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/sailiugu_antiaoke.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WEST_ASIA/b2d6a27d-fedd-4d23-b9d5-af0b5838263c.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_42.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WEST_ASIA/womaya_muaweiye.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/cd9ca15d-a846-4472-af38-7f763b87bc87.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_43.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/WEST_ASIA/xibolai_dawei.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/f34b27ae-9998-4f64-a1c7-8b8620ff1b1b.png": {
            "scale": 1.49,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_39.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/tuolemi_tuolemi.png": {
            "scale": 1.49,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/WEST_ASIA/7be94d0b-4580-4b80-8b17-bcb56a6d6396.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/yingqin/__闲置__yingqin_12.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WEST_ASIA/jialedi_nibujianisa.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/88f62bbf-d0f7-4eaa-977e-a8fd2e02f611.png": {
            "scale": 1,
            "offsetX": 1,
            "offsetY": 5
        },
        "/assets/litang/__闲置__litang_14.png": {
            "scale": 1.29,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/paermila_zhinuobiya.png": {
            "scale": 1,
            "offsetX": 1,
            "offsetY": 5
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_02.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/9bc03815-b240-42c7-acdb-7ec587bd58e5.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/abasi_mansuer.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/fcebd5fa-0db1-4bba-b71f-e69501168d23.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/JAPAN/__闲置__JAPAN_33.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/xikesuosi_salidi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/b202e54f-f07e-4252-b58f-9b97f993dc8b.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/xianqin/__闲置__xianqin_39.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/yashu_saergong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/WEST_ASIA/8c596ee3-f65a-4af2-9fed-e2df3833e884.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/CENTRAL/__闲置__CENTRAL_57.png": {
            "scale": 1.04,
            "offsetX": 2,
            "offsetY": 7
        },
        "/assets/WEST_ASIA/youfaladi_yehaiya.png": {
            "scale": 1.04,
            "offsetX": 1,
            "offsetY": 30
        },
        "/assets/WEST_ASIA/ef201210-c2e4-4b59-b6b3-955d9c1fe73e.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/__闲置__STEPPE_50.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/WEST_ASIA/qiliqiya_pangpei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/a4bc039f-f274-405d-ae22-31139cea6d30.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/b112ff3a-7753-4557-b142-60705c3d144d.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/c2845a9a-befb-4a82-93f7-fd9c26171331.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/WEST_ASIA/c6c500fa-fbfc-4a83-b218-e29dea90ee49.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/cbca027d-8958-4f6c-9a79-e1a877795e93.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 38
        },
        "/assets/WEST_ASIA/cd1cecda-4bdc-42fc-bb32-2b57761b3300.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/WEST_ASIA/dc3faa83-b2ca-42a5-a828-c93fd669cb18.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/WEST_ASIA/f2ad1ee2-29ce-435b-812f-4b53de2d918d.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/WEST_ASIA/f25313be-be89-494d-9267-8db49e58cac7.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 18
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
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_10.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -23
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
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_14.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_16.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_17.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_18.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_19.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_20.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WEST_ASIA/01e6aab8-e68e-4d53-93c5-c0483cb8561d.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/WEST_ASIA/028f62ae-5ce8-4110-b996-7f0f76518876.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/zhaosong/__闲置__zhaosong_26.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": -13
        },
        "/assets/WEST_ASIA/sumeier_jierjiameishen.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/WEST_ASIA/03f06842-21ce-4357-9307-c4ee79ab1476.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/06d90546-e74b-4888-b6ea-7e89491a24f7.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/1d9a9cfa-1fb6-4634-8281-3f3d501c1656.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/WEST_ASIA/29e9e213-0290-450d-b9d5-c8b2a2a83cf8.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/WEST_ASIA/2f75845f-1762-47df-bc7c-dd310d84f58d.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/3004b9dc-0406-4a1e-a7d0-664e6d802512.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WEST_ASIA/33aa6978-6c18-401d-af8c-c9527b979d98.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/WEST_ASIA/406e4509-4599-4dd0-a577-69fd0d728da8.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/WEST_ASIA/42773b13-3c2f-4fc4-91ac-cc771422f555.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/5501574e-01af-4691-917d-d846948bd3bd.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WEST_ASIA/5a1c4f7c-e10b-4981-9690-547e7c58d768.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WEST_ASIA/6319c30c-0e68-4daf-b620-35ce2ac7fbfb.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/WEST_ASIA/6dbbccbc-28ec-4f24-910e-c979f1e77569.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/635e336b-3b4c-46e5-bbbb-00da429cbbaf.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/WEST_ASIA/7364b645-014f-4634-ad09-7896f972b666.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/758a94f8-9d8a-454e-b00f-684961c96756.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/7fbfecbb-22dc-42e6-8fb8-58ad4bc88cc4.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/WEST_ASIA/87739d0e-2524-4d10-8efb-1ec643429dee.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/939f37f1-856b-4078-83d2-63e291d0ab52.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/9a64f18b-128e-482e-b4d7-63557fef223d.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/9958ec44-5a6c-4c7b-a9ff-26bd71682ed7.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/ayoubu_salaheding.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_44.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/WEST_ASIA/maidina_halide.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_45.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WEST_ASIA/gulaishi_aibusufuyang.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_21.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_22.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_25.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_24.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_26.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_27.png": {
            "scale": 1.44,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_28.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_29.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_30.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_31.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_47.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_50.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_53.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_55.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_57.png": {
            "scale": 1.44,
            "offsetX": 0,
            "offsetY": 46
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_59.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_61.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_62.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_64.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_65.png": {
            "scale": 1.02,
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
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_71.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_72.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_73.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_74.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_75.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_76.png": {
            "scale": 1.27,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_77.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_83.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_88.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_91.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__闲置__WEST_ASIA_20.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_92.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -5
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
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_94.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/yanda_touluoman.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_95.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/CENTRAL_ASIA/xisi_yakubu.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_96.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/delan_sulun.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_97.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/dulan_d_aihamaide.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_98.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_100.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/huluo_jiyasiding.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_102.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/CENTRAL_ASIA/najie_minande.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_103.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_104.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/wugu_d_tugelile.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL_ASIA/kumisi_aerpu.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_106.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/ribale_faheerdaolai.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_107.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_51.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/CENTRAL_ASIA/yilihanguo_d_hezan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__闲置__STEPPE_52.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/asaibaijiang_xuliewu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_110.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/CENTRAL_ASIA/wulaertu_ajishenti.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_111.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/gelujiya_tamaer.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_112.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/CENTRAL_ASIA/keerjisi_bagelate.png": {
            "scale": 1.23,
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
        "/assets/liuhan/__闲置__liuhan_11.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/liuhan/__闲置__liuhan_13.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/liuhan/__闲置__liuhan_19.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/liuhan/__闲置__liuhan_20.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/liuhan/__闲置__liuhan_22.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/LINGNAN/wuxi_shamoke.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/LINGNAN/__闲置__liuhan_12.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/shaozhou_zhangzhensun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/xianqin/__闲置__xianqin_40.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/NORTH/linhu_mafang.png": {
            "scale": 1.07,
            "offsetX": -7,
            "offsetY": 0
        },
        "/assets/BASHU/__闲置__BASHU_19.png": {
            "scale": 0.96,
            "offsetX": 5,
            "offsetY": -41
        },
        "/assets/BASHU/tan_d_qinhou.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/__闲置__liuhan_13.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/LINGNAN/daozhou_yangzaixing.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/STEPPE/__多余__STEPPE_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/STEPPE/huite_amuersana.png": {
            "scale": 1.15,
            "offsetX": 10,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_54.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/xiajiasi_are.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/__闲置__STEPPE_55.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/duolu_ashinahelu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
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
        "/assets/TIBET/__闲置__TIBET_19.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/TIBET/nanjie_nanjiewangqiu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/TIBET/29f794ff-4fe6-444f-bfa4-54bed3b3b612.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/__多余__TIBET_01.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/nandou_sushili.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/__多余__STEPPE_01.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/liuhan/jiluo_d_douxian.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/STEPPE/kereyid_tuowolin.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/f0c201e5-4337-4c65-81f3-cf452e596e16.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -4
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
        "/assets/TIBET/664ca8de-c4c9-42d3-a03d-f5e12ebe5080.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/__多余__TIBET_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/TIBET/gling_gesaer.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/TIBET/10d150eb-29ff-46fe-b78e-416bb1fdd47a.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/TIBET/lopi_abo.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/TIBET/955bb4a2-a8fe-4477-b2e7-f872a83d37f3.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -13
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
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_27.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/loulan_suojie.png": {
            "scale": 1,
            "offsetX": -1,
            "offsetY": -12
        },
        "/assets/WESTERN/__多余__WESTERN_08.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/gaochang_quwentai.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/__闲置__WESTERN_37.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/STEPPE/xueyantuo_yinan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/BASHU/__多余__BASHU_01.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/BASHU/boren_ada.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/__闲置__STEPPE_56.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/daming/__闲置__daming_08.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/__闲置__daming_09.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/daming/__闲置__daming_12.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/daming/__闲置__daming_14.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_45.png": {
            "scale": 0.77,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_15.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_21.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_23.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_22.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_24.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_25.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_27.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_29.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_31.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_30.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
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
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_34.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_35.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_37.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_36.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_39.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_38.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_40.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_41.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_43.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_42.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_44.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_46.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_47.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_48.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_50.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_51.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_53.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_52.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/WEST_ASIA/__闲置__WEST_ASIA_54.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/litang/shanzhou_wangzhongsi.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/KOREA/woju_yinguan.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/panjun/__闲置__panjun_24.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/jibei_wangkuang.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_01.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/CENTRAL_ASIA/mamon_mameng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/huarazim_mohemo.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/nanzhong_mazhong.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/BASHU/__多余__BASHU_02.png": {
            "scale": 1.09,
            "offsetX": -13,
            "offsetY": -16
        },
        "/assets/BASHU/qianzhong_wubayue.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/BASHU/kuai_kuaiyue.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/__多余__LINGNAN_09.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/LINGNAN/xiou_yixusong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/__多余__DIANQIAN_05.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/BASHU/qiong_rengui.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/she_shechongming.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JIANGNAN/__多余__JIANGNAN_01.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/JIANGNAN/wenzhou_fangguozhen.png": {
            "scale": 1,
            "offsetX": 9,
            "offsetY": -5
        },
        "/assets/zhaosong/__多余__zhaosong_01.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JIANGNAN/kejia_huangfeng.png": {
            "scale": 1.2,
            "offsetX": 12,
            "offsetY": -1
        },
        "/assets/LINGNAN/xinjiang_maji.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/TIBET/ada93ca5-cca5-4449-84af-500cad61c9de.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/gaxa_zhashenduanzhubu.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/1dfe005d-013b-434a-b425-58621bfeba74.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/__多余__TIBET_03.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/STEPPE/khoshut_tulubaihu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/5c0bc7b4-593e-4c2a-951f-3faf25fb2f98.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/TIBET/__多余__TIBET_04.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/TIBET/spurgyal_dariniansai.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/TIBET/31fa399f-d335-49f7-82d3-ee3a6fa97ed0.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/TIBET/__多余__TIBET_05.png": {
            "scale": 0.94,
            "offsetX": 8,
            "offsetY": -9
        },
        "/assets/TIBET/xiangxiong_limixia.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/42010cae-b4c8-42bc-a579-dc85d60c721f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LINGNAN/miaomin_shiliudeng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/LINGNAN/9ee78ada-78eb-4066-b92a-881f426877fa.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/__多余__LINGNAN_10.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/tian_sizhou_tianyougong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/89d0c0dd-168d-493e-b3c3-6addc40f1a30.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/__多余__LINGNAN_11.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/xinggu_cuanxi.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/7235b227-0924-4a2d-a109-f13827562adf.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/__多余__LINGNAN_12.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/paiyao_huangguasi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/c673c706-65e1-41c2-a466-7c28cfe46f95.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LINGNAN/__多余__LINGNAN_13.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/yelang_duotong.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/LINGNAN/3ef743ec-0f9c-470e-9858-d677e7f72dfa.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/LINGNAN/21c49b91-ecde-43fe-900c-6014004a757a.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/__多余__LINGNAN_14.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/jing_dingbuling.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/TIBET/aa71e54e-513f-48f0-969f-4a28503eecef.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/TIBET/__多余__TIBET_06.png": {
            "scale": 1.17,
            "offsetX": 11,
            "offsetY": -4
        },
        "/assets/TIBET/hor_chisang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/LINGNAN/ece01d0f-1751-4255-93ad-2dd5139ea2a2.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/__多余__LINGNAN_15.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/LINGNAN/qian_songjingyang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/d5b5afa2-d2c1-4518-940c-493a6832ff04.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/__多余__LINGNAN_16.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/LINGNAN/geng_gengjingzhong.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/7389a06c-748b-4aac-a5e5-156572736709.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/DIANQIAN/__多余__DIANQIAN_06.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/paiwan_alugu.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/9cb5c3cc-f472-4eae-ad6d-9f11a27e057b.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LINGNAN/lancang_faang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LINGNAN/6cf9d887-68d2-4d35-8172-9fbf2f2f28c1.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/dengmaoqi_dengmaoqi.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/xiadun_awanglangjie.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_02.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/fanyanna_xieer.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/TIBET/ladakh_senggelangjie.png": {
            "scale": 0.95,
            "offsetX": 23,
            "offsetY": 2
        },
        "/assets/WESTERN/__闲置__WESTERN_07.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/WESTERN/__多余__WESTERN_01.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/WESTERN/yanqi_longtuqizhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/__多余__WESTERN_02.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/wensu_guyi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/WESTERN/__多余__WESTERN_03.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/WESTERN/weitou_douti.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/__闲置__WESTERN_23.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/917615c-91f4-46c6-bcb0-eb8e309fbbe4.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/JAPAN/ryukyu_shangbazhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/LINGNAN/__多余__LINGNAN_17.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_03.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/HEXI/__多余__HEXI_01.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/HEXI/yeli_yeliwangrong.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/xianqin/__多余__xianqin_01.png": {
            "scale": 1.2,
            "offsetX": -7,
            "offsetY": -47
        },
        "/assets/xianqin/yun_wuli.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/LINGNAN/muong_shencongyue.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/JAPAN/__多余__JAPAN_01.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/ayinu_hushemoquan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/qiepantuo_luozhentan.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/WESTERN/__多余__WESTERN_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/WESTERN/yarkand_latifu.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/WESTERN/__多余__WESTERN_11.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL_ASIA/__多余__CENTRAL_ASIA_05.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/dayuan_wugua.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/DIANQIAN/wuman_cuangui.png": {
            "scale": 1.05,
            "offsetX": 13,
            "offsetY": 19
        },
        "/assets/TIBET/__多余__TIBET_10.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/TIBET/khon_basiba.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/__多余__WESTERN_13.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/__多余__WESTERN_06.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/WESTERN/weili_weilifan.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/WESTERN/__多余__WESTERN_10.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/__多余__WESTERN_07.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/qiemo_anmoshenpan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/__多余__TIBET_11.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/__多余__TIBET_07.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/TIBET/ganden_zongkaba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/TIBET/__多余__TIBET_09.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/__多余__TIBET_08.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/TIBET/nvguo_mojie.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/__多余__WESTERN_12.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
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
        "/assets/WESTERN/__多余__WESTERN_14.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/wusun_liejiaomi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/STEPPE/__闲置__STEPPE_59.png": {
            "scale": 0.82,
            "offsetX": 13,
            "offsetY": -26
        },
        "/assets/STEPPE/dada_ming_batumengke.png": {
            "scale": 1,
            "offsetX": 2,
            "offsetY": 42
        },
        "/assets/STEPPE/dada_ming_dayanhan.png": {
            "scale": 1,
            "offsetX": 2,
            "offsetY": 42
        },
        "/assets/HEXI/__闲置__HEXI_19.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/HEXI/juqu_d_juqumengxun.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/__闲置__TIBET_01.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/TIBET/__闲置__TIBET_02.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/TIBET/46aea3be-5334-4887-b7dc-9215c94991a4.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/TIBET/qiuchi_yangnandang.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_49.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_78.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/CENTRAL_ASIA/guishuang_qiujiuque.png": {
            "scale": 1.17,
            "offsetX": 0,
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
        "/assets/wuzhou/__闲置__wuzhou_25.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/LINGNAN/xian_d_xianying.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/xian_d_xianfuren.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LINGNAN/__多余__LINGNAN_08.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/LINGNAN/__闲置__LINGNAN_14.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/__闲置__WESTERN_24.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/LINGNAN/__闲置__LINGNAN_15.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LINGNAN/__多余__LINGNAN_18.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/LINGNAN/__多余__LINGNAN_19.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/LINGNAN/__多余__LINGNAN_20.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/DIANQIAN/__多余__DIANQIAN_04.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_23.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_24.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_25.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/DIANQIAN/__多余__DIANQIAN_07.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/DIANQIAN/__闲置__DIANQIAN_26.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/HEXI/__闲置__HEXI_14.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/HEXI/__闲置__HEXI_15.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/HEXI/__闲置__HEXI_17.png": {
            "scale": 1.19,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/HEXI/__闲置__HEXI_16.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/HEXI/__多余__HEXI_02.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/HEXI/qifu_d_qifuchipan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/__多余__WESTERN_15.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/WESTERN/sai_gaijiayun.png": {
            "scale": 0.79,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/weiwuer_yusubu.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/CENTRAL_ASIA/__闲置__CENTRAL_ASIA_108.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/khoja_apakehezhuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WESTERN/__闲置__WESTERN_31.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/WESTERN/__闲置__WESTERN_32.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WESTERN/__闲置__WESTERN_33.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/__闲置__STEPPE_60.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 5
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
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/WESTERN/__闲置__WESTERN_36.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/tujishi_sulu.png": {
            "scale": 1.08,
            "offsetX": 11,
            "offsetY": 1
        },
        "/assets/WESTERN/tujishi_sulukehan.png": {
            "scale": 1.1,
            "offsetX": 11,
            "offsetY": 1
        },
        "/assets/NORTHEAST/dcba1754-eaf2-4b8d-acd6-075aecc90445.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/NORTHEAST/ayinu_ezo_keshamayin.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/LATIN/a1848934-56ab-49f6-8d84-9e1f3509fec4.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": 51
        },
        "/assets/LATIN/boootiya_yibaminongda.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": 51
        },
        "/assets/LATIN/c4ae3b00-6a62-4cc1-96ed-26575379c036.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/luodesi_boliaokete.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/LATIN/3d522cd8-662a-4bbc-8b30-a4997cb9bc9c.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/LATIN/kelite_minuosi.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/LATIN/f55e91bb-2025-4e21-9a90-15e8009372cc.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/LATIN/leangongguo_afangsuojiushi.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 52
        },
        "/assets/LATIN/b107ad89-9af0-4a4f-9cb1-f275380f418e.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/bohepingyuan_diaoduolike.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LATIN/ae0e6d4a-baf6-4f59-bfb0-7754fd153c14.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LATIN/9281f9dd-2e3d-4578-9bcf-79926a4102fe.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LATIN/xixiliwangguo_feitelieershi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/GERMANIC/53d58882-072f-45fd-92f0-ea004ff107a5.png": {
            "scale": 1.31,
            "offsetX": -1,
            "offsetY": 32
        },
        "/assets/GERMANIC/weixi_ansijiaer.png": {
            "scale": 1.31,
            "offsetX": -1,
            "offsetY": 32
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
