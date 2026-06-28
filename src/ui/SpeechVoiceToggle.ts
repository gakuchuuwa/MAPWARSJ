/**
 * SpeechVoiceToggle.ts - 语音声线切换按钮
 * 
 * 在左下角 HUD 增加一个按钮，点击可在"云希(年轻朝气)"和"云健(浑厚沉稳)"之间切换。
 */

import { speechAnnouncer } from '../audio/SpeechAnnouncer';

const BTN_ID = 'speech-voice-toggle-btn';

export class SpeechVoiceToggle {
    private static button: HTMLButtonElement | null = null;

    public static init(): void {
        console.log('[SpeechVoiceToggle] init called');
        this.createButton();
    }

    private static createButton(): void {
        if (document.getElementById(BTN_ID)) return;

        // 优先找 .hud-controls，找不到就找 .hud-stack，再找不到就找 #game-time-hud
        let container = document.querySelector('#game-time-hud .hud-controls')
            || document.querySelector('#game-time-hud .hud-stack')
            || document.getElementById('game-time-hud');

        if (!container) {
            console.warn('[SpeechVoiceToggle] 找不到挂载容器');
            return;
        }

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.className = 'game-time-btn';
        btn.title = '切换语音男声（云希/云健）';
        btn.style.cssText = 'min-width: 70px; font-size: 13px;';
        btn.textContent = '🔊 ' + speechAnnouncer.getPreferredVoice();
        
        btn.addEventListener('click', () => {
            speechAnnouncer.toggleVoicePreference();
            btn.textContent = '🔊 ' + speechAnnouncer.getPreferredVoice();
        });
        
        container.appendChild(btn);
        this.button = btn;
        console.log('[SpeechVoiceToggle] 按钮已创建，父容器:', container.className || container.id);
    }
}
