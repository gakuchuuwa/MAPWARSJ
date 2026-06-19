import { HistoricalEvent, EventType, SiegeData, FieldBattleData } from '../types/core';

export class EventParser {
    // Mapping Chinese faction names to IDs
    // If a name is not found here, it will be returned as 'UNKNOWN'
    private static factionMap: { [key: string]: string } = {
        // 统称 (General Terms)
        '中华': 'zhonghua', '天朝': 'tianchao', '朝鲜': 'joseon', '蒙古': 'menggu',
        '羌藏': 'qiangzang', '回回': 'huihui', '满洲': 'manzhou', '越南': 'yuenan', '滇缅': 'dianmian',
        '日本': 'ashikaga', '室町': 'ashikaga', '足利': 'ashikaga', '西域': 'xiyu', '西洋': 'xiyang', '叛军': 'panjun',

        // 战国列国（势力 id 见 factions.ts）
        '秦朝': 'qin', '秦国': 'qin', '秦': 'qin', '秦军': 'qin',
        '齐国': 'qi', '齐': 'qi',
        '楚国': 'chu', '楚': 'chu',
        '若敖': 'ruochu', '若敖氏': 'ruochu', '竟陵': 'ruochu',
        '芈': 'mi_chu', '芈氏': 'mi_chu', '云梦': 'mi_chu',
        '燕国': 'yan', '燕': 'yan',
        '魏国': 'wei', '魏': 'wei',
        '韩国': 'han', '韩': 'han',
        '赵国': 'zhao', '赵': 'zhao', '赵军': 'zhao',
        '肃慎': 'sushen', '吉里迷': 'jilimi', '囊哈儿': 'jilimi',
        '挹娄': 'yilou', '凤林古城': 'yilou',
        '勿吉': 'wuji', '吉林': 'wuji',
        '靺鞨': 'mohe', '龙泉府': 'mohe',
        '室韦': 'shiwei', '蒙兀室韦': 'shiwei', '蒙兀': 'shiwei', '额尔古纳': 'shiwei', '额尔古纳河': 'shiwei',
        '赫哲': 'hezhe', '瓦尔': 'hezhe', '波罗奈斯克': 'hezhe', '拉哈苏苏': 'hezhe',
        '濊貊': 'huimo', '东团山': 'huimo',
        '百越': 'yuenan', '滇国': 'dianguo', '拓东城': 'dianguo', '通海': 'dian', '新兴': 'dian', '倭国': 'ashikaga',
        '月氏': 'guishuang', '贵霜': 'guishuang', '拜松': 'guishuang', '希腊': 'xiyang',
        '大月氏': 'guishuang', '蓝氏城': 'guishuang', '巴克特拉': 'guishuang',

        // 西汉 (Western Han) - Now mapping to Zhonghua
        '西汉': 'zhonghua', '汉': 'zhonghua', '汉军': 'zhonghua', '炎汉': 'zhonghua',
        '南越': 'yuenan', '吴楚': 'zhonghua', '卫满': 'chaoxian',
        '东胡': 'donghu', '巴彦乌拉': 'donghu', '契丹': 'qidan', '氐羌': 'qiangzang', '匈奴': 'xiongnu', '罗马': 'xiyang',

        // 其他常见映射 (Other Common Mappings)
        '大汉': 'zhonghua', '蜀汉': 'zhonghua', '曹魏': 'wei', '孙吴': 'wu',
        '晋': 'jin', '西晋': 'jin', '东晋': 'jin',
        '隋': 'sui', '隋朝': 'sui',
        '唐': 'tang', '唐朝': 'tang',
        '宋': 'song', '北宋': 'song', '南宋': 'song',
        '元': 'menggu', '元朝': 'menggu',
        '明': 'ming_d', '明朝': 'ming_d',
        '清': 'manzhou_d', '清朝': 'manzhou_d', '大清': 'manzhou_d',
        '大金': 'dajin', '大元': 'yuan_d',

        // 秦朝追加核对势力 (2026-05-25)
        '陆浑': 'luhun', '陆浑戎': 'luhun',
        '卫国': 'wey', '卫': 'wey',
        '徐国': 'pizhou', '徐': 'pizhou', '邳州': 'pizhou',

        // 汉朝补全半成品势力 (2026-05-25)
        '铜马': 'tongma', '铜马军': 'tongma',
        '董宪': 'dongxian', '海西王': 'dongxian',
        '白波': 'baibo', '白波军': 'baibo',
        '车师后': 'cheshihou', '车师后国': 'cheshihou', '金满城': 'cheshihou',
        '二征': 'erzheng', '征侧': 'erzheng', '征贰': 'erzheng',

        // 汉朝核对追加势力 (2026-05-25)
        '翟': 'zhai_han', '翟国': 'zhai_han', '董翳': 'zhai_han',
        '殷': 'yin', '殷国': 'yin', '司马卬': 'yin', '朝歌': 'yin',
        '英布': 'liu', '九江王': 'liu', '六县': 'liu',
        '瓯越': 'ouyue', '东瓯': 'ouyue', '东瓯国': 'ouyue',

        // 三国核对追加势力 (2026-05-25)
        '襄州': 'xiangzhou', '襄': 'xiangzhou', '襄阳': 'xiangzhou',
        '刘表': 'xiangzhou', '刘景升': 'xiangzhou',
        '下邳': 'pizhou', '陷阵营': 'pizhou', '高顺': 'pizhou',
        '宿州': 'suzhou_d', '符离': 'suzhou_d', '符离集': 'suzhou_d',
        '临洮': 'didao', '狄道': 'didao', '狄道县': 'didao', '飞熊军': 'didao',
        '袁': 'yuan_cj_d', '袁氏': 'yuan_cj_d', '袁绍': 'yuan_cj_d', '悬瓠': 'yuan_cj_d', '汝南': 'yuan_cj_d',
        '河间': 'hejian', '河间郡': 'hejian', '乐成': 'hejian',
        '先登死士': 'hejian', '麴义': 'hejian', '界桥': 'hejian',
        '轵国': 'zhi_state', '轵': 'zhi_state', '野王': 'zhi_state', '轵关': 'zhi_state', '太行飞军': 'zhi_state',
        '穆氏': 'mushi', '大岴': 'mushi', '穆陵关': 'mushi', '丘穆陵骑': 'mushi',
        '蔡': 'cai', '新蔡': 'cai',
        '乌桓': 'wuhuan', '乌桓突骑': 'wuhuan', '白狼山': 'wuhuan',
        '摧锋军': 'duanzhou_d', '马暨': 'duanzhou_d', '马塈': 'duanzhou_d', '端州': 'duanzhou_d',
        '广州': 'guangzhou', '番禺': 'guangzhou',
        '清海军': 'guangzhou', '刘隐': 'guangzhou',
        '南越': 'nanyue', '南越国': 'nanyue', '赵佗': 'nanyue', '龙川': 'nanyue',
        '塞尔柱': 'seljuq', '桑贾尔': 'seljuq', '木鹿': 'seljuq', '梅尔夫': 'seljuq', '桑贾尔禁卫': 'seljuq',

        // ── 2026-05-25 新增：隋朝核对追加势力 ──
        '瓦岗': 'wazhai', '瓦岗军': 'wazhai', '李密': 'wazhai', '魏公': 'wazhai', '洛口仓': 'wazhai',
        '窦建德': 'doujiande', '夏王': 'doujiande', '河北义军': 'doujiande', '乐寿': 'doujiande',
        '刘武周': 'liuwuzhou', '定杨': 'liuwuzhou', '马邑': 'liuwuzhou',
        '梁师都': 'liangshidu', '梁帝': 'liangshidu', '朔方': 'liangshidu', '解事天子': 'liangshidu',
        '罗艺': 'luoyi', '燕王': 'luoyi', '渔阳': 'luoyi', '幽燕': 'luoyi',
        '林士弘': 'linshihong', '楚帝': 'linshihong', '豫章': 'linshihong',
        '杜伏威': 'dufuwei', '楚王': 'dufuwei', '历阳': 'dufuwei',
        '库莫奚': 'kumo', '奚': 'kumo', '奚族': 'kumo', '松漠': 'kumo', '饶乐': 'kumo',
        '西突厥': 'xijue', '统叶护': 'xijue', '十箭': 'xijue', '千泉': 'xijue',
        '冼': 'xian_d', '冼夫人': 'xian_d', '高凉冼氏': 'xian_d', '高凉': 'xian_d',
        '薛举': 'xiqin', '西秦': 'xiqin', '薛仁果': 'xiqin', '金城': 'xiqin',

        // ── 2026-05-25 新增：唐朝核对追加势力 ──
        '薛延陀': 'xueyantuo', '薛延陀汗国': 'xueyantuo', '薛延': 'xueyantuo',
        '突骑施': 'tujishi', '突骑施汗国': 'tujishi', '突骑': 'tujishi',
        '南诏': 'nanzhao', '南诏国': 'nanzhao', '蒙舍诏': 'nanzhao', '皮逻阁': 'nanzhao', '蒙舍城': 'nanzhao',
        '高昌': 'gaochang', '高昌国': 'gaochang', '交河': 'gaochang', '高昌壁': 'gaochang', '麴文泰': 'gaochang',
        '黠戛斯': 'xiajiasi', '坚昆': 'xiajiasi', '黠戛斯汗国': 'xiajiasi', '黠戛': 'xiajiasi',
        '小勃律': 'xiaobolu', '勃律': 'xiaobolu',
        '大食': 'dashi', '大食国': 'dashi', '白衣大食': 'dashi', '黑衣大食': 'dashi',
        '李希烈': 'lixilie', '淮西': 'lixilie', '蔡州': 'lixilie', '建兴王': 'lixilie',
        '魏博': 'tianxiong', '魏博节度': 'tianxiong', '魏州': 'tianxiong',
        '天雄军': 'tianxiong', '卢象升': 'tianxiong', '大名': 'tianxiong', '贾庄': 'tianxiong',
        '邯郸坚兵': 'zhao', '赵武灵王': 'zhao', '廉颇': 'zhao',
        '幽州突骑': 'yan', '幽州': 'yan',
        '辽东铁骑': 'gongsun_d', '公孙度': 'gongsun_d',
        '黑槊龙骧': 'shizhao_d', '黑槊龙骧军': 'shizhao_d', '石勒': 'shizhao_d',
        '苍头军': 'yunzhong',
        '虎纹突骑': 'tuoba', '拓跋焘': 'tuoba',
        '宿卫虎贲': 'yuwen', '武川镇': 'yuwen', '武川镇军': 'yuwen',
        '六镇戍兵': 'erzhu', '六镇': 'erzhu',
        '百保鲜卑': 'gaoqi_d', '百保': 'gaoqi_d',
        '黄龙兵': 'yingzhou_ying_d', '高宝宁': 'yingzhou_ying_d', '营州': 'yingzhou_ying_d',
        '两池军': 'chile', '高洋': 'chile',
        // murong → deleted
        '曳落河': 'zhuozhou', '安禄山': 'zhuozhou', '范阳': 'zhuozhou',
        '鸦儿军': 'shatuo', '李克用': 'shatuo',
        '朔方军': 'lingwu', '郭子仪': 'lingwu', '李光弼': 'lingwu', '灵武': 'lingwu', '回乐': 'lingwu',
        '定襄': 'dingxiang_d', '李靖': 'dingxiang_d', '恶阳岭': 'dingxiang_d', '恶阳骑': 'dingxiang_d',
        '恒州弩手': 'zhongshan', '颜杲卿': 'zhongshan',
        '裘甫': 'qiufu', '浙东': 'qiufu', '剡县': 'qiufu',

        // ── 2026-05-25 五代十国势力 ──
        '东丹': 'dongdan', '东丹国': 'dongdan', '耶律倍': 'dongdan', '渤海': 'dongdan',
        '大理': 'dali', '大理国': 'dali', '段思平': 'dali', '段氏': 'dali', '羊苴咩': 'dali',
        '罗甸': 'luodian', '罗甸国': 'luodian', '大方': 'luodian',
        '回鹘': 'huige', '回纥': 'huige', '甘州回鹘': 'huige',
        '党项': 'dangxiang', '拓跋': 'dangxiang', '夏州': 'dangxiang',
        '嵬名': 'weiming', '嵬名氏': 'weiming', '西夏皇族': 'weiming', '黑水城': 'weiming',
        '野利': 'yeli', '野利氏': 'yeli', '克夷门': 'yeli',
        '突厥': 'tujue', '阿史那': 'tujue', '金山': 'tujue',
        '阿史那氏': 'ashina', '阿史那家族': 'ashina', '土门可汗': 'ashina',
        '夫余': 'fuyu', '夫余国': 'fuyu', '农安': 'fuyu',


        // ── 2026-05-25 北宋辽金势力 ──
        '唃厮啰': 'gusiluo', '唃厮啰政权': 'gusiluo', '廓州': 'gusiluo', '贵德': 'gusiluo', '古斯罗': 'gusiluo', '唃厮': 'gusiluo',
        '高句': 'gaogouli', '高句丽': 'gaogouli', '丸都': 'gaogouli',
        '玄菟': 'xuantu', '玄菟郡': 'xuantu', '国内城': 'xuantu',
        '高丽': 'goryeo', '王氏高丽': 'goryeo', '高丽王朝': 'goryeo', '开京': 'goryeo', '开城': 'goryeo',
        '镜城': 'jingcheng_d', '笼耳': 'jingcheng_d', '笼耳县': 'jingcheng_d',
        '忠州': 'chungju_d', '忠州牧': 'chungju_d', '国原城': 'chungju_d', '大原城': 'chungju_d', '薮原城': 'chungju_d', '中原京': 'chungju_d',
        '罗州': 'naju_d', '罗州牧': 'naju_d', '锦城': 'naju_d', '发罗郡': 'naju_d', '通义县': 'naju_d',
        '彭氏': 'pengshi', '沅陵': 'pengshi', '月支': 'chen3', '月支国': 'chen3', '大木岳': 'chen3',
        '沙伐': 'sabeol', '沙伐国': 'sabeol', '三白': 'sabeol', '尚州': 'sabeol',
        '申国': 'shen', '申侯': 'shen', '安康': 'shen',
        '安阳': 'anyang_wangze', '王则': 'anyang_wangze', '贝州': 'anyang_wangze',
        '大南': 'nongzhigao', '侬智高': 'nongzhigao', '南天国': 'nongzhigao', '邕州': 'nongzhigao',
        '方腊': 'fangla', '方腊起义': 'fangla', '清溪': 'fangla', '明教': 'fangla', '摩尼': 'fangla', '方': 'fangla',

        // ── 2026-05-25 北宋辽金势力 v2 ──
        '钟相': 'zhongxiang', '杨幺': 'zhongxiang', '钟相杨幺': 'zhongxiang', '大圣天王': 'zhongxiang',
        '鼎州': 'zhongxiang', '武陵': 'zhongxiang', '天子冈': 'zhongxiang', '洞庭': 'zhongxiang',
        '杨安儿': 'yang_aner', '天顺': 'yang_aner', '登州': 'yang_aner', '蓬莱': 'yang_aner',
        '德寿': 'deshou', '身圣': 'deshou', '信州': 'deshou',
        '李旺': 'liwang', '胶西': 'liwang', '胶县': 'liwang',

        // ── 2026-05-25 元朝蒙古势力 ──
        // 第一类：西征摧毁政权
        '花剌子模': 'huarazim', '花剌子模帝国': 'huarazim', '撒马尔干': 'huarazim', '撒马尔罕': 'huarazim', '玉龙杰赤': 'huarazim', '乌尔达赤': 'huarazim', '花剌': 'huarazim',
        '毡的': 'yettishar', '哲德': 'yettishar',
        '咸海': 'xianhai', '养吉干': 'xianhai',
        '木剌夷': 'mulayi', '亦思马因派': 'mulayi', '阿剌模忒': 'mulayi', '阿剌模忒堡': 'mulayi', '木剌': 'mulayi',
        '蒲甘': 'pagan', '蒲甘王朝': 'pagan', '缅国': 'pagan', '江头城': 'pagan',
        '占城': 'zhancheng', '阇槃': 'zhancheng', '占婆': 'champa', '美山': 'champa', '占城港': 'champa', '归仁': 'champa',
        '东夏': 'dongxia', '东夏国': 'dongxia', '大真': 'dongxia', '大真国': 'dongxia', '蒲鲜万奴': 'dongxia', '城子山': 'dongxia',
        // 第二类：四大汗国
        '察合台': 'chagatai', '察合台汗国': 'chagatai', '阿力麻里': 'chagatai', '察合': 'chagatai',
        '窝阔台': 'ogodei', '窝阔台汗国': 'ogodei', '也迷里': 'ogodei', '窝阔': 'ogodei',
        '伊儿汗': 'ilkhanate', '伊儿汗国': 'ilkhanate', '旭烈兀': 'ilkhanate', '玛拉固阿': 'ilkhanate', '伊儿': 'ilkhanate',
        // 第三类：蒙古草原部落
        '克烈': 'kereyid', '克烈部': 'kereyid', '黑林': 'kereyid', '土兀剌河': 'kereyid',
        '乃蛮': 'naiman', '乃蛮部': 'naiman', '科布多': 'naiman', '阿勒台山': 'naiman',
        '塔塔儿': 'tatar', '塔塔儿部': 'tatar', '哈拉哈河': 'tatar', '贝尔湖': 'tatar', '塔塔': 'tatar', '塔塔尔': 'tatar',
        '蔑儿乞': 'merkit', '蔑儿乞部': 'merkit', '薛良格河': 'merkit', '色楞格': 'merkit', '蔑乞': 'merkit',
        '汪古': 'ongut', '汪古部': 'ongut', '阴山': 'ongut',
        '斡亦剌': 'oirat', '斡亦剌部': 'oirat', '林木中百姓': 'oirat', '谦河': 'oirat', '斡剌': 'oirat',
        // 第四类：汉军世侯及元末军阀
        '张柔': 'zhang_clan', '张弘范': 'zhang_clan', '顺天': 'zhang_clan',
        '刘伯林': 'liu_clan2', '刘黑马': 'liu_clan2', '平阳刘氏': 'liu_clan2',
        '孛罗': 'boluo', '孛罗帖木儿': 'boluo', '大同孛罗': 'boluo',
        // 第五类：元末起义政权
        '红巾军': 'xushouhui', '徐寿辉': 'xushouhui', '天完': 'xushouhui', '蕲春': 'xushouhui', '蕲水': 'xushouhui',
        '韩山童': 'xushouhui', '刘福通': 'xushouhui',
        '亳州': 'cao_d', '谯县': 'cao_d', '谯都': 'cao_d',
        '颍州': 'yingzhou_d', '汝阴': 'yingzhou_d', '顺昌': 'yingzhou_d',
        '郾城': 'yanchuan_d', '郾': 'yanchuan_d',
        '潢川': 'huang_d', '光州': 'huang_d',
        '武胜关': 'yiyang_d', '义阳': 'yiyang_d', '义阳三关': 'yiyang_d',
        '雍丘': 'qiguo_d', '杞': 'qiguo_d',
        '蒙城': 'mengcheng_d', '山桑': 'mengcheng_d', '山桑县': 'mengcheng_d',
        '宛丘': 'huaiyang', '淮阳': 'huaiyang',
        '永城': 'guide_d', '归德': 'guide_d', '芒砀': 'panjun',
        '虞城': 'dang_d', '砀': 'dang_d', '砀郡': 'dang_d',
        '昆阳': 'lulin', '绿林': 'lulin', '王匡': 'lulin', '王凤': 'lulin',
        '蚌埠': 'hao_d', '濠州': 'hao_d', '濠': 'hao_d', '钟离': 'hao_d',
        '聊城': 'bozhou_d', '博州': 'bozhou_d', '博': 'bozhou_d',
        '张士诚': 'zhangshicheng', '大周': 'zhangshicheng', '高邮': 'zhangshicheng', '周王': 'zhangshicheng',
        '罗平国': 'luoping', '林桂芳': 'luoping', '欧南喜': 'luoping', '新会': 'luoping',
        '大兴国': 'daxing', '杨镇龙': 'daxing', '宁海': 'daxing',
        '陈吊眼': 'chendiaoyan', '畲族': 'chendiaoyan', '漳州': 'chendiaoyan',

        // ── 2026-05-25 明朝势力 ──
        // 第二类：元末群雄
        '方国珍': 'fang_guozhen', '庆元': 'fang_guozhen', '台州': 'fang_guozhen', '温州': 'fang_guozhen',
        // 第三类：农民起义
        '南阳材官': 'dixiang', '张绣': 'dixiang', '宛': 'dixiang',         '邓茂七': 'dengmaoqi', '铲平王': 'dengmaoqi', '沙县': 'dengmaoqi', '延平': 'dengmaoqi', '建宁': 'dengmaoqi',
        '叶宗留': 'yezongliu', '太平国': 'yezongliu', '处州': 'yezongliu', '陈鉴胡': 'yezongliu',
        // 第四类：藩王叛乱
        '朱高煦': 'zhu_gaoxu', '汉王叛': 'zhu_gaoxu', '乐安': 'zhu_gaoxu', '武定州': 'zhu_gaoxu',
        // 第五类：边疆民族
        '鞑靼': 'dada_ming', '俺答': 'dada_ming', '河套': 'dada_ming', '丰州': 'dada_ming',
        '瓦剌': 'wala', '卫拉': 'oirat_ming', '也先': 'oirat_ming', '明瓦剌': 'oirat_ming',
        '兀良哈猎兵': 'wuliangha', '兀良哈': 'wuliangha', '乌梁海': 'wuliangha', '唐努山': 'wuliangha', '朵颜': 'wuliangha', '泰宁': 'wuliangha', '福余': 'wuliangha',
        '建州女真': 'jianzhou_nvzhen', '建州': 'jianzhou_nvzhen', '苏子河': 'jianzhou_nvzhen', '婆猪江': 'jianzhou_nvzhen',
        '海西女真': 'haixi_nvzhen', '扈伦': 'haixi_nvzhen', '乌拉': 'haixi_nvzhen', '叶赫': 'haixi_nvzhen', '呼兰河': 'haixi_nvzhen',
        '野人女真': 'yeren_nvzhen', '东海女真': 'yeren_nvzhen', '瑷珲': 'yeren_nvzhen', '黑龙江': 'yeren_nvzhen',

        // ── 2026-05-26 新增：满洲贵族世家 ──
        '佟佳': 'tunggiya', '佟佳氏': 'tunggiya', '佟半朝': 'tunggiya', '佟佳江': 'tunggiya',
        '富察': 'fuca', '富察氏': 'fuca', '沙济': 'fuca', '沙济城': 'fuca', '傅恒': 'fuca', '孝贤': 'fuca',
        '钮祜禄': 'niohuru', '钮祜禄氏': 'niohuru', '英额': 'niohuru', '英额城': 'niohuru', '额亦都': 'niohuru', '和珅': 'niohuru',
        '赫舍里': 'heseri', '赫舍里氏': 'heseri', '索尼': 'heseri', '索额图': 'heseri', '绥芬河': 'heseri',
        '瓜尔佳': 'guwalgiya', '瓜尔佳氏': 'guwalgiya', '苏完': 'guwalgiya', '苏完部': 'guwalgiya', '鳌拜': 'guwalgiya',
        '大氏': 'da_shi', '渤海王族': 'da_shi', '大祚荣': 'da_shi', '东牟山': 'da_shi',

        '麓川': 'luchuan', '思任发': 'luchuan', '思伦发': 'luchuan', '腾冲': 'luchuan',
        '大藤峡': 'datengxia', '侯大苟': 'datengxia', '断藤峡': 'datengxia', '瑶壮': 'datengxia',
        '哈密': 'yiwu', '哈密卫': 'yiwu',
        '赤斤': 'chijin', '赤斤蒙古': 'chijin', '赤金堡': 'chijin',
        '沙州': 'shazhou', '沙州卫': 'shazhou', '敦煌': 'shazhou',
        '归义军': 'guiyi', '张议潮': 'guiyi', '玉门关': 'guiyi',
        '安定卫': 'anding_wei', '安定蒙古': 'anding_wei',
        // 第六类：周边国家
        '安南': 'annam_ho', '胡朝': 'annam_ho', '黎氏': 'annam_ho', '交阯': 'annam_ho', '升龙': 'annam_ho', '河内': 'annam_ho',
        '李朝': 'joseon', '李成桂': 'joseon', '汉城': 'joseon', '汉阳': 'joseon', '义兴亲军卫': 'joseon',
        '暹罗': 'siam', '阿瑜陀耶': 'siam',

        // ── 2026-06-11 中原远征精锐（§1 共 13 支）──
        '玄甲军': 'tang', '李世民': 'tang', '玄甲骑': 'tang',
        '魏武卒': 'wei', '吴起': 'wei',
        '秦之锐士': 'qin', '秦锐士': 'qin', '白起': 'qin', '司马错': 'qin',
        '齐之技击': 'qi', '技击': 'qi', '田忌': 'qi', '孙膑': 'qi',
        '江东子弟': 'xichu', '八千子弟兵': 'xichu', '项羽': 'xichu', '彭城': 'xichu',
        '虎豹骑': 'cao_d', '曹纯': 'cao_d', '曹真': 'cao_d',
        '乞活军': 'ranwei_d', '冉闵': 'ranwei_d',
        '控鹤军': 'wuzhou_d', '武则天': 'wuzhou_d',
        '皂衣队': 'fushi', '苻坚': 'fushi',
        '商王射士': 'shang', '三百射': 'shang',
        '岐阳周师': 'zhou', '虎贲三千': 'zhou', '岐阳': 'zhou',
        '虎贲军': 'han_d', '南郑': 'han_d', '刘邦': 'han_d',
        '夏后亲卫': 'xiezhou', '安邑': 'xiezhou', '解县弩手': 'xiezhou',
        '骁果军': 'sui', '骁果': 'sui', '司马德戡': 'sui', '宇文化及': 'sui',

        // ── 2026-06-11 南方远征精锐（§9 共 12 支）──
        '申息之师': 'chu', '申息': 'chu',
        '解烦兵': 'sunwu_d', '解烦': 'sunwu_d',
        '黑云长剑都': 'nantang_d', '黑云长剑': 'nantang_d',
        '北府兵': 'zhong', '北府': 'zhong', '谢玄': 'zhong', '刘牢之': 'zhong',
        '扬州义兵': 'hongguang', '史可法': 'hongguang', '弘光四镇': 'hongguang', '高杰': 'hongguang', '刘良佐': 'hongguang', '黄得功': 'hongguang', '刘泽清': 'hongguang',
        '闽国亲从': 'min', '王审知': 'min',
        '逍遥津死士': 'lu', '张辽': 'lu', '庐州': 'lu',
        '无为': 'wuwu_d', '濡须口': 'wuwu_d', '濡须': 'wuwu_d',
        '巴渝劲卒': 'ba', '巴蔓子': 'ba', '重庆': 'ba',
        '兴戎军': 'hezhou', '钓鱼城': 'hezhou', '合州': 'hezhou', '王坚': 'hezhou',
        '韩卒击刹': 'han',
        '睢阳戍卒': 'liang_d', '梁国': 'liang_d', '张巡': 'liang_d',
        '靖江': 'jingjiang', '静江': 'xinjiang', '始安': 'xinjiang', '马塈': 'xinjiang',
        '楼兰戍': 'loulan', '扜泥城': 'loulan',
        '苑川突骑': 'qifu_d', '苑川': 'qifu_d',
        '碎叶镇军': 'ashina', '碎叶城': 'xiliao', '碎叶': 'xiliao', '屈耽': 'xiliao',
        '斡耳朵亲卫': 'xiliao', '虎思': 'xiliao', '八剌沙衮': 'xiliao',
        '清海军': 'guangzhou', '刘隐': 'guangzhou',
        '白袍军': 'xiao_d', '陈庆之': 'xiao_d',
        '背嵬军': 'yue_d', '背嵬': 'yue_d', '岳飞': 'yue_d', '岳云': 'yue_d',
        '中兴护军': 'song', '韩世忠': 'song', '克敌军': 'song',
        '忠顺军': 'zaoyang_d', '孟珙': 'zaoyang_d', '孟宗政': 'zaoyang_d', '枣阳': 'zaoyang_d', '舂陵': 'zaoyang_d',
        '游奕军': 'qian_d', '踏白军': 'qian_d',
        '明军三大营': 'ming_d', '三大营': 'ming_d', '五军营': 'ming_d', '神机营': 'ming_d', '三千营': 'ming_d',
        '戚家军': 'qi_d', '戚继光': 'qi_d', '戚': 'qi_d', '横屿': 'qi_d', '横屿大捷': 'qi_d',
        '督标秦军': 'sunqin', '秦兵': 'sunqin', '孙传庭': 'sunqin', '潼津': 'sunqin',
        '朵颜三卫': 'wuliangha',
        '白杆兵': 'tujia_d', '秦良玉': 'tujia_d', '石柱': 'tujia_d',
        '王江泾': 'zhuang_d',
        '红袄军': 'lai', '杨安儿': 'lai', '青石关': 'lai',
        '济南卫': 'jinan', '铁铉': 'jinan', '历下': 'jinan',
        '锦帆贼': 'wu', '甘宁': 'wu',
        '八字军': 'wangyan', '王彦': 'wangyan', '飞狐': 'wangyan', '太行': 'wangyan',
        '宣毅军': 'huan', '范仲淹': 'huan', '环州': 'huan', '环庆': 'huan',
        '神臂营': 'qingyuan_bd', '神臂弓': 'qingyuan_bd', '神臂': 'qingyuan_bd',

        // ── 2026-06-11 岭南远征精锐（§10 共 10 支）──
        '广西狼兵': 'zhuang_d', '俍兵': 'zhuang_d', '狼兵': 'zhuang_d', '瓦氏夫人': 'zhuang_d',
        '俚人武士': 'xian_d', '冼夫人卫队': 'xian_d',
        '白藤江水师': 'dayue', '安南神武军': 'dayue', '神武军': 'dayue',
        '铁突军': 'jing', '陈兴道': 'jing',
        '圣翊军': 'trinh',
        '西山军': 'nguyen_guangnan', '阮惠': 'nguyen_guangnan', '光中': 'nguyen_guangnan',
        '黑旗军': 'panjun', '刘永福': 'panjun',
        '那霸水师': 'ryukyu', '琉球水师': 'ryukyu',
        '郑氏铁人军': 'ming_zheng', '铁人军': 'ming_zheng',
        '出草勇士': 'paiwan',

        // ── 2026-06-11 滇缅远征精锐（≥10 条；辞典具名）──
        '南诏罗苴子': 'nanzhao', '罗苴子': 'nanzhao',
        '大理白军': 'dali',
        '汉达瓦底': 'hantawadi', '莽应龙': 'hantawadi', '莽应': 'hantawadi',
        '南都象阵': 'dongxu', '勃固城': 'dongxu', '勃固': 'dongxu',
        '贡榜卡塞骑': 'konbaung', '贡榜': 'konbaung', '卡塞骑': 'konbaung', '瑞波': 'konbaung',
        '皇家象骑兵': 'siam', '阿瑜陀耶象骑': 'siam',
        '蒲甘战象军': 'pagan', '蒲甘象军': 'pagan',
        '骠国巨象阵': 'pyu', '骠国乐': 'pyu',
        '占婆国水师': 'champa', '占婆水师': 'champa',
        '双弓弩象营': 'chenla', '弩象营': 'chenla', '吴哥象营': 'chenla',
        '麓川百夷象兵': 'luchuan', '百夷象兵': 'luchuan', '勐卯': 'luchuan',
        '真腊': 'chenla', '吴哥': 'chenla',
        '苏门答剌': 'sumatra', '苏门答腊': 'sumatra',
        '爪哇': 'majapahit', '满者伯夷': 'majapahit',
        '渤泥': 'brunei', '文莱': 'brunei',
        '三佛齐': 'srivijaya', '室利佛逝': 'srivijaya', '旧港': 'srivijaya', '巨港': 'srivijaya', '施进卿': 'srivijaya',

        // 2026-05-25 两晋核对追加势力
        // murong → deleted
        // murong → deleted
        '龙城': 'yingzhou_ying_d', '朝阳': 'yingzhou_ying_d',
        '尔朱': 'erzhu', '尔朱荣': 'erzhu', '尔朱兆': 'erzhu', '尔朱氏': 'erzhu',
        '契胡': 'erzhu', '秀容川': 'erzhu', '秀容': 'erzhu',
        '陈': 'chen', '陈霸先': 'chen', '陈武帝': 'chen', '陈朝': 'chen',
        '韶关': 'shaozhou', '曲江': 'shaozhou', '始兴': 'shixing', '始兴郡': 'shixing',
        '张镇孙': 'shaozhou', '大庾岭义旅': 'shaozhou', '大庾岭': 'shaozhou',

        // ── 2026-05-25 明清之际势力 ──
        // 第一类：明末农民军
        '大顺': 'dashun', '李自成': 'dashun', '闯王': 'dashun', '顺军': 'dashun',
        '大西': 'daxi_ming', '张献忠': 'daxi_ming', '八大王': 'daxi_ming', '西军': 'daxi_ming',
        // 第二类：南明五政权
        '弘光': 'hongguang', '朱由崧': 'hongguang', '福王': 'hongguang', '南京': 'hongguang',
        '隆武': 'longwu', '朱聿键': 'longwu', '唐王': 'longwu', '福州': 'longwu',
        '鲁监国': 'lujian', '朱以海': 'lujian', '绍兴': 'lujian',

        '毛文龙': 'mao_wenlong', '东江镇': 'mao_wenlong', '皮岛': 'mao_wenlong',
        // 第三类：蒙古诸部
        '察哈尔': 'chahar', '林丹汗': 'chahar', '插汉': 'chahar', '察哈': 'chahar',
        '喀尔喀': 'khalkha', '土谢图': 'khalkha', '札萨克图': 'khalkha', '车臣': 'khalkha', '喀喀': 'khalkha',
        '准噶尔': 'dzungar', '噶尔丹': 'dzungar', '策妄': 'dzungar', '阿睦尔撒纳': 'dzungar', '伊犁': 'dzungar', '准噶': 'dzungar',
        // 第四类：西北/青藏
        '和硕特': 'khoshut', '固始汗': 'khoshut', '西宁': 'khoshut', '和硕': 'khoshut',
        '叶尔羌': 'yarkand', '叶尔羌汗国': 'yarkand', '叶尔羌老城': 'yarkand', '叶羌': 'yarkand',
        '莎车': 'shache', '莎车国': 'shache',
        '回部': 'khoja', '大小和卓': 'khoja', '波罗尼都': 'khoja', '霍集占': 'khoja', '喀什噶尔': 'khoja',
        '噶厦': 'gaxa', '达赖': 'gaxa', '拉萨': 'gaxa',
        // 第五类：西南土司
        '大金川': 'jinchuan_g', '莎罗奔': 'jinchuan_g', '勒乌围': 'jinchuan_g', '索诺木': 'jinchuan_g', '金川': 'jinchuan_g',
        '小金川': 'jinchuan_x', '僧格桑': 'jinchuan_x', '美诺': 'jinchuan_x', '小川': 'jinchuan_x',
        '班禅': 'panchen', '日喀则': 'panchen', '札什伦布': 'panchen',
        // 第六类：三藩之乱
        '吴三桂': 'wusangui', '周军': 'wusangui', '吴周': 'wusangui',
        '耿精忠': 'geng', '靖南': 'geng',
        // 第七类：清代起义
        '林爽文': 'shuntian', '彰化': 'shuntian',
        '白莲教': 'bailian', '白莲': 'bailian', '王聪儿': 'bailian',
        '天理教': 'tianli', '李文成': 'tianli', '林清': 'tianli', '滑县': 'tianli',
        '苗民': 'miaomin', '石三保': 'miaomin', '平陇': 'miaomin', '乾嘉苗变': 'miaomin',
        // 第八类：亚洲外国
        '廓尔喀': 'gurkha', '尼泊尔': 'gurkha', '加德满都': 'gurkha', '廓喀': 'gurkha',
        '夏顿': 'xiadun', '廷布': 'xiadun', '布鲁克巴': 'xiadun', '不丹': 'xiadun', '夏仲': 'xiadun',
        '哈萨克': 'kazakh', '哈萨克汗国': 'kazakh', '哈萨': 'kazakh',
        '霍罕': 'kokand', '浩罕': 'kokand', '浩罕汗国': 'kokand',
        '巴达克山': 'badakhshan', '达克': 'badakhshan',

        // ── 2026-05-25 晚清／近代势力 ──
        // 第一类：农民革命政权
        '太平天国': 'taiping', '洪秀全': 'taiping', '天军': 'taiping', '天京': 'taiping',
        '大成国': 'dacheng', '陈开': 'dacheng', '李文茂': 'dacheng', '秀京': 'dacheng', '浔州': 'dacheng',
        '大明国': 'daming', '小刀会': 'daming', '刘丽川': 'daming', '上海': 'daming',
        '捻军大汉': 'panjun', '张乐行': 'panjun', '雉河集': 'panjun',
        '李蓝大汉': 'han_dadian', '李永和': 'han_dadian', '蓝朝鼎': 'han_dadian', '洋县': 'han_dadian',
        '湖北军政府': 'republic', '辛亥革命': 'republic', '革命军': 'republic', '武昌起义': 'republic',
        // 第二类：少数民族起义
        '平南国': 'pingnan', '杜文秀': 'pingnan',
        '陕甘回民': 'huimin', '马化龙': 'huimin', '马占鳌': 'huimin', '金积堡': 'huimin',
        '白旗起义': 'qianhui', '黔西南回军': 'qianhui', '张凌翔': 'qianhui',
        '苗民起义': 'miao_qing', '张秀眉': 'miao_qing', '台拱': 'miao_qing', '苗军': 'miao_qing',
        // 第三类：新疆同治割据
        '热西丁': 'rexidin', '黄和卓': 'rexidin', '库车': 'rexidin',
        '妥明': 'tuoming', '妥得璘': 'tuoming', '乌鲁木齐': 'tuoming', '清真王': 'tuoming',
        '和田': 'xiye', '西夜国': 'xiye',
        '迈孜木杂特': 'maizanik', '惠远': 'maizanik', '伊犁苏丹': 'maizanik',
        '金相印': 'jinsi', '思的克': 'jinsi', '回庄': 'jinsi',
        // 第四类：蒙古/土司/地方武装
        '苗沛霖': 'nian_family', '捻军': 'nian_family', '寿州': 'nian_family',
        // 第五类：外国
        '阮朝': 'nguyen', '顺化': 'nguyen',

        // ── 2026-05-25 日本北海道势力 ──
        '蛎崎': 'kakizaki', '蛎崎氏': 'kakizaki', '胜山馆': 'kakizaki', '松前': 'kakizaki',

        // ── 2026-05-25 奥州藤原氏 ──
        '藤原': 'fujiwara', '藤原氏': 'fujiwara', '奥州': 'fujiwara', '柳之御所': 'fujiwara', '平泉': 'fujiwara',

        // ── 2026-05-25 日本势力重组 ──
        '邪马台国': 'yamatai', '邪马台': 'yamatai', '吉野里': 'yamatai', '邪马': 'yamatai',
        '德川': 'edo', '德川幕府': 'edo', '江户': 'edo',
        '异国警固': 'zhuqian', '异国警固番役': 'zhuqian', '石筑地': 'zhuqian',
        '太宰府': 'zhuqian', '筑前': 'zhuqian', '警固番役': 'zhuqian', '福冈': 'zhuqian', '福冈城': 'zhuqian',
        '书院番': 'edo', '小姓组': 'edo', '两番': 'edo',
        '北条': 'hojo_d', '北条氏': 'hojo_d', '小田原': 'hojo_d', '风魔党': 'hojo_d',
        '伊贺': 'iga_d', '伊贺众': 'iga_d', '甲贺众': 'iga_d', '名张': 'iga_d', '服部': 'iga_d',
        '加贺': 'kaga_d', '前田': 'kaga_d', '前田氏': 'kaga_d', '金泽': 'kaga_d', '江沼': 'kaga_d',
        '伊达': 'date_d', '伊达氏': 'date_d', '仙台': 'date_d', '陆前': 'date_d',
        '肥后': 'higo_d', '熊本': 'higo_d',
        '伊予': 'iyo_d', '松山': 'iyo_d',
        '大友': 'otomo_d', '大友氏': 'otomo_d', '府内': 'otomo_d', '丰后': 'otomo_d',
        '诹访': 'suwa_d', '诹访氏': 'suwa_d', '高岛': 'suwa_d', '诹访神党': 'suwa_d',
        '毛利氏': 'aki', '毛利': 'aki', '吉田郡山城': 'aki', '安艺': 'aki',
        '武田': 'kai', '武田氏': 'kai', '躑躅崎馆': 'kai', '甲斐': 'kai',
        '织田': 'owari', '织田氏': 'owari', '清洲': 'owari', '尾张': 'owari',
        '长宗我部': 'chosokabe', '长宗我部氏': 'chosokabe', '冈丰城': 'chosokabe', '长宗': 'chosokabe', '土佐': 'chosokabe',
        '上杉': 'echigo', '上杉氏': 'echigo', '春日山': 'echigo', '越后': 'echigo',
        '大仓御所': 'kamakura',
        '岛津氏': 'satsuma', '岛津': 'satsuma', '内城': 'satsuma', '萨摩': 'satsuma',
        '金石城': 'so', '对马': 'so',
        '尼子': 'izumo', '尼子氏': 'izumo', '月山富田城': 'izumo', '出云': 'izumo',
// ── 2026-05-25 羽柴/本多/会津 ──
'羽柴': 'hashiba', '羽柴氏': 'hashiba', '丰臣': 'hashiba', '丰臣氏': 'hashiba', '姬路城': 'hashiba',
'本多': 'honda', '本多氏': 'honda', '宇都宫城': 'honda', '下野': 'honda',
'会津': 'aizu', '会津氏': 'aizu', '鹤之城': 'aizu',
// ── 2026-05-28 南部/陆奥 ──
'南部': 'nanbu', '陆奥': 'nanbu',
        // ── 2026-05-25 大韩/朝鲜 ──
        '朝鲜王朝': 'joseon',
        '平壤': 'gaogouli', '平壤城': 'gaogouli', '高句丽铁骑': 'gaogouli',
        '珍岛': 'sambyeol', '三别抄': 'sambyeol', '裴仲孙': 'sambyeol',
        '升州': 'sheng_d', '升州牧': 'sheng_d', '升州束伍军': 'sheng_d', '束伍军': 'sheng_d',
        '锦州': 'jinzhou', '锦州卫': 'jinzhou', '锦': 'jinzhou', '李成梁': 'jinzhou',
        '忠孝军': 'qing', '完颜陈和尚': 'qing',
        '铁浮图': 'jurchen', '猛安谋克': 'dajin',
        '夫余步骑': 'fuyu', '黄龙府': 'fuyu',
        '关宁铁骑': 'zu_d', '辽东铁骑': 'jinzhou', '东江军': 'mao_wenlong',
        '巴牙喇': 'aisin_d', '爱新': 'aisin_d', '爱新觉罗': 'aisin_d',
        '白甲兵': 'manzhou', '白摆牙喇': 'manzhou', '萨尔浒': 'manzhou',
        '八旗军': 'manzhou', '多铎': 'manzhou_d',
        '索伦兵': 'hezhe', '黑龙江水师': 'aola', '神贲禁卫': 'bohai',
        '皮室军': 'liao_d', '斡鲁朵': 'yel', '临潢府': 'liao_d', '上京': 'liao_d',
        '怯薛': 'menggu_d', '怯薛歹': 'menggu_d',
        '那可儿': 'borjigin', '探马赤': 'ogodei', '秃鲁花': 'yuan_d',
        '鸣镝骑': 'xiongnu', '控弦': 'xiongnu', '控弦之士': 'xiongnu',
        '附离': 'tujue', '附离亲卫': 'tujue', '狼卫': 'tujue',
        '回鹘铁骑': 'huige', '毗伽近卫': 'huige', '毗伽': 'huige',
        '沙陀铁骑': 'shatuo', '弹汗山': 'xianbei',
        '柔然铁骑': 'rouran', '瓦剌铁骑': 'wala',

        // ── 2026-05-25 兴辽(大延琳) ──
        '兴辽': 'xingliao', '兴辽国': 'xingliao', '大延琳': 'xingliao', '龙湾': 'xingliao',

        // ── 2026-05-26 新增：漠北草原势力 ──
        '高车': 'gaoche', '敕勒': 'gaoche', '浚稽山': 'gaoche',
        '大蒙古': 'menggu_d', '大蒙古国': 'menggu_d', '蒙古帝国': 'menggu_d',
        '大元政权': 'da_yuan', '北元': 'da_yuan', '应昌': 'da_yuan',

        // ── 2026-05-26 新增：漠北草原部落/氏族势力 ──
        '丁零': 'dingling', '丁零人': 'dingling', '叶尼塞': 'dingling',
        '呼衍': 'huyan', '呼衍氏': 'huyan', '须卜': 'huyan', '兰氏': 'huyan',
        '郁久闾': 'yujiulu', '郁久闾氏': 'yujiulu', '木骨闾': 'yujiulu', '柔然王族': 'yujiulu', '弱水': 'yujiulu',
        '阿史德': 'ashide', '阿史德氏': 'ashide', '总材山': 'ashide',
        '药罗葛': 'yaoluoge', '药罗葛氏': 'yaoluoge', '骨力裴罗': 'yaoluoge', '回鹘王族': 'yaoluoge', '仙娥河': 'yaoluoge', '娑陵': 'yaoluoge',
        '乞颜': 'kiyad', '乞颜部': 'kiyad', '苍狼白鹿': 'kiyad', '不儿罕山': 'kiyad',
        '孛儿只斤': 'borjigin', '孛儿只斤氏': 'borjigin', '黄金家族': 'borjigin', '铁木真': 'borjigin', '成吉思汗': 'borjigin', '斡难河源': 'borjigin',
        '泰赤乌': 'tayichiud', '泰赤乌部': 'tayichiud', '斡难河中游': 'tayichiud',
        '札剌亦儿': 'jalair', '札剌亦儿部': 'jalair', '克鲁伦河': 'jalair',
        '弘吉剌': 'hongirad', '弘吉剌部': 'hongirad', '孛儿帖': 'hongirad', '捕鱼儿海': 'hongirad',
        '绰罗斯': 'choros', '绰罗斯氏': 'choros', '瓦剌王族': 'choros', '准噶尔盆地': 'choros',

        // ── 2026-05-26 新增：西域/中亚势力（25个）──
        '喀喇': 'xiliao', '喀喇契丹': 'xiliao', '西辽': 'xiliao', '耶律大石': 'xiliao',
        '喀喇汗': 'kala', '喀喇汗王朝': 'kala', '黑汗': 'kala',
        '龟兹重甲兵': 'qiuci', '伊逻卢': 'qiuci',
        '于阗精兵': 'yuchi', '于阗': 'yuchi',
        '喀喇汗铁骑': 'kala', '阿斯古拉姆': 'kala', '阿斯卡里古拉姆': 'kala', '阿斯卡里': 'kala',
        // 'an' → deleted
        '高昌铁骑': 'gaochang', '阿斯兰军': 'yiduhu', '亦都护': 'yiduhu', '高昌回鹘': 'yiduhu',
        '阿斯兰近卫': 'shule', '盘橐': 'shule', '阿尔斯兰汗': 'shule',
        '焉耆龙骑兵': 'yanqi',
        '乌孙昆莫亲卫': 'wusun', '昆莫亲卫': 'wusun',
        '蒙兀儿铁骑': 'chagatai', '蒙兀儿': 'chagatai',
        '汗血天马骑': 'dayuan', '汗血马': 'dayuan', '贵山城': 'dayuan',

        // ── 2026-06-11 河西远征精锐番号 ──
        '金城突骑': 'lanzhou', '赵充国': 'lanzhou',
        '铁鹞子': 'dangxiang', '元昊': 'dangxiang', '李元昊': 'dangxiang',
        '步跋子': 'weiming',
        '擒生军': 'yeli', '野利遇乞': 'yeli', '野利仁荣': 'yeli',
        '沙州劲旅': 'guiyi', '曹氏': 'guiyi', '沙州曹氏': 'guiyi', '莫高窟': 'guiyi',
        '凉州大马': 'xianlingqiang',
        '南凉铁骑': 'tufa_d', '秃发乌孤': 'tufa_d', '秃发傉檀': 'tufa_d',
        '北凉精锐': 'juqu_d', '沮渠蒙逊': 'juqu_d',
        '凉州突骑': 'liangzhou',
        '大甲重阵': 'liangzhou', '张轨': 'liangzhou', '前凉': 'liangzhou', '姑臧': 'liangzhou', '凉州': 'liangzhou',
        '甘州': 'ganzhou', '张掖': 'ganzhou',
        '肃州': 'suzhou', '酒泉': 'suzhou', '酒泉城': 'suzhou',
        '同州': 'tongzhou', '沙苑': 'tongzhou', '长宁': 'tongzhou',
        '宁寇': 'ningkou', '居延': 'ningkou', '居延塞': 'ningkou',
        '巴音布拉格': 'panjun',
        '表氏': 'juqu_d',
        '甘州铁骑': 'hunxie', '夜落纥': 'hunxie',
        '居延戍卒': 'ningkou',

        // ── 2026-06-11 川蜀远征精锐番号 ──
        '賨人勇士': 'bandun', '板楯蛮': 'bandun', '板楯': 'bandun',
        '白帝城': 'kui', '鱼复': 'kui',
        '巴西劲卒': 'langzhou',
        '连弩士': 'zhuoshi',
        '白杆兵': 'tujia_d', '秦良玉': 'tujia_d',
        '无当飞军': 'yangzhou', '武侯连弩': 'shu', '王平': 'yangzhou', '兴势': 'yangzhou',
        '苻洪': 'fushi', '略阳': 'fushi', '氐族劲卒': 'fushi',
        '吴玠': 'fengzhou', '大散关': 'fengzhou', '蜀口禁军': 'fengzhou', '剑门关': 'lizhou_d', '元从军': 'shu', '诸葛亮': 'shu', '成都': 'shu',
        '岳钟琪': 'cheng', '刘备': 'kui', '白毦兵': 'kui', '白帝城': 'kui',
        '姜维': 'xin2', '南浦': 'xin2',
        '罗罗兵': 'shuixi', '水西': 'shuixi', '安邦彦': 'shuixi', '奢香夫人': 'shuixi',
        '悬棺武士': 'boren', '僰人': 'boren', '珙县': 'boren', '僰道': 'boren',
        '六夷突骑': 'chenghan', '李特': 'chenghan', '李雄': 'chenghan', '成汉': 'chenghan',
        '大西老营': 'daxi_ming', '张献忠': 'daxi_ming', '李定国': 'daxi_ming',
        '莎车左右骑': 'shache', '渠莎': 'shache',
        '葛逻禄背弓': 'geluolu', '葛逻': 'geluolu', '弓月城': 'geluolu',
        '大唐安西军': 'anxi', '安西军': 'anxi', '安西': 'anxi', '安西都护府': 'anxi', '拨换城': 'anxi',

        // ── 2026-06-11 中亚远征精锐（§13 共 14 支）──
        '嚈哒铁骑': 'yanda', '嚈哒': 'yanda', '白匈奴': 'yanda', '阿缓城': 'yanda',
        '萨曼古拉姆': 'saman', '古拉姆': 'saman', '萨曼': 'saman', '萨曼王朝': 'saman', '蒲华': 'saman',
        '花剌子模铁骑': 'huarazim', '钦察精骑': 'huarazim',
        '钦察康里精骑': 'qincha', '钦察': 'qincha', '康里': 'qincha', '七河': 'qincha',
        '帖木儿重装突骑': 'tiemuer', '帖木重装骑': 'tiemuer', '河中怯薛': 'tiemuer', '帖木儿': 'tiemuer', '帖木儿帝国': 'tiemuer', '帖木': 'tiemuer',
        '哈萨克轻骑兵': 'kazakh',

        '吐火罗': 'tokhara', '吐火罗人': 'tokhara', '员渠城': 'tokhara',
        '粟特': 'sogdian', '粟特人': 'sogdian', '粟特商团': 'sogdian', '阿弗拉西阿卜': 'sogdian', '瓦拉赫沙': 'sogdian',
        '塞种': 'sakai', '塞种人': 'sakai', '斯基泰': 'sakai', '特克斯河': 'sakai', '昭苏石人': 'sakai',
        '康居': 'kangju', '康居国': 'kangju', '卑阗城': 'kangju',
        '葛逻禄': 'geluolu', '葛逻禄部': 'geluolu', '怛罗斯': 'geluolu',
        '尉迟': 'yuchi', '尉迟氏': 'yuchi', '伏阇氏': 'yuchi', '于阗王族': 'yuchi', '丹丹乌里克': 'yuchi',
        '麴氏': 'qu_clan', '高昌王族': 'qu_clan', '柏孜克里克': 'qu_clan', '柏孜克里克千佛洞': 'qu_clan',
        '归义军': 'guiyi', '曹氏': 'guiyi', '沙州曹氏': 'guiyi', '莫高窟': 'guiyi',
        // 'an' → deleted
        '石氏': 'shi_clan', '粟特石氏': 'shi_clan', '柘折城': 'shi_clan', '塔什干': 'shi_clan',
        '难兜': 'nandou', '难兜国': 'nandou', '孽多': 'nandou', '孽多城': 'nandou',
        '和卓': 'khoja', '白山派': 'khoja', '阿帕克霍加': 'khoja', '香妃墓': 'khoja',
        '额敏和卓': 'emin', '吐鲁番郡王': 'emin', '苏公塔': 'emin',

        // ── 2026-05-26 新增：青藏高原势力别名（含已有势力补充别名 + 18个新增势力）──
        // 第一类：高原帝国与割据强权（补充已有势力别名）
        '吐蕃': 'tubo', '吐蕃帝国': 'tubo', '逻些': 'tubo', '布达拉宫': 'tubo', '红山': 'tubo',
        '吐谷浑': 'tuyu_d', '吐谷浑汗国': 'tuyu_d', '伏俟城': 'tuyu_d',
        '青唐': 'gusiluo', '青唐城': 'gusiluo',
        '当雄': 'khoshut', '当雄大营': 'khoshut',
        // 第一类：新增势力
        '象雄': 'xiangxiong', '象雄国': 'xiangxiong', '穹窿银城': 'xiangxiong', '苯教': 'xiangxiong', '古象雄': 'xiangxiong',
        '古格': 'guge', '古格王国': 'guge', '扎布让': 'guge', '扎布让城堡': 'guge', '阿里': 'guge',
        '玛域': 'ladakh', '拉达克': 'ladakh', '列城': 'ladakh', '列城皇宫': 'ladakh', '玛域政权': 'ladakh',
        '藏巴汗': 'tsangpa', '藏巴汗政权': 'tsangpa', '桑珠孜': 'tsangpa', '桑珠孜宗堡': 'tsangpa',
        '甘丹颇章': 'gandenpozhang', '甘丹': 'ganden', '哲蚌寺': 'ganden', '五世达赖': 'ganden', '甘丹政权': 'ganden',
        // 第二类：雪域土著与古老强族（补充已有势力别名）
        '赐支河曲': 'qiang',
        '析支': 'dangxiang', '析支故地': 'dangxiang', '党项羌': 'dangxiang',
        // 第二类：新增势力
        '白兰': 'bailan', '白兰羌': 'bailan', '白海堡': 'bailan', '柴达木': 'bailan',
        '羊同': 'yangtong', '羊同国': 'yangtong', '玛旁雍错': 'yangtong', '大羊同': 'yangtong',
        '克里雅': 'keliya', '阿什库尔': 'keliya', '克里雅山口': 'keliya',
        '苏毗': 'supi', '东女国': 'supi', '康延川': 'supi', '苏毗女国': 'supi', '昌都': 'supi', '黑河宗': 'supi',
        '门巴': 'monpa', '门隅': 'monpa', '错那': 'monpa', '门巴族': 'monpa', '达旺': 'monpa',
        '珞巴': 'lopi', '墨脱': 'lopi', '白马狗熊': 'lopi', '雅鲁藏布大峡谷': 'lopi', '珞巴族': 'lopi',
        // 第三类：新增势力
        '悉补野': 'spurgyal', '悉补野氏': 'spurgyal', '吐蕃王族': 'spurgyal', '雍布拉康': 'spurgyal', '雅砻河谷': 'spurgyal',
        '噶尔': 'mgar', '噶尔氏': 'mgar', '禄东赞': 'mgar', '堆龙德庆': 'mgar', '吐蕃权臣': 'mgar', '论钦陵': 'mgar',
        '昆氏': 'khon', '萨迦': 'khon', '萨迦寺': 'khon', '萨迦政权': 'khon', '萨迦班智达': 'khon', '八思巴': 'khon', '昆': 'khon',
        '朗氏': 'lang_clan', '帕竹政权': 'lang_clan', '乃东': 'lang_clan', '泽当': 'lang_clan', '大司徒': 'lang_clan', '朗': 'lang_clan',
        '帕竹': 'pazhu', '江孜': 'pazhu',

        // ── 2026-06-11 青藏远征精锐（§12 共 11 支）──
        '湟中义从羌': 'shaodang', '烧当': 'shaodang', '烧当羌': 'shaodang', '玛曲': 'shaodang',
        '青唐甲骑': 'gusiluo',
        '吐蕃桂级骑': 'tubo', '吐蕃虎皮卫': 'tubo', '桂级骑': 'tubo', '却杰': 'tubo', '却杰军': 'tubo',
        '青海骢精骑': 'tuyu_d', '青海骢': 'tuyu_d',
        '象雄武士': 'xiangxiong',
        '康巴骁骑': 'gar_kham', '朵康兵': 'gar_kham', '德司': 'gar_kham',
        '古格甲兵': 'guge', '札布让': 'guge',
        '和硕特铁骑': 'khoshut',
        '帕竹甲兵': 'pazhu',
        '廓尔喀弯刀': 'gurkha', '廓尔喀勇士': 'gurkha',
        '仁蚌巴': 'ringpung', '仁蚌': 'ringpung', '仁蚌宗': 'ringpung', '仁蚌家族': 'ringpung', '后藏门阀': 'ringpung',
        '拉加里': 'lhagyari', '拉加里王宫': 'lhagyari', '拉加里王系': 'lhagyari', '吐蕃王室直系': 'lhagyari',
        '扎氏': 'zhag', '夏鲁': 'zhag', '夏鲁寺': 'zhag', '夏鲁万户': 'zhag', '扎巴氏': 'zhag',
        '噶玛巴': 'karmapa', '黑帽系': 'karmapa', '楚布寺': 'karmapa', '大宝法王': 'karmapa', '噶玛噶举': 'karmapa', '都松钦巴': 'karmapa',

        // ── 2026-05-26 Phase 3g：云贵高原/岭南/中南半岛/台湾势力 ──
        '阿瓦': 'ava', '阿瓦王朝': 'ava', '阿瓦古城': 'ava',
        '东吁': 'dongxu', '东吁王朝': 'dongxu', '勃固': 'dongxu', '莽瑞体': 'dongxu',
        '白蛮': 'baiman', '白族': 'baiman', '苍山洱海': 'baiman',
        '乌蛮': 'wuman', '彝族先民': 'wuman', '乌蒙': 'wuman',
        '昆明夷': 'kunming_yi', '昆明部落': 'kunming_yi',
        '骠': 'pyu', '骠国': 'pyu', '骠人': 'pyu', '室利差罗': 'pyu',
        '孟族': 'mon', '直通': 'mon', '孟人': 'mon',
        '高氏': 'gao_shi_dali', '弄栋': 'gao_shi_dali', '姚安': 'gao_shi_dali', '高': 'gao_shi_dali',
        '播州杨氏': 'yang_bozhou', '杨应龙': 'yang_bozhou', '海龙屯': 'yang_bozhou',
        '水西安氏': 'an_shuixi', '慕俄格': 'an_shuixi', '奢香': 'an_shuixi',
        '思州田氏': 'tian_sizhou', '田氏土司': 'tian_sizhou', '镇远': 'tian_sizhou',
        '丽江木氏': 'mu_lijiang', '木府': 'mu_lijiang',
        '沐氏': 'mu_qian', '黔国公': 'mu_qian', '沐王府': 'mu_qian', '沐英': 'mu_qian',
        '南汉': 'nanhan', '兴王府': 'nanhan', '刘龑': 'nanhan', '康陵': 'nanhan',
        '瓯雒': 'ouluo', '瓯雒国': 'ouluo', '古螺城': 'ouluo', '安阳王': 'ouluo', '蜀泮': 'ouluo',
        '西山朝': 'nguyen_guangnan',
        '大肚': 'dadu', '大肚王国': 'dadu', '大肚社': 'dadu',
        '明郑': 'ming_zheng', '东宁': 'ming_zheng', '郑成功': 'ming_zheng', '郑经': 'ming_zheng', '热兰遮': 'ming_zheng', '安平': 'ming_zheng',
        '西瓯': 'xiou', '灵渠': 'xiou', '桂林': 'xiou',
        '瑶族': 'yao', '大瑶山': 'yao', '瑶': 'yao',
        '京族': 'jing', '华闾': 'jing', '丁朝': 'jing', '前李': 'jing',
        '芒族': 'muong', '和平省': 'muong',
        '西拉雅': 'siraya', '麻豆': 'siraya',
        '排湾': 'paiwan', '牡丹社': 'paiwan', '牡丹': 'paiwan', '牡丹社事件': 'paiwan',
        '曲氏': 'qu_annam', '曲承裕': 'qu_annam', '龙编': 'qu_annam', '静海': 'qu_annam',
        '郑主': 'trinh', '郑氏': 'trinh', '西都': 'trinh', '清化': 'trinh',
        '阮主': 'nguyen_guangnan', '广南阮氏': 'nguyen_guangnan', '富春': 'nguyen_guangnan',
        '莫氏': 'mac_annam', '莫朝': 'mac_annam', '莫登庸': 'mac_annam', '高平': 'mac_annam',
        '雾峰林家': 'wufeng_lin', '林献堂': 'wufeng_lin',
        '岑氏': 'cen_d', '岑仲淑': 'cen_d', '岑猛': 'cen_d', '凌云': 'cen_d',

        // ── 2026-05-26 Phase 3h：新增賨、僰、谯、折、山越、畲、蒲 ──
        '賨': 'cong', '賨人': 'cong', '板楯蛮': 'cong', '宕渠': 'cong',
        '僰': 'bo', '僰人': 'bo', '僰王山': 'bo', '悬棺': 'bo', '珙县': 'bo',
        '谯': 'langzhou', '谯周': 'langzhou', '谯氏': 'langzhou', '阆中谯氏': 'langzhou', '阆中': 'langzhou', '隆城': 'langzhou',
        '折': 'zhe_d', '折氏': 'zhe_d', '折家将': 'zhe_d', '府州': 'zhe_d', '府谷': 'zhe_d', '折克行': 'zhe_d', '折可适': 'zhe_d', '折继闵': 'zhe_d',
        '山越': 'shanyue', '山越蛮': 'shanyue', '宛陵': 'shanyue', '宣城': 'shanyue',
        '畲': 'she_ethnic', '畲人': 'she_ethnic', '敕木山': 'she_ethnic', '景宁': 'she_ethnic',
        // pu → deleted

        // ── 2026-05-26 Phase 3i：新增朴(新罗门阀)、土(巴人后裔) ──
        '朴': 'piao', '朴氏': 'piao', '新罗朴氏': 'piao', '大陵苑': 'piao', '庆州朴氏': 'piao', '骨品': 'piao',
        '土': 'tu', '土人': 'tu', '土家族': 'tu', '武陵蛮': 'tu', '武陵山区': 'tu', '湘西土人': 'tu',

        // Old term compatibility
        '大秦': 'xiyang',

        // ── 2026-05-28 新增：黑龙江流域民族/家族 ──
        '黑水': 'heishui', '黑水靺鞨': 'heishui', '伯力': 'heishui',
        '那乃': 'nanai', '那乃人': 'nanai', '瓦伦': 'nanai',
        '费雅喀': 'feiyaka', '费雅喀人': 'feiyaka', '奇集': 'feiyaka', '普禄': 'feiyaka',
        '水达达': 'shuidada', '锡尔喀': 'shuidada',
        '尼夫赫': 'nifuhe', '尼夫赫人': 'nifuhe', '盆奴里': 'nifuhe',
        // ── 2026-06-11 新增：外兴安岭/外贝加尔边境 ──
        '茂明安': 'maomingan', '尼布楚': 'maomingan',
        '敖拉': 'aola', '雅克萨': 'aola',
        '绰尔纳': 'chaoer', '格尔必齐': 'chaoer',
        '布拉特': 'bulat', '石勒喀河': 'bulat',
        '布里亚特': 'buriat', '赤塔': 'buriat',

        // ── 2026-05-28 新增：大斗拔谷、伊勒巴斯、南杰、扎敦宗(gandenpozhang) ──
        '大斗拔谷': 'panjun',
        '伊勒巴斯': 'anushidgin', '阿努什的斤': 'anushidgin', '希瓦': 'anushidgin',
        '南杰': 'nanjie', '日土宗': 'nanjie',
        '扎敦宗': 'gandenpozhang', '旧仲巴': 'gandenpozhang',

        // ── 2026-05-28 新增：三陇沙、肩水金关、博尔巴任、莫尔根 ──
        '三陇沙': 'panjun', '肩水金关': 'panjun',
        '博尔巴任': 'wala', '墨尔根城': 'dawoer',

        // ── 2026-05-28 新增：达斡尔、广南国、洞海城、图蒙肯、俚人 ──
        '达斡尔': 'dawoer', '莫尔根': 'dawoer',
 '洞海城': 'panjun',
        '图蒙肯': 'tumengken', '拜达里克': 'tumengken',
        '俚': 'liren', '俚族': 'liren', '珠崖': 'liren',
        '里': 'li_s', '合浦': 'li_s',
        '雷': 'leizhou', '雷州': 'leizhou', '海康': 'leizhou',

        // ── 岭南诸族、中亚王朝、草原部族（旗号与 factions.ts / cities_v2 一致）──
        '墨侬': 'monong', '孟邦': 'monong', '邦敦': 'monong',
        '水真': 'shuizhen', '水真腊': 'shuizhen', '三菩': 'shuizhen',
        '古尔': 'guer', '古尔王朝': 'guer', '马鲁鲁德': 'guer',
        '巴德': 'bade', '巴达赫尚': 'bade', '彭迪': 'bade',
        '乌布萨泊': 'xiajiasi',
        '薛灵哥': 'wuliangha',

        // ── 2026-05-28 新增：岭(结古宗)、琼波(丁青宗)、索伦(卜奎)、图瓦(特斯郭勒卡伦) ──
        '岭': 'gling', '结古宗': 'gling',
        '琼波': 'khyungpo', '丁青宗': 'khyungpo',
        '索伦': 'suolun', '卜奎': 'suolun',
        '图瓦': 'tuva', '唐努': 'tuva', '特斯郭勒卡伦': 'tuva',

        // ── 2026-05-28 新增：大隅(赤尾木城)、奄美(赤木名城) ──
        '大隅': 'osumi', '赤尾木城': 'osumi',
        '奄美': 'anmei', '赤木名城': 'anmei',

        // ── 2026-06-17 新增：真田氏@上田城 ──
        '真田氏': 'sanada_d', '真田': 'sanada_d', '上田城': 'sanada_d', '真田赤备': 'sanada_d',

        // ── 2026-05-28 新增：康区藏族土司/部落 ──
        '达隆': 'dalung', '类乌齐': 'dalung',
        '德格': 'gar_kham',
        '孔萨': 'kongsa', '甘孜': 'kongsa',
        '明正': 'mingzheng', '打箭炉': 'mingzheng',
        '芒康': 'markam', '江卡宗': 'markam',

        // ── 2026-05-28 新增：波密(博窝) ──
        '波密': 'bomi', '博窝': 'bomi',

        // ── 2026-05-28 新增：达擦(八宿宗/康区) ──
        '达擦': 'daca', '八宿宗': 'daca',

        // ── 2026-05-28 新增：景东(银生城/云南) ──
        '景东': 'jingdong', '银生城': 'jingdong',

        // ── 2026-05-28 修复：丽江(独克宗) ──
        '独克宗': 'mu_lijiang',

        // ── 2026-05-28 新增：霍尔(索宗/那曲) ──
        '霍尔': 'hor', '索宗': 'hor',

        // ── 2026-05-28 新增：董(囊谦宗/玉树) ──
        '董': 'dong', '囊谦宗': 'dong',

        // ── 2026-05-28 新增：白狼(巴塘宗/康区) ──
        '白狼': 'bailang', '巴塘宗': 'bailang',

        // ── 2026-05-28 新增：穆(理塘宗/康区) ──
        '穆': 'mu', '理塘宗': 'mu',
    };

