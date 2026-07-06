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

interface SpeakOptions {
  /** S 级大事：略慢语速、同步字幕条、播报期间丢弃常规播报（不被打断） */
  sTier?: boolean;
  /** 同步显示的字幕条文案（不传则不显示字幕） */
  banner?: string;
  rate?: number;
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

export class SpeechAnnouncer {
  private enabled = true;
  // 当前偏好的声音
  private preferredVoice: "Yunxi" | "Yunjian" = "Yunjian";
  /** S 级播报占用截止时间戳：期间常规播报直接丢弃（S 级大事不被小事打断） */
  private sTierBusyUntilMs = 0;

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

  /** 攻城开始 */
  public announceSiegeStart(factionId: string, _legionName: string, cityName: string, generalId?: string): void {
    if (!this.enabled) return;
    const general = generalId ? getGeneralRecordByGeneralId(generalId) : getFactionGeneral(factionId);
    let text: string;
    if (general) {
      text = `${general.generalName}率领${getFactionNameForSpeech(factionId)}军，攻打${cityName}`;
    } else {
      text = `${getFactionNameForSpeech(factionId)}将军，攻打${cityName}`;
    }
    console.log("[Speech] 攻打:", text);
    this.speak(text);
  }

  /** 攻占城池 */
  public announceCityCapture(factionId: string, legionName: string, cityName: string, generalId?: string, defenderHadNamedForce?: boolean): void {
    if (!this.enabled) return;
    // defenderHadNamedForce：守方这一仗有没有出将/出精（由攻城结算传入）。
    // 无（无名据点，守军无将无精）→ 只报「势力攻占据点」（例：秦国攻占邯郸），不吹攻方精锐+技能。
    const skill = getTacticalSkillName(factionId, generalId);
    const elite = hasEliteName(legionName) ? legionName : null;
    let text: string;
    if (!defenderHadNamedForce) {
      text = `${getFactionNameForSpeech(factionId)}攻占${cityName}`;
    } else if (elite && skill) {
      text = `${elite}，${skill}，攻占${cityName}`;
    } else {
      text = `${getFactionNameForSpeech(factionId)}军，一举攻占${cityName}`;
    }
    console.log("[Speech] 攻占:", text);
    this.speak(text);
  }

  /** 野战开始：进攻方势力+武将，大战，防守方势力+武将 */
  public announceFieldBattle(
    attackerFactionId: string,
    defenderFactionId: string,
    attackerGeneralId?: string,
    defenderGeneralId?: string,
  ): void {
    if (!this.enabled) return;
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

  // ---- S 级大事播报（复国 / 文化中心易主）：全程播报，不限跟拍镜头 ----

  /** S 级 · 复国：异文化占领地起义 */
  public announceRestoration(factionId: string, cityName: string): void {
    if (!this.enabled) return;
    const name = getFactionNameForSpeech(factionId);
    const text = `${name}遗民起事，于${cityName}复国`;
    console.log("[Speech] 复国:", text);
    this.speak(text, { sTier: true, rate: 0.92, banner: `${name}复国 · 于${cityName}` });
  }

  /** S 级 · 文化中心易主（14 区中心城被攻占） */
  public announceRegionCenterCapture(attackerFactionId: string, cityName: string, regionLabel: string): void {
    if (!this.enabled) return;
    const att = getFactionNameForSpeech(attackerFactionId);
    const text = regionLabel
      ? `${att}军攻占${regionLabel}中心，${cityName}`
      : `${att}军攻占重镇${cityName}`;
    const banner = regionLabel
      ? `${regionLabel}易主 · ${cityName}归${att}`
      : `${cityName}易主 · 归${att}`;
    console.log("[Speech] 文化中心易主:", text);
    this.speak(text, { sTier: true, rate: 0.92, banner });
  }

  private speak(text: string, opts?: SpeakOptions): void {
    const now = Date.now();
    // S 级播报期间，常规播报直接丢弃（不 cancel，不排队——慢直播宁缺毋滥）
    if (!opts?.sTier && now < this.sTierBusyUntilMs) return;

    // 字幕条不依赖语音引擎是否可用（无声环境下画面仍完整）
    if (opts?.banner) SubtitleBanner.show(opts.banner);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
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
      };
      utterance.onend = settle;
      utterance.onerror = settle;

      synth.speak(utterance);
    }, 50);
  }
}

/** 全局单例 */
export const speechAnnouncer = new SpeechAnnouncer();
