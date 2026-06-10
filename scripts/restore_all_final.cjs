/**
 * restore_all_final.cjs — 最终版：全面恢复所有势力和城市数据
 * 
 * 处理所有已知问题：
 * 1. factions.ts: 已修复 (v2 成功)
 * 2. cities_v2.ts: 
 *    a. 被 v1 截断的单行条目 → 根据已知数据重建
 *    b. 被去除 // 的注释行 → 恢复注释
 *    c. 多行块的缩进问题 → 修复
 *    d. 未处理的 // { 块 → 取消注释
 *    e. 杂项问题
 * 
 * 运行: node scripts/restore_all_final.cjs
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 已知被截断的单行城市条目完整数据
// (从之前的搜索结果中提取)
// ============================================================
const TRUNCATED_ENTRIES = {
    // 单行格式的完整数据
    singleLine: {
        'city_langya':   { id: 'city_langya', name: '琅琊', factionId: 'wang_d', lat: 35.077231, lng: 118.363953, type: 'medium_city', troops: 10000, tier: 1 },
        'city_lanling':  { id: 'city_lanling', name: '兰陵', factionId: 'xiao_d', lat: 34.798005, lng: 117.647095, type: 'medium_city', troops: 10000, tier: 1 },
        'city_dingtao':  { id: 'city_dingtao', name: '定陶', factionId: 'lyu_d', lat: 35.200716, lng: 115.471802, type: 'medium_city', troops: 10000, tier: 1 },
        'city_qiaojun':  { id: 'city_qiaojun', name: '谯县', factionId: 'cao_d', lat: 33.865849, lng: 115.765686, type: 'medium_city', troops: 10000, tier: 1 },
    },
    // 多行格式（在 T1 区域中）
    multiLine: {
        'city_hangzhou':  { id: 'city_hangzhou', name: '杭州', factionId: 'qian_d', lat: 30.27, lng: 120.16, type: 'big_city', troops: 10000, tier: 0, note: '吴越/南宋临安都城' },
        'city_shouxian':  { id: 'city_shouxian', name: '寿县', factionId: 'huang_d', lat: 32.58, lng: 116.77, type: 'medium_city', troops: 10000, tier: 1, note: '古称寿春/寿阳, 战国楚都/淮南刘安都城, 汉末袁术称帝之地' },
        'city_chongqing': { id: 'city_chongqing', name: '重庆', factionId: 'ba', lat: 29.55, lng: 106.55, type: 'medium_city', troops: 10000, tier: 1, note: '古称江州/渝州/恭州, 巴国都城, 南宋改名重庆府' },
        'city_zhending':  { id: 'city_zhending', name: '真定', factionId: 'zhongshan', lat: 38.15, lng: 114.58, type: 'medium_city', troops: 10000, tier: 1, note: '古称东垣/真定(今正定), 战国中山国巨镇, 河北中部第一军事重镇' },
        'city_hejian':    { id: 'city_hejian', name: '乐成', factionId: 'zhang2_d', lat: 38.43, lng: 116.08, type: 'medium_city', troops: 10000, tier: 1, note: '古称武垣/乐成(今河间/献县), 河间国都城' },
        'city_pengcheng': { id: 'city_pengcheng', name: '彭城', factionId: 'peng_d', lat: 34.27, lng: 117.17, type: 'medium_city', troops: 10000, tier: 1 },
        'city_jimo':      { id: 'city_jimo', name: '即墨', factionId: 'jiaodong', lat: 36.37, lng: 120.45, type: 'medium_city', troops: 10000, tier: 1, note: '胶东国都城, 田市封地' },
        'city_boyang':    { id: 'city_boyang', name: '博阳', factionId: 'jibei', lat: 36.15, lng: 117.05, type: 'medium_city', troops: 10000, tier: 1, note: '济北国都城, 田安封地' },
        'city_bushan':    { id: 'city_bushan', name: '布山', factionId: 'luoyue', lat: 23.10, lng: 109.60, type: 'medium_city', troops: 10000, tier: 1, note: '古称布山/桂林/宜州, 桂林郡治, 骆越文化圈核心城邑' },
        'city_fuzhou':    { id: 'city_fuzhou', name: '福州', factionId: 'min', lat: 26.08, lng: 119.30, type: 'medium_city', troops: 10000, tier: 1, note: '古称冶县/东冶/福州, 闽越国都城/闽国首府, 东南沿海大港' },
        'city_kunming':   { id: 'city_kunming', name: '昆明', factionId: 'dian', lat: 25.04, lng: 102.72, type: 'medium_city', troops: 10000, tier: 1, note: '古称滇池/昆明, 滇国首都, 云贵高原核心都会' },
        'city_xuchang':   { id: 'city_xuchang', name: '许昌', factionId: 'xun_d', lat: 34.02, lng: 113.82, type: 'medium_city', troops: 10000, tier: 1, note: '古称许县/许昌, 曹魏五都之一, 颍川荀氏大本营' },
        'city_huaiyang':  { id: 'city_huaiyang', name: '陈州', factionId: 'chen', lat: 33.73, lng: 114.88, type: 'medium_city', troops: 10000, tier: 1, note: '古称陈县/陈州(今淮阳), 陈国都城, 楚顷襄王迁都之地, 曹操陈县起兵' },
        'city_nanyang':   { id: 'city_nanyang', name: '宛城', factionId: 'xin', lat: 33.00, lng: 112.53, type: 'medium_city', troops: 10000, tier: 1, note: '古称宛城(今南阳), 汉代"五都"之一, 曹操战张绣之宛城之战爆发地, 新朝(xin)势力首都' },
        'city_baidicheng':{ id: 'city_baidicheng', name: '夔州', factionId: 'cheng', lat: 31.04, lng: 109.53, type: 'medium_city', troops: 10000, tier: 1, note: '古称鱼复/永安/夔州(今奉节白帝城), 巴蜀东部屏障, 刘备托孤之白帝城' },
        'city_jiangxia':  { id: 'city_jiangxia', name: '夏口', factionId: 'yu2_d', lat: 30.58, lng: 114.27, type: 'medium_city', troops: 10000, tier: 1, note: '古称夏口/江夏/鄂州(今武汉武昌), 荆楚沿江第一军事大镇' },
        'city_chaisang':  { id: 'city_chaisang', name: '柴桑', factionId: 'tao_d', lat: 29.60, lng: 115.87, type: 'medium_city', troops: 10000, tier: 1, note: '古称柴桑/浔阳/江州(今九江), 周瑜训练水军之所, 陶侃大本营' },
        'city_yueyang':   { id: 'city_yueyang', name: '巴陵', factionId: 'yue_d', lat: 29.37, lng: 113.13, type: 'medium_city', troops: 10000, tier: 1, note: '古称巴丘/巴陵(今岳阳), 扼守洞庭湖入江之口, 岳家军驻地' },
        'city_longxi':    { id: 'city_longxi', name: '狄道', factionId: 'li_lx_d', lat: 35.35, lng: 103.85, type: 'medium_city', troops: 10000, tier: 1, note: '古称狄道/陇西(今临洮), 陇西李氏郡望, 秦长城西端, 丝路陇右军事重镇' },
        'city_wuwei':     { id: 'city_wuwei', name: '武威', factionId: 'liang', lat: 37.93, lng: 102.63, type: 'medium_city', troops: 10000, tier: 1, note: '古称姑臧/武威/凉州, 凉国首都/前凉后凉北凉都城, 河西走廊第一重镇' },
        'city_liaoyang':  { id: 'city_liaoyang', name: '襄平', factionId: 'gongsun_d', lat: 41.27, lng: 123.17, type: 'medium_city', troops: 10000, tier: 1, note: '古称襄平/辽东/辽阳, 公孙度辽东政权首都, 东北亚丝路枢纽' },
        'city_huangzhong':{ id: 'city_huangzhong', name: '湟中', factionId: 'qiang', lat: 36.50, lng: 101.80, type: 'medium_city', troops: 10000, tier: 1, note: '古称湟中/西平(今西宁), 羌族聚居与抗汉核心地带, 扼守湟水谷地' },
        'city_linhuang':  { id: 'city_linhuang', name: '临潢', factionId: 'liao_d', lat: 43.65, lng: 119.07, type: 'medium_city', troops: 10000, tier: 1, note: '辽上京临潢府, 契丹辽国之正式首都, 草原丝路东端大都会' },
        'city_ningcheng': { id: 'city_ningcheng', name: '宁城', factionId: 'wuhuan', lat: 41.55, lng: 119.30, type: 'medium_city', troops: 10000, tier: 1, note: '护乌桓校尉府(今宁城黑城子), 乌桓部落联盟政治中心' },
        'city_fuping':    { id: 'city_fuping', name: '富平', factionId: 'xianlingqiang', lat: 38.05, lng: 106.48, type: 'medium_city', troops: 10000, tier: 1, note: '古称富平/灵州(今吴忠), 先零羌聚居核心区, 河西走廊东端屏障' },
        'city_fuyu':      { id: 'city_fuyu', name: '夫余', factionId: 'fuyu', lat: 43.20, lng: 126.58, type: 'medium_city', troops: 10000, tier: 1, note: '夫余国前期都城, 东北古代四大民族政权之一' },
        'city_wuling':    { id: 'city_wuling', name: '武陵', factionId: 'wulingman', lat: 28.48, lng: 110.45, type: 'small_city', troops: 10000, tier: 2, note: '武陵蛮抗汉军事要塞与根据地(今湖南沅陵)' },
        'city_hulaoguan': { id: 'city_hulaoguan', name: '虎牢', factionId: 'zheng_xy_d', lat: 34.88, lng: 113.37, type: 'fortress', troops: 10000, tier: 2, note: '古称虎牢关/汜水关/成皋关(今荥阳), 中原第一险关, 郑氏发源地' },
        'city_wuguan':    { id: 'city_wuguan', name: '武关', factionId: 'su_d', lat: 33.63, lng: 110.90, type: 'pass', troops: 10000, tier: 2, note: '古称武关, 秦之南关,' },
        'city_lueyang':   { id: 'city_lueyang', name: '略阳', factionId: 'di', lat: 33.33, lng: 106.15, type: 'fortress', troops: 10000, tier: 2, note: '古称略阳/临渭, 氐族聚居核心地域, 前秦/后凉兴起之地' },
    },
    // 迁移区被截断的单行条目
    legacySingleLine: {
        'city_tongwancheng': { id: 'city_tongwancheng', name: '统万城', factionId: 'helian', lat: 37.99, lng: 108.85, type: 'medium_city', troops: 10000, tier: 1 },
        'city_qiuchi':       { id: 'city_qiuchi', name: '仇池', factionId: 'qiuchi', lat: 33.86, lng: 105.3, type: 'medium_city', troops: 10000, tier: 1 },
        'city_daixian':      { id: 'city_daixian', name: '代邑', factionId: 'dai_d', lat: 39.84, lng: 114.56, type: 'medium_city', troops: 10000, tier: 1 },
        'city_jimusaer':     { id: 'city_jimusaer', name: '别失八里', factionId: 'shatuo', lat: 44, lng: 89.18, type: 'medium_city', troops: 10000, tier: 1 },
        'city_ningan':       { id: 'city_ningan', name: '龙泉府', factionId: 'bohai', lat: 44.35, lng: 129.48, type: 'medium_city', troops: 10000, tier: 1 },
        'city_lanshi':       { id: 'city_lanshi', name: '蓝氏城', factionId: 'yuezhi', lat: 36.76, lng: 68.86, type: 'medium_city', troops: 10000, tier: 1 },
        'city_shenglong':    { id: 'city_shenglong', name: '昇龙', factionId: 'dayue', lat: 20.95, lng: 106, type: 'medium_city', troops: 10000, tier: 1 },
        'city_luoxie':       { id: 'city_luoxie', name: '逻些', factionId: 'tubo', lat: 29.65, lng: 91.1, type: 'medium_city', troops: 10000, tier: 1 },
        'city_woluduobali':  { id: 'city_woluduobali', name: '窝鲁朵八里', factionId: 'huige', lat: 47.43, lng: 102.66, type: 'medium_city', troops: 10000, tier: 1 },
        'city_luhun':        { id: 'city_luhun', name: '鹿浑', factionId: 'rouran', lat: 47.1, lng: 100.5, type: 'medium_city', troops: 10000, tier: 1 },
        'city_chilechuan':   { id: 'city_chilechuan', name: '敕勒川', factionId: 'chile', lat: 40.65, lng: 110, type: 'medium_city', troops: 10000, tier: 1 },
        'city_dulehe':       { id: 'city_dulehe', name: '独乐河', factionId: 'tiele', lat: 48, lng: 104.5, type: 'medium_city', troops: 10000, tier: 1 },
        'city_wangting_yuezhi': { id: 'city_wangting_yuezhi', name: '王庭', factionId: 'yuezhi', lat: 43.5, lng: 82.5, type: 'medium_city', troops: 10000, tier: 1 },
        'city_sabi':         { id: 'city_sabi', name: '泗沘', factionId: 'baiji', lat: 36.28, lng: 126.91, type: 'medium_city', troops: 10000, tier: 1 },
        'city_dazaifu':      { id: 'city_dazaifu', name: '太宰府', factionId: 'yamatai', lat: 33.51, lng: 130.52, type: 'medium_city', troops: 10000, tier: 1 },
        'city_nara':         { id: 'city_nara', name: '平城京', factionId: 'yamato', lat: 34.68, lng: 135.83, type: 'medium_city', troops: 10000, tier: 1 },
        'city_kamakura':     { id: 'city_kamakura', name: '镰仓', factionId: 'kamakura', lat: 35.32, lng: 139.55, type: 'medium_city', troops: 10000, tier: 1 },
        'city_edo':          { id: 'city_edo', name: '江户', factionId: 'edo', lat: 35.68, lng: 139.77, type: 'medium_city', troops: 10000, tier: 1 },
        'city_kyoto':        { id: 'city_kyoto', name: '平安京', factionId: 'yamato', lat: 35.01, lng: 135.77, type: 'medium_city', troops: 10000, tier: 1 },
        'city_tainan':       { id: 'city_tainan', name: '承天', factionId: 'taiwan', lat: 22.99, lng: 120.2, type: 'medium_city', troops: 10000, tier: 1 },
        'city_yiqu':         { id: 'city_yiqu', name: '义渠', factionId: 'yiqu', lat: 35.82, lng: 107.43, type: 'medium_city', troops: 10000, tier: 1 },
        'city_hulunhu':      { id: 'city_hulunhu', name: '呼伦湖', factionId: 'donghu', lat: 48.97, lng: 117.8, type: 'medium_city', troops: 10000, tier: 1 },
        'city_yinggeling':   { id: 'city_yinggeling', name: '莺歌岭', factionId: 'sushen', lat: 43.85, lng: 128.95, type: 'medium_city', troops: 10000, tier: 1 },
        'city_weirong':      { id: 'city_weirong', name: '威戎', factionId: 'quanrong', lat: 35.38, lng: 105.76, type: 'medium_city', troops: 10000, tier: 1 },
        'city_xingtai':      { id: 'city_xingtai', name: '邢台', factionId: 'jie', lat: 37.08, lng: 114.48, type: 'medium_city', troops: 10000, tier: 1 },
        'city_pinggang':     { id: 'city_pinggang', name: '平冈', factionId: 'yuwen', lat: 41.5, lng: 119.3, type: 'medium_city', troops: 10000, tier: 1 },
        'city_shangdang':    { id: 'city_shangdang', name: '长子', factionId: 'feng_d', lat: 36.12, lng: 112.88, type: 'medium_city', troops: 10000, tier: 1 },
        'city_qinghe':       { id: 'city_qinghe', name: '甘陵', factionId: 'cui_qh_d', lat: 36.95, lng: 115.65, type: 'medium_city', troops: 10000, tier: 1 },
        'city_fanyang':      { id: 'city_fanyang', name: '涿县', factionId: 'lu_fy_d', lat: 39.48, lng: 115.98, type: 'medium_city', troops: 10000, tier: 1 },
        'city_hedong':       { id: 'city_hedong', name: '安邑', factionId: 'pei_hd_d', lat: 35.12, lng: 111.08, type: 'medium_city', troops: 10000, tier: 1 },
        'city_chenjun':      { id: 'city_chenjun', name: '新蔡', factionId: 'yuan_cj_d', lat: 32.75, lng: 114.98, type: 'medium_city', troops: 10000, tier: 1 },
        'city_yangxia':      { id: 'city_yangxia', name: '阳夏', factionId: 'xie_cj_d', lat: 34.18, lng: 114.65, type: 'medium_city', troops: 10000, tier: 1 },
        'city_qufu':         { id: 'city_qufu', name: '曲阜', factionId: 'kong_d', lat: 35.6, lng: 116.98, type: 'medium_city', troops: 10000, tier: 1 },
    }
};

// 将对象格式化为单行城市条目字符串
function formatSingleLineCity(data) {
    let parts = [`{ id: '${data.id}'`];
    if (data.name) parts.push(` name: '${data.name}'`);
    if (data.factionId) parts.push(` factionId: '${data.factionId}'`);
    if (data.lat !== undefined) parts.push(` lat: ${data.lat}`);
    if (data.lng !== undefined) parts.push(` lng: ${data.lng}`);
    if (data.type) parts.push(` type: '${data.type}'`);
    if (data.troops !== undefined) parts.push(` troops: ${data.troops}`);
    if (data.tier !== undefined) parts.push(` tier: ${data.tier}`);
    if (data.note) parts.push(` note: '${data.note}'`);
    return parts.join(',') + ' },';
}

// 格式化成多行块
function formatMultiLineBlock(data, indent) {
    let lines = [];
    lines.push(`${indent}{`);
    lines.push(`${indent}    id: '${data.id}',`);
    if (data.name) lines.push(`${indent}    name: '${data.name}',`);
    if (data.factionId) lines.push(`${indent}    factionId: '${data.factionId}',`);
    if (data.lat !== undefined) lines.push(`${indent}    lat: ${data.lat},`);
    if (data.lng !== undefined) lines.push(`${indent}    lng: ${data.lng},`);
    if (data.type) lines.push(`${indent}    type: '${data.type}',`);
    if (data.troops !== undefined) lines.push(`${indent}    troops: ${data.troops},`);
    if (data.tier !== undefined) lines.push(`${indent}    tier: ${data.tier},`);
    if (data.note) lines.push(`${indent}    note: '${data.note}'`);
    lines.push(`${indent}},`);
    return lines;
}

// ============================================================
// 修复 cities_v2.ts
// ============================================================
function restoreCitiesV2() {
    const filePath = path.resolve(__dirname, '..', 'src', 'data', 'cities_v2.ts');
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let result = [];
    let changes = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trimEnd(); // 保留 trailing \r 但 trim 空格

        // ── 修复1: 恢复被去除 // 的注释行 ──
        // 匹配以 ── 开头（原本是 // ── xxx ──）
        if (trimmed.match(/^──.+(──)$/) || 
            trimmed.match(/^={2,}\s*T2\s/) ||
            trimmed.match(/^─{2,}\s*蜀道/) ||
            trimmed.match(/^─{2,}\s*关中/) ||
            trimmed.match(/^─{2,}\s*中原/) ||
            trimmed.match(/^─{2,}\s*荆楚/) ||
            trimmed.match(/^─{2,}\s*淮河/) ||
            trimmed.match(/^─{2,}\s*华北/) ||
            trimmed.match(/^─{2,}\s*西北/) ||
            trimmed.match(/^─{2,}\s*东北/) ||
            trimmed.match(/^─{2,}\s*西南/) ||
            trimmed.match(/^─{2,}\s*东南/) ||
            trimmed.match(/^─{2,}\s*岭南/) ||
            trimmed.match(/^─{2,}\s*齐鲁/) ||
            trimmed.match(/^─{2,}\s*陇右/) ||
            trimmed.match(/^─{2,}\s*江东/) ||
            trimmed.match(/^─{2,}\s*河北/) ||
            trimmed.match(/^─{2,}\s*河南/) ||
            trimmed.match(/^─{2,}\s*山西/) ||
            trimmed.match(/^─{2,}\s*山东/) ||
            trimmed.match(/^─{2,}\s*河西/) ||
            trimmed.match(/^─{2,}\s*西域/) ||
            trimmed.match(/^─{2,}\s*漠北/) ||
            trimmed.match(/^─{2,}\s*青藏/) ||
            trimmed.match(/^─{2,}\s*云贵/) ||
            trimmed.match(/^─{2,}\s*朝鲜/) ||
            trimmed.match(/^─{2,}\s*日本/) ||
            trimmed.match(/^─{2,}\s*蒙古/) ||
            trimmed.match(/^─{2,}\s*草原/) ||
            trimmed.match(/^─{2,}\s*辽东/) ||
            trimmed.match(/^[─=]{2,}/)) {
            // 已经是注释行，跳过
            if (trimmed.startsWith('//')) continue;
            // 恢复 // 前缀
            let indent = line.match(/^(\s*)/)[1];
            result.push(indent + '// ' + trimmed);
            changes++;
            continue;
        }

        // ── 修复2: 恢复被截断的单行条目 ──
        // 匹配: "{ id: 'city_xxx'," 后面紧跟着 "    tier: 1" 或类似
        let truncatedMatch = trimmed.match(/^(\s*)\{\s*id:\s+'([^']+)',\s*$/);
        if (truncatedMatch) {
            let indent = truncatedMatch[1];
            let cityId = truncatedMatch[2];
            
            // 检查是否在 legacy 区域
            let inLegacy = false;
            for (let j = Math.max(0, i - 10); j < i; j++) {
                if (lines[j] && lines[j].includes('CITIES_LEGACY')) {
                    inLegacy = true;
                    break;
                }
            }
            // 也检查当前行附近的标志
            if (line.includes('CITIES_LEGACY')) inLegacy = true;

            // 尝试从已知数据重建
            let data = null;
            if (TRUNCATED_ENTRIES.singleLine[cityId]) {
                data = TRUNCATED_ENTRIES.singleLine[cityId];
            } else if (TRUNCATED_ENTRIES.legacySingleLine[cityId]) {
                data = TRUNCATED_ENTRIES.legacySingleLine[cityId];
            } else if (TRUNCATED_ENTRIES.multiLine[cityId]) {
                data = TRUNCATED_ENTRIES.multiLine[cityId];
            }

            if (data) {
                // 检查下一行是否是 "tier: 1" (残留的)
                let nextIdx = i + 1;
                while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
                let nextLine = nextIdx < lines.length ? lines[nextIdx].trim() : '';
                
                // 如果下一行是 tier: 1，跳过它
                let skipNext = nextLine.match(/^tier:\s*\d+,?\s*$/);
                
                let formatted = formatSingleLineCity(data);
                result.push(indent + formatted);
                changes++;
                
                if (skipNext) {
                    // 跳过 "tier: 1" 行
                    i = nextIdx; // 循环会 +1，所以这里设为要跳过的行的索引
                }
                continue;
            }
        }

        // ── 修复3: 处理残留的 "tier: 1" 行 ──
        // 如果上一行已经处理过，这里会被跳过
        // 但单独出现的 tier 行需要检查

        // ── 修复4: 修复多行块中属性缩进 ──
        // 匹配以 4 空格缩进的属性行（应该是 8 空格）
        let badIndent = trimmed.match(/^(    )(id:|name:|factionId:|lat:|lng:|type:|troops:|tier:|region:|note:)/);
        if (badIndent) {
            // 检查是否在 T0_CAPITALS 区域（T0 的 id 是 8 空格缩进）
            let isInT0 = false;
            for (let j = Math.max(0, i - 20); j < i; j++) {
                if (lines[j] && (lines[j].includes('T0_CAPITALS') || lines[j].includes('T1_MEDIUM_CITIES') || lines[j].includes('T2_STRATEGIC'))) {
                    // 在 T* 数组内部
                    break;
                }
            }
            // 检查 { 的缩进
            let braceIndent = 4; // 默认 T1 级别的 { 缩进
            for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                let prev = lines[j];
                if (prev) {
                    let pm = prev.match(/^(\s*)\{/);
                    if (pm) {
                        braceIndent = pm[1].length;
                        break;
                    }
                }
            }
            
            // 属性应该在 { 缩进 + 4 空格
            let expectedIndent = braceIndent + 4;
            let currentIndent = badIndent[1].length;
            if (currentIndent < expectedIndent) {
                let indent = ' '.repeat(expectedIndent);
                let rest = line.substring(currentIndent); // 从当前缩进后开始
                result.push(indent + rest.trimStart());
                changes++;
                continue;
            }
        }

        // 默认：保留原行
        result.push(line);
    }

    fs.writeFileSync(filePath, result.join('\n'), 'utf8');
    console.log(`[cities_v2.ts] 修复完成: ${changes} 处修改`);
    
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let remainingRemoved = (finalContent.match(/REMOVED/g) || []).length;
    console.log(`[cities_v2.ts] 剩余 REMOVED 标记: ${remainingRemoved}`);
}

// ============================================================
// 执行
// ============================================================
console.log('=== 最终版恢复脚本 ===\n');
console.log('注意: factions.ts 已在 v2 中恢复完毕，跳过...\n');

restoreCitiesV2();

console.log('\n=== 完成 ===');
console.log('请运行: npx tsc --noEmit');
