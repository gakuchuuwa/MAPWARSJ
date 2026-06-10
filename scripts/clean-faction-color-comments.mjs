/**
 * 清理 factions.ts 中过期「假颜色」注释；保留旗号/据点名/史地说明类注释。
 */
import fs from 'fs';

const filePath = 'src/data/factions.ts';
let text = fs.readFileSync(filePath, 'utf-8');

const newHeader = `// 势力数据 (Faction Data)
// 每个势力：id、name（旗号汉字见 SandboxDisplayNames）
// 显示色：固定见 HistoricalFactionColors.ts；其余每局由 FactionManager 随机分配
// 命名规则：政权用正式国号(部分加"大")，民族用最高知名度2字简称，军阀用人名姓氏，家族用单姓氏
`;

text = text.replace(/^\/\/ 势力数据[\s\S]*?\/\/ 命名规则：[^\n]+\n\n/m, newHeader);

const blockDrop = [
    /^\/\/ 中华正红.*\n/m,
    /^\/\/ 帝国蓝.*\n/m,
    /^\/\/ 白色 - 燕国.*\n/m,
    /^\/\/ 沙漠暗黄.*\n/m,
];
for (const re of blockDrop) text = text.replace(re, '');

/** 史地/旗号说明 — 含这些词则保留行尾或独立注释 */
const keepComment =
    /(旗号|避与|避重|留给|全称|二字|见 dianguo|Badakhshan|Ghurids|同族|据点名|舒州|通海|高句丽|国内城|平原郡|郡内|旗号取|九江郡|浔阳|符离|秀容|洛口|蔡州|魏州|安阳|贝州|高凉|蒙舍|淮西|乐寿|马邑|江都|渔阳|金城|东胜|棣州|黔中|春申|清苑|仲家|北洋|占城|墨侬|水真|瓦剌|兀良|丁零|尼夫|坚昆|后百济|绿林|云中|与北宋|区分|濮阳|宿州|六县|襄阳|历阳|羊苴咩|大方城|青唐|邕州|清溪|鼎州|登州|信州|撒马尔|阿剌模|阿力麻|玛拉固|土兀剌|黑林|科布多|谦河|叶尼塞|河套|苏子河|乌拉|库页|黑龙江|汉城|阿瑜陀|吴哥|额尔德|伊犁|叶尔羌|日喀则|加德满|浩罕|兴势|大理|乌鲁木齐|喀什|斡难|克鲁伦|额尔古|准噶尔|哲蚌|堆龙|萨迦|乃东|仁蚌|夏鲁|室利|缅甸|直通|木府|台湾|安平|热兰|大瑶山|西都|越南|高平|笨港|僰王|珙县|阆中|闽浙|敕木|且弥|迪化|昆仑塞|玛曲|黄河|金州|南阳|桓温|桓玄|翟氏|段氏|契胡|英布|刘表|瓦岗|李密|窦建德|刘武周|宇文化及|罗艺|林士弘|杜伏威|冼夫人|薛举|蒙舍城|高昌|黠戛斯|小勃律|李希烈|田氏|段思平|王则|侬智高|方腊|钟相|杨幺|杨安儿|德寿|木剌夷|察合台|伊儿汗|孛罗帖|朱高煦|唐努|扈伦|胡朝|黎氏|张献忠|班禅|廓尔喀|尼泊尔|李永和|蓝朝鼎|杜文秀|妥明|迈孜木|金相印|毛文龙|东江镇|皮岛|赫舍里|索尼|索额图|瓜尔佳|鳌拜|吐火罗|员渠|焉耆|塞种|斯基泰|特克斯|昭苏|康居|卑阗|锡尔河|尉迟|伏阇|于阗|丹丹|麴氏|柏孜克里|高车|敕勒|浚稽|呼衍|匈奴|弱水|阿史那|阿史德|孛儿只斤|札剌亦|弘吉剌|绰罗斯|甘丹颇章|五世达赖|帕竹朗|仁蚌巴|扎氏|室利差|骠人|孟族|木氏|木府|明郑|东宁|颜思齐|郑芝龙|僰人|谯氏|畲族|党项|拓跋|申国)/;

/** 假颜色注释特征 */
function isFakeColorComment(body) {
    if (keepComment.test(body)) return false;
    if (/^[\u4e00-\u9fff]{0,6}(列国|新增|──)/.test(body)) return false;
    if (/^[\u4e00-\u9fff]{0,4}(红|蓝|绿|黄|紫|橙|褐|金|灰|靛|赭|绯|朱|暗|深|浅|亮|鲜|哑光|正红|帝国|沙漠|橄榄|藤紫|秘鲁|道奇|番茄|火砖|义军|朱红|暗紫|橘红|金黄|绿色|狼褐|泰加|荒林|紫檀|灰绿|辽东|铁锈|卫红|土黄|陶褐|荆州|胡萝卜|沙金|板岩|紫霞|吐蕃|南疆|明教|洞庭|红袄|暗影|汗国|波斯|赭褐|文明|大同|红巾|藩王|塞外|海西|暗苔|交阯|朝鲜|韩红|暹罗|吴哥|苏岛|巨港|深紫|喀尔|铜褐|沙褐|廓喀|霍罕|妥明|靛紫|江河|靺鞨|深草|明黄|赤红|秘鲁|于阗|驼褐|元红|贝加尔|灰褐|柔然|绿灰|黄金|克鲁伦|额尔古|瓦剌|金色|噶尔|靛蓝|帕竹|丽江|大肚|东宁|林越|海商|瘗棺|阆苑|敕木|天山|昆仑)/.test(body)) {
        return true;
    }
    if (/\s[-–—]\s/.test(body) && /(红|蓝|绿|黄|紫|橙|褐|金|灰|靛|赭|绯|朱|暗|深)/.test(body)) return true;
    if (/#/.test(body)) return true;
    return false;
}

const lines = text.split(/\r?\n/);
const out = [];

for (const line of lines) {
    if (/^\s*\/\/(?!.*\{ id:)/.test(line) && !/\{ id:/.test(line)) {
        const body = line.trim().slice(2).trim();
        if (isFakeColorComment(body)) continue;
    }

    if (/\{ id:/.test(line)) {
        const idx = line.indexOf('//');
        if (idx !== -1) {
            const comment = line.slice(idx + 2).trim();
            if (isFakeColorComment(comment)) {
                let trimmed = line.slice(0, idx).replace(/\s+$/, '');
                if (!trimmed.endsWith(',')) trimmed += ',';
                out.push(trimmed);
                continue;
            }
        }
    }

    out.push(line);
}

text = out.join('\n').replace(/,\s*,/g, ',');
fs.writeFileSync(filePath, text, 'utf-8');
console.log('cleaned factions.ts color comments');
