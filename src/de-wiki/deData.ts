/**
 * Age of Empires II: Definitive Edition (帝国时代II：决定版) 官方百科权威数据库
 * 纯正 DE 官方数据设定，包含全 45 个官方文明、全兵种图鉴、完整科技树、攻防隐藏护甲与战斗计算、全DLC战役编年史。
 */

export interface DeCiv {
    id: string;
    name: string;
    englishName: string;
    region: '西欧' | '中东欧' | '地中海' | '中东与高加索' | '大草原与中亚' | '东亚' | '东南亚' | '南亚' | '美洲' | '非洲';
    focus: string; // 文明定位，如"骑兵与防御文明"
    architecture: string; // 建筑风格
    dlc: string; // 引入版本
    uniqueUnits: string[]; // 特色单位
    uniqueTechCastle: { name: string; englishName: string; cost: string; effect: string }; // 银冠科技
    uniqueTechImperial: { name: string; englishName: string; cost: string; effect: string }; // 金冠科技
    teamBonus: string; // 团队加成
    bonuses: string[]; // 文明加成
    historyBrief: string; // 历史背景概览
}

export interface DeUnit {
    id: string;
    name: string;
    englishName: string;
    category: '步兵' | '骑兵' | '射手' | '攻城武器' | '火药武器' | '海军' | '修道院与经济';
    building: '兵营' | '靶场' | '马厩' | '攻城武器厂' | '城堡' | '码头' | '修道院' | '城镇中心';
    age: '黑暗时代' | '封建时代' | '城堡时代' | '帝王时代';
    cost: { food?: number; wood?: number; gold?: number; stone?: number };
    hp: number;
    attack: number;
    meleeArmor: number;
    pierceArmor: number;
    range: number; // 0 为近战
    reloadTime: number; // 攻击装填间隔 (秒)
    speed: number; // 移动速度 (格/秒)
    armorClasses: string[]; // 自身护甲类型 (Armor Classes)
    attackBonuses: { targetClass: string; bonus: number }[]; // 额外伤害加成
    description: string;
}

export interface DeArmorClass {
    id: number;
    name: string;
    description: string;
    vulnerableTo: string;
}

export interface DeTech {
    id: string;
    name: string;
    englishName: string;
    building: '铁匠铺' | '大学' | '修道院' | '城镇中心' | '马厩' | '靶场' | '兵营' | '城堡' | '码头';
    age: '黑暗时代' | '封建时代' | '城堡时代' | '帝王时代';
    cost: string;
    effect: string;
}

export interface DeCampaign {
    title: string;
    hero: string;
    civ: string;
    dlc: string;
    scenariosCount: number;
    desc: string;
}

export interface DeDlc {
    title: string;
    englishTitle: string;
    releaseDate: string;
    newCivs: string[];
    campaigns: string[];
    keyFeatures: string[];
}

