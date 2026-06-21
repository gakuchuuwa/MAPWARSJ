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
        "/public/assets/lingnan/guangzhou (19).png": {
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
        "/public/assets/zhongya/25057c7e-74c4-4baf-bb62-8b5c2f416a77.png": {
            "scale": 0.98,
            "offsetX": 0,
            "offsetY": 2
        },
        "/assets/xianqin/fuhao.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": -16
        },
        "/public/assets/zhongyuan/0768b7fc-1481-4d75-a895-a8dc197226d1.png": {
            "scale": 1,
            "offsetX": 0,
            "offsetY": 1
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
            "samplePath": "/assets/riben/4d3fef9d-9372-4949-b73f-9c73e7675d43.png",
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
