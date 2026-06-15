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