// ──────────────────────────────────────────────
// 1. 全45个官方文明全集 (Complete 45 Civilizations)
// ──────────────────────────────────────────────
export const DE_CIVILIZATIONS: DeCiv[] = [
    // ── 西欧 (6) ──
    {
        id: 'britons',
        name: '不列颠',
        englishName: 'Britons',
        region: '西欧',
        focus: '步弓手文明',
        architecture: '西欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['长弓兵 (Longbowman)'],
        uniqueTechCastle: { name: '自耕农', englishName: 'Yeomen', cost: '750木 450金', effect: '步弓手射程 +1，箭塔攻击力 +2' },
        uniqueTechImperial: { name: '战狼号', englishName: 'Warwolf', cost: '800木 400金', effect: '巨型投石机攻击具有范围杀伤（溅射半径0.5）且命中率100%' },
        teamBonus: '靶场工作效率提高 20%',
        bonuses: [
            '城镇中心成本在城堡/帝王时代木材消耗 -50%',
            '步弓手在城堡时代射程 +1，在帝王时代再 +1 (总计 +2，不含掷矛手)',
            '牧羊人工作效率加快 25%',
        ],
        historyBrief: '中古不列颠以其无与伦比的长弓手享誉欧洲战场。在阿金库尔战役与克雷西战役中，英国长弓阵以压倒性的射程与射速彻底粉碎了法国重骑兵的神话。',
    },
    {
        id: 'franks',
        name: '法兰克',
        englishName: 'Franks',
        region: '西欧',
        focus: '骑兵文明',
        architecture: '西欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['掷斧兵 (Throwing Axeman)'],
        uniqueTechCastle: { name: '倒钩斧', englishName: 'Bearded Axe', cost: '400肉 400金', effect: '掷斧兵射程 +1' },
        uniqueTechImperial: { name: '侠义勋爵', englishName: 'Chivalry', cost: '600肉 500金', effect: '马厩工作效率加快 40%' },
        teamBonus: '骑士视野 +2',
        bonuses: [
            '农田升级科技全部免费 (进入对应时代自动获得)',
            '骑兵单位从封建时代起生命值 +20%',
            '城堡建造木材与石料消耗 -25%',
            '采果浆工人工作效率加快 15%',
        ],
        historyBrief: '查理曼大帝缔造的法兰克王国是中世纪欧洲骑士阶层的摇篮。法兰克拥有全游戏最全面强悍的游侠骑兵部队与低廉耐久的防御城堡群。',
    },
    {
        id: 'burgundians',
        name: '勃艮第',
        englishName: 'Burgundians',
        region: '西欧',
        focus: '骑兵与经济文明',
        architecture: '西欧',
        dlc: '西方霸主 (Lords of the West 2021)',
        uniqueUnits: ['库斯提勒骑兵 (Coustillier)', '佛兰芒民兵 (Flemish Militia)'],
        uniqueTechCastle: { name: '勃艮第葡萄园', englishName: 'Burgundian Vineyards', cost: '400肉 300金', effect: '将所有食物按 2:1 立即兑换为黄金，农夫此后缓慢生产黄金' },
        uniqueTechImperial: { name: '佛兰芒革命', englishName: 'Flemish Revolution', cost: '800肉 450金', effect: '将所有现有村民瞬间转变为强大的佛兰芒民兵' },
        teamBonus: '圣物除黄金外，同时以每秒 0.5 的速率产生食物',
        bonuses: [
            '所有经济科技可以提前一个时代研发（且消耗食物减少 33%）',
            '马厩骑兵升级成本降低 50%',
            '火药单位攻击力 +25%',
            '库斯提勒骑兵拥有蓄力重击机制 (Charged Attack)',
        ],
        historyBrief: '富庶的勃艮第公国以繁荣的低地佛兰芒商贸、先进的火药工坊及装备精良的骑士侍从骑兵闻名于百年战争晚期。',
    },
    {
        id: 'celts',
        name: '凯尔特',
        englishName: 'Celts',
        region: '西欧',
        focus: '步兵与攻城武器文明',
        architecture: '西欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['菘蓝割穗者 (Woad Raider)'],
        uniqueTechCastle: { name: '城堡据守', englishName: 'Stronghold', cost: '250肉 250金', effect: '城堡和箭塔射速加快 25%，城堡在受损时治疗周围步兵' },
        uniqueTechImperial: { name: '凯尔特狂怒', englishName: 'Furor Celtica', cost: '750肉 450金', effect: '攻城武器厂单位生命值 +40%' },
        teamBonus: '攻城武器厂工作效率提高 20%',
        bonuses: [
            '步兵单位移动速度提高 15%',
            '伐木工工作速度加快 15%',
            '攻城武器开火速率加快 25%',
            '羊群在凯尔特单位视野内不会被敌方转化俘获',
        ],
        historyBrief: '苏格兰与爱尔兰的凯尔特勇士以剽悍不屈著称。威廉·华莱士的起义与风驰电掣的高地步兵，配合毁天灭地的强化攻城巨弩与投石机令人胆寒。',
    },
    {
        id: 'spanish',
        name: '西班牙',
        englishName: 'Spanish',
        region: '西欧',
        focus: '火药与僧侣骑兵文明',
        architecture: '地中海',
        dlc: '征服者 (The Conquerors 2000)',
        uniqueUnits: ['征服者骑兵 (Conquistador)', '传教士 (Missionary)'],
        uniqueTechCastle: { name: '宗教法庭', englishName: 'Inquisition', cost: '100肉 300金', effect: '僧侣与传教士招降转换速率提升' },
        uniqueTechImperial: { name: '至高霸权', englishName: 'Supremacy', cost: '450肉 250金', effect: '村民生命值 +40，攻击力 +6，双防各 +2' },
        teamBonus: '贸易马车与贸易船多产 25% 黄金',
        bonuses: [
            '建筑物建造速度加快 30% (奇观/城墙除外)',
            '铁匠铺科技无需黄金 (仅消耗食物与木材)',
            '弹道学对加农炮战舰生效 (大幅提升火炮命中率)',
            '火枪手与手推炮射速加快 18%',
        ],
        historyBrief: '收复失地运动与大航海时期的西班牙帝国。强大的骑马火枪手征服者是前中期压制力极强的王牌，至高霸权科技让其村民化身强悍战士。',
    },
    {
        id: 'portuguese',
        name: '葡萄牙',
        englishName: 'Portuguese',
        region: '西欧',
        focus: '海军与火药文明',
        architecture: '地中海',
        dlc: '非洲王国 (African Kingdoms 2015)',
        uniqueUnits: ['风琴炮 (Organ Gun)', '卡拉维尔帆船 (Caravel)'],
        uniqueTechCastle: { name: '加拉克帆船', englishName: 'Carrack', cost: '200木 300金', effect: '舰船双防各 +1' },
        uniqueTechImperial: { name: '火绳枪', englishName: 'Arquebus', cost: '700肉 400金', effect: '火药单位攻击弹道速度大幅加快，且对移动目标命中率提升' },
        teamBonus: '同盟开局彼此在小地图完全点亮视野',
        bonuses: [
            '所有军事单位黄金消耗减少 20%',
            '所有科技研发速度提高 30%',
            '每艘渔船提供额外 +1 木材储量',
            '可在帝王时代建造特色建筑商馆 (Feitoria)，无需工人源源不断产出四种资源',
        ],
        historyBrief: '开创大航海时代的航海先驱葡萄牙，凭借风琴炮连环轰击、穿透性齐射的卡拉维尔帆船与无限资源的海外商馆傲立群雄。',
    },

    // ── 中东欧 (8) ──
    {
        id: 'teutons',
        name: '条顿',
        englishName: 'Teutons',
        region: '中东欧',
        focus: '步兵与骑兵文明',
        architecture: '中欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['条顿武士 (Teutonic Knight)'],
        uniqueTechCastle: { name: '铁甲', englishName: 'Ironclad', cost: '400木 350金', effect: '攻城武器近战护甲 +4' },
        uniqueTechImperial: { name: '条顿塔盾', englishName: 'Crenellations', cost: '600肉 400金', effect: '城堡射程 +3，驻扎步兵可射出利箭' },
        teamBonus: '单位抵抗僧侣招降能力显著提高',
        bonuses: [
            '修道院僧侣治疗距离翻倍',
            '箭塔在城堡/帝王时代可容纳两倍驻军并射出更多箭矢',
            '农田成本减少 40% (仅需 36 木材)',
            '兵营与马厩单位在城堡/帝王时代近战护甲各 +1 (总计 +2)',
        ],
        historyBrief: '条顿骑士团在中欧与波罗的海十字军东征中建立了深厚要塞体系。全身重甲如钢铁城堡般的条顿武士拥有近战几乎无敌的恐怖防御力。',
    },
    {
        id: 'goths',
        name: '哥特',
        englishName: 'Goths',
        region: '中东欧',
        focus: '步兵文明',
        architecture: '中欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['近卫军 (Huskarl)'],
        uniqueTechCastle: { name: '无政府状态', englishName: 'Anarchy', cost: '450肉 250金', effect: '可在兵营直接训练近卫军' },
        uniqueTechImperial: { name: '井喷', englishName: 'Perfusion', cost: '400木 600金', effect: '兵营工作速度大幅提升 100%' },
        teamBonus: '兵营工作效率加快 20%',
        bonuses: [
            '步兵单位成本从封建到帝王逐渐递减 (封建-20%，城堡-25%，帝王-35%)',
            '步兵对建筑额外攻击力 +1 (每时代递增)',
            '猎人采猎野猪无需织布机即可承受更多攻击，带肉量 +15',
            '帝王时代人口上限额外增加 10 人 (可突破上限至 210)',
        ],
        historyBrief: '曾洗劫罗马的哥特人展现了蛮族步兵暴兵狂潮的威势。拥有极高远程护甲的近卫军无视步弓与城堡箭雨，是全游戏最彻底的弓兵克星。',
    },
    {
        id: 'vikings',
        name: '维京',
        englishName: 'Vikings',
        region: '中东欧',
        focus: '步兵与海军文明',
        architecture: '中欧',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['狂暴战士 (Berserk)', '维京长船 (Longboat)'],
        uniqueTechCastle: { name: '酋长', englishName: 'Chieftains', cost: '700肉 400金', effect: '步兵对骑兵具有额外攻击力 (+5)，击杀村民获得黄金' },
        uniqueTechImperial: { name: '狂暴怒吼', englishName: 'Berserkergang', cost: '850肉 400金', effect: '狂暴战士生命值自我自动回复速率翻倍' },
        teamBonus: '码头制造成本降低 15%',
        bonuses: [
            '战舰造价随时代降低 (封建-15%, 城堡-15%, 帝王-20%)',
            '步兵生命值从封建时代起增加 (封建+10%, 城堡+15%, 帝王+20%)',
            '轮轴手推车科技在进入封建与城堡时代免费自动获得',
        ],
        historyBrief: '驾驭龙头长船席卷欧洲海岸的北欧狂战士。维京拥有极佳的内政免费推车科技与能自动回血的近战精锐狂暴战士。',
    },
    {
        id: 'slavs',
        name: '斯拉夫',
        englishName: 'Slavs',
        region: '中东欧',
        focus: '步兵与攻城武器文明',
        architecture: '东欧',
        dlc: '被遗忘的帝国 (The Forgotten 2013)',
        uniqueUnits: ['贵族铁骑 (Boyar)'],
        uniqueTechCastle: { name: '德鲁日纳近卫', englishName: 'Druzhina', cost: '1200肉 500金', effect: '所有步兵攻击附带践踏范围溅射伤害 (5点溅射)' },
        uniqueTechImperial: { name: '要塞羁绊', englishName: 'Detinets', cost: '400石 400肉', effect: '将城堡造价中 40% 的石料转化为木材消耗' },
        teamBonus: '军事建筑提供 +5 人口支持',
        bonuses: [
            '农夫工作速度提高 10%',
            '攻城武器厂单位制造成本减免 15%',
            '补给科技研发免费',
        ],
        historyBrief: '古罗斯大公国的斯拉夫军团依托广袤农田经济与重装贵族铁骑征战，其步兵德鲁日纳践射践踏可瞬间撕碎成群敌军步兵。',
    },
    {
        id: 'poles',
        name: '波兰',
        englishName: 'Poles',
        region: '中东欧',
        focus: '骑兵文明',
        architecture: '东欧',
        dlc: '公爵的崛起 (Dawn of the Dukes 2021)',
        uniqueUnits: ['奥布奇战锤步兵 (Obuch)', '翼骑兵 (Winged Hussar)'],
        uniqueTechCastle: { name: '什拉赫塔特权', englishName: 'Szlachta Privileges', cost: '500肉 300金', effect: '骑士造金成本大幅降低 60%' },
        uniqueTechImperial: { name: '列赫特传奇', englishName: 'Lechitic Legacy', cost: '750肉 550金', effect: '轻骑兵与翼骑兵攻击附带践踏溅射伤害' },
        teamBonus: '轻骑兵与翼骑兵对射手护甲加成额外 +1',
        bonuses: [
            '村民随时间缓慢自动恢复生命值',
            '特色庄园建筑 (Folwark) 建造时一次性获得周边农田总储量 10% 的即时食物',
            '石矿采掘时同时额外产出 50% 的黄金',
            '奥布奇战锤步兵每次攻击永久剥离目标 1 点护甲',
        ],
        historyBrief: '雅德维加女王与波兰王国的翼骑兵是欧洲最绚丽的传奇。波兰凭借庄园爆仓经济与廉价黄金骑士冲击，在东欧大平原上所向披靡。',
    },
    {
        id: 'bohemians',
        name: '波希米亚',
        englishName: 'Bohemians',
        region: '中东欧',
        focus: '火药与修道院文明',
        architecture: '东欧',
        dlc: '公爵的崛起 (Dawn of the Dukes 2021)',
        uniqueUnits: ['胡斯战车 (Hussite Wagon)', '手风琴炮 (Houfnice)'],
        uniqueTechCastle: { name: '瓦根堡战术', englishName: 'Wagenburg Tactics', cost: '300肉 300金', effect: '火药单位移动速度加快 15%' },
        uniqueTechImperial: { name: '胡斯改革', englishName: 'Hussite Reforms', cost: '800肉 450金', effect: '修道院与僧侣科技食物与木材消耗完全由修道院免除' },
        teamBonus: '市场工作效率加快 80%',
        bonuses: [
            '铁匠铺与大学工作速度加快 100% 且消耗木材减少 100',
            '修道院科技可在城堡时代提早研发帝王级',
            '胡斯战车可为后方单位吸收阻挡 50% 的敌方投射物伤害',
            '化学科技可在城堡时代研发',
        ],
        historyBrief: '扬·杰式卡率领的捷克胡斯派军团开创了车垒战术（Wagenburg）与近代火器战争的先河，重炮手风琴炮是战场上无情的轰击毁灭者。',
    },
    {
        id: 'magyars',
        name: '马扎尔',
        englishName: 'Magyars',
        region: '中东欧',
        focus: '骑兵与弓兵文明',
        architecture: '东欧',
        dlc: '被遗忘的帝国 (The Forgotten 2013)',
        uniqueUnits: ['马扎尔骠骑 (Magyar Huszar)'],
        uniqueTechCastle: { name: '雇佣佣兵', englishName: 'Corvinian Army', cost: '200肉 300金', effect: '马扎尔骠骑生产完全不需要黄金（变为纯食物）' },
        uniqueTechImperial: { name: '反曲弓', englishName: 'Recurve Bow', cost: '600木 400金', effect: '骑射手攻击力与射程各 +1' },
        teamBonus: '步弓手视野 +2',
        bonuses: [
            '锻造、铸铁、高炉三级铁匠铺近战攻击科技全部免费自动升级',
            '斥候骑兵系列生产成本减少 15%',
            '村民一击击杀狼等猛兽',
        ],
        historyBrief: '马扎尔游牧骑兵席卷多瑙河平原建立匈牙利王国。马扎尔骠骑是性价比极高的黄金垃圾兵克星，配以射程惊人的反曲弓骑射阵令敌人束手。',
    },
    {
        id: 'huns',
        name: '匈奴',
        englishName: 'Huns',
        region: '中东欧',
        focus: '骑兵文明',
        architecture: '中欧',
        dlc: '征服者 (The Conquerors 2000)',
        uniqueUnits: ['答剌罕骑兵 (Tarkan)'],
        uniqueTechCastle: { name: '掠夺', englishName: 'Marauders', cost: '300木 200金', effect: '可在马厩直接训练答剌罕骑兵' },
        uniqueTechImperial: { name: '无神论', englishName: 'Atheism', cost: '500肉 500金', effect: '圣物与世界奇观胜利倒计时延长 100 年，间谍成本减半' },
        teamBonus: '马厩工作效率加快 20%',
        bonuses: [
            '无需建造任何房屋即可拥有最大人口容量 (开局直接满人口上限)',
            '骑射手在城堡/帝王时代成本降低 10%/20%',
            '巨型投石机命中率提高 35%',
        ],
        historyBrief: '阿提拉上帝之鞭的铁蹄震撼罗马帝国。无需建造房屋的独特特性赋予其开局极快节奏与强大的骑兵机动力，答剌罕骑兵专攻破坏敌方城池。',
    },

    // ── 地中海 (4) ──
    {
        id: 'byzantines',
        name: '拜占庭',
        englishName: 'Byzantines',
        region: '地中海',
        focus: '防御与反制兵种文明',
        architecture: '地中海',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['甲胄骑兵 (Cataphract)'],
        uniqueTechCastle: { name: '希腊火', englishName: 'Greek Fire', cost: '250肉 300金', effect: '喷火船射程 +1' },
        uniqueTechImperial: { name: '后勤学', englishName: 'Logistics', cost: '800肉 600金', effect: '甲胄骑兵附带 5 点范围践踏伤害，并对步兵加成额外提升' },
        teamBonus: '僧侣治疗速度加快 100%',
        bonuses: [
            '建筑物在每个时代生命值提升 (黑暗+10%, 封建+20%, 城堡+30%, 帝王+40%)',
            '掷矛手、长枪兵、骆驼骑兵等反制兵种成本减少 25%',
            '喷火船开火速度加快 25%',
            '升级至帝王时代的黄金与食物成本减少 33%',
        ],
        historyBrief: '东罗马拜占庭帝国历经千年不倒，凭借君士坦丁堡坚不可摧的三重城墙、密布的希腊火战舰与拥有反步兵特化的具装甲胄骑兵捍卫文明孤岛。',
    },
    {
        id: 'italians',
        name: '意大利',
        englishName: 'Italians',
        region: '地中海',
        focus: '弓兵与海军文明',
        architecture: '地中海',
        dlc: '被遗忘的帝国 (The Forgotten 2013)',
        uniqueUnits: ['热那亚弩手 (Genoese Crossbowman)', '佣兵 (Condottiero)'],
        uniqueTechCastle: { name: '大盾', englishName: 'Pavise', cost: '300肉 150金', effect: '热那亚弩手与佣兵护甲及远防各 +1' },
        uniqueTechImperial: { name: '丝绸之路', englishName: 'Silk Road', cost: '500肉 250金', effect: '贸易马车与贸易船成本减半 50%' },
        teamBonus: '同盟可在帝王时代兵营训练意大利特色步兵佣兵',
        bonuses: [
            '时代升级成本降低 15%',
            '码头科技研发成本降低 33%',
            '渔船成本降低 15%',
            '火药单位制造成本减免 20%',
        ],
        historyBrief: '威尼斯与热那亚等意大利航海商业城邦主导了地中海商路。背负坚固大盾的热那亚弩手是克制敌方骑兵冲锋的王牌防线。',
    },
    {
        id: 'sicilians',
        name: '西西里',
        englishName: 'Sicilians',
        region: '地中海',
        focus: '步兵与骑士文明',
        architecture: '地中海',
        dlc: '西方霸主 (Lords of the West 2021)',
        uniqueUnits: ['萨金特卫兵 (Serjeant)'],
        uniqueTechCastle: { name: '第一次十字军', englishName: 'First Crusade', cost: '300肉 600金', effect: '每个城镇中心瞬间生产 7 名萨金特卫兵 (上限35名)' },
        uniqueTechImperial: { name: '豪强地主', englishName: 'Hauberk', cost: '500肉 400金', effect: '骑士近战护甲 +1，远程护甲 +2' },
        teamBonus: '运输船载量 +5 且防箭能力提高',
        bonuses: [
            '所有陆地军事单位承受的一切攻击额外克制伤害减少 33%',
            '农田升级每级额外提供 100% 的农田储量支持',
            '可建造独特的防御主楼要塞 (Donjon)，萨金特卫兵亦可直接就地建造要塞',
        ],
        historyBrief: '诺曼欧特维尔家族在地中海创立的西西里王国，将坚固的石堡栋若金汤要塞与重装萨金特步兵传遍南意大利与黎凡特。',
    },
    {
        id: 'romans',
        name: '罗马',
        englishName: 'Romans',
        region: '地中海',
        focus: '步兵文明',
        architecture: '地中海',
        dlc: '罗马归来 (Return of Rome 2023)',
        uniqueUnits: ['军团兵 (Legionary)', '百夫长 (Centurion)'],
        uniqueTechCastle: { name: '投石机弹道学', englishName: 'Ballistas', cost: '400木 300金', effect: '弩炮开火速度 +33%，手推炮攻击判定提升' },
        uniqueTechImperial: { name: '百夫长之威', englishName: 'Comitatenses', cost: '700肉 800金', effect: '军团兵、铁甲步兵与百夫长训练速度 +50% 且附带充能攻击' },
        teamBonus: '弩炮射击最小射程死角被彻底消除',
        bonuses: [
            '村民采木、采矿、建造速度加快 5%',
            '战舰加农炮与弩炮发射双重抛射物',
            '百夫长骑兵可极大光环提升周围军团兵的攻击与移动速度',
            '长剑士可升级为强大的特色军团兵 (Legionary)',
        ],
        historyBrief: '古典罗马军团在决定版中焕发新生。步兵方阵与战地指挥官百夫长协同作战，配合精确致命的投石机与重型弩炮阵重现帝国荣耀。',
    },

    // ── 中东与高加索 (6) ──
    {
        id: 'saracens',
        name: '萨拉森',
        englishName: 'Saracens',
        region: '中东与高加索',
        focus: '骆驼与海军文明',
        architecture: '中东',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['马穆鲁克 (Mameluke)'],
        uniqueTechCastle: { name: '重装护甲', englishName: 'Madrasah', cost: '200肉 100金', effect: '僧侣阵亡时返还 33 黄金' },
        uniqueTechImperial: { name: '狂热', englishName: 'Zealotry', cost: '750肉 700金', effect: '骆驼与马穆鲁克骑兵生命值 +20' },
        teamBonus: '步弓手对建筑额外攻击力 +2',
        bonuses: [
            '市场交易税率固定仅为 5% (其他文明为 30%)',
            '大型战舰开火速度加快 25%',
            '骆驼骑兵生命值在城堡/帝王时代 +10/+20',
        ],
        historyBrief: '萨拉丁统率的萨拉森帝国在十字军东征中捍卫圣城。马穆鲁克弯刀骑兵能在近战中掷出弯刀进行短程斩击，是敌方重骑兵的致命克星。',
    },
    {
        id: 'turks',
        name: '土耳其',
        englishName: 'Turks',
        region: '中东与高加索',
        focus: '火药文明',
        architecture: '中东',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['土耳其禁卫军 (Janissary)'],
        uniqueTechCastle: { name: '贝利里克火炮', englishName: 'Sipahi', cost: '350肉 150金', effect: '骑射手生命值 +20' },
        uniqueTechImperial: { name: '火炮术', englishName: 'Artillery', cost: '500金 450石', effect: '手推炮、炮舰、火炮塔射程 +2' },
        teamBonus: '火药单位生产速度加快 25%',
        bonuses: [
            '火药科技研发免费，化学在进入帝王时代自动获得',
            '火药单位生命值 +25%',
            '采金工人工作效率加快 20%',
            '轻骑兵与翼骑兵升级完全免费',
        ],
        historyBrief: '奥斯曼帝国的苏丹禁卫军与庞大的乌尔班巨炮轰塌了君士坦丁堡千年城墙。土耳其拥有全游戏射程最恐怖的手推炮与火炮防线。',
    },
    {
        id: 'persians',
        name: '波斯',
        englishName: 'Persians',
        region: '中东与高加索',
        focus: '骑兵文明',
        architecture: '中东',
        dlc: '原版 (Age of Kings 1999, 2023皇家山脉重做)',
        uniqueUnits: ['波斯战象 (War Elephant)', '萨瓦兰重骑兵 (Savalaran)'],
        uniqueTechCastle: { name: '坎儿井引水', englishName: 'Kamandaran', cost: '400肉 300金', effect: '步弓手消耗黄金改为消耗 60 木材' },
        uniqueTechImperial: { name: '独裁官铁骑', englishName: 'Citadels', cost: '800肉 600金', effect: '城堡受损受到攻击减免，并射出贯穿箭矢' },
        teamBonus: '骑士对弓箭手额外伤害 +2',
        bonuses: [
            '开局额外享有 +50 木材与 +50 食物',
            '城镇中心与码头生命值翻倍，在不同时代工作效率提高 (封建+10%, 城堡+15%, 帝王+20%)',
            '帝国时代可将游侠升级为重甲萨瓦兰骑兵 (Savalaran)',
        ],
        historyBrief: '承袭阿契美尼德与萨珊波斯的辉煌，波斯帝国兼具雄厚的人口内政爆发力。重型波斯战象与新重制的萨瓦兰重骑是正面战场最具碾压力的重型单位。',
    },
    {
        id: 'berbers',
        name: '柏柏尔',
        englishName: 'Berbers',
        region: '中东与高加索',
        focus: '骑兵与海军文明',
        architecture: '中东',
        dlc: '非洲王国 (African Kingdoms 2015)',
        uniqueUnits: ['骆驼弓箭手 (Camel Archer)', '标枪骑兵 (Genitour)'],
        uniqueTechCastle: { name: '卡斯巴要塞', englishName: 'Kasbah', cost: '250肉 250金', effect: '同盟所有城堡工作速率提升 25%' },
        uniqueTechImperial: { name: '马格里布骆驼', englishName: 'Maghrebi Camels', cost: '700食物 300金', effect: '骆驼部队随时间自动回复生命值' },
        teamBonus: '同盟可在靶场训练特色骑马标枪骑兵',
        bonuses: [
            '村民移动速度加快 10%',
            '马厩骑兵单位在城堡时代与帝王时代成本分别减少 15% / 20%',
            '舰船航行移动速度提高 10%',
        ],
        historyBrief: '北非马格里布与安达卢斯的柏柏尔骑兵。凭借极其廉价的骑兵暴兵速度与擅长射杀敌军骑射手的骆驼弓手驰骋沙场。',
    },
    {
        id: 'armeniens',
        name: '亚美尼亚',
        englishName: 'Armenians',
        region: '中东与高加索',
        focus: '步兵与海军文明',
        architecture: '高加索/地中海',
        dlc: '皇家山脉 (The Mountain Royals 2023)',
        uniqueUnits: ['复合弓箭手 (Composite Bowman)', '僧侣战士 (Warrior Priest)'],
        uniqueTechCastle: { name: '奇里乞亚舰队', englishName: 'Cilician Fleet', cost: '350木 300金', effect: '爆破船杀伤半径 +20%，战舰发射双重箭' },
        uniqueTechImperial: { name: '铁甲弓手', englishName: 'Fereters', cost: '550肉 400金', effect: '步兵近防 +1，复合弓手射速提升' },
        teamBonus: '步兵视野 +2',
        bonuses: [
            '可以用骡车 (Mule Cart) 作为可移动的资源存放点',
            '可在封建时代直接研发铁甲步兵科技',
            '僧侣战士既能招降与搬运圣物，亦可近战杀敌',
        ],
        historyBrief: '高加索山脉与小亚美尼亚王国的古老文明。身手矫捷的复合弓箭手能无视敌方护甲造成精准杀伤，圣洁与勇武兼具的僧侣战士是独特的核心。',
    },
    {
        id: 'georgians',
        name: '格鲁吉亚',
        englishName: 'Georgians',
        region: '中东与高加索',
        focus: '骑兵与防御文明',
        architecture: '高加索/中东',
        dlc: '皇家山脉 (The Mountain Royals 2023)',
        uniqueUnits: ['莫纳斯帕突骑 (Monaspa)'],
        uniqueTechCastle: { name: '斯维尔要塞教堂', englishName: 'Svan Towers', cost: '300石 200金', effect: '要塞教堂射出额外加农箭矢，防御塔攻击提升' },
        uniqueTechImperial: { name: '阿扎乌利重甲', englishName: 'Aznauri Cavalry', cost: '700肉 450金', effect: '骑兵占用人口减少 15%' },
        teamBonus: '修筑城墙与防御建筑耗时减少 25%',
        bonuses: [
            '开局携带额外一头山羊，依托骡车高效采矿与采木',
            '在处于高地地形时，单位获得更高额的地形伤害加成与受损减免',
            '莫纳斯帕骑兵在聚集集团作战时，每相邻一名友军即可叠加攻击力',
        ],
        historyBrief: '塔玛尔女王黄金时代的格鲁吉亚王国。高耸坚固的斯维尔塔楼构筑天堑，抱团冲锋的莫纳斯帕骑兵群拥有遇强越强的恐怖近战杀伤力。',
    },

    // ── 大草原与中亚 (4) ──
    {
        id: 'bulgarians',
        name: '保加利亚',
        englishName: 'Bulgarians',
        region: '大草原与中亚',
        focus: '步兵与骑兵文明',
        architecture: '东欧',
        dlc: '最后的可汗 (The Last Khans 2019)',
        uniqueUnits: ['保加利亚骑兵 (Konnik)'],
        uniqueTechCastle: { name: '克雷波斯特要塞', englishName: 'Krepost', cost: '400石 350金', effect: '建造更廉价坚固的微型特色要塞' },
        uniqueTechImperial: { name: '马镫', englishName: 'Stirrups', cost: '400肉 400金', effect: '轻骑兵与保加利亚骑兵攻击速度大幅提高 33%' },
        teamBonus: '铁匠铺工作速度加快 80%',
        bonuses: [
            '民兵线步兵每次时代升级免费自动获得',
            '城镇中心建造石料消耗降低 50%',
            '保加利亚骑兵战马阵亡后，骑士可从地上站起继续以重装步兵形态搏杀 (双命机制)',
        ],
        historyBrief: '保加利亚第一与第二帝国融合了大草原游牧骑射与拜占庭重装甲技术。双命形态的保加利亚骑兵与铁匠铺神速打铁让其爆发力极强。',
    },
    {
        id: 'cumans',
        name: '库曼',
        englishName: 'Cumans',
        region: '大草原与中亚',
        focus: '骑兵与速攻文明',
        architecture: '中亚',
        dlc: '最后的可汗 (The Last Khans 2019)',
        uniqueUnits: ['钦察骑射手 (Kipchak)'],
        uniqueTechCastle: { name: '草原畜牧', englishName: 'Steppe Husbandry', cost: '200肉 300木', effect: '轻骑兵、草原骑兵、骑射手训练速度加快 100%' },
        uniqueTechImperial: { name: '库曼佣兵', englishName: 'Cuman Mercenaries', cost: '650肉 400金', effect: '同盟每座城堡免费生产 5 名精锐钦察骑射手' },
        teamBonus: '木墙生命值提高 33%',
        bonuses: [
            '可在封建时代建造第二个城镇中心与攻城武器厂 (封建双 TC 抢经济或封建冲车冲脸)',
            '骑兵单位移动速度按时代提升 (每时代 +5%)',
            '钦察骑射手开火发射连珠多支箭矢',
        ],
        historyBrief: '活跃在南俄大草原的库曼-钦察游牧部族。其独步天下的封建时代建造第二城镇中心与冲车速推能力，在对局早期即能掀起狂风暴雨。',
    },
    {
        id: 'lithuanians',
        name: '立陶宛',
        englishName: 'Lithuanians',
        region: '大草原与中亚',
        focus: '骑兵与修道院文明',
        architecture: '东欧',
        dlc: '最后的可汗 (The Last Khans 2019)',
        uniqueUnits: ['皇家骑士 (Leitis)'],
        uniqueTechCastle: { name: '山丘要塞', englishName: 'Hill Forts', cost: '250肉 250金', effect: '城镇中心射程 +3' },
        uniqueTechImperial: { name: '重装塔盾', englishName: 'Tower Shields', cost: '500肉 200金', effect: '长枪兵与掷矛手远程护甲 +2' },
        teamBonus: '修道院工作效率提高 20%',
        bonuses: [
            '游戏开局立即免费拥有额外 +150 食物',
            '长枪兵与掷矛手移动速度加快 10%',
            '修道院每入驻一件圣物，骑士与皇家骑士攻击力各 +1 (最多叠加 +4 攻击)',
            '皇家骑士攻击完全无视目标所有护甲直接造成真伤',
        ],
        historyBrief: '欧洲最后一个皈依基督教的古老勇士国度。收集齐4个圣物的立陶宛游侠攻击力傲视群雄，皇家骑士的真伤无视任何重装甲。',
    },
    {
        id: 'tatars',
        name: '鞑靼',
        englishName: 'Tatars',
        region: '大草原与中亚',
        focus: '骑射手文明',
        architecture: '中亚',
        dlc: '最后的可汗 (The Last Khans 2019)',
        uniqueUnits: ['怯薛步骑 (Keshik)', '火骆驼 (Flaming Camel)'],
        uniqueTechCastle: { name: '丝甲', englishName: 'Silk Armor', cost: '400木 300金', effect: '斥候骑兵、草原骑兵、骑射手双防各 +1' },
        uniqueTechImperial: { name: '帖木儿攻城术', englishName: 'Timurid Siegecraft', cost: '500木 400金', effect: '巨型投石机射程 +2，并允许训练自爆火骆驼' },
        teamBonus: '骑射手视野 +2',
        bonuses: [
            '放牧羊群提供额外 50% 的食物量',
            '从高处向下攻击敌军时，伤害加成由常规 25% 提升至 50%',
            '城堡与帝王时代升级完毕后免费获得 2 头蓄养山羊',
            '怯薛骑兵每次攻击敌军时源源不断为己方掠夺黄金',
        ],
        historyBrief: '帖木儿大帝建立的帝国，雄踞撒马尔罕。怯薛突骑在作战中吸取黄金，配以丝绸软甲骑射阵与长达 19 格射程的帖木儿超级投石机。',
    },

    // ── 东亚 (4) ──
    {
        id: 'chinese',
        name: '中国',
        englishName: 'Chinese',
        region: '东亚',
        focus: '弓兵与泛用科技文明',
        architecture: '东亚',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['诸葛弩 (Chu Ko Nu)'],
        uniqueTechCastle: { name: '长城', englishName: 'Great Wall', cost: '400木 200石', effect: '城墙与城门生命值 +30%' },
        uniqueTechImperial: { name: '火箭术', englishName: 'Rocketry', cost: '750木 750金', effect: '诸葛弩攻击力 +2，弩炮攻击力 +4' },
        teamBonus: '农田产量 +45 食物',
        bonuses: [
            '开局多出 3 名村民 (初始为 6 村)，但开局食物少 200，木材少 50',
            '所有科技研发成本在封建时代 -10%，城堡时代 -15%，帝王时代 -20%',
            '爆破船生命值 +50%',
            '城镇中心提供 +10 人口容量与支持',
        ],
        historyBrief: '华夏文明拥有博大精深的科技底蕴与强大的综合国力。连发机关的诸葛弩射速密集如倾盆暴雨，全科技成本递减让中国在后期转型极度自如。',
    },
    {
        id: 'mongols',
        name: '蒙古',
        englishName: 'Mongols',
        region: '东亚',
        focus: '骑射手文明',
        architecture: '东亚',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['蒙古突骑 (Mangudai)'],
        uniqueTechCastle: { name: '游牧', englishName: 'Nomads', cost: '300木 150金', effect: '房屋被摧毁后其人口上限依然永久保留' },
        uniqueTechImperial: { name: '攻城钻', englishName: 'Drill', cost: '500木 450金', effect: '攻城武器厂单位移动速度大幅提升 50%' },
        teamBonus: '斥候骑兵与轻骑兵视野 +2',
        bonuses: [
            '猎人采猎鹿群与野猪速度加快 40%',
            '轻骑兵、草原骑兵、翼骑兵生命值 +30%',
            '骑射手开火速度加快 25%',
        ],
        historyBrief: '成吉思汗的铁骑横扫欧亚大陆。蒙古突骑是全游戏机动与对攻城武器毁灭力最强的王牌骑射手，搭配神速攻城钻冲车无人能挡。',
    },
    {
        id: 'japanese',
        name: '日本',
        englishName: 'Japanese',
        region: '东亚',
        focus: '步兵文明',
        architecture: '东亚',
        dlc: '原版 (Age of Kings 1999)',
        uniqueUnits: ['日本武士 (Samurai)'],
        uniqueTechCastle: { name: '射箭孔', englishName: 'Yasama', cost: '300木 300肉', effect: '箭塔射出额外数支箭矢' },
        uniqueTechImperial: { name: '投石机加固', englishName: 'Kataparuto', cost: '750木 400金', effect: '巨型投石机组装与拆卸速度加快4倍，且攻击速度加快' },
        teamBonus: '战舰视野 +50%',
        bonuses: [
            '渔船生命值翻倍，防箭能力提升，捕鱼效率按时代提升 (最高 +20%)',
            '磨坊、伐木场、采矿场建造消耗 -50% 木材',
            '步兵单位攻击速度从封建时代起加快 33%',
        ],
        historyBrief: '日本战国武士刀法凌厉，拔刀断铁。特种日本武士对所有其他文明的特色单位均享有毁灭性的额外伤害加成。',
    },
    {
        id: 'koreans',
        name: '高丽',
        englishName: 'Koreans',
        region: '东亚',
        focus: '防御与海军文明',
        architecture: '东亚',
        dlc: '征服者 (The Conquerors 2000)',
        uniqueUnits: ['战车 (War Wagon)', '龟甲船 (Turtle Ship)'],
        uniqueTechCastle: { name: '板屋船', englishName: 'Panokseon', cost: '300木 300肉', effect: '龟甲船移动速度加快 15%' },
        uniqueTechImperial: { name: '神机箭', englishName: 'Shinkichon', cost: '800木 500金', effect: '中型与重型投石车射程 +1' },
        teamBonus: '投石车最小射程死角减半',
        bonuses: [
            '村民视野 +3，采石工速度加快 20%',
            '箭塔在不同时代升级免费，且城堡与帝王时代射程各 +1/+2',
            '重装防御战车拥有极高远程护甲，坚若移动堡垒',
        ],
        historyBrief: '李舜臣将军的龟甲船与火炮神机箭是朝鲜抵御侵略的中流砥柱。高丽以坚固的箭塔防御体系与高护甲攻城战车称霸战场。',
    },

    // ── 东南亚 (4) ──
    {
        id: 'khmer',
        name: '高棉',
        englishName: 'Khmer',
        region: '东南亚',
        focus: '攻城与战象文明',
        architecture: '东南亚',
        dlc: '蛮王崛起 (Rise of the Rajas 2016)',
        uniqueUnits: ['弩炮象 (Ballista Elephant)'],
        uniqueTechCastle: { name: '獠牙剑', englishName: 'Tusk Swords', cost: '300肉 450金', effect: '战象攻击力 +3' },
        uniqueTechImperial: { name: '双弩机', englishName: 'Double Crossbow', cost: '700肉 400金', effect: '弩炮与弩炮象发射双重投射物' },
        teamBonus: '弩炮射程 +1',
        bonuses: [
            '建造进阶科技建筑无需先决条件建筑 (如无兵营亦可直接建马厩/靶场)',
            '农夫产出食物直接入库，无需返回磨坊或城镇中心',
            '村民可以临时躲入房屋避难',
            '战象移动速度加快 10%',
        ],
        historyBrief: '吴哥窟的建造者高棉帝国拥有先进的水利灌溉网络。其背负巨型弩机的弩炮象可直接射穿丛林树木开辟通道，极具战略奇袭性。',
    },
    {
        id: 'vietnamese',
        name: '越南',
        englishName: 'Vietnamese',
        region: '东南亚',
        focus: '弓兵文明',
        architecture: '东南亚',
        dlc: '蛮王崛起 (Rise of the Rajas 2016)',
        uniqueUnits: ['藤甲弓兵 (Rattan Archer)', '帝国掷矛手 (Imperial Skirmisher)'],
        uniqueTechCastle: { name: '城寨要塞', englishName: 'Chatras', cost: '250肉 250金', effect: '战象生命值额外增加 +100' },
        uniqueTechImperial: { name: '纸造铠甲', englishName: 'Paper Money', cost: '500木 300金', effect: '将伐木工以固定速率生产微量黄金' },
        teamBonus: '同盟在帝王时代可研发并升级为帝国掷矛手',
        bonuses: [
            '游戏开局立即在迷雾中点亮所有敌方的城镇中心坐标',
            '射手系单位生命值提高 20%',
            '免费研发征召（征兵）科技',
        ],
        historyBrief: '黎利领导的大越军民善于利用丛林与坚毅防线抗击外敌。高远防的藤甲弓兵与帝王掷矛手令一切敌国射手望而却步。',
    },
    {
        id: 'burmese',
        name: '缅甸',
        englishName: 'Burmese',
        region: '东南亚',
        focus: '步兵与僧侣文明',
        architecture: '东南亚',
        dlc: '蛮王崛起 (Rise of the Rajas 2016)',
        uniqueUnits: ['飞镖骑兵 (Arambai)'],
        uniqueTechCastle: { name: '曼尼普尔马', englishName: 'Manipur Cavalry', cost: '400肉 400金', effect: '骑兵对建筑额外造成伤害加成' },
        uniqueTechImperial: { name: '豪狮重甲', englishName: 'Howdah', cost: '400肉 300金', effect: '战象近战与远程护甲各 +1/+1' },
        teamBonus: '圣物在小地图开局即直接高亮显示其坐标',
        bonuses: [
            '伐木场科技升级完全免费自动获得',
            '步兵在每个时代攻击力各 +1 (封建+1, 城堡+2, 帝王+3)',
            '修道院科技研发成本减半 50%',
        ],
        historyBrief: '缅甸东吁王朝的战象军团横扫中南半岛。投掷涂毒飞镖的飞镖骑兵攻击力极为爆表，全免费伐木科技提供了深厚的木材内政支持。',
    },
    {
        id: 'malay',
        name: '马来',
        englishName: 'Malay',
        region: '东南亚',
        focus: '海军与步兵文明',
        architecture: '东南亚',
        dlc: '蛮王崛起 (Rise of the Rajas 2016)',
        uniqueUnits: ['爪刀勇士 (Karambit Warrior)'],
        uniqueTechCastle: { name: '海上城堡', englishName: 'Thalassocracy', cost: '300肉 300金', effect: '码头升级为能射箭防御的海上城堡 (Harbor)' },
        uniqueTechImperial: { name: '雇佣兵征发', englishName: 'Forced Levy', cost: '850肉 500金', effect: '民兵线步兵完全不再消耗黄金 (变为仅需纯食物)' },
        teamBonus: '码头视野翻倍 +100%',
        bonuses: [
            '时代演进提升速度加快 66% (封建与城堡时代瞬间完成)',
            '渔网成本降低 33% 且提供无限食物量',
            '爪刀勇士只占用半个人口 (0.5 人口一个)',
        ],
        historyBrief: '掌控马六甲海峡的满者伯夷千岛帝国。极速升时代的跳科技能力与能变成纯食物消耗的无限冠军剑士狂潮让对手防不胜防。',
    },

    // ── 南亚 (4) ──
    {
        id: 'hindustanis',
        name: '印度斯坦',
        englishName: 'Hindustanis',
        region: '南亚',
        focus: '骆驼与火药文明',
        architecture: '南亚',
        dlc: '印度王朝 (Dynasties of India 2022重做)',
        uniqueUnits: ['古拉姆近卫步兵 (Ghulam)', '帝王骆驼骑兵 (Imperial Camel)'],
        uniqueTechCastle: { name: '大莫卧尔', englishName: 'Grand Trunk Road', cost: '250肉 200金', effect: '所有黄金收入速度 +10%，贸易费用减半' },
        uniqueTechImperial: { name: '沙蒂要塞火器', englishName: 'Shatagni', cost: '500肉 300金', effect: '火枪手射程 +2' },
        teamBonus: '骆驼骑兵与轻骑兵对建筑攻击 +2',
        bonuses: [
            '村民成本随时代递减 (黑暗-10%, 封建-15%, 城堡-20%, 帝王-25%)',
            '骆驼骑兵攻击速度提高 25%',
            '火药单位护甲 +1/+1',
        ],
        historyBrief: '德里苏丹国与莫卧儿帝国的精锐武装。拥有长枪贯穿群伤特性的古拉姆步兵与终极帝王骆驼骑兵，构成了南亚大陆最强悍的破阵骑兵。',
    },
    {
        id: 'gurjaras',
        name: '古吉拉特',
        englishName: 'Gujaratis',
        region: '南亚',
        focus: '骑兵与机动文明',
        architecture: '南亚',
        dlc: '印度王朝 (Dynasties of India 2022)',
        uniqueUnits: ['飞轮勇士 (Chakram Thrower)', '施里瓦姆沙骑兵 (Shrivamsha Rider)'],
        uniqueTechCastle: { name: '刹帝利种姓', englishName: 'Kshatriyas', cost: '200肉 400金', effect: '所有军事单位食物成本降低 25%' },
        uniqueTechImperial: { name: '边防边塞', englishName: 'Frontier Guards', cost: '800木 700金', effect: '骆驼与骑兵近战护甲 +4' },
        teamBonus: '骆驼与大象单位生产速度加快 25%',
        bonuses: [
            '开局拥有额外灌木丛，可将牛羊牲畜进驻磨坊以源源不断产出食物',
            '施里瓦姆沙骑兵拥有独特的躲避护盾 (Dodge Shield)，可完全免疫数发远程箭矢',
            '骑兵对步兵额外造成 +50% 伤害加成',
        ],
        historyBrief: '印度西部的古吉拉特王国凭借敏捷的施里瓦姆沙突骑与致命的旋转金属飞轮勇士，在烈日沙漠上撕裂敌军阵线。',
    },
    {
        id: 'bengalis',
        name: '孟加拉',
        englishName: 'Bengalis',
        region: '南亚',
        focus: '大象与海军文明',
        architecture: '南亚',
        dlc: '印度王朝 (Dynasties of India 2022)',
        uniqueUnits: ['乘战车弓手 (Ratha)'],
        uniqueTechCastle: { name: '帕拉王室密法', englishName: 'Paiks', cost: '350肉 300金', effect: '乘战车弓手与战象开火攻击速率加快 20%' },
        uniqueTechImperial: { name: '大乘经义', englishName: 'Mahayana', cost: '800肉 650金', effect: '村民占用人口减少 10% (0.9人口一个)' },
        teamBonus: '贸易马车与贸易船产生 10% 食物',
        bonuses: [
            '每次升级时代立即免费获得 2 名新村民',
            '战象单位受到的一切额外克制伤害减少 25%，抵抗招降能力更强',
            '战车可在远程弓箭形态与近战挥砍形态间随心切换',
        ],
        historyBrief: '恒河三角洲的孟加拉波罗王朝。近战与远程一键切换的战车 Ratha 极具灵活性，坚韧的象群与超高人口上限支撑起强大的大后期。',
    },
    {
        id: 'dravidians',
        name: '达罗毗荼',
        englishName: 'Dravidians',
        region: '南亚',
        focus: '步兵与海军文明',
        architecture: '南亚',
        dlc: '印度王朝 (Dynasties of India 2022)',
        uniqueUnits: ['弯刃勇士 (Urumi Swordsman)', '三层划桨战舰 (Thirisadai)'],
        uniqueTechCastle: { name: '医用钢刃', englishName: 'Medical Corps', cost: '300肉 200金', effect: '战象单位每分钟恢复大量生命值' },
        uniqueTechImperial: { name: '乌兹钢刀', englishName: 'Wootz Steel', cost: '750肉 600金', effect: '步兵与骑兵近战攻击完全无视目标所有近战护甲' },
        teamBonus: '攻城武器厂单位木材成本降低 33%',
        bonuses: [
            '每次晋升时代立即免费获得 +200 木材',
            '渔夫与捕鱼船携带资源量 +15',
            '步兵近战攻击速度提高 33%，乌兹钢刀让一切高甲单位沦为脆纸',
        ],
        historyBrief: '南印度朱罗帝国的霸主，掌控印度洋贸易。手持柔软锋利甩刃的弯刃勇士爆发力惊人，乌兹钢刀科技彻底斩碎一切重甲敌手。',
    },

    // ── 美洲 (3) ──
    {
        id: 'aztecs',
        name: '阿兹特克',
        englishName: 'Aztecs',
        region: '美洲',
        focus: '步兵与僧侣文明 (无马厩)',
        architecture: '美洲',
        dlc: '征服者 (The Conquerors 2000)',
        uniqueUnits: ['豹勇士 (Jaguar Warrior)'],
        uniqueTechCastle: { name: '阿兹特克重剑', englishName: 'Atlatl', cost: '400肉 350金', effect: '掷矛手攻击力与射程各 +1' },
        uniqueTechImperial: { name: '荣冠战争', englishName: 'Garland Wars', cost: '450肉 750金', effect: '所有步兵攻击力强力 +4' },
        teamBonus: '圣物产金速度加快 33%',
        bonuses: [
            '村民搬运资源负载量 +3',
            '所有军事单位生产速度加快 11%',
            '修道院每研发一项科技，僧侣生命值 +5',
            '织布机科技完全免费',
        ],
        historyBrief: '崇拜太阳神与羽蛇神的墨西加帝国军士。豹勇士挥舞嵌满黑曜石利刃的马夸威特尔木棒，对所有步兵单位具有毁灭性的屠戮效果。',
    },
    {
        id: 'mayans',
        name: '玛雅',
        englishName: 'Mayans',
        region: '美洲',
        focus: '弓兵文明 (无马厩)',
        architecture: '美洲',
        dlc: '征服者 (The Conquerors 2000)',
        uniqueUnits: ['羽箭手 (Plumed Archer)', '精锐鹰勇士 (Elite Eagle Warrior)'],
        uniqueTechCastle: { name: '投石索', englishName: 'Hul\'che Javelineers', cost: '300肉 200金', effect: '掷矛手射出第二支辅助投枪' },
        uniqueTechImperial: { name: '雄鹰荣耀', englishName: 'El Dorado', cost: '750肉 450金', effect: '鹰勇士生命值巨幅增加 +40' },
        teamBonus: '城墙与石墙造价降低 50%',
        bonuses: [
            '开局多出 1 名村民，但食物少 50',
            '自然资源（树木、矿产、猎物）持久度提高 15%',
            '步弓手生产成本递减 (封建-10%, 城堡-20%, 帝王-30%)',
        ],
        historyBrief: '深居尤卡坦丛林的玛雅文明擅长持久战与阵地弓箭伏击。高移动速度且身披华美鸟羽的羽箭手机动灵活，生命力惊人的黄金鹰勇士是无马厩美洲的王牌战力。',
    },
    {
        id: 'incas',
        name: '印加',
        englishName: 'Incas',
        region: '美洲',
        focus: '步兵文明 (无马厩)',
        architecture: '美洲',
        dlc: '被遗忘的帝国 (The Forgotten 2013)',
        uniqueUnits: ['投石手 (Slinger)', '枪斧手 (Kamayuk)'],
        uniqueTechCastle: { name: '安第斯投石索', englishName: 'Andean Sling', cost: '200肉 300金', effect: '掷矛手与投石手消除近身最小射程死角' },
        uniqueTechImperial: { name: '布甲战衣', englishName: 'Fabric Shields', cost: '600肉 600金', effect: '枪斧手、投石手与鹰勇士近防和远防各增加 +1/+2' },
        teamBonus: '农田修建速度加快 100%',
        bonuses: [
            '开局拥有额外一只免费的羊驼提供口粮',
            '民居房屋提供 10 个人口支持 (常规房屋为 5)',
            '建筑物石料消耗减少 15%',
            '枪斧手手持长矛拥有超远 1 格近战攻击距离 (可隔人攻击)',
        ],
        historyBrief: '安第斯山巅的印加帝国。长矛枪斧手 Kamayuk 拥有独特的 1 格穿透攻击射程，集结成阵时能隔着前排战友痛击敌骑兵，防御固若金汤。',
    },

    // ── 非洲 (2) ──
    {
        id: 'malians',
        name: '马里',
        englishName: 'Malians',
        region: '非洲',
        focus: '步兵与经济文明',
        architecture: '非洲',
        dlc: '非洲王国 (African Kingdoms 2015)',
        uniqueUnits: ['飞刀女兵 (Gbeto)'],
        uniqueTechCastle: { name: '坚木盾牌', englishName: 'Tigui', cost: '300木 200肉', effect: '城镇中心射箭无需村民驻扎即可自动发射' },
        uniqueTechImperial: { name: '法里巴骑兵', englishName: 'Farimba', cost: '650肉 400金', effect: '马厩所有骑兵攻击力强劲 +5' },
        teamBonus: '大学科技研发速度提高 80%',
        bonuses: [
            '建筑物除农田外木材消耗 -15%',
            '兵营步兵从封建时代起每个时代获得额外 +1 远程护甲 (帝王时代高达 +3 远防)',
            '金矿储量开采时间延长 30%',
        ],
        historyBrief: '曼萨·穆萨时代的黄金帝国马里富甲天下。步兵凭借极高的防箭能力直冲敌阵，移速极快的飞刀女兵与法里巴重骑兵攻守兼备。',
    },
    {
        id: 'ethiopians',
        name: '埃塞俄比亚',
        englishName: 'Ethiopians',
        region: '非洲',
        focus: '弓兵与攻城武器文明',
        architecture: '非洲',
        dlc: '非洲王国 (African Kingdoms 2015)',
        uniqueUnits: ['弯刀勇士 (Shotel Warrior)'],
        uniqueTechCastle: { name: '皇家准许', englishName: 'Royal Heirs', cost: '300肉 300金', effect: '弯刀勇士训练时间减少至难以置信的 4 秒一个' },
        uniqueTechImperial: { name: '扭力投石机', englishName: 'Torsion Engines', cost: '1000肉 600金', effect: '攻城武器厂所有单位杀伤溅射范围大幅扩张' },
        teamBonus: '哨站与箭塔视野大幅提升 +3',
        bonuses: [
            '步弓手开火速率加快 18%',
            '每次升级时代立即免费获得 100 食物与 100 黄金',
            '长枪兵科技免费升级',
        ],
        historyBrief: '阿克苏姆古国的后继者，东非高原上的坚强要塞。弯刀勇士爆发力惊人，配合射速极快的步弓手与大范围杀伤的扭力投石机在阵地战中无坚不摧。',
    },

    // ── 维京传奇 (The Viking Sagas 2026年9月最新DLC) ──
    {
        id: 'danes',
        name: '丹麦',
        englishName: 'Danes',
        region: '西欧',
        focus: '步兵与海军文明',
        architecture: '西欧',
        dlc: '维京传奇 (The Viking Sagas 2026)',
        uniqueUnits: ['约姆维京人 (Jomsviking)'],
        uniqueTechCastle: { name: '劫掠纵火', englishName: 'Raid and Plunder', cost: '350肉 250金', effect: '步兵与战船摧毁建筑时额外掳掠黄金与食物' },
        uniqueTechImperial: { name: '丹麦斧术', englishName: 'Dane Axe Mastery', cost: '600肉 450金', effect: '步兵破甲攻击力 +2，对所有重装单位附带撕裂伤害' },
        teamBonus: '码头战船移动速度加快 10%',
        bonuses: [
            '封建时代早期拥有极速长船优势，海战施压能力极强',
            '约姆维京人投掷燃烧火把，对建筑物与敌方战船造成毁灭性打击',
            '步兵砍伐树木效率提升 15%，前期经济启动极其平滑',
            '帝王时代步兵攻防迎来二次巨幅战力爆发',
        ],
        historyBrief: '北海霸主丹麦王国。以约姆维京军团为核心，凭借精湛的维京造船术与勇悍的掠夺战术纵横北欧海域，更一度建立横跨英格兰与斯堪的纳维亚的北海大帝国。',
    },
    {
        id: 'saxons',
        name: '撒克逊',
        englishName: 'Saxons',
        region: '西欧',
        focus: '步兵与防御文明',
        architecture: '中欧',
        dlc: '维京传奇 (The Viking Sagas 2026)',
        uniqueUnits: ['领主扈从/侍从亲卫 (Hearth Troop)'],
        uniqueTechCastle: { name: '堡垒筑城', englishName: 'Burh Fortification', cost: '400石 300木', effect: '城镇中心与箭塔射击箭矢数量 +2' },
        uniqueTechImperial: { name: '塞恩卫队誓约', englishName: 'Thegn Oath', cost: '700肉 500金', effect: '侍从亲卫标枪投掷伤害大幅提升且射程 +1' },
        teamBonus: '建筑修缮工人和村民修理速度加快 25%',
        bonuses: [
            '建造资源存放点（磨坊、伐木场、采矿营地）时立即获赠额外食物与石料',
            '所控制的每一个城镇中心或城堡，都会降低己方地面步兵的生产成本',
            '箭塔与城堡从城堡时代起自动射出额外投射物箭矢',
            '维京长船与投石巨舰拥有更高生命值',
        ],
        historyBrief: '坚忍沉稳的英格兰撒克逊王国。擅长依托精心修筑的伯格（Burh）要塞体系抗击维京劫掠，侍从亲卫以标枪先声夺人，随后结成铁血盾墙步战死斗。',
    },
    {
        id: 'varangians',
        name: '瓦良格',
        englishName: 'Varangians',
        region: '中东欧',
        focus: '骑兵与海军文明',
        architecture: '东欧',
        dlc: '维京传奇 (The Viking Sagas 2026)',
        uniqueUnits: ['雅尔骑兵 (Jarl)'],
        uniqueTechCastle: { name: '飞斧破阵', englishName: 'Francisca Charge', cost: '450肉 300金', effect: '雅尔骑兵投掷飞斧时可穿透并对直线上的步兵造成贯穿伤害' },
        uniqueTechImperial: { name: '禁卫践踏', englishName: 'Imperial Trample', cost: '850肉 600金', effect: '骑兵线获得类似拜占庭圣骑兵的强力践踏反步兵范围杀伤' },
        teamBonus: '全军对雇佣军与特种单位攻击力 +2',
        bonuses: [
            '特色骑兵雅尔能够远程投掷重斧撕裂敌方步兵阵型',
            '骑士系单位享有践踏反步兵加成，兼具游牧与拜占庭铁甲精髓',
            '可训练特种区域兵种瓦良格卫队，在近战搏杀中持续夺取黄金',
            '拥有高度灵活的河流战船与长途转运水系作战加成',
        ],
        historyBrief: '自斯堪的纳维亚南下东欧与拜占庭的罗斯维京征服者。他们既是黑海与第聂伯河上的无畏航海家，又是君士坦丁堡皇帝最忠诚可怕的瓦良格近卫禁军。',
    },
];

