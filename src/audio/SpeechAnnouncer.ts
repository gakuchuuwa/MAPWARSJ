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
import { getTacticalSkillEntry } from "../data/TacticalSkillCatalog";

interface SpeakOptions {
  /** S 级大事：略慢语速、同步字幕条、播报期间丢弃常规播报（不被打断） */
  sTier?: boolean;
  /** 同步显示的字幕条文案（不传则不显示字幕） */
  banner?: string;
  rate?: number;
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

/** 名将 = 拥有战略技（普将无 strategicSkillId）。用于攻城播报是否冠「名将」二字。 */
function isFamousGeneral(generalId?: string | null): boolean {
  if (!generalId) return false;
  return !!GENERAL_PROFILES[generalId]?.strategicSkillId;
}

// ───────────────────────────────────────────────────────────────
// 三势技释放 → 六套三十六计八字诀（双维矩阵；判据同 docs/02-design/武将技-三势适性系统设计.md A.5+A.6）
//   局：A.6 condition 优先归劣势，否则 A.5 effect 判优/均/劣；计套：局内按 effect 二分。
// ───────────────────────────────────────────────────────────────
type StratagemKey = "gong" | "sheng" | "di" | "hun" | "bing" | "bai";

/** A.6：这些 condition 一律归劣势（覆盖 effect 判定；背水一战/破釜沉舟/守城死战等） */
const LOSE_CONDITIONS = new Set<string>([
  "ratio_underdog", "self_troops_below_enemy_pct", "side_comeback", "lose_as_underdog", "battle_siege_defender",
]);
const EFF_JIANDI = new Set<string>(["enemy_sub_troops_opening", "dual_sub_troops_opening"]);                 // 减敌兵·胜战(全)
const EFF_JIAJI = new Set<string>(["ally_power_mult", "first_sortie_power_mult", "ally_add_troops_opening"]); // 加己攻·攻战(机)
const EFF_KEDUO = new Set<string>(["steal_enemy_skill", "negate_enemy_skill", "partial_negate_enemy_skill",
  "reflect_enemy_opening_cut", "nullify_enemy_opening_cut", "cancel_enemy_terrain_buff", "halve_enemy_terrain_buff"]); // 克夺反·混战(乱)
const EFF_SUIJI = new Set<string>(["luck_variance_self", "luck_variance_enemy", "luck_lock_self"]);           // 更随机·敌战(衡)
const EFF_JIANJI = new Set<string>(["win_casualty_reduction", "elite_casualty_reduction", "post_recovery_rate"]); // 减己损·并战(借)

/** 判局：由势技 skillId 推 优/均/劣（A.5 effect + A.6 condition）；未知则 null。 */
function classifyJu(skillId: string): "advantage" | "balance" | "disadvantage" | null {
  const entry = getTacticalSkillEntry(skillId);
  if (!entry) return null;
  const be: string = entry.baseEffect;
  const cond: string = entry.condition;
  if (LOSE_CONDITIONS.has(cond) || EFF_JIANJI.has(be)) return "disadvantage";
  if (EFF_JIAJI.has(be) || EFF_JIANDI.has(be)) return "advantage";
  if (EFF_KEDUO.has(be) || EFF_SUIJI.has(be)) return "balance";
  return "disadvantage"; // 其余（lose_enemy_casualty_boost / recompute_comeback / 未知）→劣势
}

/** 由势技 skillId 推六套（局内按 effect 二分）；未知则 null（不播报）。 */
function classifyStratagem(skillId: string): StratagemKey | null {
  const ju = classifyJu(skillId);
  if (!ju) return null;
  const be: string = getTacticalSkillEntry(skillId)!.baseEffect;
  if (ju === "advantage") return EFF_JIANDI.has(be) ? "sheng" : "gong";
  if (ju === "balance") return EFF_KEDUO.has(be) ? "hun" : "di";
  return EFF_JIANJI.has(be) ? "bing" : "bai"; // 减己损→并战借；其余（含 A.6 强归劣势）→败战险
}

/** 六套八字诀（攻/守两套，主人 2026-07 定稿，原文照录，勿改） */
const STRATAGEM_BAJUE: Record<"attacker" | "defender", Record<StratagemKey, string>> = {
  attacker: {
    gong: "厉兵秣马，先发制人",
    sheng: "摧枯拉朽，分割聚歼",
    di: "声东击西，乱其阵脚",
    hun: "攻其不备，出其不意",
    bing: "以逸待劳，反客为主",
    bai: "置之死地，而后生",
  },
  defender: {
    gong: "严阵以待，乘势掩杀",
    sheng: "请君入瓮，聚而歼之",
    di: "虚张声势，挫其锐气",
    hun: "将计就计，后发制人",
    bing: "坚壁清野，以拖待变",
    bai: "困兽犹斗，玉石俱焚",
  },
};

/** 攻占播报·三势词（主人 2026-07 定稿，原文照录，勿改） */
type CaptureJu = "advantage" | "balance" | "disadvantage";
const CAPTURE_WIN: Record<CaptureJu, string> = {          // 攻方胜法
  advantage: "势如破竹", balance: "顺势而为", disadvantage: "力挽狂澜",
};
const CAPTURE_DEFEAT_SIGN: Record<CaptureJu, string> = {  // 守方败象
  advantage: "独木难支", balance: "计穷力竭", disadvantage: "大势已去",
};
const CAPTURE_DEFEAT_YIELD: Record<CaptureJu, string> = { // 守方降服
  advantage: "甘拜下风", balance: "解甲归降", disadvantage: "俯首称臣",
};

export class SpeechAnnouncer {
  private enabled = true;
  // 当前偏好的声音
  private preferredVoice: "Yunxi" | "Yunjian" = "Yunjian";
  /** S 级播报占用截止时间戳：期间常规播报直接丢弃（S 级大事不被小事打断） */
  private sTierBusyUntilMs = 0;

