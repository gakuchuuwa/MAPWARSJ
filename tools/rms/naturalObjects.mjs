/**
 * 自然物件白名单（CC 2026-10-09 确认）。
 *
 * 用途：地图**导出/出图**时只保留自然物件；**引擎内部照旧把全部物件放出来**
 *   （玩家物件必须参与互相避让，否则自然物件的位置就不再与 DE 一致）。
 *
 * 判据：**按 dat 的 (class, type) 字段**，不按名字猜。
 *   类别表来自 `scratch/de_unit_class.json`（由 `scratch/export_de_unit_class.py` 从
 *   `empires2_x2_p1.dat` 导出：id → { name, class, type }）。
 *
 * 保留 16 组（678 个 id 量级）—— 全部经 DE 基准图实测确认其 class/type：
 *   自然地形物：树/灌木、地面装饰（草/植物/岩石/冰/废墟）、浆果丛、金矿、石矿、矿、悬崖
 *   生物：猎物、猛兽、家畜、狐狸、鸟、鱼/海豚、岸边鱼/海龟、鲸、牡蛎
 * 去掉：建筑（type 80）、可训练单位与村民/侦察兵（type 70 的军事与民用类）、城墙与栅栏、
 *   圣物、尸体（11/30）、投射物（11/60）、旗帜与火把（30）、背景图（14/80）、天气特效（14/20）、
 *   资源堆（class 40/41 —— DE 基准图里出现 0 次，CC 用数据定案去掉）、
 *   以及 11/10（地毯 RUGS、光效 FLARE）、11/20、11/80。
 */

import fs from 'node:fs';

/** 读 dat 单位类别表：id → { name, cls, type } */
export function loadUnitClassTable(file = 'scratch/de_unit_class.json') {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return new Map(Object.entries(raw).map(([k, v]) => [Number(k), v]));
}

/** 白名单：(class, type) 组合，写成 "class/type" */
export const NATURAL_CLASS_TYPES = new Set([
    '15/10', // 树 / 灌木
    '14/10', // 地面装饰：草、植物、岩石、冰、废墟（CC：废墟虽人造，属风景装饰，保留）
    '7/10',  // 浆果丛 / 食物丛
    '8/10',  // 石矿 / 石头
    '32/10', // 金矿 / 石头
    '48/10', // 矿
    '34/10', // 悬崖
    '9/70',  // 猎物：鹿、羚、斑马、海豹、野马、大角羊
    '10/70', // 猛兽：野猪、狼、狮、猞猁
    '58/70', // 家畜：羊、山羊、猪、鹅、火鸡、牛、羊驼
    '65/70', // 狐狸
    '11/70', // 鸟：鹰、猫头鹰、海鸥、鹳、金刚鹦鹉
    '5/30',  // 鱼 / 海豚
    '33/30', // 岸边鱼 / 海龟
    '63/30', // 鲸
    '63/10', // 牡蛎
]);

/** 该 id 是不是自然物件。类别表里查不到 → 一律不算（宁缺勿滥，避免漏进玩法物件） */
export function isNaturalObject(id, classTable) {
    const c = classTable?.get(id);
    if (!c) return false;
    return NATURAL_CLASS_TYPES.has(`${c.cls}/${c.type}`);
}

/** 只留自然物件（不改原数组，返回新数组） */
export function filterNaturalObjects(objects, classTable) {
    return objects.filter((o) => isNaturalObject(o.id, classTable));
}