// ──────────────────────────────────────────────
// 2. 核心兵种与单位全录 (Core & Advanced Units)
// ──────────────────────────────────────────────
export const DE_CORE_UNITS: DeUnit[] = [
    // ── 步兵系 ──
    {
        id: 'militia_line',
        name: '民兵 ➔ 冠军剑士',
        englishName: 'Militia ➔ Champion',
        category: '步兵',
        building: '兵营',
        age: '黑暗时代',
        cost: { food: 60, gold: 20 },
        hp: 70, // 冠军剑士数据
        attack: 13,
        meleeArmor: 1,
        pierceArmor: 1,
        range: 0,
        reloadTime: 2.0,
        speed: 0.9,
        armorClasses: ['步兵 (Infantry)'],
        attackBonuses: [
            { targetClass: '鹰勇士 (Eagle)', bonus: 6 },
            { targetClass: '建筑 (Building)', bonus: 4 },
        ],
        description: '标准万用主力步兵线。随着时代可升级为装甲步兵、长剑士、双手剑士直至冠军剑士。适合清理垃圾兵、攻破建筑及克制鹰勇士。',
    },
    {
        id: 'spearman_line',
        name: '长枪兵 ➔ 重装长枪兵 (戟兵)',
        englishName: 'Spearman ➔ Halberdier',
        category: '步兵',
        building: '兵营',
        age: '封建时代',
        cost: { food: 35, wood: 25 },
        hp: 60, // 戟兵数据
        attack: 6,
        meleeArmor: 0,
        pierceArmor: 0,
        range: 0,
        reloadTime: 3.0,
        speed: 1.0,
        armorClasses: ['步兵 (Infantry)', '长枪兵 (Spearman)'],
        attackBonuses: [
            { targetClass: '骑兵 (Cavalry)', bonus: 32 },
            { targetClass: '战象 (War Elephant)', bonus: 28 },
            { targetClass: '骆驼 (Camel)', bonus: 26 },
            { targetClass: '舰船 (Ship)', bonus: 17 },
        ],
        description: '廉价的垃圾兵克骑王牌。不消耗任何黄金，对一切骑兵、战象、骆驼单位享有毁灭性的乘算与固定附加伤害，是步兵防线最可靠的拒马阵。',
    },
    {
        id: 'eagle_warrior',
        name: '鹰勇士 (美洲专属)',
        englishName: 'Eagle Warrior',
        category: '步兵',
        building: '兵营',
        age: '城堡时代',
        cost: { food: 20, gold: 50 },
        hp: 60,
        attack: 9,
        meleeArmor: 0,
        pierceArmor: 4,
        range: 0,
        reloadTime: 2.0,
        speed: 1.2,
        armorClasses: ['步兵 (Infantry)', '鹰勇士 (Eagle Warrior)'],
        attackBonuses: [
            { targetClass: '僧侣 (Monk)', bonus: 10 },
            { targetClass: '骑兵 (Cavalry)', bonus: 4 },
            { targetClass: '攻城武器 (Siege)', bonus: 3 },
        ],
        description: '美洲文明替代骑兵的高机动重甲特战步兵。移动速度极快、远程护甲极高，是对付步弓手、僧侣和攻城武器的利刃。',
    },

    // ── 骑兵系 ──
    {
        id: 'knight_line',
        name: '骑士 ➔ 游侠 (圣骑士)',
        englishName: 'Knight ➔ Paladin',
        category: '骑兵',
        building: '马厩',
        age: '城堡时代',
        cost: { food: 60, gold: 75 },
        hp: 160, // 游侠 Paladin 数据 (法兰克可达 192)
        attack: 14,
        meleeArmor: 2,
        pierceArmor: 3,
        range: 0,
        reloadTime: 1.9,
        speed: 1.35,
        armorClasses: ['骑兵 (Cavalry)'],
        attackBonuses: [],
        description: '帝国时代最具压迫感的中世纪重骑兵终极形态。极高的高血量与重甲冲锋，能在一瞬间撞碎弓兵群与常规步兵阵线，但受到戟兵与骆驼的绝对克制。',
    },
    {
        id: 'scout_cavalry_line',
        name: '斥候 ➔ 翼骑兵 (骠骑兵)',
        englishName: 'Scout Cavalry ➔ Hussar',
        category: '骑兵',
        building: '马厩',
        age: '黑暗时代',
        cost: { food: 80 },
        hp: 75,
        attack: 7,
        meleeArmor: 0,
        pierceArmor: 2,
        range: 0,
        reloadTime: 1.9,
        speed: 1.5,
        armorClasses: ['骑兵 (Cavalry)'],
        attackBonuses: [
            { targetClass: '僧侣 (Monk)', bonus: 12 },
        ],
        description: '不耗黄金的高速斥候骑兵。视野开阔，能抵抗僧侣招降，是后期骚扰农民、抄家、袭杀敌方后排僧侣与投石机的最佳尖兵。',
    },
    {
        id: 'camel_line',
        name: '骆驼骑兵 ➔ 重装骆驼骑兵',
        englishName: 'Camel Rider Line',
        category: '骑兵',
        building: '马厩',
        age: '城堡时代',
        cost: { food: 55, gold: 60 },
        hp: 120,
        attack: 7,
        meleeArmor: 0,
        pierceArmor: 0,
        range: 0,
        reloadTime: 2.0,
        speed: 1.45,
        armorClasses: ['骆驼 (Camel)'],
        attackBonuses: [
            { targetClass: '骑兵 (Cavalry)', bonus: 18 },
            { targetClass: '舰船 (Ship)', bonus: 9 },
        ],
        description: '沙漠之舟与克骑利器。移动速度快于骑士，拥有独特的骆驼护甲类，对常规马匹骑兵享有巨额伤害加成，但不擅长冲杀弓手与建筑。',
    },
    {
        id: 'steppe_lancer',
        name: '草原骑兵 ➔ 精锐草原骑兵',
        englishName: 'Steppe Lancer',
        category: '骑兵',
        building: '马厩',
        age: '城堡时代',
        cost: { food: 70, gold: 40 },
        hp: 80,
        attack: 11,
        meleeArmor: 0,
        pierceArmor: 1,
        range: 1, // 具有 1 格射程的独特近战骑兵
        reloadTime: 2.0,
        speed: 1.45,
        armorClasses: ['骑兵 (Cavalry)'],
        attackBonuses: [],
        description: '中亚与游牧文明特有骑兵。手持长矛，具有 1 格近战攻击距离，多只草原骑兵可前后叠合同时刺杀同一个目标，爆发力极强。',
    },
    {
        id: 'battle_elephant',
        name: '象兵 (东南亚与南亚通用)',
        englishName: 'Battle Elephant',
        category: '骑兵',
        building: '马厩',
        age: '城堡时代',
        cost: { food: 120, gold: 70 },
        hp: 300,
        attack: 14,
        meleeArmor: 1,
        pierceArmor: 3,
        range: 0,
        reloadTime: 2.0,
        speed: 0.85,
        armorClasses: ['骑兵 (Cavalry)', '战象 (War Elephant)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 10 },
        ],
        description: '高血量巨兽装甲。自带践踏溅射伤害，可轻易推平敌军常规防线，但极度畏惧长枪兵的巨额伤害加成与僧侣招降。',
    },

    // ── 射手系 ──
    {
        id: 'archer_line',
        name: '步弓手 ➔ 劲弩手 (弩兵)',
        englishName: 'Archer ➔ Arbalester',
        category: '射手',
        building: '靶场',
        age: '封建时代',
        cost: { wood: 25, gold: 45 },
        hp: 40,
        attack: 6,
        meleeArmor: 0,
        pierceArmor: 0,
        range: 5,
        reloadTime: 2.0,
        speed: 0.96,
        armorClasses: ['射手 (Archer)'],
        attackBonuses: [
            { targetClass: '长枪兵 (Spearman)', bonus: 3 },
        ],
        description: '常规远程火力输出核心。集结成群后依靠弹道学齐射可秒杀大多数近战部队，是前中期掌控战局的核心兵种，但畏惧投石车溅射与掷矛手。',
    },
    {
        id: 'skirmisher_line',
        name: '掷矛手 ➔ 帝国掷矛手',
        englishName: 'Skirmisher ➔ Imperial Skirmisher',
        category: '射手',
        building: '靶场',
        age: '封建时代',
        cost: { food: 25, wood: 35 },
        hp: 35,
        attack: 4,
        meleeArmor: 0,
        pierceArmor: 4,
        range: 5,
        reloadTime: 3.0,
        speed: 0.96,
        armorClasses: ['射手 (Archer)'],
        attackBonuses: [
            { targetClass: '射手 (Archer)', bonus: 5 },
            { targetClass: '长枪兵 (Spearman)', bonus: 3 },
            { targetClass: '骑射手 (Cavalry Archer)', bonus: 3 },
        ],
        description: '无金垃圾兵克弓之王。天生高远程护甲，且对一切步弓、骑射具有巨额伤害附加，拥有 1 格近身最小射程死角盲区。',
    },
    {
        id: 'cavalry_archer',
        name: '骑射手 ➔ 重装骑射手',
        englishName: 'Cavalry Archer Line',
        category: '射手',
        building: '靶场',
        age: '城堡时代',
        cost: { wood: 40, gold: 60 },
        hp: 60,
        attack: 7,
        meleeArmor: 1,
        pierceArmor: 0,
        range: 4,
        reloadTime: 2.0,
        speed: 1.4,
        armorClasses: ['射手 (Archer)', '骑兵 (Cavalry)', '骑射手 (Cavalry Archer)'],
        attackBonuses: [
            { targetClass: '长枪兵 (Spearman)', bonus: 4 },
        ],
        description: '结合骑兵机动性与射手杀伤力的精锐单位。极度依赖帕提亚战术（Parthian Tactics）、拇指扳机与血统等科技成型，成型后放风筝无解。',
    },

    // ── 火药武器 ──
    {
        id: 'hand_cannoneer',
        name: '火枪手 (手铳兵)',
        englishName: 'Hand Cannoneer',
        category: '火药武器',
        building: '靶场',
        age: '帝王时代',
        cost: { food: 45, gold: 50 },
        hp: 40,
        attack: 17,
        meleeArmor: 1,
        pierceArmor: 0,
        range: 7,
        reloadTime: 3.45,
        speed: 0.96,
        armorClasses: ['射手 (Archer)', '火药单位 (Gunpowder)'],
        attackBonuses: [
            { targetClass: '步兵 (Infantry)', bonus: 10 },
            { targetClass: '长枪兵 (Spearman)', bonus: 1 },
            { targetClass: '鹰勇士 (Eagle)', bonus: 2 },
        ],
        description: '帝王时代近距灭步王牌。攻击力高达 17，对一切步兵单位具有 +10 恐怖毁灭加成，但射击精度受弹道学限制，成群驻扎方显威力。',
    },
    {
        id: 'bombard_cannon',
        name: '手推炮 (火炮)',
        englishName: 'Bombard Cannon',
        category: '火药武器',
        building: '攻城武器厂',
        age: '帝王时代',
        cost: { wood: 225, gold: 225 },
        hp: 80,
        attack: 40,
        meleeArmor: 2,
        pierceArmor: 5,
        range: 12,
        reloadTime: 6.5,
        speed: 0.7,
        armorClasses: ['攻城武器 (Siege)', '火药单位 (Gunpowder)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 200 },
            { targetClass: '攻城武器 (Siege)', bonus: 40 },
        ],
        description: '可精确移动调转的重型野战火炮。射程高达 12，不仅是拆除城堡与坚固箭塔的重器，更是克制敌方巨型投石机与投石车的狙击杀手。',
    },

    // ── 攻城器械 ──
    {
        id: 'battering_ram_line',
        name: '轻型冲车 ➔ 攻城冲车',
        englishName: 'Battering Ram ➔ Siege Ram',
        category: '攻城武器',
        building: '攻城武器厂',
        age: '城堡时代',
        cost: { wood: 160, gold: 75 },
        hp: 270,
        attack: 4,
        meleeArmor: -3,
        pierceArmor: 195, // 几乎无视一切箭矢
        range: 0,
        reloadTime: 5.0,
        speed: 0.6,
        armorClasses: ['攻城武器 (Siege)', '冲车 (Ram)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 200 },
        ],
        description: '建筑拆除机器与移动吸箭盾牌。拥有高达 195 远程护甲，城堡与箭塔的攻击如同挠痒，可进驻步兵增加移速与撞击攻击力。',
    },
    {
        id: 'mangonel_line',
        name: '轻型投石车 ➔ 攻城投石车',
        englishName: 'Mangonel ➔ Siege Onager',
        category: '攻城武器',
        building: '攻城武器厂',
        age: '城堡时代',
        cost: { wood: 160, gold: 135 },
        hp: 70,
        attack: 75,
        meleeArmor: 0,
        pierceArmor: 8,
        range: 8,
        reloadTime: 6.0,
        speed: 0.6,
        armorClasses: ['攻城武器 (Siege)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 60 },
        ],
        description: '范围毁灭杀伤之神。投射出巨石造成毁灭性的范围溅射伤害（友军伤害开启），重型投石车更能摧毁整片树林开路，一发可蒸发整队弓兵。',
    },
    {
        id: 'trebuchet',
        name: '巨型投石机',
        englishName: 'Trebuchet',
        category: '攻城武器',
        building: '城堡',
        age: '帝王时代',
        cost: { wood: 200, gold: 200 },
        hp: 150,
        attack: 200,
        meleeArmor: 2,
        pierceArmor: 8,
        range: 16,
        reloadTime: 10.0,
        speed: 0.8,
        armorClasses: ['攻城武器 (Siege)', '巨型投石机 (Trebuchet)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 250 },
        ],
        description: '帝国时代长程拆城终极兵器。拥有 16 格超远射程，须固定组装后才能开火，投掷的燃烧巨石是任何城堡与世界奇观的噩梦。',
    },

    // ── 海军系 ──
    {
        id: 'galley_line',
        name: '桨帆战船 ➔ 巨型战舰',
        englishName: 'Galley ➔ Galleon',
        category: '海军',
        building: '码头',
        age: '封建时代',
        cost: { wood: 90, gold: 30 },
        hp: 165,
        attack: 8,
        meleeArmor: 0,
        pierceArmor: 8,
        range: 7,
        reloadTime: 3.0,
        speed: 1.43,
        armorClasses: ['舰船 (Ship)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 8 },
            { targetClass: '长枪兵 (Spearman)', bonus: 4 },
        ],
        description: '制海权主力远程战船。集结成编队后依靠超远射程封锁海面与岸边资源点，受弹道学支持。',
    },
    {
        id: 'fire_ship_line',
        name: '火艨艟 ➔ 快速喷火船',
        englishName: 'Fire Galley ➔ Fast Fire Ship',
        category: '海军',
        building: '码头',
        age: '封建时代',
        cost: { wood: 75, gold: 45 },
        hp: 140,
        attack: 3,
        meleeArmor: 0,
        pierceArmor: 8,
        range: 2.49,
        reloadTime: 0.25, // 极速喷射
        speed: 1.43,
        armorClasses: ['舰船 (Ship)'],
        attackBonuses: [
            { targetClass: '舰船 (Ship)', bonus: 4 },
        ],
        description: '近距海战喷火绞肉机。每 0.25 秒喷射一次烈焰，对战舰形成压倒性克制，是水面近战决胜的核心。',
    },
    {
        id: 'bombard_cannon',
        name: '手推炮',
        englishName: 'Bombard Cannon',
        category: '火药武器',
        building: '攻城武器厂',
        age: '帝王时代',
        cost: { wood: 225, gold: 225 },
        hp: 80,
        attack: 40,
        meleeArmor: 2,
        pierceArmor: 5,
        range: 12,
        reloadTime: 6.5,
        speed: 0.7,
        armorClasses: ['攻城武器 (Siege)', '火药单位 (Gunpowder)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 200 },
            { targetClass: '攻城武器 (Siege)', bonus: 20 },
            { targetClass: '舰船 (Ship)', bonus: 40 },
        ],
        description: '机动长程火药攻城重炮。射程高达 12-14 格，不仅能高效轰塌敌方城墙堡垒，更是在远距离狙杀敌方巨投与投石车的王牌。',
    },
    {
        id: 'cannon_galleon',
        name: '火炮战船 ➔ 精锐火炮战船',
        englishName: 'Cannon Galleon ➔ Elite Cannon Galleon',
        category: '海军',
        building: '码头',
        age: '帝王时代',
        cost: { wood: 200, gold: 150 },
        hp: 150,
        attack: 45,
        meleeArmor: 0,
        pierceArmor: 8,
        range: 15,
        reloadTime: 10.0,
        speed: 1.1,
        armorClasses: ['舰船 (Ship)', '火药单位 (Gunpowder)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 250 },
            { targetClass: '攻城武器 (Siege)', bonus: 40 },
        ],
        description: '海上浮动巨炮要塞。射程超越绝大多数沿海箭塔与城堡，专门用于由海向陆实施毁灭性火力投送。',
    },
    {
        id: 'monk',
        name: '僧侣',
        englishName: 'Monk',
        category: '修道院与经济',
        building: '修道院',
        age: '城堡时代',
        cost: { gold: 100 },
        hp: 30,
        attack: 0,
        meleeArmor: 0,
        pierceArmor: 0,
        range: 9,
        reloadTime: 5.5,
        speed: 0.7,
        armorClasses: ['僧侣 (Monk)'],
        attackBonuses: [],
        description: '神圣的精神领袖与战场医疗者。能够隔空治疗友方负伤单位，招降敌军作战部队与敌方建筑物，并运送圣物回修道院产金。',
    },
    {
        id: 'chu_ko_nu',
        name: '诸葛弩 ➔ 精锐诸葛弩',
        englishName: 'Chu Ko Nu ➔ Elite Chu Ko Nu',
        category: '射手',
        building: '城堡',
        age: '城堡时代',
        cost: { wood: 40, gold: 35 },
        hp: 50,
        attack: 8,
        meleeArmor: 0,
        pierceArmor: 1,
        range: 6,
        reloadTime: 3.0,
        speed: 0.96,
        armorClasses: ['射手 (Archer)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '长枪兵 (Spearman)', bonus: 2 },
            { targetClass: '冲车 (Ram)', bonus: 1 },
        ],
        description: '中国特色连弩射手。单次开火连续射出 3-5 支弩箭，副箭虽只造成微量伤害，但密集的矢雨能迅速蒸发任何低防甚至冲车单位。',
    },
    {
        id: 'cataphract',
        name: '圣骑兵 ➔ 精锐圣骑兵',
        englishName: 'Cataphract ➔ Elite Cataphract',
        category: '骑兵',
        building: '城堡',
        age: '城堡时代',
        cost: { food: 70, gold: 75 },
        hp: 150,
        attack: 12,
        meleeArmor: 2,
        pierceArmor: 1,
        range: 0,
        reloadTime: 1.7,
        speed: 1.35,
        armorClasses: ['骑兵 (Cavalry)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '步兵 (Infantry)', bonus: 12 },
            { targetClass: '秃鹰勇士 (Eagle)', bonus: 4 },
        ],
        description: '拜占庭铁甲骑兵。拥有对步兵的高达 +12 的恐怖加成，并自带 +16 点反步兵特攻抗性，反制长戟兵的克制效果，配后勤科技更附带践踏范围伤害。',
    },
    {
        id: 'war_elephant',
        name: '战象 ➔ 精锐战象',
        englishName: 'War Elephant ➔ Elite War Elephant',
        category: '骑兵',
        building: '城堡',
        age: '城堡时代',
        cost: { food: 200, gold: 75 },
        hp: 600,
        attack: 20,
        meleeArmor: 1,
        pierceArmor: 3,
        range: 0,
        reloadTime: 2.0,
        speed: 0.7,
        armorClasses: ['骑兵 (Cavalry)', '战象 (War Elephant)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 10 },
            { targetClass: '石制建筑 (Stone Defense)', bonus: 10 },
        ],
        description: '波斯无敌血牛巨兽。高达 600 点生命值与 20 点攻击力，配践踏范围杀伤，是全游戏单兵血量最高、平推拆家破坏力最强的终极巨兽。',
    },
    {
        id: 'mameluke',
        name: '马穆鲁克 ➔ 精锐马穆鲁克',
        englishName: 'Mameluke ➔ Elite Mameluke',
        category: '骑兵',
        building: '城堡',
        age: '城堡时代',
        cost: { food: 55, gold: 85 },
        hp: 80,
        attack: 10,
        meleeArmor: 1,
        pierceArmor: 1,
        range: 3,
        reloadTime: 2.0,
        speed: 1.4,
        armorClasses: ['骆驼 (Camel)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '骑兵 (Cavalry)', bonus: 12 },
        ],
        description: '萨拉森飞刀骆驼骑兵。利用 3 格射程实施风筝拉扯战术，投掷弯刀对常规骑士与游侠造成极为致命的毁灭性克制。',
    },
    {
        id: 'teutonic_knight',
        name: '条顿武士 ➔ 精锐条顿武士',
        englishName: 'Teutonic Knight ➔ Elite Teutonic Knight',
        category: '步兵',
        building: '城堡',
        age: '城堡时代',
        cost: { food: 85, gold: 40 },
        hp: 100,
        attack: 17,
        meleeArmor: 10,
        pierceArmor: 2,
        range: 0,
        reloadTime: 2.0,
        speed: 0.8,
        armorClasses: ['步兵 (Infantry)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 4 },
        ],
        description: '全身重甲的移动钢铁堡垒。初始拥有 10 点近战护甲，近身肉搏战中能硬生生斩杀游侠与几乎所有地面近战步兵，惟移动速度较慢、惧怕弓箭。',
    },
    {
        id: 'conquistador',
        name: '征服者 ➔ 精锐征服者',
        englishName: 'Conquistador ➔ Elite Conquistador',
        category: '火药武器',
        building: '城堡',
        age: '城堡时代',
        cost: { food: 60, gold: 70 },
        hp: 70,
        attack: 18,
        meleeArmor: 2,
        pierceArmor: 2,
        range: 6,
        reloadTime: 2.9,
        speed: 1.3,
        armorClasses: ['骑射手 (Cavalry Archer)', '火药单位 (Gunpowder)', '特色单位 (Unique Unit)'],
        attackBonuses: [
            { targetClass: '冲车 (Ram)', bonus: 6 },
        ],
        description: '西班牙火枪骑兵。城堡时代一出场便具备高达 16 点的恐怖瞬间爆发伤害与高机动性，微操点杀敌方步兵与村民极具威慑力。',
    },

    // ── 维京传奇 (The Viking Sagas 2026年9月新增区域兵种) ──
    {
        id: 'varangian_guard',
        name: '瓦良格卫队',
        englishName: 'Varangian Guard',
        category: '步兵',
        building: '兵营',
        age: '城堡时代',
        cost: { food: 65, gold: 35 },
        hp: 75,
        attack: 11,
        meleeArmor: 1,
        pierceArmor: 2,
        range: 0,
        reloadTime: 1.9,
        speed: 1.05,
        armorClasses: ['步兵 (Infantry)'],
        attackBonuses: [
            { targetClass: '鹰勇士 (Eagle)', bonus: 4 },
        ],
        description: '维京传奇特有冲击近卫步兵。战斗掠夺机制使其在对敌搏杀中不断产生额外黄金，是以战养战的强力近战王牌。',
    },
    {
        id: 'mounted_crossbowman',
        name: '骑乘弩手',
        englishName: 'Mounted Crossbowman',
        category: '射手',
        building: '靶场',
        age: '城堡时代',
        cost: { wood: 50, gold: 60 },
        hp: 65,
        attack: 10,
        meleeArmor: 0,
        pierceArmor: 1,
        range: 5,
        reloadTime: 2.8,
        speed: 1.3,
        armorClasses: ['骑兵 (Cavalry)', '射手 (Archer)', '骑射手 (Cavalry Archer)'],
        attackBonuses: [
            { targetClass: '长枪兵 (Spearman)', bonus: 3 },
        ],
        description: '维京传奇全新欧洲共享区域兵种。射速较慢但单发穿透杀伤极高，可受新科技绞盘重弩机强化，是对抗重装步兵的骑射利刃。',
    },
    {
        id: 'longship',
        name: '维京长船',
        englishName: 'Longship',
        category: '海军',
        building: '码头',
        age: '城堡时代',
        cost: { wood: 85, gold: 40 },
        hp: 130,
        attack: 7,
        meleeArmor: 0,
        pierceArmor: 6,
        range: 6,
        reloadTime: 3.0,
        speed: 1.54,
        armorClasses: ['舰船 (Ship)'],
        attackBonuses: [
            { targetClass: '建筑 (Building)', bonus: 7 },
            { targetClass: '冲车 (Ram)', bonus: 4 },
        ],
        description: '维京与丹麦极速多功能战船。单次射出多支箭矢，凭借航速优势在水面游弋风筝并压制沿岸防线。',
    },
];

