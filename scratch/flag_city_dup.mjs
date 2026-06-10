/**
 * 据点名重复检测：仅 XX关/XX城/XX邑/XX州 截前缀 + 严格相等
 */
export function isFlagCityDuplicate(flag, cityName) {
  if (!flag || !cityName) return null;
  if (flag === cityName) return 'flag_equals_city';

  const m = cityName.match(/^(.+)(关|城|邑|州)$/);
  if (!m) return null;

  const prefix = m[1];
  const suffix = m[2];
  if (flag === prefix) return `suffix_${suffix}_prefix_dup`;
  // 单字旗号 = 前缀首字且前缀更长（郾城/郾、皖城/皖）
  if (flag.length === 1 && prefix.startsWith(flag) && prefix.length > 1) {
    return `suffix_${suffix}_trunc_${flag}`;
  }
  if (flag.length === 1 && prefix === flag) return `suffix_${suffix}_prefix_dup`;

  return null;
}
