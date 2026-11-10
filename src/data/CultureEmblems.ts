/**
 * 🔴 [2026-11-10 主人令] 百岁模式「文化徽章」——67 文化（60 单色纹章剪影 ＋ 7 单字旗）。
 *
 * 口径：
 *   · 汉字圈 7 文化（中原/河朔/江南/巴蜀/湖广/越南/河西）走四时代统一单字旗（华/魏/吴/蜀/荆/越/凉），见 `CULTURE_TEXT_FLAG`。
 *   · 其余 60 文化统一走 `public/emblem-flags/{KEY}_{w|b}.png` 单色纹章剪影（浅旗黑图白边、深旗白图黑边，带迎风透视倾斜，完全印在旗布上）。
 *   · 与 `FACTION_EMBLEM`（势力专属纹章）分开登记：只在百岁模式「该势力此刻无在场武将」且该势力本身无专属纹章时作为据点文化兜底显示。
 */

/** 60 个非单字旗文化键 → `public/emblem-flags/` 下的纹章 KEY（不含 `_{w|b}.png`） */
export const CULTURE_EMBLEM: Readonly<Record<string, string>> = {
    // ── 东亚 / 内亚（其余 7 文化见 CULTURE_TEXT_FLAG）──────────────────
    NORTHEAST: 'GREAT_MORAVIA_MIKULCICE_FALCON', // 东北（肃慎/靺鞨/女真）：海东青展翅猎鹰
    XIANBEI: 'XIONGNU_EAGLE_CROWN',              // 漠南（鲜卑/契丹）：草原鹰顶金冠
    MONGOL: 'TAMGA',                             // 漠北蒙古：塔木加
    CENTRAL_ASIA: 'TIMURID_ANNULETS',            // 中亚：图兰三环纹
    KOREA: 'TOMOE',                              // 朝鲜：太极巴纹
    JAPAN: 'KIKU',                               // 日本：十六瓣菊纹
    // ── 南亚 / 东南亚 ─────────────────────────────────────────────
    INDIA: 'TIGER',                              // 南印（达罗毗荼/朱罗）：虎纹
    MUGHAL: 'MUGHAL_SUN_LION',                   // 北印（莫卧儿）：狮日纹
    BENGALIS: 'DHARMA_WHEEL12',                  // 孟加拉（波罗）：十二辐法轮
    GURJARAS: 'GURJARA_PRATIHARA_ADIVARAHA',     // 瞿折罗：Varaha 纹
    PURU: 'CARTWHEEL',                           // 旁遮普（婆罗/孔雀）：法轮
    KHMER: 'KHMER_TOWERS',                       // 高棉（真腊）：吴哥三塔
    MALAY: 'SRIVIJAYA_SHIP',                     // 马来（三佛齐）：双帆海船
    BURMESE: 'KONBAUNG_PEACOCK',                 // 缅甸：开屏孔雀
    // ── 西亚 / 中亚伊斯兰 ─────────────────────────────────────────
    PERSIAN: 'WINGED_SUN',                       // 波斯（阿契美尼德）：翼日盘
    SASANIAN: 'SASANIAN_ATASHDAN',               // 萨珊波斯：拜火圣坛
    ORIE: 'AYYUBID_EAGLE',                       // 阿拉伯（萨拉森）：萨拉丁之鹰
    TURKS: 'CRESCENT',                           // 突厥/奥斯曼：新月
    ARMENIANS: 'ARMENIA_LION',                   // 亚美尼亚：亚美尼亚狮
    GEORGIANS: 'GEORGIA_CROSSES',                // 格鲁吉亚：五十字
    BYZANTINE: 'BYZ_CROSS',                      // 拜占庭：拜占庭十字
    // ── 欧洲 ─────────────────────────────────────────────────────
    ROMA: 'EAGLE',                               // 罗马：罗马军团鹰
    LATIN: 'VENICE_LION',                        // 意大利（拉丁）：圣马可飞狮
    SICILIANS: 'SICILY_TRINACRIA',               // 西西里：三曲腿
    FRANKS: 'FLEUR',                             // 法兰克/法兰西：鸢尾花
    BRITONS: 'ENGLAND_CROSS',                    // 不列颠/英格兰：圣乔治十字
    CELTS: 'DALRIADA_DUNADD_TRISKELE_CROSS',     // 凯尔特/苏格兰：凯尔特三旋涡十字
    GERMANIC: 'TEUTONIC_CROSS',                  // 日耳曼/条顿：条顿十字
    SAXONS: 'SAXONY_CRANCELIN',                  // 萨克森：横条斜贯菱环
    VIKINGS: 'DRAKKAR',                          // 维京：维京龙船
    DANES: 'DENMARK_CROSS',                      // 丹麦：Dannebrog 十字
    VARANGIANS: 'RURIK_TRIDENT',                 // 瓦兰吉/罗斯：留里克三叉戟
    SLAVIC: 'RUSSIA_EAGLE',                      // 斯拉夫/俄罗斯：双头鹰
    POLES: 'POLISH_EAGLE',                       // 波兰：戴冠白鹰
    LITHUANIANS: 'LITHUANIA_VYTIS',              // 立陶宛：Vytis 骑士
    BOHEMIANS: 'BOHEMIA_LION',                   // 波西米亚：双尾狮
    BURGUNDIANS: 'BURGUNDY_SALTIRE',             // 勃艮第：勃艮第斜十字
    BULGARIANS: 'BULGARIA_LION',                 // 保加利亚：保加利亚狮
    MAGYAR: 'HUNGARY_STRIPES',                   // 马扎尔/匈牙利：阿尔帕德条纹
    HUNS: 'SCYTHIAN_KUL_OBA_STAG',               // 匈人/草原：库尔奥巴金鹿
    CUMAN: 'CUMAN_STONE_BABA',                   // 库曼：草原石人
    GOTHS: 'VISIGOTH_VOTIVE_CROSS',              // 哥特：王室还愿十字
    SPANISH: 'CASTILE_CASTLE',                   // 西班牙：卡斯蒂利亚城堡
    PORTUGUESE: 'PORTUGAL_QUINAS',               // 葡萄牙：五盾（Quinas）
    // ── 希腊城邦（各自一级文化，非三级 GREECE）──────────────────────
    ATHENIANS: 'OWL',                            // 雅典：雅典娜猫头鹰
    SPARTANS: 'SPARTA_LAMBDA',                   // 斯巴达：Λ 盾饰
    MACEDONIAN: 'SUN',                           // 马其顿：维吉纳太阳
    THRACIAN: 'ODRYSIAN_SEUTHES_STAR_WREATH',    // 色雷斯：橡叶花环与八芒星
    // ── 北非 / 撒哈拉以南 ─────────────────────────────────────────
    BERBER: 'ALMOHAD_LATTICE',                   // 柏柏尔：穆瓦希德格纹
    ETHIOPIANS: 'ETHIOPIA_LION',                 // 埃塞俄比亚：犹大之狮
    AFRICA: 'MALI_LION',                         // 西非（马里）：狮与战鼓
    // ── 美洲 ─────────────────────────────────────────────────────
    AMERICA: 'SERPENT',                          // 中美（阿兹特克）：羽蛇
    MAYANS: 'MAYA_JAGUAR',                       // 玛雅：美洲豹
    INCA: 'INCA_SUN',                            // 印加：太阳神 Inti
    MUISCA: 'MUISCA_RAFT',                       // 穆伊斯卡：黄金筏
    MAPUCHE: 'STAR7',                            // 马普切：七角星
    TUPI: 'FEATHER',                             // 图皮：羽饰
    // ── 其余三级/区域文化 ──────────────────────────────────────────
    TIBET: 'TIBETAN_ROYAL_TOMB_LION',            // 青藏：吐蕃藏王陵石狮
    WESTERN: 'KUSHAN_KANISHKA_TAMGA',            // 西域：西域/贵霜四叉塔木加
    GREECE: 'GREECE_CROWNED_CROSS',              // 希腊：希腊十字
};

/** 🔴 [2026-11-10 主人令「这些还是用字更好」] 不用图案、四代统一走单字旗的 7 个文化 */
export const CULTURE_TEXT_FLAG: Readonly<Record<string, string>> = {
    CENTRAL: '华',
    WEI: '魏',
    JIANGNAN: '吴',
    BASHU: '蜀',
    HUGUANG: '荆',
    VIETNAMESE: '越',
    HEXI: '凉',
};

/** 待补画清单（已全部就绪） */
export const CULTURE_EMBLEM_PENDING: readonly string[] = [];

/** 该文化的单色纹章 KEY（无 → null，走单字旗兜底） */
export function getCultureEmblemFile(buildingStyle: string | null | undefined): string | null {
    if (!buildingStyle) return null;
    return CULTURE_EMBLEM[buildingStyle] ?? null;
}

/** 该文化纹章的完整路径（按旗面明暗取 `_w` 或 `_b`） */
export function getCultureEmblemPath(buildingStyle: string | null | undefined, useWhite: boolean = true): string | null {
    const key = getCultureEmblemFile(buildingStyle);
    return key ? `/emblem-flags/${key}_${useWhite ? 'w' : 'b'}.png` : null;
}
