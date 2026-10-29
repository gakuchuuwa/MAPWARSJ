/**
 * YouTube 单平台直播互动面板。
 * 战术模式嵌入顶部控制栏，战略模式仅在直播已连接或按 F9 测试时贴底显示。
 * 积分来自频道增长目标；真钱（Super Chat）先放一边，面板不显示。
 */
import { type ViewerLive, ORDERS_PER_CAST } from './ViewerLive';
import type { YouTubeOfficialBridge } from './YouTubeOfficialBridge';
import { HowToPlayCard } from './HowToPlayCard';

const PANEL_ID = 'viewer-live-panel';
const FONT = "'Noto Serif SC', 'SimSun', serif";
const WORDS = ['攻', '胜', '敌', '混', '并', '败'] as const;
const FS = { title: 15, main: 14, sub: 13, small: 12 } as const;
const FS_S13 = { title: 13.5, main: 13, sub: 12, small: 12 } as const;
const DESIGN_WIDTH = 1920;

export class ViewerLivePanel {
    private root: HTMLDivElement;
    private contentRow: HTMLDivElement;
    private body: HTMLDivElement;
    private toggleBtn: HTMLButtonElement;
    private dev: HTMLDivElement;
    private devOpen = false;
    private collapsed = false;
    private inScene13Bar = false;
    private lastBodyHtml = '';

