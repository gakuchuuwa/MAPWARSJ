/**
 * 🔴 [2026-10-22 马系统] 马厩面板：玩家面板上点「🐎 坐骑」打开。
 * 列出自己的马（马龄、公母、状态、来历、通灵/坐骑标记，可换坐骑）、通灵马谱系、马经图鉴。
 * 马龄：通灵马一脉是看着长大的，一直知道；外来的马（买来、缴来）学会马经「看牙口」（URT-07）之前只显示「？岁」。
 * 不暂停游戏；内容只在马的状态真变了时重建（避免每秒整块重建把按钮点空）。
 */
import type { PlayerHero } from './PlayerHero';
import { HorseStable, indexToYear, type Horse, type HorseStatus } from './HorseStable';
import { HORSE_MEMORIES, memoryLabel } from '../story/horseMemories';
import { HORSE_LORE, LORE_TEETH } from '../story/horseLore';

const PANEL_ID = 'player-horse-stable-panel';
const FONT = "'Noto Serif SC', 'SimSun', 'Songti SC', serif";

const STATUS_COLOR: Record<HorseStatus, string> = {
    ok: '#7cd4a0',
    tired: '#f0b849',
    injured: '#f27a6a',
    foal: '#9fc3e8',
};

/** 马龄文字：通灵马一脉一直知道；外来的马要会看牙口才知道 */
function ageText(hero: PlayerHero, h: Horse): string {
    const known = h.generation > 0 || hero.storyFlags.includes(LORE_TEETH);
    return known ? `${hero.horses.ageOf(h)}` : '？';
}

/** 面板上一行用的简述（也给玩家面板的小牌子用） */
export function horseBrief(hero: PlayerHero, h: Horse): string {
    return `${h.name} ${ageText(hero, h)}岁 ${HorseStable.statusLabel(hero.horses.statusOf(h))}`;
}

export function horseStatusColor(s: HorseStatus): string {
    return STATUS_COLOR[s];
}

export function toggleHorseStablePanel(hero: PlayerHero): void {
    const old = document.getElementById(PANEL_ID);
    if (old) { old.remove(); return; }
    openPanel(hero);
}

function openPanel(hero: PlayerHero): void {
    const stable = hero.horses;
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = `
        position:fixed; top:48px; left:50%; transform:translateX(-50%); z-index:10050; width:min(440px, calc(100vw - 32px));
        max-height:calc(100vh - 120px); overflow:auto; box-sizing:border-box; padding:12px 14px;
        font-family:${FONT}; color:#f5e6c8; background:rgba(20,16,12,0.95);
        border:1px solid rgba(212,175,55,0.6); border-radius:10px;
        box-shadow:0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,235,170,0.15);`;
    document.body.appendChild(panel);

    let lastKey = '';
    const render = () => {
        const key = stateKey(hero);
        if (key === lastKey) return;
        lastKey = key;
        panel.innerHTML = '';

        const head = document.createElement('div');
        head.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;';
        head.innerHTML = `<span style="font-size:16px;font-weight:900;color:#ffd700;">🐎 马厩</span>`;
        const close = document.createElement('button');
        close.type = 'button';
        close.textContent = '✕';
        close.style.cssText = 'cursor:pointer; background:none; border:none; color:#dfc28c; font-size:15px;';
        close.addEventListener('click', () => panel.remove());
        head.appendChild(close);
        panel.appendChild(head);

        if (stable.isEmpty()) {
            const empty = document.createElement('div');
            empty.style.cssText = 'font-size:13px; color:#ba9e7b;';
            empty.textContent = '还没有马。';
            panel.appendChild(empty);
        }

        for (const h of stable.list()) panel.appendChild(horseRow(hero, h, render));

        const ped = stable.getPedigree();
        const spirit = stable.getSpirit();
        if (spirit || ped.length > 0) {
            const t = document.createElement('div');
            t.style.cssText = 'margin-top:10px; font-size:13px; font-weight:900; color:#e8c77e;';
            t.textContent = '通灵马谱系';
            panel.appendChild(t);
            const lines: string[] = ped.map((p) =>
                `第 ${p.generation} 代　${p.name}　${yearText(p.bornYear)}—${yearText(p.diedYear)}`);
            for (const h of stable.list()) {
                if (h.generation > 0) lines.push(`第 ${h.generation} 代　${h.name}　${yearText(indexToYear(h.born))} 生${stable.isSpirit(h) ? '（现通灵马）' : ''}`);
            }
            const list = document.createElement('div');
            list.style.cssText = 'font-size:12px; line-height:1.8; color:#dfc28c;';
            list.innerHTML = lines.map((l) => `<div>${l}</div>`).join('');
            panel.appendChild(list);
        }

        panel.appendChild(loreSection(hero));
    };
    render();
    const timer = window.setInterval(() => {
        if (!panel.isConnected) { window.clearInterval(timer); return; }
        render();
    }, 1000);
}

