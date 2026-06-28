/**
 * SpeechAnnouncer.ts - 跟随军团语音播报
 */

import { getFactionGeneral, getGeneralRecordByGeneralId } from "../data/FactionGenerals";
import {
  GENERAL_PROFILES,
  TACTICAL_SKILL_CATALOG,
  type GeneralProfile,
} from "../data/GeneralSkills";

function getTacticalSkillName(factionId: string, generalId?: string): string {
  const general = generalId ? getGeneralRecordByGeneralId(generalId) : getFactionGeneral(factionId);
  if (!general) return "";
  const profile: GeneralProfile | undefined = GENERAL_PROFILES[general.generalId];
  if (!profile) return "";
  const skill = TACTICAL_SKILL_CATALOG[profile.tacticalSkillId];
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
  public announceCityCapture(factionId: string, legionName: string, cityName: string, generalId?: string): void {
    if (!this.enabled) return;
    const skill = getTacticalSkillName(factionId, generalId);
    const elite = hasEliteName(legionName) ? legionName : null;
    let text: string;
    if (elite && skill) {
      text = `${elite}，${skill}，攻占${cityName}`;
    } else {
      text = `${getFactionNameForSpeech(factionId)}军，一举攻占${cityName}`;
    }
    console.log("[Speech] 攻占:", text);
    this.speak(text);
  }

  /** 全军覆没 */
  public announceAnnihilation(factionId: string, _legionName: string, cityName: string, _generalId?: string): void {
    if (!this.enabled) return;
    const text = `${getFactionNameForSpeech(factionId)}军于${cityName}，全军覆没`;
    console.log("[Speech] 覆没:", text);
    this.speak(text);
  }

  private speak(text: string): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;

    synth.cancel();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";

      const voice = this.pickBestVoice(synth.getVoices());
      if (voice) {
        utterance.voice = voice;
        console.log("[Speech] 使用:", voice.name);
      }

      synth.speak(utterance);
    }, 50);
  }
}

/** 全局单例 */
export const speechAnnouncer = new SpeechAnnouncer();