    // Mapping Chinese city names to IDs
    private static cityMap: { [key: string]: string } = {
        '长安': 'changan',
        '洛阳': 'luoyang',
        '青州': 'qingzhou',
        '寿春': 'city_shouxian',
        '幽州': 'youzhou',
        '开封': 'kaifeng',
        '新郑': 'xinzheng',
        '邯郸': 'handan',
        '平壤': 'city_pyongyang',
        '龙湾': 'city_longwan'
    };

    public static parse(text: string): HistoricalEvent | null {
        try {
            const year = this.parseYear(text);
            if (year === null) return null;

            // Default to Siege for now based on "攻打"
            if (text.includes('攻打')) {
                return this.parseSiege(text, year);
            } else if (text.includes('野战')) {
                return this.parseFieldBattle(text, year);
            } else {
                return this.parseNarrative(text, year);
            }
        } catch (e) {
            console.error('Failed to parse event text:', e);
            return null;
        }
    }

    private static parseYear(text: string): number | null {
        const match = text.match(/(前|公元前)?(\d+)年/);
        if (!match) return null;
        const isBC = match[1] !== undefined;
        const yearNum = parseInt(match[2]);
        return isBC ? -yearNum : yearNum;
    }

    private static parseSiege(text: string, year: number): HistoricalEvent {
        // Example: [秦]王翦攻打[赵]邯郸
        // Regex to extract content between brackets
        const factions = text.match(/\[(.*?)\]/g);
        let attackerFactionId = 'UNKNOWN';

        if (factions && factions.length > 0) {
            const attackerName = factions[0].replace(/[\[\]]/g, '');
            attackerFactionId = this.factionMap[attackerName] || 'UNKNOWN';
        }

        // Find city name
        let cityId = 'UNKNOWN';
        for (const [name, id] of Object.entries(this.cityMap)) {
            if (text.includes(name)) {
                cityId = id;
                break;
            }
        }

        return {
            year: year,
            season: 0, // Default Spring
            description: text,
            type: 'siege',
            siegeData: {
                attackerFactionId: attackerFactionId,
                defenderCityId: cityId,
            }
        };
    }

    private static parseFieldBattle(text: string, year: number): HistoricalEvent {
        // Placeholder for field battle parsing
        // Need to extract attacker, defender, and location
        // For now, returning a placeholder structure
        return {
            year: year,
            season: 0,
            description: text,
            type: 'field_battle',
            fieldBattleData: {
                attackerFactionId: 'UNKNOWN',
                defenderFactionId: 'UNKNOWN',
                location: { lat: 0, lng: 0 }, // Needs manual setting or map click
                result: 'attacker_win'
            }
        };
    }

    private static parseNarrative(text: string, year: number): HistoricalEvent {
        return {
            year: year,
            season: 0,
            description: text,
            type: 'field_battle',
            fieldBattleData: {
                attackerFactionId: 'UNKNOWN',
                defenderFactionId: 'UNKNOWN',
                isNarrative: true,
                location: { lat: 34.27, lng: 108.94 }
            }
        };
    }
}
