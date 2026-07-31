import * as fs from 'fs';
import * as path from 'path';

const CITIES_FILE = path.join(process.cwd(), 'src/data/cities_v2.ts');
let content = fs.readFileSync(CITIES_FILE, 'utf-8');

// 锁定的大城
const BIG_CITIES = [
  'city_changan', 'city_luoyang', 'city_beijing', 'city_nanjing', 'city_anyang',
  'city_hangzhou', 'city_chengdu', 'city_datong', 'city_panyu', 'city_bianliang',
  'city_linzi', 'city_merve', 'city_ayutthaya', 'city_angkor', 'city_kyoto',
  'city_edo', 'city_geumseong'
];

// 我们精选的中城 (省会、诸侯国都、名郡、历史大都会)
const APPROVED_MEDIUM_CITIES = [
  // 现代省会/大都会对应的古城
  'city_licheng', // 济南
  'city_chongqing', // 重庆
  'city_fuzhou', // 福州
  'city_changsha', // 长沙
  'city_jiangxia', // 武汉(武昌)
  'city_lingqu', // 桂林 (灵渠)
  'city_juzhou', // 贵阳 (矩州)
  'city_tuodongcheng', // 昆明 (拓东城)
  'city_lanzhou', // 兰州
  'city_qingtang', // 西宁 (青唐城)
  'city_xingqing', // 银川 (兴庆府)
  'city_guihua', // 呼和浩特 (归化城)
  'city_taiyuan', // 太原
  'city_hetuala', // 沈阳附近 (赫图阿拉)
  'city_huining', // 哈尔滨附近 (会宁府)

  // 历史名郡/军镇/割据政权首都 (中原及南方)
  'city_hanzhong', // 汉中
  'city_xiangyang', // 襄阳
  'city_ying', // 郢城 (荆州)
  'city_pengcheng', // 徐州 (彭城)
  'city_yangzhou', // 扬州
  'city_gusu', // 苏州 (姑苏)
  'city_wancheng', // 宛城 (南阳)
  'city_shangqiu', // 商丘 (宋国)
  'city_handan', // 邯郸 (赵国)
  'city_zhending', // 真定
  'city_linfen', // 平阳
  'city_chaisang', // 柴桑 (九江)
  'city_langya', // 琅琊
  'city_citong', // 泉州 (刺桐)
  'city_zhangzhou', // 漳州
  'city_tianshui', // 天水
  'city_longxi', // 陇西 (巩昌)
  'city_wuwei', // 姑臧 (武威)
  'city_zhangye', // 张掖
  'city_dunhuang', // 敦煌
  'city_liaoyang', // 襄平 (辽阳)
  
  // 边疆/少数民族政权首都及重要节点
  'city_dali_city', // 大理 (羊苴咩城)
  'city_luoxie', // 拉萨 (逻些)
  'city_shule', // 喀什 (盘橐城)
  'city_shache', // 莎车
  'city_qiuci', // 龟兹 (延城)
  'city_gaochang', // 高昌
  'city_yutian', // 于阗
  'city_karakorum', // 哈拉和林
  'city_shangdu', // 上都
  'city_shengle', // 盛乐
  'city_longquan', // 龙泉府 (渤海国)
  'city_guoneicheng', // 国内城 (高句丽)
  'city_pyongyang', // 平壤
  'city_seoul', // 汉城
  'city_kaesong', // 开城
  'city_jeonju', // 全州 (后百济)
  'city_sabi', // 泗沘 (百济)
  
  // 外国名城
  'city_samarkand', // 撒马尔罕
  'city_urgench', // 玉龙杰赤
  'city_bagan', // 蒲甘
  'city_bago', // 勃固城
  'city_inwa', // 阿瓦
  'city_hoalu', // 华闾
  'city_thanglong', // 昇龙
  'city_vijaya', // 占城港
  'city_shuri', // 首里
  'city_tainan', // 承天 (台南)
  
  // 其他遗漏的著名府治 (可选)
  'city_weizhou', // 魏州
  'city_qinghe', // 清河 (甘陵)
  'city_shunchang', // 顺昌
  'city_qiaojun', // 谯县
  'city_hefei' // 合肥
];

// 正则替换逻辑
// 我们将通过寻找每个据点的 { id: '...', ... } 块来进行替换
const cityBlockRegex = /\{\s*id\s*:\s*'([^']+)'[^}]+\}/g;

let match;
const matches = [];
while ((match = cityBlockRegex.exec(content)) !== null) {
  matches.push({ full: match[0], id: match[1], index: match.index });
}

let modifiedCount = 0;
let newContent = content;

// 从后往前替换，避免影响索引
for (let i = matches.length - 1; i >= 0; i--) {
  const m = matches[i];
  const id = m.id;
  let block = m.full;

  // 1. 判断该据点应该是哪种类型
  let targetType = '';
  let targetTroops = '';
  let targetTier = null;

  if (BIG_CITIES.includes(id)) {
    targetType = 'big_city';
    targetTroops = '20000';
    targetTier = 0;
  } else if (APPROVED_MEDIUM_CITIES.includes(id)) {
    targetType = 'medium_city';
    targetTroops = '10000';
    targetTier = 1; // 默认给1，除非原来是4
  } else {
    // 关隘保留 pass；原渡口 type 已取消，归入 small_city
    if (block.includes(`type: 'pass'`)) {
      targetType = 'pass';
      targetTroops = '5000';
      targetTier = 2; // 关卡给2
    } else {
      // 剩下的全部降级为小城
      targetType = 'small_city';
      targetTroops = '5000';
      // 移除 tier: 1 或 tier: 0, 如果原来有 tier: 4 则保留
    }
  }

  // 开始替换 block 里的文本
  
  // 替换 type
  block = block.replace(/type:\s*'[^']+'/, `type: '${targetType}'`);
  
  // 替换 troops
  if (block.includes('troops:')) {
    block = block.replace(/troops:\s*\d+/, `troops: ${targetTroops}`);
  } else {
    // 插入 troops (如果有 type, 插在后面)
    block = block.replace(/type:\s*'[^']+'/, `type: '${targetType}', troops: ${targetTroops}`);
  }

  // 处理 tier
  if (targetType === 'medium_city') {
    if (!block.includes('tier: 4')) { // 如果不是外围，给 tier 1
      if (block.includes('tier:')) {
        block = block.replace(/tier:\s*\d/, `tier: 1`);
      } else {
        block = block.replace(/troops:\s*\d+/, `troops: ${targetTroops}, tier: 1`);
      }
    }
  } else if (targetType === 'small_city') {
    // 小城移除 tier: 1, 0, 2, 但保留 4 (外围)
    if (block.includes('tier: 1') || block.includes('tier: 0') || block.includes('tier: 2')) {
      block = block.replace(/,\s*tier:\s*[012]/, '');
    }
  } else if (targetType === 'pass') {
    if (!block.includes('tier: 4')) {
      if (block.includes('tier:')) {
        block = block.replace(/tier:\s*\d/, `tier: 2`);
      } else {
        block = block.replace(/troops:\s*\d+/, `troops: ${targetTroops}, tier: 2`);
      }
    }
  }

  if (block !== m.full) {
    newContent = newContent.substring(0, m.index) + block + newContent.substring(m.index + m.full.length);
    modifiedCount++;
  }
}

fs.writeFileSync(CITIES_FILE, newContent, 'utf-8');
console.log(`Processed ${matches.length} cities. Modified ${modifiedCount} blocks.`);