  /** 技能释放播报串行队列（攻先守后，不互相打断） */
  private skillSpeakQueue: string[] = [];
  private skillSpeaking = false;

  constructor() {}

  /**
   * 挑选最佳中文男声。
   * 优先使用当前用户偏好的在线男声。
   */
  private pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    // 根据偏好设定优先级
    let maleKeywords: string[];
    if (this.preferredVoice === "Yunxi") {
      maleKeywords = [
        "云希", "Yunxi",         // 当前偏好
        "云健", "Yunjian",       // 备选
        "云扬", "Yunyang",
        "云皓", "Yunhao",
        "云杰", "Yunjie",
        "云野", "Yunye",
        "云泽", "Yunze",
        "云枫", "Yunfeng",
        "云龍", "Yunlong",
        "雲哲", "Yunzhe",
      ];
    } else {
      maleKeywords = [
        "云健", "Yunjian",       // 当前偏好
        "云希", "Yunxi",         // 备选
        "云扬", "Yunyang",
        "云皓", "Yunhao",
        "云杰", "Yunjie",
        "云野", "Yunye",
        "云泽", "Yunze",
        "云枫", "Yunfeng",
        "云龍", "Yunlong",
        "雲哲", "Yunzhe",
      ];
    }

    for (const keyword of maleKeywords) {
      const found = voices.find((v) => v.lang.startsWith("zh") && v.name.includes(keyword));
      if (found) return found;
    }

    // 最后兜底：任意中文声音
    return voices.find((v) => v.lang.startsWith("zh")) || null;
  }