// ──────────────────────────────────────────────
// 3. 完整科技树数据库 (Complete Technology Tree)
// ──────────────────────────────────────────────
export const DE_TECHS: DeTech[] = [
    // 铁匠铺科技
    { id: 't_forge', name: '锻造 (Forging)', englishName: 'Forging', building: '铁匠铺', age: '封建时代', cost: '150肉', effect: '所有步兵和骑兵近战攻击力 +1' },
    { id: 't_iron_casting', name: '铸铁 (Iron Casting)', englishName: 'Iron Casting', building: '铁匠铺', age: '城堡时代', cost: '220肉 120金', effect: '所有步兵和骑兵近战攻击力额外 +1' },
    { id: 't_blast_furnace', name: '高炉 (Blast Furnace)', englishName: 'Blast Furnace', building: '铁匠铺', age: '帝王时代', cost: '275肉 225金', effect: '所有步兵和骑兵近战攻击力强力 +2' },
    { id: 't_fletching', name: '箭羽 (Fletching)', englishName: 'Fletching', building: '铁匠铺', age: '封建时代', cost: '100肉 50金', effect: '步弓手、骑射手、战舰、箭塔与城堡攻击力 +1，射程 +1' },
    { id: 't_bodkin_arrow', name: '锥头箭 (Bodkin Arrow)', englishName: 'Bodkin Arrow', building: '铁匠铺', age: '城堡时代', cost: '200肉 100金', effect: '步弓手、骑射手、战舰、箭塔与城堡攻击力额外 +1，射程 +1' },
    { id: 't_bracer', name: '博德金箭 (Bracer)', englishName: 'Bracer', building: '铁匠铺', age: '帝王时代', cost: '300肉 200金', effect: '步弓手、骑射手、战舰、箭塔与城堡攻击力再次 +1，射程 +1' },
    { id: 't_scale_mail', name: '步兵鳞甲 (Scale Mail Armor)', englishName: 'Scale Mail Armor', building: '铁匠铺', age: '封建时代', cost: '100肉', effect: '步兵近战护甲 +1，远程护甲 +1' },
    { id: 't_chain_mail', name: '步兵锁甲 (Chain Mail Armor)', englishName: 'Chain Mail Armor', building: '铁匠铺', age: '城堡时代', cost: '200肉 100金', effect: '步兵近战护甲 +1，远程护甲 +1' },
    { id: 't_plate_mail', name: '步兵板甲 (Plate Mail Armor)', englishName: 'Plate Mail Armor', building: '铁匠铺', age: '帝王时代', cost: '300肉 150金', effect: '步兵近战护甲 +1，远程护甲 +2' },
    { id: 't_scale_barding', name: '骑兵鳞甲 (Scale Barding Armor)', englishName: 'Scale Barding Armor', building: '铁匠铺', age: '封建时代', cost: '150肉', effect: '骑兵近战护甲 +1，远程护甲 +1' },
    { id: 't_chain_barding', name: '骑兵锁甲 (Chain Barding Armor)', englishName: 'Chain Barding Armor', building: '铁匠铺', age: '城堡时代', cost: '250肉 150金', effect: '骑兵近战护甲 +1，远程护甲 +1' },
    { id: 't_plate_barding', name: '骑兵板甲 (Plate Barding Armor)', englishName: 'Plate Barding Armor', building: '铁匠铺', age: '帝王时代', cost: '350肉 200金', effect: '骑兵近战护甲 +1，远程护甲 +2' },

    // 大学与攻城科技
    { id: 't_ballistics', name: '弹道学 (Ballistics)', englishName: 'Ballistics', building: '大学', age: '城堡时代', cost: '300木 175金', effect: '所有射手、战舰、箭塔、城堡根据敌军移动预判开火，命中率达到极致' },
    { id: 't_chemistry', name: '化学 (Chemistry)', englishName: 'Chemistry', building: '大学', age: '帝王时代', cost: '300肉 200金', effect: '所有非火药远程单位攻击力 +1 且箭矢附带燃烧特效；解锁火枪手与手推炮' },
    { id: 't_siege_engineers', name: '攻城工程师 (Siege Engineers)', englishName: 'Siege Engineers', building: '大学', age: '帝王时代', cost: '500肉 600木', effect: '攻城武器射程 +1 (冲车除外)，对建筑攻击力提高 20% (投石机提高 40%)' },

    // 靶场与马厩核心科技
    { id: 't_thumb_ring', name: '指环/拇指扳机 (Thumb Ring)', englishName: 'Thumb Ring', building: '靶场', age: '城堡时代', cost: '300肉 250木', effect: '步弓手开火静止命中率提升至 100%，攻击射速加快 18%' },
    { id: 't_bloodlines', name: '血统 (Bloodlines)', englishName: 'Bloodlines', building: '马厩', age: '封建时代', cost: '150肉 100金', effect: '所有马厩骑兵、骑射手及象兵生命值无条件永久 +20' },
    { id: 't_husbandry', name: '养马/畜牧 (Husbandry)', englishName: 'Husbandry', building: '马厩', age: '城堡时代', cost: '150肉', effect: '所有骑兵移动速度提升 10%' },

    // 兵营特种科技
    { id: 't_squires', name: '护卫 (Squires)', englishName: 'Squires', building: '兵营', age: '城堡时代', cost: '100肉', effect: '所有步兵移动速度加快 10%' },
    { id: 't_arson', name: '纵火 (Arson)', englishName: 'Arson', building: '兵营', age: '城堡时代', cost: '150肉 50金', effect: '所有步兵对建筑额外造成 +2 伤害' },

    // 城镇中心与内政经济
    { id: 't_loom', name: '织布机 (Loom)', englishName: 'Loom', building: '城镇中心', age: '黑暗时代', cost: '50金', effect: '村民生命值 +15，近战护甲 +1，远程护甲 +2，大幅提升前期抗野兽与骚扰生存力' },
    { id: 't_wheelbarrow', name: '独轮推车 (Wheelbarrow)', englishName: 'Wheelbarrow', building: '城镇中心', age: '封建时代', cost: '175肉 50木', effect: '村民移动速度加快 10%，资源携带量上限提升 25%' },
    { id: 't_hand_cart', name: '手推车 (Hand Cart)', englishName: 'Hand Cart', building: '城镇中心', age: '城堡时代', cost: '300肉 200木', effect: '村民移动速度进一步加快 10%，资源携带量上限额外提升 50%' },

    // 修道院神圣科技
    { id: 't_sanctity', name: '圣洁 (Sanctity)', englishName: 'Sanctity', building: '修道院', age: '城堡时代', cost: '120金', effect: '僧侣生命值 +15 (+50%)' },
    { id: 't_fervor', name: '狂热 (Fervor)', englishName: 'Fervor', building: '修道院', age: '城堡时代', cost: '140金', effect: '僧侣移动速度提高 15%' },
    { id: 't_redemption', name: '救赎 (Redemption)', englishName: 'Redemption', building: '修道院', age: '城堡时代', cost: '475金', effect: '允许僧侣招降敌方攻城武器以及大部分军事建筑物' },
    { id: 't_heresy', name: '异端 (Heresy)', englishName: 'Heresy', building: '修道院', age: '城堡时代', cost: '1000金', effect: '被敌方僧侣招降的己方单位直接阵亡，而非倒戈变节成为敌军' },
    { id: 't_faith', name: '信仰 (Faith)', englishName: 'Faith', building: '修道院', age: '帝王时代', cost: '750肉 1000金', effect: '所有己方单位抵抗敌方僧侣招降的能力大幅提高 50%' },

    // 防御与军事动员
    { id: 't_murder_holes', name: '杀人孔 (Murder Holes)', englishName: 'Murder Holes', building: '大学', age: '城堡时代', cost: '200肉 100石', effect: '箭塔和城堡消除近身盲区，可直接垂直射击贴脸的敌方单位' },
    { id: 't_conscription', name: '征召 (Conscription)', englishName: 'Conscription', building: '城堡', age: '帝王时代', cost: '150肉 150金', effect: '兵营、靶场、马厩与城堡生产单位的速度加快 33%' },
];

