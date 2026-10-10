/**
 * 主题选择（CC 第 84 轮代修：原版把中国以外 25~83°N 一律判成中东沙漠，见审阅单 §六十）。
 * **Köppen 代码由调用方传入**，本文件不另存一份对照表：调用方用
 *   `src/ui/Scene13Biome.ts` 的 `resolveClimateRegion(lat, lng)`（内部 = KoppenGeigerGrid 0.1° + KOPPEN_CLASS_BY_ID）取得，
 *   例：npx tsx 下 import { resolveClimateRegion } from '../../src/ui/Scene13Biome'。
 * 规则（全部**推断**，依据：DE 主题名 = WWF 生物大区 + 气候带；CC 第 67/68/70 轮裁定）：
 *   美洲（经度 ≤ −30）→ A 新热带热带 / B 借中东沙漠 / E 借古北界泰加 / 南半球 C 新热带温带 / 其余 新北界温带；
 *   澳新（经度 ≥ 110 且纬度 ≤ −10）→ 澳新温带；
 *   E（ET/EF，含青藏高原、高山）→ 古北界泰加（借用；阿拉伯脚本只有 11 个主题，无冻原/亚洲泰加/新热带沙漠——AA 第 92 轮查出）；
 *   A → 经度 < 60（非洲、阿拉伯）非洲热带，否则 印度马来热带；
 *   B（BW/BS）→ 东亚草原（经度 ≥ 100 的 BS）亚洲温带，其余 中东沙漠；
 *   Cs → 欧洲地中海；
 *   撒哈拉以南（纬度 < 15，经度 −20~52）的 C/D → 非洲热带；
 *   青藏高原（27~38°N × 78~103°E，非干旱）→ 古北界泰加（借用）；
 *   亚洲（经度 ≥ 73）：Dfc/Dfd/Dwc/Dwd/Dsc/Dsd → 亚洲泰加；纬度 < 25 的 C → 印度马来热带（岭南、云贵南部，东亚段北界 25°N）；其余 → 亚洲温带；
 *   其余古北界：Dfc/Dfd/Dwc/Dwd/Dsc/Dsd → 欧洲泰加；其余 → 欧洲温带。
 */
const TAIGA = new Set(['Dfc', 'Dfd', 'Dwc', 'Dwd', 'Dsc', 'Dsd']);

export function pickTheme(lat, lng, koppen) {
  const k = koppen ?? null;
  const why = (t, r) => ({ theme: t, why: `${r}；Köppen=${k ?? '无'}（推断）` });
  if (!k) return why('PALAEARCTIC_EUROPE_TEMPERATE', '无 Köppen 数据，兜底');
  const g = k[0];
  if (lng <= -30) {
    if (g === 'A') return why('NEOTROPICAL_TROPICAL', '美洲·热带');
    if (g === 'B') return why('PALAEARCTIC_MIDDLE_EAST_DESERT', '美洲·干旱（阿拉伯脚本无新热带沙漠主题，借用中东沙漠）');
    if (g === 'E') return why('PALAEARCTIC_EUROPE_TAIGA', '美洲·冻原（阿拉伯脚本无冻原主题，借用古北界泰加）');
    if (lat < 0) return why('NEOTROPICAL_TEMPERATE', '南美·温带');
    return why('NEARCTIC_TEMPERATE', '北美·温带');
  }
  if (lng >= 110 && lat <= -10) return why('AUSTRALASIAN_TEMPERATE', '澳新');
  if (g === 'E') return why('PALAEARCTIC_EUROPE_TAIGA', '高山/冻原（借用古北界泰加）');
  if (g !== 'B' && lat >= 27 && lat <= 38 && lng >= 78 && lng <= 103) return why('PALAEARCTIC_EUROPE_TAIGA', '青藏高原（借用古北界泰加）');
  if (g === 'A') return lng < 60 ? why('AFROTROPICAL_TROPICAL', '非洲/阿拉伯·热带') : why('INDOMALAYAN_TROPICAL', '印度马来·热带');
  if (g === 'B') return (lng >= 100 && k.startsWith('BS')) ? why('PALAEARCTIC_ASIA_TEMPERATE', '东亚草原') : why('PALAEARCTIC_MIDDLE_EAST_DESERT', '干旱区');
  if (k.startsWith('Cs')) return why('PALAEARCTIC_EUROPE_MEDITERRANEAN', '夏干冬雨');
  if (lat < 15 && lng >= -20 && lng <= 52) return why('AFROTROPICAL_TROPICAL', '撒哈拉以南');
  if (lng >= 73) {
    if (TAIGA.has(k)) return why('PALAEARCTIC_EUROPE_TAIGA', '寒温带针叶林（泰加）');
    if (g === 'C' && lat < 25) return why('INDOMALAYAN_TROPICAL', '东亚·25°N 以南（岭南、云贵南部）');
    return why('PALAEARCTIC_ASIA_TEMPERATE', '东亚·温带');
  }
  if (TAIGA.has(k)) return why('PALAEARCTIC_EUROPE_TAIGA', '古北界·泰加');
  return why('PALAEARCTIC_EUROPE_TEMPERATE', '古北界·温带');
}
