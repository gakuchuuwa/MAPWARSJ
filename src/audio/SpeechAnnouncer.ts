/**
 * SpeechAnnouncer.ts - 跟随军团语音播报
 */

import { getFactionGeneral, getGeneralRecordByGeneralId } from "../data/FactionGenerals";
import {
  GENERAL_PROFILES,
  getTacticalSkillDef,
  type GeneralProfile,
} from "../data/GeneralSkills";
import { SubtitleBanner } from "../ui/SubtitleBanner";
import { audioManager } from "./AudioManager";
import { getGeneralNameForSpeech, prepareSpeechText } from "./GeneralSpeechNames";
import { getTacticalSkillEntry } from "../data/TacticalSkillCatalog";
import { edgeTtsClient, type EdgeVoice } from "./EdgeTtsClient";

interface SpeakOptions {
  /** S 级大事：略慢语速、同步字幕条、播报期间丢弃常规播报（不被打断） */
  sTier?: boolean;
  /** 同步显示的字幕条文案（不传则不显示字幕） */
  banner?: string;
  rate?: number;
  /** 技能句已做人名校正，跳过全文 prepareSpeechText（防误替技能名/精锐名） */
  skipGlobalNameReplace?: boolean;
  /** TTS 真正开口时回调（技能 Cut-in 与念名同刻；引擎无 onstart 时在 speak 前兜底） */
  onStart?: () => void;
  /** 念完 / 被丢弃后回调（技能释放脉冲串行队列用） */
  onDone?: () => void;
}

function getTacticalSkillName(factionId: string, generalId?: string): string {
  const general = generalId ? getGeneralRecordByGeneralId(generalId) : getFactionGeneral(factionId);
  if (!general) return "";
  const profile: GeneralProfile | undefined = GENERAL_PROFILES[general.generalId];
  if (!profile) return "";
  const skill = getTacticalSkillDef(profile.tacticalSkillId);
  return skill?.displayName ?? "";
}

function getFactionNameForSpeech(factionId: string): string {
  const name = (window as any).game?.factionManager?.getFactionName?.(factionId);
  if (name && name !== "未知势力") return name;
  return factionId;
}

function hasEliteName(name: string): boolean {
  return !!name && name !== "军团" && !name.startsWith("Army ");
}

/** 名将 = tier famous（2026-08-03 起战略技全随机，不再以 strategicSkillId 判名将）。用于攻城播报是否冠「名将」二字。 */
function isFamousGeneral(generalId?: string | null): boolean {
  if (!generalId) return false;
  return GENERAL_PROFILES[generalId]?.tier === 'famous';
}

// ───────────────────────────────────────────────────────────────
// 三势技释放 → 六套三十六计八字诀（双维矩阵；判据同 docs/02-design/武将技-三势适性系统设计.md A.5+A.6）
//   局：A.6 condition 优先归劣势，否则 A.5 effect 判优/均/劣；计套：局内按 effect 二分。
// ───────────────────────────────────────────────────────────────
type StratagemKey = "gong" | "sheng" | "di" | "hun" | "bing" | "bai";

/** A.6：这些 condition 一律归劣势（覆盖 effect 判定；背水一战/破釜沉舟/守城死战等） */
const LOSE_CONDITIONS = new Set<string>([
  "ratio_underdog", "self_troops_below_enemy_pct", "side_comeback", "lose_as_underdog",
]);
const EFF_JIANDI = new Set<string>(["enemy_sub_troops_opening", "dual_sub_troops_opening"]);                 // 减敌兵·胜战(全)
const EFF_JIAJI = new Set<string>(["ally_power_mult", "first_sortie_power_mult", "ally_add_troops_opening", "enemy_mult_0_8"]); // 加己攻/减敌攻·攻战(机)
const EFF_KEDUO = new Set<string>(["steal_enemy_skill", "negate_enemy_skill", "partial_negate_enemy_skill",
  "reflect_enemy_opening_cut", "nullify_enemy_opening_cut", "cancel_enemy_terrain_buff", "halve_enemy_terrain_buff"]); // 克夺反·混战(乱)
const EFF_SUIJI = new Set<string>(["luck_variance_self", "luck_variance_enemy", "luck_lock_self"]);           // 更随机·并战(借)
const EFF_JIANJI = new Set<string>(["win_casualty_reduction", "elite_casualty_reduction", "post_recovery_rate"]); // 减己损·敌战(衡)
const EFF_SIYAO = new Set<string>(["lose_enemy_casualty_boost"]);                                              // 输了咬·敌战(衡)
const EFF_JISUN = new Set<string>(["self_casualty_reduction"]);                                                 // 减己损·胜战(全)

/** 判局：由技的 baseEffect+condition 推 优/均/劣（A.5+A.6）。仅用于 classifyStratagem→八字诀分类，不再用于语音播报判势。播报势=兵力比。 */
function classifyJu(skillId: string): "advantage" | "balance" | "disadvantage" | null {
  const entry = getTacticalSkillEntry(skillId);
  if (!entry) return null;
  const be: string = entry.baseEffect;
  const cond: string = entry.condition;
  if (LOSE_CONDITIONS.has(cond) || EFF_SUIJI.has(be)) return "disadvantage";
  if (EFF_JIAJI.has(be) || EFF_JIANDI.has(be) || EFF_JISUN.has(be)) return "advantage";
  if (EFF_KEDUO.has(be) || EFF_JIANJI.has(be) || EFF_SIYAO.has(be)) return "balance";
  return "disadvantage"; // 其余（recompute_comeback 等败战）→劣势
}