    constructor(private readonly live: ViewerLive, private readonly link: YouTubeOfficialBridge) {
        const howTo = new HowToPlayCard();
        this.live.onNewcomer = () => howTo.show();
        this.root = document.createElement('div');
        this.root.id = PANEL_ID;
        this.contentRow = document.createElement('div');
        this.contentRow.style.cssText = 'display:flex; align-items:center; justify-content:center; gap:8px;';
        this.body = document.createElement('div');
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.type = 'button';
        this.toggleBtn.style.cssText = `
            flex-shrink:0; padding:2px 8px;
            background:linear-gradient(180deg, rgba(38,30,22,0.95) 0%, rgba(22,17,12,0.98) 100%);
            border:1px solid rgba(212,175,55,0.5); border-radius:4px;
            color:#dfc28c; font-family:${FONT}; font-size:12px; font-weight:700;
            cursor:pointer; white-space:nowrap; user-select:none;`;
        this.toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.collapsed = !this.collapsed;
            this.syncCollapsedState();
            this.render();
        });
        this.contentRow.append(this.body, this.toggleBtn);
        this.dev = document.createElement('div');
        this.buildDev();
        this.applyStrategicBottomStyle();
        this.root.append(this.dev, this.contentRow);
        document.body.appendChild(this.root);
        this.syncCollapsedState();
        window.addEventListener('keydown', (e) => {
            if (e.key !== 'F9') return;
            e.preventDefault();
            this.devOpen = !this.devOpen;
            if (this.devOpen) this.collapsed = false;
            this.syncCollapsedState();
            this.render();
        }, true); // 捕获阶段：光标在输入框里时输入框会 stopPropagation，F9 漏给 Edge 变成阅读模式
        window.addEventListener('resize', () => this.updatePosition());
        window.setInterval(() => this.render(), 300);
        this.render();
    }

    private syncCollapsedState(): void {
        this.body.style.display = this.collapsed ? 'none' : 'block';
        this.dev.style.display = !this.collapsed && this.devOpen ? 'block' : 'none';
        if (this.collapsed) {
            this.toggleBtn.innerHTML = `📢 <span style="color:#ffd700;">弹幕控将</span> ${this.inScene13Bar ? '▼ 展开' : '▲ 展开'}`;
            this.toggleBtn.title = '展开弹幕控制面板';
        } else {
            this.toggleBtn.innerHTML = this.inScene13Bar ? '▲ 收起' : '▼ 收起';
            this.toggleBtn.title = '收起弹幕控制面板';
        }
    }

    private applyStrategicBottomStyle(): void {
        this.root.style.cssText = `
            position:fixed; left:50%; bottom:6px; top:auto; transform:translateX(-50%); transform-origin:bottom center;
            z-index:10054; width:max-content; max-width:94vw; display:block;
            background:linear-gradient(180deg, rgba(28,22,16,0.94) 0%, rgba(12,10,8,0.96) 100%);
            border:1px solid rgba(212,175,55,0.65); border-radius:8px;
            padding:4px 14px; color:#f5e6c8; font-family:${FONT}; font-size:${FS.sub}px; line-height:1.35;
            box-shadow:0 4px 16px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,225,130,0.22);
            pointer-events:auto; user-select:none;`;
        this.dev.style.cssText = `display:${!this.collapsed && this.devOpen ? 'block' : 'none'}; width:380px; margin:0 auto 8px; padding-bottom:8px; border-bottom:1px dashed rgba(212,175,55,0.4); font-size:13px; line-height:1.5; text-align:left;`;
    }

    private applyScene13MergedStyle(): void {
        this.root.style.cssText = `
            position:relative; display:flex; align-items:center; justify-content:center;
            flex-basis:100%; width:100%;
            padding-top:3px; margin-top:2px;
            border-top:1px solid rgba(212,175,55,0.3);
            color:#f5e6c8; font-family:${FONT}; font-size:${FS_S13.sub}px; line-height:1.2;
            pointer-events:auto; user-select:none;`;
        this.dev.style.cssText = `display:${!this.collapsed && this.devOpen ? 'block' : 'none'}; position:absolute; top:calc(100% + 8px); right:0; width:380px; padding:10px 12px; background:rgba(18,14,10,0.96); border:1px solid rgba(212,175,55,0.6); border-radius:8px; box-shadow:0 6px 20px rgba(0,0,0,0.7); font-size:13px; line-height:1.5; text-align:left; z-index:10060; white-space:normal;`;
    }

    private updatePosition(): void {
        const s13Bar = document.getElementById('player-scene13-bar');
        const s13Active = !!(s13Bar && s13Bar.style.display !== 'none');
        if (s13Active && s13Bar) {
            if (!this.inScene13Bar || this.root.parentElement !== s13Bar) {
                this.inScene13Bar = true;
                this.root.append(this.contentRow, this.dev);
                this.applyScene13MergedStyle();
                this.syncCollapsedState();
                s13Bar.appendChild(this.root);
            }
            return;
        }
        if (this.inScene13Bar || this.root.parentElement !== document.body) {
            this.inScene13Bar = false;
            this.root.append(this.dev, this.contentRow);
            this.applyStrategicBottomStyle();
            this.syncCollapsedState();
            document.body.appendChild(this.root);
        }
        let bottomPx = 6;
        const combatCenter = document.querySelector<HTMLElement>('.combat-center');
        if (combatCenter && combatCenter.style.display !== 'none' && combatCenter.offsetHeight > 0) {
            const top = combatCenter.getBoundingClientRect().top;
            if (top > 0 && top < window.innerHeight) bottomPx = Math.max(6, Math.round(window.innerHeight - top + 6));
        }
        const scale = Math.round(Math.max(1, window.innerWidth / DESIGN_WIDTH) * 100) / 100;
        this.root.style.bottom = `${bottomPx}px`;
        this.root.style.transform = `translateX(-50%) scale(${scale})`;
    }

    private render(): void {
        const s = this.live.snapshot();
        this.updatePosition();
        this.root.style.display = this.inScene13Bar ? 'flex' : 'block';
        this.syncCollapsedState();
        if (this.collapsed) return;
        const f = this.inScene13Bar ? FS_S13 : FS;
        const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
        const b = (t: string) => `<b style="color:#ffd700;">${t}</b>`;
        const sep = `<span style="color:rgba(212,175,55,0.45);margin:0 2px;">｜</span>`;
        const chat = s.lastChatAgo < 0 ? '还没收到弹幕' : `最近弹幕 ${s.lastChatAgo} 秒前`;
        const platform = this.devOpen
            ? `<div style="font-size:13px;color:#8fd3ff;margin-bottom:4px;text-align:center;">${esc(s.platform || '本地 YouTube 服务未连接')}　${chat}${s.yt ? '<br>' + esc(s.yt) : ''}</div>`
            : '';
        const titleBadge = `<span style="font-size:${f.title}px;color:#ffd700;font-weight:900;letter-spacing:1px;text-shadow:0 1px 2px rgba(0,0,0,0.9);">📢 弹幕控将</span>`;
        const nextRename = s.renameHighestBid + 1;
        const renameCmd = `<span style="font-size:${f.sub}px;">${b(`名 名字 ${nextRename}`)} 改名(${nextRename}分起)</span>`;

        const subItems: string[] = [];
        const g = s.goal;
        if (s.yt || g.likes > 0 || g.subs > 0) {
            const pct = Math.min(100, Math.round(g.likeProg / g.likeStep * 100));
            subItems.push(
                `<span style="display:inline-flex;align-items:center;gap:4px;">点赞 ${b(`${g.likeProg}/${g.likeStep}`)} 发分${g.subs > 0 ? ` · 订阅 ${b(String(g.subs))}` : ''} · 在线 ${b(String(g.viewers))} · 在场 ${b(String(g.present))}`
                + `<span style="display:inline-block;width:44px;height:5px;background:#3a2a16;border-radius:3px;overflow:hidden;vertical-align:middle;"><span style="display:block;height:5px;width:${pct}%;background:#d4af37;"></span></span></span>`
            );
        }
        if (s.top.length) {
            subItems.push(`<span>积分：${s.top.slice(0, 3).map((t) =>
                `<span style="white-space:nowrap;${t.n >= ORDERS_PER_CAST ? 'color:#ffd700;' : ''}">${esc(t.name)} <b>${t.n}</b></span>`).join('　')}</span>`);
        }
        if (s.on && s.queueBrief.length) {
            const q = s.queueBrief;
            subItems.push(`<span><span style="color:#ffd700;">排队：</span>${q.slice(0, 3).map((x) =>
                `${esc(x.name)}${x.label ? `·${esc(x.label)}` : ''}`).join('　')}${q.length > 3 ? ` 等 ${q.length} 人` : ''}</span>`);
        }
        if (s.log.length) subItems.push(`<span style="color:#cdbb95;">${esc(s.log[s.log.length - 1])}</span>`);

        // 🔴 [2026-10-29 主人令「把这些信息放到玩家信息面板，设计一行就行」]
        // 直播信息（点赞发分、在线、在场、积分）整合成单行，不再独立悬挂第二行
        const liveInfoPart = subItems.length
            ? `${sep}<span style="display:inline-flex;align-items:center;gap:6px;font-size:${f.small}px;">${subItems.join(sep)}</span>`
            : '';

        // 主角现在的官职，紧跟标题：观众一眼知道「现在能做什么」
        const civilian = s.hero.rankId === 'civilian';
        const rankBadge = `<span style="font-size:${f.main}px;">官职 ${b(esc(s.hero.rankTitle))}</span>`;
        const hint = (t: string) => `<span style="font-size:${f.sub}px;color:#dfc28c;">${t}</span>`;
        let mainRow: string;
        let joinGrid = '';
        if (s.on && !civilian) {
            const castCmd = `<span style="font-size:${f.main}px;">${b('攻胜敌混并败')} 玩家六计<span style="font-size:${f.sub}px;color:#e0cfa9;">(${b(`${ORDERS_PER_CAST}分`)}先后)</span></span>`;
            const scoutCmd = `<span style="font-size:${f.main}px;">${b('技1')} 爆发技<span style="font-size:${f.sub}px;color:#e0cfa9;">(高分插队)</span></span>`;
            mainRow = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;">${titleBadge}${sep}${rankBadge}${sep}${castCmd}${sep}${scoutCmd}${sep}${renameCmd}${liveInfoPart}</div>`;
        } else {
            let statePart: string;
            if (s.joinCandidates.length > 0) {
                const total = s.joinCandidates.length;
                const pageSize = 8;
                const pageCount = Math.max(1, Math.ceil(total / pageSize));
                const pageIdx = Math.floor(Date.now() / 4000) % pageCount;
                const pageItems = s.joinCandidates.slice(pageIdx * pageSize, (pageIdx + 1) * pageSize);
                const pageBadge = pageCount > 1
                    ? ` · <span style="color:#ffd700;font-weight:700;">[第 ${pageIdx + 1}/${pageCount} 页·滚动轮播]</span>`
                    : '';
                const bidFloor = (s.activeJoinBid?.bid ?? 0) + 1;
                const activeBadge = s.activeJoinBid
                    ? ` · <span style="color:#7cd4a0;font-weight:700;">当前 ${esc(s.activeJoinBid.viewer)} ${s.activeJoinBid.bid}分➔${esc(s.activeJoinBid.label)}</span>`
                    : '';
                const holdBadge = s.hero.holdSec > 0
                    ? `<span style="color:#ffd700;font-weight:800;margin-right:4px;">⏱ ${s.hero.holdSec}秒后出发</span>· `
                    : '';
                statePart = `<span style="font-size:${f.main}px;">${holdBadge}选去处·${b(esc(s.joinScope))}<span style="color:#dfc28c;font-size:${f.sub}px;">(共${total}位${pageBadge}，发 ${b('投编号')} 或 ${b('投名字')} 竞选，${bidFloor}分起；不选AI自动前往)</span>${activeBadge}</span>`;
                const cells = pageItems.map((c) => {
                    const isPicked = s.activeJoinBid?.index === c.index;
                    const boxBg = isPicked
                        ? 'linear-gradient(180deg, rgba(36,68,48,0.96) 0%, rgba(18,38,26,0.98) 100%)'
                        : 'linear-gradient(180deg, rgba(46,36,24,0.94) 0%, rgba(24,19,13,0.98) 100%)';
                    const boxBorder = isPicked ? '1px solid #7cd4a0' : '1px solid rgba(212,175,55,0.48)';
                    const boxShadow = isPicked
                        ? '0 0 8px rgba(124,212,160,0.38), inset 0 1px 0 rgba(190,255,215,0.25)'
                        : '0 1px 3px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,228,150,0.16)';
                    const tagBg = isPicked ? 'rgba(124,212,160,0.22)' : 'rgba(212,175,55,0.18)';
                    const tagBorder = isPicked ? '1px solid rgba(124,212,160,0.45)' : '1px solid rgba(212,175,55,0.35)';
                    const tagColor = isPicked ? '#9ef5c2' : '#ffd700';
                    const nameColor = isPicked ? '#d6ffea' : '#f7ebd2';
                    return `<span title="发 投${c.index} 或 投 ${esc(c.label)}" style="width:138px;height:25px;box-sizing:border-box;display:inline-flex;align-items:center;background:${boxBg};border:${boxBorder};border-radius:4px;box-shadow:${boxShadow};overflow:hidden;flex-shrink:0;">`
                        + `<span style="width:38px;height:100%;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;background:${tagBg};border-right:${tagBorder};color:${tagColor};font-size:12px;font-weight:800;letter-spacing:0.3px;">投${c.index}</span>`
                        + `<span style="flex:1;min-width:0;padding:0 6px;text-align:center;color:${nameColor};font-size:12.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,0.85);">${esc(c.label)}</span>`
                        + `</span>`;
                }).join('');
                joinGrid = `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:5px 6px;max-width:88vw;margin:0 auto 5px;padding:5px 8px;background:linear-gradient(180deg, rgba(16,12,8,0.72) 0%, rgba(10,8,5,0.84) 100%);border:1px solid rgba(212,175,55,0.32);border-radius:6px;box-shadow:inset 0 1px 4px rgba(0,0,0,0.65);">${cells}</div>`;
            } else if (civilian && s.hero.peakRankId === 'civilian') {
                // 平民没有资历：只能改名，投奔武将后升斥候才开放技能
                statePart = hint(`单骑寻访武将 · 入伍升斥候后可在战中释放技能`);
            } else if (civilian) {
                statePart = hint(`正前往投奔目标 · 入伍后从斥候做起`);
            } else if (s.hero.attached) {
                statePart = hint('随军出征中 · 开战后可释放技能');
            } else {
                statePart = hint('单骑赶路中 · 开战后可释放技能');
            }
            mainRow = `<div style="display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;">${titleBadge}${sep}${rankBadge}${sep}${statePart}${sep}${renameCmd}${liveInfoPart}</div>`;
        }

        const nextHtml = platform + joinGrid + mainRow;
        if (this.lastBodyHtml !== nextHtml) {
            this.lastBodyHtml = nextHtml;
            this.body.innerHTML = nextHtml;
        }
    }

    private buildDev(): void {
        const label = document.createElement('div');
        label.textContent = '本地模拟测试（按 F9 收起；不能代替真实 YouTube 直播验收）';
        label.style.cssText = 'color:#8fd3ff;font-weight:700;margin-bottom:4px;';
        const name = document.createElement('input');
        name.value = '测试观众1';
        name.style.cssText = 'width:100%;box-sizing:border-box;margin-bottom:6px;background:#221a12;color:#f3e6c8;border:1px solid #6b5a3a;padding:3px 6px;';
        const cmdInput = document.createElement('input');
        cmdInput.placeholder = '输入弹幕口令回车发送（如：名 龙骧 4 / 投1 3 / 技4 / 攻）';
        cmdInput.style.cssText = name.style.cssText;
        cmdInput.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key !== 'Enter' || !cmdInput.value.trim()) return;
            this.live.onChat(name.value, cmdInput.value.trim());
            cmdInput.value = '';
            this.render();
        });
        const row = (items: string[], onClick: (w: string) => void) => {
            const r = document.createElement('div');
            r.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px;';
            for (const w of items) {
                const btn = document.createElement('button');
                btn.textContent = w;
                btn.style.cssText = 'flex:1;min-width:34px;padding:3px 4px;background:#3a2a16;color:#ffd700;border:1px solid #8a6a2a;border-radius:4px;cursor:pointer;';
                btn.addEventListener('click', () => onClick(w));
                r.appendChild(btn);
            }
            return r;
        };
        const send = (w: string) => { this.live.onChat(name.value, w, false); this.render(); };
        const ytLabel = document.createElement('div');
        ytLabel.textContent = 'YouTube API 密钥、本场直播网址，回车生效；换网址时密钥留空即沿用';
        ytLabel.style.cssText = 'color:#8fd3ff;margin-bottom:2px;';
        const ytKey = document.createElement('input');
        ytKey.type = 'password';
        ytKey.placeholder = 'API 密钥（只保存到本机服务）';
        ytKey.style.cssText = name.style.cssText;
        const ytVideo = document.createElement('input');
        ytVideo.value = this.link.getVideo();
        ytVideo.placeholder = '直播网址或 11 位视频 ID';
        ytVideo.style.cssText = name.style.cssText;
        const applyYt = (e: KeyboardEvent) => {
            e.stopPropagation();
            if (e.key !== 'Enter') return;
            void this.link.configure(ytKey.value, ytVideo.value).then((ok) => {
                if (ok) {
                    ytKey.value = '';
                    if (document.activeElement !== ytVideo) ytVideo.value = this.link.getVideo();
                }
                this.render();
            });
        };
        ytKey.addEventListener('keydown', applyYt);
        ytVideo.addEventListener('keydown', applyYt);
        this.dev.append(
            ytLabel, ytKey, ytVideo, label, name, cmdInput,
            row([...WORDS], send),
            row(['技3', '技4', '技5'], send),
            row(['名 龙骧 3', '名 虎贲 5', '投1 2', '投2 4'], send),
            row(['点赞+10', '订阅+1', '在线+5'], (w) => {
                const g = this.live.snapshot().goal;
                if (w === '点赞+10') {
                    this.live.onLikeTotal(g.likes);
                    this.live.onLikeTotal(g.likes + 10);
                } else if (w === '订阅+1') {
                    this.live.onSubTotal(g.subs);
                    this.live.onSubTotal(g.subs + 1);
                } else {
                    this.live.onViewers(g.viewers);
                    this.live.onViewers(g.viewers + 5);
                }
                this.render();
            }),
        );
    }
}
