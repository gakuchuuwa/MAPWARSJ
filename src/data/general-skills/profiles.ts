/**

 * 武将技 · 将领装配档案（从 GeneralSkills.ts 拆出，2026-07-13）

 * 批量工具/脚本唯一允许写入的文件；类型与目录在 types.ts / catalogs.ts。

 * 条目键 = generalId（两者必须一致，校验规则 11.10 盯防）。

 */

import type { GeneralProfile } from './types';
import { isGeneralOnStage } from '../generalOnStage';



/**



 * 将领装配表



 * 分配依据：史实战役证据 + TacticalSkillCatalog 的六种/三类标签



 * 现行装配：攻方优/均/劣三槽 + 守方优/均/劣三槽；名将另有战略技



 * 注：S②攻城拔寨已并入 S③所向披靡（2026-06-27），原 str_02 将领统一改挂 str_03（进攻方专精）



 */



export const GENERAL_PROFILES: Record<string, GeneralProfile> = {
    gen_atoc: { generalId: 'gen_atoc', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    gen_uaxaclajuun: { generalId: 'gen_uaxaclajuun', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_088', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_011', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_012', aptitude: 'leverage', attackStyle: 'defense' },
    gen_harkhuf: { generalId: 'gen_harkhuf', tier: 'ordinary', tacticalSkillId: 'ts_089', advantageSkillId: 'ts_089', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_089', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_025', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_013', aptitude: 'leverage', attackStyle: 'defense' },
    gen_rajah_hijau: { generalId: 'gen_rajah_hijau', tier: 'ordinary', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_092', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_044', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_056', aptitude: 'leverage', attackStyle: 'defense' },
    mozambique_ataide: { generalId: 'mozambique_ataide', tier: 'ordinary', tacticalSkillId: 'ts_094', advantageSkillId: 'ts_094', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_094', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_054', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_084', aptitude: 'leverage', attackStyle: 'defense' },
    luanda_novais: { generalId: 'luanda_novais', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_059', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_104', aptitude: 'leverage', attackStyle: 'defense' },
    capetown_riebeeck: { generalId: 'capetown_riebeeck', tier: 'ordinary', tacticalSkillId: 'ts_112', advantageSkillId: 'ts_112', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_060', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_107', aptitude: 'leverage', attackStyle: 'defense' },

    kilwa_suleiman: { generalId: 'kilwa_suleiman', tier: 'ordinary', tacticalSkillId: 'ts_121', advantageSkillId: 'ts_121', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_121', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_066', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_122', aptitude: 'leverage', attackStyle: 'defense' },
    mombasa_yusuf: { generalId: 'mombasa_yusuf', tier: 'ordinary', tacticalSkillId: 'ts_162', advantageSkillId: 'ts_162', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_074', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_125', aptitude: 'leverage', attackStyle: 'defense' },
    mogadishu_abubakr: { generalId: 'mogadishu_abubakr', tier: 'ordinary', tacticalSkillId: 'ts_175', advantageSkillId: 'ts_175', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_116', atkAdvantageSkillId: 'ts_175', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_078', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_134', aptitude: 'leverage', attackStyle: 'defense' },
    zuraid_yasir: { generalId: 'zuraid_yasir', tier: 'ordinary', tacticalSkillId: 'ts_178', advantageSkillId: 'ts_178', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_123', atkAdvantageSkillId: 'ts_178', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_086', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_144', aptitude: 'leverage', attackStyle: 'defense' },




    leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_559', advantageSkillId: 'ts_559', balanceSkillId: 'ts_696', disadvantageSkillId: 'ts_131', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_483', aptitude: 'reverse', attackStyle: 'balanced' }, // 蓝山起义攻守 → 双行

    kejila_shulunbao: { generalId: 'kejila_shulunbao', tier: 'famous', tacticalSkillId: 'ts_195', atkAdvantageSkillId: 'ts_195', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_115', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_152', aptitude: 'reverse' , attackStyle: 'defense' },



    agui: { generalId: 'agui', tier: 'famous', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_291', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_291', atkAdvantageSkillId: 'ts_365', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_333', defDisadvantageSkillId: 'ts_714', aptitude: 'create' , attackStyle: 'attack'},



    qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_591', advantageSkillId: 'ts_591', balanceSkillId: 'ts_283', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_593', aptitude: 'create' , attackStyle: 'attack'},



        tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_435', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_698', aptitude: 'create' , attackStyle: 'attack'}, // 洛阳/浅水原攻 + 虎牢/柏壁守 → 双行



    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_766', advantageSkillId: 'ts_766', balanceSkillId: 'ts_537', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_766', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_117', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'defense'},
    gen_rurik: { generalId: 'gen_rurik', tier: 'ordinary', tacticalSkillId: 'ts_221', advantageSkillId: 'ts_221', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_142', atkAdvantageSkillId: 'ts_221', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_135', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_169', aptitude: 'leverage' , attackStyle: 'attack'}, // 留里克：862 据拉多加/诺夫哥罗德，建国者非野战名将 → 普将（仅战术技）
    gen_sineus: { generalId: 'gen_sineus', tier: 'ordinary', tacticalSkillId: 'ts_232', advantageSkillId: 'ts_232', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_232', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_138', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_181', aptitude: 'leverage' , attackStyle: 'defense'}, // 西涅乌斯：862 据白湖，留里克之弟、白湖公国始祖 → 普将（仅战术技）
    wulaertu_ashot3: { generalId: 'wulaertu_ashot3', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_244', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_150', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_183', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_186', aptitude: 'leverage' , attackStyle: 'defense'}, // 阿硕特三世：961 迁都阿尼、筑城墙教堂，无亲统胜绩 → 普将（仅战术技）
    danmai_harald: { generalId: 'danmai_harald', tier: 'ordinary', tacticalSkillId: 'ts_257', advantageSkillId: 'ts_257', balanceSkillId: 'ts_394', disadvantageSkillId: 'ts_153', atkAdvantageSkillId: 'ts_257', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_184', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_192', aptitude: 'leverage' , attackStyle: 'defense'}, // 蓝牙哈拉尔：耶灵石碑之王，君主坐领无亲统决战 → 普将（仅战术技）
    danmai_godfred: { generalId: 'danmai_godfred', tier: 'ordinary', tacticalSkillId: 'ts_284', advantageSkillId: 'ts_284', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_180', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_210', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_193', aptitude: 'leverage' , attackStyle: 'defense'}, // 戈德弗雷德：808 毁雷里克、迁商海瑟比，一隅之胜 → 普将（仅战术技）
    gen_pakal: { generalId: 'gen_pakal', tier: 'ordinary', tacticalSkillId: 'ts_301', advantageSkillId: 'ts_301', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_182', atkAdvantageSkillId: 'ts_301', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_213', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_214', aptitude: 'leverage' , attackStyle: 'attack'}, // 帕卡尔：帕伦克营建者，非野战统帅 → 普将（仅战术技）



        ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_575', advantageSkillId: 'ts_575', balanceSkillId: 'ts_280', disadvantageSkillId: 'ts_747', atkAdvantageSkillId: 'ts_575', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_747', defDisadvantageSkillId: 'ts_573', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_396', aptitude: 'create' , attackStyle: 'attack'},



    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'famous', tacticalSkillId: 'ts_683', advantageSkillId: 'ts_683', balanceSkillId: 'ts_288', disadvantageSkillId: 'ts_262', atkAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1125', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_262', defAdvantageSkillId: 'ts_039', defDisadvantageSkillId: 'ts_263', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：北伐唱筹量沙（魏军具名）、灭后秦前锋

    sijitai_ateas: { generalId: 'sijitai_ateas', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_063', defDisadvantageSkillId: 'ts_217', aptitude: 'create', attackStyle: 'attack' },
    yamaxun_xibolvte: { generalId: 'yamaxun_xibolvte', tier: 'ordinary', tacticalSkillId: 'ts_304', advantageSkillId: 'ts_304', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_187', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_224', aptitude: 'leverage', attackStyle: 'defense' }, // 忒弥斯基拉亚马逊女王，传说人物无史载胜绩 → 不在册通用池

    lunbadi_alboin: { generalId: 'lunbadi_alboin', tier: 'famous', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_073', defDisadvantageSkillId: 'ts_225', aptitude: 'create', attackStyle: 'attack' },
    wangdaer_gaisalike: { generalId: 'wangdaer_gaisalike', tier: 'famous', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_095', defDisadvantageSkillId: 'ts_226', aptitude: 'create', attackStyle: 'attack' },



    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_323', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_323', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_331', aptitude: 'leverage' , attackStyle: 'attack'},



    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_187', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_492', aptitude: 'reverse' , attackStyle: 'balanced'}, // 入蜀攻 + 屡败复起守土 → 双行



    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_356', disadvantageSkillId: 'ts_191', atkBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_169', atkAdvantageSkillId: 'ts_481', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1103', aptitude: 'reverse' , attackStyle: 'defense'},



    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_438', disadvantageSkillId: 'ts_261', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_261', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_274', aptitude: 'create' , attackStyle: 'balanced'}, // 江淮开国攻守 → 双行



    pagan_anulvtuo: { generalId: 'pagan_anulvtuo', tier: 'famous', tacticalSkillId: 'ts_522', advantageSkillId: 'ts_522', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_200', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_311', defBalanceSkillId: 'ts_524', defDisadvantageSkillId: 'ts_228', aptitude: 'create' , attackStyle: 'attack'},



    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_850', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_854', aptitude: 'reverse' , attackStyle: 'defense'},



    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_206', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_206', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_230', aptitude: 'reverse' , attackStyle: 'defense'},



    tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_070', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_615', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_085', defBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_615', defAdvantageSkillId: 'ts_140', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },



        menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_102', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_102', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_994', aptitude: 'create' , attackStyle: 'attack'},



        bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_352', advantageSkillId: 'ts_352', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_161', atkBalanceSkillId: 'ts_472', atkAdvantageSkillId: 'ts_352', atkDisadvantageSkillId: 'ts_161', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_291', aptitude: 'reverse' , attackStyle: 'defense'}, // 阻险建国守 → 擅守



    goryeo_jianghanzan: { generalId: 'goryeo_jianghanzan', tier: 'famous', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_382', disadvantageSkillId: 'ts_236', atkBalanceSkillId: 'ts_382', atkAdvantageSkillId: 'ts_544', atkDisadvantageSkillId: 'ts_236', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_207', aptitude: 'leverage' , attackStyle: 'defense'}, // 龟州攻守 → 双行



    ashikaga_zulizunshi: { generalId: 'ashikaga_zulizunshi', tier: 'famous', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_168', atkDisadvantageSkillId: 'ts_168', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_1107', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_281', aptitude: 'create', attackStyle: 'attack' },



        tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_681', disadvantageSkillId: 'ts_313', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_681', atkDisadvantageSkillId: 'ts_313', defAdvantageSkillId: 'ts_312', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_680', aptitude: 'create' , attackStyle: 'attack'},



        siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_614', disadvantageSkillId: 'ts_612', atkBalanceSkillId: 'ts_614', atkDisadvantageSkillId: 'ts_612', defBalanceSkillId: 'ts_1128', atkAdvantageSkillId: 'ts_787', defAdvantageSkillId: 'ts_194', defDisadvantageSkillId: 'ts_613', aptitude: 'create' , attackStyle: 'attack'},



        shang_fuhao: { generalId: 'shang_fuhao', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_249', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_255', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 甲骨所载伐羌方土方无敌方主帅名（对阵无名闸）→普将



    bing_liji: { generalId: 'bing_liji', tier: 'famous', tacticalSkillId: 'ts_130', advantageSkillId: 'ts_130', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_1133', atkBalanceSkillId: 'ts_110', atkAdvantageSkillId: 'ts_130', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_512', aptitude: 'create' , attackStyle: 'attack'},



    min_wangshenzhi: { generalId: 'min_wangshenzhi', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_752', disadvantageSkillId: 'ts_440', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_752', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_582', aptitude: 'leverage' , attackStyle: 'attack'},



    quanzhou_liucongxiao: { generalId: 'quanzhou_liucongxiao', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_756', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_756', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_684', aptitude: 'leverage' , attackStyle: 'attack'},



    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_720', atkAdvantageSkillId: 'ts_025', atkDisadvantageSkillId: 'ts_720', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_337', atkBalanceSkillId: 'ts_735', defAdvantageSkillId: 'ts_341', aptitude: 'reverse' , attackStyle: 'balanced'}, // 灭秦攻楚兼屡败复起 → 双行



        wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_036', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_429', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_429', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_383', aptitude: 'create' , attackStyle: 'balanced'}, // 拔秦五城 + 阴晋守 → 双行；🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 锚阴晋之战史失秦帅（该战役降级）→普将；🔴 [2026-11-05 主人令] 魏武卒 T0 只许名将挂，吴起升回名将



        manzhou_d_duoergun: { generalId: 'manzhou_d_duoergun', tier: 'famous', tacticalSkillId: 'ts_327', advantageSkillId: 'ts_327', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_327', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_446', defDisadvantageSkillId: 'ts_784', defBalanceSkillId: 'ts_1129', aptitude: 'create' , attackStyle: 'attack'},



    xinluo_jinyuxin: { generalId: 'xinluo_jinyuxin', tier: 'famous', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_237', aptitude: 'create' , attackStyle: 'attack'},



    edo_dechuanjiakang: { generalId: 'edo_dechuanjiakang', tier: 'famous', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_508', atkDisadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_129', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_706', aptitude: 'leverage', attackStyle: 'balanced' }, // 忍耐筑垒消耗（小牧·大坂）兼关原进取 → 双行



        seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_128', atkBalanceSkillId: 'ts_507', atkAdvantageSkillId: 'ts_648', atkDisadvantageSkillId: 'ts_128', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_463', aptitude: 'create' , attackStyle: 'attack'},



        chenla_duyebamo: { generalId: 'chenla_duyebamo', tier: 'famous', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_209', atkBalanceSkillId: 'ts_129', atkAdvantageSkillId: 'ts_652', atkDisadvantageSkillId: 'ts_209', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_612', aptitude: 'create' , attackStyle: 'attack'},



    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_536', advantageSkillId: 'ts_536', balanceSkillId: 'ts_473', disadvantageSkillId: 'ts_1133', atkBalanceSkillId: 'ts_473', defAdvantageSkillId: 'ts_170', atkAdvantageSkillId: 'ts_536', atkDisadvantageSkillId: 'ts_1133', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage' , attackStyle: 'balanced'},



    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_156', disadvantageSkillId: 'ts_171', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_171', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_781', aptitude: 'create', attackStyle: 'attack' },



    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_015', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_281', atkDisadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_1123', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'attack'},



    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_179', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_136', defDisadvantageSkillId: 'ts_470', aptitude: 'leverage', attackStyle: 'attack' },



    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_036', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_243', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_137', defDisadvantageSkillId: 'ts_508', aptitude: 'reverse', attackStyle: 'defense' },   // 🔴 [2026-10-28 档位对齐] 白皮书：大坂真田丸破德川、天王寺突阵（具名）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：大坂之阵局部守城，未改大局（守将准则反面）



    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_254', atkDisadvantageSkillId: 'ts_254', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_1124', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_216', aptitude: 'create', attackStyle: 'attack' },



    owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_268', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_268', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_231', aptitude: 'create', attackStyle: 'balanced' }, // 征伐美浓等 + 长筱阵地守 → 双行



    totomi_jiujingzhongci: { generalId: 'totomi_jiujingzhongci', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_602', disadvantageSkillId: 'ts_271', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_271', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_233', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：长筱之战鸢巢山奇袭破武田（具名）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：鸢巢山奇袭属战术小胜，非战区级



    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'ordinary', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_070', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_234', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_272', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准改档] 白皮书：扩张东海一隅、无战役大捷



        aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_470', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_470', defBalanceSkillId: 'ts_1127', atkAdvantageSkillId: 'ts_792', defAdvantageSkillId: 'ts_539', defDisadvantageSkillId: 'ts_469', aptitude: 'leverage' , attackStyle: 'balanced'},



    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', tacticalSkillId: 'ts_569', advantageSkillId: 'ts_569', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_238', atkDisadvantageSkillId: 'ts_238', atkAdvantageSkillId: 'ts_569', atkBalanceSkillId: 'ts_196', defAdvantageSkillId: 'ts_111', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_277', aptitude: 'create' , attackStyle: 'attack'},



    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_706', atkDisadvantageSkillId: 'ts_706', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_252', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_241', aptitude: 'leverage' , attackStyle: 'attack'},



    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_139', disadvantageSkillId: 'ts_295', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_295', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_287', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 「独当一面破敌」无具名锚战（存疑列普将）



    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_326', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_326', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_292', aptitude: 'leverage' , attackStyle: 'attack'},



    kaga_d_xiajianlailian: { generalId: 'kaga_d_xiajianlailian', tier: 'ordinary', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_155', disadvantageSkillId: 'ts_307', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_297', aptitude: 'leverage' , attackStyle: 'defense'},



    iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'ts_778', advantageSkillId: 'ts_778', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_778', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_141', defBalanceSkillId: 'ts_174', defDisadvantageSkillId: 'ts_302', aptitude: 'leverage', attackStyle: 'attack' },



    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_163', advantageSkillId: 'ts_163', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_317', aptitude: 'leverage' , attackStyle: 'defense'},



    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_170', advantageSkillId: 'ts_170', balanceSkillId: 'ts_199', disadvantageSkillId: 'ts_387', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_387', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse' , attackStyle: 'defense'},
    yamato_sakanouenotamuramaro: { generalId: 'yamato_sakanouenotamuramaro', tier: 'ordinary', tacticalSkillId: 'ts_972', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_367', defDisadvantageSkillId: 'ts_450', aptitude: 'create', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：征虾夷以筑城威压受降为主，无明确会战大胜



            aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_553', advantageSkillId: 'ts_553', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_007', atkAdvantageSkillId: 'ts_553', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_007', defAdvantageSkillId: 'ts_011', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_460', aptitude: 'create' , attackStyle: 'attack'},



    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_248', disadvantageSkillId: 'ts_321', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_321', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_464', aptitude: 'leverage' , attackStyle: 'attack'},



    shimotsuke_yudougongguanggang: { generalId: 'shimotsuke_yudougongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_334', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_477', aptitude: 'reverse' , attackStyle: 'defense'},



    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'famous', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_256', disadvantageSkillId: 'ts_337', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_337', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_482', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：筑后川之战大破北朝军（具名）



    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'famous', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_439', disadvantageSkillId: 'ts_502', atkBalanceSkillId: 'ts_439', atkAdvantageSkillId: 'ts_054', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_345', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：木津川口破织田水军（具名）·村上水军统帅



    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_177', balanceSkillId: 'ts_264', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_177', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_351', aptitude: 'leverage' , attackStyle: 'attack'},



    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_382', disadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_382', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_359', aptitude: 'leverage' , attackStyle: 'defense'},



    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_198', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_533', atkBalanceSkillId: 'ts_1123', atkAdvantageSkillId: 'ts_198', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_373', aptitude: 'leverage' , attackStyle: 'attack'},



    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_215', advantageSkillId: 'ts_215', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_386', aptitude: 'leverage' , attackStyle: 'attack'},



    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_545', atkBalanceSkillId: 'ts_1110', atkAdvantageSkillId: 'ts_060', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_447', defDisadvantageSkillId: 'ts_164', aptitude: 'reverse', attackStyle: 'attack' },



    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_422', aptitude: 'leverage' , attackStyle: 'attack'},
    goto_xuanya: { generalId: 'goto_xuanya', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_422', aptitude: 'leverage' , attackStyle: 'attack'},
    omura_sumitada: { generalId: 'omura_sumitada', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_422', aptitude: 'leverage' , attackStyle: 'attack'},



    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_695', advantageSkillId: 'ts_695', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_695', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_220', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_429', aptitude: 'leverage' , attackStyle: 'defense'},
    // 🔴 [2026-09-19 主人令「先给奥州更换武将。新建一个」] 奥州藤原氏的新将。
    //    源义经归入源氏后，奥州藤原氏空了出来，这里补它的当主。
    //    藤原秀衡（1122?–1187）：**奥州藤原氏第三代当主**、陆奥·出羽的实际统治者。
    //    1184 年前后正是他把源义经收为客将（义经 1185 年投奔平泉，秀衡临终命子泰衡庇护）；
    //    平泉坐拥砂金与良马，是当时日本仅次于京都的富庶政权，故普将档、逆势（偏安自守）· 善防。
    fujiwara_xiuheng: { generalId: 'fujiwara_xiuheng', tier: 'ordinary', tacticalSkillId: 'ts_750', advantageSkillId: 'ts_750', balanceSkillId: 'ts_368', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_750', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_239', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_431', aptitude: 'reverse' , attackStyle: 'defense'},
    // 🔴 [2026-09-19 主人令「武将和精锐和据点必须契合，最好是此处据点的守将、为此处做出贡献的、
    //    在此处镇守或当官、执行过任务也行」] **镰仓的守将必须是源赖朝**。
    //    源赖朝（1147–1199）：1180 年于镰仓起兵、设**镰仓幕府**，此后十九年坐镇镰仓施政，
    //    是整个源平合战的**总指挥**（义经、范赖都是他派出去的军势）。镰仓因他而成天下之中。
    //    ⚠️ 源义经在镰仓**没有任何职守与贡献**（14 岁在镰仓寄居，一生征战在外），
    //    故镰仓不挂义经 —— 与「常山赵云」同理，出生地/寄居地不算贡献。
    //    名将档（开创幕府、建立武家政权）· 创势 · 双行（军政兼资）
    gen_minamoto_yoritomo: { generalId: 'gen_minamoto_yoritomo', tier: 'famous', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_782', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_782', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_250', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_451', aptitude: 'create', attackStyle: 'attack' },



    lelang_wangqi: { generalId: 'lelang_wangqi', tier: 'ordinary', tacticalSkillId: 'ts_997', advantageSkillId: 'ts_997', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_997', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_544', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_457', aptitude: 'leverage' , attackStyle: 'attack'},



    anmei_yuwandaqin: { generalId: 'anmei_yuwandaqin', tier: 'ordinary', tacticalSkillId: 'ts_778', advantageSkillId: 'ts_778', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_581', atkDisadvantageSkillId: 'ts_581', atkAdvantageSkillId: 'ts_778', atkBalanceSkillId: 'ts_441', defAdvantageSkillId: 'ts_074', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_363', aptitude: 'reverse', attackStyle: 'defense' },



    chen3_jizhun: { generalId: 'chen3_jizhun', tier: 'ordinary', tacticalSkillId: 'ts_047', advantageSkillId: 'ts_047', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_635', atkAdvantageSkillId: 'ts_047', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_635', defAdvantageSkillId: 'ts_078', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_585', aptitude: 'reverse' , attackStyle: 'defense'},



        joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_459', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_590', aptitude: 'create' , attackStyle: 'attack'},



    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_258', advantageSkillId: 'ts_258', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_479', atkBalanceSkillId: 'ts_1114', atkAdvantageSkillId: 'ts_258', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_592', aptitude: 'leverage' , attackStyle: 'defense'}, // 清川诱敌守反 + 主动疲敌 → 双行



    baiji_jiebo: { generalId: 'baiji_jiebo', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_942', disadvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_942', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_041', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_601', aptitude: 'reverse', attackStyle: 'defense' },



    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_390', advantageSkillId: 'ts_390', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_492', atkAdvantageSkillId: 'ts_390', atkBalanceSkillId: 'ts_494', atkDisadvantageSkillId: 'ts_492', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_606', aptitude: 'create' , attackStyle: 'attack'},



    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_493', atkBalanceSkillId: 'ts_495', atkAdvantageSkillId: 'ts_083', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_637', aptitude: 'leverage' , attackStyle: 'defense'},



    sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_551', disadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_551', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_498', aptitude: 'leverage', attackStyle: 'defense' }, // 战略守土 + 闲山岛鹤翼主动围歼 → 双行



    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_097', disadvantageSkillId: 'ts_667', atkBalanceSkillId: 'ts_097', atkAdvantageSkillId: 'ts_086', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_514', aptitude: 'create' , attackStyle: 'attack'},



            gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_506', disadvantageSkillId: 'ts_384', defBalanceSkillId: 'ts_1130', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_120', defDisadvantageSkillId: 'ts_518', aptitude: 'leverage' , attackStyle: 'attack'},



    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_671', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_534', aptitude: 'reverse' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 白皮书：安市挫唐太宗（具名）·专权抗唐　🔴[2026-11-01 主人令·四闸复核] 名将→普将：安市守将为杨万春；其遣高延寿野战大败（驻跸山），本人未亲临



    naju_d_wangjian_wangye: { generalId: 'naju_d_wangjian_wangye', tier: 'ordinary', tacticalSkillId: 'ts_265', advantageSkillId: 'ts_265', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_674', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_543', aptitude: 'reverse' , attackStyle: 'defense'},



    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_548', aptitude: 'reverse' , attackStyle: 'defense'},



    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_520', defDisadvantageSkillId: 'ts_573', aptitude: 'reverse' , attackStyle: 'defense'},



    huimo_gaoyanshou: { generalId: 'huimo_gaoyanshou', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_557', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    aola_menglielun: { generalId: 'aola_menglielun', tier: 'ordinary', tacticalSkillId: 'ts_327', advantageSkillId: 'ts_327', balanceSkillId: 'ts_465', disadvantageSkillId: 'ts_358', atkAdvantageSkillId: 'ts_327', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_358', defAdvantageSkillId: 'ts_296', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_720', aptitude: 'reverse', attackStyle: 'defense' },



    ewenki_gentemuer: { generalId: 'ewenki_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_784', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_784', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_725', aptitude: 'reverse' , attackStyle: 'attack'},



    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_586', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_726', aptitude: 'leverage' , attackStyle: 'attack'},



    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_595', atkBalanceSkillId: 'ts_567', atkAdvantageSkillId: 'ts_446', atkDisadvantageSkillId: 'ts_595', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_729', aptitude: 'leverage' , attackStyle: 'attack'},



    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_610', defDisadvantageSkillId: 'ts_607', aptitude: 'leverage' , attackStyle: 'defense'},



    guishuang_qiujiuque: { generalId: 'guishuang_qiujiuque', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_747', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_623', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 统一五翕侯建贵霜＝纯头衔、无具名胜→普将



    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_762', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_664', aptitude: 'leverage' , attackStyle: 'attack'},



    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_645', aptitude: 'reverse' , attackStyle: 'defense'},



    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'famous', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_701', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-25 主人令按标准修复] 普将→名将：平壤道行军总管，攻沙卑城、破独山阵以少击众「称为名将」（《旧唐书·卷八三·程务挺传附》）



    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_646', aptitude: 'reverse' , attackStyle: 'defense'},



    manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_339', advantageSkillId: 'ts_339', balanceSkillId: 'ts_614', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_614', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_651', aptitude: 'create', attackStyle: 'attack' },



        wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_619', advantageSkillId: 'ts_619', balanceSkillId: 'ts_136', disadvantageSkillId: 'ts_808', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_808', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_637', aptitude: 'create' , attackStyle: 'attack'},



    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_124', disadvantageSkillId: 'ts_1133', defDisadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_1110', aptitude: 'leverage' , attackStyle: 'defense'},



        dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_057', advantageSkillId: 'ts_057', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_057', defAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_790', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_662', aptitude: 'create' , attackStyle: 'attack'},



        yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_667', atkAdvantageSkillId: 'ts_668', atkDisadvantageSkillId: 'ts_667', atkBalanceSkillId: 'ts_1120', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_696', defDisadvantageSkillId: 'ts_678', aptitude: 'create' , attackStyle: 'attack'},



    aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_330', advantageSkillId: 'ts_330', balanceSkillId: 'ts_465', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_330', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_253', aptitude: 'leverage', attackStyle: 'attack' }, // 松锦等攻 + 长围大凌河等 → 双行



    xianbei_tuobamao: { generalId: 'xianbei_tuobamao', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_822', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_822', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_830', aptitude: 'create', attackStyle: 'attack' },



    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_349', advantageSkillId: 'ts_349', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_698', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_698', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_700', defDisadvantageSkillId: 'ts_840', aptitude: 'leverage' , attackStyle: 'defense'},



    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_702', disadvantageSkillId: 'ts_708', atkBalanceSkillId: 'ts_702', atkAdvantageSkillId: 'ts_371', atkDisadvantageSkillId: 'ts_708', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_853', aptitude: 'leverage' , attackStyle: 'attack'},



    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_734', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_734', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_912', aptitude: 'leverage' , attackStyle: 'attack'},



    dada_ming_dayanhan: { generalId: 'dada_ming_dayanhan', tier: 'famous', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_489', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_489', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'attack' },



    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_739', disadvantageSkillId: 'ts_746', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_739', atkDisadvantageSkillId: 'ts_746', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_941', aptitude: 'leverage' , attackStyle: 'defense'},



    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_961', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage' , attackStyle: 'defense'},



    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'ordinary', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_455', balanceSkillId: 'ts_333', disadvantageSkillId: 'ts_981', atkBalanceSkillId: 'ts_333', atkAdvantageSkillId: 'ts_455', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_808', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：起兵破金军（金军具名）、建东辽附蒙　🔴[2026-11-01 主人令·四闸复核] 名将→普将：辽东一隅起兵，无具名敌帅之战区决战



    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_462', advantageSkillId: 'ts_462', balanceSkillId: 'ts_173', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_854', aptitude: 'reverse' , attackStyle: 'defense'},



    heisha_d_houlihu: { generalId: 'heisha_d_houlihu', tier: 'ordinary', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_994', aptitude: 'create' , attackStyle: 'attack'},



    hezhe_shaerhuda: { generalId: 'hezhe_shaerhuda', tier: 'ordinary', tacticalSkillId: 'ts_569', advantageSkillId: 'ts_569', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_984', atkAdvantageSkillId: 'ts_569', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_984', defAdvantageSkillId: 'ts_365', defBalanceSkillId: 'ts_990', defDisadvantageSkillId: 'ts_902', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：松花江之战歼罗刹（具名俄军）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：松花江歼俄属边境一隅，无战区级决战



    dawoer_baerdaqi: { generalId: 'dawoer_baerdaqi', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_1132', atkDisadvantageSkillId: 'ts_1132', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_1115', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_991', aptitude: 'leverage' , attackStyle: 'defense'},



    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_487', advantageSkillId: 'ts_487', balanceSkillId: 'ts_732', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_920', aptitude: 'create' , attackStyle: 'attack'},



    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_202', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_971', aptitude: 'reverse' , attackStyle: 'defense'},



    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse' , attackStyle: 'defense'},



    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_497', advantageSkillId: 'ts_497', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_776', defDisadvantageSkillId: 'ts_076', aptitude: 'leverage', attackStyle: 'defense' },



    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_988', atkBalanceSkillId: 'ts_841', atkAdvantageSkillId: 'ts_652', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_233', aptitude: 'leverage' , attackStyle: 'attack'},



    kuye_kuye_qichayi: { generalId: 'kuye_kuye_qichayi', tier: 'ordinary', tacticalSkillId: 'ts_510', advantageSkillId: 'ts_510', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_993', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_993', defAdvantageSkillId: 'ts_099', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_291', aptitude: 'create' , attackStyle: 'attack'},



    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_535', balanceSkillId: 'ts_260', disadvantageSkillId: 'ts_998', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_998', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_667', aptitude: 'leverage' , attackStyle: 'attack'},



    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_546', advantageSkillId: 'ts_546', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_104', aptitude: 'reverse' , attackStyle: 'defense'},



    maomingan_suoetu: { generalId: 'maomingan_suoetu', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_900', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_243', aptitude: 'leverage' , attackStyle: 'defense'},



    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_333', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_548', aptitude: 'create' , attackStyle: 'attack'},



    eluoke_amuhaer: { generalId: 'eluoke_amuhaer', tier: 'ordinary', tacticalSkillId: 'ts_558', advantageSkillId: 'ts_558', balanceSkillId: 'ts_063', disadvantageSkillId: 'ts_027', atkDisadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_063', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_784', aptitude: 'create' , attackStyle: 'attack'},



    nifuhe_baerhudai: { generalId: 'nifuhe_baerhudai', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_280', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_002', aptitude: 'reverse' , attackStyle: 'defense'},



    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_079', atkBalanceSkillId: 'ts_1110', atkAdvantageSkillId: 'ts_785', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_073', defDisadvantageSkillId: 'ts_012', aptitude: 'reverse' , attackStyle: 'defense'},



    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_095', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_013', aptitude: 'create' , attackStyle: 'attack'},



    woju_yinguan: { generalId: 'woju_yinguan', tier: 'ordinary', tacticalSkillId: 'ts_133', advantageSkillId: 'ts_133', balanceSkillId: 'ts_283', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_559', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_056', aptitude: 'create' , attackStyle: 'defense'}, // 拒契丹 → 擅守；🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 征女真拓九城，女真无具名主帅、拓边属头衔→普将



    luzhou_zhangwenxiu: { generalId: 'luzhou_zhangwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_992', advantageSkillId: 'ts_992', balanceSkillId: 'ts_309', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_992', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_084', aptitude: 'leverage' , attackStyle: 'attack'},



        jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_532', advantageSkillId: 'ts_532', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_532', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_076', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_154', aptitude: 'create' , attackStyle: 'attack'},



    wuzhou_limu: { generalId: 'wuzhou_limu', tier: 'famous', tacticalSkillId: 'ts_315', advantageSkillId: 'ts_315', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_241', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_130', defBalanceSkillId: 'ts_137', atkAdvantageSkillId: 'ts_315', defDisadvantageSkillId: 'ts_682', aptitude: 'leverage' , attackStyle: 'defense'}, // 障塞守边 + 破匈奴十万围歼/肥·番吾野战 → 双行



    ashina_ashinayandou: { generalId: 'ashina_ashinayandou', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_064', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_064', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_505', aptitude: 'create', attackStyle: 'attack' },



        // 🔴 [2026-11-08 新建] 马哈木（瓦剌绰罗斯部首领、顺宁王）：普将，骑射进攻型
        wala_mahamu: { generalId: 'wala_mahamu', tier: 'ordinary', tacticalSkillId: 'ts_626', advantageSkillId: 'ts_626', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_626', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_237', defAdvantageSkillId: 'ts_806', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_153', aptitude: 'leverage', attackStyle: 'attack' },
        wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_626', advantageSkillId: 'ts_626', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_626', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_237', defAdvantageSkillId: 'ts_806', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_153', aptitude: 'create' , attackStyle: 'attack'},



    yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_678', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_678', atkAdvantageSkillId: 'ts_850', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_081', aptitude: 'leverage', attackStyle: 'balanced' }, // 沙苑守反 + 收复河东/弘农 → 双行






    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_595', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_136', defDisadvantageSkillId: 'ts_231', aptitude: 'leverage' , attackStyle: 'defense'},



    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_808', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_808', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_637', aptitude: 'leverage' , attackStyle: 'defense'},



    jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_535', balanceSkillId: 'ts_155', disadvantageSkillId: 'ts_534', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_534', defAdvantageSkillId: 'ts_536', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_116', aptitude: 'create', attackStyle: 'attack' },



        liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_622', advantageSkillId: 'ts_622', balanceSkillId: 'ts_229', disadvantageSkillId: 'ts_233', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_233', atkAdvantageSkillId: 'ts_622', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_561', aptitude: 'create' , attackStyle: 'attack'},



        yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_119', advantageSkillId: 'ts_119', balanceSkillId: 'ts_256', disadvantageSkillId: 'ts_084', atkAdvantageSkillId: 'ts_119', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_084', defAdvantageSkillId: 'ts_575', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_661', aptitude: 'leverage' , attackStyle: 'attack'}, // 高梁河两翼包抄、长途突击 → 擅攻



    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_236', aptitude: 'reverse' , attackStyle: 'defense'},



    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_061', defDisadvantageSkillId: 'ts_254', aptitude: 'leverage' , attackStyle: 'attack'},



    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_681', disadvantageSkillId: 'ts_680', atkDisadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_681', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_228', aptitude: 'create' , attackStyle: 'attack'},



        ogodei_chuoermahan: { generalId: 'ogodei_chuoermahan', tier: 'famous', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_576', disadvantageSkillId: 'ts_578', atkBalanceSkillId: 'ts_576', defBalanceSkillId: 'ts_1104', atkAdvantageSkillId: 'ts_059', atkDisadvantageSkillId: 'ts_578', defAdvantageSkillId: 'ts_026', defDisadvantageSkillId: 'ts_994', aptitude: 'create' , attackStyle: 'attack'},



    merkit_boyan: { generalId: 'merkit_boyan', tier: 'famous', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_110', defDisadvantageSkillId: 'ts_107', aptitude: 'create' , attackStyle: 'attack'},



        tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_622', advantageSkillId: 'ts_622', balanceSkillId: 'ts_124', disadvantageSkillId: 'ts_621', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_124', defBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_621', defAdvantageSkillId: 'ts_057', defDisadvantageSkillId: 'ts_607', aptitude: 'create' , attackStyle: 'attack'},



    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_122', aptitude: 'leverage' , attackStyle: 'attack'},



        xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_644', atkDisadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_1105', defAdvantageSkillId: 'ts_244', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_125', aptitude: 'create' , attackStyle: 'attack'},



    xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage', attackStyle: 'attack' },



    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_606', atkAdvantageSkillId: 'ts_086', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_236', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_120', aptitude: 'create' , attackStyle: 'balanced'}, // 野战攻守兼备 → 双行



    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_209', defAdvantageSkillId: 'ts_301', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_591', advantageSkillId: 'ts_591', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_178', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_123', aptitude: 'create' , attackStyle: 'attack'},



    mengwu_hebulehan: { generalId: 'mengwu_hebulehan', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_288', disadvantageSkillId: 'ts_134', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_134', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_131', aptitude: 'leverage' , attackStyle: 'attack'},



    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'ts_597', advantageSkillId: 'ts_597', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_514', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_369', aptitude: 'leverage' , attackStyle: 'attack'},



    shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_609', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_606', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_607', aptitude: 'create', attackStyle: 'attack' },



    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_244', balanceSkillId: 'ts_576', disadvantageSkillId: 'ts_144', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_144', defAdvantageSkillId: 'ts_011', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_142', aptitude: 'create', attackStyle: 'attack' },



        huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'ts_133', advantageSkillId: 'ts_133', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_619', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_152', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_432', disadvantageSkillId: 'ts_762', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'attack'}, // 阵地/八阵与北伐步步为营，攻守辩证 → 双行



    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_356', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_356', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'attack'},



    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_139', defDisadvantageSkillId: 'ts_313', aptitude: 'leverage' , attackStyle: 'defense'},



    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_129', defDisadvantageSkillId: 'ts_169', aptitude: 'leverage' , attackStyle: 'attack'},



    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_150', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_181', aptitude: 'reverse' , attackStyle: 'defense'},



    zhasaketu_zhasakesubadi: { generalId: 'zhasaketu_zhasakesubadi', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_180', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_186', aptitude: 'reverse' , attackStyle: 'defense'},



    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_796', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_192', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：屡破柔然（柔然可汗具名）·建高车国



        tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_618', advantageSkillId: 'ts_618', balanceSkillId: 'ts_326', disadvantageSkillId: 'ts_620', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_326', atkDisadvantageSkillId: 'ts_620', defAdvantageSkillId: 'ts_685', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_193', aptitude: 'create' , attackStyle: 'attack'},



        da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_487', advantageSkillId: 'ts_487', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_182', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_214', aptitude: 'create' , attackStyle: 'balanced'}, // 北元攻守 → 双行



    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'ordinary', tacticalSkillId: 'ts_694', advantageSkillId: 'ts_694', balanceSkillId: 'ts_137', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_694', atkBalanceSkillId: 'ts_137', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_187', aptitude: 'leverage' , attackStyle: 'attack'},



    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'famous', tacticalSkillId: 'ts_751', advantageSkillId: 'ts_751', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_217', atkAdvantageSkillId: 'ts_751', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_217', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_191', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：马鬣山五千破突厥十万（《旧唐书》：颉利遣子欲谷设率十万骑讨之，菩萨身将五千骑破之——敌帅具名）



    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_791', balanceSkillId: 'ts_174', disadvantageSkillId: 'ts_231', atkAdvantageSkillId: 'ts_791', atkDisadvantageSkillId: 'ts_231', atkBalanceSkillId: 'ts_174', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'attack'},



    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_199', disadvantageSkillId: 'ts_224', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_224', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_200', aptitude: 'leverage', attackStyle: 'defense' },



    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'famous', tacticalSkillId: 'ts_141', advantageSkillId: 'ts_141', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_228', atkAdvantageSkillId: 'ts_141', atkDisadvantageSkillId: 'ts_228', atkBalanceSkillId: 'ts_367', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_206', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：破东蒙古阿鲁台（具名）·统一卫拉特



    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_080', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_080', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_207', aptitude: 'create', attackStyle: 'attack' },



    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_382', disadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_382', atkDisadvantageSkillId: 'ts_225', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_216', aptitude: 'leverage' , attackStyle: 'attack'},



    cheshihou_angui: { generalId: 'cheshihou_angui', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_234', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_226', aptitude: 'reverse' , attackStyle: 'defense'},



    kaerka_abadaihan: { generalId: 'kaerka_abadaihan', tier: 'ordinary', tacticalSkillId: 'ts_812', advantageSkillId: 'ts_812', balanceSkillId: 'ts_248', disadvantageSkillId: 'ts_238', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_238', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_230', aptitude: 'leverage' , attackStyle: 'attack'},



    huyan_peicen: { generalId: 'huyan_peicen', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_506', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_249', aptitude: 'leverage' , attackStyle: 'attack'},



    chahar_yantiemuer: { generalId: 'chahar_yantiemuer', tier: 'famous', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_227', atkBalanceSkillId: 'ts_468', atkAdvantageSkillId: 'ts_210', atkDisadvantageSkillId: 'ts_227', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_623', aptitude: 'create', attackStyle: 'attack' },



    ongut_alawusi: { generalId: 'ongut_alawusi', tier: 'ordinary', tacticalSkillId: 'ts_813', advantageSkillId: 'ts_813', balanceSkillId: 'ts_264', disadvantageSkillId: 'ts_241', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_664', aptitude: 'leverage' , attackStyle: 'attack'},



        rouran_shelun: { generalId: 'rouran_shelun', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_595', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_138', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_596', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 统一漠北建柔然＝开国头衔、无具名大捷→普将



    chagatai_genggong: { generalId: 'chagatai_genggong', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_368', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_386', aptitude: 'reverse', attackStyle: 'defense' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 疏勒死守属局部殉守未改大局、未击退敌帅（守将准则）→普将
    // 姑句（车师后王，普将；史无战功记载 → 通用技）
    chagatai_gouju: { generalId: 'chagatai_gouju', tier: 'ordinary', tacticalSkillId: 'ts_831', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_368', defDisadvantageSkillId: 'ts_736', aptitude: 'create', attackStyle: 'attack' },



    huihu_dunmohedagan: { generalId: 'huihu_dunmohedagan', tier: 'ordinary', tacticalSkillId: 'ts_870', advantageSkillId: 'ts_870', balanceSkillId: 'ts_438', disadvantageSkillId: 'ts_255', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_255', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_263', aptitude: 'leverage' , attackStyle: 'attack'},



    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_901', advantageSkillId: 'ts_901', balanceSkillId: 'ts_516', disadvantageSkillId: 'ts_261', atkAdvantageSkillId: 'ts_901', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_261', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage' , attackStyle: 'attack'},



    pugu_ashinaguduolu: { generalId: 'pugu_ashinaguduolu', tier: 'famous', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_281', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_268', aptitude: 'create' , attackStyle: 'attack'},



    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_239', advantageSkillId: 'ts_239', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },



    xibo_d_tubote: { generalId: 'xibo_d_tubote', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_295', aptitude: 'reverse' , attackStyle: 'defense'},



    borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_153', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_080', aptitude: 'create', attackStyle: 'attack' },



    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'ts_911', advantageSkillId: 'ts_911', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_247', atkBalanceSkillId: 'ts_1115', atkAdvantageSkillId: 'ts_911', atkDisadvantageSkillId: 'ts_247', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_307', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：十三翼之战胜铁木真（具名）
    // 2026-07-27 补中东四城+苏萨
    ailan_shuteluke: { generalId: 'ailan_shuteluke', tier: 'famous', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_338', atkDisadvantageSkillId: 'ts_338', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_377', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_502', aptitude: 'create', attackStyle: 'attack' },
    kesa_bulan: { generalId: 'kesa_bulan', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_498', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_494', atkDisadvantageSkillId: 'ts_498', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_533', aptitude: 'leverage', attackStyle: 'attack' },
    aiaoniya_alisita: { generalId: 'aiaoniya_alisita', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_090', aptitude: 'reverse', attackStyle: 'defense' },
    jialatai_deaota: { generalId: 'jialatai_deaota', tier: 'ordinary', tacticalSkillId: 'ts_940', advantageSkillId: 'ts_940', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_323', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_323', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_271', aptitude: 'leverage', attackStyle: 'attack' },
    guyashu_shamushi: { generalId: 'guyashu_shamushi', tier: 'famous', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_272', aptitude: 'create', attackStyle: 'attack' },



    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_274', aptitude: 'reverse' , attackStyle: 'defense'},



    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_551', disadvantageSkillId: 'ts_383', atkDisadvantageSkillId: 'ts_383', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_551', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_277', aptitude: 'leverage', attackStyle: 'defense' },



    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_789', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_387', atkAdvantageSkillId: 'ts_789', atkBalanceSkillId: 'ts_520', atkDisadvantageSkillId: 'ts_387', defAdvantageSkillId: 'ts_443', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_287', aptitude: 'reverse' , attackStyle: 'defense'},



    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_524', disadvantageSkillId: 'ts_435', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_423', aptitude: 'leverage', attackStyle: 'attack' },



    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_440', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_292', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 「屡破辽军」无具名锚战（存疑列普将）



    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_987', advantageSkillId: 'ts_987', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_987', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_678', aptitude: 'leverage', attackStyle: 'defense' },



    baidi_baidizi: { generalId: 'baidi_baidizi', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_992', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_450', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_227', aptitude: 'reverse', attackStyle: 'attack' },



    shiwei_saihou: { generalId: 'shiwei_saihou', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_460', aptitude: 'reverse' , attackStyle: 'defense'},



    sunite_sousai: { generalId: 'sunite_sousai', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_124', disadvantageSkillId: 'ts_297', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_297', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_464', aptitude: 'reverse' , attackStyle: 'defense'},



            bulat_beiduanchaer: { generalId: 'bulat_beiduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_302', atkBalanceSkillId: 'ts_1125', atkAdvantageSkillId: 'ts_554', atkDisadvantageSkillId: 'ts_302', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_567', defDisadvantageSkillId: 'ts_470', aptitude: 'create' , attackStyle: 'attack'},



    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_317', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_317', defAdvantageSkillId: 'ts_311', defBalanceSkillId: 'ts_557', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage' , attackStyle: 'attack'},



    hepan_gaoxianzhi: { generalId: 'hepan_gaoxianzhi', tier: 'famous', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_321', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_321', defAdvantageSkillId: 'ts_312', defBalanceSkillId: 'ts_614', defDisadvantageSkillId: 'ts_482', aptitude: 'create', attackStyle: 'attack' },



    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_331', aptitude: 'leverage', attackStyle: 'attack' },



    kepantuo_dulimi: { generalId: 'kepantuo_dulimi', tier: 'ordinary', tacticalSkillId: 'ts_296', advantageSkillId: 'ts_296', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_296', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_334', aptitude: 'leverage' , attackStyle: 'defense'},



    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_337', aptitude: 'leverage' , attackStyle: 'attack'},



    tuoming_tuomin: { generalId: 'tuoming_tuomin', tier: 'ordinary', tacticalSkillId: 'ts_339', advantageSkillId: 'ts_339', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_610', defDisadvantageSkillId: 'ts_345', aptitude: 'leverage' , attackStyle: 'attack'},



    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_141', advantageSkillId: 'ts_141', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_581', atkBalanceSkillId: 'ts_700', atkAdvantageSkillId: 'ts_141', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_351', aptitude: 'create' , attackStyle: 'attack'},



    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_359', aptitude: 'create' , attackStyle: 'attack'},



    pisha_weichisheng: { generalId: 'pisha_weichisheng', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_373', aptitude: 'leverage', attackStyle: 'attack' },



    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'famous', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_015', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_782', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_386', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-25 主人令按标准修复] 普将→名将：安西都护，夜袭焉耆虏其王、昆丘道副大总管平龟兹（《旧唐书·卷八三·郭孝恪传》）



    yangguan_lihao: { generalId: 'yangguan_lihao', tier: 'ordinary', tacticalSkillId: 'ts_426', advantageSkillId: 'ts_426', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_426', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_785', defBalanceSkillId: 'ts_696', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },



    wulianghai_chelingwubashen: { generalId: 'wulianghai_chelingwubashen', tier: 'ordinary', tacticalSkillId: 'ts_126', advantageSkillId: 'ts_126', balanceSkillId: 'ts_702', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_126', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_487', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_601', aptitude: 'reverse' , attackStyle: 'defense'},



            shache_xian_suoche_shachexian: { generalId: 'shache_xian_suoche_shachexian', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_782', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_422', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_671', aptitude: 'leverage' , attackStyle: 'attack'},



    shule_aersilan: { generalId: 'shule_aersilan', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_429', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_429', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_674', aptitude: 'create' , attackStyle: 'attack'},



    dzungar_galedanceling: { generalId: 'dzungar_galedanceling', tier: 'famous', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_431', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_506', defDisadvantageSkillId: 'ts_505', aptitude: 'create', attackStyle: 'attack' },



    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'ordinary', tacticalSkillId: 'ts_496', advantageSkillId: 'ts_496', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_496', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_296', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_427', aptitude: 'reverse', attackStyle: 'defense' },



    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_036', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_752', defDisadvantageSkillId: 'ts_451', aptitude: 'leverage' , attackStyle: 'defense'},



    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_039', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_732', defDisadvantageSkillId: 'ts_457', aptitude: 'leverage', attackStyle: 'attack' },






    yarkand_abudulatifu: { generalId: 'yarkand_abudulatifu', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_459', aptitude: 'leverage' , attackStyle: 'attack'},



    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_147', disadvantageSkillId: 'ts_720', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_720', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_463', aptitude: 'leverage' , attackStyle: 'attack'},



    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_930', disadvantageSkillId: 'ts_729', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_930', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_536', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_479', aptitude: 'leverage' , attackStyle: 'defense'},



    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_990', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_990', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_483', aptitude: 'leverage' , attackStyle: 'attack'},



    kala_satuke: { generalId: 'kala_satuke', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_747', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_492', aptitude: 'leverage' , attackStyle: 'attack'},



    an_xibanni: { generalId: 'an_xibanni', tier: 'famous', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_070', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_756', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_756', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_087', aptitude: 'create', attackStyle: 'attack' },



    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_776', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_776', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_762', aptitude: 'leverage' , attackStyle: 'attack'},



    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_111', balanceSkillId: 'ts_176', disadvantageSkillId: 'ts_313', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_313', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_777', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 破大月氏无具名敌帅→普将



    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_312', advantageSkillId: 'ts_312', balanceSkillId: 'ts_202', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_130', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_788', aptitude: 'create' , attackStyle: 'attack'},



    xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_512', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_512', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_841', defDisadvantageSkillId: 'ts_790', aptitude: 'create', attackStyle: 'attack' },



    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_518', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_900', defDisadvantageSkillId: 'ts_801', aptitude: 'create' , attackStyle: 'attack'},



    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_251', disadvantageSkillId: 'ts_534', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_534', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_830', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 贵霜盛世扩张＝纯头衔、无具名胜→普将
    babuer_babuer: { generalId: 'babuer_babuer', tier: 'famous', tacticalSkillId: 'ts_011', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_091', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_840', aptitude: 'create', attackStyle: 'attack' },
    danmai_abusalong: { generalId: 'danmai_abusalong', tier: 'famous', tacticalSkillId: 'ts_025', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_543', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_853', aptitude: 'create', attackStyle: 'attack' },
    kasidiliya_afangsuoshiyi: { generalId: 'kasidiliya_afangsuoshiyi', tier: 'famous', tacticalSkillId: 'ts_044', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_573', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_912', aptitude: 'create', attackStyle: 'attack' },
    ruidian_si_biergeyaer: { generalId: 'ruidian_si_biergeyaer', tier: 'ordinary', tacticalSkillId: 'ts_054', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'defense' },
    duluo_sangqiao: { generalId: 'duluo_sangqiao', tier: 'ordinary', tacticalSkillId: 'ts_059', atkAdvantageSkillId: 'ts_059', defAdvantageSkillId: 'ts_421', atkBalanceSkillId: 'ts_757', defBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_1131', defDisadvantageSkillId: 'ts_941', aptitude: 'create', attackStyle: 'attack' },
    teluoyi_heketuoer: { generalId: 'teluoyi_heketuoer', tier: 'ordinary', tacticalSkillId: 'ts_060', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_961', aptitude: 'leverage', attackStyle: 'defense' },
    alabo_qiyade: { generalId: 'alabo_qiyade', tier: 'ordinary', tacticalSkillId: 'ts_066', atkAdvantageSkillId: 'ts_066', defAdvantageSkillId: 'ts_517', atkBalanceSkillId: 'ts_757', defBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_388', defDisadvantageSkillId: 'ts_981', aptitude: 'leverage', attackStyle: 'attack' },



    xijue_ganyanshou: { generalId: 'xijue_ganyanshou', tier: 'ordinary', tacticalSkillId: 'ts_532', advantageSkillId: 'ts_532', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_984', atkAdvantageSkillId: 'ts_532', atkBalanceSkillId: 'ts_507', atkDisadvantageSkillId: 'ts_984', defAdvantageSkillId: 'ts_066', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_582', aptitude: 'leverage', attackStyle: 'attack' },



    huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_556', advantageSkillId: 'ts_556', balanceSkillId: 'ts_139', disadvantageSkillId: 'ts_527', atkAdvantageSkillId: 'ts_556', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_527', defAdvantageSkillId: 'ts_163', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_586', aptitude: 'create', attackStyle: 'attack' },



        kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_549', atkBalanceSkillId: 'ts_757', atkAdvantageSkillId: 'ts_074', atkDisadvantageSkillId: 'ts_549', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_612', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：破昔班尼（具名）·统一哈萨克



    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_645', aptitude: 'leverage' , attackStyle: 'defense'},



    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_646', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 入侵征服西北印度＝扩张头衔、无具名胜→普将



    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_170', advantageSkillId: 'ts_170', balanceSkillId: 'ts_309', disadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_651', aptitude: 'create' , attackStyle: 'attack'},



    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_683', advantageSkillId: 'ts_683', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_683', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_1000', aptitude: 'reverse', attackStyle: 'defense' },



    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_095', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_209', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_701', aptitude: 'leverage' , attackStyle: 'defense'},



    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_063', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse' , attackStyle: 'defense'},



    mamon_mameng: { generalId: 'mamon_mameng', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_139', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_750', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_680', aptitude: 'leverage' , attackStyle: 'attack'},



    khoja_apakehezhuo: { generalId: 'khoja_apakehezhuo', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_356', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_356', atkDisadvantageSkillId: 'ts_662', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_027', aptitude: 'leverage', attackStyle: 'attack' },



            fanyanna_xieer: { generalId: 'fanyanna_xieer', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_506', disadvantageSkillId: 'ts_684', atkDisadvantageSkillId: 'ts_684', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_506', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_1133', aptitude: 'reverse' , attackStyle: 'defense'},



    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_698', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_698', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_085', defDisadvantageSkillId: 'ts_058', aptitude: 'reverse' , attackStyle: 'attack'},



    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_073', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_706', aptitude: 'leverage' , attackStyle: 'defense'},



    qiepantuo_luozhentan: { generalId: 'qiepantuo_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_102', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_102', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_708', aptitude: 'reverse' , attackStyle: 'defense'},



    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_734', aptitude: 'reverse' , attackStyle: 'defense'},



    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_309', disadvantageSkillId: 'ts_543', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_543', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_984', aptitude: 'reverse' , attackStyle: 'balanced'},



    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_264', disadvantageSkillId: 'ts_277', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_277', atkAdvantageSkillId: 'ts_652', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_715', aptitude: 'create' , attackStyle: 'attack'},



    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_746', aptitude: 'reverse' , attackStyle: 'defense'},



    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_284', advantageSkillId: 'ts_284', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_177', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_781', aptitude: 'leverage' , attackStyle: 'balanced'}, // 碎叶等用计攻抚 → 双行



    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_369', atkDisadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_378', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage', attackStyle: 'defense' },



    heyuan_d_heichichangzhi: { generalId: 'heyuan_d_heichichangzhi', tier: 'famous', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_854', aptitude: 'leverage' , attackStyle: 'balanced'}, // 百济唐将攻守 → 双行



    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_265', advantageSkillId: 'ts_265', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_131', atkDisadvantageSkillId: 'ts_131', defDisadvantageSkillId: 'ts_297', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_1106', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_467', aptitude: 'create', attackStyle: 'attack' },



        gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_1133', atkBalanceSkillId: 'ts_520', atkAdvantageSkillId: 'ts_335', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_902', aptitude: 'create' , attackStyle: 'attack'},



    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_198', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_252', defDisadvantageSkillId: 'ts_920', aptitude: 'leverage' , attackStyle: 'attack'},



    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_215', advantageSkillId: 'ts_215', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_520', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_288', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_116', aptitude: 'leverage' , attackStyle: 'defense'},



        gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_515', advantageSkillId: 'ts_515', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_515', atkDisadvantageSkillId: 'ts_514', atkBalanceSkillId: 'ts_1107', defAdvantageSkillId: 'ts_365', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_123', aptitude: 'create' , attackStyle: 'balanced'}, // 对唐攻守 → 双行



    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_971', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_971', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_233', aptitude: 'leverage', attackStyle: 'attack' },



    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_622', advantageSkillId: 'ts_622', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_988', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_298', aptitude: 'create' , attackStyle: 'attack'},



    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_326', disadvantageSkillId: 'ts_993', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_326', atkDisadvantageSkillId: 'ts_993', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_545', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 称汗扩张称雄青海＝纯头衔、无具名胜→普将



    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_131', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_998', aptitude: 'create' , attackStyle: 'attack'},



    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_142', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_514', aptitude: 'leverage' , attackStyle: 'defense'},



    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'ts_220', advantageSkillId: 'ts_220', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_002', aptitude: 'reverse' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 诸羌共主称帝，破汉军战役多由各部执行、亲统决断存疑（存疑列普）



    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_239', advantageSkillId: 'ts_239', balanceSkillId: 'ts_516', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_012', aptitude: 'create' , attackStyle: 'attack'},



    xiutu_jinridi: { generalId: 'xiutu_jinridi', tier: 'ordinary', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_155', defDisadvantageSkillId: 'ts_013', aptitude: 'leverage' , attackStyle: 'defense'},



            gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_150', defBalanceSkillId: 'ts_136', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_983', defDisadvantageSkillId: 'ts_056', aptitude: 'leverage' , attackStyle: 'defense'},



    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_153', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_137', defDisadvantageSkillId: 'ts_084', aptitude: 'create' , attackStyle: 'attack'},



    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_1133', atkDisadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_529', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_104', aptitude: 'leverage' , attackStyle: 'attack'},



    guangwu_xinwuxian: { generalId: 'guangwu_xinwuxian', tier: 'famous', tacticalSkillId: 'ts_250', advantageSkillId: 'ts_250', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_272', aptitude: 'create' , attackStyle: 'attack'},






    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_328', defDisadvantageSkillId: 'ts_180', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 统一卫藏建藏巴汗＝纯头衔、无具名胜→普将



    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_258', advantageSkillId: 'ts_258', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_107', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_182', aptitude: 'create' , attackStyle: 'attack'},



    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_174', disadvantageSkillId: 'ts_122', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_174', atkDisadvantageSkillId: 'ts_122', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_187', aptitude: 'leverage' , attackStyle: 'defense'},



    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_125', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_125', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_1133', aptitude: 'reverse' , attackStyle: 'defense'},



    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_199', disadvantageSkillId: 'ts_384', atkDisadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_199', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_615', aptitude: 'reverse', attackStyle: 'defense' },



    humi_zhentan: { generalId: 'humi_zhentan', tier: 'ordinary', tacticalSkillId: 'ts_349', advantageSkillId: 'ts_349', balanceSkillId: 'ts_229', disadvantageSkillId: 'ts_191', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_134', aptitude: 'reverse' , attackStyle: 'defense'},



    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'ordinary', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_382', disadvantageSkillId: 'ts_200', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_382', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_144', aptitude: 'leverage', attackStyle: 'attack' },



    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_455', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_152', aptitude: 'reverse' , attackStyle: 'defense'},



    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_248', disadvantageSkillId: 'ts_206', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_206', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'defense'},



    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'famous', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_256', disadvantageSkillId: 'ts_207', atkBalanceSkillId: 'ts_256', atkAdvantageSkillId: 'ts_668', atkDisadvantageSkillId: 'ts_207', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_068', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 白皮书：1679–84 统蒙藏联军征拉达克、围列城迫其王求和复阿里（拉达克王具名）——战区级实胜



    gaoliang_geshuhan: { generalId: 'gaoliang_geshuhan', tier: 'famous', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_609', balanceSkillId: 'ts_602', disadvantageSkillId: 'ts_711', atkBalanceSkillId: 'ts_602', atkAdvantageSkillId: 'ts_609', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_277', aptitude: 'leverage' , attackStyle: 'defense'}, // 陇右守边成名；出潼关攻败 → 擅守；三势借势



    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_216', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_216', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_169', aptitude: 'leverage' , attackStyle: 'defense'},



    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_231', atkBalanceSkillId: 'ts_675', atkAdvantageSkillId: 'ts_749', atkDisadvantageSkillId: 'ts_231', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_103', aptitude: 'leverage', attackStyle: 'defense' },



            jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_333', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_234', aptitude: 'leverage' , attackStyle: 'defense'},



    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_462', advantageSkillId: 'ts_462', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_181', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_181', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_238', aptitude: 'leverage' , attackStyle: 'defense'},



    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_186', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_186', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_241', aptitude: 'leverage' , attackStyle: 'defense'},



    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_192', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_192', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_438', defDisadvantageSkillId: 'ts_255', aptitude: 'leverage' , attackStyle: 'defense'},



    gongtang_gongtangcang: { generalId: 'gongtang_gongtangcang', tier: 'ordinary', tacticalSkillId: 'ts_500', advantageSkillId: 'ts_500', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_1132', atkAdvantageSkillId: 'ts_500', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_1132', defAdvantageSkillId: 'ts_154', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage' , attackStyle: 'defense'},



    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_193', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_193', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_281', aptitude: 'reverse' , attackStyle: 'defense'},



    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_450', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_268', aptitude: 'create', attackStyle: 'balanced' }, // 南中镇抚攻守 → 双行



    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_485', disadvantageSkillId: 'ts_581', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_485', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_271', aptitude: 'create' , attackStyle: 'defense'}, // 南中镇守 → 双行；🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 平越巂诸夷＝治安战→普将





    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_368', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_292', aptitude: 'leverage' , attackStyle: 'defense'},



    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_497', advantageSkillId: 'ts_497', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_291', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_614', defDisadvantageSkillId: 'ts_612', aptitude: 'leverage' , attackStyle: 'attack'},



    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_437', aptitude: 'reverse', attackStyle: 'attack' },



    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_297', aptitude: 'leverage' , attackStyle: 'attack'},



    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_855', disadvantageSkillId: 'ts_981', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_334', aptitude: 'leverage' , attackStyle: 'attack'},



    dali_duansiping: { generalId: 'dali_duansiping', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_473', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_295', aptitude: 'reverse', attackStyle: 'defense' },



    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_1133', atkDisadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_494', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_214', aptitude: 'create' , attackStyle: 'attack'},
    meitai_hagenba: { generalId: 'meitai_hagenba', tier: 'ordinary', tacticalSkillId: 'ts_510', advantageSkillId: 'ts_510', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_307', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_441', defDisadvantageSkillId: 'ts_217', aptitude: 'leverage', attackStyle: 'attack' },



    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_323', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_323', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_448', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_1131', defBalanceSkillId: 'ts_942', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_724', defDisadvantageSkillId: 'ts_383', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 王滇建国＝头衔、远征略地无具名胜→普将



        konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_556', advantageSkillId: 'ts_556', balanceSkillId: 'ts_557', disadvantageSkillId: 'ts_224', atkAdvantageSkillId: 'ts_556', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_224', defAdvantageSkillId: 'ts_522', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_387', aptitude: 'create' , attackStyle: 'attack'},



        hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_522', advantageSkillId: 'ts_522', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_225', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_524', defDisadvantageSkillId: 'ts_142', aptitude: 'create' , attackStyle: 'attack'},



    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_268', atkDisadvantageSkillId: 'ts_268', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_1122', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_435', aptitude: 'leverage' , attackStyle: 'balanced'},



    wuman_gaipin: { generalId: 'wuman_gaipin', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_791', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_492', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_492', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_440', aptitude: 'leverage' , attackStyle: 'defense'},



    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_226', defDisadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_226', defAdvantageSkillId: 'ts_099', defBalanceSkillId: 'ts_1109', aptitude: 'leverage' , attackStyle: 'defense'},



    taiyuan_menglai: { generalId: 'taiyuan_menglai', tier: 'famous', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_535', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_464', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_464', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_228', aptitude: 'create' , attackStyle: 'attack'},



    suke_langanheng: { generalId: 'suke_langanheng', tier: 'ordinary', tacticalSkillId: 'ts_546', advantageSkillId: 'ts_546', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_524', defDisadvantageSkillId: 'ts_230', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 扩张素可泰＝头衔、无具名胜→普将



    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_470', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_470', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_557', defDisadvantageSkillId: 'ts_236', aptitude: 'reverse' , attackStyle: 'attack'},



    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_477', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_477', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_518', aptitude: 'reverse' , attackStyle: 'defense'},



    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_662', atkDisadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_754', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_482', aptitude: 'leverage' , attackStyle: 'defense'},



            baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_992', advantageSkillId: 'ts_992', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_1133', atkAdvantageSkillId: 'ts_992', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_558', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_127', aptitude: 'leverage' , attackStyle: 'attack'},



            champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'famous', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_551', disadvantageSkillId: 'ts_502', atkBalanceSkillId: 'ts_551', atkAdvantageSkillId: 'ts_787', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_237', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：屡破大越、攻陷昇龙（陈朝具名）



    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_734', aptitude: 'leverage', attackStyle: 'attack' },



    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_381', atkBalanceSkillId: 'ts_710', atkAdvantageSkillId: 'ts_982', atkDisadvantageSkillId: 'ts_381', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_331', aptitude: 'leverage' , attackStyle: 'attack'},



    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_559', advantageSkillId: 'ts_559', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_533', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_685', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_178', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_756', aptitude: 'leverage' , attackStyle: 'defense'},



    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_831', advantageSkillId: 'ts_831', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_582', defBalanceSkillId: 'ts_1123', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_582', defAdvantageSkillId: 'ts_436', defDisadvantageSkillId: 'ts_801', aptitude: 'leverage' , attackStyle: 'defense'},



    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_696', disadvantageSkillId: 'ts_483', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_483', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_565', aptitude: 'reverse' , attackStyle: 'defense'},



    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_097', disadvantageSkillId: 'ts_466', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_097', atkDisadvantageSkillId: 'ts_466', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_574', aptitude: 'reverse', attackStyle: 'defense' },



    leizhou_limao: { generalId: 'leizhou_limao', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_830', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_684', aptitude: 'reverse' , attackStyle: 'defense'},



    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_987', advantageSkillId: 'ts_987', balanceSkillId: 'ts_702', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_987', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_263', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizhen_qudaren: { generalId: 'shuizhen_qudaren', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_243', aptitude: 'reverse' , attackStyle: 'defense'},



    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_700', defDisadvantageSkillId: 'ts_706', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 统一三山建尚氏＝纯头衔、无具名胜→普将



    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'ordinary', tacticalSkillId: 'ts_911', advantageSkillId: 'ts_911', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_912', atkAdvantageSkillId: 'ts_911', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_912', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_752', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage' , attackStyle: 'defense'},



    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_592', atkBalanceSkillId: 'ts_1125', atkAdvantageSkillId: 'ts_083', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_732', defDisadvantageSkillId: 'ts_249', aptitude: 'reverse', attackStyle: 'defense' },



    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_575', advantageSkillId: 'ts_575', balanceSkillId: 'ts_776', disadvantageSkillId: 'ts_601', atkBalanceSkillId: 'ts_776', atkAdvantageSkillId: 'ts_575', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_254', aptitude: 'leverage' , attackStyle: 'attack'},



    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_065', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_606', atkAdvantageSkillId: 'ts_065', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_591', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage' , attackStyle: 'attack'},



    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_597', advantageSkillId: 'ts_597', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_637', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_274', aptitude: 'leverage' , attackStyle: 'attack'},



    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_260', disadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },



    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_667', aptitude: 'leverage' , attackStyle: 'defense'},



    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'ordinary', tacticalSkillId: 'ts_619', advantageSkillId: 'ts_619', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_287', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_287', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_671', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准改档] 白皮书：平十二使君统交趾一隅



    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_302', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_302', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_711', aptitude: 'leverage' , attackStyle: 'defense'},



    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_347', advantageSkillId: 'ts_347', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_345', atkAdvantageSkillId: 'ts_347', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_345', defAdvantageSkillId: 'ts_749', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_984', aptitude: 'leverage' , attackStyle: 'balanced'}, // 复台进攻 + 厦门保卫 → 双行



    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_147', disadvantageSkillId: 'ts_674', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_313', aptitude: 'leverage' , attackStyle: 'attack'},



    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'ordinary', tacticalSkillId: 'ts_694', advantageSkillId: 'ts_694', balanceSkillId: 'ts_156', disadvantageSkillId: 'ts_323', atkDisadvantageSkillId: 'ts_323', atkAdvantageSkillId: 'ts_694', atkBalanceSkillId: 'ts_156', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_317', aptitude: 'leverage' , attackStyle: 'attack'},



    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1126', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_900', defDisadvantageSkillId: 'ts_321', aptitude: 'create' , attackStyle: 'balanced'}, // 南越开国攻守 → 双行



    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_483', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_483', atkAdvantageSkillId: 'ts_154', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_696', defDisadvantageSkillId: 'ts_303', aptitude: 'leverage' , attackStyle: 'defense'},



    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_173', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_337', aptitude: 'leverage' , attackStyle: 'defense'},



    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_138', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_930', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_931', aptitude: 'reverse' , attackStyle: 'attack'}, // 破秦攻城野战 + 巨鹿等绝境胜 → 双行



    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_202', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_351', aptitude: 'leverage' , attackStyle: 'attack'},



    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'famous', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_359', atkDisadvantageSkillId: 'ts_359', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_720', aptitude: 'create', attackStyle: 'balanced' }, // 平侯景攻 + 建康抗北齐守 → 双行



    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_990', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_990', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_543', aptitude: 'leverage' , attackStyle: 'attack'},



    paiyao_huangguasi: { generalId: 'paiyao_huangguasi', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_373', aptitude: 'leverage' , attackStyle: 'attack'},



    yingzhou_liuyan: { generalId: 'yingzhou_liuyan', tier: 'ordinary', tacticalSkillId: 'ts_751', advantageSkillId: 'ts_751', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_348', atkBalanceSkillId: 'ts_1122', atkAdvantageSkillId: 'ts_751', atkDisadvantageSkillId: 'ts_348', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_248', defDisadvantageSkillId: 'ts_386', aptitude: 'leverage' , attackStyle: 'attack'},



    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_729', aptitude: 'leverage' , attackStyle: 'attack'},



    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_251', disadvantageSkillId: 'ts_429', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_429', defAdvantageSkillId: 'ts_244', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_747', aptitude: 'create' , attackStyle: 'balanced'}, // 保境兼讨伐 → 双行



    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_431', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_762', aptitude: 'leverage' , attackStyle: 'defense'},



    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'famous', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_063', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_777', aptitude: 'create' , attackStyle: 'attack'},



    taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_685', balanceSkillId: 'ts_752', disadvantageSkillId: 'ts_684', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_752', atkDisadvantageSkillId: 'ts_684', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_075', aptitude: 'create', attackStyle: 'balanced' }, // 太平天国攻守转战 → 双行



    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_073', disadvantageSkillId: 'ts_840', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_840', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_457', aptitude: 'leverage' , attackStyle: 'attack'},



    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_095', disadvantageSkillId: 'ts_853', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_280', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_459', aptitude: 'leverage' , attackStyle: 'attack'},



    li_lx_d_liguang: { generalId: 'li_lx_d_liguang', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_512', atkBalanceSkillId: 'ts_377', defDisadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_656', atkDisadvantageSkillId: 'ts_512', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1105', aptitude: 'leverage' , attackStyle: 'defense'},



    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_178', advantageSkillId: 'ts_178', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_002', atkAdvantageSkillId: 'ts_178', atkDisadvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_710', defAdvantageSkillId: 'ts_796', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'attack' }, // 征交趾攻 + 边塞 → 双行



    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_812', advantageSkillId: 'ts_812', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_941', defAdvantageSkillId: 'ts_564', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_941', defBalanceSkillId: 'ts_110', defDisadvantageSkillId: 'ts_463', aptitude: 'leverage' , attackStyle: 'attack'},



    dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_961', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_061', defDisadvantageSkillId: 'ts_479', aptitude: 'leverage', attackStyle: 'balanced' }, // 白藤江守反 → 双行



    shengmiao_baoli: { generalId: 'shengmiao_baoli', tier: 'ordinary', tacticalSkillId: 'ts_813', advantageSkillId: 'ts_813', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_301', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_493', aptitude: 'leverage' , attackStyle: 'attack'},



    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'ts_870', advantageSkillId: 'ts_870', balanceSkillId: 'ts_174', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_174', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_586', aptitude: 'create' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 「屡破红巾军」无具名锚战（存疑列普将）



        guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_517', advantageSkillId: 'ts_517', balanceSkillId: 'ts_516', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_517', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_079', defDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_544', defBalanceSkillId: 'ts_1109', aptitude: 'leverage' , attackStyle: 'attack'},



    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_288', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_645', aptitude: 'leverage' , attackStyle: 'attack'},



    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_283', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_498', aptitude: 'reverse' , attackStyle: 'defense'},



    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_901', advantageSkillId: 'ts_901', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_131', atkAdvantageSkillId: 'ts_901', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_534', aptitude: 'leverage' , attackStyle: 'attack'},



            xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_788', atkDisadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_1112', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_019', aptitude: 'leverage' , attackStyle: 'defense'},



    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_136', disadvantageSkillId: 'ts_548', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_180', aptitude: 'leverage' , attackStyle: 'attack'},



    shixing_houandou: { generalId: 'shixing_houandou', tier: 'famous', tacticalSkillId: 'ts_940', advantageSkillId: 'ts_940', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_573', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_573', defAdvantageSkillId: 'ts_311', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_711', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：564 亲统破留异（留异/陈宝应/周迪连环叛乱＝浙东战区）、从破徐嗣徽引北齐军（敌帅具名）



    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_015', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_595', atkDisadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_1116', defAdvantageSkillId: 'ts_312', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_187', aptitude: 'reverse', attackStyle: 'attack' },



    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_265', advantageSkillId: 'ts_265', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_234', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_607', aptitude: 'leverage' , attackStyle: 'attack'},



    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_450', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage' , attackStyle: 'defense'},



    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_646', aptitude: 'leverage' , attackStyle: 'defense'},



    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_497', advantageSkillId: 'ts_497', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_581', atkBalanceSkillId: 'ts_196', atkAdvantageSkillId: 'ts_497', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_651', aptitude: 'reverse' , attackStyle: 'attack'},



    zuo_d_wufu: { generalId: 'zuo_d_wufu', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_1130', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_664', aptitude: 'leverage' , attackStyle: 'attack'},



    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_137', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_137', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_678', aptitude: 'leverage' , attackStyle: 'attack'},



    wumeng_azi: { generalId: 'wumeng_azi', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_791', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_698', aptitude: 'reverse' , attackStyle: 'defense'},



    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_981', defDisadvantageSkillId: 'ts_271', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1103', aptitude: 'create' , attackStyle: 'balanced'},



    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_036', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_139', defDisadvantageSkillId: 'ts_023', aptitude: 'leverage' , attackStyle: 'attack'},



    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_685', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_701', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_701', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_155', defDisadvantageSkillId: 'ts_323', aptitude: 'reverse' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 襄阳死守六年终陷（未保全大局未击退敌帅，守将准则未过）→普将



        zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_126', advantageSkillId: 'ts_126', balanceSkillId: 'ts_465', disadvantageSkillId: 'ts_452', atkAdvantageSkillId: 'ts_126', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_452', defAdvantageSkillId: 'ts_831', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_440', aptitude: 'leverage' , attackStyle: 'balanced'},



    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_708', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_708', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_027', aptitude: 'leverage' , attackStyle: 'defense'},



    daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'ts_497', advantageSkillId: 'ts_497', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_495', defAdvantageSkillId: 'ts_496', atkDisadvantageSkillId: 'ts_058', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_746', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 白皮书：1639 播箕寨设伏大破左良玉（罗岱死、官军死万余）、1640 竹菌坪阵斩张令破秦良玉援——敌帅具名、明末川楚战区级



    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_854', aptitude: 'leverage' , attackStyle: 'defense'},



        yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_752', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_752', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_186', aptitude: 'leverage' , attackStyle: 'balanced'},



    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_193', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_193', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_756', aptitude: 'create', attackStyle: 'attack' },



    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'ordinary', tacticalSkillId: 'ts_911', advantageSkillId: 'ts_911', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_180', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_180', defDisadvantageSkillId: 'ts_331', atkAdvantageSkillId: 'ts_911', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1109', aptitude: 'leverage' , attackStyle: 'attack'},



    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_191', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_700', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_554', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_192', aptitude: 'reverse' , attackStyle: 'defense'},



    fushi_wangmeng: { generalId: 'fushi_wangmeng', tier: 'famous', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_326', disadvantageSkillId: 'ts_646', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_326', atkDisadvantageSkillId: 'ts_646', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_350', aptitude: 'create', attackStyle: 'attack' },



    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_199', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



            ba_bamanzi: { generalId: 'ba_bamanzi', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_789', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_789', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_443', defBalanceSkillId: 'ts_328', defDisadvantageSkillId: 'ts_168', aptitude: 'reverse' , attackStyle: 'defense'},



        hezhou_wangjian: { generalId: 'hezhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_709', advantageSkillId: 'ts_709', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_581', atkAdvantageSkillId: 'ts_709', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_785', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_662', aptitude: 'reverse' , attackStyle: 'defense'},



            qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_039', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_790', atkDisadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_1113', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_229', defDisadvantageSkillId: 'ts_781', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 仇池扩张袭汉中、终败降（无够格胜绩）→普将



    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_076', atkDisadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1125', defAdvantageSkillId: 'ts_536', defBalanceSkillId: 'ts_246', defDisadvantageSkillId: 'ts_784', aptitude: 'leverage' , attackStyle: 'defense'},



    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_539', advantageSkillId: 'ts_539', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_808', defAdvantageSkillId: 'ts_265', defDisadvantageSkillId: 'ts_450', atkAdvantageSkillId: 'ts_539', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_808', defBalanceSkillId: 'ts_1114', aptitude: 'create' , attackStyle: 'balanced'}, // 当阳断喝守 + 入川攻 → 双行



    tan_d_qinhou: { generalId: 'tan_d_qinhou', tier: 'ordinary', tacticalSkillId: 'ts_913', advantageSkillId: 'ts_913', balanceSkillId: 'ts_256', disadvantageSkillId: 'ts_756', atkAdvantageSkillId: 'ts_913', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_756', defAdvantageSkillId: 'ts_154', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_902', aptitude: 'leverage' , attackStyle: 'attack'},



    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_264', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_920', aptitude: 'leverage' , attackStyle: 'defense'},



    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_333', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_971', aptitude: 'leverage' , attackStyle: 'attack'},



    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_830', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_988', aptitude: 'leverage', attackStyle: 'attack' },



    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_912', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_912', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_993', aptitude: 'leverage' , attackStyle: 'defense'},



            bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_791', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_116', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_368', defDisadvantageSkillId: 'ts_253', aptitude: 'reverse' , attackStyle: 'attack'},



    she_shechongming: { generalId: 'she_shechongming', tier: 'ordinary', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_123', aptitude: 'leverage' , attackStyle: 'attack'},



    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_994', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_994', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_382', defDisadvantageSkillId: 'ts_142', aptitude: 'reverse', attackStyle: 'attack' },



    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'ordinary', tacticalSkillId: 'ts_421', advantageSkillId: 'ts_421', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_734', atkAdvantageSkillId: 'ts_421', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_734', defAdvantageSkillId: 'ts_015', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_234', aptitude: 'reverse' , attackStyle: 'defense'}, // 长坂救主最著名；普将不可双行 → 擅守



    chenzhou_d_zhanghao: { generalId: 'chenzhou_d_zhanghao', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_998', atkDisadvantageSkillId: 'ts_998', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_1120', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_473', defDisadvantageSkillId: 'ts_146', aptitude: 'leverage' , attackStyle: 'attack'},



    xiqin_wanyanchenheshang: { generalId: 'xiqin_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_120', advantageSkillId: 'ts_120', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_120', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_104', defAdvantageSkillId: 'ts_070', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_738', aptitude: 'reverse' , attackStyle: 'defense'}, // 大昌原以少胜多攻战 → 双行



    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'famous', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_127', atkDisadvantageSkillId: 'ts_127', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_494', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_149', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 白皮书：亲征擒杀苻坚（具名）·据关中建后秦



    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_150', defDisadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_855', aptitude: 'create' , attackStyle: 'attack'},



    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_438', disadvantageSkillId: 'ts_002', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_002', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_153', aptitude: 'leverage' , attackStyle: 'attack'},



    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_1133', defAdvantageSkillId: 'ts_120', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_1133', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_514', aptitude: 'leverage' , attackStyle: 'attack'},



    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_182', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_268', aptitude: 'leverage' , attackStyle: 'attack'},



    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_191', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_271', aptitude: 'leverage' , attackStyle: 'attack'},



    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_270', advantageSkillId: 'ts_270', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_270', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_066', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_292', aptitude: 'reverse' , attackStyle: 'attack'},



    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_111', balanceSkillId: 'ts_576', disadvantageSkillId: 'ts_200', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_297', aptitude: 'leverage', attackStyle: 'defense' },



    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_272', aptitude: 'create' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 白皮书：破鲜卑若罗拔能（具名）·据凉州奠前凉



    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_239', advantageSkillId: 'ts_239', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_1131', defBalanceSkillId: 'ts_264', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_636', defDisadvantageSkillId: 'ts_726', aptitude: 'leverage' , attackStyle: 'defense'}, // 屯田平羌、深沟高垒 → 擅守



    wudu_dengai: { generalId: 'wudu_dengai', tier: 'famous', tacticalSkillId: 'ts_162', advantageSkillId: 'ts_162', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_692', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_981', aptitude: 'leverage', attackStyle: 'attack' },



    baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_130', advantageSkillId: 'ts_130', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_594', atkBalanceSkillId: 'ts_472', atkAdvantageSkillId: 'ts_130', atkDisadvantageSkillId: 'ts_594', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_206', aptitude: 'create', attackStyle: 'attack' },



    dangzhou_qiangduan: { generalId: 'dangzhou_qiangduan', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_334', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_207', aptitude: 'leverage', attackStyle: 'defense' },



        didao_wangshao: { generalId: 'didao_wangshao', tier: 'famous', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_122', atkDisadvantageSkillId: 'ts_122', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_1118', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_702', defDisadvantageSkillId: 'ts_255', aptitude: 'create' , attackStyle: 'attack'},



        dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_111', balanceSkillId: 'ts_942', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_942', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_068', aptitude: 'reverse' , attackStyle: 'attack'},



        zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', tacticalSkillId: 'ts_112', advantageSkillId: 'ts_112', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_023', defDisadvantageSkillId: 'ts_351', defAdvantageSkillId: 'ts_170', defBalanceSkillId: 'ts_1110', aptitude: 'create' , attackStyle: 'attack'},



    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'ordinary', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_209', atkBalanceSkillId: 'ts_252', atkAdvantageSkillId: 'ts_652', atkDisadvantageSkillId: 'ts_209', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_277', aptitude: 'leverage' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 白皮书：率河西兵破隗嚣（具名）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：从汉军破隗嚣，非第一线决断者
    // 🔴 [2026-11-01 按史补] 夜落纥＝甘州回鹘可汗；普将（区域政权，史载实胜不细），技能按普将通制取
    ganzhou_huihu_yeluohu: { generalId: 'ganzhou_huihu_yeluohu', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_230', aptitude: 'reverse' , attackStyle: 'defense'},



    suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_198', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_359', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_359', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_840', aptitude: 'create', attackStyle: 'attack' },



        shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_609', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_113', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_1119', defBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_113', defAdvantageSkillId: 'ts_316', defDisadvantageSkillId: 'ts_386', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：856 西同之战破论恐热所指使的吐谷浑莫贺可汗军、生擒宰相三人（《张议潮变文》敌帅具名），861 克凉州复河陇四千里——战区级



    dongshengwei_wangyue: { generalId: 'dongshengwei_wangyue', tier: 'famous', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_251', disadvantageSkillId: 'ts_384', atkBalanceSkillId: 'ts_251', atkAdvantageSkillId: 'ts_213', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_056', aptitude: 'create' , attackStyle: 'attack'},



    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_216', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_216', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},






    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_124', disadvantageSkillId: 'ts_254', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_254', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_233', aptitude: 'create', attackStyle: 'attack' },



    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'ordinary', tacticalSkillId: 'ts_215', advantageSkillId: 'ts_215', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_144', atkBalanceSkillId: 'ts_1121', atkAdvantageSkillId: 'ts_215', atkDisadvantageSkillId: 'ts_144', defAdvantageSkillId: 'ts_750', defBalanceSkillId: 'ts_670', defDisadvantageSkillId: 'ts_238', aptitude: 'leverage' , attackStyle: 'attack'},



    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_347', advantageSkillId: 'ts_347', balanceSkillId: 'ts_506', disadvantageSkillId: 'ts_231', atkAdvantageSkillId: 'ts_347', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_231', defAdvantageSkillId: 'ts_250', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_651', aptitude: 'leverage', attackStyle: 'defense' },



    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_601', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_990', defDisadvantageSkillId: 'ts_971', aptitude: 'create' , attackStyle: 'attack'},



    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_609', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_241', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_012', aptitude: 'leverage', attackStyle: 'attack' },






    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_097', disadvantageSkillId: 'ts_261', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_097', atkDisadvantageSkillId: 'ts_261', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_013', aptitude: 'create' , attackStyle: 'defense'},



    gen_xiao_xian: { generalId: 'gen_xiao_xian', tier: 'ordinary', tacticalSkillId: 'ts_141', advantageSkillId: 'ts_141', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_281', atkDisadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_181', aptitude: 'leverage' , attackStyle: 'defense'},




    kang_liangshidou: { generalId: 'kang_liangshidou', tier: 'ordinary', tacticalSkillId: 'ts_622', advantageSkillId: 'ts_622', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_298', atkDisadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_084', aptitude: 'leverage' , attackStyle: 'defense'},



    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_107', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 破羌无具名敌帅（治安战）→普将



    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_551', disadvantageSkillId: 'ts_291', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_551', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_122', aptitude: 'leverage' , attackStyle: 'defense'},



    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'ts_250', advantageSkillId: 'ts_250', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_520', defDisadvantageSkillId: 'ts_125', aptitude: 'create' , attackStyle: 'attack'},



    huizhou_yaosi: { generalId: 'huizhou_yaosi', tier: 'ordinary', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_383', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_700', atkDisadvantageSkillId: 'ts_383', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_134', aptitude: 'leverage' , attackStyle: 'attack'},



    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_776', disadvantageSkillId: 'ts_255', atkDisadvantageSkillId: 'ts_255', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_776', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 席苇城反袭、葫芦河破夏军，夏军统帅无具名记载（平夏城擒嵬名阿埋属章楶/折可适）；且《宋史》载夏人屡败种师道——对阵有名存疑列普



    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_198', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_435', aptitude: 'reverse' , attackStyle: 'balanced'},



        pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_163', advantageSkillId: 'ts_163', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_152', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_738', aptitude: 'create' , attackStyle: 'balanced'}, // 朔方攻守平叛 → 双行



    ningkou_liling: { generalId: 'ningkou_liling', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_524', disadvantageSkillId: 'ts_726', atkDisadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_524', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage' , attackStyle: 'defense'},



    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_236', defBalanceSkillId: 'ts_256', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_236', defAdvantageSkillId: 'ts_786', defDisadvantageSkillId: 'ts_298', aptitude: 'leverage' , attackStyle: 'attack'},



    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_163', advantageSkillId: 'ts_163', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_434', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_434', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_263', aptitude: 'reverse' , attackStyle: 'attack'},



    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_169', aptitude: 'create' , attackStyle: 'attack'},



    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', tacticalSkillId: 'ts_194', advantageSkillId: 'ts_194', balanceSkillId: 'ts_739', disadvantageSkillId: 'ts_287', atkAdvantageSkillId: 'ts_194', atkBalanceSkillId: 'ts_739', atkDisadvantageSkillId: 'ts_287', defAdvantageSkillId: 'ts_481', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_342', aptitude: 'create' , attackStyle: 'attack'},



    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_900', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_192', aptitude: 'leverage' , attackStyle: 'attack'},



    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_930', disadvantageSkillId: 'ts_477', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_930', atkDisadvantageSkillId: 'ts_477', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_214', aptitude: 'create', attackStyle: 'attack' },



        jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'ts_751', advantageSkillId: 'ts_751', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_200', atkAdvantageSkillId: 'ts_751', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_551', defDisadvantageSkillId: 'ts_431', aptitude: 'leverage' , attackStyle: 'attack'},



        zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_558', advantageSkillId: 'ts_558', balanceSkillId: 'ts_199', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_019', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_782', aptitude: 'reverse' , attackStyle: 'balanced'}, // 淝水守 + 北府北伐 → 双行



    zhongshan_yangaoqing: { generalId: 'zhongshan_yangaoqing', tier: 'ordinary', tacticalSkillId: 'ts_220', advantageSkillId: 'ts_220', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_295', aptitude: 'leverage' , attackStyle: 'defense'},



    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_147', disadvantageSkillId: 'ts_230', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_230', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_482', aptitude: 'create' , attackStyle: 'attack'},



    wang_d_liuyu: { generalId: 'wang_d_liuyu', tier: 'famous', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_174', defDisadvantageSkillId: 'ts_993', aptitude: 'create' , attackStyle: 'balanced'}, // 北伐灭燕秦 + 建康/却月阵守 → 双行



    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_249', defBalanceSkillId: 'ts_173', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_249', defAdvantageSkillId: 'ts_160', defDisadvantageSkillId: 'ts_565', aptitude: 'leverage' , attackStyle: 'attack'},



    xiao_d_xiaoyan: { generalId: 'xiao_d_xiaoyan', tier: 'famous', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_307', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_663', defDisadvantageSkillId: 'ts_186', aptitude: 'create' , attackStyle: 'balanced'}, // 代齐攻 + 侯景前基业 → 双行



    wazhai_zhanghan: { generalId: 'wazhai_zhanghan', tier: 'famous', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_203', atkBalanceSkillId: 'ts_1122', atkAdvantageSkillId: 'ts_850', atkDisadvantageSkillId: 'ts_203', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage' , attackStyle: 'attack'},



    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_776', disadvantageSkillId: 'ts_451', atkBalanceSkillId: 'ts_776', atkDisadvantageSkillId: 'ts_451', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_235', defAdvantageSkillId: 'ts_194', aptitude: 'reverse' , attackStyle: 'balanced'},






    jinan_tiexuan: { generalId: 'jinan_tiexuan', tier: 'famous', tacticalSkillId: 'ts_195', advantageSkillId: 'ts_195', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_195', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_336', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_287', aptitude: 'reverse' , attackStyle: 'defense'},



    qi_simarangju: { generalId: 'qi_simarangju', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_557', defDisadvantageSkillId: 'ts_317', aptitude: 'create' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 无交战胜（晋燕师闻风自退），《司马法》为兵书符号仅放大器；存疑列普将



    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_134', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_134', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_206', aptitude: 'leverage' , attackStyle: 'defense'}, // 细柳/平七国坚壁 → 擅守



    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_321', aptitude: 'reverse' , attackStyle: 'defense'}, // 顺昌之战以少破金 → 逆势；本名刘锜



        cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'ts_022', advantageSkillId: 'ts_022', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_107', atkAdvantageSkillId: 'ts_022', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_812', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage' , attackStyle: 'balanced'},



    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse' , attackStyle: 'balanced'}, // 玉壁守 + 平尉迟迥攻邺 → 双行



    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_160', advantageSkillId: 'ts_160', balanceSkillId: 'ts_900', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_160', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_901', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_902', aptitude: 'leverage' , attackStyle: 'attack'}, // 桂陵马陵攻 + 用计守反 → 双行



    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_614', defDisadvantageSkillId: 'ts_422', aptitude: 'leverage' , attackStyle: 'defense'},



    baibo_guotai: { generalId: 'baibo_guotai', tier: 'ordinary', tacticalSkillId: 'ts_564', advantageSkillId: 'ts_564', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_674', atkAdvantageSkillId: 'ts_564', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_446', defBalanceSkillId: 'ts_616', defDisadvantageSkillId: 'ts_157', aptitude: 'reverse', attackStyle: 'attack' },



    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_176', disadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_193', aptitude: 'create' , attackStyle: 'attack'},



    ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_597', advantageSkillId: 'ts_597', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_494', defDisadvantageSkillId: 'ts_708', aptitude: 'create', attackStyle: 'attack' },



    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_337', aptitude: 'leverage' , attackStyle: 'attack'},



    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_701', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_701', atkAdvantageSkillId: 'ts_656', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_601', aptitude: 'create' , attackStyle: 'balanced'},



    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_351', aptitude: 'create' , attackStyle: 'attack'},



    dixiang_wangmang: { generalId: 'dixiang_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_990', disadvantageSkillId: 'ts_720', defAdvantageSkillId: 'ts_099', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_990', atkDisadvantageSkillId: 'ts_720', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_359', aptitude: 'create' , attackStyle: 'attack'},



        zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_317', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_317', defAdvantageSkillId: 'ts_673', defDisadvantageSkillId: 'ts_674', defBalanceSkillId: 'ts_1102', aptitude: 'create' , attackStyle: 'attack'},



    quanrong_yiquhai: { generalId: 'quanrong_yiquhai', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_373', aptitude: 'leverage', attackStyle: 'attack' },



    cai_lishuo: { generalId: 'cai_lishuo', tier: 'famous', tacticalSkillId: 'ts_349', advantageSkillId: 'ts_349', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_238', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_238', defAdvantageSkillId: 'ts_311', defBalanceSkillId: 'ts_732', defDisadvantageSkillId: 'ts_217', aptitude: 'create', attackStyle: 'attack' },



    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_535', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_729', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_429', aptitude: 'leverage' , attackStyle: 'attack'},



    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_762', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_431', aptitude: 'reverse' , attackStyle: 'defense'},



    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_221', advantageSkillId: 'ts_221', balanceSkillId: 'ts_739', disadvantageSkillId: 'ts_150', atkAdvantageSkillId: 'ts_221', atkBalanceSkillId: 'ts_739', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_813', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_988', aptitude: 'leverage' , attackStyle: 'attack'},



    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_558', advantageSkillId: 'ts_558', balanceSkillId: 'ts_155', disadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_301', advantageSkillId: 'ts_301', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_301', defAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_1131', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_671', aptitude: 'reverse' , attackStyle: 'balanced'}, // 太原守 + 河阳出击 → 双行



    qing_quduan: { generalId: 'qing_quduan', tier: 'ordinary', tacticalSkillId: 'ts_591', advantageSkillId: 'ts_591', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_459', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 彭原店破撒离喝主将实为吴玠（曲端拥军屯宜禄不战），「啼哭郎君」典归吴玠；其余胜绩金帅无具名记载——存疑列普



    han_baoyuan: { generalId: 'han_baoyuan', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_840', aptitude: 'leverage' , attackStyle: 'attack'},
    caoren: { generalId: 'caoren', tier: 'famous', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_853', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_199', defDisadvantageSkillId: 'ts_020', aptitude: 'reverse' , attackStyle: 'defense'},



    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_248', disadvantageSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_425', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_248', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_387', aptitude: 'reverse', attackStyle: 'attack' },



    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_457', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_711', aptitude: 'leverage' , attackStyle: 'defense'},



    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_870', advantageSkillId: 'ts_870', balanceSkillId: 'ts_702', disadvantageSkillId: 'ts_479', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_729', aptitude: 'leverage' , attackStyle: 'balanced'},



    liguo_zhaoshe: { generalId: 'liguo_zhaoshe', tier: 'famous', tacticalSkillId: 'ts_189', advantageSkillId: 'ts_189', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_189', atkDisadvantageSkillId: 'ts_459', atkBalanceSkillId: 'ts_448', defAdvantageSkillId: 'ts_597', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_697', aptitude: 'leverage' , attackStyle: 'attack'}, // 阏与之战·狭路相逢勇者胜 → 擅攻



        huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_039', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_345', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_345', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_316', aptitude: 'create' , attackStyle: 'balanced'}, // 鄱阳等攻 + 基业守 → 双行



    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_855', disadvantageSkillId: 'ts_931', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_931', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_479', aptitude: 'leverage' , attackStyle: 'attack'},





    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_786', advantageSkillId: 'ts_786', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_266', atkAdvantageSkillId: 'ts_786', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_266', defAdvantageSkillId: 'ts_751', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_941', aptitude: 'leverage' , attackStyle: 'balanced'}, // 稳固朔方整合后再反击平乱 → 双行



    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_702', disadvantageSkillId: 'ts_373', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_373', defAdvantageSkillId: 'ts_724', defDisadvantageSkillId: 'ts_383', defBalanceSkillId: 'ts_1126', aptitude: 'create', attackStyle: 'attack' },



    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_776', disadvantageSkillId: 'ts_464', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_776', atkDisadvantageSkillId: 'ts_464', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_493', aptitude: 'leverage' , attackStyle: 'attack'},



        lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_155', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_534', aptitude: 'reverse' , attackStyle: 'balanced'},



    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_812', advantageSkillId: 'ts_812', balanceSkillId: 'ts_473', disadvantageSkillId: 'ts_646', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_646', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_470', aptitude: 'create' , attackStyle: 'attack'},



    hao_d_weirui: { generalId: 'hao_d_weirui', tier: 'famous', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_585', aptitude: 'leverage' , attackStyle: 'balanced'}, // 合肥攻城与守御兼 → 双行



    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'ordinary', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_177', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_331', atkBalanceSkillId: 'ts_1118', atkAdvantageSkillId: 'ts_177', atkDisadvantageSkillId: 'ts_331', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_502', aptitude: 'create', attackStyle: 'attack' },



    zhuozhou_anlushan: { generalId: 'zhuozhou_anlushan', tier: 'famous', tacticalSkillId: 'ts_349', advantageSkillId: 'ts_349', balanceSkillId: 'ts_990', disadvantageSkillId: 'ts_226', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_990', atkDisadvantageSkillId: 'ts_226', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_747', aptitude: 'leverage', attackStyle: 'attack' },



        chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_482', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_482', defBalanceSkillId: 'ts_147', defAdvantageSkillId: 'ts_140', defDisadvantageSkillId: 'ts_087', aptitude: 'create' , attackStyle: 'attack'},



    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_813', advantageSkillId: 'ts_813', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_698', aptitude: 'leverage' , attackStyle: 'defense'},   // 🔴 [2026-10-25 主人令按标准修复] 普将→名将：平卢节度使，刘鄩袭取兖州、石楼破朱友宁俘斩万计（《资治通鉴·卷二六四》）；🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准改档] 白皮书：藩镇讨朱温败降、无胜绩



    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_494', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_708', aptitude: 'leverage' , attackStyle: 'defense'},



    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_663', defDisadvantageSkillId: 'ts_254', aptitude: 'leverage', attackStyle: 'attack' },



    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'famous', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_455', balanceSkillId: 'ts_095', disadvantageSkillId: 'ts_217', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_217', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_777', aptitude: 'create', attackStyle: 'attack' },



            pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_961', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_224', aptitude: 'leverage' , attackStyle: 'defense'},



    linhu_mafang: { generalId: 'linhu_mafang', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_013', aptitude: 'reverse', attackStyle: 'attack' }, // 暗度陈仓等攻 + 背水等 → 双行



    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'famous', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_280', disadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_225', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_533', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：洛阳之战破前赵擒刘曜（具名灭国）



    loufan_xuerengui: { generalId: 'loufan_xuerengui', tier: 'famous', tacticalSkillId: 'ts_462', advantageSkillId: 'ts_462', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_216', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_216', atkAdvantageSkillId: 'ts_462', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_110', defDisadvantageSkillId: 'ts_226', aptitude: 'create' , attackStyle: 'attack'},



    shanrong_lanyu: { generalId: 'shanrong_lanyu', tier: 'famous', tacticalSkillId: 'ts_094', advantageSkillId: 'ts_094', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_307', atkAdvantageSkillId: 'ts_094', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_220', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_009', aptitude: 'create' , attackStyle: 'attack'},



        you_gengyan: { generalId: 'you_gengyan', tier: 'famous', tacticalSkillId: 'ts_462', advantageSkillId: 'ts_462', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_671', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_224', aptitude: 'create' , attackStyle: 'attack'},



        lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_564', defDisadvantageSkillId: 'ts_214', atkBalanceSkillId: 'ts_1116', defBalanceSkillId: 'ts_551', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 灭中山对手史失其名、胡服骑射属军改不计→普将






    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1126', disadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_854', aptitude: 'leverage' , attackStyle: 'defense'},



    jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_750', advantageSkillId: 'ts_750', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_606', atkAdvantageSkillId: 'ts_750', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_510', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_512', aptitude: 'create', attackStyle: 'balanced' }, // 辽东攻抚兼守 → 双行



        zu_d_yuanchonghuan: { generalId: 'zu_d_yuanchonghuan', tier: 'famous', tacticalSkillId: 'ts_575', advantageSkillId: 'ts_575', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_699', atkAdvantageSkillId: 'ts_575', atkBalanceSkillId: 'ts_1101', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_144', atkDisadvantageSkillId: 'ts_699', defAdvantageSkillId: 'ts_065', aptitude: 'reverse' , attackStyle: 'defense'},



    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'ts_047', advantageSkillId: 'ts_047', balanceSkillId: 'ts_156', disadvantageSkillId: 'ts_637', atkAdvantageSkillId: 'ts_047', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_060', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_228', aptitude: 'leverage' , attackStyle: 'attack'},



    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_573', aptitude: 'leverage', attackStyle: 'attack' },



    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_258', advantageSkillId: 'ts_258', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_667', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_333', defDisadvantageSkillId: 'ts_243', aptitude: 'leverage' , attackStyle: 'defense'},



        weihaiwei_sudingfang: { generalId: 'weihaiwei_sudingfang', tier: 'famous', tacticalSkillId: 'ts_341', advantageSkillId: 'ts_341', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_116', atkAdvantageSkillId: 'ts_341', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_629', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_230', aptitude: 'leverage' , attackStyle: 'attack'},



    xuan_xuda: { generalId: 'xuan_xuda', tier: 'famous', tacticalSkillId: 'ts_089', advantageSkillId: 'ts_089', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_089', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_656', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_998', aptitude: 'create', attackStyle: 'attack' },



    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_229', disadvantageSkillId: 'ts_738', atkBalanceSkillId: 'ts_229', atkAdvantageSkillId: 'ts_086', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_607', aptitude: 'create' , attackStyle: 'attack'},



    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_301', defBalanceSkillId: 'ts_137', defDisadvantageSkillId: 'ts_701', aptitude: 'create' , attackStyle: 'balanced'},



    changshan_yangyanzhao: { generalId: 'changshan_yangyanzhao', tier: 'famous', tacticalSkillId: 'ts_311', advantageSkillId: 'ts_311', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_1131', defBalanceSkillId: 'ts_095', defDisadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_960', aptitude: 'reverse', attackStyle: 'defense' },   // 🔴 [2026-10-28 档位对齐] 白皮书：遂城冰城退辽、羊山伏击破辽（萧太后亲征具名）



    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_746', atkAdvantageSkillId: 'ts_213', atkDisadvantageSkillId: 'ts_746', atkBalanceSkillId: 'ts_378', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_984', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 锚东光大破黄巾三十万（黄巾无帅＝治安战）→普将



    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_633', advantageSkillId: 'ts_633', balanceSkillId: 'ts_439', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_633', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_694', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_746', aptitude: 'leverage' , attackStyle: 'defense'},



    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_212', defBalanceSkillId: 'ts_1124', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_212', defAdvantageSkillId: 'ts_709', defDisadvantageSkillId: 'ts_995', aptitude: 'leverage' , attackStyle: 'defense'},



    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_902', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_700', atkDisadvantageSkillId: 'ts_902', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_019', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准改档] 白皮书：王铁枪武勇型、无独立战役级大捷
    liang_d_zhuyouning: { generalId: 'liang_d_zhuyouning', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_988', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_023', aptitude: 'leverage', attackStyle: 'attack' },   // 朱友宁：汴军宿将（救齐州、兖南伏兵、拔博昌/临淄/登州）→ 名将



    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_900', disadvantageSkillId: 'ts_219', defBalanceSkillId: 'ts_1111', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_219', defAdvantageSkillId: 'ts_789', defDisadvantageSkillId: 'ts_711', aptitude: 'leverage' , attackStyle: 'attack'},



    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_295', atkDisadvantageSkillId: 'ts_295', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_1125', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_971', aptitude: 'create' , attackStyle: 'balanced'}, // 东魏开国攻守兼备 → 双行



    wangyan_wangyan: { generalId: 'wangyan_wangyan', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_063', defDisadvantageSkillId: 'ts_237', aptitude: 'leverage', attackStyle: 'attack' },



    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'famous', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_148', atkBalanceSkillId: 'ts_252', atkAdvantageSkillId: 'ts_005', atkDisadvantageSkillId: 'ts_148', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_998', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：山海关之战（李自成具名）、独镇一方



    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'ordinary', tacticalSkillId: 'ts_296', advantageSkillId: 'ts_296', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_274', atkBalanceSkillId: 'ts_1117', atkAdvantageSkillId: 'ts_296', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_209', aptitude: 'leverage' , attackStyle: 'attack'},



        erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_510', advantageSkillId: 'ts_510', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_512', atkAdvantageSkillId: 'ts_510', atkDisadvantageSkillId: 'ts_512', atkBalanceSkillId: 'ts_1114', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_377', defDisadvantageSkillId: 'ts_216', aptitude: 'create' , attackStyle: 'attack'},



    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'famous', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_225', atkDisadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_1118', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_670', defDisadvantageSkillId: 'ts_238', aptitude: 'create' , attackStyle: 'defense'},



    heng1_yangye: { generalId: 'heng1_yangye', tier: 'famous', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_455', balanceSkillId: 'ts_732', disadvantageSkillId: 'ts_241', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_302', aptitude: 'reverse', attackStyle: 'defense' }, // 雁门抗辽以守为主 → 擅守



        dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_202', disadvantageSkillId: 'ts_056', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_056', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_961', aptitude: 'create' , attackStyle: 'attack'},



    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_313', aptitude: 'leverage' , attackStyle: 'attack'},



    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'famous', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_073', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_345', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：钟离之战大破北魏（元英/杨大眼具名）



    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_180', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_582', aptitude: 'reverse' , attackStyle: 'defense'},



    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_123', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_543', aptitude: 'leverage' , attackStyle: 'attack'},



    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_182', atkDisadvantageSkillId: 'ts_182', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_1102', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_288', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    ouyang_ouyangwei: { generalId: 'ouyang_ouyangwei', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_323', aptitude: 'leverage' , attackStyle: 'attack'},



    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_546', advantageSkillId: 'ts_546', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_586', atkDisadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_1120', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_174', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage' , attackStyle: 'defense'},



        yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_547', disadvantageSkillId: 'ts_657', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_547', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_490', aptitude: 'create' , attackStyle: 'attack'},



    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_321', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_321', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_184', defAdvantageSkillId: 'ts_189', aptitude: 'reverse' , attackStyle: 'defense'}, // 长平坚壁/廉颇善守 → 擅守



    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_339', advantageSkillId: 'ts_339', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_233', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_233', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage' , attackStyle: 'attack'},






    xie_xiefangde: { generalId: 'xie_xiefangde', tier: 'ordinary', tacticalSkillId: 'ts_987', advantageSkillId: 'ts_987', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_987', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_387', aptitude: 'leverage' , attackStyle: 'defense'},



    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_920', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_920', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_585', aptitude: 'leverage' , attackStyle: 'attack'},



    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_438', disadvantageSkillId: 'ts_984', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_984', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_993', aptitude: 'create' , attackStyle: 'defense'},



    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_487', advantageSkillId: 'ts_487', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_382', defDisadvantageSkillId: 'ts_463', aptitude: 'leverage' , attackStyle: 'attack'},



    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'famous', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_440', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_684', aptitude: 'reverse' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 白皮书：大破汉军刘尚、困死马援（具名）



    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_316', advantageSkillId: 'ts_316', balanceSkillId: 'ts_073', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_316', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_987', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage' , attackStyle: 'balanced'}, // 赤壁守 + 南郡攻 → 双行



    fangla_fangla: { generalId: 'fangla_fangla', tier: 'ordinary', tacticalSkillId: 'ts_522', advantageSkillId: 'ts_522', balanceSkillId: 'ts_602', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_483', aptitude: 'leverage', attackStyle: 'attack' },



    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_058', defBalanceSkillId: 'ts_1118', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_026', defDisadvantageSkillId: 'ts_492', aptitude: 'leverage' , attackStyle: 'attack'},



    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_498', aptitude: 'leverage' , attackStyle: 'attack'},



    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_752', disadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_752', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 蒲骚之战郧师无具名主帅→普将



        wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_763', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_763', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_518', aptitude: 'leverage' , attackStyle: 'attack'},



    li_bian: { generalId: 'li_bian', tier: 'ordinary', tacticalSkillId: 'ts_559', advantageSkillId: 'ts_559', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_548', aptitude: 'leverage' , attackStyle: 'attack'},



    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_619', advantageSkillId: 'ts_619', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_761', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_761', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'defense' },



    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_177', balanceSkillId: 'ts_136', disadvantageSkillId: 'ts_188', atkAdvantageSkillId: 'ts_177', defBalanceSkillId: 'ts_1107', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_188', defAdvantageSkillId: 'ts_178', defDisadvantageSkillId: 'ts_079', aptitude: 'reverse' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：亲征灭吴（夫差具名）、称霸



    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_796', balanceSkillId: 'ts_139', disadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_595', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_756', aptitude: 'leverage' , attackStyle: 'defense'},



    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_176', disadvantageSkillId: 'ts_612', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_612', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_801', aptitude: 'leverage' , attackStyle: 'attack'},



            sui_yangjian: { generalId: 'sui_yangjian', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_260', disadvantageSkillId: 'ts_807', atkDisadvantageSkillId: 'ts_807', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_260', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_830', aptitude: 'leverage' , attackStyle: 'attack'},



    changshaguo_xinqiji: { generalId: 'changshaguo_xinqiji', tier: 'ordinary', tacticalSkillId: 'ts_870', advantageSkillId: 'ts_870', balanceSkillId: 'ts_176', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_662', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_912', aptitude: 'reverse', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 突营擒张安国/平茶商军＝战术级小胜非战役级→普将



    yue_d_lusu: { generalId: 'yue_d_lusu', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_229', disadvantageSkillId: 'ts_664', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_664', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_100', aptitude: 'leverage' , attackStyle: 'defense'},



    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_309', disadvantageSkillId: 'ts_678', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_678', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_116', aptitude: 'reverse' , attackStyle: 'defense'}, // 平江长期守御 → 擅守



    wu_sunwu: { generalId: 'wu_sunwu', tier: 'famous', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_123', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_256', defDisadvantageSkillId: 'ts_920', aptitude: 'leverage', attackStyle: 'attack' }, // 《孙子》先不可胜、攻守辩证 → 双行



    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', tacticalSkillId: 'ts_901', advantageSkillId: 'ts_901', balanceSkillId: 'ts_288', disadvantageSkillId: 'ts_131', atkBalanceSkillId: 'ts_288', atkAdvantageSkillId: 'ts_901', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_706', aptitude: 'create' , attackStyle: 'attack'}, // 抗倭进剿歼寇 → 擅攻



    qiufu_qiufu: { generalId: 'qiufu_qiufu', tier: 'ordinary', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_142', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_734', aptitude: 'leverage' , attackStyle: 'attack'},



        qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'ts_546', advantageSkillId: 'ts_546', balanceSkillId: 'ts_438', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_586', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_780', aptitude: 'create' , attackStyle: 'balanced'},



    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_940', advantageSkillId: 'ts_940', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_781', aptitude: 'reverse' , attackStyle: 'defense'},



    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_039', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_264', defDisadvantageSkillId: 'ts_784', aptitude: 'leverage' , attackStyle: 'attack'},



    shenshi_wentianxiang: { generalId: 'shenshi_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_163', advantageSkillId: 'ts_163', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_808', aptitude: 'leverage' , attackStyle: 'defense'},



    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_739', disadvantageSkillId: 'ts_125', atkAdvantageSkillId: 'ts_336', atkDisadvantageSkillId: 'ts_125', atkBalanceSkillId: 'ts_739', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_150', aptitude: 'leverage' , attackStyle: 'attack'},



    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_368', disadvantageSkillId: 'ts_153', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_994', aptitude: 'leverage' , attackStyle: 'attack'},



    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_187', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_263', aptitude: 'leverage' , attackStyle: 'attack'},



    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_177', balanceSkillId: 'ts_506', disadvantageSkillId: 'ts_245', atkBalanceSkillId: 'ts_506', atkAdvantageSkillId: 'ts_177', atkDisadvantageSkillId: 'ts_245', defAdvantageSkillId: 'ts_244', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'attack'},



    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_520', defDisadvantageSkillId: 'ts_191', aptitude: 'leverage' , attackStyle: 'attack'},



    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_626', advantageSkillId: 'ts_626', balanceSkillId: 'ts_524', disadvantageSkillId: 'ts_274', atkAdvantageSkillId: 'ts_626', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_629', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_200', aptitude: 'leverage' , attackStyle: 'defense'},



    mi_chu_xionglv: { generalId: 'mi_chu_xionglv', tier: 'famous', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_267', atkBalanceSkillId: 'ts_1106', atkAdvantageSkillId: 'ts_648', atkDisadvantageSkillId: 'ts_267', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_206', aptitude: 'create' , attackStyle: 'attack'},



    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_175', advantageSkillId: 'ts_175', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_302', atkAdvantageSkillId: 'ts_175', atkDisadvantageSkillId: 'ts_302', atkBalanceSkillId: 'ts_1121', defAdvantageSkillId: 'ts_258', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_207', aptitude: 'create' , attackStyle: 'attack'},



    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_312', advantageSkillId: 'ts_312', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_302', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_302', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_231', aptitude: 'reverse' , attackStyle: 'attack'},



    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_640', advantageSkillId: 'ts_640', balanceSkillId: 'ts_557', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_640', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_154', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_345', aptitude: 'leverage' , attackStyle: 'attack'},



    hongzhou_zhuwenzheng: { generalId: 'hongzhou_zhuwenzheng', tier: 'famous', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_234', defDisadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_567', aptitude: 'reverse' , attackStyle: 'defense'},



    danyang_huanwen: { generalId: 'danyang_huanwen', tier: 'famous', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_259', atkBalanceSkillId: 'ts_1109', atkAdvantageSkillId: 'ts_668', atkDisadvantageSkillId: 'ts_259', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_543', aptitude: 'create' , attackStyle: 'attack'}, // 北伐攻 + 荆州霸府 → 双行



    chizhou_changyuchun: { generalId: 'chizhou_changyuchun', tier: 'famous', tacticalSkillId: 'ts_258', advantageSkillId: 'ts_258', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_274', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_063', defDisadvantageSkillId: 'ts_255', aptitude: 'create' , attackStyle: 'attack'},



    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_586', aptitude: 'leverage' , attackStyle: 'attack'},



    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_272', aptitude: 'leverage' , attackStyle: 'attack'},



    sagami_beitiaoshikang: { generalId: 'sagami_beitiaoshikang', tier: 'famous', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_015', balanceSkillId: 'ts_681', disadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_681', atkDisadvantageSkillId: 'ts_281', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_706', aptitude: 'reverse' , attackStyle: 'balanced'},



    mino_dagujiji: { generalId: 'mino_dagujiji', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_781', aptitude: 'leverage', attackStyle: 'defense' },



    zhuqian_shaoerzineng: { generalId: 'zhuqian_shaoerzineng', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_470', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_470', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage' , attackStyle: 'defense'},



    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_124', disadvantageSkillId: 'ts_291', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_012', aptitude: 'leverage' , attackStyle: 'attack'},



    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_207', atkDisadvantageSkillId: 'ts_207', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1124', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_013', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 君主抽刀不剩（破晋主力是刘聪/石勒/王弥），开国头衔不计→普将



    kong_d_caogui: { generalId: 'kong_d_caogui', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_1131', atkBalanceSkillId: 'ts_049', atkAdvantageSkillId: 'ts_025', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_383', aptitude: 'reverse' , attackStyle: 'defense'},



    tongma_taishici: { generalId: 'tongma_taishici', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_614', defDisadvantageSkillId: 'ts_295', aptitude: 'leverage', attackStyle: 'attack' },



    yanchuan_d_yuefei: { generalId: 'yanchuan_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_831', advantageSkillId: 'ts_831', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_830', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_248', defDisadvantageSkillId: 'ts_582', aptitude: 'create', attackStyle: 'attack' },



    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_107', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_616', defDisadvantageSkillId: 'ts_435', aptitude: 'create' , attackStyle: 'defense'},



    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_130', advantageSkillId: 'ts_130', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_307', atkAdvantageSkillId: 'ts_130', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    fu_zhou_yanyan: { generalId: 'fu_zhou_yanyan', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_268', defBalanceSkillId: 'ts_649', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_268', defAdvantageSkillId: 'ts_515', defDisadvantageSkillId: 'ts_450', aptitude: 'leverage' , attackStyle: 'defense'},



    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_036', balanceSkillId: 'ts_173', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_122', aptitude: 'leverage' , attackStyle: 'attack'},



    cen_d_cenmeng: { generalId: 'cen_d_cenmeng', tier: 'ordinary', tacticalSkillId: 'ts_536', advantageSkillId: 'ts_536', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_536', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_685', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_181', aptitude: 'reverse', attackStyle: 'defense' },



    miao_amishi: { generalId: 'miao_amishi', tier: 'ordinary', tacticalSkillId: 'ts_265', advantageSkillId: 'ts_265', balanceSkillId: 'ts_930', disadvantageSkillId: 'ts_581', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_930', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_271', aptitude: 'reverse' , attackStyle: 'defense'},



    jiang_s_huanggai: { generalId: 'jiang_s_huanggai', tier: 'ordinary', tacticalSkillId: 'ts_436', advantageSkillId: 'ts_436', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_440', atkAdvantageSkillId: 'ts_436', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_186', aptitude: 'leverage', attackStyle: 'attack' },






    panyao_pandaxiao: { generalId: 'panyao_pandaxiao', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_696', disadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_193', aptitude: 'create' , attackStyle: 'attack'},



    chen2_zhaofan: { generalId: 'chen2_zhaofan', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_331', aptitude: 'leverage', attackStyle: 'defense' },



    qian_songjingyang: { generalId: 'qian_songjingyang', tier: 'ordinary', tacticalSkillId: 'ts_497', advantageSkillId: 'ts_497', balanceSkillId: 'ts_732', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_292', aptitude: 'leverage' , attackStyle: 'attack'},



    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_063', disadvantageSkillId: 'ts_292', atkDisadvantageSkillId: 'ts_292', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_063', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_790', aptitude: 'create' , attackStyle: 'attack'},



    jiashi_wangxuance: { generalId: 'jiashi_wangxuance', tier: 'famous', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_125', aptitude: 'leverage' , attackStyle: 'attack'},



    yangtong_chisongdezan: { generalId: 'yangtong_chisongdezan', tier: 'famous', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_464', atkBalanceSkillId: 'ts_378', atkAdvantageSkillId: 'ts_371', atkDisadvantageSkillId: 'ts_464', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'attack'},



    monpa_meire: { generalId: 'monpa_meire', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage' , attackStyle: 'defense'},



    xining_yangyingju: { generalId: 'xining_yangyingju', tier: 'ordinary', tacticalSkillId: 'ts_239', advantageSkillId: 'ts_239', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_277', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_277', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_738', aptitude: 'leverage' , attackStyle: 'attack'},



    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_051', advantageSkillId: 'ts_051', balanceSkillId: 'ts_333', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_104', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_667', aptitude: 'leverage', attackStyle: 'attack' },



    golog_wandezhaxi: { generalId: 'golog_wandezhaxi', tier: 'ordinary', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_070', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_520', atkDisadvantageSkillId: 'ts_514', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_482', aptitude: 'reverse', attackStyle: 'defense' },



    lopi_abo: { generalId: 'lopi_abo', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_689', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_056', aptitude: 'create' , attackStyle: 'attack'},



    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_545', atkDisadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_507', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_084', aptitude: 'create' , attackStyle: 'attack'},



    dingling_weilu: { generalId: 'dingling_weilu', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_136', disadvantageSkillId: 'ts_637', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_237', aptitude: 'leverage' , attackStyle: 'defense'},



        yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_132', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_664', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_664', atkAdvantageSkillId: 'ts_132', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_606', aptitude: 'create' , attackStyle: 'attack'},



            buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_796', balanceSkillId: 'ts_073', disadvantageSkillId: 'ts_793', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_793', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_595', aptitude: 'reverse' , attackStyle: 'defense'},



    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_102', disadvantageSkillId: 'ts_237', atkDisadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_102', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_644', aptitude: 'create' , attackStyle: 'attack'},



    donghui_nanlv: { generalId: 'donghui_nanlv', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_251', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_134', aptitude: 'reverse' , attackStyle: 'defense'},



    gonggu_gonggudaozhu: { generalId: 'gonggu_gonggudaozhu', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_144', aptitude: 'reverse', attackStyle: 'defense' },



    yizhi_beigou: { generalId: 'yizhi_beigou', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_111', balanceSkillId: 'ts_095', disadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_152', aptitude: 'leverage' , attackStyle: 'attack'},



    beihai_shamusheyun: { generalId: 'beihai_shamusheyun', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_085', disadvantageSkillId: 'ts_781', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_781', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_505', aptitude: 'reverse', attackStyle: 'defense' },



    sheng_d_liyiqi: { generalId: 'sheng_d_liyiqi', tier: 'ordinary', tacticalSkillId: 'ts_141', advantageSkillId: 'ts_141', balanceSkillId: 'ts_110', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_533', aptitude: 'leverage' , attackStyle: 'attack'},



    haikou_wangzhi: { generalId: 'haikou_wangzhi', tier: 'ordinary', tacticalSkillId: 'ts_170', advantageSkillId: 'ts_170', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_159', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_159', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_565', aptitude: 'leverage', attackStyle: 'attack' },



    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_296', advantageSkillId: 'ts_296', balanceSkillId: 'ts_129', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_296', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_169', aptitude: 'reverse', attackStyle: 'defense' },



    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_192', aptitude: 'leverage' , attackStyle: 'attack'},



    ava_minye_kyawswa: { generalId: 'ava_minye_kyawswa', tier: 'famous', tacticalSkillId: 'ts_556', advantageSkillId: 'ts_556', balanceSkillId: 'ts_1126', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_556', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_115', defBalanceSkillId: 'ts_288', defDisadvantageSkillId: 'ts_113', aptitude: 'reverse', attackStyle: 'defense' },






    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_214', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_214', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_592', aptitude: 'reverse' , attackStyle: 'defense'},



    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_601', atkBalanceSkillId: 'ts_1112', atkAdvantageSkillId: 'ts_135', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_217', aptitude: 'leverage' , attackStyle: 'defense'},



    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_671', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_224', aptitude: 'reverse' , attackStyle: 'defense'},



    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_703', atkBalanceSkillId: 'ts_1114', atkAdvantageSkillId: 'ts_172', atkDisadvantageSkillId: 'ts_703', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_225', aptitude: 'leverage' , attackStyle: 'defense'},



    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_137', disadvantageSkillId: 'ts_674', atkBalanceSkillId: 'ts_137', atkAdvantageSkillId: 'ts_082', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_226', aptitude: 'leverage' , attackStyle: 'defense'},



    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_432', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_228', aptitude: 'leverage' , attackStyle: 'defense'},



    // 🔴 [2026-11-01 补缺格·古典缅甸] 杜达巴翁＝普将（传说人物、缺史载实胜，四闸缺一即普将）；技能按普将通制取
    pyu_duttabaung: { generalId: 'pyu_duttabaung', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_230', aptitude: 'reverse' , attackStyle: 'defense'},
    pyu_moluo: { generalId: 'pyu_moluo', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_230', aptitude: 'reverse' , attackStyle: 'defense'},



    nongzhigao_huangshimi: { generalId: 'nongzhigao_huangshimi', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_750', defBalanceSkillId: 'ts_248', defDisadvantageSkillId: 'ts_582', aptitude: 'leverage' , attackStyle: 'attack'},



    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_139', defDisadvantageSkillId: 'ts_236', aptitude: 'reverse' , attackStyle: 'defense'},



    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_453', disadvantageSkillId: 'ts_720', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_720', defAdvantageSkillId: 'ts_782', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_243', aptitude: 'reverse' , attackStyle: 'defense'},



    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_339', advantageSkillId: 'ts_339', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse' , attackStyle: 'defense'},



    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_689', aptitude: 'reverse' , attackStyle: 'defense'},



    ruoqiang_quhulai: { generalId: 'ruoqiang_quhulai', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_249', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_729', aptitude: 'reverse' , attackStyle: 'attack'},



    weili_weilifan: { generalId: 'weili_weilifan', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_254', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_254', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_382', defDisadvantageSkillId: 'ts_747', aptitude: 'reverse' , attackStyle: 'defense'},



    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_155', disadvantageSkillId: 'ts_266', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_266', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_711', aptitude: 'reverse' , attackStyle: 'defense'},



    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_995', atkBalanceSkillId: 'ts_529', atkAdvantageSkillId: 'ts_481', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_808', aptitude: 'reverse' , attackStyle: 'defense'},



    xiye_zihe: { generalId: 'xiye_zihe', tier: 'ordinary', tacticalSkillId: 'ts_319', advantageSkillId: 'ts_319', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_762', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_438', defDisadvantageSkillId: 'ts_287', aptitude: 'reverse' , attackStyle: 'defense'},



    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_198', advantageSkillId: 'ts_198', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_297', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_297', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_174', defDisadvantageSkillId: 'ts_777', aptitude: 'create' , attackStyle: 'attack'},



    zhuoshi_gaopian: { generalId: 'zhuoshi_gaopian', tier: 'famous', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_199', disadvantageSkillId: 'ts_334', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_981', aptitude: 'create' , attackStyle: 'attack'},



    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_215', advantageSkillId: 'ts_215', balanceSkillId: 'ts_229', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_840', aptitude: 'leverage' , attackStyle: 'attack'},



    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_607', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_607', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_853', aptitude: 'leverage' , attackStyle: 'attack'},
    xihai_d_fuyun: { generalId: 'xihai_d_fuyun', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_516', disadvantageSkillId: 'ts_623', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_623', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'attack' },   // 伏允：吐谷浑可汗，无本人独立指挥的战役级胜绩 → 普将（与库内吐谷浑可汗同档）



    guzgan_abuhalisi: { generalId: 'guzgan_abuhalisi', tier: 'ordinary', tacticalSkillId: 'ts_220', advantageSkillId: 'ts_220', balanceSkillId: 'ts_246', disadvantageSkillId: 'ts_498', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_498', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_941', aptitude: 'leverage' , attackStyle: 'attack'},



    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_250', advantageSkillId: 'ts_250', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_313', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_313', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_506', defDisadvantageSkillId: 'ts_961', aptitude: 'leverage', attackStyle: 'attack' },



    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_317', aptitude: 'reverse' , attackStyle: 'defense'},



    wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_321', aptitude: 'reverse', attackStyle: 'defense' },



    xingan_hailancha: { generalId: 'xingan_hailancha', tier: 'famous', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_310', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_243', atkDisadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_447', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_058', aptitude: 'create' , attackStyle: 'attack'},



    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_057', advantageSkillId: 'ts_057', balanceSkillId: 'ts_256', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_057', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_668', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_548', aptitude: 'leverage', attackStyle: 'attack' },



    badakhshan_yaerbeige: { generalId: 'badakhshan_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_336', balanceSkillId: 'ts_467', disadvantageSkillId: 'ts_680', atkDisadvantageSkillId: 'ts_680', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_467', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_148', aptitude: 'reverse', attackStyle: 'defense' },



    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_1130', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_337', aptitude: 'reverse' , attackStyle: 'defense'},



    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_312', advantageSkillId: 'ts_312', balanceSkillId: 'ts_647', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_749', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_420', aptitude: 'create', attackStyle: 'attack' },



    sai_gaijiayun: { generalId: 'sai_gaijiayun', tier: 'famous', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_026', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_026', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_339', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_351', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 白皮书：碎叶破突骑施、擒吐火仙（具名）



    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_473', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_359', aptitude: 'leverage' , attackStyle: 'attack'},



    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_373', aptitude: 'reverse' , attackStyle: 'defense'},



    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_831', advantageSkillId: 'ts_831', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_180', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_684', aptitude: 'leverage' , attackStyle: 'attack'},



    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'ts_349', advantageSkillId: 'ts_349', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_386', aptitude: 'create' , attackStyle: 'attack'}, // 攻 → 擅攻；🔴 [2026-10-28 档位对齐] 白皮书：征建州女真、破李满住（具名）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：征建州属边境一隅，李满住之战规模有限



    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_940', advantageSkillId: 'ts_940', balanceSkillId: 'ts_942', disadvantageSkillId: 'ts_941', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_942', atkDisadvantageSkillId: 'ts_941', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_457', aptitude: 'create' , attackStyle: 'attack'},



        pangzha_halixinge: { generalId: 'pangzha_halixinge', tier: 'famous', tacticalSkillId: 'ts_424', advantageSkillId: 'ts_424', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_422', aptitude: 'create' , attackStyle: 'attack'},



        najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_485', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_485', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_429', aptitude: 'create' , attackStyle: 'attack'},



    dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_855', disadvantageSkillId: 'ts_502', atkDisadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_855', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_431', aptitude: 'leverage', attackStyle: 'attack' },



    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_455', advantageSkillId: 'ts_455', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_494', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_451', aptitude: 'create' , attackStyle: 'attack'},



    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_264', disadvantageSkillId: 'ts_461', atkDisadvantageSkillId: 'ts_461', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_264', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_502', aptitude: 'leverage', attackStyle: 'attack' },



            hali_gedaerzi: { generalId: 'hali_gedaerzi', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_360', disadvantageSkillId: 'ts_533', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_462', advantageSkillId: 'ts_462', balanceSkillId: 'ts_368', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_108', aptitude: 'leverage' , attackStyle: 'attack'},






        delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_500', advantageSkillId: 'ts_500', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_498', atkAdvantageSkillId: 'ts_500', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_498', defAdvantageSkillId: 'ts_487', defBalanceSkillId: 'ts_377', defDisadvantageSkillId: 'ts_499', aptitude: 'leverage' , attackStyle: 'defense'},



        huluo_jiyasiding: { generalId: 'huluo_jiyasiding', tier: 'famous', tacticalSkillId: 'ts_510', advantageSkillId: 'ts_510', balanceSkillId: 'ts_441', disadvantageSkillId: 'ts_457', atkDisadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_441', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_533', aptitude: 'create' , attackStyle: 'attack'},



        aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_522', advantageSkillId: 'ts_522', balanceSkillId: 'ts_942', disadvantageSkillId: 'ts_464', atkDisadvantageSkillId: 'ts_464', defDisadvantageSkillId: 'ts_463', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_942', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1102', aptitude: 'create' , attackStyle: 'balanced'}, // 俘瓦勒良等攻守 → 双行



    wenling_shilang: { generalId: 'wenling_shilang', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_176', disadvantageSkillId: 'ts_807', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_807', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_323', aptitude: 'leverage', attackStyle: 'attack' },



        qianzhou_lisheng: { generalId: 'qianzhou_lisheng', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_590', atkDisadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_757', defAdvantageSkillId: 'ts_099', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_459', aptitude: 'leverage' , attackStyle: 'balanced'}, // 收复京城攻 + 泾原等 → 双行



    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_374', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_920', atkAdvantageSkillId: 'ts_374', defDisadvantageSkillId: 'ts_387', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_920', defAdvantageSkillId: 'ts_546', defBalanceSkillId: 'ts_1103', aptitude: 'create' , attackStyle: 'defense'}, // 保境安民为主 → 擅守



    shaozhou_d_mayin: { generalId: 'shaozhou_d_mayin', tier: 'ordinary', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_092', balanceSkillId: 'ts_752', disadvantageSkillId: 'ts_440', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_752', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_463', aptitude: 'leverage' , attackStyle: 'attack'},



        song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'ts_341', advantageSkillId: 'ts_341', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_449', atkBalanceSkillId: 'ts_1117', defBalanceSkillId: 'ts_448', atkAdvantageSkillId: 'ts_341', atkDisadvantageSkillId: 'ts_449', defAdvantageSkillId: 'ts_025', defDisadvantageSkillId: 'ts_479', aptitude: 'create' , attackStyle: 'attack'},



    chuzhou_d_huangfuhui: { generalId: 'chuzhou_d_huangfuhui', tier: 'ordinary', tacticalSkillId: 'ts_316', advantageSkillId: 'ts_316', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_123', atkBalanceSkillId: 'ts_448', atkAdvantageSkillId: 'ts_316', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_011', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_993', aptitude: 'leverage' , attackStyle: 'defense'},



    xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_367', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_651', aptitude: 'leverage', attackStyle: 'balanced' }, // 西域攻抚兼守 → 双行



    zizhou_wangjian: { generalId: 'zizhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_791', balanceSkillId: 'ts_524', disadvantageSkillId: 'ts_131', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_492', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 白皮书：平定两川（陈敬瑄/顾彦晖具名）、建前蜀



    cangzhou_liurengong: { generalId: 'cangzhou_liurengong', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_990', defDisadvantageSkillId: 'ts_209', aptitude: 'leverage', attackStyle: 'defense' },



    yuezhi_xihou: { generalId: 'yuezhi_xihou', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_664', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_664', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_649', defDisadvantageSkillId: 'ts_233', aptitude: 'reverse' , attackStyle: 'defense'},



    minyue_wuzhu: { generalId: 'minyue_wuzhu', tier: 'ordinary', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_557', disadvantageSkillId: 'ts_483', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_483', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_756', aptitude: 'leverage' , attackStyle: 'attack'},



    funan_fanman: { generalId: 'funan_fanman', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_612', defDisadvantageSkillId: 'ts_116', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_612', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_614', aptitude: 'create', attackStyle: 'attack' },   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 征服十余国＝扩张头衔、无具名胜→普将



    lancang_faang: { generalId: 'lancang_faang', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_142', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_493', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 统一老挝建澜沧＝纯头衔、无具名胜→普将



    ahaomu_laqite: { generalId: 'ahaomu_laqite', tier: 'famous', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_164', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-10-28 档位对齐] 白皮书：萨莱加特之战大破莫卧儿（具名）、保阿萨姆



    elunchunzu_gaishan: { generalId: 'elunchunzu_gaishan', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_465', disadvantageSkillId: 'ts_384', atkBalanceSkillId: 'ts_465', atkAdvantageSkillId: 'ts_365', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_784', aptitude: 'leverage' , attackStyle: 'attack'},



    wazu_banhongwang: { generalId: 'wazu_banhongwang', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_187', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_551', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'attack'},



    tajikezu_kuerban: { generalId: 'tajikezu_kuerban', tier: 'ordinary', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_535', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_512', aptitude: 'reverse' , attackStyle: 'attack'},



    jingpozu_zaodan: { generalId: 'jingpozu_zaodan', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_150', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_518', aptitude: 'reverse' , attackStyle: 'defense'},



    shuizu_panxinjian: { generalId: 'shuizu_panxinjian', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_234', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_662', aptitude: 'leverage' , attackStyle: 'attack'},



    liuzhou_shenxiyi: { generalId: 'liuzhou_shenxiyi', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_178', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_534', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 平广西瑶壮诸乱＝治安战→普将



    luming_luxiangsheng: { generalId: 'luming_luxiangsheng', tier: 'famous', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_191', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_646', aptitude: 'create' , attackStyle: 'attack'},



    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_298', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_678', aptitude: 'create' , attackStyle: 'attack'},



        shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_725', atkBalanceSkillId: 'ts_604', atkAdvantageSkillId: 'ts_135', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_651', aptitude: 'create' , attackStyle: 'defense'}, // 持重安边不穷兵 → 擅守



        weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_319', advantageSkillId: 'ts_319', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_450', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_700', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_734', aptitude: 'create' , attackStyle: 'balanced'}, // 西川拒吐蕃守 + 出击 → 双行



    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_569', advantageSkillId: 'ts_569', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_306', atkBalanceSkillId: 'ts_1115', defAdvantageSkillId: 'ts_694', atkAdvantageSkillId: 'ts_569', atkDisadvantageSkillId: 'ts_306', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_573', aptitude: 'create' , attackStyle: 'attack'},



    dongsheng_weishang: { generalId: 'dongsheng_weishang', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_1117', disadvantageSkillId: 'ts_216', atkBalanceSkillId: 'ts_1117', atkAdvantageSkillId: 'ts_213', atkDisadvantageSkillId: 'ts_216', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_732', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage' , attackStyle: 'defense'},



    weiyuan_d_niangengyao: { generalId: 'weiyuan_d_niangengyao', tier: 'famous', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_609', balanceSkillId: 'ts_097', disadvantageSkillId: 'ts_272', atkDisadvantageSkillId: 'ts_272', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_097', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_726', aptitude: 'create' , attackStyle: 'attack'},



    yansui_wangwei: { generalId: 'yansui_wangwei', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_251', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_238', aptitude: 'reverse' , attackStyle: 'defense'},



    xiazhou_lijiqian: { generalId: 'xiazhou_lijiqian', tier: 'famous', tacticalSkillId: 'ts_558', advantageSkillId: 'ts_558', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_379', atkBalanceSkillId: 'ts_1118', atkAdvantageSkillId: 'ts_558', atkDisadvantageSkillId: 'ts_379', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_696', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage' , attackStyle: 'attack'},



    shizhou_liucong: { generalId: 'shizhou_liucong', tier: 'famous', tacticalSkillId: 'ts_591', advantageSkillId: 'ts_591', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_698', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_698', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_702', defDisadvantageSkillId: 'ts_200', aptitude: 'leverage' , attackStyle: 'attack'},



    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'famous', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_529', disadvantageSkillId: 'ts_994', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_994', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_153', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-25 主人令按标准修复] 普将→名将：突沦川夜袭、鸭绿水斩首三万、两任辽东道行军大总管（《旧唐书·卷一〇九·契苾何力传》）

    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'famous', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_1119', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_701', aptitude: 'create' , attackStyle: 'defense'},

    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_559', advantageSkillId: 'ts_559', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_182', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_081', aptitude: 'leverage', attackStyle: 'attack' },

    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_575', advantageSkillId: 'ts_575', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_206', atkAdvantageSkillId: 'ts_575', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_206', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_708', aptitude: 'leverage' , attackStyle: 'defense'},

    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_782', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_746', atkAdvantageSkillId: 'ts_782', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_746', defAdvantageSkillId: 'ts_060', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_207', aptitude: 'leverage' , attackStyle: 'defense'},

    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_597', advantageSkillId: 'ts_597', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_776', defDisadvantageSkillId: 'ts_231', aptitude: 'leverage', attackStyle: 'attack' },

    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_930', disadvantageSkillId: 'ts_854', atkBalanceSkillId: 'ts_930', atkAdvantageSkillId: 'ts_066', atkDisadvantageSkillId: 'ts_854', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_241', aptitude: 'leverage' , attackStyle: 'defense'},

    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_841', disadvantageSkillId: 'ts_902', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_902', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_255', aptitude: 'leverage', attackStyle: 'attack' },

    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_971', atkBalanceSkillId: 'ts_1122', atkAdvantageSkillId: 'ts_371', atkDisadvantageSkillId: 'ts_971', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_900', defDisadvantageSkillId: 'ts_370', aptitude: 'leverage' , attackStyle: 'attack'},

    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_622', advantageSkillId: 'ts_622', balanceSkillId: 'ts_663', disadvantageSkillId: 'ts_545', defBalanceSkillId: 'ts_1129', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_663', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_950', defDisadvantageSkillId: 'ts_988', aptitude: 'reverse' , attackStyle: 'defense'},

    gaxa_zhashi: { generalId: 'gaxa_zhashi', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_261', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_261', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_998', aptitude: 'reverse' , attackStyle: 'defense'},

    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'ordinary', tacticalSkillId: 'ts_619', advantageSkillId: 'ts_619', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_369', atkDisadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_619', atkBalanceSkillId: 'ts_049', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_514', aptitude: 'leverage' , attackStyle: 'defense'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 碉楼抗清属悲壮抵抗、无实质大胜→普将

    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_694', advantageSkillId: 'ts_694', balanceSkillId: 'ts_520', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_694', atkBalanceSkillId: 'ts_520', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage' , attackStyle: 'defense'},

    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_370', atkDisadvantageSkillId: 'ts_370', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_616', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_012', aptitude: 'create' , attackStyle: 'attack'},   // 🔴 [2026-10-28 档位对齐] 🔴[2026-10-28 按分级标准降档] 拉达克扩张＝头衔、无具名胜→普将

        khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_553', advantageSkillId: 'ts_553', balanceSkillId: 'ts_063', disadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_553', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_281', defAdvantageSkillId: 'ts_751', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_1132', aptitude: 'create' , attackStyle: 'attack'},

    yanzhou_zhongshiheng: { generalId: 'yanzhou_zhongshiheng', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_147', disadvantageSkillId: 'ts_383', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_383', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_013', aptitude: 'leverage' , attackStyle: 'defense'},

    pingnan_muying: { generalId: 'pingnan_muying', tier: 'famous', tacticalSkillId: 'ts_496', atkBalanceSkillId: 'ts_485', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_1110', atkAdvantageSkillId: 'ts_496', defDisadvantageSkillId: 'ts_523', aptitude: 'create', attackStyle: 'attack' },

    yuan_cj_d_lishuo: { generalId: 'yuan_cj_d_lishuo', tier: 'famous', tacticalSkillId: 'ts_911', atkAdvantageSkillId: 'ts_911', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_181', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_912', aptitude: 'leverage', attackStyle: 'attack' }, // 雪夜入蔡州·奇袭斩首 → 擅攻
    cangsong_machao: { generalId: 'cangsong_machao', tier: 'ordinary', tacticalSkillId: 'ts_796', atkDisadvantageSkillId: 'ts_268', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_073', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_581', aptitude: 'create', attackStyle: 'attack' },
    manghuti_weidaer: { generalId: 'manghuti_weidaer', tier: 'ordinary', tacticalSkillId: 'ts_235', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_237', aptitude: 'create', attackStyle: 'attack' },
    chenli_d_zuoxianwang: { generalId: 'chenli_d_zuoxianwang', tier: 'ordinary', tacticalSkillId: 'ts_911', atkDisadvantageSkillId: 'ts_830', atkAdvantageSkillId: 'ts_911', atkBalanceSkillId: 'ts_1125', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_181', aptitude: 'leverage', attackStyle: 'defense' },
    weiming_weiminglinggong: { generalId: 'weiming_weiminglinggong', tier: 'ordinary', tacticalSkillId: 'ts_570', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_272', aptitude: 'leverage', attackStyle: 'attack' },
    yang_aner_yangan: { generalId: 'yang_aner_yangan', tier: 'ordinary', tacticalSkillId: 'ts_812', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_295', defAdvantageSkillId: 'ts_301', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_056', aptitude: 'leverage', attackStyle: 'attack' },
    xingwei_hanba: { generalId: 'xingwei_hanba', tier: 'ordinary', tacticalSkillId: 'ts_813', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_084', aptitude: 'create', attackStyle: 'attack' },
    saerbadaer_lazhake: { generalId: 'saerbadaer_lazhake', tier: 'ordinary', tacticalSkillId: 'ts_138', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_387', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_498', aptitude: 'reverse', attackStyle: 'defense' },
    kumisi_aerpu: { generalId: 'kumisi_aerpu', tier: 'ordinary', tacticalSkillId: 'ts_183', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_104', aptitude: 'reverse', attackStyle: 'attack' },
    shahelude_weisitamu: { generalId: 'shahelude_weisitamu', tier: 'famous', tacticalSkillId: 'ts_870',  atkAdvantageSkillId: 'ts_870',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_1133',  defAdvantageSkillId: 'ts_195',  defBalanceSkillId: 'ts_110',  defDisadvantageSkillId: 'ts_171', aptitude: 'create', attackStyle: 'attack' },
    ribale_faheerdaolai: { generalId: 'ribale_faheerdaolai', tier: 'ordinary', tacticalSkillId: 'ts_901', atkAdvantageSkillId: 'ts_901', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'defense' },
    yilihanguo_d_hezan: { generalId: 'yilihanguo_d_hezan', tier: 'ordinary', tacticalSkillId: 'ts_184', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_102', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_464', aptitude: 'leverage', attackStyle: 'attack' },
    yilihanguo_yisimeier: { generalId: 'yilihanguo_yisimeier', tier: 'famous', tacticalSkillId: 'ts_210', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_463', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_460', aptitude: 'create', attackStyle: 'attack' },
    asaibaijiang_xuliewu: { generalId: 'asaibaijiang_xuliewu', tier: 'famous', tacticalSkillId: 'ts_289', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_188', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_738', aptitude: 'create', attackStyle: 'attack' },
    wulaertu_ajishenti: { generalId: 'wulaertu_ajishenti', tier: 'ordinary', tacticalSkillId: 'ts_940', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_470', aptitude: 'create', attackStyle: 'attack' },
    wulaertu_guo_saerdu: { generalId: 'wulaertu_guo_saerdu', tier: 'ordinary', tacticalSkillId: 'ts_987', atkAdvantageSkillId: 'ts_987', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_122', defAdvantageSkillId: 'ts_244', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_477', aptitude: 'create', attackStyle: 'attack' },
    gelujiya_tamaer: { generalId: 'gelujiya_tamaer', tier: 'ordinary', tacticalSkillId: 'ts_120', atkBalanceSkillId: 'ts_280', atkAdvantageSkillId: 'ts_120', atkDisadvantageSkillId: 'ts_482', defAdvantageSkillId: 'ts_082', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_125', aptitude: 'reverse', attackStyle: 'attack' },
    bendou_alikesai: { generalId: 'bendou_alikesai', tier: 'ordinary', tacticalSkillId: 'ts_140', atkAdvantageSkillId: 'ts_140', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_154', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_329', aptitude: 'create', attackStyle: 'defense' },
    keerjisi_bagelate: { generalId: 'keerjisi_bagelate', tier: 'ordinary', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_134', aptitude: 'reverse', attackStyle: 'defense' },
    saipulusi_juyi: { generalId: 'saipulusi_juyi', tier: 'ordinary', tacticalSkillId: 'ts_343', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_137', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_144', aptitude: 'leverage', attackStyle: 'attack' },
    bendou_d_mitelidati: { generalId: 'bendou_d_mitelidati', tier: 'famous', tacticalSkillId: 'ts_445', atkBalanceSkillId: 'ts_1103', atkAdvantageSkillId: 'ts_445', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_608', aptitude: 'reverse', attackStyle: 'balanced' }, // 米特拉达梯战争攻守 → 双行
    heti_muwatali: { generalId: 'heti_muwatali', tier: 'famous', tacticalSkillId: 'ts_446', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_585', aptitude: 'leverage', attackStyle: 'defense' },
    fulijiya_maidasi: { generalId: 'fulijiya_maidasi', tier: 'ordinary', tacticalSkillId: 'ts_476', atkBalanceSkillId: 'ts_155', atkAdvantageSkillId: 'ts_476', atkDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_590', aptitude: 'create', attackStyle: 'defense' },
    ldiya_keluoyisi: { generalId: 'ldiya_keluoyisi', tier: 'ordinary', tacticalSkillId: 'ts_015', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_174', atkDisadvantageSkillId: 'ts_159', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_592', aptitude: 'reverse', attackStyle: 'attack' },
    pajiama_oumainisi: { generalId: 'pajiama_oumainisi', tier: 'famous', tacticalSkillId: 'ts_481', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_169', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_601', aptitude: 'leverage', attackStyle: 'attack' },
    bitiniya_diaoduoer: { generalId: 'bitiniya_diaoduoer', tier: 'ordinary', tacticalSkillId: 'ts_544', atkDisadvantageSkillId: 'ts_606', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_1123', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_186', aptitude: 'reverse', attackStyle: 'defense' },
    luomu_jilijie: { generalId: 'luomu_jilijie', tier: 'famous', tacticalSkillId: 'ts_554', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_192', aptitude: 'create', attackStyle: 'attack' },
    osman_mehmed_ii: { generalId: 'osman_mehmed_ii', tier: 'famous', tacticalSkillId: 'ts_570', advantageSkillId: 'ts_570', balanceSkillId: 'ts_328', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_328', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_193', aptitude: 'create', attackStyle: 'attack' }, // 1453 攻陷君士坦丁堡；专属攻城技待主人定
    sailiugu_antiaoke: { generalId: 'sailiugu_antiaoke', tier: 'famous', tacticalSkillId: 'ts_005', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_214', aptitude: 'reverse', attackStyle: 'attack' },
    womaya_muaweiye: { generalId: 'womaya_muaweiye', tier: 'famous', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_199', defDisadvantageSkillId: 'ts_217', aptitude: 'reverse', attackStyle: 'balanced' }, // 叙利亚攻守兼基业 → 双行
    xibolai_dawei: { generalId: 'xibolai_dawei', tier: 'famous', tacticalSkillId: 'ts_629', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_229', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse', attackStyle: 'balanced' }, // 统一以色列攻守 → 双行
    shengdian_qishi_demolai: { generalId: 'shengdian_qishi_demolai', tier: 'ordinary', tacticalSkillId: 'ts_304', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_648', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_224', aptitude: 'reverse', attackStyle: 'defense' },
    maerta_qishi_walaite: { generalId: 'maerta_qishi_walaite', tier: 'famous', tacticalSkillId: 'ts_311', atkAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_382', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_652', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_225', aptitude: 'reverse', attackStyle: 'defense' },
    dibisi_tutemosi: { generalId: 'dibisi_tutemosi', tier: 'ordinary', tacticalSkillId: 'ts_036', defDisadvantageSkillId: 'ts_674', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_226', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_453', aptitude: 'reverse', attackStyle: 'attack' },
    aiji_lameisisi: { generalId: 'aiji_lameisisi', tier: 'famous', tacticalSkillId: 'ts_005', defDisadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_211', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1112', aptitude: 'reverse', attackStyle: 'balanced' }, // 卡叠石等 → 双行
    tuolemi_tuolemi: { generalId: 'tuolemi_tuolemi', tier: 'famous', tacticalSkillId: 'ts_039', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_228', aptitude: 'create', attackStyle: 'attack' },
    yashu_saergong: { generalId: 'yashu_saergong', tier: 'famous', tacticalSkillId: 'ts_005', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_720', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_230', aptitude: 'leverage', attackStyle: 'attack' },
    youfaladi_yehaiya: { generalId: 'youfaladi_yehaiya', tier: 'ordinary', tacticalSkillId: 'ts_668', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_236', aptitude: 'create', attackStyle: 'defense' },
    qiliqiya_pangpei: { generalId: 'qiliqiya_pangpei', tier: 'famous', tacticalSkillId: 'ts_564', atkAdvantageSkillId: 'ts_564', atkBalanceSkillId: 'ts_438', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_051', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_243', aptitude: 'leverage', attackStyle: 'attack' },
    aqimeinide_daliushi: { generalId: 'aqimeinide_daliushi', tier: 'famous', tacticalSkillId: 'ts_692', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_090', aptitude: 'leverage', attackStyle: 'attack' },
    daliushi_iii: { generalId: 'daliushi_iii', tier: 'ordinary', tacticalSkillId: 'ts_749', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_249', aptitude: 'reverse', attackStyle: 'attack' },
    sashan_aerdaxier: { generalId: 'sashan_aerdaxier', tier: 'famous', tacticalSkillId: 'ts_785', atkBalanceSkillId: 'ts_264', atkAdvantageSkillId: 'ts_785', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_254', aptitude: 'create', attackStyle: 'attack' },
    mamuluke_baibaisi: { generalId: 'mamuluke_baibaisi', tier: 'famous', tacticalSkillId: 'ts_792', atkBalanceSkillId: 'ts_333', atkAdvantageSkillId: 'ts_792', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_263', aptitude: 'create', attackStyle: 'attack' }, // 拜巴尔斯：阿音贾鲁特击败蒙古 → 擅攻
    jialedi_nibujianisa: { generalId: 'jialedi_nibujianisa', tier: 'famous', tacticalSkillId: 'ts_070', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_840', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_360', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage', attackStyle: 'attack' },
    paermila_zhinuobiya: { generalId: 'paermila_zhinuobiya', tier: 'ordinary', tacticalSkillId: 'ts_806', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_1132', aptitude: 'reverse', attackStyle: 'attack' }, // 帕尔米拉扩张与抗罗 → 双行
    samaila_muataisuimu: { generalId: 'samaila_muataisuimu', tier: 'famous', tacticalSkillId: 'ts_850', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_271', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_853', aptitude: 'leverage', attackStyle: 'attack' },
    xikesuosi_salidi: { generalId: 'xikesuosi_salidi', tier: 'ordinary', tacticalSkillId: 'ts_960', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_536', defBalanceSkillId: 'ts_447', defDisadvantageSkillId: 'ts_738', aptitude: 'leverage', attackStyle: 'attack' },
    midi_daiaokaisi: { generalId: 'midi_daiaokaisi', tier: 'ordinary', tacticalSkillId: 'ts_111', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_467', defDisadvantageSkillId: 'ts_277', aptitude: 'create', attackStyle: 'defense' },
    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_669', defAdvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_669', atkBalanceSkillId: 'ts_990', atkDisadvantageSkillId: 'ts_512', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_961', aptitude: 'reverse', attackStyle: 'defense' },
    ming_yanghong: { generalId: 'ming_yanghong', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_377', defDisadvantageSkillId: 'ts_573', aptitude: 'leverage', attackStyle: 'defense' }, // 杨洪：宣府镇总兵，擅守
    hou_zhou_guowei: { generalId: 'hou_zhou_guowei', tier: 'famous', tacticalSkillId: 'ts_444', advantageSkillId: 'ts_444', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_448', defDisadvantageSkillId: 'ts_287', aptitude: 'leverage', attackStyle: 'balanced' }, // 郭威：后周太祖，邺都起兵
    song_lijilong: { generalId: 'song_lijilong', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_702', defDisadvantageSkillId: 'ts_317', aptitude: 'create', attackStyle: 'defense' }, // 李继隆：澶州守城
    safawei_d_abasi: { generalId: 'safawei_d_abasi', tier: 'famous', tacticalSkillId: 'ts_130', atkAdvantageSkillId: 'ts_130', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_292', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_912', aptitude: 'leverage', attackStyle: 'balanced' },
    sumeier_zhajixi: { generalId: 'sumeier_zhajixi', tier: 'ordinary', tacticalSkillId: 'ts_401', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_297', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'defense' },
    ayoubu_salaheding: { generalId: 'ayoubu_salaheding', tier: 'famous', tacticalSkillId: 'ts_401', defBalanceSkillId: 'ts_472', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_219', defAdvantageSkillId: 'ts_913', defDisadvantageSkillId: 'ts_941', aptitude: 'leverage', attackStyle: 'balanced' },
    // ── 2026-08-04 新增：鲍德温 @ 埃德萨／奥斯若恩 ──
    aosiruowen_baodewen: { generalId: 'aosiruowen_baodewen', tier: 'famous', tacticalSkillId: 'ts_132', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_240', aptitude: 'leverage', attackStyle: 'attack' },
    gen_baodewen_iv: { generalId: 'gen_baodewen_iv', tier: 'famous', tacticalSkillId: 'ts_141', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_984', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_302', aptitude: 'leverage', attackStyle: 'attack' },
    ansxi_aershake: { generalId: 'ansxi_aershake', tier: 'famous', tacticalSkillId: 'ts_163', advantageSkillId: 'ts_163', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_276', atkDisadvantageSkillId: 'ts_276', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_675', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_991', aptitude: 'create', attackStyle: 'attack' },
    nabatai_aleitasi: { generalId: 'nabatai_aleitasi', tier: 'famous', tacticalSkillId: 'ts_570', advantageSkillId: 'ts_570', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_313', aptitude: 'reverse', attackStyle: 'defense' }, // 纳巴泰据险 → 擅守
    xike_lanjite: { generalId: 'xike_lanjite', tier: 'famous', tacticalSkillId: 'ts_170', advantageSkillId: 'ts_170', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_506', defDisadvantageSkillId: 'ts_321', aptitude: 'create', attackStyle: 'attack' },
    deli_alawuding: { generalId: 'deli_alawuding', tier: 'famous', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_384', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_524', defDisadvantageSkillId: 'ts_331', aptitude: 'create', attackStyle: 'attack' },
    mowoer_akeba: { generalId: 'mowoer_akeba', tier: 'famous', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_172', balanceSkillId: 'ts_754', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_334', aptitude: 'create', attackStyle: 'attack' },
    jieri_jieriwang: { generalId: 'jieri_jieriwang', tier: 'famous', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_855', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },
    zhuluo_lajindela: { generalId: 'zhuluo_lajindela', tier: 'famous', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_1118', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },
    kongque_zhantuoluo: { generalId: 'kongque_zhantuoluo', tier: 'famous', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_177', balanceSkillId: 'ts_473', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_177', atkBalanceSkillId: 'ts_473', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_337', aptitude: 'create', attackStyle: 'attack' },
    mojietuo_pinbisuoluo: { generalId: 'mojietuo_pinbisuoluo', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_033', balanceSkillId: 'ts_024', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_345', aptitude: 'create', attackStyle: 'attack' },
    // 高达城·毗阇耶：普将（传说人物，不作名将）· 逆势 · 善攻（渡海远征立国）
    boluo_vijaya: { generalId: 'boluo_vijaya', tier: 'ordinary', tacticalSkillId: 'ts_198',  atkAdvantageSkillId: 'ts_198',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_240',  defAdvantageSkillId: 'ts_126',  defBalanceSkillId: 'ts_485',  defDisadvantageSkillId: 'ts_076', aptitude: 'reverse', attackStyle: 'attack' },
    boluo_damoboluo: { generalId: 'boluo_damoboluo', tier: 'famous', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_494', disadvantageSkillId: 'ts_351', atkDisadvantageSkillId: 'ts_351', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_494', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_079', aptitude: 'create', attackStyle: 'attack' },
    sumo_sumowang: { generalId: 'sumo_sumowang', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_557', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_359', aptitude: 'reverse', attackStyle: 'defense' },
    jiashi_jiashiwang_d: { generalId: 'jiashi_jiashiwang_d', tier: 'ordinary', tacticalSkillId: 'ts_215', advantageSkillId: 'ts_215', balanceSkillId: 'ts_604', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_373', aptitude: 'reverse', attackStyle: 'defense' },
    beileinisi_tuolemiershi: { generalId: 'beileinisi_tuolemiershi', tier: 'ordinary', tacticalSkillId: 'ts_220', advantageSkillId: 'ts_220', balanceSkillId: 'ts_614', disadvantageSkillId: 'ts_116', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_614', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_245', aptitude: 'reverse', attackStyle: 'defense' },
    dedan_dedanwang: { generalId: 'dedan_dedanwang', tier: 'ordinary', tacticalSkillId: 'ts_082', advantageSkillId: 'ts_082', balanceSkillId: 'ts_053', disadvantageSkillId: 'ts_1131', defDisadvantageSkillId: 'ts_123', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1123', aptitude: 'leverage', attackStyle: 'defense' },
    maidina_halide: { generalId: 'maidina_halide', tier: 'famous', tacticalSkillId: 'ts_154', advantageSkillId: 'ts_154', balanceSkillId: 'ts_649', disadvantageSkillId: 'ts_131', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_386', aptitude: 'create', attackStyle: 'attack' },
    emesene_xierkuhe: { generalId: 'emesene_xierkuhe', tier: 'famous', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_033', balanceSkillId: 'ts_670', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_142', aptitude: 'create', attackStyle: 'attack' },   // 希尔库赫：霍姆斯固守＋三征埃及（攻优并力摧坚／守均凭险摧锐）
    gulaishi_aibu: { generalId: 'gulaishi_aibu', tier: 'ordinary', tacticalSkillId: 'ts_570', advantageSkillId: 'ts_570', balanceSkillId: 'ts_495', disadvantageSkillId: 'ts_711', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_495', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_429', aptitude: 'reverse', attackStyle: 'defense' },
    xierwan_farukusha: { generalId: 'xierwan_farukusha', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_551', disadvantageSkillId: 'ts_146', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_551', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_431', aptitude: 'reverse', attackStyle: 'defense' },
    xiemian_xiemianwang: { generalId: 'xiemian_xiemianwang', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_696', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'defense' },
    yidier_yidiewang: { generalId: 'yidier_yidiewang', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_567', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_567', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_750', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'defense' },
    salai_salaiwang: { generalId: 'salai_salaiwang', tier: 'ordinary', tacticalSkillId: 'ts_239', advantageSkillId: 'ts_239', balanceSkillId: 'ts_710', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_457', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_505', aptitude: 'leverage', attackStyle: 'defense' },
    xierhe_saerjue: { generalId: 'xierhe_saerjue', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_757', disadvantageSkillId: 'ts_1131', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_680', aptitude: 'create', attackStyle: 'attack' },
    mangshi_mangshiwang: { generalId: 'mangshi_mangshiwang', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_732', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_459', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_150', aptitude: 'leverage', attackStyle: 'defense' },
    jibei_wangkuang: { generalId: 'jibei_wangkuang', tier: 'ordinary', tacticalSkillId: 'ts_083', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_776', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_479', aptitude: 'leverage', attackStyle: 'attack' },



    gen_abd_al_rahman_iii: { generalId: 'gen_abd_al_rahman_iii', tier: 'famous', tacticalSkillId: 'ts_074', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_483', aptitude: 'create', attackStyle: 'attack' },
    gen_afonso_henriques: { generalId: 'gen_afonso_henriques', tier: 'famous', tacticalSkillId: 'ts_078', atkBalanceSkillId: 'ts_1118', atkAdvantageSkillId: 'ts_078', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_492', aptitude: 'create', attackStyle: 'attack' },
    gen_alain_i: { generalId: 'gen_alain_i', tier: 'ordinary', tacticalSkillId: 'ts_289', atkBalanceSkillId: 'ts_757', atkAdvantageSkillId: 'ts_289', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_182', aptitude: 'leverage', attackStyle: 'attack' },
    gen_albert_riga: { generalId: 'gen_albert_riga', tier: 'ordinary', tacticalSkillId: 'ts_086', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_518', aptitude: 'leverage', attackStyle: 'attack' },
    gen_albrecht_bear: { generalId: 'gen_albrecht_bear', tier: 'ordinary', tacticalSkillId: 'ts_250', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_700', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_191', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alexander_great: { generalId: 'gen_alexander_great', tier: 'famous', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_534', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_200', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alexander_nef: { generalId: 'gen_alexander_nef', tier: 'famous', tacticalSkillId: 'ts_117', atkBalanceSkillId: 'ts_737', atkAdvantageSkillId: 'ts_117', atkDisadvantageSkillId: 'ts_543', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_206', aptitude: 'create', attackStyle: 'defense' },
    luosi_dmitry_aleksandrovich: { generalId: 'luosi_dmitry_aleksandrovich', tier: 'ordinary', tacticalSkillId: 'ts_135', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_207', defAdvantageSkillId: 'ts_138', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_209', aptitude: 'create', attackStyle: 'balanced' },
    xinbuli_boiorix: { generalId: 'xinbuli_boiorix', tier: 'ordinary', tacticalSkillId: 'ts_183', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_216', defAdvantageSkillId: 'ts_184', defBalanceSkillId: 'ts_752', defDisadvantageSkillId: 'ts_231', aptitude: 'create', attackStyle: 'attack' },
    awaer_bayan: { generalId: 'awaer_bayan', tier: 'ordinary', tacticalSkillId: 'ts_201', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_233', defAdvantageSkillId: 'ts_210', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_234', aptitude: 'create', attackStyle: 'attack' },
    baizanting_belisarius: { generalId: 'baizanting_belisarius', tier: 'famous', tacticalSkillId: 'ts_213', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_238', defAdvantageSkillId: 'ts_235', defBalanceSkillId: 'ts_049', defDisadvantageSkillId: 'ts_241', aptitude: 'create', attackStyle: 'attack' },
    chenla_jayavarman_ii: { generalId: 'chenla_jayavarman_ii', tier: 'ordinary', tacticalSkillId: 'ts_787', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_255', defAdvantageSkillId: 'ts_289', defBalanceSkillId: 'ts_061', defDisadvantageSkillId: 'ts_261', aptitude: 'create', attackStyle: 'attack' },
    chenla_bhavavarman: { generalId: 'chenla_bhavavarman', tier: 'ordinary', tacticalSkillId: 'ts_308', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_614', atkDisadvantageSkillId: 'ts_281', defAdvantageSkillId: 'ts_319', defBalanceSkillId: 'ts_085', defDisadvantageSkillId: 'ts_291', aptitude: 'create', attackStyle: 'attack' },
    boximiya_wallenstein: { generalId: 'boximiya_wallenstein', tier: 'famous', tacticalSkillId: 'ts_322', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_295', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_102', defDisadvantageSkillId: 'ts_298', aptitude: 'create', attackStyle: 'attack' },
    yidali_wangguo_garibaldi: { generalId: 'yidali_wangguo_garibaldi', tier: 'famous', tacticalSkillId: 'ts_365', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_371', defBalanceSkillId: 'ts_196', defDisadvantageSkillId: 'ts_323', aptitude: 'create', attackStyle: 'attack' },
    luxitaniya_viriathus: { generalId: 'luxitaniya_viriathus', tier: 'ordinary', tacticalSkillId: 'ts_401', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_137', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_252', defDisadvantageSkillId: 'ts_370', aptitude: 'create', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：卢西塔尼亚游击抗罗马，一隅且终败
    tuoerkete_topiltzin: { generalId: 'tuoerkete_topiltzin', tier: 'ordinary', tacticalSkillId: 'ts_443', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_383', defAdvantageSkillId: 'ts_444', defBalanceSkillId: 'ts_288', defDisadvantageSkillId: 'ts_387', aptitude: 'create', attackStyle: 'attack' },
    yadian_gongguo_otto: { generalId: 'yadian_gongguo_otto', tier: 'ordinary', tacticalSkillId: 'ts_445', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_446', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_440', aptitude: 'create', attackStyle: 'attack' },
    mayapan_hunac_ceel: { generalId: 'mayapan_hunac_ceel', tier: 'ordinary', tacticalSkillId: 'ts_476', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_174', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_481', defBalanceSkillId: 'ts_328', defDisadvantageSkillId: 'ts_460', aptitude: 'create', attackStyle: 'attack' },
    songhai_askia_muhammad: { generalId: 'songhai_askia_muhammad', tier: 'famous', tacticalSkillId: 'ts_511', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_464', defAdvantageSkillId: 'ts_544', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_470', aptitude: 'create', attackStyle: 'attack' },
    shahi_jayapala: { generalId: 'shahi_jayapala', tier: 'ordinary', tacticalSkillId: 'ts_554', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_477', defAdvantageSkillId: 'ts_570', defBalanceSkillId: 'ts_367', defDisadvantageSkillId: 'ts_482', aptitude: 'create', attackStyle: 'attack' },
    xisa_chastana: { generalId: 'xisa_chastana', tier: 'ordinary', tacticalSkillId: 'ts_629', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_648', defBalanceSkillId: 'ts_382', defDisadvantageSkillId: 'ts_508', aptitude: 'create', attackStyle: 'attack' },
    xilawangguo_kolokotronis: { generalId: 'xilawangguo_kolokotronis', tier: 'famous', tacticalSkillId: 'ts_652', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_656', defBalanceSkillId: 'ts_438', defDisadvantageSkillId: 'ts_545', aptitude: 'create', attackStyle: 'attack' },
    ante_boz: { generalId: 'ante_boz', tier: 'ordinary', tacticalSkillId: 'ts_668', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_692', defBalanceSkillId: 'ts_447', defDisadvantageSkillId: 'ts_574', aptitude: 'create', attackStyle: 'attack' },
    suweihui_requiarius: { generalId: 'suweihui_requiarius', tier: 'ordinary', tacticalSkillId: 'ts_749', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_785', defBalanceSkillId: 'ts_467', defDisadvantageSkillId: 'ts_585', aptitude: 'create', attackStyle: 'attack' },
    baizanting_nikephoros_phokas: { generalId: 'baizanting_nikephoros_phokas', tier: 'famous', tacticalSkillId: 'ts_792', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_806', defBalanceSkillId: 'ts_472', defDisadvantageSkillId: 'ts_592', aptitude: 'create', attackStyle: 'attack' },
    yibiluliya_pharnavaz: { generalId: 'yibiluliya_pharnavaz', tier: 'ordinary', tacticalSkillId: 'ts_850', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_960', defBalanceSkillId: 'ts_473', defDisadvantageSkillId: 'ts_606', aptitude: 'create', attackStyle: 'attack' },
    gelujiya_erekle_ii: { generalId: 'gelujiya_erekle_ii', tier: 'ordinary', tacticalSkillId: 'ts_972', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_982', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_644', aptitude: 'create', attackStyle: 'attack' },
    litaowan_ostrogski: { generalId: 'litaowan_ostrogski', tier: 'famous', tacticalSkillId: 'ts_004', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_005', defBalanceSkillId: 'ts_494', defDisadvantageSkillId: 'ts_671', aptitude: 'create', attackStyle: 'attack' },
    wulaertu_davit_bek: { generalId: 'wulaertu_davit_bek', tier: 'ordinary', tacticalSkillId: 'ts_011', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_025', defBalanceSkillId: 'ts_495', defDisadvantageSkillId: 'ts_677', aptitude: 'create', attackStyle: 'defense' },
    baojialiya_levski: { generalId: 'baojialiya_levski', tier: 'ordinary', tacticalSkillId: 'ts_031', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_551', defDisadvantageSkillId: 'ts_720', aptitude: 'create', attackStyle: 'attack' },
    yicha_canek: { generalId: 'yicha_canek', tier: 'ordinary', tacticalSkillId: 'ts_033', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_044', defBalanceSkillId: 'ts_567', defDisadvantageSkillId: 'ts_726', aptitude: 'create', attackStyle: 'attack' },
    mengjiala_shamsuddin: { generalId: 'mengjiala_shamsuddin', tier: 'ordinary', tacticalSkillId: 'ts_343', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_520', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_054', defBalanceSkillId: 'ts_610', defDisadvantageSkillId: 'ts_747', aptitude: 'create', attackStyle: 'attack' },
    habusibao_eugene: { generalId: 'habusibao_eugene', tier: 'famous', tacticalSkillId: 'ts_059', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_756', defAdvantageSkillId: 'ts_060', defBalanceSkillId: 'ts_663', defDisadvantageSkillId: 'ts_762', aptitude: 'create', attackStyle: 'attack' },
    gesake_khmelnytsky: { generalId: 'gesake_khmelnytsky', tier: 'famous', tacticalSkillId: 'ts_066', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_074', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_788', aptitude: 'create', attackStyle: 'attack' },
    bfe_vetilius: { generalId: 'bfe_vetilius', tier: 'ordinary', tacticalSkillId: 'ts_078', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_083', defBalanceSkillId: 'ts_700', defDisadvantageSkillId: 'ts_801', aptitude: 'create', attackStyle: 'defense' },
    bfe_chelyadnin: { generalId: 'bfe_chelyadnin', tier: 'ordinary', tacticalSkillId: 'ts_086', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_115', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_840', aptitude: 'create', attackStyle: 'defense' },
    bfe_mustafa_ii: { generalId: 'bfe_mustafa_ii', tier: 'ordinary', tacticalSkillId: 'ts_117', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_649', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_135', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_912', aptitude: 'create', attackStyle: 'defense' },
    bfe_perozes: { generalId: 'bfe_perozes', tier: 'ordinary', tacticalSkillId: 'ts_138', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_931', defAdvantageSkillId: 'ts_183', defBalanceSkillId: 'ts_752', defDisadvantageSkillId: 'ts_941', aptitude: 'create', attackStyle: 'defense' },
    bfe_mansfeld: { generalId: 'bfe_mansfeld', tier: 'ordinary', tacticalSkillId: 'ts_184', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_201', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_981', aptitude: 'create', attackStyle: 'attack' },
    bfe_sonni_baru: { generalId: 'bfe_sonni_baru', tier: 'ordinary', tacticalSkillId: 'ts_210', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_984', defAdvantageSkillId: 'ts_213', defBalanceSkillId: 'ts_990', defDisadvantageSkillId: 'ts_991', aptitude: 'create', attackStyle: 'defense' },
    bfe_agha_mohammad: { generalId: 'bfe_agha_mohammad', tier: 'famous', tacticalSkillId: 'ts_235', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_289', defBalanceSkillId: 'ts_049', defDisadvantageSkillId: 'ts_999', aptitude: 'create', attackStyle: 'attack' },
    bfe_landi: { generalId: 'bfe_landi', tier: 'ordinary', tacticalSkillId: 'ts_308', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_319', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_023', aptitude: 'create', attackStyle: 'defense' },
    bfe_kehaya_mustafa: { generalId: 'bfe_kehaya_mustafa', tier: 'ordinary', tacticalSkillId: 'ts_322', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_776', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_058', aptitude: 'create', attackStyle: 'attack' },
    xilawangguo_petros: { generalId: 'xilawangguo_petros', tier: 'ordinary', tacticalSkillId: 'ts_365', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_841', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_371', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_076', aptitude: 'create', attackStyle: 'defense' },
    bfe_abdulaziz_crete: { generalId: 'bfe_abdulaziz_crete', tier: 'ordinary', tacticalSkillId: 'ts_401', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_900', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_100', aptitude: 'create', attackStyle: 'defense' },
    eluosi_diguo_apraksin: { generalId: 'eluosi_diguo_apraksin', tier: 'ordinary', tacticalSkillId: 'ts_443', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_063', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_444', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_116', aptitude: 'create', attackStyle: 'defense' },
    bfe_peter_delyan: { generalId: 'bfe_peter_delyan', tier: 'ordinary', tacticalSkillId: 'ts_445', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_073', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_446', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_131', aptitude: 'create', attackStyle: 'attack' },
    bfe_gotse_delchev: { generalId: 'bfe_gotse_delchev', tier: 'ordinary', tacticalSkillId: 'ts_476', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_095', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_481', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_146', aptitude: 'create', attackStyle: 'attack' },
    bfe_vitalian: { generalId: 'bfe_vitalian', tier: 'ordinary', tacticalSkillId: 'ts_511', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_110', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_544', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_150', aptitude: 'create', attackStyle: 'attack' },
    bfe_alexios_branas: { generalId: 'bfe_alexios_branas', tier: 'ordinary', tacticalSkillId: 'ts_554', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_129', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_570', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_180', aptitude: 'create', attackStyle: 'attack' },
    bfe_dimitriev: { generalId: 'bfe_dimitriev', tier: 'ordinary', tacticalSkillId: 'ts_629', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_136', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_648', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_187', aptitude: 'create', attackStyle: 'attack' },
    bfe_taycanamo: { generalId: 'bfe_taycanamo', tier: 'ordinary', tacticalSkillId: 'ts_652', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_137', atkDisadvantageSkillId: 'ts_191', defAdvantageSkillId: 'ts_656', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_200', aptitude: 'create', attackStyle: 'attack' },
    bfe_gouras: { generalId: 'bfe_gouras', tier: 'ordinary', tacticalSkillId: 'ts_668', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_139', atkDisadvantageSkillId: 'ts_206', defAdvantageSkillId: 'ts_692', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_207', aptitude: 'create', attackStyle: 'defense' },
    bfe_karaiskakis: { generalId: 'bfe_karaiskakis', tier: 'ordinary', tacticalSkillId: 'ts_749', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_155', atkDisadvantageSkillId: 'ts_209', defAdvantageSkillId: 'ts_785', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_216', aptitude: 'create', attackStyle: 'attack' },
    bfe_kontoskeles: { generalId: 'bfe_kontoskeles', tier: 'ordinary', tacticalSkillId: 'ts_787', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_174', atkDisadvantageSkillId: 'ts_231', defAdvantageSkillId: 'ts_792', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_233', aptitude: 'create', attackStyle: 'attack' },
    bfe_ypsilantis: { generalId: 'bfe_ypsilantis', tier: 'ordinary', tacticalSkillId: 'ts_806', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_199', atkDisadvantageSkillId: 'ts_234', defAdvantageSkillId: 'ts_850', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_238', aptitude: 'create', attackStyle: 'attack' },
    bfe_maniakes: { generalId: 'bfe_maniakes', tier: 'ordinary', tacticalSkillId: 'ts_960', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_229', atkDisadvantageSkillId: 'ts_241', defAdvantageSkillId: 'ts_972', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_255', aptitude: 'create', attackStyle: 'attack' },
    bfe_rhetogenes: { generalId: 'bfe_rhetogenes', tier: 'ordinary', tacticalSkillId: 'ts_982', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_261', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_281', aptitude: 'create', attackStyle: 'defense' },
    bfe_purnavarman: { generalId: 'bfe_purnavarman', tier: 'ordinary', tacticalSkillId: 'ts_005', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_011', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_295', aptitude: 'create', attackStyle: 'attack' },
    maya_siyaj_kak: { generalId: 'maya_siyaj_kak', tier: 'ordinary', tacticalSkillId: 'ts_025', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_307', aptitude: 'create', attackStyle: 'attack' },
    bfe_apokaukos: { generalId: 'bfe_apokaukos', tier: 'ordinary', tacticalSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_264', atkDisadvantageSkillId: 'ts_323', defAdvantageSkillId: 'ts_033', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_369', aptitude: 'create', attackStyle: 'defense' },
    baizanting_thomas: { generalId: 'baizanting_thomas', tier: 'ordinary', tacticalSkillId: 'ts_044', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_333', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_054', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_383', aptitude: 'create', attackStyle: 'defense' },
    bfe_maroboduus: { generalId: 'bfe_maroboduus', tier: 'ordinary', tacticalSkillId: 'ts_059', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_387', defAdvantageSkillId: 'ts_060', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_435', aptitude: 'create', attackStyle: 'defense' },
    yili_bato: { generalId: 'yili_bato', tier: 'ordinary', tacticalSkillId: 'ts_066', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_074', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_450', aptitude: 'create', attackStyle: 'attack' },
    daqiya_burebista: { generalId: 'daqiya_burebista', tier: 'ordinary', tacticalSkillId: 'ts_078', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_083', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_464', aptitude: 'create', attackStyle: 'attack' },
    danmai_christian_iv: { generalId: 'danmai_christian_iv', tier: 'ordinary', tacticalSkillId: 'ts_086', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_470', defAdvantageSkillId: 'ts_115', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_477', aptitude: 'create', attackStyle: 'balanced' },
    gen_alfonso_ix: { generalId: 'gen_alfonso_ix', tier: 'ordinary', tacticalSkillId: 'ts_117', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_482', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alfonso_vi: { generalId: 'gen_alfonso_vi', tier: 'famous', tacticalSkillId: 'ts_258', defBalanceSkillId: 'ts_1107', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_556', defDisadvantageSkillId: 'ts_582', aptitude: 'leverage', attackStyle: 'attack' },
    gen_algirdas: { generalId: 'gen_algirdas', tier: 'famous', tacticalSkillId: 'ts_265', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_586', aptitude: 'create', attackStyle: 'attack' },
    gen_andrea_doria: { generalId: 'gen_andrea_doria', tier: 'ordinary', tacticalSkillId: 'ts_135', defBalanceSkillId: 'ts_1108', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_085', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_626', defDisadvantageSkillId: 'ts_595', aptitude: 'leverage', attackStyle: 'attack' },
    gen_andrey_bogolyub: { generalId: 'gen_andrey_bogolyub', tier: 'ordinary', tacticalSkillId: 'ts_296', atkBalanceSkillId: 'ts_448', atkAdvantageSkillId: 'ts_296', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_607', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ansgar: { generalId: 'gen_ansgar', tier: 'ordinary', tacticalSkillId: 'ts_138', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },
    gen_winkelried: { generalId: 'gen_winkelried', tier: 'ordinary', tacticalSkillId: 'ts_310', defBalanceSkillId: 'ts_1110', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_506', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_962', defDisadvantageSkillId: 'ts_612', aptitude: 'leverage', attackStyle: 'attack' },
    gen_barbarossa: { generalId: 'gen_barbarossa', tier: 'famous', tacticalSkillId: 'ts_401', atkBalanceSkillId: 'ts_102', atkAdvantageSkillId: 'ts_401', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage', attackStyle: 'attack' },
    gen_black_prince: { generalId: 'gen_black_prince', tier: 'famous', tacticalSkillId: 'ts_158', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_645', aptitude: 'create', attackStyle: 'attack' },
    gen_henry_v: { generalId: 'gen_henry_v', tier: 'famous', tacticalSkillId: 'ts_183', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_252', defDisadvantageSkillId: 'ts_646', aptitude: 'create', attackStyle: 'attack' },
    gen_breslav: { generalId: 'gen_breslav', tier: 'ordinary', tacticalSkillId: 'ts_444', atkBalanceSkillId: 'ts_520', atkAdvantageSkillId: 'ts_444', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_651', aptitude: 'leverage', attackStyle: 'attack' },
    gen_casimir_great: { generalId: 'gen_casimir_great', tier: 'ordinary', tacticalSkillId: 'ts_336', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_662', aptitude: 'leverage', attackStyle: 'attack' },
    gen_casimir_iv: { generalId: 'gen_casimir_iv', tier: 'ordinary', tacticalSkillId: 'ts_339', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_664', aptitude: 'leverage', attackStyle: 'attack' },
    pomeilaniya_bogislaw: { generalId: 'pomeilaniya_bogislaw', tier: 'ordinary', tacticalSkillId: 'ts_349', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_557', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_678', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charlemagne: { generalId: 'gen_charlemagne', tier: 'famous', tacticalSkillId: 'ts_399', defBalanceSkillId: 'ts_1123', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_288', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_786', defDisadvantageSkillId: 'ts_684', aptitude: 'create', attackStyle: 'attack' },
    gen_charles_i_naples: { generalId: 'gen_charles_i_naples', tier: 'famous', tacticalSkillId: 'ts_424', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_942', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },
    safuyi_ameidi: { generalId: 'safuyi_ameidi', tier: 'ordinary', tacticalSkillId: 'ts_401', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_604', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_698', aptitude: 'leverage', attackStyle: 'attack' },
    talanduo_aqita: { generalId: 'talanduo_aqita', tier: 'ordinary', tacticalSkillId: 'ts_444', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_614', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_701', aptitude: 'create', attackStyle: 'attack' },
    gen_charles_ix: { generalId: 'gen_charles_ix', tier: 'ordinary', tacticalSkillId: 'ts_184', defBalanceSkillId: 'ts_1129', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_983', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charles_martel: { generalId: 'gen_charles_martel', tier: 'famous', tacticalSkillId: 'ts_455', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_706', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_637', aptitude: 'create', attackStyle: 'defense' },
    gen_onuist_i: { generalId: 'gen_onuist_i', tier: 'famous', tacticalSkillId: 'ts_402', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_708', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_649', defDisadvantageSkillId: 'ts_644', aptitude: 'leverage', attackStyle: 'attack' },
    piketai_calgacus: { generalId: 'piketai_calgacus', tier: 'ordinary', tacticalSkillId: 'ts_444', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_670', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_201', defBalanceSkillId: 'ts_326', defDisadvantageSkillId: 'ts_671', aptitude: 'leverage', attackStyle: 'defense' },
    bogendi_chali: { generalId: 'bogendi_chali', tier: 'famous', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_696', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_734', aptitude: 'leverage', attackStyle: 'attack' },
    bogendi_gundioc: { generalId: 'bogendi_gundioc', tier: 'ordinary', tacticalSkillId: 'ts_210', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_702', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_213', defBalanceSkillId: 'ts_328', defDisadvantageSkillId: 'ts_680', aptitude: 'create', attackStyle: 'balanced' },
    bogendi_rudolf_i: { generalId: 'bogendi_rudolf_i', tier: 'ordinary', tacticalSkillId: 'ts_235', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_289', defBalanceSkillId: 'ts_346', defDisadvantageSkillId: 'ts_720', aptitude: 'create', attackStyle: 'attack' },
    bulabante_yuehanyishi: { generalId: 'bulabante_yuehanyishi', tier: 'famous', tacticalSkillId: 'ts_308', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_732', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_746', aptitude: 'leverage', attackStyle: 'attack' },
    gen_charles_vii: { generalId: 'gen_charles_vii', tier: 'ordinary', tacticalSkillId: 'ts_462', defBalanceSkillId: 'ts_1124', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_781', defAdvantageSkillId: 'ts_022', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'attack' },
    gen_robert_ii: { generalId: 'gen_robert_ii', tier: 'ordinary', tacticalSkillId: 'ts_487', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_776', defDisadvantageSkillId: 'ts_784', aptitude: 'leverage', attackStyle: 'attack' },
    gen_domhnall: { generalId: 'gen_domhnall', tier: 'ordinary', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_097', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage', attackStyle: 'attack' },
    mangsite_bulaienbolu: { generalId: 'mangsite_bulaienbolu', tier: 'famous', tacticalSkillId: 'ts_322', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_367', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_808', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hamilcar: { generalId: 'gen_hamilcar', tier: 'famous', tacticalSkillId: 'ts_497', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_854', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_756', aptitude: 'leverage', attackStyle: 'attack' },
    gen_alfred_great: { generalId: 'gen_alfred_great', tier: 'famous', tacticalSkillId: 'ts_362', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_382', atkDisadvantageSkillId: 'ts_902', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_762', aptitude: 'leverage', attackStyle: 'defense' },
    xiongren_atila: { generalId: 'xiongren_atila', tier: 'famous', tacticalSkillId: 'ts_511', atkBalanceSkillId: 'ts_841', atkAdvantageSkillId: 'ts_511', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_920', aptitude: 'create', attackStyle: 'attack' }, // 阿提拉：横扫欧洲 → 擅攻
    gen_city_syracuse: { generalId: 'gen_city_syracuse', tier: 'ordinary', tacticalSkillId: 'ts_399', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_971', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_438', defDisadvantageSkillId: 'ts_788', aptitude: 'leverage', attackStyle: 'attack' },
    gen_olaf_skotkonung: { generalId: 'gen_olaf_skotkonung', tier: 'ordinary', tacticalSkillId: 'ts_510', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_447', defDisadvantageSkillId: 'ts_790', aptitude: 'leverage', attackStyle: 'attack' },
    // 🔴 [2026-10-20 经典战剧情] 新增名将定档
    gen_miltiades: { generalId: 'gen_miltiades', tier: 'famous', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_109',  defAdvantageSkillId: 'ts_120',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_801', aptitude: 'create', attackStyle: 'attack' },   // 米太亚德：马拉松大捷，名将
    wu_fuchai: { generalId: 'wu_fuchai', tier: 'famous', tacticalSkillId: 'ts_749',  atkAdvantageSkillId: 'ts_749',  atkBalanceSkillId: 'ts_900',  atkDisadvantageSkillId: 'ts_020',  defAdvantageSkillId: 'ts_316',  defBalanceSkillId: 'ts_1107',  defDisadvantageSkillId: 'ts_984', aptitude: 'create', attackStyle: 'attack' },   // 夫差：夫椒破越，名将
    gen_cambyses: { generalId: 'gen_cambyses', tier: 'famous', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_830',  defAdvantageSkillId: 'ts_092',  defBalanceSkillId: 'ts_467',  defDisadvantageSkillId: 'ts_247', aptitude: 'create', attackStyle: 'attack' },   // 冈比西斯二世：佩鲁西姆灭埃及，名将
    // 🔴 [2026-10-20 经典战剧情] 巴赫拉姆六世：590 破霍斯劳、僭位泰西封，名将
    sashan_bahram_vi: { generalId: 'sashan_bahram_vi', tier: 'famous', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_063',  atkDisadvantageSkillId: 'ts_840',  defAdvantageSkillId: 'ts_126',  defBalanceSkillId: 'ts_1119',  defDisadvantageSkillId: 'ts_276', aptitude: 'create', attackStyle: 'attack' },
    rierman_odoacer: { generalId: 'rierman_odoacer', tier: 'ordinary', tacticalSkillId: 'ts_335',  atkAdvantageSkillId: 'ts_335',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_853',  defAdvantageSkillId: 'ts_140',  defBalanceSkillId: 'ts_124',  defDisadvantageSkillId: 'ts_993', aptitude: 'reverse', attackStyle: 'defense' },   // 奥多亚克：拉文纳被围杀，普将
    yidou_qixin: { generalId: 'yidou_qixin', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_912',  defAdvantageSkillId: 'ts_436',  defBalanceSkillId: 'ts_248',  defDisadvantageSkillId: 'ts_348', aptitude: 'reverse', attackStyle: 'defense' },   // 戚昕：狼尾滩被破，普将
    maidina_ali: { generalId: 'maidina_ali', tier: 'famous', tacticalSkillId: 'ts_522',  atkAdvantageSkillId: 'ts_522',  atkBalanceSkillId: 'ts_472',  atkDisadvantageSkillId: 'ts_994',  defAdvantageSkillId: 'ts_160',  defBalanceSkillId: 'ts_1110',  defDisadvantageSkillId: 'ts_931', aptitude: 'create', attackStyle: 'attack' },   // 阿里：骆驼之战胜，名将
    xijue_ashina_funian: { generalId: 'xijue_ashina_funian', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_941',  defAdvantageSkillId: 'ts_094',  defBalanceSkillId: 'ts_147',  defDisadvantageSkillId: 'ts_306', aptitude: 'reverse', attackStyle: 'defense' },   // 匐念：被计擒，普将
    xigete_roderic: { generalId: 'xigete_roderic', tier: 'ordinary', tacticalSkillId: 'ts_535',  atkAdvantageSkillId: 'ts_535',  atkBalanceSkillId: 'ts_1111',  atkDisadvantageSkillId: 'ts_961',  defAdvantageSkillId: 'ts_189',  defBalanceSkillId: 'ts_473',  defDisadvantageSkillId: 'ts_704', aptitude: 'reverse', attackStyle: 'defense' },   // 罗德里克：战败溺死，普将
    womaya_muslim: { generalId: 'womaya_muslim', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_314',  defAdvantageSkillId: 'ts_194',  defBalanceSkillId: 'ts_156',  defDisadvantageSkillId: 'ts_981', aptitude: 'create', attackStyle: 'attack' },   // 穆斯林：渴水日大败，普将
    womaya_abdrahman: { generalId: 'womaya_abdrahman', tier: 'famous', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_270',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_329', aptitude: 'create', attackStyle: 'attack' },   // 拉赫曼：征服伊比利亚的胜将，名将
    zhuozhou_anshouzhong: { generalId: 'zhuozhou_anshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_155',  atkDisadvantageSkillId: 'ts_991',  defAdvantageSkillId: 'ts_341',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_342', aptitude: 'reverse', attackStyle: 'defense' },   // 安守忠：香积寺败退，普将
    zhuozhou_shisiming: { generalId: 'zhuozhou_shisiming', tier: 'famous', tacticalSkillId: 'ts_656',  atkAdvantageSkillId: 'ts_656',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_109',  defAdvantageSkillId: 'ts_301',  defBalanceSkillId: 'ts_095',  defDisadvantageSkillId: 'ts_999', aptitude: 'create', attackStyle: 'attack' },   // 史思明：759 邺城破唐九节度，名将
    lunbadi_desiderius: { generalId: 'lunbadi_desiderius', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_173',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_315',  defBalanceSkillId: 'ts_1113',  defDisadvantageSkillId: 'ts_998', aptitude: 'reverse', attackStyle: 'defense' },   // 德西德里乌斯：帕维亚被围降，普将
    tang_zhuci: { generalId: 'tang_zhuci', tier: 'ordinary', tacticalSkillId: 'ts_558',  atkAdvantageSkillId: 'ts_558',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_995',  defAdvantageSkillId: 'ts_564',  defBalanceSkillId: 'ts_283',  defDisadvantageSkillId: 'ts_012', aptitude: 'reverse', attackStyle: 'defense' },   // 朱泚：据长安被李晟破，普将
    gurjara_vatsaraja: { generalId: 'gurjara_vatsaraja', tier: 'famous', tacticalSkillId: 'ts_546',  atkAdvantageSkillId: 'ts_546',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_019',  defAdvantageSkillId: 'ts_327',  defBalanceSkillId: 'ts_073',  defDisadvantageSkillId: 'ts_338', aptitude: 'create', attackStyle: 'attack' },   // 瓦萨拉贾：曾破波罗军，名将
    gurjara_nagabhata_ii: { generalId: 'gurjara_nagabhata_ii', tier: 'famous', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_176',  atkDisadvantageSkillId: 'ts_109',  defAdvantageSkillId: 'ts_330',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_023', aptitude: 'create', attackStyle: 'attack' },   // 那加巴塔二世：820 大破波罗军，名将
    tubo_lunmangre: { generalId: 'tubo_lunmangre', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_358',  defAdvantageSkillId: 'ts_347',  defBalanceSkillId: 'ts_520',  defDisadvantageSkillId: 'ts_369', aptitude: 'reverse', attackStyle: 'defense' },   // 论莽热：维州被围歼，普将
    baizanting_nikephoros_i: { generalId: 'baizanting_nikephoros_i', tier: 'ordinary', tacticalSkillId: 'ts_343',  atkAdvantageSkillId: 'ts_343',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_421',  defBalanceSkillId: 'ts_110',  defDisadvantageSkillId: 'ts_363', aptitude: 'create', attackStyle: 'attack' },   // 尼基弗鲁斯一世：亲征保加利亚的皇帝，名将
    huihu_wusa: { generalId: 'huihu_wusa', tier: 'ordinary', tacticalSkillId: 'ts_619',  atkAdvantageSkillId: 'ts_619',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_153',  defAdvantageSkillId: 'ts_626',  defBalanceSkillId: 'ts_136',  defDisadvantageSkillId: 'ts_423', aptitude: 'reverse', attackStyle: 'defense' },   // 㕎馺可汗：亡国，普将
    abasi_muwafake: { generalId: 'abasi_muwafake', tier: 'famous', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_379',  defAdvantageSkillId: 'ts_500',  defBalanceSkillId: 'ts_129',  defDisadvantageSkillId: 'ts_027', aptitude: 'create', attackStyle: 'attack' },   // 穆瓦法克：876 代尔阿库勒胜，名将
    falanji_kalman: { generalId: 'falanji_kalman', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_202',  atkDisadvantageSkillId: 'ts_041',  defAdvantageSkillId: 'ts_517',  defBalanceSkillId: 'ts_1115',  defDisadvantageSkillId: 'ts_058', aptitude: 'create', attackStyle: 'attack' },   // 卡洛曼：摩拉维亚败，普将
    nanzhao_duanqiuxian: { generalId: 'nanzhao_duanqiuxian', tier: 'ordinary', tacticalSkillId: 'ts_443',  atkAdvantageSkillId: 'ts_443',  atkBalanceSkillId: 'ts_516',  atkDisadvantageSkillId: 'ts_523',  defAdvantageSkillId: 'ts_162',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_079', aptitude: 'reverse', attackStyle: 'defense' },   // 段酋迁：交趾被破，普将
    danmai_guthrum: { generalId: 'danmai_guthrum', tier: 'famous', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_775',  atkDisadvantageSkillId: 'ts_381',  defAdvantageSkillId: 'ts_532',  defBalanceSkillId: 'ts_1116',  defDisadvantageSkillId: 'ts_067', aptitude: 'create', attackStyle: 'attack' },   // 古思伦：扫荡英格兰诸国的维京首领，名将
    aliya_muhammad_tahir: { generalId: 'aliya_muhammad_tahir', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_464',  defAdvantageSkillId: 'ts_099',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_388', aptitude: 'reverse', attackStyle: 'defense' },   // 塔希尔末王：希拉特败，普将
    dang_d_pangshigu: { generalId: 'dang_d_pangshigu', tier: 'ordinary', tacticalSkillId: 'ts_481',  atkAdvantageSkillId: 'ts_481',  atkBalanceSkillId: 'ts_1101',  atkDisadvantageSkillId: 'ts_203',  defAdvantageSkillId: 'ts_112',  defBalanceSkillId: 'ts_494',  defDisadvantageSkillId: 'ts_108', aptitude: 'reverse', attackStyle: 'defense' },   // 庞师古：清口被斩，普将
    liang_d_wangjingren: { generalId: 'liang_d_wangjingren', tier: 'ordinary', tacticalSkillId: 'ts_591',  atkAdvantageSkillId: 'ts_591',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_425',  defAdvantageSkillId: 'ts_640',  defBalanceSkillId: 'ts_634',  defDisadvantageSkillId: 'ts_116', aptitude: 'create', attackStyle: 'attack' },   // 王景仁：柏乡败，普将
    xisi_amr: { generalId: 'xisi_amr', tier: 'famous', tacticalSkillId: 'ts_559',  atkAdvantageSkillId: 'ts_559',  atkBalanceSkillId: 'ts_251',  atkDisadvantageSkillId: 'ts_499',  defAdvantageSkillId: 'ts_556',  defBalanceSkillId: 'ts_1103',  defDisadvantageSkillId: 'ts_502', aptitude: 'create', attackStyle: 'attack' },   // 阿姆尔：萨法尔扩张的埃米尔，名将
    baizanting_romanosi: { generalId: 'baizanting_romanosi', tier: 'famous', tacticalSkillId: 'ts_575',  atkAdvantageSkillId: 'ts_575',  atkBalanceSkillId: 'ts_1104',  atkDisadvantageSkillId: 'ts_076',  defAdvantageSkillId: 'ts_121',  defBalanceSkillId: 'ts_137',  defDisadvantageSkillId: 'ts_420', aptitude: 'create', attackStyle: 'attack' },   // 罗曼努斯一世：拜占庭皇帝，名将
    bohai_dayinzhuan: { generalId: 'bohai_dayinzhuan', tier: 'ordinary', tacticalSkillId: 'ts_569',  atkAdvantageSkillId: 'ts_569',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_291',  defAdvantageSkillId: 'ts_444',  defBalanceSkillId: 'ts_333',  defDisadvantageSkillId: 'ts_501', aptitude: 'reverse', attackStyle: 'defense' },   // 大諲撰：亡国，普将
    liao_d_xiaopaiya: { generalId: 'liao_d_xiaopaiya', tier: 'ordinary', tacticalSkillId: 'ts_648',  atkAdvantageSkillId: 'ts_648',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_561',  defAdvantageSkillId: 'ts_133',  defBalanceSkillId: 'ts_663',  defDisadvantageSkillId: 'ts_233', aptitude: 'create', attackStyle: 'attack' },   // 萧排押：龟州败，普将
    xin_liuchong: { generalId: 'xin_liuchong', tier: 'ordinary', tacticalSkillId: 'ts_792',  atkAdvantageSkillId: 'ts_792',  atkBalanceSkillId: 'ts_280',  atkDisadvantageSkillId: 'ts_056',  defAdvantageSkillId: 'ts_311',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_209', aptitude: 'create', attackStyle: 'attack' },   // 刘崇：高平败，普将
    song_zhaoguangyi: { generalId: 'song_zhaoguangyi', tier: 'famous', tacticalSkillId: 'ts_554',  atkAdvantageSkillId: 'ts_554',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_449',  defAdvantageSkillId: 'ts_658',  defBalanceSkillId: 'ts_551',  defDisadvantageSkillId: 'ts_146', aptitude: 'create', attackStyle: 'attack' },   // 赵光义：灭北汉的宋太宗，名将
    song_wangbing: { generalId: 'song_wangbing', tier: 'ordinary', tacticalSkillId: 'ts_806',  atkAdvantageSkillId: 'ts_806',  atkBalanceSkillId: 'ts_246',  atkDisadvantageSkillId: 'ts_216',  defAdvantageSkillId: 'ts_633',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_758', aptitude: 'reverse', attackStyle: 'defense' },   // 王禀：死守太原殉国，普将
    liao_d_xiaoduli: { generalId: 'liao_d_xiaoduli', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_175',  defBalanceSkillId: 'ts_507',  defDisadvantageSkillId: 'ts_608', aptitude: 'create', attackStyle: 'attack' },   // 萧咄李：雁门被斩，普将
    sengjialuo_mahinda_v: { generalId: 'sengjialuo_mahinda_v', tier: 'ordinary', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_100',  defAdvantageSkillId: 'ts_683',  defBalanceSkillId: 'ts_260',  defDisadvantageSkillId: 'ts_427', aptitude: 'reverse', attackStyle: 'defense' },   // 摩哂陀五世：国都被陷，普将
    liao_d_handewei: { generalId: 'liao_d_handewei', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_238',  defAdvantageSkillId: 'ts_709',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_437', aptitude: 'create', attackStyle: 'attack' },   // 韩德威：子河汊败，普将
    song_peiji: { generalId: 'song_peiji', tier: 'ordinary', tacticalSkillId: 'ts_597',  atkAdvantageSkillId: 'ts_597',  atkBalanceSkillId: 'ts_199',  atkDisadvantageSkillId: 'ts_149',  defAdvantageSkillId: 'ts_195',  defBalanceSkillId: 'ts_1109',  defDisadvantageSkillId: 'ts_461', aptitude: 'reverse', attackStyle: 'defense' },   // 裴济：灵州殉国，普将
    duonaobaojia_samuel: { generalId: 'duonaobaojia_samuel', tier: 'famous', tacticalSkillId: 'ts_319',  atkAdvantageSkillId: 'ts_319',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_002',  defAdvantageSkillId: 'ts_724',  defBalanceSkillId: 'ts_139',  defDisadvantageSkillId: 'ts_123', aptitude: 'create', attackStyle: 'attack' },   // 萨穆伊尔：长期破拜占庭，名将
    jiazini_masud: { generalId: 'jiazini_masud', tier: 'famous', tacticalSkillId: 'ts_609',  atkAdvantageSkillId: 'ts_609',  atkBalanceSkillId: 'ts_485',  atkDisadvantageSkillId: 'ts_533',  defAdvantageSkillId: 'ts_778',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_498', aptitude: 'create', attackStyle: 'attack' },   // 马斯乌德：伽色尼苏丹，名将
    gaer_sigtrygg: { generalId: 'gaer_sigtrygg', tier: 'ordinary', tacticalSkillId: 'ts_622',  atkAdvantageSkillId: 'ts_622',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_430',  defAdvantageSkillId: 'ts_783',  defBalanceSkillId: 'ts_174',  defDisadvantageSkillId: 'ts_131', aptitude: 'reverse', attackStyle: 'defense' },   // 西格特里格：克朗塔夫败，普将
    suomunate_bhima_i: { generalId: 'suomunate_bhima_i', tier: 'ordinary', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_142',  defAdvantageSkillId: 'ts_786',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_109', aptitude: 'reverse', attackStyle: 'defense' },   // 毗摩一世：索姆纳特被劫，普将
    song_renfu: { generalId: 'song_renfu', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_360',  atkDisadvantageSkillId: 'ts_466',  defAdvantageSkillId: 'ts_811',  defBalanceSkillId: 'ts_1111',  defDisadvantageSkillId: 'ts_150', aptitude: 'create', attackStyle: 'attack' },   // 任福：好水川中伏战死，普将
    luoma_diguo_leo_ix: { generalId: 'luoma_diguo_leo_ix', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_229',  atkDisadvantageSkillId: 'ts_180',  defAdvantageSkillId: 'ts_789',  defBalanceSkillId: 'ts_1125',  defDisadvantageSkillId: 'ts_434', aptitude: 'reverse', attackStyle: 'defense' },   // 利奥九世：奇维塔特败，普将
    tubo_muzheng: { generalId: 'tubo_muzheng', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_495',  atkDisadvantageSkillId: 'ts_452',  defAdvantageSkillId: 'ts_913',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_370', aptitude: 'reverse', attackStyle: 'defense' },   // 木征：熙河降，普将
    womaya_yahya: { generalId: 'womaya_yahya', tier: 'ordinary', tacticalSkillId: 'ts_685',  atkAdvantageSkillId: 'ts_685',  atkBalanceSkillId: 'ts_567',  atkDisadvantageSkillId: 'ts_013',  defAdvantageSkillId: 'ts_178',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_182', aptitude: 'reverse', attackStyle: 'defense' },   // 叶海亚：托莱多陷，普将
    sailiugu_yaghi: { generalId: 'sailiugu_yaghi', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_256',  atkDisadvantageSkillId: 'ts_469',  defAdvantageSkillId: 'ts_950',  defBalanceSkillId: 'ts_1112',  defDisadvantageSkillId: 'ts_412', aptitude: 'reverse', attackStyle: 'defense' },   // 雅吉西扬：安条克战死，普将
    liao_d_tianzuodi: { generalId: 'liao_d_tianzuodi', tier: 'ordinary', tacticalSkillId: 'ts_444',  atkAdvantageSkillId: 'ts_444',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_084',  defAdvantageSkillId: 'ts_992',  defBalanceSkillId: 'ts_610',  defDisadvantageSkillId: 'ts_298', aptitude: 'reverse', attackStyle: 'defense' },   // 天祚帝：护步达冈大败，普将
    song_zhangjun: { generalId: 'song_zhangjun', tier: 'ordinary', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_268',  defAdvantageSkillId: 'ts_997',  defBalanceSkillId: 'ts_264',  defDisadvantageSkillId: 'ts_187', aptitude: 'create', attackStyle: 'attack' },   // 张浚：富平大败，普将
    jiazini_khusrau_malik: { generalId: 'jiazini_khusrau_malik', tier: 'ordinary', tacticalSkillId: 'ts_694',  atkAdvantageSkillId: 'ts_694',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_191',  defAdvantageSkillId: 'ts_500',  defBalanceSkillId: 'ts_368',  defDisadvantageSkillId: 'ts_478', aptitude: 'reverse', attackStyle: 'defense' },   // 伽色尼末王，普将
    taira_pingzongsheng: { generalId: 'taira_pingzongsheng', tier: 'ordinary', tacticalSkillId: 'ts_751',  atkAdvantageSkillId: 'ts_751',  atkBalanceSkillId: 'ts_1116',  atkDisadvantageSkillId: 'ts_706',  defAdvantageSkillId: 'ts_778',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_281', aptitude: 'reverse', attackStyle: 'defense' },   // 平宗盛：富士川不战而溃，普将
    kasidiliya_afangsuoba: { generalId: 'kasidiliya_afangsuoba', tier: 'famous', tacticalSkillId: 'ts_791',  atkAdvantageSkillId: 'ts_791',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_200',  defAdvantageSkillId: 'ts_022',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_501', aptitude: 'create', attackStyle: 'attack' },   // 阿方索八世：托洛萨大捷，名将
    dajin_wanyanchengyu: { generalId: 'dajin_wanyanchengyu', tier: 'ordinary', tacticalSkillId: 'ts_365',  atkAdvantageSkillId: 'ts_365',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_538',  defAdvantageSkillId: 'ts_057',  defBalanceSkillId: 'ts_681',  defDisadvantageSkillId: 'ts_667', aptitude: 'reverse', attackStyle: 'defense' },   // 完颜承裕：野狐岭大败，普将
    yelusalengwg_amalric: { generalId: 'yelusalengwg_amalric', tier: 'ordinary', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_377',  atkDisadvantageSkillId: 'ts_104',  defAdvantageSkillId: 'ts_026',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_206', aptitude: 'create', attackStyle: 'attack' },   // 阿马尔里克：屡征埃及，普将
    baizanting_isaac_ii: { generalId: 'baizanting_isaac_ii', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_309',  atkDisadvantageSkillId: 'ts_593',  defAdvantageSkillId: 'ts_221',  defBalanceSkillId: 'ts_1119',  defDisadvantageSkillId: 'ts_207', aptitude: 'reverse', attackStyle: 'defense' },   // 伊萨克二世：被推翻，普将
    baizanting_alexios_v: { generalId: 'baizanting_alexios_v', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_047',  defBalanceSkillId: 'ts_700',  defDisadvantageSkillId: 'ts_489', aptitude: 'reverse', attackStyle: 'defense' },   // 阿莱克修斯五世：城破，普将
    huarazim_jalal: { generalId: 'huarazim_jalal', tier: 'famous', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_505',  defAdvantageSkillId: 'ts_065',  defBalanceSkillId: 'ts_506',  defDisadvantageSkillId: 'ts_736', aptitude: 'create', attackStyle: 'attack' },   // 扎兰丁：屡败蒙古后复国，名将
    dajin_wanyanheda: { generalId: 'dajin_wanyanheda', tier: 'ordinary', tacticalSkillId: 'ts_445',  atkAdvantageSkillId: 'ts_445',  atkBalanceSkillId: 'ts_1101',  atkDisadvantageSkillId: 'ts_231',  defAdvantageSkillId: 'ts_232',  defBalanceSkillId: 'ts_465',  defDisadvantageSkillId: 'ts_243', aptitude: 'reverse', attackStyle: 'defense' },   // 完颜合达：三峰山覆没，普将
    abasi_mustasim: { generalId: 'abasi_mustasim', tier: 'ordinary', tacticalSkillId: 'ts_796',  atkAdvantageSkillId: 'ts_796',  atkBalanceSkillId: 'ts_403',  atkDisadvantageSkillId: 'ts_234',  defAdvantageSkillId: 'ts_119',  defBalanceSkillId: 'ts_1122',  defDisadvantageSkillId: 'ts_478', aptitude: 'reverse', attackStyle: 'defense' },   // 穆斯塔西姆：亡国，普将
    champa_jaya_indravarman_iv: { generalId: 'champa_jaya_indravarman_iv', tier: 'ordinary', tacticalSkillId: 'ts_787',  atkAdvantageSkillId: 'ts_787',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_241',  defAdvantageSkillId: 'ts_120',  defBalanceSkillId: 'ts_737',  defDisadvantageSkillId: 'ts_613', aptitude: 'reverse', attackStyle: 'defense' },   // 占婆王：洞里萨湖败，普将
    mazhaer_bela_iv: { generalId: 'mazhaer_bela_iv', tier: 'ordinary', tacticalSkillId: 'ts_812',  atkAdvantageSkillId: 'ts_812',  atkBalanceSkillId: 'ts_739',  atkDisadvantageSkillId: 'ts_009',  defAdvantageSkillId: 'ts_244',  defBalanceSkillId: 'ts_1102',  defDisadvantageSkillId: 'ts_255', aptitude: 'reverse', attackStyle: 'defense' },   // 贝拉四世：赛约河败，普将
    yilihanguo_kitbuqa: { generalId: 'yilihanguo_kitbuqa', tier: 'famous', tacticalSkillId: 'ts_257',  atkAdvantageSkillId: 'ts_257',  atkBalanceSkillId: 'ts_752',  atkDisadvantageSkillId: 'ts_594',  defAdvantageSkillId: 'ts_813',  defBalanceSkillId: 'ts_1103',  defDisadvantageSkillId: 'ts_261', aptitude: 'create', attackStyle: 'attack' },   // 怯的不花：西征先锋，名将
    menggu_d_mongke: { generalId: 'menggu_d_mongke', tier: 'famous', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_758',  defAdvantageSkillId: 'ts_626',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 蒙哥：蒙古大汗，名将
    falanji_baodewen: { generalId: 'falanji_baodewen', tier: 'ordinary', tacticalSkillId: 'ts_831',  atkAdvantageSkillId: 'ts_831',  atkBalanceSkillId: 'ts_403',  atkDisadvantageSkillId: 'ts_596',  defAdvantageSkillId: 'ts_126',  defBalanceSkillId: 'ts_1104',  defDisadvantageSkillId: 'ts_412', aptitude: 'create', attackStyle: 'attack' },   // 鲍德温一世：第四次十字军攻陷君士坦丁堡，名将
    xiliao_uthman: { generalId: 'xiliao_uthman', tier: 'ordinary', tacticalSkillId: 'ts_870',  atkAdvantageSkillId: 'ts_870',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_713',  defAdvantageSkillId: 'ts_284',  defBalanceSkillId: 'ts_441',  defDisadvantageSkillId: 'ts_680', aptitude: 'reverse', attackStyle: 'defense' },   // 奥斯曼：亡国，普将
    hre_manfred: { generalId: 'hre_manfred', tier: 'ordinary', tacticalSkillId: 'ts_901',  atkAdvantageSkillId: 'ts_901',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_295',  defAdvantageSkillId: 'ts_140',  defBalanceSkillId: 'ts_356',  defDisadvantageSkillId: 'ts_722', aptitude: 'create', attackStyle: 'attack' },   // 曼弗雷德：蒙塔佩尔蒂胜，名将
    hre_siegfried: { generalId: 'hre_siegfried', tier: 'ordinary', tacticalSkillId: 'ts_911',  atkAdvantageSkillId: 'ts_911',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_307',  defAdvantageSkillId: 'ts_304',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_731', aptitude: 'create', attackStyle: 'attack' },   // 西格弗里德：沃林根败，普将
    jinzhang_nogai: { generalId: 'jinzhang_nogai', tier: 'famous', tacticalSkillId: 'ts_940',  atkAdvantageSkillId: 'ts_940',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_740',  defAdvantageSkillId: 'ts_160',  defBalanceSkillId: 'ts_930',  defDisadvantageSkillId: 'ts_323', aptitude: 'create', attackStyle: 'attack' },   // 那海：金帐实际统治者，名将
    yinggelan_warenne: { generalId: 'yinggelan_warenne', tier: 'ordinary', tacticalSkillId: 'ts_987',  atkAdvantageSkillId: 'ts_987',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_753',  defAdvantageSkillId: 'ts_189',  defBalanceSkillId: 'ts_448',  defDisadvantageSkillId: 'ts_383', aptitude: 'create', attackStyle: 'attack' },   // 瓦伦：斯特灵桥败，普将
    gaolu_john_ii: { generalId: 'gaolu_john_ii', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_524',  atkDisadvantageSkillId: 'ts_018',  defAdvantageSkillId: 'ts_312',  defBalanceSkillId: 'ts_1107',  defDisadvantageSkillId: 'ts_387', aptitude: 'reverse', attackStyle: 'defense' },   // 约翰二世：普瓦捷被俘，普将
    yuan_d_daulashah: { generalId: 'yuan_d_daulashah', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_545',  defAdvantageSkillId: 'ts_194',  defBalanceSkillId: 'ts_649',  defDisadvantageSkillId: 'ts_236', aptitude: 'create', attackStyle: 'attack' },   // 倒剌沙：两都之战败，普将
    mazhaer_charles_i: { generalId: 'mazhaer_charles_i', tier: 'ordinary', tacticalSkillId: 'ts_015',  atkAdvantageSkillId: 'ts_015',  atkBalanceSkillId: 'ts_686',  atkDisadvantageSkillId: 'ts_765',  defAdvantageSkillId: 'ts_270',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_412', aptitude: 'create', attackStyle: 'attack' },   // 查理一世：波萨达败，普将
    baojialiya_mikhail: { generalId: 'baojialiya_mikhail', tier: 'ordinary', tacticalSkillId: 'ts_036',  atkAdvantageSkillId: 'ts_036',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_315',  defBalanceSkillId: 'ts_378',  defDisadvantageSkillId: 'ts_772', aptitude: 'reverse', attackStyle: 'defense' },   // 米哈伊尔：维尔布日德战死，普将
    yuan_d_tuotuo: { generalId: 'yuan_d_tuotuo', tier: 'ordinary', tacticalSkillId: 'ts_476',  atkAdvantageSkillId: 'ts_476',  atkBalanceSkillId: 'ts_529',  atkDisadvantageSkillId: 'ts_996',  defAdvantageSkillId: 'ts_997',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_637', aptitude: 'create', attackStyle: 'attack' },   // 脱脱：高邮无功，普将
    yuan_d_manzihaiya: { generalId: 'yuan_d_manzihaiya', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_585',  defAdvantageSkillId: 'ts_374',  defBalanceSkillId: 'ts_990',  defDisadvantageSkillId: 'ts_020', aptitude: 'reverse', attackStyle: 'defense' },   // 蛮子海牙：采石矶败，普将
    zhao_gerong: { generalId: 'zhao_gerong', tier: 'famous', tacticalSkillId: 'ts_130', atkAdvantageSkillId: 'ts_130', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_144', aptitude: 'create', attackStyle: 'attack' },   // 葛荣：河北盗贼团伙首领，名将
    gen_ramiro_ii: { generalId: 'gen_ramiro_ii', tier: 'famous', tacticalSkillId: 'ts_039', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_107', aptitude: 'reverse', attackStyle: 'defense' },   // 拉米罗二世：莱昂国王，名将
    gen_kusaila: { generalId: 'gen_kusaila', tier: 'famous', tacticalSkillId: 'ts_051', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_440', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_122', aptitude: 'reverse', attackStyle: 'defense' },   // 库赛拉：柏柏尔抗阿拉伯名王
    malin_abulhasan: { generalId: 'malin_abulhasan', tier: 'famous', tacticalSkillId: 'ts_070', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_125', aptitude: 'reverse', attackStyle: 'attack' },   // 阿布哈桑：马林苏丹
    gen_ali_ibn_yusuf: { generalId: 'gen_ali_ibn_yusuf', tier: 'famous', tacticalSkillId: 'ts_111', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_134', aptitude: 'reverse', attackStyle: 'defense' },   // 阿里优素福：穆拉比特埃米尔
    gen_abu_yahya: { generalId: 'gen_abu_yahya', tier: 'ordinary', tacticalSkillId: 'ts_201',  atkAdvantageSkillId: 'ts_201',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_470',  defAdvantageSkillId: 'ts_442',  defBalanceSkillId: 'ts_557',  defDisadvantageSkillId: 'ts_736', aptitude: 'reverse', attackStyle: 'defense' },   // 阿布叶海亚：马略卡总督，普将
    gen_pietro_tiepolo: { generalId: 'gen_pietro_tiepolo', tier: 'ordinary', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_477',  defAdvantageSkillId: 'ts_341',  defBalanceSkillId: 'ts_049',  defDisadvantageSkillId: 'ts_538', aptitude: 'reverse', attackStyle: 'defense' },   // 提埃波洛：米兰执政官，普将
    gen_kutlug_buga: { generalId: 'gen_kutlug_buga', tier: 'ordinary', tacticalSkillId: 'ts_141',  atkAdvantageSkillId: 'ts_141',  atkBalanceSkillId: 'ts_757',  atkDisadvantageSkillId: 'ts_1132',  defAdvantageSkillId: 'ts_347',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_482', aptitude: 'create', attackStyle: 'attack' },   // 库特卢格：金帐王公，普将
    gen_vukasin: { generalId: 'gen_vukasin', tier: 'ordinary', tacticalSkillId: 'ts_132', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_152', aptitude: 'create', attackStyle: 'attack' },   // 武卡辛：塞尔维亚领主
    gen_mamai: { generalId: 'gen_mamai', tier: 'famous', tacticalSkillId: 'ts_163', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_228', aptitude: 'create', attackStyle: 'attack' },   // 马麦：金帐权臣
    gen_juan_i_castile: { generalId: 'gen_juan_i_castile', tier: 'ordinary', tacticalSkillId: 'ts_170', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_159', aptitude: 'reverse', attackStyle: 'attack' },   // 胡安一世：卡斯蒂利亚国王
    xibanya_beilaerde: { generalId: 'xibanya_beilaerde', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_581',  defAdvantageSkillId: 'ts_536',  defBalanceSkillId: 'ts_061',  defDisadvantageSkillId: 'ts_736', aptitude: 'reverse', attackStyle: 'defense' },   // 贝拉尔德：普将（1808 死守蒙莱昂，守土殉城无胜绩）
    gen_toghus_temur: { generalId: 'gen_toghus_temur', tier: 'ordinary', tacticalSkillId: 'ts_622',  atkAdvantageSkillId: 'ts_622',  atkBalanceSkillId: 'ts_604',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_436',  defBalanceSkillId: 'ts_1113',  defDisadvantageSkillId: 'ts_704', aptitude: 'reverse', attackStyle: 'defense' },   // 脱古思帖木儿：北元后主，普将
    gen_si_lunfa: { generalId: 'gen_si_lunfa', tier: 'ordinary', tacticalSkillId: 'ts_522',  atkAdvantageSkillId: 'ts_522',  atkBalanceSkillId: 'ts_764',  atkDisadvantageSkillId: 'ts_590',  defAdvantageSkillId: 'ts_556',  defBalanceSkillId: 'ts_1117',  defDisadvantageSkillId: 'ts_014', aptitude: 'create', attackStyle: 'attack' },   // 思伦发：麓川土司，普将
    gen_li_jinglong: { generalId: 'gen_li_jinglong', tier: 'ordinary', tacticalSkillId: 'ts_177',  atkAdvantageSkillId: 'ts_177',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_1131',  defAdvantageSkillId: 'ts_633',  defBalanceSkillId: 'ts_288',  defDisadvantageSkillId: 'ts_984', aptitude: 'reverse', attackStyle: 'defense' },   // 李景隆：南军主帅，普将
    gen_bayezid_i: { generalId: 'gen_bayezid_i', tier: 'famous', tacticalSkillId: 'ts_172', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_169', aptitude: 'create', attackStyle: 'attack' },   // 巴耶济德一世：奥斯曼苏丹
    gen_boucicaut: { generalId: 'gen_boucicaut', tier: 'ordinary', tacticalSkillId: 'ts_198', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_606', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_181', aptitude: 'create', attackStyle: 'attack' },   // 布锡考特：法国元帅
    gen_suffolk: { generalId: 'gen_suffolk', tier: 'ordinary', tacticalSkillId: 'ts_215', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_186', aptitude: 'create', attackStyle: 'attack' },   // 萨福克伯爵：英军统帅
    gen_wangzhen: { generalId: 'gen_wangzhen', tier: 'ordinary', tacticalSkillId: 'ts_564',  atkAdvantageSkillId: 'ts_564',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_671',  defAdvantageSkillId: 'ts_654',  defBalanceSkillId: 'ts_670',  defDisadvantageSkillId: 'ts_852', aptitude: 'create', attackStyle: 'attack' },   // 王振：宦官统军，普将
    gen_constantine_xi: { generalId: 'gen_constantine_xi', tier: 'ordinary', tacticalSkillId: 'ts_220', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_192', aptitude: 'reverse', attackStyle: 'defense' },   // 君士坦丁十一世：拜占庭末帝
    gen_louis_xi: { generalId: 'gen_louis_xi', tier: 'famous', tacticalSkillId: 'ts_239', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_193', aptitude: 'reverse', attackStyle: 'defense' },   // 路易十一：法国国王
    gen_beg_arslan: { generalId: 'gen_beg_arslan', tier: 'famous', tacticalSkillId: 'ts_250', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_942', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_254', aptitude: 'create', attackStyle: 'attack' },   // 癿加思兰：鞑靼太师
    gen_muhammad_xii: { generalId: 'gen_muhammad_xii', tier: 'ordinary', tacticalSkillId: 'ts_258', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_214', aptitude: 'reverse', attackStyle: 'defense' },   // 穆罕默德十二世：格拉纳达末代苏丹
    gen_maximilian_sforza: { generalId: 'gen_maximilian_sforza', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_720',  defAdvantageSkillId: 'ts_709',  defBalanceSkillId: 'ts_053',  defDisadvantageSkillId: 'ts_860', aptitude: 'reverse', attackStyle: 'defense' },   // 斯福尔扎：米兰公爵，普将
    gen_ibrahim_lodi: { generalId: 'gen_ibrahim_lodi', tier: 'ordinary', tacticalSkillId: 'ts_265', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_097', atkDisadvantageSkillId: 'ts_725', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_217', aptitude: 'reverse', attackStyle: 'defense' },   // 洛迪：德里苏丹
    gen_chen_youliang: { generalId: 'gen_chen_youliang', tier: 'famous', tacticalSkillId: 'ts_685', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_756', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_331', aptitude: 'create', attackStyle: 'attack' },   // 陈友谅：陈汉皇帝
    gen_razadarit: { generalId: 'gen_razadarit', tier: 'famous', tacticalSkillId: 'ts_296', atkAdvantageSkillId: 'ts_296', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_224', aptitude: 'reverse', attackStyle: 'defense' },   // 罗娑陀利：勃固孟王
    gen_wang_tong: { generalId: 'gen_wang_tong', tier: 'ordinary', tacticalSkillId: 'ts_310',  atkAdvantageSkillId: 'ts_310',  atkBalanceSkillId: 'ts_702',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_724',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_230', aptitude: 'create', attackStyle: 'attack' },   // 王通：明将，普将
    gen_wang_ji: { generalId: 'gen_wang_ji', tier: 'famous', tacticalSkillId: 'ts_497', atkAdvantageSkillId: 'ts_497', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_271', aptitude: 'create', attackStyle: 'attack' },   // 王骥：明兵部尚书
    gen_vasili_iii: { generalId: 'gen_vasili_iii', tier: 'famous', tacticalSkillId: 'ts_336', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_225', aptitude: 'reverse', attackStyle: 'defense' },   // 瓦西里三世
    gen_atahualpa: { generalId: 'gen_atahualpa', tier: 'ordinary', tacticalSkillId: 'ts_339', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_636', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_226', aptitude: 'reverse', attackStyle: 'defense' },   // 阿塔瓦尔帕
    gen_valdivia: { generalId: 'gen_valdivia', tier: 'ordinary', tacticalSkillId: 'ts_349', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_237', aptitude: 'create', attackStyle: 'attack' },   // 瓦尔迪维亚
    gen_medinaceli: { generalId: 'gen_medinaceli', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_789',  defBalanceSkillId: 'ts_085',  defDisadvantageSkillId: 'ts_890', aptitude: 'create', attackStyle: 'attack' },   // 梅迪纳科利，普将
    gen_qiu_luan: { generalId: 'gen_qiu_luan', tier: 'ordinary', tacticalSkillId: 'ts_960',  atkAdvantageSkillId: 'ts_960',  atkBalanceSkillId: 'ts_732',  atkDisadvantageSkillId: 'ts_512',  defAdvantageSkillId: 'ts_750',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_777', aptitude: 'reverse', attackStyle: 'defense' },   // 仇鸾：明将，普将
    gen_yang_hao: { generalId: 'gen_yang_hao', tier: 'ordinary', tacticalSkillId: 'ts_455', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_573', aptitude: 'create', attackStyle: 'attack' },   // 杨镐：明辽东经略
    gen_hong_chengchou: { generalId: 'gen_hong_chengchou', tier: 'famous', tacticalSkillId: 'ts_462', atkAdvantageSkillId: 'ts_462', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_701', aptitude: 'create', attackStyle: 'attack' },   // 洪承畴：明蓟辽总督
    gen_wang_qiaonian: { generalId: 'gen_wang_qiaonian', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_776',  atkDisadvantageSkillId: 'ts_989',  defAdvantageSkillId: 'ts_950',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_840', aptitude: 'reverse', attackStyle: 'defense' },   // 汪乔年：明陕西总督，普将
    gen_nikan: { generalId: 'gen_nikan', tier: 'famous', tacticalSkillId: 'ts_424', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_548', aptitude: 'create', attackStyle: 'attack' },   // 尼堪：清敬谨亲王
    gen_hemu: { generalId: 'gen_hemu', tier: 'ordinary', tacticalSkillId: 'ts_487', atkAdvantageSkillId: 'ts_487', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_249', aptitude: 'create', attackStyle: 'attack' },   // 赫穆：苏尔帝国将军
    gen_mustafa_pasha: { generalId: 'gen_mustafa_pasha', tier: 'famous', tacticalSkillId: 'ts_504', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_263', aptitude: 'create', attackStyle: 'attack' },   // 穆斯塔法帕夏
    gen_laudonniere: { generalId: 'gen_laudonniere', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_280',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_047',  defBalanceSkillId: 'ts_1115',  defDisadvantageSkillId: 'ts_704', aptitude: 'reverse', attackStyle: 'defense' },   // 劳多尼耶，普将
    gen_suleiman: { generalId: 'gen_suleiman', tier: 'famous', tacticalSkillId: 'ts_510', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_673', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_266', aptitude: 'create', attackStyle: 'attack' },   // 苏莱曼大帝
    gen_akechi_mitsuhide: { generalId: 'gen_akechi_mitsuhide', tier: 'ordinary', tacticalSkillId: 'ts_535', atkAdvantageSkillId: 'ts_535', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_912', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_781', aptitude: 'reverse', attackStyle: 'defense' },   // 明智光秀
    gen_nanda_bayin: { generalId: 'gen_nanda_bayin', tier: 'ordinary', tacticalSkillId: 'ts_546', atkAdvantageSkillId: 'ts_546', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_931', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_272', aptitude: 'reverse', attackStyle: 'defense' },   // 莽应里
    gen_ishida_mitsunari: { generalId: 'gen_ishida_mitsunari', tier: 'ordinary', tacticalSkillId: 'ts_558', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_941', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_274', aptitude: 'create', attackStyle: 'attack' },   // 石田三成
    gen_chogtu_khan: { generalId: 'gen_chogtu_khan', tier: 'ordinary', tacticalSkillId: 'ts_619',  atkAdvantageSkillId: 'ts_619',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_595',  defAdvantageSkillId: 'ts_626',  defBalanceSkillId: 'ts_102',  defDisadvantageSkillId: 'ts_995', aptitude: 'reverse', attackStyle: 'defense' },   // 却图汗，普将
    gen_liu_guoxuan: { generalId: 'gen_liu_guoxuan', tier: 'ordinary', tacticalSkillId: 'ts_987', atkAdvantageSkillId: 'ts_987', atkBalanceSkillId: 'ts_356', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_302', aptitude: 'reverse', attackStyle: 'defense' },   // 刘国轩：明郑澎湖守将
    gen_kara_mustafa: { generalId: 'gen_kara_mustafa', tier: 'ordinary', tacticalSkillId: 'ts_525', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_277', aptitude: 'create', attackStyle: 'attack' },   // 卡拉穆斯塔法帕夏
    gen_kangxi: { generalId: 'gen_kangxi', tier: 'ordinary', tacticalSkillId: 'ts_559', atkAdvantageSkillId: 'ts_559', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_784', aptitude: 'create', attackStyle: 'attack' },   // 康熙帝
    gen_charles_xii: { generalId: 'gen_charles_xii', tier: 'famous', tacticalSkillId: 'ts_575', atkAdvantageSkillId: 'ts_575', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_287', aptitude: 'create', attackStyle: 'attack' },   // 查理十二
    gen_lobsang_danjin: { generalId: 'gen_lobsang_danjin', tier: 'ordinary', tacticalSkillId: 'ts_591', atkAdvantageSkillId: 'ts_591', atkBalanceSkillId: 'ts_507', atkDisadvantageSkillId: 'ts_369', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_514', aptitude: 'create', attackStyle: 'attack' },   // 罗卜藏丹津
    gen_furdan: { generalId: 'gen_furdan', tier: 'ordinary', tacticalSkillId: 'ts_796', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_808', aptitude: 'create', attackStyle: 'attack' },   // 傅尔丹
    gen_vernon: { generalId: 'gen_vernon', tier: 'ordinary', tacticalSkillId: 'ts_597', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_292', aptitude: 'create', attackStyle: 'attack' },   // 弗农　🔴[2026-11-01 主人令·四闸复核] 名将→普将：加勒比攻城掠地，无具名敌帅的战区决战
    gen_binnya_dala: { generalId: 'gen_binnya_dala', tier: 'ordinary', tacticalSkillId: 'ts_609',  atkAdvantageSkillId: 'ts_609',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_910',  defAdvantageSkillId: 'ts_140',  defBalanceSkillId: 'ts_614',  defDisadvantageSkillId: 'ts_142', aptitude: 'reverse', attackStyle: 'defense' },   // 彬尼亚达拉，普将
    gen_shashanka: { generalId: 'gen_shashanka', tier: 'famous', tacticalSkillId: 'ts_694', atkAdvantageSkillId: 'ts_694', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_297', aptitude: 'create', attackStyle: 'attack' },   // 设赏迦：高达王
    gen_sadashivrao: { generalId: 'gen_sadashivrao', tier: 'ordinary', tacticalSkillId: 'ts_751', atkAdvantageSkillId: 'ts_751', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_313', aptitude: 'create', attackStyle: 'attack' },   // 萨达希夫：马拉塔统帅
    gen_mingrui: { generalId: 'gen_mingrui', tier: 'ordinary', tacticalSkillId: 'ts_791', atkAdvantageSkillId: 'ts_791', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_317', aptitude: 'create', attackStyle: 'attack' },   // 明瑞　🔴[2026-11-01 主人令·四闸复核] 名将→普将：征缅以败死终，仅蛮结小胜
    gen_zengguofan: { generalId: 'gen_zengguofan', tier: 'ordinary', tacticalSkillId: 'ts_831', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_582', aptitude: 'create', attackStyle: 'attack' },   // 曾国藩
    gen_li_xiucheng: { generalId: 'gen_li_xiucheng', tier: 'famous', tacticalSkillId: 'ts_812', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_345', aptitude: 'reverse', attackStyle: 'defense' },   // 李秀成：太平天国忠王
    gen_lajos_ii: { generalId: 'gen_lajos_ii', tier: 'ordinary', tacticalSkillId: 'ts_813', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_321', aptitude: 'reverse', attackStyle: 'defense' },   // 拉约什二世
    bfe_cimmerian_king: { generalId: 'bfe_cimmerian_king', tier: 'ordinary', tacticalSkillId: 'ts_371',  atkAdvantageSkillId: 'ts_371',  atkBalanceSkillId: 'ts_196',  atkDisadvantageSkillId: 'ts_985',  defAdvantageSkillId: 'ts_782',  defBalanceSkillId: 'ts_1111',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 图格达梅：普将
    bfe3_46: { generalId: 'bfe3_46', tier: 'famous', tacticalSkillId: 'ts_870', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_334', aptitude: 'create', attackStyle: 'attack' },   // 维钦托利：名将（过三闸）
    baolusi: { generalId: 'baolusi', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_986',  defAdvantageSkillId: 'ts_315',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_108', aptitude: 'create', attackStyle: 'attack' },   // 保卢斯：普将
    waluo: { generalId: 'waluo', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_116',  defAdvantageSkillId: 'ts_330',  defBalanceSkillId: 'ts_403',  defDisadvantageSkillId: 'ts_736', aptitude: 'create', attackStyle: 'attack' },   // 瓦罗：普将
    aitiliusi: { generalId: 'aitiliusi', tier: 'famous', tacticalSkillId: 'ts_901', atkAdvantageSkillId: 'ts_901', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_549', aptitude: 'create', attackStyle: 'attack' },   // 埃提乌斯：名将（过三闸）
    bfe3_77: { generalId: 'bfe3_77', tier: 'ordinary', tacticalSkillId: 'ts_911',  atkAdvantageSkillId: 'ts_911',  atkBalanceSkillId: 'ts_942',  atkDisadvantageSkillId: 'ts_014',  defAdvantageSkillId: 'ts_851',  defBalanceSkillId: 'ts_1115',  defDisadvantageSkillId: 'ts_146', aptitude: 'create', attackStyle: 'attack' },   // 瓦勒良：普将
    bfe3_79: { generalId: 'bfe3_79', tier: 'famous', tacticalSkillId: 'ts_940', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_337', aptitude: 'create', attackStyle: 'attack' },   // 奥勒良：名将（过三闸）
    bfe3_81: { generalId: 'bfe3_81', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1116',  atkDisadvantageSkillId: 'ts_150',  defAdvantageSkillId: 'ts_421',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_157', aptitude: 'create', attackStyle: 'attack' },   // 马克森提乌斯：普将
    bfe3_91: { generalId: 'bfe3_91', tier: 'ordinary', tacticalSkillId: 'ts_319',  atkAdvantageSkillId: 'ts_319',  atkBalanceSkillId: 'ts_616',  atkDisadvantageSkillId: 'ts_007',  defAdvantageSkillId: 'ts_500',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_182', aptitude: 'create', attackStyle: 'attack' },   // 霍诺留：普将
    bfe_sigismund: { generalId: 'bfe_sigismund', tier: 'ordinary', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_1101',  atkDisadvantageSkillId: 'ts_009',  defAdvantageSkillId: 'ts_517',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_187', aptitude: 'create', attackStyle: 'attack' },   // 西吉斯蒙德：普将
    bfe3_92: { generalId: 'bfe3_92', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_252',  atkDisadvantageSkillId: 'ts_041',  defAdvantageSkillId: 'ts_532',  defBalanceSkillId: 'ts_1118',  defDisadvantageSkillId: 'ts_191', aptitude: 'create', attackStyle: 'attack' },   // 阿内吉斯克鲁斯：普将
    gen_jogaila: { generalId: 'gen_jogaila', tier: 'famous', tacticalSkillId: 'ts_504', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_053', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_351', aptitude: 'create', attackStyle: 'attack' },   // 雅盖沃：名将（过三闸）
    bfe_niu_han: { generalId: 'bfe_niu_han', tier: 'ordinary', tacticalSkillId: 'ts_629',  atkAdvantageSkillId: 'ts_629',  atkBalanceSkillId: 'ts_841',  atkDisadvantageSkillId: 'ts_206',  defAdvantageSkillId: 'ts_640',  defBalanceSkillId: 'ts_1120',  defDisadvantageSkillId: 'ts_020', aptitude: 'create', attackStyle: 'attack' },   // 牛邯：普将
    bfe3_14: { generalId: 'bfe3_14', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_068',  defAdvantageSkillId: 'ts_970',  defBalanceSkillId: 'ts_326',  defDisadvantageSkillId: 'ts_207', aptitude: 'create', attackStyle: 'attack' },   // 屠睢：普将
    bfe3_17: { generalId: 'bfe3_17', tier: 'ordinary', tacticalSkillId: 'ts_036',  atkAdvantageSkillId: 'ts_036',  atkBalanceSkillId: 'ts_328',  atkDisadvantageSkillId: 'ts_087',  defAdvantageSkillId: 'ts_658',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_255', aptitude: 'create', attackStyle: 'attack' },   // 王离：普将
    bfe3_9: { generalId: 'bfe3_9', tier: 'famous', tacticalSkillId: 'ts_354', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_383', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_359', aptitude: 'create', attackStyle: 'attack' },   // 王龁：名将（过三闸）
    bfe3_7: { generalId: 'bfe3_7', tier: 'ordinary', tacticalSkillId: 'ts_570',  atkAdvantageSkillId: 'ts_570',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_090',  defAdvantageSkillId: 'ts_983',  defBalanceSkillId: 'ts_900',  defDisadvantageSkillId: 'ts_435', aptitude: 'create', attackStyle: 'attack' },   // 胡阳：普将
    bfe3_78: { generalId: 'bfe3_78', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_234',  defAdvantageSkillId: 'ts_709',  defBalanceSkillId: 'ts_467',  defDisadvantageSkillId: 'ts_168', aptitude: 'create', attackStyle: 'attack' },   // 诸葛瞻：普将
    bfe3_71: { generalId: 'bfe3_71', tier: 'ordinary', tacticalSkillId: 'ts_850',  atkAdvantageSkillId: 'ts_850',  atkBalanceSkillId: 'ts_1104',  atkDisadvantageSkillId: 'ts_704',  defAdvantageSkillId: 'ts_724',  defBalanceSkillId: 'ts_696',  defDisadvantageSkillId: 'ts_460', aptitude: 'create', attackStyle: 'attack' },   // 袁绍：边界（未达战略级）→ 普将
    bfe3_36: { generalId: 'bfe3_36', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_477',  defAdvantageSkillId: 'ts_088',  defBalanceSkillId: 'ts_173',  defDisadvantageSkillId: 'ts_091', aptitude: 'create', attackStyle: 'attack' },   // 李广利：边界（未达战略级）→ 普将
    bfe3_20: { generalId: 'bfe3_20', tier: 'ordinary', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_209',  defAdvantageSkillId: 'ts_569',  defBalanceSkillId: 'ts_707',  defDisadvantageSkillId: 'ts_064', aptitude: 'create', attackStyle: 'attack' },   // 卫满：普将
    bfe3_31: { generalId: 'bfe3_31', tier: 'ordinary', tacticalSkillId: 'ts_015',  atkAdvantageSkillId: 'ts_015',  atkBalanceSkillId: 'ts_097',  atkDisadvantageSkillId: 'ts_373',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_216', aptitude: 'create', attackStyle: 'attack' },   // 卫右渠：普将
    bfe3_24: { generalId: 'bfe3_24', tier: 'ordinary', tacticalSkillId: 'ts_132',  atkAdvantageSkillId: 'ts_132',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_633',  defBalanceSkillId: 'ts_124',  defDisadvantageSkillId: 'ts_081', aptitude: 'create', attackStyle: 'attack' },   // 老上单于：边界（未达战略级）→ 普将
    bfe3_34: { generalId: 'bfe3_34', tier: 'ordinary', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_227',  defAdvantageSkillId: 'ts_683',  defBalanceSkillId: 'ts_507',  defDisadvantageSkillId: 'ts_233', aptitude: 'create', attackStyle: 'attack' },   // 儿单于：普将
    bfe3_38: { generalId: 'bfe3_38', tier: 'famous', tacticalSkillId: 'ts_622', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_298', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_607', aptitude: 'reverse', attackStyle: 'attack' },   // 且鞮侯单于：名将（过三闸）
    bfe3_64: { generalId: 'bfe3_64', tier: 'ordinary', tacticalSkillId: 'ts_039',  atkAdvantageSkillId: 'ts_039',  atkBalanceSkillId: 'ts_156',  atkDisadvantageSkillId: 'ts_545',  defAdvantageSkillId: 'ts_786',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_623', aptitude: 'create', attackStyle: 'attack' },   // 北单于：普将
    bfe3_48: { generalId: 'bfe3_48', tier: 'ordinary', tacticalSkillId: 'ts_051',  atkAdvantageSkillId: 'ts_051',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_789',  defBalanceSkillId: 'ts_663',  defDisadvantageSkillId: 'ts_489', aptitude: 'create', attackStyle: 'attack' },   // 呼韩邪单于：普将
    bfe3_74: { generalId: 'bfe3_74', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_561',  defAdvantageSkillId: 'ts_811',  defBalanceSkillId: 'ts_403',  defDisadvantageSkillId: 'ts_606', aptitude: 'create', attackStyle: 'attack' },   // 轲比能：普将
    bfe_jaya_prakash: { generalId: 'bfe_jaya_prakash', tier: 'ordinary', tacticalSkillId: 'ts_070', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_386', aptitude: 'reverse', attackStyle: 'attack' },   // 普拉卡什：名将（过三闸）
    bfe_dian_chief: { generalId: 'bfe_dian_chief', tier: 'ordinary', tacticalSkillId: 'ts_692',  atkAdvantageSkillId: 'ts_692',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_253',  defAdvantageSkillId: 'ts_950',  defBalanceSkillId: 'ts_385',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 苴兰：普将
    bfe_ngo_nhat_khanh: { generalId: 'bfe_ngo_nhat_khanh', tier: 'ordinary', tacticalSkillId: 'ts_559',  atkAdvantageSkillId: 'ts_559',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_992',  defBalanceSkillId: 'ts_176',  defDisadvantageSkillId: 'ts_303', aptitude: 'create', attackStyle: 'attack' },   // 吴日庆：普将
    bfe3_88: { generalId: 'bfe3_88', tier: 'ordinary', tacticalSkillId: 'ts_111',  atkAdvantageSkillId: 'ts_111',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_997',  defBalanceSkillId: 'ts_634',  defDisadvantageSkillId: 'ts_103', aptitude: 'create', attackStyle: 'attack' },   // 苻融：普将
    gen_shi_chaoyi: { generalId: 'gen_shi_chaoyi', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_1111',  atkDisadvantageSkillId: 'ts_127',  defAdvantageSkillId: 'ts_099',  defBalanceSkillId: 'ts_473',  defDisadvantageSkillId: 'ts_482', aptitude: 'create', attackStyle: 'attack' },   // 史朝义：普将
    bfe3_13: { generalId: 'bfe3_13', tier: 'famous', tacticalSkillId: 'ts_170', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_283', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_157', aptitude: 'reverse', attackStyle: 'attack' },   // 项燕：名将（过三闸）
    bfe3_28: { generalId: 'bfe3_28', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_309',  atkDisadvantageSkillId: 'ts_109',  defAdvantageSkillId: 'ts_316',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_261', aptitude: 'create', attackStyle: 'attack' },   // 刘濞：普将
    bfe3_70: { generalId: 'bfe3_70', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_387',  defAdvantageSkillId: 'ts_008',  defBalanceSkillId: 'ts_710',  defDisadvantageSkillId: 'ts_543', aptitude: 'create', attackStyle: 'attack' },   // 刘繇：普将
    bfe3_69: { generalId: 'bfe3_69', tier: 'ordinary', tacticalSkillId: 'ts_172',  atkAdvantageSkillId: 'ts_172',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_022',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_996', aptitude: 'create', attackStyle: 'attack' },   // 华雄：普将
    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'ts_130', atkAdvantageSkillId: 'ts_130', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_422', aptitude: 'create', attackStyle: 'attack' },   // 雅库布：名将（过三闸）
    bfe3_6: { generalId: 'bfe3_6', tier: 'ordinary', tacticalSkillId: 'ts_141', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_231', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_429', aptitude: 'reverse', attackStyle: 'attack' },   // 安条克一世：名将（过三闸）
    gen_toghtekin: { generalId: 'gen_toghtekin', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_238',  defAdvantageSkillId: 'ts_047',  defBalanceSkillId: 'ts_063',  defDisadvantageSkillId: 'ts_035', aptitude: 'create', attackStyle: 'attack' },   // 图格特金：边界（未达战略级）→ 普将
    bfe3_1: { generalId: 'bfe3_1', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_1116',  atkDisadvantageSkillId: 'ts_241',  defAdvantageSkillId: 'ts_089',  defBalanceSkillId: 'ts_073',  defDisadvantageSkillId: 'ts_075', aptitude: 'create', attackStyle: 'attack' },   // 西底家：普将
    gen_aristobulus_ii: { generalId: 'gen_aristobulus_ii', tier: 'ordinary', tacticalSkillId: 'ts_163',  atkAdvantageSkillId: 'ts_163',  atkBalanceSkillId: 'ts_095',  atkDisadvantageSkillId: 'ts_989',  defAdvantageSkillId: 'ts_057',  defBalanceSkillId: 'ts_1101',  defDisadvantageSkillId: 'ts_281', aptitude: 'create', attackStyle: 'attack' },   // 阿里斯托布鲁斯二世：普将
    gen_sayf_al_dawla: { generalId: 'gen_sayf_al_dawla', tier: 'famous', tacticalSkillId: 'ts_177', atkAdvantageSkillId: 'ts_177', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_291', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_431', aptitude: 'create', attackStyle: 'attack' },   // 赛弗道莱：名将（过三闸）
    bfe3_73: { generalId: 'bfe3_73', tier: 'ordinary', tacticalSkillId: 'ts_198',  atkAdvantageSkillId: 'ts_198',  atkBalanceSkillId: 'ts_1103',  atkDisadvantageSkillId: 'ts_527',  defAdvantageSkillId: 'ts_119',  defBalanceSkillId: 'ts_139',  defDisadvantageSkillId: 'ts_505', aptitude: 'create', attackStyle: 'attack' },   // 阿尔达班四世：普将
    gen_sangrama_vijayottungavarman: { generalId: 'gen_sangrama_vijayottungavarman', tier: 'ordinary', tacticalSkillId: 'ts_215',  atkAdvantageSkillId: 'ts_215',  atkBalanceSkillId: 'ts_278',  atkDisadvantageSkillId: 'ts_295',  defAdvantageSkillId: 'ts_120',  defBalanceSkillId: 'ts_1104',  defDisadvantageSkillId: 'ts_080', aptitude: 'create', attackStyle: 'attack' },   // 桑格拉玛：普将
    bfe_rajah_sulayman: { generalId: 'bfe_rajah_sulayman', tier: 'ordinary', tacticalSkillId: 'ts_570',  atkAdvantageSkillId: 'ts_570',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_020',  defAdvantageSkillId: 'ts_126',  defBalanceSkillId: 'ts_280',  defDisadvantageSkillId: 'ts_307', aptitude: 'create', attackStyle: 'attack' },   // 拉者苏莱曼三世：普将
    bfe_pisa_king: { generalId: 'bfe_pisa_king', tier: 'ordinary', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_356',  atkDisadvantageSkillId: 'ts_704',  defAdvantageSkillId: 'ts_140',  defBalanceSkillId: 'ts_1106',  defDisadvantageSkillId: 'ts_323', aptitude: 'create', attackStyle: 'attack' },   // 潘塔琉斯：普将
    yisatisi_yisatisi: { generalId: 'yisatisi_yisatisi', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_160',  defBalanceSkillId: 'ts_110',  defDisadvantageSkillId: 'ts_499', aptitude: 'create', attackStyle: 'attack' },   // 伊萨提斯：普将
    bfe_dalriada_king: { generalId: 'bfe_dalriada_king', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_412',  defAdvantageSkillId: 'ts_092',  defBalanceSkillId: 'ts_286',  defDisadvantageSkillId: 'ts_1000', aptitude: 'create', attackStyle: 'attack' },   // 费尔古斯：普将
    gen_john_comyn: { generalId: 'gen_john_comyn', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_346',  atkDisadvantageSkillId: 'ts_113',  defAdvantageSkillId: 'ts_189',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_440', aptitude: 'create', attackStyle: 'attack' },   // 科明：普将
    bfe_chanca_chief: { generalId: 'bfe_chanca_chief', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_275',  defAdvantageSkillId: 'ts_194',  defBalanceSkillId: 'ts_366',  defDisadvantageSkillId: 'ts_450', aptitude: 'create', attackStyle: 'attack' },   // 阿斯塔瓦兰卡：普将
    bfe_sue_harutaka: { generalId: 'bfe_sue_harutaka', tier: 'ordinary', tacticalSkillId: 'ts_220',  atkAdvantageSkillId: 'ts_220',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_470',  defAdvantageSkillId: 'ts_778',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_451', aptitude: 'create', attackStyle: 'attack' },   // 陶晴贤：普将
    bfe_muzaffar_shah: { generalId: 'bfe_muzaffar_shah', tier: 'ordinary', tacticalSkillId: 'ts_444',  atkAdvantageSkillId: 'ts_444',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_464',  defAdvantageSkillId: 'ts_270',  defBalanceSkillId: 'ts_432',  defDisadvantageSkillId: 'ts_457', aptitude: 'create', attackStyle: 'attack' },   // 穆扎法尔三世：普将
    bfe_coyett: { generalId: 'bfe_coyett', tier: 'ordinary', tacticalSkillId: 'ts_258',  atkAdvantageSkillId: 'ts_258',  atkBalanceSkillId: 'ts_174',  atkDisadvantageSkillId: 'ts_585',  defAdvantageSkillId: 'ts_347',  defBalanceSkillId: 'ts_1122',  defDisadvantageSkillId: 'ts_586', aptitude: 'create', attackStyle: 'attack' },   // 揆一：普将
    bfe_prasenajit: { generalId: 'bfe_prasenajit', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_094',  defBalanceSkillId: 'ts_406',  defDisadvantageSkillId: 'ts_020', aptitude: 'create', attackStyle: 'attack' },   // 波斯匿：普将
    bfe_kalinga_king: { generalId: 'bfe_kalinga_king', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_743',  atkDisadvantageSkillId: 'ts_413',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_1111',  defDisadvantageSkillId: 'ts_069', aptitude: 'create', attackStyle: 'attack' },   // 婆摩：普将
    bfe_anga_king: { generalId: 'bfe_anga_king', tier: 'ordinary', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_367',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_315',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_128', aptitude: 'create', attackStyle: 'attack' },   // 达摩婆罗：普将
    bfe_pushyamitra: { generalId: 'bfe_pushyamitra', tier: 'ordinary', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_459',  defAdvantageSkillId: 'ts_327',  defBalanceSkillId: 'ts_382',  defDisadvantageSkillId: 'ts_508', aptitude: 'create', attackStyle: 'attack' },   // 普沙密多罗：普将
    bfe_antigonus: { generalId: 'bfe_antigonus', tier: 'famous', tacticalSkillId: 'ts_239', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_533', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_463', aptitude: 'create', attackStyle: 'attack' },   // 安提柯一世：名将（过三闸）
    gen_li_xin: { generalId: 'gen_li_xin', tier: 'famous', tacticalSkillId: 'ts_310', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_1124', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },   // 李信
    gen_seleucus_i: { generalId: 'gen_seleucus_i', tier: 'famous', tacticalSkillId: 'ts_250', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_483', aptitude: 'create', attackStyle: 'attack' },   // 塞琉古一世
    bfe2_xerxes_i: { generalId: 'bfe2_xerxes_i', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_148',  defAdvantageSkillId: 'ts_341',  defBalanceSkillId: 'ts_385',  defDisadvantageSkillId: 'ts_590', aptitude: 'create', attackStyle: 'attack' },   // 薛西斯一世
    bfe2_mardonius: { generalId: 'bfe2_mardonius', tier: 'ordinary', tacticalSkillId: 'ts_201',  atkAdvantageSkillId: 'ts_201',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_860',  defAdvantageSkillId: 'ts_133',  defBalanceSkillId: 'ts_129',  defDisadvantageSkillId: 'ts_711', aptitude: 'create', attackStyle: 'attack' },   // 马尔多尼乌斯
    bfe2_cleon: { generalId: 'bfe2_cleon', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_438',  atkDisadvantageSkillId: 'ts_715',  defAdvantageSkillId: 'ts_162',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 克里昂
    bfe2_conon: { generalId: 'bfe2_conon', tier: 'ordinary', tacticalSkillId: 'ts_265',  atkAdvantageSkillId: 'ts_265',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_592',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_468',  defDisadvantageSkillId: 'ts_661', aptitude: 'create', attackStyle: 'attack' },   // 科农
    bfe2_cleombrotus_i: { generalId: 'bfe2_cleombrotus_i', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_516',  atkDisadvantageSkillId: 'ts_682',  defAdvantageSkillId: 'ts_175',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_601', aptitude: 'create', attackStyle: 'attack' },   // 克勒翁布罗图斯一世
    bfe_callias: { generalId: 'bfe_callias', tier: 'ordinary', tacticalSkillId: 'ts_444',  atkAdvantageSkillId: 'ts_444',  atkBalanceSkillId: 'ts_136',  atkDisadvantageSkillId: 'ts_621',  defAdvantageSkillId: 'ts_178',  defBalanceSkillId: 'ts_1115',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 卡利斯
    bfe_bomilcar: { generalId: 'bfe_bomilcar', tier: 'ordinary', tacticalSkillId: 'ts_296',  atkAdvantageSkillId: 'ts_296',  atkBalanceSkillId: 'ts_1116',  atkDisadvantageSkillId: 'ts_637',  defAdvantageSkillId: 'ts_421',  defBalanceSkillId: 'ts_447',  defDisadvantageSkillId: 'ts_020', aptitude: 'create', attackStyle: 'attack' },   // 波米尔卡
    bfe_gaius_livius: { generalId: 'bfe_gaius_livius', tier: 'ordinary', tacticalSkillId: 'ts_201',  atkAdvantageSkillId: 'ts_201',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_644',  defAdvantageSkillId: 'ts_221',  defBalanceSkillId: 'ts_406',  defDisadvantageSkillId: 'ts_164', aptitude: 'create', attackStyle: 'attack' },   // 李维乌斯
    bfe3_51: { generalId: 'bfe3_51', tier: 'ordinary', tacticalSkillId: 'ts_336',  atkAdvantageSkillId: 'ts_336',  atkBalanceSkillId: 'ts_472',  atkDisadvantageSkillId: 'ts_171',  defAdvantageSkillId: 'ts_232',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_667', aptitude: 'create', attackStyle: 'attack' },   // 佩特罗尼乌斯
    bfe3_63: { generalId: 'bfe3_63', tier: 'ordinary', tacticalSkillId: 'ts_201',  atkAdvantageSkillId: 'ts_201',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_188',  defAdvantageSkillId: 'ts_436',  defBalanceSkillId: 'ts_485',  defDisadvantageSkillId: 'ts_671', aptitude: 'create', attackStyle: 'attack' },   // 霍尔多尼乌斯
    bfe_isaac_komnenos: { generalId: 'bfe_isaac_komnenos', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_517',  defBalanceSkillId: 'ts_137',  defDisadvantageSkillId: 'ts_951', aptitude: 'create', attackStyle: 'attack' },   // 伊萨克
    bfe2_esarhaddon: { generalId: 'bfe2_esarhaddon', tier: 'famous', tacticalSkillId: 'ts_339', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_674', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_190', aptitude: 'create', attackStyle: 'attack' },   // 以撒哈顿
    bfe2_shalmaneser_iii: { generalId: 'bfe2_shalmaneser_iii', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_707',  atkDisadvantageSkillId: 'ts_677',  defAdvantageSkillId: 'ts_532',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_713', aptitude: 'create', attackStyle: 'attack' },   // 沙尔马那塞尔三世
    bfe2_sin_shar_ishkun: { generalId: 'bfe2_sin_shar_ishkun', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_244',  defBalanceSkillId: 'ts_475',  defDisadvantageSkillId: 'ts_772', aptitude: 'create', attackStyle: 'attack' },   // 伊什昆
    bfe2_nabonidus: { generalId: 'bfe2_nabonidus', tier: 'ordinary', tacticalSkillId: 'ts_349',  atkAdvantageSkillId: 'ts_349',  atkBalanceSkillId: 'ts_1103',  atkDisadvantageSkillId: 'ts_793',  defAdvantageSkillId: 'ts_556',  defBalanceSkillId: 'ts_576',  defDisadvantageSkillId: 'ts_413', aptitude: 'create', attackStyle: 'attack' },   // 那波尼德
    bfe2_enlil_nadin_ahi: { generalId: 'bfe2_enlil_nadin_ahi', tier: 'ordinary', tacticalSkillId: 'ts_446',  atkAdvantageSkillId: 'ts_446',  atkBalanceSkillId: 'ts_1104',  atkDisadvantageSkillId: 'ts_680',  defAdvantageSkillId: 'ts_257',  defBalanceSkillId: 'ts_707',  defDisadvantageSkillId: 'ts_722', aptitude: 'create', attackStyle: 'attack' },   // 恩利尔纳丁
    bfe2_nidintu_bel: { generalId: 'bfe2_nidintu_bel', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_767',  atkDisadvantageSkillId: 'ts_703',  defAdvantageSkillId: 'ts_564',  defBalanceSkillId: 'ts_1105',  defDisadvantageSkillId: 'ts_690', aptitude: 'create', attackStyle: 'attack' },   // 尼丁图-贝尔
    bfe2_yahdun_lim: { generalId: 'bfe2_yahdun_lim', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_697',  defAdvantageSkillId: 'ts_284',  defBalanceSkillId: 'ts_494',  defDisadvantageSkillId: 'ts_731', aptitude: 'create', attackStyle: 'attack' },   // 亚赫敦林
    bfe2_rezin: { generalId: 'bfe2_rezin', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_720',  defAdvantageSkillId: 'ts_569',  defBalanceSkillId: 'ts_767',  defDisadvantageSkillId: 'ts_910', aptitude: 'create', attackStyle: 'attack' },   // 利汛
    bfe_meherdates: { generalId: 'bfe_meherdates', tier: 'ordinary', tacticalSkillId: 'ts_242',  atkAdvantageSkillId: 'ts_242',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_765',  defAdvantageSkillId: 'ts_301',  defBalanceSkillId: 'ts_681',  defDisadvantageSkillId: 'ts_725', aptitude: 'create', attackStyle: 'attack' },   // 梅哈尔达特
    bfe_achish: { generalId: 'bfe_achish', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_726',  defAdvantageSkillId: 'ts_626',  defBalanceSkillId: 'ts_155',  defDisadvantageSkillId: 'ts_014', aptitude: 'create', attackStyle: 'attack' },   // 亚吉
    bfe2_pang_juan: { generalId: 'bfe2_pang_juan', tier: 'famous', tacticalSkillId: 'ts_424', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_203', aptitude: 'create', attackStyle: 'attack' },   // 庞涓
    bfe3_18: { generalId: 'bfe3_18', tier: 'ordinary', tacticalSkillId: 'ts_972',  atkAdvantageSkillId: 'ts_972',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_747',  defAdvantageSkillId: 'ts_311',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_740', aptitude: 'create', attackStyle: 'attack' },   // 陈馀
    bfe2_qi_qinggong: { generalId: 'bfe2_qi_qinggong', tier: 'ordinary', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_762',  defAdvantageSkillId: 'ts_426',  defBalanceSkillId: 'ts_855',  defDisadvantageSkillId: 'ts_211', aptitude: 'create', attackStyle: 'attack' },   // 齐顷公
    bfe2_bao_shuya: { generalId: 'bfe2_bao_shuya', tier: 'ordinary', tacticalSkillId: 'ts_535',  atkAdvantageSkillId: 'ts_535',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_763',  defAdvantageSkillId: 'ts_536',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 鲍叔牙
    bfe2_ziyu: { generalId: 'bfe2_ziyu', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_752',  atkDisadvantageSkillId: 'ts_756',  defAdvantageSkillId: 'ts_913',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_620', aptitude: 'create', attackStyle: 'attack' },   // 子玉
    bfe2_xun_linfu: { generalId: 'bfe2_xun_linfu', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_986',  defAdvantageSkillId: 'ts_658',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_840', aptitude: 'create', attackStyle: 'attack' },   // 荀林父
    bfe3_58: { generalId: 'bfe3_58', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_634',  atkDisadvantageSkillId: 'ts_890',  defAdvantageSkillId: 'ts_724',  defBalanceSkillId: 'ts_1111',  defDisadvantageSkillId: 'ts_853', aptitude: 'create', attackStyle: 'attack' },   // 张步
    bfe_wu_yuanji: { generalId: 'bfe_wu_yuanji', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_931',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_199',  defDisadvantageSkillId: 'ts_584', aptitude: 'create', attackStyle: 'attack' },   // 吴元济
    bfe_sun_ru: { generalId: 'bfe_sun_ru', tier: 'ordinary', tacticalSkillId: 'ts_546',  atkAdvantageSkillId: 'ts_546',  atkBalanceSkillId: 'ts_707',  atkDisadvantageSkillId: 'ts_984',  defAdvantageSkillId: 'ts_304',  defBalanceSkillId: 'ts_1113',  defDisadvantageSkillId: 'ts_645', aptitude: 'create', attackStyle: 'attack' },   // 孙儒
    bfe_gao_zhihui: { generalId: 'bfe_gao_zhihui', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_920',  defAdvantageSkillId: 'ts_633',  defBalanceSkillId: 'ts_707',  defDisadvantageSkillId: 'ts_991', aptitude: 'create', attackStyle: 'attack' },   // 高智慧
    aiji_psamtik_iii: { generalId: 'aiji_psamtik_iii', tier: 'ordinary', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_190',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_777', aptitude: 'reverse', attackStyle: 'defense' },   // 普萨美提克三世：佩鲁西姆败亡，普将
    gen_zhang_rou: { generalId: 'gen_zhang_rou', tier: 'famous', tacticalSkillId: 'ts_455', atkAdvantageSkillId: 'ts_455', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_746', aptitude: 'create', attackStyle: 'attack' },   // 张柔
    gen_feng_sheng: { generalId: 'gen_feng_sheng', tier: 'famous', tacticalSkillId: 'ts_609', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_651', aptitude: 'create', attackStyle: 'attack' },   // 冯胜
    zhongxiang_zhongxiang: { generalId: 'zhongxiang_zhongxiang', tier: 'ordinary', tacticalSkillId: 'ts_982',  atkAdvantageSkillId: 'ts_982',  atkBalanceSkillId: 'ts_767',  atkDisadvantageSkillId: 'ts_267',  defAdvantageSkillId: 'ts_683',  defBalanceSkillId: 'ts_1102',  defDisadvantageSkillId: 'ts_801', aptitude: 'create', attackStyle: 'attack' },   // 钟相
    shuofang_sujian: { generalId: 'shuofang_sujian', tier: 'ordinary', tacticalSkillId: 'ts_354',  atkAdvantageSkillId: 'ts_354',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_790',  defAdvantageSkillId: 'ts_709',  defBalanceSkillId: 'ts_567',  defDisadvantageSkillId: 'ts_379', aptitude: 'create', attackStyle: 'attack' },   // 苏建
    mixiya_arsames: { generalId: 'mixiya_arsames', tier: 'ordinary', tacticalSkillId: 'ts_525',  atkAdvantageSkillId: 'ts_525',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_951',  defAdvantageSkillId: 'ts_786',  defBalanceSkillId: 'ts_634',  defDisadvantageSkillId: 'ts_830', aptitude: 'create', attackStyle: 'attack' },   // 阿萨米斯
    bfe2_pollis: { generalId: 'bfe2_pollis', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_743',  atkDisadvantageSkillId: 'ts_912',  defAdvantageSkillId: 'ts_789',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_1000', aptitude: 'create', attackStyle: 'attack' },   // 波利斯
    bfe3_86: { generalId: 'bfe3_86', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_1103',  atkDisadvantageSkillId: 'ts_761',  defAdvantageSkillId: 'ts_811',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_428', aptitude: 'create', attackStyle: 'attack' },   // 克诺多马尔
    bfe_su_ding: { generalId: 'bfe_su_ding', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_647',  atkDisadvantageSkillId: 'ts_492',  defAdvantageSkillId: 'ts_950',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_428', aptitude: 'create', attackStyle: 'attack' },   // 苏定
    bfe_sonom: { generalId: 'bfe_sonom', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_014',  defAdvantageSkillId: 'ts_992',  defBalanceSkillId: 'ts_520',  defDisadvantageSkillId: 'ts_941', aptitude: 'create', attackStyle: 'attack' },   // 索诺木
    bfe3_43: { generalId: 'bfe3_43', tier: 'ordinary', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_616',  atkDisadvantageSkillId: 'ts_810',  defAdvantageSkillId: 'ts_997',  defBalanceSkillId: 'ts_1104',  defDisadvantageSkillId: 'ts_615', aptitude: 'create', attackStyle: 'attack' },   // 杨玉
    bfe3_44: { generalId: 'bfe3_44', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_745',  atkDisadvantageSkillId: 'ts_703',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_981', aptitude: 'create', attackStyle: 'attack' },   // 靡忘
    bfe_ajibaldo: { generalId: 'bfe_ajibaldo', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_312',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_542', aptitude: 'create', attackStyle: 'attack' },   // 阿只拔都
    bfe2_dhanananda: { generalId: 'bfe2_dhanananda', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_995',  defAdvantageSkillId: 'ts_374',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_205', aptitude: 'create', attackStyle: 'attack' },   // 达那难陀
    bfe3_27: { generalId: 'bfe3_27', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_699',  defAdvantageSkillId: 'ts_442',  defBalanceSkillId: 'ts_675',  defDisadvantageSkillId: 'ts_999', aptitude: 'create', attackStyle: 'attack' },   // 婆苏密多罗
    bfe_rasul_khan: { generalId: 'bfe_rasul_khan', tier: 'ordinary', tacticalSkillId: 'ts_462',  atkAdvantageSkillId: 'ts_462',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_496',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_212', aptitude: 'create', attackStyle: 'attack' },   // 拉苏尔汗
    bfe3_25: { generalId: 'bfe3_25', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_219',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_229',  defDisadvantageSkillId: 'ts_810', aptitude: 'create', attackStyle: 'attack' },   // 埃拉拉
    bfe_cleombrotus: { generalId: 'bfe_cleombrotus', tier: 'ordinary', tacticalSkillId: 'ts_525',  atkAdvantageSkillId: 'ts_525',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_019',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_240', aptitude: 'create', attackStyle: 'attack' },   // 克里奥姆布罗图斯
    bfe2_pharnabazus: { generalId: 'bfe2_pharnabazus', tier: 'ordinary', tacticalSkillId: 'ts_504',  atkAdvantageSkillId: 'ts_504',  atkBalanceSkillId: 'ts_705',  atkDisadvantageSkillId: 'ts_023',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_1107',  defDisadvantageSkillId: 'ts_245', aptitude: 'create', attackStyle: 'attack' },   // 法那巴佐斯
    bfe2_theagenes: { generalId: 'bfe2_theagenes', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_022',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_753', aptitude: 'create', attackStyle: 'attack' },   // 特阿格尼斯
    bfe3_19: { generalId: 'bfe3_19', tier: 'ordinary', tacticalSkillId: 'ts_474',  atkAdvantageSkillId: 'ts_474',  atkBalanceSkillId: 'ts_705',  atkDisadvantageSkillId: 'ts_852',  defAdvantageSkillId: 'ts_515',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_027', aptitude: 'create', attackStyle: 'attack' },   // 斯科帕斯
    bfe3_23: { generalId: 'bfe3_23', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_754',  atkDisadvantageSkillId: 'ts_058',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_1123',  defDisadvantageSkillId: 'ts_035', aptitude: 'create', attackStyle: 'attack' },   // 塞隆
    bfe3_4: { generalId: 'bfe3_4', tier: 'ordinary', tacticalSkillId: 'ts_480',  atkAdvantageSkillId: 'ts_480',  atkBalanceSkillId: 'ts_475',  atkDisadvantageSkillId: 'ts_018',  defAdvantageSkillId: 'ts_026',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_067', aptitude: 'create', attackStyle: 'attack' },   // 拉维利乌斯
    bfe_smolensk_voivode: { generalId: 'bfe_smolensk_voivode', tier: 'ordinary', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_076',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_942',  defDisadvantageSkillId: 'ts_493', aptitude: 'create', attackStyle: 'attack' },   // 格列博维奇
    bfe_albert_lombard: { generalId: 'bfe_albert_lombard', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_079',  defAdvantageSkillId: 'ts_539',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_247', aptitude: 'create', attackStyle: 'attack' },   // 阿尔伯特
    bfe_li_song: { generalId: 'bfe_li_song', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_551',  atkDisadvantageSkillId: 'ts_314',  defAdvantageSkillId: 'ts_160',  defBalanceSkillId: 'ts_1110',  defDisadvantageSkillId: 'ts_108', aptitude: 'create', attackStyle: 'attack' },   // 李松
    bfe3_57: { generalId: 'bfe3_57', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_1111',  atkDisadvantageSkillId: 'ts_116',  defAdvantageSkillId: 'ts_189',  defBalanceSkillId: 'ts_700',  defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },   // 樊参
    bfe3_67: { generalId: 'bfe3_67', tier: 'ordinary', tacticalSkillId: 'ts_242',  atkAdvantageSkillId: 'ts_242',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_569',  defBalanceSkillId: 'ts_264',  defDisadvantageSkillId: 'ts_736', aptitude: 'create', attackStyle: 'attack' },   // 王国
    bfe_yin_ziqi: { generalId: 'bfe_yin_ziqi', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_810',  defAdvantageSkillId: 'ts_065',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_276', aptitude: 'create', attackStyle: 'attack' },   // 尹子奇
    bfe_chen_dong: { generalId: 'bfe_chen_dong', tier: 'ordinary', tacticalSkillId: 'ts_987',  atkAdvantageSkillId: 'ts_987',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_316',  defBalanceSkillId: 'ts_278',  defDisadvantageSkillId: 'ts_704', aptitude: 'create', attackStyle: 'attack' },   // 陈东
    bfe3_16: { generalId: 'bfe3_16', tier: 'ordinary', tacticalSkillId: 'ts_685',  atkAdvantageSkillId: 'ts_685',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_126',  defBalanceSkillId: 'ts_176',  defDisadvantageSkillId: 'ts_684', aptitude: 'create', attackStyle: 'attack' },   // 桀骏
    bfe3_22: { generalId: 'bfe3_22', tier: 'ordinary', tacticalSkillId: 'ts_570',  atkAdvantageSkillId: 'ts_570',  atkBalanceSkillId: 'ts_286',  atkDisadvantageSkillId: 'ts_348',  defAdvantageSkillId: 'ts_436',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_180', aptitude: 'create', attackStyle: 'attack' },   // 驺郢
    bfe3_68: { generalId: 'bfe3_68', tier: 'ordinary', tacticalSkillId: 'ts_510',  atkAdvantageSkillId: 'ts_510',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_209',  defAdvantageSkillId: 'ts_669',  defBalanceSkillId: 'ts_990',  defDisadvantageSkillId: 'ts_971', aptitude: 'create', attackStyle: 'attack' },   // 严纲
    bfe3_75: { generalId: 'bfe3_75', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_381',  defAdvantageSkillId: 'ts_913',  defBalanceSkillId: 'ts_260',  defDisadvantageSkillId: 'ts_428', aptitude: 'create', attackStyle: 'attack' },   // 刘胄
    bfe3_80: { generalId: 'bfe3_80', tier: 'ordinary', tacticalSkillId: 'ts_785',  atkAdvantageSkillId: 'ts_785',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_513',  defAdvantageSkillId: 'ts_270',  defBalanceSkillId: 'ts_767',  defDisadvantageSkillId: 'ts_518', aptitude: 'create', attackStyle: 'attack' },   // 张微
    bfe3_83: { generalId: 'bfe3_83', tier: 'ordinary', tacticalSkillId: 'ts_497',  atkAdvantageSkillId: 'ts_497',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_662',  defAdvantageSkillId: 'ts_553',  defBalanceSkillId: 'ts_516',  defDisadvantageSkillId: 'ts_131', aptitude: 'create', attackStyle: 'attack' },   // 李势
    bfe3_85: { generalId: 'bfe3_85', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_216',  defAdvantageSkillId: 'ts_315',  defBalanceSkillId: 'ts_278',  defDisadvantageSkillId: 'ts_998', aptitude: 'create', attackStyle: 'attack' },   // 石琨
    bfe3_87: { generalId: 'bfe3_87', tier: 'ordinary', tacticalSkillId: 'ts_354',  atkAdvantageSkillId: 'ts_354',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_233',  defAdvantageSkillId: 'ts_119',  defBalanceSkillId: 'ts_385',  defDisadvantageSkillId: 'ts_608', aptitude: 'create', attackStyle: 'attack' },   // 慕容评
    bfe3_90: { generalId: 'bfe3_90', tier: 'ordinary', tacticalSkillId: 'ts_570',  atkAdvantageSkillId: 'ts_570',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_736',  defAdvantageSkillId: 'ts_563',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_298', aptitude: 'create', attackStyle: 'attack' },   // 慕容超
    bfe2_zi_chang: { generalId: 'bfe2_zi_chang', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_757',  atkDisadvantageSkillId: 'ts_420',  defAdvantageSkillId: 'ts_983',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_384', aptitude: 'create', attackStyle: 'attack' },   // 子常
    bfe2_gongzi_ang: { generalId: 'bfe2_gongzi_ang', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_403',  atkDisadvantageSkillId: 'ts_985',  defAdvantageSkillId: 'ts_750',  defBalanceSkillId: 'ts_1116',  defDisadvantageSkillId: 'ts_238', aptitude: 'create', attackStyle: 'attack' },   // 公子卬
    bfe_dou_jiande: { generalId: 'bfe_dou_jiande', tier: 'famous', tacticalSkillId: 'ts_558', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_534', aptitude: 'create', attackStyle: 'attack' },   // 窦建德
    bfe_prince_chao: { generalId: 'bfe_prince_chao', tier: 'ordinary', tacticalSkillId: 'ts_591',  atkAdvantageSkillId: 'ts_591',  atkBalanceSkillId: 'ts_1101',  atkDisadvantageSkillId: 'ts_149',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_646', aptitude: 'create', attackStyle: 'attack' },   // 王子朝
    bfe_ma_heluo: { generalId: 'bfe_ma_heluo', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_150',  defAdvantageSkillId: 'ts_673',  defBalanceSkillId: 'ts_024',  defDisadvantageSkillId: 'ts_714', aptitude: 'create', attackStyle: 'attack' },   // 马何罗
    bfe_ren_guang: { generalId: 'bfe_ren_guang', tier: 'ordinary', tacticalSkillId: 'ts_575',  atkAdvantageSkillId: 'ts_575',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_241',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_306', aptitude: 'create', attackStyle: 'attack' },   // 任光
    bfe3_56: { generalId: 'bfe3_56', tier: 'ordinary', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_329',  defAdvantageSkillId: 'ts_341',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_191', aptitude: 'create', attackStyle: 'attack' },   // 王寻
    bfe3_35: { generalId: 'bfe3_35', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_458',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_564',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_342', aptitude: 'create', attackStyle: 'attack' },   // 公孙敖
    bfe3_76: { generalId: 'bfe3_76', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_350',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_767',  defDisadvantageSkillId: 'ts_580', aptitude: 'create', attackStyle: 'attack' },   // 曹爽
    bfe_xu_hai: { generalId: 'bfe_xu_hai', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_1103',  atkDisadvantageSkillId: 'ts_281',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_286',  defDisadvantageSkillId: 'ts_612', aptitude: 'create', attackStyle: 'attack' },   // 徐海
    bfe_zhu_chenhao: { generalId: 'bfe_zhu_chenhao', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_385',  atkDisadvantageSkillId: 'ts_993',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_1104',  defDisadvantageSkillId: 'ts_123', aptitude: 'create', attackStyle: 'attack' },   // 朱宸濠
    bfe_guangde: { generalId: 'bfe_guangde', tier: 'ordinary', tacticalSkillId: 'ts_355',  atkAdvantageSkillId: 'ts_355',  atkBalanceSkillId: 'ts_053',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_190', aptitude: 'create', attackStyle: 'attack' },   // 广德
    bfe3_45: { generalId: 'bfe3_45', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_014',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' },   // 郑吉
    bfe3_50: { generalId: 'bfe3_50', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_810',  defAdvantageSkillId: 'ts_618',  defBalanceSkillId: 'ts_495',  defDisadvantageSkillId: 'ts_338', aptitude: 'create', attackStyle: 'attack' },   // 头兰
    bfe3_2: { generalId: 'bfe3_2', tier: 'ordinary', tacticalSkillId: 'ts_791',  atkAdvantageSkillId: 'ts_791',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_363',  defAdvantageSkillId: 'ts_636',  defBalanceSkillId: 'ts_602',  defDisadvantageSkillId: 'ts_580', aptitude: 'create', attackStyle: 'attack' },   // 芦子霸王
    tujue_wusumishi: { generalId: 'tujue_wusumishi', tier: 'ordinary', tacticalSkillId: 'ts_487',  atkAdvantageSkillId: 'ts_487',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_423', aptitude: 'reverse', attackStyle: 'defense' },   // 乌苏米施：末代可汗被灭，普将
    tubo_xinuoluo: { generalId: 'tubo_xinuoluo', tier: 'famous', tacticalSkillId: 'ts_354',  atkAdvantageSkillId: 'ts_354',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_369',  defAdvantageSkillId: 'ts_695',  defBalanceSkillId: 'ts_458',  defDisadvantageSkillId: 'ts_664', aptitude: 'create', attackStyle: 'attack' },   // 悉诺逻恭禄：吐蕃名将（破唐边城），名将
    tang_limi: { generalId: 'tang_limi', tier: 'ordinary', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_1122',  atkDisadvantageSkillId: 'ts_810',  defAdvantageSkillId: 'ts_421',  defBalanceSkillId: 'ts_366',  defDisadvantageSkillId: 'ts_037', aptitude: 'create', attackStyle: 'attack' },   // 李宓：西洱河覆没，普将
    gen_themistocles: { generalId: 'gen_themistocles', tier: 'famous', tacticalSkillId: 'ts_544', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_678', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_486', defDisadvantageSkillId: 'ts_580', aptitude: 'leverage', attackStyle: 'defense' },
    gen_civilis: { generalId: 'gen_civilis', tier: 'famous', tacticalSkillId: 'ts_528', atkBalanceSkillId: 'ts_1124', atkAdvantageSkillId: 'ts_528', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_698', aptitude: 'leverage', attackStyle: 'attack' },
    gen_clovis_i: { generalId: 'gen_clovis_i', tier: 'famous', tacticalSkillId: 'ts_570', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_constantine_great: { generalId: 'gen_constantine_great', tier: 'famous', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_246', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_708', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dandolo: { generalId: 'gen_dandolo', tier: 'famous', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_734', aptitude: 'leverage', attackStyle: 'attack' },
    gen_daniel_galitsky: { generalId: 'gen_daniel_galitsky', tier: 'ordinary', tacticalSkillId: 'ts_519', defBalanceSkillId: 'ts_1127', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defDisadvantageSkillId: 'ts_807', aptitude: 'leverage', attackStyle: 'attack' },
    gen_daumantas: { generalId: 'gen_daumantas', tier: 'ordinary', tacticalSkillId: 'ts_654', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_182', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },
    gen_villaret: { generalId: 'gen_villaret', tier: 'ordinary', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_854', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dmitry_donskoy: { generalId: 'gen_dmitry_donskoy', tier: 'famous', tacticalSkillId: 'ts_525', atkBalanceSkillId: 'ts_286', atkAdvantageSkillId: 'ts_525', atkDisadvantageSkillId: 'ts_187', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_902', aptitude: 'create', attackStyle: 'attack' },
    eluosi_diguo_peter: { generalId: 'eluosi_diguo_peter', tier: 'famous', tacticalSkillId: 'ts_355', atkBalanceSkillId: 'ts_404', atkAdvantageSkillId: 'ts_355', atkDisadvantageSkillId: 'ts_200', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_988', aptitude: 'create', attackStyle: 'attack' },
    gen_vladimir_andreyevich: { generalId: 'gen_vladimir_andreyevich', tier: 'famous', tacticalSkillId: 'ts_480', atkBalanceSkillId: 'ts_610', atkAdvantageSkillId: 'ts_480', atkDisadvantageSkillId: 'ts_206', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_994', aptitude: 'reverse', attackStyle: 'defense' },
    gen_dmitry_suzdal: { generalId: 'gen_dmitry_suzdal', tier: 'ordinary', tacticalSkillId: 'ts_672', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dragan: { generalId: 'gen_dragan', tier: 'ordinary', tacticalSkillId: 'ts_570', atkBalanceSkillId: 'ts_385', atkAdvantageSkillId: 'ts_570', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_012', aptitude: 'leverage', attackStyle: 'attack' },
    gen_dragut: { generalId: 'gen_dragut', tier: 'famous', tacticalSkillId: 'ts_504', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_782', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_013', aptitude: 'leverage', attackStyle: 'attack' },
    gen_el_cid: { generalId: 'gen_el_cid', tier: 'ordinary', tacticalSkillId: 'ts_570', atkBalanceSkillId: 'ts_405', atkAdvantageSkillId: 'ts_570', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_eleanor: { generalId: 'gen_eleanor', tier: 'ordinary', tacticalSkillId: 'ts_660', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_851', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_epaminondas: { generalId: 'gen_epaminondas', tier: 'famous', tacticalSkillId: 'ts_880', atkBalanceSkillId: 'ts_1119', atkAdvantageSkillId: 'ts_880', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_672', defBalanceSkillId: 'ts_385', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },
    gen_eric_bloodaxe: { generalId: 'gen_eric_bloodaxe', tier: 'ordinary', tacticalSkillId: 'ts_010', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_690', aptitude: 'leverage', attackStyle: 'attack' },
    gen_fernando_iii: { generalId: 'gen_fernando_iii', tier: 'famous', tacticalSkillId: 'ts_279', atkAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_652', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_207', aptitude: 'leverage', attackStyle: 'attack' },
    gen_frederic_ii: { generalId: 'gen_frederic_ii', tier: 'famous', tacticalSkillId: 'ts_031', defBalanceSkillId: 'ts_1112', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_056', defAdvantageSkillId: 'ts_655', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'attack' },
    gen_frederick_i_nuremberg: { generalId: 'gen_frederick_i_nuremberg', tier: 'ordinary', tacticalSkillId: 'ts_032', atkBalanceSkillId: 'ts_458', atkAdvantageSkillId: 'ts_032', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_231', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gastold: { generalId: 'gen_gastold', tier: 'ordinary', tacticalSkillId: 'ts_522', atkBalanceSkillId: 'ts_147', atkAdvantageSkillId: 'ts_522', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_084', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gediminas: { generalId: 'gen_gediminas', tier: 'ordinary', tacticalSkillId: 'ts_082', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_810', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gero_margrave: { generalId: 'gen_gero_margrave', tier: 'ordinary', tacticalSkillId: 'ts_154', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_gilles_de_rais: { generalId: 'gen_gilles_de_rais', tier: 'ordinary', tacticalSkillId: 'ts_033', defBalanceSkillId: 'ts_1128', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_707', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_962', defDisadvantageSkillId: 'ts_234', aptitude: 'leverage', attackStyle: 'attack' },
    gen_kaernute_kotuatousi: { generalId: 'gen_kaernute_kotuatousi', tier: 'ordinary', tacticalSkillId: 'ts_654', defBalanceSkillId: 'ts_1114', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_248', atkDisadvantageSkillId: 'ts_104', defAdvantageSkillId: 'ts_970', defDisadvantageSkillId: 'ts_255', aptitude: 'leverage', attackStyle: 'attack' },
    gen_haci_giray: { generalId: 'gen_haci_giray', tier: 'ordinary', tacticalSkillId: 'ts_158', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_nikola_zrinski: { generalId: 'gen_nikola_zrinski', tier: 'famous', tacticalSkillId: 'ts_525', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_513', aptitude: 'reverse', attackStyle: 'defense' },
    gen_hammad: { generalId: 'gen_hammad', tier: 'ordinary', tacticalSkillId: 'ts_158', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hannibal: { generalId: 'gen_hannibal', tier: 'famous', tacticalSkillId: 'ts_201', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_757', atkDisadvantageSkillId: 'ts_122', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_291', aptitude: 'leverage', attackStyle: 'attack' }, // 坎尼/意大利长期攻守 → 双行
    gen_henry_borwin: { generalId: 'gen_henry_borwin', tier: 'ordinary', tacticalSkillId: 'ts_474', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_294', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ulrich_augsburg: { generalId: 'gen_ulrich_augsburg', tier: 'ordinary', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_760', atkDisadvantageSkillId: 'ts_295', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'defense' },
    gen_henry_navigator: { generalId: 'gen_henry_navigator', tier: 'ordinary', tacticalSkillId: 'ts_282', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_256', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_125', aptitude: 'leverage', attackStyle: 'attack' },
    gen_idris_i: { generalId: 'gen_idris_i', tier: 'ordinary', tacticalSkillId: 'ts_285', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_307', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_james_i_aragon: { generalId: 'gen_james_i_aragon', tier: 'famous', tacticalSkillId: 'ts_289', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_745', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_jan_zizka: { generalId: 'gen_jan_zizka', tier: 'famous', tacticalSkillId: 'ts_308', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'balanced' },
    // ── 2026-08-04 新增：普热梅斯二世 @ 波兹南／大波兰 ──
    gen_przemysl_ii: { generalId: 'gen_przemysl_ii', tier: 'ordinary', tacticalSkillId: 'ts_242', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_julian_apostate: { generalId: 'gen_julian_apostate', tier: 'famous', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_764', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    bosi_puluosi_liukong: { generalId: 'bosi_puluosi_liukong', tier: 'ordinary', tacticalSkillId: 'ts_325', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_323', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_krum: { generalId: 'gen_krum', tier: 'famous', tacticalSkillId: 'ts_474', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_134', aptitude: 'create', attackStyle: 'attack' },
    baojialiya_aseni: { generalId: 'baojialiya_aseni', tier: 'famous', tacticalSkillId: 'ts_668', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_259', aptitude: 'leverage', attackStyle: 'attack' },
    yipilusi_piluoshi: { generalId: 'yipilusi_piluoshi', tier: 'famous', tacticalSkillId: 'ts_004', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_370', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_333', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    gen_leonidas: { generalId: 'gen_leonidas', tier: 'ordinary', tacticalSkillId: 'ts_372', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_144', aptitude: 'reverse', attackStyle: 'defense' }, // 温泉关死守 → 擅守
    gen_lorenzo_medici: { generalId: 'gen_lorenzo_medici', tier: 'ordinary', tacticalSkillId: 'ts_340', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_767', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ludwig_iv: { generalId: 'gen_ludwig_iv', tier: 'ordinary', tacticalSkillId: 'ts_354', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_152', aptitude: 'leverage', attackStyle: 'attack' },
    gen_magas: { generalId: 'gen_magas', tier: 'ordinary', tacticalSkillId: 'ts_372', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_458', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_1119', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_maximilian: { generalId: 'gen_maximilian', tier: 'ordinary', tacticalSkillId: 'ts_362', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1120', defDisadvantageSkillId: 'ts_159', aptitude: 'leverage', attackStyle: 'attack' },
    gen_mikhail_tver: { generalId: 'gen_mikhail_tver', tier: 'ordinary', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_mojmir_i: { generalId: 'gen_mojmir_i', tier: 'ordinary', tacticalSkillId: 'ts_398', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'attack' },
    gen_mstislav: { generalId: 'gen_mstislav', tier: 'ordinary', tacticalSkillId: 'ts_372', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_366', defDisadvantageSkillId: 'ts_383', aptitude: 'leverage', attackStyle: 'attack' },
    gen_muhammad_i: { generalId: 'gen_muhammad_i', tier: 'ordinary', tacticalSkillId: 'ts_372', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_418', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'attack' },
    gen_offa_mercia: { generalId: 'gen_offa_mercia', tier: 'ordinary', tacticalSkillId: 'ts_401', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_286', atkDisadvantageSkillId: 'ts_169', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_1112', defDisadvantageSkillId: 'ts_387', aptitude: 'leverage', attackStyle: 'attack' },
    gen_otto_great: { generalId: 'gen_otto_great', tier: 'famous', tacticalSkillId: 'ts_597', atkAdvantageSkillId: 'ts_597', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_759', aptitude: 'create', attackStyle: 'attack' },
    pelianci_hengli2: { generalId: 'pelianci_hengli2', tier: 'ordinary', tacticalSkillId: 'ts_092', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_181', aptitude: 'leverage', attackStyle: 'defense' },
    gen_prettenberg: { generalId: 'gen_prettenberg', tier: 'ordinary', tacticalSkillId: 'ts_474', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_186', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_409', aptitude: 'leverage', attackStyle: 'attack' },
    gen_raymond_iv: { generalId: 'gen_raymond_iv', tier: 'ordinary', tacticalSkillId: 'ts_480', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：无具名敌帅的战略级胜绩
    gen_raymond_berenguer_iv: { generalId: 'gen_raymond_berenguer_iv', tier: 'ordinary', tacticalSkillId: 'ts_444', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_099', defBalanceSkillId: 'ts_1116', defDisadvantageSkillId: 'ts_294', aptitude: 'create', attackStyle: 'balanced' },   // 贝朗热，普罗旺斯伯爵，普将
    gen_raymond_v: { generalId: 'gen_raymond_v', tier: 'ordinary', tacticalSkillId: 'ts_005', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_737', atkDisadvantageSkillId: 'ts_192', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_1101', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage', attackStyle: 'attack' },
    gen_roger_i: { generalId: 'gen_roger_i', tier: 'famous', tacticalSkillId: 'ts_511', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_romshlav: { generalId: 'gen_romshlav', tier: 'ordinary', tacticalSkillId: 'ts_504', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_sergey_belgorod: { generalId: 'gen_sergey_belgorod', tier: 'ordinary', tacticalSkillId: 'ts_511', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_458', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },
    // ── 2026-08-04 新增：多涅茨 @ 哈尔科夫／斯洛博达 ──
    gen_grigory_donets: { generalId: 'gen_grigory_donets', tier: 'ordinary', tacticalSkillId: 'ts_525', atkAdvantageSkillId: 'ts_525', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_193', aptitude: 'leverage', attackStyle: 'attack' },
    // ── 2026-08-04 新增：萨布罗夫 @ 沃罗涅日／野地 ──
    gen_semyon_saburov: { generalId: 'gen_semyon_saburov', tier: 'ordinary', tacticalSkillId: 'ts_519', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_458', atkDisadvantageSkillId: 'ts_417', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_688', aptitude: 'leverage', attackStyle: 'attack' },
    eguo_zasekin: { generalId: 'eguo_zasekin', tier: 'ordinary', tacticalSkillId: 'ts_011', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_214', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_413', aptitude: 'leverage', attackStyle: 'attack' },
    porbazhyn_mouyu: { generalId: 'porbazhyn_mouyu', tier: 'famous', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_244', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_738', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_738', defAdvantageSkillId: 'ts_619', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_237', aptitude: 'create', attackStyle: 'attack' },
    don_vorontsov: { generalId: 'don_vorontsov', tier: 'ordinary', tacticalSkillId: 'ts_025', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_529', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_1123', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage', attackStyle: 'defense' },
    nogai_votkhovsky: { generalId: 'nogai_votkhovsky', tier: 'ordinary', tacticalSkillId: 'ts_031', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_356', atkDisadvantageSkillId: 'ts_217', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_428', aptitude: 'leverage', attackStyle: 'defense' },
    bashkir_nagoy: { generalId: 'bashkir_nagoy', tier: 'ordinary', tacticalSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_262', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_435', aptitude: 'leverage', attackStyle: 'defense' },
    gen_mikhail_tatarinov: { generalId: 'gen_mikhail_tatarinov', tier: 'ordinary', tacticalSkillId: 'ts_660', defBalanceSkillId: 'ts_631', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_816', defDisadvantageSkillId: 'ts_440', aptitude: 'create', attackStyle: 'attack' },
    gen_simeon_great: { generalId: 'gen_simeon_great', tier: 'famous', tacticalSkillId: 'ts_474', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_450', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_224', aptitude: 'create', attackStyle: 'attack' },
    gen_stefan_dusan: { generalId: 'gen_stefan_dusan', tier: 'famous', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_686', defDisadvantageSkillId: 'ts_225', aptitude: 'leverage', attackStyle: 'attack' },
    gen_stephen_great: { generalId: 'gen_stephen_great', tier: 'famous', tacticalSkillId: 'ts_474', atkAdvantageSkillId: 'ts_474', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_417', aptitude: 'create', attackStyle: 'attack' },
    gen_stortebeker: { generalId: 'gen_stortebeker', tier: 'ordinary', tacticalSkillId: 'ts_624', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_swatopluk: { generalId: 'gen_swatopluk', tier: 'famous', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1118', atkDisadvantageSkillId: 'ts_411', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    gen_tashfin: { generalId: 'gen_tashfin', tier: 'famous', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_413', aptitude: 'leverage', attackStyle: 'attack' },
    talike_talike: { generalId: 'talike_talike', tier: 'famous', tacticalSkillId: 'ts_528', atkBalanceSkillId: 'ts_707', atkAdvantageSkillId: 'ts_528', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1111', defDisadvantageSkillId: 'ts_226', aptitude: 'leverage', attackStyle: 'attack' }, // 塔里克：711征服伊比利亚 → 擅攻
    gen_tassilo_iii: { generalId: 'gen_tassilo_iii', tier: 'ordinary', tacticalSkillId: 'ts_672', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_769', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_cangrande: { generalId: 'gen_cangrande', tier: 'ordinary', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1119', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_016', aptitude: 'leverage', attackStyle: 'attack' },
    gen_theodoric_great: { generalId: 'gen_theodoric_great', tier: 'famous', tacticalSkillId: 'ts_399', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_767', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'attack' },
    donggete_berig: { generalId: 'donggete_berig', tier: 'ordinary', tacticalSkillId: 'ts_528', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_464', aptitude: 'create', attackStyle: 'balanced' },
    gen_tvrtko: { generalId: 'gen_tvrtko', tier: 'ordinary', tacticalSkillId: 'ts_654', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_360', atkDisadvantageSkillId: 'ts_470', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_048', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ugolino: { generalId: 'gen_ugolino', tier: 'ordinary', tacticalSkillId: 'ts_010', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_775', atkDisadvantageSkillId: 'ts_711', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_228', aptitude: 'leverage', attackStyle: 'attack' },
    gen_ulrich_jungingen: { generalId: 'gen_ulrich_jungingen', tier: 'ordinary', tacticalSkillId: 'ts_082', atkAdvantageSkillId: 'ts_082', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_1115', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_uqba: { generalId: 'gen_uqba', tier: 'famous', tacticalSkillId: 'ts_154', atkAdvantageSkillId: 'ts_154', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_1121', defDisadvantageSkillId: 'ts_230', aptitude: 'create', attackStyle: 'attack' },
    gen_william_wallace: { generalId: 'gen_william_wallace', tier: 'famous', tacticalSkillId: 'ts_033', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_689', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_1122', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'defense' },
    scotland_johngraham: { generalId: 'scotland_johngraham', tier: 'ordinary', tacticalSkillId: 'ts_158', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_705', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_201', defBalanceSkillId: 'ts_433', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：基利克兰基 2400 对 2000，高地一隅小胜
    scotland_hughmackay: { generalId: 'scotland_hughmackay', tier: 'ordinary', tacticalSkillId: 'ts_031', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_368', atkDisadvantageSkillId: 'ts_482', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_739', defDisadvantageSkillId: 'ts_484', aptitude: 'reverse', attackStyle: 'defense' },
    gen_vlad_impaler: { generalId: 'gen_vlad_impaler', tier: 'famous', tacticalSkillId: 'ts_770', atkAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_377', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vladimir_monomakh: { generalId: 'gen_vladimir_monomakh', tier: 'famous', tacticalSkillId: 'ts_032', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },
    gen_vyacheslav_tartu: { generalId: 'gen_vyacheslav_tartu', tier: 'ordinary', tacticalSkillId: 'ts_201', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_689', aptitude: 'leverage', attackStyle: 'attack' },
    kaleiliya_kelimu: { generalId: 'kaleiliya_kelimu', tier: 'ordinary', tacticalSkillId: 'ts_033', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_711', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vyshnevetsky: { generalId: 'gen_vyshnevetsky', tier: 'ordinary', tacticalSkillId: 'ts_660', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_712', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_286', defDisadvantageSkillId: 'ts_505', aptitude: 'leverage', attackStyle: 'attack' },
    gen_vytautas_great: { generalId: 'gen_vytautas_great', tier: 'famous', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_236', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_759', aptitude: 'create', attackStyle: 'attack' },
    gen_wifred_hairy: { generalId: 'gen_wifred_hairy', tier: 'ordinary', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_286', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_1125', defDisadvantageSkillId: 'ts_810', aptitude: 'leverage', attackStyle: 'attack' },
    gen_willem_juliette: { generalId: 'gen_willem_juliette', tier: 'ordinary', tacticalSkillId: 'ts_282', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_1117', atkDisadvantageSkillId: 'ts_243', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    gen_william_silent: { generalId: 'gen_william_silent', tier: 'ordinary', tacticalSkillId: 'ts_285', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_385', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_178', defBalanceSkillId: 'ts_1102', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yaghmurasen: { generalId: 'gen_yaghmurasen', tier: 'ordinary', tacticalSkillId: 'ts_289', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_405', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yaroslav: { generalId: 'gen_yaroslav', tier: 'famous', tacticalSkillId: 'ts_308', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_278', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_508', aptitude: 'create', attackStyle: 'attack' },
    gen_mehmed_giray: { generalId: 'gen_mehmed_giray', tier: 'famous', tacticalSkillId: 'ts_319', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_1131', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_1118', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },
    gen_yuri_ryazan: { generalId: 'gen_yuri_ryazan', tier: 'ordinary', tacticalSkillId: 'ts_242', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_249', aptitude: 'leverage', attackStyle: 'attack' },
    gen_zhytomyr: { generalId: 'gen_zhytomyr', tier: 'ordinary', tacticalSkillId: 'ts_322', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_218', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    gen_aspurgus: { generalId: 'gen_aspurgus', tier: 'ordinary', tacticalSkillId: 'ts_325', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_366', atkDisadvantageSkillId: 'ts_384', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_416', aptitude: 'leverage', attackStyle: 'attack' },
    gen_basarab_i: { generalId: 'gen_basarab_i', tier: 'famous', tacticalSkillId: 'ts_340', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_513', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' },
    gen_koshamain: { generalId: 'gen_koshamain', tier: 'ordinary', tacticalSkillId: 'ts_402', atkAdvantageSkillId: 'ts_402', defAdvantageSkillId: 'ts_655', atkBalanceSkillId: 'ts_1119', defBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_409', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'attack' },
    gen_julius_caesar: { generalId: 'gen_julius_caesar', tier: 'famous', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_001', defAdvantageSkillId: 'ts_071', atkBalanceSkillId: 'ts_404', defBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_1131', defDisadvantageSkillId: 'ts_533', aptitude: 'create', attackStyle: 'balanced' }, // 高卢征伐 + 阿莱西亚守 → 双行
    gen_batu: { generalId: 'gen_batu', tier: 'famous', tacticalSkillId: 'ts_115', atkAdvantageSkillId: 'ts_115', defAdvantageSkillId: 'ts_232', atkBalanceSkillId: 'ts_405', defBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_313', defDisadvantageSkillId: 'ts_680', aptitude: 'create', attackStyle: 'attack' },
    gen_ulugh_muhammad: { generalId: 'gen_ulugh_muhammad', tier: 'ordinary', tacticalSkillId: 'ts_158', atkAdvantageSkillId: 'ts_158', defAdvantageSkillId: 'ts_077', atkBalanceSkillId: 'ts_278', defBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_254', defDisadvantageSkillId: 'ts_580', aptitude: 'leverage', attackStyle: 'attack' },
    gen_basil_ii: { generalId: 'gen_basil_ii', tier: 'famous', tacticalSkillId: 'ts_044', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_769', atkDisadvantageSkillId: 'ts_513', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1110', defDisadvantageSkillId: 'ts_712', aptitude: 'create', attackStyle: 'attack' },
    gen_astrakhan_khan: { generalId: 'gen_astrakhan_khan', tier: 'ordinary', tacticalSkillId: 'ts_201', atkAdvantageSkillId: 'ts_201', defAdvantageSkillId: 'ts_655', atkBalanceSkillId: 'ts_506', defBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_1131', defDisadvantageSkillId: 'ts_428', aptitude: 'leverage', attackStyle: 'attack' },
    gen_onas_khan: { generalId: 'gen_onas_khan', tier: 'ordinary', tacticalSkillId: 'ts_354', atkAdvantageSkillId: 'ts_354', defAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_300', defBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_263', defDisadvantageSkillId: 'ts_738', aptitude: 'leverage', attackStyle: 'attack' },
    gen_karasakal: { generalId: 'gen_karasakal', tier: 'ordinary', tacticalSkillId: 'ts_208', atkAdvantageSkillId: 'ts_208', defAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_366', defBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_738', defDisadvantageSkillId: 'ts_266', aptitude: 'leverage', attackStyle: 'attack' },
    shaiyue_aerpade: { generalId: 'shaiyue_aerpade', tier: 'ordinary', tacticalSkillId: 'ts_242', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_1113', defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'attack' },
    xiongyati_yannuoshi: { generalId: 'xiongyati_yannuoshi', tier: 'famous', tacticalSkillId: 'ts_282', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_408', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_1114', defDisadvantageSkillId: 'ts_415', aptitude: 'leverage', attackStyle: 'attack' },
    mazhaer_majiashi: { generalId: 'mazhaer_majiashi', tier: 'famous', tacticalSkillId: 'ts_054', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_433', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_268', aptitude: 'leverage', attackStyle: 'attack' },
    // [2026-08-24 新增美洲/非洲/马来/印度 10 武将]
    gen_cuauhtemoc: { generalId: 'gen_cuauhtemoc', tier: 'ordinary', tacticalSkillId: 'ts_028', advantageSkillId: 'ts_028', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_413', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse', attackStyle: 'defense' },
    gen_pachacuti: { generalId: 'gen_pachacuti', tier: 'famous', tacticalSkillId: 'ts_028', advantageSkillId: 'ts_028', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_413', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_413', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_017', aptitude: 'reverse', attackStyle: 'balanced' },
    xibanya_pisaluo: { generalId: 'xibanya_pisaluo', tier: 'famous', tacticalSkillId: 'ts_301', advantageSkillId: 'ts_301', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_565', atkAdvantageSkillId: 'ts_301', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_565', defAdvantageSkillId: 'ts_059', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_271', aptitude: 'reverse', attackStyle: 'attack' },
    xibanya_aerwa: { generalId: 'xibanya_aerwa', tier: 'famous', tacticalSkillId: 'ts_060', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_486', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_201', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_580', aptitude: 'leverage', attackStyle: 'balanced' },
    wende_johnfriedrich: { generalId: 'wende_johnfriedrich', tier: 'ordinary', tacticalSkillId: 'ts_066', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_581', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_585', aptitude: 'reverse', attackStyle: 'defense' },
    wende_hengist: { generalId: 'wende_hengist', tier: 'ordinary', tacticalSkillId: 'ts_074', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_406', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_592', aptitude: 'create', attackStyle: 'attack' },
    wende_heinrich_loewe: { generalId: 'wende_heinrich_loewe', tier: 'ordinary', tacticalSkillId: 'ts_078', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_441', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_930', defDisadvantageSkillId: 'ts_606', aptitude: 'create', attackStyle: 'balanced' },
    gen_jasawchan: { generalId: 'gen_jasawchan', tier: 'ordinary', tacticalSkillId: 'ts_304', advantageSkillId: 'ts_304', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_272', aptitude: 'create', attackStyle: 'attack' },
    gen_lautaro: { generalId: 'gen_lautaro', tier: 'famous', tacticalSkillId: 'ts_311', advantageSkillId: 'ts_311', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_274', aptitude: 'reverse', attackStyle: 'attack' },
    gen_saguamanchica: { generalId: 'gen_saguamanchica', tier: 'ordinary', tacticalSkillId: 'ts_312', advantageSkillId: 'ts_312', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_277', aptitude: 'leverage', attackStyle: 'attack' },
    gen_arariboia: { generalId: 'gen_arariboia', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_374', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_374', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_287', aptitude: 'leverage', attackStyle: 'attack' },
    gen_sundjata: { generalId: 'gen_sundjata', tier: 'famous', tacticalSkillId: 'ts_426', advantageSkillId: 'ts_426', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_637', atkAdvantageSkillId: 'ts_426', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_637', defAdvantageSkillId: 'ts_083', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_292', aptitude: 'create', attackStyle: 'attack' },
    manding_musa: { generalId: 'manding_musa', tier: 'ordinary', tacticalSkillId: 'ts_086',  atkAdvantageSkillId: 'ts_086',  atkBalanceSkillId: 'ts_380',  atkDisadvantageSkillId: 'ts_018',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_689', aptitude: 'reverse', attackStyle: 'defense' },   // 穆萨：普将（廷巴克图太守，守土无胜绩）
    arakan_mingbin: { generalId: 'arakan_mingbin', tier: 'famous', tacticalSkillId: 'ts_679', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_578', aptitude: 'reverse', attackStyle: 'defense' },   // 明彬：名将（1535/1547 妙乌守城得胜）
    dusong_zhangru: { generalId: 'dusong_zhangru', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_1123',  atkDisadvantageSkillId: 'ts_430',  defAdvantageSkillId: 'ts_780',  defBalanceSkillId: 'ts_288',  defDisadvantageSkillId: 'ts_711', aptitude: 'reverse', attackStyle: 'defense' },   // 张濡：普将（守独松关被执）
    xianxia_zhengcai: { generalId: 'xianxia_zhengcai', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_1124',  atkDisadvantageSkillId: 'ts_984',  defAdvantageSkillId: 'ts_442',  defBalanceSkillId: 'ts_438',  defDisadvantageSkillId: 'ts_302', aptitude: 'reverse', attackStyle: 'defense' },   // 郑彩：普将（守仙霞关）
    tianjing_wangliang: { generalId: 'tianjing_wangliang', tier: 'ordinary', tacticalSkillId: 'ts_117',  atkAdvantageSkillId: 'ts_117',  atkBalanceSkillId: 'ts_286',  atkDisadvantageSkillId: 'ts_674',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_314', aptitude: 'create', attackStyle: 'defense' },   // 王梁：普将（守天井关）
    zijing_hanqing: { generalId: 'zijing_hanqing', tier: 'ordinary', tacticalSkillId: 'ts_694',  atkAdvantageSkillId: 'ts_694',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_437',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_286',  defDisadvantageSkillId: 'ts_691', aptitude: 'reverse', attackStyle: 'defense' },   // 韩青：普将（紫荆关殉国）
    ningwu_zhouyuji: { generalId: 'ningwu_zhouyuji', tier: 'ordinary', tacticalSkillId: 'ts_201',  atkAdvantageSkillId: 'ts_201',  atkBalanceSkillId: 'ts_1125',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_760',  defDisadvantageSkillId: 'ts_143', aptitude: 'reverse', attackStyle: 'defense' },   // 周遇吉：普将（宁武关殉国）
    tang_guoyuanzhen: { generalId: 'tang_guoyuanzhen', tier: 'ordinary', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_414', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1117', defDisadvantageSkillId: 'ts_297', aptitude: 'create', attackStyle: 'attack' },   // 郭元振：名将（700 赤亭大破吐蕃）
    putaoya_afonso: { generalId: 'putaoya_afonso', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_218',  defAdvantageSkillId: 'ts_496',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_758', aptitude: 'create', attackStyle: 'defense' },   // 阿方索：普将（布拉干萨世袭驻守）
    montereau_pressy: { generalId: 'montereau_pressy', tier: 'ordinary', tacticalSkillId: 'ts_480',  atkAdvantageSkillId: 'ts_480',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_069',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_300',  defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'defense' },   // 普雷西：普将（蒙特罗驻防）
    guyan_jiaolian: { generalId: 'guyan_jiaolian', tier: 'ordinary', tacticalSkillId: 'ts_831',  atkAdvantageSkillId: 'ts_831',  atkBalanceSkillId: 'ts_707',  atkDisadvantageSkillId: 'ts_756',  defAdvantageSkillId: 'ts_983',  defBalanceSkillId: 'ts_1106',  defDisadvantageSkillId: 'ts_331', aptitude: 'reverse', attackStyle: 'defense' },   // 焦琏：普将（守古严关）
    yumen_suoban: { generalId: 'yumen_suoban', tier: 'ordinary', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_386',  defAdvantageSkillId: 'ts_783',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_384', aptitude: 'create', attackStyle: 'defense' },   // 索班：普将（出玉门关镇伊吾）
    yangguan_lixi: { generalId: 'yangguan_lixi', tier: 'ordinary', tacticalSkillId: 'ts_082',  atkAdvantageSkillId: 'ts_082',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_1131',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_366',  defDisadvantageSkillId: 'ts_725', aptitude: 'create', attackStyle: 'defense' },   // 李息：普将（筑阳关、屯守丝路南道）
    wusheng_dongxian: { generalId: 'wusheng_dongxian', tier: 'ordinary', tacticalSkillId: 'ts_528',  atkAdvantageSkillId: 'ts_528',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_515',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_427', aptitude: 'create', attackStyle: 'defense' },   // 董先：普将（屯守义阳三关）
    gen_ezana: { generalId: 'gen_ezana', tier: 'ordinary', tacticalSkillId: 'ts_536', advantageSkillId: 'ts_536', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_688', atkAdvantageSkillId: 'ts_536', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_016', aptitude: 'create', attackStyle: 'attack' },
    zhagewei_gebulei: { generalId: 'zhagewei_gebulei', tier: 'ordinary', tacticalSkillId: 'ts_135', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_409', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_317', aptitude: 'leverage', attackStyle: 'attack' },
    adal_ghazi: { generalId: 'adal_ghazi', tier: 'famous', tacticalSkillId: 'ts_539', advantageSkillId: 'ts_539', balanceSkillId: 'ts_1120', disadvantageSkillId: 'ts_810', atkAdvantageSkillId: 'ts_539', atkBalanceSkillId: 'ts_1120', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_654', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_273', aptitude: 'reverse', attackStyle: 'attack' },
    gen_parameswara: { generalId: 'gen_parameswara', tier: 'ordinary', tacticalSkillId: 'ts_553', advantageSkillId: 'ts_553', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_580', atkAdvantageSkillId: 'ts_553', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_580', defAdvantageSkillId: 'ts_138', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_017', aptitude: 'leverage', attackStyle: 'defense' },
    sanfoqi_dapunta: { generalId: 'sanfoqi_dapunta', tier: 'ordinary', tacticalSkillId: 'ts_563', advantageSkillId: 'ts_563', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_650', atkAdvantageSkillId: 'ts_563', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_650', defAdvantageSkillId: 'ts_158', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_320', aptitude: 'create', attackStyle: 'attack' },
    gen_panangkaran: { generalId: 'gen_panangkaran', tier: 'ordinary', tacticalSkillId: 'ts_618', advantageSkillId: 'ts_618', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_667', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_183', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_321', aptitude: 'leverage', attackStyle: 'defense' },
    ternate_babula: { generalId: 'ternate_babula', tier: 'ordinary', tacticalSkillId: 'ts_636', advantageSkillId: 'ts_636', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_671', atkAdvantageSkillId: 'ts_636', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_671', defAdvantageSkillId: 'ts_184', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_334', aptitude: 'reverse', attackStyle: 'balanced' },
    sulu_paduka: { generalId: 'sulu_paduka', tier: 'ordinary', tacticalSkillId: 'ts_669', advantageSkillId: 'ts_669', balanceSkillId: 'ts_1121', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_669', atkBalanceSkillId: 'ts_1121', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_185', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_337', aptitude: 'reverse', attackStyle: 'defense' },
    xishudongyin_lijiasipi: { generalId: 'xishudongyin_lijiasipi', tier: 'famous', tacticalSkillId: 'ts_673', advantageSkillId: 'ts_673', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_688', atkAdvantageSkillId: 'ts_673', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_688', defAdvantageSkillId: 'ts_201', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_345', aptitude: 'create', attackStyle: 'attack' },
    gen_mihirabhoja: { generalId: 'gen_mihirabhoja', tier: 'ordinary', tacticalSkillId: 'ts_695', advantageSkillId: 'ts_695', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_690', atkAdvantageSkillId: 'ts_695', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_690', defAdvantageSkillId: 'ts_208', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_351', aptitude: 'create', attackStyle: 'attack' },
    suomunate_kumalapala: { generalId: 'suomunate_kumalapala', tier: 'ordinary', tacticalSkillId: 'ts_750', atkAdvantageSkillId: 'ts_750', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_210', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_359', aptitude: 'leverage', attackStyle: 'attack' },
    sengjialuo_dutugamo: { generalId: 'sengjialuo_dutugamo', tier: 'famous', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_782', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_697', atkAdvantageSkillId: 'ts_782', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_697', defAdvantageSkillId: 'ts_213', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_373', aptitude: 'create', attackStyle: 'attack' },
    puxiangyindu_albukeerke: { generalId: 'puxiangyindu_albukeerke', tier: 'famous', tacticalSkillId: 'ts_851', advantageSkillId: 'ts_851', balanceSkillId: 'ts_1130', disadvantageSkillId: 'ts_720', atkAdvantageSkillId: 'ts_851', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_720', defAdvantageSkillId: 'ts_223', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_415', aptitude: 'create', attackStyle: 'attack' },
    xiyindu_batuoluome: { generalId: 'xiyindu_batuoluome', tier: 'ordinary', tacticalSkillId: 'ts_880', advantageSkillId: 'ts_880', balanceSkillId: 'ts_1122', disadvantageSkillId: 'ts_726', atkAdvantageSkillId: 'ts_880', atkBalanceSkillId: 'ts_1122', atkDisadvantageSkillId: 'ts_726', defAdvantageSkillId: 'ts_235', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'defense' },
    jialebi_brasilesuo: { generalId: 'jialebi_brasilesuo', tier: 'famous', tacticalSkillId: 'ts_962', advantageSkillId: 'ts_962', balanceSkillId: 'ts_1123', disadvantageSkillId: 'ts_729', atkAdvantageSkillId: 'ts_962', atkBalanceSkillId: 'ts_1123', atkDisadvantageSkillId: 'ts_729', defAdvantageSkillId: 'ts_282', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'defense' },
    gen_tibirica: { generalId: 'gen_tibirica', tier: 'ordinary', tacticalSkillId: 'ts_970', advantageSkillId: 'ts_970', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_730', atkAdvantageSkillId: 'ts_970', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_730', defAdvantageSkillId: 'ts_285', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_418', aptitude: 'leverage', attackStyle: 'defense' },
    gen_chicomacatl: { generalId: 'gen_chicomacatl', tier: 'ordinary', tacticalSkillId: 'ts_980', advantageSkillId: 'ts_980', balanceSkillId: 'ts_1126', disadvantageSkillId: 'ts_733', atkAdvantageSkillId: 'ts_980', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_733', defAdvantageSkillId: 'ts_289', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_422', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hatuey: { generalId: 'gen_hatuey', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_747', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_747', defAdvantageSkillId: 'ts_308', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_429', aptitude: 'reverse', attackStyle: 'attack' },
    gen_bentejui: { generalId: 'gen_bentejui', tier: 'ordinary', tacticalSkillId: 'ts_028', advantageSkillId: 'ts_028', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_759', atkAdvantageSkillId: 'ts_028', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_759', defAdvantageSkillId: 'ts_319', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_431', aptitude: 'reverse', attackStyle: 'defense' },
    gen_hurao: { generalId: 'gen_hurao', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_088', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_762', atkAdvantageSkillId: 'ts_088', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_322', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_451', aptitude: 'reverse', attackStyle: 'attack' },
    gen_noli: { generalId: 'gen_noli', tier: 'ordinary', tacticalSkillId: 'ts_089', advantageSkillId: 'ts_089', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_089', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_325', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_457', aptitude: 'create', attackStyle: 'defense' },
    pandiya_jiatawaerman: { generalId: 'pandiya_jiatawaerman', tier: 'ordinary', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_092', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_335', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_459', aptitude: 'create', attackStyle: 'attack' },
    gen_tome_sousa: { generalId: 'gen_tome_sousa', tier: 'ordinary', tacticalSkillId: 'ts_094', advantageSkillId: 'ts_094', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_094', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_343', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_463', aptitude: 'leverage', attackStyle: 'defense' },
    gen_cortes: { generalId: 'gen_cortes', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    zhamolin_trimumpala: { generalId: 'zhamolin_trimumpala', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    putaoya_suosa: { generalId: 'putaoya_suosa', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    putaoya_almeida: { generalId: 'putaoya_almeida', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    voc_coen: { generalId: 'voc_coen', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    mowoer_mukelabuhan: { generalId: 'mowoer_mukelabuhan', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    yinggelan_dai: { generalId: 'yinggelan_dai', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    yinggelan_angjier: { generalId: 'yinggelan_angjier', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    yinggelan_chanuoke: { generalId: 'yinggelan_chanuoke', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    gaolu_dipaerkai: { generalId: 'gaolu_dipaerkai', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    wandan_ageng: { generalId: 'wandan_ageng', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    voc_speult: { generalId: 'voc_speult', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    yinggelan_delake: { generalId: 'yinggelan_delake', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_099', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_099', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_479', aptitude: 'create', attackStyle: 'attack' },
    // 🔴 [2026-11-04] xinxibanya_laijiasipi 已删除（同人并入 xishudongyin_lijiasipi，名将档案见该 id）
    gen_velazquez: { generalId: 'gen_velazquez', tier: 'ordinary', tacticalSkillId: 'ts_112', advantageSkillId: 'ts_112', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_810', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_810', defAdvantageSkillId: 'ts_365', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_483', aptitude: 'leverage', attackStyle: 'defense' },
    gen_martim_afonso: { generalId: 'gen_martim_afonso', tier: 'ordinary', tacticalSkillId: 'ts_121', advantageSkillId: 'ts_121', balanceSkillId: 'ts_397', disadvantageSkillId: 'ts_830', atkAdvantageSkillId: 'ts_121', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_830', defAdvantageSkillId: 'ts_371', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_492', aptitude: 'leverage', attackStyle: 'defense' },
    gen_morosini: { generalId: 'gen_morosini', tier: 'ordinary', tacticalSkillId: 'ts_133', advantageSkillId: 'ts_133', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_840', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_840', defAdvantageSkillId: 'ts_372', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_493', aptitude: 'leverage', attackStyle: 'defense' },
    gen_caffa_consul: { generalId: 'gen_caffa_consul', tier: 'ordinary', tacticalSkillId: 'ts_162', advantageSkillId: 'ts_162', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_853', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_853', defAdvantageSkillId: 'ts_399', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_498', aptitude: 'leverage', attackStyle: 'defense' },
    gen_nur_ad_din: { generalId: 'gen_nur_ad_din', tier: 'ordinary', tacticalSkillId: 'ts_175', advantageSkillId: 'ts_175', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_912', atkAdvantageSkillId: 'ts_175', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_912', defAdvantageSkillId: 'ts_401', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_512', aptitude: 'leverage', attackStyle: 'defense' },
    gen_abgar: { generalId: 'gen_abgar', tier: 'ordinary', tacticalSkillId: 'ts_178', advantageSkillId: 'ts_178', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_931', atkAdvantageSkillId: 'ts_178', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_931', defAdvantageSkillId: 'ts_402', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_514', aptitude: 'create', attackStyle: 'defense' },
    gen_bonifatius: { generalId: 'gen_bonifatius', tier: 'ordinary', tacticalSkillId: 'ts_195', advantageSkillId: 'ts_195', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_941', atkAdvantageSkillId: 'ts_195', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_941', defAdvantageSkillId: 'ts_443', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_518', aptitude: 'leverage', attackStyle: 'defense' },
    gen_cipriano_figueiredo: { generalId: 'gen_cipriano_figueiredo', tier: 'ordinary', tacticalSkillId: 'ts_221', advantageSkillId: 'ts_221', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_961', atkAdvantageSkillId: 'ts_221', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_961', defAdvantageSkillId: 'ts_444', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_534', aptitude: 'reverse', attackStyle: 'defense' },
    liaozu_saitatila: { generalId: 'liaozu_saitatila', tier: 'ordinary', tacticalSkillId: 'ts_232', advantageSkillId: 'ts_232', balanceSkillId: 'ts_1130', disadvantageSkillId: 'ts_981', atkAdvantageSkillId: 'ts_232', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_981', defAdvantageSkillId: 'ts_787', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_612', aptitude: 'leverage', attackStyle: 'defense' },
    kushi_amanilunnasi: { generalId: 'kushi_amanilunnasi', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_244', balanceSkillId: 'ts_1126', disadvantageSkillId: 'ts_991', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_1126', atkDisadvantageSkillId: 'ts_991', defAdvantageSkillId: 'ts_445', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_543', aptitude: 'leverage', attackStyle: 'defense' },
    aimala_katali: { generalId: 'aimala_katali', tier: 'ordinary', tacticalSkillId: 'ts_257', advantageSkillId: 'ts_257', balanceSkillId: 'ts_1124', disadvantageSkillId: 'ts_995', atkAdvantageSkillId: 'ts_257', atkBalanceSkillId: 'ts_1124', atkDisadvantageSkillId: 'ts_995', defAdvantageSkillId: 'ts_446', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_064', aptitude: 'leverage', attackStyle: 'defense' },
    aolisha_anatabamo: { generalId: 'aolisha_anatabamo', tier: 'ordinary', tacticalSkillId: 'ts_284', advantageSkillId: 'ts_284', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_999', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_999', defAdvantageSkillId: 'ts_476', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_128', aptitude: 'leverage', attackStyle: 'defense' },
    kanata_lamalaya: { generalId: 'kanata_lamalaya', tier: 'ordinary', tacticalSkillId: 'ts_301', advantageSkillId: 'ts_301', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_006', atkAdvantageSkillId: 'ts_301', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_006', defAdvantageSkillId: 'ts_481', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_548', aptitude: 'leverage', attackStyle: 'defense' },
    adile_adilesha: { generalId: 'adile_adilesha', tier: 'ordinary', tacticalSkillId: 'ts_304', advantageSkillId: 'ts_304', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_511', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_259', aptitude: 'leverage', attackStyle: 'defense' },
    foluolida_meinendeshi: { generalId: 'foluolida_meinendeshi', tier: 'famous', tacticalSkillId: 'ts_311', advantageSkillId: 'ts_311', balanceSkillId: 'ts_1127', disadvantageSkillId: 'ts_023', atkAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_1127', atkDisadvantageSkillId: 'ts_023', defAdvantageSkillId: 'ts_519', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_573', aptitude: 'leverage', attackStyle: 'defense' },
    fujisi_fujiweng: { generalId: 'fujisi_fujiweng', tier: 'ordinary', tacticalSkillId: 'ts_312', advantageSkillId: 'ts_312', balanceSkillId: 'ts_1125', disadvantageSkillId: 'ts_027', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_1125', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_528', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_582', aptitude: 'leverage', attackStyle: 'defense' },
    yilisi_yifeituosi: { generalId: 'yilisi_yifeituosi', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_374', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_058', atkAdvantageSkillId: 'ts_374', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_058', defAdvantageSkillId: 'ts_544', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_586', aptitude: 'leverage', attackStyle: 'defense' },
    nuowei_halaer: { generalId: 'nuowei_halaer', tier: 'ordinary', tacticalSkillId: 'ts_426', advantageSkillId: 'ts_426', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_067', atkAdvantageSkillId: 'ts_426', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_067', defAdvantageSkillId: 'ts_554', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_595', aptitude: 'leverage', attackStyle: 'defense' },
    keernuwaye_geladelong: { generalId: 'keernuwaye_geladelong', tier: 'ordinary', tacticalSkillId: 'ts_442', advantageSkillId: 'ts_442', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_076', atkAdvantageSkillId: 'ts_442', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_076', defAdvantageSkillId: 'ts_570', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_607', aptitude: 'leverage', attackStyle: 'defense' },
    disidelusi_disidelusi: { generalId: 'disidelusi_disidelusi', tier: 'ordinary', tacticalSkillId: 'ts_496', advantageSkillId: 'ts_496', balanceSkillId: 'ts_1128', disadvantageSkillId: 'ts_079', atkAdvantageSkillId: 'ts_496', atkBalanceSkillId: 'ts_1128', atkDisadvantageSkillId: 'ts_079', defAdvantageSkillId: 'ts_629', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_623', aptitude: 'leverage', attackStyle: 'defense' },
    wuer_wuernamu: { generalId: 'wuer_wuernamu', tier: 'ordinary', tacticalSkillId: 'ts_515', advantageSkillId: 'ts_515', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_100', atkAdvantageSkillId: 'ts_515', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_100', defAdvantageSkillId: 'ts_648', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_645', aptitude: 'leverage', attackStyle: 'defense' },
    mengtainiya_radu_iii: { generalId: 'mengtainiya_radu_iii', tier: 'ordinary', tacticalSkillId: 'ts_536', advantageSkillId: 'ts_536', balanceSkillId: 'ts_1129', disadvantageSkillId: 'ts_108', atkAdvantageSkillId: 'ts_536', atkBalanceSkillId: 'ts_1129', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_652', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_646', aptitude: 'leverage', attackStyle: 'defense' },
    varendra_devapala: { generalId: 'varendra_devapala', tier: 'famous', tacticalSkillId: 'ts_539', atkAdvantageSkillId: 'ts_539', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_116', defAdvantageSkillId: 'ts_654', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_651', aptitude: 'create', attackStyle: 'balanced' },
    chatigangren_wumeide: { generalId: 'chatigangren_wumeide', tier: 'ordinary', tacticalSkillId: 'ts_553', atkAdvantageSkillId: 'ts_553', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_123', defAdvantageSkillId: 'ts_656', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_662', aptitude: 'create', attackStyle: 'balanced' },
    duonaobaojia_tzimiskes: { generalId: 'duonaobaojia_tzimiskes', tier: 'famous', tacticalSkillId: 'ts_563', atkAdvantageSkillId: 'ts_563', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_131', defAdvantageSkillId: 'ts_668', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_664', aptitude: 'create', attackStyle: 'attack' },
    lumiliya_lalashahin: { generalId: 'lumiliya_lalashahin', tier: 'famous', tacticalSkillId: 'ts_618', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_692', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_678', aptitude: 'create', attackStyle: 'attack' },
    // [2026-09-11] 卡洛扬（加里波利·鲁西翁）——**名将**：本人实际指挥打赢够格战役（1206 鲁西翁之战歼灭拉丁帝国野战军）。
    // 只写基础字段，**不补六槽 atk*/def* 字段**：该六槽已废弃（不再驱动选技，见 AGENTS「铁律一」），
    // 且「武将技数据修改铁律」禁止 AI 靠启发式批量归位六槽。与帕曼纽、阿尔西提斯的档案写法一致。
    // aptitude/attackStyle 为史实判断（卡洛扬为主动进攻的征服者）→ AI 自定，主人可改。
    jialiboli_kaluoyang: { generalId: 'jialiboli_kaluoyang', tier: 'famous', tacticalSkillId: 'ts_480',  atkAdvantageSkillId: 'ts_480',  atkBalanceSkillId: 'ts_767',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_1132', aptitude: 'create', attackStyle: 'attack' },
    yilaka_tundama: { generalId: 'yilaka_tundama', tier: 'ordinary', tacticalSkillId: 'ts_636', atkAdvantageSkillId: 'ts_636', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_146', defAdvantageSkillId: 'ts_749', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_684', aptitude: 'reverse', attackStyle: 'defense' },
    xingelana_dawila: { generalId: 'xingelana_dawila', tier: 'ordinary', tacticalSkillId: 'ts_669', advantageSkillId: 'ts_669', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_149', atkAdvantageSkillId: 'ts_669', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_149', defAdvantageSkillId: 'ts_785', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_698', aptitude: 'reverse', attackStyle: 'balanced' },
    gualani_nicolas: { generalId: 'gualani_nicolas', tier: 'ordinary', tacticalSkillId: 'ts_673', atkAdvantageSkillId: 'ts_673', atkBalanceSkillId: 'ts_1130', atkDisadvantageSkillId: 'ts_150', defAdvantageSkillId: 'ts_792', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_701', aptitude: 'reverse', attackStyle: 'defense' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：姆博罗雷敌将 bfe_portuguese_officer 无名，闸④不合格
    xiadunhe_sviatoslav: { generalId: 'xiadunhe_sviatoslav', tier: 'famous', tacticalSkillId: 'ts_695', atkAdvantageSkillId: 'ts_695', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_153', defAdvantageSkillId: 'ts_806', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_706', aptitude: 'create', attackStyle: 'attack' },
    abasi_mansuer: { generalId: 'abasi_mansuer', tier: 'famous', tacticalSkillId: 'ts_003', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_075', defAdvantageSkillId: 'ts_766', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    muwaxide_yakubu: { generalId: 'muwaxide_yakubu', tier: 'famous', tacticalSkillId: 'ts_780', atkAdvantageSkillId: 'ts_780', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_691', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_708', aptitude: 'create', attackStyle: 'attack' },
    xisi_safaer: { generalId: 'xisi_safaer', tier: 'famous', tacticalSkillId: 'ts_003', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_045', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_738', aptitude: 'create', attackStyle: 'attack' },
    gen_bolusi: { generalId: 'gen_bolusi', tier: 'ordinary', tacticalSkillId: 'ts_748', advantageSkillId: 'ts_748', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_180', atkAdvantageSkillId: 'ts_748', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_180', defAdvantageSkillId: 'ts_654', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_712', aptitude: 'reverse', attackStyle: 'defense' }, // 补噜·波鲁斯：希达斯皮斯河以象军抗击亚历山大，劣势坚守,
    xiaofulijiya_aerxitis: { generalId: 'xiaofulijiya_aerxitis', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_007',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_361', aptitude: 'leverage', attackStyle: 'attack' },
    // 推罗·阿泽米尔库斯：普将（史实为死守岛城的末代国王）· 逆势（劣势守城）· 善防
    kanan_azemier: { generalId: 'kanan_azemier', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_704',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    // 加沙·巴提斯：普将（史实为死守沙丘要塞的波斯任命总督）· 逆势 · 善防
    feilisidin_batisi: { generalId: 'feilisidin_batisi', tier: 'ordinary', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_769',  atkDisadvantageSkillId: 'ts_098',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_046',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    // 伊奥尼亚·米利都守将赫格西斯特：普将（史载其为波斯驻米利都守军统领，据内城依墙死守，城破后余部退守小岛）· 逆势 · 善防
    yiaoniya_hegesistratus: { generalId: 'yiaoniya_hegesistratus', tier: 'ordinary', tacticalSkillId: 'ts_354',  atkAdvantageSkillId: 'ts_354',  atkBalanceSkillId: 'ts_045',  atkDisadvantageSkillId: 'ts_795',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    // 波斯门·阿里奥巴赞斯：普将（史实为波西斯行省总督，死守扎格罗斯山险隘至全员战死）· 逆势 · 善防
    aqimeinide_aertabazanuosi: { generalId: 'aqimeinide_aertabazanuosi', tier: 'ordinary', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_380',  atkDisadvantageSkillId: 'ts_273',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_1107',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    // 锡尔河·萨特拉克斯：普将（史实为锡尔河战役对阵亚历山大的斯基泰骑兵领袖）· 借势（轻骑骑射）· 善攻
    sijitai_satraces: { generalId: 'sijitai_satraces', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_486',  atkDisadvantageSkillId: 'ts_361',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_397',  defDisadvantageSkillId: 'ts_098', aptitude: 'leverage', attackStyle: 'attack' },
    // 索格底亚那岩山·奥克夏特斯：普将（史实为索格底亚那大贵族，凭险扼守岩山后归降）· 逆势 · 善防
    sogdian_aokexiate: { generalId: 'sogdian_aokexiate', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_458',  atkDisadvantageSkillId: 'ts_294',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_527', aptitude: 'reverse', attackStyle: 'defense' },
    // 马萨加·克莱奥菲斯：普将（史实为阿斯瓦卡首领之母，统领全城死守险要要塞力战后归降）· 逆势 · 善防
    aswaka_cleophis: { generalId: 'aswaka_cleophis', tier: 'ordinary', tacticalSkillId: 'ts_355',  atkAdvantageSkillId: 'ts_355',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_197',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' },
    // 奥诺斯岩·阿夫里凯斯：普将（史实为阿萨卡诺斯王弟Aphrikes，据崖顶以滚石死守）· 逆势 · 善防
    aornos_aphrikes: { generalId: 'aornos_aphrikes', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_294',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_406',  defDisadvantageSkillId: 'ts_275', aptitude: 'reverse', attackStyle: 'defense' },
    // 居鲁士城·卡塔涅斯：普将（史实为粟特北方边塞守军统帅Catanes，凭坚城死守）· 逆势 · 善防
    julushi_catanes: { generalId: 'julushi_catanes', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_475',  atkDisadvantageSkillId: 'ts_733',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_397',  defDisadvantageSkillId: 'ts_549', aptitude: 'reverse', attackStyle: 'defense' },
    // 马里斯·摩罗波罗：普将（史实为马利/摩罗婆守军主帅Malavapala，死守砖石卫城堡垒浴血力战）· 逆势 · 善防
    malli_malavapala: { generalId: 'malli_malavapala', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_361',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_760',  defDisadvantageSkillId: 'ts_145', aptitude: 'reverse', attackStyle: 'defense' },
    // 科塞亚·卡什提利亚什：普将（史实为扎格罗斯山地部落加喜特领袖Kashtiliash，依崇山峻岭绝壁险堡设伏力战）· 逆势 · 善防
    kesaiya_kashtiliash: { generalId: 'kesaiya_kashtiliash', tier: 'ordinary', tacticalSkillId: 'ts_766',  atkAdvantageSkillId: 'ts_766',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_098',  defAdvantageSkillId: 'ts_001',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_218', aptitude: 'reverse', attackStyle: 'defense' },
    // 🔴 [2026-09-19 主人令「一个战场一个防守方的武将一个势力一个精锐」] 乌克西亚·马达泰斯 的档案。
    //    普将（史实：扎格罗斯山乌克西亚部落联盟首领，向来往军队索取买路钱，据隘口设伏；
    //    公元前331年亚历山大应约纳贡而暗中分兵，袭其村落、夺其隘口，他退往高地遭合围）· 逆势 · 善防
    halikanasu_memnon: { generalId: 'halikanasu_memnon', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_428',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_475',  defDisadvantageSkillId: 'ts_267', aptitude: 'leverage', attackStyle: 'defense' }, // 罗得岛门农，波斯麾下希腊雇佣军名将：格拉尼库斯前献坚壁清野之策、公元前334年任小亚细亚总指挥守哈利卡纳苏斯、公元前333年转攻爱琴海连下基俄斯与莱斯博斯 → 名将
    wukexiya_madates: { generalId: 'wukexiya_madates', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_500',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_303', aptitude: 'reverse', attackStyle: 'defense' },
    // 🔴 [2026-09-25] 巴尔干战役（前335）三位守帅。三闸定名将：三人皆无史载胜绩 → 普将
    // 达萨雷提·克莱图斯：普将（史实：伊利里亚王，据佩利昂要塞与陶兰提王格劳基亚斯合兵，一度迫退亚历山大，终被夜袭击溃，焚城而逃）· 逆势 · 善防
    dasaleiti_kleitos: { generalId: 'dasaleiti_kleitos', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_014',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_769',  defDisadvantageSkillId: 'ts_580', aptitude: 'reverse', attackStyle: 'defense' },
    hesitiya_yiasong: { generalId: 'hesitiya_yiasong', tier: 'famous', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_690',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_332', aptitude: 'create', attackStyle: 'attack' },
    hekaniya_artabazos: { generalId: 'hekaniya_artabazos', tier: 'famous', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_404',  atkDisadvantageSkillId: 'ts_690',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_397',  defDisadvantageSkillId: 'ts_350', aptitude: 'reverse', attackStyle: 'defense' },
    // 底比斯·菲尼克斯：普将（史实：底比斯起兵反马其顿的守城主将，拒降死战，城破身死）· 逆势 · 善防
    dibisi_phoinix: { generalId: 'dibisi_phoinix', tier: 'ordinary', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_278',  defDisadvantageSkillId: 'ts_358', aptitude: 'reverse', attackStyle: 'defense' },
    jite_shouling: { generalId: 'jite_shouling', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_218',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_388', aptitude: 'reverse', attackStyle: 'defense' },
    // 索格狄亚那岩·阿里马泽斯：普将（史实为岩堡守将，凭绝壁自恃不可攻）· 借势 · 善守
    suogediyana_arimazes: { generalId: 'suogediyana_arimazes', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_1109',  atkDisadvantageSkillId: 'ts_409',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_530', aptitude: 'reverse', attackStyle: 'defense' },
    // 普拉塔纳斯·莱奥斯塞尼斯：普将（史实为雅典名将、拉米亚战争希腊反马其顿联军统帅）· 创势 · 善攻
    xila_leosthenes: { generalId: 'xila_leosthenes', tier: 'ordinary', tacticalSkillId: 'ts_480',  atkAdvantageSkillId: 'ts_480',  atkBalanceSkillId: 'ts_686',  atkDisadvantageSkillId: 'ts_425',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'attack' },
    // 普拉塔纳斯·安提帕特：普将（史实为马其顿摄政、欧洲最高统帅，兵败后坚守拉米亚城）· 逆势 · 善防
    maqidun_antipater: { generalId: 'maqidun_antipater', tier: 'ordinary', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_1117',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_769',  defDisadvantageSkillId: 'ts_434', aptitude: 'reverse', attackStyle: 'defense' },
    // 克兰农·安提菲洛斯：普将（史实为接任阵亡莱奥斯塞尼斯之希腊同盟军总司令，步兵溃退后撤离）· 逆势 · 善防
    xila_antiphilus: { generalId: 'xila_antiphilus', tier: 'ordinary', tacticalSkillId: 'ts_400',  atkAdvantageSkillId: 'ts_400',  atkBalanceSkillId: 'ts_1110',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_736', aptitude: 'reverse', attackStyle: 'defense' },
    // 🔴 [2026-09-19 主人令「都给我删了」] 欧迈尼斯（gen_eumenes）的档案已删除 ——
    //    他名下的那一仗（前321赫勒斯滂战役）与势力 `kapaduoxiya` 均已删除，档案成了孤儿。
    // 赫勒斯滂·克拉特罗斯：名将（史实为亚历山大麾下第一名将，赫勒斯滂战役中战马受创坠马阵亡）· 逆势 · 善防
    maqidun_craterus: { generalId: 'maqidun_craterus', tier: 'famous', tacticalSkillId: 'ts_077',  atkAdvantageSkillId: 'ts_077',  atkBalanceSkillId: 'ts_403',  atkDisadvantageSkillId: 'ts_449',  defAdvantageSkillId: 'ts_001',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_711', aptitude: 'reverse', attackStyle: 'defense' },
    gen_boleslaw_brave: { generalId: 'gen_boleslaw_brave', tier: 'famous', tacticalSkillId: 'ts_525',  atkAdvantageSkillId: 'ts_525',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_414',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_742', aptitude: 'create', attackStyle: 'attack' },
    gen_topa_inca: { generalId: 'gen_topa_inca', tier: 'famous', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_218',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_098', aptitude: 'create', attackStyle: 'attack' },
    gen_bir_hambir: { generalId: 'gen_bir_hambir', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_1118',  atkDisadvantageSkillId: 'ts_361',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_634',  defDisadvantageSkillId: 'ts_452', aptitude: 'leverage', attackStyle: 'defense' },
    gen_ivan_sratsimir: { generalId: 'gen_ivan_sratsimir', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_1111',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_461', aptitude: 'reverse', attackStyle: 'defense' },
    gen_fasilides: { generalId: 'gen_fasilides', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_466',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_218', aptitude: 'leverage', attackStyle: 'defense' },
    gen_francis_i: { generalId: 'gen_francis_i', tier: 'famous', tacticalSkillId: 'ts_504',  atkAdvantageSkillId: 'ts_504',  atkBalanceSkillId: 'ts_286',  atkDisadvantageSkillId: 'ts_098',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_1112',  defDisadvantageSkillId: 'ts_513', aptitude: 'create', attackStyle: 'attack' },
    gen_sargis_jaqeli: { generalId: 'gen_sargis_jaqeli', tier: 'ordinary', tacticalSkillId: 'ts_242',  atkAdvantageSkillId: 'ts_242',  atkBalanceSkillId: 'ts_707',  atkDisadvantageSkillId: 'ts_688',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_1113',  defDisadvantageSkillId: 'ts_098', aptitude: 'reverse', attackStyle: 'defense' },
    gen_man_singh_tomar: { generalId: 'gen_man_singh_tomar', tier: 'ordinary', tacticalSkillId: 'ts_071',  atkAdvantageSkillId: 'ts_071',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_018',  defAdvantageSkillId: 'ts_185',  defBalanceSkillId: 'ts_486',  defDisadvantageSkillId: 'ts_412', aptitude: 'leverage', attackStyle: 'defense' },
    gen_ibrahim_qutb: { generalId: 'gen_ibrahim_qutb', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_409',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_469', aptitude: 'leverage', attackStyle: 'defense' },
    gen_adityawarman: { generalId: 'gen_adityawarman', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_045',  atkDisadvantageSkillId: 'ts_689',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_118', aptitude: 'leverage', attackStyle: 'attack' },
    gen_chan_chak: { generalId: 'gen_chan_chak', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_572',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_733', aptitude: 'leverage', attackStyle: 'defense' },
    gen_joao_i: { generalId: 'gen_joao_i', tier: 'famous', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_366',  atkDisadvantageSkillId: 'ts_690',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_046',  defDisadvantageSkillId: 'ts_143', aptitude: 'reverse', attackStyle: 'defense' },
    gen_ferdinand_ii: { generalId: 'gen_ferdinand_ii', tier: 'famous', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_278',  atkDisadvantageSkillId: 'ts_414',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_098', aptitude: 'create', attackStyle: 'attack' },
    gen_seuthes_iii: { generalId: 'gen_seuthes_iii', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_037', aptitude: 'leverage', attackStyle: 'defense' },
    gen_chabrias: { generalId: 'gen_chabrias', tier: 'famous', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_758',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'defense' },
    tuomengde_aobulaien: { generalId: 'tuomengde_aobulaien', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_294',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_018', aptitude: 'create', attackStyle: 'attack' },
    bolan_suobiesiji: { generalId: 'bolan_suobiesiji', tier: 'famous', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_072',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_428', aptitude: 'leverage', attackStyle: 'attack' },
    gen_hiawatha: { generalId: 'gen_hiawatha', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_294',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_641', aptitude: 'leverage', attackStyle: 'defense' }, // 易洛魁联盟缔造者·和平缔造，无史载胜绩 → 普将
    gen_minchancaman: { generalId: 'gen_minchancaman', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_416',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_733', aptitude: 'reverse', attackStyle: 'defense' }, // 奇穆皇帝，被印加征服 → 普将
    gen_tzitzipandaquare: { generalId: 'gen_tzitzipandaquare', tier: 'ordinary', tacticalSkillId: 'ts_077',  atkAdvantageSkillId: 'ts_077',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_478',  defAdvantageSkillId: 'ts_308',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_384', aptitude: 'reverse', attackStyle: 'defense' }, // 塔拉斯科王，1470年代劣势击退阿兹特克入侵 → 普将
    gen_cuchacique: { generalId: 'gen_cuchacique', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_275',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_733', aptitude: 'reverse', attackStyle: 'defense' }, // 泰罗纳酋长，抗西班牙殖民 → 普将
    gen_casimiro_bigua: { generalId: 'gen_casimiro_bigua', tier: 'ordinary', tacticalSkillId: 'ts_322',  atkAdvantageSkillId: 'ts_322',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_416',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_759', aptitude: 'reverse', attackStyle: 'defense' }, // 特维尔切酋长 → 普将
    gen_stuyvesant: { generalId: 'gen_stuyvesant', tier: 'ordinary', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_403',  atkDisadvantageSkillId: 'ts_759',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_584', aptitude: 'reverse', attackStyle: 'defense' }, // 新尼德兰末代总督，1664守城降英 → 普将
    gen_champlain: { generalId: 'gen_champlain', tier: 'ordinary', tacticalSkillId: 'ts_525',  atkAdvantageSkillId: 'ts_525',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_413',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' }, // 新法兰西创始人，亲率攻易洛魁（小规模）→ 普将
    gen_urdaneta: { generalId: 'gen_urdaneta', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_719', aptitude: 'leverage', attackStyle: 'defense' }, // 航海家，发现马尼拉大帆船回航航线 → 普将
    gen_jadwiga: { generalId: 'gen_jadwiga', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_043',  atkDisadvantageSkillId: 'ts_759',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_1116',  defDisadvantageSkillId: 'ts_205', aptitude: 'create', attackStyle: 'attack' }, // 波兰女王，1387亲征收复红鲁塞尼亚 → 普将
    gen_gajah_mada: { generalId: 'gen_gajah_mada', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_299',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_688', aptitude: 'leverage', attackStyle: 'attack' }, // 满者伯夷宰相·帕拉帕誓言，非战场统帅 → 普将
    gen_sumanguru: { generalId: 'gen_sumanguru', tier: 'ordinary', tacticalSkillId: 'ts_001',  atkAdvantageSkillId: 'ts_001',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_521',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_294', aptitude: 'reverse', attackStyle: 'defense' }, // 索索王，灭加纳后基里纳败于松迪亚塔 → 普将
    ghana_tongka_manin: { generalId: 'ghana_tongka_manin', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_501',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_768',  defDisadvantageSkillId: 'ts_759', aptitude: 'reverse', attackStyle: 'defense' }, // 加纳帝国末代有载君主，抗阿尔摩拉维德、无决定性胜绩 → 普将
    gen_bohemond: { generalId: 'gen_bohemond', tier: 'famous', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_769',  atkDisadvantageSkillId: 'ts_014',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_691', aptitude: 'create', attackStyle: 'attack' }, // 安条克公国首任君主，1098首占安条克 → 名将
    gen_joanofarc: { generalId: 'gen_joanofarc', tier: 'famous', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_691',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_332', aptitude: 'create', attackStyle: 'attack' }, // 奥尔良解围·兰斯加冕 → 名将
    gen_edward_longshanks: { generalId: 'gen_edward_longshanks', tier: 'famous', tacticalSkillId: 'ts_672',  atkAdvantageSkillId: 'ts_672',  atkBalanceSkillId: 'ts_757',  atkDisadvantageSkillId: 'ts_034',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_730', aptitude: 'create', attackStyle: 'attack' }, // 征服威尔士·苏格兰之锤 → 名将
    gen_robert_guiscard: { generalId: 'gen_robert_guiscard', tier: 'famous', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_733',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_072', aptitude: 'create', attackStyle: 'attack' }, // 诺曼南意大利征服 → 名将
    gen_yodit: { generalId: 'gen_yodit', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_736',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_406',  defDisadvantageSkillId: 'ts_411', aptitude: 'reverse', attackStyle: 'attack' }, // 半传说女王·摧毁阿克苏姆 → 普将
    gen_osman_i: { generalId: 'gen_osman_i', tier: 'ordinary', tacticalSkillId: 'ts_001',  atkAdvantageSkillId: 'ts_001',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_332', aptitude: 'create', attackStyle: 'attack' }, // 奥斯曼开国·加齐圣战 → 名将
    gen_brasidas: { generalId: 'gen_brasidas', tier: 'famous', tacticalSkillId: 'ts_528',  atkAdvantageSkillId: 'ts_528',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_197',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_810', aptitude: 'create', attackStyle: 'attack' }, // 安菲波利斯之战歼灭雅典军而阵亡 → 名将
    gen_lysander: { generalId: 'gen_lysander', tier: 'famous', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_768',  defDisadvantageSkillId: 'ts_521', aptitude: 'create', attackStyle: 'attack' }, // 羊河海战全歼雅典舰队 → 名将
    gen_parmenion: { generalId: 'gen_parmenion', tier: 'famous', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_521', aptitude: 'leverage', attackStyle: 'attack' }, // 亚历山大副帅，三大会战统左翼 → 名将
    gen_perdiccas: { generalId: 'gen_perdiccas', tier: 'ordinary', tacticalSkillId: 'ts_672',  atkAdvantageSkillId: 'ts_672',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_016',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_412', aptitude: 'create', attackStyle: 'attack' }, // 帝国摄政，征埃及兵败被弑 → 普将
    gen_artemisia: { generalId: 'gen_artemisia', tier: 'ordinary', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_1119',  atkDisadvantageSkillId: 'ts_034',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_484', aptitude: 'leverage', attackStyle: 'defense' }, // 卡里亚女王，萨拉米斯助波斯无胜绩 → 普将
    gen_artaphernes: { generalId: 'gen_artaphernes', tier: 'famous', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_204',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_513', aptitude: 'reverse', attackStyle: 'attack' }, // 吕底亚总督，以弗所会战全歼雅典远征军 → 名将
    gen_datis: { generalId: 'gen_datis', tier: 'famous', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_1101',  atkDisadvantageSkillId: 'ts_294',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_048', aptitude: 'create', attackStyle: 'attack' }, // 米底贵族，连克纳克索斯/埃雷特里亚/卡里斯托斯，马拉松失利 → 名将
    gen_cleitus: { generalId: 'gen_cleitus', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_1120',  atkDisadvantageSkillId: 'ts_653',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_414', aptitude: 'create', attackStyle: 'attack' }, // 近卫骑兵团长，格拉尼库斯救主、高加米拉楔形突击，无独立统帅 → 普将
    gen_aristides: { generalId: 'gen_aristides', tier: 'famous', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_408',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_1132', aptitude: 'leverage', attackStyle: 'defense' }, // 普拉提亚统雅典军、普赛塔利亚歼波斯精锐、主持提洛同盟贡赋 → 名将
    gen_philip_ii: { generalId: 'gen_philip_ii', tier: 'famous', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_1121',  atkDisadvantageSkillId: 'ts_523',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_580', aptitude: 'create', attackStyle: 'attack' }, // 马其顿方阵缔造者，喀罗尼亚大捷统一希腊 → 名将
    gen_carpini: { generalId: 'gen_carpini', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_098',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_406',  defDisadvantageSkillId: 'ts_711', aptitude: 'leverage', attackStyle: 'defense' }, // 方济各使节·安提瓦里大主教，非战将 → 普将
    zhuluo_lajialajia: { generalId: 'zhuluo_lajialajia', tier: 'famous', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_730',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_526', aptitude: 'create', attackStyle: 'attack' }, // 朱罗海权开创者，建布里哈迪希瓦拉神庙、跨海征服锡兰 → 名将
    gen_kestutis: { generalId: 'gen_kestutis', tier: 'famous', tacticalSkillId: 'ts_660',  atkAdvantageSkillId: 'ts_660',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_415',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_475',  defDisadvantageSkillId: 'ts_691', aptitude: 'leverage', attackStyle: 'defense' }, // 立陶宛大公，数十年抵御条顿骑士团 → 名将
    gen_ivaylo: { generalId: 'gen_ivaylo', tier: 'famous', tacticalSkillId: 'ts_077',  atkAdvantageSkillId: 'ts_077',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_299',  defAdvantageSkillId: 'ts_185',  defBalanceSkillId: 'ts_757',  defDisadvantageSkillId: 'ts_006', aptitude: 'create', attackStyle: 'attack' }, // 猪倌起义沙皇，连破金帐汗国与拜占庭 → 名将
    gen_kuchlug: { generalId: 'gen_kuchlug', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_530',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_690', aptitude: 'leverage', attackStyle: 'attack' }, // 乃蛮末代王子，篡西辽被蒙古擒杀，无胜绩 → 普将
    gen_kotyan: { generalId: 'gen_kotyan', tier: 'ordinary', tacticalSkillId: 'ts_816',  atkAdvantageSkillId: 'ts_816',  atkBalanceSkillId: 'ts_768',  atkDisadvantageSkillId: 'ts_167',  defAdvantageSkillId: 'ts_082',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_690', aptitude: 'leverage', attackStyle: 'defense' }, // 库曼大汗，卡尔卡会战败、奔匈牙利被杀 → 普将
    gen_girgen: { generalId: 'gen_girgen', tier: 'ordinary', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_631',  atkDisadvantageSkillId: 'ts_742',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_1102',  defDisadvantageSkillId: 'ts_361', aptitude: 'reverse', attackStyle: 'defense' }, // 西库曼酋长，喀尔巴阡抗蒙古 → 普将
    gen_qutlugh: { generalId: 'gen_qutlugh', tier: 'ordinary', tacticalSkillId: 'ts_032',  atkAdvantageSkillId: 'ts_032',  atkBalanceSkillId: 'ts_1103',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_641', aptitude: 'leverage', attackStyle: 'defense' }, // 巴布尔之母，坐镇筹粮守城，非统帅 → 普将
    gen_pacanchiq: { generalId: 'gen_pacanchiq', tier: 'ordinary', tacticalSkillId: 'ts_660',  atkAdvantageSkillId: 'ts_660',  atkBalanceSkillId: 'ts_634',  atkDisadvantageSkillId: 'ts_320',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_414', aptitude: 'leverage', attackStyle: 'attack' }, // 穆伊斯卡酋长，无够格胜绩 → 普将
    gen_cunhambebe: { generalId: 'gen_cunhambebe', tier: 'ordinary', tacticalSkillId: 'ts_242',  atkAdvantageSkillId: 'ts_242',  atkBalanceSkillId: 'ts_1104',  atkDisadvantageSkillId: 'ts_143',  defAdvantageSkillId: 'ts_750',  defBalanceSkillId: 'ts_300',  defDisadvantageSkillId: 'ts_730', aptitude: 'reverse', attackStyle: 'defense' }, // 塔莫约酋长，抗葡萄牙殖民 → 普将
    gen_galvarino: { generalId: 'gen_galvarino', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_404',  defDisadvantageSkillId: 'ts_538', aptitude: 'reverse', attackStyle: 'attack' }, // 断臂复仇马普切战士，米利亚拉普埃战死 → 普将
    gen_guacolda: { generalId: 'gen_guacolda', tier: 'ordinary', tacticalSkillId: 'ts_511',  atkAdvantageSkillId: 'ts_511',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_384',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_760',  defDisadvantageSkillId: 'ts_145', aptitude: 'leverage', attackStyle: 'attack' }, // 传奇战巫女，随劳塔罗北伐战死 → 普将
    gen_john_fearless: { generalId: 'gen_john_fearless', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_409',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_300',  defDisadvantageSkillId: 'ts_526', aptitude: 'create', attackStyle: 'attack' }, // 勃艮第公爵，阿马尼亚克内战、1419被刺 → 普将
    gen_bernard_armagnac: { generalId: 'gen_bernard_armagnac', tier: 'ordinary', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_118',  defAdvantageSkillId: 'ts_766',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_691', aptitude: 'leverage', attackStyle: 'attack' }, // 阿马尼亚克伯爵，百年战争党争领袖 → 普将
    gen_gilbert: { generalId: 'gen_gilbert', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_109',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_414', aptitude: 'leverage', attackStyle: 'attack' }, // 格洛斯特伯爵，威尔士边境贵族 → 普将
    gen_alaric: { generalId: 'gen_alaric', tier: 'famous', tacticalSkillId: 'ts_242',  atkAdvantageSkillId: 'ts_242',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_018',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_689', aptitude: 'create', attackStyle: 'attack' }, // 西哥特首王，410陷罗马 → 名将
    gen_ataulf: { generalId: 'gen_ataulf', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_769',  defDisadvantageSkillId: 'ts_069', aptitude: 'leverage', attackStyle: 'attack' }, // 西哥特王，娶罗马公主建高卢共治 → 普将
    gen_philip_good: { generalId: 'gen_philip_good', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_475',  atkDisadvantageSkillId: 'ts_143',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_046',  defDisadvantageSkillId: 'ts_691', aptitude: 'leverage', attackStyle: 'attack' }, // 勃艮第公爵，建金羊毛骑士团 → 普将
    gen_dafydd: { generalId: 'gen_dafydd', tier: 'ordinary', tacticalSkillId: 'ts_474',  atkAdvantageSkillId: 'ts_474',  atkBalanceSkillId: 'ts_475',  atkDisadvantageSkillId: 'ts_795',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_688', aptitude: 'reverse', attackStyle: 'defense' }, // 末代威尔士亲王，1282抗英被擒 → 普将
    gen_llywelyn: { generalId: 'gen_llywelyn', tier: 'ordinary', tacticalSkillId: 'ts_340',  atkAdvantageSkillId: 'ts_340',  atkBalanceSkillId: 'ts_760',  atkDisadvantageSkillId: 'ts_542',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_690', aptitude: 'reverse', attackStyle: 'defense' }, // 威尔士亲王，1282欧温桥阵亡 → 普将
    gen_dinhle: { generalId: 'gen_dinhle', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_475',  atkDisadvantageSkillId: 'ts_587',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' }, // 丁朝太子·南越王，坐镇驩州抗林邑 → 普将
    gen_gidajan: { generalId: 'gen_gidajan', tier: 'ordinary', tacticalSkillId: 'ts_504',  atkAdvantageSkillId: 'ts_504',  atkBalanceSkillId: 'ts_043',  atkDisadvantageSkillId: 'ts_414',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_416', aptitude: 'reverse', attackStyle: 'defense' }, // 阿克苏姆末代皇储，崖堡避难抗尤迪特 → 普将
    gen_thoros: { generalId: 'gen_thoros', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_572',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_413', aptitude: 'create', attackStyle: 'attack' }, // 奇里乞亚复国英雄，屡破拜占庭军 → 名将　🔴[2026-11-01 主人令·四闸复核] 名将→普将：马米斯特拉 7500 对 12000，奇里乞亚一隅且为败方
    gen_dagnajan: { generalId: 'gen_dagnajan', tier: 'ordinary', tacticalSkillId: 'ts_389',  atkAdvantageSkillId: 'ts_389',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_182',  defAdvantageSkillId: 'ts_082',  defBalanceSkillId: 'ts_278',  defDisadvantageSkillId: 'ts_417', aptitude: 'leverage', attackStyle: 'attack' }, // 阿克苏姆末代帝王，象军南征经略肖阿 → 普将
    gen_maha_thiha_thura: { generalId: 'gen_maha_thiha_thura', tier: 'famous', tacticalSkillId: 'ts_285',  atkAdvantageSkillId: 'ts_285',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_560',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_411', aptitude: 'create', attackStyle: 'attack' }, // 缅将，1767经三塔关灭阿瑜陀耶 → 名将
    gen_sang_nila_utama: { generalId: 'gen_sang_nila_utama', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_1105',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_760',  defDisadvantageSkillId: 'ts_712', aptitude: 'leverage', attackStyle: 'defense' }, // 新加坡拉开国君主，半传说无胜绩 → 普将
    gen_rajaram: { generalId: 'gen_rajaram', tier: 'ordinary', tacticalSkillId: 'ts_660',  atkAdvantageSkillId: 'ts_660',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_688',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_486',  defDisadvantageSkillId: 'ts_617', aptitude: 'reverse', attackStyle: 'defense' }, // 马拉塔王，金奇抗莫卧儿九年围城 → 普将,
    yisatisi_falukezhade: { generalId: 'yisatisi_falukezhade', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_780',  defBalanceSkillId: 'ts_043',  defDisadvantageSkillId: 'ts_197', aptitude: 'leverage', attackStyle: 'defense' },
    jiaye_punafamo: { generalId: 'jiaye_punafamo', tier: 'ordinary', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_578',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_412', aptitude: 'leverage', attackStyle: 'defense' },
    dian_cuanchongdao: { generalId: 'dian_cuanchongdao', tier: 'ordinary', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_1106',  atkDisadvantageSkillId: 'ts_409',  defAdvantageSkillId: 'ts_517',  defBalanceSkillId: 'ts_764',  defDisadvantageSkillId: 'ts_560', aptitude: 'create', attackStyle: 'attack' },
    panfeiliya_apollonios: { generalId: 'panfeiliya_apollonios', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_433',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_046',  defDisadvantageSkillId: 'ts_712', aptitude: 'reverse', attackStyle: 'defense' },
    baihaliye_djedkhonsu: { generalId: 'baihaliye_djedkhonsu', tier: 'ordinary', tacticalSkillId: 'ts_480',  atkAdvantageSkillId: 'ts_480',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_411',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_775',  defDisadvantageSkillId: 'ts_526', aptitude: 'reverse', attackStyle: 'defense' },
    kuida_chakar: { generalId: 'kuida_chakar', tier: 'ordinary', tacticalSkillId: 'ts_029',  atkAdvantageSkillId: 'ts_029',  atkBalanceSkillId: 'ts_1107',  atkDisadvantageSkillId: 'ts_430',  defAdvantageSkillId: 'ts_672',  defBalanceSkillId: 'ts_634',  defDisadvantageSkillId: 'ts_691', aptitude: 'reverse', attackStyle: 'defense' },
    zhalange_barsaentes: { generalId: 'zhalange_barsaentes', tier: 'ordinary', tacticalSkillId: 'ts_400',  atkAdvantageSkillId: 'ts_400',  atkBalanceSkillId: 'ts_486',  atkDisadvantageSkillId: 'ts_415',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_411', aptitude: 'reverse', attackStyle: 'defense' },
    shiyuzu_aolaqiuzhang: { generalId: 'shiyuzu_aolaqiuzhang', tier: 'ordinary', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_628',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_405',  defDisadvantageSkillId: 'ts_414', aptitude: 'reverse', attackStyle: 'defense' },
    maikelan_punong: { generalId: 'maikelan_punong', tier: 'ordinary', tacticalSkillId: 'ts_001',  atkAdvantageSkillId: 'ts_001',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_738',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_617', aptitude: 'reverse', attackStyle: 'defense' },
    muertan_naxierding: { generalId: 'muertan_naxierding', tier: 'famous', tacticalSkillId: 'ts_504',  atkAdvantageSkillId: 'ts_504',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_513',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_366',  defDisadvantageSkillId: 'ts_718', aptitude: 'leverage', attackStyle: 'defense' },
    muxikani_muxikanuosi: { generalId: 'muxikani_muxikanuosi', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_187',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_299', aptitude: 'leverage', attackStyle: 'balanced' },
    xindu_bahelamuhan: { generalId: 'xindu_bahelamuhan', tier: 'famous', tacticalSkillId: 'ts_308',  atkAdvantageSkillId: 'ts_308',  atkBalanceSkillId: 'ts_406',  atkDisadvantageSkillId: 'ts_191',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_034', aptitude: 'leverage', attackStyle: 'defense' },
    kapaduoxiya_sabiktas: { generalId: 'kapaduoxiya_sabiktas', tier: 'ordinary', tacticalSkillId: 'ts_672',  atkAdvantageSkillId: 'ts_672',  atkBalanceSkillId: 'ts_775',  atkDisadvantageSkillId: 'ts_411',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_035', aptitude: 'reverse', attackStyle: 'defense' },
    maermajika_paraetos: { generalId: 'maermajika_paraetos', tier: 'ordinary', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_1108',  atkDisadvantageSkillId: 'ts_411',  defAdvantageSkillId: 'ts_279',  defBalanceSkillId: 'ts_769',  defDisadvantageSkillId: 'ts_794', aptitude: 'reverse', attackStyle: 'defense' },
    ameng_jisi: { generalId: 'ameng_jisi', tier: 'ordinary', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_145',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_414', aptitude: 'reverse', attackStyle: 'defense' },
    eerbulushi_beisusi: { generalId: 'eerbulushi_beisusi', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_733',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_458',  defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'attack' },
    aliya_satibazanishi: { generalId: 'aliya_satibazanishi', tier: 'ordinary', tacticalSkillId: 'ts_400',  atkAdvantageSkillId: 'ts_400',  atkBalanceSkillId: 'ts_631',  atkDisadvantageSkillId: 'ts_212',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_1130',  defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'defense' },
    xuliya_shoujiang: { generalId: 'xuliya_shoujiang', tier: 'ordinary', tacticalSkillId: 'ts_654',  atkAdvantageSkillId: 'ts_654',  atkBalanceSkillId: 'ts_366',  atkDisadvantageSkillId: 'ts_411',  defAdvantageSkillId: 'ts_077',  defBalanceSkillId: 'ts_1109',  defDisadvantageSkillId: 'ts_211', aptitude: 'leverage', attackStyle: 'defense' },
    sute_spitamenes: { generalId: 'sute_spitamenes', tier: 'ordinary', tacticalSkillId: 'ts_354',  atkAdvantageSkillId: 'ts_354',  atkBalanceSkillId: 'ts_769',  atkDisadvantageSkillId: 'ts_418',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_1110',  defDisadvantageSkillId: 'ts_505', aptitude: 'create', attackStyle: 'attack' },
    jiduoluoxiya_xibiertiwusi: { generalId: 'jiduoluoxiya_xibiertiwusi', tier: 'ordinary', tacticalSkillId: 'ts_402',  atkAdvantageSkillId: 'ts_402',  atkBalanceSkillId: 'ts_1111',  atkDisadvantageSkillId: 'ts_719',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_458',  defDisadvantageSkillId: 'ts_730', aptitude: 'reverse', attackStyle: 'defense' },
    aolitai_shouling: { generalId: 'aolitai_shouling', tier: 'ordinary', tacticalSkillId: 'ts_031',  atkAdvantageSkillId: 'ts_031',  atkBalanceSkillId: 'ts_486',  atkDisadvantageSkillId: 'ts_200',  defAdvantageSkillId: 'ts_816',  defBalanceSkillId: 'ts_1126',  defDisadvantageSkillId: 'ts_794', aptitude: 'reverse', attackStyle: 'defense' },
    kamanniya_zongdu: { generalId: 'kamanniya_zongdu', tier: 'ordinary', tacticalSkillId: 'ts_474',  atkAdvantageSkillId: 'ts_474',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_262',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_278',  defDisadvantageSkillId: 'ts_691', aptitude: 'reverse', attackStyle: 'defense' },
    keerman_xierzhan_shoujiang: { generalId: 'keerman_xierzhan_shoujiang', tier: 'ordinary', tacticalSkillId: 'ts_003',  atkAdvantageSkillId: 'ts_003',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_412',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_458',  defDisadvantageSkillId: 'ts_659', aptitude: 'reverse', attackStyle: 'defense' },
    zhageluosi_guanjiang: { generalId: 'zhageluosi_guanjiang', tier: 'ordinary', tacticalSkillId: 'ts_372',  atkAdvantageSkillId: 'ts_372',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_530',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_733', aptitude: 'reverse', attackStyle: 'defense' },
    lulisitan_shoujiang: { generalId: 'lulisitan_shoujiang', tier: 'ordinary', tacticalSkillId: 'ts_444',  atkAdvantageSkillId: 'ts_444',  atkBalanceSkillId: 'ts_406',  atkDisadvantageSkillId: 'ts_464',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_046',  defDisadvantageSkillId: 'ts_167', aptitude: 'reverse', attackStyle: 'defense' },
    golpayegan_yicheng: { generalId: 'golpayegan_yicheng', tier: 'ordinary', tacticalSkillId: 'ts_660',  atkAdvantageSkillId: 'ts_660',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_409',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_204', aptitude: 'reverse', attackStyle: 'defense' },
    meisuobudamiya_shoujiang: { generalId: 'meisuobudamiya_shoujiang', tier: 'ordinary', tacticalSkillId: 'ts_398',  atkAdvantageSkillId: 'ts_398',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_733',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_542', aptitude: 'reverse', attackStyle: 'defense' },
    sumeier_nabopalasa: { generalId: 'sumeier_nabopalasa', tier: 'famous', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_1112',  atkDisadvantageSkillId: 'ts_587',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_760',  defDisadvantageSkillId: 'ts_361', aptitude: 'create', attackStyle: 'attack' },
    wuer_boshasha: { generalId: 'wuer_boshasha', tier: 'ordinary', tacticalSkillId: 'ts_624',  atkAdvantageSkillId: 'ts_624',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_513',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_486',  defDisadvantageSkillId: 'ts_072', aptitude: 'reverse', attackStyle: 'defense' },
    guyashu_tigelate: { generalId: 'guyashu_tigelate', tier: 'famous', tacticalSkillId: 'ts_033',  atkAdvantageSkillId: 'ts_033',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_733',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_458',  defDisadvantageSkillId: 'ts_109', aptitude: 'create', attackStyle: 'attack' },
    xikesuosi_samutike: { generalId: 'xikesuosi_samutike', tier: 'ordinary', tacticalSkillId: 'ts_208',  atkAdvantageSkillId: 'ts_208',  atkBalanceSkillId: 'ts_768',  atkDisadvantageSkillId: 'ts_484',  defAdvantageSkillId: 'ts_021',  defBalanceSkillId: 'ts_397',  defDisadvantageSkillId: 'ts_205', aptitude: 'create', attackStyle: 'balanced' },
    dibisi_tahaerka: { generalId: 'dibisi_tahaerka', tier: 'famous', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_413',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_366',  defDisadvantageSkillId: 'ts_037', aptitude: 'leverage', attackStyle: 'defense' },
    heti_alialate: { generalId: 'heti_alialate', tier: 'ordinary', tacticalSkillId: 'ts_319',  atkAdvantageSkillId: 'ts_319',  atkBalanceSkillId: 'ts_046',  atkDisadvantageSkillId: 'ts_758',  defAdvantageSkillId: 'ts_391',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_711', aptitude: 'reverse', attackStyle: 'defense' },
    aiji_neiketaneibu: { generalId: 'aiji_neiketaneibu', tier: 'famous', tacticalSkillId: 'ts_399',  atkAdvantageSkillId: 'ts_399',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_411',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_204', aptitude: 'leverage', attackStyle: 'defense' },
    shang_weiwuji: { generalId: 'shang_weiwuji', tier: 'famous', tacticalSkillId: 'ts_850',  atkAdvantageSkillId: 'ts_850',  atkBalanceSkillId: 'ts_1113',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_385',  defDisadvantageSkillId: 'ts_091', aptitude: 'create', attackStyle: 'attack' },
    yamaxun_faernake: { generalId: 'yamaxun_faernake', tier: 'ordinary', tacticalSkillId: 'ts_185',  atkAdvantageSkillId: 'ts_185',  atkBalanceSkillId: 'ts_300',  atkDisadvantageSkillId: 'ts_1131',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_1127',  defDisadvantageSkillId: 'ts_711', aptitude: 'leverage', attackStyle: 'attack' },
    teluoyi_maniya: { generalId: 'teluoyi_maniya', tier: 'ordinary', tacticalSkillId: 'ts_362',  atkAdvantageSkillId: 'ts_362',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_357',  defBalanceSkillId: 'ts_705',  defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'balanced' },
    ailan_julushi: { generalId: 'ailan_julushi', tier: 'famous', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_273',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_707',  defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'attack' },
    zhou_jifu: { generalId: 'zhou_jifu', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_1132',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_286',  defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'attack' },
    yin_yuejin: { generalId: 'yin_yuejin', tier: 'ordinary', tacticalSkillId: 'ts_400',  atkAdvantageSkillId: 'ts_400',  atkBalanceSkillId: 'ts_486',  atkDisadvantageSkillId: 'ts_920',  defAdvantageSkillId: 'ts_630',  defBalanceSkillId: 'ts_395',  defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    xibolai_majiabi: { generalId: 'xibolai_majiabi', tier: 'famous', tacticalSkillId: 'ts_660',  atkAdvantageSkillId: 'ts_660',  atkBalanceSkillId: 'ts_1114',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_028',  defBalanceSkillId: 'ts_380',  defDisadvantageSkillId: 'ts_018', aptitude: 'reverse', attackStyle: 'attack' },
    // 🔴 [2026-10-20 经典战补敌将] 四人按《武将分级标准·终版》三闸判普将（本人亲统却无史载够格胜绩）→ 仅战术技
    sashan_beilusi: { generalId: 'sashan_beilusi', tier: 'ordinary', tacticalSkillId: 'ts_282',  atkAdvantageSkillId: 'ts_282',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_711',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_743',  defDisadvantageSkillId: 'ts_103', aptitude: 'reverse', attackStyle: 'defense' },   // 卑路斯一世：484 赫拉特战败身死
    luoma_xiageliwusi: { generalId: 'luoma_xiageliwusi', tier: 'ordinary', tacticalSkillId: 'ts_154',  atkAdvantageSkillId: 'ts_154',  atkBalanceSkillId: 'ts_1115',  atkDisadvantageSkillId: 'ts_650',  defAdvantageSkillId: 'ts_748',  defBalanceSkillId: 'ts_433',  defDisadvantageSkillId: 'ts_653', aptitude: 'reverse', attackStyle: 'defense' },   // 西阿格里乌斯：486 苏瓦松战败
    tuoba_yuanying: { generalId: 'tuoba_yuanying', tier: 'ordinary', tacticalSkillId: 'ts_289',  atkAdvantageSkillId: 'ts_289',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_691',  defAdvantageSkillId: 'ts_293',  defBalanceSkillId: 'ts_745',  defDisadvantageSkillId: 'ts_638', aptitude: 'create', attackStyle: 'attack' },   // 元英：507 钟离之战北魏主帅（败）
    rouran_anagui: { generalId: 'rouran_anagui', tier: 'ordinary', tacticalSkillId: 'ts_325',  atkAdvantageSkillId: 'ts_325',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_808',  defAdvantageSkillId: 'ts_626',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_409', aptitude: 'reverse', attackStyle: 'defense' },   // 阿那瓌：552 被突厥击败身死
    // 🔴 [2026-10-20 经典战补敌将]
    sashan_khosrow_ii: { generalId: 'sashan_khosrow_ii', tier: 'famous', tacticalSkillId: 'ts_519',  atkAdvantageSkillId: 'ts_519',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_416',  defAdvantageSkillId: 'ts_029',  defBalanceSkillId: 'ts_475',  defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },   // 霍斯劳二世：590 借兵复国、收复失地，名将
    sui_yuwenshu: { generalId: 'sui_yuwenshu', tier: 'ordinary', tacticalSkillId: 'ts_751',  atkAdvantageSkillId: 'ts_751',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_688',  defAdvantageSkillId: 'ts_851',  defBalanceSkillId: 'ts_408',  defDisadvantageSkillId: 'ts_593', aptitude: 'create', attackStyle: 'attack' },   // 宇文述：萨水大败，普将
    tujue_xielikehan: { generalId: 'tujue_xielikehan', tier: 'ordinary', tacticalSkillId: 'ts_796', atkAdvantageSkillId: 'ts_796', atkBalanceSkillId: 'ts_397', atkDisadvantageSkillId: 'ts_596', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_733', aptitude: 'reverse', attackStyle: 'defense' }, // 颉利可汗：630 阴山被擒，普将
    nanqi_xiaobaojuan: { generalId: 'nanqi_xiaobaojuan', tier: 'ordinary', tacticalSkillId: 'ts_401',  atkAdvantageSkillId: 'ts_401',  atkBalanceSkillId: 'ts_045',  atkDisadvantageSkillId: 'ts_638',  defAdvantageSkillId: 'ts_633',  defBalanceSkillId: 'ts_1128',  defDisadvantageSkillId: 'ts_733', aptitude: 'reverse', attackStyle: 'defense' },   // 萧宝卷：暴君无胜绩，普将
    erzhu_erzhuzhao: { generalId: 'erzhu_erzhuzhao', tier: 'ordinary', tacticalSkillId: 'ts_960',  atkAdvantageSkillId: 'ts_960',  atkBalanceSkillId: 'ts_1116',  atkDisadvantageSkillId: 'ts_758',  defAdvantageSkillId: 'ts_770',  defBalanceSkillId: 'ts_385',  defDisadvantageSkillId: 'ts_294', aptitude: 'reverse', attackStyle: 'defense' },   // 尔朱兆：韩陵山败，普将
    gaoqi_d_xiaogui: { generalId: 'gaoqi_d_xiaogui', tier: 'ordinary', tacticalSkillId: 'ts_082',  atkAdvantageSkillId: 'ts_082',  atkBalanceSkillId: 'ts_395',  atkDisadvantageSkillId: 'ts_414',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_686',  defDisadvantageSkillId: 'ts_416', aptitude: 'create', attackStyle: 'attack' },   // 萧轨：白下败，普将
    yuwen_yuwenxian: { generalId: 'yuwen_yuwenxian', tier: 'famous', tacticalSkillId: 'ts_528',  atkAdvantageSkillId: 'ts_528',  atkBalanceSkillId: 'ts_507',  atkDisadvantageSkillId: 'ts_621',  defAdvantageSkillId: 'ts_389',  defBalanceSkillId: 'ts_1101',  defDisadvantageSkillId: 'ts_810', aptitude: 'create', attackStyle: 'attack' },   // 宇文宪：北周名将（屡破北齐），名将
    yiduhu_quwentai: { generalId: 'yiduhu_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_158',  atkAdvantageSkillId: 'ts_158',  atkBalanceSkillId: 'ts_1102',  atkDisadvantageSkillId: 'ts_758',  defAdvantageSkillId: 'ts_655',  defBalanceSkillId: 'ts_045',  defDisadvantageSkillId: 'ts_738', aptitude: 'reverse', attackStyle: 'defense' },   // 麴文泰：无胜绩，普将
    kongque_aluonashun: { generalId: 'kongque_aluonashun', tier: 'ordinary', tacticalSkillId: 'ts_010',  atkAdvantageSkillId: 'ts_010',  atkBalanceSkillId: 'ts_458',  atkDisadvantageSkillId: 'ts_006',  defAdvantageSkillId: 'ts_071',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_014', aptitude: 'reverse', attackStyle: 'defense' },   // 阿罗那顺：被擒，普将
    dayu_liqianshi: { generalId: 'dayu_liqianshi', tier: 'ordinary', tacticalSkillId: 'ts_679',  atkAdvantageSkillId: 'ts_679',  atkBalanceSkillId: 'ts_397',  atkDisadvantageSkillId: 'ts_218',  defAdvantageSkillId: 'ts_392',  defBalanceSkillId: 'ts_631',  defDisadvantageSkillId: 'ts_628', aptitude: 'reverse', attackStyle: 'defense' },   // 李迁仕：被斩，普将
    bfe_rusa_i: { generalId: 'bfe_rusa_i', tier: 'ordinary', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_411', aptitude: 'create', attackStyle: 'attack' },
    bfe_qijie: { generalId: 'bfe_qijie', tier: 'ordinary', tacticalSkillId: 'ts_480', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_746', defAdvantageSkillId: 'ts_962', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_209', aptitude: 'create', attackStyle: 'attack' },
    bfe_chuzi: { generalId: 'bfe_chuzi', tier: 'ordinary', tacticalSkillId: 'ts_812', atkAdvantageSkillId: 'ts_812', atkBalanceSkillId: 'ts_173', atkDisadvantageSkillId: 'ts_854', defAdvantageSkillId: 'ts_880', defBalanceSkillId: 'ts_1103', defDisadvantageSkillId: 'ts_206', aptitude: 'create', attackStyle: 'attack' },
    bfe_lifu: { generalId: 'bfe_lifu', tier: 'ordinary', tacticalSkillId: 'ts_672', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_251', atkDisadvantageSkillId: 'ts_971', defAdvantageSkillId: 'ts_970', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_216', aptitude: 'create', attackStyle: 'attack' },
    bfe_touman: { generalId: 'bfe_touman', tier: 'ordinary', tacticalSkillId: 'ts_679', atkAdvantageSkillId: 'ts_679', atkBalanceSkillId: 'ts_176', atkDisadvantageSkillId: 'ts_416', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_233', aptitude: 'create', attackStyle: 'attack' },
    bfe_xiangliang: { generalId: 'bfe_xiangliang', tier: 'famous', tacticalSkillId: 'ts_528', advantageSkillId: 'ts_528', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_902', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_902', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_760', defDisadvantageSkillId: 'ts_207', aptitude: 'create', attackStyle: 'attack' },
    bfe_crassus: { generalId: 'bfe_crassus', tier: 'famous', tacticalSkillId: 'ts_158', advantageSkillId: 'ts_158', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_418', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_768', atkDisadvantageSkillId: 'ts_418', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_006', aptitude: 'create', attackStyle: 'attack' },
    bfe_zhanghe: { generalId: 'bfe_zhanghe', tier: 'famous', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_402', balanceSkillId: 'ts_049', disadvantageSkillId: 'ts_988', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_049', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_255', aptitude: 'create', attackStyle: 'attack' },
    bfe_andragoras: { generalId: 'bfe_andragoras', tier: 'ordinary', tacticalSkillId: 'ts_813', atkAdvantageSkillId: 'ts_813', atkBalanceSkillId: 'ts_260', atkDisadvantageSkillId: 'ts_712', defAdvantageSkillId: 'ts_748', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_mendenus: { generalId: 'bfe_mendenus', tier: 'ordinary', tacticalSkillId: 'ts_870', atkAdvantageSkillId: 'ts_870', atkBalanceSkillId: 'ts_280', atkDisadvantageSkillId: 'ts_734', defAdvantageSkillId: 'ts_782', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_erigius: { generalId: 'bfe_erigius', tier: 'ordinary', tacticalSkillId: 'ts_901', atkAdvantageSkillId: 'ts_901', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_781', defAdvantageSkillId: 'ts_980', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_218', aptitude: 'create', attackStyle: 'attack' },
    bfe_shulezhong: { generalId: 'bfe_shulezhong', tier: 'ordinary', tacticalSkillId: 'ts_911', atkAdvantageSkillId: 'ts_911', atkBalanceSkillId: 'ts_300', atkDisadvantageSkillId: 'ts_784', defAdvantageSkillId: 'ts_983', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_231', aptitude: 'create', attackStyle: 'attack' },
    bfe_zhangping: { generalId: 'bfe_zhangping', tier: 'ordinary', tacticalSkillId: 'ts_940', atkAdvantageSkillId: 'ts_940', atkBalanceSkillId: 'ts_356', atkDisadvantageSkillId: 'ts_807', defAdvantageSkillId: 'ts_088', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_383', aptitude: 'create', attackStyle: 'attack' },
    bfe_wangjing: { generalId: 'bfe_wangjing', tier: 'ordinary', tacticalSkillId: 'ts_036', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_993', defAdvantageSkillId: 'ts_099', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_435', aptitude: 'create', attackStyle: 'attack' },
    bfe_wangyan: { generalId: 'bfe_wangyan', tier: 'ordinary', tacticalSkillId: 'ts_051', atkAdvantageSkillId: 'ts_051', atkBalanceSkillId: 'ts_453', atkDisadvantageSkillId: 'ts_994', defAdvantageSkillId: 'ts_112', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_460', aptitude: 'create', attackStyle: 'attack' },
    bfe_zhanghedu: { generalId: 'bfe_zhanghedu', tier: 'ordinary', tacticalSkillId: 'ts_130', atkAdvantageSkillId: 'ts_130', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_998', defAdvantageSkillId: 'ts_089', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_238', aptitude: 'create', attackStyle: 'attack' },
    bfe_murongbao: { generalId: 'bfe_murongbao', tier: 'ordinary', tacticalSkillId: 'ts_215', atkAdvantageSkillId: 'ts_215', atkBalanceSkillId: 'ts_309', atkDisadvantageSkillId: 'ts_056', defAdvantageSkillId: 'ts_094', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_241', aptitude: 'create', attackStyle: 'attack' },
    bfe_yangyu: { generalId: 'bfe_yangyu', tier: 'ordinary', tacticalSkillId: 'ts_111', atkAdvantageSkillId: 'ts_111', atkBalanceSkillId: 'ts_735', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_121', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_477', aptitude: 'create', attackStyle: 'attack' },
    bfe_vahan: { generalId: 'bfe_vahan', tier: 'ordinary', tacticalSkillId: 'ts_010', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_378', atkDisadvantageSkillId: 'ts_002', defAdvantageSkillId: 'ts_008', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_234', aptitude: 'create', attackStyle: 'attack' },
    bfe_likaigu: { generalId: 'bfe_likaigu', tier: 'ordinary', tacticalSkillId: 'ts_170', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_855', atkDisadvantageSkillId: 'ts_013', defAdvantageSkillId: 'ts_195', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_482', aptitude: 'create', attackStyle: 'attack' },
    bfe_abdullah_ali: { generalId: 'bfe_abdullah_ali', tier: 'ordinary', tacticalSkillId: 'ts_015', atkAdvantageSkillId: 'ts_015', atkBalanceSkillId: 'ts_405', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_261', aptitude: 'create', attackStyle: 'attack' },
    bfe_leo_phokas: { generalId: 'bfe_leo_phokas', tier: 'ordinary', tacticalSkillId: 'ts_039', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_439', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_092', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_281', aptitude: 'create', attackStyle: 'attack' },
    bfe_bulcsu: { generalId: 'bfe_bulcsu', tier: 'ordinary', tacticalSkillId: 'ts_070', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_458', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_133', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_291', aptitude: 'create', attackStyle: 'attack' },
    bfe_liurenshan: { generalId: 'bfe_liurenshan', tier: 'ordinary', tacticalSkillId: 'ts_172', atkAdvantageSkillId: 'ts_172', atkBalanceSkillId: 'ts_942', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_221', defBalanceSkillId: 'ts_1129', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_chengong: { generalId: 'bfe_chengong', tier: 'ordinary', tacticalSkillId: 'ts_685', atkAdvantageSkillId: 'ts_685', atkBalanceSkillId: 'ts_465', atkDisadvantageSkillId: 'ts_181', defAdvantageSkillId: 'ts_178', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_323', aptitude: 'create', attackStyle: 'attack' },
    bfe_muhammad_ghur: { generalId: 'bfe_muhammad_ghur', tier: 'famous', tacticalSkillId: 'ts_444', advantageSkillId: 'ts_444', balanceSkillId: 'ts_061', disadvantageSkillId: 'ts_498', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_061', atkDisadvantageSkillId: 'ts_498', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_502', aptitude: 'create', attackStyle: 'attack' },
    bfe_youxian: { generalId: 'bfe_youxian', tier: 'ordinary', tacticalSkillId: 'ts_831', atkAdvantageSkillId: 'ts_831', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_186', defAdvantageSkillId: 'ts_257', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_440', aptitude: 'create', attackStyle: 'attack' },
    bfe_umar: { generalId: 'bfe_umar', tier: 'ordinary', tacticalSkillId: 'ts_163', atkAdvantageSkillId: 'ts_163', atkBalanceSkillId: 'ts_516', atkDisadvantageSkillId: 'ts_263', defAdvantageSkillId: 'ts_175', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_387', aptitude: 'create', attackStyle: 'attack' },
    bfe_chagatai: { generalId: 'bfe_chagatai', tier: 'ordinary', tacticalSkillId: 'ts_511', advantageSkillId: 'ts_511', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_228', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_228', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_681', defDisadvantageSkillId: 'ts_680', aptitude: 'create', attackStyle: 'attack' },
    bfe_kniprode: { generalId: 'bfe_kniprode', tier: 'famous', tacticalSkillId: 'ts_519', advantageSkillId: 'ts_519', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_084', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_084', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_085', defDisadvantageSkillId: 'ts_294', aptitude: 'create', attackStyle: 'attack' },
    bfe_suleiman_pasha: { generalId: 'bfe_suleiman_pasha', tier: 'ordinary', tacticalSkillId: 'ts_132', atkAdvantageSkillId: 'ts_132', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_162', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_frederick_iii: { generalId: 'bfe_frederick_iii', tier: 'ordinary', tacticalSkillId: 'ts_141', atkAdvantageSkillId: 'ts_141', atkBalanceSkillId: 'ts_576', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_232', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_yibula: { generalId: 'bfe_yibula', tier: 'ordinary', tacticalSkillId: 'ts_622', atkAdvantageSkillId: 'ts_622', atkBalanceSkillId: 'ts_602', atkDisadvantageSkillId: 'ts_236', defAdvantageSkillId: 'ts_244', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_298', aptitude: 'create', attackStyle: 'attack' },
    bfe_takayutpi: { generalId: 'bfe_takayutpi', tier: 'ordinary', tacticalSkillId: 'ts_522', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_284', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_295', aptitude: 'create', attackStyle: 'attack' },
    bfe_mingyiswa: { generalId: 'bfe_mingyiswa', tier: 'ordinary', tacticalSkillId: 'ts_177', atkAdvantageSkillId: 'ts_177', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_104', defAdvantageSkillId: 'ts_301', defBalanceSkillId: 'ts_1104', defDisadvantageSkillId: 'ts_307', aptitude: 'create', attackStyle: 'attack' },
    bfe_potocki: { generalId: 'bfe_potocki', tier: 'ordinary', tacticalSkillId: 'ts_198', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_122', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_361', aptitude: 'create', attackStyle: 'attack' },
    bfe_fuquan: { generalId: 'bfe_fuquan', tier: 'famous', tacticalSkillId: 'ts_528', advantageSkillId: 'ts_528', balanceSkillId: 'ts_447', disadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_447', atkDisadvantageSkillId: 'ts_243', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_667', aptitude: 'create', attackStyle: 'attack' },
    bfe_tsering_dondub: { generalId: 'bfe_tsering_dondub', tier: 'famous', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_654', balanceSkillId: 'ts_102', disadvantageSkillId: 'ts_313', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_102', atkDisadvantageSkillId: 'ts_313', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_369', aptitude: 'create', attackStyle: 'attack' },
    bfe_zengguoquan: { generalId: 'bfe_zengguoquan', tier: 'famous', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_193', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_193', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_756', aptitude: 'create', attackStyle: 'attack' },
    bfe_xiaoceling: { generalId: 'bfe_xiaoceling', tier: 'famous', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_196', disadvantageSkillId: 'ts_125', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_196', atkDisadvantageSkillId: 'ts_125', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_370', aptitude: 'create', attackStyle: 'attack' },
    bfe_mahathammaracha: { generalId: 'bfe_mahathammaracha', tier: 'ordinary', tacticalSkillId: 'ts_220', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_743', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_311', defBalanceSkillId: 'ts_1105', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_quzhisheng: { generalId: 'bfe_quzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_296', atkAdvantageSkillId: 'ts_296', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_312', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_arslan_shah: { generalId: 'bfe_arslan_shah', tier: 'ordinary', tacticalSkillId: 'ts_239', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_754', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_bogislaw_i: { generalId: 'bfe_bogislaw_i', tier: 'ordinary', tacticalSkillId: 'ts_242', atkAdvantageSkillId: 'ts_242', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1106', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_wanggeon: { generalId: 'bfe_wanggeon', tier: 'famous', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_134', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_134', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_382', defDisadvantageSkillId: 'ts_727', aptitude: 'create', attackStyle: 'attack' },
    bfe_oda_nobuhide: { generalId: 'bfe_oda_nobuhide', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_252', disadvantageSkillId: 'ts_706', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_706', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_470', aptitude: 'create', attackStyle: 'attack' },
    bfe_liuping: { generalId: 'bfe_liuping', tier: 'ordinary', tacticalSkillId: 'ts_310', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_426', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_taobao: { generalId: 'bfe_taobao', tier: 'ordinary', tacticalSkillId: 'ts_349', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_202', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_669', defBalanceSkillId: 'ts_1107', defDisadvantageSkillId: 'ts_490', aptitude: 'create', attackStyle: 'attack' },
    bfe_ashina_duzhi: { generalId: 'bfe_ashina_duzhi', tier: 'ordinary', tacticalSkillId: 'ts_250', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_045', atkDisadvantageSkillId: 'ts_144', defAdvantageSkillId: 'ts_389', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_409', aptitude: 'create', attackStyle: 'attack' },
    bfe_achaemenes: { generalId: 'bfe_achaemenes', tier: 'ordinary', tacticalSkillId: 'ts_258', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_442', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_411', aptitude: 'create', attackStyle: 'attack' },
    bfe_huyan_wang: { generalId: 'bfe_huyan_wang', tier: 'ordinary', tacticalSkillId: 'ts_265', atkAdvantageSkillId: 'ts_265', atkBalanceSkillId: 'ts_124', atkDisadvantageSkillId: 'ts_254', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_545', aptitude: 'create', attackStyle: 'attack' },
    bfe_ukita_hideie: { generalId: 'bfe_ukita_hideie', tier: 'ordinary', tacticalSkillId: 'ts_336', atkAdvantageSkillId: 'ts_336', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_781', defAdvantageSkillId: 'ts_515', defBalanceSkillId: 'ts_1108', defDisadvantageSkillId: 'ts_508', aptitude: 'create', attackStyle: 'attack' },
    bfe_todo_takakage: { generalId: 'bfe_todo_takakage', tier: 'ordinary', tacticalSkillId: 'ts_339', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_156', atkDisadvantageSkillId: 'ts_159', defAdvantageSkillId: 'ts_536', defBalanceSkillId: 'ts_397', defDisadvantageSkillId: 'ts_412', aptitude: 'create', attackStyle: 'attack' },
    bfe_sogo_kazumasa: { generalId: 'bfe_sogo_kazumasa', tier: 'ordinary', tacticalSkillId: 'ts_340', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_169', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_413', aptitude: 'create', attackStyle: 'attack' },
    bfe_ashina_yoshihiro: { generalId: 'bfe_ashina_yoshihiro', tier: 'ordinary', tacticalSkillId: 'ts_354', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_192', defAdvantageSkillId: 'ts_553', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_414', aptitude: 'create', attackStyle: 'attack' },
    bfe_wanggao: { generalId: 'bfe_wanggao', tier: 'ordinary', tacticalSkillId: 'ts_355', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_548', defAdvantageSkillId: 'ts_563', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_428', aptitude: 'create', attackStyle: 'attack' },
    bfe_aulax: { generalId: 'bfe_aulax', tier: 'ordinary', tacticalSkillId: 'ts_398', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_147', atkDisadvantageSkillId: 'ts_214', defAdvantageSkillId: 'ts_618', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_450', aptitude: 'create', attackStyle: 'attack' },
    feilisidin_geliya: { generalId: 'feilisidin_geliya', tier: 'ordinary', tacticalSkillId: 'ts_223',  atkAdvantageSkillId: 'ts_223',  atkBalanceSkillId: 'ts_393',  atkDisadvantageSkillId: 'ts_718',  defAdvantageSkillId: 'ts_815',  defBalanceSkillId: 'ts_547',  defDisadvantageSkillId: 'ts_727', aptitude: 'create', attackStyle: 'attack' },   // 歌利亚
    haikou_maohaifeng: { generalId: 'haikou_maohaifeng', tier: 'ordinary', tacticalSkillId: 'ts_040',  atkAdvantageSkillId: 'ts_040',  atkBalanceSkillId: 'ts_547',  atkDisadvantageSkillId: 'ts_740',  defAdvantageSkillId: 'ts_815',  defBalanceSkillId: 'ts_1129',  defDisadvantageSkillId: 'ts_727', aptitude: 'create', attackStyle: 'attack' },   // 毛海峰
    handong_liuheita: { generalId: 'handong_liuheita', tier: 'ordinary', tacticalSkillId: 'ts_001', aptitude: 'create', attackStyle: 'attack' },   // 刘黑闼
    bfe_sinan_pasha: { generalId: 'bfe_sinan_pasha', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    bfe_qutlugh_khwaja: { generalId: 'bfe_qutlugh_khwaja', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    khoshut_lhasang: { generalId: 'khoshut_lhasang', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    yuan_nahachu: { generalId: 'yuan_nahachu', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    baiji_shenjian: { generalId: 'baiji_shenjian', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    dayan_cuiqianyou: { generalId: 'dayan_cuiqianyou', tier: 'famous', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    ethiopia_lebnadengel: { generalId: 'ethiopia_lebnadengel', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    houhan_lishouzhen: { generalId: 'houhan_lishouzhen', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    dulan_azimuhan: { generalId: 'dulan_azimuhan', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_484', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    buni_mathos: { generalId: 'buni_mathos', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_217', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_217', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    tang_qikerang: { generalId: 'tang_qikerang', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_230', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_230', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_490', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    xiongnu_hunxiewang: { generalId: 'xiongnu_hunxiewang', tier: 'ordinary', tacticalSkillId: 'ts_185', advantageSkillId: 'ts_185', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_607', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_607', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_606', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    khon_wangzun: { generalId: 'khon_wangzun', tier: 'ordinary', tacticalSkillId: 'ts_371', advantageSkillId: 'ts_371', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_514', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    ansxi_surena: { generalId: 'ansxi_surena', tier: 'famous', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_224', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_224', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_484', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    dulan_muzaffarkhan: { generalId: 'dulan_muzaffarkhan', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_225', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_513', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    qin_hengyi: { generalId: 'qin_hengyi', tier: 'famous', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_249', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_565', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    dajin_wanyaneke: { generalId: 'dajin_wanyaneke', tier: 'ordinary', tacticalSkillId: 'ts_365', advantageSkillId: 'ts_365', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_784', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_784', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_533', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    kuman_tugorkan: { generalId: 'kuman_tugorkan', tier: 'famous', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_226', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_226', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_574', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    baizanting_diaofeilusi: { generalId: 'baizanting_diaofeilusi', tier: 'famous', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_237', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_580', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    zhelouqi_puliteweilajie: { generalId: 'zhelouqi_puliteweilajie', tier: 'famous', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_266', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_266', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_581', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    baojian_herman: { generalId: 'baojian_herman', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_031', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_268', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_268', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_585', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）　🔴[2026-11-01 主人令·四闸复核] 名将→普将：冰上之战为败方，无实质大胜
    qi_tianji: { generalId: 'qi_tianji', tier: 'famous', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_287', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_287', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_590', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    yuenan_ruanguangzuan: { generalId: 'yuenan_ruanguangzuan', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_032', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_483', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_483', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_592', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    osman_kapadan: { generalId: 'osman_kapadan', tier: 'famous', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_033', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_271', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_271', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_601', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（名将，按四闸判）
    bfe_andronikos_komnenos: { generalId: 'bfe_andronikos_komnenos', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_272', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_272', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_637', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    tujue_abo_dagan: { generalId: 'tujue_abo_dagan', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_595', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_644', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    xiongnu_yizhixie: { generalId: 'xiongnu_yizhixie', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_623', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_623', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_650', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    luosi_svyatopolk: { generalId: 'luosi_svyatopolk', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_274', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_274', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_671', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    shu_masu: { generalId: 'shu_masu', tier: 'ordinary', tacticalSkillId: 'ts_335', advantageSkillId: 'ts_335', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_292', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_292', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_788', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    dajin_wanyan_zhongde: { generalId: 'dajin_wanyan_zhongde', tier: 'ordinary', tacticalSkillId: 'ts_445', advantageSkillId: 'ts_445', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_277', atkAdvantageSkillId: 'ts_445', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_277', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_674', aptitude: 'leverage', attackStyle: 'attack' },   // 经典战敌将（普将，按四闸判）
    halapeng_yiba: { generalId: 'halapeng_yiba', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_297', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_297', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_677', aptitude: 'leverage', attackStyle: 'attack' },   // 哈剌彭末王（普将）
    yuan_shidielibisi: { generalId: 'yuan_shidielibisi', tier: 'ordinary', tacticalSkillId: 'ts_544', advantageSkillId: 'ts_544', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_302', atkAdvantageSkillId: 'ts_544', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_302', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_688', aptitude: 'leverage', attackStyle: 'attack' },   // 耽罗牧胡首领（普将）
    muwaxide_axatafu: { generalId: 'muwaxide_axatafu', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_317', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_317', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_690', aptitude: 'leverage', attackStyle: 'attack' },   // 塞维利亚守王（普将）
    gepids_cunimund: { generalId: 'gepids_cunimund', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_320', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_320', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_691', aptitude: 'leverage', attackStyle: 'attack' },   // 革皮德末王（普将）
    kalbids_ibnhawwas: { generalId: 'kalbids_ibnhawwas', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_321', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_321', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_697', aptitude: 'leverage', attackStyle: 'attack' },   // 西西里埃米尔（普将）
    zhanger: { generalId: 'zhanger', tier: 'ordinary', tacticalSkillId: 'ts_040', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_675', atkDisadvantageSkillId: 'ts_512', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_1130', defDisadvantageSkillId: 'ts_747', aptitude: 'reverse', attackStyle: 'defense' },   // 张耳：普将
    gaogouli_liuli: { generalId: 'gaogouli_liuli', tier: 'ordinary', tacticalSkillId: 'ts_040', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_331', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_1126', defDisadvantageSkillId: 'ts_720', aptitude: 'create', attackStyle: 'defense' },   // 琉璃明王：普将
    otomo_sorin: { generalId: 'otomo_sorin', tier: 'ordinary', tacticalSkillId: 'ts_040', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_334', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_1127', defDisadvantageSkillId: 'ts_725', aptitude: 'create', attackStyle: 'attack' },   // 大友宗麟：普将
    ming_shenyourong: { generalId: 'ming_shenyourong', tier: 'ordinary', tacticalSkillId: 'ts_040', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_647', atkDisadvantageSkillId: 'ts_345', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_1128', defDisadvantageSkillId: 'ts_984', aptitude: 'leverage', attackStyle: 'attack' },   // 沈有容：普将
    yinggelan_lionheart: { generalId: 'yinggelan_lionheart', tier: 'famous', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_337', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_337', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_759', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_henryii: { generalId: 'yinggelan_henryii', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_351', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_351', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_759', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_clare: { generalId: 'yinggelan_clare', tier: 'ordinary', tacticalSkillId: 'ts_158', advantageSkillId: 'ts_158', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_359', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_359', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_759', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_fastolf: { generalId: 'yinggelan_fastolf', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_373', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_373', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_759', aptitude: 'leverage', attackStyle: 'attack' },
    weiershi_arthur: { generalId: 'weiershi_arthur', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_376', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_376', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_726', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_lancelot: { generalId: 'yinggelan_lancelot', tier: 'ordinary', tacticalSkillId: 'ts_185', advantageSkillId: 'ts_185', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_386', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_386', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_727', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_gawain: { generalId: 'yinggelan_gawain', tier: 'ordinary', tacticalSkillId: 'ts_201', advantageSkillId: 'ts_201', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_415', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_415', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_729', aptitude: 'leverage', attackStyle: 'attack' },
    weiershi_mordred: { generalId: 'weiershi_mordred', tier: 'ordinary', tacticalSkillId: 'ts_208', advantageSkillId: 'ts_208', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_416', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_416', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_730', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_tristan: { generalId: 'yinggelan_tristan', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_417', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_417', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_733', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_robinhood: { generalId: 'yinggelan_robinhood', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_418', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_418', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_759', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_littlejohn: { generalId: 'yinggelan_littlejohn', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_762', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_nottingham: { generalId: 'yinggelan_nottingham', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_429', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_429', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_777', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_friartuck: { generalId: 'yinggelan_friartuck', tier: 'ordinary', tacticalSkillId: 'ts_282', advantageSkillId: 'ts_282', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_431', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_790', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_aethelfrith: { generalId: 'yinggelan_aethelfrith', tier: 'ordinary', tacticalSkillId: 'ts_285', advantageSkillId: 'ts_285', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_801', aptitude: 'leverage', attackStyle: 'attack' },
    yinggelan_tostig: { generalId: 'yinggelan_tostig', tier: 'ordinary', tacticalSkillId: 'ts_289', advantageSkillId: 'ts_289', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_457', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_810', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_conqueror: { generalId: 'gaolu_conqueror', tier: 'famous', tacticalSkillId: 'ts_308', advantageSkillId: 'ts_308', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_459', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_830', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_roland: { generalId: 'gaolu_roland', tier: 'ordinary', tacticalSkillId: 'ts_319', advantageSkillId: 'ts_319', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_463', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_463', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_840', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_reynald: { generalId: 'gaolu_reynald', tier: 'ordinary', tacticalSkillId: 'ts_322', advantageSkillId: 'ts_322', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_479', atkAdvantageSkillId: 'ts_322', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_853', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_lahire: { generalId: 'gaolu_lahire', tier: 'ordinary', tacticalSkillId: 'ts_325', advantageSkillId: 'ts_325', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_492', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_492', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_912', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_alencon: { generalId: 'gaolu_alencon', tier: 'ordinary', tacticalSkillId: 'ts_343', advantageSkillId: 'ts_343', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_931', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_bertrand: { generalId: 'gaolu_bertrand', tier: 'ordinary', tacticalSkillId: 'ts_362', advantageSkillId: 'ts_362', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_518', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_941', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_demetz: { generalId: 'gaolu_demetz', tier: 'ordinary', tacticalSkillId: 'ts_372', advantageSkillId: 'ts_372', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_534', atkAdvantageSkillId: 'ts_372', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_534', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_961', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_josselyne: { generalId: 'gaolu_josselyne', tier: 'ordinary', tacticalSkillId: 'ts_399', advantageSkillId: 'ts_399', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_543', atkAdvantageSkillId: 'ts_399', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_543', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_981', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_graville: { generalId: 'gaolu_graville', tier: 'ordinary', tacticalSkillId: 'ts_401', advantageSkillId: 'ts_401', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_573', atkAdvantageSkillId: 'ts_401', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_573', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_991', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_richemont: { generalId: 'gaolu_richemont', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_402', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_582', atkAdvantageSkillId: 'ts_402', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_582', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_995', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_hardrada: { generalId: 'nuowei_hardrada', tier: 'ordinary', tacticalSkillId: 'ts_443', advantageSkillId: 'ts_443', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_443', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_586', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_999', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：缺具名敌帅之战区决战，斯坦福桥败亡
    nuowei_erikred: { generalId: 'nuowei_erikred', tier: 'ordinary', tacticalSkillId: 'ts_444', advantageSkillId: 'ts_444', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_612', atkAdvantageSkillId: 'ts_444', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_612', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_006', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_hrolf: { generalId: 'nuowei_hrolf', tier: 'ordinary', tacticalSkillId: 'ts_446', advantageSkillId: 'ts_446', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_019', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_ulf: { generalId: 'nuowei_ulf', tier: 'ordinary', tacticalSkillId: 'ts_476', advantageSkillId: 'ts_476', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_646', atkAdvantageSkillId: 'ts_476', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_646', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_023', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_halldor: { generalId: 'nuowei_halldor', tier: 'ordinary', tacticalSkillId: 'ts_481', advantageSkillId: 'ts_481', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_481', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_027', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_kalf: { generalId: 'nuowei_kalf', tier: 'ordinary', tacticalSkillId: 'ts_511', advantageSkillId: 'ts_511', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_657', atkAdvantageSkillId: 'ts_511', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_657', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_058', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_finn: { generalId: 'nuowei_finn', tier: 'ordinary', tacticalSkillId: 'ts_519', advantageSkillId: 'ts_519', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_519', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_662', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_067', aptitude: 'leverage', attackStyle: 'attack' },
    nuowei_einar: { generalId: 'nuowei_einar', tier: 'ordinary', tacticalSkillId: 'ts_528', advantageSkillId: 'ts_528', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_664', atkAdvantageSkillId: 'ts_528', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_664', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_076', aptitude: 'leverage', attackStyle: 'attack' },
    kasidiliya_sancho: { generalId: 'kasidiliya_sancho', tier: 'ordinary', tacticalSkillId: 'ts_554', advantageSkillId: 'ts_554', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_678', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_678', defAdvantageSkillId: 'ts_770', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_079', aptitude: 'leverage', attackStyle: 'attack' },
    xibanya_orellana: { generalId: 'xibanya_orellana', tier: 'ordinary', tacticalSkillId: 'ts_570', advantageSkillId: 'ts_570', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_684', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_684', defAdvantageSkillId: 'ts_783', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_100', aptitude: 'leverage', attackStyle: 'attack' },
    xibanya_gonzalo: { generalId: 'xibanya_gonzalo', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_629', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_698', atkAdvantageSkillId: 'ts_629', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_698', defAdvantageSkillId: 'ts_786', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_108', aptitude: 'leverage', attackStyle: 'attack' },
    yuenan_lelai: { generalId: 'yuenan_lelai', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_648', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_701', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_701', defAdvantageSkillId: 'ts_789', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_116', aptitude: 'leverage', attackStyle: 'attack' },
    yuenan_letrien: { generalId: 'yuenan_letrien', tier: 'ordinary', tacticalSkillId: 'ts_652', advantageSkillId: 'ts_652', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_708', atkAdvantageSkillId: 'ts_652', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_708', defAdvantageSkillId: 'ts_811', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_123', aptitude: 'leverage', attackStyle: 'attack' },
    yuenan_luunhanchu: { generalId: 'yuenan_luunhanchu', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_654', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_712', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_712', defAdvantageSkillId: 'ts_816', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_131', aptitude: 'leverage', attackStyle: 'attack' },
    yuenan_buibi: { generalId: 'yuenan_buibi', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_656', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_734', atkAdvantageSkillId: 'ts_656', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_734', defAdvantageSkillId: 'ts_913', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_142', aptitude: 'leverage', attackStyle: 'attack' },
    chenla_suryavarman: { generalId: 'chenla_suryavarman', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_787', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_746', atkAdvantageSkillId: 'ts_787', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_746', defAdvantageSkillId: 'ts_950', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_146', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：无具名敌帅的战区级胜绩
    chenla_jayaviravarman: { generalId: 'chenla_jayaviravarman', tier: 'ordinary', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_668', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_807', atkAdvantageSkillId: 'ts_668', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_807', defAdvantageSkillId: 'ts_992', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_149', aptitude: 'leverage', attackStyle: 'attack' },
    chenla_udayaditya: { generalId: 'chenla_udayaditya', tier: 'ordinary', tacticalSkillId: 'ts_692', advantageSkillId: 'ts_692', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_808', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_808', defAdvantageSkillId: 'ts_997', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_150', aptitude: 'leverage', attackStyle: 'attack' },
    feierganna_qutlugh: { generalId: 'feierganna_qutlugh', tier: 'ordinary', tacticalSkillId: 'ts_749', advantageSkillId: 'ts_749', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_854', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_854', defAdvantageSkillId: 'ts_021', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_505', aptitude: 'leverage', attackStyle: 'attack' },
    jinzhang_tokhtamysh: { generalId: 'jinzhang_tokhtamysh', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_785', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_902', atkAdvantageSkillId: 'ts_785', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_902', defAdvantageSkillId: 'ts_022', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_680', aptitude: 'leverage', attackStyle: 'attack' },
    jinzhang_urus: { generalId: 'jinzhang_urus', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_792', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_920', atkAdvantageSkillId: 'ts_792', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_920', defAdvantageSkillId: 'ts_026', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_153', aptitude: 'leverage', attackStyle: 'attack' },
    inca_huayna: { generalId: 'inca_huayna', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_806', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_971', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_971', defAdvantageSkillId: 'ts_029', defBalanceSkillId: 'ts_735', defDisadvantageSkillId: 'ts_180', aptitude: 'leverage', attackStyle: 'attack' },
    han_liubiao: { generalId: 'han_liubiao', tier: 'ordinary', tacticalSkillId: 'ts_982', advantageSkillId: 'ts_982', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_988', atkAdvantageSkillId: 'ts_982', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_988', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_743', defDisadvantageSkillId: 'ts_323', aptitude: 'leverage', attackStyle: 'attack' },
    han_yanbaihu: { generalId: 'han_yanbaihu', tier: 'ordinary', tacticalSkillId: 'ts_850', advantageSkillId: 'ts_850', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_993', atkAdvantageSkillId: 'ts_850', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_993', defAdvantageSkillId: 'ts_316', defBalanceSkillId: 'ts_745', defDisadvantageSkillId: 'ts_182', aptitude: 'leverage', attackStyle: 'attack' },
    han_yuji: { generalId: 'han_yuji', tier: 'ordinary', tacticalSkillId: 'ts_960', advantageSkillId: 'ts_960', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_994', atkAdvantageSkillId: 'ts_960', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_994', defAdvantageSkillId: 'ts_347', defBalanceSkillId: 'ts_754', defDisadvantageSkillId: 'ts_261', aptitude: 'leverage', attackStyle: 'attack' },
    baibo_zhangjue: { generalId: 'baibo_zhangjue', tier: 'ordinary', tacticalSkillId: 'ts_972', advantageSkillId: 'ts_972', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_998', atkAdvantageSkillId: 'ts_972', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_998', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_855', defDisadvantageSkillId: 'ts_209', aptitude: 'leverage', attackStyle: 'attack' },
    ethiopia_abraha: { generalId: 'ethiopia_abraha', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_002', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_002', defAdvantageSkillId: 'ts_047', defBalanceSkillId: 'ts_942', defDisadvantageSkillId: 'ts_187', aptitude: 'leverage', attackStyle: 'attack' },
    ethiopia_yekuno: { generalId: 'ethiopia_yekuno', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_012', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_057', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_191', aptitude: 'leverage', attackStyle: 'attack' },
    shiwaben_barbarossa: { generalId: 'shiwaben_barbarossa', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_004', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_013', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_013', defAdvantageSkillId: 'ts_071', defBalanceSkillId: 'ts_045', defDisadvantageSkillId: 'ts_200', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：破米兰属攻城，敌方无具名主帅
    wende_siegfried: { generalId: 'wende_siegfried', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_005', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_016', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_016', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_053', defDisadvantageSkillId: 'ts_206', aptitude: 'leverage', attackStyle: 'attack' },
    kelimiya_embriaco: { generalId: 'kelimiya_embriaco', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_011', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_011', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_119', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_207', aptitude: 'leverage', attackStyle: 'attack' },
    lunbadi_sforza: { generalId: 'lunbadi_sforza', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_025', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_025', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_048', defAdvantageSkillId: 'ts_120', defBalanceSkillId: 'ts_114', defDisadvantageSkillId: 'ts_216', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：雇佣兵队长，无具名敌帅的战略决战
    maqidun_hephaistion: { generalId: 'maqidun_hephaistion', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_031', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_056', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_056', defAdvantageSkillId: 'ts_140', defBalanceSkillId: 'ts_124', defDisadvantageSkillId: 'ts_218', aptitude: 'leverage', attackStyle: 'attack' },
    maqidun_nearchos: { generalId: 'maqidun_nearchos', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_032', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_084', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_084', defAdvantageSkillId: 'ts_160', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_231', aptitude: 'leverage', attackStyle: 'attack' },
    manzheboyi_radenwijaya: { generalId: 'manzheboyi_radenwijaya', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_033', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_098', atkAdvantageSkillId: 'ts_033', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_189', defBalanceSkillId: 'ts_156', defDisadvantageSkillId: 'ts_233', aptitude: 'leverage', attackStyle: 'attack' },
    manzheboyi_jayanegara: { generalId: 'manzheboyi_jayanegara', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_044', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_044', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_104', defAdvantageSkillId: 'ts_194', defBalanceSkillId: 'ts_173', defDisadvantageSkillId: 'ts_234', aptitude: 'leverage', attackStyle: 'attack' },
    luosi_yury: { generalId: 'luosi_yury', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_054', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_107', atkAdvantageSkillId: 'ts_054', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_107', defAdvantageSkillId: 'ts_270', defBalanceSkillId: 'ts_176', defDisadvantageSkillId: 'ts_238', aptitude: 'leverage', attackStyle: 'attack' },
    wulaertu_mleh: { generalId: 'wulaertu_mleh', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_059', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_122', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_122', defAdvantageSkillId: 'ts_279', defBalanceSkillId: 'ts_202', defDisadvantageSkillId: 'ts_241', aptitude: 'leverage', attackStyle: 'attack' },
    wulaertu_stephan: { generalId: 'wulaertu_stephan', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_060', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_125', atkAdvantageSkillId: 'ts_060', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_125', defAdvantageSkillId: 'ts_293', defBalanceSkillId: 'ts_251', defDisadvantageSkillId: 'ts_255', aptitude: 'leverage', attackStyle: 'attack' },
    gelujiya_ivane: { generalId: 'gelujiya_ivane', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_066', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_134', atkAdvantageSkillId: 'ts_066', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_134', defAdvantageSkillId: 'ts_315', defBalanceSkillId: 'ts_260', defDisadvantageSkillId: 'ts_281', aptitude: 'leverage', attackStyle: 'attack' },
    gelujiya_zakare: { generalId: 'gelujiya_zakare', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_074', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_144', atkAdvantageSkillId: 'ts_074', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_144', defAdvantageSkillId: 'ts_327', defBalanceSkillId: 'ts_280', defDisadvantageSkillId: 'ts_291', aptitude: 'leverage', attackStyle: 'attack' },
    gurjara_chand: { generalId: 'gurjara_chand', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_078', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_152', atkAdvantageSkillId: 'ts_078', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_152', defAdvantageSkillId: 'ts_330', defBalanceSkillId: 'ts_283', defDisadvantageSkillId: 'ts_294', aptitude: 'leverage', attackStyle: 'attack' },
    gurjara_sanyogita: { generalId: 'gurjara_sanyogita', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_083', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_159', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_159', defAdvantageSkillId: 'ts_341', defBalanceSkillId: 'ts_300', defDisadvantageSkillId: 'ts_295', aptitude: 'leverage', attackStyle: 'attack' },
    kanata_amoghavarsha: { generalId: 'kanata_amoghavarsha', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_086', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_169', atkAdvantageSkillId: 'ts_086', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_169', defAdvantageSkillId: 'ts_391', defBalanceSkillId: 'ts_309', defDisadvantageSkillId: 'ts_298', aptitude: 'leverage', attackStyle: 'attack' },
    xiongren_bleda: { generalId: 'xiongren_bleda', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_181', atkAdvantageSkillId: 'ts_115', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_181', defAdvantageSkillId: 'ts_392', defBalanceSkillId: 'ts_356', defDisadvantageSkillId: 'ts_307', aptitude: 'leverage', attackStyle: 'attack' },
    bolan_zawisza: { generalId: 'bolan_zawisza', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_117', balanceSkillId: 'ts_1106', disadvantageSkillId: 'ts_186', atkAdvantageSkillId: 'ts_117', atkBalanceSkillId: 'ts_1106', atkDisadvantageSkillId: 'ts_186', defAdvantageSkillId: 'ts_421', defBalanceSkillId: 'ts_378', defDisadvantageSkillId: 'ts_361', aptitude: 'leverage', attackStyle: 'attack' },
    sashan_khosrow: { generalId: 'sashan_khosrow', tier: 'ordinary', tacticalSkillId: 'ts_135', advantageSkillId: 'ts_135', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_463', atkAdvantageSkillId: 'ts_135', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_463', defAdvantageSkillId: 'ts_436', defBalanceSkillId: 'ts_405', defDisadvantageSkillId: 'ts_464', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：攻城掠地为主，缺具名敌方主帅的会战大胜
    baojialiya_konstantin: { generalId: 'baojialiya_konstantin', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_138', balanceSkillId: 'ts_1108', disadvantageSkillId: 'ts_192', atkAdvantageSkillId: 'ts_138', atkBalanceSkillId: 'ts_1108', atkDisadvantageSkillId: 'ts_192', defAdvantageSkillId: 'ts_500', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_369', aptitude: 'leverage', attackStyle: 'attack' },
    osman_selim: { generalId: 'osman_selim', tier: 'famous', tacticalSkillId: 'ts_158', advantageSkillId: 'ts_158', balanceSkillId: 'ts_1109', disadvantageSkillId: 'ts_193', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_1109', atkDisadvantageSkillId: 'ts_193', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_432', defDisadvantageSkillId: 'ts_370', aptitude: 'leverage', attackStyle: 'attack' },
    mazhaer_toldi: { generalId: 'mazhaer_toldi', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_183', balanceSkillId: 'ts_1110', disadvantageSkillId: 'ts_214', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_1110', atkDisadvantageSkillId: 'ts_214', defAdvantageSkillId: 'ts_532', defBalanceSkillId: 'ts_439', defDisadvantageSkillId: 'ts_383', aptitude: 'leverage', attackStyle: 'attack' },
    womaya_musa: { generalId: 'womaya_musa', tier: 'ordinary', tacticalSkillId: 'ts_184', advantageSkillId: 'ts_184', balanceSkillId: 'ts_1111', disadvantageSkillId: 'ts_217', atkAdvantageSkillId: 'ts_184', atkBalanceSkillId: 'ts_1111', atkDisadvantageSkillId: 'ts_217', defAdvantageSkillId: 'ts_556', defBalanceSkillId: 'ts_453', defDisadvantageSkillId: 'ts_387', aptitude: 'leverage', attackStyle: 'attack' },
    aztec_itzcoatl: { generalId: 'aztec_itzcoatl', tier: 'ordinary', tacticalSkillId: 'ts_185', advantageSkillId: 'ts_185', balanceSkillId: 'ts_1112', disadvantageSkillId: 'ts_224', atkAdvantageSkillId: 'ts_185', atkBalanceSkillId: 'ts_1112', atkDisadvantageSkillId: 'ts_224', defAdvantageSkillId: 'ts_564', defBalanceSkillId: 'ts_458', defDisadvantageSkillId: 'ts_409', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：阿兹特克扩张，敌为不具名小城邦
    aztec_cuauhtemoc: { generalId: 'aztec_cuauhtemoc', tier: 'ordinary', tacticalSkillId: 'ts_201', advantageSkillId: 'ts_201', balanceSkillId: 'ts_1113', disadvantageSkillId: 'ts_225', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_1113', atkDisadvantageSkillId: 'ts_225', defAdvantageSkillId: 'ts_569', defBalanceSkillId: 'ts_465', defDisadvantageSkillId: 'ts_411', aptitude: 'leverage', attackStyle: 'attack' },
    bogendi_jacqueline: { generalId: 'bogendi_jacqueline', tier: 'ordinary', tacticalSkillId: 'ts_208', advantageSkillId: 'ts_208', balanceSkillId: 'ts_1114', disadvantageSkillId: 'ts_226', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_1114', atkDisadvantageSkillId: 'ts_226', defAdvantageSkillId: 'ts_626', defBalanceSkillId: 'ts_468', defDisadvantageSkillId: 'ts_412', aptitude: 'leverage', attackStyle: 'attack' },
    jiaohuangguo_leoi: { generalId: 'jiaohuangguo_leoi', tier: 'ordinary', tacticalSkillId: 'ts_210', advantageSkillId: 'ts_210', balanceSkillId: 'ts_1115', disadvantageSkillId: 'ts_228', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_1115', atkDisadvantageSkillId: 'ts_228', defAdvantageSkillId: 'ts_630', defBalanceSkillId: 'ts_507', defDisadvantageSkillId: 'ts_413', aptitude: 'leverage', attackStyle: 'attack' },
    nanchou_kitabatake: { generalId: 'nanchou_kitabatake', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_213', balanceSkillId: 'ts_1116', disadvantageSkillId: 'ts_706', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_1116', atkDisadvantageSkillId: 'ts_706', defAdvantageSkillId: 'ts_778', defBalanceSkillId: 'ts_516', defDisadvantageSkillId: 'ts_470', aptitude: 'leverage', attackStyle: 'attack' },
    sashan_shah: { generalId: 'sashan_shah', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_223', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_230', atkAdvantageSkillId: 'ts_223', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_230', defAdvantageSkillId: 'ts_633', defBalanceSkillId: 'ts_529', defDisadvantageSkillId: 'ts_414', aptitude: 'leverage', attackStyle: 'attack' },
    abasi_imam: { generalId: 'abasi_imam', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_235', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_236', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_236', defAdvantageSkillId: 'ts_640', defBalanceSkillId: 'ts_576', defDisadvantageSkillId: 'ts_428', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_bureau: { generalId: 'gaolu_bureau', tier: 'ordinary', tacticalSkillId: 'ts_282', advantageSkillId: 'ts_282', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_237', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_237', defAdvantageSkillId: 'ts_655', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_435', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：奥尔良/帕泰为从属统兵
    gaolu_lorrain: { generalId: 'gaolu_lorrain', tier: 'ordinary', tacticalSkillId: 'ts_285', advantageSkillId: 'ts_285', balanceSkillId: 'ts_1102', disadvantageSkillId: 'ts_243', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_1102', atkDisadvantageSkillId: 'ts_243', defAdvantageSkillId: 'ts_658', defBalanceSkillId: 'ts_631', defDisadvantageSkillId: 'ts_440', aptitude: 'leverage', attackStyle: 'attack' },
    gaolu_jeannehachette: { generalId: 'gaolu_jeannehachette', tier: 'ordinary', tacticalSkillId: 'ts_289', advantageSkillId: 'ts_289', balanceSkillId: 'ts_1103', disadvantageSkillId: 'ts_249', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_1103', atkDisadvantageSkillId: 'ts_249', defAdvantageSkillId: 'ts_683', defBalanceSkillId: 'ts_634', defDisadvantageSkillId: 'ts_450', aptitude: 'leverage', attackStyle: 'attack' },
    ethiopia_eleni: { generalId: 'ethiopia_eleni', tier: 'ordinary', tacticalSkillId: 'ts_308', advantageSkillId: 'ts_308', balanceSkillId: 'ts_1104', disadvantageSkillId: 'ts_254', atkAdvantageSkillId: 'ts_308', atkBalanceSkillId: 'ts_1104', atkDisadvantageSkillId: 'ts_254', defAdvantageSkillId: 'ts_709', defBalanceSkillId: 'ts_647', defDisadvantageSkillId: 'ts_460', aptitude: 'leverage', attackStyle: 'attack' },
    bolan_maria: { generalId: 'bolan_maria', tier: 'ordinary', tacticalSkillId: 'ts_319', advantageSkillId: 'ts_319', balanceSkillId: 'ts_1105', disadvantageSkillId: 'ts_263', atkAdvantageSkillId: 'ts_319', atkBalanceSkillId: 'ts_1105', atkDisadvantageSkillId: 'ts_263', defAdvantageSkillId: 'ts_724', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_477', aptitude: 'leverage', attackStyle: 'attack' },
    han_fengting: { generalId: 'han_fengting', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    qi_luzhonglian: { generalId: 'qi_luzhonglian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    // 名将→普将：④敌帅｜毕再遇开禧二年泗州、灵壁、六合竹镇之捷《宋史·毕再遇传》均未载金军主帅实名，六合守城仅载万户完颜蒲辣都（围城将领）；淮阴夜袭擒乌古伦帅勒等系遣统领许俊所为，非亲统（2026-11-04 主人令）
    song_bizaiyu: { generalId: 'song_bizaiyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    shu_mengda: { generalId: 'shu_mengda', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    ming_d_wuweizhong: { generalId: 'ming_d_wuweizhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    longwu_zhengzhilong: { generalId: 'longwu_zhengzhilong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    ming_d_tanlun: { generalId: 'ming_d_tanlun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：抗倭，敌无统帅具名，属治安战
    han_zhao_liuyao: { generalId: 'han_zhao_liuyao', tier: 'famous', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    song_lixianzhong: { generalId: 'song_lixianzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    taiping_yangxiuqing: { generalId: 'taiping_yangxiuqing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：坐镇调度，非第一线亲统决断者
    han_lubode: { generalId: 'han_lubode', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    wei_xuchu: { generalId: 'wei_xuchu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：纯武勇，无亲统战役级胜绩（铁律）
    chuguo_yangyouji: { generalId: 'chuguo_yangyouji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    chuguo_doubobi: { generalId: 'chuguo_doubobi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    chuguo_pandang: { generalId: 'chuguo_pandang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    shu_zhangyi: { generalId: 'shu_zhangyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    shu_hezhi: { generalId: 'shu_hezhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    shu_wulan: { generalId: 'shu_wulan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    cen_d_cenyunhan: { generalId: 'cen_d_cenyunhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },
    safawei_d_tahmasp: { generalId: 'safawei_d_tahmasp', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_394', atkDisadvantageSkillId: 'ts_179', defAdvantageSkillId: 'ts_390', defBalanceSkillId: 'ts_537', defDisadvantageSkillId: 'ts_635', aptitude: 'leverage', attackStyle: 'attack' },   // 🔴[2026-11-01 主人令·四闸复核] 名将→普将：无具名敌帅的战略级胜绩
    chu_sunfu: { generalId: 'chu_sunfu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：镇守庐陵，无够格亲统胜绩
    han_d_pengyue: { generalId: 'han_d_pengyue', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：梁地游击断楚粮道，然立论战役敌帅无实名

    shu_haopu: { generalId: 'shu_haopu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：守零陵有据，然终为吕蒙诱降，无战役级亲统胜绩
    wu_taohuang: { generalId: 'wu_taohuang', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：镇苍梧、平交广有实绩，然立论战役敌帅具名者无考
    han_d_wuyang: { generalId: 'han_d_wuyang', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：沅陵侯国镇守，无亲统战役级胜绩
    tuoba_weijingxin: { generalId: 'tuoba_weijingxin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：任东海太守镇守一方，无亲统战役级胜绩
    zhangchu_chensheng: { generalId: 'zhangchu_chensheng', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：起兵称王、攻陈有据，然无亲统的战役级实名敌帅胜绩
    desheng_liutong: { generalId: 'desheng_liutong', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：据郧阳称王有据，无亲统的战役级实名敌帅胜绩
    wuzhou_wangwenjin: { generalId: 'wuzhou_wangwenjin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：据婺州拒隋军，然终为杨素所破，无战役级胜绩
    liusong_tanshao: { generalId: 'liusong_tanshao', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：守琅邪、有平乱功，无亲统战役级实名敌帅胜绩
    ming_d_wanghuazhen: { generalId: 'ming_d_wanghuazhen', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 辽东巡抚驻广宁，天启二年广宁之战主帅，普将（弃城败绩，无够格胜仗）
    gaogouli_yangwanchun: { generalId: 'gaogouli_yangwanchun', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 安市城主，645 年守城击退唐太宗（《旧唐书·东夷传》），守将例外名将候选；技能待另行设计，先挂普将档
    gen_fernan_gonzalez: { generalId: 'gen_fernan_gonzalez', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 卡斯蒂利亚伯爵，以布尔戈斯为都，统一伯国并摆脱莱昂（10 世纪）；普将，待核实实名敌帅胜绩
    safuyi_daen: { generalId: 'safuyi_daen', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1706 年都灵围城守将（奥军将领受萨伏依公爵委任守城），守住至解围；守将例外名将候选，先挂普将档
    gen_geraldo_sem_pavor: { generalId: 'gen_geraldo_sem_pavor', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 1165 年夜袭夺埃武拉并镇守（英文维基 Geraldo Geraldes）；先挂普将档
    osman_muhtar_pasha: { generalId: 'osman_muhtar_pasha', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1877–78 俄土战争奥斯曼安纳托利亚军统帅，退守埃尔祖鲁姆；普将，待核实阿拉贾达格战役胜绩
    gaolu_tuweinuo: { generalId: 'gaolu_tuweinuo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1814 年巴约讷要塞总督，坚守至战争结束；普将，待核实战役胜绩（法兰西势力按势力时代归城堡档）
    xibanya_menacho: { generalId: 'xibanya_menacho', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1811 年巴达霍斯守将，守城战死；普将（城未守住）
    gen_ignacio_loyola: { generalId: 'gen_ignacio_loyola', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1521 年潘普洛纳城堡守军军官，守城负伤；普将（城破）
    saierweiya_xingeliqi: { generalId: 'saierweiya_xingeliqi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1809 年车加尔山战役塞尔维亚起义军指挥官，战死引爆火药桶；普将（战败殉职）
    xiwasi_burhandin: { generalId: 'xiwasi_burhandin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 卡迪布尔汉丁，1381 年起以锡瓦斯称苏丹，镇守并扩张安纳托利亚中部；普将，待核实实名敌帅胜绩
    mengguqieke_bahramshah: { generalId: 'mengguqieke_bahramshah', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 门古切克埃尔津詹支君主（约 1155–1225），以埃尔津詹为治所；普将
    malwan_ibn_marwan: { generalId: 'malwan_ibn_marwan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 穆瓦拉德首领，868 年据梅里达起事对抗科尔多瓦埃米尔，875 年建巴达霍斯；普将
    oda_kukiyoshitaka: { generalId: 'oda_kukiyoshitaka', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 志摩鸟羽城主，织田水军大将，木津川口铁甲船破毛利水军（1578）；先挂普将档
    putaoya_duarte_coelho: { generalId: 'putaoya_duarte_coelho', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 伯南布哥世袭领主，1537 年建奥林达并镇守至卒；普将
    xibanya_sarmiento: { generalId: 'xibanya_sarmiento', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 1584 年率殖民者在麦哲伦海峡建菲利普王城并任总督；普将（殖民地饿毙）
    xibanya_alvarado: { generalId: 'xibanya_alvarado', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 危地马拉总督，雷亚尔港造船备远征舰队（1540）；普将（待核实实名敌帅胜绩）
    xibanya_hurtado_mendoza: { generalId: 'xibanya_hurtado_mendoza', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 智利总督，1557 年重建康塞普西翁并败劳塔罗余部（阿劳科战争）；普将
    hojo_shimizuyasuhide: { generalId: 'hojo_shimizuyasuhide', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-05 补将] 北条家伊豆水军大将，1590 年守下田城抗丰臣水军（生卒年为主人令「编写大概」的估算）；普将
    sumuroyi_sumuroy: { generalId: 'sumuroyi_sumuroy', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 1649 年萨马岛起义领袖，帕拉帕格起事（生年为估算）；普将
    toyotomi_horiuchiujiyoshi: { generalId: 'toyotomi_horiuchiujiyoshi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 🔴 [2026-11-05 补将] 熊野水军领袖、新宫城主，归丰臣秀吉，镇守纪伊南端海域（生卒年为主人令「编写大概」的估算）；普将
    han_d_sunang: { generalId: 'han_d_sunang', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 🔴 [2026-11-01 补将] 普将：萧关防御战殉职，属局部殉城未改大局（守将例外反面）
    tang_malin: { generalId: 'tang_malin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    tang_duanxiushi: { generalId: 'tang_duanxiushi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    hou_liang_liuzhijun: { generalId: 'hou_liang_liuzhijun', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    song_weisheng: { generalId: 'song_weisheng', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_litongjie: { generalId: 'tang_litongjie', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    han_d_gengkui: { generalId: 'han_d_gengkui', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    han_d_cuishi: { generalId: 'han_d_cuishi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    liao_d_yelniehu: { generalId: 'liao_d_yelniehu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_zhanggongjin: { generalId: 'tang_zhanggongjin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    han_d_lianfan: { generalId: 'han_d_lianfan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    han_d_jiazong: { generalId: 'han_d_jiazong', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    han_d_wangbiao: { generalId: 'han_d_wangbiao', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_luoyi: { generalId: 'tang_luoyi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_zhaorongguo: { generalId: 'tang_zhaorongguo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    han_d_yiquanguo: { generalId: 'han_d_yiquanguo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    adiyabeina_yizhatesi: { generalId: 'adiyabeina_yizhatesi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    mazhaer_xiongyatilasiluo: { generalId: 'mazhaer_xiongyatilasiluo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    xila_hagenong: { generalId: 'xila_hagenong', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    xila_nixiyasi: { generalId: 'xila_nixiyasi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    xila_feiluokelisi: { generalId: 'xila_feiluokelisi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    baizanting_peiteluonasi: { generalId: 'baizanting_peiteluonasi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    bolan_aoboerqike: { generalId: 'bolan_aoboerqike', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    bolan_laishenqinsiji: { generalId: 'bolan_laishenqinsiji', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    ruidian_si_mona: { generalId: 'ruidian_si_mona', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    ruidian_si_lili: { generalId: 'ruidian_si_lili', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    luosi_siweinieerde: { generalId: 'luosi_siweinieerde', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    eluosi_diguo_pashenkefu: { generalId: 'eluosi_diguo_pashenkefu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    eluosi_diguo_bieketuofu: { generalId: 'eluosi_diguo_bieketuofu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    gesake_bulawen: { generalId: 'gesake_bulawen', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    litaowan_weishennieweiciji: { generalId: 'litaowan_weishennieweiciji', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    litaowan_dashenkeweiqi: { generalId: 'litaowan_dashenkeweiqi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    moerdaweiya_lepushenneiyanu: { generalId: 'moerdaweiya_lepushenneiyanu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    moerdaweiya_lupu: { generalId: 'moerdaweiya_lupu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    putaoya_meineisaisi: { generalId: 'putaoya_meineisaisi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    suolun_mabudai: { generalId: 'suolun_mabudai', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    manzhou_d_sabusu: { generalId: 'manzhou_d_sabusu', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    joseon_shenla: { generalId: 'joseon_shenla', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    joseon_liyi: { generalId: 'joseon_liyi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    joseon_jinxie: { generalId: 'joseon_jinxie', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    shunga_danatipo: { generalId: 'shunga_danatipo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    mowoer_sadatehan: { generalId: 'mowoer_sadatehan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    cueva_panjiyake: { generalId: 'cueva_panjiyake', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    han_d_wangji: { generalId: 'han_d_wangji', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_baizhizhen: { generalId: 'tang_baizhizhen', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    qianshu_wangzongshou: { generalId: 'qianshu_wangzongshou', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    tang_changhe: { generalId: 'tang_changhe', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_ligaoqian: { generalId: 'tang_ligaoqian', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    dali_gaoliangcheng: { generalId: 'dali_gaoliangcheng', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    tang_chendaci: { generalId: 'tang_chendaci', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    shu_wangsi: { generalId: 'shu_wangsi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_xianyushuming: { generalId: 'tang_xianyushuming', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    tang_guyanhui: { generalId: 'tang_guyanhui', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    manzhou_d_dongtianbi: { generalId: 'manzhou_d_dongtianbi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    tang_zhangchengjian: { generalId: 'tang_zhangchengjian', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_xiechongben: { generalId: 'tang_xiechongben', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    song_xielin: { generalId: 'song_xielin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将（四闸缺战略级实胜）
    song_zhangjianhou: { generalId: 'song_zhangjianhou', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    wuyue_caogui: { generalId: 'wuyue_caogui', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    wuyue_caoxin: { generalId: 'wuyue_caoxin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将（四闸缺战略级实胜）
    tang_tianjun: { generalId: 'tang_tianjun', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    tang_qinyan: { generalId: 'tang_qinyan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将（四闸缺战略级实胜）
    chalkidike_lasiteniesi: { generalId: 'chalkidike_lasiteniesi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    chalkidike_outikelatesi: { generalId: 'chalkidike_outikelatesi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    naxos_lgedamisi: { generalId: 'naxos_lgedamisi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    phokis_feiluomoluosi: { generalId: 'phokis_feiluomoluosi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将
    phokis_aonuomakusi: { generalId: 'phokis_aonuomakusi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将
    wuguobu_hunchang: { generalId: 'wuguobu_hunchang', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    jienei_keyikongboluo: { generalId: 'jienei_keyikongboluo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将
    balti_alixieerhan: { generalId: 'balti_alixieerhan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    qingyuan_yijun_ounanxi: { generalId: 'qingyuan_yijun_ounanxi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将
    zhenghe_yijun_huanghua: { generalId: 'zhenghe_yijun_huanghua', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将
    latin_empire_diaili: { generalId: 'latin_empire_diaili', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    anjou_luyisanshi: { generalId: 'anjou_luyisanshi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 补将·普将
    pisa_manfuleidi: { generalId: 'pisa_manfuleidi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    aqimeinide_aerxitesi: { generalId: 'aqimeinide_aerxitesi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    baizanting_likaliao: { generalId: 'baizanting_likaliao', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 补将·普将
    lagoniya_kelierlidasi: { generalId: 'lagoniya_kelierlidasi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    gaolu_wulixi: { generalId: 'gaolu_wulixi', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    yinggelan_yuehanjifade: { generalId: 'yinggelan_yuehanjifade', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 补将·普将
    // 🔴 [2026-11-03 补档案] 下面三条是「有将无档案」缺口的补齐：按史定六槽三势（优势＝攻战/胜战、均势＝敌战/混战、劣势＝并战/败战），tacticalSkillId 取攻·优势
    hulumusi_ata: { generalId: 'hulumusi_ata', tier: 'ordinary', tacticalSkillId: 'ts_289', advantageSkillId: 'ts_289', balanceSkillId: 'ts_1107', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_1107', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_065', defBalanceSkillId: 'ts_602', defDisadvantageSkillId: 'ts_320', aptitude: 'leverage', attackStyle: 'defense' },   // 阿塔（约1450–1512，忽鲁谟斯首相 Khwaja Ata）：1507 阿尔布克尔克率葡军攻霍尔木兹，阿塔主持增筑要塞、以舟师扼海峡并以谈判迫其退兵（1507 霍尔木兹之役）；以筑防守御为主、无野战实胜 → 普将（四闸缺「史载实胜」）；舟师＝戈船破阵，相持不战＝持重不战，孤城无援＝孤军殊死，要塞御敌＝凭坚摧锋/坚垒困敌/婴城拒逆
    bolinixiya_baomalei: { generalId: 'bolinixiya_baomalei', tier: 'ordinary', tacticalSkillId: 'ts_347', advantageSkillId: 'ts_347', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_347', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_374', defBalanceSkillId: 'ts_1109', defDisadvantageSkillId: 'ts_263', aptitude: 'leverage', attackStyle: 'balanced' },   // 波马雷（波马雷一世，约1742–1803）：借欧洲火器与部族联姻结盟，渡海征讨统一大溪地诸部、建波马雷王朝；统一之功多属结盟与局部战、对阵名号不彰 → 普将（③④闸存疑）；渡海夺岛＝泛海夺城，山谷诱伏＝诱锋入伏，绝境求生＝死地后生，守岛保民＝据险保民/结垒相持/婴城挫众
    yinggelan_henlimogen: { generalId: 'yinggelan_henlimogen', tier: 'famous', tacticalSkillId: 'ts_208', advantageSkillId: 'ts_208', balanceSkillId: 'ts_346', disadvantageSkillId: 'ts_518', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_346', atkDisadvantageSkillId: 'ts_518', defAdvantageSkillId: 'ts_780', defBalanceSkillId: 'ts_757', defDisadvantageSkillId: 'ts_104', aptitude: 'create', attackStyle: 'attack' },   // 亨利·摩根（1635–1688）：1668 夜袭波托贝洛、1669 马拉开波湖以火船破西班牙分舰队、1671 横越地峡取巴拿马；后任牙买加副总督整饬皇家港海防拒法西 → 名将（亲统决断/史载实胜/格局分量/对阵有名四闸齐备）；夜袭坚城＝夜拔坚城，火船破舰＝火矢焚舟，焚舟死战，海防＝金城御海，堡垒＝壁垒森严，负险固守

    mulabite_abubakr: { generalId: 'mulabite_abubakr', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 阿布贝克尔·普将
    inca_apocamac: { generalId: 'inca_apocamac', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 阿波卡马克·普将
    xibanya_cordoba: { generalId: 'xibanya_cordoba', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 科尔多瓦·普将
    xibanya_jufre: { generalId: 'xibanya_jufre', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 胡弗雷·普将
    putaoya_raposo: { generalId: 'putaoya_raposo', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 拉波索·普将
    ayoubu_turanshah: { generalId: 'ayoubu_turanshah', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 图兰沙·普将
    bolinixiya_isokelekel: { generalId: 'bolinixiya_isokelekel', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'attack' },   // 伊索克勒克尔·普将
    yinggelan_somers: { generalId: 'yinggelan_somers', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'balanced' },   // 萨默斯·普将
    toyotomi_asai_chacha: { generalId: 'toyotomi_asai_chacha', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },   // 浅井茶茶（淀殿）：普将，守城向（大坂城之阵）
    // ── 2026-11-08 知名战敌将（普将）──
    ruidian_gustav: { generalId: 'ruidian_gustav', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    luoma_catulus: { generalId: 'luoma_catulus', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_harold_godwinson: { generalId: 'bfe_harold_godwinson', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_mstislav_kiev: { generalId: 'bfe_mstislav_kiev', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_xiaotalin: { generalId: 'bfe_xiaotalin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_fu_rui: { generalId: 'bfe_fu_rui', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_alutai: { generalId: 'bfe_alutai', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_yao_shao: { generalId: 'bfe_yao_shao', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_chen_jingxuan: { generalId: 'bfe_chen_jingxuan', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_tran_duc_tong: { generalId: 'bfe_tran_duc_tong', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_wang_lin: { generalId: 'bfe_wang_lin', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_liu_shang: { generalId: 'bfe_liu_shang', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    bfe_shoni_yorihisa: { generalId: 'bfe_shoni_yorihisa', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    qin_huigong: { generalId: 'qin_huigong', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    rouran_doulun: { generalId: 'rouran_doulun', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    xianbei_ruoluobaneng: { generalId: 'xianbei_ruoluobaneng', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    mowoer_ramsingh: { generalId: 'mowoer_ramsingh', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    manding_mahmud_iii: { generalId: 'manding_mahmud_iii', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    womaya_hubayra: { generalId: 'womaya_hubayra', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    ladakh_dedannanjie: { generalId: 'ladakh_dedannanjie', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_008', balanceSkillId: 'ts_1101', disadvantageSkillId: 'ts_019', atkAdvantageSkillId: 'ts_008', atkBalanceSkillId: 'ts_1101', atkDisadvantageSkillId: 'ts_019', defAdvantageSkillId: 'ts_004', defBalanceSkillId: 'ts_024', defDisadvantageSkillId: 'ts_002', aptitude: 'leverage', attackStyle: 'defense' },
    yaqi_yisikanda: { generalId: 'yaqi_yisikanda', tier: 'common', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_001', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_822', aptitude: 'normal', attackStyle: 'attack' },
    malindi_bashiri: { generalId: 'malindi_bashiri', tier: 'common', tacticalSkillId: 'ts_002', advantageSkillId: 'ts_002', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_822', aptitude: 'normal', attackStyle: 'defense' },
    aquidan_odo: { generalId: 'aquidan_odo', tier: 'common', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_003', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_357', defBalanceSkillId: 'ts_299', defDisadvantageSkillId: 'ts_822', aptitude: 'normal', attackStyle: 'defense' },
};



export function getGeneralProfile(generalId: string | undefined): GeneralProfile | null {

    if (!generalId) return null;

    // 🔴 [2026-10-16 主人定] 剧本期不在「登场年～卒年」内 → 按普通武将：无武将技、不算名将（乱斗不受影响）
    if (!isGeneralOnStage(generalId)) return null;

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
