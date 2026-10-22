/**
 * 🔴 [2026-10-22 主人「所有人物都没有立绘，你需要建立对话人物吗。我来画立绘。」]
 *
 * 故事块里说话的人物：对话框抬头的名字、身份，和立绘文件放在哪。
 * 立绘由主人画，放到 `public/assets/STORY/<文件名>.png` 就自动显示；文件还没有时对话框不显示立绘（不报错、不代填）。
 * 萨尔杜里是游戏里现成的武将，用他现成的立绘。
 * 旁白类的抬头（凡湖岸、梅努阿渠、哈桑卢城下、通灵）不是人，不配立绘。
 *
 * 故事块里的 speaker 照旧写下面表里的键（例：'养马人家'），引擎按键查人物。
 */

export interface StoryCharacter {
    /** 对话框抬头显示的名字 */
    name: string;
    /** 抬头旁边的小字：身份 */
    role: string;
    /** 立绘路径；空＝没有立绘（旁白） */
    portrait: string;
    /** 给画立绘的人看：长什么样（只在文档与这里，不进游戏） */
    look: string;
}

const STORY_PORTRAIT_DIR = '/assets/STORY/';

export const STORY_CHARACTERS: Readonly<Record<string, StoryCharacter>> = {
    养马人家: {
        name: '塔胡',
        role: '图什帕城外的养马人家',
        portrait: `${STORY_PORTRAIT_DIR}urt_herder_tahu.png`,
        look: '五十来岁的乌拉尔图养马人，羊毛长袍、皮护腿，手里拿着马鞭，脸被高原风吹得发红',
    },
    梅努阿王的使者: {
        name: '王的使者',
        role: '梅努阿王的使者',
        portrait: `${STORY_PORTRAIT_DIR}urt_envoy.png`,
        look: '乌拉尔图王宫派来的传令官，青铜头盔、彩色流苏长袍，手持刻着楔形文字的泥板',
    },
    老马夫: {
        name: '老马夫',
        role: '乌拉尔图军中的老马夫',
        portrait: `${STORY_PORTRAIT_DIR}urt_old_groom.png`,
        look: '六十多岁、缺了几颗牙的老马夫，正掰开一匹马的嘴看牙口',
    },
    叙利亚商队: {
        name: '阿布迪',
        role: '从叙利亚来的商队首领',
        portrait: `${STORY_PORTRAIT_DIR}syrian_trader_abdi.png`,
        look: '阿拉姆人商队首领，缠头巾、条纹长袍、络腮胡，牵着一匹左腿有箭疤的老战马',
    },
    萨尔杜里: {
        name: '萨尔杜里',
        role: '乌拉尔图',
        portrait: '/assets/ARMENIANS/wulaertu_guo_saerdu.png',
        look: '游戏里现成的武将立绘',
    },
};

export function getStoryCharacter(speaker: string): StoryCharacter | undefined {
    return STORY_CHARACTERS[speaker];
}
