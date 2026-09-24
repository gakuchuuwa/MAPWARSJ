import './style.css';
import {
    DE_CIVILIZATIONS,
    DE_CORE_UNITS,
    DE_ARMOR_CLASSES,
    DE_TECHS,
    DE_CAMPAIGNS,
    DE_DLC_CHRONOLOGY,
    calculateDeDamage,
    type DeCiv,
    type DeUnit
} from './deData';

class DeWikiApp {
    private currentTab: 'overview' | 'civs' | 'units' | 'mechanics' | 'techtree' | 'campaigns' | 'dlcs' = 'overview';
    private civFilterRegion: string = 'all';
    private civSearchQuery: string = '';
    private unitFilterCategory: string = 'all';
    private unitSearchQuery: string = '';

    // 战斗模拟器状态
    private calcAttackerId: string = 'spearman_line';
    private calcDefenderId: string = 'knight_line';
    private calcUpgrades = {
        forge: false,
        ironCasting: false,
        blastFurnace: false,
        fletching: false,
        bodkin: false,
        bracer: false,
        scaleBarding: false,
        chainBarding: false,
        plateBarding: false,
        paddedArcher: false,
        leatherArcher: false,
        ringArcher: false,
    };

    constructor() {
        this.initDOM();
        this.bindEvents();
        this.renderAll();
    }

