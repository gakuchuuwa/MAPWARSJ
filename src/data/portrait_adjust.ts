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
        "/assets/beifang/": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        }
    },
    "images": {
        "/public/assets/lingnan/quanzhou_liucongxiao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/panjun/panjun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/public/assets/litang/litang (1).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
        },
        "/public/assets/litang/litang (7).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/public/assets/wuzhou/wuzhou (5).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/public/assets/panjun/panjun.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/xianqin/shang_fuhao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/xianqin/06494f4e-1652-4c64-a3d3-998bb6bb4975.png": {
            "scale": 1.08,
            "offsetX": 20,
            "offsetY": 15
        },
        "/assets/xianqin/44fdf2e2-df61-4c29-a6af-99890e76b3b0.png": {
            "scale": 1.22,
            "offsetX": -22,
            "offsetY": -26
        },
        "/assets/litang/tang_lishimin.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/xianqin/3f98a47c-3b4e-43d9-ab99-234c592cffe3.png": {
            "scale": 1.34,
            "offsetX": 13,
            "offsetY": -48
        },
        "/assets/xianqin/b735288e-bbc4-4db6-ad6e-dbb20cce25bf.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/daming/JIANGNAN_garrison.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/daming/JIANGNAN_field.png": {
            "scale": 1.06,
            "offsetX": 23,
            "offsetY": 3
        },
        "/assets/lingnan/guangzhou (10).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/wuzhou/wuzhou (4).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/df3ef70b-7db7-4700-89e1-b9c6025946f7.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/wuzhou/wuzhou (5).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/xianqin/8990eebc-21d7-40ab-8210-09d8ac0b34a5.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/litang/9bdb090b-7d53-4505-9473-00cec58f8bfc.png": {
            "scale": 0.98,
            "offsetX": 12,
            "offsetY": -15
        },
        "/assets/liuhan/fb10c9aa-8eb8-4610-a183-8b9e881cf261.png": {
            "scale": 1.08,
            "offsetX": -1,
            "offsetY": 13
        },
        "/assets/wuzhou/fa0e668a-55d3-48d9-b187-7c7fe7bbf9ef.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/wuzhou/bec37b4e-ab28-4f6b-a087-30c961161a64.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/liuhan/yangshao_zhoubo.png": {
            "scale": 1.18,
            "offsetX": 13,
            "offsetY": -10
        },
        "/assets/zhaosong/9ff5b235-5237-437a-8f96-112418dc8dc9.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/wuzhou/6bb728f4-8ff4-4cec-b5b7-28cb80360bb8.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/xianqin/67c2db06-cd69-4858-b3ad-fbe9e431f8ff.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -37
        },
        "/assets/xianqin/yin_dixin.png": {
            "scale": 1.02,
            "offsetX": 20,
            "offsetY": -28
        },
        "/assets/wuzhou/202606220249.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/lingnan/a5ac03b7-537e-4b61-ac6c-d72802fd4c45.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/lingnan/guangzhou_liuyin.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/zhaosong/c371dc47-6b0a-4e7e-9f43-9243275f4695.png": {
            "scale": 1.04,
            "offsetX": 12,
            "offsetY": 7
        },
        "/assets/wuzhou/a8892658-cbc0-4154-8616-58004e4255cb.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/pugan/siam_nalixuan_pugan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/pugan/chenla_sheyebamoqishi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -47
        },
        "/assets/zhaosong/f53bb928-4883-449a-a3f8-0561299db673.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/daming/daming (1).png": {
            "scale": 1.18,
            "offsetX": 1,
            "offsetY": -31
        },
        "/assets/lingnan/guangzhou (1).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/wuzhou/wuzhou_d_wuzetian.png": {
            "scale": 1.44,
            "offsetX": 1,
            "offsetY": 23
        },
        "/assets/zhaosong/song_zhaokuangyin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/xianqin/wei_wuqi.png": {
            "scale": 1,
            "offsetX": 3,
            "offsetY": 25
        },
        "/assets/wuzhou/6f42fa26-9e0f-4686-87bb-8f82556d4b80.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/litang/litang (6).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/870c8498-a8c9-4925-95bf-323b7cc4f72c.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/daming/daming (4).png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/xianqin/chunshen_huangxie.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/lingnan/guangzhou (17).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/JIANGNAN/wuyue_qianliu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/xianqin/qi_sunbin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/litang/litang (8).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/xianqin/wu_sunwu.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/lingnan/guangzhou (18).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/lingnan/zhangshicheng_zhangshicheng.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/jinling_tandaoji.png": {
            "scale": 1.16,
            "offsetX": 19,
            "offsetY": -2
        },
        "/assets/pugan/basha_d_daogengmeng.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/daming/83fb0d0f-da4e-4240-8ad4-c46a12ed27e5.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 38
        },
        "/assets/lingnan/liulong.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/xianqin/lingqiu_zhaowuling.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/huaiyang_zhouyafu.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": 19
        },
        "/assets/daming/daming (5).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -45
        },
        "/assets/zhaosong/0184a5c3-ea67-4d73-a9d9-20a8105922d9.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/daming/hao_d_changyuchun.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/LINGNAN/guangzhou (14).png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/LINGNAN/dayue_chenguojun.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -53
        },
        "/assets/CENTRAL/ranwei_d_ranmin.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/liuhan/han_d_liubang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/BASHU/089ad521-126c-4013-8613-b5f52b8b674e.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/CENTRAL/bing_liukun.png": {
            "scale": 0.9,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/litang/qianzhou_lisheng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL/202606222015.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/CENTRAL/c8c18fd5-7364-4e09-85a1-eebd5888a51a.png": {
            "scale": 1,
            "offsetX": 17,
            "offsetY": -12
        },
        "/assets/NORTHEAST/b71a7bf5-7df4-42b8-8efa-2189d1e483c8.png": {
            "scale": 1,
            "offsetX": 13,
            "offsetY": 22
        },
        "/assets/NORTHEAST/ce103278-4b8d-499e-910e-f49a85ada894.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/nguyen_guangnan_ruanfuying.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/LINGNAN/zhangshicheng_zhangshicheng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/STEPPE/STEPPE_field.png": {
            "scale": 1,
            "offsetX": 1,
            "offsetY": -16
        },
        "/assets/NORTH/chuanshu (8).png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/litang/pingyuan_yanzhenqing.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/yingqin/shangzhou_shangyang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/litang/wuzhou_d_wangxiaojie.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/CENTRAL/pizhou_lvbu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL/xinping_haozhao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/yingqin/xin_baiqi.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/litang/dingxiang_d_lijing.png": {
            "scale": 1.06,
            "offsetX": 3,
            "offsetY": -23
        },
        "/assets/LINGNAN/linyi_fanyangmai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/guangzhou/zhancheng_zhimin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/CENTRAL/weihaiwei_sudingfang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/NORTH/yang_aner_yanganer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/LINGNAN/yang_aner_yanganer.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/assets/xianqin/jiaodong_tiandan.png": {
            "scale": 1.1,
            "offsetX": 5,
            "offsetY": 13
        },
        "/assets/daming/zu_d_zudashou.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/manqing/df9c8961-f32f-4683-abbf-b39bbc77589b.png": {
            "scale": 1.1,
            "offsetX": 1,
            "offsetY": -55
        },
        "/assets/CENTRAL/zhuozhou_anlushan.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/NORTH/hejian_gongsunzan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -29
        },
        "/assets/NORTH/huo_huoshuchu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL/yanchuan_d_hanyu.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/xianqin/linhu_zhaowulingwang.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 18
        },
        "/assets/STEPPE/tuva_qinggunzabu.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 40
        },
        "/assets/CENTRAL/yaozhou_limaozhen.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/daming/xuan_mafang.png": {
            "scale": 1.12,
            "offsetX": 11,
            "offsetY": -5
        },
        "/assets/NORTH/liang_d_zhangxun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/NORTH/liwang_liguangbi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/LINGNAN/nong2_nongzhigao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/CENTRAL/tongzhou_yangzhiji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL/hongnong_jun_yangsu.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/DIANQIAN/luchuan_sirenfa.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -66
        },
        "/assets/DIANQIAN/pagan_anuluvtuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/DIANQIAN/DIANQIAN_garrison.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/HEXI/876acf9f-39dc-409d-a3d3-ac6bba9b5ba1.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/HEXI/chijin_qiewangshijia.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -31
        },
        "/assets/xianqin/9649709f-e69e-4204-9504-8062a0dfe916.png": {
            "scale": 1.1,
            "offsetX": -1,
            "offsetY": -13
        },
        "/assets/zhaosong/zaoyang_d_menggong.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": 19
        },
        "/assets/xianqin/han_baoyuan_han.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/LINGNAN/taiping_shidakai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/zhaosong/xiangzhou_lvwenhuan.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/HEXI/dai_d_tuobashiyijian.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/changshan_yanyangzhao.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/BASHU/shu_zhugeliang.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/zhaosong/9c7d1733-2f44-495c-a0fb-0b6748d2582d.png": {
            "scale": 1.2,
            "offsetX": 16,
            "offsetY": -23
        },
        "/assets/BASHU/chu_guanyu.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/BASHU/chuanshu (4).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/NORTH/jingmen_zhaoyun.png": {
            "scale": 1.02,
            "offsetX": 14,
            "offsetY": -27
        },
        "/assets/xianqin/jin_xianzhen.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/liuhan/guangwu_xinwuxian.png": {
            "scale": 0.98,
            "offsetX": 22,
            "offsetY": 15
        },
        "/assets/DIANQIAN/luoyue_zhengce.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/CENTRAL/long2_weixiaokuan.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/yingqin/qin_yingji.png": {
            "scale": 1.22,
            "offsetX": 14,
            "offsetY": -2
        },
        "/assets/xianqin/zhou_jifa.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -5
        },
        "/assets/CENTRAL/tianxiong_tianchengsi.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/CENTRAL/jibei_xuxuan_cm.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 9
        },
        "/assets/xianqin/ab7ba318-efa4-4767-ace6-7e4b458d1bd8.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/CENTRAL/huangfu_huangfusong.png": {
            "scale": 0.94,
            "offsetX": 1,
            "offsetY": -23
        },
        "/assets/BASHU/qiuchi_yangnandang.png": {
            "scale": 0.92,
            "offsetX": 3,
            "offsetY": -16
        },
        "/assets/BASHU/wudu_zhangyi.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/NORTH/dangzhou_dengai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/daming/ming_zheng_zhengchenggong.png": {
            "scale": 1.08,
            "offsetX": 14,
            "offsetY": 0
        },
        "/assets/LINGNAN/paiwan_alugu.png": {
            "scale": 1,
            "offsetX": 3,
            "offsetY": 19
        },
        "/assets/panjun/baibo_guotai_bb.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/daming/huai_zhuyuanzhang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/HEXI/fushi_fuhong.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/yingqin/ruo_wangjian.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/xianqin/5e76a0e8-511e-4986-8fc9-7cb393b4c278.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/LINGNAN/luoping_zhangshijie.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 22
        },
        "/assets/CENTRAL/tongma_liuang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/NORTH/mushi_muchong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/STEPPE/wuzhou_liguang.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/yingqin/qin_baiqi_yingqin.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 10
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
        "/assets/daming/linyu_wusangui.png": {
            "scale": 1.08,
            "offsetX": 17,
            "offsetY": -3
        },
        "/assets/daming/jinzhou_lichengliang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -56
        },
        "/assets/STEPPE/dada_ming_dayanhan.png": {
            "scale": 1,
            "offsetX": 13,
            "offsetY": 44
        },
        "/assets/xianqin/heng1_limu_yanyue.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/zhaosong/changshaguo_xinqiji.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/LINGNAN/chen2_zhaofan.png": {
            "scale": 1.02,
            "offsetX": 18,
            "offsetY": -33
        },
        "/assets/zhaosong/282b05c2-3ce0-4742-bffa-155896cd8c0b.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/daming/yi_yuqian.png": {
            "scale": 0.98,
            "offsetX": 9,
            "offsetY": 5
        },
        "/assets/litang/liang_d_zhangxun.png": {
            "scale": 0.98,
            "offsetX": 14,
            "offsetY": -16
        },
        "/assets/CENTRAL/lu_zhangliao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/JIANGNAN/wuwu_d_lvmeng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/zhaosong/danyang_yuyunwen.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/CENTRAL/jinan_tiexuan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -52
        },
        "/assets/CENTRAL/kong_d_kongrong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL/wang_d_wangdao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/ruzhou_sunjian.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTH/dizhou_wangyanzhang.png": {
            "scale": 1,
            "offsetX": 6,
            "offsetY": 3
        },
        "/assets/JIANGNAN/chizhou_wumingche.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/NORTH/xiangzhou_lvwenhuan.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -46
        },
        "/assets/DIANQIAN/suke_langanheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/DIANQIAN/hantawadi_mangyinglong.png": {
            "scale": 0.98,
            "offsetX": 3,
            "offsetY": -37
        },
        "/assets/JIANGNAN/zhong_xiexuan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/CENTRAL/bozhou_d_luzhonglian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/panjun/chimei_fanchong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/CENTRAL/a01e6363-6772-42fc-b127-26bb6a5b2c3b.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/CENTRAL/3c696cd7-9525-4911-a71f-f35bb3aeffc8.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL/5644c5a9-47e1-4f15-9f99-0e89239b8174.png": {
            "scale": 0.88,
            "offsetX": 5,
            "offsetY": -17
        },
        "/assets/litang/jinling_tandaoji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/yingqin/qin_wangjian.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL/cai_lisu.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -27
        },
        "/assets/CENTRAL/mi_mizhu.png": {
            "scale": 1,
            "offsetX": -2,
            "offsetY": 10
        },
        "/assets/CENTRAL/aff99320-ad86-4f44-88aa-0831cd9a184a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/STEPPE/choros_tuohuan.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/daming/suzhou_d_shikefa.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/CENTRAL/955a8b89-4e95-41fc-9a37-962c1e784140.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/LINGNAN/gouding_wubo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/liuhan/lulin_liuxiu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/CENTRAL/52602539-f95b-4ef3-aeec-2bf4422fe284.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/HEXI/ffe5bdee-035f-40bd-bcd1-3443fb18abcf.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/zhaosong/yue_d_yuefei.png": {
            "scale": 1.16,
            "offsetX": 4,
            "offsetY": -28
        },
        "/assets/LINGNAN/guangzhou (13).png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/DIANQIAN/champa_zhipenge.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/xianqin/e5dd503b-d39f-47aa-9da3-61ccafd8e6b3.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/JIANGNAN/chu_guanyu.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/daming/qi_d_qijiguang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/HEXI/erzhu_erzhurong.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/daming/ming_d_zhudi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/NORTH/shanrong_tianchou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/DIANQIAN/shuizhen_oudaren.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/zhaosong/fa0bacfd-fd3e-47e5-90a3-4c9fe455dc8c.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/HEXI/99eee902-accd-4cca-896b-d920a844cec5.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/litang/lingwu_guoziyi.png": {
            "scale": 1.06,
            "offsetX": 11,
            "offsetY": -1
        },
        "/assets/HEXI/dangxiang_liyuanhao.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/HEXI/bc4ded43-19e9-4a40-a66a-2c885eaec13f.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/WESTERN/yuchi_weichiyao.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/WESTERN/352cfbef-fdfc-48b5-95db-5d153aecf86c.png": {
            "scale": 1,
            "offsetX": 15,
            "offsetY": 33
        },
        "/assets/WESTERN/1c09a582-249b-4c9c-8abe-f848202317c3.png": {
            "scale": 1.02,
            "offsetX": 1,
            "offsetY": -39
        },
        "/assets/STEPPE/6f504870-5f93-466a-a1fb-ad9d24f63e97.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/DIANQIAN/luohu_ganmuding.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -42
        },
        "/assets/liuhan/xiyuduhu_banchao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/JAPAN/99a7e3c3-8c30-490a-bfba-ce8b65871355.png": {
            "scale": 1,
            "offsetX": 24,
            "offsetY": -41
        },
        "/assets/JAPAN/8492e8a5-6f27-4f6d-987a-0c5f68a923c6.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/DIANQIAN/jingdong_taohong.png": {
            "scale": 0.94,
            "offsetX": 1,
            "offsetY": -31
        },
        "/assets/DIANQIAN/DIANQIAN_field (1).png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/KOREA/chen3_chenwang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/KOREA/joseon_lichenggui.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/TIBET/kalun_dexinga.png": {
            "scale": 1,
            "offsetX": 13,
            "offsetY": 4
        },
        "/assets/WESTERN/7c3d29fa-b2d4-4788-abc0-0f435051577f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/TIBET/dianmian (3).png": {
            "scale": 0.96,
            "offsetX": 13,
            "offsetY": -30
        },
        "/assets/BASHU/qinghai_yuezhongqi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/manqing/qinghai_yuezhongqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/CENTRAL_ASIA/an_anuluvtuo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL_ASIA/tiemuer_tiemuer.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/JAPAN/ashikaga_zulijunshi.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/JAPAN/3efc90e2-6cbc-4d62-8c2b-687560468b96.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": 27
        },
        "/assets/NORTHEAST/xiongding_murongyong.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/HEXI/liangzhou_zhanggui.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/WESTERN/7031c3d2-86e4-4b75-b80d-362d4244360a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/STEPPE/5d837752-9095-4a31-b2df-39a00ebda8d0.png": {
            "scale": 0.88,
            "offsetX": 1,
            "offsetY": 26
        },
        "/assets/TIBET/gar_lunqinling.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/TIBET/9b95efa5-c83c-4fe1-8acf-33b7ddf9da8a.png": {
            "scale": 1.16,
            "offsetX": 4,
            "offsetY": -70
        },
        "/assets/TIBET/7434c051-066c-4241-9a8d-4ff860b8ac54.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 19
        },
        "/assets/HEXI/b75ffcdd-a97e-4525-8b0c-af5f10f39737.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -15
        },
        "/assets/litang/shazhou_zhangyichao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/STEPPE/yunzhong_tuobaliwei.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/TIBET/yangtong_chisongdezan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -66
        },
        "/assets/daming/jinan_tiexuan.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -54
        },
        "/assets/CENTRAL/guotai.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/panjun/jibei_xuxuan_cm.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/HEXI/yingli_jilasiyi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/STEPPE/yuan_d_hubilie.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/liao_d_yelvabaoji.png": {
            "scale": 1.1,
            "offsetX": 12,
            "offsetY": -10
        },
        "/assets/BASHU/ba_bamanzi.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/LINGNAN/a5ac03b7-537e-4b61-ac6c-d72802fd4c45.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -34
        },
        "/assets/KOREA/baiji_jiebai.png": {
            "scale": 1.1,
            "offsetX": 11,
            "offsetY": -7
        },
        "/assets/JAPAN/edo_dechuangjiakang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JAPAN/kai_wutianxinxuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/JAPAN/edo_dechuangjiakang_old.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -39
        },
        "/assets/WESTERN/xiye_xiye_wang.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/CENTRAL_ASIA/5d913217-cc43-4452-80a8-e1962469e756.png": {
            "scale": 1.16,
            "offsetX": 17,
            "offsetY": -6
        },
        "/assets/WESTERN/31ba4e35-8e16-4d51-96a9-d28a849ef250.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/CENTRAL/dang_d_zhuwen.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/CENTRAL/limi.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/litang/cai_lisu.png": {
            "scale": 1.22,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/yingzhou_d_liuqi.png": {
            "scale": 1.08,
            "offsetX": -1,
            "offsetY": -30
        },
        "/assets/zhaosong/6690f9ed-2bf2-4f83-a67b-7daf83414053.png": {
            "scale": 1.14,
            "offsetX": 15,
            "offsetY": -36
        },
        "/assets/STEPPE/menggu_d_chengjisihan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -43
        },
        "/assets/WESTERN/shule_aersilan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/_fallback__WESTERN.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/litang/juandu_peixingjian.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL_ASIA/jiazini_mahamaode.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/CENTRAL_ASIA/guishuang_jianisejia.png": {
            "scale": 0.96,
            "offsetX": 1,
            "offsetY": -33
        },
        "/assets/JAPAN/higo_d_juchiwuguang.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/KOREA/gaogouli_yizhiwende.png": {
            "scale": 1.32,
            "offsetX": -5,
            "offsetY": 0
        },
        "/assets/WESTERN/0a595c38-ee4c-421e-9dd4-abbfa94bee13.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/WESTERN/47da037a-bed1-46fb-9525-f068ae398bc1.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/KOREA/9086a76e-d852-4f34-b64d-7967bb33a295 (1).png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/KOREA/KOREA_garrison.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/borjigin_tuolei.png": {
            "scale": 0.96,
            "offsetX": 11,
            "offsetY": 29
        },
        "/assets/WESTERN/wulianghai_chelingwubashi.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/DIANQIAN/pyu_molingtuo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/DIANQIAN/baiman_gaoshengtai.png": {
            "scale": 0.96,
            "offsetX": 2,
            "offsetY": -38
        },
        "/assets/LINGNAN/dacheng_chenkai.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -55
        },
        "/assets/LINGNAN/muong_shencongyue.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/LINGNAN/chendiaoyan_chendiaoyan.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/BASHU/chuanshu (6).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/WESTERN/anduo.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/WESTERN/chuyue_shatuonasu.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/huige_gulipeiluo.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/STEPPE/ongut_alagusi.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/NORTHEAST/xianbei_tuobamao.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/NORTHEAST_field.png": {
            "scale": 1.12,
            "offsetX": -10,
            "offsetY": 9
        },
        "/assets/NORTHEAST/8ee22c66-e8b5-4afb-b485-cce206a7294e.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/zhaosong/df1ce03d-c34f-48d1-a9d7-d19d8473fce9.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/HEXI/lushui_beigongboyu.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -12
        },
        "/assets/HEXI/00a13536-5672-425b-b000-8540256a6813.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/BASHU/chu_xiangyu.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/STEPPE/d20060f4-1180-44b4-a1f1-47025dc34e22.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/WESTERN/anxi_guoxin.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/WESTERN/aluoduo.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL_ASIA/30c9780d-5598-4f67-a7c5-28b4e9ce84aa.png": {
            "scale": 1.04,
            "offsetX": 15,
            "offsetY": 15
        },
        "/assets/CENTRAL_ASIA/badakhshan_luozhentan.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/lizhou_d_wulin.png": {
            "scale": 1.24,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/CENTRAL/cao_d_caocao.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/LINGNAN/guangzhou (17).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -9
        },
        "/assets/LINGNAN/baoli.png": {
            "scale": 1,
            "offsetX": 14,
            "offsetY": -10
        },
        "/assets/TIBET/bailang_tangzeng.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/TIBET/5c086552-ed86-4fc7-8339-fdb609df43b1.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/TIBET/_fallback__TIBET.png": {
            "scale": 1,
            "offsetX": 15,
            "offsetY": 17
        },
        "/assets/DIANQIAN/dali_duansiping.png": {
            "scale": 0.94,
            "offsetX": 3,
            "offsetY": 13
        },
        "/assets/TIBET/206f97da-3d4f-4007-a2b9-b32f1a1a92e9.png": {
            "scale": 1.2,
            "offsetX": 11,
            "offsetY": -31
        },
        "/assets/WESTERN/367fc820-6671-4afe-80d1-46043d3ac57e.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/CENTRAL_ASIA/b3ae318a-bdaf-49f7-8bc0-e088e15ad87c.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/CENTRAL_ASIA/d99729ae-3b62-4336-8a80-450022490d6e.png": {
            "scale": 1.06,
            "offsetX": 16,
            "offsetY": -17
        },
        "/assets/CENTRAL_ASIA/aba_shapuer.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/NORTHEAST/aola_menglielun.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/NORTHEAST/fuyu_weichoutai.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/dajin_wanyanaguda.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/72a3371c-29e6-4319-bbd7-1ed93aedb2b3.png": {
            "scale": 0.94,
            "offsetX": 6,
            "offsetY": -23
        },
        "/assets/TIBET/ced868fb-1d60-44d4-8d8e-a5b67a8a1109.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -32
        },
        "/assets/CENTRAL/37f49d28-6658-49eb-b2aa-ec1d3f27df89.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/xianqin/dongxian_sunbin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/BASHU/zhuoshi_zhuowangsun.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/xianqin/shen_shenbo.png": {
            "scale": 1.18,
            "offsetX": 24,
            "offsetY": 11
        },
        "/assets/panjun/dashun_lizicheng.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/JIANGNAN/wenzhou_zhangcong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -7
        },
        "/assets/JIANGNAN/gumie_liuyu.png": {
            "scale": 1,
            "offsetX": 9,
            "offsetY": -8
        },
        "/assets/LINGNAN/ada8c754-f07f-4f75-91e8-8145c10aaa58.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 23
        },
        "/assets/NORTHEAST/qing_wanyanchenheshang.png": {
            "scale": 1.16,
            "offsetX": -14,
            "offsetY": -7
        },
        "/assets/STEPPE/kelie_zhaheganbu.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": 0
        },
        "/assets/panjun/bailian_liufutong.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/panjun/a19a176d-0e0e-474e-8432-9885166629b3.png": {
            "scale": 0.9,
            "offsetX": 9,
            "offsetY": -14
        },
        "/assets/NORTHEAST/4111cad4-9b63-4316-933a-dd2b3915259f.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 15
        },
        "/assets/KOREA/6cdd4646-c2b8-43d4-898b-cb954e0e7dfd.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/zhaosong/605ec3ae-1447-43bc-a07f-cd8aa64e90cb.png": {
            "scale": 1.12,
            "offsetX": 7,
            "offsetY": -24
        },
        "/assets/JIANGNAN/e77548d8-eaf3-4324-807b-023a328e7711.png": {
            "scale": 0.92,
            "offsetX": 3,
            "offsetY": -6
        },
        "/assets/JIANGNAN/qian_d_yudayou.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/CENTRAL/9868e5c5-c87d-4ecf-9001-0cbb23950165.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/NORTHEAST/eluoke_amuhar.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 11
        },
        "/assets/NORTHEAST/jilimi_takuna.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 6
        },
        "/assets/zhaosong/huan_zhongshidao.png": {
            "scale": 1.1,
            "offsetX": 14,
            "offsetY": -9
        },
        "/assets/CENTRAL_ASIA/seljuq_sangjiaer.png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/xianqin/yue_goujian.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/JIANGNAN/202606220310.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/JAPAN/7240bef9-e904-41d3-a8e5-58f324a3755d.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -33
        },
        "/assets/LINGNAN/415f26e1-3c4c-4485-b02c-d0f0de1cabf1.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/pugan/chenla_sheyebamoqishi_202606250402.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -50
        },
        "/assets/DIANQIAN/mon_monuhe.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/JAPAN/cb21e44c-7857-4cea-b20d-0fb0f26768c7.png": {
            "scale": 0.98,
            "offsetX": 6,
            "offsetY": -10
        },
        "/assets/JAPAN/726010d3-3b61-4928-8d2c-89ea4d9990f4.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/LINGNAN/guangzhou (20).png": {
            "scale": 0.88,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/JAPAN/jinchuan_jinchuanyiyuan_prev_20260624115718.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/JAPAN/benduozhongsheng.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": -23
        },
        "/assets/CENTRAL/chanzhou_chairong.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/CENTRAL/qi_sachabieqi.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/112b2473-f1c7-4092-89b4-307fa0e5e832.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 7
        },
        "/assets/CENTRAL_ASIA/76fff827-8a4e-486c-bde6-8315f6a535a6.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/manqing/manzhou_nuerhachi.png": {
            "scale": 1.1,
            "offsetX": 9,
            "offsetY": -53
        },
        "/assets/manqing/aisin_d_huangtaiji.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/CENTRAL_ASIA/202606220324.png": {
            "scale": 1.16,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/yingqin/qin_mengtian.png": {
            "scale": 1.08,
            "offsetX": 5,
            "offsetY": 5
        },
        "/assets/HEXI/5175fe4a-89ae-425d-887d-d2cbc8020eb0.png": {
            "scale": 0.92,
            "offsetX": 7,
            "offsetY": 31
        },
        "/assets/STEPPE/0ffaf7ae-df77-4f4a-87df-2809ccbf6d2b.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 26
        },
        "/assets/CENTRAL_ASIA/bc9cf911-a04c-49aa-aed9-bb6541ec3a47.png": {
            "scale": 0.92,
            "offsetX": -1,
            "offsetY": -61
        },
        "/assets/xianqin/aee63f48-fd2d-4330-8102-8542f0919e4a.png": {
            "scale": 1.12,
            "offsetX": 14,
            "offsetY": 11
        },
        "/assets/TIBET/8bad9151-8fb5-463d-a429-57bd5bed52ce.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": -36
        },
        "/assets/JAPAN/so_zongyizhi.png": {
            "scale": 1.12,
            "offsetX": 22,
            "offsetY": -8
        },
        "/assets/STEPPE/pugu_ashinagudulu.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 14
        },
        "/assets/STEPPE/e0387158-f4cf-4ef6-abb2-91addd2bb6de.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/BASHU/fu_zhou_yanyan.png": {
            "scale": 1.26,
            "offsetX": 0,
            "offsetY": 27
        },
        "/assets/manqing/manzhou_d_duergan.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/LINGNAN/chaozhou_d_zhangshijie.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": 24
        },
        "/assets/TIBET/ladakh_senggelangjie.png": {
            "scale": 0.86,
            "offsetX": 0,
            "offsetY": 29
        },
        "/assets/liuhan/lanzhou_zhaochongguo.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/CENTRAL_ASIA/d2b49090-81ea-4f84-82fa-5bb0a919417d.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -35
        },
        "/assets/panjun/bailian_wangconger.png": {
            "scale": 1.34,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/liuhan/48e9f1ec-e92d-4366-ae24-5996ab67e993.png": {
            "scale": 1.2,
            "offsetX": 17,
            "offsetY": -29
        },
        "/assets/WESTERN/_fallback_WESTERN.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/STEPPE/66bc193b-5996-48a3-8bf0-5bc0d5c4199b.png": {
            "scale": 1.06,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/STEPPE/tiele_qibiheli.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/STEPPE/476adb25_202606250402s.png": {
            "scale": 0.94,
            "offsetX": 2,
            "offsetY": -30
        },
        "/assets/NORTHEAST/bohai_dazuorong.png": {
            "scale": 0.98,
            "offsetX": 8,
            "offsetY": -21
        },
        "/assets/KOREA/ce8ecbe9-eea1-496c-9361-d0d61180181b.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/zhaosong/72213c30-820c-40ef-976e-46d54afc8752.png": {
            "scale": 0.84,
            "offsetX": 6,
            "offsetY": -22
        },
        "/assets/CENTRAL_ASIA/de6da219-2566-4aa3-8397-079a56635d73.png": {
            "scale": 1.18,
            "offsetX": 0,
            "offsetY": 16
        },
        "/assets/WESTERN/keerkezi_manasi.png": {
            "scale": 1.06,
            "offsetX": 17,
            "offsetY": -17
        },
        "/assets/HEXI/112a53e1-97c4-4d9f-ae1e-dc0bb44216f4.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhaosong/kang_liangshidu.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": -6
        },
        "/assets/STEPPE/62534e31-f1d2-4493-b6e8-c3e33f9a90b1.png": {
            "scale": 1.02,
            "offsetX": 1,
            "offsetY": -24
        },
        "/assets/STEPPE/naiman_taiyanghan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/STEPPE/11536a0c-a188-4ebe-aefb-db72c10e91a1.png": {
            "scale": 0.96,
            "offsetX": 9,
            "offsetY": 26
        },
        "/assets/xianqin/huang_d_sunshuao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -40
        },
        "/assets/xianqin/44287ce1-8d69-4277-a3d7-b605766352c5.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -36
        },
        "/assets/JIANGNAN/7ce228af-981d-465e-90dd-06cb4391216f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -25
        },
        "/assets/DIANQIAN/dai_daoyingmeng.png": {
            "scale": 1.02,
            "offsetX": 8,
            "offsetY": -38
        },
        "/assets/BASHU/chuanshu (2).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/NORTH/5bb1ec5e-77cd-4653-a46d-0e2656215b84.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/panjun/3112895c-8953-4834-bd6f-808bf18f51cd.png": {
            "scale": 1.02,
            "offsetX": 5,
            "offsetY": 16
        },
        "/assets/STEPPE/d4645bb0-64db-4f7d-84d8-e4d664fa6cbe.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/BASHU/qingyi_qingyiwang.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/STEPPE/baidi_baidibushuai.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/WESTERN/xiliao_yelvdashi.png": {
            "scale": 1.14,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/liuhan/xijue_ganshouchang.png": {
            "scale": 1.08,
            "offsetX": 12,
            "offsetY": 20
        },
        "/assets/BASHU/yangzhou_wangping.png": {
            "scale": 1.12,
            "offsetX": -1,
            "offsetY": -18
        },
        "/assets/JIANGNAN/chu_guanyu_202606250402.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -30
        },
        "/assets/JAPAN/786f74f8-246b-4e03-9d3c-ccd958d8b1fd.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/JIANGNAN/hongzhou_zhuwenzheng.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/JIANGNAN/linshihong_linshihong.png": {
            "scale": 1.06,
            "offsetX": 7,
            "offsetY": 17
        },
        "/assets/BASHU/chenghan_lite.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/JAPAN/date_d_yidazhengzong.png": {
            "scale": 1.02,
            "offsetX": 7,
            "offsetY": -15
        },
        "/assets/TIBET/_fallback_TIBET.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/litang/zhongshan_yangaoging.png": {
            "scale": 0.98,
            "offsetX": 12,
            "offsetY": -15
        },
        "/assets/JAPAN/c67e7a78-cfaf-451c-8592-40e971a2d329.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -41
        },
        "/assets/NORTH/lai_wangshifan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -6
        },
        "/assets/NORTH/huo_songlaosheng.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/JIANGNAN/chuzhou_d_dugao.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/LINGNAN/guangping_ruanwenzhang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/BASHU/shu_liubei.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/NORTHEAST/dongdan_yelvbei.png": {
            "scale": 1.08,
            "offsetX": -10,
            "offsetY": -44
        },
        "/assets/KOREA/zhen_zhenxuan.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/STEPPE/kumoxi_ahuihui.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/liuhan/zhi_state_caocan.png": {
            "scale": 1.2,
            "offsetX": 0,
            "offsetY": -26
        }
    },
    "folderGuides": {
        "/assets/hexi/": {
            "samplePath": "/assets/hexi/04919ff4-54ff-4c95-861b-94d651e8701f.png",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/beifang/": {
            "samplePath": "/assets/beifang/04919ff4-54ff-4c95-861b-94d651e8701f.png",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/riben/": {
            "samplePath": "/assets/riben/totomi_sakaitadatsugu.png",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        },
        "/assets/yingqin/": {
            "samplePath": "/assets/yingqin/xirong.png",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        }
    }
};