// ──────────────────────────────────────────────
// 4. DE核心隐藏护甲类别列表 (Armor Classes)
// ──────────────────────────────────────────────
export const DE_ARMOR_CLASSES: DeArmorClass[] = [
    { id: 1, name: '步兵类 (Infantry)', description: '绝大多数兵营步兵的基础护甲类', vulnerableTo: '掷斧兵、马扎尔骑手、美洲豹勇士、甲胄骑兵等' },
    { id: 2, name: '长枪兵类 (Spearman)', description: '长矛兵、长枪兵、戟兵的特化护甲类', vulnerableTo: '步弓手、投石车、骆驼、骑兵等' },
    { id: 4, name: '射手类 (Archer)', description: '步弓手、弩手、羽箭手等弓箭护甲', vulnerableTo: '掷矛手、藤甲弓兵、骑兵、投石车' },
    { id: 8, name: '骑兵类 (Cavalry)', description: '斥候、骑士、游侠、翼骑兵等骑行单位', vulnerableTo: '长枪兵/戟兵、骆驼骑兵、热那亚弩手、马穆鲁克' },
    { id: 11, name: '战象类 (War Elephant)', description: '波斯战象、弩炮象、象兵等巨兽', vulnerableTo: '戟兵 (+28以上)、僧侣 (极易被招降)、骆驼' },
    { id: 13, name: '攻城武器类 (Siege)', description: '冲车、投石车、弩炮、火炮等机械', vulnerableTo: '蒙古突骑、骑兵近战砍杀、巨型投石机' },
    { id: 19, name: '骑射手类 (Cavalry Archer)', description: '骑射手、蒙古突骑、征服者等', vulnerableTo: '掷矛手 (+额外伤害)、骆驼、骆驼射手' },
    { id: 20, name: '鹰勇士类 (Eagle Warrior)', description: '美洲鹰勇士系', vulnerableTo: '双手剑士/冠军剑士 (+6)、火枪手 (+10)' },
    { id: 30, name: '骆驼类 (Camel)', description: '骆驼骑兵、帝国骆驼、马穆鲁克', vulnerableTo: '长枪兵/戟兵、部分弓手 (但对骑兵特攻)' },
    { id: 35, name: '火药单位类 (Gunpowder)', description: '火枪手、手推炮、火炮塔、苏丹禁卫军', vulnerableTo: '近卫军、神圣骑手、轻骑兵冲阵' },
];

