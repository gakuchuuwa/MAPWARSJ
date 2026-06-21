/**
 * 立绘显示调校：文件夹默认 + 单张覆盖 + 调校尺（样片/标线）
 * 由 PortraitTuner（/portrait-tuner.html）维护；CombatUI 仅读取 folders / images。
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
        "/assets/beifang/112a53e1-97c4-4d9f-ae1e-dc0bb44216f4.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -13
        },
        "/assets/beifang/335f4bac-7b3f-4918-bf3b-8b3fe2d23373.png": {
            "scale": 0.95,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/beifang/99eee902-accd-4cca-896b-d920a844cec5.png": {
            "scale": 0.95,
            "offsetX": 4,
            "offsetY": -4
        },
        "/assets/beifang/a8ced949-fe26-46a2-bdcf-5c8b2e1a9ab3.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/beifang/5f55acfa-9b30-440e-a930-8314f33a7be2.png": {
            "scale": 0.95,
            "offsetX": 10,
            "offsetY": -5
        },
        "/assets/beifang/40d3b115-7886-4529-ae47-73788051e1c3.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -10
        },
        "/assets/beifang/04919ff4-54ff-4c95-861b-94d651e8701f.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/beifang/5cd26a8b-9837-4a3e-8a08-27599618f8e2.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -22
        },
        "/assets/riben/06a6555d-67de-4959-8dce-9a890c7c70bd.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/assets/riben/23580f3f-dee5-42ac-8ff7-fb9037b645b1.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/riben/3efc90e2-6cbc-4d62-8c2b-687560468b96.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/riben/4119c0e6-71b4-488a-85b9-2ea6a6a61087.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -8
        },
        "/assets/qin/baiqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/assets/qin/qinjiang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 10
        },
        "/public/assets/lingnan/quanzhou_liucongxiao.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/panjun/panjun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/public/assets/litang/litang (1).png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -7
        },
        "/public/assets/zhongyuan/9ce2262a-f91f-4367-8d70-7b9548788156.png": {
            "scale": 0.99,
            "offsetX": 0,
            "offsetY": 18
        },
        "/public/assets/litang/litang (7).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/public/assets/zhongyuan/37f49d28-6658-49eb-b2aa-ec1d3f27df89.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 25
        },
        "/public/assets/wuzhou/wuzhou (5).png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/public/assets/zhongyuan/5d03016a-3228-4c25-b871-332f97bc15b3.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/public/assets/zhongyuan/CENTRAL_garrison.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": 13
        },
        "/public/assets/zhongyuan/e7fcf159-f365-48a8-9c8d-e344fbc93d35.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/public/assets/zhongyuan/47d98392-6b34-4087-aaa2-d972594d5fa1.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -9
        },
        "/public/assets/zhongyuan/b6171829-5227-4837-8cd6-870fd2039c68.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/public/assets/panjun/panjun.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -13
        },
        "/public/assets/riben/3efc90e2-6cbc-4d62-8c2b-687560468b96.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": 27
        },
        "/public/assets/riben/7240bef9-e904-41d3-a8e5-58f324a3755d.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/public/assets/dongbei/df9c8961-f32f-4683-abbf-b39bbc77589b.png": {
            "scale": 1.08,
            "offsetX": -12,
            "offsetY": -40
        },
        "/public/assets/dongbei/NORTHEAST_field.png": {
            "scale": 1.04,
            "offsetX": -12,
            "offsetY": 18
        },
        "/public/assets/panjun/f22e8a3e-f4f3-43f9-b776-54e36eba58fe.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 1
        },
        "/public/assets/litang/litang (5).png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 7
        },
        "/public/assets/zhongyuan/aa5cf86c-cf24-46d1-9e00-e646972e7992.png": {
            "scale": 0.94,
            "offsetX": 4,
            "offsetY": -18
        },
        "/public/assets/zhongyuan/0f046975-f45a-4653-9cb8-b3a52391458e.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/public/assets/zhongyuan/9868e5c5-c87d-4ecf-9001-0cbb23950165.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/public/assets/riben/c67e7a78-cfaf-451c-8592-40e971a2d329.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -30
        },
        "/public/assets/riben/857f35ee-4144-4b76-af60-f059b79b7064.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 11
        },
        "/public/assets/riben/e1c43fe5-ca7a-4bb9-88bb-78dab712fa60.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 6
        },
        "/public/assets/riben/42a245b0-9213-4bc7-9f23-755037b5325a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -18
        },
        "/public/assets/riben/a0a2d446-cac2-4389-878b-b10df25f98c3.png": {
            "scale": 1.02,
            "offsetX": 15,
            "offsetY": -35
        },
        "/public/assets/zhongyuan/56670b99-112e-48d5-932f-b48b3017cf55.png": {
            "scale": 1.04,
            "offsetX": 18,
            "offsetY": 14
        },
        "/public/assets/zhongya/e7a82f49-2f9f-45c6-bdd9-1b5221ad376a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/public/assets/zhongya/CENTRAL_ASIA_garrison.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 15
        },
        "/public/assets/zhongya/jiazini_mahamaode.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/xianqin/fuhao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/public/assets/zhongyuan/bing_liukun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
        },
        "/assets/xianqin/shang_fuhao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -19
        },
        "/assets/xianqin/06494f4e-1652-4c64-a3d3-998bb6bb4975.png": {
            "scale": 1.08,
            "offsetX": 20,
            "offsetY": 15
        },
        "/assets/zhongyuan/a01e6363-6772-42fc-b127-26bb6a5b2c3b.png": {
            "scale": 1,
            "offsetX": 13,
            "offsetY": -2
        },
        "/assets/zhongyuan/wei_wuqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/wuzhou/wuzhou_d_wangxiaojie.png": {
            "scale": 1,
            "offsetX": 5,
            "offsetY": 13
        },
        "/assets/xianqin/44fdf2e2-df61-4c29-a6af-99890e76b3b0.png": {
            "scale": 1.18,
            "offsetX": -11,
            "offsetY": -16
        },
        "/assets/zhongyuan/qi_sachabieqi.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 3
        },
        "/assets/zhongyuan/liang_d_zhangxun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -27
        },
        "/assets/zhongyuan/e7747431-e1e1-4e0f-9e1f-d876d3fedd6e.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhongyuan/e7fcf159-f365-48a8-9c8d-e344fbc93d35.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/litang/tang_lishimin.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/liuhan/hanxin.png": {
            "scale": 1.08,
            "offsetX": 10,
            "offsetY": 0
        },
        "/assets/shuguo/73d89ec3-c8e8-4137-9c54-b42c06a5ef32.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/litang/litang.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhongyuan/c8c18fd5-7364-4e09-85a1-eebd5888a51a.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 0
        },
        "/assets/zhongya/tiemuer_tiemuer.png": {
            "scale": 1.1,
            "offsetX": -3,
            "offsetY": 7
        },
        "/assets/zhongya/seljuq_sangjiaer.png": {
            "scale": 1.06,
            "offsetX": 0,
            "offsetY": -3
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
        "/assets/zhongyuan/468386ae-8837-4c77-b85b-0b786241a098.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -14
        },
        "/assets/zhongyuan/chuanshu (8).png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 12
        },
        "/assets/daming/JIANGNAN_garrison.png": {
            "scale": 1.1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/zhongyuan/e6fc1853-88b8-4561-b5e9-769779bbf6dc.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/zhongyuan/zhuozhou_anlushan.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": 12
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
        "/assets/zhongyuan/tianxiong_tianchengsi.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -6
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
        "/assets/zhongya/dulan_d_aihamaide.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/zhongya/5d913217-cc43-4452-80a8-e1962469e756.png": {
            "scale": 1.04,
            "offsetX": 18,
            "offsetY": -2
        },
        "/assets/zhongya/d2b49090-81ea-4f84-82fa-5bb0a919417d.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/zhongya/9d9a33aa-d8e7-4387-b583-4e531ee54589.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/zhongyuan/4af53442-56af-46b1-a7c1-3fd746ee922c.png": {
            "scale": 0.92,
            "offsetX": 0,
            "offsetY": -24
        },
        "/assets/liuhan/han_d_hanxin.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -2
        },
        "/assets/shuguo/yangzhou_wangping.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/assets/zhongyuan/aa5cf86c-cf24-46d1-9e00-e646972e7992.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -26
        },
        "/assets/zhongyuan/bing_liukun.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -1
        },
        "/assets/zhongyuan/jinan_tiexuan.png": {
            "scale": 0.94,
            "offsetX": 0,
            "offsetY": -11
        },
        "/assets/zhongyuan/92102f92-195a-4120-addd-c2ce96ff27f1.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/xianqin/8990eebc-21d7-40ab-8210-09d8ac0b34a5.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 5
        },
        "/assets/zhongyuan/qin_baiqi.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -28
        },
        "/assets/zhongyuan/aff99320-ad86-4f44-88aa-0831cd9a184a.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 17
        },
        "/assets/liuhan/2154ff89-e50d-42f1-98e1-d8ac06f096e0.png": {
            "scale": 1,
            "offsetX": 10,
            "offsetY": 18
        },
        "/assets/shuguo/chu_xiangyu.png": {
            "scale": 0.96,
            "offsetX": 9,
            "offsetY": -8
        },
        "/assets/shuguo/shu_zhugeliang.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": -4
        },
        "/assets/shuguo/chuanshu (4).png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 13
        },
        "/assets/litang/9bdb090b-7d53-4505-9473-00cec58f8bfc.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -17
        },
        "/assets/zhongyuan/fcd61d66-cdf8-4984-a132-f61c3bc919f8.png": {
            "scale": 0.96,
            "offsetX": 0,
            "offsetY": 21
        },
        "/assets/zhongyuan/52602539-f95b-4ef3-aeec-2bf4422fe284.png": {
            "scale": 0.9,
            "offsetX": 0,
            "offsetY": -21
        },
        "/assets/liuhan/fb10c9aa-8eb8-4610-a183-8b9e881cf261.png": {
            "scale": 1.08,
            "offsetX": -1,
            "offsetY": 13
        },
        "/assets/xianqin/5921bb26-35bf-4fa0-ad5d-426cf9706590.png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -31
        },
        "/assets/zhongyuan/5644c5a9-47e1-4f15-9f99-0e89239b8174.png": {
            "scale": 0.98,
            "offsetX": 2,
            "offsetY": -17
        },
        "/assets/wuzhou/fa0e668a-55d3-48d9-b187-7c7fe7bbf9ef.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/zhongyuan/guangzhou (12).png": {
            "scale": 1,
            "offsetX": 12,
            "offsetY": -33
        },
        "/assets/dongbei/c4f3f805-02cb-4e43-b4c5-7c46d8e6be77.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -38
        },
        "/assets/dongbei/NORTHEAST_field.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 8
        },
        "/assets/zhongya/guishuang_jianisejia.png": {
            "scale": 0.96,
            "offsetX": 3,
            "offsetY": -27
        },
        "/assets/zhongyuan/xiangzhou_lvwenhuan.png": {
            "scale": 1.08,
            "offsetX": 0,
            "offsetY": -49
        },
        "/assets/riben/edo_dechuangjiakang.png": {
            "scale": 0.98,
            "offsetX": 7,
            "offsetY": -14
        },
        "/assets/riben/857f35ee-4144-4b76-af60-f059b79b7064.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": 4
        },
        "/assets/riben/higo_d_juchiwuguang.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 20
        },
        "/assets/chaoxian/gaogouli_yizhiwende.png": {
            "scale": 1.12,
            "offsetX": 0,
            "offsetY": -3
        },
        "/assets/chaoxian/c8ff6344-a065-48f7-8c1e-a112f38a488b.png": {
            "scale": 1.04,
            "offsetX": 0,
            "offsetY": -20
        },
        "/assets/wuzhou/bec37b4e-ab28-4f6b-a087-30c961161a64.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 34
        },
        "/assets/liuhan/yangshao_zhoubo.png": {
            "scale": 1.12,
            "offsetX": 13,
            "offsetY": -10
        },
        "/assets/zhaosong/9ff5b235-5237-437a-8f96-112418dc8dc9.png": {
            "scale": 1.02,
            "offsetX": 0,
            "offsetY": -20
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
        "/assets/qin/": {
            "samplePath": "/assets/qin/xirong.png",
            "eyeLineY": 0.24,
            "chestLineX": 0.5
        }
    }
};
