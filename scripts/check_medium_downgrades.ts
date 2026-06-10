import { CITIES_V2 } from '../src/data/cities_v2';

/** plans/中城降级审计报告.md 「建议降级清单」 */
const AUDIT_DOWNGRADE_IDS = [
    'city_toumancheng', 'city_shiwei', 'city_luhun', 'city_chilechuan', 'city_dulehe',
    'city_kereyid', 'city_naiman', 'city_tatar', 'city_merkit', 'city_ongut',
    'city_otuken', 'city_yingchang', 'city_zhabuhan', 'city_hetao', 'city_kobdo',
    'city_daning', 'city_erdenezuu', 'city_yiqu', 'city_weirong', 'city_daixian',
    'city_qishan', 'city_qiuchi', 'city_guangnan', 'city_hezhang', 'city_baoshan',
    'city_cizhihequ', 'city_izumo', 'city_satsuma', 'city_yoshida', 'city_kasugayama',
    'city_kiyosu', 'city_yoshinogari', 'city_tsutsujigasaki', 'city_okafu', 'city_himeji',
    'city_utsunomiya', 'city_tsuruga', 'city_tsushima', 'city_fenglin', 'city_heishui_mohe',
    'city_tongjiajiang', 'city_suifenhe', 'city_suwancheng', 'city_dongmushan', 'city_wula',
    'city_hetuala', 'city_qionglong', 'city_zhaburang', 'city_leh', 'city_sagya', 'city_chubusi',
    'city_liaoyang', 'city_guoneicheng', 'city_fuyu', 'city_longhua', 'city_tancheng',
    'city_yadong', 'city_changhua_tw', 'city_fayzabad', 'city_lean_sd',
];

const stillMedium: string[] = [];
const nowSmall: string[] = [];
const other: string[] = [];
const missing: string[] = [];

for (const id of AUDIT_DOWNGRADE_IDS) {
    const c = CITIES_V2.find((x) => x.id === id);
    if (!c) {
        missing.push(id);
        continue;
    }
    const label = `${c.name} (${id})`;
    if (c.type === 'medium_city') stillMedium.push(label);
    else if (c.type === 'small_city') nowSmall.push(label);
    else other.push(`${label} [${c.type}]`);
}

console.log(`审计建议降级共 ${AUDIT_DOWNGRADE_IDS.length} 座`);
console.log(`  当前仍为中城: ${stillMedium.length}`);
stillMedium.forEach((x) => console.log(`    - ${x}`));
console.log(`  当前已是小城: ${nowSmall.length}`);
console.log(`  其他类型: ${other.length}`, other.join(', '));
console.log(`  数据中不存在: ${missing.length}`, missing.join(', '));

console.log(`\n当前全图中城总数: ${CITIES_V2.filter((c) => c.type === 'medium_city').length}`);
