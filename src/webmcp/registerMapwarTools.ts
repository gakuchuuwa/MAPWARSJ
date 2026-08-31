import type { GameApp } from '../app/GameApp';

interface WebMcpToolDefinition {
    name: string;
    title: string;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations: {
        readOnlyHint: boolean;
        untrustedContentHint: boolean;
    };
    execute(input: unknown): unknown | Promise<unknown>;
}

interface WebMcpContext {
    registerTool(
        tool: WebMcpToolDefinition,
        options?: { signal?: AbortSignal }
    ): void | Promise<void>;
}

type WebMcpDocument = Document & { modelContext?: WebMcpContext };
type WebMcpWindow = Window & { __mapwarWebMcpLifecycle?: AbortController };

function asObject(input: unknown): Record<string, unknown> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('工具参数必须是对象');
    }
    return input as Record<string, unknown>;
}

function asRequiredString(input: Record<string, unknown>, key: string): string {
    const value = input[key];
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`${key} 必须是非空字符串`);
    }
    return value.trim();
}

function getGameStatus(app: GameApp) {
    const leafletMap = app.map.getLeafletMap();
    const center = leafletMap.getCenter();
    const time = app.timeSystem;

    return {
        date: time.getFormattedDate(),
        year: time.getYear(),
        season: time.getSeason(),
        paused: time.isGamePaused(),
        speed: time.getSpeed(),
        cityCount: app.cityManager.getCities().length,
        activeLegionCount: app.legionManager?.getActiveLegionCount() ?? 0,
        map: {
            latitude: center.lat,
            longitude: center.lng,
            zoom: leafletMap.getZoom(),
        },
    };
}

function createTools(app: GameApp): WebMcpToolDefinition[] {
    return [
        {
            name: 'get_game_status',
            title: '读取大乱斗状态',
            description: '读取当前纪年、季节、播放状态、速度、据点和现役军团数量以及地图视野。不会改变游戏。',
            inputSchema: {
                type: 'object',
                properties: {},
                additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: () => getGameStatus(app),
        },
        {
            name: 'search_cities',
            title: '检索历史据点',
            description: '按据点名称、据点 ID、势力名称或势力 ID 检索当前世界中的据点。不会改变游戏。',
            inputSchema: {
                type: 'object',
                properties: {
                    query: { type: 'string', minLength: 1, description: '据点或势力关键词' },
                    limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
                },
                required: ['query'],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: true, untrustedContentHint: false },
            execute: (rawInput) => {
                const input = asObject(rawInput);
                const query = asRequiredString(input, 'query').toLocaleLowerCase('zh-CN');
                const rawLimit = input.limit ?? 10;
                if (!Number.isInteger(rawLimit) || (rawLimit as number) < 1 || (rawLimit as number) > 20) {
                    throw new Error('limit 必须是 1 到 20 的整数');
                }

                const matches = app.cityManager.getCities()
                    .map((city) => ({ city, factionName: app.cityManager.getFactionName(city.factionId) }))
                    .filter(({ city, factionName }) =>
                        city.id.toLocaleLowerCase('zh-CN').includes(query)
                        || city.name.toLocaleLowerCase('zh-CN').includes(query)
                        || city.factionId.toLocaleLowerCase('zh-CN').includes(query)
                        || factionName.toLocaleLowerCase('zh-CN').includes(query)
                    )
                    .slice(0, rawLimit as number)
                    .map(({ city, factionName }) => ({
                        cityId: city.id,
                        cityName: city.name,
                        cityType: city.type,
                        factionId: city.factionId,
                        factionName,
                        troops: city.troops,
                        latitude: city.latitude,
                        longitude: city.longitude,
                    }));

                return { query: input.query, count: matches.length, cities: matches };
            },
        },
        {
            name: 'focus_city',
            title: '镜头定位据点',
            description: '把当前地图镜头平移到指定据点并保持现有缩放级别。需要先通过 search_cities 获得准确的据点 ID。',
            inputSchema: {
                type: 'object',
                properties: {
                    cityId: { type: 'string', minLength: 1, description: '准确的据点 ID' },
                },
                required: ['cityId'],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: async (rawInput) => {
                const input = asObject(rawInput);
                const cityId = asRequiredString(input, 'cityId');
                const city = app.cityManager.getCityById(cityId);
                if (!city) throw new Error(`找不到据点：${cityId}`);

                await app.map.flyTo({ lat: city.latitude, lng: city.longitude }, 0.6);
                return {
                    focused: true,
                    cityId: city.id,
                    cityName: city.name,
                    zoom: app.map.getLeafletMap().getZoom(),
                };
            },
        },
        {
            name: 'set_simulation_playback',
            title: '设置推演播放状态',
            description: '明确设置历史大乱斗为播放或暂停；只有状态需要变化时才触发页面现有的播放按钮。',
            inputSchema: {
                type: 'object',
                properties: {
                    state: { type: 'string', enum: ['playing', 'paused'] },
                },
                required: ['state'],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (rawInput) => {
                const input = asObject(rawInput);
                if (input.state !== 'playing' && input.state !== 'paused') {
                    throw new Error('state 必须是 playing 或 paused');
                }

                const shouldPause = input.state === 'paused';
                if (app.timeSystem.isGamePaused() !== shouldPause) {
                    const button = document.getElementById('run-event-btn');
                    if (!(button instanceof HTMLButtonElement)) throw new Error('播放控制尚未就绪');
                    button.click();
                }

                return {
                    state: app.timeSystem.isGamePaused() ? 'paused' : 'playing',
                    date: app.timeSystem.getFormattedDate(),
                };
            },
        },
        {
            name: 'set_simulation_speed',
            title: '设置推演速度',
            description: '把推演速度设置为页面支持的 1 倍、2 倍或 5 倍，并同步现有速度按钮。',
            inputSchema: {
                type: 'object',
                properties: {
                    speed: { type: 'number', enum: [1, 2, 5] },
                },
                required: ['speed'],
                additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: (rawInput) => {
                const input = asObject(rawInput);
                if (input.speed !== 1 && input.speed !== 2 && input.speed !== 5) {
                    throw new Error('speed 必须是 1、2 或 5');
                }

                app.timeSystem.setSpeed(input.speed);
                document.getElementById('speed2-btn')?.classList.toggle('active', input.speed === 2);
                document.getElementById('speed-btn')?.classList.toggle('active', input.speed === 5);
                return { speed: app.timeSystem.getSpeed() };
            },
        },
    ];
}

export async function registerMapwarWebMcpTools(app: GameApp): Promise<void> {
    const context = (document as WebMcpDocument).modelContext;
    if (!context?.registerTool) return;

    const webMcpWindow = window as WebMcpWindow;
    webMcpWindow.__mapwarWebMcpLifecycle?.abort();
    const lifecycle = new AbortController();
    webMcpWindow.__mapwarWebMcpLifecycle = lifecycle;

    for (const tool of createTools(app)) {
        try {
            await Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal }));
        } catch (error) {
            console.warn(`[WebMCP] 工具注册失败：${tool.name}`, error);
        }
    }
}