// ──────────────────────────────────────────────
// 5. 官方经典战役剧本全览 (Official Campaigns)
// ──────────────────────────────────────────────
export const DE_CAMPAIGNS: DeCampaign[] = [
    { title: '威廉·华莱士 (William Wallace)', hero: '威廉·华莱士', civ: '凯尔特', dlc: '原版', scenariosCount: 7, desc: '从斯特灵桥战役到福尔柯克，指引苏格兰勇士抵抗英格兰长腿爱德华的铁蹄。' },
    { title: '圣女贞德 (Joan of Arc)', hero: '圣女贞德', civ: '法兰克', dlc: '原版', scenariosCount: 6, desc: '百年战争中带领法兰西军民解围奥尔良，打破英军包围，护送查理七世于兰斯加冕。' },
    { title: '萨拉丁 (Saladin)', hero: '萨拉丁', civ: '萨拉森', dlc: '原版', scenariosCount: 6, desc: '统一埃及与黎凡特，在哈丁战役大败十字军骑士团，收复圣城耶路撒冷。' },
    { title: '巴巴罗萨 (Barbarossa)', hero: '腓特烈一世', civ: '条顿', dlc: '原版', scenariosCount: 6, desc: '红胡子统领德意志神圣罗马帝国诸侯，远征意大利与黎凡特圣地。' },
    { title: '成吉思汗 (Genghis Khan)', hero: '铁木真', civ: '蒙古', dlc: '原版', scenariosCount: 6, desc: '统一蒙古草原诸部，翻越长城席卷花剌子模，横跨欧亚大陆建立不朽帝国。' },
    { title: '阿提拉 (Attila the Hun)', hero: '阿提拉', civ: '匈奴', dlc: '征服者', scenariosCount: 6, desc: '上帝之鞭席卷欧洲，沙隆会战与罗马高卢军团殊死决战。' },
    { title: '埃尔·西德 (El Cid)', hero: '罗德里戈·迪亚兹', civ: '西班牙/萨拉森', dlc: '征服者', scenariosCount: 6, desc: '西班牙传奇游侠骑士卡斯蒂利亚的勇士，游走于基督教国王与摩尔人苏丹之间收复巴伦西亚。' },
    { title: '帖木儿 (Tamerlane)', hero: '帖木儿', civ: '鞑靼', dlc: '最后的可汗', scenariosCount: 6, desc: '跛子帖木儿横扫波斯、高加索与印度，于安卡拉战役生擒奥斯曼苏丹巴耶济德一世。' },
    { title: '长腿爱德华 (Edward Longshanks)', hero: '爱德华一世', civ: '不列颠', dlc: '西方霸主', scenariosCount: 5, desc: '冷酷坚毅的英格兰君王，南征威尔士、北镇苏格兰，开创金雀花王朝长弓军事盛世。' },
    { title: '雅德维加 (Jadwiga)', hero: '雅德维加女王', civ: '波兰', dlc: '公爵的崛起', scenariosCount: 6, desc: '波兰第一位女国王，联合立陶宛大公约盖拉，抵御条顿骑士团并奠定波立联邦基石。' },
    { title: '扬·杰式卡 (Jan Zizka)', hero: '扬·杰式卡', civ: '波希米亚', dlc: '公爵的崛起', scenariosCount: 6, desc: '独眼战神以车垒火炮战术打破神圣罗马帝国重装十字军骑兵，战无不胜。' },
    { title: '巴布尔 (Babur)', hero: '查希尔丁·巴布尔', civ: '印度斯坦/鞑靼', dlc: '印度王朝', scenariosCount: 6, desc: '帖木儿与成吉思汗的后裔，两度失落费尔干纳后南下南亚，帕尼帕特战役奠定莫卧儿帝国。' },
    { title: '塔玛尔女王 (Tamar of Georgia)', hero: '塔玛尔大帝', civ: '格鲁吉亚', dlc: '皇家山脉', scenariosCount: 5, desc: '高加索黄金时代的统御者，击败塞尔柱突厥联军，缔造格鲁吉亚最辉煌的盛世。' },
    { title: '蒙特祖玛 (Montezuma)', hero: '蒙特祖玛二世', civ: '阿兹特克', dlc: '征服者', scenariosCount: 6, desc: '特诺奇蒂特兰的太阳与血祭，率领美洲豹武士与鹰勇士殊死抵抗西班牙征服者科尔特斯。' },
    { title: '塔里克·伊本·齐亚德 (Tariq ibn Ziyad)', hero: '塔里克', civ: '柏柏尔', dlc: '非洲王国', scenariosCount: 5, desc: '横渡直布罗陀海峡踏上伊比利亚半岛，在瓜达莱特战役击溃西哥特王国建立安达卢斯。' },
    { title: '弗朗西斯科·德·阿尔梅达 (Francisco de Almeida)', hero: '阿尔梅达', civ: '葡萄牙', dlc: '非洲王国', scenariosCount: 5, desc: '葡萄牙首任印度总督，远涉好望角在第乌海战确立大航海时代印度洋海上霸权。' },
    { title: '黎利 (Le Loi)', hero: '黎利', civ: '越南', dlc: '蛮王崛起', scenariosCount: 6, desc: '借神剑蓝山起义，在崇山峻岭间依托藤甲弓兵与象兵游击战驱逐明军，建立后黎朝。' },
    { title: '勃印曩 (Bayinnaung)', hero: '勃印曩', civ: '缅甸', dlc: '蛮王崛起', scenariosCount: 5, desc: '缅甸东吁王朝的扩张雄狮，统帅飞镖骑兵与象军横扫中南半岛，缔造东南亚历史最大版图。' },
    { title: '苏利耶跋摩一世 (Suryavarman I)', hero: '苏利耶跋摩一世', civ: '高棉', dlc: '蛮王崛起', scenariosCount: 5, desc: '统一柬埔寨并营建宏伟吴哥窟文明，以战象与弩炮象军威震四方。' },
    { title: '加雅·马达 (Gajah Mada)', hero: '加雅·马达', civ: '马来', dlc: '蛮王崛起', scenariosCount: 5, desc: '发下著名的帕拉帕誓言，统率千帆战舰与马来轻步兵席卷千岛，成就满者伯夷帝国霸业。' },
    { title: '欧特维尔家族 (The Hautevilles)', hero: '罗伯特·吉斯卡尔', civ: '西西里', dlc: '西方霸主', scenariosCount: 5, desc: '诺曼底穷骑士家族南下地中海，从拜占庭与撒拉逊人手中夺下南意大利与西西里岛，建立欧特维尔王朝。' },
    { title: '托罗斯大帝 (Thoros the Great)', hero: '托罗斯二世', civ: '亚美尼亚', dlc: '皇家山脉', scenariosCount: 5, desc: '从牢狱逃回奇里乞亚崇山峻岭，利用要塞教堂与复合弓手击退拜占庭皇帝安德洛尼卡与突厥苏丹。' },
    { title: '伊斯梅尔一世 (Ismail)', hero: '伊斯梅尔一世', civ: '波斯', dlc: '皇家山脉', scenariosCount: 5, desc: '十四岁执掌红头军，席卷阿塞拜疆与波斯全境，以萨瓦兰重骑兵重铸萨法维波斯帝国。' },
    { title: '查理曼大帝 (Charlemagne)', hero: '查理大帝', civ: '法兰克', dlc: '成王败寇', scenariosCount: 1, desc: '征服伦巴底人、萨克森人与阿瓦尔人，于公元800年圣诞节在罗马接受教皇加冕，统合西欧罗马帝国遗产。' },
    { title: '哈拉尔·哈德拉达三部曲 (Harald Hardrada)', hero: '无情者哈拉尔', civ: '丹麦/瓦良格', dlc: '维京传奇', scenariosCount: 15, desc: '流亡王子、严厉统治者、最后的维京人三部曲，从基辅罗斯到君士坦丁堡，最终入侵英格兰决战斯坦福桥。' },
];