function horseRow(hero: PlayerHero, h: Horse, rerender: () => void): HTMLElement {
    const stable = hero.horses;
    const status = stable.statusOf(h);
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:6px 0; border-top:1px solid rgba(212,175,55,0.18);';
    const tags = [
        stable.isSpirit(h) ? '<span style="color:#ffd700;">✦通灵</span>' : '',
        stable.isMount(h) ? '<span style="color:#7cd4a0;">坐骑</span>' : '',
    ].filter(Boolean).join(' ');
    const info = document.createElement('div');
    info.style.cssText = 'flex:1 1 auto; min-width:0;';
    info.innerHTML = `
        <div style="font-size:14px;font-weight:700;">${h.name}
            <span style="font-size:12px;color:#dfc28c;font-weight:400;">${HorseStable.sexLabel(h)} · ${ageText(hero, h)} 岁</span>
            <span style="font-size:12px;color:${STATUS_COLOR[status]};">${HorseStable.statusLabel(status)}</span> ${tags}</div>
        <div style="font-size:11.5px;color:#ba9e7b;">${h.origin}${h.generation > 0 ? ` · 第 ${h.generation} 代` : ''}</div>
        ${memoryLine(h)}`;
    row.appendChild(info);
    const mem = h.memoryId ? HORSE_MEMORIES[h.memoryId] : undefined;
    if (mem && h.memoryBest !== 'full' && hero.onReadHorseMemory) {
        const read = document.createElement('button');
        read.type = 'button';
        read.textContent = '通灵';
        read.title = `摸着${h.name}，看它记得的${memoryLabel(mem)}`;
        read.style.cssText = 'flex:0 0 auto; cursor:pointer; padding:3px 10px; font-family:inherit; font-size:12px; color:#fffcee; background:rgba(70,48,110,0.85); border:1px solid rgba(212,175,55,0.55); border-radius:5px;';
        read.addEventListener('click', () => {
            document.getElementById(PANEL_ID)?.remove();
            hero.onReadHorseMemory?.(h.id);
        });
        row.appendChild(read);
    }
    if (!stable.isMount(h) && status !== 'foal') {
        const ride = document.createElement('button');
        ride.type = 'button';
        ride.textContent = '骑这匹';
        ride.style.cssText = 'flex:0 0 auto; cursor:pointer; padding:3px 10px; font-family:inherit; font-size:12px; color:#dfc28c; background:rgba(35,28,20,0.85); border:1px solid rgba(212,175,55,0.45); border-radius:5px;';
        ride.addEventListener('click', () => { stable.setMount(h.id); rerender(); });
        row.appendChild(ride);
    }
    return row;
}

/** 马记得的那一仗，和通灵过的结果 */
function memoryLine(h: Horse): string {
    const mem = h.memoryId ? HORSE_MEMORIES[h.memoryId] : undefined;
    if (!mem) return '';
    const result = h.memoryBest === 'full' ? '完全同步' : h.memoryBest === 'sync' ? '同步' : '还没通灵';
    return `<div style="font-size:11.5px;color:#c9a8ff;">👁 记得：${memoryLabel(mem)} · ${result}</div>`;
}

/** 马经图鉴：学到的显示全文，没学到的只显示「？？？」和在哪儿学 */
function loreSection(hero: PlayerHero): HTMLElement {
    const learned = HORSE_LORE.filter((l) => hero.storyFlags.includes(l.flag));
    const box = document.createElement('div');
    const rows = HORSE_LORE.map((l) => hero.storyFlags.includes(l.flag)
        ? `<div style="padding:3px 0;"><span style="color:#ffd700;">【${l.kind}】${l.title}</span>　<span style="color:#dfc28c;">${l.text}</span></div>`
        : `<div style="padding:3px 0;color:#7d6a52;">【${l.kind}】？？？<span style="font-size:11px;">（${l.hint}）</span></div>`);
    box.innerHTML = `
        <div style="margin-top:10px; font-size:13px; font-weight:900; color:#e8c77e;">📖 马经　${learned.length} / ${HORSE_LORE.length}</div>
        <div style="font-size:12px; line-height:1.6;">${rows.join('')}</div>`;
    return box;
}

function stateKey(hero: PlayerHero): string {
    const stable = hero.horses;
    return [
        hero.storyFlags.length,
        stable.getPedigree().length,
        ...stable.list().map((h) => `${h.id}:${stable.ageOf(h)}:${stable.statusOf(h)}:${stable.isMount(h)}:${stable.isSpirit(h)}:${h.memoryBest ?? ''}`),
    ].join('|');
}

function yearText(y: number): string {
    return y < 0 ? `前 ${-y}` : `公元 ${y}`;
}