    private initDOM(): void {
        const root = document.getElementById('app');
        if (!root) return;

        root.innerHTML = `
            <header class="de-navbar">
                <div class="de-brand">
                    <div class="de-logo-shield">II</div>
                    <div class="de-title-wrap">
                        <h1>AGE OF EMPIRES II: DEFINITIVE EDITION</h1>
                        <span>官方全景百科全书 · 48文明全集 · 全兵系科技 · 攻防护甲真理库</span>
                    </div>
                </div>
                <nav class="de-nav-tabs">
                    <button class="de-tab-btn active" data-tab="overview">🏛️ 概述</button>
                    <button class="de-tab-btn" data-tab="civs">👑 文明全集 (48)</button>
                    <button class="de-tab-btn" data-tab="units">⚔️ 单位图鉴</button>
                    <button class="de-tab-btn" data-tab="mechanics">🛡️ 攻防与模拟器</button>
                    <button class="de-tab-btn" data-tab="techtree">🔬 科技树全览</button>
                    <button class="de-tab-btn" data-tab="campaigns">🏆 史诗战役集</button>
                    <button class="de-tab-btn" data-tab="dlcs">📜 DLC版本史</button>
                </nav>
            </header>

            <main class="de-container">
                <!-- 1. 概述与核心特性 -->
                <section id="sec-overview" class="de-section-view active">
                    <div class="de-hero-banner">
                        <h2>🏛️ 帝国时代II：决定版 全景百科全书</h2>
                        <p>
                            《帝国时代II：决定版》（Age of Empires II: Definitive Edition）是即时战略（RTS）殿堂级丰碑。
                            本程序为完全符合 DE 官方体系的独立百科应用，完整收纳了游戏内<strong>全部 48 个文明</strong>（含 2026年9月最新《维京传奇》DLC）的详实数据、
                            全兵种面板参数、隐藏护甲克制链、四时代科技树、经典历史战役录与历代 DLC 演化史。
                        </p>
                        <div class="de-stats-badge-row">
                            <div class="de-stat-pill"><span class="num">48</span><span class="label">官方文明全集</span></div>
                            <div class="de-stat-pill"><span class="num">4</span><span class="label">时代演进阶梯</span></div>
                            <div class="de-stat-pill"><span class="num">35+</span><span class="label">隐藏护甲类</span></div>
                            <div class="de-stat-pill"><span class="num">40+</span><span class="label">全配音史诗战役</span></div>
                            <div class="de-stat-pill"><span class="num">8 大</span><span class="label">DLC 扩展包</span></div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px; margin-top: 24px;">
                        <div style="background: var(--de-bg-card); border: 1px solid var(--de-border-gold); border-radius: 6px; padding: 20px;">
                            <h3 style="color: var(--de-gold-light); font-family: var(--font-serif); margin-bottom: 12px;">🌟 DE 决定版核心革新</h3>
                            <ul style="color: var(--de-text-dim); font-size: 13px; line-height: 1.8; padding-left: 18px;">
                                <li><strong>原生超高清画质</strong>：完全重构支持 4K 原生分辨率与 Enhanced Graphics 材质包。</li>
                                <li><strong>现代化人性操作</strong>：引入农田自动补耕、建筑排队智能分配、混合阵型集结、多选兵种一键分流。</li>
                                <li><strong>竞技级AI行为树</strong>：彻底摒弃旧版作弊刷资源的 AI，全新 AI 依据人类天梯顶尖职业选手的开局流程执行建造与微操。</li>
                                <li><strong>完整天梯生态</strong>：内置全球 Elo 匹配系统、1v1 与组队天梯、观战与赛事回放。</li>
                            </ul>
                        </div>

                        <div style="background: var(--de-bg-card); border: 1px solid var(--de-border-gold); border-radius: 6px; padding: 20px;">
                            <h3 style="color: var(--de-gold-light); font-family: var(--font-serif); margin-bottom: 12px;">⏳ 四大时代演进规律</h3>
                            <ul style="color: var(--de-text-dim); font-size: 13px; line-height: 1.8; padding-left: 18px;">
                                <li><strong>黑暗时代 (Dark Age)</strong>：基础经济采集、探图斥候、捕猎野猪、织布机。</li>
                                <li><strong>封建时代 (Feudal Age)</strong>：铁匠铺科技解锁、步弓手与斥候骑兵骚扰、围家拉墙防守。</li>
                                <li><strong>城堡时代 (Castle Age)</strong>：城堡建造、重骑兵与弩手成型、投石冲车攻坚、银冠特色科技。</li>
                                <li><strong>帝王时代 (Imperial Age)</strong>：巨型投石机对决、金冠科技、三阶铁匠铺、化学火炮与游侠决战。</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <!-- 2. 文明全集 (45个全文明) -->
                <section id="sec-civs" class="de-section-view">
                    <div class="de-search-bar-wrap">
                        <input type="text" id="civ-search" class="de-search-input" placeholder="🔍 快速搜索 45 文明名称、英文、特色单位、特性关键字..." />
                        <select id="civ-filter-region" class="de-filter-select">
                            <option value="all">全部大区 (45个全文明)</option>
                            <option value="西欧">西欧 (6)</option>
                            <option value="中东欧">中东欧 (8)</option>
                            <option value="地中海">地中海 (4)</option>
                            <option value="中东与高加索">中东与高加索 (6)</option>
                            <option value="大草原与中亚">大草原与中亚 (4)</option>
                            <option value="东亚">东亚 (4)</option>
                            <option value="东南亚">东南亚 (4)</option>
                            <option value="南亚">南亚 (4)</option>
                            <option value="美洲">美洲 (3)</option>
                            <option value="非洲">非洲 (2)</option>
                        </select>
                    </div>
                    <div id="civs-grid" class="de-civ-grid"></div>
                </section>

                <!-- 3. 单位与兵种体系 -->
                <section id="sec-units" class="de-section-view">
                    <div class="de-search-bar-wrap">
                        <input type="text" id="unit-search" class="de-search-input" placeholder="🔍 搜索单位名称、英文、建筑、兵种分类..." />
                        <select id="unit-filter-category" class="de-filter-select">
                            <option value="all">全兵种分类</option>
                            <option value="步兵">步兵系</option>
                            <option value="骑兵">骑兵系</option>
                            <option value="射手">射手系</option>
                            <option value="火药武器">火药武器</option>
                            <option value="攻城武器">攻城武器</option>
                            <option value="海军">海军战舰</option>
                        </select>
                    </div>
                    <div id="units-grid" class="de-units-grid"></div>
                </section>

                <!-- 4. 攻防公式与战斗模拟器 -->
                <section id="sec-mechanics" class="de-section-view">
                    <div class="de-calculator-panel">
                        <h2 style="font-family: var(--font-serif); color: var(--de-gold-light); font-size: 20px; margin-bottom: 6px;">⚔️ DE 实时攻防伤害模拟器 (Damage Calculator)</h2>
                        <p style="font-size: 13px; color: var(--de-text-dim); margin-bottom: 20px;">
                            基于 DE 官方底层真实伤害公式：<code>总伤害 = max(1, 基础伤害 + 额外加成伤害)</code>。
                            任意选定攻守双方单位及铁匠铺科技，实时试算每击净伤害、所需攻击次数与 DPS 输出。
                        </p>

                        <div class="de-calc-grid">
                            <!-- 攻击方 -->
                            <div class="de-calc-fighter">
                                <h3><span>🚩 攻击方 (Attacker)</span></h3>
                                <div style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; color: var(--de-text-dim);">选择单位：</label>
                                    <select id="calc-attacker-select" class="de-filter-select" style="width: 100%; margin-top: 4px;"></select>
                                </div>
                                <div id="calc-attacker-stats" style="font-size: 13px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; margin-bottom: 12px;"></div>
                                <div>
                                    <label style="font-size: 12px; color: var(--de-text-dim); display: block; margin-bottom: 6px;">铁匠铺攻击科技：</label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
                                        <label><input type="checkbox" id="upg-forge"> 锻造 (+1近攻)</label>
                                        <label><input type="checkbox" id="upg-ironCasting"> 铸铁 (+1近攻)</label>
                                        <label><input type="checkbox" id="upg-blastFurnace"> 高炉 (+2近攻)</label>
                                        <label><input type="checkbox" id="upg-fletching"> 箭羽 (+1远攻/射程)</label>
                                        <label><input type="checkbox" id="upg-bodkin"> 锥头箭 (+1远攻/射程)</label>
                                        <label><input type="checkbox" id="upg-bracer"> 博德金箭 (+1远攻/射程)</label>
                                    </div>
                                </div>
                            </div>

                            <!-- VS 对抗圈 -->
                            <div class="de-calc-vs">
                                <div class="de-calc-vs-circle">VS</div>
                            </div>

                            <!-- 防守方 -->
                            <div class="de-calc-fighter">
                                <h3><span>🛡️ 防守方 (Defender)</span></h3>
                                <div style="margin-bottom: 12px;">
                                    <label style="font-size: 12px; color: var(--de-text-dim);">选择单位：</label>
                                    <select id="calc-defender-select" class="de-filter-select" style="width: 100%; margin-top: 4px;"></select>
                                </div>
                                <div id="calc-defender-stats" style="font-size: 13px; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 4px; margin-bottom: 12px;"></div>
                                <div>
                                    <label style="font-size: 12px; color: var(--de-text-dim); display: block; margin-bottom: 6px;">铁匠铺防御护甲科技：</label>
                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
                                        <label><input type="checkbox" id="upg-scaleBarding"> 鳞甲 (+1/+1防)</label>
                                        <label><input type="checkbox" id="upg-chainBarding"> 锁甲 (+1/+1防)</label>
                                        <label><input type="checkbox" id="upg-plateBarding"> 骑兵板甲 (+1/+2防)</label>
                                        <label><input type="checkbox" id="upg-paddedArcher"> 软甲 (+1/+1远防)</label>
                                        <label><input type="checkbox" id="upg-leatherArcher"> 皮甲 (+1/+1远防)</label>
                                        <label><input type="checkbox" id="upg-ringArcher"> 环甲 (+1/+2远防)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 试算结果输出框 -->
                        <div class="de-calc-result-box" id="calc-result-box"></div>
                    </div>

                    <!-- 隐藏护甲类别百科表 -->
                    <div style="background: var(--de-bg-darker); border: 1px solid var(--de-border); border-radius: 8px; padding: 24px;">
                        <h3 style="font-family: var(--font-serif); color: var(--de-gold-light); margin-bottom: 14px;">🛡️ DE 核心隐藏护甲类别列表 (Armor Classes)</h3>
                        <p style="font-size: 13px; color: var(--de-text-dim); margin-bottom: 16px;">
                            在 DE 底层中，每一个单位都挂载有一个或多个护甲标签（Armor Class）。当攻击方带有对该标签的克制数值时，将无视常规护甲造成全额额外附加伤害。
                        </p>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px;" id="armor-classes-list"></div>
                    </div>
                </section>

                <!-- 5. 科技树全览 -->
                <section id="sec-techtree" class="de-section-view">
                    <div style="background: var(--de-bg-darker); border: 1px solid var(--de-border-gold); border-radius: 8px; padding: 24px;">
                        <h2 style="font-family: var(--font-serif); color: var(--de-gold-light); font-size: 20px; margin-bottom: 14px;">🔬 帝国时代II：决定版 核心科技全景</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;" id="techtree-grid"></div>
                    </div>
                </section>

                <!-- 6. 史诗战役集 -->
                <section id="sec-campaigns" class="de-section-view">
                    <div style="background: var(--de-bg-darker); border: 1px solid var(--de-border-gold); border-radius: 8px; padding: 24px;">
                        <h2 style="font-family: var(--font-serif); color: var(--de-gold-light); font-size: 20px; margin-bottom: 14px;">🏆 官方全语音历史剧情战役集</h2>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px;" id="campaigns-grid"></div>
                    </div>
                </section>

                <!-- 7. DLC 与版本编年史 -->
                <section id="sec-dlcs" class="de-section-view">
                    <div style="display: flex; flex-direction: column; gap: 20px;" id="dlcs-container"></div>
                </section>
            </main>

            <!-- 详情弹窗 Modal -->
            <div id="de-modal-overlay" class="de-modal-overlay">
                <div class="de-modal-box">
                    <button id="de-modal-close" class="de-modal-close-btn">✕</button>
                    <div id="de-modal-body"></div>
                </div>
            </div>
        `;
    }

