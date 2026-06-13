/**
 * 立绘显示调校：文件夹默认 + 单张覆盖 + 调校尺（样片/标线）
 * 由 PortraitTuner（/portrait-tuner.html）维护。
 * CombatUI 读取 folders / images（缩放偏移）及 folderGuides（缩放锚点：眼线×胸线交汇处）。
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

/** 样片 + 眼线/胸线（调校尺；CombatUI 亦读此项定缩放锚点） */
export interface PortraitFolderGuide {
    /** 样片路径 */
    samplePath: string;
    /** 眼线 Y：768×1024 画布归一化 0–1（顶→底） */
    eyeLineY: number;
    /** 胸线 X：画布归一化 0–1（左→右） */
    chestLineX: number;
}

export interface PortraitAdjustData {
    folders?: Record<string, PortraitAdjustValues>;
    images?: Record<string, PortraitAdjustValues>;
    folderGuides?: Record<string, PortraitFolderGuide>;
}

/** 768×1024 朝右半身立绘 — 标线默认（常见构图区间中点） */
export const PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y = 0.24;
export const PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X = 0.5;

export const PORTRAIT_GUIDE_DEFAULT: PortraitFolderGuide = {
    samplePath: '',
    eyeLineY: PORTRAIT_GUIDE_DEFAULT_EYE_LINE_Y,
    chestLineX: PORTRAIT_GUIDE_DEFAULT_CHEST_LINE_X,
};

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
        }
    }
};
