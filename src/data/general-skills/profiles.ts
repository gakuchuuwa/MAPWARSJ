/**

 * 武将技 · 将领装配档案（从 GeneralSkills.ts 拆出，2026-07-13）

 * 批量工具/脚本唯一允许写入的文件；类型与目录在 types.ts / catalogs.ts。

 * 条目键 = generalId（两者必须一致，校验规则 11.10 盯防）。

 */

import type { GeneralProfile } from './types';



/**



 * 将领装配表



 * 分配依据：史实战役证据 + TacticalSkillCatalog 的六种/三类标签



 * 现行装配：攻方优/均/劣三槽 + 守方优/均/劣三槽；名将另有战略技



 * 注：S②攻城拔寨已并入 S③所向披靡（2026-06-27），原 str_02 将领统一改挂 str_03（进攻方专精）



 */



export const GENERAL_PROFILES: Record<string, GeneralProfile> = {



    leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_558', balanceSkillId: 'ts_559', disadvantageSkillId: 'ts_560', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'attack' },

    kejila_shulunbao: { generalId: 'kejila_shulunbao', tier: 'famous', tacticalSkillId: 'ts_015', strategicSkillId: 'str_20', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense' },



    agui: { generalId: 'agui', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_714', advantageSkillId: 'ts_392', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_026', atkBalanceSkillId: 'ts_714', atkDisadvantageSkillId: 'ts_291', atkAdvantageSkillId: 'ts_001', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_591', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_591', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_593', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



        tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_434', strategicSkillId: 'str_06', advantageSkillId: 'ts_434', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_435', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_989', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_698', aptitude: 'create' , attackStyle: 'attack'},



    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_766', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_003', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'balanced'},



        ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_573', strategicSkillId: 'str_21', advantageSkillId: 'ts_573', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_575', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_747', defDisadvantageSkillId: 'ts_573', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_262', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_010', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_168', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_168', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_168', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_492', aptitude: 'reverse' , attackStyle: 'attack'},



    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_169', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_169', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_274', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    pagan_anulvtuo: { generalId: 'pagan_anulvtuo', tier: 'famous', tacticalSkillId: 'ts_307', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_167', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_852', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_854', aptitude: 'reverse' , attackStyle: 'defense'},



    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse' , attackStyle: 'defense'},



    tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_615', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_617', strategicSkillId: 'str_10', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_615', defBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },



        menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_07', advantageSkillId: 'ts_059', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_443', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_102', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_996', defDisadvantageSkillId: 'ts_994', aptitude: 'create' , attackStyle: 'attack'},



        bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_472', strategicSkillId: 'str_06', advantageSkillId: 'ts_472', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_473', atkBalanceSkillId: 'ts_472', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_118', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'attack'},



    goryeo_jianghanzan: { generalId: 'goryeo_jianghanzan', tier: 'famous', tacticalSkillId: 'ts_382', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_382', atkAdvantageSkillId: 'ts_158', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'defense'},



    ashikaga_zulizunshi: { generalId: 'ashikaga_zulizunshi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_072', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },



        tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_680', strategicSkillId: 'str_07', advantageSkillId: 'ts_680', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_681', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_681', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_167', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



        siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_612', strategicSkillId: 'str_12', advantageSkillId: 'ts_612', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_613', atkBalanceSkillId: 'ts_613', atkDisadvantageSkillId: 'ts_612', defBalanceSkillId: 'ts_614', atkAdvantageSkillId: 'ts_201', defAdvantageSkillId: 'ts_770', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



        shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'ts_777', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_376', aptitude: 'create' , attackStyle: 'attack'},



    bing_liji: { generalId: 'bing_liji', tier: 'famous', tacticalSkillId: 'ts_208', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_380', atkAdvantageSkillId: 'ts_242', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    min_wangshenzhi: { generalId: 'min_wangshenzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    quanzhou_liucongxiao: { generalId: 'quanzhou_liucongxiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_187', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_025', atkDisadvantageSkillId: 'ts_720', defBalanceSkillId: 'ts_103', defDisadvantageSkillId: 'ts_337', atkBalanceSkillId: 'ts_300', defAdvantageSkillId: 'ts_021', aptitude: 'reverse' , attackStyle: 'attack'},



        wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_428', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_429', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_204', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'attack'},



        manzhou_d_duoergun: { generalId: 'manzhou_d_duoergun', tier: 'famous', tacticalSkillId: 'ts_446', strategicSkillId: 'str_24', advantageSkillId: 'ts_446', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_447', atkAdvantageSkillId: 'ts_327', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_446', defDisadvantageSkillId: 'ts_784', defBalanceSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'attack'},



    xinluo_jinyuxin: { generalId: 'xinluo_jinyuxin', tier: 'famous', tacticalSkillId: 'ts_330', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    edo_dechuanjiakang: { generalId: 'edo_dechuanjiakang', tier: 'famous', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_005', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_508', strategicSkillId: 'str_24', atkDisadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_332', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },



        seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_13', advantageSkillId: 'ts_128', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_601', atkBalanceSkillId: 'ts_128', atkAdvantageSkillId: 'ts_319', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



        chenla_duyebamo: { generalId: 'chenla_duyebamo', tier: 'famous', tacticalSkillId: 'ts_483', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_483', disadvantageSkillId: 'ts_484', atkBalanceSkillId: 'ts_129', atkAdvantageSkillId: 'ts_322', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_170', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_473', defAdvantageSkillId: 'ts_170', atkAdvantageSkillId: 'ts_028', atkDisadvantageSkillId: 'ts_738', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_322', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_20', atkBalanceSkillId: 'ts_171', defBalanceSkillId: 'ts_156', atkAdvantageSkillId: 'ts_325', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_389', defDisadvantageSkillId: 'ts_712', aptitude: 'create', attackStyle: 'attack' },



    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_281', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },



    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'ordinary', tacticalSkillId: 'ts_289', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'defense' },



    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_352', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_12', atkDisadvantageSkillId: 'ts_580', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_320', aptitude: 'create', attackStyle: 'attack' },



        owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_114', strategicSkillId: 'str_20', advantageSkillId: 'ts_114', balanceSkillId: 'ts_580', disadvantageSkillId: 'ts_581', atkBalanceSkillId: 'ts_114', atkAdvantageSkillId: 'ts_362', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    totomi_jiujingzhongci: { generalId: 'totomi_jiujingzhongci', tier: 'ordinary', tacticalSkillId: 'ts_363', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'attack'},



    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



        aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_468', strategicSkillId: 'str_16', advantageSkillId: 'ts_011', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_470', atkBalanceSkillId: 'ts_469', atkDisadvantageSkillId: 'ts_470', defBalanceSkillId: 'ts_468', atkAdvantageSkillId: 'ts_399', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'balanced'},



    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_584', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_706', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_706', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_628', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'attack'},



    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    kaga_d_xiajianlailian: { generalId: 'kaga_d_xiajianlailian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_778', atkAdvantageSkillId: 'ts_778', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },



    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_345', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



            aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_470', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_470', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_511', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_161', aptitude: 'create' , attackStyle: 'attack'},



    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shimotsuke_yudougongguanggang: { generalId: 'shimotsuke_yudougongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_320', aptitude: 'reverse' , attackStyle: 'defense'},



    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'ordinary', tacticalSkillId: 'ts_381', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_376', aptitude: 'create' , attackStyle: 'attack'},



    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_439', atkAdvantageSkillId: 'ts_570', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_162', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_393', atkAdvantageSkillId: 'ts_660', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_034', atkAdvantageSkillId: 'ts_001', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'attack' },



    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    lelang_wangqi: { generalId: 'lelang_wangqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    anmei_yuwandaqin: { generalId: 'anmei_yuwandaqin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_218', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_403', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse', attackStyle: 'defense' },



    chen3_jizhun: { generalId: 'chen3_jizhun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_033', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



        joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_543', strategicSkillId: 'str_06', advantageSkillId: 'ts_543', balanceSkillId: 'ts_544', disadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_173', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_395', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'defense'},



    baiji_jiebo: { generalId: 'baiji_jiebo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_035', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_635', aptitude: 'reverse', attackStyle: 'defense' },



    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_340', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_408', atkAdvantageSkillId: 'ts_158', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'defense'},



    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_398', advantageSkillId: 'ts_438', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_439', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'balanced' },



    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_097', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_097', atkAdvantageSkillId: 'ts_185', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_034', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



            gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'ts_780', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_396', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    naju_d_wangjian_wangye: { generalId: 'naju_d_wangjian_wangye', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},



    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_099', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_100', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse' , attackStyle: 'defense'},



    huimo_gaoyanshou: { generalId: 'huimo_gaoyanshou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    aola_menglielun: { generalId: 'aola_menglielun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_029', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse', attackStyle: 'defense' },



    ewenki_gentemuer: { generalId: 'ewenki_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse' , attackStyle: 'attack'},



    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_433', atkAdvantageSkillId: 'ts_308', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    guishuang_qiujiuque: { generalId: 'guishuang_qiujiuque', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_361', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



        manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_570', strategicSkillId: 'str_07', advantageSkillId: 'ts_570', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_572', atkDisadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



        wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_636', strategicSkillId: 'str_07', advantageSkillId: 'ts_636', balanceSkillId: 'ts_637', disadvantageSkillId: 'ts_638', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_423', atkDisadvantageSkillId: 'ts_808', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_136', defDisadvantageSkillId: 'ts_637', aptitude: 'create' , attackStyle: 'attack'},



    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_537', aptitude: 'leverage' , attackStyle: 'defense'},



        dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_444', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_444', atkAdvantageSkillId: 'ts_057', defAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



        yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_131', strategicSkillId: 'str_01', advantageSkillId: 'ts_131', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_667', atkAdvantageSkillId: 'ts_668', atkDisadvantageSkillId: 'ts_667', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



        aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_465', strategicSkillId: 'str_06', advantageSkillId: 'ts_465', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_466', atkAdvantageSkillId: 'ts_330', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    xianbei_tuobamao: { generalId: 'xianbei_tuobamao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'defense'},



    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_486', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'attack'},



    dada_ming_dayanhan: { generalId: 'dada_ming_dayanhan', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_489', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_490', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_489', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },



    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'defense'},



    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'ordinary', tacticalSkillId: 'ts_333', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_333', atkAdvantageSkillId: 'ts_480', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    heisha_d_houlihu: { generalId: 'heisha_d_houlihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    hezhe_shaerhuda: { generalId: 'hezhe_shaerhuda', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    dawoer_baerdaqi: { generalId: 'dawoer_baerdaqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_822', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_742', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'defense'},



    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_360', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse' , attackStyle: 'defense'},



    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'defense'},



    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_475', atkAdvantageSkillId: 'ts_654', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    kuye_kuye_qichayi: { generalId: 'kuye_kuye_qichayi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'defense'},



    maomingan_suoetu: { generalId: 'maomingan_suoetu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'balanced'},



    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    eluoke_amuhaer: { generalId: 'eluoke_amuhaer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_691', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_486', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    nifuhe_baerhudai: { generalId: 'nifuhe_baerhudai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_332', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    woju_yinguan: { generalId: 'woju_yinguan', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    luzhou_zhangwenxiu: { generalId: 'luzhou_zhangwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



        jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_546', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_546', disadvantageSkillId: 'ts_547', atkAdvantageSkillId: 'ts_532', atkBalanceSkillId: 'ts_358', atkDisadvantageSkillId: 'ts_076', defBalanceSkillId: 'ts_085', defDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_154', aptitude: 'create' , attackStyle: 'attack'},



    wuzhou_limu: { generalId: 'wuzhou_limu', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_160', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_315', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_130', defBalanceSkillId: 'ts_137', atkAdvantageSkillId: 'ts_816', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'balanced'},



    ashina_ashinayandou: { generalId: 'ashina_ashinayandou', tier: 'ordinary', tacticalSkillId: 'ts_352', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_161', aptitude: 'create', attackStyle: 'attack' },



        wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_624', strategicSkillId: 'str_23', advantageSkillId: 'ts_624', balanceSkillId: 'ts_601', disadvantageSkillId: 'ts_626', atkAdvantageSkillId: 'ts_626', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



    yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_660', advantageSkillId: 'ts_678', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_081', atkDisadvantageSkillId: 'ts_678', atkAdvantageSkillId: 'ts_158', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },






    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},



    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'defense'},



        jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_534', strategicSkillId: 'str_01', advantageSkillId: 'ts_534', balanceSkillId: 'ts_535', disadvantageSkillId: 'ts_536', atkAdvantageSkillId: 'ts_535', atkDisadvantageSkillId: 'ts_534', defAdvantageSkillId: 'ts_536', atkBalanceSkillId: 'ts_035', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'attack'},



        liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_561', strategicSkillId: 'str_07', advantageSkillId: 'ts_561', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_563', atkBalanceSkillId: 'ts_561', atkDisadvantageSkillId: 'ts_233', atkAdvantageSkillId: 'ts_242', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



        yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_660', strategicSkillId: 'str_01', advantageSkillId: 'ts_660', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_119', atkBalanceSkillId: 'ts_661', atkDisadvantageSkillId: 'ts_084', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'defense'},



    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_759', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_069', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



        ogodei_chuoermahan: { generalId: 'ogodei_chuoermahan', tier: 'famous', tacticalSkillId: 'ts_576', strategicSkillId: 'str_13', advantageSkillId: 'ts_576', balanceSkillId: 'ts_475', disadvantageSkillId: 'ts_578', atkBalanceSkillId: 'ts_576', defBalanceSkillId: 'ts_578', atkAdvantageSkillId: 'ts_308', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    merkit_boyan: { generalId: 'merkit_boyan', tier: 'famous', tacticalSkillId: 'ts_235', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



        tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_621', strategicSkillId: 'str_24', advantageSkillId: 'ts_621', balanceSkillId: 'ts_622', disadvantageSkillId: 'ts_623', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_621', defBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_630', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



        xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_001', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_644', atkDisadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_118', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



        xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_648', strategicSkillId: 'str_07', advantageSkillId: 'ts_648', balanceSkillId: 'ts_650', disadvantageSkillId: 'ts_649', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_860', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_649', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage' , attackStyle: 'attack'},



    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_236', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_086', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_236', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_770', aptitude: 'create' , attackStyle: 'attack'},



    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_246', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_161', aptitude: 'create' , attackStyle: 'attack'},



    mengwu_hebulehan: { generalId: 'mengwu_hebulehan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



        shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_082', strategicSkillId: 'str_01', advantageSkillId: 'ts_082', balanceSkillId: 'ts_607', disadvantageSkillId: 'ts_608', atkBalanceSkillId: 'ts_608', atkDisadvantageSkillId: 'ts_606', defDisadvantageSkillId: 'ts_607', atkAdvantageSkillId: 'ts_355', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_475', aptitude: 'create' , attackStyle: 'attack'},



    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_244', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_376', aptitude: 'create' , attackStyle: 'attack'},



        huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'ts_528', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_528', disadvantageSkillId: 'ts_529', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_159', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_890', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'attack'},



    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    zhasaketu_zhasakesubadi: { generalId: 'zhasaketu_zhasakesubadi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'ordinary', tacticalSkillId: 'ts_229', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



        tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_618', strategicSkillId: 'str_07', advantageSkillId: 'ts_618', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_619', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_620', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



        da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_486', strategicSkillId: 'str_07', advantageSkillId: 'ts_486', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_487', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'defense'},



    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'attack'},



    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_231', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_231', atkBalanceSkillId: 'ts_659', defAdvantageSkillId: 'ts_504', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'balanced'},



    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_141', atkDisadvantageSkillId: 'ts_228', atkBalanceSkillId: 'ts_719', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_278', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'attack'},



    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_294', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_300', aptitude: 'create', attackStyle: 'attack' },



    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},



    cheshihou_angui: { generalId: 'cheshihou_angui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    kaerka_abadaihan: { generalId: 'kaerka_abadaihan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    huyan_peicen: { generalId: 'huyan_peicen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    chahar_yantiemuer: { generalId: 'chahar_yantiemuer', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_227', atkAdvantageSkillId: 'ts_570', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },



    ongut_alawusi: { generalId: 'ongut_alawusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



        rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'ts_594', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_594', disadvantageSkillId: 'ts_595', atkBalanceSkillId: 'ts_596', atkDisadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_654', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



            chagatai_genggong: { generalId: 'chagatai_genggong', tier: 'ordinary', tacticalSkillId: 'ts_368', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_368', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_713', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_368', defDisadvantageSkillId: 'ts_386', aptitude: 'reverse' , attackStyle: 'defense'},



    huihu_dunmohedagan: { generalId: 'huihu_dunmohedagan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    pugu_ashinaguduolu: { generalId: 'pugu_ashinaguduolu', tier: 'famous', tacticalSkillId: 'ts_238', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_239', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    xibo_d_tubote: { generalId: 'xibo_d_tubote', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



        borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_474', strategicSkillId: 'str_07', advantageSkillId: 'ts_012', balanceSkillId: 'ts_474', disadvantageSkillId: 'ts_476', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_080', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_247', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},
    // 2026-07-27 补中东四城+苏萨
    ailan_shuteluke: { generalId: 'ailan_shuteluke', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_016', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_403', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_294', aptitude: 'create', attackStyle: 'attack' },
    kesa_bulan: { generalId: 'kesa_bulan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    aiaoniya_alisita: { generalId: 'aiaoniya_alisita', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_043', atkAdvantageSkillId: 'ts_033', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'defense' },
    jialatai_deaota: { generalId: 'jialatai_deaota', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    guyashu_shamushi: { generalId: 'guyashu_shamushi', tier: 'famous', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_048', strategicSkillId: 'str_07', aptitude: 'create', attackStyle: 'attack' },



    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_413', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_433', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'defense' },



    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_409', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_486', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },



    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    baidi_baidizi: { generalId: 'baidi_baidizi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_077', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse', attackStyle: 'attack' },



    shiwei_saihou: { generalId: 'shiwei_saihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



    sunite_sousai: { generalId: 'sunite_sousai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_513', aptitude: 'reverse' , attackStyle: 'defense'},



            bulat_beiduanchaer: { generalId: 'bulat_beiduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_781', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_781', atkBalanceSkillId: 'ts_385', atkAdvantageSkillId: 'ts_308', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_635', aptitude: 'create' , attackStyle: 'attack'},



    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'attack'},



    hepan_gaoxianzhi: { generalId: 'hepan_gaoxianzhi', tier: 'famous', tacticalSkillId: 'ts_283', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'attack'},



    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    kepantuo_dulimi: { generalId: 'kepantuo_dulimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'balanced'},



    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    tuoming_tuomin: { generalId: 'tuoming_tuomin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_143', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    pisha_weichisheng: { generalId: 'pisha_weichisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'ordinary', tacticalSkillId: 'ts_366', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    yangguan_lihao: { generalId: 'yangguan_lihao', tier: 'ordinary', tacticalSkillId: 'ts_201', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },



    wulianghai_chelingwubashen: { generalId: 'wulianghai_chelingwubashen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



            shache_xian_suoche_shachexian: { generalId: 'shache_xian_suoche_shachexian', tier: 'ordinary', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_782', defAdvantageSkillId: 'ts_782', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_580', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shule_aersilan: { generalId: 'shule_aersilan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



    dzungar_galedanceling: { generalId: 'dzungar_galedanceling', tier: 'famous', tacticalSkillId: 'ts_285', advantageSkillId: 'ts_504', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_505', strategicSkillId: 'str_13', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_444', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_376', aptitude: 'create', attackStyle: 'balanced' },



    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_296', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_689', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'defense' },



    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_733', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    yarkand_abudulatifu: { generalId: 'yarkand_abudulatifu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    kala_satuke: { generalId: 'kala_satuke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    an_xibanni: { generalId: 'an_xibanni', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_045', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_392', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },



    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_302', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'attack'},



    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'ordinary', tacticalSkillId: 'ts_313', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_313', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_719', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_312', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'attack'},



        xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_645', strategicSkillId: 'str_13', advantageSkillId: 'ts_645', balanceSkillId: 'ts_646', disadvantageSkillId: 'ts_647', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_635', aptitude: 'create' , attackStyle: 'attack'},



    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_354', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_13', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_730', aptitude: 'create', attackStyle: 'attack' },



    xijue_ganyanshou: { generalId: 'xijue_ganyanshou', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },



        huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_525', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_525', disadvantageSkillId: 'ts_526', atkBalanceSkillId: 'ts_139', defBalanceSkillId: 'ts_527', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_816', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



        kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'ordinary', tacticalSkillId: 'ts_549', advantageSkillId: 'ts_549', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_551', atkBalanceSkillId: 'ts_549', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'defense'},



    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_319', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },



    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    mamon_mameng: { generalId: 'mamon_mameng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



    khoja_apakehezhuo: { generalId: 'khoja_apakehezhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'balanced'},



            fanyanna_xieer: { generalId: 'fanyanna_xieer', tier: 'ordinary', tacticalSkillId: 'ts_783', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_783', atkDisadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_705', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_320', aptitude: 'reverse' , attackStyle: 'defense'},



    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_764', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' , attackStyle: 'attack'},



    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    qiepantuo_luozhentan: { generalId: 'qiepantuo_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'defense'},



    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_161', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_543', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_985', defDisadvantageSkillId: 'ts_984', aptitude: 'reverse' , attackStyle: 'balanced'},



    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_715', atkDisadvantageSkillId: 'ts_277', atkAdvantageSkillId: 'ts_308', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_284', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_282', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_690', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_300', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'defense' },



    heyuan_d_heichichangzhi: { generalId: 'heyuan_d_heichichangzhi', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_300', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_679', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_12', atkDisadvantageSkillId: 'ts_131', defDisadvantageSkillId: 'ts_297', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_020', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_286', aptitude: 'create', attackStyle: 'attack' },



        gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'ts_519', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_519', disadvantageSkillId: 'ts_520', atkBalanceSkillId: 'ts_520', atkAdvantageSkillId: 'ts_352', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'balanced'},



    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'ts_368', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'defense'},



        gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_513', strategicSkillId: 'str_12', advantageSkillId: 'ts_513', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_515', atkDisadvantageSkillId: 'ts_514', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'balanced'},



    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },



    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_306', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},



    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'balanced'},



    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_317', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'balanced'},



    xiutu_jinridi: { generalId: 'xiutu_jinridi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



            gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_784', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_784', defBalanceSkillId: 'ts_707', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_748', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_332', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    guangwu_xinwuxian: { generalId: 'guangwu_xinwuxian', tier: 'famous', tacticalSkillId: 'ts_377', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'ts_349', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_161', aptitude: 'create' , attackStyle: 'attack'},



    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'defense'},



    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' , attackStyle: 'defense'},



    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_584', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'defense' },



    humi_zhentan: { generalId: 'humi_zhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_018', atkAdvantageSkillId: 'ts_003', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'attack' },



    gaoliang_geshuhan: { generalId: 'gaoliang_geshuhan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_743', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'attack'},



    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_300', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'balanced' },



            jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_785', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'balanced'},



    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'defense'},



    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'defense'},



    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'balanced'},



    gongtang_gongtangcang: { generalId: 'gongtang_gongtangcang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_822', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'balanced'},



    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_730', aptitude: 'reverse' , attackStyle: 'defense'},



    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'famous', tacticalSkillId: 'ts_334', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},





    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'defense'},



    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'attack' },



    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    dali_duansiping: { generalId: 'dali_duansiping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_712', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_408', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'defense'},



    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_304', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_433', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_458', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_653', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_630', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



        konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_20', advantageSkillId: 'ts_001', balanceSkillId: 'ts_556', disadvantageSkillId: 'ts_557', atkAdvantageSkillId: 'ts_556', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



        hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_522', strategicSkillId: 'str_12', advantageSkillId: 'ts_522', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_523', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_268', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_268', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_018', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'balanced'},



    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'defense'},



    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_513', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', aptitude: 'leverage' , attackStyle: 'defense'},



    taiyuan_menglai: { generalId: 'taiyuan_menglai', tier: 'famous', tacticalSkillId: 'ts_314', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    suke_langanheng: { generalId: 'suke_langanheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'ts_303', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'attack'},



    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_418', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_072', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'defense'},



            baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_786', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_786', atkAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



            champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_072', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'attack'},



    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },



    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_381', atkAdvantageSkillId: 'ts_444', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'defense'},



    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_273', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},



    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_650', aptitude: 'reverse' , attackStyle: 'defense'},



    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_730', aptitude: 'reverse', attackStyle: 'defense' },



    leizhou_limao: { generalId: 'leizhou_limao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'defense'},



    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizhen_qudaren: { generalId: 'shuizhen_qudaren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'defense'},



    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_403', atkAdvantageSkillId: 'ts_654', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'defense' },



    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_109', atkAdvantageSkillId: 'ts_660', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'defense'},



    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'defense'},



    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_287', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_347', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'balanced'},



    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_332', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_323', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_719', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_289', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_303', atkDisadvantageSkillId: 'ts_483', atkAdvantageSkillId: 'ts_154', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'defense'},



    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'defense'},



    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_012', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_931', aptitude: 'reverse' , attackStyle: 'attack'},



    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_415', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_795', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_294', aptitude: 'reverse', attackStyle: 'attack' },



    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_260', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    paiyao_huangguasi: { generalId: 'paiyao_huangguasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    yingzhou_liuyan: { generalId: 'yingzhou_liuyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_348', atkAdvantageSkillId: 'ts_242', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_635', aptitude: 'create' , attackStyle: 'attack'},



    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'balanced'},



    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'famous', tacticalSkillId: 'ts_337', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'attack'},



    taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_683', balanceSkillId: 'ts_684', disadvantageSkillId: 'ts_685', strategicSkillId: 'str_20', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_075', atkDisadvantageSkillId: 'ts_684', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_006', aptitude: 'create', attackStyle: 'balanced' },



    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    li_lx_d_liguang: { generalId: 'li_lx_d_liguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_377', defDisadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_325', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'defense'},



    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_178', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_07', atkAdvantageSkillId: 'ts_178', atkDisadvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_705', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },



    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_630', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_409', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



        dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_440', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_440', disadvantageSkillId: 'ts_441', defBalanceSkillId: 'ts_061', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_617', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_357', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'defense'},



    shengmiao_baoli: { generalId: 'shengmiao_baoli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



        guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_516', strategicSkillId: 'str_01', advantageSkillId: 'ts_516', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_517', atkAdvantageSkillId: 'ts_517', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_079', defDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_653', aptitude: 'leverage' , attackStyle: 'attack'},



    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



            xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_788', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_788', atkDisadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_020', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'balanced'},



    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shixing_houandou: { generalId: 'shixing_houandou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse', attackStyle: 'attack' },



    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_143', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_404', atkAdvantageSkillId: 'ts_525', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'attack'},



    zuo_d_wufu: { generalId: 'zuo_d_wufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'balanced'},



    wumeng_azi: { generalId: 'wumeng_azi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},



    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_271', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_271', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_634', aptitude: 'create' , attackStyle: 'balanced'},



    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'ordinary', tacticalSkillId: 'ts_273', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_635', aptitude: 'reverse' , attackStyle: 'defense'},



        zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_452', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_452', disadvantageSkillId: 'ts_453', atkAdvantageSkillId: 'ts_126', atkBalanceSkillId: 'ts_452', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_679', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'balanced'},



    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'defense'},



    daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'ordinary', tacticalSkillId: 'ts_495', advantageSkillId: 'ts_495', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_496', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_495', defAdvantageSkillId: 'ts_496', atkDisadvantageSkillId: 'ts_218', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_418', aptitude: 'create', attackStyle: 'attack' },



    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'balanced'},



        yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_801', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_765', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_752', defDisadvantageSkillId: 'ts_186', aptitude: 'leverage' , attackStyle: 'balanced'},



    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_257', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_193', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_427', defDisadvantageSkillId: 'ts_756', aptitude: 'create' , attackStyle: 'attack'},



    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_180', defDisadvantageSkillId: 'ts_331', atkAdvantageSkillId: 'ts_010', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_760', aptitude: 'leverage' , attackStyle: 'attack'},



    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_192', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_091', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_554', defBalanceSkillId: 'ts_700', defDisadvantageSkillId: 'ts_192', aptitude: 'reverse' , attackStyle: 'defense'},



    fushi_wangmeng: { generalId: 'fushi_wangmeng', tier: 'famous', tacticalSkillId: 'ts_279', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_350', atkDisadvantageSkillId: 'ts_646', atkAdvantageSkillId: 'ts_031', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



            ba_bamanzi: { generalId: 'ba_bamanzi', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_789', atkAdvantageSkillId: 'ts_789', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_033', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'defense'},



        hezhou_wangjian: { generalId: 'hezhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_450', strategicSkillId: 'str_10', advantageSkillId: 'ts_450', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_338', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_662', aptitude: 'reverse' , attackStyle: 'defense'},



            qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'ordinary', tacticalSkillId: 'ts_790', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_790', atkDisadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_484', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_265', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_265', defDisadvantageSkillId: 'ts_450', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_098', defBalanceSkillId: 'ts_366', aptitude: 'create' , attackStyle: 'attack'},



    tan_d_qinhou: { generalId: 'tan_d_qinhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'balanced'},



            bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_791', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'attack'},



    she_shechongming: { generalId: 'she_shechongming', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse', attackStyle: 'attack' },



    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_253', atkDisadvantageSkillId: 'ts_734', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_234', aptitude: 'leverage' , attackStyle: 'attack'},



    chenzhou_d_zhanghao: { generalId: 'chenzhou_d_zhanghao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_416', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_794', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'attack'},



    xiqin_wanyanchenheshang: { generalId: 'xiqin_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_309', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_120', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_320', aptitude: 'reverse' , attackStyle: 'balanced'},



    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_179', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_809', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'balanced' },



    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_249', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_405', aptitude: 'create' , attackStyle: 'attack'},



    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_655', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_711', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_270', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_270', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'attack'},



    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'ordinary', tacticalSkillId: 'ts_298', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'defense'},



    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_264', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_264', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_572', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},



    wudu_dengai: { generalId: 'wudu_dengai', tier: 'famous', tacticalSkillId: 'ts_162', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_10', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_363', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_692', defBalanceSkillId: 'ts_467', defDisadvantageSkillId: 'ts_981', aptitude: 'leverage', attackStyle: 'attack' },



    baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_037', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_650', aptitude: 'create', attackStyle: 'attack' },



    dangzhou_qiangduan: { generalId: 'dangzhou_qiangduan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_167', atkAdvantageSkillId: 'ts_362', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'defense'},



        didao_wangshao: { generalId: 'didao_wangshao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_457', atkDisadvantageSkillId: 'ts_122', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_475', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



        dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_492', strategicSkillId: 'str_07', advantageSkillId: 'ts_492', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_068', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_294', aptitude: 'reverse' , attackStyle: 'attack'},



        zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_460', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_461', atkDisadvantageSkillId: 'ts_023', defDisadvantageSkillId: 'ts_351', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_634', aptitude: 'create' , attackStyle: 'attack'},



    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'ordinary', tacticalSkillId: 'ts_252', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_252', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_240', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_422', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_240', atkDisadvantageSkillId: 'ts_359', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_841', defDisadvantageSkillId: 'ts_840', aptitude: 'create', attackStyle: 'attack' },



        shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_609', strategicSkillId: 'str_12', advantageSkillId: 'ts_609', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_113', defBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_071', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    dongshengwei_wangyue: { generalId: 'dongshengwei_wangyue', tier: 'famous', tacticalSkillId: 'ts_251', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_251', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},






    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_254', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_254', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_537', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_411', aptitude: 'create' , attackStyle: 'attack'},



    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_118', atkAdvantageSkillId: 'ts_480', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_391', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_422', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_276', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_990', defDisadvantageSkillId: 'ts_971', aptitude: 'create' , attackStyle: 'attack'},



    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'ts_315', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    hunxie_xuziwei: { generalId: 'hunxie_xuziwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_253', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'balanced'},



    kang_liangshidou: { generalId: 'kang_liangshidou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_034', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'defense'},



    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'famous', tacticalSkillId: 'ts_295', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'ts_250', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_yaosi: { generalId: 'huizhou_yaosi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'ordinary', tacticalSkillId: 'ts_255', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_255', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_072', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'defense'},



    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_320', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'balanced'},



        pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_567', strategicSkillId: 'str_06', advantageSkillId: 'ts_567', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_569', atkAdvantageSkillId: 'ts_569', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_679', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    ningkou_liling: { generalId: 'ningkou_liling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_118', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'defense'},



    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_256', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_256', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_163', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_434', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'attack'},



    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_202', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_194', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_194', atkBalanceSkillId: 'ts_342', atkDisadvantageSkillId: 'ts_287', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'attack'},



    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_20', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_098', aptitude: 'create', attackStyle: 'attack' },



        jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_537', advantageSkillId: 'ts_537', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_538', atkAdvantageSkillId: 'ts_751', atkBalanceSkillId: 'ts_538', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_551', defDisadvantageSkillId: 'ts_431', aptitude: 'leverage' , attackStyle: 'balanced'},



        zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_430', strategicSkillId: 'str_12', advantageSkillId: 'ts_430', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_157', atkDisadvantageSkillId: 'ts_019', defBalanceSkillId: 'ts_199', defDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_357', aptitude: 'reverse' , attackStyle: 'balanced'},



    zhongshan_yangaoqing: { generalId: 'zhongshan_yangaoqing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},



    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_183', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    wang_d_liuyu: { generalId: 'wang_d_liuyu', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_742', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_430', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_174', defDisadvantageSkillId: 'ts_993', aptitude: 'create' , attackStyle: 'attack'},



    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_405', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},



    xiao_d_xiaoyan: { generalId: 'xiao_d_xiaoyan', tier: 'famous', tacticalSkillId: 'ts_204', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    wazhai_zhanghan: { generalId: 'wazhai_zhanghan', tier: 'famous', tacticalSkillId: 'ts_203', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_203', atkAdvantageSkillId: 'ts_158', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_164', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_164', atkDisadvantageSkillId: 'ts_451', defBalanceSkillId: 'ts_776', defDisadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_185', defAdvantageSkillId: 'ts_655', aptitude: 'reverse' , attackStyle: 'balanced'},






    jinan_tiexuan: { generalId: 'jinan_tiexuan', tier: 'famous', tacticalSkillId: 'ts_195', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_195', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},



    qi_simarangju: { generalId: 'qi_simarangju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_398', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_594', atkDisadvantageSkillId: 'ts_134', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_206', aptitude: 'leverage' , attackStyle: 'defense'},



    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_275', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



        cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', strategicSkillId: 'str_29', tacticalSkillId: 'ts_477', advantageSkillId: 'ts_477', balanceSkillId: 'ts_478', disadvantageSkillId: 'ts_479', atkAdvantageSkillId: 'ts_022', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_812', defBalanceSkillId: 'ts_772', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage' , attackStyle: 'balanced'},



    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_197', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_018', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_160', atkBalanceSkillId: 'ts_211', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_901', defBalanceSkillId: 'ts_900', defDisadvantageSkillId: 'ts_902', aptitude: 'leverage' , attackStyle: 'attack'},



    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'balanced'},



    baibo_guotai: { generalId: 'baibo_guotai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'attack' },



    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_405', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_108', advantageSkillId: 'ts_005', balanceSkillId: 'ts_597', disadvantageSkillId: 'ts_001', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_466', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_494', defDisadvantageSkillId: 'ts_708', aptitude: 'create', attackStyle: 'attack' },



    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_196', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_701', atkAdvantageSkillId: 'ts_308', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_184', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    dixiang_wangmang: { generalId: 'dixiang_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_815', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_688', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'balanced'},



        zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_672', advantageSkillId: 'ts_672', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_673', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_317', defAdvantageSkillId: 'ts_673', defDisadvantageSkillId: 'ts_674', defBalanceSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    quanrong_yiquhai: { generalId: 'quanrong_yiquhai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    cai_lishuo: { generalId: 'cai_lishuo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_349', atkDisadvantageSkillId: 'ts_238', defAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_742', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },



    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_221', atkBalanceSkillId: 'ts_388', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_813', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_988', aptitude: 'leverage' , attackStyle: 'attack'},



    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_215', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_301', defAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_727', defBalanceSkillId: 'ts_278', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'balanced'},



            qing_quduan: { generalId: 'qing_quduan', tier: 'ordinary', tacticalSkillId: 'ts_458', advantageSkillId: 'ts_458', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_459', atkDisadvantageSkillId: 'ts_146', defDisadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_300', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    han_baoyuan: { generalId: 'han_baoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_161', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_380', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_294', aptitude: 'reverse', attackStyle: 'attack' },



    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'defense'},



    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_188', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_127', defDisadvantageSkillId: 'ts_729', aptitude: 'leverage' , attackStyle: 'balanced'},



    liguo_zhaoshe: { generalId: 'liguo_zhaoshe', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_189', atkDisadvantageSkillId: 'ts_697', atkBalanceSkillId: 'ts_486', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'defense'},



        huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_345', defBalanceSkillId: 'ts_501', defDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_655', aptitude: 'create' , attackStyle: 'attack'},



    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},





    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_266', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_786', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_266', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_373', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_722', atkDisadvantageSkillId: 'ts_373', defAdvantageSkillId: 'ts_724', defDisadvantageSkillId: 'ts_383', defBalanceSkillId: 'ts_705', aptitude: 'create', attackStyle: 'attack' },



    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



        lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_432', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_432', disadvantageSkillId: 'ts_433', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'balanced'},



    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_607', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_635', aptitude: 'create' , attackStyle: 'attack'},



    hao_d_weirui: { generalId: 'hao_d_weirui', tier: 'famous', tacticalSkillId: 'ts_193', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'balanced'},



    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_069', atkAdvantageSkillId: 'ts_474', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_730', aptitude: 'create', attackStyle: 'attack' },



    zhuozhou_anlushan: { generalId: 'zhuozhou_anlushan', tier: 'famous', tacticalSkillId: 'ts_226', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_226', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_366', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'attack'},



        chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_480', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_480', disadvantageSkillId: 'ts_481', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_087', atkDisadvantageSkillId: 'ts_482', defBalanceSkillId: 'ts_147', defAdvantageSkillId: 'ts_029', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'famous', tacticalSkillId: 'ts_217', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_217', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_020', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



            pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_792', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    linhu_mafang: { generalId: 'linhu_mafang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_425', strategicSkillId: 'str_23', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_425', defDisadvantageSkillId: 'ts_013', aptitude: 'reverse', attackStyle: 'attack' },



    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    loufan_xuerengui: { generalId: 'loufan_xuerengui', tier: 'famous', tacticalSkillId: 'ts_216', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_216', atkAdvantageSkillId: 'ts_624', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_376', aptitude: 'create' , attackStyle: 'attack'},



    shanrong_lanyu: { generalId: 'shanrong_lanyu', tier: 'famous', tacticalSkillId: 'ts_220', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_094', atkBalanceSkillId: 'ts_009', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_220', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



        you_gengyan: { generalId: 'you_gengyan', tier: 'famous', tacticalSkillId: 'ts_669', strategicSkillId: 'str_12', advantageSkillId: 'ts_669', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_670', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_478', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_670', defDisadvantageSkillId: 'ts_224', aptitude: 'create' , attackStyle: 'attack'},



        lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_564', advantageSkillId: 'ts_564', balanceSkillId: 'ts_565', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_564', defDisadvantageSkillId: 'ts_214', atkBalanceSkillId: 'ts_046', defBalanceSkillId: 'ts_433', aptitude: 'create' , attackStyle: 'attack'},






    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



        jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_750', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_660', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



        zu_d_yuanchonghuan: { generalId: 'zu_d_yuanchonghuan', tier: 'famous', tacticalSkillId: 'ts_675', strategicSkillId: 'str_12', advantageSkillId: 'ts_675', balanceSkillId: 'ts_450', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_065', atkBalanceSkillId: 'ts_699', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_144', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_679', aptitude: 'reverse' , attackStyle: 'defense'},



    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_047', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_003', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



        weihaiwei_sudingfang: { generalId: 'weihaiwei_sudingfang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_628', atkAdvantageSkillId: 'ts_341', atkBalanceSkillId: 'ts_329', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_629', defBalanceSkillId: 'ts_360', defDisadvantageSkillId: 'ts_230', aptitude: 'leverage' , attackStyle: 'attack'},



        xuan_xuda: { generalId: 'xuan_xuda', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_655', atkAdvantageSkillId: 'ts_089', atkBalanceSkillId: 'ts_1000', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_656', defBalanceSkillId: 'ts_246', defDisadvantageSkillId: 'ts_998', aptitude: 'create' , attackStyle: 'attack'},



    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_229', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'balanced'},



    changshan_yangyanzhao: { generalId: 'changshan_yangyanzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_095', defDisadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_028', aptitude: 'leverage', attackStyle: 'defense' },



    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_213', atkDisadvantageSkillId: 'ts_746', atkBalanceSkillId: 'ts_204', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'defense'},



    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'balanced'},



    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_212', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_212', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_029', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'defense'},



    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'famous', tacticalSkillId: 'ts_083', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_219', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_219', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_077', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_211', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_295', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    wangyan_wangyan: { generalId: 'wangyan_wangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_148', atkAdvantageSkillId: 'ts_208', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_407', atkAdvantageSkillId: 'ts_242', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'attack'},



        erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_510', strategicSkillId: 'str_01', advantageSkillId: 'ts_510', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_511', atkAdvantageSkillId: 'ts_510', atkDisadvantageSkillId: 'ts_512', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_650', aptitude: 'create' , attackStyle: 'attack'},



    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'famous', tacticalSkillId: 'ts_225', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'defense'},



    heng1_yangye: { generalId: 'heng1_yangye', tier: 'famous', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_005', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_455', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse', attackStyle: 'defense' },



        dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_436', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_437', disadvantageSkillId: 'ts_436', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_056', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_437', defDisadvantageSkillId: 'ts_961', aptitude: 'create' , attackStyle: 'attack'},



    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_205', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_727', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_659', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    ouyang_ouyangwei: { generalId: 'ouyang_ouyangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_417', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_719', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'defense'},



        yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_657', strategicSkillId: 'str_19', advantageSkillId: 'ts_657', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_658', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_314', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_547', defDisadvantageSkillId: 'ts_490', aptitude: 'create' , attackStyle: 'attack'},



    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_160', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_753', atkDisadvantageSkillId: 'ts_321', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_352', defAdvantageSkillId: 'ts_021', aptitude: 'reverse' , attackStyle: 'balanced'},



    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},






    xie_xiefangde: { generalId: 'xie_xiefangde', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'defense'},



    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'balanced'},



    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'balanced'},



    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'ordinary', tacticalSkillId: 'ts_338', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'defense'},



    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_008', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_316', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_987', defBalanceSkillId: 'ts_986', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage' , attackStyle: 'attack'},



    fangla_fangla: { generalId: 'fangla_fangla', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_634', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_299', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'famous', tacticalSkillId: 'ts_316', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



        wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_640', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_763', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    li_bian: { generalId: 'li_bian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_761', atkAdvantageSkillId: 'ts_480', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    yue_goujian: { generalId: 'yue_goujian', tier: 'ordinary', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_177', defBalanceSkillId: 'ts_188', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'attack'},



    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'defense'},



    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'attack'},



            sui_yangjian: { generalId: 'sui_yangjian', tier: 'ordinary', tacticalSkillId: 'ts_807', advantageSkillId: 'ts_005', balanceSkillId: 'ts_807', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_807', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_634', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    changshaguo_xinqiji: { generalId: 'changshaguo_xinqiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_176', atkAdvantageSkillId: 'ts_525', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_635', aptitude: 'reverse', attackStyle: 'attack' },



    yue_d_lusu: { generalId: 'yue_d_lusu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'defense'},



    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_299', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_730', aptitude: 'reverse' , attackStyle: 'balanced'},



        wu_sunwu: { generalId: 'wu_sunwu', tier: 'famous', tacticalSkillId: 'ts_633', strategicSkillId: 'str_19', advantageSkillId: 'ts_633', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_634', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_041', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_633', defDisadvantageSkillId: 'ts_920', defBalanceSkillId: 'ts_686', aptitude: 'reverse' , attackStyle: 'attack'},



    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_288', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_288', atkAdvantageSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    qiufu_qiufu: { generalId: 'qiufu_qiufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



        qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_585', advantageSkillId: 'ts_005', balanceSkillId: 'ts_585', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_585', defBalanceSkillId: 'ts_740', defDisadvantageSkillId: 'ts_586', defAdvantageSkillId: 'ts_357', aptitude: 'create' , attackStyle: 'balanced'},



    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_321', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'ts_606', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_336', atkDisadvantageSkillId: 'ts_125', atkBalanceSkillId: 'ts_034', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' , attackStyle: 'attack'},



    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_245', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'balanced'},



    mi_chu_xionglv: { generalId: 'mi_chu_xionglv', tier: 'famous', tacticalSkillId: 'ts_267', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_267', atkAdvantageSkillId: 'ts_033', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_175', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_175', atkDisadvantageSkillId: 'ts_302', atkBalanceSkillId: 'ts_072', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' , attackStyle: 'attack'},



    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    hongzhou_zhuwenzheng: { generalId: 'hongzhou_zhuwenzheng', tier: 'famous', tacticalSkillId: 'ts_263', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_404', aptitude: 'reverse' , attackStyle: 'defense'},



    danyang_huanwen: { generalId: 'danyang_huanwen', tier: 'famous', tacticalSkillId: 'ts_259', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_259', atkAdvantageSkillId: 'ts_185', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    chizhou_changyuchun: { generalId: 'chizhou_changyuchun', tier: 'famous', tacticalSkillId: 'ts_258', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'attack'},



    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    sagami_beitiaoshikang: { generalId: 'sagami_beitiaoshikang', tier: 'famous', tacticalSkillId: 'ts_331', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'balanced'},



    mino_dagujiji: { generalId: 'mino_dagujiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    zhuqian_shaoerzineng: { generalId: 'zhuqian_shaoerzineng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_207', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    kong_d_caogui: { generalId: 'kong_d_caogui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_049', atkAdvantageSkillId: 'ts_319', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},



    tongma_taishici: { generalId: 'tongma_taishici', tier: 'ordinary', tacticalSkillId: 'ts_389', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },



    yanchuan_d_yuefei: { generalId: 'yanchuan_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_092', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_421', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_420', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_248', defDisadvantageSkillId: 'ts_582', aptitude: 'create', attackStyle: 'attack' },



    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_730', aptitude: 'create' , attackStyle: 'balanced'},



    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    fu_zhou_yanyan: { generalId: 'fu_zhou_yanyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_686', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_748', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'defense'},



    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    cen_d_cenmeng: { generalId: 'cen_d_cenmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_389', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse', attackStyle: 'defense' },



    miao_amishi: { generalId: 'miao_amishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'defense'},



    jiang_s_huanggai: { generalId: 'jiang_s_huanggai', tier: 'ordinary', tacticalSkillId: 'ts_436', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_436', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },



    muong_shencongyue: { generalId: 'muong_shencongyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    panyao_panhu: { generalId: 'panyao_panhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    chen2_zhaofan: { generalId: 'chen2_zhaofan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'defense' },



    qian_songjingyang: { generalId: 'qian_songjingyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_292', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_292', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_742', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    jiashi_wangxuance: { generalId: 'jiashi_wangxuance', tier: 'famous', tacticalSkillId: 'ts_310', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_278', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    yangtong_chisongdezan: { generalId: 'yangtong_chisongdezan', tier: 'famous', tacticalSkillId: 'ts_378', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_378', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    monpa_meire: { generalId: 'monpa_meire', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'balanced'},



    xining_yangyingju: { generalId: 'xining_yangyingju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_679', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },



    golog_wandezhaxi: { generalId: 'golog_wandezhaxi', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse', attackStyle: 'defense' },



    lopi_abo: { generalId: 'lopi_abo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_688', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_537', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    dingling_weilu: { generalId: 'dingling_weilu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



        yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_663', balanceSkillId: 'ts_664', disadvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_664', atkAdvantageSkillId: 'ts_525', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'balanced'},



            buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_793', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_793', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_793', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' , attackStyle: 'defense'},



    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_237', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_278', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_513', aptitude: 'create' , attackStyle: 'attack'},



    donghui_nanlv: { generalId: 'donghui_nanlv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    gonggu_gonggudaozhu: { generalId: 'gonggu_gonggudaozhu', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'defense' },



    yizhi_beigou: { generalId: 'yizhi_beigou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    beihai_shamusheyun: { generalId: 'beihai_shamusheyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_781', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_385', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_635', aptitude: 'reverse', attackStyle: 'defense' },



    sheng_d_liyiqi: { generalId: 'sheng_d_liyiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'attack'},



    haikou_wangzhi: { generalId: 'haikou_wangzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},



    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_071', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_003', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse', attackStyle: 'defense' },



    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_197', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' , attackStyle: 'defense'},



    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_394', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'balanced'},



    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_703', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'balanced'},



    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_204', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'defense'},



    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    pyu_moluo: { generalId: 'pyu_moluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    nongzhigao_huangshimi: { generalId: 'nongzhigao_huangshimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse' , attackStyle: 'defense'},



    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



    ruoqiang_quhulai: { generalId: 'ruoqiang_quhulai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse' , attackStyle: 'attack'},



    weili_weilifan: { generalId: 'weili_weilifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_320', aptitude: 'reverse' , attackStyle: 'defense'},



    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' , attackStyle: 'defense'},



    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_537', atkAdvantageSkillId: 'ts_319', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'defense'},



    xiye_zihe: { generalId: 'xiye_zihe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    zhuoshi_gaopian: { generalId: 'zhuoshi_gaopian', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_294', aptitude: 'create' , attackStyle: 'attack'},



    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'attack'},



    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'attack'},



    guzgan_abuhalisi: { generalId: 'guzgan_abuhalisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'attack'},



    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },



    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



            wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_794', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_794', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    xingan_hailancha: { generalId: 'xingan_hailancha', tier: 'famous', tacticalSkillId: 'ts_243', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_584', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_816', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    badakhshan_yaerbeige: { generalId: 'badakhshan_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_361', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_659', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },



    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse' , attackStyle: 'defense'},



    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },



    sai_gaijiayun: { generalId: 'sai_gaijiayun', tier: 'ordinary', tacticalSkillId: 'ts_339', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'defense'},



    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage' , attackStyle: 'attack'},



    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'defense'},



    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_108', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_090', atkDisadvantageSkillId: 'ts_941', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_457', aptitude: 'create' , attackStyle: 'attack'},



        pangzha_halixinge: { generalId: 'pangzha_halixinge', tier: 'famous', tacticalSkillId: 'ts_582', strategicSkillId: 'str_12', advantageSkillId: 'ts_582', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_584', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'balanced'},



        najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_795', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_795', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_501', disadvantageSkillId: 'ts_502', strategicSkillId: 'str_13', atkDisadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_300', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },



    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_098', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_380', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'balanced' },



            hali_gedaerzi: { generalId: 'hali_gedaerzi', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_796', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage' , attackStyle: 'attack'},



    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



        delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_498', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_498', disadvantageSkillId: 'ts_499', atkAdvantageSkillId: 'ts_500', atkBalanceSkillId: 'ts_499', atkDisadvantageSkillId: 'ts_498', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'defense'},



        huluo_jiyasiding: { generalId: 'huluo_jiyasiding', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_532', atkDisadvantageSkillId: 'ts_533', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_705', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_320', aptitude: 'create' , attackStyle: 'attack'},



        aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_462', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_462', disadvantageSkillId: 'ts_463', atkDisadvantageSkillId: 'ts_464', defDisadvantageSkillId: 'ts_463', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_743', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    wenling_shilang: { generalId: 'wenling_shilang', tier: 'famous', tacticalSkillId: 'ts_287', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},



        qianzhou_lisheng: { generalId: 'qianzhou_lisheng', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_155', advantageSkillId: 'ts_155', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_590', atkDisadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_374', defDisadvantageSkillId: 'ts_387', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_010', defBalanceSkillId: 'ts_638', aptitude: 'create' , attackStyle: 'attack'},



    shaozhou_d_mayin: { generalId: 'shaozhou_d_mayin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_764', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



        song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_448', advantageSkillId: 'ts_005', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_449', atkBalanceSkillId: 'ts_449', defBalanceSkillId: 'ts_448', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_279', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    chuzhou_d_huangfuhui: { generalId: 'chuzhou_d_huangfuhui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_406', atkAdvantageSkillId: 'ts_033', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'defense'},



        xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_651', strategicSkillId: 'str_06', advantageSkillId: 'ts_651', balanceSkillId: 'ts_652', disadvantageSkillId: 'ts_653', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_064', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_367', defDisadvantageSkillId: 'ts_651', aptitude: 'leverage' , attackStyle: 'attack'},



    zizhou_wangjian: { generalId: 'zizhou_wangjian', tier: 'ordinary', tacticalSkillId: 'ts_816', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },



    cangzhou_liurengong: { generalId: 'cangzhou_liurengong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'defense' },



    yuezhi_xihou: { generalId: 'yuezhi_xihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_650', aptitude: 'reverse' , attackStyle: 'defense'},



    minyue_wuzhu: { generalId: 'minyue_wuzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},



    funan_fanman: { generalId: 'funan_fanman', tier: 'ordinary', tacticalSkillId: 'ts_158', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', aptitude: 'create', attackStyle: 'attack' },



    lancang_faang: { generalId: 'lancang_faang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    ahaomu_laqite: { generalId: 'ahaomu_laqite', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },



    elunchunzu_gaishan: { generalId: 'elunchunzu_gaishan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_631', atkAdvantageSkillId: 'ts_201', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'attack'},



    wazu_banhongwang: { generalId: 'wazu_banhongwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    tajikezu_kuerban: { generalId: 'tajikezu_kuerban', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'attack'},



    jingpozu_zaodan: { generalId: 'jingpozu_zaodan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizu_panxinjian: { generalId: 'shuizu_panxinjian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    liuzhou_shenxiyi: { generalId: 'liuzhou_shenxiyi', tier: 'ordinary', tacticalSkillId: 'ts_323', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_098', aptitude: 'create' , attackStyle: 'attack'},



    luming_luxiangsheng: { generalId: 'luming_luxiangsheng', tier: 'famous', tacticalSkillId: 'ts_179', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_210', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



        shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_123', advantageSkillId: 'ts_123', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_604', atkBalanceSkillId: 'ts_604', atkAdvantageSkillId: 'ts_319', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



        weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_630', strategicSkillId: 'str_23', advantageSkillId: 'ts_630', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_306', defAdvantageSkillId: 'ts_694', atkAdvantageSkillId: 'ts_816', atkDisadvantageSkillId: 'ts_689', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_712', aptitude: 'create' , attackStyle: 'attack'},



    dongsheng_weishang: { generalId: 'dongsheng_weishang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_205', atkAdvantageSkillId: 'ts_325', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    weiyuan_d_niangengyao: { generalId: 'weiyuan_d_niangengyao', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_272', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_272', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_204', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_006', aptitude: 'create' , attackStyle: 'attack'},



    yansui_wangwei: { generalId: 'yansui_wangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_161', aptitude: 'reverse' , attackStyle: 'defense'},



    xiazhou_lijiqian: { generalId: 'xiazhou_lijiqian', tier: 'famous', tacticalSkillId: 'ts_379', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_379', atkAdvantageSkillId: 'ts_354', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shizhou_liucong: { generalId: 'shizhou_liucong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage' , attackStyle: 'attack'},



    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage' , attackStyle: 'attack'},

    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},

    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},

    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},

    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_748', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'defense'},

    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage' , attackStyle: 'balanced'},

    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_190', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage' , attackStyle: 'defense'},

    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'ordinary', tacticalSkillId: 'ts_504', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },

    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_275', atkAdvantageSkillId: 'ts_444', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage' , attackStyle: 'attack'},

    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_145', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_770', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},

    gaxa_zhashi: { generalId: 'gaxa_zhashi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},

    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_628', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},

    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_380', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},

    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_718', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage' , attackStyle: 'balanced'},

        khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_06', advantageSkillId: 'ts_128', balanceSkillId: 'ts_553', disadvantageSkillId: 'ts_554', atkAdvantageSkillId: 'ts_553', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},

    yanzhou_zhongshiheng: { generalId: 'yanzhou_zhongshiheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},

    pingnan_muying: { generalId: 'pingnan_muying', tier: 'famous', tacticalSkillId: 'ts_279', strategicSkillId: 'str_13', atkBalanceSkillId: 'ts_523', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_485', atkAdvantageSkillId: 'ts_028', defDisadvantageSkillId: 'ts_006', aptitude: 'create', attackStyle: 'attack' },

    yuan_cj_d_lishuo: { generalId: 'yuan_cj_d_lishuo', tier: 'famous', tacticalSkillId: 'ts_289', strategicSkillId: 'str_16', atkAdvantageSkillId: 'ts_911', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_181', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_910', defDisadvantageSkillId: 'ts_912', aptitude: 'leverage', attackStyle: 'defense' },
    cangsong_machao: { generalId: 'cangsong_machao', tier: 'ordinary', tacticalSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_742', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_294', aptitude: 'create', attackStyle: 'attack' },
    aertai_baibuhua: { generalId: 'aertai_baibuhua', tier: 'ordinary', tacticalSkillId: 'ts_021', defBalanceSkillId: 'ts_014', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_071', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse', attackStyle: 'attack' },
    manghuti_weidaer: { generalId: 'manghuti_weidaer', tier: 'ordinary', tacticalSkillId: 'ts_765', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' },
    chenli_d_zuoxianwang: { generalId: 'chenli_d_zuoxianwang', tier: 'ordinary', tacticalSkillId: 'ts_390', atkDisadvantageSkillId: 'ts_414', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_795', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'defense' },
    weiming_weiminglinggong: { generalId: 'weiming_weiminglinggong', tier: 'ordinary', tacticalSkillId: 'ts_399', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    yang_aner_yangan: { generalId: 'yang_aner_yangan', tier: 'ordinary', tacticalSkillId: 'ts_282', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    xingwei_hanba: { generalId: 'xingwei_hanba', tier: 'ordinary', tacticalSkillId: 'ts_220', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    saerbadaer_lazhake: { generalId: 'saerbadaer_lazhake', tier: 'ordinary', tacticalSkillId: 'ts_374', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },
    kumisi_aerpu: { generalId: 'kumisi_aerpu', tier: 'ordinary', tacticalSkillId: 'ts_402', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse', attackStyle: 'attack' },
    ribale_faheerdaolai: { generalId: 'ribale_faheerdaolai', tier: 'ordinary', tacticalSkillId: 'ts_239', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'defense' },
    yilihanguo_d_hezan: { generalId: 'yilihanguo_d_hezan', tier: 'ordinary', tacticalSkillId: 'ts_213', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    yilihanguo_yisimeier: { generalId: 'yilihanguo_yisimeier', tier: 'famous', tacticalSkillId: 'ts_003', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_179', aptitude: 'create', attackStyle: 'balanced' },
    asaibaijiang_xuliewu: { generalId: 'asaibaijiang_xuliewu', tier: 'famous', tacticalSkillId: 'ts_724', strategicSkillId: 'str_16', atkBalanceSkillId: 'ts_278', atkAdvantageSkillId: 'ts_033', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_320', aptitude: 'create', attackStyle: 'attack' },
    wulaertu_ajishenti: { generalId: 'wulaertu_ajishenti', tier: 'ordinary', tacticalSkillId: 'ts_258', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_376', aptitude: 'create', attackStyle: 'balanced' },
    gelujiya_tamaer: { generalId: 'gelujiya_tamaer', tier: 'ordinary', tacticalSkillId: 'ts_293', atkBalanceSkillId: 'ts_745', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse', attackStyle: 'balanced' },
    bendou_alikesai: { generalId: 'bendou_alikesai', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_371', atkAdvantageSkillId: 'ts_293', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_154', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_017', aptitude: 'create', attackStyle: 'defense' },
    keerjisi_bagelate: { generalId: 'keerjisi_bagelate', tier: 'ordinary', tacticalSkillId: 'ts_250', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_433', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse', attackStyle: 'defense' },
    bendou_d_mitelidati: { generalId: 'bendou_d_mitelidati', tier: 'famous', tacticalSkillId: 'ts_221', strategicSkillId: 'str_06', atkBalanceSkillId: 'ts_046', atkAdvantageSkillId: 'ts_185', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse', attackStyle: 'attack' },
    heti_muwatali: { generalId: 'heti_muwatali', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_029', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'balanced' },
    fulijiya_maidasi: { generalId: 'fulijiya_maidasi', tier: 'ordinary', tacticalSkillId: 'ts_339', atkBalanceSkillId: 'ts_705', atkAdvantageSkillId: 'ts_208', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_635', aptitude: 'create', attackStyle: 'defense' },
    ldiya_keluoyisi: { generalId: 'ldiya_keluoyisi', tier: 'famous', tacticalSkillId: 'ts_354', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_650', aptitude: 'reverse', attackStyle: 'attack' },
    pajiama_oumainisi: { generalId: 'pajiama_oumainisi', tier: 'famous', tacticalSkillId: 'ts_039', strategicSkillId: 'str_13', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'balanced' },
    bitiniya_diaoduoer: { generalId: 'bitiniya_diaoduoer', tier: 'ordinary', tacticalSkillId: 'ts_026', atkDisadvantageSkillId: 'ts_411', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_018', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse', attackStyle: 'defense' },
    baizhanting_beilisaliu: { generalId: 'baizhanting_beilisaliu', tier: 'famous', tacticalSkillId: 'ts_201', strategicSkillId: 'str_21', atkBalanceSkillId: 'ts_366', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'balanced' },
    luomu_jilijie: { generalId: 'luomu_jilijie', tier: 'famous', tacticalSkillId: 'ts_221', strategicSkillId: 'str_23', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    sailiugu_antiaoke: { generalId: 'sailiugu_antiaoke', tier: 'famous', tacticalSkillId: 'ts_004', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'attack' },
    womaya_muaweiye: { generalId: 'womaya_muaweiye', tier: 'famous', tacticalSkillId: 'ts_308', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse', attackStyle: 'balanced' },
    xibolai_dawei: { generalId: 'xibolai_dawei', tier: 'famous', tacticalSkillId: 'ts_208', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse', attackStyle: 'attack' },
    shengdian_qishi_demolai: { generalId: 'shengdian_qishi_demolai', tier: 'ordinary', tacticalSkillId: 'ts_015', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },
    maerta_qishi_walaite: { generalId: 'maerta_qishi_walaite', tier: 'famous', tacticalSkillId: 'ts_015', strategicSkillId: 'str_20', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },
    dibisi_tutemosi: { generalId: 'dibisi_tutemosi', tier: 'famous', tacticalSkillId: 'ts_284', strategicSkillId: 'str_12', defDisadvantageSkillId: 'ts_650', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_743', aptitude: 'reverse', attackStyle: 'attack' },
    aiji_lameisisi: { generalId: 'aiji_lameisisi', tier: 'famous', tacticalSkillId: 'ts_004', strategicSkillId: 'str_01', defDisadvantageSkillId: 'ts_006', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_745', aptitude: 'reverse', attackStyle: 'balanced' },
    safawei_aisimaier: { generalId: 'safawei_aisimaier', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse', attackStyle: 'attack' },
    tuolemi_tuolemi: { generalId: 'tuolemi_tuolemi', tier: 'famous', tacticalSkillId: 'ts_066', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_098', aptitude: 'create', attackStyle: 'balanced' },
    yashu_saergong: { generalId: 'yashu_saergong', tier: 'famous', tacticalSkillId: 'ts_141', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    youfaladi_yehaiya: { generalId: 'youfaladi_yehaiya', tier: 'ordinary', tacticalSkillId: 'ts_183', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'defense' },
    qiliqiya_pangpei: { generalId: 'qiliqiya_pangpei', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_213', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    aqimeinide_daliushi: { generalId: 'aqimeinide_daliushi', tier: 'famous', tacticalSkillId: 'ts_250', strategicSkillId: 'str_22', atkBalanceSkillId: 'ts_020', atkAdvantageSkillId: 'ts_399', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'balanced' },
    jialedi_nibujianisa: { generalId: 'jialedi_nibujianisa', tier: 'famous', tacticalSkillId: 'ts_316', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    paermila_zhinuobiya: { generalId: 'paermila_zhinuobiya', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_223', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse', attackStyle: 'attack' },
    sashan_shipuer: { generalId: 'sashan_shipuer', tier: 'famous', tacticalSkillId: 'ts_259', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_161', aptitude: 'create' },
    abasi_mansuer: { generalId: 'abasi_mansuer', tier: 'ordinary', tacticalSkillId: 'ts_004', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse', attackStyle: 'defense' },
    xikesuosi_salidi: { generalId: 'xikesuosi_salidi', tier: 'ordinary', tacticalSkillId: 'ts_215', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    yashu_shanaheilibu: { generalId: 'yashu_shanaheilibu', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_16', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_376', aptitude: 'reverse' },
    youfaladi_anate: { generalId: 'youfaladi_anate', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' },
    midi_daiaokaisi: { generalId: 'midi_daiaokaisi', tier: 'ordinary', tacticalSkillId: 'ts_311', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_017', aptitude: 'create', attackStyle: 'defense' },
    qiliqiya_lewen: { generalId: 'qiliqiya_lewen', tier: 'famous', tacticalSkillId: 'ts_212', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' },
    bosi_bolisi_daliushi: { generalId: 'bosi_bolisi_daliushi', tier: 'famous', tacticalSkillId: 'ts_355', strategicSkillId: 'str_06', atkAdvantageSkillId: 'ts_357', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse' },
    susa_xiuteluke: { generalId: 'susa_xiuteluke', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_21', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage' },
    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_806', strategicSkillId: 'str_01', defAdvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_179', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'defense' },
    safawei_d_abasi: { generalId: 'safawei_d_abasi', tier: 'famous', tacticalSkillId: 'ts_239', strategicSkillId: 'str_12', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'balanced' },
    sumeier_lugaerbanda: { generalId: 'sumeier_lugaerbanda', tier: 'ordinary', tacticalSkillId: 'ts_005', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'defense' },
    ayoubu_salaheding: { generalId: 'ayoubu_salaheding', tier: 'famous', tacticalSkillId: 'ts_220', strategicSkillId: 'str_16', defBalanceSkillId: 'ts_286', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_415', defAdvantageSkillId: 'ts_770', defDisadvantageSkillId: 'ts_650', aptitude: 'reverse', attackStyle: 'balanced' },
    ansxi_aershake: { generalId: 'ansxi_aershake', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_719', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_730', aptitude: 'create', attackStyle: 'attack' },
    nabatai_aleitasi: { generalId: 'nabatai_aleitasi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_21', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'attack' },
    xike_lanjite: { generalId: 'xike_lanjite', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    deli_alawuding: { generalId: 'deli_alawuding', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_418', aptitude: 'create', attackStyle: 'attack' },
    mowoer_akeba: { generalId: 'mowoer_akeba', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_712', aptitude: 'create', attackStyle: 'attack' },
    jieri_jieriwang: { generalId: 'jieri_jieriwang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },
    jiashi_jiashiwang: { generalId: 'jiashi_jiashiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' },
    kongque_zhantuoluo: { generalId: 'kongque_zhantuoluo', tier: 'famous', tacticalSkillId: 'ts_480', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_017', aptitude: 'create', attackStyle: 'attack' },
    mojietuo_pinbisuoluo: { generalId: 'mojietuo_pinbisuoluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' },
    boluo_damoboluo: { generalId: 'boluo_damoboluo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_320', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_366', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_006', aptitude: 'create', attackStyle: 'attack' },
    sumo_sumowang: { generalId: 'sumo_sumowang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse', attackStyle: 'defense' },
    jiashi_jiashiwang_d: { generalId: 'jiashi_jiashiwang_d', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse', attackStyle: 'defense' },
    beileinisi_tuolemiershi: { generalId: 'beileinisi_tuolemiershi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'defense' },
    dedan_dedanwang: { generalId: 'dedan_dedanwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_635', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_530', aptitude: 'leverage', attackStyle: 'defense' },
    maidina_halide: { generalId: 'maidina_halide', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    gulaishi_aibu: { generalId: 'gulaishi_aibu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },
    xierwan_farukusha: { generalId: 'xierwan_farukusha', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_764', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse', attackStyle: 'defense' },
    xiemian_xiemianwang: { generalId: 'xiemian_xiemianwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'defense' },
    yidier_yidiewang: { generalId: 'yidier_yidiewang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage', attackStyle: 'defense' },
    salai_salaiwang: { generalId: 'salai_salaiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'defense' },
    xierhe_saerjue: { generalId: 'xierhe_saerjue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_161', aptitude: 'create', attackStyle: 'attack' },
    mangshi_mangshiwang: { generalId: 'mangshi_mangshiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'defense' },
    jibei_wangkuang: { generalId: 'jibei_wangkuang', tier: 'ordinary', tacticalSkillId: 'ts_511', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },



    gen_abd_al_rahman_iii: { generalId: 'gen_abd_al_rahman_iii', tier: 'famous', tacticalSkillId: 'ts_003', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_758', defDisadvantageSkillId: 'ts_017', aptitude: 'create', attackStyle: 'attack' },
    gen_afonso_henriques: { generalId: 'gen_afonso_henriques', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkBalanceSkillId: 'ts_397', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' },
    gen_alain_i: { generalId: 'gen_alain_i', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_757', atkAdvantageSkillId: 'ts_308', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_albert_riga: { generalId: 'gen_albert_riga', tier: 'ordinary', tacticalSkillId: 'ts_001', atkDisadvantageSkillId: 'ts_810', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_018', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_albrecht_bear: { generalId: 'gen_albrecht_bear', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_cassander: { generalId: 'gen_cassander', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_521', atkAdvantageSkillId: 'ts_322', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alexander_nef: { generalId: 'gen_alexander_nef', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkBalanceSkillId: 'ts_760', atkAdvantageSkillId: 'ts_325', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_034', defDisadvantageSkillId: 'ts_650', aptitude: 'create', attackStyle: 'attack' },
    gen_alfonso_ix: { generalId: 'gen_alfonso_ix', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alfonso_vi: { generalId: 'gen_alfonso_vi', tier: 'famous', strategicSkillId: 'str_22', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_526', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_392', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_algirdas: { generalId: 'gen_algirdas', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    gen_andrea_doria: { generalId: 'gen_andrea_doria', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_530', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_655', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_andrey_bogolyub: { generalId: 'gen_andrey_bogolyub', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_767', atkAdvantageSkillId: 'ts_354', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ansgar: { generalId: 'gen_ansgar', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },
    gen_zwingli: { generalId: 'gen_zwingli', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_542', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_arpad: { generalId: 'gen_arpad', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_768', atkAdvantageSkillId: 'ts_362', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_118', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_barbarossa: { generalId: 'gen_barbarossa', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_560', atkAdvantageSkillId: 'ts_372', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },
    gen_black_prince: { generalId: 'gen_black_prince', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_098', aptitude: 'create', attackStyle: 'attack' },
    gen_bohdan_khmelnitsky: { generalId: 'gen_bohdan_khmelnitsky', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', defBalanceSkillId: 'ts_572', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_415', aptitude: 'create', attackStyle: 'attack' },
    gen_breslav: { generalId: 'gen_breslav', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_775', atkAdvantageSkillId: 'ts_399', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_casimir_great: { generalId: 'gen_casimir_great', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_casimir_iv: { generalId: 'gen_casimir_iv', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_584', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charlemagne: { generalId: 'gen_charlemagne', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', defBalanceSkillId: 'ts_780', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_712', aptitude: 'create', attackStyle: 'attack' },
    gen_charles_i_naples: { generalId: 'gen_charles_i_naples', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charles_ix: { generalId: 'gen_charles_ix', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_587', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_389', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charles_martel: { generalId: 'gen_charles_martel', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_179', aptitude: 'create', attackStyle: 'attack' },
    gen_onuist_i: { generalId: 'gen_onuist_i', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charles_vii: { generalId: 'gen_charles_vii', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_617', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_392', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    gen_robert_ii: { generalId: 'gen_robert_ii', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_domhnall: { generalId: 'gen_domhnall', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hamilcar: { generalId: 'gen_hamilcar', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_29', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alfred_great: { generalId: 'gen_alfred_great', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', atkBalanceSkillId: 'ts_764', atkAdvantageSkillId: 'ts_511', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_scipio: { generalId: 'gen_scipio', tier: 'famous', tacticalSkillId: 'ts_003', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_city_syracuse: { generalId: 'gen_city_syracuse', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    gen_olaf_skotkonung: { generalId: 'gen_olaf_skotkonung', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },
    gen_themistocles: { generalId: 'gen_themistocles', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_20', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },
    gen_civilis: { generalId: 'gen_civilis', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_628', atkAdvantageSkillId: 'ts_570', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_clovis_i: { generalId: 'gen_clovis_i', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_constantine_great: { generalId: 'gen_constantine_great', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_638', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_071', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dandolo: { generalId: 'gen_dandolo', tier: 'famous', strategicSkillId: 'str_22', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_daniel_galitsky: { generalId: 'gen_daniel_galitsky', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_641', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_daumantas: { generalId: 'gen_daumantas', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },
    gen_decebalus: { generalId: 'gen_decebalus', tier: 'famous', strategicSkillId: 'str_16', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_653', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_villaret: { generalId: 'gen_villaret', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dmitry_donskoy: { generalId: 'gen_dmitry_donskoy', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkBalanceSkillId: 'ts_659', atkAdvantageSkillId: 'ts_672', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' },
    gen_dmitry_suzdal: { generalId: 'gen_dmitry_suzdal', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dobo_istvan: { generalId: 'gen_dobo_istvan', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_704', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_630', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dragan: { generalId: 'gen_dragan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_718', atkAdvantageSkillId: 'ts_001', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dragut: { generalId: 'gen_dragut', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_el_cid: { generalId: 'gen_el_cid', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_719', atkAdvantageSkillId: 'ts_003', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_eleanor: { generalId: 'gen_eleanor', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_epaminondas: { generalId: 'gen_epaminondas', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkBalanceSkillId: 'ts_736', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },
    gen_eric_bloodaxe: { generalId: 'gen_eric_bloodaxe', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    gen_fernando_iii: { generalId: 'gen_fernando_iii', tier: 'famous', strategicSkillId: 'str_22', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_742', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage', attackStyle: 'attack' },
    gen_frederic_ii: { generalId: 'gen_frederic_ii', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_758', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    gen_frederick_i_nuremberg: { generalId: 'gen_frederick_i_nuremberg', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_794', atkAdvantageSkillId: 'ts_033', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gastold: { generalId: 'gen_gastold', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_795', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gediminas: { generalId: 'gen_gediminas', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_809', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gero_margrave: { generalId: 'gen_gero_margrave', tier: 'ordinary', tacticalSkillId: 'ts_001', atkBalanceSkillId: 'ts_951', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gilles_de_rais: { generalId: 'gen_gilles_de_rais', tier: 'ordinary', tacticalSkillId: 'ts_001', defBalanceSkillId: 'ts_682', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_357', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_haci_giray: { generalId: 'gen_haci_giray', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hammad: { generalId: 'gen_hammad', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hannibal: { generalId: 'gen_hannibal', tier: 'famous', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_730', strategicSkillId: 'str_01', aptitude: 'create', attackStyle: 'attack' },
    gen_henry_borwin: { generalId: 'gen_henry_borwin', tier: 'ordinary', tacticalSkillId: 'ts_003', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ulrich_augsburg: { generalId: 'gen_ulrich_augsburg', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'defense' },
    gen_henry_navigator: { generalId: 'gen_henry_navigator', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_idris_i: { generalId: 'gen_idris_i', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_james_i_aragon: { generalId: 'gen_james_i_aragon', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_jan_zizka: { generalId: 'gen_jan_zizka', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },
    gen_jogaila: { generalId: 'gen_jogaila', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    gen_julian_apostate: { generalId: 'gen_julian_apostate', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_542', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_krum: { generalId: 'gen_krum', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_572', defDisadvantageSkillId: 'ts_017', aptitude: 'create', attackStyle: 'attack' },
    gen_leonidas: { generalId: 'gen_leonidas', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_587', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },
    gen_lorenzo_medici: { generalId: 'gen_lorenzo_medici', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_617', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ludwig_iv: { generalId: 'gen_ludwig_iv', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_638', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_magas: { generalId: 'gen_magas', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_641', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_maximilian: { generalId: 'gen_maximilian', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_653', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_mikhail_tver: { generalId: 'gen_mikhail_tver', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_704', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_nikephoros_phokas: { generalId: 'gen_nikephoros_phokas', tier: 'famous', tacticalSkillId: 'ts_015', strategicSkillId: 'str_22', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'attack' },
    gen_mojmir_i: { generalId: 'gen_mojmir_i', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_018', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },
    gen_mstislav: { generalId: 'gen_mstislav', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_020', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    gen_muhammad_i: { generalId: 'gen_muhammad_i', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_034', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage', attackStyle: 'attack' },
    gen_offa_mercia: { generalId: 'gen_offa_mercia', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_035', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    gen_otto_great: { generalId: 'gen_otto_great', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_037', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_376', aptitude: 'create', attackStyle: 'attack' },
    gen_prettenberg: { generalId: 'gen_prettenberg', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_raymond_iv: { generalId: 'gen_raymond_iv', tier: 'famous', strategicSkillId: 'str_22', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_069', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_raymond_v: { generalId: 'gen_raymond_v', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_072', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_roger_i: { generalId: 'gen_roger_i', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_109', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    gen_romshlav: { generalId: 'gen_romshlav', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_118', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },
    gen_sergey_belgorod: { generalId: 'gen_sergey_belgorod', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_143', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },
    gen_sforza: { generalId: 'gen_sforza', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_167', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_simeon_great: { generalId: 'gen_simeon_great', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'attack' },
    gen_stefan_dusan: { generalId: 'gen_stefan_dusan', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_204', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_707', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_stephen_great: { generalId: 'gen_stephen_great', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_205', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_418', aptitude: 'create', attackStyle: 'attack' },
    gen_stortebeker: { generalId: 'gen_stortebeker', tier: 'ordinary', tacticalSkillId: 'ts_003', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_275', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_sverre_norway: { generalId: 'gen_sverre_norway', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_332', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage', attackStyle: 'attack' },
    gen_swatopluk: { generalId: 'gen_swatopluk', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    gen_tashfin: { generalId: 'gen_tashfin', tier: 'famous', strategicSkillId: 'str_12', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    gen_tassilo_iii: { generalId: 'gen_tassilo_iii', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_cangrande: { generalId: 'gen_cangrande', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_theodoric_great: { generalId: 'gen_theodoric_great', tier: 'famous', strategicSkillId: 'str_01', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_521', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },
    gen_tvrtko: { generalId: 'gen_tvrtko', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_560', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ugolino: { generalId: 'gen_ugolino', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_584', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ulrich_jungingen: { generalId: 'gen_ulrich_jungingen', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_628', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_uqba: { generalId: 'gen_uqba', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_659', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    gen_william_wallace: { generalId: 'gen_william_wallace', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_718', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vlad_impaler: { generalId: 'gen_vlad_impaler', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_719', atkDisadvantageSkillId: 'ts_727', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vladimir_monomakh: { generalId: 'gen_vladimir_monomakh', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_736', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_822', aptitude: 'create', attackStyle: 'attack' },
    gen_vyacheslav_tartu: { generalId: 'gen_vyacheslav_tartu', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_742', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vyshnevetsky: { generalId: 'gen_vyshnevetsky', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_794', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vytautas_great: { generalId: 'gen_vytautas_great', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_795', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_320', aptitude: 'create', attackStyle: 'attack' },
    gen_wifred_hairy: { generalId: 'gen_wifred_hairy', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_809', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_willem_juliette: { generalId: 'gen_willem_juliette', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_951', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_william_silent: { generalId: 'gen_william_silent', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yaghmurasen: { generalId: 'gen_yaghmurasen', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_145', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yaroslav: { generalId: 'gen_yaroslav', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_197', defDisadvantageSkillId: 'ts_650', aptitude: 'create', attackStyle: 'attack' },
    gen_mehmed_giray: { generalId: 'gen_mehmed_giray', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_273', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yuri_ryazan: { generalId: 'gen_yuri_ryazan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_zhytomyr: { generalId: 'gen_zhytomyr', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_361', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_aspurgus: { generalId: 'gen_aspurgus', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_526', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_basarab_i: { generalId: 'gen_basarab_i', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', atkBalanceSkillId: 'ts_769', atkAdvantageSkillId: 'ts_354', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_530', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_koshamain: { generalId: 'gen_koshamain', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_001', defAdvantageSkillId: 'ts_071', atkBalanceSkillId: 'ts_014', defBalanceSkillId: 'ts_045', atkDisadvantageSkillId: 'ts_361', defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },
    gen_julius_caesar: { generalId: 'gen_julius_caesar', tier: 'famous', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', defAdvantageSkillId: 'ts_077', atkBalanceSkillId: 'ts_018', defBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_513', defDisadvantageSkillId: 'ts_161', strategicSkillId: 'str_01', aptitude: 'create', attackStyle: 'attack' },
    gen_batu: { generalId: 'gen_batu', tier: 'famous', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_158', defAdvantageSkillId: 'ts_357', atkBalanceSkillId: 'ts_069', defBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_580', defDisadvantageSkillId: 'ts_376', strategicSkillId: 'str_01', aptitude: 'create', attackStyle: 'attack' },
    gen_ulugh_muhammad: { generalId: 'gen_ulugh_muhammad', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_185', defAdvantageSkillId: 'ts_630', atkBalanceSkillId: 'ts_072', defBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_635', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vladimir_great: { generalId: 'gen_vladimir_great', tier: 'famous', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_201', defAdvantageSkillId: 'ts_655', atkBalanceSkillId: 'ts_145', defBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defDisadvantageSkillId: 'ts_098', strategicSkillId: 'str_01', aptitude: 'create', attackStyle: 'attack' },
    gen_astrakhan_khan: { generalId: 'gen_astrakhan_khan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_208', defAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_299', defBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_688', defDisadvantageSkillId: 'ts_161', aptitude: 'leverage', attackStyle: 'attack' },
    gen_onas_khan: { generalId: 'gen_onas_khan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_242', defAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_332', defBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_689', defDisadvantageSkillId: 'ts_376', aptitude: 'leverage', attackStyle: 'attack' },
    gen_karasakal: { generalId: 'gen_karasakal', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_282', defAdvantageSkillId: 'ts_071', atkBalanceSkillId: 'ts_628', defBalanceSkillId: 'ts_433', atkDisadvantageSkillId: 'ts_711', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
};



export function getGeneralProfile(generalId: string | undefined): GeneralProfile | null {

    if (!generalId) return null;

    return GENERAL_PROFILES[generalId] ?? null;

}



// @ts-ignore

if (import.meta.hot) {

    // @ts-ignore

    import.meta.hot.accept((newModule: any) => {

        if (!newModule?.GENERAL_PROFILES) return;

        const target = GENERAL_PROFILES as Record<string, any>;

        for (const key of Object.keys(target)) delete target[key];

        Object.assign(target, newModule.GENERAL_PROFILES);

        console.log(`[HMR] GeneralSkills → ${Object.keys(newModule.GENERAL_PROFILES).length} 条武将技已热更新`);

    });

}