    private bindEvents(): void {
        // Tab 切换
        document.querySelectorAll('.de-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const tab = target.dataset.tab as any;
                if (!tab) return;
                this.currentTab = tab;
                document.querySelectorAll('.de-tab-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');

                document.querySelectorAll('.de-section-view').forEach(sec => sec.classList.remove('active'));
                const curSec = document.getElementById(`sec-${tab}`);
                if (curSec) curSec.classList.add('active');
            });
        });

        // 文明搜索与筛选
        const civSearch = document.getElementById('civ-search') as HTMLInputElement;
        const civFilterRegion = document.getElementById('civ-filter-region') as HTMLSelectElement;
        if (civSearch) {
            civSearch.addEventListener('input', () => {
                this.civSearchQuery = civSearch.value.trim().toLowerCase();
                this.renderCivs();
            });
        }
        if (civFilterRegion) {
            civFilterRegion.addEventListener('change', () => {
                this.civFilterRegion = civFilterRegion.value;
                this.renderCivs();
            });
        }

        // 单位搜索与筛选
        const unitSearch = document.getElementById('unit-search') as HTMLInputElement;
        const unitFilterCategory = document.getElementById('unit-filter-category') as HTMLSelectElement;
        if (unitSearch) {
            unitSearch.addEventListener('input', () => {
                this.unitSearchQuery = unitSearch.value.trim().toLowerCase();
                this.renderUnits();
            });
        }
        if (unitFilterCategory) {
            unitFilterCategory.addEventListener('change', () => {
                this.unitFilterCategory = unitFilterCategory.value;
                this.renderUnits();
            });
        }

        // 计算器事件
        const attSelect = document.getElementById('calc-attacker-select') as HTMLSelectElement;
        const defSelect = document.getElementById('calc-defender-select') as HTMLSelectElement;
        if (attSelect) {
            attSelect.addEventListener('change', () => {
                this.calcAttackerId = attSelect.value;
                this.updateCalculator();
            });
        }
        if (defSelect) {
            defSelect.addEventListener('change', () => {
                this.calcDefenderId = defSelect.value;
                this.updateCalculator();
            });
        }

        const upgradeIds = [
            'forge', 'ironCasting', 'blastFurnace', 'fletching', 'bodkin', 'bracer',
            'scaleBarding', 'chainBarding', 'plateBarding', 'paddedArcher', 'leatherArcher', 'ringArcher'
        ];
        upgradeIds.forEach(uid => {
            const el = document.getElementById(`upg-${uid}`) as HTMLInputElement;
            if (el) {
                el.addEventListener('change', () => {
                    (this.calcUpgrades as any)[uid] = el.checked;
                    this.updateCalculator();
                });
            }
        });

        // Modal 关闭
        const modalClose = document.getElementById('de-modal-close');
        const modalOverlay = document.getElementById('de-modal-overlay');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.closeModal();
            });
        }
    }

    private renderAll(): void {
        this.renderCivs();
        this.renderUnits();
        this.renderArmorClasses();
        this.renderTechTree();
        this.renderCampaigns();
        this.renderDlcs();
        this.initCalculatorSelectors();
        this.updateCalculator();
    }

    private renderCivs(): void {
        const grid = document.getElementById('civs-grid');
        if (!grid) return;

        let filtered = DE_CIVILIZATIONS;
        if (this.civFilterRegion !== 'all') {
            filtered = filtered.filter(c => c.region === this.civFilterRegion);
        }
        if (this.civSearchQuery) {
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(this.civSearchQuery) ||
                c.englishName.toLowerCase().includes(this.civSearchQuery) ||
                c.uniqueUnits.some(u => u.toLowerCase().includes(this.civSearchQuery)) ||
                c.bonuses.some(b => b.toLowerCase().includes(this.civSearchQuery)) ||
                c.focus.toLowerCase().includes(this.civSearchQuery)
            );
        }

        grid.innerHTML = filtered.map(c => `
            <div class="de-civ-card" data-civ-id="${c.id}">
                <div>
                    <div class="de-civ-card-head">
                        <div class="de-civ-name-box">
                            <h3>${c.name}</h3>
                            <span>${c.englishName}</span>
                        </div>
                        <span class="de-civ-region-tag">${c.region}</span>
                    </div>
                    <div class="de-civ-focus">🎯 ${c.focus}</div>
                    <div class="de-civ-uu">🛡️ <strong>特种单位：</strong>${c.uniqueUnits.join(' / ')}</div>
                    <div class="de-civ-bonuses-preview">
                        <strong>特性摘要：</strong>${c.bonuses[0]}
                    </div>
                </div>
                <div class="de-civ-footer-tag">
                    <span>${c.architecture}建筑风格</span>
                    <span>${c.dlc.split(' ')[0]}</span>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.de-civ-card').forEach(el => {
            el.addEventListener('click', () => {
                const cid = (el as HTMLElement).dataset.civId;
                const civ = DE_CIVILIZATIONS.find(c => c.id === cid);
                if (civ) this.openCivModal(civ);
            });
        });
    }

    private renderUnits(): void {
        const grid = document.getElementById('units-grid');
        if (!grid) return;

        let filtered = DE_CORE_UNITS;
        if (this.unitFilterCategory !== 'all') {
            filtered = filtered.filter(u => u.category === this.unitFilterCategory);
        }
        if (this.unitSearchQuery) {
            filtered = filtered.filter(u =>
                u.name.toLowerCase().includes(this.unitSearchQuery) ||
                u.englishName.toLowerCase().includes(this.unitSearchQuery) ||
                u.building.toLowerCase().includes(this.unitSearchQuery) ||
                u.description.toLowerCase().includes(this.unitSearchQuery)
            );
        }

        grid.innerHTML = filtered.map(u => `
            <div class="de-unit-card">
                <div class="de-unit-header">
                    <div>
                        <div class="de-unit-name">${u.name}</div>
                        <div style="font-size: 11px; color: var(--de-text-dim);">${u.englishName} · ${u.building}</div>
                    </div>
                    <span class="de-unit-tag">${u.age}</span>
                </div>
                <div class="de-unit-stats-grid">
                    <div class="de-stat-cell"><span class="s-label">生命值 HP</span><span class="s-val">${u.hp}</span></div>
                    <div class="de-stat-cell"><span class="s-label">基础攻击</span><span class="s-val">${u.attack}</span></div>
                    <div class="de-stat-cell"><span class="s-label">护甲 (近/远)</span><span class="s-val">${u.meleeArmor} / ${u.pierceArmor}</span></div>
                    <div class="de-stat-cell"><span class="s-label">射程 Range</span><span class="s-val">${u.range > 0 ? u.range : '近战'}</span></div>
                    <div class="de-stat-cell"><span class="s-label">攻速间隔</span><span class="s-val">${u.reloadTime}s</span></div>
                    <div class="de-stat-cell"><span class="s-label">移动速度</span><span class="s-val">${u.speed}</span></div>
                </div>
                ${u.attackBonuses.length > 0 ? `
                    <div class="de-unit-bonuses">
                        <strong>⚡ 克制加成：</strong>${u.attackBonuses.map(b => `${b.targetClass} +${b.bonus}`).join('，')}
                    </div>
                ` : ''}
                <div class="de-unit-desc">${u.description}</div>
            </div>
        `).join('');
    }

    private renderArmorClasses(): void {
        const wrap = document.getElementById('armor-classes-list');
        if (!wrap) return;

        wrap.innerHTML = DE_ARMOR_CLASSES.map(a => `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--de-border); padding: 12px; border-radius: 4px;">
                <div style="color: var(--de-gold-light); font-weight: bold; font-size: 13px; margin-bottom: 4px;">#${a.id} ${a.name}</div>
                <div style="font-size: 12px; color: var(--de-text-dim); margin-bottom: 6px;">${a.description}</div>
                <div style="font-size: 11px; color: #f687b3;"><strong>弱点克星：</strong>${a.vulnerableTo}</div>
            </div>
        `).join('');
    }

    private renderTechTree(): void {
        const wrap = document.getElementById('techtree-grid');
        if (!wrap) return;

        wrap.innerHTML = DE_TECHS.map(t => `
            <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--de-border); padding: 14px; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <div style="color: var(--de-gold-light); font-weight: bold; font-size: 14px;">${t.name}</div>
                    <span style="font-size: 11px; color: #f6ad55; background: rgba(246, 173, 85, 0.1); padding: 2px 6px; border-radius: 4px;">${t.age}</span>
                </div>
                <div style="font-size: 11px; color: var(--de-text-dim); margin-bottom: 6px;">建筑：${t.building} | 成本：${t.cost}</div>
                <div style="font-size: 12px; color: var(--de-text-parchment); line-height: 1.5;">${t.effect}</div>
            </div>
        `).join('');
    }

    private renderCampaigns(): void {
        const wrap = document.getElementById('campaigns-grid');
        if (!wrap) return;

        wrap.innerHTML = DE_CAMPAIGNS.map(c => `
            <div style="background: rgba(0,0,0,0.35); border: 1px solid var(--de-border); padding: 16px; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                    <h3 style="color: var(--de-gold-light); font-family: var(--font-serif); font-size: 16px;">${c.title}</h3>
                    <span style="font-size: 11px; color: #68d391; background: rgba(104, 211, 145, 0.1); padding: 2px 6px; border-radius: 4px;">${c.dlc}</span>
                </div>
                <div style="font-size: 12px; color: var(--de-text-dim); margin-bottom: 8px;">主角：${c.hero} | 文明：${c.civ} | 关卡：共 ${c.scenariosCount} 关</div>
                <div style="font-size: 12px; color: var(--de-text-parchment); line-height: 1.5;">${c.desc}</div>
            </div>
        `).join('');
    }

    private renderDlcs(): void {
        const wrap = document.getElementById('dlcs-container');
        if (!wrap) return;

        wrap.innerHTML = DE_DLC_CHRONOLOGY.map(d => `
            <div style="background: var(--de-bg-card); border: 1px solid var(--de-border-gold); border-radius: 6px; padding: 22px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--de-gold-light);">${d.title} <span style="font-size: 13px; color: var(--de-text-dim); font-family: var(--font-sans);">(${d.englishTitle})</span></h3>
                    <span style="font-size: 12px; color: var(--de-gold-primary); font-family: var(--font-serif);">${d.releaseDate}</span>
                </div>
                <div style="margin-bottom: 12px; font-size: 13px;">
                    <strong>新增文明：</strong><span style="color: #68d391;">${d.newCivs.join('、') || '（无新增文明，专注于战役扩展）'}</span>
                </div>
                <div style="margin-bottom: 12px; font-size: 13px;">
                    <strong>代表战役：</strong><span style="color: #63b3ed;">${d.campaigns.join('、')}</span>
                </div>
                <div>
                    <strong style="font-size: 13px;">全新游戏特性与机制：</strong>
                    <ul style="font-size: 12px; color: var(--de-text-dim); padding-left: 18px; margin-top: 4px; line-height: 1.6;">
                        ${d.keyFeatures.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }

    private initCalculatorSelectors(): void {
        const attSelect = document.getElementById('calc-attacker-select') as HTMLSelectElement;
        const defSelect = document.getElementById('calc-defender-select') as HTMLSelectElement;
        if (!attSelect || !defSelect) return;

        const opts = DE_CORE_UNITS.map(u => `<option value="${u.id}">${u.name} (${u.category})</option>`).join('');
        attSelect.innerHTML = opts;
        defSelect.innerHTML = opts;

        attSelect.value = this.calcAttackerId;
        defSelect.value = this.calcDefenderId;
    }

    private updateCalculator(): void {
        const attacker = DE_CORE_UNITS.find(u => u.id === this.calcAttackerId);
        const defender = DE_CORE_UNITS.find(u => u.id === this.calcDefenderId);
        if (!attacker || !defender) return;

        const attStatsEl = document.getElementById('calc-attacker-stats');
        const defStatsEl = document.getElementById('calc-defender-stats');
        const resBox = document.getElementById('calc-result-box');

        if (attStatsEl) {
            attStatsEl.innerHTML = `基础攻击: <strong>${attacker.attack}</strong> | 射程: <strong>${attacker.range > 0 ? attacker.range : '近战'}</strong> | 攻速: <strong>${attacker.reloadTime}s</strong>`;
        }
        if (defStatsEl) {
            defStatsEl.innerHTML = `生命值: <strong>${defender.hp}</strong> | 近防: <strong>${defender.meleeArmor}</strong> | 远防: <strong>${defender.pierceArmor}</strong>`;
        }

        const result = calculateDeDamage(attacker, defender, this.calcUpgrades, this.calcUpgrades);

        if (resBox) {
            resBox.innerHTML = `
                <div class="de-result-item">
                    <div class="r-val" style="color: #f56565;">${result.totalDamagePerHit}</div>
                    <div class="r-desc">每击净伤害 (基础 ${result.baseDamage} + 克制加成 ${result.bonusDamage})</div>
                </div>
                <div class="de-result-item">
                    <div class="r-val" style="color: #ecc94b;">${result.hitsToKill} 次</div>
                    <div class="r-desc">砍死 / 射死所需命中次数</div>
                </div>
                <div class="de-result-item">
                    <div class="r-val" style="color: #48bb78;">${result.timeToKillSec} 秒</div>
                    <div class="r-desc">击杀耗时 (Time to Kill)</div>
                </div>
                <div class="de-result-item">
                    <div class="r-val" style="color: #4299e1;">${result.dps}</div>
                    <div class="r-desc">每秒平均输出 (DPS)</div>
                </div>
            `;
        }
    }

    private openCivModal(civ: DeCiv): void {
        const overlay = document.getElementById('de-modal-overlay');
        const body = document.getElementById('de-modal-body');
        if (!overlay || !body) return;

        body.innerHTML = `
            <div style="border-bottom: 1px solid var(--de-border-gold); padding-bottom: 16px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <h2 style="font-family: var(--font-serif); font-size: 24px; color: var(--de-gold-light);">${civ.name} (${civ.englishName})</h2>
                    <span class="de-civ-region-tag">${civ.region} · ${civ.architecture}风格</span>
                </div>
                <div style="font-size: 14px; color: #48bb78; margin-top: 4px;">定位：${civ.focus}</div>
            </div>

            <div style="margin-bottom: 18px;">
                <h4 style="color: var(--de-gold-light); font-family: var(--font-serif); margin-bottom: 8px;">⚔️ 核心文明加成 (Civilization Bonuses)：</h4>
                <ul style="padding-left: 20px; font-size: 13px; line-height: 1.8; color: var(--de-text-parchment);">
                    ${civ.bonuses.map(b => `<li>${b}</li>`).join('')}
                </ul>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--de-border); border-radius: 6px; padding: 14px; margin-bottom: 18px;">
                <h4 style="color: var(--de-gold-light); font-family: var(--font-serif); margin-bottom: 8px;">🛡️ 特色单位 (Unique Units)：</h4>
                <div style="font-size: 14px; color: #e2e8f0; font-weight: bold;">${civ.uniqueUnits.join(' / ')}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px;">
                <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--de-border); border-radius: 6px; padding: 12px;">
                    <div style="font-size: 11px; color: #a0aec0; text-transform: uppercase;">城堡时代银冠科技</div>
                    <div style="font-size: 14px; font-weight: bold; color: #e2e8f0; margin: 4px 0;">${civ.uniqueTechCastle.name} (${civ.uniqueTechCastle.englishName})</div>
                    <div style="font-size: 11px; color: #ed8936; margin-bottom: 4px;">成本：${civ.uniqueTechCastle.cost}</div>
                    <div style="font-size: 12px; color: var(--de-text-dim);">${civ.uniqueTechCastle.effect}</div>
                </div>

                <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--de-border); border-radius: 6px; padding: 12px;">
                    <div style="font-size: 11px; color: #ecc94b; text-transform: uppercase;">帝王时代金冠科技</div>
                    <div style="font-size: 14px; font-weight: bold; color: #e2e8f0; margin: 4px 0;">${civ.uniqueTechImperial.name} (${civ.uniqueTechImperial.englishName})</div>
                    <div style="font-size: 11px; color: #ed8936; margin-bottom: 4px;">成本：${civ.uniqueTechImperial.cost}</div>
                    <div style="font-size: 12px; color: var(--de-text-dim);">${civ.uniqueTechImperial.effect}</div>
                </div>
            </div>

            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--de-border); border-radius: 6px; padding: 12px; margin-bottom: 18px;">
                <div style="font-size: 12px; color: var(--de-gold-primary); font-weight: bold;">🤝 团队加成 (Team Bonus)：</div>
                <div style="font-size: 13px; color: var(--de-text-parchment); margin-top: 4px;">${civ.teamBonus}</div>
            </div>

            <div style="border-top: 1px solid var(--de-border); padding-top: 14px;">
                <h4 style="color: var(--de-text-dim); font-size: 12px; margin-bottom: 4px;">📜 历史背景：</h4>
                <div style="font-size: 12px; color: var(--de-text-dim); line-height: 1.6;">${civ.historyBrief}</div>
            </div>
        `;

        overlay.classList.add('open');
    }

    private closeModal(): void {
        const overlay = document.getElementById('de-modal-overlay');
        if (overlay) overlay.classList.remove('open');
    }
}

// 启动单页应用
window.addEventListener('DOMContentLoaded', () => {
    new DeWikiApp();
});