  public setEnabled(on: boolean): void { this.enabled = on; }
  public isEnabled(): boolean { return this.enabled; }

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
   * 攻城/攻关开始（仅跟随军团触发）。守方分三档：
   *   无将 → 「白起率领秦国军，兵临邯郸」（一句带过，不描写守御）
   *   普将 → 「白起率领秦国军，攻打邯郸。赵国廉颇凭城据守」（关隘：据险而守）
   *   名将 → 「白起率领秦国军，攻打邯郸。赵国名将廉颇凭城据守」（关隘：据险而守）
   * 守将由 SiegeManager 从实际参战守方单位取（与攻占 defenderHadNamedForce 同源）。
   */
  public announceSiegeStart(opts: {
    attackerFactionId: string;
    cityName: string;
    isPass: boolean;
    attackerGeneralId?: string | null;
    defenderFactionId?: string | null;
    defenderGeneralId?: string | null;
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    const attGeneral = opts.attackerGeneralId
      ? getGeneralRecordByGeneralId(opts.attackerGeneralId)
      : getFactionGeneral(opts.attackerFactionId);
    const attFaction = getFactionNameForSpeech(opts.attackerFactionId);
    const attackerPart = attGeneral
      ? `${attGeneral.generalName}率领${attFaction}军`
      : `${attFaction}军`;

    const defGeneral = opts.defenderGeneralId
      ? getGeneralRecordByGeneralId(opts.defenderGeneralId)
      : null;

    let text: string;
    if (!defGeneral) {
      // 无将：守将已随军出征、只剩纯守军 → 一句「兵临」带过
      text = `${attackerPart}，兵临${opts.cityName}`;
    } else {
      const defFaction = opts.defenderFactionId ? getFactionNameForSpeech(opts.defenderFactionId) : "";
      const holdVerb = opts.isPass ? "据险而守" : "凭城据守";
      const mingjiang = isFamousGeneral(defGeneral.generalId) ? "名将" : "";
      text = `${attackerPart}，攻打${opts.cityName}。${defFaction}${mingjiang}${defGeneral.generalName}${holdVerb}`;
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
    attackerSkillId?: string | null;   // 攻方将领这一仗的势技 → 判优/均/劣
    defenderGeneralId?: string | null; // 守方武将（无=无将，不续守方句）
    regionLabel?: string | null;       // 文化中心时传（S 级 + 前缀 + 横幅）
  }): void {
    if (!this.enabled) return;
    this.clearSkillQueue(); // 攻占是战斗收尾，清掉未念完的技能脉冲
    const att = getFactionNameForSpeech(opts.attackerFactionId);
    const isCenter = !!opts.regionLabel;
    const cityPhrase = isCenter ? `${opts.regionLabel}中心，${opts.cityName}` : opts.cityName;
    const defGeneral = opts.defenderGeneralId ? getGeneralRecordByGeneralId(opts.defenderGeneralId) : null;
    const ju = opts.attackerSkillId ? classifyJu(opts.attackerSkillId) : null;

    let text: string;
    if (!defGeneral || !ju) {
      // 守方无武将（或攻方势未知）→ 简报
      text = `${att}军，攻占${cityPhrase}`;
    } else {
      text = `${att}军，${CAPTURE_WIN[ju]}，攻占${cityPhrase}。${defGeneral.generalName}，${CAPTURE_DEFEAT_SIGN[ju]}，${CAPTURE_DEFEAT_YIELD[ju]}`;
    }
    console.log("[Speech] 攻占:", text);
    if (isCenter) {
      this.speak(text, { sTier: true, rate: 0.92, banner: `${opts.regionLabel}易主 · ${opts.cityName}归${att}` });
    } else {
      this.speak(text);
    }
  }

  /** 野战开始：进攻方势力+武将，大战，防守方势力+武将 */
  public announceFieldBattle(
    attackerFactionId: string,
    defenderFactionId: string,
    attackerGeneralId?: string,
    defenderGeneralId?: string,
  ): void {
    if (!this.enabled) return;
    this.clearSkillQueue();
    const attFaction = getFactionNameForSpeech(attackerFactionId);
    const defFaction = getFactionNameForSpeech(defenderFactionId);
    const attGeneral = attackerGeneralId ? getGeneralRecordByGeneralId(attackerGeneralId) : null;
    const defGeneral = defenderGeneralId ? getGeneralRecordByGeneralId(defenderGeneralId) : null;
    const attPart = attGeneral ? `${attFaction}，${attGeneral.generalName}` : `${attFaction}，将军`;
    const defPart = defGeneral ? `${defFaction}，${defGeneral.generalName}` : `${defFaction}，将军`;
    const text = `${attPart}，大战，${defPart}`;
    console.log("[Speech] 野战:", text);
    this.speak(text);
  }

  /** 全军覆没 */
  public announceAnnihilation(factionId: string, _legionName: string, cityName: string, _generalId?: string): void {
    if (!this.enabled) return;
    const text = `${getFactionNameForSpeech(factionId)}军于${cityName}外，全军覆没`;
    console.log("[Speech] 覆没:", text);
    this.speak(text);
  }

  /**
   * 三势技释放（仅跟随军团那场战斗，攻/守各一次，由 CombatUI 在技能名闪现时调用）。
   * 句式：武将，本人势技名，命，精锐番号，八字诀（八字诀由 skillId 推六套，攻守分表）。
   * 守方无将领 → 攻方技不播（主人规则：不值一提）。
   */
  public announceSkillRelease(opts: {
    side: "attacker" | "defender";
    generalName: string;
    skillDisplayName: string;
    skillId: string;
    eliteName?: string | null;
    opponentHasGeneral: boolean;
  }): void {
    if (!this.enabled) return;
    if (opts.side === "attacker" && !opts.opponentHasGeneral) return; // 守方无将 → 攻方技不播
    if (!opts.generalName || !opts.skillDisplayName) return;
    const key = classifyStratagem(opts.skillId);
    if (!key) return;
    const bajue = STRATAGEM_BAJUE[opts.side][key];
    if (!bajue) return;
    const eliteClause = opts.eliteName ? `，命，${opts.eliteName}` : "";
    const text = `${opts.generalName}，${opts.skillDisplayName}${eliteClause}，${bajue}`;
    console.log("[Speech] 技能:", text);
    this.skillSpeakQueue.push(text);
    this.drainSkillQueue();
  }

  /** 清空技能播报队列（新战斗开打时，旧残留不再念） */
  private clearSkillQueue(): void {
    this.skillSpeakQueue.length = 0;
    this.skillSpeaking = false;
  }

  /** 串行出队：攻先守后依次念，不互相打断 */
  private drainSkillQueue(): void {
    if (this.skillSpeaking) return;
    const next = this.skillSpeakQueue.shift();
    if (next === undefined) return;
    this.skillSpeaking = true;
    this.speak(next, {
      onDone: () => {
        this.skillSpeaking = false;
        this.drainSkillQueue();
      },
    });
  }

  private speak(text: string, opts?: SpeakOptions): void {
    const now = Date.now();
    // S 级播报期间，常规播报直接丢弃（不 cancel，不排队——慢直播宁缺毋滥）
    if (!opts?.sTier && now < this.sTierBusyUntilMs) { opts?.onDone?.(); return; }

    // 字幕条不依赖语音引擎是否可用（无声环境下画面仍完整）
    if (opts?.banner) SubtitleBanner.show(opts.banner);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) { opts?.onDone?.(); return; }
    const synth = window.speechSynthesis;

    if (opts?.sTier) {
      // 兜底占用窗口：按文本长度估读完时间，onend 会提前释放
      this.sTierBusyUntilMs = now + Math.min(12000, 2500 + text.length * 350);
    }

    synth.cancel();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      if (opts?.rate !== undefined) utterance.rate = opts.rate;
      // 播报音量跟随主音量（与音效/音乐感知齐平，不再固定满音量盖过一切）
      utterance.volume = audioManager.getSpeechVolume();

      const voice = this.pickBestVoice(synth.getVoices());
      if (voice) {
        utterance.voice = voice;
        console.log("[Speech] 使用:", voice.name);
      }

      // 优先级闪避：播报期间压低音效 + 音乐，念完恢复
      audioManager.setSpeechDucking(true);
      // 兜底：语音事件偶发不触发时，按估读时长强制恢复，避免音效/音乐一直被压
      const duckSafetyMs = Math.min(15000, 1500 + text.length * 400);
      let released = false;
      const safety = window.setTimeout(() => {
        released = true;
        audioManager.setSpeechDucking(false);
      }, duckSafetyMs);
      const releaseDuck = () => {
        if (released) return;
        released = true;
        window.clearTimeout(safety);
        audioManager.setSpeechDucking(false);
      };

      utterance.onstart = () => audioManager.setSpeechDucking(true);

      const settle = () => {
        releaseDuck();
        if (opts?.sTier) this.sTierBusyUntilMs = 0;
        if (opts?.banner) {
          // 念完后字幕再停留片刻，缓缓淡出
          window.setTimeout(() => SubtitleBanner.hide(), 1200);
        }
        opts?.onDone?.();
      };
      utterance.onend = settle;
      utterance.onerror = settle;

      synth.speak(utterance);
    }, 50);
  }
}

/** 全局单例 */
export const speechAnnouncer = new SpeechAnnouncer();
