/**
 * 势力将领：势力开局自带的史实将领（一势力一将领一立绘，AI 也有）。
 *
 * 设计定案（GAME_DIRECTION.md「番号随城，将领随势」2026-06-16）：
 *   **将领随势**——将领绑 factionId，占城不过户（武周占汴梁不得吴起）。
 *   番号随城见 ExpeditionLegions.CITY_ELITE_LEGIONS / getLegionEliteLegionName。
 *
 * 载体规则（LegionManager 维护）：
 *   一个势力同一时刻只有**一支军团**扛将领（单载体不变式）；该军团覆没后，
 *   下一支新建的同势力军团接过将领。避免「白起×3」。
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

import { resolvePortraitAssetPath } from '../config/portrait_defaults';

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
    qin: { generalId: 'qin_baiqi', generalName: '白起', portrait: '/assets/qin/qin_baiqi.png' },
    tang: { generalId: 'tang_lishimin', generalName: '李世民', portrait: '/assets/litang/tang_lishimin.png' },
    wuzhou_d: { generalId: 'wuzhou_d_wuzetian', generalName: '武则天', portrait: '/assets/wuzhou/wuzhou_d_wuzetian.png' },
        ming_d: { generalId: 'ming_d_yuqian', generalName: '于谦', portrait: '/assets/daming/ming_d_yuqian.png' },
    jinling: { generalId: 'jinling_tandaoji', generalName: '檀道济', portrait: '/assets/jiangnan/jinling_tandaoji.png' },
    guangzhou: { generalId: 'guangzhou_liuyin', generalName: '刘隐', portrait: '/assets/lingnan/guangzhou_liuyin.png' },
    shu: { generalId: 'shu_zhugeliang', generalName: '诸葛亮', portrait: '/assets/shuguo/shu_zhugeliang.png' },
    yangzhou: { generalId: 'yangzhou_wangping', generalName: '王平', portrait: '/assets/shuguo/yangzhou_wangping.png' },
    yang_zhou: { generalId: 'yang_zhou_yangxingmi', generalName: '杨行密', portrait: '/assets/nanfang/yang_zhou_yangxingmi.png' },
    // cheng 阳安：岳钟琪已迁赤斤@赤金堡
    pagan: { generalId: 'pagan_anuluvtuo', generalName: '阿奴律陀', portrait: '/assets/dianmian/pagan_anuluvtuo.png' },
    liang_d: { generalId: 'liang_d_zhangxun', generalName: '张巡', portrait: '/assets/zhongyuan/liang_d_zhangxun.png' },
    qiuci: { generalId: 'qiuci_baiba', generalName: '白霸', portrait: '/assets/xiyu/qiuci_baiba.png' },
    tubo: { generalId: 'tubo_songzanganbu', generalName: '松赞干布', portrait: '/assets/tubo/tubo_songzanganbu.png' },
    menggu_d: { generalId: 'menggu_d_chengjisihan', generalName: '成吉思汗', portrait: '/assets/caoyuan/menggu_d_chengjisihan.png' },
    bohai: { generalId: 'bohai_dazuorong', generalName: '大祚荣', portrait: '/assets/dongbei/bohai_dazuorong.png' },
    goryeo: { generalId: 'goryeo_jiangganzan', generalName: '姜邯赞', portrait: '/assets/chaoxian/goryeo_jiangganzan.png' },
    ashikaga: { generalId: 'ashikaga_zulijunshi', generalName: '足利尊氏', portrait: '/assets/riben/ashikaga_zulijunshi.png' },
    tiemuer: { generalId: 'tiemuer_tiemuer', generalName: '帖木儿', portrait: '/assets/zhongya/tiemuer_tiemuer.png' },
    siam: { generalId: 'siam_nalixuan', generalName: '纳黎萱', portrait: '/assets/pugan/siam_nalixuan.png' },
    shang: { generalId: 'shang_fuhao', generalName: '妇好', portrait: '/assets/xianqin/shang_fuhao.png' },
    bing: { generalId: 'bing_liukun', generalName: '刘琨', portrait: '/assets/zhongyuan/bing_liukun.png' },
    min: { generalId: 'min_wangshenzhi', generalName: '王审知', portrait: '/assets/jiangnan/min_wangshenzhi.png' },
    quanzhou: { generalId: 'quanzhou_liucongxiao', generalName: '留从效', portrait: '/assets/jiangnan/quanzhou_liucongxiao.png' },
    han_d: { generalId: 'han_d_hanxin', generalName: '韩信', portrait: '/assets/liuhan/han_d_hanxin.png' },
    wei: { generalId: 'wei_wuqi', generalName: '吴起', portrait: '/assets/xianqin/wei_wuqi.png' },
    manzhou_d: { generalId: 'manzhou_d_duergan', generalName: '多尔衮', portrait: '/assets/manqing/manzhou_d_duergan.png' },
    xinluo: { generalId: 'xinluo_jinyixin', generalName: '金庾信', portrait: '/assets/chaoxian/xinluo_jinyixin.png' },
    edo: { generalId: 'edo_dechuangjiakang', generalName: '德川家康', portrait: '/assets/riben/edo_dechuangjiakang.png' },
    seljuq: { generalId: 'seljuq_sangjiaer', generalName: '桑贾尔', portrait: '/assets/zhongya/seljuq_sangjiaer.png' },
    chenla: { generalId: 'chenla_sheyebamoqishi', generalName: '阇耶跋摩七世', portrait: '/assets/pugan/chenla_sheyebamoqishi.png' },
    sizhou: { generalId: 'sizhou_hanshizhong', generalName: '韩世忠', portrait: '/assets/zhaosong/sizhou_hanshizhong.png' },
    // ── 日本区 2026-06-18 ──
    kai: { generalId: 'kai_wutianxinxuan', generalName: '武田信玄', portrait: '/assets/riben/kai_wutianxinxuan.png' },
    echigo: { generalId: 'echigo_shangshanqianxin', generalName: '上杉谦信', portrait: '/assets/riben/echigo_shangshanqianxin.png' },
    hashiba: { generalId: 'hashiba_fengchenxiuji', generalName: '丰臣秀吉', portrait: '/assets/riben/hashiba_fengchenxiuji.png' },
    sanada_d: { generalId: 'sanada_d_zhentianxingcun', generalName: '真田幸村', portrait: '/assets/riben/sanada_d_zhentianxingcun.png' },
    date_d: { generalId: 'date_d_yidazhengzong', generalName: '伊达政宗', portrait: '/assets/riben/date_d_yidazhengzong.png' },
    owari: { generalId: 'owari_zhitianxinchang', generalName: '织田信长', portrait: '/assets/riben/owari_zhitianxinchang.png' },
    totomi: { generalId: 'totomi_sakaitadatsugu', generalName: '酒井忠次', portrait: '/assets/riben/totomi_sakaitadatsugu.png' },
    jinchuan: { generalId: 'jinchuan_jinchuanyiyuan', generalName: '今川义元', portrait: '/assets/riben/higo_d_juchiwuguang.png' },
    aki: { generalId: 'aki_maoliyuanjiu', generalName: '毛利元就', portrait: '/assets/riben/aki_maoliyuanjiu.png' },
    chosokabe: { generalId: 'chosokabe_changzongwobuyuanqin', generalName: '长宗我部元亲', portrait: '/assets/riben/chosokabe_changzongwobuyuanqin.png' },
    satsuma: { generalId: 'satsuma_daojinjiajiu', generalName: '岛津家久', portrait: '/assets/riben/satsuma_daojinjiajiu.png' },
    otomo_d: { generalId: 'otomo_d_lihuadaoxue', generalName: '立花道雪', portrait: '/assets/riben/otomo_d_lihuadaoxue.png' },
    izumo: { generalId: 'izumo_shanzhonglujie', generalName: '山中鹿介', portrait: '/assets/riben/izumo_shanzhonglujie.png' },
    kaga_d: { generalId: 'kaga_d_xiajianlaizheng', generalName: '下间赖廉', portrait: '/assets/riben/kaga_d_xiajianlaizheng.png' },
    iga_d: { generalId: 'iga_d_baididanbo', generalName: '百地丹波', portrait: '/assets/riben/iga_d_baididanbo.png' },
    jibei2: { generalId: 'jibei2_qingshuizongzhi', generalName: '清水宗治', portrait: '/assets/riben/jibei2_qingshuizongzhi.png' },
    yamato: { generalId: 'yamato_nanmuzhengcheng', generalName: '楠木正成', portrait: '/assets/riben/yamato_nanmuzhengcheng.png' },
    aizu: { generalId: 'aizu_pushengshixiang', generalName: '蒲生氏乡', portrait: '/assets/riben/aizu_pushengshixiang.png' },
    suwa_d: { generalId: 'suwa_d_zoufanglaizhong', generalName: '诹访赖重', portrait: '/assets/riben/suwa_d_zoufanglaizhong.png' },
    shimotsuke: { generalId: 'shimotsuke_yudugongguanggang', generalName: '宇都宫广纲', portrait: '/assets/riben/yudugongguogang.png' },
    higo_d: { generalId: 'higo_d_juchiwuguang', generalName: '菊池武光', portrait: '/assets/riben/higo_d_juchiwuguang.png' },
    iyo_d: { generalId: 'iyo_d_cunshangwuji', generalName: '村上武吉', portrait: '/assets/riben/iyo_d_cunshangwuji.png' },
    nanbu: { generalId: 'nanbu_nanbuqingzheng', generalName: '南部晴政', portrait: '/assets/riben/nanbu_nanbuqingzheng.png' },
    osumi: { generalId: 'osumi_ganfujianxu', generalName: '肝付兼续', portrait: '/assets/riben/osumi_ganfujianxu.png' },
    fujiwara: { generalId: 'fujiwara_yuanyijing', generalName: '源义经', portrait: '/assets/riben/fujiwara_yuanyijing.png' },
    kakizaki: { generalId: 'kakizaki_liqiqingguang', generalName: '蛎崎庆广', portrait: '/assets/riben/kakizaki_liqiqingguang.png' },
    ayinu: { generalId: 'ayinu_hushemoquan', generalName: '胡奢魔犬', portrait: '/assets/riben/ayinu_hushemoquan.png' },
    so: { generalId: 'so_zongyizhi', generalName: '宗义智', portrait: '/assets/riben/so_zongyizhi.png' },
    taira: { generalId: 'taira_pingzhisheng', generalName: '平知盛', portrait: '/assets/riben/taira_pingzhisheng.png' },
        lelang: { generalId: 'lelang_wangqi', generalName: '王颀', portrait: '/assets/chaoxian/lelang_wangqi.png' },
    anmei: { generalId: 'anmei_yuwandaqin', generalName: '与湾大亲', portrait: '/assets/riben/anmei_yuwandaqin.png' },

// ── 朝鲜区 2026-06-18 ──
    chen3: { generalId: 'chen3_chenwang', generalName: '箕准', portrait: '/assets/chaoxian/chen3_chenwang.png' },
    joseon: { generalId: 'joseon_lichenggui', generalName: '李成桂', portrait: '/assets/chaoxian/joseon_lichenggui.png' },
    gaogouli: { generalId: 'gaogouli_yizhiwende', generalName: '乙支文德', portrait: '/assets/chaoxian/gaogouli_yizhiwende.png' },
    baiji: { generalId: 'baiji_jiebai', generalName: '阶伯', portrait: '/assets/chaoxian/xinluo_jinyixin.png' },
    zhen: { generalId: 'zhen_zhenxuan', generalName: '甄萱', portrait: '/assets/chaoxian/zhen_zhenxuan.png' },
    danluo: { generalId: 'danluo_jintongjing', generalName: '金通精', portrait: '/assets/chaoxian/danluo_jintongjing.png' },
    sambyeol: { generalId: 'sambyeol_lishunchen', generalName: '李舜臣', portrait: '/assets/chaoxian/sambyeol_lishunchen.png' },
    hai2: { generalId: 'hai2_zhengdi', generalName: '郑地', portrait: '/assets/chaoxian/hai2_zhengdi.png' },
    gaya: { generalId: 'gaya_jinshoulu', generalName: '金首露', portrait: '/assets/chaoxian/gaya_jinshoulu.png' },

    xuantu: { generalId: 'xuantu_yuangaisuwen', generalName: '渊盖苏文', portrait: '/assets/chaoxian/xuantu_yuangaisuwen.png' },
    naju_d: { generalId: 'naju_d_wangjian_kr', generalName: '王建', portrait: '/assets/chaoxian/ssangseong_cuiying.png' },
    chungju_d: { generalId: 'chungju_d_quanli', generalName: '权栗', portrait: '/assets/chaoxian/chungju_d_quanli.png' },
    sabeol: { generalId: 'sabeol_jinshimin', generalName: '金时敏', portrait: '/assets/chaoxian/sabeol_jinshimin.png' },
        huimo: { generalId: 'huimo_gaoyanshou', generalName: '高延寿', portrait: '/assets/dongbei/huimo_gaoyanshou.png' },
    aola: { generalId: 'aola_menglielun', generalName: '孟烈伦', portrait: '/assets/dongbei/aola_menglielun.png' },
    ewenki: { generalId: 'ewenki_bombogor', generalName: '博木博果尔', portrait: '/assets/dongbei/ewenki_bombogor.png' },
    haixi_nvzhen: { generalId: 'haixi_nvzhen_baiyindali', generalName: '拜音达里', portrait: '/assets/dongbei/haixi_nvzhen_baiyindali.png' },
    dazhen: { generalId: 'dazhen_wanyantiege', generalName: '完颜铁哥', portrait: '/assets/dongbei/dazhen_wanyantiege.png' },
    yehe: { generalId: 'yehe_jintaiji', generalName: '金台吉', portrait: '/assets/dongbei/yehe_jintaiji.png' },

// ── 东北区 2026-06-18 ──
    jilizhou: { generalId: 'jilizhou_chengmingzhen', generalName: '程名振', portrait: '/assets/dongbei/jilizhou_chengmingzhen.png' },
    nuergan: { generalId: 'nuergan_kangwang', generalName: '康旺', portrait: '/assets/dongbei/nuergan_kangwang.png' },
    manzhou: { generalId: 'manzhou_nuerhachi', generalName: '努尔哈赤', portrait: '/assets/dongbei/manzhou_nuerhachi.png' },

    wuliangha: { generalId: 'wuliangha_zhelemei', generalName: '者勒蔑', portrait: '/assets/dongbei/wuliangha_zhelemei.png' },
    fuyu: { generalId: 'fuyu_weichoutai', generalName: '尉仇台', portrait: '/assets/dongbei/fuyu_weichoutai.png' },
    dajin: { generalId: 'dajin_wanyanaguda', generalName: '阿骨打', portrait: '/assets/dongbei/dajin_wanyanaguda.png' },
    yizhou: { generalId: 'yizhou_wanyanloushi', generalName: '完颜娄室', portrait: '/assets/dongbei/yizhou_wanyanloushi.png' },
    aisin_d: { generalId: 'aisin_d_huangtaiji', generalName: '皇太极', portrait: '/assets/dongbei/aisin_d_huangtaiji.png' },
    xianbei: { generalId: 'xianbei_tuobamao', generalName: '拓跋毛', portrait: '/assets/dongbei/xianbei_tanshihuai.png' },
    suolun: { generalId: 'suolun_bomuboguoer', generalName: '博穆博果尔', portrait: '/assets/dongbei/suolun_bomuboguoer.png' },
    dongxia: { generalId: 'dongxia_puxianwannu', generalName: '蒲鲜万奴', portrait: '/assets/dongbei/dongxia_puxianwannu.png' },
    wula: { generalId: 'wula_buzhantai', generalName: '布占泰', portrait: '/assets/dongbei/wula_buzhantai.png' },
    dada_ming: { generalId: 'dada_ming_dayanhan', generalName: '达延汗', portrait: '/assets/caoyuan/dada_ming_dayanhan.png' },
    keerqin: { generalId: 'keerqin_aoba', generalName: '奥巴', portrait: '/assets/dongbei/_fallback_.png' },
    wure: { generalId: 'wure_wuzhaodu', generalName: '乌昭度', portrait: '/assets/dongbei/wure_wuzhaodu.png' },
    houliao: { generalId: 'houliao_yelvliuge', generalName: '耶律留哥', portrait: '/assets/dongbei/houliao_yelvliuge.png' },
    heishui: { generalId: 'heishui_nishuli', generalName: '倪属利稽', portrait: '/assets/dongbei/_fallback_.png' },
    heisha_d: { generalId: 'heisha_d_houlilu', generalName: '呴犁湖', portrait: '/assets/caoyuan/_fallback_.png' },
    hezhe: { generalId: 'hezhe_sharhuda', generalName: '沙尔虎达', portrait: '/assets/dongbei/_fallback_.png' },
    dawoer: { generalId: 'dawoer_baldaqi', generalName: '巴尔达齐', portrait: '/assets/dongbei/_fallback_.png' },
    mohe: { generalId: 'mohe_wanyanzonghan', generalName: '完颜宗翰', portrait: '/assets/dongbei/mohe_wanyanzonghan.png' },
    yeren_nvzhen: { generalId: 'yeren_nvzhen_boke', generalName: '博克', portrait: '/assets/dongbei/yeren_nvzhen_boke.png' },
    wuji: { generalId: 'wuji_yilizhi', generalName: '乙力支', portrait: '/assets/dongbei/wuji_yilizhi.png' },
    jilin: { generalId: 'jilin_fujun', generalName: '富俊', portrait: '/assets/dongbei/jilin_fujun.png' },
    dongdan: { generalId: 'dongdan_yelvbei', generalName: '耶律倍', portrait: '/assets/dongbei/dongdan_yelvbei.png' },
    kuye: { generalId: 'kuye_kuye_qiuzhang', generalName: '齐查伊', portrait: '/assets/dongbei/kuyeqiuzhang.png' },
    sushen: { generalId: 'sushen_tudiji', generalName: '突地稽', portrait: '/assets/dongbei/sushen_tudiji.png' },
    yilou: { generalId: 'yilou_naoya', generalName: '恼犽', portrait: '/assets/dongbei/yilou_naoya.png' },
    maomingan: { generalId: 'maomingan_gentemuer', generalName: '根特木尔', portrait: '/assets/dongbei/maomingan_gentemuer.png' },
    jilimi: { generalId: 'jilimi_takuna', generalName: '塔库纳', portrait: '/assets/dongbei/jilimiqiuzhang.png' },
    eluoke: { generalId: 'eluoke_amuhar', generalName: '阿穆哈尔', portrait: '/assets/dongbei/eluokeqiuzhang.png' },
    nifuhe: { generalId: 'nifuhe_barhudai', generalName: '巴尔虎代', portrait: '/assets/dongbei/nifuheqiuzhang.png' },
    feiyaka: { generalId: 'feiyaka_cemutehe', generalName: '策穆特赫', portrait: '/assets/dongbei/feiyakahalada.png' },
    nanai: { generalId: 'nanai_zhahaluo', generalName: '扎哈罗', portrait: '/assets/dongbei/nanaiqiuzhang.png' },
    woju: { generalId: 'woju_yinguan', generalName: '尹瓘', portrait: '/assets/chaoxian/woju_yinguan.png' },
    luzhou: { generalId: 'luzhou_zhangwenxiu', generalName: '张文休', portrait: '/assets/chaoxian/luzhou_zhangwenxiu.png' },
    jurchen: { generalId: 'jurchen_wanyanzongbi', generalName: '完颜宗弼', portrait: '/assets/dongbei/jurchen_wanyanzongbi.png' },
        // ── 草原关隘 ──
    wuzhou: { generalId: 'wuzhou_liguang', generalName: '李广', portrait: '/assets/caoyuan/wuzhou_liguang.png' },
    ashina: { generalId: 'ashina_ashinayandu', generalName: '阿史那燕都', portrait: '/assets/caoyuan/ashina_ashinayandu.png' },
    wala: { generalId: 'wala_yexian', generalName: '也先', portrait: '/assets/caoyuan/wala_yexian.png' },
    yuwen: { generalId: 'yuwen_yuwentai', generalName: '宇文泰', portrait: '/assets/caoyuan/yuwen_yuwentai.png' },
    chenli_d: { generalId: 'chenli_d_wutang', generalName: '吴棠', portrait: '/assets/caoyuan/_fallback_.png' },
    nuoyan_d: { generalId: 'nuoyan_d_sanyinnuoyan', generalName: '三音诺颜', portrait: '/assets/caoyuan/_fallback_.png' },
    wuli_d: { generalId: 'wuli_d_celeng', generalName: '策楞', portrait: '/assets/caoyuan/_fallback_.png' },
    jiluo_d: { generalId: 'jiluo_d_douxian', generalName: '窦宪', portrait: '/assets/caoyuan/jiluo_d_douxian.png' },
// ── 草原区 2026-06-18 ──
    liao_d: { generalId: 'liao_d_yelvabaoji', generalName: '阿保机', portrait: '/assets/caoyuan/liao_d_yelvabaoji.png' },
    yel: { generalId: 'yel_yelvxiuge', generalName: '耶律休哥', portrait: '/assets/caoyuan/yel_yelvxiuge.png' },
    kumoxi: { generalId: 'kumoxi_ahuihui', generalName: '阿会毁', portrait: '/assets/caoyuan/_fallback_.png' },
    kumo: { generalId: 'kumo_xiwanghuilibao', generalName: '回离保', portrait: '/assets/caoyuan/kumo_xiwanghuilibao.png' },
    geluolu: { generalId: 'geluolu_chisipijia', generalName: '炽俟毗伽', portrait: '/assets/caoyuan/geluolu_chisipijia.png' },
    ogodei: { generalId: 'ogodei_chuormahan', generalName: '绰儿马罕', portrait: '/assets/caoyuan/ogodei_chuormahan.png' },
    merkit: { generalId: 'merkit_tuoheituoa', generalName: '脱黑脱阿', portrait: '/assets/caoyuan/merkit_tuoheituoa.png' },
    tumed: { generalId: 'tumed_andahan', generalName: '俺答汗', portrait: '/assets/caoyuan/tumed_andahan.png' },
    kiyad: { generalId: 'kiyad_yesugai', generalName: '也速该', portrait: '/assets/caoyuan/kiyad_yesugai.png' },
    xiajiasi: { generalId: 'xiajiasi_are', generalName: '阿热', portrait: '/assets/caoyuan/xiajiasi_are.png' },
    xiongnu: { generalId: 'xiongnu_maodun', generalName: '冒顿', portrait: '/assets/caoyuan/xiongnu_maodun.png' },
        murong: { generalId: 'murong_murongke', generalName: '慕容恪', portrait: '/assets/beifang/murong_murongke.png' },
    wuhuan: { generalId: 'wuhuan_tadun', generalName: '蹋顿', portrait: '/assets/caoyuan/wuhuan_tadun.png' },
    yuan_d: { generalId: 'yuan_d_hubilie', generalName: '忽必烈', portrait: '/assets/caoyuan/tumed_andahan.png' },
    mengwu: { generalId: 'mengwu_hebulerhan', generalName: '合不勒汗', portrait: '/assets/caoyuan/mengwu_hebulerhan.png' },
    shaodang: { generalId: 'shaodang_mitang', generalName: '迷唐', portrait: '/assets/tubo/shaodang_mitang.png' },
    shatuo: { generalId: 'shatuo_likeyong', generalName: '李克用', portrait: '/assets/caoyuan/shatuo_likeyong.png' },
    xueyantuo: { generalId: 'xueyantuo_yinan', generalName: '夷男', portrait: '/assets/caoyuan/xueyantuo_yinan.png' },

    huige: { generalId: 'huige_gulipeiluo', generalName: '骨力裴罗', portrait: '/assets/caoyuan/huige_gulipeiluo.png' },
    kereyid: { generalId: 'kereyid_wanghan', generalName: '王汗', portrait: '/assets/caoyuan/kereyid_wanghan.png' },
    naiman: { generalId: 'naiman_taiyanghan', generalName: '太阳汗', portrait: '/assets/caoyuan/naiman_taiyanghan.png' },
    tatar: { generalId: 'tatar_mieguzhen', generalName: '蔑古真·薛兀勒图', portrait: '/assets/caoyuan/tatar_mieguzhen.png' },
    tushetu: { generalId: 'tushetu_tuxietuhan', generalName: '土谢图汗衮布', portrait: '/assets/caoyuan/tushetu_tuxietuhan.png' },
    zhasaketu: { generalId: 'zhasaketu_zhasaketuhan', generalName: '扎萨克图汗素巴第', portrait: '/assets/caoyuan/zhasaketu_zhasaketuhan.png' },
    gaoche: { generalId: 'gaoche_afuzhiluo', generalName: '阿伏至罗', portrait: '/assets/caoyuan/gaoche_afuzhiluo.png' },
    tujue: { generalId: 'tujue_ashinatumen', generalName: '阿史那土门', portrait: '/assets/caoyuan/tujue_ashinatumen.png' },
    da_yuan: { generalId: 'da_yuan_kuokuotiemuer', generalName: '扩廓帖木儿', portrait: '/assets/caoyuan/da_yuan_kuokuotiemuer.png' },
    yujiulu: { generalId: 'yujiulu_yujiulv', generalName: '郁久闾大檀', portrait: '/assets/caoyuan/yujiulu_yujiulv.png' },
    yaoluoge: { generalId: 'yaoluoge_yaoluogepusa', generalName: '药罗葛菩萨', portrait: '/assets/caoyuan/yaoluoge_yaoluogepusa.png' },
    jalair: { generalId: 'jalair_muhuali', generalName: '木华黎', portrait: '/assets/caoyuan/jalair_muhuali.png' },
    hongirad: { generalId: 'hongirad_dexuechan', generalName: '德薛禅', portrait: '/assets/caoyuan/hongirad_dexuechan.png' },
    choros: { generalId: 'choros_tuohuan', generalName: '脱欢', portrait: '/assets/caoyuan/choros_tuohuan.png' },
    tiele: { generalId: 'tiele_qibiheli', generalName: '契苾何力', portrait: '/assets/caoyuan/tiele_qibiheli.png' },
    ashide: { generalId: 'ashide_ashidejieli', generalName: '阿史德颉利', portrait: '/assets/caoyuan/ashide_ashidejieli.png' },
    duolu: { generalId: 'duolu_ashinahelu', generalName: '阿史那贺鲁', portrait: '/assets/caoyuan/duolu_ashinahelu.png' },
    cheshihou: { generalId: 'cheshihou_cheshihouwang', generalName: '安归', portrait: '/assets/caoyuan/cheshihou_cheshihouwang.png' },
    kaerka: { generalId: 'kaerka_abadaikehan', generalName: '阿巴岱汗', portrait: '/assets/caoyuan/kaerka_abadaikehan.png' },
    huyan: { generalId: 'huyan_huyanwang', generalName: '裴岑', portrait: '/assets/caoyuan/huyan_huyanwang.png' },
    chahar: { generalId: 'chahar_lindanhan', generalName: '林丹汗', portrait: '/assets/caoyuan/chahar_lindanhan.png' },
    ongut: { generalId: 'ongut_alagusi', generalName: '阿剌兀思', portrait: '/assets/caoyuan/ongut_alagusi.png' },
    rouran: { generalId: 'rouran_shelun', generalName: '社仑', portrait: '/assets/caoyuan/rouran_shelun.png' },
    chagatai: { generalId: 'chagatai_tuhulutiemuer', generalName: '秃忽鲁帖木儿', portrait: '/assets/xiyu/chagatai_tuhulutiemuer.png' },
    huihu: { generalId: 'huihu_dongmohedagan', generalName: '顿莫贺达干', portrait: '/assets/caoyuan/_fallback_.png' },
    kelie: { generalId: 'kelie_zhaheganbu', generalName: '札合敢不', portrait: '/assets/caoyuan/kelie_zhaheganbu.png' },
    pugu: { generalId: 'pugu_puguhuaien', generalName: '仆固怀恩', portrait: '/assets/caoyuan/pugu_puguhuaien.png' },
    pulei: { generalId: 'pulei_dougu', generalName: '窦固', portrait: '/assets/caoyuan/_fallback_.png' },
    xibo_d: { generalId: 'xibo_d_zakulan', generalName: '扎库兰', portrait: '/assets/caoyuan/_fallback_.png' },
    borjigin: { generalId: 'borjigin_tuolei', generalName: '拖雷', portrait: '/assets/caoyuan/borjigin_tuolei.png' },
    zhadalan: { generalId: 'zhadalan_zhamuhe', generalName: '札木合', portrait: '/assets/caoyuan/zhadalan_zhamuhe.png' },
    zhuerqi: { generalId: 'zhuerqi_sachabieqi', generalName: '撒察别乞', portrait: '/assets/caoyuan/zhuerqi_sachabieqi.png' },
    chechen: { generalId: 'chechen_chechenhanshuolei', generalName: '车臣汗硕垒', portrait: '/assets/caoyuan/chechen_chechenhanshuolei.png' },
    tumengken: { generalId: 'tumengken_tumengken', generalName: '图蒙肯', portrait: '/assets/caoyuan/tumengken_tumengken.png' },
    bayegu: { generalId: 'bayegu_qulishi', generalName: '屈利失', portrait: '/assets/caoyuan/bayegu_qulishi.png' },
    zubu: { generalId: 'zubu_mogusi', generalName: '磨古斯', portrait: '/assets/caoyuan/zubu_mogusi.png' },
    wuzhumuqin: { generalId: 'wuzhumuqin_duoerji', generalName: '多尔济', portrait: '/assets/caoyuan/wuzhumuqin_duoerji.png' },
    baidi: { generalId: 'baidi_baidibushuai', generalName: '白狄子', portrait: '/assets/caoyuan/baidi_baidibushuai.png' },
    shiwei: { generalId: 'shiwei_saigou', generalName: '塞呴', portrait: '/assets/caoyuan/shiweiazhu.png' },
    sunite: { generalId: 'sunite_sunitezasake', generalName: '叟塞', portrait: '/assets/caoyuan/sunite_sunitezasake.png' },
    bulat: { generalId: 'bulat_boduanchaer', generalName: '孛端察儿', portrait: '/assets/caoyuan/bulat_boduanchaer.png' },
    tuva: { generalId: 'tuva_qinggunzabu', generalName: '青滚杂卜', portrait: '/assets/caoyuan/tangnuzongguan.png' },
        // ── 西域关隘 ──
    hepan: { generalId: 'hepan_peishenfu', generalName: '裴神符', portrait: '/assets/xiyu/hepan_peishenfu.png' },
    yiwu: { generalId: 'yiwu_hanshen', generalName: '罕慎', portrait: '/assets/xiyu/yiwu_hanshen.png' },
    kepantuo: { generalId: 'kepantuo_hanritianzhong', generalName: '阇梨密', portrait: '/assets/xiyu/kepantuo_hanritianzhong.png' },
    huite: { generalId: 'huite_amuersana', generalName: '阿睦尔撒纳', portrait: '/assets/xiyu/huite_amuersana.png' },
    tuoming: { generalId: 'tuoming_tuomin', generalName: '妥明', portrait: '/assets/xiyu/liujintang.png' },
    chuyue: { generalId: 'chuyue_shatuonasu', generalName: '沙陀那速', portrait: '/assets/xiyu/chuyue_shatuonasu.png' },
    keerkezi: { generalId: 'keerkezi_manasi', generalName: '玛纳斯', portrait: '/assets/xiyu/keerkezi_manasi.png' },
    pisha: { generalId: 'pisha_yuchisheng', generalName: '尉迟胜', portrait: '/assets/xiyu/pisha_yuchiyao.png' },
    xingxingxia: { generalId: 'xingxingxia_zhangyao_x', generalName: '张曜', portrait: '/assets/xiyu/xingxingxia_zhangyao.png' },
    yangguan: { generalId: 'yangguan_banyong', generalName: '班勇', portrait: '/assets/xiyu/yangguan_banyong.png' },
    wulianghai: { generalId: 'wulianghai_chelingwubashi', generalName: '车凌乌巴什', portrait: '/assets/xiyu/wulianghai_chelingwubashi.png' },
    // 三陇沙·白龙 宁缺毋滥
// ── 西域区 2026-06-18 ──
    shache: { generalId: 'shache_xian_suoche_wang', generalName: '莎车贤', portrait: '/assets/xiyu/xian_suoche.png' },
    shule: { generalId: 'shule_aersilan', generalName: '阿尔斯兰', portrait: '/assets/xiyu/shule_aersilan.png' },
    dzungar: { generalId: 'dzungar_gaerdancelin', generalName: '噶尔丹策零', portrait: '/assets/xiyu/dzungar_gaerdancelin.png' },
    anxi: { generalId: 'anxi_guoxin', generalName: '郭昕', portrait: '/assets/xiyu/anxi_guoxin.png' },
    yanqi: { generalId: 'yanqi_longtuqizhi', generalName: '龙突骑支', portrait: '/assets/xiyu/yanqi_longtuqizhi.png' },
    tuerhute: { generalId: 'tuerhute_wobaxi', generalName: '渥巴锡', portrait: '/assets/xiyu/tuerhute_wobaxi.png' },
    gaochang: { generalId: 'gaochang_quwentai', generalName: '麴文泰', portrait: '/assets/xiyu/gaochang_quwentai.png' },
    yarkand: { generalId: 'yarkand_abuladitifu', generalName: '阿卜杜·拉提夫', portrait: '/assets/xiyu/yarkand_abuladitifu.png' },
    yiduhu: { generalId: 'yiduhu_baershu', generalName: '巴尔术阿而忒的斤', portrait: '/assets/xiyu/yiduhu_baershu.png' },
    yuchi: { generalId: 'yuchi_weichiyao', generalName: '尉迟曜', portrait: '/assets/xiyu/yuchi_weichiyao.png' },
    zhuxie: { generalId: 'zhuxie_zhuxiechixin', generalName: '朱邪赤心', portrait: '/assets/xiyu/zhuxie_zhuxiechixin.png' },
    kala: { generalId: 'kala_satuke', generalName: '萨图克·博格拉汗', portrait: '/assets/xiyu/kala_satuke.png' },
    an: { generalId: 'an_xibanni', generalName: '昔班尼', portrait: '/assets/zhongya/an_xibanni.png' },
    saman: { generalId: 'saman_yisimayi', generalName: '伊斯玛仪', portrait: '/assets/xiyu/saman_yisimayi.png' },
    wusun: { generalId: 'wusun_liejiaomi', generalName: '猎骄靡', portrait: '/assets/xiyu/wusun_liejiaomi.png' },
    tujishi: { generalId: 'tujishi_sulukehan', generalName: '苏禄', portrait: '/assets/xiyu/tujishi_sulukehan.png' },
    xiliao: { generalId: 'xiliao_yelvdashi', generalName: '耶律大石', portrait: '/assets/xiyu/xiliao_yelvdashi.png' },
    jiazini: { generalId: 'jiazini_mahamaode', generalName: '马哈茂德', portrait: '/assets/zhongya/jiazini_mahamaode.png' },
    jibin: { generalId: 'jibin_qiujiuque', generalName: '丘就却', portrait: '/assets/zhongya/guishuang_jianisejia.png' },
        xijue: { generalId: 'xijue_ganshouchang', generalName: '甘延寿', portrait: '/assets/zhongya/quli_chentang.png' },
    // 养吉干·咸海 / 真珠河·乌护 宁缺毋滥

// ── 中亚区 2026-06-18 ──
    huarazim: { generalId: 'huarazim_mohemo', generalName: '摩诃末', portrait: '/assets/zhongya/dulan_d_aihamaide.png' },
    kazakh: { generalId: 'kazakh_hasimu', generalName: '哈斯木', portrait: '/assets/zhongya/kazakh_hasimu.png' },
    sogdian: { generalId: 'sogdian_dewasitiqi', generalName: '德瓦什提奇', portrait: '/assets/zhongya/sogdian_dewasitiqi.png' },
    yanda: { generalId: 'yanda_touluoman', generalName: '头罗曼', portrait: '/assets/zhongya/yanda_touluoman.png' },
    yada: { generalId: 'yada_ahexiong', generalName: '阿赫雄', portrait: '/assets/zhongya/moxianluojuluo.png' },
    anushidgin: { generalId: 'anushidgin_yile', generalName: '伊勒·阿尔斯兰', portrait: '/assets/zhongya/anushidgin_yile.png' },    guishuang: { generalId: 'guishuang_jianisejia', generalName: '迦腻色伽', portrait: '/assets/zhongya/guishuang_jianisejia.png' },
    qincha: { generalId: 'qincha_baqiman', generalName: '巴奇曼', portrait: '/assets/zhongya/qincha_baqiman.png' },
    dayuan: { generalId: 'dayuan_wugua', generalName: '毋寡', portrait: '/assets/zhongya/dayuan_wugua.png' },
    kokand: { generalId: 'kokand_alimukuli', generalName: '阿里木·库力', portrait: '/assets/zhongya/kokand_alimukuli.png' },
    dayuzi: { generalId: 'dayuzi_yinalechihei', generalName: '亦纳勒赤黑', portrait: '/assets/zhongya/dayuzi_yinalechihei.png' },
    maer_d: { generalId: 'maer_d_bahelamuchubin', generalName: '巴赫拉姆·楚宾', portrait: '/assets/zhongya/_fallback_.png' },
    wugu_d: { generalId: 'wugu_d_tugelile', generalName: '图格里勒', portrait: '/assets/zhongya/_fallback_.png' },
    adao_d: { generalId: 'adao_d_mafushou', generalName: '马福寿', portrait: '/assets/zhongya/_fallback_.png' },
    wuyuan_d: { generalId: 'wuyuan_d_chengui', generalName: '陈龟', portrait: '/assets/caoyuan/_fallback_.png' },
    shi_clan: { generalId: 'shi_clan_moheduotutun', generalName: '莫贺咄吐屯', portrait: '/assets/zhongya/shijingtang.png' },
    mamon: { generalId: 'mamon_mameng', generalName: '马蒙', portrait: '/assets/zhongya/mamon_mameng.png' },
    khoja: { generalId: 'khoja_apakhoja', generalName: '阿帕克和卓', portrait: '/assets/zhongya/khoja_apakhoja.png' },
    fanyanna: { generalId: 'fanyanna_fanyanna_wang', generalName: '谢尔', portrait: '/assets/zhongya/fanyannawang.png' },
    kangju: { generalId: 'kangju_chebishi', generalName: '车鼻施', portrait: '/assets/zhongya/kangju_chebishi.png' },
    zhaowu: { generalId: 'zhaowu_timuermieli', generalName: '帖木儿·灭里', portrait: '/assets/zhongya/zhaowu_timuermieli.png' },
    qiepantuo: { generalId: 'qiepantuo_humi_wang', generalName: '罗真檀', portrait: '/assets/zhongya/humi_humiwang.png' },
    jie: { generalId: 'jie_sijinti', generalName: '斯谨提', portrait: '/assets/zhongya/shile.png' },
    lu: { generalId: 'lu_zhangliao', generalName: '张辽', portrait: '/assets/zhongyuan/lu_zhangliao.png' },
    // ── 中国将·西域 2026-06-18 ──
    quli: { generalId: 'quli_chentang', generalName: '陈汤', portrait: '/assets/zhongya/quli_chentang.png' },
    loulan: { generalId: 'loulan_suojie', generalName: '索劼', portrait: '/assets/zhongya/_fallback_.png' },
        juandu: { generalId: 'juandu_peixingjian', generalName: '裴行俭', portrait: '/assets/zhongya/juandu_peixingjian.png' },
    dulan: { generalId: 'dulan_dashibatuer', generalName: '达什巴图尔', portrait: '/assets/tubo/dulan_dashibatuer.png' },
    heyuan_d: { generalId: 'heyuan_d_heichichangzhi', generalName: '黑齿常之', portrait: '/assets/tubo/heyuan_d_heichichangzhi.png' },
    // 克里雅/赤斤/西宁/卡伦/果洛 宁缺毋滥

// ── 青藏区 2026-06-18 ──
    song2: { generalId: 'song2_houjunji', generalName: '侯君集', portrait: '/assets/tubo/song2_houjunji.png' },
    gurkha: { generalId: 'gurkha_baduersaye', generalName: '巴都尔萨野', portrait: '/assets/tubo/gurkha_baduersaye.png' },
    gongbu: { generalId: 'gongbu_gongbumangbuzhi', generalName: '工布莽布支', portrait: '/assets/tubo/gongbu_gongbumangbuzhi.png' },
    khon: { generalId: 'khon_basiba', generalName: '八思巴', portrait: '/assets/tubo/khon_basiba.png' },
    xiadun: { generalId: 'xiadun_xiazhongawanglangjie', generalName: '夏仲·阿旺朗杰', portrait: '/assets/tubo/xiazhong.png' },
    gar: { generalId: 'gar_lunqinling', generalName: '论钦陵', portrait: '/assets/tubo/gar_lunqinling.png' },
    tufa_d: { generalId: 'tufa_d_tufanutan', generalName: '秃发傉檀', portrait: '/assets/tubo/tufa_d_tufanutan.png' },
    qifu_d: { generalId: 'qifu_d_qifuchipan', generalName: '乞伏炽磐', portrait: '/assets/tubo/qifu_d_qifuchipan.png' },
    tuyu_d: { generalId: 'tuyu_d_kualv', generalName: '夸吕', portrait: '/assets/tubo/tuyu_d_kualv.png' },
    duomi: { generalId: 'duomi_lunkongre', generalName: '论恐热', portrait: '/assets/tubo/duomi_lunkongre.png' },
    anding_wei: { generalId: 'anding_wei_buyantiemuer', generalName: '卜烟帖木儿', portrait: '/assets/tubo/anding_wei_buyantiemuer.png' },
    gaxa: { generalId: 'gaxa_zhashiduanzhubu', generalName: '扎什端珠布', portrait: '/assets/tubo/gaxa_zhashiduanzhubu.png' },
    jinchuan_g: { generalId: 'jinchuan_g_shaluoben', generalName: '莎罗奔', portrait: '/assets/tubo/jinchuan_g_shaluoben.png' },
    xiangxiong: { generalId: 'xiangxiong_limixia_x', generalName: '李迷夏', portrait: '/assets/tubo/limixia.png' },
    ladakh: { generalId: 'ladakh_senggelangjie', generalName: '僧格朗杰', portrait: '/assets/tubo/ladakh_senggelangjie.png' },
    khoshut: { generalId: 'khoshut_gushihan', generalName: '固始汗', portrait: '/assets/tubo/khoshut_gushihan.png' },
    nvguo: { generalId: 'nvguo_mojie', generalName: '末羯', portrait: '/assets/tubo/nvguo_mojie.png' },
    karmapa: { generalId: 'karmapa_queyingduoji', generalName: '却英多吉', portrait: '/assets/tubo/karmapa_queyingduoji.png' },
    xianlingqiang: { generalId: 'xianlingqiang_dianling', generalName: '滇零', portrait: '/assets/tubo/xianlingqiang_dianling.png' },
    lang_clan: { generalId: 'lang_clan_jiangqujianzan', generalName: '绛曲坚赞', portrait: '/assets/tubo/lang_clan_jiangqujianzan.png' },
    xiutu: { generalId: 'xiutu_xiutuwang', generalName: '金日磾', portrait: '/assets/tubo/xiutu_xiutuwang.png' },
    gandenpozhang: { generalId: 'gandenpozhang_dibasangjiejiacuo', generalName: '第巴桑结嘉措', portrait: '/assets/tubo/gandenpozhang_dibasangjiejiacuo.png' },
    khyungpo: { generalId: 'khyungpo_qiongbobangse', generalName: '琼波·邦色', portrait: '/assets/tubo/khyungpo_qiongbobangse.png' },
    gar_kham: { generalId: 'gar_kham_dengbazeren', generalName: '登巴泽仁', portrait: '/assets/tubo/gar_kham_dengbazeren.png' },
    guangwu: { generalId: 'guangwu_xinwuxian', generalName: '辛武贤', portrait: '/assets/tubo/lanzhou_zhaochongguo.png' },
    supi: { generalId: 'supi_xinuoluo', generalName: '悉诺逻', portrait: '/assets/tubo/supi_xinuoluo.png' },
    tsangpa: { generalId: 'tsangpa_pengcuonanjie', generalName: '彭措南杰', portrait: '/assets/tubo/tsangpa_pengcuonanjie.png' },
    spurgyal: { generalId: 'spurgyal_dariniansai', generalName: '达日年塞', portrait: '/assets/tubo/spurgyal_dariniansai.png' },
    galangdiba: { generalId: 'galangdiba_wangqindundui', generalName: '旺钦顿堆', portrait: '/assets/tubo/galangdiba_wangqindundui.png' },
    fuguo: { generalId: 'fuguo_yizeng', generalName: '宜缯', portrait: '/assets/tubo/fuguo_yizeng.png' },
    bailang: { generalId: 'bailang_tangzeng', generalName: '唐缯', portrait: '/assets/tubo/bailang_tangzeng.png' },
    humi: { generalId: 'humi_humiwang', generalName: '真檀', portrait: '/assets/tubo/humi_humiwang.png' },
    xiaobolu: { generalId: 'xiaobolu_meijinmang', generalName: '没谨忙', portrait: '/assets/tubo/xiaobolu_meijinmang.png' },
    guge: { generalId: 'guge_chizhaxichabade', generalName: '赤扎西查巴德', portrait: '/assets/tubo/chizhaxi.png' },
    pazhu: { generalId: 'pazhu_redangunsangpa', generalName: '热丹衮桑帕', portrait: '/assets/tubo/pazhu_redangunsangpa.png' },
    ali: { generalId: 'ali_gandancaiwang', generalName: '甘丹才旺', portrait: '/assets/tubo/ali_gandancaiwang.png' }, // 噶大克
    gaoliang: { generalId: 'gaoliang_fengang', generalName: '冯盎', portrait: '/assets/tubo/gaoliang_fengang.png' }, // 茂名
    nandou: { generalId: 'nandou_sushili', generalName: '苏失利', portrait: '/assets/tubo/nandou_sushili.png' }, // 孽多
    bailan: { generalId: 'bailan_pabala', generalName: '帕巴拉', portrait: '/assets/tubo/bailan_pabala.png' }, // 察木多
    jiantang: { generalId: 'jiantang_sangjiejia', generalName: '桑杰嘉措', portrait: '/assets/tubo/jiantang_sangjiejia.png' }, // 独克宗
    kongsa: { generalId: 'kongsa_kongsayiduo', generalName: '孔萨益多', portrait: '/assets/tubo/kongsa_kongsayiduo.png' }, // 甘孜
    gling: { generalId: 'gling_lingesar', generalName: '岭格萨尔', portrait: '/assets/tubo/gling_lingesar.png' }, // 结古宗
    daca: { generalId: 'daca_dacajilong', generalName: '达擦济咙', portrait: '/assets/tubo/daca_dacajilong.png' }, // 八宿宗
    gongtang: { generalId: 'gongtang_gongtangang', generalName: '贡唐仓', portrait: '/assets/tubo/gongtang_gongtangang.png' }, // 吉麦
    nanjie: { generalId: 'nanjie_nanjiewangqiu', generalName: '南杰旺秋', portrait: '/assets/tubo/nanjie_nanjiewangqiu.png' }, // 日土宗
    nanzhong: { generalId: 'nanzhong_mazhong', generalName: '马忠', portrait: '/assets/dianqian/nanzhong_mazhong.png' }, // 宛温·庲降都督镇南中
    yueyi: { generalId: 'yueyi_jiaohuang', generalName: '焦璜', portrait: '/assets/dianqian/yueyi_jiaohuang.png' }, // 越嶲·邛都戍守
    pingnan: { generalId: 'pingnan_musheng', generalName: '沐晟', portrait: '/assets/dianqian/pingnan_musheng.png' }, // 腾越城·镇守云南
    jingdong: { generalId: 'jingdong_taohong', generalName: '陶洪', portrait: '/assets/dianqian/jingdong_taohong.png' }, // 银生城·景东土官
    luohu: { generalId: 'luohu_ganmuding', generalName: '敢木丁', portrait: '/assets/dianqian/luohu_ganmuding.png' }, // 呵叻城·罗斛国王
    ailao: { generalId: 'ailao_leilao', generalName: '类牢', portrait: '/assets/dianqian/ailao_leilao.png' }, // 永昌·哀牢反叛
    mingzheng: { generalId: 'mingzheng_jianzandechang', generalName: '坚赞德昌', portrait: '/assets/dianqian/mingzheng_jianzandechang.png' }, // 打箭炉·明正土司
    hani_d: { generalId: 'hani_d_zhebi', generalName: '遮比', portrait: '/assets/dianqian/hani_d_zhebi.png' }, // 思陀·哈尼首领
  // ── 滇缅区 2026-06-18 ──
    dali: { generalId: 'dali_duansiping', generalName: '段思平', portrait: '/assets/dianmian/dali_duansiping.png' },
    dongxu: { generalId: 'dongxu_mangruiti', generalName: '莽瑞体', portrait: '/assets/dianmian/dongxu_mangruiti.png' },
    mu_lijiang: { generalId: 'mu_lijiang_muzeng', generalName: '木增', portrait: '/assets/dianmian/mu_lijiang_muzeng.png' },
    dianguo: { generalId: 'dianguo_zhuangqiao', generalName: '庄蹻', portrait: '/assets/dianmian/dianguo_zhuangqiao.png' },
    konbaung: { generalId: 'konbaung_yongjiya', generalName: '雍籍牙', portrait: '/assets/dianmian/konbaung_yongjiya.png' },
    hantawadi: { generalId: 'hantawadi_mangyinglong', generalName: '莽应龙', portrait: '/assets/dianmian/hantawadi_mangyinglong.png' },
    nanzhao: { generalId: 'nanzhao_geluofeng', generalName: '阁罗凤', portrait: '/assets/dianmian/nanzhao_geluofeng.png' },
    wuman: { generalId: 'wuman_cuanguiwang', generalName: '爨归王', portrait: '/assets/dianmian/wuman_cuanguiwang.png' },
    dai: { generalId: 'dai_daoyingmeng', generalName: '刀应勐', portrait: '/assets/dianmian/dai_daoyingmeng.png' },
    taiyuan: { generalId: 'taiyuan_manglai', generalName: '孟莱', portrait: '/assets/dianmian/taiyuan_manglai.png' },
    suke: { generalId: 'suke_langanheng', generalName: '兰甘亨', portrait: '/assets/dianmian/suke_langanheng.png' },
    luchuan: { generalId: 'luchuan_sirenfa', generalName: '思任发', portrait: '/assets/dianmian/luchuan_sirenfa.png' },
    kunming_yi: { generalId: 'kunming_yi_lucheng', generalName: '卤承', portrait: '/assets/dianmian/kunming_yi_lucheng.png' },
    cuanshi: { generalId: 'cuanshi_cuanlongyan', generalName: '爨龙颜', portrait: '/assets/dianmian/cuanshi_cuanlongyan.png' },
    baiman: { generalId: 'baiman_gaoshengtai', generalName: '高升泰', portrait: '/assets/dianmian/baiman_gaoshengtai.png' },
    champa: { generalId: 'champa_zhipenge', generalName: '制蓬峨', portrait: '/assets/dianmian/champa_zhipenge.png' },
    qiong: { generalId: 'qiong_rengui', generalName: '任贵', portrait: '/assets/dianmian/qiong_rengui.png' },
    // 莽应龙已移给 dongxu
      daozhou: { generalId: 'daozhou_yangzaixing', generalName: '杨再兴', portrait: '/assets/lingnan/daozhou_yangzaixing.png' },
    guangping: { generalId: 'guangping_ruanwenzhang', generalName: '阮文张', portrait: '/assets/lingnan/guangping_ruanwenzhang.png' }, // 洞海城·阮朝水师名将
    jingjiang: { generalId: 'jingjiang_qushisi', generalName: '瞿式耜', portrait: '/assets/lingnan/jingjiang_qushisi.png' }, // 永安·收复广西
    duanzhou_d: { generalId: 'duanzhou_d_caojin', generalName: '曹觐', portrait: '/assets/lingnan/duanzhou_d_caojin.png' }, // 肇庆·屡败侬智高
    monong: { generalId: 'monong_anong', generalName: '阿侬', portrait: '/assets/lingnan/monong_anong.png' }, // 邦敦·侬智高母
    basha_d: { generalId: 'basha_d_daogengmeng', generalName: '刀更孟', portrait: '/assets/lingnan/basha_d_daogengmeng.png' }, // 上丁·巴沙象兵
    leizhou: { generalId: 'leizhou_limao_leizhou', generalName: '李茂', portrait: '/assets/lingnan/limao.png' }, // 海康·雷州卫指挥
    ketagalan: { generalId: 'ketagalan_huangqingyun', generalName: '黄青云', portrait: '/assets/lingnan/ketagalan_huangqingyun.png' }, // 艋舺·凯达格兰
    shuizhen: { generalId: 'shuizhen_oudaren', generalName: '区大任', portrait: '/assets/lingnan/shuizhen_oudaren.png' }, // 三菩·水真戍
  // ── 岭南/越南/台湾区 2026-06-18 ──
    ryukyu: { generalId: 'ryukyu_shangbazhi', generalName: '尚巴志', portrait: '/assets/lingnan/ryukyu_shangbazhi.png' },
    luoping: { generalId: 'luoping_zhangshijie', generalName: '张世杰', portrait: '/assets/lingnan/luoping_zhangshijie.png' },
    chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', generalName: '陈吊眼', portrait: '/assets/lingnan/chendiaoyan_chendiaoyan.png' },
    dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', generalName: '邓茂七', portrait: '/assets/lingnan/dengmaoqi_dengmaoqi.png' },
    geng: { generalId: 'geng_gengjingzhong', generalName: '耿精忠', portrait: '/assets/lingnan/geng_gengjingzhong.png' },
    longwu: { generalId: 'longwu_huangdaozhou', generalName: '黄道周', portrait: '/assets/lingnan/longwu_huangdaozhou.png' },
    xinjiang: { generalId: 'xinjiang_maji', generalName: '马塈', portrait: '/assets/lingnan/liulong.png' },
    jing: { generalId: 'jing_dingbuling', generalName: '丁部领', portrait: '/assets/lingnan/jing_dingbuling.png' },
    paiwan: { generalId: 'paiwan_alugu', generalName: '阿禄古', portrait: '/assets/lingnan/paiwan_alugu.png' },
    ming_zheng: { generalId: 'ming_zheng_zhengchenggong', generalName: '郑成功', portrait: '/assets/lingnan/ming_zheng_zhengchenggong.png' },
    nguyen_guangnan: { generalId: 'nguyen_guangnan_ruanfuying', generalName: '阮福映', portrait: '/assets/lingnan/nguyen_guangnan_ruanfuying.png' },
    zhuang_d: { generalId: 'zhuang_d_washifuren', generalName: '瓦氏夫人', portrait: '/assets/lingnan/zhuang_d_washifuren.png' },
    nanyue: { generalId: 'nanyue_zhaotuo', generalName: '赵佗', portrait: '/assets/lingnan/nanyue_zhaotuo.png' },
    zhancheng: { generalId: 'zhancheng_zhimin', generalName: '制旻', portrait: '/assets/guangzhou/zhancheng_zhimin.png' },
    xiou: { generalId: 'xiou_yixusong', generalName: '译吁宋', portrait: '/assets/lingnan/xiou_yixusong.png' },
    xichu: { generalId: 'xichu_xiangyu', generalName: '项羽', portrait: '/assets/jiangnan/xichu_xiangyu.png' },
    gouding: { generalId: 'gouding_wubo', generalName: '毋波', portrait: '/assets/lingnan/gouding_wubo.png' },
    chen: { generalId: 'chen_chenbaxian', generalName: '陈霸先', portrait: '/assets/lingnan/chen_chenbaxian.png' },
    dayu: { generalId: 'dayu_wangshouren', generalName: '王守仁', portrait: '/assets/lingnan/dayu_wangshouren.png' },
    paiyao: { generalId: 'paiyao_huanggua4', generalName: '黄瓜四', portrait: '/assets/lingnan/paiyao_huanggua4.png' },
    yingzhou: { generalId: 'yingzhou_liulong_ying', generalName: '刘龑', portrait: '/assets/lingnan/liulong.png' },
    linyi: { generalId: 'linyi_fanyangmai', generalName: '范阳迈', portrait: '/assets/lingnan/linyi_fanyangmai.png' },
    xian_d: { generalId: 'xian_d_xianfuren', generalName: '冼夫人', portrait: '/assets/lingnan/xian_d_xianfuren.png' },
    luodian: { generalId: 'luodian_shexiang', generalName: '奢香夫人', portrait: '/assets/lingnan/luodian_shexiang.png' },
    nong2: { generalId: 'nong2_nongzhigao', generalName: '侬智高', portrait: '/assets/lingnan/nong2_nongzhigao.png' },
    taiping: { generalId: 'taiping_shidakai', generalName: '石达开', portrait: '/assets/lingnan/taiping_shidakai.png' },
    dongzu: { generalId: 'dongzu_wumian', generalName: '吴勉', portrait: '/assets/lingnan/dongzu_wumian.png' },
    tian_sizhou: { generalId: 'tian_sizhou_tianyougong', generalName: '田祐恭', portrait: '/assets/lingnan/tian_sizhou_tianyougong.png' },
    luoyue: { generalId: 'luoyue_zhengce', generalName: '征侧', portrait: '/assets/lingnan/luoyue_zhengce.png' },
    li_lx_d: { generalId: 'li_lx_d_lichong', generalName: '李崇', portrait: '/assets/bashu/_fallback_.png' },
    li_s: { generalId: 'li_s_mayuan', generalName: '马援', portrait: '/assets/lingnan/li_s_mayuan.png' },
    trinh: { generalId: 'trinh_zhengsong', generalName: '郑松', portrait: '/assets/lingnan/trinh_zhengsong.png' },
    dacheng: { generalId: 'dacheng_chenkai', generalName: '陈开', portrait: '/assets/lingnan/dacheng_chenkai.png' },
    dayue: { generalId: 'dayue_chenguojun', generalName: '陈国峻', portrait: '/assets/lingnan/dayue_chenguojun.png' },
    shengmiao: { generalId: 'shengmiao_baoli_miao', generalName: '包利', portrait: '/assets/lingnan/baoli.png' },
    miao_qing: { generalId: 'miao_qing_yangwanzhe', generalName: '杨完者', portrait: '/assets/lingnan/miao_qing_yangwanzhe.png' },
    guizhou: { generalId: 'guizhou_lidingguo', generalName: '李定国', portrait: '/assets/lingnan/guizhou_lidingguo.png' },
    liren: { generalId: 'liren_funanshe', generalName: '符南蛇', portrait: '/assets/lingnan/liren_funanshe.png' },
    // guangnanguo → 洞海城改为 panjun
    yelang: { generalId: 'yelang_duotong', generalName: '多同', portrait: '/assets/lingnan/yelang_duotong.png' },
    zangke: { generalId: 'zangke_xielongyu', generalName: '谢龙羽', portrait: '/assets/lingnan/zangke_xielongyu.png' },
    xinggu: { generalId: 'xinggu_cuanxi', generalName: '爨习', portrait: '/assets/lingnan/xinggu_cuanxi.png' },
    guangxin: { generalId: 'guangxin_shixie', generalName: '士燮', portrait: '/assets/lingnan/guangxin_shixie.png' },
    shaozhou: { generalId: 'shaozhou_zhangzhensun', generalName: '张镇孙', portrait: '/assets/lingnan/shaozhou_zhangzhensun.png' },
    shixing: { generalId: 'shixing_houandou', generalName: '侯安都', portrait: '/assets/lingnan/shixing_houandou.png' },
    buyi_d: { generalId: 'buyi_d_weichaoyuan', generalName: '韦朝元', portrait: '/assets/lingnan/buyi_d_weichaoyuan.png' },
      lizhou_d: { generalId: 'lizhou_d_wulin', generalName: '吴璘', portrait: '/assets/bashu/lizhou_d_wulin.png' },
      // ── 巴蜀关隘 2026-06-19 ──
    kui: { generalId: 'kui_liubei', generalName: '刘备', portrait: '/assets/bashu/kui_liubei.png' },
    yang_bozhou: { generalId: 'yang_bozhou_yangyinglong', generalName: '杨应龙', portrait: '/assets/bashu/yang_bozhou_yangyinglong.png' },
    chenghan: { generalId: 'chenghan_lite', generalName: '李特', portrait: '/assets/bashu/chenghan_lite.png' },
    jinchuan_x: { generalId: 'jinchuan_x_suonuomu', generalName: '索诺木', portrait: '/assets/bashu/jinchuan_x_suonuomu.png' },
    zuo_d: { generalId: 'zuo_d_wufu_zd', generalName: '吴复', portrait: '/assets/bashu/wufu.png' },
    miaomin: { generalId: 'miaomin_shiliudeng', generalName: '石柳邓', portrait: '/assets/bashu/miaomin_shiliudeng.png' },
    wumeng: { generalId: 'wumeng_azi_wm', generalName: '阿资', portrait: '/assets/bashu/wumeng_pengshichou.png' },
    // 勒乌围·金川 / 乌蒙山·乌蛮 宁缺毋滥
// ── 巴蜀区 2026-06-18 ──
    tujia_d: { generalId: 'tujia_d_qinliangyu', generalName: '秦良玉', portrait: '/assets/bashu/tujia_d_qinliangyu.png' },
    shuixi: { generalId: 'shuixi_anbangyan', generalName: '安邦彦', portrait: '/assets/bashu/shuixi_anbangyan.png' },
        xiangzhou: { generalId: 'xiangzhou_lvwenhuan', generalName: '吕文焕', portrait: '/assets/jiangnan/xiangzhou_lvwenhuan.png' },
    zaoyang_d: { generalId: 'zaoyang_d_menggong', generalName: '孟珙', portrait: '/assets/zhaosong/zaoyang_d_menggong.png' },
    guo: { generalId: 'guo_jixin', generalName: '纪信', portrait: '/assets/bashu/guo_jixin.png' },
        daxi_ming: { generalId: 'daxi_ming_zhangxianzhong', generalName: '张献忠', portrait: '/assets/bashu/daxi_ming_zhangxianzhong.png' },
    zi: { generalId: 'zi_changhong', generalName: '苌弘', portrait: '/assets/bashu/zi_changhong.png' },
    yidou: { generalId: 'yidou_luxun', generalName: '陆逊', portrait: '/assets/bashu/yidou_luxun.png' },
        chu: { generalId: 'chu_guanyu', generalName: '关羽', portrait: '/assets/jiangnan/chu_guanyu.png' },
    zhongxiang: { generalId: 'zhongxiang_zhongxiang', generalName: '钟相', portrait: '/assets/bashu/zhongxiang_zhongxiang.png' },
    fengzhou: { generalId: 'fengzhou_wujie', generalName: '吴玠', portrait: '/assets/bashu/fengzhou_wujie.png' },
    fushi: { generalId: 'fushi_fuhong', generalName: '苻洪', portrait: '/assets/bashu/fushi_fuhong.png' },
    wanzhou: { generalId: 'wanzhou_shangguankui', generalName: '上官夔', portrait: '/assets/bashu/_fallback_.png' },
    ba: { generalId: 'ba_bamanzi', generalName: '巴蔓子', portrait: '/assets/bashu/ba_bamanzi.png' },
    hezhou: { generalId: 'hezhou_wangjian_dy', generalName: '王坚', portrait: '/assets/bashu/ruo_wangjian.png' },
    qiuchi: { generalId: 'qiuchi_yangnandang', generalName: '杨难当', portrait: '/assets/bashu/qiuchi_yangnandang.png' },
    cong: { generalId: 'cong_puhu', generalName: '朴胡', portrait: '/assets/bashu/cong_puhu.png' },
    langzhou: { generalId: 'langzhou_zhangfei', generalName: '张飞', portrait: '/assets/bashu/langzhou_zhangfei.png' },
    tan_d: { generalId: 'tan_d_tanhou', generalName: '覃垕', portrait: '/assets/bashu/tan_d_tanhou.png' },
    xiang_d: { generalId: 'xiang_d_xiangdakun', generalName: '向大坤', portrait: '/assets/bashu/xiang_d_xiangdakun.png' },
    ran_d: { generalId: 'ran_d_ranshouzhong', generalName: '冉守忠', portrait: '/assets/bashu/ran_d_ranshouzhong.png' },
    wuxi: { generalId: 'wuxi_shamoke', generalName: '沙摩柯', portrait: '/assets/bashu/wuxi_shamoke.png' },
    kuai: { generalId: 'kuai_kuaiyue', generalName: '蒯越', portrait: '/assets/bashu/kuai_kuaiyue.png' },
    bandun: { generalId: 'bandun_fanmu', generalName: '范目', portrait: '/assets/bashu/bandun_fanmu.png' },
    she: { generalId: 'she_shechongming', generalName: '奢崇明', portrait: '/assets/bashu/she_shechongming.png' },
    boren: { generalId: 'boren_ada', generalName: '阿大', portrait: '/assets/bashu/boren_ada.png' },
    jingmen: { generalId: 'jingmen_zhaoyun', generalName: '赵云', portrait: '/assets/bashu/jingmen_zhaoyun.png' },
    chenzhou_d: { generalId: 'chenzhou_d_zhanggao', generalName: '张镐', portrait: '/assets/bashu/miaomin_shiliudeng.png' },
      xiqin: { generalId: 'xiqin_xuerengao', generalName: '薛仁杲', portrait: '/assets/hexi/xiqin_xuerengao.png' },
    beidi: { generalId: 'beidi_sunang', generalName: '孙卬', portrait: '/assets/hexi/beidi_sunang.png' },
    baiyang: { generalId: 'baiyang_mengtian', generalName: '蒙恬', portrait: '/assets/hexi/baiyang_mengtian.png' },
    qianzhong: { generalId: 'qianzhong_wubayue', generalName: '吴八月', portrait: '/assets/bashu/qianzhong_wubayue.png' }, // 芷江·乾嘉苗民起义
    dangchang: { generalId: 'dangchang_liangmiding', generalName: '梁弥定', portrait: '/assets/bashu/dangchang_liangmiding.png' }, // 合川·宕昌末代王
    liao: { generalId: 'liao_houhongyuan', generalName: '侯弘远', portrait: '/assets/bashu/liao_houhongyuan.png' }, // 江阳·僚人酋帅
    sou: { generalId: 'sou_gaodingyuan', generalName: '高定元', portrait: '/assets/bashu/sou_gaodingyuan.png' }, // 乐山·越巂叟族首领
    qingqiang: { generalId: 'qingqiang_jiangwei', generalName: '姜维', portrait: '/assets/bashu/qingqiang_jiangwei.png' }, // 汶川·蜀汉大将军
    qingyi: { generalId: 'qingyi_qingyiwang', generalName: '张嶷', portrait: '/assets/bashu/qingyi_qingyiwang.png' }, // 严道·青衣羌首领

  // ── 河西区 2026-06-18 ──
        liangzhou: { generalId: 'liangzhou_zhanggui', generalName: '张轨', portrait: '/assets/hexi/liangzhou_zhanggui.png' },
    lanzhou: { generalId: 'lanzhou_zhaochongguo', generalName: '赵充国', portrait: '/assets/hexi/lanzhou_zhaochongguo.png' },
        wudu: { generalId: 'wudu_zhangyi', generalName: '张翼', portrait: '/assets/bashu/wudu_zhangyi.png' },
        baishui: { generalId: 'baishui_yanghuai', generalName: '杨怀', portrait: '/assets/bashu/baishui_yanghuai.png' },
        dangzhou: { generalId: 'dangzhou_dengai', generalName: '邓艾', portrait: '/assets/bashu/dangzhou_dengai.png' },
        didao: { generalId: 'didao_duanjiong', generalName: '段颎', portrait: '/assets/hexi/didao_duanjiong.png' },
    dashun: { generalId: 'dashun_lizicheng', generalName: '李自成', portrait: '/assets/hexi/dashun_lizicheng.png' },
    zhai_han: { generalId: 'zhai_han_dongyi', generalName: '董翳', portrait: '/assets/hexi/zhai_han_dongyi.png' },
    ganzhou: { generalId: 'ganzhou_dourong', generalName: '窦融', portrait: '/assets/hexi/ganzhou_dourong.png' },
        suzhou: { generalId: 'suzhou_huoqubing', generalName: '霍去病', portrait: '/assets/hexi/suzhou_huoqubing.png' },
    shazhou: { generalId: 'shazhou_zhangyichao', generalName: '张议潮', portrait: '/assets/hexi/shazhou_zhangyichao.png' },
    dongshengwei: { generalId: 'dongshengwei_wangyue_ming', generalName: '王越', portrait: '/assets/hexi/wangyue.png' },
    guiyi: { generalId: 'guiyi_caoyijin', generalName: '曹议金', portrait: '/assets/hexi/guiyi_caoyijin.png' },
    weiming: { generalId: 'weiming_lijiaqian', generalName: '李继迁', portrait: '/assets/hexi/weiming_lijiaqian.png' },
    helian: { generalId: 'helian_helianbobo', generalName: '赫连勃勃', portrait: '/assets/hexi/helian_helianbobo.png' },
    chile: { generalId: 'chile_hulvjin', generalName: '斛律金', portrait: '/assets/hexi/chile_hulvjin.png' },
    chijin: { generalId: 'chijin_qiewangshijia', generalName: '且旺失加', portrait: '/assets/hexi/chijin_qiewangshijia.png' },
    juyan_d: { generalId: 'juyan_d_liling', generalName: '李陵', portrait: '/assets/hexi/9559f55f-f639-4458-aae6-efaa1501714d.png' },
    shuofang: { generalId: 'shuofang_weiqing', generalName: '卫青', portrait: '/assets/hexi/shuofang_weiqing.png' },
    yeli: { generalId: 'yeli_yeliwangrong', generalName: '野利旺荣', portrait: '/assets/hexi/yeli_yeliwangrong.png' },
    hunxie: { generalId: 'hunxie_hunxiewang', generalName: '徐自为', portrait: '/assets/hexi/hunxie_hunxiewang.png' },
    guazhou: { generalId: 'guazhou_zhangshougui', generalName: '张守珪', portrait: '/assets/hexi/guazhou_zhangshougui.png' },
    kang: { generalId: 'kang_liangshidu', generalName: '梁师都', portrait: '/assets/hexi/kang_liangshidu.png' },
        woye: { generalId: 'woye_huangfugui', generalName: '皇甫规', portrait: '/assets/hexi/woye_huangfugui.png' },
    yingli: { generalId: 'yingli_jilasiyi', generalName: '籍辣思义', portrait: '/assets/hexi/yingli_jilasiyi.png' },
    dangxiang: { generalId: 'dangxiang_liyuanhao', generalName: '李元昊', portrait: '/assets/hexi/dangxiang_liyuanhao.png' },
    huizhou: { generalId: 'huizhou_yaodui', generalName: '姚兕', portrait: '/assets/hexi/huizhou_yaodui.png' },
    huan: { generalId: 'huan_zhongshidao', generalName: '种师道', portrait: '/assets/beifang/huan_zhongshidao.png' },
    wei2: { generalId: 'wei2_hunjian', generalName: '浑瑊', portrait: '/assets/hexi/wei2_hunjian.png' },
    lingwu: { generalId: 'lingwu_guoziyi', generalName: '郭子仪', portrait: '/assets/hexi/lingwu_guoziyi.png' },
    ningkou: { generalId: 'ningkou_lubode', generalName: '路博德', portrait: '/assets/hexi/ningkou_lubode.png' },
    juqu_d: { generalId: 'juqu_d_juqumengxun', generalName: '沮渠蒙逊', portrait: '/assets/hexi/juqu_d_juqumengxun.png' },
        zhengzhou: { generalId: 'zhengzhou_chenqingzhi', generalName: '陈庆之', portrait: '/assets/zhongyuan/zhengzhou_chenqingzhi.png' },
    sunqin: { generalId: 'sunqin_sunchuanting', generalName: '孙传庭', portrait: '/assets/zhongyuan/sunqin_sunchuanting.png' },
    hongnong_jun: { generalId: 'hongnong_jun_yangsu', generalName: '杨素', portrait: '/assets/zhongyuan/hongnong_jun_yangsu.png' }, // 弘农杨氏；灭陈/破突厥名将

// ── 中原区 2026-06-18 ──
    tianxiong: { generalId: 'tianxiong_tianchengsi', generalName: '田承嗣', portrait: '/assets/zhongyuan/tianxiong_tianchengsi.png' },
    ranwei_d: { generalId: 'ranwei_d_ranmin', generalName: '冉闵', portrait: '/assets/zhongyuan/ranwei_d_ranmin.png' },
    jin: { generalId: 'jin_xianzhen', generalName: '先轸', portrait: '/assets/zhongyuan/jin_xianzhen.png' },
    zhong: { generalId: 'zhong_xiexuan', generalName: '谢玄', portrait: '/assets/jiangnan/zhong_xiexuan.png' },
    zhongshan: { generalId: 'zhongshan_yangaoging', generalName: '颜杲卿', portrait: '/assets/zhongyuan/qi_sachabieqi.png' },
            huangfu: { generalId: 'huangfu_huangfusong', generalName: '皇甫嵩', portrait: '/assets/zhongyuan/huangfu_huangfusong.png' },
    wang_d: { generalId: 'wang_d_wangdao', generalName: '王导', portrait: '/assets/zhongyuan/wang_d_wangdao.png' },
    chimei: { generalId: 'chimei_fanchong', generalName: '樊崇', portrait: '/assets/zhongyuan/chimei_fanchong.png' },
        xiao_d: { generalId: 'xiao_d_xiaomohe', generalName: '萧摩诃', portrait: '/assets/jiangnan/zhengzhou_chenqingzhi.png' },
    wazhai: { generalId: 'wazhai_limi_wz', generalName: '李密', portrait: '/assets/zhongyuan/limi.png' },
    jiaodong: { generalId: 'jiaodong_tiandan', generalName: '田单', portrait: '/assets/zhongyuan/jiaodong_tiandan.png' },
    jibei: { generalId: 'jibei_xuxuan_cm', generalName: '徐宣', portrait: '/assets/zhongyuan/xuxuan.png' },
    jinan: { generalId: 'jinan_tiexuan', generalName: '铁铉', portrait: '/assets/zhongyuan/jinan_tiexuan.png' },
    qi: { generalId: 'qi_sunbin', generalName: '孙膑', portrait: '/assets/zhongyuan/qi_sunbin.png' },
    huaiyang: { generalId: 'huaiyang_zhouyafu', generalName: '周亚夫', portrait: '/assets/zhongyuan/huaiyang_zhouyafu.png' },
    yingzhou_d: { generalId: 'yingzhou_d_liuqi', generalName: '刘锜', portrait: '/assets/zhongyuan/yingzhou_d_liuqi.png' },
    cao_d: { generalId: 'cao_d_caocao', generalName: '曹操', portrait: '/assets/zhongyuan/cao_d_caocao.png' },
    long2: { generalId: 'long2_weixiaokuan', generalName: '韦孝宽', portrait: '/assets/zhongyuan/long2_weixiaokuan.png' },
    dongxian: { generalId: 'dongxian_xusheng_wu', generalName: '徐盛', portrait: '/assets/zhongyuan/xusheng.png' },
    mi: { generalId: 'mi_mizhu', generalName: '麋竺', portrait: '/assets/zhongyuan/mi_mizhu.png' },
    baibo: { generalId: 'baibo_guotai_bb', generalName: '郭太', portrait: '/assets/zhongyuan/guotai.png' },
    ruzhou: { generalId: 'ruzhou_zongze', generalName: '宗泽', portrait: '/assets/zhongyuan/ruzhou_zongze.png' },
    ruo: { generalId: 'ruo_wangjian', generalName: '王翦', portrait: '/assets/zhongyuan/ruo_wangjian.png' },
    yaozhou: { generalId: 'yaozhou_limaozhen', generalName: '李茂贞', portrait: '/assets/zhongyuan/yaozhou_limaozhen.png' },
    zhi_state: { generalId: 'zhi_state_caocan', generalName: '曹参', portrait: '/assets/zhongyuan/zhi_state_caocan.png' },
    // 周泰（东吴宿卫；原 wuwu_d，吕蒙迁濡须口后改挂莱国据点）
    yangshao: { generalId: 'yangshao_zhoubo', generalName: '周勃', portrait: '/assets/liuhan/yangshao_zhoubo.png' },
    dixiang: { generalId: 'dixiang_zhangxiu', generalName: '张绣', portrait: '/assets/zhongyuan/dixiang_zhangxiu.png' },
    zhou: { generalId: 'zhou_jifa', generalName: '姬发', portrait: '/assets/zhongyuan/zhou_jifa.png' },
    quanrong: { generalId: 'quanrong_quanrongwang', generalName: '义渠骇', portrait: '/assets/zhongyuan/quanrong_quanrongwang.png' },
    cai: { generalId: 'cai_lisu', generalName: '李愬', portrait: '/assets/zhongyuan/cai_lisu.png' },
    yun: { generalId: 'yun_wuli', generalName: '吾离', portrait: '/assets/zhongyuan/yun_wuli.png' },
        suzhou_d: { generalId: 'suzhou_d_shikefa', generalName: '史可法', portrait: '/assets/jiangnan/suzhou_d_shikefa.png' },
    pizhou: { generalId: 'pizhou_lvbu', generalName: '吕布', portrait: '/assets/zhongyuan/pizhou_lvbu.png' },
    yin: { generalId: 'yin_dixin', generalName: '帝辛', portrait: '/assets/zhongyuan/yin_dixin.png' },
    liwang: { generalId: 'liwang_liguangbi', generalName: '李光弼', portrait: '/assets/beifang/liwang_liguangbi.png' }, // 河间·乐成
    qing: { generalId: 'qing_wanyanchenheshang', generalName: '完颜陈和尚', portrait: '/assets/zhongyuan/qing_diqing.png' },
    han: { generalId: 'han_baoyuan_han', generalName: '暴鸢', portrait: '/assets/zhongyuan/baoyuan.png' },
    bailian: { generalId: 'bailian_liufutong', generalName: '刘福通', portrait: '/assets/zhongyuan/bailian_liufutong.png' },
    shen: { generalId: 'shen_shenbo', generalName: '申伯', portrait: '/assets/zhongyuan/shen_shenbo.png' },
    sima_d: { generalId: 'sima_d_simayi', generalName: '司马懿', portrait: '/assets/zhongyuan/sima_d_simayi.png' },
            liguo: { generalId: 'liguo_zhaoshe_zd', generalName: '赵奢', portrait: '/assets/zhongyuan/liguo_zhaoshe.png' },
    huai: { generalId: 'huai_zhuyuanzhang', generalName: '朱元璋', portrait: '/assets/zhongyuan/huai_zhuyuanzhang.png' },
    shangzhou: { generalId: 'shangzhou_shangyang', generalName: '商鞅', portrait: '/assets/qin/shangzhou_shangyang.png' },
    yuan_cj_d: { generalId: 'yuan_cj_d_yuanshu_zn', generalName: '袁术', portrait: '/assets/zhongyuan/yuanshu.png' },
    xinping: { generalId: 'xinping_haozhao', generalName: '郝昭', portrait: '/assets/zhongyuan/xinping_haozhao.png' },
    yuzhou: { generalId: 'yuzhou_zuti', generalName: '祖逆', portrait: '/assets/zhongyuan/yuzhou_zuti.png' },
    mengcheng_d: { generalId: 'mengcheng_d_gaoqiong', generalName: '高琼', portrait: '/assets/zhongyuan/mengcheng_d_gaoqiong.png' },
    lulin: { generalId: 'lulin_liuxiu', generalName: '刘秀', portrait: '/assets/zhongyuan/lulin_liuxiu.png' },
    dang_d: { generalId: 'dang_d_zhuwen', generalName: '朱温', portrait: '/assets/zhongyuan/dang_d_zhuwen.png' },
    hao_d: { generalId: 'hao_d_changyuchun', generalName: '常遇春', portrait: '/assets/zhongyuan/hao_d_changyuchun.png' },
    bozhou_d: { generalId: 'bozhou_d_luzhonglian', generalName: '鲁仲连', portrait: '/assets/zhongyuan/bozhou_d_luzhonglian.png' },
        zhuozhou: { generalId: 'zhuozhou_anlushan', generalName: '安禄山', portrait: '/assets/zhongyuan/zhuozhou_anlushan.png' },
        chanzhou: { generalId: 'chanzhou_lijilong', generalName: '李继隆', portrait: '/assets/zhongyuan/chanzhou_lijilong.png' }, // 濮阳·澶州弩手统领
    lai: { generalId: 'lai_wangshifan', generalName: '王师范', portrait: '/assets/beifang/lai_wangshifan.png' }, // 青石关·平卢节帅屡败朱温
    mushi: { generalId: 'mushi_muchong', generalName: '穆崇', portrait: '/assets/beifang/mushi_muchong.png' }, // 大岴·丘穆陵氏代北勋臣
    xiongding: { generalId: 'xiongding_murongyong', generalName: '慕容永', portrait: '/assets/beifang/xiongding_murongyong.png' }, // 天井关·西燕末代君主

    pinghai: { generalId: 'pinghai_laihuer', generalName: '来护儿', portrait: '/assets/beifang/pinghai_laihuer.png' }, // 漂渝津·隋征东舟师
    pingyuan: { generalId: 'pingyuan_yanzhenqing', generalName: '颜真卿', portrait: '/assets/beifang/pingyuan_yanzhenqing.png' }, // 平原·首倡义兵抗安史
    linhu: { generalId: 'linhu_zhaowulingwang', generalName: '赵雍', portrait: '/assets/beifang/linhu_zhaowulingwang.png' }, // 偏头关·胡服骑射
    xianyu: { generalId: 'xianyu_zhongshanchenggong', generalName: '成公', portrait: '/assets/beifang/xianyu_zhongshanchenggong.png' }, // 井陉关·中山君主
    shizhao_d: { generalId: 'shizhao_d_shihu', generalName: '石虎', portrait: '/assets/beifang/shizhao_d_shihu.png' }, // 邢台·后赵武帝
    loufan: { generalId: 'loufan_xuerengui', generalName: '薛仁贵', portrait: '/assets/beifang/loufan_xuerengui.png' },
    shanrong: { generalId: 'shanrong_qihuangong_qi', generalName: '齐桓公', portrait: '/assets/beifang/qihuangong.png' }, // 无终·伐山戎救燕

    // ── 北方关隘 2026-06-19 ──
    you: { generalId: 'you_wangba', generalName: '王霸', portrait: '/assets/beifang/you_wangba.png' },
    lingqiu: { generalId: 'lingqiu_zhaowuling', generalName: '赵武灵王', portrait: '/assets/beifang/lingqiu_zhouyuji.png' },
    yi: { generalId: 'yi_yanghong', generalName: '杨洪', portrait: '/assets/beifang/yi_yanghong.png' },
    huo: { generalId: 'huo_huoshuchu', generalName: '霍叔处', portrait: '/assets/beifang/huo_huoshuchu.png' },
    // ── 北方区 2026-06-18 ──
    jinzhou: { generalId: 'jinzhou_lichengliang', generalName: '李成梁', portrait: '/assets/dongbei/jinzhou_lichengliang.png' },
    zu_d: { generalId: 'zu_d_zudashou', generalName: '祖大寿', portrait: '/assets/dongbei/zu_d_zudashou.png' },
    mao_wenlong: { generalId: 'mao_wenlong_maowenlong', generalName: '毛文龙', portrait: '/assets/dongbei/mao_wenlong_maowenlong.png' },
    gongsun_d: { generalId: 'gongsun_d_gongsundu', generalName: '公孙度', portrait: '/assets/beifang/gongsun_d_gongsundu.png' },
    jianzhou_nvzhen: { generalId: 'jianzhou_nvzhen_limanzhu', generalName: '李满住', portrait: '/assets/beifang/jianzhou_nvzhen_limanzhu.png' }, // 浑江·建州女真卫
    weihaiwei: { generalId: 'weihaiwei_sudingfang', generalName: '苏定方', portrait: '/assets/zhongyuan/weihaiwei_sudingfang.png' },
    xuan: { generalId: 'xuan_mafang', generalName: '徐达', portrait: '/assets/beifang/xuan_mafang.png' },
    tuoba: { generalId: 'tuoba_tuobagui', generalName: '拓跋珪', portrait: '/assets/beifang/tuoba_tuobagui.png' },
    qingyuan_bd: { generalId: 'qingyuan_bd_zhoudewei', generalName: '周德威', portrait: '/assets/beifang/qingyuan_bd_zhoudewei.png' },
    changshan: { generalId: 'changshan_yanyangzhao', generalName: '杨延昭', portrait: '/assets/beifang/changshan_yanyangzhao.png' },
    hejian: { generalId: 'hejian_gongsunzan', generalName: '公孙瓒', portrait: '/assets/beifang/hejian_gongsunzan.png' }, // 文安·河间郡公孙瓒白马义从
    liangshidu: { generalId: 'liangshidu_longjia', generalName: '龙贾', portrait: '/assets/beifang/liangshidu_longjia.png' }, // 雕阴·魏将龙贾戍守抗秦
    yangshe: { generalId: 'yangshe_yangshezhi', generalName: '羊舌职', portrait: '/assets/beifang/yangshe_yangshezhi.png' }, // 铜鞮·晋羊舌氏封邑
    guzhu: { generalId: 'guzhu_tianyu', generalName: '田豫', portrait: '/assets/beifang/guzhu_tianyu.png' }, // 肥如·魏征北将军田豫镇北疆
    dizhou: { generalId: 'dizhou_wangyanzhang', generalName: '王彦章', portrait: '/assets/beifang/dizhou_wangyanzhang.png' }, // 乐安·后梁铁枪王彦章
    qu_d: { generalId: 'qu_d_quyi', generalName: '麴义', portrait: '/assets/beifang/qu_d_quyi.png' },
    gaoqi_d: { generalId: 'gaoqi_d_gaochanggong', generalName: '高长恭', portrait: '/assets/beifang/gaoqi_d_gaochanggong.png' },
    wangyan: { generalId: 'wangyan_wangyan_tx', generalName: '王彦', portrait: '/assets/beifang/wangyan.png' },
    linyu: { generalId: 'linyu_wusangui', generalName: '吴三桂', portrait: '/assets/beifang/linyu_wusangui.png' },
    dai_d: { generalId: 'dai_d_tuobashiyijian', generalName: '拓跋什翼犍', portrait: '/assets/beifang/dai_d_tuobashiyijian.png' },
    erzhu: { generalId: 'erzhu_erzhurong', generalName: '尔朱荣', portrait: '/assets/beifang/erzhu_erzhurong.png' },
    zhe_d: { generalId: 'zhe_d_zheyuqing', generalName: '折御卿', portrait: '/assets/beifang/zhe_d_zheyuqing.png' },
    heng1: { generalId: 'heng1_limu_yanyue', generalName: '李牧', portrait: '/assets/beifang/limu.png' },
    dingxiang_d: { generalId: 'dingxiang_d_lijing', generalName: '李靖', portrait: '/assets/litang/dingxiang_d_lijing.png' },
    xiayang_d: { generalId: 'xiayang_d_liji', generalName: '李勣', portrait: '/assets/litang/litang (9).png' },
    ying: { generalId: 'ying_caojingzong', generalName: '曹景宗', portrait: '/assets/nanfang/858810de-3a42-478d-97bf-747137f9f1e5.png' },
    kejia: { generalId: 'kejia_wentianxiang', generalName: '文天祥', portrait: '/assets/zhaosong/f4995d69-5f23-4dc0-952c-c291c1b577d7.png' },
    fu2: { generalId: 'fu2_zhoudi', generalName: '周迪', portrait: '/assets/nanfang/06737282-3748-4beb-84f6-9a60bfc7ef95.png' },
    ouyang: { generalId: 'ouyang_ouyangyi', generalName: '欧阳頠', portrait: '/assets/nanfang/5b5f8f4c-fae8-4f8e-a9d5-795a0f8601ae.png' },
    chu_d: { generalId: 'chu_d_chuguangyi', generalName: '储光羲', portrait: '/assets/zhaosong/605ec3ae-1447-43bc-a07f-cd8aa64e90cb.png' },
    yan: { generalId: 'yan_leyi', generalName: '乐毅', portrait: '/assets/beifang/yan_leyi.png' },
    zhao: { generalId: 'zhao_lianpo', generalName: '廉颇', portrait: '/assets/zhongyuan/zhao_lianpo.png' },
    yunzhong: { generalId: 'yunzhong_tuobaliwei', generalName: '拓跋力微', portrait: '/assets/beifang/yunzhong_tuobaliwei.png' },
    yang_aner: { generalId: 'yang_aner_yanganer', generalName: '杨安儿', portrait: '/assets/beifang/yang_aner_yanganer.png' },
        xie_cj_d: { generalId: 'xie_cj_d_xingfangde', generalName: '谢枋得', portrait: '/assets/jiangnan/xie_cj_d_xingfangde.png' }, // 葛溪·信州抗元殉国
    wan: { generalId: 'wan_lidian', generalName: '李典', portrait: '/assets/jiangnan/wan_lidian.png' }, // 皖城·曹魏守合肥
    huang_d: { generalId: 'huang_d_sunshuao', generalName: '孙叔敖', portrait: '/assets/jiangnan/huang_d_sunshuao.png' }, // 弋阳·楚国名相
    wenzhou: { generalId: 'wenzhou_zhangcong', generalName: '张璁', portrait: '/assets/jiangnan/wenzhou_zhangcong.png' }, // 永嘉·明首辅抗倭
    wuling: { generalId: 'wuling_xiangdancheng', generalName: '相单程', portrait: '/assets/jiangnan/wuling_xiangdancheng.png' },

// ── 江南区 2026-06-18 ──
    jiujiang: { generalId: 'jiujiang_zhouyu', generalName: '周瑜', portrait: '/assets/jiangnan/jiujiang_zhouyu.png' },
    fangla: { generalId: 'fangla_fangla_jn', generalName: '方腊', portrait: '/assets/jiangnan/fangla.png' },
    fang_guozhen: { generalId: 'fang_guozhen_fangguozhen', generalName: '方国珍', portrait: '/assets/jiangnan/fang_guozhen_fangguozhen.png' },
    ouyue: { generalId: 'ouyue_zouyao', generalName: '驺摇', portrait: '/assets/jiangnan/ouyue_zouyao.png' },
    ruochu: { generalId: 'ruochu_doulian', generalName: '鬬廉', portrait: '/assets/jiangnan/ruochu_doulian.png' },
    wuwu_d: { generalId: 'wuwu_d_lvmeng', generalName: '吕蒙', portrait: '/assets/zhongyuan/wuwu_d_lvmeng.png' },
        sunwu_d: { generalId: 'sunwu_d_sunquan', generalName: '孙权', portrait: '/assets/jiangnan/sunwu_d_sunquan.png' },
    yue: { generalId: 'yue_goujian', generalName: '勾践', portrait: '/assets/jiangnan/yue_goujian.png' },
    heng: { generalId: 'heng_hetengjiao', generalName: '何腾蛟', portrait: '/assets/jiangnan/heng_hetengjiao.png' },
    xushouhui: { generalId: 'xushouhui_zhaopusheng', generalName: '赵普胜', portrait: '/assets/jiangnan/xushouhui_zhaopusheng.png' },
    sui: { generalId: 'sui_yangzhong', generalName: '杨忠', portrait: '/assets/jiangnan/sui_yangzhong.png' },
    changshaguo: { generalId: 'changshaguo_xinqiji', generalName: '辛弃疾', portrait: '/assets/jiangnan/changshaguo_xinqiji.png' },
    yue_d: { generalId: 'yue_d_yuefei', generalName: '岳飞', portrait: '/assets/jiangnan/yue_d_yuefei.png' },
    zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', generalName: '张士诚', portrait: '/assets/jiangnan/zhangshicheng_zhangshicheng.png' },
    wu: { generalId: 'wu_sunwu', generalName: '孙武', portrait: '/assets/jiangnan/wu_sunwu.png' },
    qian_d: { generalId: 'qian_d_yudayou', generalName: '俞大猷', portrait: '/assets/jiangnan/qian_d_yudayou.png' },
    qiufu: { generalId: 'qiufu_qiufu_jn', generalName: '裘甫', portrait: '/assets/jiangnan/qiufu.png' },
    qi_d: { generalId: 'qi_d_qijiguang', generalName: '戚继光', portrait: '/assets/jiangnan/qi_d_qijiguang.png' },
    yiyang_d: { generalId: 'yiyang_d_mengzongzheng', generalName: '孟宗政', portrait: '/assets/jiangnan/yiyang_d_mengzongzheng.png' },
    yezongliu: { generalId: 'yezongliu_yezongliu', generalName: '叶宗留', portrait: '/assets/jiangnan/yezongliu_yezongliu.png' },
    shenshi: { generalId: 'shenshi_shenqingzhi', generalName: '沈庆之', portrait: '/assets/jiangnan/shenshi_shenqingzhi.png' },
    huangwang: { generalId: 'huangwang_huangchao', generalName: '黄巢', portrait: '/assets/jiangnan/huangwang_huangchao.png' },
    lujian: { generalId: 'lujian_zhanghuangyan', generalName: '张煌言', portrait: '/assets/jiangnan/lujian_zhanghuangyan.png' },
    linshihong: { generalId: 'linshihong_linshihong', generalName: '林士弘', portrait: '/assets/jiangnan/linshihong_linshihong.png' },
    liu: { generalId: 'liu_yingbu', generalName: '英布', portrait: '/assets/jiangnan/liu_yingbu.png' },
    // ting 已迁 wenzhou，王潮（闽国）归福建系
    shuntian: { generalId: 'shuntian_linshuangwen', generalName: '林爽文', portrait: '/assets/jiangnan/shuntian_linshuangwen.png' },
    chunshen: { generalId: 'chunshen_huangxie', generalName: '黄歇', portrait: '/assets/jiangnan/chunshen_huangxie.png' },
    mi_chu: { generalId: 'mi_chu_chuzhuangwang', generalName: '熊旅', portrait: '/assets/jiangnan/mi_chu_chuzhuangwang.png' },
    shanyue: { generalId: 'shanyue_zulang', generalName: '祖郎', portrait: '/assets/jiangnan/shanyue_zulang.png' },
    she_ethnic: { generalId: 'she_ethnic_leiwanxing', generalName: '雷万兴', portrait: '/assets/jiangnan/she_ethnic_leiwanxing.png' },
    wang_s: { generalId: 'wang_s_wanghua', generalName: '汪华', portrait: '/assets/jiangnan/wang_s_wanghua.png' },
    hongzhou: { generalId: 'hongzhou_zhuwenzheng', generalName: '朱文正', portrait: '/assets/jiangnan/hongzhou_zhuwenzheng.png' },
    danyang: { generalId: 'danyang_yuyunwen', generalName: '虞允文', portrait: '/assets/jiangnan/danyang_yuyunwen.png' },
    chizhou: { generalId: 'chizhou_wumingche', generalName: '吴明彻', portrait: '/assets/jiangnan/chizhou_wumingche.png' },
    gumie: { generalId: 'gumie_liuyu', generalName: '刘裕', portrait: '/assets/jiangnan/gumie_liuyu.png' },
    hu_d: { generalId: 'hu_d_husansheng', generalName: '胡三省', portrait: '/assets/jiangnan/hu_d_husansheng.png' },
    sagami: { generalId: 'sagami_hojoujiyasu', generalName: '北条氏康', portrait: '/assets/riben/sagami_hojoujiyasu.png' },
    mino: { generalId: 'mino_otaniyoshitsugu', generalName: '大谷吉继', portrait: '/assets/riben/mino_otaniyoshitsugu.png' },
    zhuqian: { generalId: 'zhuqian_shaozizheng', generalName: '少贰资能', portrait: '/assets/riben/zhuqian_shaozizheng.png' },
    ssangseong: { generalId: 'ssangseong_cuiying', generalName: '崔莹', portrait: '/assets/chaoxian/ssangseong_cuiying.png' },
    yao: { generalId: 'yao_liuyuan', generalName: '刘渊', portrait: '/assets/zhongyuan/yao_liuyuan.png' },
    kong_d: { generalId: 'kong_d_kongrong', generalName: '孔融', portrait: '/assets/zhongyuan/kong_d_kongrong.png' },
    tongma: { generalId: 'tongma_liuang', generalName: '刘卬', portrait: '/assets/zhongyuan/tongma_liuang.png' },
    yanchuan_d: { generalId: 'yanchuan_d_hanyu', generalName: '韩愈', portrait: '/assets/zhongyuan/yanchuan_d_hanyu.png' },
    guide_d: { generalId: 'guide_d_mashumou', generalName: '麻叔谋', portrait: '/assets/zhongyuan/guide_d_mashumou.png' },
    tongzhou: { generalId: 'tongzhou_yangzhiji', generalName: '杨智积', portrait: '/assets/zhongyuan/tongzhou_yangzhiji.png' },
    fu_zhou: { generalId: 'fu_zhou_yanyan', generalName: '严颜', portrait: '/assets/bashu/fu_zhou_yanyan.png' },
    lushui: { generalId: 'lushui_beigongboyu', generalName: '北宫伯玉', portrait: '/assets/hexi/lushui_beigongboyu.png' },
    cen_d: { generalId: 'cen_d_cenmeng', generalName: '岑猛', portrait: '/assets/lingnan/cen_d_cenmeng.png' },
    miao: { generalId: 'miao_amishi', generalName: '阿迷氏', portrait: '/assets/lingnan/miao_amishi.png' },
    jiang_s: { generalId: 'jiang_s_jiangwan', generalName: '蒋琬', portrait: '/assets/lingnan/jiang_s_jiangwan.png' },
    muong: { generalId: 'muong_shencongyue', generalName: '申从岳', portrait: '/assets/lingnan/muong_shencongyue.png' },
    panyao: { generalId: 'panyao_panhu', generalName: '盘瓠', portrait: '/assets/lingnan/panyao_panhu.png' },
    chen2: { generalId: 'chen2_zhaofan', generalName: '赵范', portrait: '/assets/lingnan/chen2_zhaofan.png' },
    qian: { generalId: 'qian_songjingyang', generalName: '宋景阳', portrait: '/assets/lingnan/qian_songjingyang.png' },
    qinghai: { generalId: 'qinghai_yuezhongqi', generalName: '岳钟琪', portrait: '/assets/bashu/qinghai_yuezhongqi.png' },
    jiashi: { generalId: 'jiashi_lixuance', generalName: '李玄策', portrait: '/assets/tubo/jiashi_lixuance.png' },
    yangtong: { generalId: 'yangtong_chisongdezan', generalName: '赤松德赞', portrait: '/assets/tubo/yangtong_chisongdezan.png' },
    monpa: { generalId: 'monpa_meireiluozhujiacuo', generalName: '梅惹·洛珠嘉措', portrait: '/assets/tubo/monpa_meireiluozhujiacuo.png' },
    xining: { generalId: 'xining_yangyingju', generalName: '杨应琚', portrait: '/assets/tubo/xining_yangyingju.png' },
    kalun: { generalId: 'kalun_dexinga', generalName: '德兴阿', portrait: '/assets/tubo/kalun_dexinga.png' },
    golog: { generalId: 'golog_wandezhaxi', generalName: '完德扎西', portrait: '/assets/tubo/golog_wandezhaxi.png' },
    lopi: { generalId: 'lopi_abo', generalName: '阿波', portrait: '/assets/tubo/lopi_abo.png' },
    donghu: { generalId: 'donghu_tuiyin', generalName: '推寅', portrait: '/assets/caoyuan/yanliyang.png' },
    dingling: { generalId: 'dingling_dinglingwang', generalName: '卫律', portrait: '/assets/caoyuan/dingling_dinglingwang.png' },
    yingzhou_ying_d: { generalId: 'yingzhou_ying_d_muronghuang', generalName: '慕容皝', portrait: '/assets/dongbei/yingzhou_ying_d_muronghuang.png' },
    buriat: { generalId: 'buriat_tumenjiergale', generalName: '图门吉尔嘎勒', portrait: '/assets/caoyuan/buliyateqiu.png' },
    oirat_ming: { generalId: 'oirat_ming_gaerdan', generalName: '噶尔丹', portrait: '/assets/caoyuan/oirat_ming_gaerdan.png' },    hui: { generalId: 'hui_bunaibou', generalName: '不耐侯', portrait: '/assets/chaoxian/hui_bunaibou.png' },
    donghui: { generalId: 'donghui_nanlv', generalName: '南闾', portrait: '/assets/chaoxian/donghui_nanlv.png' },
    gonggu: { generalId: 'gonggu_gonggudaozhu', generalName: '宫古岛主', portrait: '/assets/riben/gonggu_gonggudaozhu.png' },
    yizhi: { generalId: 'yizhi_yizhiwang', generalName: '卑狗', portrait: '/assets/riben/yizhi_yizhiwang.png' },
    beihai: { generalId: 'beihai_ayinuqiuzhang', generalName: '沙牟奢允', portrait: '/assets/riben/beihai_ayinuqiuzhang.png' },
    sheng_d: { generalId: 'sheng_d_liyiqi', generalName: '李亿祺', portrait: '/assets/chaoxian/sheng_d_liyiqi.png' },
    haikou: { generalId: 'haikou_wangzhi_pirate', generalName: '汪直', portrait: '/assets/lingnan/_fallback_.png' },
    shanshan: { generalId: 'shanshan_weituqi', generalName: '尉屠耆', portrait: '/assets/xiyu/_fallback_.png' },
    qianhui: { generalId: 'qianhui_baiyanhu', generalName: '白彦虎', portrait: '/assets/shuguo/_fallback_.png' },
    ava: { generalId: 'ava_sijifa', generalName: '思机法', portrait: '/assets/dianmian/_fallback_.png' },
    dian: { generalId: 'dian_duanjianwei', generalName: '段俭魏', portrait: '/assets/dianmian/_fallback_.png' },
    mon: { generalId: 'mon_monuhe', generalName: '摩奴诃', portrait: '/assets/dianmian/_fallback_.png' },
    ganden: { generalId: 'ganden_zongkaba', generalName: '宗喀巴', portrait: '/assets/tubo/_fallback_.png' },
    niang: { generalId: 'niang_suonanjiabo', generalName: '索南加波', portrait: '/assets/tubo/_fallback_.png' },
    dalung: { generalId: 'dalung_sangjiwen', generalName: '桑吉温', portrait: '/assets/tubo/_fallback_.png' },
    dong: { generalId: 'dong_nangqianjiabo', generalName: '囊谦加波', portrait: '/assets/tubo/_fallback_.png' },
    hor: { generalId: 'hor_chisang', generalName: '赤桑', portrait: '/assets/tubo/_fallback_.png' },
    cheng: { generalId: 'cheng_gongsunshu', generalName: '公孙述', portrait: '/assets/shuguo/_fallback_.png' },
    pyu: { generalId: 'pyu_molingtuo', generalName: '摩罗', portrait: '/assets/dianmian/_fallback_.png' },
    nongzhigao: { generalId: 'nongzhigao_huangshimi', generalName: '黄师宓', portrait: '/assets/lingnan/_fallback_.png' },
    weitou: { generalId: 'weitou_douti', generalName: '兜题', portrait: '/assets/xiyu/weitou_douti.png' },
    yumi: { generalId: 'yumi_anguo', generalName: '安国', portrait: '/assets/xiyu/aluoduo.png' },
    qiemo: { generalId: 'qiemo_anmoshenpan', generalName: '安末深盘', portrait: '/assets/xiyu/anduo.png' },
    pishan: { generalId: 'pishan_daihu', generalName: '代胡', portrait: '/assets/xiyu/qiemoche.png' },
    ruoqiang: { generalId: 'ruoqiang_ruoqiang_wang', generalName: '去胡来', portrait: '/assets/xiyu/ruoqiangwang.png' },
    weili: { generalId: 'weili_fan_d', generalName: '尉犁泛', portrait: '/assets/xiyu/luohud.png' },
    wensu: { generalId: 'wensu_guyi', generalName: '姑翼', portrait: '/assets/xiyu/youhuan.png' },
    duerbote: { generalId: 'duerbote_duerbote_taiji', generalName: '杜尔伯特台吉', portrait: '/assets/xiyu/duerbotetaiji.png' },
    xiye: { generalId: 'xiye_xiye_wang', generalName: '子合', portrait: '/assets/xiyu/xiyewang.png' },
    faqiang: { generalId: 'faqiang_niechizanpu', generalName: '聂赤', portrait: '/assets/tubo/faqiang_niechizanpu.png' },
    zhuoshi: { generalId: 'zhuoshi_zhuowangsun', generalName: '卓王孙', portrait: '/assets/bashu/zhuoshi_zhuowangsun.png' },
    xingliao: { generalId: 'xingliao_dayanlin', generalName: '大延琳', portrait: '/assets/chaoxian/xingliao_dayanlin.png' },
    xihai_d: { generalId: 'xihai_d_fulianchou', generalName: '伏连筹', portrait: '/assets/tubo/tuguhunwang.png' },
    guzgan: { generalId: 'guzgan_abulihalisi', generalName: '阿布·哈里斯', portrait: '/assets/zhongya/guzgan_abulihalisi.png' },
    kawusi: { generalId: 'kawusi_haidaer', generalName: '海达尔', portrait: '/assets/zhongya/kawusi_haidaer.png' },
    xianhai: { generalId: 'xianhai_shamalike', generalName: '沙马利克', portrait: '/assets/zhongya/xianhai_shamalike.png' },
    wuhu: { generalId: 'wuhu_dukake', generalName: '都卡克', portrait: '/assets/zhongya/wuhu_dukake.png' },
    xingan: { generalId: 'xingan_kalunshiwei', generalName: '海兰察', portrait: '/assets/caoyuan/xingan_kalunshiwei.png' },
    dongping: { generalId: 'dongping_langtan', generalName: '郎坦', portrait: '/assets/dongbei/dongpingji.png' },
    badakhshan: { generalId: 'badakhshan_luozhentan', generalName: '雅尔·贝格', portrait: '/assets/zhongya/badakhshan_luozhentan.png' },
    keliya: { generalId: 'keliya_fuduxin', generalName: '伏阇信', portrait: '/assets/tubo/keliya_yuchisheng_k.png' },
    bailong: { generalId: 'bailong_suomai', generalName: '索劢', portrait: '/assets/xiyu/bailong_suomai.png' },
    sai: { generalId: 'sai_gejiayun', generalName: '盖嘉运', portrait: '/assets/xiyu/sai_gejiayun.png' },
    weiwuer: { generalId: 'weiwuer_yusubu', generalName: '玉素布', portrait: '/assets/xiyu/weiwuer_yusubu.png' },
    kangba: { generalId: 'kangba_suonuomugunbu', generalName: '索诺木衮布', portrait: '/assets/tubo/kangba_suonuomugunbu.png' },
    yong: { generalId: 'yong_lujili', generalName: '庐戢黎', portrait: '/assets/bashu/yong_lujili.png' },
    jingcheng_d: { generalId: 'jingcheng_d_yuyouzhao', generalName: '鱼有沼', portrait: '/assets/chaoxian/jingcheng_d_yuyouzhao.png' },
    xin: { generalId: 'xin_wangmeng', generalName: '王猛', portrait: '/assets/zhongyuan/xin_wangmeng.png' },
  pangzha: { generalId: 'pangzha_halixingge', generalName: '哈里·辛格', portrait: '/assets/zhongya/pangzha_halixingge.png' },
  najie: { generalId: 'najie_minande', generalName: '米南德', portrait: '/assets/zhongya/najie_minande.png' },
  dulan_d: { generalId: 'dulan_d_aihamaide', generalName: '艾哈迈德', portrait: '/assets/zhongya/dulan_d_aihamaide.png' },
  muer: { generalId: 'muer_mujier', generalName: '穆吉尔', portrait: '/assets/zhongya/muer_mujier.png' },
  baha: { generalId: 'baha_gaiwamu', generalName: '盖瓦姆', portrait: '/assets/zhongya/baha_gaiwamu.png' },
  hali: { generalId: 'hali_subashi', generalName: '苏巴什', portrait: '/assets/zhongya/hali_subashi.png' },
  kalan: { generalId: 'kalan_suhela', generalName: '苏赫拉', portrait: '/assets/zhongya/kalan_suhela.png' },
  xisi: { generalId: 'xisi_yakubusafaer', generalName: '雅库布·萨法尔', portrait: '/assets/zhongya/xisi_yakubusafaer.png' },
  delan: { generalId: 'delan_sulun', generalName: '苏伦', portrait: '/assets/zhongya/delan_sulun.png' },
  huluo: { generalId: 'huluo_abumusilin', generalName: '阿布·穆斯林', portrait: '/assets/zhongya/guishuang_jianisejia.png' },
  aba: { generalId: 'aba_shapuer', generalName: '沙普尔', portrait: '/assets/zhongya/aba_shapuer.png' },
    wenling: { generalId: 'wenling_shilang', generalName: '施琅', portrait: '/assets/jiangnan/wenling_shilang.png' },
    qianzhou: { generalId: 'qianzhou_lisheng', generalName: '李晟', portrait: '/assets/zhongyuan/qianzhou_lisheng.png' },
    wuyue: { generalId: 'wuyue_qianliu', generalName: '钱镠', portrait: '/assets/jiangnan/wuyue_qianliu.png' },

    song: { generalId: 'song_zhaokuangyin', generalName: '赵匡胤', portrait: '/assets/zhaosong/song_zhaokuangyin.png' },
    chuzhou_d: { generalId: 'chuzhou_d_dugao', generalName: '杜杲', portrait: '/assets/jiangnan/chuzhou_d_dugao.png' },
    xiyuduhu: { generalId: 'xiyuduhu_banchao', generalName: '班超', portrait: '/assets/xiyu/xiyuduhu_banchao.png' },
};

/** 取某势力的开局名将；未配置返回 null（该势力不带将） */
export function getFactionGeneral(factionId: string): FactionGeneral | null {
    const general = FACTION_GENERALS[factionId];
    if (!general) return null;
    const portrait = _generalPortraitOverrides[general.generalId] ?? general.portrait;
    return {
        ...general,
        portrait: resolvePortraitAssetPath(portrait, { factionId }),
    };
}

/** 按 generalId 查势力表条目（F2 绑立绘 / 名牌显示） */
const _generalPortraitOverrides: Record<string, string> = {};

/** F2 绑定后热更新（写盘完成前即时生效；HMR 后以 FactionGenerals.ts 为准） */
export function setGeneralPortraitOverride(generalId: string, portraitPath: string): void {
    _generalPortraitOverrides[generalId] = portraitPath;
}

export function getGeneralRecordByGeneralId(generalId: string): FactionGeneral | null {
    for (const general of Object.values(FACTION_GENERALS)) {
        if (general.generalId === generalId) {
            const portrait = _generalPortraitOverrides[generalId] ?? general.portrait;
            return { ...general, portrait };
        }
    }
    return null;
}

