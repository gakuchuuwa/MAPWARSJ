/**
 * 武将名 TTS 读音校正（仅语音层；UI/军情仍用 generalName 原文）。
 *
 * 浏览器中文 TTS 对多音姓、生僻字、日式汉名常读错。
 * 策略（按序）：
 *   1. generalId 显式覆盖（疑难个案）
 *   2. 复姓替换（尉迟→遇迟 等）
 *   3. 姓氏首字多音替换（乐→悦、种→仲 等）
 *   4. 名内易错字替换（勣→绩 等）
 *   5. 日本/朝鲜立绘夹：逐字 thin-space，减轻连读误判
 */
import { FACTION_GENERALS } from "../data/FactionGenerals";

/** generalId → TTS 专用读法（优先级最高） */
const EXPLICIT_SPEECH_NAMES: Readonly<Record<string, string>> = {
  bing_liji: "李绩",
  yan_leyi: "悦毅",
  huan_zhongshidao: "仲师道",
  yanzhou_zhongshiheng: "仲世衡",
  xijue_ganyanshou: "至支蝉于",
  chenla_duyebamo: "舌耶跋摩",
  kepantuo_dulimi: "舌梨密",
  suwa_d_zoufanglaizhong: "邹访赖重",
  lelang_wangqi: "王祺",
  naju_d_wangjian_wangye: "王岳",
  keliya_fuduxin: "伏舌信",
  heyuan_d_heichichangzhi: "赫齿常之",
  xian_d_xianfuren: "显夫人",
  luodian_shexiang: "赊香夫人",
  she_shechongming: "赊崇明",
  tan_d_qinhou: "琴垕",
  xiang_d_xiangdakun: "琴大旺",
  cong_puhu: "瓢胡",
  shuizhen_qudaren: "欧大任",
  zhe_d_zheyuqing: "蛇御卿",
  yingzhou_ying_d_muronghuang: "慕容晃",
  zhuqian_shaoerzineng: "少二资能",
  ayinu_hushemoquan: "胡赊魔犬",
  beihai_shamusheyun: "沙牟赊允",
};

/** 复姓（长匹配优先） */
const COMPOUND_SURNAME_FIX: ReadonlyArray<readonly [string, string]> = [
  ["万俟", "莫奇"],
  ["尉迟", "遇迟"],
  ["尉屠", "遇屠"],
  ["尉犁", "遇犁"],
  ["长孙", "张孙"],
  ["令狐", "灵狐"],
  ["独孤", "独孤"],
  ["慕容", "慕容"],
  ["完颜", "完颜"],
  ["公孙", "公孙"],
  ["单于", "蝉于"],
  ["阇耶", "舌耶"],
  ["阇梨", "舌梨"],
];

/** 姓氏首字多音（仅首位） */
const SURNAME_FIRST_CHAR: ReadonlyArray<readonly [string, string]> = [
  ["单", "善"],
  ["乐", "悦"],
  ["种", "仲"],
  ["仇", "求"],
  ["解", "谢"],
  ["曾", "增"],
  ["尉", "遇"],
  ["区", "欧"],
  ["覃", "琴"],
  ["朴", "瓢"],
  ["折", "蛇"],
  ["盖", "葛"],
  ["黑", "赫"],
  ["查", "渣"],
  ["祭", "债"],
  ["过", "郭"],
  ["召", "绍"],
  ["重", "虫"],
  ["乘", "圣"],
  ["隗", "魁"],
  ["阚", "瞰"],
  ["郦", "利"],
  ["宓", "密"],
  ["华", "化"], // 华佗等：华作姓读 huà
];

/** 姓名内任意位置的易错字 */
const CHAR_REPLACEMENT: Readonly<Record<string, string>> = {
  勣: "绩",
  颀: "祺",
  礏: "岳",
  阇: "舌",
  诹: "邹",
  冼: "显",
  郅: "至",
  奢: "赊",
  贲: "奔",
  褚: "储",
  隗: "魁",
  乜: "聂",
  翟: "宅",
  宓: "密",
  贰: "二",
  皝: "晃",
  阚: "瞰",
};

const THIN = "\u2009";

function fixCompoundSurname(name: string): string {
  for (const [from, to] of COMPOUND_SURNAME_FIX) {
    if (name.startsWith(from)) return to + name.slice(from.length);
  }
  return name;
}

function fixSurnamePolyphone(name: string): string {
  if (name.length < 1) return name;
  const first = name[0]!;
  for (const [ch, rep] of SURNAME_FIRST_CHAR) {
    if (first === ch) return rep + name.slice(1);
  }
  return name;
}

function replaceRareChars(name: string): string {
  return [...name].map((c) => CHAR_REPLACEMENT[c] ?? c).join("");
}

/** 日式/韩式汉名：逐字 thin-space，减轻 TTS 连读错音 */
function spacePerChar(name: string): string {
  return [...name].join(THIN);
}

function portraitFolderForGeneralId(generalId: string): string | null {
  for (const g of Object.values(FACTION_GENERALS)) {
    if (g.generalId === generalId) {
      const m = g.portrait.match(/\/assets\/([^/]+)\//);
      return m?.[1] ?? null;
    }
  }
  return null;
}

function shouldSpacePerChar(folder: string | null): boolean {
  return folder === "JAPAN" || folder === "KOREA";
}

/**
 * 将屏幕上的武将名转为 TTS 友好读法。
 */
export function getGeneralNameForSpeech(
  generalId: string | null | undefined,
  displayName: string,
): string {
  if (!displayName) return displayName;
  if (generalId && EXPLICIT_SPEECH_NAMES[generalId]) {
    return EXPLICIT_SPEECH_NAMES[generalId]!;
  }

  let name = displayName;
  name = fixCompoundSurname(name);
  name = fixSurnamePolyphone(name);
  name = replaceRareChars(name);

  const folder = generalId ? portraitFolderForGeneralId(generalId) : null;
  if (shouldSpacePerChar(folder)) {
    name = spacePerChar(name);
  }

  return name;
}

/** 播报全文：把已收录武将 displayName 替换为 TTS 读法（长名优先） */
let speechReplaceTable: ReadonlyArray<readonly [string, string]> | null = null;

function buildSpeechReplaceTable(): ReadonlyArray<readonly [string, string]> {
  if (speechReplaceTable) return speechReplaceTable;
  const pairs: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const g of Object.values(FACTION_GENERALS)) {
    const speech = getGeneralNameForSpeech(g.generalId, g.generalName);
    if (speech === g.generalName || seen.has(g.generalName)) continue;
    seen.add(g.generalName);
    pairs.push([g.generalName, speech]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  speechReplaceTable = pairs;
  return speechReplaceTable;
}

export function prepareSpeechText(text: string): string {
  if (!text) return text;
  let out = text;
  for (const [display, speech] of buildSpeechReplaceTable()) {
    if (out.includes(display)) {
      out = out.split(display).join(speech);
    }
  }
  return out;
}
