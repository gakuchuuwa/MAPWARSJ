/**
 * 势力将领：势力史实将领档案（一势力一将领一立绘，AI 也有）。
 *
 * 设计定案（GAME_DIRECTION.md；录入 AGENTS §2.2.0）：
 *   **一切以据点为基准**录入势力/武将；档案绑 factionId 仅为实现索引。
 *   **出场**：将/精随 **据点 cityId**（`getCityAnchoredGeneral`）；旗号随占城。
 *   例：长子→上党→白起；天水→秦→嬴稷（各城独立，禁止因白起反推秦@长子）。
 *   **互斥**——军团已带将则据点守城不得再掷将；城防已掷将则军团不得再带；共用 `City.spawnGeneralUsed`。
 *   番号随城见 ExpeditionLegions.CITY_ELITE_LEGIONS / getLegionEliteLegionName。
 *
 * 载体规则（LegionManager 维护）：
 *   锚点据点范围内，**同一将领**不能同时挂在军团与城防；全局仍守「一势力同时仅一支军团扛将」。
 *
 * 武将技生效：GeneralSkillCombat 门禁只看「军团是否带 generalId 且该 id 有档案」，
 *   不再要求跟随/远征——故 AI 将领同样触发，攻守双方各自结算。
 *
 * ── 添加新将领（三步）────────────────────────────────────────
 *   1. 本表加一行：factionId → { generalId, generalName, portrait }
 *      portrait = 专图预留路径（通常 {政权夹}/{factionId}_{generalId}.png）；无文件时
 *      自动 fallback：政权夹随机 → 文化夹随机（见 AGENTS.md §十三，禁止跨区乱抽）
 *   2. GeneralSkills.ts 的 GENERAL_PROFILES 加 generalId 的武将技档案（不加则技能不触发）
 *   3. 立绘 PNG → 写入对应素材夹 <code>{generalId}.png</code>（F2 绑定）；F2 可校正位置
 *
 * 红线：一势力一将领；专图文件名全局唯一；fallback 仅限本政权夹与本文化夹。
 */

import { resolveGeneralPortraitPath } from '../config/portrait_defaults';

export interface FactionGeneral {
    /** 将领 id（须在 GENERAL_PROFILES 有档案，否则武将技不触发） */
    generalId: string;
    /** 将领名（军情/日志显示） */
    generalName: string;
    /** 将领立绘路径 */
    portrait: string;
}

