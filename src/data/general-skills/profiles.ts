/**
 * 武将技 · 将领装配档案（从 GeneralSkills.ts 拆出，2026-07-13）
 * ★ 批量工具/脚本唯一允许写入的文件；类型与目录在 types.ts / catalogs.ts，写坏本文件不伤及它们。
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

    qin: { generalId: 'qin', tier: 'ordinary', tacticalSkillId: 'ts_283', advantageSkillId: 'ts_069', balanceSkillId: 'ts_072', disadvantageSkillId: 'ts_073', atkAdvantageSkillId: 'ts_020', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_027', defAdvantageSkillId: 'ts_028', defBalanceSkillId: 'ts_029', defDisadvantageSkillId: 'ts_051', aptitude: 'create' },

    tang: { generalId: 'tang', tier: 'ordinary', tacticalSkillId: 'ts_088', advantageSkillId: 'ts_311', balanceSkillId: 'ts_735', disadvantageSkillId: 'ts_085', atkAdvantageSkillId: 'ts_259', atkBalanceSkillId: 'ts_698', atkDisadvantageSkillId: 'ts_075', defAdvantageSkillId: 'ts_466', defBalanceSkillId: 'ts_080', defDisadvantageSkillId: 'ts_082', aptitude: 'create' },

    wuzhou_d: { generalId: 'wuzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_102', balanceSkillId: 'ts_103', disadvantageSkillId: 'ts_118', atkAdvantageSkillId: 'ts_093', atkBalanceSkillId: 'ts_107', atkDisadvantageSkillId: 'ts_108', defAdvantageSkillId: 'ts_109', defBalanceSkillId: 'ts_097', defDisadvantageSkillId: 'ts_098', aptitude: 'create' },

    ming_d: { generalId: 'ming_d', tier: 'ordinary', tacticalSkillId: 'ts_280', advantageSkillId: 'ts_131', balanceSkillId: 'ts_134', disadvantageSkillId: 'ts_135', atkAdvantageSkillId: 'ts_119', atkBalanceSkillId: 'ts_121', atkDisadvantageSkillId: 'ts_124', defAdvantageSkillId: 'ts_126', defBalanceSkillId: 'ts_128', defDisadvantageSkillId: 'ts_130', aptitude: 'create' },

    jinling: { generalId: 'jinling', tier: 'ordinary', tacticalSkillId: 'ts_262', advantageSkillId: 'ts_152', balanceSkillId: 'ts_153', disadvantageSkillId: 'ts_154', atkAdvantageSkillId: 'ts_139', atkBalanceSkillId: 'ts_141', atkDisadvantageSkillId: 'ts_142', defAdvantageSkillId: 'ts_146', defBalanceSkillId: 'ts_147', defDisadvantageSkillId: 'ts_148', aptitude: 'create' },

    guangzhou: { generalId: 'guangzhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_165', balanceSkillId: 'ts_166', disadvantageSkillId: 'ts_167', atkAdvantageSkillId: 'ts_157', atkBalanceSkillId: 'ts_158', atkDisadvantageSkillId: 'ts_160', defAdvantageSkillId: 'ts_161', defBalanceSkillId: 'ts_162', defDisadvantageSkillId: 'ts_163', aptitude: 'create' },

    shu: { generalId: 'shu', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_180', balanceSkillId: 'ts_181', disadvantageSkillId: 'ts_492', atkAdvantageSkillId: 'ts_168', atkBalanceSkillId: 'ts_170', atkDisadvantageSkillId: 'ts_349', defAdvantageSkillId: 'ts_176', defBalanceSkillId: 'ts_179', defDisadvantageSkillId: 'ts_443', aptitude: 'create' },

    yangzhou: { generalId: 'yangzhou', tier: 'ordinary', tacticalSkillId: 'ts_169', advantageSkillId: 'ts_191', balanceSkillId: 'ts_193', disadvantageSkillId: 'ts_194', atkAdvantageSkillId: 'ts_356', atkBalanceSkillId: 'ts_182', atkDisadvantageSkillId: 'ts_184', defAdvantageSkillId: 'ts_186', defBalanceSkillId: 'ts_187', defDisadvantageSkillId: 'ts_188', aptitude: 'create' },

    yang_zhou: { generalId: 'yang_zhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_204', balanceSkillId: 'ts_206', disadvantageSkillId: 'ts_208', atkAdvantageSkillId: 'ts_197', atkBalanceSkillId: 'ts_198', atkDisadvantageSkillId: 'ts_199', defAdvantageSkillId: 'ts_200', defBalanceSkillId: 'ts_201', defDisadvantageSkillId: 'ts_202', aptitude: 'create' },

    liang_d: { generalId: 'liang_d', tier: 'ordinary', tacticalSkillId: 'ts_033', advantageSkillId: 'ts_231', balanceSkillId: 'ts_233', disadvantageSkillId: 'ts_470', atkAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_487', atkDisadvantageSkillId: 'ts_385', defAdvantageSkillId: 'ts_227', defBalanceSkillId: 'ts_230', defDisadvantageSkillId: 'ts_299', aptitude: 'create' },

    qiuci: { generalId: 'qiuci', tier: 'ordinary', tacticalSkillId: 'ts_002', advantageSkillId: 'ts_245', balanceSkillId: 'ts_249', disadvantageSkillId: 'ts_251', atkAdvantageSkillId: 'ts_236', atkBalanceSkillId: 'ts_237', atkDisadvantageSkillId: 'ts_239', defAdvantageSkillId: 'ts_240', defBalanceSkillId: 'ts_241', defDisadvantageSkillId: 'ts_243', aptitude: 'create' },

    tubo: { generalId: 'tubo', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_261', balanceSkillId: 'ts_267', disadvantageSkillId: 'ts_269', atkAdvantageSkillId: 'ts_253', atkBalanceSkillId: 'ts_254', atkDisadvantageSkillId: 'ts_255', defAdvantageSkillId: 'ts_256', defBalanceSkillId: 'ts_257', defDisadvantageSkillId: 'ts_260', aptitude: 'create' },

    menggu_d: { generalId: 'menggu_d', tier: 'ordinary', tacticalSkillId: 'ts_059', advantageSkillId: 'ts_354', balanceSkillId: 'ts_277', disadvantageSkillId: 'ts_281', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_272', atkDisadvantageSkillId: 'ts_273', defAdvantageSkillId: 'ts_274', defBalanceSkillId: 'ts_275', defDisadvantageSkillId: 'ts_276', aptitude: 'create' },

    bohai: { generalId: 'bohai', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_293', balanceSkillId: 'ts_294', disadvantageSkillId: 'ts_300', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_285', atkDisadvantageSkillId: 'ts_286', defAdvantageSkillId: 'ts_289', defBalanceSkillId: 'ts_290', defDisadvantageSkillId: 'ts_292', aptitude: 'create' },

    goryeo: { generalId: 'goryeo', tier: 'ordinary', tacticalSkillId: 'ts_005', advantageSkillId: 'ts_309', balanceSkillId: 'ts_312', disadvantageSkillId: 'ts_315', atkAdvantageSkillId: 'ts_301', atkBalanceSkillId: 'ts_302', atkDisadvantageSkillId: 'ts_303', defAdvantageSkillId: 'ts_304', defBalanceSkillId: 'ts_305', defDisadvantageSkillId: 'ts_308', aptitude: 'create' },

    ashikaga: { generalId: 'ashikaga', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_325', balanceSkillId: 'ts_326', disadvantageSkillId: 'ts_328', atkAdvantageSkillId: 'ts_316', atkBalanceSkillId: 'ts_317', atkDisadvantageSkillId: 'ts_319', defAdvantageSkillId: 'ts_321', defBalanceSkillId: 'ts_322', defDisadvantageSkillId: 'ts_324', aptitude: 'create' },

    tiemuer: { generalId: 'tiemuer', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_338', balanceSkillId: 'ts_339', disadvantageSkillId: 'ts_340', atkAdvantageSkillId: 'ts_329', atkBalanceSkillId: 'ts_331', atkDisadvantageSkillId: 'ts_332', defAdvantageSkillId: 'ts_333', defBalanceSkillId: 'ts_335', defDisadvantageSkillId: 'ts_337', aptitude: 'create' },

    siam: { generalId: 'siam', tier: 'ordinary', tacticalSkillId: 'ts_129', advantageSkillId: 'ts_350', balanceSkillId: 'ts_351', disadvantageSkillId: 'ts_352', atkAdvantageSkillId: 'ts_343', atkBalanceSkillId: 'ts_344', atkDisadvantageSkillId: 'ts_345', defAdvantageSkillId: 'ts_346', defBalanceSkillId: 'ts_347', defDisadvantageSkillId: 'ts_348', aptitude: 'create' },

    shang: { generalId: 'shang', tier: 'ordinary', tacticalSkillId: 'ts_007', advantageSkillId: 'ts_365', balanceSkillId: 'ts_366', disadvantageSkillId: 'ts_367', atkAdvantageSkillId: 'ts_355', atkBalanceSkillId: 'ts_357', atkDisadvantageSkillId: 'ts_359', defAdvantageSkillId: 'ts_362', defBalanceSkillId: 'ts_363', defDisadvantageSkillId: 'ts_364', aptitude: 'create' },

    bing: { generalId: 'bing', tier: 'ordinary', tacticalSkillId: 'ts_223', advantageSkillId: 'ts_376', balanceSkillId: 'ts_377', disadvantageSkillId: 'ts_378', atkAdvantageSkillId: 'ts_368', atkBalanceSkillId: 'ts_370', atkDisadvantageSkillId: 'ts_371', defAdvantageSkillId: 'ts_372', defBalanceSkillId: 'ts_373', defDisadvantageSkillId: 'ts_375', aptitude: 'create' },

    min: { generalId: 'min', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_462', balanceSkillId: 'ts_463', disadvantageSkillId: 'ts_464', atkAdvantageSkillId: 'ts_379', atkBalanceSkillId: 'ts_380', atkDisadvantageSkillId: 'ts_382', defAdvantageSkillId: 'ts_383', defBalanceSkillId: 'ts_384', defDisadvantageSkillId: 'ts_386', aptitude: 'create' },

    quanzhou: { generalId: 'quanzhou', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_473', balanceSkillId: 'ts_474', disadvantageSkillId: 'ts_475', atkAdvantageSkillId: 'ts_465', atkBalanceSkillId: 'ts_467', atkDisadvantageSkillId: 'ts_468', defAdvantageSkillId: 'ts_469', defBalanceSkillId: 'ts_471', defDisadvantageSkillId: 'ts_472', aptitude: 'create' },

    han_d: { generalId: 'han_d', tier: 'ordinary', tacticalSkillId: 'ts_067', advantageSkillId: 'ts_478', balanceSkillId: 'ts_479', disadvantageSkillId: 'ts_596', atkAdvantageSkillId: 'ts_636', atkBalanceSkillId: 'ts_720', atkDisadvantageSkillId: 'ts_506', defAdvantageSkillId: 'ts_476', defBalanceSkillId: 'ts_477', defDisadvantageSkillId: 'ts_497', aptitude: 'create' },

    wei: { generalId: 'wei', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_488', balanceSkillId: 'ts_489', disadvantageSkillId: 'ts_490', atkAdvantageSkillId: 'ts_480', atkBalanceSkillId: 'ts_481', atkDisadvantageSkillId: 'ts_483', defAdvantageSkillId: 'ts_484', defBalanceSkillId: 'ts_485', defDisadvantageSkillId: 'ts_486', aptitude: 'create' },

    manzhou_d: { generalId: 'manzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_327', advantageSkillId: 'ts_500', balanceSkillId: 'ts_501', disadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_493', atkBalanceSkillId: 'ts_494', atkDisadvantageSkillId: 'ts_495', defAdvantageSkillId: 'ts_496', defBalanceSkillId: 'ts_784', defDisadvantageSkillId: 'ts_498', aptitude: 'create' },

    xinluo: { generalId: 'xinluo', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_511', balanceSkillId: 'ts_512', disadvantageSkillId: 'ts_513', atkAdvantageSkillId: 'ts_503', atkBalanceSkillId: 'ts_504', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_507', defBalanceSkillId: 'ts_508', defDisadvantageSkillId: 'ts_510', aptitude: 'create' },

    edo: { generalId: 'edo', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_520', balanceSkillId: 'ts_521', disadvantageSkillId: 'ts_522', atkAdvantageSkillId: 'ts_514', atkBalanceSkillId: 'ts_515', atkDisadvantageSkillId: 'ts_516', defAdvantageSkillId: 'ts_517', defBalanceSkillId: 'ts_518', defDisadvantageSkillId: 'ts_519', aptitude: 'create' },

    seljuq: { generalId: 'seljuq', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_529', balanceSkillId: 'ts_531', disadvantageSkillId: 'ts_532', atkAdvantageSkillId: 'ts_523', atkBalanceSkillId: 'ts_524', atkDisadvantageSkillId: 'ts_525', defAdvantageSkillId: 'ts_526', defBalanceSkillId: 'ts_527', defDisadvantageSkillId: 'ts_528', aptitude: 'create' },

    chenla: { generalId: 'chenla', tier: 'ordinary', tacticalSkillId: 'ts_122', advantageSkillId: 'ts_542', balanceSkillId: 'ts_543', disadvantageSkillId: 'ts_544', atkAdvantageSkillId: 'ts_536', atkBalanceSkillId: 'ts_537', atkDisadvantageSkillId: 'ts_538', defAdvantageSkillId: 'ts_539', defBalanceSkillId: 'ts_540', defDisadvantageSkillId: 'ts_541', aptitude: 'create' },

    sizhou: { generalId: 'sizhou', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_551', balanceSkillId: 'ts_552', disadvantageSkillId: 'ts_553', atkAdvantageSkillId: 'ts_545', atkBalanceSkillId: 'ts_546', atkDisadvantageSkillId: 'ts_547', defAdvantageSkillId: 'ts_548', defBalanceSkillId: 'ts_549', defDisadvantageSkillId: 'ts_550', aptitude: 'create' },

    echigo: { generalId: 'echigo', tier: 'ordinary', tacticalSkillId: 'ts_171', advantageSkillId: 'ts_571', balanceSkillId: 'ts_572', disadvantageSkillId: 'ts_573', atkAdvantageSkillId: 'ts_565', atkBalanceSkillId: 'ts_566', atkDisadvantageSkillId: 'ts_567', defAdvantageSkillId: 'ts_568', defBalanceSkillId: 'ts_569', defDisadvantageSkillId: 'ts_570', aptitude: 'create' },

    hashiba: { generalId: 'hashiba', tier: 'ordinary', tacticalSkillId: 'ts_246', advantageSkillId: 'ts_581', balanceSkillId: 'ts_582', disadvantageSkillId: 'ts_583', atkAdvantageSkillId: 'ts_574', atkBalanceSkillId: 'ts_575', atkDisadvantageSkillId: 'ts_576', defAdvantageSkillId: 'ts_577', defBalanceSkillId: 'ts_578', defDisadvantageSkillId: 'ts_579', aptitude: 'create' },

    sanada_d: { generalId: 'sanada_d', tier: 'ordinary', tacticalSkillId: 'ts_156', advantageSkillId: 'ts_592', balanceSkillId: 'ts_593', disadvantageSkillId: 'ts_594', atkAdvantageSkillId: 'ts_584', atkBalanceSkillId: 'ts_586', atkDisadvantageSkillId: 'ts_587', defAdvantageSkillId: 'ts_588', defBalanceSkillId: 'ts_589', defDisadvantageSkillId: 'ts_591', aptitude: 'create' },

    date_d: { generalId: 'date_d', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_602', balanceSkillId: 'ts_603', disadvantageSkillId: 'ts_604', atkAdvantageSkillId: 'ts_595', atkBalanceSkillId: 'ts_597', atkDisadvantageSkillId: 'ts_598', defAdvantageSkillId: 'ts_599', defBalanceSkillId: 'ts_600', defDisadvantageSkillId: 'ts_601', aptitude: 'create' },

    owari: { generalId: 'owari', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_614', balanceSkillId: 'ts_615', disadvantageSkillId: 'ts_616', atkAdvantageSkillId: 'ts_605', atkBalanceSkillId: 'ts_607', atkDisadvantageSkillId: 'ts_608', defAdvantageSkillId: 'ts_610', defBalanceSkillId: 'ts_612', defDisadvantageSkillId: 'ts_613', aptitude: 'create' },

    totomi: { generalId: 'totomi', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_626', balanceSkillId: 'ts_630', disadvantageSkillId: 'ts_631', atkAdvantageSkillId: 'ts_617', atkBalanceSkillId: 'ts_619', atkDisadvantageSkillId: 'ts_620', defAdvantageSkillId: 'ts_622', defBalanceSkillId: 'ts_623', defDisadvantageSkillId: 'ts_625', aptitude: 'create' },

    jinchuan: { generalId: 'jinchuan', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_640', balanceSkillId: 'ts_641', disadvantageSkillId: 'ts_643', atkAdvantageSkillId: 'ts_632', atkBalanceSkillId: 'ts_633', atkDisadvantageSkillId: 'ts_634', defAdvantageSkillId: 'ts_635', defBalanceSkillId: 'ts_637', defDisadvantageSkillId: 'ts_638', aptitude: 'create' },

    aki: { generalId: 'aki', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_655', balanceSkillId: 'ts_658', disadvantageSkillId: 'ts_659', atkAdvantageSkillId: 'ts_644', atkBalanceSkillId: 'ts_646', atkDisadvantageSkillId: 'ts_649', defAdvantageSkillId: 'ts_650', defBalanceSkillId: 'ts_652', defDisadvantageSkillId: 'ts_653', aptitude: 'create' },

    chosokabe: { generalId: 'chosokabe', tier: 'ordinary', tacticalSkillId: 'ts_235', advantageSkillId: 'ts_674', balanceSkillId: 'ts_676', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_661', atkBalanceSkillId: 'ts_664', atkDisadvantageSkillId: 'ts_665', defAdvantageSkillId: 'ts_667', defBalanceSkillId: 'ts_670', defDisadvantageSkillId: 'ts_671', aptitude: 'create' },

    satsuma: { generalId: 'satsuma', tier: 'ordinary', tacticalSkillId: 'ts_018', advantageSkillId: 'ts_389', balanceSkillId: 'ts_390', disadvantageSkillId: 'ts_391', atkAdvantageSkillId: 'ts_678', atkBalanceSkillId: 'ts_679', atkDisadvantageSkillId: 'ts_680', defAdvantageSkillId: 'ts_681', defBalanceSkillId: 'ts_682', defDisadvantageSkillId: 'ts_684', aptitude: 'create' },

    otomo_d: { generalId: 'otomo_d', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_411', balanceSkillId: 'ts_414', disadvantageSkillId: 'ts_415', atkAdvantageSkillId: 'ts_394', atkBalanceSkillId: 'ts_398', atkDisadvantageSkillId: 'ts_399', defAdvantageSkillId: 'ts_400', defBalanceSkillId: 'ts_401', defDisadvantageSkillId: 'ts_408', aptitude: 'create' },

    izumo: { generalId: 'izumo', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_422', balanceSkillId: 'ts_423', disadvantageSkillId: 'ts_424', atkAdvantageSkillId: 'ts_416', atkBalanceSkillId: 'ts_417', atkDisadvantageSkillId: 'ts_418', defAdvantageSkillId: 'ts_419', defBalanceSkillId: 'ts_420', defDisadvantageSkillId: 'ts_421', aptitude: 'create' },

    kaga_d: { generalId: 'kaga_d', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_432', balanceSkillId: 'ts_433', disadvantageSkillId: 'ts_434', atkAdvantageSkillId: 'ts_426', atkBalanceSkillId: 'ts_427', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_429', defBalanceSkillId: 'ts_430', defDisadvantageSkillId: 'ts_431', aptitude: 'create' },

    iga_d: { generalId: 'iga_d', tier: 'ordinary', tacticalSkillId: 'ts_778', advantageSkillId: 'ts_444', balanceSkillId: 'ts_445', disadvantageSkillId: 'ts_446', atkAdvantageSkillId: 'ts_435', atkBalanceSkillId: 'ts_436', atkDisadvantageSkillId: 'ts_437', defAdvantageSkillId: 'ts_438', defBalanceSkillId: 'ts_440', defDisadvantageSkillId: 'ts_441', aptitude: 'create' },

    jibei2: { generalId: 'jibei2', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_455', balanceSkillId: 'ts_456', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_447', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_449', defAdvantageSkillId: 'ts_450', defBalanceSkillId: 'ts_451', defDisadvantageSkillId: 'ts_452', aptitude: 'create' },

    yamato: { generalId: 'yamato', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_689', balanceSkillId: 'ts_690', disadvantageSkillId: 'ts_691', atkAdvantageSkillId: 'ts_458', atkBalanceSkillId: 'ts_459', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_461', defBalanceSkillId: 'ts_687', defDisadvantageSkillId: 'ts_688', aptitude: 'create' },

    aizu: { generalId: 'aizu', tier: 'ordinary', tacticalSkillId: 'ts_136', advantageSkillId: 'ts_699', balanceSkillId: 'ts_700', disadvantageSkillId: 'ts_701', atkAdvantageSkillId: 'ts_692', atkBalanceSkillId: 'ts_693', atkDisadvantageSkillId: 'ts_694', defAdvantageSkillId: 'ts_695', defBalanceSkillId: 'ts_696', defDisadvantageSkillId: 'ts_697', aptitude: 'create' },

    suwa_d: { generalId: 'suwa_d', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_723', balanceSkillId: 'ts_724', disadvantageSkillId: 'ts_725', atkAdvantageSkillId: 'ts_708', atkBalanceSkillId: 'ts_710', atkDisadvantageSkillId: 'ts_715', defAdvantageSkillId: 'ts_719', defBalanceSkillId: 'ts_721', defDisadvantageSkillId: 'ts_722', aptitude: 'create' },

    shimotsuke: { generalId: 'shimotsuke', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_733', balanceSkillId: 'ts_734', disadvantageSkillId: 'ts_736', atkAdvantageSkillId: 'ts_726', atkBalanceSkillId: 'ts_727', atkDisadvantageSkillId: 'ts_728', defAdvantageSkillId: 'ts_729', defBalanceSkillId: 'ts_730', defDisadvantageSkillId: 'ts_732', aptitude: 'create' },

    higo_d: { generalId: 'higo_d', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_746', balanceSkillId: 'ts_747', disadvantageSkillId: 'ts_748', atkAdvantageSkillId: 'ts_738', atkBalanceSkillId: 'ts_740', atkDisadvantageSkillId: 'ts_742', defAdvantageSkillId: 'ts_743', defBalanceSkillId: 'ts_744', defDisadvantageSkillId: 'ts_745', aptitude: 'create' },

    iyo_d: { generalId: 'iyo_d', tier: 'ordinary', tacticalSkillId: 'ts_439', advantageSkillId: 'ts_757', balanceSkillId: 'ts_758', disadvantageSkillId: 'ts_759', atkAdvantageSkillId: 'ts_749', atkBalanceSkillId: 'ts_750', atkDisadvantageSkillId: 'ts_751', defAdvantageSkillId: 'ts_752', defBalanceSkillId: 'ts_753', defDisadvantageSkillId: 'ts_754', aptitude: 'create' },

    nanbu: { generalId: 'nanbu', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_766', balanceSkillId: 'ts_767', disadvantageSkillId: 'ts_769', atkAdvantageSkillId: 'ts_760', atkBalanceSkillId: 'ts_761', atkDisadvantageSkillId: 'ts_762', defAdvantageSkillId: 'ts_763', defBalanceSkillId: 'ts_764', defDisadvantageSkillId: 'ts_765', aptitude: 'create' },

    osumi: { generalId: 'osumi', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_779', balanceSkillId: 'ts_780', disadvantageSkillId: 'ts_782', atkAdvantageSkillId: 'ts_770', atkBalanceSkillId: 'ts_772', atkDisadvantageSkillId: 'ts_773', defAdvantageSkillId: 'ts_774', defBalanceSkillId: 'ts_775', defDisadvantageSkillId: 'ts_776', aptitude: 'create' },

    fujiwara: { generalId: 'fujiwara', tier: 'ordinary', tacticalSkillId: 'ts_031', advantageSkillId: 'ts_795', balanceSkillId: 'ts_802', disadvantageSkillId: 'ts_808', atkAdvantageSkillId: 'ts_783', atkBalanceSkillId: 'ts_785', atkDisadvantageSkillId: 'ts_786', defAdvantageSkillId: 'ts_788', defBalanceSkillId: 'ts_790', defDisadvantageSkillId: 'ts_794', aptitude: 'create' },

    kakizaki: { generalId: 'kakizaki', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_609', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_809', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    ayinu: { generalId: 'ayinu', tier: 'ordinary', tacticalSkillId: 'ts_711', advantageSkillId: 'ts_036', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    so: { generalId: 'so', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_010', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_062', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    taira: { generalId: 'taira', tier: 'ordinary', tacticalSkillId: 'ts_629', advantageSkillId: 'ts_609', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

        lelang: { generalId: 'lelang', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_002', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    anmei: { generalId: 'anmei', tier: 'ordinary', tacticalSkillId: 'ts_716', advantageSkillId: 'ts_801', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    joseon: { generalId: 'joseon', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_036', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    gaogouli: { generalId: 'gaogouli', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_053', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    baiji: { generalId: 'baiji', tier: 'ordinary', tacticalSkillId: 'ts_482', advantageSkillId: 'ts_392', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    zhen: { generalId: 'zhen', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_660', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    danluo: { generalId: 'danluo', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_001', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    sambyeol: { generalId: 'sambyeol', tier: 'ordinary', tacticalSkillId: 'ts_060', advantageSkillId: 'ts_648', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    hai2: { generalId: 'hai2', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_077', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    gaya: { generalId: 'gaya', tier: 'ordinary', tacticalSkillId: 'ts_673', advantageSkillId: 'ts_618', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    naju_d: { generalId: 'naju_d', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_702', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    chungju_d: { generalId: 'chungju_d', tier: 'ordinary', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_666', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    sabeol: { generalId: 'sabeol', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_609', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

        huimo: { generalId: 'huimo', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_621', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    aola: { generalId: 'aola', tier: 'ordinary', tacticalSkillId: 'ts_533', advantageSkillId: 'ts_618', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    ewenki: { generalId: 'ewenki', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_003', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    haixi_nvzhen: { generalId: 'haixi_nvzhen', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_406', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    dazhen: { generalId: 'dazhen', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_657', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    yehe: { generalId: 'yehe', tier: 'ordinary', tacticalSkillId: 'ts_042', advantageSkillId: 'ts_397', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    qidan: { generalId: 'qidan', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_609', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_205', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    hui: { generalId: 'hui', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_010', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    nuergan: { generalId: 'nuergan', tier: 'ordinary', tacticalSkillId: 'ts_045', advantageSkillId: 'ts_397', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    manzhou: { generalId: 'manzhou', tier: 'ordinary', tacticalSkillId: 'ts_046', advantageSkillId: 'ts_032', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    fuyu: { generalId: 'fuyu', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_618', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_374', aptitude: 'create' },

    dajin: { generalId: 'dajin', tier: 'ordinary', tacticalSkillId: 'ts_057', advantageSkillId: 'ts_002', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    yizhou: { generalId: 'yizhou', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_702', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    aisin_d: { generalId: 'aisin_d', tier: 'ordinary', tacticalSkillId: 'ts_330', advantageSkillId: 'ts_246', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    xianbei: { generalId: 'xianbei', tier: 'ordinary', tacticalSkillId: 'ts_048', advantageSkillId: 'ts_392', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    suolun: { generalId: 'suolun', tier: 'ordinary', tacticalSkillId: 'ts_053', advantageSkillId: 'ts_392', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    dongxia: { generalId: 'dongxia', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_002', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    wula: { generalId: 'wula', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_036', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    dada_ming: { generalId: 'dada_ming', tier: 'ordinary', tacticalSkillId: 'ts_132', advantageSkillId: 'ts_021', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    keerqin: { generalId: 'keerqin', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_021', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    wure: { generalId: 'wure', tier: 'ordinary', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_657', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    houliao: { generalId: 'houliao', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_032', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    heishui: { generalId: 'heishui', tier: 'ordinary', tacticalSkillId: 'ts_077', advantageSkillId: 'ts_010', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    heisha_d: { generalId: 'heisha_d', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_702', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    hezhe: { generalId: 'hezhe', tier: 'ordinary', tacticalSkillId: 'ts_777', advantageSkillId: 'ts_392', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    dawoer: { generalId: 'dawoer', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_392', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    mohe: { generalId: 'mohe', tier: 'ordinary', tacticalSkillId: 'ts_067', advantageSkillId: 'ts_039', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    yeren_nvzhen: { generalId: 'yeren_nvzhen', tier: 'ordinary', tacticalSkillId: 'ts_114', advantageSkillId: 'ts_627', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    wuji: { generalId: 'wuji', tier: 'ordinary', tacticalSkillId: 'ts_096', advantageSkillId: 'ts_077', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    jilin: { generalId: 'jilin', tier: 'ordinary', tacticalSkillId: 'ts_777', advantageSkillId: 'ts_021', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    dongdan: { generalId: 'dongdan', tier: 'ordinary', tacticalSkillId: 'ts_099', advantageSkillId: 'ts_406', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    kuye: { generalId: 'kuye', tier: 'ordinary', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_021', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    sushen: { generalId: 'sushen', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_657', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yilou: { generalId: 'yilou', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_041', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    maomingan: { generalId: 'maomingan', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_739', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    jilimi: { generalId: 'jilimi', tier: 'ordinary', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_003', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    eluoke: { generalId: 'eluoke', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_032', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    nifuhe: { generalId: 'nifuhe', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_036', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    feiyaka: { generalId: 'feiyaka', tier: 'ordinary', tacticalSkillId: 'ts_195', advantageSkillId: 'ts_070', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    nanai: { generalId: 'nanai', tier: 'ordinary', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_032', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    woju: { generalId: 'woju', tier: 'ordinary', tacticalSkillId: 'ts_209', advantageSkillId: 'ts_392', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    luzhou: { generalId: 'luzhou', tier: 'ordinary', tacticalSkillId: 'ts_388', advantageSkillId: 'ts_040', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    jurchen: { generalId: 'jurchen', tier: 'ordinary', tacticalSkillId: 'ts_358', advantageSkillId: 'ts_003', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    ashina: { generalId: 'ashina', tier: 'ordinary', tacticalSkillId: 'ts_220', advantageSkillId: 'ts_657', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    wala: { generalId: 'wala', tier: 'ordinary', tacticalSkillId: 'ts_585', advantageSkillId: 'ts_609', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    yuwen: { generalId: 'yuwen', tier: 'ordinary', tacticalSkillId: 'ts_081', advantageSkillId: 'ts_005', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    chenli_d: { generalId: 'chenli_d', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_039', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    nuoyan_d: { generalId: 'nuoyan_d', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_621', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    wuli_d: { generalId: 'wuli_d', tier: 'ordinary', tacticalSkillId: 'ts_291', advantageSkillId: 'ts_031', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    jiluo_d: { generalId: 'jiluo_d', tier: 'ordinary', tacticalSkillId: 'ts_232', advantageSkillId: 'ts_005', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    yel: { generalId: 'yel', tier: 'ordinary', tacticalSkillId: 'ts_084', advantageSkillId: 'ts_053', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    kumoxi: { generalId: 'kumoxi', tier: 'ordinary', tacticalSkillId: 'ts_618', advantageSkillId: 'ts_666', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    kumo: { generalId: 'kumo', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_002', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    geluolu: { generalId: 'geluolu', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_621', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    ogodei: { generalId: 'ogodei', tier: 'ordinary', tacticalSkillId: 'ts_534', advantageSkillId: 'ts_657', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    merkit: { generalId: 'merkit', tier: 'ordinary', tacticalSkillId: 'ts_246', advantageSkillId: 'ts_660', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    tumed: { generalId: 'tumed', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_739', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    kiyad: { generalId: 'kiyad', tier: 'ordinary', tacticalSkillId: 'ts_621', advantageSkillId: 'ts_070', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    xiajiasi: { generalId: 'xiajiasi', tier: 'ordinary', tacticalSkillId: 'ts_624', advantageSkillId: 'ts_003', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    xiongnu: { generalId: 'xiongnu', tier: 'ordinary', tacticalSkillId: 'ts_066', advantageSkillId: 'ts_654', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    murong: { generalId: 'murong', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_115', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    wuhuan: { generalId: 'wuhuan', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_648', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_207', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    yuan_d: { generalId: 'yuan_d', tier: 'ordinary', tacticalSkillId: 'ts_627', advantageSkillId: 'ts_039', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    mengwu: { generalId: 'mengwu', tier: 'ordinary', tacticalSkillId: 'ts_639', advantageSkillId: 'ts_039', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    shaodang: { generalId: 'shaodang', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_627', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    shatuo: { generalId: 'shatuo', tier: 'ordinary', tacticalSkillId: 'ts_606', advantageSkillId: 'ts_001', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    xueyantuo: { generalId: 'xueyantuo', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_040', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    huizhou_d: { generalId: 'huizhou_d', tier: 'ordinary', tacticalSkillId: 'ts_159', advantageSkillId: 'ts_077', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_481', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    kereyid: { generalId: 'kereyid', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_609', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    naiman: { generalId: 'naiman', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_627', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    tatar: { generalId: 'tatar', tier: 'ordinary', tacticalSkillId: 'ts_645', advantageSkillId: 'ts_003', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    tushetu: { generalId: 'tushetu', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_009', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    zhasaketu: { generalId: 'zhasaketu', tier: 'ordinary', tacticalSkillId: 'ts_651', advantageSkillId: 'ts_660', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    gaoche: { generalId: 'gaoche', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_660', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    tujue: { generalId: 'tujue', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_010', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    da_yuan: { generalId: 'da_yuan', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_672', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_712', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_712', aptitude: 'create' },

    yujiulu: { generalId: 'yujiulu', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_207', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    yaoluoge: { generalId: 'yaoluoge', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_036', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    jalair: { generalId: 'jalair', tier: 'ordinary', tacticalSkillId: 'ts_657', advantageSkillId: 'ts_041', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    hongirad: { generalId: 'hongirad', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_654', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    choros: { generalId: 'choros', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_036', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    tiele: { generalId: 'tiele', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_039', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    ashide: { generalId: 'ashide', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_406', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    duolu: { generalId: 'duolu', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_666', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    cheshihou: { generalId: 'cheshihou', tier: 'ordinary', tacticalSkillId: 'ts_716', advantageSkillId: 'ts_801', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    kaerka: { generalId: 'kaerka', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_003', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    huyan: { generalId: 'huyan', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_702', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    chahar: { generalId: 'chahar', tier: 'ordinary', tacticalSkillId: 'ts_491', advantageSkillId: 'ts_801', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    ongut: { generalId: 'ongut', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_039', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    rouran: { generalId: 'rouran', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_397', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    chagatai: { generalId: 'chagatai', tier: 'ordinary', tacticalSkillId: 'ts_100', advantageSkillId: 'ts_392', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    huihu: { generalId: 'huihu', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_002', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    kelie: { generalId: 'kelie', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_672', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    pugu: { generalId: 'pugu', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_036', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    pulei: { generalId: 'pulei', tier: 'ordinary', tacticalSkillId: 'ts_232', advantageSkillId: 'ts_392', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    xibo_d: { generalId: 'xibo_d', tier: 'ordinary', tacticalSkillId: 'ts_660', advantageSkillId: 'ts_003', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    borjigin: { generalId: 'borjigin', tier: 'ordinary', tacticalSkillId: 'ts_499', advantageSkillId: 'ts_654', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    zhadalan: { generalId: 'zhadalan', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_002', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    zhuerqi: { generalId: 'zhuerqi', tier: 'ordinary', tacticalSkillId: 'ts_666', advantageSkillId: 'ts_406', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    chechen: { generalId: 'chechen', tier: 'ordinary', tacticalSkillId: 'ts_647', advantageSkillId: 'ts_621', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    tumengken: { generalId: 'tumengken', tier: 'ordinary', tacticalSkillId: 'ts_669', advantageSkillId: 'ts_657', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    bayegu: { generalId: 'bayegu', tier: 'ordinary', tacticalSkillId: 'ts_453', advantageSkillId: 'ts_609', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    zubu: { generalId: 'zubu', tier: 'ordinary', tacticalSkillId: 'ts_672', advantageSkillId: 'ts_039', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    wuzhumuqin: { generalId: 'wuzhumuqin', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_801', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    baidi: { generalId: 'baidi', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_077', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    shiwei: { generalId: 'shiwei', tier: 'ordinary', tacticalSkillId: 'ts_675', advantageSkillId: 'ts_053', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    sunite: { generalId: 'sunite', tier: 'ordinary', tacticalSkillId: 'ts_683', advantageSkillId: 'ts_627', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    bulat: { generalId: 'bulat', tier: 'ordinary', tacticalSkillId: 'ts_392', advantageSkillId: 'ts_002', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    tuva: { generalId: 'tuva', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_021', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    yiwu: { generalId: 'yiwu', tier: 'ordinary', tacticalSkillId: 'ts_393', advantageSkillId: 'ts_397', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    kepantuo: { generalId: 'kepantuo', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_627', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    huite: { generalId: 'huite', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_001', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    tuoming: { generalId: 'tuoming', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_801', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    chuyue: { generalId: 'chuyue', tier: 'ordinary', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_801', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    keerkezi: { generalId: 'keerkezi', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_001', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    pisha: { generalId: 'pisha', tier: 'ordinary', tacticalSkillId: 'ts_395', advantageSkillId: 'ts_406', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    xingxingxia: { generalId: 'xingxingxia', tier: 'ordinary', tacticalSkillId: 'ts_396', advantageSkillId: 'ts_021', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    yangguan: { generalId: 'yangguan', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_040', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    wulianghai: { generalId: 'wulianghai', tier: 'ordinary', tacticalSkillId: 'ts_397', advantageSkillId: 'ts_397', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    shule: { generalId: 'shule', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_739', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    dzungar: { generalId: 'dzungar', tier: 'ordinary', tacticalSkillId: 'ts_403', advantageSkillId: 'ts_009', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    anxi: { generalId: 'anxi', tier: 'ordinary', tacticalSkillId: 'ts_296', advantageSkillId: 'ts_041', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yanqi: { generalId: 'yanqi', tier: 'ordinary', tacticalSkillId: 'ts_404', advantageSkillId: 'ts_009', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    tuerhute: { generalId: 'tuerhute', tier: 'ordinary', tacticalSkillId: 'ts_405', advantageSkillId: 'ts_021', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    gaochang: { generalId: 'gaochang', tier: 'ordinary', tacticalSkillId: 'ts_406', advantageSkillId: 'ts_001', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    yarkand: { generalId: 'yarkand', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_654', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    yiduhu: { generalId: 'yiduhu', tier: 'ordinary', tacticalSkillId: 'ts_407', advantageSkillId: 'ts_036', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yuchi: { generalId: 'yuchi', tier: 'ordinary', tacticalSkillId: 'ts_409', advantageSkillId: 'ts_070', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    zhuxie: { generalId: 'zhuxie', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_005', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    kala: { generalId: 'kala', tier: 'ordinary', tacticalSkillId: 'ts_412', advantageSkillId: 'ts_041', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    an: { generalId: 'an', tier: 'ordinary', tacticalSkillId: 'ts_313', advantageSkillId: 'ts_313', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_313', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    saman: { generalId: 'saman', tier: 'ordinary', tacticalSkillId: 'ts_413', advantageSkillId: 'ts_021', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    wusun: { generalId: 'wusun', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_672', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    tujishi: { generalId: 'tujishi', tier: 'ordinary', tacticalSkillId: 'ts_425', advantageSkillId: 'ts_657', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    xiliao: { generalId: 'xiliao', tier: 'ordinary', tacticalSkillId: 'ts_313', advantageSkillId: 'ts_036', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    jiazini: { generalId: 'jiazini', tier: 'ordinary', tacticalSkillId: 'ts_442', advantageSkillId: 'ts_036', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    jibin: { generalId: 'jibin', tier: 'ordinary', tacticalSkillId: 'ts_122', advantageSkillId: 'ts_001', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    xijue: { generalId: 'xijue', tier: 'ordinary', tacticalSkillId: 'ts_702', advantageSkillId: 'ts_618', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    kazakh: { generalId: 'kazakh', tier: 'ordinary', tacticalSkillId: 'ts_704', advantageSkillId: 'ts_031', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    sogdian: { generalId: 'sogdian', tier: 'ordinary', tacticalSkillId: 'ts_705', advantageSkillId: 'ts_053', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    yanda: { generalId: 'yanda', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_654', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    yada: { generalId: 'yada', tier: 'ordinary', tacticalSkillId: 'ts_706', advantageSkillId: 'ts_040', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    anushidgin: { generalId: 'anushidgin', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_031', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    qincha: { generalId: 'qincha', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_648', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    dayuan: { generalId: 'dayuan', tier: 'ordinary', tacticalSkillId: 'ts_707', advantageSkillId: 'ts_702', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    kokand: { generalId: 'kokand', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_039', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    dayuzi: { generalId: 'dayuzi', tier: 'ordinary', tacticalSkillId: 'ts_140', advantageSkillId: 'ts_654', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    maer_d: { generalId: 'maer_d', tier: 'ordinary', tacticalSkillId: 'ts_628', advantageSkillId: 'ts_005', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    wugu_d: { generalId: 'wugu_d', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_040', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    adao_d: { generalId: 'adao_d', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_053', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    wuyuan_d: { generalId: 'wuyuan_d', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_070', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    shi_clan: { generalId: 'shi_clan', tier: 'ordinary', tacticalSkillId: 'ts_709', advantageSkillId: 'ts_657', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    mamon: { generalId: 'mamon', tier: 'ordinary', tacticalSkillId: 'ts_717', advantageSkillId: 'ts_010', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    khoja: { generalId: 'khoja', tier: 'ordinary', tacticalSkillId: 'ts_731', advantageSkillId: 'ts_660', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    fanyanna: { generalId: 'fanyanna', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_070', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    kangju: { generalId: 'kangju', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_041', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_712', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    zhaowu: { generalId: 'zhaowu', tier: 'ordinary', tacticalSkillId: 'ts_509', advantageSkillId: 'ts_621', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    qiepantuo: { generalId: 'qiepantuo', tier: 'ordinary', tacticalSkillId: 'ts_737', advantageSkillId: 'ts_041', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    jie: { generalId: 'jie', tier: 'ordinary', tacticalSkillId: 'ts_739', advantageSkillId: 'ts_001', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    lu: { generalId: 'lu', tier: 'ordinary', tacticalSkillId: 'ts_110', advantageSkillId: 'ts_010', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_460', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    loulan: { generalId: 'loulan', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_002', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    juandu: { generalId: 'juandu', tier: 'ordinary', tacticalSkillId: 'ts_768', advantageSkillId: 'ts_672', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    dulan: { generalId: 'dulan', tier: 'ordinary', tacticalSkillId: 'ts_647', advantageSkillId: 'ts_627', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    heyuan_d: { generalId: 'heyuan_d', tier: 'ordinary', tacticalSkillId: 'ts_801', advantageSkillId: 'ts_070', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    gurkha: { generalId: 'gurkha', tier: 'ordinary', tacticalSkillId: 'ts_283', advantageSkillId: 'ts_648', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    gongbu: { generalId: 'gongbu', tier: 'ordinary', tacticalSkillId: 'ts_535', advantageSkillId: 'ts_009', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    khon: { generalId: 'khon', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_318', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    xiadun: { generalId: 'xiadun', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_618', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    gar: { generalId: 'gar', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_009', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    tufa_d: { generalId: 'tufa_d', tier: 'ordinary', tacticalSkillId: 'ts_045', advantageSkillId: 'ts_036', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    qifu_d: { generalId: 'qifu_d', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_053', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    tuyu_d: { generalId: 'tuyu_d', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_040', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    duomi: { generalId: 'duomi', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_009', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    dafeichuan: { generalId: 'dafeichuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_032', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    gaxa: { generalId: 'gaxa', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_002', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    jinchuan_g: { generalId: 'jinchuan_g', tier: 'ordinary', tacticalSkillId: 'ts_369', advantageSkillId: 'ts_039', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_369', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    xiangxiong: { generalId: 'xiangxiong', tier: 'ordinary', tacticalSkillId: 'ts_045', advantageSkillId: 'ts_627', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    ladakh: { generalId: 'ladakh', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_672', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    khoshut: { generalId: 'khoshut', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    nvguo: { generalId: 'nvguo', tier: 'ordinary', tacticalSkillId: 'ts_207', advantageSkillId: 'ts_070', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    karmapa: { generalId: 'karmapa', tier: 'ordinary', tacticalSkillId: 'ts_703', advantageSkillId: 'ts_397', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    xianlingqiang: { generalId: 'xianlingqiang', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_621', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    lang_clan: { generalId: 'lang_clan', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_077', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    xiutu: { generalId: 'xiutu', tier: 'ordinary', tacticalSkillId: 'ts_585', advantageSkillId: 'ts_041', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    gandenpozhang: { generalId: 'gandenpozhang', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_672', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    khyungpo: { generalId: 'khyungpo', tier: 'ordinary', tacticalSkillId: 'ts_639', advantageSkillId: 'ts_801', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    gar_kham: { generalId: 'gar_kham', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_031', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    guangwu: { generalId: 'guangwu', tier: 'ordinary', tacticalSkillId: 'ts_017', advantageSkillId: 'ts_009', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    supi: { generalId: 'supi', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_739', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    tsangpa: { generalId: 'tsangpa', tier: 'ordinary', tacticalSkillId: 'ts_705', advantageSkillId: 'ts_392', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    spurgyal: { generalId: 'spurgyal', tier: 'ordinary', tacticalSkillId: 'ts_042', advantageSkillId: 'ts_070', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    galangdiba: { generalId: 'galangdiba', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_609', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    fuguo: { generalId: 'fuguo', tier: 'ordinary', tacticalSkillId: 'ts_407', advantageSkillId: 'ts_009', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    bailang: { generalId: 'bailang', tier: 'ordinary', tacticalSkillId: 'ts_611', advantageSkillId: 'ts_618', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    humi: { generalId: 'humi', tier: 'ordinary', tacticalSkillId: 'ts_731', advantageSkillId: 'ts_010', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    xiaobolu: { generalId: 'xiaobolu', tier: 'ordinary', tacticalSkillId: 'ts_639', advantageSkillId: 'ts_053', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    guge: { generalId: 'guge', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_406', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    pazhu: { generalId: 'pazhu', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_397', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    ali: { generalId: 'ali', tier: 'ordinary', tacticalSkillId: 'ts_534', advantageSkillId: 'ts_397', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    gaoliang: { generalId: 'gaoliang', tier: 'ordinary', tacticalSkillId: 'ts_112', advantageSkillId: 'ts_666', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    nandou: { generalId: 'nandou', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_003', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    bailan: { generalId: 'bailan', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_648', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    jiantang: { generalId: 'jiantang', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_660', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    kongsa: { generalId: 'kongsa', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_036', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    gling: { generalId: 'gling', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_627', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    daca: { generalId: 'daca', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_627', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    gongtang: { generalId: 'gongtang', tier: 'ordinary', tacticalSkillId: 'ts_703', advantageSkillId: 'ts_406', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    nanjie: { generalId: 'nanjie', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_040', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    nanzhong: { generalId: 'nanzhong', tier: 'ordinary', tacticalSkillId: 'ts_334', advantageSkillId: 'ts_005', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    yueyi: { generalId: 'yueyi', tier: 'ordinary', tacticalSkillId: 'ts_717', advantageSkillId: 'ts_010', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    pingnan: { generalId: 'pingnan', tier: 'ordinary', tacticalSkillId: 'ts_334', advantageSkillId: 'ts_032', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    jingdong: { generalId: 'jingdong', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_070', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    luohu: { generalId: 'luohu', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_009', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    ailao: { generalId: 'ailao', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_002', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    mingzheng: { generalId: 'mingzheng', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_053', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    hani_d: { generalId: 'hani_d', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_660', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_787', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    dongxu: { generalId: 'dongxu', tier: 'ordinary', tacticalSkillId: 'ts_129', advantageSkillId: 'ts_702', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    mu_lijiang: { generalId: 'mu_lijiang', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_031', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_374', aptitude: 'create' },

    dianguo: { generalId: 'dianguo', tier: 'ordinary', tacticalSkillId: 'ts_283', advantageSkillId: 'ts_021', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    konbaung: { generalId: 'konbaung', tier: 'ordinary', tacticalSkillId: 'ts_645', advantageSkillId: 'ts_041', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    hantawadi: { generalId: 'hantawadi', tier: 'ordinary', tacticalSkillId: 'ts_129', advantageSkillId: 'ts_040', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    nanzhao: { generalId: 'nanzhao', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_654', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    wuman: { generalId: 'wuman', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_005', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    dai: { generalId: 'dai', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_005', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    taiyuan: { generalId: 'taiyuan', tier: 'ordinary', tacticalSkillId: 'ts_283', advantageSkillId: 'ts_077', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    suke: { generalId: 'suke', tier: 'ordinary', tacticalSkillId: 'ts_122', advantageSkillId: 'ts_657', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    luchuan: { generalId: 'luchuan', tier: 'ordinary', tacticalSkillId: 'ts_793', advantageSkillId: 'ts_041', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    kunming_yi: { generalId: 'kunming_yi', tier: 'ordinary', tacticalSkillId: 'ts_407', advantageSkillId: 'ts_627', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    cuanshi: { generalId: 'cuanshi', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_002', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_374', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    baiman: { generalId: 'baiman', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_666', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    champa: { generalId: 'champa', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_397', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    qiong: { generalId: 'qiong', tier: 'ordinary', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_648', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    guangping: { generalId: 'guangping', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_657', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    jingjiang: { generalId: 'jingjiang', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_654', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    duanzhou_d: { generalId: 'duanzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_021', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    monong: { generalId: 'monong', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_739', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    basha_d: { generalId: 'basha_d', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_397', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    leizhou: { generalId: 'leizhou', tier: 'ordinary', tacticalSkillId: 'ts_409', advantageSkillId: 'ts_618', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    ketagalan: { generalId: 'ketagalan', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_654', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    shuizhen: { generalId: 'shuizhen', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_005', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    luoping: { generalId: 'luoping', tier: 'ordinary', tacticalSkillId: 'ts_657', advantageSkillId: 'ts_009', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    chaozhou_d: { generalId: 'chaozhou_d', tier: 'ordinary', tacticalSkillId: 'ts_716', advantageSkillId: 'ts_009', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    chendiaoyan: { generalId: 'chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_031', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    dengmaoqi: { generalId: 'dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_077', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    geng: { generalId: 'geng', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_702', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    longwu: { generalId: 'longwu', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_039', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    xinjiang: { generalId: 'xinjiang', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_392', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    jing: { generalId: 'jing', tier: 'ordinary', tacticalSkillId: 'ts_413', advantageSkillId: 'ts_627', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    paiwan: { generalId: 'paiwan', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_039', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    ming_zheng: { generalId: 'ming_zheng', tier: 'ordinary', tacticalSkillId: 'ts_288', advantageSkillId: 'ts_041', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    nguyen_guangnan: { generalId: 'nguyen_guangnan', tier: 'ordinary', tacticalSkillId: 'ts_111', advantageSkillId: 'ts_609', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_111', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    zhuang_d: { generalId: 'zhuang_d', tier: 'ordinary', tacticalSkillId: 'ts_323', advantageSkillId: 'ts_021', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    nanyue: { generalId: 'nanyue', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_041', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    zhancheng: { generalId: 'zhancheng', tier: 'ordinary', tacticalSkillId: 'ts_675', advantageSkillId: 'ts_001', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    xiou: { generalId: 'xiou', tier: 'ordinary', tacticalSkillId: 'ts_705', advantageSkillId: 'ts_021', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    xichu: { generalId: 'xichu', tier: 'ordinary', tacticalSkillId: 'ts_012', advantageSkillId: 'ts_053', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_433', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    gouding: { generalId: 'gouding', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_040', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    chen: { generalId: 'chen', tier: 'ordinary', tacticalSkillId: 'ts_242', advantageSkillId: 'ts_666', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    dayu: { generalId: 'dayu', tier: 'ordinary', tacticalSkillId: 'ts_361', advantageSkillId: 'ts_001', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_361', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    paiyao: { generalId: 'paiyao', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_660', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    yingzhou: { generalId: 'yingzhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_654', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    linyi: { generalId: 'linyi', tier: 'ordinary', tacticalSkillId: 'ts_413', advantageSkillId: 'ts_672', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    xian_d: { generalId: 'xian_d', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_009', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    luodian: { generalId: 'luodian', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_657', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    nong2: { generalId: 'nong2', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_654', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    taiping: { generalId: 'taiping', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_003', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    dongzu: { generalId: 'dongzu', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_621', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    tian_sizhou: { generalId: 'tian_sizhou', tier: 'ordinary', tacticalSkillId: 'ts_645', advantageSkillId: 'ts_702', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    luoyue: { generalId: 'luoyue', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_009', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    li_lx_d: { generalId: 'li_lx_d', tier: 'ordinary', tacticalSkillId: 'ts_248', advantageSkillId: 'ts_009', balanceSkillId: 'ts_777', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    li_s: { generalId: 'li_s', tier: 'ordinary', tacticalSkillId: 'ts_178', advantageSkillId: 'ts_032', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

        leloi: { generalId: 'leloi', tier: 'famous', tacticalSkillId: 'ts_558', strategicSkillId: 'str_12', advantageSkillId: 'ts_558', balanceSkillId: 'ts_559', disadvantageSkillId: 'ts_560', atkAdvantageSkillId: 'ts_558', atkBalanceSkillId: 'ts_559', atkDisadvantageSkillId: 'ts_560', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_025', aptitude: 'reverse' },

    dacheng: { generalId: 'dacheng', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_040', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_336', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    dayue: { generalId: 'dayue', tier: 'ordinary', tacticalSkillId: 'ts_037', advantageSkillId: 'ts_039', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    shengmiao: { generalId: 'shengmiao', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_021', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    miao_qing: { generalId: 'miao_qing', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_672', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    guizhou: { generalId: 'guizhou', tier: 'ordinary', tacticalSkillId: 'ts_079', advantageSkillId: 'ts_397', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    liren: { generalId: 'liren', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_031', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    zangke: { generalId: 'zangke', tier: 'ordinary', tacticalSkillId: 'ts_413', advantageSkillId: 'ts_666', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    xinggu: { generalId: 'xinggu', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_627', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    guangxin: { generalId: 'guangxin', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_621', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    shaozhou: { generalId: 'shaozhou', tier: 'ordinary', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_739', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    shixing: { generalId: 'shixing', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_654', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    buyi_d: { generalId: 'buyi_d', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_618', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

      lizhou_d: { generalId: 'lizhou_d', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_003', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    yang_bozhou: { generalId: 'yang_bozhou', tier: 'ordinary', tacticalSkillId: 'ts_369', advantageSkillId: 'ts_621', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_369', aptitude: 'create' },

    chenghan: { generalId: 'chenghan', tier: 'ordinary', tacticalSkillId: 'ts_244', advantageSkillId: 'ts_053', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    agui: { generalId: 'agui', tier: 'ordinary', tacticalSkillId: 'ts_714', advantageSkillId: 'ts_392', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_291', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    zuo_d: { generalId: 'zuo_d', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_654', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    miaomin: { generalId: 'miaomin', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    wumeng: { generalId: 'wumeng', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_406', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    shuixi: { generalId: 'shuixi', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_621', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    xiangzhou: { generalId: 'xiangzhou', tier: 'ordinary', tacticalSkillId: 'ts_070', advantageSkillId: 'ts_040', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    zaoyang_d: { generalId: 'zaoyang_d', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_001', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    guo: { generalId: 'guo', tier: 'ordinary', tacticalSkillId: 'ts_624', advantageSkillId: 'ts_002', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

        daxi_ming: { generalId: 'daxi_ming', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_657', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    zi: { generalId: 'zi', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_621', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    yidou: { generalId: 'yidou', tier: 'ordinary', tacticalSkillId: 'ts_278', advantageSkillId: 'ts_609', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    chu: { generalId: 'chu', tier: 'ordinary', tacticalSkillId: 'ts_071', advantageSkillId: 'ts_672', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_614', aptitude: 'create' },

    zhongxiang: { generalId: 'zhongxiang', tier: 'ordinary', tacticalSkillId: 'ts_023', advantageSkillId: 'ts_672', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    fengzhou: { generalId: 'fengzhou', tier: 'ordinary', tacticalSkillId: 'ts_091', advantageSkillId: 'ts_672', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_582', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    fushi: { generalId: 'fushi', tier: 'ordinary', tacticalSkillId: 'ts_058', advantageSkillId: 'ts_702', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    wanzhou: { generalId: 'wanzhou', tier: 'ordinary', tacticalSkillId: 'ts_648', advantageSkillId: 'ts_039', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    ba: { generalId: 'ba', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_003', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    hezhou: { generalId: 'hezhou', tier: 'ordinary', tacticalSkillId: 'ts_172', advantageSkillId: 'ts_702', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    qiuchi: { generalId: 'qiuchi', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_406', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    cong: { generalId: 'cong', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_666', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    langzhou: { generalId: 'langzhou', tier: 'ordinary', tacticalSkillId: 'ts_228', advantageSkillId: 'ts_397', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    tan_d: { generalId: 'tan_d', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_003', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    xiang_d: { generalId: 'xiang_d', tier: 'ordinary', tacticalSkillId: 'ts_645', advantageSkillId: 'ts_621', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    ran_d: { generalId: 'ran_d', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_010', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    wuxi: { generalId: 'wuxi', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_648', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    kuai: { generalId: 'kuai', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_032', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    bandun: { generalId: 'bandun', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_070', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    she: { generalId: 'she', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_021', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    boren: { generalId: 'boren', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_009', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    jingmen: { generalId: 'jingmen', tier: 'ordinary', tacticalSkillId: 'ts_234', advantageSkillId: 'ts_627', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    chenzhou_d: { generalId: 'chenzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_040', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    xiqin: { generalId: 'xiqin', tier: 'ordinary', tacticalSkillId: 'ts_120', advantageSkillId: 'ts_001', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    beidi: { generalId: 'beidi', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_672', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    baiyang: { generalId: 'baiyang', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_609', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    qianzhong: { generalId: 'qianzhong', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_654', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    dangchang: { generalId: 'dangchang', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_010', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    liao: { generalId: 'liao', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_041', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    sou: { generalId: 'sou', tier: 'ordinary', tacticalSkillId: 'ts_639', advantageSkillId: 'ts_654', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    qingqiang: { generalId: 'qingqiang', tier: 'ordinary', tacticalSkillId: 'ts_268', advantageSkillId: 'ts_609', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    qingyi: { generalId: 'qingyi', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_021', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    lanzhou: { generalId: 'lanzhou', tier: 'ordinary', tacticalSkillId: 'ts_264', advantageSkillId: 'ts_041', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    wudu: { generalId: 'wudu', tier: 'ordinary', tacticalSkillId: 'ts_068', advantageSkillId: 'ts_070', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    baishui: { generalId: 'baishui', tier: 'ordinary', tacticalSkillId: 'ts_360', advantageSkillId: 'ts_392', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    dangzhou: { generalId: 'dangzhou', tier: 'ordinary', tacticalSkillId: 'ts_713', advantageSkillId: 'ts_621', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    didao: { generalId: 'didao', tier: 'ordinary', tacticalSkillId: 'ts_403', advantageSkillId: 'ts_040', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    dashun: { generalId: 'dashun', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_070', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    zhai_han: { generalId: 'zhai_han', tier: 'ordinary', tacticalSkillId: 'ts_023', advantageSkillId: 'ts_001', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    ganzhou: { generalId: 'ganzhou', tier: 'ordinary', tacticalSkillId: 'ts_252', advantageSkillId: 'ts_077', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_252', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

        suzhou: { generalId: 'suzhou', tier: 'ordinary', tacticalSkillId: 'ts_052', advantageSkillId: 'ts_426', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    shazhou: { generalId: 'shazhou', tier: 'ordinary', tacticalSkillId: 'ts_113', advantageSkillId: 'ts_672', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    dongshengwei: { generalId: 'dongshengwei', tier: 'ordinary', tacticalSkillId: 'ts_397', advantageSkillId: 'ts_040', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    guiyi: { generalId: 'guiyi', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_070', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    weiming: { generalId: 'weiming', tier: 'ordinary', tacticalSkillId: 'ts_396', advantageSkillId: 'ts_053', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    helian: { generalId: 'helian', tier: 'ordinary', tacticalSkillId: 'ts_043', advantageSkillId: 'ts_041', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    chile: { generalId: 'chile', tier: 'ordinary', tacticalSkillId: 'ts_358', advantageSkillId: 'ts_660', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    chijin: { generalId: 'chijin', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_739', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    shuofang: { generalId: 'shuofang', tier: 'ordinary', tacticalSkillId: 'ts_094', advantageSkillId: 'ts_041', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    yeli: { generalId: 'yeli', tier: 'ordinary', tacticalSkillId: 'ts_250', advantageSkillId: 'ts_666', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    hunxie: { generalId: 'hunxie', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_801', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    guazhou: { generalId: 'guazhou', tier: 'ordinary', tacticalSkillId: 'ts_654', advantageSkillId: 'ts_406', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    kang: { generalId: 'kang', tier: 'ordinary', tacticalSkillId: 'ts_077', advantageSkillId: 'ts_627', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    woye: { generalId: 'woye', tier: 'ordinary', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_657', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    yingli: { generalId: 'yingli', tier: 'ordinary', tacticalSkillId: 'ts_025', advantageSkillId: 'ts_036', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    dangxiang: { generalId: 'dangxiang', tier: 'ordinary', tacticalSkillId: 'ts_250', advantageSkillId: 'ts_002', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    huizhou: { generalId: 'huizhou', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_053', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    huan: { generalId: 'huan', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_392', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    wei2: { generalId: 'wei2', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_672', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    lingzhou: { generalId: 'lingzhou', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_672', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    ningkou: { generalId: 'ningkou', tier: 'ordinary', tacticalSkillId: 'ts_192', advantageSkillId: 'ts_660', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    juqu_d: { generalId: 'juqu_d', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_036', balanceSkillId: 'ts_190', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

        zhengzhou: { generalId: 'zhengzhou', tier: 'ordinary', tacticalSkillId: 'ts_074', advantageSkillId: 'ts_001', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    sunqin: { generalId: 'sunqin', tier: 'ordinary', tacticalSkillId: 'ts_590', advantageSkillId: 'ts_077', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    hongnong_jun: { generalId: 'hongnong_jun', tier: 'ordinary', tacticalSkillId: 'ts_287', advantageSkillId: 'ts_287', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    ranwei_d: { generalId: 'ranwei_d', tier: 'ordinary', tacticalSkillId: 'ts_590', advantageSkillId: 'ts_039', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    jin: { generalId: 'jin', tier: 'ordinary', tacticalSkillId: 'ts_258', advantageSkillId: 'ts_021', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    zhong: { generalId: 'zhong', tier: 'ordinary', tacticalSkillId: 'ts_019', advantageSkillId: 'ts_406', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    zhongshan: { generalId: 'zhongshan', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_397', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    jingzhou_gs: { generalId: 'jingzhou_gs', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_660', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    wang_d: { generalId: 'wang_d', tier: 'ordinary', tacticalSkillId: 'ts_174', advantageSkillId: 'ts_654', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    chimei: { generalId: 'chimei', tier: 'ordinary', tacticalSkillId: 'ts_702', advantageSkillId: 'ts_621', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    xiao_d: { generalId: 'xiao_d', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_621', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    wazhai: { generalId: 'wazhai', tier: 'ordinary', tacticalSkillId: 'ts_203', advantageSkillId: 'ts_070', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    jiaodong: { generalId: 'jiaodong', tier: 'ordinary', tacticalSkillId: 'ts_164', advantageSkillId: 'ts_406', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    jibei: { generalId: 'jibei', tier: 'ordinary', tacticalSkillId: 'ts_768', advantageSkillId: 'ts_031', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    jinan: { generalId: 'jinan', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_021', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    qi: { generalId: 'qi', tier: 'ordinary', tacticalSkillId: 'ts_185', advantageSkillId: 'ts_627', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    huaiyang: { generalId: 'huaiyang', tier: 'ordinary', tacticalSkillId: 'ts_086', advantageSkillId: 'ts_036', balanceSkillId: 'ts_682', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yingzhou_d: { generalId: 'yingzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_618', advantageSkillId: 'ts_618', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    cao_d: { generalId: 'cao_d', tier: 'ordinary', tacticalSkillId: 'ts_022', advantageSkillId: 'ts_397', balanceSkillId: 'ts_378', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    long2: { generalId: 'long2', tier: 'ordinary', tacticalSkillId: 'ts_657', advantageSkillId: 'ts_666', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    dongxian: { generalId: 'dongxian', tier: 'ordinary', tacticalSkillId: 'ts_061', advantageSkillId: 'ts_657', balanceSkillId: 'ts_748', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_315', atkDisadvantageSkillId: 'ts_098', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_496', defDisadvantageSkillId: 'ts_778', aptitude: 'create' },

    mi: { generalId: 'mi', tier: 'ordinary', tacticalSkillId: 'ts_702', advantageSkillId: 'ts_397', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    baibo: { generalId: 'baibo', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_609', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_353', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    ruzhou: { generalId: 'ruzhou', tier: 'ordinary', tacticalSkillId: 'ts_704', advantageSkillId: 'ts_077', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    ruo: { generalId: 'ruo', tier: 'ordinary', tacticalSkillId: 'ts_145', advantageSkillId: 'ts_322', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_513', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    yaozhou: { generalId: 'yaozhou', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_003', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    jiyuan: { generalId: 'jiyuan', tier: 'ordinary', tacticalSkillId: 'ts_196', advantageSkillId: 'ts_618', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    dixiang: { generalId: 'dixiang', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_002', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    zhou: { generalId: 'zhou', tier: 'ordinary', tacticalSkillId: 'ts_117', advantageSkillId: 'ts_392', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    quanrong: { generalId: 'quanrong', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_609', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    cai: { generalId: 'cai', tier: 'ordinary', tacticalSkillId: 'ts_238', advantageSkillId: 'ts_003', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    yun: { generalId: 'yun', tier: 'ordinary', tacticalSkillId: 'ts_666', advantageSkillId: 'ts_609', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    suzhou_d: { generalId: 'suzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_036', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    pizhou: { generalId: 'pizhou', tier: 'ordinary', tacticalSkillId: 'ts_221', advantageSkillId: 'ts_032', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    yin: { generalId: 'yin', tier: 'ordinary', tacticalSkillId: 'ts_395', advantageSkillId: 'ts_032', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    liwang: { generalId: 'liwang', tier: 'ordinary', tacticalSkillId: 'ts_133', advantageSkillId: 'ts_009', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    qing: { generalId: 'qing', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_648', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    han: { generalId: 'han', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_001', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    bailian: { generalId: 'bailian', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_036', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    shen: { generalId: 'shen', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_406', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    sima_d: { generalId: 'sima_d', tier: 'ordinary', tacticalSkillId: 'ts_127', advantageSkillId: 'ts_001', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    liguo: { generalId: 'liguo', tier: 'ordinary', tacticalSkillId: 'ts_189', advantageSkillId: 'ts_010', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    huai: { generalId: 'huai', tier: 'ordinary', tacticalSkillId: 'ts_138', advantageSkillId: 'ts_036', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    shangzhou: { generalId: 'shangzhou', tier: 'ordinary', tacticalSkillId: 'ts_403', advantageSkillId: 'ts_406', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    yuan_cj_d: { generalId: 'yuan_cj_d', tier: 'ordinary', tacticalSkillId: 'ts_042', advantageSkillId: 'ts_392', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    xinping: { generalId: 'xinping', tier: 'ordinary', tacticalSkillId: 'ts_155', advantageSkillId: 'ts_660', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_786', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yuzhou: { generalId: 'yuzhou', tier: 'ordinary', tacticalSkillId: 'ts_004', advantageSkillId: 'ts_618', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    mengcheng_d: { generalId: 'mengcheng_d', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_039', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    lulin: { generalId: 'lulin', tier: 'ordinary', tacticalSkillId: 'ts_054', advantageSkillId: 'ts_666', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    dang_d: { generalId: 'dang_d', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_702', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    hao_d: { generalId: 'hao_d', tier: 'ordinary', tacticalSkillId: 'ts_045', advantageSkillId: 'ts_397', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    bozhou_d: { generalId: 'bozhou_d', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_618', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_712', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

        zhuozhou: { generalId: 'zhuozhou', tier: 'ordinary', tacticalSkillId: 'ts_032', advantageSkillId: 'ts_053', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

        chanzhou: { generalId: 'chanzhou', tier: 'ordinary', tacticalSkillId: 'ts_087', advantageSkillId: 'ts_739', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    lai: { generalId: 'lai', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_618', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    mushi: { generalId: 'mushi', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_041', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    xiongding: { generalId: 'xiongding', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_739', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    pingyuan: { generalId: 'pingyuan', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_036', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    linhu: { generalId: 'linhu', tier: 'ordinary', tacticalSkillId: 'ts_046', advantageSkillId: 'ts_392', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    xianyu: { generalId: 'xianyu', tier: 'ordinary', tacticalSkillId: 'ts_013', advantageSkillId: 'ts_021', balanceSkillId: 'ts_744', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    shizhao_d: { generalId: 'shizhao_d', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_002', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    loufan: { generalId: 'loufan', tier: 'ordinary', tacticalSkillId: 'ts_216', advantageSkillId: 'ts_801', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    shanrong: { generalId: 'shanrong', tier: 'ordinary', tacticalSkillId: 'ts_307', advantageSkillId: 'ts_077', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    lingqiu: { generalId: 'lingqiu', tier: 'ordinary', tacticalSkillId: 'ts_214', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    yi: { generalId: 'yi', tier: 'ordinary', tacticalSkillId: 'ts_320', advantageSkillId: 'ts_009', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    huo: { generalId: 'huo', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_621', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    zu_d: { generalId: 'zu_d', tier: 'ordinary', tacticalSkillId: 'ts_144', advantageSkillId: 'ts_070', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    mao_wenlong: { generalId: 'mao_wenlong', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_009', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    gongsun_d: { generalId: 'gongsun_d', tier: 'ordinary', tacticalSkillId: 'ts_409', advantageSkillId: 'ts_001', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    jianzhou_nvzhen: { generalId: 'jianzhou_nvzhen', tier: 'ordinary', tacticalSkillId: 'ts_011', advantageSkillId: 'ts_002', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    weihaiwei: { generalId: 'weihaiwei', tier: 'ordinary', tacticalSkillId: 'ts_116', advantageSkillId: 'ts_001', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    xuan: { generalId: 'xuan', tier: 'ordinary', tacticalSkillId: 'ts_089', advantageSkillId: 'ts_005', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    tuoba: { generalId: 'tuoba', tier: 'ordinary', tacticalSkillId: 'ts_229', advantageSkillId: 'ts_077', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    qingyuan_bd: { generalId: 'qingyuan_bd', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_039', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    changshan: { generalId: 'changshan', tier: 'ordinary', tacticalSkillId: 'ts_095', advantageSkillId: 'ts_003', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    hejian: { generalId: 'hejian', tier: 'ordinary', tacticalSkillId: 'ts_213', advantageSkillId: 'ts_801', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    liangshidu: { generalId: 'liangshidu', tier: 'ordinary', tacticalSkillId: 'ts_672', advantageSkillId: 'ts_660', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yangshe: { generalId: 'yangshe', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_621', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    guzhu: { generalId: 'guzhu', tier: 'ordinary', tacticalSkillId: 'ts_137', advantageSkillId: 'ts_657', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    dizhou: { generalId: 'dizhou', tier: 'ordinary', tacticalSkillId: 'ts_083', advantageSkillId: 'ts_021', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    qu_d: { generalId: 'qu_d', tier: 'ordinary', tacticalSkillId: 'ts_219', advantageSkillId: 'ts_070', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    gaoqi_d: { generalId: 'gaoqi_d', tier: 'ordinary', tacticalSkillId: 'ts_295', advantageSkillId: 'ts_627', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    wangyan: { generalId: 'wangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_397', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    linyu: { generalId: 'linyu', tier: 'ordinary', tacticalSkillId: 'ts_016', advantageSkillId: 'ts_627', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    dai_d: { generalId: 'dai_d', tier: 'ordinary', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_406', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    erzhu: { generalId: 'erzhu', tier: 'ordinary', tacticalSkillId: 'ts_806', advantageSkillId: 'ts_005', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    zhe_d: { generalId: 'zhe_d', tier: 'ordinary', tacticalSkillId: 'ts_777', advantageSkillId: 'ts_021', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    heng1: { generalId: 'heng1', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_739', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    dingxiang_d: { generalId: 'dingxiang_d', tier: 'ordinary', tacticalSkillId: 'ts_056', advantageSkillId: 'ts_010', balanceSkillId: 'ts_486', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    xiayang_d: { generalId: 'xiayang_d', tier: 'ordinary', tacticalSkillId: 'ts_067', advantageSkillId: 'ts_672', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    ying: { generalId: 'ying', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_627', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    kejia: { generalId: 'kejia', tier: 'ordinary', tacticalSkillId: 'ts_683', advantageSkillId: 'ts_036', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    tingzhou_d: { generalId: 'tingzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_039', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    fu2: { generalId: 'fu2', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_406', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    ouyang: { generalId: 'ouyang', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_392', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    chu_d: { generalId: 'chu_d', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_077', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    yan: { generalId: 'yan', tier: 'ordinary', tacticalSkillId: 'ts_123', advantageSkillId: 'ts_314', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_314', atkBalanceSkillId: 'ts_490', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    zhao: { generalId: 'zhao', tier: 'ordinary', tacticalSkillId: 'ts_686', advantageSkillId: 'ts_031', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    yunzhong: { generalId: 'yunzhong', tier: 'ordinary', tacticalSkillId: 'ts_043', advantageSkillId: 'ts_406', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    yang_aner: { generalId: 'yang_aner', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_397', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

        xie_cj_d: { generalId: 'xie_cj_d', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_672', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    wan: { generalId: 'wan', tier: 'ordinary', tacticalSkillId: 'ts_065', advantageSkillId: 'ts_702', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    huang_d: { generalId: 'huang_d', tier: 'ordinary', tacticalSkillId: 'ts_265', advantageSkillId: 'ts_005', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    wenzhou: { generalId: 'wenzhou', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_031', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    wuling: { generalId: 'wuling', tier: 'ordinary', tacticalSkillId: 'ts_114', advantageSkillId: 'ts_053', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    fangla: { generalId: 'fangla', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_005', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    fang_guozhen: { generalId: 'fang_guozhen', tier: 'ordinary', tacticalSkillId: 'ts_288', advantageSkillId: 'ts_648', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    ouyue: { generalId: 'ouyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_032', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    ruochu: { generalId: 'ruochu', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_041', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    wuwu_d: { generalId: 'wuwu_d', tier: 'ordinary', tacticalSkillId: 'ts_078', advantageSkillId: 'ts_627', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    taizhou: { generalId: 'taizhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_702', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

        sunwu_d: { generalId: 'sunwu_d', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_397', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    yue: { generalId: 'yue', tier: 'ordinary', tacticalSkillId: 'ts_177', advantageSkillId: 'ts_002', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    heng: { generalId: 'heng', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_070', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    xushouhui: { generalId: 'xushouhui', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_801', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_353', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    sui: { generalId: 'sui', tier: 'ordinary', tacticalSkillId: 'ts_807', advantageSkillId: 'ts_041', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    changshaguo: { generalId: 'changshaguo', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_003', balanceSkillId: 'ts_705', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yue_d: { generalId: 'yue_d', tier: 'ordinary', tacticalSkillId: 'ts_756', advantageSkillId: 'ts_654', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    zhangshicheng: { generalId: 'zhangshicheng', tier: 'ordinary', tacticalSkillId: 'ts_021', advantageSkillId: 'ts_010', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    wu: { generalId: 'wu', tier: 'ordinary', tacticalSkillId: 'ts_149', advantageSkillId: 'ts_032', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_634', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    qian_d: { generalId: 'qian_d', tier: 'ordinary', tacticalSkillId: 'ts_454', advantageSkillId: 'ts_031', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    qiufu: { generalId: 'qiufu', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_053', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    qi_d: { generalId: 'qi_d', tier: 'ordinary', tacticalSkillId: 'ts_076', advantageSkillId: 'ts_621', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yiyang_d: { generalId: 'yiyang_d', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_031', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    yezongliu: { generalId: 'yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_009', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_353', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    shenshi: { generalId: 'shenshi', tier: 'ordinary', tacticalSkillId: 'ts_442', advantageSkillId: 'ts_039', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    huangwang: { generalId: 'huangwang', tier: 'ordinary', tacticalSkillId: 'ts_125', advantageSkillId: 'ts_392', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_495', atkBalanceSkillId: 'ts_685', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    lujian: { generalId: 'lujian', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_672', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    linshihong: { generalId: 'linshihong', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_654', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_190', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    liu: { generalId: 'liu', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_036', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    chunshen: { generalId: 'chunshen', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_009', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    mi_chu: { generalId: 'mi_chu', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_070', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    shanyue: { generalId: 'shanyue', tier: 'ordinary', tacticalSkillId: 'ts_175', advantageSkillId: 'ts_235', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    she_ethnic: { generalId: 'she_ethnic', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_660', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    wang_s: { generalId: 'wang_s', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_053', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    hongzhou: { generalId: 'hongzhou', tier: 'ordinary', tacticalSkillId: 'ts_298', advantageSkillId: 'ts_406', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    danyang: { generalId: 'danyang', tier: 'ordinary', tacticalSkillId: 'ts_561', advantageSkillId: 'ts_648', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_561', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    chizhou: { generalId: 'chizhou', tier: 'ordinary', tacticalSkillId: 'ts_063', advantageSkillId: 'ts_801', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    gumie: { generalId: 'gumie', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_032', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    hu_d: { generalId: 'hu_d', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_053', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    sagami: { generalId: 'sagami', tier: 'ordinary', tacticalSkillId: 'ts_557', advantageSkillId: 'ts_053', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    mino: { generalId: 'mino', tier: 'ordinary', tacticalSkillId: 'ts_590', advantageSkillId: 'ts_406', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    zhuqian: { generalId: 'zhuqian', tier: 'ordinary', tacticalSkillId: 'ts_026', advantageSkillId: 'ts_648', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    ssangseong: { generalId: 'ssangseong', tier: 'ordinary', tacticalSkillId: 'ts_151', advantageSkillId: 'ts_053', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    yao: { generalId: 'yao', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_672', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    kong_d: { generalId: 'kong_d', tier: 'ordinary', tacticalSkillId: 'ts_049', advantageSkillId: 'ts_657', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    tongma: { generalId: 'tongma', tier: 'ordinary', tacticalSkillId: 'ts_008', advantageSkillId: 'ts_021', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    yanchuan_d: { generalId: 'yanchuan_d', tier: 'ordinary', tacticalSkillId: 'ts_092', advantageSkillId: 'ts_032', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    guide_d: { generalId: 'guide_d', tier: 'ordinary', tacticalSkillId: 'ts_737', advantageSkillId: 'ts_609', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    tongzhou: { generalId: 'tongzhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_618', balanceSkillId: 'ts_190', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    fu_zhou: { generalId: 'fu_zhou', tier: 'ordinary', tacticalSkillId: 'ts_263', advantageSkillId: 'ts_660', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    lushui: { generalId: 'lushui', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_036', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    cen_d: { generalId: 'cen_d', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_031', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    miao: { generalId: 'miao', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_002', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    jiang_s: { generalId: 'jiang_s', tier: 'ordinary', tacticalSkillId: 'ts_183', advantageSkillId: 'ts_261', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    muong: { generalId: 'muong', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_001', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_718', aptitude: 'create' },

    panyao: { generalId: 'panyao', tier: 'ordinary', tacticalSkillId: 'ts_717', advantageSkillId: 'ts_002', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    chen2: { generalId: 'chen2', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_657', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    qian: { generalId: 'qian', tier: 'ordinary', tacticalSkillId: 'ts_718', advantageSkillId: 'ts_021', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    qinghai: { generalId: 'qinghai', tier: 'ordinary', tacticalSkillId: 'ts_291', advantageSkillId: 'ts_397', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    jiashi: { generalId: 'jiashi', tier: 'ordinary', tacticalSkillId: 'ts_310', advantageSkillId: 'ts_406', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    yangtong: { generalId: 'yangtong', tier: 'ordinary', tacticalSkillId: 'ts_122', advantageSkillId: 'ts_672', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    monpa: { generalId: 'monpa', tier: 'ordinary', tacticalSkillId: 'ts_410', advantageSkillId: 'ts_657', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    xining: { generalId: 'xining', tier: 'ordinary', tacticalSkillId: 'ts_205', advantageSkillId: 'ts_739', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    kalun: { generalId: 'kalun', tier: 'ordinary', tacticalSkillId: 'ts_291', advantageSkillId: 'ts_041', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    golog: { generalId: 'golog', tier: 'ordinary', tacticalSkillId: 'ts_707', advantageSkillId: 'ts_040', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    lopi: { generalId: 'lopi', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_070', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    donghu: { generalId: 'donghu', tier: 'ordinary', tacticalSkillId: 'ts_041', advantageSkillId: 'ts_053', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    dingling: { generalId: 'dingling', tier: 'ordinary', tacticalSkillId: 'ts_656', advantageSkillId: 'ts_003', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    yingzhou_ying_d: { generalId: 'yingzhou_ying_d', tier: 'ordinary', tacticalSkillId: 'ts_672', advantageSkillId: 'ts_031', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    buriat: { generalId: 'buriat', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_003', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    oirat_ming: { generalId: 'oirat_ming', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_070', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    donghui: { generalId: 'donghui', tier: 'ordinary', tacticalSkillId: 'ts_046', advantageSkillId: 'ts_003', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    gonggu: { generalId: 'gonggu', tier: 'ordinary', tacticalSkillId: 'ts_409', advantageSkillId: 'ts_666', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yizhi: { generalId: 'yizhi', tier: 'ordinary', tacticalSkillId: 'ts_003', advantageSkillId: 'ts_032', balanceSkillId: 'ts_042', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    beihai: { generalId: 'beihai', tier: 'ordinary', tacticalSkillId: 'ts_781', advantageSkillId: 'ts_801', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    sheng_d: { generalId: 'sheng_d', tier: 'ordinary', tacticalSkillId: 'ts_288', advantageSkillId: 'ts_002', balanceSkillId: 'ts_642', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    haikou: { generalId: 'haikou', tier: 'ordinary', tacticalSkillId: 'ts_685', advantageSkillId: 'ts_654', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    shanshan: { generalId: 'shanshan', tier: 'ordinary', tacticalSkillId: 'ts_048', advantageSkillId: 'ts_392', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    qianhui: { generalId: 'qianhui', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_002', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    ava: { generalId: 'ava', tier: 'ordinary', tacticalSkillId: 'ts_793', advantageSkillId: 'ts_031', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    dian: { generalId: 'dian', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_053', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_247', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    mon: { generalId: 'mon', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_001', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    ganden: { generalId: 'ganden', tier: 'ordinary', tacticalSkillId: 'ts_413', advantageSkillId: 'ts_654', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    niang: { generalId: 'niang', tier: 'ordinary', tacticalSkillId: 'ts_585', advantageSkillId: 'ts_406', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    dalung: { generalId: 'dalung', tier: 'ordinary', tacticalSkillId: 'ts_703', advantageSkillId: 'ts_077', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    dong: { generalId: 'dong', tier: 'ordinary', tacticalSkillId: 'ts_374', advantageSkillId: 'ts_801', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_374', aptitude: 'create' },

    hor: { generalId: 'hor', tier: 'ordinary', tacticalSkillId: 'ts_318', advantageSkillId: 'ts_672', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    pyu: { generalId: 'pyu', tier: 'ordinary', tacticalSkillId: 'ts_704', advantageSkillId: 'ts_031', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    nongzhigao: { generalId: 'nongzhigao', tier: 'ordinary', tacticalSkillId: 'ts_143', advantageSkillId: 'ts_609', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    weitou: { generalId: 'weitou', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_657', balanceSkillId: 'ts_043', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_801', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    yumi: { generalId: 'yumi', tier: 'ordinary', tacticalSkillId: 'ts_040', advantageSkillId: 'ts_003', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    qiemo: { generalId: 'qiemo', tier: 'ordinary', tacticalSkillId: 'ts_039', advantageSkillId: 'ts_609', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_669', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    pishan: { generalId: 'pishan', tier: 'ordinary', tacticalSkillId: 'ts_406', advantageSkillId: 'ts_702', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    ruoqiang: { generalId: 'ruoqiang', tier: 'ordinary', tacticalSkillId: 'ts_712', advantageSkillId: 'ts_077', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    weili: { generalId: 'weili', tier: 'ordinary', tacticalSkillId: 'ts_053', advantageSkillId: 'ts_392', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    wensu: { generalId: 'wensu', tier: 'ordinary', tacticalSkillId: 'ts_104', advantageSkillId: 'ts_660', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    duerbote: { generalId: 'duerbote', tier: 'ordinary', tacticalSkillId: 'ts_043', advantageSkillId: 'ts_392', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_388', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    xiye: { generalId: 'xiye', tier: 'ordinary', tacticalSkillId: 'ts_114', advantageSkillId: 'ts_397', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_413', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    faqiang: { generalId: 'faqiang', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_070', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    zhuoshi: { generalId: 'zhuoshi', tier: 'ordinary', tacticalSkillId: 'ts_342', advantageSkillId: 'ts_392', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    xingliao: { generalId: 'xingliao', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_660', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_407', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    xihai_d: { generalId: 'xihai_d', tier: 'ordinary', tacticalSkillId: 'ts_014', advantageSkillId: 'ts_039', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    guzgan: { generalId: 'guzgan', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_627', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    kawusi: { generalId: 'kawusi', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_397', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    xianhai: { generalId: 'xianhai', tier: 'ordinary', tacticalSkillId: 'ts_045', advantageSkillId: 'ts_077', balanceSkillId: 'ts_099', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_709', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    wuhu: { generalId: 'wuhu', tier: 'ordinary', tacticalSkillId: 'ts_009', advantageSkillId: 'ts_392', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    xingan: { generalId: 'xingan', tier: 'ordinary', tacticalSkillId: 'ts_006', advantageSkillId: 'ts_031', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    dongping: { generalId: 'dongping', tier: 'ordinary', tacticalSkillId: 'ts_291', advantageSkillId: 'ts_009', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    badakhshan: { generalId: 'badakhshan', tier: 'ordinary', tacticalSkillId: 'ts_668', advantageSkillId: 'ts_397', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    keliya: { generalId: 'keliya', tier: 'ordinary', tacticalSkillId: 'ts_624', advantageSkillId: 'ts_070', balanceSkillId: 'ts_768', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    bailong: { generalId: 'bailong', tier: 'ordinary', tacticalSkillId: 'ts_341', advantageSkillId: 'ts_609', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    sai: { generalId: 'sai', tier: 'ordinary', tacticalSkillId: 'ts_115', advantageSkillId: 'ts_666', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    weiwuer: { generalId: 'weiwuer', tier: 'ordinary', tacticalSkillId: 'ts_053', advantageSkillId: 'ts_392', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    kangba: { generalId: 'kangba', tier: 'ordinary', tacticalSkillId: 'ts_369', advantageSkillId: 'ts_397', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    yong: { generalId: 'yong', tier: 'ordinary', tacticalSkillId: 'ts_010', advantageSkillId: 'ts_021', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    jingcheng_d: { generalId: 'jingcheng_d', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_001', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    xin: { generalId: 'xin', tier: 'ordinary', tacticalSkillId: 'ts_090', advantageSkillId: 'ts_627', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

  pangzha: { generalId: 'pangzha', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_041', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    najie: { generalId: 'najie', tier: 'ordinary', tacticalSkillId: 'ts_580', advantageSkillId: 'ts_005', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

  dulan_d: { generalId: 'dulan_d', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_609', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    muer: { generalId: 'muer', tier: 'ordinary', tacticalSkillId: 'ts_150', advantageSkillId: 'ts_009', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

  baha: { generalId: 'baha', tier: 'ordinary', tacticalSkillId: 'ts_673', advantageSkillId: 'ts_032', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    hali: { generalId: 'hali', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_660', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

  kalan: { generalId: 'kalan', tier: 'ordinary', tacticalSkillId: 'ts_663', advantageSkillId: 'ts_657', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

  xisi: { generalId: 'xisi', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_648', balanceSkillId: 'ts_404', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

  delan: { generalId: 'delan', tier: 'ordinary', tacticalSkillId: 'ts_136', advantageSkillId: 'ts_621', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_040', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    huluo: { generalId: 'huluo', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_702', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_247', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

  aba: { generalId: 'aba', tier: 'ordinary', tacticalSkillId: 'ts_314', advantageSkillId: 'ts_031', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    wenling: { generalId: 'wenling', tier: 'ordinary', tacticalSkillId: 'ts_642', advantageSkillId: 'ts_005', balanceSkillId: 'ts_114', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_009', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    qianzhou: { generalId: 'qianzhou', tier: 'ordinary', tacticalSkillId: 'ts_628', advantageSkillId: 'ts_618', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    wuyue: { generalId: 'wuyue', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_032', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    shaozhou_d: { generalId: 'shaozhou_d', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_010', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    chuzhou_d: { generalId: 'chuzhou_d', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_077', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    xiyuduhu: { generalId: 'xiyuduhu', tier: 'ordinary', tacticalSkillId: 'ts_064', advantageSkillId: 'ts_801', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    zizhou: { generalId: 'zizhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_003', balanceSkillId: 'ts_402', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    cangzhou: { generalId: 'cangzhou', tier: 'ordinary', tacticalSkillId: 'ts_662', advantageSkillId: 'ts_039', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_031', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yuezhi: { generalId: 'yuezhi', tier: 'ordinary', tacticalSkillId: 'ts_047', advantageSkillId: 'ts_666', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_405', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_048', aptitude: 'create' },

    minyue: { generalId: 'minyue', tier: 'ordinary', tacticalSkillId: 'ts_731', advantageSkillId: 'ts_003', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    funan: { generalId: 'funan', tier: 'ordinary', tacticalSkillId: 'ts_530', advantageSkillId: 'ts_666', balanceSkillId: 'ts_731', disadvantageSkillId: 'ts_412', atkAdvantageSkillId: 'ts_021', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    lancang: { generalId: 'lancang', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_739', balanceSkillId: 'ts_624', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_397', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    ahaomu: { generalId: 'ahaomu', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_053', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_045', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    elunchunzu: { generalId: 'elunchunzu', tier: 'ordinary', tacticalSkillId: 'ts_388', advantageSkillId: 'ts_392', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    wazu: { generalId: 'wazu', tier: 'ordinary', tacticalSkillId: 'ts_053', advantageSkillId: 'ts_002', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    tajikezu: { generalId: 'tajikezu', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_609', balanceSkillId: 'ts_409', disadvantageSkillId: 'ts_651', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    jingpozu: { generalId: 'jingpozu', tier: 'ordinary', tacticalSkillId: 'ts_666', advantageSkillId: 'ts_003', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_008', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_043', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_704', aptitude: 'create' },

    shuizu: { generalId: 'shuizu', tier: 'ordinary', tacticalSkillId: 'ts_353', advantageSkillId: 'ts_654', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    liuzhou: { generalId: 'liuzhou', tier: 'ordinary', tacticalSkillId: 'ts_454', advantageSkillId: 'ts_077', balanceSkillId: 'ts_454', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    luming: { generalId: 'luming', tier: 'ordinary', tacticalSkillId: 'ts_590', advantageSkillId: 'ts_672', balanceSkillId: 'ts_014', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_702', atkBalanceSkillId: 'ts_403', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_041', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    dingzhou: { generalId: 'dingzhou', tier: 'ordinary', tacticalSkillId: 'ts_127', advantageSkillId: 'ts_739', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_707', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    shanzhou: { generalId: 'shanzhou', tier: 'ordinary', tacticalSkillId: 'ts_266', advantageSkillId: 'ts_039', balanceSkillId: 'ts_047', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_651', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    weizhou: { generalId: 'weizhou', tier: 'ordinary', tacticalSkillId: 'ts_707', advantageSkillId: 'ts_002', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    yingzhou_d2: { generalId: 'yingzhou_d2', tier: 'ordinary', tacticalSkillId: 'ts_306', advantageSkillId: 'ts_031', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_096', aptitude: 'create' },

    dongsheng: { generalId: 'dongsheng', tier: 'ordinary', tacticalSkillId: 'ts_768', advantageSkillId: 'ts_077', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_053', atkBalanceSkillId: 'ts_425', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    weiyuan: { generalId: 'weiyuan', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_660', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_393', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_737', defDisadvantageSkillId: 'ts_025', aptitude: 'create' },

    yansui: { generalId: 'yansui', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_032', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_412', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    xiazhou: { generalId: 'xiazhou', tier: 'ordinary', tacticalSkillId: 'ts_015', advantageSkillId: 'ts_041', balanceSkillId: 'ts_675', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_585', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_395', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    shizhou: { generalId: 'shizhou', tier: 'ordinary', tacticalSkillId: 'ts_190', advantageSkillId: 'ts_609', balanceSkillId: 'ts_044', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_409', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    yanzhou: { generalId: 'yanzhou', tier: 'ordinary', tacticalSkillId: 'ts_036', advantageSkillId: 'ts_397', balanceSkillId: 'ts_709', disadvantageSkillId: 'ts_209', atkAdvantageSkillId: 'ts_406', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_031', defBalanceSkillId: 'ts_014', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

        qin_simacuo: { generalId: 'qin_simacuo', tier: 'famous', tacticalSkillId: 'ts_591', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_591', disadvantageSkillId: 'ts_592', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_591', atkDisadvantageSkillId: 'ts_592', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_593', aptitude: 'leverage' },

        tang_lishimin: { generalId: 'tang_lishimin', tier: 'famous', tacticalSkillId: 'ts_434', strategicSkillId: 'str_06', advantageSkillId: 'ts_434', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_435', atkAdvantageSkillId: 'ts_434', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_435', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuzhou_d_wuzetian: { generalId: 'wuzhou_d_wuzetian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        ming_d_zhudi: { generalId: 'ming_d_zhudi', tier: 'famous', tacticalSkillId: 'ts_573', strategicSkillId: 'str_21', advantageSkillId: 'ts_573', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_574', atkAdvantageSkillId: 'ts_573', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_574', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_575', aptitude: 'leverage' },

    jinling_tandaoji: { generalId: 'jinling_tandaoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guangzhou_liuyin: { generalId: 'guangzhou_liuyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shu_liubei: { generalId: 'shu_liubei', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yangzhou_wangping: { generalId: 'yangzhou_wangping', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_169', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yang_zhou_yangxingmi: { generalId: 'yang_zhou_yangxingmi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_274', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pagan_anulvtuo: { generalId: 'pagan_anulvtuo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_307', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liang_d_zhangxun: { generalId: 'liang_d_zhangxun', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qiuci_baiba: { generalId: 'qiuci_baiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        tubo_songzanganbu: { generalId: 'tubo_songzanganbu', tier: 'famous', tacticalSkillId: 'ts_615', strategicSkillId: 'str_26', advantageSkillId: 'ts_615', balanceSkillId: 'ts_616', disadvantageSkillId: 'ts_617', atkAdvantageSkillId: 'ts_615', atkBalanceSkillId: 'ts_616', atkDisadvantageSkillId: 'ts_617', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        menggu_d_chengjisihan: { generalId: 'menggu_d_chengjisihan', tier: 'famous', tacticalSkillId: 'ts_059', strategicSkillId: 'str_24', advantageSkillId: 'ts_059', balanceSkillId: 'ts_442', disadvantageSkillId: 'ts_443', atkAdvantageSkillId: 'ts_059', atkBalanceSkillId: 'ts_442', atkDisadvantageSkillId: 'ts_443', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        bohai_dazuorong: { generalId: 'bohai_dazuorong', tier: 'famous', tacticalSkillId: 'ts_471', strategicSkillId: 'str_06', advantageSkillId: 'ts_471', balanceSkillId: 'ts_472', disadvantageSkillId: 'ts_473', atkAdvantageSkillId: 'ts_471', atkBalanceSkillId: 'ts_472', atkDisadvantageSkillId: 'ts_473', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    goryeo_jianghanzan: { generalId: 'goryeo_jianghanzan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_382', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ashikaga_zulizunshi: { generalId: 'ashikaga_zulizunshi', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_345', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'attack' },

        tiemuer_tiemuer: { generalId: 'tiemuer_tiemuer', tier: 'famous', tacticalSkillId: 'ts_680', strategicSkillId: 'str_24', advantageSkillId: 'ts_680', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_681', atkAdvantageSkillId: 'ts_680', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_681', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_682', aptitude: 'leverage' },

        siam_nalixuan: { generalId: 'siam_nalixuan', tier: 'famous', tacticalSkillId: 'ts_612', strategicSkillId: 'str_12', advantageSkillId: 'ts_612', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_613', atkAdvantageSkillId: 'ts_612', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_613', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_614', aptitude: 'leverage' },

        shang_fuhao: { generalId: 'shang_fuhao', tier: 'famous', tacticalSkillId: 'ts_777', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_777', atkAdvantageSkillId: 'ts_200', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_777', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bing_liji: { generalId: 'bing_liji', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_208', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    min_wangshenzhi: { generalId: 'min_wangshenzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    quanzhou_liucongxiao: { generalId: 'quanzhou_liucongxiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    han_d_liubang: { generalId: 'han_d_liubang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        wei_wuqi: { generalId: 'wei_wuqi', tier: 'famous', tacticalSkillId: 'ts_428', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_428', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_428', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_429', aptitude: 'leverage' },

        manzhou_d_duoergun: { generalId: 'manzhou_d_duoergun', tier: 'famous', tacticalSkillId: 'ts_446', strategicSkillId: 'str_24', advantageSkillId: 'ts_446', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_447', atkAdvantageSkillId: 'ts_446', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_447', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xinluo_jinyuxin: { generalId: 'xinluo_jinyuxin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_330', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        edo_dechuanjiakang: { generalId: 'edo_dechuanjiakang', tier: 'famous', tacticalSkillId: 'ts_507', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_507', disadvantageSkillId: 'ts_508', atkAdvantageSkillId: 'ts_127', atkBalanceSkillId: 'ts_507', atkDisadvantageSkillId: 'ts_508', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_509', aptitude: 'leverage' },

        seljuq_sangjiaer: { generalId: 'seljuq_sangjiaer', tier: 'famous', tacticalSkillId: 'ts_600', strategicSkillId: 'str_24', advantageSkillId: 'ts_600', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_601', atkAdvantageSkillId: 'ts_600', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_601', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_602', aptitude: 'leverage' },

        chenla_duyebamo: { generalId: 'chenla_duyebamo', tier: 'famous', tacticalSkillId: 'ts_483', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_483', disadvantageSkillId: 'ts_484', atkAdvantageSkillId: 'ts_129', atkBalanceSkillId: 'ts_483', atkDisadvantageSkillId: 'ts_484', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_485', aptitude: 'leverage' },

    sizhou_hanshizhong: { generalId: 'sizhou_hanshizhong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_170', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kai_wutianxinxuan: { generalId: 'kai_wutianxinxuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    echigo_shangshanqianxin: { generalId: 'echigo_shangshanqianxin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_281', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    hashiba_fengchenxiuji: { generalId: 'hashiba_fengchenxiuji', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_280', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sanada_d_zhentianxingcun: { generalId: 'sanada_d_zhentianxingcun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_156', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    date_d_yidazhengzong: { generalId: 'date_d_yidazhengzong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_282', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        owari_zhitianxinchang: { generalId: 'owari_zhitianxinchang', tier: 'famous', tacticalSkillId: 'ts_579', strategicSkillId: 'str_17', advantageSkillId: 'ts_579', balanceSkillId: 'ts_580', disadvantageSkillId: 'ts_581', atkAdvantageSkillId: 'ts_579', atkBalanceSkillId: 'ts_580', atkDisadvantageSkillId: 'ts_042', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_581', aptitude: 'leverage' },

    totomi_jiujingzhongci: { generalId: 'totomi_jiujingzhongci', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_363', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jinchuan_jinchuanyiyuan: { generalId: 'jinchuan_jinchuanyiyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        aki_maoliyuanjiu: { generalId: 'aki_maoliyuanjiu', tier: 'famous', tacticalSkillId: 'ts_468', strategicSkillId: 'str_16', advantageSkillId: 'ts_011', balanceSkillId: 'ts_468', disadvantageSkillId: 'ts_470', atkAdvantageSkillId: 'ts_380', atkBalanceSkillId: 'ts_468', atkDisadvantageSkillId: 'ts_470', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_469', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chosokabe_changzongwobuyuanqin: { generalId: 'chosokabe_changzongwobuyuanqin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_364', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    satsuma_daojinjiajiu: { generalId: 'satsuma_daojinjiajiu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    otomo_d_lihuadaoxue: { generalId: 'otomo_d_lihuadaoxue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    izumo_shanzhonglujie: { generalId: 'izumo_shanzhonglujie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kaga_d_xiajianlailian: { generalId: 'kaga_d_xiajianlailian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        iga_d_baididanbo: { generalId: 'iga_d_baididanbo', tier: 'ordinary', tacticalSkillId: 'ts_778', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_778', atkAdvantageSkillId: 'ts_046', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_778', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jibei2_qingshuizongzhi: { generalId: 'jibei2_qingshuizongzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yamato_nanmuzhengcheng: { generalId: 'yamato_nanmuzhengcheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        aizu_pushengshixiang: { generalId: 'aizu_pushengshixiang', tier: 'ordinary', tacticalSkillId: 'ts_779', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_779', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_779', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    suwa_d_zoufanglaizhong: { generalId: 'suwa_d_zoufanglaizhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shimotsuke_yudougongguanggang: { generalId: 'shimotsuke_yudougongguanggang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    higo_d_juchiwuguang: { generalId: 'higo_d_juchiwuguang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_381', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    iyo_d_cunshangwuji: { generalId: 'iyo_d_cunshangwuji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_346', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nanbu_nanbuqingzheng: { generalId: 'nanbu_nanbuqingzheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    osumi_ganfujianxu: { generalId: 'osumi_ganfujianxu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fujiwara_yuanyijing: { generalId: 'fujiwara_yuanyijing', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_344', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    kakizaki_liqiqingguang: { generalId: 'kakizaki_liqiqingguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ayinu_hushemoquan: { generalId: 'ayinu_hushemoquan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    so_zongyizhi: { generalId: 'so_zongyizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    taira_pingzhisheng: { generalId: 'taira_pingzhisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lelang_wangqi: { generalId: 'lelang_wangqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    anmei_yuwandaqin: { generalId: 'anmei_yuwandaqin', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    chen3_jizhun: { generalId: 'chen3_jizhun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        joseon_lichenggui: { generalId: 'joseon_lichenggui', tier: 'famous', tacticalSkillId: 'ts_543', strategicSkillId: 'str_06', advantageSkillId: 'ts_543', balanceSkillId: 'ts_544', disadvantageSkillId: 'ts_545', atkAdvantageSkillId: 'ts_543', atkBalanceSkillId: 'ts_544', atkDisadvantageSkillId: 'ts_545', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gaogouli_yizhiwende: { generalId: 'gaogouli_yizhiwende', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    baiji_jiebo: { generalId: 'baiji_jiebo', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_012', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    zhen_zhenxuan: { generalId: 'zhen_zhenxuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_340', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    danluo_jintongjing: { generalId: 'danluo_jintongjing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        sambyeol_lishunchen: { generalId: 'sambyeol_lishunchen', tier: 'famous', tacticalSkillId: 'ts_438', strategicSkillId: 'str_27', advantageSkillId: 'ts_438', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_439', atkAdvantageSkillId: 'ts_438', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_439', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ssangseong_cuiying: { generalId: 'ssangseong_cuiying', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

        gaya_jinshoulu: { generalId: 'gaya_jinshoulu', tier: 'ordinary', tacticalSkillId: 'ts_780', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_780', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_780', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xuantu_yuangaisuwen: { generalId: 'xuantu_yuangaisuwen', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    naju_d_wangjian_wangye: { generalId: 'naju_d_wangjian_wangye', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chungju_d_quanli: { generalId: 'chungju_d_quanli', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sabeol_jinshimin: { generalId: 'sabeol_jinshimin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huimo_gaoyanshou: { generalId: 'huimo_gaoyanshou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    aola_menglielun: { generalId: 'aola_menglielun', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    ewenki_gentemuer: { generalId: 'ewenki_gentemuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    haixi_nvzhen_baiyindali: { generalId: 'haixi_nvzhen_baiyindali', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dazhen_wanyantiege: { generalId: 'dazhen_wanyantiege', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yehe_jintaiji: { generalId: 'yehe_jintaiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guishuang_qiujiuque: { generalId: 'guishuang_qiujiuque', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_361', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qidan_shulvping: { generalId: 'qidan_shulvping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hui_bunaihou: { generalId: 'hui_bunaihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jilizhou_chengmingzhen: { generalId: 'jilizhou_chengmingzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_351', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nuergan_kangwang: { generalId: 'nuergan_kangwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        manzhou_nuerhachi: { generalId: 'manzhou_nuerhachi', tier: 'famous', tacticalSkillId: 'ts_570', strategicSkillId: 'str_24', advantageSkillId: 'ts_570', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_571', atkAdvantageSkillId: 'ts_570', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_571', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_572', aptitude: 'leverage' },

        wuliangha_subutai: { generalId: 'wuliangha_subutai', tier: 'famous', tacticalSkillId: 'ts_636', strategicSkillId: 'str_01', advantageSkillId: 'ts_636', balanceSkillId: 'ts_637', disadvantageSkillId: 'ts_638', atkAdvantageSkillId: 'ts_636', atkBalanceSkillId: 'ts_637', atkDisadvantageSkillId: 'ts_638', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fuyu_weichoutai: { generalId: 'fuyu_weichoutai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dajin_wanyanaguda: { generalId: 'dajin_wanyanaguda', tier: 'famous', tacticalSkillId: 'ts_444', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_444', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_444', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_445', aptitude: 'leverage' },

        yizhou_wanyanloushi: { generalId: 'yizhou_wanyanloushi', tier: 'famous', tacticalSkillId: 'ts_666', strategicSkillId: 'str_01', advantageSkillId: 'ts_666', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_667', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_667', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_668', aptitude: 'leverage' },

        aisin_d_huangtaiji: { generalId: 'aisin_d_huangtaiji', tier: 'famous', tacticalSkillId: 'ts_465', strategicSkillId: 'str_06', advantageSkillId: 'ts_465', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_466', atkAdvantageSkillId: 'ts_465', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_466', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_467', aptitude: 'create' },

    xianbei_tuobamao: { generalId: 'xianbei_tuobamao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    suolun_bomuboguoer: { generalId: 'suolun_bomuboguoer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongxia_puxianwannu: { generalId: 'dongxia_puxianwannu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wula_buzhantai: { generalId: 'wula_buzhantai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dada_ming_dayanhan: { generalId: 'dada_ming_dayanhan', tier: 'famous', tacticalSkillId: 'ts_489', strategicSkillId: 'str_25', advantageSkillId: 'ts_489', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_490', atkAdvantageSkillId: 'ts_489', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_490', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_491', aptitude: 'leverage' },

    keerqin_aoba: { generalId: 'keerqin_aoba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wure_wuzhaodu: { generalId: 'wure_wuzhaodu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    houliao_yelvliuge: { generalId: 'houliao_yelvliuge', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_333', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    heishui_nishuli: { generalId: 'heishui_nishuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    heisha_d_houlihu: { generalId: 'heisha_d_houlihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hezhe_shaerhuda: { generalId: 'hezhe_shaerhuda', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_365', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dawoer_baerdaqi: { generalId: 'dawoer_baerdaqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mohe_wanyanzonghan: { generalId: 'mohe_wanyanzonghan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_360', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yeren_nvzhen_boke: { generalId: 'yeren_nvzhen_boke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuji_yilizhi: { generalId: 'wuji_yilizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jilin_fujun: { generalId: 'jilin_fujun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongdan_yelvbei: { generalId: 'dongdan_yelvbei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kuye_kuye_qichayi: { generalId: 'kuye_kuye_qichayi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sushen_tudiji: { generalId: 'sushen_tudiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yilou_naoya: { generalId: 'yilou_naoya', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    maomingan_suoetu: { generalId: 'maomingan_suoetu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jilimi_takuna: { generalId: 'jilimi_takuna', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    eluoke_amuhaer: { generalId: 'eluoke_amuhaer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nifuhe_baerhudai: { generalId: 'nifuhe_baerhudai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    feiyaka_cemutehe: { generalId: 'feiyaka_cemutehe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nanai_zhahaluo: { generalId: 'nanai_zhahaluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    woju_yinguan: { generalId: 'woju_yinguan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luzhou_zhangwenxiu: { generalId: 'luzhou_zhangwenxiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        jurchen_wanyanzongbi: { generalId: 'jurchen_wanyanzongbi', tier: 'famous', tacticalSkillId: 'ts_546', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_546', disadvantageSkillId: 'ts_547', atkAdvantageSkillId: 'ts_360', atkBalanceSkillId: 'ts_546', atkDisadvantageSkillId: 'ts_547', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_548', aptitude: 'leverage' },

    wuzhou_limu: { generalId: 'wuzhou_limu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_241', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ashina_ashinayandou: { generalId: 'ashina_ashinayandou', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

        wala_yexian: { generalId: 'wala_yexian', tier: 'famous', tacticalSkillId: 'ts_624', strategicSkillId: 'str_23', advantageSkillId: 'ts_624', balanceSkillId: 'ts_625', disadvantageSkillId: 'ts_626', atkAdvantageSkillId: 'ts_624', atkBalanceSkillId: 'ts_625', atkDisadvantageSkillId: 'ts_626', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yuwen_yuwentai: { generalId: 'yuwen_yuwentai', tier: 'famous', tacticalSkillId: 'ts_678', strategicSkillId: 'str_17', advantageSkillId: 'ts_678', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_679', atkAdvantageSkillId: 'ts_678', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_679', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chenli_d_wutang: { generalId: 'chenli_d_wutang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nuoyan_d_sanyinnuoyan: { generalId: 'nuoyan_d_sanyinnuoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuli_d_celeng: { generalId: 'wuli_d_celeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        jiluo_d_douxian: { generalId: 'jiluo_d_douxian', tier: 'famous', tacticalSkillId: 'ts_534', strategicSkillId: 'str_01', advantageSkillId: 'ts_534', balanceSkillId: 'ts_535', disadvantageSkillId: 'ts_536', atkAdvantageSkillId: 'ts_534', atkBalanceSkillId: 'ts_535', atkDisadvantageSkillId: 'ts_536', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        liao_d_yelvabaoji: { generalId: 'liao_d_yelvabaoji', tier: 'famous', tacticalSkillId: 'ts_561', strategicSkillId: 'str_28', advantageSkillId: 'ts_561', balanceSkillId: 'ts_562', disadvantageSkillId: 'ts_563', atkAdvantageSkillId: 'ts_561', atkBalanceSkillId: 'ts_562', atkDisadvantageSkillId: 'ts_563', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yel_yelvxiuge: { generalId: 'yel_yelvxiuge', tier: 'famous', tacticalSkillId: 'ts_660', strategicSkillId: 'str_01', advantageSkillId: 'ts_660', balanceSkillId: 'ts_661', disadvantageSkillId: 'ts_662', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_661', atkDisadvantageSkillId: 'ts_662', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    kumoxi_ahuihui: { generalId: 'kumoxi_ahuihui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kumo_xiwanghuilibao: { generalId: 'kumo_xiwanghuilibao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    geluolu_chisipijia: { generalId: 'geluolu_chisipijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        ogodei_chuoermahan: { generalId: 'ogodei_chuoermahan', tier: 'famous', tacticalSkillId: 'ts_576', strategicSkillId: 'str_13', advantageSkillId: 'ts_576', balanceSkillId: 'ts_577', disadvantageSkillId: 'ts_578', atkAdvantageSkillId: 'ts_576', atkBalanceSkillId: 'ts_577', atkDisadvantageSkillId: 'ts_578', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    merkit_boyan: { generalId: 'merkit_boyan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_235', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        tumed_andahan: { generalId: 'tumed_andahan', tier: 'famous', tacticalSkillId: 'ts_621', strategicSkillId: 'str_24', advantageSkillId: 'ts_621', balanceSkillId: 'ts_622', disadvantageSkillId: 'ts_623', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_622', atkDisadvantageSkillId: 'ts_623', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kiyad_yesugai: { generalId: 'kiyad_yesugai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xiajiasi_are: { generalId: 'xiajiasi_are', tier: 'famous', tacticalSkillId: 'ts_642', strategicSkillId: 'str_01', advantageSkillId: 'ts_642', balanceSkillId: 'ts_643', disadvantageSkillId: 'ts_644', atkAdvantageSkillId: 'ts_642', atkBalanceSkillId: 'ts_643', atkDisadvantageSkillId: 'ts_644', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xiongnu_maodun: { generalId: 'xiongnu_maodun', tier: 'famous', tacticalSkillId: 'ts_648', strategicSkillId: 'str_23', advantageSkillId: 'ts_648', balanceSkillId: 'ts_650', disadvantageSkillId: 'ts_649', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_650', atkDisadvantageSkillId: 'ts_649', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    murong_murongke: { generalId: 'murong_murongke', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_236', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuhuan_tadun: { generalId: 'wuhuan_tadun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yuan_d_hubilie: { generalId: 'yuan_d_hubilie', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_246', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mengwu_hebulehan: { generalId: 'mengwu_hebulehan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shaodang_mitang: { generalId: 'shaodang_mitang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        shatuo_likeyong: { generalId: 'shatuo_likeyong', tier: 'famous', tacticalSkillId: 'ts_606', strategicSkillId: 'str_01', advantageSkillId: 'ts_606', balanceSkillId: 'ts_607', disadvantageSkillId: 'ts_608', atkAdvantageSkillId: 'ts_606', atkBalanceSkillId: 'ts_607', atkDisadvantageSkillId: 'ts_608', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xueyantuo_yinan: { generalId: 'xueyantuo_yinan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_244', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        huige_gulipeiluo: { generalId: 'huige_gulipeiluo', tier: 'famous', tacticalSkillId: 'ts_528', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_528', disadvantageSkillId: 'ts_529', atkAdvantageSkillId: 'ts_133', atkBalanceSkillId: 'ts_528', atkDisadvantageSkillId: 'ts_529', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_530', aptitude: 'leverage' },

    huizhou_zhugeliang: { generalId: 'huizhou_zhugeliang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kereyid_wanghan: { generalId: 'kereyid_wanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    naiman_taiyanghan: { generalId: 'naiman_taiyanghan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tatar_mieguzhen: { generalId: 'tatar_mieguzhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tushetu_tuxietuhan: { generalId: 'tushetu_tuxietuhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhasaketu_zhasakesubadi: { generalId: 'zhasaketu_zhasakesubadi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gaoche_afuzhiluo: { generalId: 'gaoche_afuzhiluo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        tujue_ashinatumen: { generalId: 'tujue_ashinatumen', tier: 'famous', tacticalSkillId: 'ts_618', strategicSkillId: 'str_12', advantageSkillId: 'ts_618', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_619', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_619', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_620', aptitude: 'leverage' },

        da_yuan_kuokuotiemuer: { generalId: 'da_yuan_kuokuotiemuer', tier: 'famous', tacticalSkillId: 'ts_486', strategicSkillId: 'str_16', advantageSkillId: 'ts_486', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_487', atkAdvantageSkillId: 'ts_486', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_487', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_488', aptitude: 'leverage' },

    yujiulu_yujiulv: { generalId: 'yujiulu_yujiulv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yaoluoge_yaoluogepusa: { generalId: 'yaoluoge_yaoluogepusa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jalair_muhuali: { generalId: 'jalair_muhuali', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_231', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hongirad_dexuechan: { generalId: 'hongirad_dexuechan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    choros_tuohuan: { generalId: 'choros_tuohuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ashide_ashidejieli: { generalId: 'ashide_ashidejieli', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

    duolu_ashinahelu: { generalId: 'duolu_ashinahelu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cheshihou_angui: { generalId: 'cheshihou_angui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kaerka_abadaihan: { generalId: 'kaerka_abadaihan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huyan_peicen: { generalId: 'huyan_peicen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chahar_yantiemuer: { generalId: 'chahar_yantiemuer', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'attack' },

    ongut_alawusi: { generalId: 'ongut_alawusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        rouran_shelun: { generalId: 'rouran_shelun', tier: 'famous', tacticalSkillId: 'ts_594', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_594', disadvantageSkillId: 'ts_595', atkAdvantageSkillId: 'ts_134', atkBalanceSkillId: 'ts_594', atkDisadvantageSkillId: 'ts_595', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_596', aptitude: 'leverage' },

        chagatai_genggong: { generalId: 'chagatai_genggong', tier: 'ordinary', tacticalSkillId: 'ts_802', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_802', atkAdvantageSkillId: 'ts_386', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_802', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    huihu_dunmohedagan: { generalId: 'huihu_dunmohedagan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kelie_zhaheganbu: { generalId: 'kelie_zhaheganbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pugu_ashinaguduolu: { generalId: 'pugu_ashinaguduolu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pulei_dougu: { generalId: 'pulei_dougu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_239', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xibo_d_tubote: { generalId: 'xibo_d_tubote', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        borjigin_tuolei: { generalId: 'borjigin_tuolei', tier: 'famous', tacticalSkillId: 'ts_474', strategicSkillId: 'str_01', advantageSkillId: 'ts_012', balanceSkillId: 'ts_474', disadvantageSkillId: 'ts_476', atkAdvantageSkillId: 'ts_080', atkBalanceSkillId: 'ts_474', atkDisadvantageSkillId: 'ts_476', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_475', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    zhadalan_zhamuhe: { generalId: 'zhadalan_zhamuhe', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_247', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhuerqi_sachabieqi: { generalId: 'zhuerqi_sachabieqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chechen_chechenhanshuolei: { generalId: 'chechen_chechenhanshuolei', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'defense' },

    tumengken_tumengken: { generalId: 'tumengken_tumengken', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bayegu_qulishi: { generalId: 'bayegu_qulishi', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'attack' },

    zubu_mogusi: { generalId: 'zubu_mogusi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuzhumuqin_duoerji: { generalId: 'wuzhumuqin_duoerji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    baidi_baidizi: { generalId: 'baidi_baidizi', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    shiwei_saihou: { generalId: 'shiwei_saihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sunite_sousai: { generalId: 'sunite_sousai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        bulat_beiduanchaer: { generalId: 'bulat_beiduanchaer', tier: 'ordinary', tacticalSkillId: 'ts_781', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_781', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_781', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    tuva_qinggunzabu: { generalId: 'tuva_qinggunzabu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hepan_gaoxianzhi: { generalId: 'hepan_gaoxianzhi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_283', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yiwu_hanshen: { generalId: 'yiwu_hanshen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kepantuo_dulimi: { generalId: 'kepantuo_dulimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huite_amuersana: { generalId: 'huite_amuersana', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tuoming_tuomin: { generalId: 'tuoming_tuomin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chuyue_shatuonasu: { generalId: 'chuyue_shatuonasu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    keerkezi_manasi: { generalId: 'keerkezi_manasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pisha_weichisheng: { generalId: 'pisha_weichisheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xingxingxia_guoxiaoke: { generalId: 'xingxingxia_guoxiaoke', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_366', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yangguan_lihao: { generalId: 'yangguan_lihao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wulianghai_chelingwubashen: { generalId: 'wulianghai_chelingwubashen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        shache_xian_suoche_shachexian: { generalId: 'shache_xian_suoche_shachexian', tier: 'ordinary', tacticalSkillId: 'ts_782', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_782', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_782', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shule_aersilan: { generalId: 'shule_aersilan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dzungar_galedanceling: { generalId: 'dzungar_galedanceling', tier: 'famous', tacticalSkillId: 'ts_504', strategicSkillId: 'str_13', advantageSkillId: 'ts_504', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_505', atkAdvantageSkillId: 'ts_504', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_505', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_506', aptitude: 'reverse' },

    anxi_guoxin: { generalId: 'anxi_guoxin', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_296', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    yanqi_longtuqizhi: { generalId: 'yanqi_longtuqizhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tuerhute_wobaxi: { generalId: 'tuerhute_wobaxi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gaochang_quwentai: { generalId: 'gaochang_quwentai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yarkand_abudulatifu: { generalId: 'yarkand_abudulatifu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yiduhu_baershu: { generalId: 'yiduhu_baershu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yuchi_weichiyao: { generalId: 'yuchi_weichiyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhuxie_zhuxiechixin: { generalId: 'zhuxie_zhuxiechixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kala_satuke: { generalId: 'kala_satuke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    an_xibanni: { generalId: 'an_xibanni', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'attack' },

    saman_yisimayi: { generalId: 'saman_yisimayi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wusun_liejiaomi: { generalId: 'wusun_liejiaomi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_313', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tujishi_sulukehan: { generalId: 'tujishi_sulukehan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_312', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xiliao_yelvdashi: { generalId: 'xiliao_yelvdashi', tier: 'famous', tacticalSkillId: 'ts_645', strategicSkillId: 'str_13', advantageSkillId: 'ts_645', balanceSkillId: 'ts_646', disadvantageSkillId: 'ts_647', atkAdvantageSkillId: 'ts_645', atkBalanceSkillId: 'ts_646', atkDisadvantageSkillId: 'ts_647', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiazini_mahamaode: { generalId: 'jiazini_mahamaode', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_354', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jibin_jianisejia: { generalId: 'jibin_jianisejia', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_357', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xijue_ganyanshou: { generalId: 'xijue_ganyanshou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        huarazim_mohemo: { generalId: 'huarazim_mohemo', tier: 'famous', tacticalSkillId: 'ts_525', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_525', disadvantageSkillId: 'ts_526', atkAdvantageSkillId: 'ts_139', atkBalanceSkillId: 'ts_525', atkDisadvantageSkillId: 'ts_526', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_527', aptitude: 'leverage' },

        kazakh_hasimu: { generalId: 'kazakh_hasimu', tier: 'famous', tacticalSkillId: 'ts_549', strategicSkillId: 'str_06', advantageSkillId: 'ts_549', balanceSkillId: 'ts_550', disadvantageSkillId: 'ts_551', atkAdvantageSkillId: 'ts_549', atkBalanceSkillId: 'ts_550', atkDisadvantageSkillId: 'ts_551', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sogdian_dewasitiqi: { generalId: 'sogdian_dewasitiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yanda_touluoman: { generalId: 'yanda_touluoman', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_367', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wugu_d_tugelile: { generalId: 'wugu_d_tugelile', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    adao_d_mafushou: { generalId: 'adao_d_mafushou', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    wuyuan_d_chengui: { generalId: 'wuyuan_d_chengui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shi_clan_moheduotutun: { generalId: 'shi_clan_moheduotutun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mamon_mameng: { generalId: 'mamon_mameng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    khoja_apakehezhuo: { generalId: 'khoja_apakehezhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        fanyanna_xieer: { generalId: 'fanyanna_xieer', tier: 'ordinary', tacticalSkillId: 'ts_783', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_783', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_783', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kangju_chebishi: { generalId: 'kangju_chebishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhaowu_timuermieli: { generalId: 'zhaowu_timuermieli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qiepantuo_luozhentan: { generalId: 'qiepantuo_luozhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jie_sijinti: { generalId: 'jie_sijinti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lu_zhangliao: { generalId: 'lu_zhangliao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    quli_chentang: { generalId: 'quli_chentang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_311', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    loulan_suojie: { generalId: 'loulan_suojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    juandu_peixingjian: { generalId: 'juandu_peixingjian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_284', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dulan_dashibatuer: { generalId: 'dulan_dashibatuer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    heyuan_d_heichichangzhi: { generalId: 'heyuan_d_heichichangzhi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_300', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    song2_houjunji: { generalId: 'song2_houjunji', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_285', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        gurkha_baduersaye: { generalId: 'gurkha_baduersaye', tier: 'famous', tacticalSkillId: 'ts_519', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_519', disadvantageSkillId: 'ts_520', atkAdvantageSkillId: 'ts_325', atkBalanceSkillId: 'ts_519', atkDisadvantageSkillId: 'ts_520', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_521', aptitude: 'leverage' },

    gongbu_gongbumangbuzhi: { generalId: 'gongbu_gongbumangbuzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    khon_basiba: { generalId: 'khon_basiba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiadun_xiazhongawanglangjie: { generalId: 'xiadun_xiazhongawanglangjie', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_368', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        gar_lunqinling: { generalId: 'gar_lunqinling', tier: 'famous', tacticalSkillId: 'ts_513', strategicSkillId: 'str_12', advantageSkillId: 'ts_513', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_514', atkAdvantageSkillId: 'ts_513', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_514', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_515', aptitude: 'leverage' },

    tufa_d_tufanutan: { generalId: 'tufa_d_tufanutan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qifu_d_qifuchipan: { generalId: 'qifu_d_qifuchipan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_306', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tuyu_d_kualv: { generalId: 'tuyu_d_kualv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nvguo_mojie: { generalId: 'nvguo_mojie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    karmapa_queyingduoji: { generalId: 'karmapa_queyingduoji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xianlingqiang_dianling: { generalId: 'xianlingqiang_dianling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lang_clan_jiangqujianzan: { generalId: 'lang_clan_jiangqujianzan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_317', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiutu_jinridi: { generalId: 'xiutu_jinridi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        gandenpozhang_dibasangjiejiacuo: { generalId: 'gandenpozhang_dibasangjiejiacuo', tier: 'ordinary', tacticalSkillId: 'ts_784', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_784', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_784', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    khyungpo_qiongbobangse: { generalId: 'khyungpo_qiongbobangse', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_371', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gar_kham_dengbazeren: { generalId: 'gar_kham_dengbazeren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guangwu_xinwuxian: { generalId: 'guangwu_xinwuxian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_377', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    supi_xinuoluo: { generalId: 'supi_xinuoluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tsangpa_pengcuonanjie: { generalId: 'tsangpa_pengcuonanjie', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_349', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    spurgyal_dariniansai: { generalId: 'spurgyal_dariniansai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    galangdiba_wangqindundui: { generalId: 'galangdiba_wangqindundui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fuguo_yizeng: { generalId: 'fuguo_yizeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bailang_tangzeng: { generalId: 'bailang_tangzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    humi_zhentan: { generalId: 'humi_zhentan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiaobolu_meijinmang: { generalId: 'xiaobolu_meijinmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guge_chizhaxichabade: { generalId: 'guge_chizhaxichabade', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pazhu_redangunsangpa: { generalId: 'pazhu_redangunsangpa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ali_gandancaiwang: { generalId: 'ali_gandancaiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_362', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

    gaoliang_geshuhan: { generalId: 'gaoliang_geshuhan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    nandou_sushili: { generalId: 'nandou_sushili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bailan_pabala: { generalId: 'bailan_pabala', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'balanced' },

        jiantang_sangjiejia: { generalId: 'jiantang_sangjiejia', tier: 'ordinary', tacticalSkillId: 'ts_785', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_785', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_785', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kongsa_kongsayiduo: { generalId: 'kongsa_kongsayiduo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gling_lingesar: { generalId: 'gling_lingesar', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    daca_dacajilong: { generalId: 'daca_dacajilong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gongtang_gongtangcang: { generalId: 'gongtang_gongtangcang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nanjie_nanjiewangqiu: { generalId: 'nanjie_nanjiewangqiu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nanzhong_mazhong: { generalId: 'nanzhong_mazhong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yueyi_zhangyi: { generalId: 'yueyi_zhangyi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pingnan_musheng: { generalId: 'pingnan_musheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_335', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jingdong_taohong: { generalId: 'jingdong_taohong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luohu_ganmuding: { generalId: 'luohu_ganmuding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ailao_leilao: { generalId: 'ailao_leilao', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    mingzheng_jianzandechang: { generalId: 'mingzheng_jianzandechang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hani_d_zhebi: { generalId: 'hani_d_zhebi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dali_duansiping: { generalId: 'dali_duansiping', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_326', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongxu_mangruiti: { generalId: 'dongxu_mangruiti', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_304', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mu_lijiang_muzeng: { generalId: 'mu_lijiang_muzeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dianguo_zhuangqiao: { generalId: 'dianguo_zhuangqiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_341', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        konbaung_yongjiya: { generalId: 'konbaung_yongjiya', tier: 'famous', tacticalSkillId: 'ts_555', strategicSkillId: 'str_25', advantageSkillId: 'ts_555', balanceSkillId: 'ts_556', disadvantageSkillId: 'ts_557', atkAdvantageSkillId: 'ts_555', atkBalanceSkillId: 'ts_556', atkDisadvantageSkillId: 'ts_557', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        hantawadi_mangyinglong: { generalId: 'hantawadi_mangyinglong', tier: 'famous', tacticalSkillId: 'ts_522', strategicSkillId: 'str_12', advantageSkillId: 'ts_522', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_523', atkAdvantageSkillId: 'ts_522', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_523', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_524', aptitude: 'leverage' },

    nanzhao_geluofeng: { generalId: 'nanzhao_geluofeng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_268', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuman_cuanguiwang: { generalId: 'wuman_cuanguiwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dai_daoyingmeng: { generalId: 'dai_daoyingmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    taiyuan_menglai: { generalId: 'taiyuan_menglai', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_314', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    suke_langanheng: { generalId: 'suke_langanheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luchuan_sirenfa: { generalId: 'luchuan_sirenfa', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    kunming_yi_lucheng: { generalId: 'kunming_yi_lucheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cuanshi_cuanlongyan: { generalId: 'cuanshi_cuanlongyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        baiman_gaoshengtai: { generalId: 'baiman_gaoshengtai', tier: 'ordinary', tacticalSkillId: 'ts_786', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_786', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_786', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        champa_zhipenge: { generalId: 'champa_zhipenge', tier: 'ordinary', tacticalSkillId: 'ts_787', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_787', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_787', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    qiong_rengui: { generalId: 'qiong_rengui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    daozhou_yangzaixing: { generalId: 'daozhou_yangzaixing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guangping_ruanwenzhang: { generalId: 'guangping_ruanwenzhang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jingjiang_qushisi: { generalId: 'jingjiang_qushisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    duanzhou_d_caojin: { generalId: 'duanzhou_d_caojin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    monong_anong: { generalId: 'monong_anong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    basha_d_daogengmeng: { generalId: 'basha_d_daogengmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    leizhou_limao: { generalId: 'leizhou_limao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ketagalan_huangqingyun: { generalId: 'ketagalan_huangqingyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shuizhen_qudaren: { generalId: 'shuizhen_qudaren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ryukyu_shangbazhi: { generalId: 'ryukyu_shangbazhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luoping_zhangshijie: { generalId: 'luoping_zhangshijie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chaozhou_d_mafa: { generalId: 'chaozhou_d_mafa', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    chendiaoyan_chendiaoyan: { generalId: 'chendiaoyan_chendiaoyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dengmaoqi_dengmaoqi: { generalId: 'dengmaoqi_dengmaoqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    geng_gengjingzhong: { generalId: 'geng_gengjingzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    longwu_huangdaozhou: { generalId: 'longwu_huangdaozhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xinjiang_maji: { generalId: 'xinjiang_maji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jing_dingbuling: { generalId: 'jing_dingbuling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    paiwan_alugu: { generalId: 'paiwan_alugu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ming_zheng_zhengchenggong: { generalId: 'ming_zheng_zhengchenggong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_438', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nguyen_guangnan_ruanfuying: { generalId: 'nguyen_guangnan_ruanfuying', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_332', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhuang_d_washifuren: { generalId: 'zhuang_d_washifuren', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nanyue_zhaotuo: { generalId: 'nanyue_zhaotuo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_289', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhancheng_zhimin: { generalId: 'zhancheng_zhimin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiou_yixusong: { generalId: 'xiou_yixusong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xichu_xiangyu: { generalId: 'xichu_xiangyu', tier: 'famous', tacticalSkillId: 'ts_012', strategicSkillId: 'str_01', advantageSkillId: 'ts_426', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_012', atkAdvantageSkillId: 'ts_426', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_043', defDisadvantageSkillId: 'ts_427', aptitude: 'leverage' },

    gouding_wubo: { generalId: 'gouding_wubo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chen_chenbaxian: { generalId: 'chen_chenbaxian', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    dayu_wangshouren: { generalId: 'dayu_wangshouren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    paiyao_huangguasi: { generalId: 'paiyao_huangguasi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yingzhou_liuyan: { generalId: 'yingzhou_liuyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    linyi_fanyangmai: { generalId: 'linyi_fanyangmai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xian_d_xianfuren: { generalId: 'xian_d_xianfuren', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luodian_shexiang: { generalId: 'luodian_shexiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nong2_nongzhigao: { generalId: 'nong2_nongzhigao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_337', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        taiping_shidakai: { generalId: 'taiping_shidakai', tier: 'famous', tacticalSkillId: 'ts_683', strategicSkillId: 'str_17', advantageSkillId: 'ts_683', balanceSkillId: 'ts_684', disadvantageSkillId: 'ts_685', atkAdvantageSkillId: 'ts_683', atkBalanceSkillId: 'ts_684', atkDisadvantageSkillId: 'ts_685', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongzu_wumian: { generalId: 'dongzu_wumian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tian_sizhou_tianyougong: { generalId: 'tian_sizhou_tianyougong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luoyue_zhengce: { generalId: 'luoyue_zhengce', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    li_lx_d_liguang: { generalId: 'li_lx_d_liguang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    li_s_mayuan: { generalId: 'li_s_mayuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_07', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_338', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    dacheng_chenkai: { generalId: 'dacheng_chenkai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dayue_chenguojun: { generalId: 'dayue_chenguojun', tier: 'famous', tacticalSkillId: 'ts_440', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_440', disadvantageSkillId: 'ts_441', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_440', atkDisadvantageSkillId: 'ts_441', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shengmiao_baoli: { generalId: 'shengmiao_baoli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    miao_qing_yangwanzhe: { generalId: 'miao_qing_yangwanzhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        guizhou_lidingguo: { generalId: 'guizhou_lidingguo', tier: 'famous', tacticalSkillId: 'ts_516', strategicSkillId: 'str_01', advantageSkillId: 'ts_516', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_517', atkAdvantageSkillId: 'ts_516', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_517', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_518', aptitude: 'leverage' },

    liren_funanshe: { generalId: 'liren_funanshe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yelang_duotong: { generalId: 'yelang_duotong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zangke_xielongyu: { generalId: 'zangke_xielongyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xinggu_cuanxi: { generalId: 'xinggu_cuanxi', tier: 'ordinary', tacticalSkillId: 'ts_788', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_788', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_788', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guangxin_shixie: { generalId: 'guangxin_shixie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shaozhou_zhangzhensun: { generalId: 'shaozhou_zhangzhensun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shixing_houandou: { generalId: 'shixing_houandou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_328', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    buyi_d_weichaoyuan: { generalId: 'buyi_d_weichaoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    lizhou_d_liaohua: { generalId: 'lizhou_d_liaohua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kui_gongsunshu: { generalId: 'kui_gongsunshu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yang_bozhou_yangyinglong: { generalId: 'yang_bozhou_yangyinglong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chenghan_lite: { generalId: 'chenghan_lite', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zuo_d_wufu: { generalId: 'zuo_d_wufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    miaomin_shiliudeng: { generalId: 'miaomin_shiliudeng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wumeng_azi: { generalId: 'wumeng_azi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tujia_d_qinliangyu: { generalId: 'tujia_d_qinliangyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_271', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shuixi_anbangyan: { generalId: 'shuixi_anbangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiangzhou_lvwenhuan: { generalId: 'xiangzhou_lvwenhuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        zaoyang_d_menggong: { generalId: 'zaoyang_d_menggong', tier: 'famous', tacticalSkillId: 'ts_452', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_452', disadvantageSkillId: 'ts_453', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_452', atkDisadvantageSkillId: 'ts_453', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guo_jixin: { generalId: 'guo_jixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        daxi_ming_zhangxianzhong: { generalId: 'daxi_ming_zhangxianzhong', tier: 'famous', tacticalSkillId: 'ts_495', strategicSkillId: 'str_07', advantageSkillId: 'ts_495', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_496', atkAdvantageSkillId: 'ts_495', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_496', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_497', aptitude: 'reverse' },

    zi_changhong: { generalId: 'zi_changhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yidou_luxun: { generalId: 'yidou_luxun', tier: 'famous', tacticalSkillId: 'ts_801', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_801', atkAdvantageSkillId: 'ts_278', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_801', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chu_guanyu: { generalId: 'chu_guanyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_257', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhongxiang_ganning: { generalId: 'zhongxiang_ganning', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_180', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fengzhou_wujie: { generalId: 'fengzhou_wujie', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_192', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fushi_wangmeng: { generalId: 'fushi_wangmeng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_279', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wanzhou_shangguankui: { generalId: 'wanzhou_shangguankui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        ba_bamanzi: { generalId: 'ba_bamanzi', tier: 'ordinary', tacticalSkillId: 'ts_789', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_789', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_789', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

        hezhou_wangjian: { generalId: 'hezhou_wangjian', tier: 'famous', tacticalSkillId: 'ts_450', strategicSkillId: 'str_05', advantageSkillId: 'ts_450', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_451', atkAdvantageSkillId: 'ts_450', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_451', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        qiuchi_yangnandang: { generalId: 'qiuchi_yangnandang', tier: 'ordinary', tacticalSkillId: 'ts_790', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_790', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_790', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cong_puhu: { generalId: 'cong_puhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    langzhou_zhangfei: { generalId: 'langzhou_zhangfei', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    tan_d_qinhou: { generalId: 'tan_d_qinhou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiang_d_xiangdakun: { generalId: 'xiang_d_xiangdakun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ran_d_ranshouzhong: { generalId: 'ran_d_ranshouzhong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuxi_shamoke: { generalId: 'wuxi_shamoke', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kuai_kuaiyue: { generalId: 'kuai_kuaiyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        bandun_fanmu: { generalId: 'bandun_fanmu', tier: 'ordinary', tacticalSkillId: 'ts_791', advantageSkillId: 'ts_011', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_791', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_791', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    she_shechongming: { generalId: 'she_shechongming', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    boren_ada: { generalId: 'boren_ada', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    jingmen_zhaoyun: { generalId: 'jingmen_zhaoyun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chenzhou_d_zhanghao: { generalId: 'chenzhou_d_zhanghao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiqin_wanyanchenheshang: { generalId: 'xiqin_wanyanchenheshang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    beidi_yaochang: { generalId: 'beidi_yaochang', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'balanced' },

    baiyang_mengtian: { generalId: 'baiyang_mengtian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_249', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qianzhong_wubayue: { generalId: 'qianzhong_wubayue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dangchang_liangmiding: { generalId: 'dangchang_liangmiding', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liao_houhongyuan: { generalId: 'liao_houhongyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sou_gaodingyuan: { generalId: 'sou_gaodingyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qingqiang_jiangwei: { generalId: 'qingqiang_jiangwei', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_270', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qingyi_fanchangsheng: { generalId: 'qingyi_fanchangsheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liangzhou_zhanggui: { generalId: 'liangzhou_zhanggui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lanzhou_zhaochongguo: { generalId: 'lanzhou_zhaochongguo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_264', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wudu_dengai: { generalId: 'wudu_dengai', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_162', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    baishui_yanghuai: { generalId: 'baishui_yanghuai', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

    dangzhou_qiangduan: { generalId: 'dangzhou_qiangduan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        didao_wangshao: { generalId: 'didao_wangshao', tier: 'famous', tacticalSkillId: 'ts_456', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_456', disadvantageSkillId: 'ts_457', atkAdvantageSkillId: 'ts_122', atkBalanceSkillId: 'ts_456', atkDisadvantageSkillId: 'ts_457', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dashun_lizicheng: { generalId: 'dashun_lizicheng', tier: 'famous', tacticalSkillId: 'ts_492', strategicSkillId: 'str_07', advantageSkillId: 'ts_492', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_493', atkAdvantageSkillId: 'ts_492', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_493', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_494', aptitude: 'reverse' },

        zhai_han_diqing: { generalId: 'zhai_han_diqing', tier: 'famous', tacticalSkillId: 'ts_460', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_460', atkAdvantageSkillId: 'ts_112', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_460', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_461', aptitude: 'leverage' },

    ganzhou_dourong: { generalId: 'ganzhou_dourong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_252', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        suzhou_huoqubing: { generalId: 'suzhou_huoqubing', tier: 'famous', tacticalSkillId: 'ts_052', strategicSkillId: 'str_01', advantageSkillId: 'ts_052', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_422', atkAdvantageSkillId: 'ts_052', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_422', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_423', aptitude: 'leverage' },

        shazhou_zhangyichao: { generalId: 'shazhou_zhangyichao', tier: 'famous', tacticalSkillId: 'ts_609', strategicSkillId: 'str_26', advantageSkillId: 'ts_609', balanceSkillId: 'ts_610', disadvantageSkillId: 'ts_611', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_610', atkDisadvantageSkillId: 'ts_611', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    dongshengwei_wangyue: { generalId: 'dongshengwei_wangyue', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_251', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guiyi_caoyijin: { generalId: 'guiyi_caoyijin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    weiming_huhanxie: { generalId: 'weiming_huhanxie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    helian_helianbobo: { generalId: 'helian_helianbobo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_254', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    chile_hulvjin: { generalId: 'chile_hulvjin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chijin_qiewangshijia: { generalId: 'chijin_qiewangshijia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shuofang_weiqing: { generalId: 'shuofang_weiqing', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_276', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yeli_yeliwangrong: { generalId: 'yeli_yeliwangrong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_315', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hunxie_xuziwei: { generalId: 'hunxie_xuziwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guazhou_zhangshougui: { generalId: 'guazhou_zhangshougui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kang_liangshidou: { generalId: 'kang_liangshidou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    woye_huangfugui: { generalId: 'woye_huangfugui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_295', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yingli_jilasiyi: { generalId: 'yingli_jilasiyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dangxiang_liyuanhao: { generalId: 'dangxiang_liyuanhao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_250', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huizhou_yaosi: { generalId: 'huizhou_yaosi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huan_zhongshidao: { generalId: 'huan_zhongshidao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_255', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wei2_hunjian: { generalId: 'wei2_hunjian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_320', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        pugu_puguhuaien: { generalId: 'pugu_puguhuaien', tier: 'famous', tacticalSkillId: 'ts_567', strategicSkillId: 'str_06', advantageSkillId: 'ts_567', balanceSkillId: 'ts_568', disadvantageSkillId: 'ts_569', atkAdvantageSkillId: 'ts_567', atkBalanceSkillId: 'ts_568', atkDisadvantageSkillId: 'ts_569', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ningkou_liling: { generalId: 'ningkou_liling', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    juqu_d_juqumengxun: { generalId: 'juqu_d_juqumengxun', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_22', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_256', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhengzhou_chenqingzhi: { generalId: 'zhengzhou_chenqingzhi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sunqin_sunchuanting: { generalId: 'sunqin_sunchuanting', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_202', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hongnong_jun_yangsu: { generalId: 'hongnong_jun_yangsu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_194', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tianxiong_tianchengsi: { generalId: 'tianxiong_tianchengsi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_145', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ranwei_d_ranmin: { generalId: 'ranwei_d_ranmin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_198', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        jin_xianzhen: { generalId: 'jin_xianzhen', tier: 'famous', tacticalSkillId: 'ts_537', strategicSkillId: 'str_19', advantageSkillId: 'ts_537', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_538', atkAdvantageSkillId: 'ts_537', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_538', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_539', aptitude: 'leverage' },

        zhong_xiexuan: { generalId: 'zhong_xiexuan', tier: 'famous', tacticalSkillId: 'ts_430', strategicSkillId: 'str_12', advantageSkillId: 'ts_430', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_431', atkAdvantageSkillId: 'ts_430', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_431', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhongshan_yangaoqing: { generalId: 'zhongshan_yangaoqing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jingzhou_gs_huangfusong: { generalId: 'jingzhou_gs_huangfusong', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_183', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wang_d_liuyu: { generalId: 'wang_d_liuyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_174', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chimei_fanchong: { generalId: 'chimei_fanchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiao_d_xiaoyan: { generalId: 'xiao_d_xiaoyan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_204', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    wazhai_zhanghan: { generalId: 'wazhai_zhanghan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_203', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiaodong_tiandan: { generalId: 'jiaodong_tiandan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_164', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jibei_xuxuan: { generalId: 'jibei_xuxuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jinan_tiexuan: { generalId: 'jinan_tiexuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qi_simarangju: { generalId: 'qi_simarangju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huaiyang_zhouyafu: { generalId: 'huaiyang_zhouyafu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_398', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yingzhou_d_liuqi: { generalId: 'yingzhou_d_liuqi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        cao_d_caocao: { generalId: 'cao_d_caocao', tier: 'famous', tacticalSkillId: 'ts_477', strategicSkillId: 'str_25', advantageSkillId: 'ts_477', balanceSkillId: 'ts_478', disadvantageSkillId: 'ts_479', atkAdvantageSkillId: 'ts_477', atkBalanceSkillId: 'ts_478', atkDisadvantageSkillId: 'ts_479', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    long2_weixiaokuan: { generalId: 'long2_weixiaokuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongxian_sunbin: { generalId: 'dongxian_sunbin', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_20', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_165', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mi_mizhu: { generalId: 'mi_mizhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    baibo_guotai: { generalId: 'baibo_guotai', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    ruzhou_sunjian: { generalId: 'ruzhou_sunjian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_199', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        ruo_wangjian: { generalId: 'ruo_wangjian', tier: 'famous', tacticalSkillId: 'ts_597', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_597', disadvantageSkillId: 'ts_598', atkAdvantageSkillId: 'ts_108', atkBalanceSkillId: 'ts_597', atkDisadvantageSkillId: 'ts_598', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_599', aptitude: 'leverage' },

    yaozhou_limaozhen: { generalId: 'yaozhou_limaozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiyuan_huluguang: { generalId: 'jiyuan_huluguang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_196', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yangshao_zhoubo: { generalId: 'yangshao_zhoubo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_206', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dixiang_wangmang: { generalId: 'dixiang_wangmang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        zhou_jifa: { generalId: 'zhou_jifa', tier: 'famous', tacticalSkillId: 'ts_672', strategicSkillId: 'str_24', advantageSkillId: 'ts_672', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_673', atkAdvantageSkillId: 'ts_672', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_673', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_674', aptitude: 'leverage' },

    quanrong_yiquhai: { generalId: 'quanrong_yiquhai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cai_lishuo: { generalId: 'cai_lishuo', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'attack' },

    yun_wuli: { generalId: 'yun_wuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    suzhou_d_shikefa: { generalId: 'suzhou_d_shikefa', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pizhou_lvbu: { generalId: 'pizhou_lvbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yin_dixin: { generalId: 'yin_dixin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liwang_liguangbi: { generalId: 'liwang_liguangbi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        qing_quduan: { generalId: 'qing_quduan', tier: 'ordinary', tacticalSkillId: 'ts_458', advantageSkillId: 'ts_458', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_459', atkAdvantageSkillId: 'ts_458', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_459', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    han_baoyuan: { generalId: 'han_baoyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bailian_wangconger: { generalId: 'bailian_wangconger', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    shen_shenbo: { generalId: 'shen_shenbo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sima_d_simayi: { generalId: 'sima_d_simayi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liguo_zhaoshe: { generalId: 'liguo_zhaoshe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_294', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        huai_zhuyuanzhang: { generalId: 'huai_zhuyuanzhang', tier: 'famous', tacticalSkillId: 'ts_806', strategicSkillId: 'str_28', advantageSkillId: 'ts_806', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_806', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shangzhou_shangyang: { generalId: 'shangzhou_shangyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yuan_yuanshu: { generalId: 'yuan_yuanshu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lingwu_guoziyi: { generalId: 'lingwu_guoziyi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yuzhou_zuti: { generalId: 'yuzhou_zuti', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_383', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mengcheng_d_gaoqiong: { generalId: 'mengcheng_d_gaoqiong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        lulin_liuxiu: { generalId: 'lulin_liuxiu', tier: 'famous', tacticalSkillId: 'ts_432', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_432', disadvantageSkillId: 'ts_433', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_432', atkDisadvantageSkillId: 'ts_433', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dang_d_zhuwen: { generalId: 'dang_d_zhuwen', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_191', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hao_d_weirui: { generalId: 'hao_d_weirui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_193', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bozhou_d_yujin: { generalId: 'bozhou_d_yujin', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

    zhuozhou_anlushan: { generalId: 'zhuozhou_anlushan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_226', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        chanzhou_chairong: { generalId: 'chanzhou_chairong', tier: 'famous', tacticalSkillId: 'ts_480', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_480', disadvantageSkillId: 'ts_481', atkAdvantageSkillId: 'ts_147', atkBalanceSkillId: 'ts_480', atkDisadvantageSkillId: 'ts_481', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_482', aptitude: 'create' },

    lai_wangshifan: { generalId: 'lai_wangshifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mushi_muchong: { generalId: 'mushi_muchong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiongding_murongyong: { generalId: 'xiongding_murongyong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pinghai_laihuer: { generalId: 'pinghai_laihuer', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_217', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        pingyuan_yanzhenqing: { generalId: 'pingyuan_yanzhenqing', tier: 'ordinary', tacticalSkillId: 'ts_792', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_792', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_792', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    linhu_mafang: { generalId: 'linhu_mafang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xianyu_hanxin: { generalId: 'xianyu_hanxin', tier: 'famous', tacticalSkillId: 'ts_013', strategicSkillId: 'str_23', advantageSkillId: 'ts_424', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_425', atkAdvantageSkillId: 'ts_424', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_013', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_425', aptitude: 'reverse' },

    shizhao_d_shihu: { generalId: 'shizhao_d_shihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    loufan_xuerengui: { generalId: 'loufan_xuerengui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_389', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shanrong_lanyu: { generalId: 'shanrong_lanyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_220', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        you_gengyan: { generalId: 'you_gengyan', tier: 'famous', tacticalSkillId: 'ts_669', strategicSkillId: 'str_12', advantageSkillId: 'ts_669', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_670', atkAdvantageSkillId: 'ts_669', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_670', defAdvantageSkillId: 'ts_224', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_671', aptitude: 'create' },

        lingqiu_zhaowuling: { generalId: 'lingqiu_zhaowuling', tier: 'famous', tacticalSkillId: 'ts_564', strategicSkillId: 'str_26', advantageSkillId: 'ts_564', balanceSkillId: 'ts_565', disadvantageSkillId: 'ts_566', atkAdvantageSkillId: 'ts_564', atkBalanceSkillId: 'ts_565', atkDisadvantageSkillId: 'ts_566', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yi_yuqian: { generalId: 'yi_yuqian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huo_songlaosheng: { generalId: 'huo_songlaosheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        jinzhou_lichengliang: { generalId: 'jinzhou_lichengliang', tier: 'famous', tacticalSkillId: 'ts_540', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_540', disadvantageSkillId: 'ts_541', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_540', atkDisadvantageSkillId: 'ts_541', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_542', aptitude: 'leverage' },

        zu_d_yuanchonghuan: { generalId: 'zu_d_yuanchonghuan', tier: 'famous', tacticalSkillId: 'ts_675', strategicSkillId: 'str_05', advantageSkillId: 'ts_675', balanceSkillId: 'ts_676', disadvantageSkillId: 'ts_677', atkAdvantageSkillId: 'ts_675', atkBalanceSkillId: 'ts_676', atkDisadvantageSkillId: 'ts_677', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mao_wenlong_maowenlong: { generalId: 'mao_wenlong_maowenlong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gongsun_d_gongsundu: { generalId: 'gongsun_d_gongsundu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jianzhou_nvzhen_limanzhu: { generalId: 'jianzhou_nvzhen_limanzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        weihaiwei_sudingfang: { generalId: 'weihaiwei_sudingfang', tier: 'famous', tacticalSkillId: 'ts_627', strategicSkillId: 'str_12', advantageSkillId: 'ts_627', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_628', atkAdvantageSkillId: 'ts_627', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_628', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_629', aptitude: 'leverage' },

        xuan_xuda: { generalId: 'xuan_xuda', tier: 'famous', tacticalSkillId: 'ts_654', strategicSkillId: 'str_28', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_655', atkAdvantageSkillId: 'ts_654', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_655', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_656', aptitude: 'leverage' },

    tuoba_tuobagui: { generalId: 'tuoba_tuobagui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_222', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qingyuan_bd_zhoudewei: { generalId: 'qingyuan_bd_zhoudewei', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    changshan_yangyanzhao: { generalId: 'changshan_yangyanzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'defense' },

    hejian_gongsunzan: { generalId: 'hejian_gongsunzan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_213', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liangshidu_longjia: { generalId: 'liangshidu_longjia', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yangshe_yangshezhi: { generalId: 'yangshe_yangshezhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guzhu_tianyu: { generalId: 'guzhu_tianyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dizhou_wangyanzhang: { generalId: 'dizhou_wangyanzhang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_083', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qu_d_quyi: { generalId: 'qu_d_quyi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_219', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gaoqi_d_gaohuan: { generalId: 'gaoqi_d_gaohuan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wangyan_wangyan: { generalId: 'wangyan_wangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    linyu_wusangui: { generalId: 'linyu_wusangui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_148', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dai_d_shijingtang: { generalId: 'dai_d_shijingtang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        erzhu_erzhurong: { generalId: 'erzhu_erzhurong', tier: 'famous', tacticalSkillId: 'ts_510', strategicSkillId: 'str_18', advantageSkillId: 'ts_510', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_511', atkAdvantageSkillId: 'ts_510', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_511', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_512', aptitude: 'reverse' },

    zhe_d_zheyuqing: { generalId: 'zhe_d_zheyuqing', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_225', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        heng1_yangye: { generalId: 'heng1_yangye', tier: 'famous', tacticalSkillId: 'ts_454', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_454', disadvantageSkillId: 'ts_455', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_454', atkDisadvantageSkillId: 'ts_455', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dingxiang_d_lijing: { generalId: 'dingxiang_d_lijing', tier: 'famous', tacticalSkillId: 'ts_436', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_437', disadvantageSkillId: 'ts_436', atkAdvantageSkillId: 'ts_056', atkBalanceSkillId: 'ts_437', atkDisadvantageSkillId: 'ts_436', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiayang_d_dengyu: { generalId: 'xiayang_d_dengyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ying_caojingzong: { generalId: 'ying_caojingzong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_376', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kejia_wentianxiang: { generalId: 'kejia_wentianxiang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tingzhou_d_chenmin: { generalId: 'tingzhou_d_chenmin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fu2_zhoudi: { generalId: 'fu2_zhoudi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ouyang_ouyangwei: { generalId: 'ouyang_ouyangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chu_d_lukang: { generalId: 'chu_d_lukang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yan_leyi: { generalId: 'yan_leyi', tier: 'famous', tacticalSkillId: 'ts_657', strategicSkillId: 'str_19', advantageSkillId: 'ts_657', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_658', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_658', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_659', aptitude: 'leverage' },

    zhao_lianpo: { generalId: 'zhao_lianpo', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_160', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yunzhong_tuobaliwei: { generalId: 'yunzhong_tuobaliwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yang_aner_yanganer: { generalId: 'yang_aner_yanganer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xie_xiefangde: { generalId: 'xie_xiefangde', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wan_liuyuan: { generalId: 'wan_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huang_d_sunshuao: { generalId: 'huang_d_sunshuao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wenzhou_zhangcong: { generalId: 'wenzhou_zhangcong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuling_xiangdancheng: { generalId: 'wuling_xiangdancheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_338', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiujiang_zhouyu: { generalId: 'jiujiang_zhouyu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_261', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fangla_fangla: { generalId: 'fangla_fangla', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fang_guozhen_fangguozhen: { generalId: 'fang_guozhen_fangguozhen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ouyue_zouyao: { generalId: 'ouyue_zouyao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ruochu_doulian: { generalId: 'ruochu_doulian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_316', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        wuwu_d_lvmeng: { generalId: 'wuwu_d_lvmeng', tier: 'famous', tacticalSkillId: 'ts_639', strategicSkillId: 'str_06', advantageSkillId: 'ts_639', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_640', atkAdvantageSkillId: 'ts_639', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_640', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_641', aptitude: 'leverage' },

    li_bian: { generalId: 'li_bian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sunwu_d_sunquan: { generalId: 'sunwu_d_sunquan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yue_goujian: { generalId: 'yue_goujian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_06', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    heng_hetengjiao: { generalId: 'heng_hetengjiao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xushouhui_zhaopusheng: { generalId: 'xushouhui_zhaopusheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        sui_yangjian: { generalId: 'sui_yangjian', tier: 'ordinary', tacticalSkillId: 'ts_807', advantageSkillId: 'ts_005', balanceSkillId: 'ts_807', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_807', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    changshaguo_xinqiji: { generalId: 'changshaguo_xinqiji', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'attack' },

    yue_d_lusu: { generalId: 'yue_d_lusu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhangshicheng_zhangshicheng: { generalId: 'zhangshicheng_zhangshicheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_299', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        wu_sunwu: { generalId: 'wu_sunwu', tier: 'famous', tacticalSkillId: 'ts_633', strategicSkillId: 'str_19', advantageSkillId: 'ts_633', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_634', atkAdvantageSkillId: 'ts_633', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_634', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_635', aptitude: 'reverse' },

    qian_d_yudayou: { generalId: 'qian_d_yudayou', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_288', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qiufu_qiufu: { generalId: 'qiufu_qiufu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        qi_d_qijiguang: { generalId: 'qi_d_qijiguang', tier: 'famous', tacticalSkillId: 'ts_585', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_585', disadvantageSkillId: 'ts_586', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_585', atkDisadvantageSkillId: 'ts_586', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_587', aptitude: 'leverage' },

    yiyang_d_mengzongzheng: { generalId: 'yiyang_d_mengzongzheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_321', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yezongliu_yezongliu: { generalId: 'yezongliu_yezongliu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shenshi_shenqingzhi: { generalId: 'shenshi_shenqingzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    huangwang_huangchao: { generalId: 'huangwang_huangchao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lujian_zhanghuangyan: { generalId: 'lujian_zhanghuangyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    linshihong_linshihong: { generalId: 'linshihong_linshihong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liu_yingbu: { generalId: 'liu_yingbu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_375', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shuntian_linshuangwen: { generalId: 'shuntian_linshuangwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chunshen_huangxie: { generalId: 'chunshen_huangxie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mi_chu_xionglv: { generalId: 'mi_chu_xionglv', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_267', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shanyue_sunce: { generalId: 'shanyue_sunce', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_26', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    she_ethnic_leiwanxing: { generalId: 'she_ethnic_leiwanxing', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wang_s_wanghua: { generalId: 'wang_s_wanghua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hongzhou_zhuwenzheng: { generalId: 'hongzhou_zhuwenzheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    danyang_huanwen: { generalId: 'danyang_huanwen', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_259', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chizhou_changyuchun: { generalId: 'chizhou_changyuchun', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_258', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gumie_liuyu: { generalId: 'gumie_liuyu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hu_d_husansheng: { generalId: 'hu_d_husansheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    sagami_beitiaoshikang: { generalId: 'sagami_beitiaoshikang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_05', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_331', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mino_dagujiji: { generalId: 'mino_dagujiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhuqian_shaoerzineng: { generalId: 'zhuqian_shaoerzineng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ssangseong_lizichun: { generalId: 'ssangseong_lizichun', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yao_liuyuan: { generalId: 'yao_liuyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kong_d_caogui: { generalId: 'kong_d_caogui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tongma_taishici: { generalId: 'tongma_taishici', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yanchuan_d_yuefei: { generalId: 'yanchuan_d_yuefei', tier: 'famous', tacticalSkillId: 'ts_092', strategicSkillId: 'str_12', advantageSkillId: 'ts_092', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_421', atkAdvantageSkillId: 'ts_092', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_420', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_421', aptitude: 'leverage' },

    guide_d_xiaohe: { generalId: 'guide_d_xiaohe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tongzhou_liuzhiyuan: { generalId: 'tongzhou_liuzhiyuan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    fu_zhou_yanyan: { generalId: 'fu_zhou_yanyan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lushui_dongzhuo: { generalId: 'lushui_dongzhuo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cen_d_cenmeng: { generalId: 'cen_d_cenmeng', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    miao_amishi: { generalId: 'miao_amishi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiang_s_huanggai: { generalId: 'jiang_s_huanggai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    muong_shencongyue: { generalId: 'muong_shencongyue', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    panyao_panhu: { generalId: 'panyao_panhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    chen2_zhaofan: { generalId: 'chen2_zhaofan', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'defense' },

    qian_songjingyang: { generalId: 'qian_songjingyang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qinghai_yuezhongqi: { generalId: 'qinghai_yuezhongqi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_292', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jiashi_wangxuance: { generalId: 'jiashi_wangxuance', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_310', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yangtong_chisongdezan: { generalId: 'yangtong_chisongdezan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_378', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    monpa_meire: { generalId: 'monpa_meire', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xining_yangyingju: { generalId: 'xining_yangyingju', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kalun_dexinga: { generalId: 'kalun_dexinga', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    golog_wandezhaxi: { generalId: 'golog_wandezhaxi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lopi_abo: { generalId: 'lopi_abo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    donghu_tuiyin: { generalId: 'donghu_tuiyin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dingling_weilu: { generalId: 'dingling_weilu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        yingzhou_ying_d_muronghuang: { generalId: 'yingzhou_ying_d_muronghuang', tier: 'famous', tacticalSkillId: 'ts_663', strategicSkillId: 'str_25', advantageSkillId: 'ts_663', balanceSkillId: 'ts_664', disadvantageSkillId: 'ts_665', atkAdvantageSkillId: 'ts_663', atkBalanceSkillId: 'ts_664', atkDisadvantageSkillId: 'ts_665', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        buriat_tumenjiergale: { generalId: 'buriat_tumenjiergale', tier: 'ordinary', tacticalSkillId: 'ts_793', advantageSkillId: 'ts_012', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_793', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_793', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

    oirat_ming_gaerdan: { generalId: 'oirat_ming_gaerdan', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_237', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    donghui_nanlv: { generalId: 'donghui_nanlv', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    gonggu_gonggudaozhu: { generalId: 'gonggu_gonggudaozhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yizhi_beigou: { generalId: 'yizhi_beigou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    beihai_shamusheyun: { generalId: 'beihai_shamusheyun', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    sheng_d_liyiqi: { generalId: 'sheng_d_liyiqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    haikou_wangzhi: { generalId: 'haikou_wangzhi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shanshan_weituqi: { generalId: 'shanshan_weituqi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qianhui_baiyanhu: { generalId: 'qianhui_baiyanhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ava_sijifa: { generalId: 'ava_sijifa', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    dian_duanjianwei: { generalId: 'dian_duanjianwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    mon_monuhe: { generalId: 'mon_monuhe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ganden_zongkaba: { generalId: 'ganden_zongkaba', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    niang_suonanjiabo: { generalId: 'niang_suonanjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dalung_sangjiwen: { generalId: 'dalung_sangjiwen', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dong_nangqianjiabo: { generalId: 'dong_nangqianjiabo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    hor_chisang: { generalId: 'hor_chisang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pyu_moluo: { generalId: 'pyu_moluo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    nongzhigao_huangshimi: { generalId: 'nongzhigao_huangshimi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    weitou_douti: { generalId: 'weitou_douti', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yumi_anguo: { generalId: 'yumi_anguo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    qiemo_anmoshenpan: { generalId: 'qiemo_anmoshenpan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pishan_daihu: { generalId: 'pishan_daihu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ruoqiang_quhulai: { generalId: 'ruoqiang_quhulai', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    weili_weilifan: { generalId: 'weili_weilifan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wensu_guyi: { generalId: 'wensu_guyi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    duerbote_duerbote_taiji: { generalId: 'duerbote_duerbote_taiji', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiye_zihe: { generalId: 'xiye_zihe', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    faqiang_niechizanpu: { generalId: 'faqiang_niechizanpu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zhuoshi_gaopian: { generalId: 'zhuoshi_gaopian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_305', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xingliao_dayanlin: { generalId: 'xingliao_dayanlin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xihai_d_fulianchou: { generalId: 'xihai_d_fulianchou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    guzgan_abuhalisi: { generalId: 'guzgan_abuhalisi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kawusi_haidaer: { generalId: 'kawusi_haidaer', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xianhai_shamalike: { generalId: 'xianhai_shamalike', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        wuhu_dukake: { generalId: 'wuhu_dukake', tier: 'ordinary', tacticalSkillId: 'ts_794', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_794', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_794', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xingan_hailancha: { generalId: 'xingan_hailancha', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_10', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_243', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongping_langtan: { generalId: 'dongping_langtan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    badakhshan_yaerbeige: { generalId: 'badakhshan_yaerbeige', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    keliya_fuduxin: { generalId: 'keliya_fuduxin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    bailong_suomai: { generalId: 'bailong_suomai', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'attack' },

    sai_gaijiayun: { generalId: 'sai_gaijiayun', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_339', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    weiwuer_yusubu: { generalId: 'weiwuer_yusubu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kangba_suonuomugunbu: { generalId: 'kangba_suonuomugunbu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yong_lujili: { generalId: 'yong_lujili', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jingcheng_d_yuyouzhao: { generalId: 'jingcheng_d_yuyouzhao', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_359', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xin_baiqi: { generalId: 'xin_baiqi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_12', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_158', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_039', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        pangzha_halixinge: { generalId: 'pangzha_halixinge', tier: 'famous', tacticalSkillId: 'ts_582', strategicSkillId: 'str_12', advantageSkillId: 'ts_582', balanceSkillId: 'ts_583', disadvantageSkillId: 'ts_584', atkAdvantageSkillId: 'ts_582', atkBalanceSkillId: 'ts_583', atkDisadvantageSkillId: 'ts_584', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        najie_minande: { generalId: 'najie_minande', tier: 'famous', tacticalSkillId: 'ts_795', strategicSkillId: 'str_23', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_795', atkAdvantageSkillId: 'ts_352', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_795', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        dulan_d_aihamaide: { generalId: 'dulan_d_aihamaide', tier: 'famous', tacticalSkillId: 'ts_501', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_501', disadvantageSkillId: 'ts_502', atkAdvantageSkillId: 'ts_152', atkBalanceSkillId: 'ts_501', atkDisadvantageSkillId: 'ts_502', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_503', aptitude: 'leverage' },

    muer_mujier: { generalId: 'muer_mujier', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    baha_gaiwamu: { generalId: 'baha_gaiwamu', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'balanced' },

        hali_gedaerzi: { generalId: 'hali_gedaerzi', tier: 'ordinary', tacticalSkillId: 'ts_796', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_796', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_796', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    kalan_suhela: { generalId: 'kalan_suhela', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xisi_yakubusafaer: { generalId: 'xisi_yakubusafaer', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        delan_sulun: { generalId: 'delan_sulun', tier: 'famous', tacticalSkillId: 'ts_498', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_498', disadvantageSkillId: 'ts_499', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_498', atkDisadvantageSkillId: 'ts_499', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_500', aptitude: 'leverage' },

        huluo_jiyasiding: { generalId: 'huluo_jiyasiding', tier: 'famous', tacticalSkillId: 'ts_531', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_531', disadvantageSkillId: 'ts_532', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_531', atkDisadvantageSkillId: 'ts_532', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_533', aptitude: 'leverage' },

        aba_shapuer: { generalId: 'aba_shapuer', tier: 'famous', tacticalSkillId: 'ts_462', strategicSkillId: 'str_12', advantageSkillId: 'ts_011', balanceSkillId: 'ts_462', disadvantageSkillId: 'ts_463', atkAdvantageSkillId: 'ts_329', atkBalanceSkillId: 'ts_462', atkDisadvantageSkillId: 'ts_463', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_464', aptitude: 'reverse' },

    wenling_shilang: { generalId: 'wenling_shilang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_01', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_287', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        qianzhou_lisheng: { generalId: 'qianzhou_lisheng', tier: 'famous', tacticalSkillId: 'ts_588', strategicSkillId: 'str_16', advantageSkillId: 'ts_588', balanceSkillId: 'ts_589', disadvantageSkillId: 'ts_590', atkAdvantageSkillId: 'ts_588', atkBalanceSkillId: 'ts_589', atkDisadvantageSkillId: 'ts_590', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wuyue_qianliu: { generalId: 'wuyue_qianliu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_28', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shaozhou_d_mayin: { generalId: 'shaozhou_d_mayin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        song_zhaokuangyin: { generalId: 'song_zhaokuangyin', tier: 'famous', tacticalSkillId: 'ts_448', strategicSkillId: 'str_19', advantageSkillId: 'ts_005', balanceSkillId: 'ts_448', disadvantageSkillId: 'ts_449', atkAdvantageSkillId: 'ts_201', atkBalanceSkillId: 'ts_448', atkDisadvantageSkillId: 'ts_449', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    chuzhou_d_huangfuhui: { generalId: 'chuzhou_d_huangfuhui', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_004', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

        xiyuduhu_banchao: { generalId: 'xiyuduhu_banchao', tier: 'famous', tacticalSkillId: 'ts_651', strategicSkillId: 'str_06', advantageSkillId: 'ts_651', balanceSkillId: 'ts_652', disadvantageSkillId: 'ts_653', atkAdvantageSkillId: 'ts_651', atkBalanceSkillId: 'ts_652', atkDisadvantageSkillId: 'ts_653', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    zizhou_wangjian: { generalId: 'zizhou_wangjian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    cangzhou_liurengong: { generalId: 'cangzhou_liurengong', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'leverage', attackStyle: 'defense' },

    yuezhi_xihou: { generalId: 'yuezhi_xihou', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    minyue_wuzhu: { generalId: 'minyue_wuzhu', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    funan_fanman: { generalId: 'funan_fanman', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_27', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_342', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    lancang_faang: { generalId: 'lancang_faang', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_24', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_324', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    ahaomu_laqite: { generalId: 'ahaomu_laqite', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'reverse', attackStyle: 'defense' },

    elunchunzu_gaishan: { generalId: 'elunchunzu_gaishan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    wazu_banhongwang: { generalId: 'wazu_banhongwang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    tajikezu_kuerban: { generalId: 'tajikezu_kuerban', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    jingpozu_zaodan: { generalId: 'jingpozu_zaodan', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shuizu_panxinjian: { generalId: 'shuizu_panxinjian', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    liuzhou_shenxiyi: { generalId: 'liuzhou_shenxiyi', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_17', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_323', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    luming_luxiangsheng: { generalId: 'luming_luxiangsheng', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_179', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dingzhou_d_murongchui: { generalId: 'dingzhou_d_murongchui', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_18', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },

        shanzhou_wangzhongsi: { generalId: 'shanzhou_wangzhongsi', tier: 'famous', tacticalSkillId: 'ts_603', strategicSkillId: 'str_27', advantageSkillId: 'ts_603', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_604', atkAdvantageSkillId: 'ts_603', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_604', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_605', aptitude: 'leverage' },

        weizhou_weigao: { generalId: 'weizhou_weigao', tier: 'famous', tacticalSkillId: 'ts_630', strategicSkillId: 'str_25', advantageSkillId: 'ts_630', balanceSkillId: 'ts_631', disadvantageSkillId: 'ts_632', atkAdvantageSkillId: 'ts_630', atkBalanceSkillId: 'ts_631', atkDisadvantageSkillId: 'ts_632', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yingzhou_d2_licunxu: { generalId: 'yingzhou_d2_licunxu', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_16', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    dongsheng_weishang: { generalId: 'dongsheng_weishang', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    weiyuan_d_niangengyao: { generalId: 'weiyuan_d_niangengyao', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_25', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_272', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    yansui_wangwei: { generalId: 'yansui_wangwei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    xiazhou_lijiqian: { generalId: 'xiazhou_lijiqian', tier: 'famous', tacticalSkillId: 'ts_001', strategicSkillId: 'str_13', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_379', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    shizhou_liucong: { generalId: 'shizhou_liucong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

    pagan: { generalId: 'pagan', tier: 'ordinary', tacticalSkillId: 'ts_129', advantageSkillId: 'ts_222', balanceSkillId: 'ts_225', disadvantageSkillId: 'ts_226', atkAdvantageSkillId: 'ts_210', atkBalanceSkillId: 'ts_211', atkDisadvantageSkillId: 'ts_212', defAdvantageSkillId: 'ts_215', defBalanceSkillId: 'ts_217', defDisadvantageSkillId: 'ts_218', aptitude: 'create' },

    kai: { generalId: 'kai', tier: 'ordinary', tacticalSkillId: 'ts_156', advantageSkillId: 'ts_562', balanceSkillId: 'ts_563', disadvantageSkillId: 'ts_564', atkAdvantageSkillId: 'ts_554', atkBalanceSkillId: 'ts_555', atkDisadvantageSkillId: 'ts_556', defAdvantageSkillId: 'ts_558', defBalanceSkillId: 'ts_559', defDisadvantageSkillId: 'ts_560', aptitude: 'create' },

    chen3: { generalId: 'chen3', tier: 'ordinary', tacticalSkillId: 'ts_034', advantageSkillId: 'ts_031', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_104', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    xuantu: { generalId: 'xuantu', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_801', balanceSkillId: 'ts_425', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_402', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    guishuang: { generalId: 'guishuang', tier: 'ordinary', tacticalSkillId: 'ts_043', advantageSkillId: 'ts_039', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_048', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_731', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_037', aptitude: 'create' },

    jilizhou: { generalId: 'jilizhou', tier: 'ordinary', tacticalSkillId: 'ts_062', advantageSkillId: 'ts_801', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_609', atkBalanceSkillId: 'ts_683', atkDisadvantageSkillId: 'ts_645', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    wuliangha: { generalId: 'wuliangha', tier: 'ordinary', tacticalSkillId: 'ts_047', advantageSkillId: 'ts_010', balanceSkillId: 'ts_007', disadvantageSkillId: 'ts_704', atkAdvantageSkillId: 'ts_032', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_016', defDisadvantageSkillId: 'ts_026', aptitude: 'create' },

    wuzhou: { generalId: 'wuzhou', tier: 'ordinary', tacticalSkillId: 'ts_173', advantageSkillId: 'ts_002', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_018', atkAdvantageSkillId: 'ts_621', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_675', defDisadvantageSkillId: 'ts_209', aptitude: 'create' },

    liao_d: { generalId: 'liao_d', tier: 'ordinary', tacticalSkillId: 'ts_609', advantageSkillId: 'ts_672', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_005', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_707', aptitude: 'create' },

    huige: { generalId: 'huige', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_003', balanceSkillId: 'ts_395', disadvantageSkillId: 'ts_025', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_396', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_099', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    hepan: { generalId: 'hepan', tier: 'ordinary', tacticalSkillId: 'ts_283', advantageSkillId: 'ts_397', balanceSkillId: 'ts_683', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_044', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_768', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    shache: { generalId: 'shache', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_005', balanceSkillId: 'ts_413', disadvantageSkillId: 'ts_037', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_025', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    huarazim: { generalId: 'huarazim', tier: 'ordinary', tacticalSkillId: 'ts_122', advantageSkillId: 'ts_672', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_034', atkAdvantageSkillId: 'ts_657', atkBalanceSkillId: 'ts_046', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    quli: { generalId: 'quli', tier: 'ordinary', tacticalSkillId: 'ts_270', advantageSkillId: 'ts_077', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_585', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_669', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_065', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    song2: { generalId: 'song2', tier: 'ordinary', tacticalSkillId: 'ts_297', advantageSkillId: 'ts_801', balanceSkillId: 'ts_403', disadvantageSkillId: 'ts_396', atkAdvantageSkillId: 'ts_036', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    dali: { generalId: 'dali', tier: 'ordinary', tacticalSkillId: 'ts_038', advantageSkillId: 'ts_041', balanceSkillId: 'ts_195', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_739', atkBalanceSkillId: 'ts_114', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_412', aptitude: 'create' },

    daozhou: { generalId: 'daozhou', tier: 'ordinary', tacticalSkillId: 'ts_381', advantageSkillId: 'ts_031', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_806', aptitude: 'create' },

    ryukyu: { generalId: 'ryukyu', tier: 'ordinary', tacticalSkillId: 'ts_247', advantageSkillId: 'ts_801', balanceSkillId: 'ts_407', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_666', atkBalanceSkillId: 'ts_015', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    yelang: { generalId: 'yelang', tier: 'ordinary', tacticalSkillId: 'ts_402', advantageSkillId: 'ts_003', balanceSkillId: 'ts_737', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_041', atkBalanceSkillId: 'ts_642', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_077', defBalanceSkillId: 'ts_044', defDisadvantageSkillId: 'ts_035', aptitude: 'create' },

    kui: { generalId: 'kui', tier: 'ordinary', tacticalSkillId: 'ts_044', advantageSkillId: 'ts_406', balanceSkillId: 'ts_046', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_039', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_018', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_006', defDisadvantageSkillId: 'ts_405', aptitude: 'create' },

    tujia_d: { generalId: 'tujia_d', tier: 'ordinary', tacticalSkillId: 'ts_271', advantageSkillId: 'ts_040', balanceSkillId: 'ts_016', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_392', atkBalanceSkillId: 'ts_407', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_271', aptitude: 'create' },

    liangzhou: { generalId: 'liangzhou', tier: 'ordinary', tacticalSkillId: 'ts_387', advantageSkillId: 'ts_041', balanceSkillId: 'ts_065', disadvantageSkillId: 'ts_017', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_639', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_706', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    tianxiong: { generalId: 'tianxiong', tier: 'ordinary', tacticalSkillId: 'ts_388', advantageSkillId: 'ts_627', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_038', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_404', atkDisadvantageSkillId: 'ts_388', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_403', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    yangshao: { generalId: 'yangshao', tier: 'ordinary', tacticalSkillId: 'ts_043', advantageSkillId: 'ts_654', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_717', atkAdvantageSkillId: 'ts_660', atkBalanceSkillId: 'ts_047', atkDisadvantageSkillId: 'ts_806', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_402', defDisadvantageSkillId: 'ts_038', aptitude: 'create' },

    pinghai: { generalId: 'pinghai', tier: 'ordinary', tacticalSkillId: 'ts_342', advantageSkillId: 'ts_005', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_026', atkAdvantageSkillId: 'ts_001', atkBalanceSkillId: 'ts_016', atkDisadvantageSkillId: 'ts_717', defAdvantageSkillId: 'ts_036', defBalanceSkillId: 'ts_409', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    you: { generalId: 'you', tier: 'ordinary', tacticalSkillId: 'ts_224', advantageSkillId: 'ts_666', balanceSkillId: 'ts_006', disadvantageSkillId: 'ts_035', atkAdvantageSkillId: 'ts_070', atkBalanceSkillId: 'ts_195', atkDisadvantageSkillId: 'ts_038', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_413', defDisadvantageSkillId: 'ts_045', aptitude: 'create' },

    jinzhou: { generalId: 'jinzhou', tier: 'ordinary', tacticalSkillId: 'ts_002', advantageSkillId: 'ts_010', balanceSkillId: 'ts_393', disadvantageSkillId: 'ts_806', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_007', atkDisadvantageSkillId: 'ts_008', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_705', defDisadvantageSkillId: 'ts_104', aptitude: 'create' },

    jiujiang: { generalId: 'jiujiang', tier: 'ordinary', tacticalSkillId: 'ts_030', advantageSkillId: 'ts_039', balanceSkillId: 'ts_706', disadvantageSkillId: 'ts_645', atkAdvantageSkillId: 'ts_648', atkBalanceSkillId: 'ts_042', atkDisadvantageSkillId: 'ts_017', defAdvantageSkillId: 'ts_032', defBalanceSkillId: 'ts_393', defDisadvantageSkillId: 'ts_396', aptitude: 'create' },

    shuntian: { generalId: 'shuntian', tier: 'ordinary', tacticalSkillId: 'ts_336', advantageSkillId: 'ts_039', balanceSkillId: 'ts_639', disadvantageSkillId: 'ts_011', atkAdvantageSkillId: 'ts_010', atkBalanceSkillId: 'ts_395', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_151', defDisadvantageSkillId: 'ts_034', aptitude: 'create' },

    song: { generalId: 'song', tier: 'ordinary', tacticalSkillId: 'ts_035', advantageSkillId: 'ts_041', balanceSkillId: 'ts_151', disadvantageSkillId: 'ts_096', atkAdvantageSkillId: 'ts_618', atkBalanceSkillId: 'ts_624', atkDisadvantageSkillId: 'ts_026', defAdvantageSkillId: 'ts_040', defBalanceSkillId: 'ts_015', defDisadvantageSkillId: 'ts_017', aptitude: 'create' },

    qin_mengtian: { generalId: 'qin_mengtian', tier: 'ordinary', tacticalSkillId: 'ts_001', atkAdvantageSkillId: 'ts_007', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', aptitude: 'create', attackStyle: 'balanced' },

    tiele_qibiheli: { generalId: 'tiele_qibiheli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_240', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_012', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    yada_ahexiong: { generalId: 'yada_ahexiong', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    anushidgin_yile: { generalId: 'anushidgin_yile', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    qincha_baqiman: { generalId: 'qincha_baqiman', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    dayuan_wugua: { generalId: 'dayuan_wugua', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    kokand_alimukuli: { generalId: 'kokand_alimukuli', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    dayuzi_yinalechihei: { generalId: 'dayuzi_yinalechihei', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    maer_d_bahelamuchubin: { generalId: 'maer_d_bahelamuchubin', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    duomi_lunkongre: { generalId: 'duomi_lunkongre', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    dafeichuan_nuohebo: { generalId: 'dafeichuan_nuohebo', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    gaxa_zhashi: { generalId: 'gaxa_zhashi', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    jinchuan_g_shaluoben: { generalId: 'jinchuan_g_shaluoben', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_369', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    xiangxiong_limixia_x: { generalId: 'xiangxiong_limixia_x', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_002', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
    ladakh_senggelangjie: { generalId: 'ladakh_senggelangjie', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_370', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_006', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },
        khoshut_gushihan: { generalId: 'khoshut_gushihan', tier: 'famous', tacticalSkillId: 'ts_552', strategicSkillId: 'str_06', advantageSkillId: 'ts_552', balanceSkillId: 'ts_553', disadvantageSkillId: 'ts_554', atkAdvantageSkillId: 'ts_552', atkBalanceSkillId: 'ts_553', atkDisadvantageSkillId: 'ts_554', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_042', defDisadvantageSkillId: 'ts_034', aptitude: 'reverse' },
    yanzhou_zhongshiheng: { generalId: 'yanzhou_zhongshiheng', tier: 'ordinary', tacticalSkillId: 'ts_001', advantageSkillId: 'ts_005', balanceSkillId: 'ts_015', disadvantageSkillId: 'ts_032', atkAdvantageSkillId: 'ts_003', atkBalanceSkillId: 'ts_024', atkDisadvantageSkillId: 'ts_011', defAdvantageSkillId: 'ts_001', defBalanceSkillId: 'ts_046', defDisadvantageSkillId: 'ts_034', aptitude: 'leverage' },

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
