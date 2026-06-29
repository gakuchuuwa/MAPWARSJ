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
        "/assets/litang/dingxiang_d_lijing.png": {
            "scale": 1.07,
            "offsetX": 3,
            "offsetY": -21
        },
        "/assets/litang/lingwu_guoziyi.png": {
            "scale": 1.09,
            "offsetX": 11,
            "offsetY": -3
        },
        "/assets/xianqin/shang_fuhao.png": {
            "scale": 1.01,
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
        "/assets/DIANQIAN/chenla_sheyebamoqishi.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -50
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
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/litang/heyuan_d_heichichangzhi.png": {
            "scale": 1.05,
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
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 19
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
        "/assets/daming/hao_d_changyuchun.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": -47
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
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/litang/juandu_peixingjian.png": {
            "scale": 1.29,
            "offsetX": 0,
            "offsetY": 9
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
        "/assets/CENTRAL/weihaiwei_sudingfang.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -14
        },
        "/assets/CENTRAL/zhuozhou_anlushan.png": {
            "scale": 1.12,
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
        "/assets/CENTRAL/hongnong_jun_yangsu.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -19
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
        "/assets/xianqin/han_baoyuan_han.png": {
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
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 0.92,
            "offsetX": 1,
            "offsetY": -47
        },
        "/assets/liuhan/guangwu_xinwuxian.png": {
            "scale": 0.9,
            "offsetX": 22,
            "offsetY": 15
        },
        "/assets/DIANQIAN/luoyue_zhengce.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/yingqin/qin_yingji.png": {
            "scale": 1.24,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTH/dangzhou_dengai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/NORTH/mushi_muchong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/tiele_qibiheli.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/yuan_cj_d_yuanshu_zn.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/zhaosong/fengzhou_wujie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/daming/jinzhou_lichengliang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -59
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.98,
            "offsetX": 9,
            "offsetY": 5
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
        "/assets/JIANGNAN/chizhou_wumingche.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/baiman_gaoshengtai.png": {
            "scale": 0.89,
            "offsetX": 2,
            "offsetY": -35
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.14,
            "offsetX": 14,
            "offsetY": 19
        },
        "/assets/CENTRAL/bozhou_d_luzhonglian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/liuhan/lulin_liuxiu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -7
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
        "/assets/DIANQIAN/mon_monuhe.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/HEXI/dangxiang_liyuanhao.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -23
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
        "/assets/KOREA/chen3_chenwang.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/KOREA/baiji_jiebai.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL_ASIA/tiemuer_tiemuer.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/JAPAN/ashikaga_zulijunshi.png": {
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
            "scale": 1.01,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/JAPAN/edo_dechuangjiakang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/cai_lisu.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/STEPPE/menggu_d_chengjisihan.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/KOREA/gaogouli_yizhiwende.png": {
            "scale": 1.17,
            "offsetX": -5,
            "offsetY": 0
        },
        "/assets/WESTERN/wulianghai_chelingwubashi.png": {
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
            "scale": 1.02,
            "offsetX": 11,
            "offsetY": 14
        },
        "/assets/HEXI/lushui_beigongboyu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL_ASIA/badakhshan_luozhentan.png": {
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
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 0.82,
            "offsetX": 0,
            "offsetY": -24
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
        "/assets/JIANGNAN/wenzhou_zhangcong.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/gumie_liuyu.png": {
            "scale": 1,
            "offsetX": 9,
            "offsetY": -5
        },
        "/assets/JIANGNAN/heng_hetengjiao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 36
        },
        "/assets/NORTHEAST/eluoke_amuhar.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/NORTHEAST/jilimi_takuna.png": {
            "scale": 0.85,
            "offsetX": 8,
            "offsetY": -14
        },
        "/assets/zhaosong/huan_zhongshidao.png": {
            "scale": 0.97,
            "offsetX": 14,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/xianqin/yue_goujian.png": {
            "scale": 1.01,
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
            "scale": 1.14,
            "offsetX": 22,
            "offsetY": -8
        },
        "/assets/STEPPE/pugu_ashinagudulu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/manqing/manzhou_d_duergan.png": {
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
        "/assets/zhaosong/kang_liangshidu.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": -6
        },
        "/assets/xianqin/huang_d_sunshuao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/liuhan/xijue_ganshouchang.png": {
            "scale": 0.97,
            "offsetX": 12,
            "offsetY": -76
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
        "/assets/JAPAN/date_d_yidazhengzong.png": {
            "scale": 0.89,
            "offsetX": 7,
            "offsetY": -20
        },
        "/assets/litang/zhongshan_yangaoging.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -14
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/NORTH/huo_songlaosheng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/JIANGNAN/chuzhou_d_dugao.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
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
        "/assets/LINGNAN/dali_duansiping.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/DIANQIAN/cuanshi_cuanlongyan.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -34
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
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/xianqin/ouyue_zouyao.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/kejia_wentianxiang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
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
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JIANGNAN/wuyue_qianliu.png": {
            "scale": 0.88,
            "offsetX": 9,
            "offsetY": -4
        },
        "/assets/WESTERN/gaochang_quwentai.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/tongzhou_yangzhiji.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL/bing_liukun.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/HEXI/shizhao_d_shihu.png": {
            "scale": 0.98,
            "offsetX": 3,
            "offsetY": 0
        },
        "/assets/xianqin/zhao_lianpo.png": {
            "scale": 0.96,
            "offsetX": 8,
            "offsetY": 5
        },
        "/assets/CENTRAL/wazhai_limi_wz.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/JAPAN/shimotsuke_yudugongguanggang.png": {
            "scale": 1,
            "offsetX": -4,
            "offsetY": -41
        },
        "/assets/CENTRAL_ASIA/hali_subashi.png": {
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
        "/assets/STEPPE/kaerka_abadaikehan.png": {
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
            "scale": 1.33,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/JIANGNAN/quanzhou_liucongxiao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/daming/ming_zheng_zhengchenggong.png": {
            "scale": 1.16,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/BASHU/wudu_zhangyi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/ketagalan_huangqingyun.png": {
            "scale": 1.18,
            "offsetX": 14,
            "offsetY": 24
        },
        "/assets/BASHU/lizhou_d_liaohua.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL/yun_wuli.png": {
            "scale": 1.04,
            "offsetX": 2,
            "offsetY": 7
        },
        "/assets/HEXI/quanrong_quanrongwang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/HEXI/huizhou_yaodui.png": {
            "scale": 1.14,
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
        "/assets/xianqin/xichu_xiangyu.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/wuxi_shamoke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/wumeng_azi_wm.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/BASHU/tan_d_tanhou.png": {
            "scale": 0.96,
            "offsetX": 5,
            "offsetY": -40
        },
        "/assets/BASHU/she_shechongming.png": {
            "scale": 1.09,
            "offsetX": 20,
            "offsetY": -36
        },
        "/assets/CENTRAL/mengcheng_d_gaoqiong.png": {
            "scale": 1.03,
            "offsetX": 20,
            "offsetY": -18
        },
        "/assets/JIANGNAN/xiao_d_xiaomohe.png": {
            "scale": 1.2,
            "offsetX": 12,
            "offsetY": 0
        },
        "/assets/TIBET/beidi_yaochang.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -6
        },
        "/assets/BASHU/miaomin_shiliudeng.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/STEPPE/tuoba_tuobagui.png": {
            "scale": 1.03,
            "offsetX": -18,
            "offsetY": -28
        },
        "/assets/JIANGNAN/shenshi_shenqingzhi.png": {
            "scale": 0.98,
            "offsetX": 5,
            "offsetY": 0
        },
        "/assets/zhaosong/yingzhou_d_liuqi.png": {
            "scale": 1.16,
            "offsetX": 11,
            "offsetY": -35
        },
        "/assets/CENTRAL/lu_zhangliao.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LINGNAN/zhuang_d_washifuren.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/xianqin/qi_qihuangong.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/KOREA/xinluo_jinyixin.png": {
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
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/long2_weixiaokuan.png": {
            "scale": 1.21,
            "offsetX": 3,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/kawusi_haidaer.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/BASHU/ba_bamanzi.png": {
            "scale": 1,
            "offsetX": -19,
            "offsetY": -16
        },
        "/assets/LINGNAN/guizhou_lidingguo.png": {
            "scale": 1,
            "offsetX": -19,
            "offsetY": -16
        },
        "/assets/BASHU/baishui_yanghuai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/paiyao_huanggua4.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/BASHU/bandun_fanmu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/trinh_zhengsong.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/boren_ada.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/zhancheng_zhimin.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/BASHU/chenzhou_d_zhanggao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/li_s_mayuan.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 13
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
            "offsetY": -18
        },
        "/assets/LINGNAN/xiou_yixusong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/BASHU/daxi_ming_zhangxianzhong.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LINGNAN/luodian_shexiang.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/LINGNAN/zangke_xielongyu.png": {
            "scale": 1.32,
            "offsetX": 0,
            "offsetY": 28
        },
        "/assets/BASHU/guo_jixin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/LINGNAN/xinggu_cuanxi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/BASHU/hezhou_wangjian_dy.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/yang_aner_yanganer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/BASHU/jinchuan_x_suonuomu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/BASHU/kuai_kuaiyue.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/haikou_wangzhi_pirate.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 4
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
        "/assets/LINGNAN/monong_anong.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/NORTH/wangyan_wangyan_tx.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/BASHU/qianhui_baiyanhu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/qianzhong_wubayue.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/qingqiang_jiangwei.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -18
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
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/BASHU/tujia_d_qinliangyu.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/LINGNAN/chaozhou_d_mafa.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTH/qu_d_quyi.png": {
            "scale": 0.96,
            "offsetX": 5,
            "offsetY": -40
        },
        "/assets/BASHU/sou_gaodingyuan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/NORTH/murong_murongke.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/BASHU/shuixi_anbangyan.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/leizhou_limao_leizhou.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/LINGNAN/duanzhou_d_caojin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/CENTRAL/liguo_wangmeng.png": {
            "scale": 1.09,
            "offsetX": 20,
            "offsetY": -36
        },
        "/assets/LINGNAN/chen2_zhaofan.png": {
            "scale": 1.09,
            "offsetX": 20,
            "offsetY": -36
        },
        "/assets/LINGNAN/闲置202606280332.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/NORTH/yuzhou_zuti.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/litang/liang_d_zhangxun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
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
        "/assets/LINGNAN/liren_funanshe.png": {
            "scale": 0.99,
            "offsetX": 7,
            "offsetY": 5
        },
        "/assets/BASHU/yidou_luxun.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/NORTH/yangshe_yangshezhi.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/BASHU/yong_lujili.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -8
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
        "/assets/LINGNAN/shengmiao_baoli_miao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/BASHU/zuo_d_wufu_zd.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 42
        },
        "/assets/LINGNAN/xian_d_xianfuren.png": {
            "scale": 1.21,
            "offsetX": 0,
            "offsetY": 42
        },
        "/assets/CENTRAL_ASIA/zhaowu_timuermieli.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/wugu_d_tugelile.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL_ASIA/wuhu_dukake.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/wensu_guyi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/xianhai_shamalike.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/weiwuer_yusubu.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/CENTRAL_ASIA/xisi_yakubusafaer.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -25
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
        "/assets/CENTRAL_ASIA/qiepantuo_humi_wang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/TIBET/guge_chizhaxichabade.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/WESTERN/yarkand_abuladitifu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/pangzha_halixingge.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/DIANQIAN/nanzhao_geluofeng.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/WESTERN/sai_gejiayun.png": {
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
        "/assets/CENTRAL_ASIA/khoja_apakhoja.png": {
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
        "/assets/DIANQIAN/ava_sijifa.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/WESTERN/tuoming_tuomin.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/HEXI/didao_duanjiong.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/WESTERN/shule_aersilan.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/CENTRAL_ASIA/mamon_mameng.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/CENTRAL_ASIA/muer_mujier.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -62
        },
        "/assets/CENTRAL_ASIA/kangju_chebishi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL_ASIA/kalan_suhela.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL_ASIA/jie_sijinti.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/jibin_qiujiuque.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/jibin_jianisejia.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/faqiang_niechizanpu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/WESTERN/guishuang_qiuqiujiu.png": {
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
        "/assets/CENTRAL_ASIA/dulan_d_aihamaide.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/dzungar_gaerdancelin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/fanyanna_fanyanna_wang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL_ASIA/guzgan_abulihalisi.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/pishan_daihu.png": {
            "scale": 0.99,
            "offsetX": 13,
            "offsetY": 30
        },
        "/assets/CENTRAL_ASIA/huarazim_mohemo.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/WESTERN/tuerhute_wobaxi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -3
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
            "scale": 0.96,
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
        "/assets/CENTRAL/jingzhou_gs_huangfusong.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/CENTRAL/kong_d_kongrong.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/CENTRAL/shatuo_likeyong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/JIANGNAN/fangla_fangla_jn.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/ranwei_d_ranmin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/mi_mizhu.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/tongma_liuang.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/CENTRAL/wang_d_wangdao.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL/yanchuan_d_hanyu.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL/zhengzhou_chenqingzhi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/CENTRAL/yaozhou_limaozhen.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/CENTRAL/yao_liuyuan.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/ningkou_lubode.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/__闲置__CENTRAL_01.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/BASHU/langzhou_zhangfei.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTH/zhe_d_zheyuqing.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/BASHU/li_lx_d_lichong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/BASHU/wanzhou_shangguankui.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
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
            "offsetY": -8
        },
        "/assets/CENTRAL/sunqin_sunchuanting.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/daming/zu_d_zudashou.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/daming/qi_d_qijiguang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/daming/suzhou_d_shikefa.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/daming/xuan_mafang.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": 42
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
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/daming/__闲置__daming_02.png": {
            "scale": 1.37,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/daming/__闲置__daming_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/DIANQIAN/ailao_leilao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/DIANQIAN/basha_d_daogengmeng.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/LINGNAN/202606282316.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -48
        },
        "/assets/DIANQIAN/dian_duanjianwei.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/DIANQIAN/dianguo_zhuangqiao.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/DIANQIAN/dongxu_mangruiti.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/DIANQIAN/hani_d_zhebi.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/DIANQIAN/hantawadi_mangyinglong.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/pugan/__闲置__pugan_03.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/DIANQIAN/konbaung_yongjiya.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -46
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
        "/assets/LINGNAN/nongzhigao_huangshimi.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/DIANQIAN/mingzheng_jianzandechang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
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
        "/assets/DIANQIAN/nanzhong_mazhong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/DIANQIAN/pagan_anuluvtuo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/pyu_molingtuo.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/DIANQIAN/qiong_rengui.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/TIBET/xiadun_xiazhongawanglangjie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/DIANQIAN/shuizhen_oudaren.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/pugan/__闲置__pugan_06.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/DIANQIAN/taiyuan_manglai.png": {
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
        "/assets/CENTRAL/__闲置__CENTRAL_03.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/__闲置__HEXI_01.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/TIBET/humi_humiwang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/xiliao_yelvdashi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -5
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
        "/assets/STEPPE/yuwen_yuwentai.png": {
            "scale": 0.85,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/dongshengwei_wangyue_ming.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -37
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
        "/assets/HEXI/ganzhou_dourong.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/HEXI/guiyi_caoyijin.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/STEPPE/chahar_lindanhan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/HEXI/helian_helianbobo.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/HEXI/hunxie_hunxiewang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/juqu_d_juqumengxun.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/HEXI/juyan_d_liling.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/HEXI/wei2_hunjian.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/HEXI/weiming_lijiaqian.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/HEXI/woye_huangfugui.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/WESTERN/shache_xian_suoche_wang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/HEXI/xingxingxia_guoxiaoke.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/xiqin_xuerengao.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/HEXI/yeli_yeliwangrong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/STEPPE/da_yuan_kuokuotiemuer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 1.1,
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
        "/assets/JAPAN/__闲置__JAPAN_02.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/JAPAN/__闲置__JAPAN_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/__闲置__JAPAN_04.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
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
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JAPAN/__闲置__JAPAN_10.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/JAPAN/__闲置__JAPAN_11.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JAPAN/__闲置__JAPAN_12.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JAPAN/__闲置__JAPAN_13.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/JAPAN/__闲置__JAPAN_14.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/aizu_pushengshixiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/aki_maoliyuanjiu.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JAPAN/anmei_yuwandaqin.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/JAPAN/ayinu_hushemoquan.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JAPAN/beihai_ayinuqiuzhang.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/JAPAN/chosokabe_changzongwobuyuanqin.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JAPAN/echigo_shangshanqianxin.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/JAPAN/fujiwara_yuanyijing.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/JAPAN/gonggu_gonggudaozhu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/JAPAN/higo_d_juchiwuguang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JAPAN/iga_d_baididanbo.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": -12
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
        "/assets/JAPAN/jibei2_qingshuizongzhi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/JAPAN/jinchuan_jinchuanyiyuan.png": {
            "scale": 1.1,
            "offsetX": 21,
            "offsetY": -14
        },
        "/assets/JAPAN/kaga_d_xiajianlaizheng.png": {
            "scale": 0.85,
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
        "/assets/JAPAN/mino_otaniyoshitsugu.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/JAPAN/nanbu_nanbuqingzheng.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/JAPAN/osumi_ganfujianxu.png": {
            "scale": 0.9,
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
        "/assets/JAPAN/sagami_hojoujiyasu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/JAPAN/sanada_d_zhentianxingcun.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/JAPAN/satsuma_daojinjiajiu.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/suwa_d_zoufanglaizhong.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/taira_pingzhisheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JAPAN/yamato_nanmuzhengcheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/JAPAN/yizhi_yizhiwang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JAPAN/zhuqian_shaozizheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
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
        "/assets/JIANGNAN/huangwang_huangchao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/jiang_s_huanggai.png": {
            "scale": 1.36,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/jiujiang_zhouyu.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/JIANGNAN/liu_yingbu.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/lujian_zhanghuangyan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JIANGNAN/ouyang_ouyangyi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/JIANGNAN/qian_d_yudayou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/qiufu_qiufu_jn.png": {
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
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/shuntian_linshuangwen.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JIANGNAN/sui_yangjian.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/JIANGNAN/sunwu_d_sunquan.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/JIANGNAN/wan_liuyuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JIANGNAN/wan_lukang.png": {
            "scale": 1,
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
        "/assets/JIANGNAN/xie_cj_d_xingfangde.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/JIANGNAN/xushouhui_zhaopusheng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/JIANGNAN/yang_zhou_yangxingmi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 15
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
        "/assets/JIANGNAN/yiyang_d_mengzongzheng.png": {
            "scale": 0.83,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/KOREA/__闲置__KOREA_01.png": {
            "scale": 1.28,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/KOREA/__闲置__KOREA_02.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/KOREA/chungju_d_quanli.png": {
            "scale": 1,
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
        "/assets/KOREA/goryeo_jiangganzan.png": {
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
        "/assets/KOREA/naju_d_wangjian_kr.png": {
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
        "/assets/KOREA/xuantu_yuangaisuwen.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -57
        },
        "/assets/LINGNAN/buyi_d_weichaoyuan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/cen_d_cenmeng.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/mi_chu_chuzhuangwang.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LINGNAN/chen_chenbaxian.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 24
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
        "/assets/LINGNAN/dayu_wangshouren.png": {
            "scale": 0.93,
            "offsetX": 1,
            "offsetY": -6
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
        "/assets/LINGNAN/paiwan_alugu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LINGNAN/guangzhou_liuyin.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/jing_dingbuling.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/yingqin/baiyang_mengtian.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/longwu_huangdaozhou.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/panjun/__闲置__PANJUN_01.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/LINGNAN/miao_qing_yangwanzhe.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/xianqin/linhu_zhaowulingwang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/LINGNAN/nanyue_zhaotuo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.07,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/panyao_panhu.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/LINGNAN/qian_songjingyang.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/LINGNAN/ryukyu_shangbazhi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
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
        "/assets/LINGNAN/taiping_shidakai.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/liuhan/guide_d_xiaohe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/LINGNAN/xinjiang_maji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/LINGNAN/yingzhou_liulong_ying.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/zhaosong/danyang_yuyunwen.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/__闲置__litang_01.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/litang/__闲置__litang_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/litang/__闲置__litang_03.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/__闲置__litang_05.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/litang/pingyuan_yanzhenqing.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/liuhan/suzhou_huoqubing.png": {
            "scale": 1.07,
            "offsetX": 1,
            "offsetY": -11
        },
        "/assets/liuhan/xianyu_hanxin.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -10
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
        "/assets/liuhan/__闲置__liuhan_02.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/liuhan/__闲置__liuhan_03.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/liuhan/__闲置__liuhan_04.png": {
            "scale": 1.3,
            "offsetX": 0,
            "offsetY": -74
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
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/liuhan/shuofang_weiqing.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": -10
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
        "/assets/NORTHEAST/yizhou_wanyanloushi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/manqing/__闲置__manqing_03.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/NORTHEAST/huimo_gaoyanshou.png": {
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
        "/assets/manqing/__闲置__manqing_07.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/wuji_yilizhi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTH/liangshidu_longjia.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/NORTH/liwang_liguangbi.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": -44
        },
        "/assets/NORTH/loufan_xuerengui.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
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
        "/assets/NORTH/shanrong_tianchou.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/NORTH/you_wangba.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/guzhu_tianyu.png": {
            "scale": 1.17,
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
        "/assets/NORTHEAST/hezhe_sharhuda.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/NORTHEAST/houliao_yelvliuge.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTHEAST/jilin_fujun.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/NORTHEAST/jilizhou_chengmingzhen.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -62
        },
        "/assets/NORTHEAST/jurchen_wanyanzongbi.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTHEAST/keerqin_aoba.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/NORTHEAST/kuye_kuye_qiuzhang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/NORTHEAST/mao_wenlong_maowenlong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 35
        },
        "/assets/NORTHEAST/maomingan_gentemuer.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/mohe_wanyanzonghan.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/nanai_zhahaluo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/NORTHEAST/nifuhe_barhudai.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/NORTHEAST/nuergan_kangwang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/NORTHEAST/qing_wanyanchenheshang.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -9
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
        "/assets/NORTHEAST/wuliangha_zhelemei.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/NORTHEAST/wure_wuzhaodu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/NORTHEAST/xiongding_murongyong.png": {
            "scale": 1.37,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/NORTHEAST/yehe_jintaiji.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/NORTHEAST/yeren_nvzhen_boke.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/NORTHEAST/yilou_naoya.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/NORTHEAST/yingzhou_ying_d_muronghuang.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/NORTHEAST/__闲置__NORTHEAST_02.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/STEPPE/xibo_d_zakulan.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/TIBET/nvguo_mojie.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/saman_yisimayi.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/NORTHEAST/dawoer_baldaqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/NORTHEAST/dongdan_yelvbei.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -39
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
        "/assets/NORTHEAST/ewenki_bombogor.png": {
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
        "/assets/panjun/jibei_xuxuan_cm.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/panjun/__闲置__PANJUN_14.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/panjun/__闲置__PANJUN_15.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/panjun/__闲置__PANJUN_17.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/panjun/__闲置__PANJUN_16.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 0
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
        "/assets/panjun/__闲置__PANJUN_03.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": 20
        },
        "/assets/panjun/baibo_guotai_bb.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": 20
        },
        "/assets/panjun/dashun_lizicheng.png": {
            "scale": 0.93,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/panjun/__闲置__PANJUN_02.png": {
            "scale": 1.17,
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
        "/assets/panjun/__闲置__PANJUN_07.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/panjun/__闲置__PANJUN_08.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/panjun/__闲置__PANJUN_09.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/panjun/__闲置__PANJUN_10.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/panjun/__闲置__PANJUN_12.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 33
        },
        "/assets/NORTHEAST/xianbei_tuobamao.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/__闲置__STEPPE_01.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
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
        "/assets/STEPPE/ashina_ashinayandu.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/STEPPE/b45b886b-2bd2-490c-b637-2be609461f8e.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/xianlingqiang_dianling.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/baidi_baidibushuai.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -5
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
        "/assets/STEPPE/bulat_boduanchaer.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/xiaobolu_meijinmang.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/buriat_tumenjiergale.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/chechen_chechenhanshuolei.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/TIBET/lopi_abo.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/STEPPE/chenli_d_wutang.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/STEPPE/dingling_dinglingwang.png": {
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
        "/assets/TIBET/gaoliang_fengang.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/geluolu_chisipijia.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/TIBET/golog_wandezhaxi.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/STEPPE/heisha_d_houlilu.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/lang_clan_jiangqujianzan.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/hongirad_dexuechan.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/STEPPE/huihu_dongmohedagan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/STEPPE/huyan_huyanwang.png": {
            "scale": 1.11,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/STEPPE/jalair_muhuali.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/TIBET/ali_gandancaiwang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/jiluo_d_douxian.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/TIBET/gongbu_gongbumangbuzhi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/kereyid_wanghan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/kiyad_yesugai.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/STEPPE/kumo_xiwanghuilibao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/TIBET/nandou_sushili.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/mengwu_hebulerhan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/STEPPE/merkit_tuoheituoa.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -28
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
        "/assets/STEPPE/ogodei_chuormahan.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/oirat_ming_gaerdan.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/TIBET/niang_suonanjiabo.png": {
            "scale": 0.89,
            "offsetX": 0,
            "offsetY": 32
        },
        "/assets/STEPPE/ongut_alagusi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/TIBET/xining_yangyingju.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/pugu_puguhuaien.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/STEPPE/pulei_dougu.png": {
            "scale": 1.41,
            "offsetX": 0,
            "offsetY": 42
        },
        "/assets/STEPPE/qidan_shulvping.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/TIBET/gaxa_zhashiduanzhubu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/yangguan_banyong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/STEPPE/rouran_shelun.png": {
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/shiwei_saigou.png": {
            "scale": 1.09,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/sunite_sunitezasake.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/TIBET/gongtang_gongtangang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/STEPPE/tatar_mieguzhen.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/tufa_d_tufanutan.png": {
            "scale": 0.84,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/STEPPE/tumed_andahan.png": {
            "scale": 0.81,
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
        "/assets/STEPPE/wala_yexian.png": {
            "scale": 1.13,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/TIBET/daca_dacajilong.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/STEPPE/wuhuan_tadun.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/WESTERN/qiuci_baiba.png": {
            "scale": 1.01,
            "offsetX": 0,
            "offsetY": -12
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
        "/assets/STEPPE/wuzhou_liguang.png": {
            "scale": 1.17,
            "offsetX": 0,
            "offsetY": 5
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
        "/assets/STEPPE/xiajiasi_are.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 40
        },
        "/assets/STEPPE/xingan_kalunshiwei.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 33
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
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/STEPPE/yaoluoge_yaoluogepusa.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/WESTERN/zhuxie_zhuxiechixin.png": {
            "scale": 1.03,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/STEPPE/yel_yelvxiuge.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/yuan_d_hubilie.png": {
            "scale": 1.13,
            "offsetX": 0,
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
        "/assets/STEPPE/yunzhong_tuobaliwei.png": {
            "scale": 0.78,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/tuyu_d_kualv.png": {
            "scale": 0.78,
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
        "/assets/STEPPE/zhasaketu_zhasaketuhan.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/STEPPE/zhuerqi_sachabieqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/STEPPE/zubu_mogusi.png": {
            "scale": 0.76,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/monpa_meireiluozhujiacuo.png": {
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
            "scale": 0.91,
            "offsetX": 0,
            "offsetY": 30
        },
        "/assets/TIBET/dulan_dashibatuer.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/TIBET/duomi_lunkongre.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -63
        },
        "/assets/TIBET/fuguo_yizeng.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/WESTERN/hepan_peishenfu.png": {
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
        "/assets/TIBET/jiashi_lixuance.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 16
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
        "/assets/WESTERN/weili_fan_d.png": {
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
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/khyungpo_qiongbobangse.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/TIBET/kongsa_kongsayiduo.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/TIBET/qifu_d_qifuchipan.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/TIBET/tubo_songzanganbu.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/TIBET/xiutu_xiutuwang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 7
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
        "/assets/WESTERN/chagatai_tuhulutiemuer.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/WESTERN/duerbote_duerbote_taiji.png": {
            "scale": 0.87,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/WESTERN/kala_satuke.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 37
        },
        "/assets/WESTERN/kepantuo_hanritianzhong.png": {
            "scale": 0.8,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/WESTERN/ruoqiang_ruoqiang_wang.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/tujishi_sulukehan.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/WESTERN/xiye_xiye_wang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/WESTERN/yiduhu_baershu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/wuzhou/__闲置__wuzhou_01.png": {
            "scale": 0.81,
            "offsetX": 0,
            "offsetY": -41
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
        "/assets/xianqin/__闲置__xianqin_03.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/xianqin/__闲置__xianqin_04.png": {
            "scale": 1.23,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/xianqin/__闲置__xianqin_05.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -43
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
        "/assets/xianqin/__闲置__xianqin_09.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/xianqin/__闲置__xianqin_11.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/xianqin/__闲置__xianqin_12.png": {
            "scale": 1.15,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/xianqin/heng1_limu_yanyue.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
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
        "/assets/yingqin/__闲置__yingqin_03.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 15
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
        "/assets/yingqin/__闲置__yingqin_07.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -42
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
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 13
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
        "/assets/zhaosong/__闲置__zhaosong_01.png": {
            "scale": 0.97,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/zhaosong/__闲置__zhaosong_02.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/zhaosong/__闲置__zhaosong_03.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhaosong/__闲置__zhaosong_04.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/zhaosong/__闲置__zhaosong_05.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/__闲置__zhaosong_06.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/zhaosong/__闲置__zhaosong_07.png": {
            "scale": 1.05,
            "offsetX": 0,
            "offsetY": 13
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
        "/assets/zhaosong/__闲置__zhaosong_10.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 0
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
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -39
        },
        "/assets/zhaosong/changshan_yanyangzhao.png": {
            "scale": 0.75,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/zhaosong/chaozhou_d_zhangshijie.png": {
            "scale": 1.25,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/CENTRAL/tongzhou_liuzhiyuan.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -4
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