/** 由势技 skillId 推六套（局内按 effect 二分）；未知则 null（不播报）。 */
function classifyStratagem(skillId: string): StratagemKey | null {
  const ju = classifyJu(skillId);
  if (!ju) return null;
  const be: string = getTacticalSkillEntry(skillId)!.baseEffect;
  if (ju === "advantage") return EFF_JIANDI.has(be) || EFF_JISUN.has(be) ? "sheng" : "gong";
  if (ju === "balance") {
    if (EFF_KEDUO.has(be)) return "hun";
    return "di"; // 敌战：EFF_SIYAO + EFF_JIANJI
  }
  return EFF_SUIJI.has(be) ? "bing" : "bai"; // 并战或败战
}

/** 六套八字诀（攻/守两套，主人 2026-07 定稿，原文照录，勿改） */
const STRATAGEM_BAJUE: Record<"attacker" | "defender", Record<StratagemKey, string>> = {
  attacker: {
    gong: "厉兵秣马，先发制人",
    sheng: "摧枯拉朽，分割聚歼",
    di: "乱其阵脚，出奇制胜",
    hun: "攻其不备，出其不意",
    bing: "孤注一掷，乘虚而击",
    bai: "置之死地，而后生",
  },
  defender: {
    gong: "严阵以待，乘势掩杀",
    sheng: "请君入瓮，聚而歼之",
    di: "虚张声势，挫其锐气",
    hun: "伺机而动，后发制人",
    bing: "坚壁清野，以拖待变",
    bai: "背城借一，负隅坚守",
  },
};

/** 攻占播报·三势词（主人 2026-07 定稿，原文照录，勿改） */
export type CaptureJu = "advantage" | "balance" | "disadvantage";
const CAPTURE_WIN: Record<CaptureJu, string> = {          // 攻方胜法
  advantage: "势如破竹", balance: "顺势而为", disadvantage: "力挽狂澜",
};
const CAPTURE_DEFEAT_SIGN: Record<CaptureJu, string> = {  // 守方败象
  advantage: "独木难支", balance: "计穷力竭", disadvantage: "大势已去",
};
const CAPTURE_DEFEAT_YIELD: Record<CaptureJu, string> = { // 守方降服
  advantage: "甘拜下风", balance: "卸甲归降", disadvantage: "俯首称臣",
};

/** 攻城播报·三势词（主人 2026-07 定稿，原文照录；城池 city / 关隘 pass 各一套） */
const SIEGE_ATK_PREFIX: Record<CaptureJu, { city: string; pass: string }> = { // 攻方势前缀
  advantage: { city: "大军压境", pass: "旌旗蔽谷" },
  balance: { city: "阵列而进", pass: "陈兵险隘" },
  disadvantage: { city: "师老军疲", pass: "强弩之末" },
};
const SIEGE_DEF_PHRASE: Record<CaptureJu, { city: string; pass: string }> = { // 守方八字
  advantage: { city: "深沟高垒，披甲督战", pass: "整顿军备，严阵以待" },
  balance: { city: "凭城据守，稳如泰山", pass: "据险而守，不动如山" },
  disadvantage: { city: "洞若观火，见机行事", pass: "一夫当关，万夫莫开" },
};

/** 野战开战·三势词（主人 2026-07 定稿，原文照录；跟随军团的势） */
const FIELD_SHISHU: Record<CaptureJu, string> = {
  advantage: "势不可挡", balance: "势均力敌", disadvantage: "孤军奋勇",
};

/** 野战结束·三势词（主人 2026-07 定稿，原文照录；势=跟随军团的势） */
const FIELD_WIN_METHOD: Record<CaptureJu, string> = { advantage: "所向披靡", balance: "奇兵制胜", disadvantage: "殊死一战" };
const FIELD_WIN_BREAK: Record<CaptureJu, string> = { advantage: "大破", balance: "击破", disadvantage: "险胜" };
const FIELD_WIN_ROUT: Record<CaptureJu, string> = { advantage: "败走而逃", balance: "引军退却", disadvantage: "功亏一篑" };
const FIELD_LOSE: Record<CaptureJu, string> = {
  advantage: "前功尽弃，兵败如山倒", balance: "溃不成军，一败涂地", disadvantage: "全军覆没，尸横遍野",
};

/** 攻城失败·三势词（主人 2026-07 定稿，原文照录；势=跟随军团的势） */
const SIEGE_FAIL_PHRASE: Record<CaptureJu, string> = { advantage: "丢盔弃甲", balance: "无功而返", disadvantage: "以卵击石" };
const SIEGE_FAIL_VERB: Record<CaptureJu, string> = { advantage: "惨败", balance: "兵败", disadvantage: "败于" };

export class SpeechAnnouncer {
  /** 语音清单诊断本会话是否已打印过（清单只在加载完变一次，逐句重打纯刷屏） */
  private static voiceDiagLogged = false;
  private enabled = true;
  // 当前偏好的声音
  private preferredVoice: "Yunxi" | "Yunjian" = "Yunjian";
  /** S 级播报占用截止时间戳：期间常规播报直接丢弃（S 级大事不被小事打断） */
  private sTierBusyUntilMs = 0;

  /** 技能释放播报串行队列（入队顺序=亮相顺序：劣势先/均势攻先；不互相打断）；onStart 在 TTS 开口时触发 */
  private skillSpeakQueue: {
    text: string;
    skipGlobalNameReplace?: boolean;
    onStart?: () => void;
  }[] = [];
  private skillSpeaking = false;
  /** 播报会话：技能连播期间保持 ducking，避免句间音效/音乐脉冲 */
  private speechDuckSession = false;

  /** 缓存系统语音列表（getVoices 首帧常为空，须等 voiceschanged） */
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private voicesHooked = false;

  /** 云健直连通道正在播放的 Audio（synth.cancel 管不到它，换句时须手动停） */
  private activeEdgeAudio: HTMLAudioElement | null = null;
  /** 播报序号：每次 speak 自增；异步云健 resolve 后凭此判断是否已被新播报取代（防两句声音重叠） */
  private speechSeq = 0;

