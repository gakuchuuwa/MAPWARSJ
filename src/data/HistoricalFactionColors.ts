/**
 * 势力固定显示色：势力 id → 专属 hex（全局唯一）。
 * 有尚色/服色依据的政权、民族、起义写入此处；其余每局随机（FactionManager）。
 * 随机池避开红/黄/青色相楔及近白、近黑区。
 *
 * 【仅正规势力】panjun 叛军不在此表；叛军无 hex 势力色，见 RebelFlagConstants / CityAssetManager。
 */

const _FIXED: Record<string, string> = {
    // ── 红·尚赤 / 火德 / 复明 / 起义 ──
    han_d: '#C41E1E', // 汉（赤旗黑字，史料固定；见 FLAG_TEXT_BLACK_STYLE_FACTIONS）
    shu: '#2E7D32', // 蜀（绿）
    wu: '#C03520', // 吴
    sui: '#B83030', // 隋
    song: '#DC4850', // 宋（明亮珊瑚红；与大明深绛对照）
    ming_d: '#7A1418', // 大明（深绛暗红；南京↔临安邻近易混）
    chu: '#C03028', // 楚
    yue_d: '#D03030', // 岳（黑旗白字，史料固定；见 FLAG_TEXT_WHITE_STYLE_FACTIONS）
    xichu: '#B03830', // 西楚
    erzhu: '#962828', // 尔朱
    jiujiang: '#A83830', // 九江
    wazhai: '#903028', // 瓦岗
    red_turban: '#A83028', // 红巾
    xushouhui: '#883030', // 天完
    haoding: '#C05040', // 红袄(郝定)
    chimei: '#972838', // 赤眉
    yang_aner: '#B84838', // 登(杨安儿)
    dashun: '#9A3030', // 大顺
    daxi_ming: '#943228', // 大西
    xiqin: '#AE3434', // 西秦
    hongguang: '#B82E2E', // 弘光(南明复明)
    longwu: '#B43434', // 隆武
    yongli: '#AA3636', // 永历

    // ── 黄·土德尚黄 ──
    wei: '#B07818', // 魏（深琥珀土黄；汴梁↔长安邻近易混）
    tang: '#F0CC40', // 唐（明亮赭黄；与魏深黄对照）
    manzhou_d: '#D4A528', // 大清
    tuoba: '#B08220', // 拓跋
    xin: '#A88A24', // 新
    chen: '#C49830', // 陈
    chunshen: '#D0AA35', // 春申
    xu: '#A67C2A', // 徐
    baibo: '#E0B040', // 黄巾
    zhangshicheng: '#B89838', // 大周(张士诚)

    // ── 青·木德尚青 ──
    xia: '#3A8F83', // 夏
    xiao_d: '#2E7568', // 萧(兰陵萧氏)
    lulin: '#48A090', // 绿林

    // ── 白·金德尚白 / 蒙古尚白 ──
    shang: '#E0CEB0', // 商（暖沙象牙；与晋纯白 #FFFFFF 拉开色差）
    jin: '#FFFFFF', // 晋（纯白；金德尚白顶格）
    dajin: '#DCD8D0', // 大金
    yuan_d: '#ECE8E0', // 大元
    da_yuan: '#D8D4CC', // 北元
    bailian: '#E8E8E4', // 白莲
    menggu_d: '#E2DED6', // 蒙古
    dangxiang: '#D6D2CA', // 大夏(党项)
    jurchen: '#CEC8C0', // 女真
    joseon: '#E4E0DC', // 朝鲜(李朝尚白)

    // ── 黑·水德尚黑 / 契丹黑旗 ──
    qin: '#1C1C1C', // 秦
    liao_d: '#302E28', // 大辽
    fu: '#444030', // 苻
    yuwen: '#565048', // 宇文
    qidan: '#36322C', // 契丹
};

function assertUniqueFixedColors(map: Record<string, string>): void {
    const hexOwner = new Map<string, string>();
    for (const [fid, hex] of Object.entries(map)) {
        const key = hex.toUpperCase();
        const prev = hexOwner.get(key);
        if (prev) {
            throw new Error(
                `[HistoricalFactionColors] hex 重复: ${fid} 与 ${prev} 均为 ${hex}`,
            );
        }
        hexOwner.set(key, fid);
    }
}

assertUniqueFixedColors(_FIXED);

export const HISTORICAL_FACTION_COLORS: Readonly<Record<string, string>> = Object.freeze({ ..._FIXED });

export const RESERVED_FACTION_COLOR_HEXES: ReadonlySet<string> = new Set(
    Object.values(HISTORICAL_FACTION_COLORS),
);

export const RESERVED_COLOR_MIN_RGB_DISTANCE = 28;

export const RANDOM_PALETTE_RED_HUE_MIN = 350;
export const RANDOM_PALETTE_RED_HUE_MAX = 18;

export const RANDOM_PALETTE_YELLOW_HUE_MIN = 38;
export const RANDOM_PALETTE_YELLOW_HUE_MAX = 62;

/** 木德「尚青/苍」色相楔（勿用于随机池） */
export const RANDOM_PALETTE_CYAN_HUE_MIN = 155;
export const RANDOM_PALETTE_CYAN_HUE_MAX = 195;

/** 近白区：高亮低饱和（勿用于随机池） */
export const RANDOM_PALETTE_WHITE_LIGHTNESS_MIN = 78;
export const RANDOM_PALETTE_WHITE_SATURATION_MAX = 28;

/** 近黑区：低亮低饱和（勿用于随机池） */
export const RANDOM_PALETTE_BLACK_LIGHTNESS_MAX = 24;
export const RANDOM_PALETTE_BLACK_SATURATION_MAX = 45;

/**
 * 旗号汉字黑白分界 — 唯一阈值（亮度 0–255 的正中值 128）。
 *
 * | 旗面亮度 lum | 汉字 fill | 描边 stroke | 适用 |
 * |---|---|---|---|
 * | lum < 128（深旗） | 浅色 `#f0f0e8` | 黑边 | 白字 |
 * | lum ≥ 128（浅旗） | 深色 `#1a1a1a` | 白边 | 黑字 |
 *
 * 固定色（HistoricalFactionColors）与随机色（FactionManager）**共用此阈值**，禁止另设第二套（如旧版 <50）。
 * 实现：`CityAssetManager.resolveFlagTextIsDark`；审计：`npm run flag-text:check`
 */
export const FLAG_TEXT_LUM_THRESHOLD = 128;

/** 强制白字（无视 lum；史料可考）— 岳家军黑旗白字等 */
export const FLAG_TEXT_WHITE_STYLE_FACTIONS: ReadonlySet<string> = new Set(['yue_d']);

/** 强制黑字（无视 lum；史料可考）— 汉赤旗黑字等 */
export const FLAG_TEXT_BLACK_STYLE_FACTIONS: ReadonlySet<string> = new Set(['han_d']);
