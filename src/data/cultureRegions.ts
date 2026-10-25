/**
 * 66 文化所代表的区域（2026-10-25 主人令「每个文化后面写上这个文化所代表的那片区域」）
 *
 * 口径：**文化 ＝ 一片区域的文化（当地人的生活、建筑风格）**，不是政权、不是民族；政权/民族归势力。
 * 这里写的是每个文化键在**历史文化上代表的那片区域**（地区/区域，不用单城或两点连线）。
 * 键与 66 套建筑素材不动，军团名不强制改。本表只作口径备注，不参与运行逻辑。
 */
export const CULTURE_REGION: Readonly<Record<string, string>> = {
    JAPAN: '日本列岛', CENTRAL: '黄河中下游平原', WEI: '河北—晋北', JIANGNAN: '长江下游以南', BASHU: '四川盆地',
    KHITAN: '河西走廊', NORTHEAST: '东北地区', MONGOL: '蒙古高原', KOREA: '朝鲜半岛',
    GERMANIC: '中欧—日耳曼尼亚', FRANKS: '高卢（法国北部）', BURGUNDIANS: '罗讷河—勃艮第', BRITONS: '英格兰',
    CELTS: '不列颠西部（爱尔兰—苏格兰—威尔士）', VIKINGS: '斯堪的纳维亚',
    GOTHS: '维斯瓦河—黑海北岸', SAXONS: '下萨克森—易北河下游',
    VARANGIANS: '北境（波罗的海南岸—西北罗斯：芬兰湾—拉多加—伊尔门—白湖）',
    DANES: '日德兰半岛', POLES: '维斯瓦河流域', BOHEMIANS: '波希米亚', MAGYAR: '潘诺尼亚（匈牙利平原）',
    SLAVIC: '东欧平原（第聂伯—伏尔加）', LITHUANIANS: '立陶宛—波罗的地区', BULGARIANS: '巴尔干东部',
    BYZANTINE: '巴尔干—小亚细亚', ARMENIANS: '亚美尼亚高原', GEORGIANS: '高加索（卡特利—伊比利亚）',
    LATIN: '意大利半岛', ROMA: '拉丁姆（罗马城周边）', SICILIANS: '西西里岛', SPANISH: '伊比利亚半岛中部',
    PORTUGUESE: '伊比利亚西部（卢西塔尼亚）', ORIE: '近东（叙利亚—美索不达米亚）',
    HUNS: '蒂萨河—多瑙河草原', CUMAN: '钦察草原（黑海北—伏尔加）', TURKS: '安纳托利亚', CENTRAL_ASIA: '中亚',
    INDIA: '南印度', MUGHAL: '北印度', BENGALIS: '孟加拉', GURJARAS: '古吉拉特', PURU: '旁遮普',
    KHMER: '湄公河中下游', BURMESE: '伊洛瓦底江流域', VIETNAMESE: '交趾（越南中北部）', MALAY: '马来半岛—南洋群岛',
    MAYANS: '尤卡坦—危地马拉', AMERICA: '墨西哥中部', INCA: '安第斯（秘鲁—玻利维亚）', MUISCA: '波哥大高原',
    MAPUCHE: '智利南部（阿劳卡尼亚）', TUPI: '巴西沿海',
    BERBER: '马格里布（摩洛哥—突尼斯）', AFRICA: '西非（萨赫勒）', ETHIOPIANS: '埃塞俄比亚高原',
    SASANIAN: '伊朗西部—美索不达米亚', PERSIAN: '伊朗东部—呼罗珊',
    ATHENIANS: '阿提卡', SPARTANS: '拉科尼亚（摩里亚）', MACEDONIAN: '马其顿（瓦尔达尔河流域）',
    THRACIAN: '色雷斯（巴尔干东南）', GREECE: '爱琴海（希腊半岛与爱琴海）',
    TIBET: '青藏高原', WESTERN: '塔里木—西域', XIANBEI: '阴山—锡林郭勒',
};