/** factionId → 开局将领。先做秦/白起跑通，其余知名势力逐个补。 */
export const FACTION_GENERALS: Readonly<Record<string, FactionGeneral>> = {
    qin: { generalId: 'qin_yingji', generalName: '嬴稷', portrait: '/assets/yingqin/qin_yingji.png' },
    tang: { generalId: 'tang_lishimin', generalName: '李世民', portrait: '/assets/litang/tang_lishimin.png' },
    wuzhou_d: { generalId: 'wuzhou_d_wuzetian', generalName: '武则天', portrait: '/assets/wuzhou/wuzhou_d_wuzetian.png' },
        ming_d: { generalId: 'ming_d_zhudi', generalName: '朱棣', portrait: '/assets/daming/ming_d_zhudi.png' },
    jinling: { generalId: 'jinling_tandaoji', generalName: '檀道济', portrait: '/assets/JIANGNAN/jinling_tandaoji.png' },
    guangzhou: { generalId: 'guangzhou_liuyin', generalName: '刘隐', portrait: '/assets/LINGNAN/guangzhou_liuyin.png' },
    shu: { generalId: 'shu_zhugeliang', generalName: '诸葛亮', portrait: '/assets/BASHU/shu_zhugeliang.png' },
    yangzhou: { generalId: 'yangzhou_wangping', generalName: '王平', portrait: '/assets/BASHU/yangzhou_wangping.png' },
    yang_zhou: { generalId: 'yang_zhou_yangxingmi', generalName: '杨行密', portrait: '/assets/JIANGNAN/yang_zhou_yangxingmi.png' },
    // cheng 阳安：岳钟琪已迁赤斤@赤金堡
    pagan: { generalId: 'pagan_anuluvtuo', generalName: '阿奴律陀', portrait: '/assets/DIANQIAN/pagan_anuluvtuo.png' },
    liang_d: { generalId: 'liang_d_zhangxun', generalName: '张巡', portrait: '/assets/litang/liang_d_zhangxun.png' },
    qiuci: { generalId: 'qiuci_baiba', generalName: '白霸', portrait: '/assets/WESTERN/qiuci_baiba.png' },
    tubo: { generalId: 'tubo_songzanganbu', generalName: '松赞干布', portrait: '/assets/TIBET/tubo_songzanganbu.png' },
    menggu_d: { generalId: 'menggu_d_chengjisihan', generalName: '成吉思汗', portrait: '/assets/STEPPE/menggu_d_chengjisihan.png' },
    bohai: { generalId: 'bohai_dazuorong', generalName: '大祚荣', portrait: '/assets/NORTHEAST/bohai_dazuorong.png' },
    goryeo: { generalId: 'goryeo_jiangganzan', generalName: '姜邯赞', portrait: '/assets/KOREA/goryeo_jiangganzan.png' },
    ashikaga: { generalId: 'ashikaga_zulijunshi', generalName: '足利尊氏', portrait: '/assets/JAPAN/ashikaga_zulijunshi.png' },
    tiemuer: { generalId: 'tiemuer_tiemuer', generalName: '帖木儿', portrait: '/assets/CENTRAL_ASIA/tiemuer_tiemuer.png' },
    siam: { generalId: 'siam_nalixuan', generalName: '纳黎萱', portrait: '/assets/pugan/siam_nalixuan.png' },
    shang: { generalId: 'shang_fuhao', generalName: '妇好', portrait: '/assets/xianqin/shang_fuhao.png' },
    bing: { generalId: 'bing_liukun', generalName: '刘琨', portrait: '/assets/CENTRAL/bing_liukun.png' },
    min: { generalId: 'min_wangshenzhi', generalName: '王审知', portrait: '/assets/JIANGNAN/min_wangshenzhi.png' },
    quanzhou: { generalId: 'quanzhou_liucongxiao', generalName: '留从效', portrait: '/assets/JIANGNAN/quanzhou_liucongxiao.png' },
    han_d: { generalId: 'han_d_liubang', generalName: '刘邦', portrait: '/assets/liuhan/han_d_liubang.png' },
    wei: { generalId: 'wei_wuqi', generalName: '吴起', portrait: '/assets/xianqin/wei_wuqi.png' },
    manzhou_d: { generalId: 'manzhou_d_duergan', generalName: '多尔衮', portrait: '/assets/manqing/manzhou_d_duergan.png' },
    xinluo: { generalId: 'xinluo_jinyixin', generalName: '金庾信', portrait: '/assets/KOREA/baiji_jiebai.png' },
    edo: { generalId: 'edo_dechuangjiakang', generalName: '德川家康', portrait: '/assets/JAPAN/edo_dechuangjiakang.png' },
    seljuq: { generalId: 'seljuq_sangjiaer', generalName: '桑贾尔', portrait: '/assets/CENTRAL_ASIA/seljuq_sangjiaer.png' },
    chenla: { generalId: 'chenla_sheyebamoqishi', generalName: '阇耶跋摩七世', portrait: '/assets/pugan/chenla_sheyebamoqishi.png' },
    sizhou: { generalId: 'sizhou_hanshizhong', generalName: '韩世忠', portrait: '/assets/zhaosong/sizhou_hanshizhong.png' },
    // ── 日本区 2026-06-18 ──
    kai: { generalId: 'kai_wutianxinxuan', generalName: '武田信玄', portrait: '/assets/JAPAN/kai_wutianxinxuan.png' },
    echigo: { generalId: 'echigo_shangshanqianxin', generalName: '上杉谦信', portrait: '/assets/JAPAN/echigo_shangshanqianxin.png' },
    hashiba: { generalId: 'hashiba_fengchenxiuji', generalName: '丰臣秀吉', portrait: '/assets/JAPAN/hashiba_fengchenxiuji.png' },
    sanada_d: { generalId: 'sanada_d_zhentianxingcun', generalName: '真田幸村', portrait: '/assets/JAPAN/sanada_d_zhentianxingcun.png' },
    date_d: { generalId: 'date_d_yidazhengzong', generalName: '伊达政宗', portrait: '/assets/JAPAN/date_d_yidazhengzong.png' },
    owari: { generalId: 'owari_zhitianxinchang', generalName: '织田信长', portrait: '/assets/JAPAN/owari_zhitianxinchang.png' },
    totomi: { generalId: 'totomi_sakaitadatsugu', generalName: '酒井忠次', portrait: '/assets/JAPAN/totomi_sakaitadatsugu.png' },
    jinchuan: { generalId: 'jinchuan_jinchuanyiyuan', generalName: '今川义元', portrait: '/assets/JAPAN/jinchuan_jinchuanyiyuan.png' },
    aki: { generalId: 'aki_maoliyuanjiu', generalName: '毛利元就', portrait: '/assets/JAPAN/aki_maoliyuanjiu.png' },
    chosokabe: { generalId: 'chosokabe_changzongwobuyuanqin', generalName: '长宗我部元亲', portrait: '/assets/JAPAN/chosokabe_changzongwobuyuanqin.png' },
    satsuma: { generalId: 'satsuma_daojinjiajiu', generalName: '岛津家久', portrait: '/assets/JAPAN/satsuma_daojinjiajiu.png' },
    otomo_d: { generalId: 'otomo_d_lihuadaoxue', generalName: '立花道雪', portrait: '/assets/JAPAN/otomo_d_lihuadaoxue.png' },
    izumo: { generalId: 'izumo_shanzhonglujie', generalName: '山中鹿介', portrait: '/assets/JAPAN/izumo_shanzhonglujie.png' },
    kaga_d: { generalId: 'kaga_d_xiajianlaizheng', generalName: '下间赖廉', portrait: '/assets/JAPAN/kaga_d_xiajianlaizheng.png' },
    iga_d: { generalId: 'iga_d_baididanbo', generalName: '百地丹波', portrait: '/assets/JAPAN/iga_d_baididanbo.png' },
    jibei2: { generalId: 'jibei2_qingshuizongzhi', generalName: '清水宗治', portrait: '/assets/JAPAN/jibei2_qingshuizongzhi.png' },
    yamato: { generalId: 'yamato_nanmuzhengcheng', generalName: '楠木正成', portrait: '/assets/JAPAN/yamato_nanmuzhengcheng.png' },
    aizu: { generalId: 'aizu_pushengshixiang', generalName: '蒲生氏乡', portrait: '/assets/JAPAN/aizu_pushengshixiang.png' },
    suwa_d: { generalId: 'suwa_d_zoufanglaizhong', generalName: '诹访赖重', portrait: '/assets/JAPAN/suwa_d_zoufanglaizhong.png' },
    shimotsuke: { generalId: 'shimotsuke_yudugongguanggang', generalName: '宇都宫广纲', portrait: '/assets/JAPAN/shimotsuke_yudugongguanggang.png' },
    higo_d: { generalId: 'higo_d_juchiwuguang', generalName: '菊池武光', portrait: '/assets/JAPAN/jinchuan_jinchuanyiyuan.png' },
    iyo_d: { generalId: 'iyo_d_cunshangwuji', generalName: '村上武吉', portrait: '/assets/JAPAN/iyo_d_cunshangwuji.png' },
    nanbu: { generalId: 'nanbu_nanbuqingzheng', generalName: '南部晴政', portrait: '/assets/JAPAN/nanbu_nanbuqingzheng.png' },
    osumi: { generalId: 'osumi_ganfujianxu', generalName: '肝付兼续', portrait: '/assets/JAPAN/osumi_ganfujianxu.png' },
    fujiwara: { generalId: 'fujiwara_yuanyijing', generalName: '源义经', portrait: '/assets/JAPAN/fujiwara_yuanyijing.png' },
    kakizaki: { generalId: 'kakizaki_liqiqingguang', generalName: '蛎崎庆广', portrait: '/assets/JAPAN/kakizaki_liqiqingguang.png' },
    ayinu: { generalId: 'ayinu_hushemoquan', generalName: '胡奢魔犬', portrait: '/assets/JAPAN/ayinu_hushemoquan.png' },
    so: { generalId: 'so_zongyizhi', generalName: '宗义智', portrait: '/assets/JAPAN/so_zongyizhi.png' },
    taira: { generalId: 'taira_pingzhisheng', generalName: '平知盛', portrait: '/assets/JAPAN/taira_pingzhisheng.png' },
        lelang: { generalId: 'lelang_wangqi', generalName: '王颀', portrait: '/assets/KOREA/lelang_wangqi.png' },
    anmei: { generalId: 'anmei_yuwandaqin', generalName: '与湾大亲', portrait: '/assets/JAPAN/anmei_yuwandaqin.png' },

// ── 朝鲜区 2026-06-18 ──
    chen3: { generalId: 'chen3_chenwang', generalName: '箕准', portrait: '/assets/KOREA/chen3_chenwang.png' },
    joseon: { generalId: 'joseon_lichenggui', generalName: '李成桂', portrait: '/assets/KOREA/joseon_lichenggui.png' },
    gaogouli: { generalId: 'gaogouli_yizhiwende', generalName: '乙支文德', portrait: '/assets/KOREA/gaogouli_yizhiwende.png' },
    baiji: { generalId: 'baiji_jiebai', generalName: '阶伯', portrait: '/assets/KOREA/baiji_jiebai.png' },
    zhen: { generalId: 'zhen_zhenxuan', generalName: '甄萱', portrait: '/assets/KOREA/zhen_zhenxuan.png' },
    danluo: { generalId: 'danluo_jintongjing', generalName: '金通精', portrait: '/assets/KOREA/danluo_jintongjing.png' },
    sambyeol: { generalId: 'sambyeol_lishunchen', generalName: '李舜臣', portrait: '/assets/KOREA/sambyeol_lishunchen.png' },
    hai2: { generalId: 'hai2_zhengdi', generalName: '郑地', portrait: '/assets/KOREA/hai2_zhengdi.png' },
    gaya: { generalId: 'gaya_jinshoulu', generalName: '金首露', portrait: '/assets/KOREA/gaya_jinshoulu.png' },

    xuantu: { generalId: 'xuantu_yuangaisuwen', generalName: '渊盖苏文', portrait: '/assets/KOREA/xuantu_yuangaisuwen.png' },
    naju_d: { generalId: 'naju_d_wangjian_kr', generalName: '王建', portrait: '/assets/KOREA/naju_d_wangjian_kr.png' },
    chungju_d: { generalId: 'chungju_d_quanli', generalName: '权栗', portrait: '/assets/KOREA/chungju_d_quanli.png' },
    sabeol: { generalId: 'sabeol_jinshimin', generalName: '金时敏', portrait: '/assets/KOREA/sabeol_jinshimin.png' },
        huimo: { generalId: 'huimo_gaoyanshou', generalName: '高延寿', portrait: '/assets/NORTHEAST/huimo_gaoyanshou.png' },
    aola: { generalId: 'aola_menglielun', generalName: '孟烈伦', portrait: '/assets/NORTHEAST/aola_menglielun.png' },
    ewenki: { generalId: 'ewenki_bombogor', generalName: '博木博果尔', portrait: '/assets/NORTHEAST/ewenki_bombogor.png' },
    haixi_nvzhen: { generalId: 'haixi_nvzhen_baiyindali', generalName: '拜音达里', portrait: '/assets/NORTHEAST/haixi_nvzhen_baiyindali.png' },
    dazhen: { generalId: 'dazhen_wanyantiege', generalName: '完颜铁哥', portrait: '/assets/NORTHEAST/dazhen_wanyantiege.png' },
    yehe: { generalId: 'yehe_jintaiji', generalName: '金台吉', portrait: '/assets/NORTHEAST/yehe_jintaiji.png' },

guishuang: { generalId: 'guishuang_qiuqiujiu', generalName: '丘就却', portrait: '/assets/WESTERN/guishuang_qiuqiujiu.png' },
    qidan: { generalId: 'qidan_yelueabaoji', generalName: '耶律阿保机', portrait: '/assets/NORTH/qidan_yelueabaoji.png' },
    hui: { generalId: 'hui_gulipeiluo', generalName: '骨力裴罗', portrait: '/assets/NORTH/hui_gulipeiluo.png' },
// ── 东北区 2026-06-18 ──
    jilizhou: { generalId: 'jilizhou_chengmingzhen', generalName: '程名振', portrait: '/assets/NORTHEAST/jilizhou_chengmingzhen.png' },
    nuergan: { generalId: 'nuergan_kangwang', generalName: '康旺', portrait: '/assets/NORTHEAST/nuergan_kangwang.png' },
    manzhou: { generalId: 'manzhou_nuerhachi', generalName: '努尔哈赤', portrait: '/assets/NORTHEAST/manzhou_nuerhachi.png' },

    wuliangha: { generalId: 'wuliangha_zhelemei', generalName: '者勒蔑', portrait: '/assets/NORTHEAST/wuliangha_zhelemei.png' },
    fuyu: { generalId: 'fuyu_weichoutai', generalName: '尉仇台', portrait: '/assets/NORTHEAST/fuyu_weichoutai.png' },
    dajin: { generalId: 'dajin_wanyanaguda', generalName: '阿骨打', portrait: '/assets/NORTHEAST/dajin_wanyanaguda.png' },
    yizhou: { generalId: 'yizhou_wanyanloushi', generalName: '完颜娄室', portrait: '/assets/NORTHEAST/yizhou_wanyanloushi.png' },
    aisin_d: { generalId: 'aisin_d_huangtaiji', generalName: '皇太极', portrait: '/assets/NORTHEAST/aisin_d_huangtaiji.png' },
    xianbei: { generalId: 'xianbei_tuobamao', generalName: '拓跋毛', portrait: '/assets/NORTHEAST/xianbei_tuobamao.png' },
    suolun: { generalId: 'suolun_bomuboguoer', generalName: '博穆博果尔', portrait: '/assets/NORTHEAST/suolun_bomuboguoer.png' },
    dongxia: { generalId: 'dongxia_puxianwannu', generalName: '蒲鲜万奴', portrait: '/assets/NORTHEAST/dongxia_puxianwannu.png' },
    wula: { generalId: 'wula_buzhantai', generalName: '布占泰', portrait: '/assets/NORTHEAST/wula_buzhantai.png' },
    dada_ming: { generalId: 'dada_ming_dayanhan', generalName: '达延汗', portrait: '/assets/STEPPE/dada_ming_dayanhan.png' },
    keerqin: { generalId: 'keerqin_aoba', generalName: '奥巴', portrait: '/assets/NORTHEAST/keerqin_aoba.png' },
    wure: { generalId: 'wure_wuzhaodu', generalName: '乌昭度', portrait: '/assets/NORTHEAST/wure_wuzhaodu.png' },
    houliao: { generalId: 'houliao_yelvliuge', generalName: '耶律留哥', portrait: '/assets/NORTHEAST/houliao_yelvliuge.png' },
    heishui: { generalId: 'heishui_nishuli', generalName: '倪属利稽', portrait: '/assets/NORTHEAST/keerqin_aoba.png' },
    heisha_d: { generalId: 'heisha_d_houlilu', generalName: '呴犁湖', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    hezhe: { generalId: 'hezhe_sharhuda', generalName: '沙尔虎达', portrait: '/assets/NORTHEAST/keerqin_aoba.png' },
    dawoer: { generalId: 'dawoer_baldaqi', generalName: '巴尔达齐', portrait: '/assets/NORTHEAST/keerqin_aoba.png' },
    mohe: { generalId: 'mohe_wanyanzonghan', generalName: '完颜宗翰', portrait: '/assets/NORTHEAST/mohe_wanyanzonghan.png' },
    yeren_nvzhen: { generalId: 'yeren_nvzhen_boke', generalName: '博克', portrait: '/assets/NORTHEAST/yeren_nvzhen_boke.png' },
    wuji: { generalId: 'wuji_yilizhi', generalName: '乙力支', portrait: '/assets/NORTHEAST/wuji_yilizhi.png' },
    jilin: { generalId: 'jilin_fujun', generalName: '富俊', portrait: '/assets/NORTHEAST/jilin_fujun.png' },
    dongdan: { generalId: 'dongdan_yelvbei', generalName: '耶律倍', portrait: '/assets/NORTHEAST/dongdan_yelvbei.png' },
    kuye: { generalId: 'kuye_kuye_qiuzhang', generalName: '齐查伊', portrait: '/assets/NORTHEAST/kuye_kuye_qiuzhang.png' },
    sushen: { generalId: 'sushen_tudiji', generalName: '突地稽', portrait: '/assets/NORTHEAST/sushen_tudiji.png' },
    yilou: { generalId: 'yilou_naoya', generalName: '恼犽', portrait: '/assets/NORTHEAST/yilou_naoya.png' },
    maomingan: { generalId: 'maomingan_gentemuer', generalName: '根特木尔', portrait: '/assets/NORTHEAST/maomingan_gentemuer.png' },
    jilimi: { generalId: 'jilimi_takuna', generalName: '塔库纳', portrait: '/assets/NORTHEAST/jilimi_takuna.png' },
    eluoke: { generalId: 'eluoke_amuhar', generalName: '阿穆哈尔', portrait: '/assets/NORTHEAST/eluoke_amuhar.png' },
    nifuhe: { generalId: 'nifuhe_barhudai', generalName: '巴尔虎代', portrait: '/assets/NORTHEAST/nifuhe_barhudai.png' },
    feiyaka: { generalId: 'feiyaka_cemutehe', generalName: '策穆特赫', portrait: '/assets/NORTHEAST/feiyaka_cemutehe.png' },
    nanai: { generalId: 'nanai_zhahaluo', generalName: '扎哈罗', portrait: '/assets/NORTHEAST/nanai_zhahaluo.png' },
    woju: { generalId: 'woju_yinguan', generalName: '尹瓘', portrait: '/assets/KOREA/woju_yinguan.png' },
    luzhou: { generalId: 'luzhou_zhangwenxiu', generalName: '张文休', portrait: '/assets/KOREA/luzhou_zhangwenxiu.png' },
    jurchen: { generalId: 'jurchen_wanyanzongbi', generalName: '完颜宗弼', portrait: '/assets/NORTHEAST/jurchen_wanyanzongbi.png' },
        // ── 草原关隘 ──
    wuzhou: { generalId: 'wuzhou_liguang', generalName: '李广', portrait: '/assets/STEPPE/wuzhou_liguang.png' },
    ashina: { generalId: 'ashina_ashinayandu', generalName: '阿史那燕都', portrait: '/assets/STEPPE/ashina_ashinayandu.png' },
    wala: { generalId: 'wala_yexian', generalName: '也先', portrait: '/assets/STEPPE/wala_yexian.png' },
    yuwen: { generalId: 'yuwen_yuwentai', generalName: '宇文泰', portrait: '/assets/STEPPE/yuwen_yuwentai.png' },
    chenli_d: { generalId: 'chenli_d_wutang', generalName: '吴棠', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    nuoyan_d: { generalId: 'nuoyan_d_sanyinnuoyan', generalName: '三音诺颜', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    wuli_d: { generalId: 'wuli_d_celeng', generalName: '策楞', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    jiluo_d: { generalId: 'jiluo_d_douxian', generalName: '窦宪', portrait: '/assets/STEPPE/jiluo_d_douxian.png' },
// ── 草原区 2026-06-18 ──
    liao_d: { generalId: 'liao_d_yelvabaoji', generalName: '阿保机', portrait: '/assets/STEPPE/liao_d_yelvabaoji.png' },
    yel: { generalId: 'yel_yelvxiuge', generalName: '耶律休哥', portrait: '/assets/STEPPE/yel_yelvxiuge.png' },
    kumoxi: { generalId: 'kumoxi_ahuihui', generalName: '阿会毁', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    kumo: { generalId: 'kumo_xiwanghuilibao', generalName: '回离保', portrait: '/assets/STEPPE/kumo_xiwanghuilibao.png' },
    geluolu: { generalId: 'geluolu_chisipijia', generalName: '炽俟毗伽', portrait: '/assets/STEPPE/geluolu_chisipijia.png' },
    ogodei: { generalId: 'ogodei_chuormahan', generalName: '绰儿马罕', portrait: '/assets/STEPPE/ogodei_chuormahan.png' },
    merkit: { generalId: 'merkit_tuoheituoa', generalName: '脱黑脱阿', portrait: '/assets/STEPPE/merkit_tuoheituoa.png' },
    tumed: { generalId: 'tumed_andahan', generalName: '俺答汗', portrait: '/assets/STEPPE/yuan_d_hubilie.png' },
    kiyad: { generalId: 'kiyad_yesugai', generalName: '也速该', portrait: '/assets/STEPPE/kiyad_yesugai.png' },
    xiajiasi: { generalId: 'xiajiasi_are', generalName: '阿热', portrait: '/assets/STEPPE/xiajiasi_are.png' },
    xiongnu: { generalId: 'xiongnu_maodun', generalName: '冒顿', portrait: '/assets/STEPPE/xiongnu_maodun.png' },
        murong: { generalId: 'murong_murongke', generalName: '慕容恪', portrait: '/assets/NORTH/murong_murongke.png' },
    wuhuan: { generalId: 'wuhuan_tadun', generalName: '蹋顿', portrait: '/assets/STEPPE/wuhuan_tadun.png' },
    yuan_d: { generalId: 'yuan_d_hubilie', generalName: '忽必烈', portrait: '/assets/STEPPE/yuan_d_hubilie.png' },
    mengwu: { generalId: 'mengwu_hebulerhan', generalName: '合不勒汗', portrait: '/assets/STEPPE/mengwu_hebulerhan.png' },
    shaodang: { generalId: 'shaodang_mitang', generalName: '迷唐', portrait: '/assets/TIBET/shaodang_mitang.png' },
    shatuo: { generalId: 'shatuo_likeyong', generalName: '李克用', portrait: '/assets/CENTRAL/shatuo_likeyong.png' },
    xueyantuo: { generalId: 'xueyantuo_yinan', generalName: '夷男', portrait: '/assets/STEPPE/xueyantuo_yinan.png' },

    huige: { generalId: 'huige_gulipeiluo', generalName: '骨力裴罗', portrait: '/assets/STEPPE/huige_gulipeiluo.png' },
    kereyid: { generalId: 'kereyid_wanghan', generalName: '王汗', portrait: '/assets/STEPPE/kereyid_wanghan.png' },
    naiman: { generalId: 'naiman_taiyanghan', generalName: '太阳汗', portrait: '/assets/STEPPE/naiman_taiyanghan.png' },
    tatar: { generalId: 'tatar_mieguzhen', generalName: '蔑古真·薛兀勒图', portrait: '/assets/STEPPE/tatar_mieguzhen.png' },
    tushetu: { generalId: 'tushetu_tuxietuhan', generalName: '土谢图汗衮布', portrait: '/assets/STEPPE/tushetu_tuxietuhan.png' },
    zhasaketu: { generalId: 'zhasaketu_zhasaketuhan', generalName: '扎萨克图汗素巴第', portrait: '/assets/STEPPE/zhasaketu_zhasaketuhan.png' },
    gaoche: { generalId: 'gaoche_afuzhiluo', generalName: '阿伏至罗', portrait: '/assets/STEPPE/gaoche_afuzhiluo.png' },
    tujue: { generalId: 'tujue_ashinatumen', generalName: '阿史那土门', portrait: '/assets/STEPPE/tujue_ashinatumen.png' },
    da_yuan: { generalId: 'da_yuan_kuokuotiemuer', generalName: '扩廓帖木儿', portrait: '/assets/STEPPE/da_yuan_kuokuotiemuer.png' },
    yujiulu: { generalId: 'yujiulu_yujiulv', generalName: '郁久闾大檀', portrait: '/assets/STEPPE/yujiulu_yujiulv.png' },
    yaoluoge: { generalId: 'yaoluoge_yaoluogepusa', generalName: '药罗葛菩萨', portrait: '/assets/STEPPE/yaoluoge_yaoluogepusa.png' },
    jalair: { generalId: 'jalair_muhuali', generalName: '木华黎', portrait: '/assets/STEPPE/jalair_muhuali.png' },
    hongirad: { generalId: 'hongirad_dexuechan', generalName: '德薛禅', portrait: '/assets/STEPPE/hongirad_dexuechan.png' },
    choros: { generalId: 'choros_tuohuan', generalName: '脱欢', portrait: '/assets/STEPPE/choros_tuohuan.png' },
    tiele: { generalId: 'tiele_qibiheli', generalName: '契苾何力', portrait: '/assets/STEPPE/tiele_qibiheli.png' },
    ashide: { generalId: 'ashide_ashidejieli', generalName: '阿史德颉利', portrait: '/assets/STEPPE/ashide_ashidejieli.png' },
    duolu: { generalId: 'duolu_ashinahelu', generalName: '阿史那贺鲁', portrait: '/assets/STEPPE/duolu_ashinahelu.png' },
    cheshihou: { generalId: 'cheshihou_cheshihouwang', generalName: '安归', portrait: '/assets/STEPPE/cheshihou_cheshihouwang.png' },
    kaerka: { generalId: 'kaerka_abadaikehan', generalName: '阿巴岱汗', portrait: '/assets/STEPPE/kaerka_abadaikehan.png' },
    huyan: { generalId: 'huyan_huyanwang', generalName: '裴岑', portrait: '/assets/STEPPE/huyan_huyanwang.png' },
    chahar: { generalId: 'chahar_lindanhan', generalName: '林丹汗', portrait: '/assets/STEPPE/chahar_lindanhan.png' },
    ongut: { generalId: 'ongut_alagusi', generalName: '阿剌兀思', portrait: '/assets/STEPPE/ongut_alagusi.png' },
    rouran: { generalId: 'rouran_shelun', generalName: '社仑', portrait: '/assets/STEPPE/rouran_shelun.png' },
    chagatai: { generalId: 'chagatai_tuhulutiemuer', generalName: '秃忽鲁帖木儿', portrait: '/assets/WESTERN/chagatai_tuhulutiemuer.png' },
    huihu: { generalId: 'huihu_dongmohedagan', generalName: '顿莫贺达干', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    kelie: { generalId: 'kelie_zhaheganbu', generalName: '札合敢不', portrait: '/assets/STEPPE/kelie_zhaheganbu.png' },
    pugu: { generalId: 'pugu_puguhuaien', generalName: '仆固怀恩', portrait: '/assets/STEPPE/pugu_puguhuaien.png' },
    pulei: { generalId: 'pulei_dougu', generalName: '窦固', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    xibo_d: { generalId: 'xibo_d_zakulan', generalName: '扎库兰', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    borjigin: { generalId: 'borjigin_tuolei', generalName: '拖雷', portrait: '/assets/STEPPE/borjigin_tuolei.png' },
    zhadalan: { generalId: 'zhadalan_zhamuhe', generalName: '札木合', portrait: '/assets/STEPPE/zhadalan_zhamuhe.png' },
    zhuerqi: { generalId: 'zhuerqi_sachabieqi', generalName: '撒察别乞', portrait: '/assets/STEPPE/zhuerqi_sachabieqi.png' },
    chechen: { generalId: 'chechen_chechenhanshuolei', generalName: '车臣汗硕垒', portrait: '/assets/STEPPE/chechen_chechenhanshuolei.png' },
    tumengken: { generalId: 'tumengken_tumengken', generalName: '图蒙肯', portrait: '/assets/STEPPE/tumengken_tumengken.png' },
    bayegu: { generalId: 'bayegu_qulishi', generalName: '屈利失', portrait: '/assets/STEPPE/bayegu_qulishi.png' },
    zubu: { generalId: 'zubu_mogusi', generalName: '磨古斯', portrait: '/assets/STEPPE/zubu_mogusi.png' },
    wuzhumuqin: { generalId: 'wuzhumuqin_duoerji', generalName: '多尔济', portrait: '/assets/STEPPE/wuzhumuqin_duoerji.png' },
    baidi: { generalId: 'baidi_baidibushuai', generalName: '白狄子', portrait: '/assets/STEPPE/baidi_baidibushuai.png' },
    shiwei: { generalId: 'shiwei_saigou', generalName: '塞呴', portrait: '/assets/STEPPE/shiwei_saigou.png' },
    sunite: { generalId: 'sunite_sunitezasake', generalName: '叟塞', portrait: '/assets/STEPPE/sunite_sunitezasake.png' },
    bulat: { generalId: 'bulat_boduanchaer', generalName: '孛端察儿', portrait: '/assets/STEPPE/bulat_boduanchaer.png' },
    tuva: { generalId: 'tuva_qinggunzabu', generalName: '青滚杂卜', portrait: '/assets/STEPPE/tuva_qinggunzabu.png' },
        // ── 西域关隘 ──
    hepan: { generalId: 'hepan_peishenfu', generalName: '裴神符', portrait: '/assets/WESTERN/hepan_peishenfu.png' },
    yiwu: { generalId: 'yiwu_hanshen', generalName: '罕慎', portrait: '/assets/WESTERN/yiwu_hanshen.png' },
    kepantuo: { generalId: 'kepantuo_hanritianzhong', generalName: '阇梨密', portrait: '/assets/WESTERN/kepantuo_hanritianzhong.png' },
    huite: { generalId: 'huite_amuersana', generalName: '阿睦尔撒纳', portrait: '/assets/WESTERN/huite_amuersana.png' },
    tuoming: { generalId: 'tuoming_tuomin', generalName: '妥明', portrait: '/assets/WESTERN/tuoming_tuomin.png' },
    chuyue: { generalId: 'chuyue_shatuonasu', generalName: '沙陀那速', portrait: '/assets/WESTERN/chuyue_shatuonasu.png' },
    keerkezi: { generalId: 'keerkezi_manasi', generalName: '玛纳斯', portrait: '/assets/WESTERN/keerkezi_manasi.png' },
    pisha: { generalId: 'pisha_yuchisheng', generalName: '尉迟胜', portrait: '/assets/WESTERN/pisha_yuchisheng.png' },
    xingxingxia: { generalId: 'xingxingxia_guoxiaoke', generalName: '郭孝恪', portrait: '/assets/HEXI/xingxingxia_guoxiaoke.png' },
    yangguan: { generalId: 'yangguan_banyong', generalName: '班勇', portrait: '/assets/WESTERN/yangguan_banyong.png' },
    wulianghai: { generalId: 'wulianghai_chelingwubashi', generalName: '车凌乌巴什', portrait: '/assets/WESTERN/wulianghai_chelingwubashi.png' },
    // 三陇沙·白龙 宁缺毋滥
// ── 西域区 2026-06-18 ──
    shache: { generalId: 'shache_xian_suoche_wang', generalName: '莎车贤', portrait: '/assets/WESTERN/shache_xian_suoche_wang.png' },
    shule: { generalId: 'shule_aersilan', generalName: '阿尔斯兰', portrait: '/assets/WESTERN/shule_aersilan.png' },
    dzungar: { generalId: 'dzungar_gaerdancelin', generalName: '噶尔丹策零', portrait: '/assets/WESTERN/dzungar_gaerdancelin.png' },
    anxi: { generalId: 'anxi_guoxin', generalName: '郭昕', portrait: '/assets/WESTERN/anxi_guoxin.png' },
    yanqi: { generalId: 'yanqi_longtuqizhi', generalName: '龙突骑支', portrait: '/assets/WESTERN/yanqi_longtuqizhi.png' },
    tuerhute: { generalId: 'tuerhute_wobaxi', generalName: '渥巴锡', portrait: '/assets/WESTERN/tuerhute_wobaxi.png' },
    gaochang: { generalId: 'gaochang_quwentai', generalName: '麴文泰', portrait: '/assets/WESTERN/gaochang_quwentai.png' },
    yarkand: { generalId: 'yarkand_abuladitifu', generalName: '阿卜杜·拉提夫', portrait: '/assets/WESTERN/yarkand_abuladitifu.png' },
    yiduhu: { generalId: 'yiduhu_baershu', generalName: '巴尔术阿而忒的斤', portrait: '/assets/WESTERN/yiduhu_baershu.png' },
    yuchi: { generalId: 'yuchi_weichiyao', generalName: '尉迟曜', portrait: '/assets/WESTERN/yuchi_weichiyao.png' },
    zhuxie: { generalId: 'zhuxie_zhuxiechixin', generalName: '朱邪赤心', portrait: '/assets/WESTERN/zhuxie_zhuxiechixin.png' },
    kala: { generalId: 'kala_satuke', generalName: '萨图克·博格拉汗', portrait: '/assets/WESTERN/kala_satuke.png' },
    an: { generalId: 'an_xibanni', generalName: '昔班尼', portrait: '/assets/CENTRAL_ASIA/an_xibanni.png' },
    saman: { generalId: 'saman_yisimayi', generalName: '伊斯玛仪', portrait: '/assets/WESTERN/saman_yisimayi.png' },
    wusun: { generalId: 'wusun_liejiaomi', generalName: '猎骄靡', portrait: '/assets/WESTERN/wusun_liejiaomi.png' },
    tujishi: { generalId: 'tujishi_sulukehan', generalName: '苏禄', portrait: '/assets/WESTERN/tujishi_sulukehan.png' },
    xiliao: { generalId: 'xiliao_yelvdashi', generalName: '耶律大石', portrait: '/assets/WESTERN/xiliao_yelvdashi.png' },
    jiazini: { generalId: 'jiazini_mahamaode', generalName: '马哈茂德', portrait: '/assets/CENTRAL_ASIA/jiazini_mahamaode.png' },
    jibin: { generalId: 'jibin_qiujiuque', generalName: '丘就却', portrait: '/assets/CENTRAL_ASIA/jibin_qiujiuque.png' },
        xijue: { generalId: 'xijue_ganshouchang', generalName: '甘延寿', portrait: '/assets/CENTRAL_ASIA/xijue_ganshouchang.png' },
    // 养吉干·咸海 / 真珠河·乌护 宁缺毋滥

// ── 中亚区 2026-06-18 ──
    huarazim: { generalId: 'huarazim_mohemo', generalName: '摩诃末', portrait: '/assets/CENTRAL_ASIA/huarazim_mohemo.png' },
    kazakh: { generalId: 'kazakh_hasimu', generalName: '哈斯木', portrait: '/assets/CENTRAL_ASIA/kazakh_hasimu.png' },
    sogdian: { generalId: 'sogdian_dewasitiqi', generalName: '德瓦什提奇', portrait: '/assets/CENTRAL_ASIA/sogdian_dewasitiqi.png' },
    yanda: { generalId: 'yanda_touluoman', generalName: '头罗曼', portrait: '/assets/CENTRAL_ASIA/yanda_touluoman.png' },
    yada: { generalId: 'yada_ahexiong', generalName: '阿赫雄', portrait: '/assets/CENTRAL_ASIA/yada_ahexiong.png' },
    anushidgin: { generalId: 'anushidgin_yile', generalName: '伊勒·阿尔斯兰', portrait: '/assets/CENTRAL_ASIA/anushidgin_yile.png' },
    qincha: { generalId: 'qincha_baqiman', generalName: '巴奇曼', portrait: '/assets/CENTRAL_ASIA/qincha_baqiman.png' },
    dayuan: { generalId: 'dayuan_wugua', generalName: '毋寡', portrait: '/assets/CENTRAL_ASIA/dayuan_wugua.png' },
    kokand: { generalId: 'kokand_alimukuli', generalName: '阿里木·库力', portrait: '/assets/CENTRAL_ASIA/kokand_alimukuli.png' },
    dayuzi: { generalId: 'dayuzi_yinalechihei', generalName: '亦纳勒赤黑', portrait: '/assets/CENTRAL_ASIA/dayuzi_yinalechihei.png' },
    maer_d: { generalId: 'maer_d_bahelamuchubin', generalName: '巴赫拉姆·楚宾', portrait: '/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png' },
    wugu_d: { generalId: 'wugu_d_tugelile', generalName: '图格里勒', portrait: '/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png' },
    adao_d: { generalId: 'adao_d_mafushou', generalName: '马福寿', portrait: '/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png' },
    wuyuan_d: { generalId: 'wuyuan_d_chengui', generalName: '陈龟', portrait: '/assets/STEPPE/heisha_d_houlilu.png' },
    shi_clan: { generalId: 'shi_clan_moheduotutun', generalName: '莫贺咄吐屯', portrait: '/assets/CENTRAL_ASIA/shi_clan_moheduotutun.png' },
    mamon: { generalId: 'mamon_mameng', generalName: '马蒙', portrait: '/assets/CENTRAL_ASIA/mamon_mameng.png' },
    khoja: { generalId: 'khoja_apakhoja', generalName: '阿帕克和卓', portrait: '/assets/CENTRAL_ASIA/khoja_apakhoja.png' },
    fanyanna: { generalId: 'fanyanna_fanyanna_wang', generalName: '谢尔', portrait: '/assets/CENTRAL_ASIA/fanyanna_fanyanna_wang.png' },
    kangju: { generalId: 'kangju_chebishi', generalName: '车鼻施', portrait: '/assets/CENTRAL_ASIA/kangju_chebishi.png' },
    zhaowu: { generalId: 'zhaowu_timuermieli', generalName: '帖木儿·灭里', portrait: '/assets/CENTRAL_ASIA/zhaowu_timuermieli.png' },
    qiepantuo: { generalId: 'qiepantuo_humi_wang', generalName: '罗真檀', portrait: '/assets/CENTRAL_ASIA/qiepantuo_humi_wang.png' },
    jie: { generalId: 'jie_sijinti', generalName: '斯谨提', portrait: '/assets/CENTRAL_ASIA/jie_sijinti.png' },
    lu: { generalId: 'lu_zhangliao', generalName: '张辽', portrait: '/assets/CENTRAL/lu_zhangliao.png' },
    // ── 中国将·西域 2026-06-18 ──
    quli: { generalId: 'quli_chentang', generalName: '陈汤', portrait: '/assets/CENTRAL_ASIA/xijue_ganshouchang.png' },
    loulan: { generalId: 'loulan_suojie', generalName: '索劼', portrait: '/assets/CENTRAL_ASIA/maer_d_bahelamuchubin.png' },
        juandu: { generalId: 'juandu_peixingjian', generalName: '裴行俭', portrait: '/assets/CENTRAL_ASIA/juandu_peixingjian.png' },
    dulan: { generalId: 'dulan_dashibatuer', generalName: '达什巴图尔', portrait: '/assets/TIBET/dulan_dashibatuer.png' },
    heyuan_d: { generalId: 'heyuan_d_heichichangzhi', generalName: '黑齿常之', portrait: '/assets/TIBET/heyuan_d_heichichangzhi.png' },
    // 克里雅/赤斤/西宁/卡伦/果洛 宁缺毋滥

// ── 青藏区 2026-06-18 ──
    song2: { generalId: 'song2_houjunji', generalName: '侯君集', portrait: '/assets/TIBET/song2_houjunji.png' },
    gurkha: { generalId: 'gurkha_baduersaye', generalName: '巴都尔萨野', portrait: '/assets/TIBET/gurkha_baduersaye.png' },
    gongbu: { generalId: 'gongbu_gongbumangbuzhi', generalName: '工布莽布支', portrait: '/assets/TIBET/gongbu_gongbumangbuzhi.png' },
    khon: { generalId: 'khon_basiba', generalName: '八思巴', portrait: '/assets/TIBET/khon_basiba.png' },
    xiadun: { generalId: 'xiadun_xiazhongawanglangjie', generalName: '夏仲·阿旺朗杰', portrait: '/assets/TIBET/xiadun_xiazhongawanglangjie.png' },
    gar: { generalId: 'gar_lunqinling', generalName: '论钦陵', portrait: '/assets/TIBET/gar_lunqinling.png' },
    tufa_d: { generalId: 'tufa_d_tufanutan', generalName: '秃发傉檀', portrait: '/assets/TIBET/tufa_d_tufanutan.png' },
    qifu_d: { generalId: 'qifu_d_qifuchipan', generalName: '乞伏炽磐', portrait: '/assets/TIBET/qifu_d_qifuchipan.png' },
    tuyu_d: { generalId: 'tuyu_d_kualv', generalName: '夸吕', portrait: '/assets/TIBET/tuyu_d_kualv.png' },
    duomi: { generalId: 'duomi_lunkongre', generalName: '论恐热', portrait: '/assets/TIBET/duomi_lunkongre.png' },
    anding_wei: { generalId: 'anding_wei_buyantiemuer', generalName: '卜烟帖木儿', portrait: '/assets/TIBET/anding_wei_buyantiemuer.png' },
    gaxa: { generalId: 'gaxa_zhashiduanzhubu', generalName: '扎什端珠布', portrait: '/assets/TIBET/gaxa_zhashiduanzhubu.png' },
    jinchuan_g: { generalId: 'jinchuan_g_shaluoben', generalName: '莎罗奔', portrait: '/assets/TIBET/jinchuan_g_shaluoben.png' },
    xiangxiong: { generalId: 'xiangxiong_limixia_x', generalName: '李迷夏', portrait: '/assets/TIBET/xiangxiong_limixia_x.png' },
    ladakh: { generalId: 'ladakh_senggelangjie', generalName: '僧格朗杰', portrait: '/assets/TIBET/ladakh_senggelangjie.png' },
    khoshut: { generalId: 'khoshut_gushihan', generalName: '固始汗', portrait: '/assets/TIBET/khoshut_gushihan.png' },
    nvguo: { generalId: 'nvguo_mojie', generalName: '末羯', portrait: '/assets/TIBET/nvguo_mojie.png' },
    karmapa: { generalId: 'karmapa_queyingduoji', generalName: '却英多吉', portrait: '/assets/TIBET/karmapa_queyingduoji.png' },
    xianlingqiang: { generalId: 'xianlingqiang_dianling', generalName: '滇零', portrait: '/assets/TIBET/xianlingqiang_dianling.png' },
    lang_clan: { generalId: 'lang_clan_jiangqujianzan', generalName: '绛曲坚赞', portrait: '/assets/TIBET/lang_clan_jiangqujianzan.png' },
    xiutu: { generalId: 'xiutu_xiutuwang', generalName: '金日磾', portrait: '/assets/TIBET/xiutu_xiutuwang.png' },
    gandenpozhang: { generalId: 'gandenpozhang_dibasangjiejiacuo', generalName: '第巴桑结嘉措', portrait: '/assets/TIBET/gandenpozhang_dibasangjiejiacuo.png' },
    khyungpo: { generalId: 'khyungpo_qiongbobangse', generalName: '琼波·邦色', portrait: '/assets/TIBET/khyungpo_qiongbobangse.png' },
    gar_kham: { generalId: 'gar_kham_dengbazeren', generalName: '登巴泽仁', portrait: '/assets/TIBET/gar_kham_dengbazeren.png' },
    guangwu: { generalId: 'guangwu_xinwuxian', generalName: '辛武贤', portrait: '/assets/liuhan/guangwu_xinwuxian.png' },
    supi: { generalId: 'supi_xinuoluo', generalName: '悉诺逻', portrait: '/assets/TIBET/supi_xinuoluo.png' },
    tsangpa: { generalId: 'tsangpa_pengcuonanjie', generalName: '彭措南杰', portrait: '/assets/TIBET/tsangpa_pengcuonanjie.png' },
    spurgyal: { generalId: 'spurgyal_dariniansai', generalName: '达日年塞', portrait: '/assets/TIBET/spurgyal_dariniansai.png' },
    galangdiba: { generalId: 'galangdiba_wangqindundui', generalName: '旺钦顿堆', portrait: '/assets/TIBET/galangdiba_wangqindundui.png' },
    fuguo: { generalId: 'fuguo_yizeng', generalName: '宜缯', portrait: '/assets/TIBET/fuguo_yizeng.png' },
    bailang: { generalId: 'bailang_tangzeng', generalName: '唐缯', portrait: '/assets/TIBET/bailang_tangzeng.png' },
    humi: { generalId: 'humi_humiwang', generalName: '真檀', portrait: '/assets/TIBET/humi_humiwang.png' },
    xiaobolu: { generalId: 'xiaobolu_meijinmang', generalName: '没谨忙', portrait: '/assets/TIBET/xiaobolu_meijinmang.png' },
    guge: { generalId: 'guge_chizhaxichabade', generalName: '赤扎西查巴德', portrait: '/assets/TIBET/guge_chizhaxichabade.png' },
    pazhu: { generalId: 'pazhu_redangunsangpa', generalName: '热丹衮桑帕', portrait: '/assets/TIBET/pazhu_redangunsangpa.png' },
    ali: { generalId: 'ali_gandancaiwang', generalName: '甘丹才旺', portrait: '/assets/TIBET/ali_gandancaiwang.png' }, // 噶大克
    gaoliang: { generalId: 'gaoliang_fengang', generalName: '冯盎', portrait: '/assets/TIBET/gaoliang_fengang.png' }, // 茂名
    nandou: { generalId: 'nandou_sushili', generalName: '苏失利', portrait: '/assets/TIBET/nandou_sushili.png' }, // 孽多
    bailan: { generalId: 'bailan_pabala', generalName: '帕巴拉', portrait: '/assets/TIBET/bailan_pabala.png' }, // 察木多
    jiantang: { generalId: 'jiantang_sangjiejia', generalName: '桑杰嘉措', portrait: '/assets/TIBET/jiantang_sangjiejia.png' }, // 独克宗
    kongsa: { generalId: 'kongsa_kongsayiduo', generalName: '孔萨益多', portrait: '/assets/TIBET/kongsa_kongsayiduo.png' }, // 甘孜
    gling: { generalId: 'gling_lingesar', generalName: '岭格萨尔', portrait: '/assets/TIBET/gling_lingesar.png' }, // 结古宗
    daca: { generalId: 'daca_dacajilong', generalName: '达擦济咙', portrait: '/assets/TIBET/daca_dacajilong.png' }, // 八宿宗
    gongtang: { generalId: 'gongtang_gongtangang', generalName: '贡唐仓', portrait: '/assets/TIBET/gongtang_gongtangang.png' }, // 吉麦
    nanjie: { generalId: 'nanjie_nanjiewangqiu', generalName: '南杰旺秋', portrait: '/assets/TIBET/nanjie_nanjiewangqiu.png' }, // 日土宗
    nanzhong: { generalId: 'nanzhong_mazhong', generalName: '马忠', portrait: '/assets/DIANQIAN/nanzhong_mazhong.png' }, // 宛温·庲降都督镇南中
    yueyi: { generalId: 'yueyi_jiaohuang', generalName: '焦璜', portrait: '/assets/DIANQIAN/yueyi_jiaohuang.png' }, // 越嶲·邛都戍守
    pingnan: { generalId: 'pingnan_musheng', generalName: '沐晟', portrait: '/assets/DIANQIAN/pingnan_musheng.png' }, // 腾越城·镇守云南
    jingdong: { generalId: 'jingdong_taohong', generalName: '陶洪', portrait: '/assets/DIANQIAN/jingdong_taohong.png' }, // 银生城·景东土官
    luohu: { generalId: 'luohu_ganmuding', generalName: '敢木丁', portrait: '/assets/DIANQIAN/luohu_ganmuding.png' }, // 呵叻城·罗斛国王
    ailao: { generalId: 'ailao_leilao', generalName: '类牢', portrait: '/assets/DIANQIAN/ailao_leilao.png' }, // 永昌·哀牢反叛
    mingzheng: { generalId: 'mingzheng_jianzandechang', generalName: '坚赞德昌', portrait: '/assets/DIANQIAN/mingzheng_jianzandechang.png' }, // 打箭炉·明正土司
    hani_d: { generalId: 'hani_d_zhebi', generalName: '遮比', portrait: '/assets/DIANQIAN/hani_d_zhebi.png' }, // 思陀·哈尼首领
  // ── 滇缅区 2026-06-18 ──
    dali: { generalId: 'dali_duansiping', generalName: '段思平', portrait: '/assets/DIANQIAN/dali_duansiping.png' },
    dongxu: { generalId: 'dongxu_mangruiti', generalName: '莽瑞体', portrait: '/assets/DIANQIAN/dongxu_mangruiti.png' },
    mu_lijiang: { generalId: 'mu_lijiang_muzeng', generalName: '木增', portrait: '/assets/DIANQIAN/mu_lijiang_muzeng.png' },
    dianguo: { generalId: 'dianguo_zhuangqiao', generalName: '庄蹻', portrait: '/assets/DIANQIAN/dianguo_zhuangqiao.png' },
    konbaung: { generalId: 'konbaung_yongjiya', generalName: '雍籍牙', portrait: '/assets/DIANQIAN/konbaung_yongjiya.png' },
    hantawadi: { generalId: 'hantawadi_mangyinglong', generalName: '莽应龙', portrait: '/assets/DIANQIAN/hantawadi_mangyinglong.png' },
    nanzhao: { generalId: 'nanzhao_geluofeng', generalName: '阁罗凤', portrait: '/assets/DIANQIAN/nanzhao_geluofeng.png' },
    wuman: { generalId: 'wuman_cuanguiwang', generalName: '爨归王', portrait: '/assets/DIANQIAN/wuman_cuanguiwang.png' },
    dai: { generalId: 'dai_daoyingmeng', generalName: '刀应勐', portrait: '/assets/DIANQIAN/dai_daoyingmeng.png' },
    taiyuan: { generalId: 'taiyuan_manglai', generalName: '孟莱', portrait: '/assets/DIANQIAN/taiyuan_manglai.png' },
    suke: { generalId: 'suke_langanheng', generalName: '兰甘亨', portrait: '/assets/DIANQIAN/suke_langanheng.png' },
    luchuan: { generalId: 'luchuan_sirenfa', generalName: '思任发', portrait: '/assets/DIANQIAN/luchuan_sirenfa.png' },
    kunming_yi: { generalId: 'kunming_yi_lucheng', generalName: '卤承', portrait: '/assets/DIANQIAN/kunming_yi_lucheng.png' },
    cuanshi: { generalId: 'cuanshi_cuanlongyan', generalName: '爨龙颜', portrait: '/assets/DIANQIAN/cuanshi_cuanlongyan.png' },
    baiman: { generalId: 'baiman_gaoshengtai', generalName: '高升泰', portrait: '/assets/DIANQIAN/baiman_gaoshengtai.png' },
    champa: { generalId: 'champa_zhipenge', generalName: '制蓬峨', portrait: '/assets/DIANQIAN/champa_zhipenge.png' },
    qiong: { generalId: 'qiong_rengui', generalName: '任贵', portrait: '/assets/DIANQIAN/qiong_rengui.png' },
    // 莽应龙已移给 dongxu
      daozhou: { generalId: 'daozhou_yangzaixing', generalName: '杨再兴', portrait: '/assets/LINGNAN/daozhou_yangzaixing.png' },
    guangping: { generalId: 'guangping_ruanwenzhang', generalName: '阮文张', portrait: '/assets/LINGNAN/guangping_ruanwenzhang.png' }, // 洞海城·阮朝水师名将
    jingjiang: { generalId: 'jingjiang_qushisi', generalName: '瞿式耜', portrait: '/assets/LINGNAN/jingjiang_qushisi.png' }, // 永安·收复广西
    duanzhou_d: { generalId: 'duanzhou_d_caojin', generalName: '曹觐', portrait: '/assets/LINGNAN/duanzhou_d_caojin.png' }, // 肇庆·屡败侬智高
    monong: { generalId: 'monong_anong', generalName: '阿侬', portrait: '/assets/LINGNAN/monong_anong.png' }, // 邦敦·侬智高母
    basha_d: { generalId: 'basha_d_daogengmeng', generalName: '刀更孟', portrait: '/assets/pugan/basha_d_daogengmeng.png' }, // 上丁·巴沙象兵
    leizhou: { generalId: 'leizhou_limao_leizhou', generalName: '李茂', portrait: '/assets/LINGNAN/leizhou_limao_leizhou.png' }, // 海康·雷州卫指挥
    ketagalan: { generalId: 'ketagalan_huangqingyun', generalName: '黄青云', portrait: '/assets/LINGNAN/ketagalan_huangqingyun.png' }, // 艋舺·凯达格兰
    shuizhen: { generalId: 'shuizhen_oudaren', generalName: '区大任', portrait: '/assets/DIANQIAN/shuizhen_oudaren.png' }, // 三菩·水真戍
  // ── 岭南/越南/台湾区 2026-06-18 ──
    ryukyu: { generalId: 'ryukyu_shangbazhi', generalName: '尚巴志', portrait: '/assets/LINGNAN/ryukyu_shangbazhi.png' },
    luoping: { generalId: 'luoping_zhangshijie', generalName: '张世杰', portrait: '/assets/LINGNAN/luoping_zhangshijie.png' },
    chaozhou_d: { generalId: 'chaozhou_d_zhangshijie', generalName: '张世杰', portrait: '/assets/LINGNAN/chaozhou_d_zhangshijie.png' },
    chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', generalName: '陈吊眼', portrait: '/assets/LINGNAN/chendiaoyan_chendiaoyan.png' },
    dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', generalName: '邓茂七', portrait: '/assets/LINGNAN/dengmaoqi_dengmaoqi.png' },
    geng: { generalId: 'geng_gengjingzhong', generalName: '耿精忠', portrait: '/assets/LINGNAN/geng_gengjingzhong.png' },
    longwu: { generalId: 'longwu_huangdaozhou', generalName: '黄道周', portrait: '/assets/LINGNAN/longwu_huangdaozhou.png' },
    xinjiang: { generalId: 'xinjiang_maji', generalName: '马塈', portrait: '/assets/LINGNAN/xinjiang_maji.png' },
    jing: { generalId: 'jing_dingbuling', generalName: '丁部领', portrait: '/assets/LINGNAN/jing_dingbuling.png' },
    paiwan: { generalId: 'paiwan_alugu', generalName: '阿禄古', portrait: '/assets/LINGNAN/paiwan_alugu.png' },
    ming_zheng: { generalId: 'ming_zheng_zhengchenggong', generalName: '郑成功', portrait: '/assets/daming/ming_zheng_zhengchenggong.png' },
    nguyen_guangnan: { generalId: 'nguyen_guangnan_ruanfuying', generalName: '阮福映', portrait: '/assets/LINGNAN/nguyen_guangnan_ruanfuying.png' },
    zhuang_d: { generalId: 'zhuang_d_washifuren', generalName: '瓦氏夫人', portrait: '/assets/LINGNAN/zhuang_d_washifuren.png' },
    nanyue: { generalId: 'nanyue_zhaotuo', generalName: '赵佗', portrait: '/assets/LINGNAN/nanyue_zhaotuo.png' },
    zhancheng: { generalId: 'zhancheng_zhimin', generalName: '制旻', portrait: '/assets/guangzhou/zhancheng_zhimin.png' },
    xiou: { generalId: 'xiou_yixusong', generalName: '译吁宋', portrait: '/assets/LINGNAN/xiou_yixusong.png' },
    xichu: { generalId: 'xichu_xiangyu', generalName: '项羽', portrait: '/assets/xianqin/xichu_xiangyu.png' },
    gouding: { generalId: 'gouding_wubo', generalName: '毋波', portrait: '/assets/LINGNAN/gouding_wubo.png' },
    chen: { generalId: 'chen_chenbaxian', generalName: '陈霸先', portrait: '/assets/LINGNAN/chen_chenbaxian.png' },
    dayu: { generalId: 'dayu_wangshouren', generalName: '王守仁', portrait: '/assets/LINGNAN/dayu_wangshouren.png' },
    paiyao: { generalId: 'paiyao_huanggua4', generalName: '黄瓜四', portrait: '/assets/LINGNAN/paiyao_huanggua4.png' },
    yingzhou: { generalId: 'yingzhou_liulong_ying', generalName: '刘龑', portrait: '/assets/LINGNAN/xinjiang_maji.png' },
    linyi: { generalId: 'linyi_fanyangmai', generalName: '范阳迈', portrait: '/assets/LINGNAN/linyi_fanyangmai.png' },
    xian_d: { generalId: 'xian_d_xianfuren', generalName: '冼夫人', portrait: '/assets/LINGNAN/xian_d_xianfuren.png' },
    luodian: { generalId: 'luodian_shexiang', generalName: '奢香夫人', portrait: '/assets/LINGNAN/luodian_shexiang.png' },
    nong2: { generalId: 'nong2_nongzhigao', generalName: '侬智高', portrait: '/assets/LINGNAN/nong2_nongzhigao.png' },
    taiping: { generalId: 'taiping_shidakai', generalName: '石达开', portrait: '/assets/LINGNAN/taiping_shidakai.png' },
    dongzu: { generalId: 'dongzu_wumian', generalName: '吴勉', portrait: '/assets/LINGNAN/dongzu_wumian.png' },
    tian_sizhou: { generalId: 'tian_sizhou_tianyougong', generalName: '田祐恭', portrait: '/assets/LINGNAN/tian_sizhou_tianyougong.png' },
    luoyue: { generalId: 'luoyue_zhengce', generalName: '征侧', portrait: '/assets/DIANQIAN/luoyue_zhengce.png' },
    li_lx_d: { generalId: 'li_lx_d_lichong', generalName: '李崇', portrait: '/assets/BASHU/li_lx_d_lichong.png' },
    li_s: { generalId: 'li_s_mayuan', generalName: '马援', portrait: '/assets/LINGNAN/li_s_mayuan.png' },
    trinh: { generalId: 'trinh_zhengsong', generalName: '郑松', portrait: '/assets/LINGNAN/trinh_zhengsong.png' },
    dacheng: { generalId: 'dacheng_chenkai', generalName: '陈开', portrait: '/assets/LINGNAN/dacheng_chenkai.png' },
    dayue: { generalId: 'dayue_chenguojun', generalName: '陈国峻', portrait: '/assets/LINGNAN/dayue_chenguojun.png' },
    shengmiao: { generalId: 'shengmiao_baoli_miao', generalName: '包利', portrait: '/assets/LINGNAN/shengmiao_baoli_miao.png' },
    miao_qing: { generalId: 'miao_qing_yangwanzhe', generalName: '杨完者', portrait: '/assets/LINGNAN/miao_qing_yangwanzhe.png' },
    guizhou: { generalId: 'guizhou_lidingguo', generalName: '李定国', portrait: '/assets/LINGNAN/guizhou_lidingguo.png' },
    liren: { generalId: 'liren_funanshe', generalName: '符南蛇', portrait: '/assets/LINGNAN/liren_funanshe.png' },
    // guangnanguo → 洞海城改为 panjun
    yelang: { generalId: 'yelang_duotong', generalName: '多同', portrait: '/assets/LINGNAN/yelang_duotong.png' },
    zangke: { generalId: 'zangke_xielongyu', generalName: '谢龙羽', portrait: '/assets/LINGNAN/zangke_xielongyu.png' },
    xinggu: { generalId: 'xinggu_cuanxi', generalName: '爨习', portrait: '/assets/LINGNAN/xinggu_cuanxi.png' },
    guangxin: { generalId: 'guangxin_shixie', generalName: '士燮', portrait: '/assets/LINGNAN/guangxin_shixie.png' },
    shaozhou: { generalId: 'shaozhou_zhangzhensun', generalName: '张镇孙', portrait: '/assets/LINGNAN/shaozhou_zhangzhensun.png' },
    shixing: { generalId: 'shixing_houandou', generalName: '侯安都', portrait: '/assets/LINGNAN/shixing_houandou.png' },
    buyi_d: { generalId: 'buyi_d_weichaoyuan', generalName: '韦朝元', portrait: '/assets/LINGNAN/buyi_d_weichaoyuan.png' },
      lizhou_d: { generalId: 'lizhou_d_wulin', generalName: '吴璘', portrait: '/assets/BASHU/lizhou_d_wulin.png' },
      // ── 巴蜀关隘 2026-06-19 ──
    kui: { generalId: 'kui_liubei', generalName: '刘备', portrait: '/assets/BASHU/kui_liubei.png' },
    yang_bozhou: { generalId: 'yang_bozhou_yangyinglong', generalName: '杨应龙', portrait: '/assets/BASHU/yang_bozhou_yangyinglong.png' },
    chenghan: { generalId: 'chenghan_lite', generalName: '李特', portrait: '/assets/BASHU/chenghan_lite.png' },
    jinchuan_x: { generalId: 'jinchuan_x_suonuomu', generalName: '索诺木', portrait: '/assets/BASHU/jinchuan_x_suonuomu.png' },
    zuo_d: { generalId: 'zuo_d_wufu_zd', generalName: '吴复', portrait: '/assets/BASHU/zuo_d_wufu_zd.png' },
    miaomin: { generalId: 'miaomin_shiliudeng', generalName: '石柳邓', portrait: '/assets/BASHU/chenzhou_d_zhanggao.png' },
    wumeng: { generalId: 'wumeng_azi_wm', generalName: '阿资', portrait: '/assets/BASHU/wumeng_azi_wm.png' },
    // 勒乌围·金川 / 乌蒙山·乌蛮 宁缺毋滥
// ── 巴蜀区 2026-06-18 ──
    tujia_d: { generalId: 'tujia_d_qinliangyu', generalName: '秦良玉', portrait: '/assets/BASHU/tujia_d_qinliangyu.png' },
    shuixi: { generalId: 'shuixi_anbangyan', generalName: '安邦彦', portrait: '/assets/BASHU/shuixi_anbangyan.png' },
        xiangzhou: { generalId: 'xiangzhou_lvwenhuan', generalName: '吕文焕', portrait: '/assets/zhaosong/xiangzhou_lvwenhuan.png' },
    zaoyang_d: { generalId: 'zaoyang_d_menggong', generalName: '孟珙', portrait: '/assets/zhaosong/zaoyang_d_menggong.png' },
    guo: { generalId: 'guo_jixin', generalName: '纪信', portrait: '/assets/BASHU/guo_jixin.png' },
        daxi_ming: { generalId: 'daxi_ming_zhangxianzhong', generalName: '张献忠', portrait: '/assets/BASHU/daxi_ming_zhangxianzhong.png' },
    zi: { generalId: 'zi_changhong', generalName: '苌弘', portrait: '/assets/BASHU/zi_changhong.png' },
    yidou: { generalId: 'yidou_luxun', generalName: '陆逊', portrait: '/assets/BASHU/yidou_luxun.png' },
        chu: { generalId: 'chu_guanyu', generalName: '关羽', portrait: '/assets/BASHU/chu_guanyu.png' },
    zhongxiang: { generalId: 'zhongxiang_zhongxiang', generalName: '钟相', portrait: '/assets/BASHU/zhongxiang_zhongxiang.png' },
    fengzhou: { generalId: 'fengzhou_wujie', generalName: '吴玠', portrait: '/assets/zhaosong/fengzhou_wujie.png' },
    fushi: { generalId: 'fushi_fuhong', generalName: '苻洪', portrait: '/assets/HEXI/fushi_fuhong.png' },
    wanzhou: { generalId: 'wanzhou_shangguankui', generalName: '上官夔', portrait: '/assets/BASHU/li_lx_d_lichong.png' },
    ba: { generalId: 'ba_bamanzi', generalName: '巴蔓子', portrait: '/assets/BASHU/ba_bamanzi.png' },
    hezhou: { generalId: 'hezhou_wangjian_dy', generalName: '王坚', portrait: '/assets/BASHU/hezhou_wangjian_dy.png' },
    qiuchi: { generalId: 'qiuchi_yangnandang', generalName: '杨难当', portrait: '/assets/BASHU/qiuchi_yangnandang.png' },
    cong: { generalId: 'cong_puhu', generalName: '朴胡', portrait: '/assets/BASHU/cong_puhu.png' },
    langzhou: { generalId: 'langzhou_zhangfei', generalName: '张飞', portrait: '/assets/BASHU/langzhou_zhangfei.png' },
    tan_d: { generalId: 'tan_d_tanhou', generalName: '覃垕', portrait: '/assets/BASHU/tan_d_tanhou.png' },
    xiang_d: { generalId: 'xiang_d_xiangdakun', generalName: '向大坤', portrait: '/assets/BASHU/xiang_d_xiangdakun.png' },
    ran_d: { generalId: 'ran_d_ranshouzhong', generalName: '冉守忠', portrait: '/assets/BASHU/ran_d_ranshouzhong.png' },
    wuxi: { generalId: 'wuxi_shamoke', generalName: '沙摩柯', portrait: '/assets/BASHU/wuxi_shamoke.png' },
    kuai: { generalId: 'kuai_kuaiyue', generalName: '蒯越', portrait: '/assets/BASHU/kuai_kuaiyue.png' },
    bandun: { generalId: 'bandun_fanmu', generalName: '范目', portrait: '/assets/BASHU/bandun_fanmu.png' },
    she: { generalId: 'she_shechongming', generalName: '奢崇明', portrait: '/assets/BASHU/she_shechongming.png' },
    boren: { generalId: 'boren_ada', generalName: '阿大', portrait: '/assets/BASHU/boren_ada.png' },
    jingmen: { generalId: 'jingmen_zhaoyun', generalName: '赵云', portrait: '/assets/NORTH/jingmen_zhaoyun.png' },
    chenzhou_d: { generalId: 'chenzhou_d_zhanggao', generalName: '张镐', portrait: '/assets/BASHU/chenzhou_d_zhanggao.png' },
      xiqin: { generalId: 'xiqin_xuerengao', generalName: '薛仁杲', portrait: '/assets/HEXI/xiqin_xuerengao.png' },
    beidi: { generalId: 'beidi_sunang', generalName: '孙卬', portrait: '/assets/HEXI/beidi_sunang.png' },
    baiyang: { generalId: 'baiyang_mengtian', generalName: '蒙恬', portrait: '/assets/HEXI/baiyang_mengtian.png' },
    qianzhong: { generalId: 'qianzhong_wubayue', generalName: '吴八月', portrait: '/assets/BASHU/qianzhong_wubayue.png' }, // 芷江·乾嘉苗民起义
    dangchang: { generalId: 'dangchang_liangmiding', generalName: '梁弥定', portrait: '/assets/BASHU/dangchang_liangmiding.png' }, // 合川·宕昌末代王
    liao: { generalId: 'liao_houhongyuan', generalName: '侯弘远', portrait: '/assets/BASHU/liao_houhongyuan.png' }, // 江阳·僚人酋帅
    sou: { generalId: 'sou_gaodingyuan', generalName: '高定元', portrait: '/assets/BASHU/sou_gaodingyuan.png' }, // 乐山·越巂叟族首领
    qingqiang: { generalId: 'qingqiang_jiangwei', generalName: '姜维', portrait: '/assets/BASHU/qingqiang_jiangwei.png' }, // 汶川·蜀汉大将军
    qingyi: { generalId: 'qingyi_qingyiwang', generalName: '张嶷', portrait: '/assets/BASHU/qingyi_qingyiwang.png' }, // 严道·青衣羌首领

  // ── 河西区 2026-06-18 ──
        liangzhou: { generalId: 'liangzhou_zhanggui', generalName: '张轨', portrait: '/assets/HEXI/liangzhou_zhanggui.png' },
    lanzhou: { generalId: 'lanzhou_zhaochongguo', generalName: '赵充国', portrait: '/assets/liuhan/guangwu_xinwuxian.png' },
        wudu: { generalId: 'wudu_zhangyi', generalName: '张翼', portrait: '/assets/BASHU/wudu_zhangyi.png' },
        baishui: { generalId: 'baishui_yanghuai', generalName: '杨怀', portrait: '/assets/BASHU/baishui_yanghuai.png' },
        dangzhou: { generalId: 'dangzhou_dengai', generalName: '邓艾', portrait: '/assets/NORTH/dangzhou_dengai.png' },
        didao: { generalId: 'didao_duanjiong', generalName: '段颎', portrait: '/assets/HEXI/didao_duanjiong.png' },
    dashun: { generalId: 'dashun_lizicheng', generalName: '李自成', portrait: '/assets/HEXI/dashun_lizicheng.png' },
    zhai_han: { generalId: 'zhai_han_dongyi', generalName: '董翳', portrait: '/assets/HEXI/zhai_han_dongyi.png' },
    ganzhou: { generalId: 'ganzhou_dourong', generalName: '窦融', portrait: '/assets/HEXI/ganzhou_dourong.png' },
        suzhou: { generalId: 'suzhou_huoqubing', generalName: '霍去病', portrait: '/assets/liuhan/suzhou_huoqubing.png' },
    shazhou: { generalId: 'shazhou_zhangyichao', generalName: '张议潮', portrait: '/assets/HEXI/shazhou_zhangyichao.png' },
    dongshengwei: { generalId: 'dongshengwei_wangyue_ming', generalName: '王越', portrait: '/assets/HEXI/dongshengwei_wangyue_ming.png' },
    guiyi: { generalId: 'guiyi_caoyijin', generalName: '曹议金', portrait: '/assets/HEXI/guiyi_caoyijin.png' },
    weiming: { generalId: 'weiming_lijiaqian', generalName: '李继迁', portrait: '/assets/HEXI/weiming_lijiaqian.png' },
    helian: { generalId: 'helian_helianbobo', generalName: '赫连勃勃', portrait: '/assets/HEXI/helian_helianbobo.png' },
    chile: { generalId: 'chile_hulvjin', generalName: '斛律金', portrait: '/assets/HEXI/chile_hulvjin.png' },
    chijin: { generalId: 'chijin_qiewangshijia', generalName: '且旺失加', portrait: '/assets/HEXI/chijin_qiewangshijia.png' },
    juyan_d: { generalId: 'juyan_d_liling', generalName: '李陵', portrait: '/assets/HEXI/juyan_d_liling.png' },
    shuofang: { generalId: 'shuofang_weiqing', generalName: '卫青', portrait: '/assets/liuhan/shuofang_weiqing.png' },
    yeli: { generalId: 'yeli_yeliwangrong', generalName: '野利旺荣', portrait: '/assets/HEXI/yeli_yeliwangrong.png' },
    hunxie: { generalId: 'hunxie_hunxiewang', generalName: '徐自为', portrait: '/assets/HEXI/hunxie_hunxiewang.png' },
    guazhou: { generalId: 'guazhou_zhangshougui', generalName: '张守珪', portrait: '/assets/HEXI/guazhou_zhangshougui.png' },
    kang: { generalId: 'kang_liangshidu', generalName: '梁师都', portrait: '/assets/HEXI/kang_liangshidu.png' },
        woye: { generalId: 'woye_huangfugui', generalName: '皇甫规', portrait: '/assets/HEXI/woye_huangfugui.png' },
    yingli: { generalId: 'yingli_jilasiyi', generalName: '籍辣思义', portrait: '/assets/HEXI/yingli_jilasiyi.png' },
    dangxiang: { generalId: 'dangxiang_liyuanhao', generalName: '李元昊', portrait: '/assets/HEXI/dangxiang_liyuanhao.png' },
    huizhou: { generalId: 'huizhou_yaodui', generalName: '姚兕', portrait: '/assets/HEXI/huizhou_yaodui.png' },
    huan: { generalId: 'huan_zhongshidao', generalName: '种师道', portrait: '/assets/NORTH/huan_zhongshidao.png' },
    wei2: { generalId: 'wei2_hunjian', generalName: '浑瑊', portrait: '/assets/HEXI/wei2_hunjian.png' },
    lingwu: { generalId: 'lingwu_guoziyi', generalName: '郭子仪', portrait: '/assets/litang/lingwu_guoziyi.png' },
    ningkou: { generalId: 'ningkou_lubode', generalName: '路博德', portrait: '/assets/HEXI/ningkou_lubode.png' },
    juqu_d: { generalId: 'juqu_d_juqumengxun', generalName: '沮渠蒙逊', portrait: '/assets/HEXI/juqu_d_juqumengxun.png' },
        zhengzhou: { generalId: 'zhengzhou_chenqingzhi', generalName: '陈庆之', portrait: '/assets/CENTRAL/zhengzhou_chenqingzhi.png' },
    sunqin: { generalId: 'sunqin_sunchuanting', generalName: '孙传庭', portrait: '/assets/CENTRAL/sunqin_sunchuanting.png' },
    hongnong_jun: { generalId: 'hongnong_jun_yangsu', generalName: '杨素', portrait: '/assets/CENTRAL/hongnong_jun_yangsu.png' }, // 弘农杨氏；灭陈/破突厥名将

// ── 中原区 2026-06-18 ──
    tianxiong: { generalId: 'tianxiong_tianchengsi', generalName: '田承嗣', portrait: '/assets/CENTRAL/tianxiong_tianchengsi.png' },
    ranwei_d: { generalId: 'ranwei_d_ranmin', generalName: '冉闵', portrait: '/assets/CENTRAL/ranwei_d_ranmin.png' },
    jin: { generalId: 'jin_xianzhen', generalName: '先轸', portrait: '/assets/xianqin/jin_xianzhen.png' },
    zhong: { generalId: 'zhong_xiexuan', generalName: '谢玄', portrait: '/assets/JIANGNAN/zhong_xiexuan.png' },
    zhongshan: { generalId: 'zhongshan_yangaoging', generalName: '颜杲卿', portrait: '/assets/CENTRAL/zhongshan_yangaoging.png' },
            huangfu: { generalId: 'huangfu_huangfusong', generalName: '皇甫嵩', portrait: '/assets/CENTRAL/huangfu_huangfusong.png' },
    wang_d: { generalId: 'wang_d_wangdao', generalName: '王导', portrait: '/assets/CENTRAL/wang_d_wangdao.png' },
    chimei: { generalId: 'chimei_fanchong', generalName: '樊崇', portrait: '/assets/panjun/chimei_fanchong.png' },
        xiao_d: { generalId: 'xiao_d_xiaomohe', generalName: '萧摩诃', portrait: '/assets/JIANGNAN/xiao_d_xiaomohe.png' },
    wazhai: { generalId: 'wazhai_limi_wz', generalName: '李密', portrait: '/assets/CENTRAL/wazhai_limi_wz.png' },
    jiaodong: { generalId: 'jiaodong_tiandan', generalName: '田单', portrait: '/assets/xianqin/jiaodong_tiandan.png' },
    jibei: { generalId: 'jibei_xuxuan_cm', generalName: '徐宣', portrait: '/assets/CENTRAL/jibei_xuxuan_cm.png' },
    jinan: { generalId: 'jinan_tiexuan', generalName: '铁铉', portrait: '/assets/CENTRAL/jinan_tiexuan.png' },
    qi: { generalId: 'qi_qihuangong', generalName: '齐桓公', portrait: '/assets/xianqin/qi_qihuangong.png' },
    huaiyang: { generalId: 'huaiyang_zhouyafu', generalName: '周亚夫', portrait: '/assets/liuhan/huaiyang_zhouyafu.png' },
    yingzhou_d: { generalId: 'yingzhou_d_liuqi', generalName: '刘锜', portrait: '/assets/zhaosong/yingzhou_d_liuqi.png' },
    cao_d: { generalId: 'cao_d_caocao', generalName: '曹操', portrait: '/assets/CENTRAL/cao_d_caocao.png' },
    long2: { generalId: 'long2_weixiaokuan', generalName: '韦孝宽', portrait: '/assets/CENTRAL/long2_weixiaokuan.png' },
    dongxian: { generalId: 'dongxian_sunbin', generalName: '孙膑', portrait: '/assets/xianqin/dongxian_sunbin.png' },
    mi: { generalId: 'mi_mizhu', generalName: '麋竺', portrait: '/assets/CENTRAL/mi_mizhu.png' },
    baibo: { generalId: 'baibo_guotai_bb', generalName: '郭太', portrait: '/assets/panjun/baibo_guotai_bb.png' },
    ruzhou: { generalId: 'ruzhou_sunjian', generalName: '孙坚', portrait: '/assets/CENTRAL/ruzhou_sunjian.png' },
    ruo: { generalId: 'ruo_wangjian', generalName: '王翦', portrait: '/assets/yingqin/ruo_wangjian.png' },
    yaozhou: { generalId: 'yaozhou_limaozhen', generalName: '李茂贞', portrait: '/assets/CENTRAL/yaozhou_limaozhen.png' },
    zhi_state: { generalId: 'zhi_state_caocan', generalName: '曹参', portrait: '/assets/CENTRAL/zhi_state_caocan.png' },
    // 周泰（东吴宿卫；原 wuwu_d，吕蒙迁濡须口后改挂莱国据点）
    yangshao: { generalId: 'yangshao_zhoubo', generalName: '周勃', portrait: '/assets/liuhan/yangshao_zhoubo.png' },
    dixiang: { generalId: 'dixiang_wangmang', generalName: '王莽', portrait: '/assets/liuhan/dixiang_wangmang.png' },
    zhou: { generalId: 'zhou_jifa', generalName: '姬发', portrait: '/assets/xianqin/zhou_jifa.png' },
    quanrong: { generalId: 'quanrong_quanrongwang', generalName: '义渠骇', portrait: '/assets/HEXI/quanrong_quanrongwang.png' },
    cai: { generalId: 'cai_lisu', generalName: '李愬', portrait: '/assets/CENTRAL/cai_lisu.png' },
    yun: { generalId: 'yun_wuli', generalName: '吾离', portrait: '/assets/CENTRAL/yun_wuli.png' },
        suzhou_d: { generalId: 'suzhou_d_shikefa', generalName: '史可法', portrait: '/assets/daming/suzhou_d_shikefa.png' },
    pizhou: { generalId: 'pizhou_lvbu', generalName: '吕布', portrait: '/assets/CENTRAL/pizhou_lvbu.png' },
    yin: { generalId: 'yin_dixin', generalName: '帝辛', portrait: '/assets/xianqin/yin_dixin.png' },
    liwang: { generalId: 'liwang_liguangbi', generalName: '李光弼', portrait: '/assets/NORTH/liwang_liguangbi.png' }, // 河间·乐成
    qing: { generalId: 'qing_wanyanchenheshang', generalName: '完颜陈和尚', portrait: '/assets/CENTRAL/qing_wanyanchenheshang.png' },
    han: { generalId: 'han_baoyuan_han', generalName: '暴鸢', portrait: '/assets/xianqin/han_baoyuan_han.png' },
    bailian: { generalId: 'bailian_liufutong', generalName: '刘福通', portrait: '/assets/CENTRAL/bailian_liufutong.png' },
    shen: { generalId: 'shen_shenbo', generalName: '申伯', portrait: '/assets/CENTRAL/shen_shenbo.png' },
    sima_d: { generalId: 'sima_d_simayi', generalName: '司马懿', portrait: '/assets/CENTRAL/sima_d_simayi.png' },
            liguo: { generalId: 'liguo_wangmeng', generalName: '王猛', portrait: '/assets/CENTRAL/liguo_wangmeng.png' },
    huai: { generalId: 'huai_zhuyuanzhang', generalName: '朱元璋', portrait: '/assets/daming/huai_zhuyuanzhang.png' },
    shangzhou: { generalId: 'shangzhou_shangyang', generalName: '商鞅', portrait: '/assets/yingqin/shangzhou_shangyang.png' },
    yuan_cj_d: { generalId: 'yuan_cj_d_yuanshu_zn', generalName: '袁术', portrait: '/assets/CENTRAL/yuan_cj_d_yuanshu_zn.png' },
    xinping: { generalId: 'xinping_haozhao', generalName: '郝昭', portrait: '/assets/CENTRAL/xinping_haozhao.png' },
    yuzhou: { generalId: 'yuzhou_zuti', generalName: '祖逖', portrait: '/assets/NORTH/yuzhou_zuti.png' },
    mengcheng_d: { generalId: 'mengcheng_d_gaoqiong', generalName: '高琼', portrait: '/assets/CENTRAL/mengcheng_d_gaoqiong.png' },
    lulin: { generalId: 'lulin_liuxiu', generalName: '刘秀', portrait: '/assets/liuhan/lulin_liuxiu.png' },
    dang_d: { generalId: 'dang_d_zhuwen', generalName: '朱温', portrait: '/assets/CENTRAL/dang_d_zhuwen.png' },
    hao_d: { generalId: 'hao_d_changyuchun', generalName: '常遇春', portrait: '/assets/daming/hao_d_changyuchun.png' },
    bozhou_d: { generalId: 'bozhou_d_luzhonglian', generalName: '鲁仲连', portrait: '/assets/CENTRAL/bozhou_d_luzhonglian.png' },
        zhuozhou: { generalId: 'zhuozhou_anlushan', generalName: '安禄山', portrait: '/assets/CENTRAL/zhuozhou_anlushan.png' },
        chanzhou: { generalId: 'chanzhou_chairong', generalName: '柴荣', portrait: '/assets/CENTRAL/chanzhou_chairong.png' },
    lai: { generalId: 'lai_wangshifan', generalName: '王师范', portrait: '/assets/NORTH/lai_wangshifan.png' }, // 青石关·平卢节帅屡败朱温
    mushi: { generalId: 'mushi_muchong', generalName: '穆崇', portrait: '/assets/NORTH/mushi_muchong.png' }, // 大岴·丘穆陵氏代北勋臣
    xiongding: { generalId: 'xiongding_murongyong', generalName: '慕容永', portrait: '/assets/NORTH/xiongding_murongyong.png' }, // 天井关·西燕末代君主

    pinghai: { generalId: 'pinghai_laihuer', generalName: '来护儿', portrait: '/assets/NORTH/pinghai_laihuer.png' }, // 漂渝津·隋征东舟师
    pingyuan: { generalId: 'pingyuan_yanzhenqing', generalName: '颜真卿', portrait: '/assets/litang/pingyuan_yanzhenqing.png' }, // 平原·首倡义兵抗安史
    linhu: { generalId: 'linhu_zhaowulingwang', generalName: '赵雍', portrait: '/assets/xianqin/linhu_zhaowulingwang.png' }, // 偏头关·胡服骑射
    xianyu: { generalId: 'xianyu_hanxin', generalName: '韩信', portrait: '/assets/liuhan/xianyu_hanxin.png' }, // 井陉关·韩信
    shizhao_d: { generalId: 'shizhao_d_shihu', generalName: '石虎', portrait: '/assets/HEXI/shizhao_d_shihu.png' }, // 邢台·后赵武帝
    loufan: { generalId: 'loufan_xuerengui', generalName: '薛仁贵', portrait: '/assets/NORTH/loufan_xuerengui.png' },
    shanrong: { generalId: 'shanrong_tianchou', generalName: '田畴', portrait: '/assets/NORTH/shanrong_tianchou.png' }, // 无终·田畴导曹操伐乌桓

    // ── 北方关隘 2026-06-19 ──
    you: { generalId: 'you_wangba', generalName: '王霸', portrait: '/assets/NORTH/you_wangba.png' },
    lingqiu: { generalId: 'lingqiu_zhaowuling', generalName: '赵武灵王', portrait: '/assets/xianqin/lingqiu_zhaowuling.png' },
    yi: { generalId: 'yi_yuqian', generalName: '于谦', portrait: '/assets/daming/yi_yuqian.png' },
    huo: { generalId: 'huo_huoshuchu', generalName: '霍叔处', portrait: '/assets/NORTH/huo_huoshuchu.png' },
    // ── 北方区 2026-06-18 ──
    jinzhou: { generalId: 'jinzhou_lichengliang', generalName: '李成梁', portrait: '/assets/daming/jinzhou_lichengliang.png' },
    zu_d: { generalId: 'zu_d_zudashou', generalName: '祖大寿', portrait: '/assets/daming/zu_d_zudashou.png' },
    mao_wenlong: { generalId: 'mao_wenlong_maowenlong', generalName: '毛文龙', portrait: '/assets/NORTHEAST/mao_wenlong_maowenlong.png' },
    gongsun_d: { generalId: 'gongsun_d_gongsundu', generalName: '公孙度', portrait: '/assets/NORTH/gongsun_d_gongsundu.png' },
    jianzhou_nvzhen: { generalId: 'jianzhou_nvzhen_limanzhu', generalName: '李满住', portrait: '/assets/NORTH/jianzhou_nvzhen_limanzhu.png' }, // 浑江·建州女真卫
    weihaiwei: { generalId: 'weihaiwei_sudingfang', generalName: '苏定方', portrait: '/assets/CENTRAL/weihaiwei_sudingfang.png' },
    xuan: { generalId: 'xuan_mafang', generalName: '徐达', portrait: '/assets/daming/xuan_mafang.png' },
    tuoba: { generalId: 'tuoba_tuobagui', generalName: '拓跋珪', portrait: '/assets/STEPPE/tuoba_tuobagui.png' },
    qingyuan_bd: { generalId: 'qingyuan_bd_zhoudewei', generalName: '周德威', portrait: '/assets/NORTH/qingyuan_bd_zhoudewei.png' },
    changshan: { generalId: 'changshan_yanyangzhao', generalName: '杨延昭', portrait: '/assets/zhaosong/changshan_yanyangzhao.png' },
    hejian: { generalId: 'hejian_gongsunzan', generalName: '公孙瓒', portrait: '/assets/NORTH/hejian_gongsunzan.png' }, // 文安·河间郡公孙瓒白马义从
    liangshidu: { generalId: 'liangshidu_longjia', generalName: '龙贾', portrait: '/assets/NORTH/liangshidu_longjia.png' }, // 雕阴·魏将龙贾戍守抗秦
    yangshe: { generalId: 'yangshe_yangshezhi', generalName: '羊舌职', portrait: '/assets/NORTH/yangshe_yangshezhi.png' }, // 铜鞮·晋羊舌氏封邑
    guzhu: { generalId: 'guzhu_tianyu', generalName: '田豫', portrait: '/assets/NORTH/guzhu_tianyu.png' }, // 肥如·魏征北将军田豫镇北疆
    dizhou: { generalId: 'dizhou_wangyanzhang', generalName: '王彦章', portrait: '/assets/NORTH/dizhou_wangyanzhang.png' }, // 乐安·后梁铁枪王彦章
    qu_d: { generalId: 'qu_d_quyi', generalName: '麴义', portrait: '/assets/NORTH/qu_d_quyi.png' },
    gaoqi_d: { generalId: 'gaoqi_d_gaohuan', generalName: '高欢', portrait: '/assets/CENTRAL/gaoqi_d_gaohuan.png' },
    wangyan: { generalId: 'wangyan_wangyan_tx', generalName: '王彦', portrait: '/assets/NORTH/wangyan_wangyan_tx.png' },
    linyu: { generalId: 'linyu_wusangui', generalName: '吴三桂', portrait: '/assets/daming/linyu_wusangui.png' },
    dai_d: { generalId: 'dai_d_tuobashiyijian', generalName: '拓跋什翼犍', portrait: '/assets/HEXI/dai_d_tuobashiyijian.png' },
    erzhu: { generalId: 'erzhu_erzhurong', generalName: '尔朱荣', portrait: '/assets/HEXI/erzhu_erzhurong.png' },
    zhe_d: { generalId: 'zhe_d_zheyuqing', generalName: '折御卿', portrait: '/assets/NORTH/zhe_d_zheyuqing.png' },
    heng1: { generalId: 'heng1_limu_yanyue', generalName: '李牧', portrait: '/assets/xianqin/heng1_limu_yanyue.png' },
    dingxiang_d: { generalId: 'dingxiang_d_lijing', generalName: '李靖', portrait: '/assets/litang/dingxiang_d_lijing.png' },
    xiayang_d: { generalId: 'xiayang_d_liji', generalName: '李勣', portrait: '/assets/litang/xiayang_d_liji.png' },
    ying: { generalId: 'ying_caojingzong', generalName: '曹景宗', portrait: '/assets/JIANGNAN/ying_caojingzong.png' },
    kejia: { generalId: 'kejia_wentianxiang', generalName: '文天祥', portrait: '/assets/zhaosong/kejia_wentianxiang.png' },
    tingzhou_d: { generalId: 'tingzhou_d_chenmin', generalName: '陈敏', portrait: '/assets/zhaosong/kejia_wentianxiang.png' },
    fu2: { generalId: 'fu2_zhoudi', generalName: '周迪', portrait: '/assets/JIANGNAN/fu2_zhoudi.png' },
    ouyang: { generalId: 'ouyang_ouyangyi', generalName: '欧阳頠', portrait: '/assets/JIANGNAN/ouyang_ouyangyi.png' },
    chu_d: { generalId: 'chu_d_chuguangyi', generalName: '储光羲', portrait: '/assets/zhaosong/chu_d_chuguangyi.png' },
    yan: { generalId: 'yan_leyi', generalName: '乐毅', portrait: '/assets/xianqin/yan_leyi.png' },
    zhao: { generalId: 'zhao_lianpo', generalName: '廉颇', portrait: '/assets/xianqin/zhao_lianpo.png' },
    yunzhong: { generalId: 'yunzhong_tuobaliwei', generalName: '拓跋力微', portrait: '/assets/NORTH/yunzhong_tuobaliwei.png' },
    yang_aner: { generalId: 'yang_aner_yanganer', generalName: '杨安儿', portrait: '/assets/LINGNAN/yang_aner_yanganer.png' },
        xie_cj_d: { generalId: 'xie_cj_d_xingfangde', generalName: '谢枋得', portrait: '/assets/JIANGNAN/xie_cj_d_xingfangde.png' }, // 葛溪·信州抗元殉国
    wan: { generalId: 'wan_lidian', generalName: '李典', portrait: '/assets/JIANGNAN/wan_lidian.png' }, // 皖城·曹魏守合肥
    huang_d: { generalId: 'huang_d_sunshuao', generalName: '孙叔敖', portrait: '/assets/JIANGNAN/huang_d_sunshuao.png' }, // 弋阳·楚国名相
    wenzhou: { generalId: 'wenzhou_zhangcong', generalName: '张璁', portrait: '/assets/JIANGNAN/wenzhou_zhangcong.png' }, // 永嘉·明首辅抗倭
    wuling: { generalId: 'wuling_xiangdancheng', generalName: '相单程', portrait: '/assets/JIANGNAN/wuling_xiangdancheng.png' },

// ── 江南区 2026-06-18 ──
    jiujiang: { generalId: 'jiujiang_zhouyu', generalName: '周瑜', portrait: '/assets/JIANGNAN/jiujiang_zhouyu.png' },
    fangla: { generalId: 'fangla_fangla_jn', generalName: '方腊', portrait: '/assets/JIANGNAN/fangla_fangla_jn.png' },
    fang_guozhen: { generalId: 'fang_guozhen_fangguozhen', generalName: '方国珍', portrait: '/assets/JIANGNAN/fang_guozhen_fangguozhen.png' },
    ouyue: { generalId: 'ouyue_zouyao', generalName: '驺摇', portrait: '/assets/JIANGNAN/ouyue_zouyao.png' },
    ruochu: { generalId: 'ruochu_doulian', generalName: '鬬廉', portrait: '/assets/JIANGNAN/ruochu_doulian.png' },
    wuwu_d: { generalId: 'wuwu_d_lvmeng', generalName: '吕蒙', portrait: '/assets/JIANGNAN/wuwu_d_lvmeng.png' },
        sunwu_d: { generalId: 'sunwu_d_sunquan', generalName: '孙权', portrait: '/assets/JIANGNAN/sunwu_d_sunquan.png' },
    yue: { generalId: 'yue_goujian', generalName: '勾践', portrait: '/assets/xianqin/yue_goujian.png' },
    heng: { generalId: 'heng_hetengjiao', generalName: '何腾蛟', portrait: '/assets/JIANGNAN/heng_hetengjiao.png' },
    xushouhui: { generalId: 'xushouhui_zhaopusheng', generalName: '赵普胜', portrait: '/assets/JIANGNAN/xushouhui_zhaopusheng.png' },
    sui: { generalId: 'sui_yangjian', generalName: '杨坚', portrait: '/assets/JIANGNAN/sui_yangjian.png' },
    changshaguo: { generalId: 'changshaguo_xinqiji', generalName: '辛弃疾', portrait: '/assets/zhaosong/changshaguo_xinqiji.png' },
    yue_d: { generalId: 'yue_d_yuefei', generalName: '岳飞', portrait: '/assets/zhaosong/yue_d_yuefei.png' },
    zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', generalName: '张士诚', portrait: '/assets/LINGNAN/zhangshicheng_zhangshicheng.png' },
    wu: { generalId: 'wu_sunwu', generalName: '孙武', portrait: '/assets/xianqin/wu_sunwu.png' },
    qian_d: { generalId: 'qian_d_yudayou', generalName: '俞大猷', portrait: '/assets/JIANGNAN/qian_d_yudayou.png' },
    qiufu: { generalId: 'qiufu_qiufu_jn', generalName: '裘甫', portrait: '/assets/JIANGNAN/qiufu_qiufu_jn.png' },
    qi_d: { generalId: 'qi_d_qijiguang', generalName: '戚继光', portrait: '/assets/daming/qi_d_qijiguang.png' },
    yiyang_d: { generalId: 'yiyang_d_mengzongzheng', generalName: '孟宗政', portrait: '/assets/JIANGNAN/yiyang_d_mengzongzheng.png' },
    yezongliu: { generalId: 'yezongliu_yezongliu', generalName: '叶宗留', portrait: '/assets/JIANGNAN/yezongliu_yezongliu.png' },
    shenshi: { generalId: 'shenshi_shenqingzhi', generalName: '沈庆之', portrait: '/assets/JIANGNAN/shenshi_shenqingzhi.png' },
    huangwang: { generalId: 'huangwang_huangchao', generalName: '黄巢', portrait: '/assets/JIANGNAN/huangwang_huangchao.png' },
    lujian: { generalId: 'lujian_zhanghuangyan', generalName: '张煌言', portrait: '/assets/JIANGNAN/lujian_zhanghuangyan.png' },
    linshihong: { generalId: 'linshihong_linshihong', generalName: '林士弘', portrait: '/assets/JIANGNAN/linshihong_linshihong.png' },
    liu: { generalId: 'liu_yingbu', generalName: '英布', portrait: '/assets/JIANGNAN/liu_yingbu.png' },
    // ting 已迁 wenzhou，王潮（闽国）归福建系
    shuntian: { generalId: 'shuntian_linshuangwen', generalName: '林爽文', portrait: '/assets/JIANGNAN/shuntian_linshuangwen.png' },
    chunshen: { generalId: 'chunshen_huangxie', generalName: '黄歇', portrait: '/assets/xianqin/chunshen_huangxie.png' },
    mi_chu: { generalId: 'mi_chu_chuzhuangwang', generalName: '熊旅', portrait: '/assets/JIANGNAN/mi_chu_chuzhuangwang.png' },
    shanyue: { generalId: 'shanyue_sunce', generalName: '孙策', portrait: '/assets/JIANGNAN/shanyue_sunce.png' },
    she_ethnic: { generalId: 'she_ethnic_leiwanxing', generalName: '雷万兴', portrait: '/assets/JIANGNAN/she_ethnic_leiwanxing.png' },
    wang_s: { generalId: 'wang_s_wanghua', generalName: '汪华', portrait: '/assets/JIANGNAN/wang_s_wanghua.png' },
    hongzhou: { generalId: 'hongzhou_zhuwenzheng', generalName: '朱文正', portrait: '/assets/JIANGNAN/hongzhou_zhuwenzheng.png' },
    danyang: { generalId: 'danyang_yuyunwen', generalName: '虞允文', portrait: '/assets/zhaosong/danyang_yuyunwen.png' },
    chizhou: { generalId: 'chizhou_wumingche', generalName: '吴明彻', portrait: '/assets/JIANGNAN/chizhou_wumingche.png' },
    gumie: { generalId: 'gumie_liuyu', generalName: '刘裕', portrait: '/assets/JIANGNAN/gumie_liuyu.png' },
    hu_d: { generalId: 'hu_d_husansheng', generalName: '胡三省', portrait: '/assets/JIANGNAN/hu_d_husansheng.png' },
    sagami: { generalId: 'sagami_hojoujiyasu', generalName: '北条氏康', portrait: '/assets/JAPAN/sagami_hojoujiyasu.png' },
    mino: { generalId: 'mino_otaniyoshitsugu', generalName: '大谷吉继', portrait: '/assets/JAPAN/mino_otaniyoshitsugu.png' },
    zhuqian: { generalId: 'zhuqian_shaozizheng', generalName: '少贰资能', portrait: '/assets/JAPAN/zhuqian_shaozizheng.png' },
    ssangseong: { generalId: 'ssangseong_cuiying', generalName: '崔莹', portrait: '/assets/KOREA/naju_d_wangjian_kr.png' },
    yao: { generalId: 'yao_liuyuan', generalName: '刘渊', portrait: '/assets/CENTRAL/yao_liuyuan.png' },
    kong_d: { generalId: 'kong_d_kongrong', generalName: '孔融', portrait: '/assets/CENTRAL/kong_d_kongrong.png' },
    tongma: { generalId: 'tongma_liuang', generalName: '刘卬', portrait: '/assets/CENTRAL/tongma_liuang.png' },
    yanchuan_d: { generalId: 'yanchuan_d_hanyu', generalName: '韩愈', portrait: '/assets/CENTRAL/yanchuan_d_hanyu.png' },
    guide_d: { generalId: 'guide_d_mashumou', generalName: '麻叔谋', portrait: '/assets/CENTRAL/guide_d_mashumou.png' },
    tongzhou: { generalId: 'tongzhou_yangzhiji', generalName: '杨智积', portrait: '/assets/CENTRAL/tongzhou_yangzhiji.png' },
    fu_zhou: { generalId: 'fu_zhou_yanyan', generalName: '严颜', portrait: '/assets/BASHU/fu_zhou_yanyan.png' },
    lushui: { generalId: 'lushui_beigongboyu', generalName: '北宫伯玉', portrait: '/assets/HEXI/lushui_beigongboyu.png' },
    cen_d: { generalId: 'cen_d_cenmeng', generalName: '岑猛', portrait: '/assets/LINGNAN/cen_d_cenmeng.png' },
    miao: { generalId: 'miao_amishi', generalName: '阿迷氏', portrait: '/assets/LINGNAN/miao_amishi.png' },
    jiang_s: { generalId: 'jiang_s_jiangwan', generalName: '蒋琬', portrait: '/assets/LINGNAN/jiang_s_jiangwan.png' },
    muong: { generalId: 'muong_shencongyue', generalName: '申从岳', portrait: '/assets/LINGNAN/muong_shencongyue.png' },
    panyao: { generalId: 'panyao_panhu', generalName: '盘瓠', portrait: '/assets/LINGNAN/panyao_panhu.png' },
    chen2: { generalId: 'chen2_zhaofan', generalName: '赵范', portrait: '/assets/LINGNAN/chen2_zhaofan.png' },
    qian: { generalId: 'qian_songjingyang', generalName: '宋景阳', portrait: '/assets/LINGNAN/qian_songjingyang.png' },
    qinghai: { generalId: 'qinghai_yuezhongqi', generalName: '岳钟琪', portrait: '/assets/BASHU/qinghai_yuezhongqi.png' },
    jiashi: { generalId: 'jiashi_lixuance', generalName: '李玄策', portrait: '/assets/TIBET/jiashi_lixuance.png' },
    yangtong: { generalId: 'yangtong_chisongdezan', generalName: '赤松德赞', portrait: '/assets/TIBET/yangtong_chisongdezan.png' },
    monpa: { generalId: 'monpa_meireiluozhujiacuo', generalName: '梅惹·洛珠嘉措', portrait: '/assets/TIBET/monpa_meireiluozhujiacuo.png' },
    xining: { generalId: 'xining_yangyingju', generalName: '杨应琚', portrait: '/assets/TIBET/xining_yangyingju.png' },
    kalun: { generalId: 'kalun_dexinga', generalName: '德兴阿', portrait: '/assets/TIBET/kalun_dexinga.png' },
    golog: { generalId: 'golog_wandezhaxi', generalName: '完德扎西', portrait: '/assets/TIBET/golog_wandezhaxi.png' },
    lopi: { generalId: 'lopi_abo', generalName: '阿波', portrait: '/assets/TIBET/lopi_abo.png' },
    donghu: { generalId: 'donghu_tuiyin', generalName: '推寅', portrait: '/assets/STEPPE/donghu_tuiyin.png' },
    dingling: { generalId: 'dingling_dinglingwang', generalName: '卫律', portrait: '/assets/STEPPE/dingling_dinglingwang.png' },
    yingzhou_ying_d: { generalId: 'yingzhou_ying_d_muronghuang', generalName: '慕容皝', portrait: '/assets/NORTHEAST/yingzhou_ying_d_muronghuang.png' },
    buriat: { generalId: 'buriat_tumenjiergale', generalName: '图门吉尔嘎勒', portrait: '/assets/STEPPE/buriat_tumenjiergale.png' },
    oirat_ming: { generalId: 'oirat_ming_gaerdan', generalName: '噶尔丹', portrait: '/assets/STEPPE/oirat_ming_gaerdan.png' },
    donghui: { generalId: 'donghui_nanlv', generalName: '南闾', portrait: '/assets/KOREA/donghui_nanlv.png' },
    gonggu: { generalId: 'gonggu_gonggudaozhu', generalName: '宫古岛主', portrait: '/assets/JAPAN/gonggu_gonggudaozhu.png' },
    yizhi: { generalId: 'yizhi_yizhiwang', generalName: '卑狗', portrait: '/assets/JAPAN/yizhi_yizhiwang.png' },
    beihai: { generalId: 'beihai_ayinuqiuzhang', generalName: '沙牟奢允', portrait: '/assets/JAPAN/beihai_ayinuqiuzhang.png' },
    sheng_d: { generalId: 'sheng_d_liyiqi', generalName: '李亿祺', portrait: '/assets/KOREA/sheng_d_liyiqi.png' },
    haikou: { generalId: 'haikou_wangzhi_pirate', generalName: '汪直', portrait: '/assets/LINGNAN/haikou_wangzhi_pirate.png' },
    shanshan: { generalId: 'shanshan_weituqi', generalName: '尉屠耆', portrait: '/assets/WESTERN/shanshan_weituqi.png' },
    qianhui: { generalId: 'qianhui_baiyanhu', generalName: '白彦虎', portrait: '/assets/BASHU/li_lx_d_lichong.png' },
    ava: { generalId: 'ava_sijifa', generalName: '思机法', portrait: '/assets/DIANQIAN/ava_sijifa.png' },
    dian: { generalId: 'dian_duanjianwei', generalName: '段俭魏', portrait: '/assets/DIANQIAN/ava_sijifa.png' },
    mon: { generalId: 'mon_monuhe', generalName: '摩奴诃', portrait: '/assets/DIANQIAN/ava_sijifa.png' },
    ganden: { generalId: 'ganden_zongkaba', generalName: '宗喀巴', portrait: '/assets/TIBET/ganden_zongkaba.png' },
    niang: { generalId: 'niang_suonanjiabo', generalName: '索南加波', portrait: '/assets/TIBET/ganden_zongkaba.png' },
    dalung: { generalId: 'dalung_sangjiwen', generalName: '桑吉温', portrait: '/assets/TIBET/ganden_zongkaba.png' },
    dong: { generalId: 'dong_nangqianjiabo', generalName: '囊谦加波', portrait: '/assets/TIBET/ganden_zongkaba.png' },
    hor: { generalId: 'hor_chisang', generalName: '赤桑', portrait: '/assets/TIBET/ganden_zongkaba.png' },
    cheng: { generalId: 'cheng_gongsunshu', generalName: '公孙述', portrait: '/assets/BASHU/li_lx_d_lichong.png' },
    pyu: { generalId: 'pyu_molingtuo', generalName: '摩罗', portrait: '/assets/DIANQIAN/ava_sijifa.png' },
    nongzhigao: { generalId: 'nongzhigao_huangshimi', generalName: '黄师宓', portrait: '/assets/LINGNAN/haikou_wangzhi_pirate.png' },
    weitou: { generalId: 'weitou_douti', generalName: '兜题', portrait: '/assets/WESTERN/weitou_douti.png' },
    yumi: { generalId: 'yumi_anguo', generalName: '安国', portrait: '/assets/WESTERN/yumi_anguo.png' },
    qiemo: { generalId: 'qiemo_anmoshenpan', generalName: '安末深盘', portrait: '/assets/WESTERN/qiemo_anmoshenpan.png' },
    pishan: { generalId: 'pishan_daihu', generalName: '代胡', portrait: '/assets/WESTERN/pishan_daihu.png' },
    ruoqiang: { generalId: 'ruoqiang_ruoqiang_wang', generalName: '去胡来', portrait: '/assets/WESTERN/ruoqiang_ruoqiang_wang.png' },
    weili: { generalId: 'weili_fan_d', generalName: '尉犁泛', portrait: '/assets/WESTERN/weili_fan_d.png' },
    wensu: { generalId: 'wensu_guyi', generalName: '姑翼', portrait: '/assets/WESTERN/wensu_guyi.png' },
    duerbote: { generalId: 'duerbote_duerbote_taiji', generalName: '杜尔伯特台吉', portrait: '/assets/WESTERN/duerbote_duerbote_taiji.png' },
    xiye: { generalId: 'xiye_xiye_wang', generalName: '子合', portrait: '/assets/WESTERN/xiye_xiye_wang.png' },
    faqiang: { generalId: 'faqiang_niechizanpu', generalName: '聂赤', portrait: '/assets/TIBET/faqiang_niechizanpu.png' },
    zhuoshi: { generalId: 'zhuoshi_zhuowangsun', generalName: '卓王孙', portrait: '/assets/BASHU/zhuoshi_zhuowangsun.png' },
    xingliao: { generalId: 'xingliao_dayanlin', generalName: '大延琳', portrait: '/assets/KOREA/xingliao_dayanlin.png' },
    xihai_d: { generalId: 'xihai_d_fulianchou', generalName: '伏连筹', portrait: '/assets/TIBET/xihai_d_fulianchou.png' },
    guzgan: { generalId: 'guzgan_abulihalisi', generalName: '阿布·哈里斯', portrait: '/assets/CENTRAL_ASIA/guzgan_abulihalisi.png' },
    kawusi: { generalId: 'kawusi_haidaer', generalName: '海达尔', portrait: '/assets/CENTRAL_ASIA/kawusi_haidaer.png' },
    xianhai: { generalId: 'xianhai_shamalike', generalName: '沙马利克', portrait: '/assets/CENTRAL_ASIA/xianhai_shamalike.png' },
    wuhu: { generalId: 'wuhu_dukake', generalName: '都卡克', portrait: '/assets/CENTRAL_ASIA/wuhu_dukake.png' },
    xingan: { generalId: 'xingan_kalunshiwei', generalName: '海兰察', portrait: '/assets/STEPPE/xingan_kalunshiwei.png' },
    dongping: { generalId: 'dongping_langtan', generalName: '郎坦', portrait: '/assets/NORTHEAST/dongping_langtan.png' },
    badakhshan: { generalId: 'badakhshan_luozhentan', generalName: '雅尔·贝格', portrait: '/assets/CENTRAL_ASIA/badakhshan_luozhentan.png' },
    keliya: { generalId: 'keliya_fuduxin', generalName: '伏阇信', portrait: '/assets/TIBET/keliya_fuduxin.png' },
    bailong: { generalId: 'bailong_suomai', generalName: '索劢', portrait: '/assets/WESTERN/bailong_suomai.png' },
    sai: { generalId: 'sai_gejiayun', generalName: '盖嘉运', portrait: '/assets/WESTERN/sai_gejiayun.png' },
    weiwuer: { generalId: 'weiwuer_yusubu', generalName: '玉素布', portrait: '/assets/WESTERN/weiwuer_yusubu.png' },
    kangba: { generalId: 'kangba_suonuomugunbu', generalName: '索诺木衮布', portrait: '/assets/TIBET/kangba_suonuomugunbu.png' },
    yong: { generalId: 'yong_lujili', generalName: '庐戢黎', portrait: '/assets/BASHU/yong_lujili.png' },
    jingcheng_d: { generalId: 'jingcheng_d_yuyouzhao', generalName: '鱼有沼', portrait: '/assets/KOREA/jingcheng_d_yuyouzhao.png' },
    xin: { generalId: 'xin_baiqi', generalName: '白起', portrait: '/assets/yingqin/xin_baiqi.png' },
  pangzha: { generalId: 'pangzha_halixingge', generalName: '哈里·辛格', portrait: '/assets/CENTRAL_ASIA/pangzha_halixingge.png' },
  najie: { generalId: 'najie_minande', generalName: '米南德', portrait: '/assets/CENTRAL_ASIA/najie_minande.png' },
  dulan_d: { generalId: 'dulan_d_aihamaide', generalName: '艾哈迈德', portrait: '/assets/CENTRAL_ASIA/huarazim_mohemo.png' },
  muer: { generalId: 'muer_mujier', generalName: '穆吉尔', portrait: '/assets/CENTRAL_ASIA/muer_mujier.png' },
  baha: { generalId: 'baha_gaiwamu', generalName: '盖瓦姆', portrait: '/assets/CENTRAL_ASIA/baha_gaiwamu.png' },
  hali: { generalId: 'hali_subashi', generalName: '苏巴什', portrait: '/assets/CENTRAL_ASIA/hali_subashi.png' },
  kalan: { generalId: 'kalan_suhela', generalName: '苏赫拉', portrait: '/assets/CENTRAL_ASIA/kalan_suhela.png' },
  xisi: { generalId: 'xisi_yakubusafaer', generalName: '雅库布·萨法尔', portrait: '/assets/CENTRAL_ASIA/xisi_yakubusafaer.png' },
  delan: { generalId: 'delan_sulun', generalName: '苏伦', portrait: '/assets/CENTRAL_ASIA/delan_sulun.png' },
  huluo: { generalId: 'huluo_abumusilin', generalName: '阿布·穆斯林', portrait: '/assets/CENTRAL_ASIA/jibin_qiujiuque.png' },
  aba: { generalId: 'aba_shapuer', generalName: '沙普尔', portrait: '/assets/CENTRAL_ASIA/aba_shapuer.png' },
    wenling: { generalId: 'wenling_shilang', generalName: '施琅', portrait: '/assets/JIANGNAN/wenling_shilang.png' },
    qianzhou: { generalId: 'qianzhou_lisheng', generalName: '李晟', portrait: '/assets/litang/qianzhou_lisheng.png' },
    wuyue: { generalId: 'wuyue_qianliu', generalName: '钱镠', portrait: '/assets/JIANGNAN/wuyue_qianliu.png' },

    song: { generalId: 'song_zhaokuangyin', generalName: '赵匡胤', portrait: '/assets/zhaosong/song_zhaokuangyin.png' },
    chuzhou_d: { generalId: 'chuzhou_d_dugao', generalName: '杜杲', portrait: '/assets/JIANGNAN/chuzhou_d_dugao.png' },
    xiyuduhu: { generalId: 'xiyuduhu_banchao', generalName: '班超', portrait: '/assets/liuhan/xiyuduhu_banchao.png' },
};

/** 取某势力的开局名将；未配置返回 null（该势力不带将） */
export function getFactionGeneral(factionId: string): FactionGeneral | null {
    const general = FACTION_GENERALS[factionId];
    if (!general) return null;
    const portrait = _generalPortraitOverrides[general.generalId] ?? general.portrait;
    return {
        ...general,
        portrait: resolveGeneralPortraitPath(portrait, { factionId }),
    };
}

/** 按 generalId 查势力表条目（F2 绑立绘 / 名牌显示） */
const _generalPortraitOverrides: Record<string, string> = {};

/** F2 绑定后热更新（写盘完成前即时生效；HMR 后以 FactionGenerals.ts 为准） */
export function setGeneralPortraitOverride(generalId: string, portraitPath: string): void {
    _generalPortraitOverrides[generalId] = portraitPath;
}

export function getGeneralRecordByGeneralId(
    generalId: string,
    options?: { region?: import('../systems/RegionSystem').RegionType },
): FactionGeneral | null {
    for (const [factionId, general] of Object.entries(FACTION_GENERALS)) {
        if (general.generalId === generalId) {
            const dedicated = _generalPortraitOverrides[generalId] ?? general.portrait;
            return {
                ...general,
                portrait: resolveGeneralPortraitPath(dedicated, {
                    factionId,
                    region: options?.region,
                }),
            };
        }
    }
    return null;
}

