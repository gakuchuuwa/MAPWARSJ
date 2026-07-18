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



    leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_558', balanceSkillId: 'ts_559', disadvantageSkillId: 'ts_560', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_559', defDisadvantageSkillId: 'ts_016', strategicSkillId: 'str_12', aptitude: 'reverse', attackStyle: 'attack' },



    agui: { generalId: 'agui', tier: 'ordinary', tacticalSkillId: 'ts_714', advantageSkillId: 'ts_392', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_714', atkBalanceSkillId: 'ts_291', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_591', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_591', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_121', atkBalanceSkillId: 'ts_592', atkDisadvantageSkillId: 'ts_593', defAdvantageSkillId: 'ts_283', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



        tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_434', strategicSkillId: 'str_06', advantageSkillId: 'ts_434', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_435', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_698', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_204', aptitude: 'create' , attackStyle: 'attack'},



    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_766', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'balanced'},



        ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_573', strategicSkillId: 'str_21', advantageSkillId: 'ts_573', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_280', atkBalanceSkillId: 'ts_747', atkDisadvantageSkillId: 'ts_575', defAdvantageSkillId: 'ts_573', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_411', aptitude: 'create' , attackStyle: 'attack'},



    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_683', defDisadvantageSkillId: 'ts_262', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_404', aptitude: 'leverage' , attackStyle: 'attack'},



    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_742', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage' , attackStyle: 'attack'},



    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_168', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_168', atkBalanceSkillId: 'ts_492', atkDisadvantageSkillId: 'ts_187', defDisadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_082', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_394', aptitude: 'reverse' , attackStyle: 'attack'},



    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_169', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_356', defDisadvantageSkillId: 'ts_169', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_407', aptitude: 'reverse' , attackStyle: 'defense'},



    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_274', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    pagan_anulvtuo: { generalId: 'pagan_anulvtuo', tier: 'famous', tacticalSkillId: 'ts_307', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_167', strategicSkillId: 'str_05', atkAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_711', atkDisadvantageSkillId: 'ts_320', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_718', defAdvantageSkillId: 'ts_398', aptitude: 'reverse' , attackStyle: 'defense'},



    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse' , attackStyle: 'defense'},



        tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_615', strategicSkillId: 'str_26', advantageSkillId: 'ts_615', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_617', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



        menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_07', advantageSkillId: 'ts_059', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_443', atkAdvantageSkillId: 'ts_059', defAdvantageSkillId: 'ts_102', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_794', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



        bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_472', strategicSkillId: 'str_06', advantageSkillId: 'ts_472', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_473', atkBalanceSkillId: 'ts_472', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'attack'},



    goryeo_jianghanzan: { generalId: 'goryeo_jianghanzan', tier: 'famous', tacticalSkillId: 'ts_382', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_382', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'defense'},



    ashikaga_zulizunshi: { generalId: 'ashikaga_zulizunshi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_403', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage', attackStyle: 'attack' },



        tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_680', strategicSkillId: 'str_07', advantageSkillId: 'ts_680', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_681', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_681', defAdvantageSkillId: 'ts_680', atkDisadvantageSkillId: 'ts_143', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_612', strategicSkillId: 'str_12', advantageSkillId: 'ts_612', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_613', atkAdvantageSkillId: 'ts_612', atkBalanceSkillId: 'ts_613', atkDisadvantageSkillId: 'ts_614', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



        shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'ts_777', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_587', aptitude: 'create' , attackStyle: 'attack'},



    bing_liji: { generalId: 'bing_liji', tier: 'famous', tacticalSkillId: 'ts_208', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_393', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



    min_wangshenzhi: { generalId: 'min_wangshenzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_636', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    quanzhou_liucongxiao: { generalId: 'quanzhou_liucongxiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_187', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_337', atkDisadvantageSkillId: 'ts_720', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'reverse' , attackStyle: 'attack'},



        wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'ts_428', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_429', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_204', aptitude: 'create' , attackStyle: 'attack'},



        manzhou_d_duoergun: { generalId: 'manzhou_d_duoergun', tier: 'famous', tacticalSkillId: 'ts_446', strategicSkillId: 'str_24', advantageSkillId: 'ts_446', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_447', atkAdvantageSkillId: 'ts_067', atkDisadvantageSkillId: 'ts_447', defBalanceSkillId: 'ts_446', atkBalanceSkillId: 'ts_404', defAdvantageSkillId: 'ts_389', defDisadvantageSkillId: 'ts_011', aptitude: 'create' , attackStyle: 'attack'},



    xinluo_jinyuxin: { generalId: 'xinluo_jinyuxin', tier: 'famous', tacticalSkillId: 'ts_330', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    edo_dechuanjiakang: { generalId: 'edo_dechuanjiakang', tier: 'famous', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_005', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_508', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_190', strategicSkillId: 'str_24', aptitude: 'leverage', attackStyle: 'attack' },



        seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_13', advantageSkillId: 'ts_128', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_601', atkAdvantageSkillId: 'ts_128', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_275', aptitude: 'create' , attackStyle: 'attack'},



        chenla_duyebamo: { generalId: 'chenla_duyebamo', tier: 'famous', tacticalSkillId: 'ts_483', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_483', disadvantageSkillId: 'ts_484', atkAdvantageSkillId: 'ts_129', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_742', aptitude: 'create' , attackStyle: 'attack'},



    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_170', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_473', defAdvantageSkillId: 'ts_170', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage' , attackStyle: 'defense'},



    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_171', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_156', atkBalanceSkillId: 'ts_171', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_281', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_281', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_034', strategicSkillId: 'str_28', aptitude: 'leverage', attackStyle: 'attack' },



    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'ordinary', tacticalSkillId: 'ts_289', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage', attackStyle: 'defense' },



    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_352', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_526', strategicSkillId: 'str_27', aptitude: 'create', attackStyle: 'attack' },



        owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_114', strategicSkillId: 'str_17', advantageSkillId: 'ts_114', balanceSkillId: 'ts_580', disadvantageSkillId: 'ts_581', atkBalanceSkillId: 'ts_114', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    totomi_jiujingzhongci: { generalId: 'totomi_jiujingzhongci', tier: 'famous', tacticalSkillId: 'ts_363', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_653', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_769', aptitude: 'leverage' , attackStyle: 'attack'},



        aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_468', strategicSkillId: 'str_16', advantageSkillId: 'ts_011', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_470', atkBalanceSkillId: 'ts_469', atkDisadvantageSkillId: 'ts_470', defBalanceSkillId: 'ts_468', atkAdvantageSkillId: 'ts_400', defAdvantageSkillId: 'ts_389', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'balanced'},



    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_143', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'attack'},



    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_706', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_706', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_565', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    kaga_d_xiajianlailian: { generalId: 'kaga_d_xiajianlailian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_780', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'defense'},



    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'famous', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_778', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_778', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_037', strategicSkillId: 'str_16', aptitude: 'leverage', attackStyle: 'attack' },



    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_686', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'defense'},



    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_345', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



            aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_470', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_470', atkBalanceSkillId: 'ts_046', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    shimotsuke_yudougongguanggang: { generalId: 'shimotsuke_yudougongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'famous', tacticalSkillId: 'ts_381', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_443', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_439', atkAdvantageSkillId: 'ts_399', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_012', aptitude: 'leverage' , attackStyle: 'attack'},



    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'defense'},



    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_162', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_416', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_731', atkAdvantageSkillId: 'ts_748', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_742', aptitude: 'reverse', attackStyle: 'attack' },



    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    lelang_wangqi: { generalId: 'lelang_wangqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_342', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



    anmei_yuwandaqin: { generalId: 'anmei_yuwandaqin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_016', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_775', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse', attackStyle: 'defense' },



    chen3_jizhun: { generalId: 'chen3_jizhun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_395', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_542', aptitude: 'reverse' , attackStyle: 'defense'},



        joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_543', strategicSkillId: 'str_06', advantageSkillId: 'ts_543', balanceSkillId: 'ts_544', disadvantageSkillId: 'ts_545', atkBalanceSkillId: 'ts_544', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_173', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_152', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    baiji_jiebo: { generalId: 'baiji_jiebo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_020', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse', attackStyle: 'defense' },



    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_340', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_530', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_405', aptitude: 'leverage' , attackStyle: 'defense'},



    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_398', advantageSkillId: 'ts_438', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_439', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_060', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_118', strategicSkillId: 'str_22', aptitude: 'leverage', attackStyle: 'balanced' },



    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'ts_097', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_097', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'attack'},



            gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'ts_780', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_780', atkDisadvantageSkillId: 'ts_794', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    naju_d_wangjian_wangye: { generalId: 'naju_d_wangjian_wangye', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_099', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_391', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},



    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_100', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},



    huimo_gaoyanshou: { generalId: 'huimo_gaoyanshou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_274', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    aola_menglielun: { generalId: 'aola_menglielun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_027', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_013', aptitude: 'reverse', attackStyle: 'defense' },



    ewenki_gentemuer: { generalId: 'ewenki_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_361', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'attack'},



    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_366', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_542', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', aptitude: 'leverage' , attackStyle: 'attack'},



    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'defense'},



    guishuang_qiujiuque: { generalId: 'guishuang_qiujiuque', tier: 'famous', tacticalSkillId: 'ts_361', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_300', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_190', aptitude: 'create' , attackStyle: 'attack'},



    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_478', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_742', aptitude: 'reverse' , attackStyle: 'defense'},



    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_705', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



        manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_570', strategicSkillId: 'str_07', advantageSkillId: 'ts_570', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_571', atkAdvantageSkillId: 'ts_058', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_636', strategicSkillId: 'str_07', advantageSkillId: 'ts_636', balanceSkillId: 'ts_637', disadvantageSkillId: 'ts_638', atkAdvantageSkillId: 'ts_423', atkBalanceSkillId: 'ts_637', defAdvantageSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_034', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_587', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_407', aptitude: 'leverage' , attackStyle: 'defense'},



        dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_444', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_444', atkAdvantageSkillId: 'ts_057', atkDisadvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



        yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_131', strategicSkillId: 'str_01', advantageSkillId: 'ts_131', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_667', atkBalanceSkillId: 'ts_667', atkDisadvantageSkillId: 'ts_668', atkAdvantageSkillId: 'ts_400', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'attack'},



        aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_465', strategicSkillId: 'str_06', advantageSkillId: 'ts_465', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_466', atkAdvantageSkillId: 'ts_465', atkBalanceSkillId: 'ts_330', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_401', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    xianbei_tuobamao: { generalId: 'xianbei_tuobamao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'defense'},



    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_572', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_757', aptitude: 'leverage' , attackStyle: 'attack'},



    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



        dada_ming_dayanhan: { generalId: 'dada_ming_dayanhan', tier: 'famous', tacticalSkillId: 'ts_489', strategicSkillId: 'str_25', advantageSkillId: 'ts_489', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_490', atkAdvantageSkillId: 'ts_132', defAdvantageSkillId: 'ts_489', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_411', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_234', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_769', aptitude: 'leverage' , attackStyle: 'defense'},



    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'famous', tacticalSkillId: 'ts_333', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_333', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_014', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_403', aptitude: 'reverse' , attackStyle: 'defense'},



    heisha_d_houlihu: { generalId: 'heisha_d_houlihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_318', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    hezhe_shaerhuda: { generalId: 'hezhe_shaerhuda', tier: 'famous', tacticalSkillId: 'ts_365', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    dawoer_baerdaqi: { generalId: 'dawoer_baerdaqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_014', aptitude: 'leverage' , attackStyle: 'defense'},



    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_360', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_143', aptitude: 'reverse' , attackStyle: 'defense'},



    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_014', aptitude: 'reverse' , attackStyle: 'defense'},



    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_735', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'defense'},



    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_205', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_384', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    kuye_kuye_qichayi: { generalId: 'kuye_kuye_qichayi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_551', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_542', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', aptitude: 'create' , attackStyle: 'attack'},



    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_587', aptitude: 'reverse' , attackStyle: 'defense'},



    maomingan_suoetu: { generalId: 'maomingan_suoetu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'balanced'},



    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_287', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    eluoke_amuhaer: { generalId: 'eluoke_amuhaer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_173', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    nifuhe_baerhudai: { generalId: 'nifuhe_baerhudai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' , attackStyle: 'defense'},



    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_182', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    woju_yinguan: { generalId: 'woju_yinguan', tier: 'famous', tacticalSkillId: 'ts_095', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    luzhou_zhangwenxiu: { generalId: 'luzhou_zhangwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



        jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_546', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_546', disadvantageSkillId: 'ts_547', atkAdvantageSkillId: 'ts_358', atkDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_076', atkBalanceSkillId: 'ts_218', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    wuzhou_limu: { generalId: 'wuzhou_limu', tier: 'famous', tacticalSkillId: 'ts_160', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_241', atkBalanceSkillId: 'ts_137', defAdvantageSkillId: 'ts_130', defDisadvantageSkillId: 'ts_682', atkDisadvantageSkillId: 'ts_020', defBalanceSkillId: 'ts_405', aptitude: 'leverage' , attackStyle: 'balanced'},



    ashina_ashinayandou: { generalId: 'ashina_ashinayandou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_118', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_384', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_415', aptitude: 'create', attackStyle: 'attack' },



        wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_624', strategicSkillId: 'str_23', advantageSkillId: 'ts_624', balanceSkillId: 'ts_601', disadvantageSkillId: 'ts_626', atkDisadvantageSkillId: 'ts_626', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



        yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'ts_678', strategicSkillId: 'str_17', advantageSkillId: 'ts_678', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_679', atkAdvantageSkillId: 'ts_678', atkBalanceSkillId: 'ts_081', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    chenli_d_wutang: { generalId: 'chenli_d_wutang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_109', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'defense'},



    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'defense'},



        jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_534', strategicSkillId: 'str_01', advantageSkillId: 'ts_534', balanceSkillId: 'ts_535', disadvantageSkillId: 'ts_536', atkAdvantageSkillId: 'ts_534', atkBalanceSkillId: 'ts_535', atkDisadvantageSkillId: 'ts_536', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'attack'},



        liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_561', strategicSkillId: 'str_07', advantageSkillId: 'ts_561', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_563', atkAdvantageSkillId: 'ts_233', defAdvantageSkillId: 'ts_561', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_584', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



        yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_660', strategicSkillId: 'str_01', advantageSkillId: 'ts_660', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_084', atkBalanceSkillId: 'ts_661', defAdvantageSkillId: 'ts_119', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_494', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_760', aptitude: 'reverse' , attackStyle: 'defense'},



    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage' , attackStyle: 'attack'},



    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_418', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        ogodei_chuoermahan: { generalId: 'ogodei_chuoermahan', tier: 'famous', tacticalSkillId: 'ts_576', strategicSkillId: 'str_13', advantageSkillId: 'ts_576', balanceSkillId: 'ts_475', disadvantageSkillId: 'ts_578', atkAdvantageSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_578', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    merkit_boyan: { generalId: 'merkit_boyan', tier: 'famous', tacticalSkillId: 'ts_235', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_587', aptitude: 'create' , attackStyle: 'attack'},



        tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_621', strategicSkillId: 'str_24', advantageSkillId: 'ts_621', balanceSkillId: 'ts_622', disadvantageSkillId: 'ts_623', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_622', defAdvantageSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_014', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_776', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



        xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_001', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_644', atkDisadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_190', aptitude: 'create' , attackStyle: 'attack'},



        xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_648', strategicSkillId: 'str_07', advantageSkillId: 'ts_648', balanceSkillId: 'ts_650', disadvantageSkillId: 'ts_649', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_623', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_649', defDisadvantageSkillId: 'ts_118', aptitude: 'leverage' , attackStyle: 'attack'},



    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_236', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_507', defBalanceSkillId: 'ts_236', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_006', defDisadvantageSkillId: 'ts_275', aptitude: 'create' , attackStyle: 'attack'},



    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'defense'},



    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_246', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    mengwu_hebulehan: { generalId: 'mengwu_hebulehan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_601', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



        shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_082', strategicSkillId: 'str_01', advantageSkillId: 'ts_082', balanceSkillId: 'ts_607', disadvantageSkillId: 'ts_608', atkAdvantageSkillId: 'ts_606', atkBalanceSkillId: 'ts_607', atkDisadvantageSkillId: 'ts_608', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'attack'},



    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_244', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_244', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_414', aptitude: 'create' , attackStyle: 'attack'},



        huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'ts_528', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_528', disadvantageSkillId: 'ts_529', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_159', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_432', atkBalanceSkillId: 'ts_159', atkDisadvantageSkillId: 'ts_172', defBalanceSkillId: 'ts_762', defDisadvantageSkillId: 'ts_695', defAdvantageSkillId: 'ts_398', aptitude: 'leverage' , attackStyle: 'attack'},



    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_315', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'defense'},



    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    zhasaketu_zhasakesubadi: { generalId: 'zhasaketu_zhasakesubadi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'ts_229', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_417', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



        tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_618', strategicSkillId: 'str_07', advantageSkillId: 'ts_618', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_619', atkAdvantageSkillId: 'ts_618', atkDisadvantageSkillId: 'ts_620', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



        da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_486', strategicSkillId: 'str_07', advantageSkillId: 'ts_486', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_487', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'defense'},



    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_231', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_231', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_587', aptitude: 'create' , attackStyle: 'attack'},



    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_033', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'balanced'},



    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_218', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_704', aptitude: 'create', attackStyle: 'attack' },



    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_584', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_406', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    cheshihou_angui: { generalId: 'cheshihou_angui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    kaerka_abadaihan: { generalId: 'kaerka_abadaihan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    huyan_peicen: { generalId: 'huyan_peicen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_730', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_816', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'attack'},



    chahar_yantiemuer: { generalId: 'chahar_yantiemuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_227', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_412', aptitude: 'leverage', attackStyle: 'attack' },



    ongut_alawusi: { generalId: 'ongut_alawusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



        rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'ts_594', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_594', disadvantageSkillId: 'ts_595', atkBalanceSkillId: 'ts_595', atkDisadvantageSkillId: 'ts_596', atkAdvantageSkillId: 'ts_398', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_742', aptitude: 'create' , attackStyle: 'attack'},



            chagatai_genggong: { generalId: 'chagatai_genggong', tier: 'ordinary', tacticalSkillId: 'ts_802', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_802', atkAdvantageSkillId: 'ts_713', atkBalanceSkillId: 'ts_783', atkDisadvantageSkillId: 'ts_368', defAdvantageSkillId: 'ts_135', defBalanceSkillId: 'ts_386', defDisadvantageSkillId: 'ts_100', aptitude: 'reverse' , attackStyle: 'defense'},



    huihu_dunmohedagan: { generalId: 'huihu_dunmohedagan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_069', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage' , attackStyle: 'attack'},



    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_810', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    pugu_ashinaguduolu: { generalId: 'pugu_ashinaguduolu', tier: 'famous', tacticalSkillId: 'ts_238', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_239', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



    xibo_d_tubote: { generalId: 'xibo_d_tubote', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



        borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_474', strategicSkillId: 'str_07', advantageSkillId: 'ts_012', balanceSkillId: 'ts_474', disadvantageSkillId: 'ts_476', atkAdvantageSkillId: 'ts_153', atkDisadvantageSkillId: 'ts_476', defAdvantageSkillId: 'ts_080', atkBalanceSkillId: 'ts_484', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'ts_247', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_247', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse' , attackStyle: 'defense'},



    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage', attackStyle: 'defense' },



    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage', attackStyle: 'attack' },



    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    baidi_baidizi: { generalId: 'baidi_baidizi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_204', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse', attackStyle: 'attack' },



    shiwei_saihou: { generalId: 'shiwei_saihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'defense'},



    sunite_sousai: { generalId: 'sunite_sousai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



            bulat_beiduanchaer: { generalId: 'bulat_beiduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_781', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_781', atkDisadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_118', aptitude: 'create' , attackStyle: 'attack'},



    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    hepan_gaoxianzhi: { generalId: 'hepan_gaoxianzhi', tier: 'famous', tacticalSkillId: 'ts_283', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_688', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    kepantuo_dulimi: { generalId: 'kepantuo_dulimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_299', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_775', aptitude: 'leverage' , attackStyle: 'balanced'},



    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_727', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    tuoming_tuomin: { generalId: 'tuoming_tuomin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_018', aptitude: 'leverage' , attackStyle: 'attack'},



    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_631', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_763', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_190', aptitude: 'create' , attackStyle: 'attack'},



    pisha_weichisheng: { generalId: 'pisha_weichisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'famous', tacticalSkillId: 'ts_366', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_742', aptitude: 'create' , attackStyle: 'attack'},



    yangguan_lihao: { generalId: 'yangguan_lihao', tier: 'ordinary', tacticalSkillId: 'ts_352', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },



    wulianghai_chelingwubashen: { generalId: 'wulianghai_chelingwubashen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'defense'},



            shache_xian_suoche_shachexian: { generalId: 'shache_xian_suoche_shachexian', tier: 'ordinary', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_782', defBalanceSkillId: 'ts_782', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    shule_aersilan: { generalId: 'shule_aersilan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'attack'},



        dzungar_galedanceling: { generalId: 'dzungar_galedanceling', tier: 'famous', tacticalSkillId: 'ts_504', strategicSkillId: 'str_13', advantageSkillId: 'ts_504', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_505', atkBalanceSkillId: 'ts_505', atkDisadvantageSkillId: 'ts_506', atkAdvantageSkillId: 'ts_400', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'balanced'},



    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_296', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_542', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_631', aptitude: 'reverse', attackStyle: 'defense' },



    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'defense'},



    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_748', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_759', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_197', aptitude: 'reverse' , attackStyle: 'defense'},



    yarkand_abudulatifu: { generalId: 'yarkand_abudulatifu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'balanced'},



    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'defense'},



    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    kala_satuke: { generalId: 'kala_satuke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_168', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_043', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_409', aptitude: 'leverage' , attackStyle: 'attack'},



    an_xibanni: { generalId: 'an_xibanni', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_403', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },



    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_302', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'famous', tacticalSkillId: 'ts_313', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_313', atkAdvantageSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_312', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_312', atkAdvantageSkillId: 'ts_399', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



        xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_645', strategicSkillId: 'str_13', advantageSkillId: 'ts_645', balanceSkillId: 'ts_646', disadvantageSkillId: 'ts_647', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_020', aptitude: 'create' , attackStyle: 'attack'},



    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_354', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_647', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_014', strategicSkillId: 'str_13', aptitude: 'create', attackStyle: 'attack' },



    xijue_ganyanshou: { generalId: 'xijue_ganyanshou', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_125', aptitude: 'leverage', attackStyle: 'attack' },



        huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_525', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_525', disadvantageSkillId: 'ts_526', atkAdvantageSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_527', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_190', aptitude: 'create' , attackStyle: 'attack'},



        kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'ts_549', strategicSkillId: 'str_06', advantageSkillId: 'ts_549', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_551', atkAdvantageSkillId: 'ts_549', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_275', aptitude: 'create' , attackStyle: 'attack'},



    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'defense'},



    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_319', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'attack'},



    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_006', atkAdvantageSkillId: 'ts_029', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_020', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_526', aptitude: 'reverse', attackStyle: 'defense' },



    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'defense'},



    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_542', aptitude: 'reverse' , attackStyle: 'defense'},



    mamon_mameng: { generalId: 'mamon_mameng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_532', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    khoja_apakehezhuo: { generalId: 'khoja_apakehezhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_332', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'balanced'},



            fanyanna_xieer: { generalId: 'fanyanna_xieer', tier: 'ordinary', tacticalSkillId: 'ts_783', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_783', atkDisadvantageSkillId: 'ts_415', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'defense'},



    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_199', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_037', aptitude: 'reverse' , attackStyle: 'attack'},



    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'defense'},



    qiepantuo_luozhentan: { generalId: 'qiepantuo_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse' , attackStyle: 'defense'},



    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_160', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_409', aptitude: 'reverse' , attackStyle: 'defense'},



    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_161', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_543', atkDisadvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_309', defAdvantageSkillId: 'ts_006', defDisadvantageSkillId: 'ts_411', aptitude: 'reverse' , attackStyle: 'balanced'},



    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_029', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_277', defAdvantageSkillId: 'ts_715', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_412', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_415', aptitude: 'reverse' , attackStyle: 'defense'},



    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_284', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_284', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_775', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    heyuan_d_heichichangzhi: { generalId: 'heyuan_d_heichichangzhi', tier: 'famous', tacticalSkillId: 'ts_300', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_433', atkAdvantageSkillId: 'ts_010', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_285', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_131', atkBalanceSkillId: 'ts_297', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



        gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'ts_519', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_519', disadvantageSkillId: 'ts_520', atkBalanceSkillId: 'ts_520', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_026', aptitude: 'create' , attackStyle: 'attack'},



    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_278', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_317', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage' , attackStyle: 'balanced'},



    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'ts_368', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'defense'},



        gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_513', strategicSkillId: 'str_12', advantageSkillId: 'ts_513', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_514', atkBalanceSkillId: 'ts_514', atkDisadvantageSkillId: 'ts_515', atkAdvantageSkillId: 'ts_154', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'balanced'},



    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_014', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_306', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'balanced'},



    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_317', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_017', aptitude: 'create' , attackStyle: 'balanced'},



    xiutu_jinridi: { generalId: 'xiutu_jinridi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'balanced'},



            gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_784', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_784', atkBalanceSkillId: 'ts_066', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'defense'},



    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_371', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_538', atkAdvantageSkillId: 'ts_390', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    guangwu_xinwuxian: { generalId: 'guangwu_xinwuxian', tier: 'famous', tacticalSkillId: 'ts_377', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_286', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'attack'},



    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'ts_349', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_641', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_743', aptitude: 'reverse' , attackStyle: 'defense'},



    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_029', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse', attackStyle: 'defense' },



    humi_zhentan: { generalId: 'humi_zhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_554', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_760', aptitude: 'reverse' , attackStyle: 'defense'},



    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_655', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_143', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_526', aptitude: 'reverse' , attackStyle: 'defense'},



    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'balanced'},



    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_043', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_542', aptitude: 'create', attackStyle: 'attack' },



    gaoliang_geshuhan: { generalId: 'gaoliang_geshuhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_341', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_401', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_572', aptitude: 'reverse' , attackStyle: 'attack'},



    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage', attackStyle: 'balanced' },



            jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_785', defDisadvantageSkillId: 'ts_617', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_033', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_404', aptitude: 'leverage' , attackStyle: 'balanced'},



    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_357', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'balanced'},



    gongtang_gongtangcang: { generalId: 'gongtang_gongtangcang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'balanced'},



    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'famous', tacticalSkillId: 'ts_334', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'famous', tacticalSkillId: 'ts_318', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},





    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_738', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'defense'},



    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_809', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_760', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse', attackStyle: 'attack' },



    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    dali_duansiping: { generalId: 'dali_duansiping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_304', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_273', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', aptitude: 'create' , attackStyle: 'attack'},



    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_816', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



        konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_001', balanceSkillId: 'ts_556', disadvantageSkillId: 'ts_557', atkBalanceSkillId: 'ts_556', atkDisadvantageSkillId: 'ts_557', atkAdvantageSkillId: 'ts_401', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_522', strategicSkillId: 'str_12', advantageSkillId: 'ts_522', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_523', atkAdvantageSkillId: 'ts_142', atkDisadvantageSkillId: 'ts_524', defAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_484', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_268', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_268', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'balanced'},



    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'defense'},



    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_179', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_406', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_037', aptitude: 'leverage' , attackStyle: 'defense'},



    taiyuan_menglai: { generalId: 'taiyuan_menglai', tier: 'famous', tacticalSkillId: 'ts_314', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    suke_langanheng: { generalId: 'suke_langanheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'ts_303', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_758', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_743', aptitude: 'reverse' , attackStyle: 'attack'},



    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_020', aptitude: 'leverage' , attackStyle: 'defense'},



            baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_786', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_786', atkDisadvantageSkillId: 'ts_409', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



            champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_407', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_190', aptitude: 'reverse' , attackStyle: 'attack'},



    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_381', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'attack'},



    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_580', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_707', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_077', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'defense'},



    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_786', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_787', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_404', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse', attackStyle: 'defense' },



    leizhou_limao: { generalId: 'leizhou_limao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_628', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_406', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_526', aptitude: 'reverse' , attackStyle: 'defense'},



    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_768', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_197', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizhen_qudaren: { generalId: 'shuizhen_qudaren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_816', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'balanced'},



    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse', attackStyle: 'defense' },



    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_408', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_197', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_641', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_631', aptitude: 'leverage' , attackStyle: 'attack'},



    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_460', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_161', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_409', aptitude: 'leverage' , attackStyle: 'attack'},



    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_287', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_347', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'balanced'},



    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_332', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_323', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_289', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_303', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'defense'},



    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'defense'},



    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_012', strategicSkillId: 'str_01', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_138', atkDisadvantageSkillId: 'ts_012', defDisadvantageSkillId: 'ts_426', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_294', aptitude: 'reverse' , attackStyle: 'attack'},



    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_630', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_742', aptitude: 'reverse', attackStyle: 'attack' },



    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_260', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_815', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_795', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'attack'},



    paiyao_huangguasi: { generalId: 'paiyao_huangguasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    yingzhou_liuyan: { generalId: 'yingzhou_liuyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_348', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_712', atkAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_406', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_483', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'balanced'},



    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'famous', tacticalSkillId: 'ts_337', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



        taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_683', strategicSkillId: 'str_20', advantageSkillId: 'ts_683', balanceSkillId: 'ts_684', disadvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_075', atkDisadvantageSkillId: 'ts_685', defBalanceSkillId: 'ts_684', atkAdvantageSkillId: 'ts_040', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'balanced'},



    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    li_lx_d_liguang: { generalId: 'li_lx_d_liguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_377', defDisadvantageSkillId: 'ts_777', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_043', aptitude: 'leverage' , attackStyle: 'defense'},



    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_002', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_178', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_484', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



        dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_440', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_440', disadvantageSkillId: 'ts_441', defDisadvantageSkillId: 'ts_061', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', aptitude: 'leverage' , attackStyle: 'defense'},



    shengmiao_baoli: { generalId: 'shengmiao_baoli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'defense'},



        guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_516', strategicSkillId: 'str_01', advantageSkillId: 'ts_516', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_517', atkAdvantageSkillId: 'ts_079', atkBalanceSkillId: 'ts_517', atkDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_516', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_054', aptitude: 'leverage' , attackStyle: 'attack'},



    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_822', aptitude: 'reverse' , attackStyle: 'defense'},



    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage' , attackStyle: 'attack'},



            xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_788', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_788', atkDisadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_020', aptitude: 'leverage' , attackStyle: 'balanced'},



    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    shixing_houandou: { generalId: 'shixing_houandou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'attack'},



    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse', attackStyle: 'attack' },



    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_572', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_043', aptitude: 'leverage' , attackStyle: 'defense'},



    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_143', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_413', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse' , attackStyle: 'attack'},



    zuo_d_wufu: { generalId: 'zuo_d_wufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'attack'},



    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_633', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'balanced'},



    wumeng_azi: { generalId: 'wumeng_azi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_035', aptitude: 'reverse' , attackStyle: 'defense'},



    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_271', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_271', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_396', aptitude: 'create' , attackStyle: 'balanced'},



    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'famous', tacticalSkillId: 'ts_273', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_197', aptitude: 'reverse' , attackStyle: 'defense'},



        zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_452', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_452', disadvantageSkillId: 'ts_453', atkBalanceSkillId: 'ts_452', atkDisadvantageSkillId: 'ts_126', atkAdvantageSkillId: 'ts_355', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_412', aptitude: 'leverage' , attackStyle: 'balanced'},



    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'defense'},



        daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'ts_495', strategicSkillId: 'str_07', advantageSkillId: 'ts_495', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_496', atkAdvantageSkillId: 'ts_495', atkBalanceSkillId: 'ts_496', atkDisadvantageSkillId: 'ts_497', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



        yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_801', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_765', atkBalanceSkillId: 'ts_186', atkDisadvantageSkillId: 'ts_801', defDisadvantageSkillId: 'ts_752', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_294', aptitude: 'leverage' , attackStyle: 'balanced'},



    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_257', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_193', defDisadvantageSkillId: 'ts_427', aptitude: 'create' , attackStyle: 'attack'},



    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_180', atkDisadvantageSkillId: 'ts_331', atkAdvantageSkillId: 'ts_400', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_394', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_192', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_191', atkBalanceSkillId: 'ts_091', atkDisadvantageSkillId: 'ts_700', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_416', aptitude: 'reverse' , attackStyle: 'defense'},



    fushi_wangmeng: { generalId: 'fushi_wangmeng', tier: 'famous', tacticalSkillId: 'ts_279', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_350', atkBalanceSkillId: 'ts_646', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



            ba_bamanzi: { generalId: 'ba_bamanzi', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_789', atkDisadvantageSkillId: 'ts_789', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_484', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



        hezhou_wangjian: { generalId: 'hezhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_450', strategicSkillId: 'str_05', advantageSkillId: 'ts_450', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_662', atkBalanceSkillId: 'ts_785', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_338', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_602', aptitude: 'reverse' , attackStyle: 'defense'},



            qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'ordinary', tacticalSkillId: 'ts_790', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_790', atkDisadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_020', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'defense'},



    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_265', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_450', defDisadvantageSkillId: 'ts_265', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_396', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_748', aptitude: 'create' , attackStyle: 'attack'},



    tan_d_qinhou: { generalId: 'tan_d_qinhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_060', aptitude: 'leverage' , attackStyle: 'attack'},



    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage' , attackStyle: 'attack'},



    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_812', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'balanced'},



            bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_791', atkDisadvantageSkillId: 'ts_791', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse' , attackStyle: 'attack'},



    she_shechongming: { generalId: 'she_shechongming', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'attack'},



    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_406', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_275', aptitude: 'reverse', attackStyle: 'attack' },



    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_734', atkBalanceSkillId: 'ts_754', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_253', defDisadvantageSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_118', aptitude: 'leverage' , attackStyle: 'attack'},



    chenzhou_d_zhanghao: { generalId: 'chenzhou_d_zhanghao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'attack'},



    xiqin_wanyanchenheshang: { generalId: 'xiqin_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_309', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_120', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'balanced'},



    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'balanced' },



    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', tacticalSkillId: 'ts_249', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_412', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'attack'},



    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_650', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_392', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_360', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_270', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_270', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse' , attackStyle: 'attack'},



    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'balanced'},



    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'ts_298', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_638', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_403', aptitude: 'create' , attackStyle: 'defense'},



    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_264', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defAdvantageSkillId: 'ts_264', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_795', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    wudu_dengai: { generalId: 'wudu_dengai', tier: 'famous', tacticalSkillId: 'ts_162', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_363', atkDisadvantageSkillId: 'ts_467', defBalanceSkillId: 'ts_692', defDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_028', aptitude: 'leverage' , attackStyle: 'attack'},



    baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_526', aptitude: 'create', attackStyle: 'attack' },



    dangzhou_qiangduan: { generalId: 'dangzhou_qiangduan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_757', atkAdvantageSkillId: 'ts_352', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'defense'},



        didao_wangshao: { generalId: 'didao_wangshao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_122', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_492', strategicSkillId: 'str_07', advantageSkillId: 'ts_492', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_068', atkBalanceSkillId: 'ts_493', atkDisadvantageSkillId: 'ts_111', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_572', aptitude: 'reverse' , attackStyle: 'attack'},



        zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', tacticalSkillId: 'ts_460', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_351', atkDisadvantageSkillId: 'ts_461', defAdvantageSkillId: 'ts_023', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'famous', tacticalSkillId: 'ts_252', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_252', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



        suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_052', strategicSkillId: 'str_01', advantageSkillId: 'ts_052', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_240', atkBalanceSkillId: 'ts_232', atkDisadvantageSkillId: 'ts_198', defAdvantageSkillId: 'ts_359', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



        shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_609', strategicSkillId: 'str_26', advantageSkillId: 'ts_609', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_113', atkBalanceSkillId: 'ts_610', defAdvantageSkillId: 'ts_609', atkDisadvantageSkillId: 'ts_037', defBalanceSkillId: 'ts_484', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    dongshengwei_wangyue: { generalId: 'dongshengwei_wangyue', tier: 'famous', tacticalSkillId: 'ts_251', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_251', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_103', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_757', aptitude: 'leverage' , attackStyle: 'defense'},



    weiming_huhanxie: { generalId: 'weiming_huhanxie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_069', aptitude: 'leverage' , attackStyle: 'attack'},



    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_254', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_254', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_475', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_396', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'defense'},



    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_422', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_276', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_275', aptitude: 'create' , attackStyle: 'attack'},



    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'ts_315', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'attack'},



    hunxie_xuziwei: { generalId: 'hunxie_xuziwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_072', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_253', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_192', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'balanced'},



    kang_liangshidou: { generalId: 'kang_liangshidou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'famous', tacticalSkillId: 'ts_295', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'defense'},



    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'ts_250', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_yaosi: { generalId: 'huizhou_yaosi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_501', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'famous', tacticalSkillId: 'ts_255', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_255', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'defense'},



    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'ts_320', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'balanced'},



        pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_567', strategicSkillId: 'str_06', advantageSkillId: 'ts_567', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_569', atkAdvantageSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_569', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



    ningkou_liling: { generalId: 'ningkou_liling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_726', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'defense'},



    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_256', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_256', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_816', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_163', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_434', atkDisadvantageSkillId: 'ts_163', atkAdvantageSkillId: 'ts_398', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'attack'},



    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_202', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', tacticalSkillId: 'ts_194', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_194', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_417', strategicSkillId: 'str_20', aptitude: 'create', attackStyle: 'attack' },



        jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'ts_537', strategicSkillId: 'str_28', advantageSkillId: 'ts_537', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_538', atkBalanceSkillId: 'ts_200', atkDisadvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_751', atkAdvantageSkillId: 'ts_402', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage' , attackStyle: 'balanced'},



        zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_430', strategicSkillId: 'str_12', advantageSkillId: 'ts_430', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_019', atkDisadvantageSkillId: 'ts_157', defAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_397', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_412', aptitude: 'reverse' , attackStyle: 'balanced'},



    zhongshan_yangaoqing: { generalId: 'zhongshan_yangaoqing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_389', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_183', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    wang_d_liuyu: { generalId: 'wang_d_liuyu', tier: 'famous', tacticalSkillId: 'ts_742', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_074', defBalanceSkillId: 'ts_430', defDisadvantageSkillId: 'ts_174', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_390', aptitude: 'create' , attackStyle: 'attack'},



    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_414', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_404', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_072', aptitude: 'leverage' , attackStyle: 'attack'},



    xiao_d_xiaoyan: { generalId: 'xiao_d_xiaoyan', tier: 'famous', tacticalSkillId: 'ts_204', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    wazhai_zhanghan: { generalId: 'wazhai_zhanghan', tier: 'famous', tacticalSkillId: 'ts_203', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_203', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_407', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_020', aptitude: 'leverage' , attackStyle: 'attack'},



    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_164', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_164', atkBalanceSkillId: 'ts_677', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_526', aptitude: 'reverse' , attackStyle: 'balanced'},



    jibei_xuxuan: { generalId: 'jibei_xuxuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_733', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    jinan_tiexuan: { generalId: 'jinan_tiexuan', tier: 'famous', tacticalSkillId: 'ts_195', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_195', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_190', aptitude: 'reverse' , attackStyle: 'defense'},



    qi_simarangju: { generalId: 'qi_simarangju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'defense'},



    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_398', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_134', atkBalanceSkillId: 'ts_184', defAdvantageSkillId: 'ts_594', defDisadvantageSkillId: 'ts_563', atkDisadvantageSkillId: 'ts_742', defBalanceSkillId: 'ts_631', aptitude: 'leverage' , attackStyle: 'defense'},



    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_275', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



        cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'ts_477', strategicSkillId: 'str_25', advantageSkillId: 'ts_477', balanceSkillId: 'ts_478', disadvantageSkillId: 'ts_479', atkAdvantageSkillId: 'ts_107', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_453', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_477', defDisadvantageSkillId: 'ts_719', aptitude: 'leverage' , attackStyle: 'balanced'},



    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_197', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_736', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_018', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_211', atkDisadvantageSkillId: 'ts_018', defBalanceSkillId: 'ts_537', atkAdvantageSkillId: 'ts_399', defAdvantageSkillId: 'ts_029', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_615', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'balanced'},



    baibo_guotai: { generalId: 'baibo_guotai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_404', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_587', aptitude: 'reverse', attackStyle: 'attack' },



    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_405', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_108', advantageSkillId: 'ts_005', balanceSkillId: 'ts_597', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_108', atkBalanceSkillId: 'ts_708', atkDisadvantageSkillId: 'ts_659', defAdvantageSkillId: 'ts_597', defBalanceSkillId: 'ts_466', defDisadvantageSkillId: 'ts_037', strategicSkillId: 'str_12', aptitude: 'create', attackStyle: 'attack' },



    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'attack'},



    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_196', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_196', atkBalanceSkillId: 'ts_701', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'create' , attackStyle: 'attack'},



    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_184', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    dixiang_wangmang: { generalId: 'dixiang_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_767', atkAdvantageSkillId: 'ts_031', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'balanced'},



        zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'ts_672', strategicSkillId: 'str_28', advantageSkillId: 'ts_672', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_673', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_674', defBalanceSkillId: 'ts_673', defAdvantageSkillId: 'ts_815', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    quanrong_yiquhai: { generalId: 'quanrong_yiquhai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    cai_lishuo: { generalId: 'cai_lishuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_311', atkDisadvantageSkillId: 'ts_349', defDisadvantageSkillId: 'ts_238', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_043', aptitude: 'leverage', attackStyle: 'attack' },



    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'defense'},



    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_388', atkDisadvantageSkillId: 'ts_221', defAdvantageSkillId: 'ts_150', defBalanceSkillId: 'ts_813', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_215', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_301', defDisadvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', aptitude: 'reverse' , attackStyle: 'balanced'},



            qing_quduan: { generalId: 'qing_quduan', tier: 'ordinary', tacticalSkillId: 'ts_458', advantageSkillId: 'ts_458', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_146', atkDisadvantageSkillId: 'ts_459', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    han_baoyuan: { generalId: 'han_baoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_822', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_384', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_098', aptitude: 'reverse', attackStyle: 'attack' },



    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_188', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_640', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_729', defDisadvantageSkillId: 'ts_127', defBalanceSkillId: 'ts_757', aptitude: 'leverage' , attackStyle: 'balanced'},



    liguo_zhaoshe: { generalId: 'liguo_zhaoshe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_697', atkDisadvantageSkillId: 'ts_189', atkAdvantageSkillId: 'ts_399', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'defense'},



        huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'ts_806', strategicSkillId: 'str_28', advantageSkillId: 'ts_806', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_345', atkBalanceSkillId: 'ts_441', defAdvantageSkillId: 'ts_039', atkDisadvantageSkillId: 'ts_794', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_109', aptitude: 'create' , attackStyle: 'attack'},



    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},





    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_266', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_266', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_373', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_373', atkBalanceSkillId: 'ts_722', atkDisadvantageSkillId: 'ts_724', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_383', strategicSkillId: 'str_25', aptitude: 'create', attackStyle: 'attack' },



    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



        lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_432', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_432', disadvantageSkillId: 'ts_433', atkAdvantageSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_406', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'balanced'},



    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_607', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_748', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    hao_d_weirui: { generalId: 'hao_d_weirui', tier: 'famous', tacticalSkillId: 'ts_193', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_658', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'balanced'},



    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_411', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_275', aptitude: 'create', attackStyle: 'attack' },



    zhuozhou_anlushan: { generalId: 'zhuozhou_anlushan', tier: 'famous', tacticalSkillId: 'ts_226', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_226', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'attack'},



        chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_480', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_480', disadvantageSkillId: 'ts_481', atkAdvantageSkillId: 'ts_087', atkBalanceSkillId: 'ts_481', atkDisadvantageSkillId: 'ts_482', defAdvantageSkillId: 'ts_147', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_409', aptitude: 'create' , attackStyle: 'attack'},



    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_327', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'famous', tacticalSkillId: 'ts_217', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_217', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'attack'},



            pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_792', atkDisadvantageSkillId: 'ts_792', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_484', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    linhu_mafang: { generalId: 'linhu_mafang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_671', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



        xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_013', strategicSkillId: 'str_23', advantageSkillId: 'ts_424', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_425', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_013', defBalanceSkillId: 'ts_425', defAdvantageSkillId: 'ts_154', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'attack'},



    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    loufan_xuerengui: { generalId: 'loufan_xuerengui', tier: 'famous', tacticalSkillId: 'ts_216', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_216', defAdvantageSkillId: 'ts_110', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_560', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'attack'},



    shanrong_lanyu: { generalId: 'shanrong_lanyu', tier: 'famous', tacticalSkillId: 'ts_220', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_009', defAdvantageSkillId: 'ts_094', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_584', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



        you_gengyan: { generalId: 'you_gengyan', tier: 'famous', tacticalSkillId: 'ts_669', strategicSkillId: 'str_12', advantageSkillId: 'ts_669', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_670', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_669', defDisadvantageSkillId: 'ts_224', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_769', aptitude: 'create' , attackStyle: 'attack'},



        lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', tacticalSkillId: 'ts_564', strategicSkillId: 'str_26', advantageSkillId: 'ts_564', balanceSkillId: 'ts_565', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_214', atkBalanceSkillId: 'ts_044', defAdvantageSkillId: 'ts_564', atkDisadvantageSkillId: 'ts_759', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_143', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_775', aptitude: 'reverse' , attackStyle: 'defense'},



    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



        jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_750', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



        zu_d_yuanchonghuan: { generalId: 'zu_d_yuanchonghuan', tier: 'famous', tacticalSkillId: 'ts_675', strategicSkillId: 'str_05', advantageSkillId: 'ts_675', balanceSkillId: 'ts_450', disadvantageSkillId: 'ts_677', atkBalanceSkillId: 'ts_065', atkDisadvantageSkillId: 'ts_699', defAdvantageSkillId: 'ts_675', defDisadvantageSkillId: 'ts_144', atkAdvantageSkillId: 'ts_355', defBalanceSkillId: 'ts_403', aptitude: 'reverse' , attackStyle: 'defense'},



    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_047', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_587', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_405', aptitude: 'leverage' , attackStyle: 'attack'},



    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_098', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'defense'},



        weihaiwei_sudingfang: { generalId: 'weihaiwei_sudingfang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_628', atkAdvantageSkillId: 'ts_116', atkDisadvantageSkillId: 'ts_230', defAdvantageSkillId: 'ts_329', atkBalanceSkillId: 'ts_397', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_037', aptitude: 'leverage' , attackStyle: 'attack'},



        xuan_xuda: { generalId: 'xuan_xuda', tier: 'famous', tacticalSkillId: 'ts_654', strategicSkillId: 'str_28', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_655', atkAdvantageSkillId: 'ts_089', atkDisadvantageSkillId: 'ts_656', defAdvantageSkillId: 'ts_246', atkBalanceSkillId: 'ts_484', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_229', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_418', aptitude: 'create' , attackStyle: 'attack'},



    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'balanced'},



    changshan_yangyanzhao: { generalId: 'changshan_yangyanzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_095', defDisadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'defense' },



    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_213', atkDisadvantageSkillId: 'ts_746', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage' , attackStyle: 'attack'},



    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage' , attackStyle: 'defense'},



    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'balanced'},



    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', tacticalSkillId: 'ts_212', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_212', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_769', aptitude: 'leverage' , attackStyle: 'defense'},



    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'famous', tacticalSkillId: 'ts_083', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_219', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_219', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_748', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'ts_211', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_295', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    wangyan_wangyan: { generalId: 'wangyan_wangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'attack'},



    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_148', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_526', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_404', aptitude: 'leverage' , attackStyle: 'attack'},



        erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_510', strategicSkillId: 'str_18', advantageSkillId: 'ts_510', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_511', atkAdvantageSkillId: 'ts_510', atkDisadvantageSkillId: 'ts_512', atkBalanceSkillId: 'ts_484', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'famous', tacticalSkillId: 'ts_225', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_225', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'defense'},



        heng1_yangye: { generalId: 'heng1_yangye', tier: 'famous', tacticalSkillId: 'ts_661', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_455', atkDisadvantageSkillId: 'ts_455', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



        dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_436', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_437', disadvantageSkillId: 'ts_436', atkAdvantageSkillId: 'ts_202', atkBalanceSkillId: 'ts_437', defAdvantageSkillId: 'ts_056', atkDisadvantageSkillId: 'ts_017', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_205', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_314', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'defense'},



    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'attack'},



    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_045', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'defense'},



    ouyang_ouyangwei: { generalId: 'ouyang_ouyangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'defense'},



        yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_657', strategicSkillId: 'str_19', advantageSkillId: 'ts_657', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_658', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_490', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'ts_160', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_321', defAdvantageSkillId: 'ts_326', defBalanceSkillId: 'ts_574', defDisadvantageSkillId: 'ts_753', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_775', aptitude: 'reverse' , attackStyle: 'balanced'},



    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    yang_aner_yanganer: { generalId: 'yang_aner_yanganer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    xie_xiefangde: { generalId: 'xie_xiefangde', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'defense'},



    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'balanced'},



    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_458', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_029', defDisadvantageSkillId: 'ts_111', aptitude: 'leverage' , attackStyle: 'balanced'},



    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'famous', tacticalSkillId: 'ts_338', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_109', aptitude: 'reverse' , attackStyle: 'defense'},



    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_008', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_316', atkBalanceSkillId: 'ts_645', atkDisadvantageSkillId: 'ts_073', defAdvantageSkillId: 'ts_261', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    fangla_fangla: { generalId: 'fangla_fangla', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_587', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_650', aptitude: 'leverage' , attackStyle: 'attack'},



    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_405', atkAdvantageSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_179', aptitude: 'leverage' , attackStyle: 'attack'},



    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'famous', tacticalSkillId: 'ts_316', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



        wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_640', atkBalanceSkillId: 'ts_078', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    li_bian: { generalId: 'li_bian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_629', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_761', atkAdvantageSkillId: 'ts_816', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_394', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'ts_177', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_177', defDisadvantageSkillId: 'ts_188', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_743', aptitude: 'reverse' , attackStyle: 'attack'},



    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_228', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'defense'},



    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



            sui_yangjian: { generalId: 'sui_yangjian', tier: 'ordinary', tacticalSkillId: 'ts_807', advantageSkillId: 'ts_005', balanceSkillId: 'ts_807', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_807', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



    changshaguo_xinqiji: { generalId: 'changshaguo_xinqiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_176', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_204', aptitude: 'reverse', attackStyle: 'attack' },



    yue_d_lusu: { generalId: 'yue_d_lusu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'defense'},



    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'ts_299', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse' , attackStyle: 'balanced'},



        wu_sunwu: { generalId: 'wu_sunwu', tier: 'famous', tacticalSkillId: 'ts_633', strategicSkillId: 'str_19', advantageSkillId: 'ts_633', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_634', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_123', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_412', aptitude: 'reverse' , attackStyle: 'attack'},



    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', tacticalSkillId: 'ts_288', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_288', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    qiufu_qiufu: { generalId: 'qiufu_qiufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



        qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'ts_585', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_585', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_438', defBalanceSkillId: 'ts_740', defDisadvantageSkillId: 'ts_585', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_391', aptitude: 'create' , attackStyle: 'balanced'},



    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_321', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse' , attackStyle: 'defense'},



    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'defense'},



    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'ts_606', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_336', defDisadvantageSkillId: 'ts_125', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_408', aptitude: 'leverage' , attackStyle: 'attack'},



    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_245', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_397', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'balanced'},



    mi_chu_xionglv: { generalId: 'mi_chu_xionglv', tier: 'famous', tacticalSkillId: 'ts_267', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_267', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_175', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_175', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_587', aptitude: 'create' , attackStyle: 'attack'},



    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'attack'},



    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'attack'},



    hongzhou_zhuwenzheng: { generalId: 'hongzhou_zhuwenzheng', tier: 'famous', tacticalSkillId: 'ts_263', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_406', aptitude: 'reverse' , attackStyle: 'defense'},



    danyang_huanwen: { generalId: 'danyang_huanwen', tier: 'famous', tacticalSkillId: 'ts_259', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_259', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_125', aptitude: 'create' , attackStyle: 'attack'},



    chizhou_changyuchun: { generalId: 'chizhou_changyuchun', tier: 'famous', tacticalSkillId: 'ts_258', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_258', defAdvantageSkillId: 'ts_063', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_822', aptitude: 'create' , attackStyle: 'attack'},



    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_143', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage' , attackStyle: 'attack'},



    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_689', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'attack'},



    sagami_beitiaoshikang: { generalId: 'sagami_beitiaoshikang', tier: 'famous', tacticalSkillId: 'ts_331', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_275', aptitude: 'reverse' , attackStyle: 'balanced'},



    mino_dagujiji: { generalId: 'mino_dagujiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'defense'},



    zhuqian_shaoerzineng: { generalId: 'zhuqian_shaoerzineng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage' , attackStyle: 'defense'},



    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_207', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' , attackStyle: 'attack'},



    kong_d_caogui: { generalId: 'kong_d_caogui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_049', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_035', aptitude: 'leverage' , attackStyle: 'defense'},



    tongma_taishici: { generalId: 'tongma_taishici', tier: 'ordinary', tacticalSkillId: 'ts_389', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },



    yanchuan_d_yuefei: { generalId: 'yanchuan_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_092', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_421', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_420', atkDisadvantageSkillId: 'ts_318', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_582', defDisadvantageSkillId: 'ts_248', strategicSkillId: 'str_22', aptitude: 'create', attackStyle: 'attack' },



    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_586', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'balanced'},



    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'defense'},



    fu_zhou_yanyan: { generalId: 'fu_zhou_yanyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_428', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'defense'},



    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    cen_d_cenmeng: { generalId: 'cen_d_cenmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_394', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_587', aptitude: 'reverse', attackStyle: 'defense' },



    miao_amishi: { generalId: 'miao_amishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'defense'},



    jiang_s_huanggai: { generalId: 'jiang_s_huanggai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_346', atkBalanceSkillId: 'ts_436', defBalanceSkillId: 'ts_440', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_006', defDisadvantageSkillId: 'ts_197', aptitude: 'leverage' , attackStyle: 'attack'},



    muong_shencongyue: { generalId: 'muong_shencongyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse' , attackStyle: 'defense'},



    panyao_panhu: { generalId: 'panyao_panhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    chen2_zhaofan: { generalId: 'chen2_zhaofan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_389', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'defense' },



    qian_songjingyang: { generalId: 'qian_songjingyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_292', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_292', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_417', aptitude: 'create' , attackStyle: 'attack'},



    jiashi_wangxuance: { generalId: 'jiashi_wangxuance', tier: 'famous', tacticalSkillId: 'ts_310', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_310', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    yangtong_chisongdezan: { generalId: 'yangtong_chisongdezan', tier: 'famous', tacticalSkillId: 'ts_378', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_378', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    monpa_meire: { generalId: 'monpa_meire', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_808', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_160', aptitude: 'leverage' , attackStyle: 'balanced'},



    xining_yangyingju: { generalId: 'xining_yangyingju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_784', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_391', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    golog_wandezhaxi: { generalId: 'golog_wandezhaxi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_547', atkAdvantageSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_742', aptitude: 'reverse' , attackStyle: 'defense'},



    lopi_abo: { generalId: 'lopi_abo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_756', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_691', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_016', aptitude: 'create' , attackStyle: 'attack'},



    dingling_weilu: { generalId: 'dingling_weilu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_691', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'defense'},



        yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'ts_663', strategicSkillId: 'str_25', advantageSkillId: 'ts_663', balanceSkillId: 'ts_664', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_663', atkBalanceSkillId: 'ts_664', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_530', aptitude: 'create' , attackStyle: 'balanced'},



            buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_793', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_793', atkDisadvantageSkillId: 'ts_796', defDisadvantageSkillId: 'ts_793', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_769', aptitude: 'reverse' , attackStyle: 'defense'},



    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_237', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_237', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_542', aptitude: 'create' , attackStyle: 'attack'},



    donghui_nanlv: { generalId: 'donghui_nanlv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_071', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_572', aptitude: 'reverse' , attackStyle: 'defense'},



    gonggu_gonggudaozhu: { generalId: 'gonggu_gonggudaozhu', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_048', aptitude: 'reverse', attackStyle: 'defense' },



    yizhi_beigou: { generalId: 'yizhi_beigou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},



    beihai_shamusheyun: { generalId: 'beihai_shamusheyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_781', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_197', aptitude: 'reverse', attackStyle: 'defense' },



    sheng_d_liyiqi: { generalId: 'sheng_d_liyiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'attack'},



    haikou_wangzhi: { generalId: 'haikou_wangzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_635', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'attack'},



    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse' , attackStyle: 'defense'},



    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_475', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_409', aptitude: 'reverse', attackStyle: 'defense' },



    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},



    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_513', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'balanced'},



    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_704', aptitude: 'reverse' , attackStyle: 'defense'},



    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_703', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_168', aptitude: 'leverage' , attackStyle: 'balanced'},



    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_560', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_384', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'defense'},



    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'balanced'},



    pyu_moluo: { generalId: 'pyu_moluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_179', aptitude: 'reverse' , attackStyle: 'defense'},



    nongzhigao_huangshimi: { generalId: 'nongzhigao_huangshimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'attack'},



    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_275', aptitude: 'reverse' , attackStyle: 'defense'},



    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_742', aptitude: 'reverse' , attackStyle: 'defense'},



    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_526', aptitude: 'reverse' , attackStyle: 'defense'},



    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_530', aptitude: 'reverse' , attackStyle: 'defense'},



    ruoqiang_quhulai: { generalId: 'ruoqiang_quhulai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_542', aptitude: 'reverse' , attackStyle: 'attack'},



    weili_weilifan: { generalId: 'weili_weilifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_034', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_572', aptitude: 'reverse' , attackStyle: 'defense'},



    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_475', atkDisadvantageSkillId: 'ts_035', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_587', aptitude: 'reverse' , attackStyle: 'defense'},



    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_206', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_027', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse' , attackStyle: 'defense'},



    xiye_zihe: { generalId: 'xiye_zihe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_197', aptitude: 'reverse' , attackStyle: 'defense'},



    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_052', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_205', aptitude: 'create' , attackStyle: 'attack'},



    zhuoshi_gaopian: { generalId: 'zhuoshi_gaopian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_273', aptitude: 'create' , attackStyle: 'attack'},



    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'attack'},



    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},



    guzgan_abuhalisi: { generalId: 'guzgan_abuhalisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_802', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_390', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'reverse' , attackStyle: 'defense'},



            wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_794', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_794', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_177', aptitude: 'reverse' , attackStyle: 'defense'},



    xingan_hailancha: { generalId: 'xingan_hailancha', tier: 'famous', tacticalSkillId: 'ts_243', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_099', atkAdvantageSkillId: 'ts_040', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    badakhshan_yaerbeige: { generalId: 'badakhshan_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_109', aptitude: 'reverse', attackStyle: 'defense' },



    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_764', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_143', aptitude: 'reverse' , attackStyle: 'defense'},



    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_405', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_396', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_021', defDisadvantageSkillId: 'ts_143', aptitude: 'create', attackStyle: 'attack' },



    sai_gaijiayun: { generalId: 'sai_gaijiayun', tier: 'famous', tacticalSkillId: 'ts_339', strategicSkillId: 'str_21', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_398', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_179', aptitude: 'create' , attackStyle: 'attack'},



    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_745', atkAdvantageSkillId: 'ts_352', atkDisadvantageSkillId: 'ts_275', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_218', defDisadvantageSkillId: 'ts_542', aptitude: 'reverse' , attackStyle: 'defense'},



    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'attack'},



    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_302', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'defense'},



    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_108', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_090', atkBalanceSkillId: 'ts_811', defBalanceSkillId: 'ts_457', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_293', defDisadvantageSkillId: 'ts_641', aptitude: 'create' , attackStyle: 'attack'},



        pangzha_halixinge: { generalId: 'pangzha_halixinge', tier: 'famous', tacticalSkillId: 'ts_582', strategicSkillId: 'str_12', advantageSkillId: 'ts_582', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_584', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'balanced'},



        najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_795', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_795', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'attack'},



    dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_005', balanceSkillId: 'ts_501', disadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_502', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_048', strategicSkillId: 'str_13', aptitude: 'leverage', attackStyle: 'attack' },



    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_294', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_748', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage', attackStyle: 'balanced' },



            hali_gedaerzi: { generalId: 'hali_gedaerzi', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_796', defDisadvantageSkillId: 'ts_145', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_775', aptitude: 'leverage' , attackStyle: 'defense'},



    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_307', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'attack'},



    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_415', aptitude: 'create' , attackStyle: 'attack'},



        delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_498', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_498', disadvantageSkillId: 'ts_499', atkAdvantageSkillId: 'ts_498', atkBalanceSkillId: 'ts_499', atkDisadvantageSkillId: 'ts_500', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage' , attackStyle: 'defense'},



        huluo_jiyasiding: { generalId: 'huluo_jiyasiding', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_001', disadvantageSkillId: 'ts_532', atkDisadvantageSkillId: 'ts_533', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_404', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_416', aptitude: 'create' , attackStyle: 'attack'},



        aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_462', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_462', disadvantageSkillId: 'ts_463', atkBalanceSkillId: 'ts_463', atkDisadvantageSkillId: 'ts_464', atkAdvantageSkillId: 'ts_154', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_526', aptitude: 'create' , attackStyle: 'attack'},



    wenling_shilang: { generalId: 'wenling_shilang', tier: 'famous', tacticalSkillId: 'ts_287', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage' , attackStyle: 'attack'},



        qianzhou_lisheng: { generalId: 'qianzhou_lisheng', tier: 'famous', tacticalSkillId: 'ts_155', strategicSkillId: 'str_05', advantageSkillId: 'ts_155', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_590', atkDisadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_407', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'ts_374', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_374', defDisadvantageSkillId: 'ts_387', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_046', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_408', aptitude: 'create' , attackStyle: 'attack'},



    shaozhou_d_mayin: { generalId: 'shaozhou_d_mayin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage' , attackStyle: 'attack'},



        song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'ts_448', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_449', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_449', atkAdvantageSkillId: 'ts_399', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_704', aptitude: 'create' , attackStyle: 'attack'},



    chuzhou_d_huangfuhui: { generalId: 'chuzhou_d_huangfuhui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_521', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_384', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_190', aptitude: 'leverage' , attackStyle: 'defense'},



        xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_651', strategicSkillId: 'str_06', advantageSkillId: 'ts_651', balanceSkillId: 'ts_652', disadvantageSkillId: 'ts_653', atkAdvantageSkillId: 'ts_367', atkBalanceSkillId: 'ts_064', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_725', defBalanceSkillId: 'ts_652', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},



    zizhou_wangjian: { generalId: 'zizhou_wangjian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'attack'},



    cangzhou_liurengong: { generalId: 'cangzhou_liurengong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_293', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_109', aptitude: 'leverage', attackStyle: 'defense' },



    yuezhi_xihou: { generalId: 'yuezhi_xihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_143', aptitude: 'reverse' , attackStyle: 'defense'},



    minyue_wuzhu: { generalId: 'minyue_wuzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_143', aptitude: 'leverage' , attackStyle: 'attack'},



    funan_fanman: { generalId: 'funan_fanman', tier: 'famous', tacticalSkillId: 'ts_342', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_085', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_572', aptitude: 'create' , attackStyle: 'attack'},



    lancang_faang: { generalId: 'lancang_faang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_571', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_587', aptitude: 'create' , attackStyle: 'attack'},



    ahaomu_laqite: { generalId: 'ahaomu_laqite', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_641', aptitude: 'reverse', attackStyle: 'defense' },



    elunchunzu_gaishan: { generalId: 'elunchunzu_gaishan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_275', aptitude: 'leverage' , attackStyle: 'attack'},



    wazu_banhongwang: { generalId: 'wazu_banhongwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_118', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'attack'},



    tajikezu_kuerban: { generalId: 'tajikezu_kuerban', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_016', aptitude: 'reverse' , attackStyle: 'attack'},



    jingpozu_zaodan: { generalId: 'jingpozu_zaodan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_167', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_218', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_409', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizu_panxinjian: { generalId: 'shuizu_panxinjian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage' , attackStyle: 'attack'},



    liuzhou_shenxiyi: { generalId: 'liuzhou_shenxiyi', tier: 'famous', tacticalSkillId: 'ts_323', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_732', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_393', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_412', aptitude: 'create' , attackStyle: 'attack'},



    luming_luxiangsheng: { generalId: 'luming_luxiangsheng', tier: 'famous', tacticalSkillId: 'ts_179', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', defDisadvantageSkillId: 'ts_772', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_475', aptitude: 'create' , attackStyle: 'attack'},



    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_210', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_210', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_395', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_414', aptitude: 'create' , attackStyle: 'attack'},



        shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', tacticalSkillId: 'ts_123', strategicSkillId: 'str_27', advantageSkillId: 'ts_123', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_604', atkBalanceSkillId: 'ts_604', atkAdvantageSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_034', aptitude: 'create' , attackStyle: 'attack'},



        weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_630', strategicSkillId: 'str_25', advantageSkillId: 'ts_630', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_001', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_035', aptitude: 'create' , attackStyle: 'attack'},



    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_218', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_306', defDisadvantageSkillId: 'ts_694', atkBalanceSkillId: 'ts_484', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', aptitude: 'create' , attackStyle: 'attack'},



    dongsheng_weishang: { generalId: 'dongsheng_weishang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_769', atkAdvantageSkillId: 'ts_400', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage' , attackStyle: 'defense'},



    weiyuan_d_niangengyao: { generalId: 'weiyuan_d_niangengyao', tier: 'famous', tacticalSkillId: 'ts_272', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_272', atkBalanceSkillId: 'ts_690', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_197', aptitude: 'create' , attackStyle: 'attack'},



    yansui_wangwei: { generalId: 'yansui_wangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_205', aptitude: 'reverse' , attackStyle: 'defense'},



    xiazhou_lijiqian: { generalId: 'xiazhou_lijiqian', tier: 'famous', tacticalSkillId: 'ts_379', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_379', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_020', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_526', aptitude: 'leverage' , attackStyle: 'attack'},



    shizhou_liucong: { generalId: 'shizhou_liucong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_109', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' , attackStyle: 'attack'},



    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_406', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' , attackStyle: 'attack'},

    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_143', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' , attackStyle: 'defense'},

    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' , attackStyle: 'attack'},

    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_190', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_404', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' , attackStyle: 'defense'},

    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_690', atkAdvantageSkillId: 'ts_154', atkDisadvantageSkillId: 'ts_037', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_273', aptitude: 'leverage' , attackStyle: 'defense'},

    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_394', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_118', aptitude: 'leverage' , attackStyle: 'balanced'},

    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_760', atkAdvantageSkillId: 'ts_352', atkDisadvantageSkillId: 'ts_204', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage' , attackStyle: 'defense'},

    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_815', defBalanceSkillId: 'ts_408', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage' , attackStyle: 'attack'},

    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_275', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_397', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage' , attackStyle: 'attack'},

    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_743', atkAdvantageSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_396', defDisadvantageSkillId: 'ts_417', aptitude: 'reverse' , attackStyle: 'defense'},

    gaxa_zhashi: { generalId: 'gaxa_zhashi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_149', atkAdvantageSkillId: 'ts_399', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_027', defBalanceSkillId: 'ts_484', defDisadvantageSkillId: 'ts_418', aptitude: 'reverse' , attackStyle: 'defense'},

    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_400', atkBalanceSkillId: 'ts_690', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_704', aptitude: 'leverage' , attackStyle: 'defense'},

    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_691', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_205', aptitude: 'leverage' , attackStyle: 'defense'},

    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_370', atkAdvantageSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_521', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_650', defDisadvantageSkillId: 'ts_822', aptitude: 'leverage' , attackStyle: 'balanced'},

        khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_128', strategicSkillId: 'str_06', advantageSkillId: 'ts_128', balanceSkillId: 'ts_553', disadvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_553', atkAdvantageSkillId: 'ts_293', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_275', aptitude: 'create' , attackStyle: 'attack'},

    yanzhou_zhongshiheng: { generalId: 'yanzhou_zhongshiheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_218', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_742', aptitude: 'leverage' , attackStyle: 'defense'},

    pingnan_muying: { generalId: 'pingnan_muying', tier: 'famous', tacticalSkillId: 'ts_154', strategicSkillId: 'str_27', atkAdvantageSkillId: 'ts_523', atkBalanceSkillId: 'ts_485', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_294', defDisadvantageSkillId: 'ts_016', aptitude: 'create', attackStyle: 'attack' },

    yuan_cj_d_lishuo: { generalId: 'yuan_cj_d_lishuo', tier: 'famous', tacticalSkillId: 'ts_289', strategicSkillId: 'str_16', atkAdvantageSkillId: 'ts_260', atkBalanceSkillId: 'ts_181', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_384', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'defense' },
    cangsong_machao: { generalId: 'cangsong_machao', tier: 'ordinary', tacticalSkillId: 'ts_124', atkAdvantageSkillId: 'ts_124', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_273', defAdvantageSkillId: 'ts_214', defBalanceSkillId: 'ts_200', defDisadvantageSkillId: 'ts_699', aptitude: 'create', attackStyle: 'attack' },



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