  constructor() {
    this.hookVoices();
  }

  private hookVoices(): void {
    if (this.voicesHooked) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voicesHooked = true;
    const refresh = () => {
      this.cachedVoices = window.speechSynthesis.getVoices();
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
  }

  private getVoices(): SpeechSynthesisVoice[] {
    this.hookVoices();
    const live = typeof window !== "undefined" && "speechSynthesis" in window
      ? window.speechSynthesis.getVoices()
      : [];
    if (live.length > 0) this.cachedVoices = live;
    return this.cachedVoices;
  }

  private beginSpeechDuckSession(): void {
    if (this.speechDuckSession) return;
    this.speechDuckSession = true;
    audioManager.setSpeechDucking(true);
  }

  private endSpeechDuckSessionIfIdle(): void {
    if (this.skillSpeaking || this.skillSpeakQueue.length > 0) return;
    if (!this.speechDuckSession) return;
    this.speechDuckSession = false;
    audioManager.setSpeechDucking(false);
  }

  /**
   * 获取语音的有效名称。
   * Edge 在线语音的 name 字段偶发为 "undefined"（如 "Microsoft undefined Online (Natural) - undefined"），
   * 此时降级使用 voiceURI（通常含完整标识如 "Microsoft Yunxi Online (Natural) - Chinese (PRC)"）。
   */
  private getVoiceEffectiveName(v: SpeechSynthesisVoice): string {
    const name = typeof v.name === "string" ? v.name : "";
    const uri = typeof v.voiceURI === "string" ? v.voiceURI : "";
    if (this.isVoiceNameCorrupt(v)) {
      if (uri && !/\bundefined\b/i.test(uri)) return uri;
      return uri || name || "";
    }
    return name;
  }

  /** name 损坏的 Online Natural 音色：选中后 Edge/Chrome 常 onerror 无声 */
  private isVoiceNameCorrupt(v: SpeechSynthesisVoice): boolean {
    const name = typeof v.name === "string" ? v.name : "";
    return !name || name === "undefined" || /\bundefined\b/i.test(name);
  }

  /** 本机 Desktop/OneCore 通常比坏掉的 Online Natural 更稳（能开口） */
  private isReliableLocalVoice(v: SpeechSynthesisVoice): boolean {
    if (v.localService) return true;
    const n = this.getVoiceEffectiveName(v);
    return /Desktop|OneCore/i.test(n);
  }

  /**
   * 关键词是否命中语音名。
   * 拉丁名须整词匹配：Yunxi 不得误中女声 Yunxia（"Yunxia".includes("Yunxi")===true）。
   */
  private voiceNameMatches(name: string, keyword: string): boolean {
    if (!name || !keyword) return false;
    if (/^[A-Za-z]+$/.test(keyword)) {
      const re = new RegExp(`(?:^|[^A-Za-z])${keyword}(?![A-Za-z])`, "i");
      return re.test(name);
    }
    return name.includes(keyword);
  }

  private isKnownFemaleVoice(name: string): boolean {
    // 只用完整专名，禁止「晓」「Xiao」单截（会误伤含 Xiao 的其它名）
    // 注意：微软「康康 / Kangkang」是本地男声，不得列入女声
    const femaleKeywords = [
      "Yunxia", "云夏", "云霞", // 易被 Yunxi 误匹配，显式排除
      "晓晓", "Xiaoxiao", "雲曉",
      "慧慧", "Huihui",
      "瑶瑶", "Yaoyao",
      "彤彤", "Tongtong",
      "涵涵", "Hanhan",
      "嵐嵐", "Lanlan",
      "詩詩", "Shishi",
      "芊芊", "Qianqian",
      "雅婷", "Yating",
      "晓伊", "Xiaoyi",
      "晓梦", "Xiaomeng",
      "晓甄", "Xiaozhen",
      "晓萱", "Xiaoxuan",
      "晓颜", "Xiaoyan",
      "晓茹", "Xiaoru",
      "晓秋", "Xiaoqiu",
      "晓辰", "Xiaochen",
      "晓双", "Xiaoshuang",
      "晓佳", "Xiaojia",
      "晓涵", "Xiaohan",
      "晓墨", "Xiaomo",
      "晓睿", "Xiaorui",
      "晓悠", "Xiaoyou",
      "晓北", "Xiaobei",
      "晓妮", "Xiaoni",
      "曉臻", "HsiaoChen",
      "曉雨", "HsiaoYu",
      "曉曼", "HiuMaan",
      "曉佳", "HiuGaai",
      "Tracy",
      "善怡", "Sinji",
      "小雨", "Xiaoyu",
      "婷婷", "Tingting", "Ting-Ting",
      "莉莉", "Lili",
      "美佳", "Meijia", "Mei-Jia",
      "Google 普通话", "Google 國語", "Google 粤語", "Google 廣東話",
    ];
    return femaleKeywords.some((k) => this.voiceNameMatches(name, k) || name.includes(k));
  }

  /**
   * 按优先级列出可用中文男声（可多候选，speak 时 onerror 顺延下一位）。
   * 用户偏好（云健/云希）优先；本机可靠音色优先于 name 损坏的 Online Natural。
   */
  private rankMaleVoices(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice[] {
    const zhVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("zh"));
    const fallbackMales = [
      "康康", "Kangkang", // 本机男声（勿当女声）
      "Zhiwei", "Zhiyu", "Jianqiang",
      "Danny", "WanLung", "雲龍",
    ];
    // 用户偏好优先，再备选其它男声（勿用「史官风」列表盖住云健）
    const preferredFirst =
      this.preferredVoice === "Yunxi"
        ? ["云希", "Yunxi", "云健", "Yunjian"]
        : ["云健", "Yunjian", "云希", "Yunxi"];
    const maleKeywords = [
      ...preferredFirst,
      "云扬", "Yunyang",
      "云泽", "Yunze",
      "云皓", "Yunhao",
      "云杰", "Yunjie",
      "云野", "Yunye",
      "云枫", "Yunfeng",
      "云龍", "Yunlong",
      "雲哲", "Yunzhe",
      "Yunyi", "Yunfan",
      ...fallbackMales,
    ];

    const ranked: SpeechSynthesisVoice[] = [];
    const seen = new Set<string>();
    const push = (v: SpeechSynthesisVoice) => {
      const key = v.voiceURI || v.name;
      if (seen.has(key)) return;
      seen.add(key);
      ranked.push(v);
    };

    for (const keyword of maleKeywords) {
      // 同关键词：先可靠本机，再 name 正常的在线，最后才是 name 损坏但 URI 可识别的在线
      const matches = zhVoices.filter((v) => {
        const eff = this.getVoiceEffectiveName(v);
        return this.voiceNameMatches(eff, keyword) && !this.isKnownFemaleVoice(eff);
      });
      const local = matches.filter((v) => this.isReliableLocalVoice(v));
      const onlineOk = matches.filter((v) => !this.isReliableLocalVoice(v) && !this.isVoiceNameCorrupt(v));
      const onlineCorrupt = matches.filter((v) => !this.isReliableLocalVoice(v) && this.isVoiceNameCorrupt(v));
      for (const v of [...local, ...onlineOk, ...onlineCorrupt]) push(v);
    }

    // 兜底：其它非女声中文
    for (const v of zhVoices) {
      if (!this.isKnownFemaleVoice(this.getVoiceEffectiveName(v))) push(v);
    }
    return ranked;
  }

  /**
   * 挑选最佳中文男声（取 rank 首位）。
   * pitchDown：仅当一名男声都没有、被迫用女声时。
   */
  private pickBestVoice(voices: SpeechSynthesisVoice[]): { voice: SpeechSynthesisVoice; pitchDown: boolean } | null {
    const ranked = this.rankMaleVoices(voices);
    if (ranked.length > 0) {
      return { voice: ranked[0], pitchDown: false };
    }
    const zhVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("zh"));
    const anyZh = zhVoices[0];
    if (anyZh) {
      console.warn(
        `[Speech] 无可用男声，降调兜底: ${this.getVoiceEffectiveName(anyZh)}`,
        zhVoices.map((v) => this.getVoiceEffectiveName(v)),
      );
      return { voice: anyZh, pitchDown: true };
    }
    console.warn("[Speech] 系统无任何中文语音");
    return null;
  }

