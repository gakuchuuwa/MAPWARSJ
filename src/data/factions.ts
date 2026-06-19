// 势力数据 (Faction Data)
// 每个势力：id、name（旗号汉字见 SandboxDisplayNames）
// 显示色：固定见 HistoricalFactionColors.ts；其余每局由 FactionManager 随机分配
// 命名规则：政权用正式国号(部分加"大")，民族用最高知名度2字简称，军阀用人名姓氏，家族用单姓氏
import { Faction } from '../types/core';

// Re-export for compatibility
export type { Faction };

export const FACTIONS: Faction[] = [
  { id: 'heishui', name: '黑水靺鞨' },
  { id: 'kelie', name: '克烈部' },
  { id: 'donghui', name: '东濊' },
  { id: 'gonggu', name: '宫古' },
  { id: 'fuguo', name: '附国' },
  { id: 'gongtang', name: '贡唐' },
  { id: 'chizhou', name: '池州' },

  { id: 'yada', name: '嚈哒帝国' },
  { id: 'quli', name: '渠犁国' },
  { id: 'guazhou', name: '瓜州' },
  { id: 'guishuang', name: '贵霜帝国' },
  { id: 'juandu', name: '捐毒国' },
  { id: 'sai', name: '塞种' },
  { id: 'yangtong', name: '羊同' },

    { id: 'zhancheng', name: '占城' },
    { id: 'monong', name: '墨侬' },
    { id: 'shuizhen', name: '水真' },
    { id: 'wala', name: '瓦剌' },
    { id: 'wuliangha', name: '兀良' },   // 旗号二字（全称兀良哈/乌梁海）
    { id: 'dingling', name: '丁零' },
    { id: 'nifuhe', name: '尼夫' },     // 旗号二字（全称尼夫赫）
    { id: 'guer', name: '古尔' },       // 古尔王朝（Ghurids）
    { id: 'xiajiasi', name: '坚昆' },   // 旗号二字；唐称黠戛斯，同族
    { id: 'zhen', name: '后百济' },
    { id: 'dongshengwei', name: '东胜卫' },
    { id: 'dizhou', name: '棣州' },
    { id: 'bailian', name: '白莲' },
    { id: 'chimei', name: '赤眉' },
    { id: 'yunzhong', name: '云中' },
    { id: 'qian', name: '黔中' },
    { id: 'chunshen', name: '春申' },
    { id: 'wan', name: '舒州' },          // 舒州(皖城/安庆)；旗号取舒州避与据点皖城重
    { id: 'qingyuan_bd', name: '清苑' },
    { id: 'zhong', name: '寿州' },
    { id: 'xichu', name: '西楚' },
    { id: 'weihaiwei', name: '威海' },
    { id: 'xiezhou', name: '解州' },
    { id: 'shang', name: '商国' },
    { id: 'zhou', name: '周国' },
    
    // 春秋战国列国
    { id: 'qi', name: '齐国' },
    { id: 'jin', name: '晋国' },
    { id: 'chu', name: '江陵' },
    { id: 'wu', name: '吴国' },
    { id: 'yue', name: '越国' },
    { id: 'nanyue', name: '南越' },                 // 赵佗@龙川（政权·国号）
    { id: 'guangzhou', name: '广州' },               // 广州@番禺（州府/广南核心）
    // ── 2026-06-19 新增：端州@肇庆（摧锋军；旗号端≠据点名肇庆）──
    { id: 'duanzhou_d', name: '端州' },
    { id: 'qin', name: '秦国' },
    { id: 'song', name: '宋国' },
    { id: 'yan', name: '燕国' },
    { id: 'zhao', name: '赵国' },
    { id: 'wei', name: '魏国' },
    { id: 'han', name: '韩国' },
    { id: 'han_d', name: '汉国' },
    { id: 'shu', name: '蜀国' },
    { id: 'shu_han', name: '蜀汉' }, // ── 2026-06-18：王平@兴势（兴势之战）──
    { id: 'hanzhong_d', name: '汉中' }, // ── 2026-06-18：魏延@略阳（阳平关·汉中太守）──
    { id: 'dingxiang_d', name: '定襄' }, // ── 2026-06-18：李靖@恶阳岭（贞观四年定襄夜袭；旗号定襄）──
    { id: 'dian', name: '通海' },       // 通海路（通海）；滇国见 dianguo
    { id: 'xin', name: '新国' },
    { id: 'cheng', name: '成国' },
    { id: 'liangzhou', name: '凉州' },
    { id: 'liang', name: '凉国' },
    { id: 'juqu_d', name: '沮渠' },
    { id: 'tufa_d', name: '秃发' },
    { id: 'qiuchi', name: '杨氏' },
    { id: 'helian', name: '赫连' },
    { id: 'xiongnu', name: '匈奴' },
    { id: 'xianbei', name: '鲜卑' },
    { id: 'jie', name: '羯族' },
    { id: 'qiang', name: '羌族' },
    { id: 'tuoba', name: '拓跋' },
    { id: 'yuwen', name: '宇文' },
    { id: 'liang_d', name: '梁国' },
    { id: 'chen', name: '陈国' },
    { id: 'sui', name: '隋国' },
    { id: 'tang', name: '唐国' },
    { id: 'min', name: '闽国' },
    { id: 'shazhou', name: '沙州' },
    { id: 'shatuo', name: '沙陀' },
    { id: 'qidan', name: '契丹' },
    { id: 'bing', name: '并州' },
    { id: 'bohai', name: '渤海' },
    { id: 'jurchen', name: '女真' },
    { id: 'dangxiang', name: '大夏' },
    { id: 'menggu_d', name: '蒙古' },
    { id: 'manzhou', name: '满洲' },
    { id: 'manzhou_d', name: '大清' },
    { id: 'ming_d', name: '大明' },
    { id: 'liao_d', name: '大辽' },
    { id: 'dai_d', name: '代国' },
    { id: 'feng_d', name: '冯氏' },
    { id: 'zhongshan', name: '恒州' },
    { id: 'wang_d', name: '王氏' },
    { id: 'xiao_d', name: '萧氏' },
    { id: 'li_lx_d', name: '李氏' },
    { id: 'yuan_cj_d', name: '袁氏' },
    { id: 'xie_cj_d', name: '信州' },
    // 金黄 - 春申黄氏
    { id: 'yue_d', name: '岳氏' },
    { id: 'qian_d', name: '钱氏' },
    { id: 'kong_d', name: '孔氏' },
    { id: 'cao_d', name: '曹氏' },
    { id: 'jiujiang', name: '柴桑' },       // 橄榄 - 柴桑/浔阳(九江郡)
    { id: 'jiaodong', name: '胶东' },
    { id: 'huangfu', name: '皇甫' },
{ id: 'guo', name: '果州' },
    { id: 'zi', name: '资州' },
    { id: 'long2', name: '陇州' },
    { id: 'song2', name: '松州' },
    { id: 'qing', name: '庆州' },
    { id: 'ting', name: '汀州' },
    { id: 'quan', name: '权州' },
    { id: 'jibei', name: '济北' },
    { id: 'wusun', name: '乌孙' },
    { id: 'dayuan', name: '大宛' },
    { id: 'gouding', name: '句町' },
    { id: 'wuhuan', name: '乌桓' },
    { id: 'xianlingqiang', name: '先零' },
    { id: 'yelang', name: '夜郎' },
    { id: 'ailao', name: '哀牢' },
    { id: 'fuyu', name: '夫余' },
    { id: 'shule', name: '疏勒' },
    { id: 'loulan', name: '楼兰' },
    { id: 'shache', name: '莎车' },
    { id: 'qiuci', name: '龟兹' },
    { id: 'yanqi', name: '焉耆' },
    { id: 'gaogouli', name: '高句丽' },   // 高句丽国都平壤（427 起）；「高丽」留给 goryeo
    { id: 'xinluo', name: '新罗' },
 
    // ── 2026-06-11 日本重置：京都改挂室町（足利旗）──
    { id: 'ashikaga', name: '室町' },
    { id: 'quanrong', name: '犬戎' },
    { id: 'suzhou', name: '肃州' },
    { id: 'sushen', name: '肃慎' },

    { id: 'chile', name: '敕勒' },
    { id: 'rouran', name: '柔然' },
    { id: 'baiji', name: '百济' },
    { id: 'tubo', name: '吐蕃' },
    { id: 'tujue', name: '突厥' },
    { id: 'tiele', name: '铁勒' },
    { id: 'huige', name: '回纥' },
    { id: 'dayue', name: '大越' },

    { id: 'yamato', name: '大和' },
    { id: 'edo', name: '德川' },

    { id: 'izumo', name: '出云' },
    { id: 'satsuma', name: '萨摩' },
    { id: 'ryukyu', name: '琉球' },
    { id: 'so', name: '对马' },
    { id: 'kakizaki', name: '松前' },
    { id: 'fujiwara', name: '奥州' },
    { id: 'gaya', name: '伽倻' },
    { id: 'aki', name: '安艺' },
    { id: 'echigo', name: '越后' },
    { id: 'kai', name: '甲斐' },
    { id: 'owari', name: '尾张' },
    { id: 'chosokabe', name: '土佐' },
    { id: 'hashiba', name: '丰臣' },
    { id: 'honda', name: '下野' },
    { id: 'aizu', name: '会津' },

    { id: 'xingliao', name: '兴辽' },

    { id: 'gongsun_d', name: '辽东' },
    { id: 'donghu', name: '东胡' },
    { id: 'luoyue', name: '骆越' },
    { id: 'ba', name: '巴国' },
    { id: 'hezhou', name: '合州' },

    // ── 2026-05-26 新增：用户核对追加势力 ──
    { id: 'qifu_d', name: '乞伏' },
     // 高原栗 - 西秦(乞伏氏/陇西鲜卑)
    { id: 'tuyu_d', name: '吐谷浑' },   // 青海碧 - 吐谷浑
    { id: 'linyi', name: '林邑' },
    // 紫檀 - 谯国桓氏(桓温/桓玄)
    // 草原灰绿 - 丁零翟魏(翟氏)       // 辽东褐 - 段部鲜卑(段氏)
    { id: 'pingyuan', name: '高唐' },    // 暗金黄 - 平原郡治(平原)；旗号取郡内高唐县避与据点名重
    { id: 'yao', name: '尧帝' },         // 尧都平阳

    // ── 2026-05-26 新增：两晋核对追加势力 ──
    { id: 'murong', name: '慕容' },
    { id: 'erzhu', name: '尔朱' },      // 铁锈红 - 契胡尔朱氏(秀容川/北魏权臣)


    { id: 'wey', name: '卫国' },          // 卫红 - 卫国(濮阳)
    { id: 'pizhou', name: '邳州' },       // 邳州(下邳)；陷阵营高顺
    // ── 2026-05-26 新增：汉朝补全半成品势力 ──
    { id: 'tongma', name: '铜马' },
    { id: 'tongzhou', name: '同州' },
    { id: 'dongxian', name: '海西' },
    { id: 'baibo', name: '黄巾' },
    { id: 'cheshihou', name: '车师' },

    // ── 2026-05-26 新增：汉朝核对追加势力 ──
    { id: 'zhai_han', name: '翟国' },
    { id: 'yin', name: '殷国' },
    // ── 2026-06-16 新增：河间郡治乐成（§4.3；先登死士@界桥）──
    { id: 'hejian', name: '莫' },
    { id: 'qu_d', name: '麴氏' },                 // 麴义·先登死士@界桥
    { id: 'liu', name: '九江' },
      // 陶褐 - 英布/九江王(六县)
    { id: 'ouyue', name: '瓯越' },

    // ── 2026-05-26 新增：三国核对追加势力 ──
    // ── 2026-06-19 改：襄阳·襄州州名旗号（§4.1-5）──
    { id: 'xiangzhou', name: '襄州' },
    // ── 2026-06-19 新增：枣阳@枣阳（孟珙·忠顺军；《宋史·孟珙传》；旗号舂陵≠枣阳）──
    { id: 'zaoyang_d', name: '枣阳' },
    // ── 2026-06-16 改：符离·宿州治（§4.7；旗号「徐」让位下邳徐国）──
    { id: 'suzhou_d', name: '宿州' },
    // ── 2026-06-11：狄道（古临洮/陇西；旗号狄，据点临洮）──
    { id: 'didao', name: '狄道' },
    // ── 2026-06-11 新增：西凉（马腾/韩遂军阀/金城皋兰）──
    { id: 'lanzhou', name: '兰州' },
    // ── 2026-06-11 精锐部队缺口批次 ──
    { id: 'gaoqi_d', name: '北齐' },           // 旗号高齐@渤海蓨城（高欢故里）
    // ── 2026-06-11 新增：营州@朝阳（和龙/黄龙）──
    { id: 'yingzhou_ying_d', name: '营州' },
    { id: 'wuzhou_d', name: '武周' },
    { id: 'zhuozhou', name: '涿州' },
    { id: 'tujia_d', name: '土家族' },          // 旗号土家@石柱
    { id: 'zhuang_d', name: '壮族' },           // 旗号壮@田阳
    { id: 'buyi_d', name: '布依族' },
    { id: 'hani_d', name: '哈尼' },
    { id: 'basha_d', name: '巴沙' },
    { id: 'xibo_d', name: '锡伯' },
    { id: 'nantang_d', name: '南唐' },
    // ── 2026-06-12 新增：无为（濡须水畔无为州）；北府兵改挂仲@寿春 ──
    { id: 'wuwu_d', name: '无为' },
    { id: 'shizhao_d', name: '石赵' },          // 后赵@襄国
    { id: 'ranwei_d', name: '冉魏' },
    { id: 'zu_d', name: '祖氏' },

    { id: 'aisin_d', name: '爱新觉罗' },        // 旗号爱新；≠大清(manzhou_d)
    { id: 'sunwu_d', name: '孙吴' },

    // ── 2026-05-26 新增：隋朝核对追加势力 ──
    { id: 'wazhai', name: '瓦岗' },        // 深红 - 瓦岗军/李密魏政权(洛口仓)
    // 番茄红 - 窦建德夏政权(乐寿)     // 铁灰 - 刘武周定杨政权(马邑)
    { id: 'liangshidu', name: '梁朔' },
    // 深紫 - 宇文化及许政权(魏县/江都)           // 道奇蓝 - 罗艺燕政权(渔阳)
    { id: 'linshihong', name: '楚南' },    // 暗紫 - 林士弘楚政权(豫章)
    { id: 'lu', name: '庐州' },
       // 秘鲁黄 - 杜伏威楚政权(历阳)
    { id: 'kumo', name: '奚族' },
    { id: 'xijue', name: '十箭' },
    { id: 'xian_d', name: '冼氏' },          // 绯红 - 冼夫人高凉冼氏(高凉)
    { id: 'xiqin', name: '西秦' },         // 胡萝卜橙 - 薛举西秦政权(折墌)
    { id: 'xueyantuo', name: '薛延陀' },
    { id: 'tujishi', name: '突骑施' },     // 巧克力色 - 突骑施汗国(碎叶川)
    { id: 'nanzhao', name: '南诏' },        // 南诏深红 - 南诏国(蒙舍城)
    // 西域沙金 - 高昌国(高昌壁)
    // 暗灰 - 黠戛斯(坚昆都督府)
    { id: 'xiaobolu', name: '勃律' },
     // 暗板岩灰 - 小勃律(孽多城)
    // 火砖红 - 李希烈淮西叛镇(蔡州)
    // 深红 - 魏博节度使田氏(魏州)
    { id: 'qiufu', name: '裘甫' },
    // ── 2026-05-26 五代十国势力 ──
    { id: 'dongdan', name: '东丹' },
    { id: 'dali', name: '大理' },
           // 紫霞紫 - 大理国(段思平 羊苴咩)
    { id: 'luodian', name: '罗甸' },        // 土褐 - 罗甸国(西南蛮 大方城)
    // ── 2026-05-26 北宋辽金势力 ──
    { id: 'gusiluo', name: '唃厮啰' },      // 吐蕃金 - 唃厮啰政权(青唐城)
    { id: 'goryeo', name: '高丽' },            // 王氏高丽（开城）
    // 义军红 - 王则安阳政权(贝州)
    { id: 'nongzhigao', name: '大南' },
        // 南疆橙 - 侬智高南天国(邕州)
    { id: 'fangla', name: '圣公' },            // 明教紫 - 方腊起义(清溪)
    // ── 2026-05-26 北宋辽金势力 v2 ──
    { id: 'zhongxiang', name: '钟楚' },      // 洞庭绿 - 钟相杨幺大圣天王政权(鼎州)
    { id: 'yang_aner', name: '天顺' },          // 红袄赤 - 杨安儿天顺政权(登州)
    { id: 'jinan', name: '济南' },
    // 草原金 - 德寿身圣政权(信州)
    { id: 'liwang', name: '河间' },

    // ── 2026-05-26 元朝蒙古势力 ──
    { id: 'huarazim', name: '花剌子模' },        // 中亚金 - 花剌子模帝国(撒马尔干)
    // 暗影黑 - 木剌夷暗杀教团(阿剌模忒堡)
    { id: 'pagan', name: '缅国' },
    { id: 'champa', name: '占婆' },
    { id: 'dongxia', name: '东夏' },
    { id: 'chagatai', name: '察合台' },
           // 汗国深绿 - 察合台汗国(阿力麻里)
    { id: 'ogodei', name: '窝阔台' },
    // 波斯靛紫 - 伊儿汗国(玛拉固阿)
    { id: 'kereyid', name: '克烈' },             // 草原赭褐 - 克烈部(土兀剌河黑林)
    { id: 'naiman', name: '乃蛮' },              // 文明深紫 - 乃蛮部(科布多)
    { id: 'tatar', name: '塔塔尔' },
    { id: 'merkit', name: '蔑儿乞' },
    { id: 'ongut', name: '汪古' },
    // 暗板岩灰 - 斡亦剌部(谦河之源/叶尼塞河上游)
    // 大同上褐 - 孛罗帖木儿集团(大同)
    { id: 'xushouhui', name: '天完' },              // 徐寿辉@蕲春·红巾军（元末）
    { id: 'zhangshicheng', name: '大周' },
    { id: 'luoping', name: '罗平' },
    { id: 'daxing', name: '大兴' },
    { id: 'chendiaoyan', name: '陈吊' },

    // ── 2026-05-26 明朝势力 ──
    // 第二类：元末群雄割据政权
    { id: 'fang_guozhen', name: '浙方' },
    // 第三类：明代中后期农民起义与割据政权
    { id: 'dixiang', name: '帝乡' },
    { id: 'dengmaoqi', name: '铲平' },
    { id: 'yezongliu', name: '太平' },
    // 第四类：明朝藩王叛乱
    // 藩王蓝 - 朱高煦汉王叛乱(乐安)
    // 第五类：边疆民族政权
    { id: 'dada_ming', name: '鞑靼' },              // 草原暗灰 - 明代蒙古鞑靼部(河套)
    { id: 'oirat_ming', name: '卫拉特' },             // 西蒙古碳灰 - 明代瓦剌部(科布多)，旗号与草原 wala 区分
    // 塞外土褐 - 乌梁海(唐努山)
    { id: 'jianzhou_nvzhen', name: '建州' },         // 建州深绿 - 建州女真(苏子河)
    { id: 'haixi_nvzhen', name: '海西' },
            // 海西绿 - 海西女真扈伦四部(乌拉)
    { id: 'yeren_nvzhen', name: '东海' },
    { id: 'jilimi', name: '吉里' },                // 暗苔绿 - 吉里迷/尼夫赫人(库页岛/黑龙江口)
    { id: 'hezhe', name: '赫哲' },                   // 河口青 - 赫哲/那乃人(黑龙江下游/库页岛)
    { id: 'luchuan', name: '麓川' },
    { id: 'chijin', name: '赤斤' },
    { id: 'guiyi', name: '归义' },
    { id: 'anding_wei', name: '安定' },
    // 第六类：周边国家政权
    // 交阯深紫 - 安南胡朝/黎氏
    { id: 'joseon', name: '朝鲜' },                  // 朝鲜王朝李朝都城汉城；尚白见 HistoricalFactionColors
    { id: 'siam', name: '暹罗' },                    // 暹罗橙 - 阿瑜陀耶王朝
    { id: 'chenla', name: '真腊' },                  // 吴哥暗紫 - 真腊吴哥王朝
    // 巨港靛紫 - 三佛齐/室利佛逝

    // ── 2026-05-26 明清之际势力（28个）──
    // 第一类：明末农民军政权
    { id: 'dashun', name: '大顺' },
    { id: 'daxi_ming', name: '大西' },                 // 深紫 - 张献忠大西政权(成都)(与北宋daxi区分)
    // ── 2026-06-11 新增：成汉（李特/鹿头关）、水西（安氏土司/毕节）──
    { id: 'chenghan', name: '成汉' },
    { id: 'shuixi', name: '水西' },

    // 第二类：南明五政权
    { id: 'hongguang', name: '弘光' },
    { id: 'longwu', name: '隆武' },
    { id: 'lujian', name: '鲁监' },

    // 第三类：蒙古诸部
    { id: 'chahar', name: '察哈' },
    // 土褐 - 喀尔喀蒙古(额尔德尼昭)
    { id: 'dzungar', name: '准噶尔' },            // 暗灰 - 准噶尔汗国(伊犁)

    // 第四类：西北/青藏
    { id: 'khoshut', name: '和硕特' },
    { id: 'yarkand', name: '叶尔羌' },             // 铜褐 - 叶尔羌汗国(叶尔羌)
    { id: 'khoja', name: '和卓' },
    { id: 'gaxa', name: '噶厦' },

    // 第五类：西南土司
    { id: 'jinchuan_g', name: '金川' },
    { id: 'jinchuan_x', name: '小川' },
    // 沙褐 - 班禅系统(日喀则)

    // 第六类：三藩之乱
    { id: 'geng', name: '靖南' },

    // 第七类：清代起义
    { id: 'shuntian', name: '顺天' },
    { id: 'miaomin', name: '苗民' },

    // 第八类：亚洲外国
    { id: 'gurkha', name: '廓喀' },              // 土褐 - 廓尔喀/尼泊尔(加德满都)
    // ── 2026-06-12 新增：夏顿（布鲁克巴/竹巴噶举统一不丹）──
    { id: 'xiadun', name: '夏顿' },
    { id: 'kazakh', name: '哈萨' },
    { id: 'kokand', name: '霍罕' },                 // 暗紫 - 霍罕/浩罕汗国
    { id: 'badakhshan', name: '达克' },

    // ── 2026-05-26 晚清／近代势力（21个）──
    // 第一类：农民革命政权
    { id: 'taiping', name: '太平天国' },
    { id: 'dacheng', name: '大成' },
    { id: 'han_dadian', name: '大捻' },             // 李永和蓝朝鼎捻军；据点待录（兴势已改蜀汉）

    // 第二类：少数民族起义
    { id: 'pingnan', name: '平南' },
                // 深绿 - 杜文秀平南国(大理)
    { id: 'qianhui', name: '回军' },
    { id: 'miao_qing', name: '苗军' },

    // 第三类：新疆同治割据
    { id: 'tuoming', name: '清真' },                // 深绿 - 妥明清真王(乌鲁木齐)
    // 靛紫 - 迈孜木杂特/伊犁苏丹(伊犁)
    // 铜褐 - 金相印(喀什噶尔/回庄)

    // 第四类：蒙古/土司/地方武装
    // 第五类：外国
    // ── 2026-06-11 改绑：哲德(Jand/毡的异译) @ 毡的，非清代哲德莎尔 ──
    { id: 'yettishar', name: '哲德' },

    // ── 2026-05-26 新增：大金、大元 ──
    { id: 'dajin', name: '大金' },
    { id: 'yizhou', name: '懿州' },
    { id: 'yuan_d', name: '大元' },

    // ── 2026-05-26 新增：肃慎系势力（挹娄、勿吉、靺鞨）──
    { id: 'yilou', name: '挹娄' },
    { id: 'wuji', name: '勿吉' },
    { id: 'mohe', name: '靺鞨' },

    // ── 2026-05-26 新增：室韦（隋唐时期东北亚部落联盟）──
    { id: 'shiwei', name: '室韦' },
              // 草原青 - 室韦(隋唐/蒙兀室韦/额尔古纳)
    // 深草绿 - 蒙兀室韦(大蒙古国前身/嘎仙洞/孛儿只斤氏)

    // ── 2026-05-26 新增：濊貊、毛文龙、满洲贵族世家 ──
    { id: 'huimo', name: '濊貊' },
    { id: 'mao_wenlong', name: '毛文龙' },       // 明黄 - 毛文龙(明末/东江镇/皮岛)
    // 紫檀 - 赫舍里氏
    // 赤红 - 瓜尔佳氏(苏完部/鳌拜/双阳)

// ── 2026-05-26 新增：西域/中亚势力（25个）──
{ id: 'kala', name: '喀喇汗王朝' },
    // ── 2026-06-17 新增：喀喇契丹（西辽·虎思/碎叶故地）──
    { id: 'xiliao', name: '西辽' },
    { id: 'jiazini', name: '伽色尼' },      // 伽色尼王朝(哥疾宁/马哈茂德), Ghaznavid
    { id: 'gaofu', name: '高附' },          // 喀布尔沙希王朝(高附城/阇耶波罗), Kabul Shahi
    { id: 'fanyanna', name: '梵衍那' },      // 梵衍那国(巴米扬/兴都库什), Bamiyan
// 土褐 - 吐火罗(员渠城/焉耆盆地)
{ id: 'sogdian', name: '粟特' },
        // 巧克力色 - 粟特商团(阿弗拉西阿卜/撒马尔罕)
// 暗苔绿 - 塞种/斯基泰人(特克斯河流域/昭苏石人)
{ id: 'kangju', name: '康居' },         // 秘鲁黄 - 康居(卑阗城/锡尔河流域)
{ id: 'geluolu', name: '葛逻禄' },      // 高原栗 - 葛逻禄(怛罗斯/中亚名城)
{ id: 'yuchi', name: '尉迟' },          // 于阗紫 - 尉迟氏/伏阇氏(于阗王族/丹丹乌里克)
// 西域沙金 - 麴氏(高昌汉人王族/柏孜克里克)
{ id: 'an', name: '安氏' },
{ id: 'shi_clan', name: '石氏' },

// ── 2026-05-26 新增：漠北草原势力 ──
    { id: 'gaoche', name: '高车' },
               // 驼褐 - 高车(敕勒/丁零/浚稽山)
    { id: 'da_yuan', name: '北元' },

    // ── 2026-05-26 新增：漠北草原部落/氏族势力 ──
    // 贝加尔湖绿 - 丁零(贝加尔湖以南/高车前身)
    { id: 'huyan', name: '呼衍' },
                // 草原灰褐 - 呼衍氏(匈奴四大氏族/河南地)
    { id: 'yujiulu', name: '郁久闾' },            // 柔然紫 - 郁久闾氏(柔然王族/弱水畔)
    { id: 'ashina', name: '阿史那' },
              // 草原绿灰 - 阿史那氏
    { id: 'ashide', name: '阿史德' },              // 草原绿 - 阿史德氏(突厥别部)
    { id: 'kiyad', name: '乞颜' },
    { id: 'borjigin', name: '孛儿只斤' },
          // 黄金家族褐 - 孛儿只斤氏(蒙古黄金家族/斡难河源)
    // 部族棕 - 泰赤乌部(蒙古部族/斡难河中游)
    { id: 'jalair', name: '札剌亦儿' },            // 克鲁伦绿 - 札剌亦儿部(蒙古部族/克鲁伦河)
    { id: 'hongirad', name: '弘吉剌' },            // 额尔古纳紫 - 弘吉剌部(蒙古部族/额尔古纳河)
    { id: 'choros', name: '绰罗斯' },              // 瓦剌蓝 - 绰罗斯氏(瓦剌王族/准噶尔盆地)
    { id: 'weiming', name: '嵬名' },
    // ── 2026-06-11 新增：野利（西夏权臣/克夷门）──
    { id: 'yeli', name: '野利' },

    // ── 2026-05-26 新增：青藏高原势力（24个）──
    // 第一类：高原帝国与割据强权
    { id: 'guge', name: '古格' },
    { id: 'ladakh', name: '玛域' },
    { id: 'tsangpa', name: '藏巴汗' },
    { id: 'ganden', name: '甘丹' },                // 金色 - 甘丹颇章(哲蚌寺/五世达赖政权)

    // 第二类：雪域土著与古老强族
    { id: 'bailan', name: '白兰' },
    { id: 'supi', name: '苏毗' },
    { id: 'monpa', name: '门巴' },
    { id: 'lopi', name: '珞巴' },

    // 第三类：世袭门阀与政教寡头
    { id: 'spurgyal', name: '悉补野' },
    { id: 'khon', name: '萨迦昆' },
                  // 靛蓝 - 昆(萨迦寺/萨迦政权统治者)
    { id: 'lang_clan', name: '帕竹朗' },             // 暗紫 - 朗(乃东泽当/帕竹政权)
    // 秘鲁黄 - 仁蚌巴(仁蚌宗/后藏门阀)
    // 暗灰 - 扎氏(夏鲁寺/夏鲁万户)
    { id: 'karmapa', name: '噶玛' },

    // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力 ──
    // ── 第一类：云贵高原与中南半岛的丛林帝国 ──
    { id: 'ava', name: '掸族' },
    { id: 'dongxu', name: '东吁' },
    { id: 'baiman', name: '白蛮' },
                 // 苍山米白 - 白蛮/白族先民(苍山洱海)
                  // 乌蒙碳黑 - 乌蛮/彝族先民(乌蒙山)
    { id: 'kunming_yi', name: '昆明夷' },           // 高原栗 - 昆明夷(滇池以西/楚雄)
    { id: 'miao', name: '苗族' },
    { id: 'pyu', name: '骠族' },                      // 骠国暗灰 - 骠人(室利差罗/缅甸先民)
    { id: 'mon', name: '孟族' },                      // 孟族暗紫 - 孟族(直通城/中南半岛最早佛国)
    // ── 第三类：世袭土司与门阀 ──
    { id: 'yang_bozhou', name: '播州' },             // 海龙棕 - 播州杨氏(海龙屯/贵州第一土司)
    { id: 'tian_sizhou', name: '田氏' },
    { id: 'mu_lijiang', name: '木氏' },
               // 丽江明黄 - 丽江木氏(木府)
    { id: 'bayinnaung', name: '莽应龙' },
    // 大肚秘鲁黄 - 大肚王国(台湾原住民联盟)
    { id: 'ming_zheng', name: '明郑' },             // 东宁深蓝 - 明郑/东宁王国(安平/热兰遮城)
    // ── 第五类：百越余脉与南岛语系 ──
    { id: 'xiou', name: '西瓯' },
    // 大瑶山林越绿 - 瑶族(大瑶山)
    { id: 'jing', name: '京族' },
    { id: 'muong', name: '芒族' },
    { id: 'paiwan', name: '排湾' },
    // ── 第六类：岭南土司、安南权臣与海商门阀 ──
    { id: 'trinh', name: '郑主' },                  // 清化靛蓝 - 郑主(西都城/越南北方)
    { id: 'nguyen_guangnan', name: '广南' },
    // 高平暗灰 - 莫氏/莫朝(高平)

    // ── 2026-05-26 Phase 3h：西南夷/蛮族/家族门阀/海商 ──
    { id: 'cong', name: '賨族' },
    // 瘗棺苔绿 - 僰人(僰王山/珙县悬棺)
    { id: 'langzhou', name: '阆州' },                  // 阆州(隆城)；巴西劲卒张飞
    { id: 'zhe_d', name: '折氏' },
    { id: 'shanyue', name: '山越' },
    { id: 'she_ethnic', name: '畲族' },                 // 敕木暗紫 - 畲族(敕木山/闽浙交界)
    { id: 'pu', name: '蒲氏' },

    // ── 2026-05-26 Phase 3i：新罗门阀/巴人后裔 ──
    { id: 'tu', name: '土族' },
    // ── 2026-05-26 新增：西域三十六国独立势力 ──
    // 天山秋褐 - 且弥/迪化(清)
    { id: 'weili', name: '尉犁' },
    { id: 'pishan', name: '皮山' },                 // 和田沙色 - 皮山国(丝路南道/今皮山)
    { id: 'tuerhute', name: '土尔扈特' },
    // 昆仑橙褐 - 索/昆仑塞

    // ── 自动补充：cities_v2 使用但 factions.ts 缺失的势力 ──
    { id: 'bandun', name: '板楯' },                      // 板楯蛮(巴人分支/鱼涪津/岷江渡口)
    { id: 'seljuq', name: '塞尔柱' },      // 桑贾尔·木鹿
    { id: 'yisifahan', name: '伊斯法罕' },  // 阿尔普·阿尔斯兰·曼齐克特
    // 阮氏(安南权阀/占城/广南)
    // 党项部族(拓跋氏/玛曲/黄河第一弯)
    // 雅隆部落(吐蕃前身/雅砻河谷/悉补野氏)
    { id: 'cen_d', name: '岑氏' },
                        // 岑氏(桂西土司/岑城/镇安)

    // ── 2026-05-27 新增：汪(黟县) ──
    { id: 'wang_s', name: '汪氏' },                        // 汪氏(黟县/新安汪氏/徽州望族)

    // ── 2026-05-27 新增：向(来凤)、覃(慈利)、冉(秀山)、储(潜山) ──
    { id: 'xiang_d', name: '向氏' },                        // 向氏(来凤/武陵山区)
    { id: 'tan_d', name: '覃氏' },                          // 覃氏(慈利/澧水流域)
    { id: 'ran_d', name: '冉氏' },                          // 冉氏(秀山/酉水流域)
    { id: 'chu_d', name: '储氏' },                          // 储氏(潜山/皖西南)

    // ── 2026-05-27 新增：青衣(雅州)、五溪(八面山)、姑蔑(衢州) ──
    { id: 'qingyi', name: '青衣' },
                       // 青衣羌(青衣江流域/雅州/川西古羌)
    { id: 'wuxi', name: '五溪' },                         // 五溪蛮(武陵五溪/八面山/湘西)
    { id: 'gumie', name: '姑蔑' },                        // 姑蔑(古越方国/衢州/浙西)

    // ── 2026-05-27 新增：生苗(甲定) ──
    { id: 'shengmiao', name: '生苗' },                    // 生苗(黔东南/甲定/苗岭)

    // ── 2026-05-27 新增：且兰(且兰城) ──
    // 且兰(牂牁古国/黔中/西南夷)

    // ── 2026-05-27 新增：白马、蒯、庸、申、叟 ──
    { id: 'kuai', name: '蒯氏' },                            // 蒯氏(房陵/荆襄名族)
    { id: 'yong', name: '庸国' },                            // 庸国(上庸/鄂西北古国)
    { id: 'shen', name: '申国' },
                            // 申国(金州/南阳申国)
    { id: 'sou', name: '叟族' },                             // 叟人(乐山/蜀南古羌)

    // ── 2026-05-27 新增：烧当 ──
    { id: 'shaodang', name: '烧当' },                      // 烧当羌(玛曲/河湟西羌部落)

    // ── 2026-05-27 新增：靖江、盘瑶、马楚、排瑶、士、蒋 ──
    { id: 'jingjiang', name: '靖江' },
    { id: 'xinjiang', name: '静江' },                      // 靖江王(桂林/明藩王)
    { id: 'panyao', name: '盘瑶' },                         // 盘瑶(贺州/岭南瑶族)
    // 士氏(广信/交趾士燮)
    { id: 'jiang_s', name: '蒋氏' },                          // 蒋氏(永州/湘南),

    { id: 'li_s', name: '里族' },                              // 里(合浦/北部湾); 古籍里、俚、悝通，与 liren(俚)异字
    { id: 'leizhou', name: '雷州' },                           // 雷州(海康/湛江)

    // ── 2026-05-28 新增：工布(工布/西藏工布藏族) ──
    // 工布(林芝/西藏工布藏族城邦),

    // ── 2026-05-28 新增：果洛(青海)、土谢图(外蒙)、土默特(内蒙) ──
    { id: 'golog', name: '果洛' },                             // 果洛(青海果洛藏区/花石峡),
    { id: 'tushetu', name: '土谢图' },                         // 土谢图汗部(外蒙古/库伦/喀尔喀蒙古),
    { id: 'tumed', name: '土默特' },                           // 土默特部(归化城/呼和浩特/蒙古右翼),

    // ── 2026-05-28 新增：奢氏(永宁/四川叙永彝族土司) ──
    { id: 'she', name: '奢氏' },                                  // 奢氏(永宁宣抚司/今四川叙永/彝族土司),

    // ── 2026-05-28 新增：僚(江阳/四川泸州僚人) ──
    { id: 'liao', name: '僚族' },                                  // 僚(江阳郡/今四川泸州/西南僚人),

    // ── 2026-05-28 新增：普氏(矩州/贵州贵阳彝族土司) ──
    // 普氏(矩州/今贵州贵阳/普里部彝族土司),

    { id: 'nong2', name: '侬族' },

    // ── 2026-05-27 重制：药罗葛(娑陵/回纥汗族) ──
    { id: 'yaoluoge', name: '药罗葛' },                   // 药罗葛氏(回纥汗族/娑陵/蒙古中部)

    // ── 2026-05-28 新增：南部(根城/日本陆奥)、萨曼(阿母城/中亚)、西域四政权 ──
    { id: 'nanbu', name: '陆奥' },                         // 陆奥国(南部氏/根城), Mutsu
    { id: 'saman', name: '萨曼' },                         // 萨曼王朝(中亚/阿母城), Samanid Empire
    { id: 'hepan', name: '喝槃陀' },                       // 喝槃陀(西域/喝槃陀城), Khevand/Koband
    { id: 'humi', name: '瓦罕' },
                          // 护密(西域/护密城), Wakhan
    // 特勤(西域/活国城), Tegin

    // ── 2026-05-28 新增：马蒙(达尔甘城/中亚)、古兹根(法里亚布城/中亚)、傣(勐泐城/云南)、泰沅(清坎城/泰国)、帕銮(双河城/泰国)、罗斛(呵叻城/泰国) ──
    { id: 'mamon', name: '马蒙' },                         // 马蒙(中亚/达尔甘城), Ma'munid
    { id: 'guzgan', name: '古兹根' },                      // 古兹根(中亚/法里亚布城), Guzgan
    { id: 'dai', name: '傣族' },                             // 傣(云南/勐泐城), Dai
    { id: 'taiyuan', name: '泰沅' },                       // 泰沅(泰国/清坎城), Tai Yuan
    { id: 'luohu', name: '罗斛' },                         // 罗斛(泰国/呵叻城), Lavo

    // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
    // 黑水靺鞨(黑龙江/伯力), Heishui Mohe
    { id: 'nanai', name: '那乃' },                         // 那乃(黑龙江/瓦伦), Nanai
    { id: 'feiyaka', name: '费雅喀' },                     // 费雅喀(黑龙江/奇集), Feiyaka
    // 尼夫赫(黑龙江/努托), Nivkh

    { id: 'anushidgin', name: '伊勒巴斯' },                 // 伊勒巴斯(希瓦), Ilbars/Anush Tegin
    { id: 'nanjie', name: '南杰' },                         // 南杰(日土宗), Nanjie

    // ── 2026-05-28 新增：甘丹颇章(扎敦宗)、爱新觉罗(墨尔根城)、广南国(洞海城) ──
    { id: 'gandenpozhang', name: '甘丹颇章' },                // 甘丹颇章(扎敦宗/旧仲巴), Ganden Phodrang
    { id: 'dawoer', name: '达斡尔' },                         // 达斡尔(莫尔根), Daur
                    // 广南国(洞海城), Guangnan

    // ── 2026-05-28 新增：图蒙肯(拜达里克牙帐)、俚(珠崖/海南) ──
    { id: 'tumengken', name: '图蒙肯' },                     // 图蒙肯(拜达里克牙帐), Tumengken
    { id: 'liren', name: '俚族' },                          // 俚(珠崖/海南岛),

    // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(唐努) ──
    { id: 'gling', name: '岭氏' },                              // 岭(结古宗/玉树/家族), Gling
    { id: 'khyungpo', name: '琼波' },                         // 琼波(丁青宗/康区/家族), Khyungpo
    { id: 'suolun', name: '索伦' },                           // 索伦(卜奎), Solon
    { id: 'tuva', name: '图瓦' },                             // 图瓦(唐努), Tuvan/Tuva

    { id: 'osumi', name: '大隅' },                            // 大隅国(赤尾木城/九州), Osumi
    { id: 'anmei', name: '奄美' },

    // ── 2026-05-28 新增：康区藏族土司/部落势力 ──
    { id: 'dalung', name: '达隆' },                            // 达隆噶举/噶斯家族(类乌齐/康区大本营), Taklung
    { id: 'gar_kham', name: '德司' },                                // 德格(德格王国/土司), Kingdom of Derge
    { id: 'kongsa', name: '孔萨' },                            // 孔萨(甘孜/康区/家族), Kongsa
    { id: 'mingzheng', name: '明正' },                          // 明正(打箭炉/康区), Mingzheng
    // 芒康(芒康/康区), Markam

    // ── 2026-05-28 新增：波密(博窝/西藏) ──
    // 波密(博窝/西藏), Bomi

    // ── 2026-05-28 新增：达擦(八宿宗/达察呼图克图/家族) ──
    { id: 'daca', name: '达擦' },                                 // 达察呼图克图(Tatsak)/驻锡八宿, Dacha Hutuktu

    // ── 2026-05-28 新增：景东(银生城/云南/政权) ──
    { id: 'jingdong', name: '景东' },                              // 景东(银生城/云南/政权), Jingdong

    // ── 2026-05-28 新增：霍尔(索宗/那曲/家族) ──
    { id: 'hor', name: '霍尔' },                                   // 霍尔(索宗/那曲/家族), Hor

    // ── 2026-05-28 新增：董(囊谦宗/玉树/家族) ──
    { id: 'dong', name: '隆庆' },                                     // 隆庆(囊谦宗/玉树/家族), Dong

    // ── 2026-05-28 新增：白狼(巴塘宗/康区/家族) ──
    { id: 'bailang', name: '白狼' },
                                // 白狼(巴塘宗/康区/家族), Bailang

    // ── 2026-05-28 新增：后突(黑沙城/阴山北麓) ──
    // 后突(黑沙城/阴山北麓), Later Turkic,
    { id: 'duolu', name: '咄陆' },
    { id: 'zhuxie', name: '朱邪' },
    { id: 'hunxie', name: '浑邪' },
    { id: 'fu', name: '苻秦' },
    { id: 'tiemuer', name: '帖木儿' },
    { id: 'kawusi', name: '卡乌斯' },
    { id: 'keerkezi', name: '柯尔克孜' },
    { id: 'yiduhu', name: '亦都护' },
    { id: 'yangshao', name: '仰韶' },
    { id: 'yel', name: '耶律' },
    { id: 'guzhu', name: '孤竹' },
    { id: 'yizhi', name: '一支' },
    { id: 'zhuqian', name: '筑前' },
    { id: 'jibei2', name: '备中' },
    { id: 'jinchuan', name: '骏河' },
    { id: 'xuan', name: '宣府' },
    { id: 'yangshe', name: '羊舌' },
    { id: 'sima_d', name: '司马氏' },   // 河内郡望@获嘉
    { id: 'liguo', name: '黎国' },
    { id: 'kang', name: '长泽' },
    { id: 'woye', name: '沃野' },
    { id: 'shuofang', name: '朔方' },
    { id: 'lushui', name: '卢水' },
    { id: 'yingli', name: '应理' },
    { id: 'guangwu', name: '广武' },
    { id: 'huizhou', name: '会州' },
    { id: 'yiwu', name: '伊吾' },
    { id: 'pulei', name: '蒲类' },
    { id: 'duerbote', name: '杜尔伯特' },
    { id: 'zhasaketu', name: '扎萨克图' },
    { id: 'kaerka', name: '喀尔喀' },
    { id: 'huihu', name: '回鹘' },
    { id: 'wuzhumuqin', name: '乌珠穆沁' },
    { id: 'xingan', name: '兴安' },
    { id: 'zhadalan', name: '扎答兰' },
    { id: 'zhuerqi', name: '主儿乞' },
    { id: 'chechen', name: '车臣' },
    { id: 'panjun', name: '叛军' },
    { id: 'changshan', name: '常山' },          // 倒马关·常山郡
    { id: 'linhu', name: '林胡' },              // 偏头关·林胡族
    { id: 'lingqiu', name: '灵丘' },            // 平型关·灵丘县
    { id: 'linyu', name: '临榆' },              // 山海关·临榆
    { id: 'loufan', name: '楼烦' },             // 宁武关·楼烦族
    { id: 'xianyu', name: '鲜虞' },             // 井陉关·鲜虞国
    { id: 'yi', name: '易州' },                 // 紫荆关·易州
    { id: 'you', name: '幽州' },                // 居庸关·幽州
    { id: 'heng1', name: '元岳' },              // 雁门关·元岳（旗=恒）
    { id: 'pisha', name: '毗沙' },
   
    { id: 'yumi', name: '扜弥' },
    { id: 'keliya', name: '克里雅' },              // 阿什库尔·昆仑克里雅山口
    { id: 'xiye', name: '西夜' },
    { id: 'faqiang', name: '发羌' },
    { id: 'jiantang', name: '建塘' },
    { id: 'gongbu', name: '工布' },
    { id: 'niang', name: '觉木宗' },
    { id: 'ganzhou', name: '甘州' },
    { id: 'galangdiba', name: '波密' },
    { id: 'ali', name: '阿里' },
    { id: 'pazhu', name: '帕竹' },
    { id: 'qiong', name: '邛都' },
    { id: 'zhuoshi', name: '卓氏' },
    { id: 'pengshi', name: '彭氏' },
    { id: 'qianzhong', name: '沅州' },
    { id: 'cuanshi', name: '爨族' },
    { id: 'dianguo', name: '滇国' },       // 滇国（拓东城）；旗号「滇」
    { id: 'xinggu', name: '兴古' },
    { id: 'zangke', name: '牂牁' },
    { id: 'guangxin', name: '广信' },
    { id: 'kejia', name: '客家' },
    { id: 'ouyang', name: '欧阳' },
    { id: 'ningkou', name: '宁寇' },
    { id: 'hongzhou', name: '洪州' },
    { id: 'danyang', name: '宣州' },       // 宣州(芜湖/鸠兹)
    { id: 'huai', name: '淮州' },
    { id: 'huaiyang', name: '淮阳' },
   // 淮阳郡治宛丘(陈州)
    { id: 'cai', name: '蔡国' },
    { id: 'changshaguo', name: '长沙国' },
    { id: 'shangzhou', name: '商州' },   // 旗号上洛(商邑=商州治；避与商字重)
    { id: 'ying', name: '郢州' },
    { id: 'heng', name: '衡州' },
    { id: 'chen2', name: '郴州' },
    { id: 'shixing', name: '石兴岭' },
    // ── 2026-06-19 新增：韶州@韶关（张镇孙·大庾岭义旅；旗号曲江≠据点名韶关）──
    { id: 'shaozhou', name: '韶州' },
    { id: 'yidou', name: '宜都' },
    { id: 'boren', name: '僰族' },
    { id: 'xin2', name: '信州' },

    { id: 'kui', name: '夔州' },
    { id: 'danluo', name: '耽罗' },
    { id: 'woju', name: '沃沮' },
    { id: 'chen3', name: '月支' },   // 马韩月支国，辰王治所（三国志·魏书·乌丸鲜卑东夷传）
    // ── 2026-06-17 新增：朝鲜八道（镜城·笼耳 / 忠州·国原城 / 罗州·锦城）──
    { id: 'jingcheng_d', name: '镜城' },
    { id: 'chungju_d', name: '忠州' },
    { id: 'naju_d', name: '罗州' },
    { id: 'hui', name: '濊族' },
    { id: 'luzhou', name: '渌州' },
    // ── 2026-06-11 国内城改挂玄菟郡（汉代辖境·高句县渊源）──
    { id: 'xuantu', name: '玄菟' },
    // ── 2026-06-11 珍岛·三别抄（裴仲孙抗蒙）──
    { id: 'sambyeol', name: '沃州' },
    // ── 2026-06-16 顺天·升州牧（高丽成宗；旗号升≠据点名顺天）──
    { id: 'sheng_d', name: '升州' },
    // ── 2026-06-11 徒河·锦州卫·辽东铁骑（旗号锦≠据点名徒河）──
    { id: 'jinzhou', name: '锦州' },
    { id: 'wure', name: '兀惹' },
    { id: 'houliao', name: '后辽' },
    { id: 'dazhen', name: '大真' },
    { id: 'jilin', name: '吉林' },
    { id: 'sunite', name: '苏尼特' },
    { id: 'dayuzi', name: '大玉兹' },
    // 漯河/郾城
    { id: 'weiwuer', name: '维吾尔' },
    { id: 'wensu', name: '温宿' },
    { id: 'keerqin', name: '科尔沁' },

    { id: 'xiangxiong', name: '象雄' },
    { id: 'qingqiang', name: '青羌' },
    { id: 'zhaowu', name: '昭武' },
    { id: 'gaoliang', name: '高凉' },
    { id: 'ruoqiang', name: '婼羌' },


    { id: 'qiemo', name: '且末' },
    { id: 'weitou', name: '尉头' },
    { id: 'dangchang', name: '宕昌' },

    { id: 'mi', name: '糜' },
    { id: 'hai2', name: '瀑池' },
    { id: 'fu2', name: '抚州' },
    { id: 'xinping', name: '新平' },
    { id: 'huan', name: '环州' },
    { id: 'wei2', name: '静塞' },
    { id: 'lingwu', name: '灵武' },
    { id: 'qiepantuo', name: '朅盘陀' },
    // ── 2026-06-11 新增：库页岛民族（鄂罗克/库页）──
    { id: 'eluoke', name: '鄂罗克' },                // 鄂罗克(库页岛东岸/诺托罗), Oroch
    { id: 'kuye', name: '库页' },                    // 库页(库页岛南部/白主), Gilyak/Kuye
    // ── 2026-06-11 新增：阿伊努（北海道）──
    { id: 'ayinu', name: '阿伊努' },                 // 阿伊努(北海道南端/白老), Ainu；旗号「虾夷」
    // ── 2026-06-11 新增：北海（宗谷界城·库页枢纽）──
    { id: 'beihai', name: '北海' },                  // 北海(宗谷海峡界城)
    // ── 2026-06-11 新增：若敖（楚若敖氏/竟陵）、芈氏（楚王室/云梦）──
    { id: 'ruochu', name: '若敖' },
    { id: 'mi_chu', name: '芈氏' },
    // ── 2026-06-11 新增：水达达（黑龙江下游）──
    { id: 'shuidada', name: '水达达' },              // 水达达(锡尔卡河流域/锡尔喀), Shuidada
    // ── 2026-06-11 新增：东平（州郡·黑龙江下游）──
    { id: 'dongping', name: '东平' },                // 东平(乌苏里江下游/尼满), 州名旗号
    // ── 2026-06-11 新增：外兴安岭/外贝加尔边境 ──
    { id: 'maomingan', name: '茂明安' },             // 茂明安(尼布楚), 蒙古部族
    { id: 'aola', name: '敖拉' },                    // 敖拉(雅克萨), 达斡尔敖拉氏
    { id: 'chaoer', name: '绰尔纳' },                // 绰尔纳(格尔必齐), 《尼布楚条约》界河
    { id: 'bulat', name: '布拉特' },                 // 布拉特(石勒喀河), Buryat/布拉特部
    { id: 'buriat', name: '布里亚特' },              // 布里亚特(赤塔), Buryat
    // ── 2026-06-11 新增：锡尔河下游（毡的/养吉干）──
    { id: 'xianhai', name: '咸海' },                  // 咸海(锡尔河入湖口/养吉干), Aral delta
    // ── 2026-06-11 新增：难兜（汉难兜国/唐孽多城）──
    { id: 'nandou', name: '难兜' },
    // ── 2026-06-11 新增：沙伐（沙伐国/尚州）──
    { id: 'sabeol', name: '沙伐' },
    // ── 2026-06-11 新增：日本精锐据点（间距实测合格）──
    { id: 'hojo_d', name: '北条' },   // 小田原城；远征精锐「风魔党」
    { id: 'iga_d', name: '伊贺' },    // 名张·伊贺国东境；远征精锐「伊贺众」,
    // ── 2026-06-16 新增：日本令制国补点（方案A·6城·间距≥50km）──
    { id: 'kaga_d', name: '加贺' },   // 江沼·加贺国府；一向军
    { id: 'date_d', name: '伊达' },   // 仙台·陆前；伊达铁骑
    { id: 'higo_d', name: '肥后' },   // 熊本·菊池党
    { id: 'iyo_d', name: '伊予' },    // 松山·河野水军
    { id: 'otomo_d', name: '大友' },  // 府内·丰后；大友水军
    // ── 2026-06-17 新增：诹访氏@高岛（信浓诹访；间距合规坐标）──
    { id: 'suwa_d', name: '诹访氏' }, // 高岛·诹访氏本据
    { id: 'yanda', name: '嚈哒' },
    { id: 'qincha', name: '钦察' },
    { id: 'anxi', name: '安西' },
    { id: 'konbaung', name: '贡榜' },
    { id: 'qi_d', name: '戚氏' },
    { id: 'wangyan', name: '太行' }, // 王彦八字军@飞狐；旗号取地名太行（禁人名「彦」）
    // ── 2026-06-11 新增：明末精锐（天雄/潼津）──
    { id: 'tianxiong', name: '魏博' },           // 卢象升天雄军@大名（贾庄标志战；旗号魏博≠番号天雄军）
    { id: 'sunqin', name: '潼津' },
    // ── 2026-06-11 中原走廊21座（淮西—豫东—江淮西翼）──
    { id: 'yingzhou_d', name: '颍州' },           // 颍@汝阴
    { id: 'yanchuan_d', name: '郾川' },           // 郾@郾城
    { id: 'huang_d', name: '黄国' },              // 黄@潢川
    { id: 'qiguo_d', name: '杞国' },              // 杞@雍丘
    { id: 'yiyang_d', name: '义阳' },             // 义@武胜关
    { id: 'mengcheng_d', name: '山桑' },          // 山桑@蒙城（汉书沛郡山桑县）
    { id: 'guide_d', name: '归德府' },            // 归德@永城（归德府/州治）
    { id: 'lulin', name: '绿林' },                // 绿林@昆阳（新莽末起义；昆阳之战）
    { id: 'dang_d', name: '砀郡' },               // 砀@虞城（汉砀郡；豫东梁国属县）
    // ── 2026-06-11 新增：濠州（原凤阳朱氏改挂）──
    { id: 'hao_d', name: '濠州' },                // 濠@蚌埠（隋唐濠州治钟离故地）
    // ── 2026-06-11 新增：博州 ──
    { id: 'bozhou_d', name: '博州' },             // 博@聊城（隋唐博州治）
    // ── 2026-06-16 新增：11大名关势力 ──
    { id: 'hongnong_jun', name: '弘农郡' },
    { id: 'zheng', name: '郑国' },
    { id: 'ruo', name: '鄀国' },
    { id: 'rulun', name: '如论氏' },
    { id: 'ruzhou', name: '汝州' },
    { id: 'yun', name: '允戎' },
    { id: 'zhi_state', name: '轵国' },
    { id: 'xiongding', name: '雄定' },
    { id: 'yaozhou', name: '耀州' },
    { id: 'huo', name: '霍国' },
    { id: 'mushi', name: '穆氏' },
    { id: 'lai', name: '莱州' },
    // ── 2026-06-16 新增：4座巴蜀西南名关 ──
    { id: 'lizhou_d', name: '利州' },
    { id: 'xiazhou', name: '峡州' },
    { id: 'zuo_d', name: '笮人' },
    { id: 'huangwang', name: '黄王' },
    { id: 'shenshi', name: '吴兴沈氏' },
    { id: 'chuzhou_d', name: '滁州' },
    { id: 'guizhou', name: '桂州' },
    { id: 'paiyao', name: '排瑶' },
    { id: 'daozhou', name: '道州' },
    { id: 'dayu', name: '大庾' },
    { id: 'yingzhou', name: '英州' },
    { id: 'taira', name: '平氏' },
    { id: 'juyan', name: '居延' },
    { id: 'wuman', name: '乌蛮' },
    { id: 'yehe', name: '叶赫部' },
    { id: 'hujie', name: '呼揭' },
    { id: 'xiutu', name: '休屠王部' },
    { id: 'dongzu', name: '侗族' },
    { id: 'jiliemi', name: '吉列迷' },
    { id: 'wula', name: '乌拉部' },
    { id: 'mengwu', name: '蒙兀' },
    { id: 'pugu', name: '仆骨' },
    { id: 'bayegu', name: '拔野古' },
    { id: 'ketagalan', name: '凯达格兰' },
    { id: 'shanrong', name: '山戎' },
    { id: 'suke', name: '素可泰' },
    { id: 'gaochang', name: '高昌' },
    { id: 'chuyue', name: '处月部' },
    { id: 'baiyang', name: '白羊' },
    { id: 'baidi', name: '白狄' },
    { id: 'wulei', name: '无雷' },
    { id: 'dulan', name: '都兰' },
    { id: 'duomi', name: '多弥' },
    { id: 'wumeng', name: '乌蒙' },
    { id: 'lelang', name: '乐浪' },
    { id: 'huite', name: '辉特' },
    { id: 'zubu', name: '阻卜' },
    { id: 'kangba', name: '康巴' },
    { id: 'nvguo', name: '女国' },
    { id: 'jiashi', name: '迦湿弥罗' },
    { id: 'wuhu', name: '乌护' },
  { id: 'sanada_d', name: '真田氏', culture: 'JAPAN', description: '表里比兴，赤备绝唱。' },
];