// ──────────────────────────────────────────────
// 6. 完整历代DLC编年史 (DLC Chronology)
// ──────────────────────────────────────────────
export const DE_DLC_CHRONOLOGY: DeDlc[] = [
    {
        title: '帝国时代II：决定版 原版',
        englishTitle: 'Age of Empires II: Definitive Edition (Base Game)',
        releaseDate: '2019年11月14日',
        newCivs: ['保加利亚 (Bulgarians)', '库曼 (Cumans)', '立陶宛 (Lithuanians)', '鞑靼 (Tatars)'],
        campaigns: ['最后的可汗 (The Last Khans)', '包含全部原版与HD版战役重制'],
        keyFeatures: [
            '完全支持原生 4K 分辨率与超高清画质包',
            '完全重制并实时重新录制的完整交响乐原声带',
            '农田自动补耕、建筑排队改良、兵种混合阵型',
            '全新编写的不作弊高阶竞技级 AI',
            '全新集成的多人排位天梯与匹配系统',
        ],
    },
    {
        title: '西方霸主 DLC',
        englishTitle: 'Lords of the West',
        releaseDate: '2021年1月26日',
        newCivs: ['勃艮第 (Burgundians)', '西西里 (Sicilians)'],
        campaigns: ['长腿爱德华 (Edward Longshanks)', '大公爵 (The Grand Dukes of the West)', '欧特维尔家族 (The Hautevilles)'],
        keyFeatures: [
            '引入首个骑兵充能重击技能 (Coustillier 蓄力伤害)',
            '西西里栋若金汤城堡要塞 (Donjon) 与萨金特卫兵体系',
            '勃艮第提前一个时代研发经济科技的新经济机制',
            '佛兰芒革命全村民转职士兵机制',
        ],
    },
    {
        title: '公爵的崛起 DLC',
        englishTitle: 'Dawn of the Dukes',
        releaseDate: '2021年8月10日',
        newCivs: ['波兰 (Poles)', '波希米亚 (Bohemians)'],
        campaigns: ['阿尔吉尔达斯与科斯图提斯', '雅德维加 (Jadwiga)', '扬·杰式卡 (Jan Zizka)'],
        keyFeatures: [
            '引入中东欧特色庄园 (Folwark) 即时入库机制',
            '采石同时伴生黄金的资源机制',
            '胡斯战车为后排吸收投射物护盾机制',
            '近代火炮雏形手风琴重炮 (Houfnice) 登场',
        ],
    },
    {
        title: '印度王朝 DLC',
        englishTitle: 'Dynasties of India',
        releaseDate: '2022年4月28日',
        newCivs: ['孟加拉 (Bengalis)', '达罗毗荼 (Dravidians)', '古吉拉特 (Gujaratis)', '印度斯坦 (Hindustanis - 原印度重做)'],
        campaigns: ['巴布尔 (Babur)', '拉真陀罗 (Rajendra)', '提婆波罗 (Devapala)'],
        keyFeatures: [
            '全面重构原版单个印度为南亚四大特色鲜明文明',
            '引入牲畜进驻磨坊源源不断产肉的印度次大陆生态',
            '施里瓦姆沙骑兵引入躲避箭矢护盾判定 (Dodge Shield)',
            '装甲象兵代替攻城冲车的南亚特色攻城武器体系',
        ],
    },
    {
        title: '罗马归来 DLC',
        englishTitle: 'Return of Rome',
        releaseDate: '2023年5月16日',
        newCivs: ['罗马 (Romans - 正式加入本篇排位)', '整合帝国时代1代全16个古典文明'],
        campaigns: ['萨尔贡 (Sargon of Akkad)', '皮洛士 (Pyrrhus of Epirus)', '图拉真 (Trajan)'],
        keyFeatures: [
            '用 DE 现代引擎彻底重制初代《帝国时代1》完整规则集与文明',
            '古典罗马帝国正式成为 AoE2 本篇的第43个可用文明',
            '指挥官百夫长光环激励军团兵机制',
            '战车与双投射物弹道系统',
        ],
    },
    {
        title: '皇家山脉 DLC',
        englishTitle: 'The Mountain Royals',
        releaseDate: '2023年10月31日',
        newCivs: ['亚美尼亚 (Armenians)', '格鲁吉亚 (Georgians)', '波斯 (Persians 全面重制)'],
        campaigns: ['托罗斯大帝 (Thoros the Great)', '塔玛尔女王 (Tamar of Georgia)', '伊斯梅尔一世 (Ismail)'],
        keyFeatures: [
            '引入移动式经济资源收集建筑——骡车 (Mule Cart)',
            '要塞斯维尔要塞教堂 (Fortified Church) 与复合战斗牧师',
            '波斯重制：引入萨瓦兰重骑兵 (Savalaran) 代替游侠',
            '高加索高地作战的落差伤害加成机制',
        ],
    },
    {
        title: '成王败寇 DLC',
        englishTitle: 'Victors and Vanquished',
        releaseDate: '2024年3月14日',
        newCivs: ['（专注单人战役剧本扩充，全45文明均可体验）'],
        campaigns: [
            '查理曼大帝 (Charlemagne)', '维京拉格纳 (Ragnar Lodbrok)', '奥托大帝 (Otto the Great)',
            '君士坦丁十一世 (Constantine XI)', '织田信长 (Nobunaga)', '金海陵王完颜亮',
            '共 19 个完全配音的史诗级单人沙盒角色战役',
        ],
        keyFeatures: [
            '收录 19 个高度定制且完全配音的单人史诗级战役剧本',
            '包含根据社区传奇战役创作者作品官方重制的经典战役',
            '引入大量独特单人剧本机制（外交勒索、角色扮演 RPG 要素、资源管理）',
            '全面升级成就系统与单人剧本原声音乐',
        ],
    },
    {
        title: '维京传奇 DLC (最新上线)',
        englishTitle: 'The Viking Sagas',
        releaseDate: '2026年9月22日',
        newCivs: ['丹麦 (Danes)', '撒克逊 (Saxons)', '瓦良格 (Varangians)'],
        campaigns: ['哈拉尔·哈德拉达 (Harald Hardrada) 三部曲（15个史诗场景）'],
        keyFeatures: [
            '引入 3 大全新维京与北欧文明：丹麦、撒克逊、瓦良格，全文明总数跃升至 48',
            '引入全新欧洲共享区域兵种：瓦良格卫队（杀敌赚金）、骑乘弩手、维京长船',
            '推出哈拉尔·哈德拉达跨越北欧、罗斯、拜占庭与英格兰的 15 关三部曲长篇巨构',
            '全新科技绞盘重弩机（Cranequins）与伯格堡垒（Burh）要塞筑城机制',
            '同步推送 Update 185872 全局平衡性重大补丁',
        ],
    },
];