  public setEnabled(on: boolean): void {
    this.enabled = on;
    if (!on) {
      // 立即静音：停掉正在播的 Web Speech 与云健直连 Audio，清空技能队列（GAKU 2026-08-04 全局总开关）
      this.clearSkillQueue();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
      }
      this.stopActiveEdgeAudio();
    }
  }
  public isEnabled(): boolean { return this.enabled; }

  /** 技能语音队列是否空闲（下一句入队时是否会附带技能音效） */
  public isSkillVoiceIdle(): boolean {
    return this.skillSpeakQueue.length === 0 && !this.skillSpeaking;
  }

  /** 切换男声偏好，并试播一句 */
  public toggleVoicePreference(): void {
    if (this.preferredVoice === "Yunxi") {
      this.preferredVoice = "Yunjian";
      this.speak("已切换至浑厚沉稳男声");
    } else {
      this.preferredVoice = "Yunxi";
      this.speak("已切换至年轻朝气男声");
    }
  }

  public getPreferredVoice(): string {
    return this.preferredVoice === "Yunjian" ? "云健" : "云希";
  }

  /**
   * 攻城/攻关开始（仅跟随军团触发）。城池「兵临」、关隘「攻打」；势=攻方这一仗的势（与攻占/技能同源）。
   *   无将 → 「白起率领秦国军，兵临邯郸」（一句带过）
   *   有将 → 「白起率领秦国军，{势前缀}，兵临邯郸。赵国[名将]廉颇，{守方八字}」
   *          普将/名将同结构，仅名将多「名将」二字。
   */
  public announceSiegeStart(opts: {
    attackerFactionId: string;
    cityName: string;
    isPass: boolean;
    ju: CaptureJu;                      // 攻方这一仗的势（兵力比判定，与攻占/技能同源）
    attackerGeneralId?: string | null;
    attackerSkillId?: string | null;   // 保留：将来可选用于技名等
    defenderFactionId?: string | null;
    defenderGeneralId?: string | null;
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    const attGeneral = opts.attackerGeneralId
      ? getGeneralRecordByGeneralId(opts.attackerGeneralId)
      : null; // 攻方无将则不加将名，只用势力军（锚定将≠出征将）
    const attFaction = getFactionNameForSpeech(opts.attackerFactionId);
    const attackerLead = attGeneral
      ? `${getGeneralNameForSpeech(attGeneral.generalId, attGeneral.generalName)}率领${attFaction}军`
      : `${attFaction}军`;
    const verb = opts.isPass ? "攻打" : "兵临"; // 关隘攻打、城池兵临

    const defGeneral = opts.defenderGeneralId
      ? getGeneralRecordByGeneralId(opts.defenderGeneralId)
      : null;

    let text: string;
    if (!defGeneral) {
      // 无将：一句带过
      text = `${attackerLead}，${verb}${opts.cityName}`;
    } else {
      const terrain: "city" | "pass" = opts.isPass ? "pass" : "city";
      const j: CaptureJu = opts.ju;
      const atkPrefix = SIEGE_ATK_PREFIX[j][terrain];
      const defPhrase = SIEGE_DEF_PHRASE[j][terrain];
      const defFaction = opts.defenderFactionId ? getFactionNameForSpeech(opts.defenderFactionId) : "";
      const mingjiang = isFamousGeneral(defGeneral.generalId) ? "名将" : "";
      text = `${attackerLead}，${atkPrefix}，${verb}${opts.cityName}。${defFaction}${mingjiang}${getGeneralNameForSpeech(defGeneral.generalId, defGeneral.generalName)}，${defPhrase}`;
    }
    console.log("[Speech] 攻城:", text);
    this.speak(text);
  }

  /**
   * 攻占城池（仅跟随军团）。攻方只报势力军（武将+精锐刚放过技，不重复），势=跟随军团这一仗的势：
   *   无将 → 「秦国军，攻占邯郸」（守方无武将，不续守方句）
   *   有将 → 「秦国军，{胜法}，攻占邯郸。{守将}，{败象}，{降服}」（优/均/劣三套词）
   * 文化中心（regionLabel 有值）额外走 S 级：慢语速 + 「中原中心」前缀 + 易主横幅。
   */
  public announceCityCapture(opts: {
    attackerFactionId: string;
    cityName: string;
    ju: CaptureJu;                        // 攻方这一仗的势（兵力比判定）
    attackerSkillId?: string | null;     // 保留
    defenderGeneralId?: string | null;   // 守方武将（无=无将，不续守方句）
    regionLabel?: string | null;         // 文化中心时传（S 级 + 前缀 + 横幅）
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue(); // 攻占是战斗收尾，清掉未念完的技能脉冲
    const att = getFactionNameForSpeech(opts.attackerFactionId);
    const isCenter = !!opts.regionLabel;
    const cityPhrase = isCenter ? `${opts.regionLabel}中心，${opts.cityName}` : opts.cityName;
    const defGeneral = opts.defenderGeneralId ? getGeneralRecordByGeneralId(opts.defenderGeneralId) : null;
    const ju = opts.ju;

    let text: string;
    if (!defGeneral) {
      // 守方无武将 → 简报
      text = `${att}军，攻占${cityPhrase}`;
    } else {
      text = `${att}军，${CAPTURE_WIN[ju]}，攻占${cityPhrase}。${getGeneralNameForSpeech(defGeneral.generalId, defGeneral.generalName)}，${CAPTURE_DEFEAT_SIGN[ju]}，${CAPTURE_DEFEAT_YIELD[ju]}`;
    }
    console.log("[Speech] 攻占:", text);
    if (isCenter) {
      this.speak(text, { sTier: true, rate: 0.92, banner: `${opts.regionLabel}易主 · ${opts.cityName}归${att}` });
    } else {
      this.speak(text);
    }
  }

  /**
   * 野战开战（仅跟随军团那场）。跟随军团念在前 + 它这一仗的势词；
   * 任一方无将则降级用「势力名+军」顶替将名（与攻城开战、野战结束一致），
   * 不再因无将静默——否则正常野战（普通军团多无将）开战几乎从不播报。
   * 「张国，[名将，]张三，{势词}，大战，李国，[名将，]李四」；无将侧作「李国军」。
   */
  public announceFieldBattle(opts: {
    followerFactionId: string;
    ju: CaptureJu;                        // 跟随军团这一仗的势（兵力比判定）
    followerGeneralId?: string | null;
    followerSkillId?: string | null;     // 保留
    enemyFactionId: string;
    enemyGeneralId?: string | null;
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    const ju: CaptureJu = opts.ju;
    // 有将→「势力，[名将，]将名」；无将→「势力军」
    const namePart = (factionId: string, generalId?: string | null): string => {
      const faction = getFactionNameForSpeech(factionId);
      const rec = generalId ? getGeneralRecordByGeneralId(generalId) : null;
      if (!rec) return `${faction}军`;
      return isFamousGeneral(rec.generalId)
        ? `${faction}，名将，${getGeneralNameForSpeech(rec.generalId, rec.generalName)}`
        : `${faction}，${getGeneralNameForSpeech(rec.generalId, rec.generalName)}`;
    };
    const fPart = namePart(opts.followerFactionId, opts.followerGeneralId);
    const ePart = namePart(opts.enemyFactionId, opts.enemyGeneralId);
    const text = `${fPart}，${FIELD_SHISHU[ju]}，大战，${ePart}`;
    console.log("[Speech] 野战:", text);
    this.speak(text);
  }

  /**
   * 野战结束（仅跟随军团那场）。势=跟随军团这一仗的势（与攻打/技能/攻占同源）。
   *   胜 → 「秦国军，{胜法}，{破}，赵国军，廉颇，{败象}」（敌无将不播；败将不冠名将）
   *   败 → 「秦国军，{八字}」（不提敌方；取代野战里的通用覆没语音）
   */
  public announceFieldBattleEnd(opts: {
    win: boolean;
    followerFactionId: string;
    ju: CaptureJu;                        // 跟随军团这一仗的势（兵力比判定）
    followerSkillId?: string | null;     // 保留
    enemyFactionId?: string | null;
    enemyGeneralId?: string | null;
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    const ju: CaptureJu = opts.ju;
    const fFaction = getFactionNameForSpeech(opts.followerFactionId);
    let text: string;
    if (opts.win) {
      // 跟随胜：主角结果永远播。敌方有将则续「敌国军，某将，败走」，无将则省将名只报敌国军。
      const enemy = opts.enemyGeneralId ? getGeneralRecordByGeneralId(opts.enemyGeneralId) : null;
      const eFaction = opts.enemyFactionId ? getFactionNameForSpeech(opts.enemyFactionId) : "";
      const eLead = eFaction ? `${eFaction}军` : "敌军";
      const enemyClause = enemy
        ? `${eLead}，${getGeneralNameForSpeech(enemy.generalId, enemy.generalName)}`
        : eLead;
      text = `${fFaction}军，${FIELD_WIN_METHOD[ju]}，${FIELD_WIN_BREAK[ju]}，${enemyClause}，${FIELD_WIN_ROUT[ju]}`;
    } else {
      // 跟随败：只报跟随军团崩溃，不提敌方（always 播，野战里取代通用覆没语音）
      text = `${fFaction}军，${FIELD_LOSE[ju]}`;
    }
    console.log("[Speech] 野战结束:", text);
    this.speak(text);
  }

  /**
   * 攻城失败（仅跟随军团那场，跟随军团攻城被打退）。势=跟随军团这一仗的势。
   *   「秦国军，{四字}，{败动词}{据点}」；守方无将 → 不播报。取代攻城场景的通用覆没语音。
   */
  public announceSiegeFailure(opts: {
    attackerFactionId: string;
    ju: CaptureJu;                        // 攻方这一仗的势（兵力比判定）
    attackerSkillId?: string | null;     // 保留
    cityName: string;
    defenderGeneralId?: string | null;
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    if (!opts.defenderGeneralId) return; // 守方无将 → 不播报
    const ju: CaptureJu = opts.ju;
    const fFaction = getFactionNameForSpeech(opts.attackerFactionId);
    const text = `${fFaction}军，${SIEGE_FAIL_PHRASE[ju]}，${SIEGE_FAIL_VERB[ju]}${opts.cityName}`;
    console.log("[Speech] 攻城失败:", text);
    this.speak(text);
  }

  /** 全军覆没 */
  public announceAnnihilation(factionId: string, _legionName: string, cityName: string, _generalId?: string): void {
    if (!this.enabled) return;
    const text = `${getFactionNameForSpeech(factionId)}军于${cityName}外，全军覆没`;
    console.log("[Speech] 覆没:", text);
    this.speak(text);
  }

  /** 排队旁观（第三方攻城等待）：跟随军团固定有武将和精锐。 */
  public announceQueueWait(opts: {
    generalName: string;
    eliteName: string;
  }): void {
    if (!this.enabled) return;
    const text = `${opts.generalName}传令三军，原地待命。亲率${opts.eliteName}，择高地险要之处，居高以观敌阵。眼下两敌相持，正宜坐山观虎斗，待其疲态尽显、破绽毕露之时，再伺机而动，雷霆出击，一举坐收渔利！`;
    console.log("[Speech] 排队等待:", text);
    this.speak(text);
  }

  /** 援军参战：只有「武将+精锐」或「无将无精锐」两种；势取本场开局锁定值。 */
  public announceReinforcementJoin(opts: {
    factionId: string;
    ju: CaptureJu;                        // 援军加入时该侧的势（兵力比判定）
    generalId?: string | null;
    generalName?: string | null;
    eliteName?: string | null;
    side: 'attacker' | 'defender';
    cityName: string;
    battleSkillId?: string | null;       // 保留
  }): void {
    if (!this.enabled) return;
    const ju: CaptureJu = opts.ju;
    const action = opts.side === 'attacker' ? '攻打' : '救援';
    const fFaction = getFactionNameForSpeech(opts.factionId);
    const genLead = opts.generalName && opts.eliteName
      ? `${opts.generalName}亲率${opts.eliteName}`
      : `${fFaction}援军`;

    const RUSH_PHRASE: Record<CaptureJu, string> = { advantage: '星夜驰骋', balance: '马不停蹄', disadvantage: '倍道兼程' };
    const text = `${genLead}，${RUSH_PHRASE[ju]}，${action}${opts.cityName}。`;
    console.log("[Speech] 援军参战:", text);
    this.speak(text);
  }

  /**
   * 三势技释放（仅跟随军团那场战斗，攻/守各一次，由 CombatUI 调用）。
   * 句式：武将，本人势技名，精锐番号，八字诀（八字诀由 skillId 推六套，攻守分表）。
   * 入队成功返回 true，onStart 在 TTS 真正开口时触发（CombatUI 用它驱动脉冲 Cut-in，声画同刻）；
   * 返回 false = 本句不播，调用方自行安排脉冲时机。
   */
  public announceSkillRelease(opts: {
    side: "attacker" | "defender";
    ju: CaptureJu;                    // 兵力比决定的势 → 选八字诀
    generalId?: string | null;
    generalName: string;
    skillDisplayName: string;
    skillId: string;
    eliteName?: string | null;
    opponentHasGeneral: boolean;
    /** 跟拍军团单位 id（用于技能音效；非跟拍不播） */
    audioUnitId?: string | null;
    onStart?: () => void;
  }): boolean {
    if (!this.enabled) return false;
    if (!opts.generalName || !opts.skillDisplayName) return false;
    // 按兵力比势选八字诀：优势→攻战/胜战 二选一，均势→敌战/混战 二选一，劣势→并战/败战 二选一
    const pick = (a: StratagemKey, b: StratagemKey): StratagemKey => Math.random() < 0.5 ? a : b;
    const juMap: Record<CaptureJu, StratagemKey> = {
      advantage: pick('gong', 'sheng'),
      balance: pick('di', 'hun'),
      disadvantage: pick('bing', 'bai'),
    };
    const bajue = STRATAGEM_BAJUE[opts.side][juMap[opts.ju]];
    if (!bajue) return false;
    const eliteClause = opts.eliteName ? `，${opts.eliteName}` : "";
    const speechName = getGeneralNameForSpeech(opts.generalId, opts.generalName);
    const text = `${speechName}，${opts.skillDisplayName}${eliteClause}，${bajue}`;
    console.log("[Speech] 技能:", text, `(id=${opts.generalId ?? "?"}, side=${opts.side})`);
    // 双方技能紧挨入队（短战/相持窗不足）→ 仅第一句开口时插技能音效，避免句间硬切
    const playSkillSfxOnStart = this.skillSpeakQueue.length === 0 && !this.skillSpeaking;
    const userOnStart = opts.onStart;
    const audioUnitId = opts.audioUnitId;
    this.skillSpeakQueue.push({
      text,
      skipGlobalNameReplace: true,
      onStart: () => {
        if (playSkillSfxOnStart && audioUnitId) {
          audioManager.playGeneralSkillSfx(audioUnitId);
        }
        userOnStart?.();
      },
    });
    this.drainSkillQueue();
    return true;
  }

  /** 清空技能播报队列（新战斗开打时，旧残留不再念） */
  private clearSkillQueue(): void {
    this.skillSpeakQueue.length = 0;
    this.skillSpeaking = false;
    this.endSpeechDuckSessionIfIdle();
  }

  /** 串行出队：按入队顺序依次念（BattleField 已排劣势先/均势攻先）；onStart 在 TTS 开口时触发 */
  private drainSkillQueue(): void {
    if (this.skillSpeaking) return;
    const next = this.skillSpeakQueue.shift();
    if (next === undefined) return;
    this.skillSpeaking = true;
    this.speak(next.text, {
      skipGlobalNameReplace: next.skipGlobalNameReplace,
      onStart: next.onStart,
      onDone: () => {
        this.skillSpeaking = false;
        this.drainSkillQueue();
      },
    });
  }

  /** 当前男声偏好对应的 Neural 音色名（云健/云希直连用） */
  private currentEdgeVoice(): EdgeVoice {
    return this.preferredVoice === "Yunxi" ? "zh-CN-YunxiNeural" : "zh-CN-YunjianNeural";
  }

  private stopActiveEdgeAudio(): void {
    if (!this.activeEdgeAudio) return;
    try { this.activeEdgeAudio.pause(); this.activeEdgeAudio.src = ""; } catch { /* ignore */ }
    this.activeEdgeAudio = null;
  }

  /**
   * 云健优先通道：直连微软合成 Neural 男声并用 Audio 播放（Edge 已从网页语音接口撤除云健，故自建直连）。
   * 成功走 onPlay/onEnd（与 Web Speech 的 onstart/onend 同语义，驱动 cut-in/推进队列）；
   * 任何失败（合成/播放/超时/端点变动）调用 fallback 回落到 Web Speech（女声兜底），直播不哑。
   */
  private speakViaEdge(
    text: string,
    opts: SpeakOptions | undefined,
    cb: { onPlay: () => void; onEnd: () => void; isSettled: () => boolean; fallback: () => void },
  ): void {
    if (edgeTtsClient.isTemporarilyDisabled()) { cb.fallback(); return; }
    edgeTtsClient
      .synthesize(text, { voice: this.currentEdgeVoice(), rate: opts?.rate })
      .then((blob) => {
        if (cb.isSettled()) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = Math.max(0.05, audioManager.getSpeechVolume());
        this.activeEdgeAudio = audio;
        const cleanup = () => {
          URL.revokeObjectURL(url);
          if (this.activeEdgeAudio === audio) this.activeEdgeAudio = null;
        };
        audio.onplay = () => { console.log("[Speech] 使用: 云健/云希 Neural (直连微软)"); cb.onPlay(); };
        audio.onended = () => { cleanup(); cb.onEnd(); };
        audio.onerror = () => { cleanup(); if (!cb.isSettled()) cb.fallback(); };
        audio.play().catch(() => { cleanup(); if (!cb.isSettled()) cb.fallback(); });
      })
      .catch((e) => {
        console.warn("[Speech] 云健直连失败，回落 Web Speech:", (e as Error)?.message ?? e);
        if (!cb.isSettled()) cb.fallback();
      });
  }

  private speak(text: string, opts?: SpeakOptions): void {
    const now = Date.now();
    // 播报总开关关闭：直接丢弃（不排队不开口；回调仍释放，避免技能队列卡死）
    if (!this.enabled) {
      opts?.onStart?.();
      opts?.onDone?.();
      return;
    }
    // S 级播报期间，常规播报直接丢弃（不 cancel，不排队——慢直播宁缺毋滥）
    if (!opts?.sTier && now < this.sTierBusyUntilMs) {
      opts?.onStart?.();
      opts?.onDone?.();
      return;
    }

    // 字幕条不依赖语音引擎是否可用（无声环境下画面仍完整）
    if (opts?.banner) SubtitleBanner.show(opts.banner);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      opts?.onStart?.();
      opts?.onDone?.();
      return;
    }
    const synth = window.speechSynthesis;

    if (opts?.sTier) {
      // 兜底占用窗口：按文本长度估读完时间，onend 会提前释放
      this.sTierBusyUntilMs = now + Math.min(12000, 2500 + text.length * 350);
    }

    synth.cancel();
    // Chrome 常见：cancel 后 speaking 卡住 paused，后续 speak 无声
    try { if (synth.paused) synth.resume(); } catch { /* ignore */ }
    // 停掉上一句云健 Audio（synth.cancel 只停 Web Speech，管不到 Audio 元素）
    this.stopActiveEdgeAudio();
    // 播报序号：本句开始即占号；云健是异步合成（~600ms），若这期间来了新一句，
    // 旧句 synthesize 迟到 resolve 时凭此判定「已被取代」而放弃播放，杜绝新旧两句声音重叠。
    const mySeq = ++this.speechSeq;
    const isCurrent = () => this.speechSeq === mySeq;

    // 语音列表偶发晚加载（Chrome 常见）：为空或无中文语音时延迟重试再开口
    const attempt = (retried: boolean): void => {
      setTimeout(() => {
        const voicesNow = this.getVoices();
        const hasZhVoice = voicesNow.some((v) => v.lang.toLowerCase().startsWith("zh"));
        if ((voicesNow.length === 0 || !hasZhVoice) && !retried) {
          attempt(true);
          return;
        }

        const speechText = opts?.skipGlobalNameReplace ? text : prepareSpeechText(text);
        const maleCandidates = this.rankMaleVoices(voicesNow);
        const fallback = this.pickBestVoice(voicesNow);
        // 候选：男声排序 +（若有）降调兜底；损坏 Online 排在可靠本机之后，onerror 可顺延
        const candidates: { voice: SpeechSynthesisVoice; pitchDown: boolean }[] = maleCandidates.map((v) => ({
          voice: v,
          pitchDown: false,
        }));
        if (fallback?.pitchDown && !candidates.some((c) => c.voice === fallback.voice)) {
          candidates.push(fallback);
        }
        if (candidates.length === 0 && fallback) candidates.push(fallback);

        // [2026-07-27] 语音清单诊断改为每会话只打一次。
        // 原来每说一句话就遍历全部 324 个语音拼长串打印，一场战斗刷屏好几屏，
        // 控制台里别的日志根本看不见（排查缩放卡顿时被它淹了好几轮）。
        // 清单只在浏览器加载完语音后变一次，逐句重打没有任何信息量。
        if (!SpeechAnnouncer.voiceDiagLogged) {
          SpeechAnnouncer.voiceDiagLogged = true;
          const allZh = voicesNow.filter((v) => v.lang.toLowerCase().startsWith("zh"));
          const zhNames = allZh.map((v) => {
            const eff = this.getVoiceEffectiveName(v);
            const bad = this.isVoiceNameCorrupt(v) ? "⚠坏名" : "";
            return `${bad}${eff}[${v.lang}]`;
          }).join(" | ");
          console.log(
            `[Speech] 诊断（本会话仅此一次）| 总${voicesNow.length} 中文${allZh.length} 男声候选${maleCandidates.length}`,
            `\n  中文: ${zhNames || "（空）"}`,
            `\n  候选: ${candidates.map((c) => this.getVoiceEffectiveName(c.voice)).join(" → ") || "（无）"}`,
          );
        }

        this.beginSpeechDuckSession();
        const duckSafetyMs = Math.min(15000, 1500 + text.length * 400);
        let settled = false;
        let started = false;
        let safety = 0;
        const fireStart = () => {
          if (started) return;
          started = true;
          opts?.onStart?.();
        };
        const settle = () => {
          if (settled) return;
          settled = true;
          fireStart();
          window.clearTimeout(safety);
          if (opts?.sTier) this.sTierBusyUntilMs = 0;
          if (opts?.banner) {
            window.setTimeout(() => SubtitleBanner.hide(), 1200);
          }
          opts?.onDone?.();
          this.endSpeechDuckSessionIfIdle();
        };
        safety = window.setTimeout(settle, duckSafetyMs);

        const speakWithCandidate = (idx: number): void => {
          if (settled) return;
          const utterance = new SpeechSynthesisUtterance(speechText);
          utterance.lang = "zh-CN";
          if (opts?.rate !== undefined) utterance.rate = opts.rate;
          utterance.volume = Math.max(0.05, audioManager.getSpeechVolume());

          const picked = candidates[idx];
          if (picked) {
            utterance.voice = picked.voice;
            if (picked.pitchDown) utterance.pitch = 0.65;
            console.log(
              `[Speech] 使用[${idx + 1}/${Math.max(1, candidates.length)}]:`,
              this.getVoiceEffectiveName(picked.voice),
              picked.pitchDown ? "(降调兜底)" : "",
              this.isVoiceNameCorrupt(picked.voice) ? "(name损坏·靠URI)" : "",
            );
          } else {
            console.warn("[Speech] 无候选音色，用系统默认");
          }

          utterance.onstart = () => {
            this.beginSpeechDuckSession();
            fireStart();
          };
          utterance.onend = settle;
          utterance.onerror = (ev) => {
            const err = (ev as SpeechSynthesisErrorEvent).error;
            // cancel / 换句打断：忽略，勿顺延或 settle（否则会误杀新一句）
            if (err === "interrupted" || err === "canceled") return;
            console.warn(`[Speech] onerror(${err}) @候选${idx}:`, picked ? this.getVoiceEffectiveName(picked.voice) : "default");
            // 损坏 Online Natural 常在此处失败 → 顺延下一男声（如康康 Desktop）
            if (idx + 1 < candidates.length) {
              window.clearTimeout(safety);
              safety = window.setTimeout(settle, duckSafetyMs);
              speakWithCandidate(idx + 1);
              return;
            }
            settle();
          };

          try {
            synth.speak(utterance);
            if (synth.paused) synth.resume();
          } catch (e) {
            console.warn("[Speech] speak 抛错:", e);
            if (idx + 1 < candidates.length) speakWithCandidate(idx + 1);
            else settle();
          }
        };

        // 云健优先：直连微软取回 Neural 男声；任何失败回落到 Web Speech 候选链（女声兜底）
        this.speakViaEdge(speechText, opts, {
          onPlay: () => { this.beginSpeechDuckSession(); fireStart(); },
          onEnd: settle,
          isSettled: () => settled || !isCurrent(),
          fallback: () => speakWithCandidate(0),
        });
      }, retried ? 450 : 50);
    };
    attempt(false);
  }
}

/** 全局单例 */
export const speechAnnouncer = new SpeechAnnouncer();