// ──────────────────────────────────────────────
// 7. DE核心伤害公式算法 (Damage Calculation Engine)
// ──────────────────────────────────────────────
export function calculateDeDamage(
    attacker: DeUnit,
    defender: DeUnit,
    attackerUpgrades: { forge?: boolean | number; ironCasting?: boolean | number; blastFurnace?: boolean | number; fletching?: boolean | number; bodkin?: boolean | number; bracer?: boolean | number },
    defenderUpgrades: { scaleBarding?: boolean | number; chainBarding?: boolean | number; plateBarding?: boolean | number; paddedArcher?: boolean | number; leatherArcher?: boolean | number; ringArcher?: boolean | number }
): {
    baseDamage: number;
    bonusDamage: number;
    totalDamagePerHit: number;
    hitsToKill: number;
    timeToKillSec: number;
    dps: number;
} {
    // 近战或远程伤害判定
    const isRanged = attacker.range > 0;

    let effectiveAttack = attacker.attack;
    let effectiveMeleeArmor = defender.meleeArmor;
    let effectivePierceArmor = defender.pierceArmor;

    // 攻击方升级加成
    if (!isRanged) {
        if (attackerUpgrades.forge) effectiveAttack += 1;
        if (attackerUpgrades.ironCasting) effectiveAttack += 1;
        if (attackerUpgrades.blastFurnace) effectiveAttack += 2;
    } else {
        if (attackerUpgrades.fletching) effectiveAttack += 1;
        if (attackerUpgrades.bodkin) effectiveAttack += 1;
        if (attackerUpgrades.bracer) effectiveAttack += 1;
    }

    // 防守方护甲升级
    if (defender.category === '骑兵') {
        if (defenderUpgrades.scaleBarding) { effectiveMeleeArmor += 1; effectivePierceArmor += 1; }
        if (defenderUpgrades.chainBarding) { effectiveMeleeArmor += 1; effectivePierceArmor += 1; }
        if (defenderUpgrades.plateBarding) { effectiveMeleeArmor += 1; effectivePierceArmor += 2; }
    } else if (defender.category === '射手') {
        if (defenderUpgrades.paddedArcher) { effectiveMeleeArmor += 1; effectivePierceArmor += 1; }
        if (defenderUpgrades.leatherArcher) { effectiveMeleeArmor += 1; effectivePierceArmor += 1; }
        if (defenderUpgrades.ringArcher) { effectiveMeleeArmor += 1; effectivePierceArmor += 2; }
    }

    // 基础伤害计算 = max(1, 攻击力 - 对应防御)
    const armor = isRanged ? effectivePierceArmor : effectiveMeleeArmor;
    const baseDamage = Math.max(1, effectiveAttack - armor);

    // 额外伤害加成 (Bonus Damage) 计算
    let bonusDamage = 0;
    for (const ab of attacker.attackBonuses) {
        for (const dc of defender.armorClasses) {
            if (dc.includes(ab.targetClass) || ab.targetClass.includes(dc)) {
                bonusDamage += ab.bonus;
            }
        }
    }

    const totalDamagePerHit = Math.max(1, baseDamage + bonusDamage);
    const hitsToKill = Math.ceil(defender.hp / totalDamagePerHit);
    const timeToKillSec = Number(((hitsToKill - 1) * attacker.reloadTime).toFixed(2));
    const dps = Number((totalDamagePerHit / attacker.reloadTime).toFixed(2));

    return {
        baseDamage,
        bonusDamage,
        totalDamagePerHit,
        hitsToKill,
        timeToKillSec,
        dps,
    };
}
