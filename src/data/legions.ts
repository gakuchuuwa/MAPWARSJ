
import type { Army } from '../legion/Army';

export interface LegionConfig {
    id: string;
    name: string;
    factionId: string;
    type: 'infantry' | 'cavalry' | 'archer_cavalry' | 'mixed';
    generalId?: string; // [NEW] Optional General ID for UI
}

export const HISTORICAL_LEGIONS: LegionConfig[] = [

    // ═══════════════════════════════════════════════════════════════
    // 赵军
    // ═══════════════════════════════════════════════════════════════

    {
        id: 'legion_huihui_limu',
        name: '赵-李牧军',
        factionId: 'huihui',
        type: 'mixed'
    },
    {
        id: 'legion_huihui_huzhe',
        name: '赵-扈辄军',
        factionId: 'huihui',
        type: 'mixed'
    },
    {
        id: 'legion_huihui_chenyu',
        name: '赵-陈余军',
        factionId: 'huihui',
        type: 'mixed'
    },
    // 匈奴
    {
        id: 'legion_huihui_modu',
        name: '匈奴-冒顿军',
        factionId: 'huihui',
        type: 'cavalry'
    },

    // 燕军
    {
        id: 'legion_chaoxian_yandai',
        name: '燕代联军',
        factionId: 'chaoxian',
        type: 'mixed'
    },
    {
        id: 'legion_chaoxian_taizidan',
        name: '燕-太子丹军',
        factionId: 'chaoxian',
        type: 'mixed'
    },

    // 楚军
    {
        id: 'legion_tianchao_xiangyan',
        name: '楚-项燕军',
        factionId: 'tianchao',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_chensheng',
        name: '张楚-陈胜军',
        factionId: 'tianchao',
        type: 'infantry'
    },
    {
        id: 'legion_tianchao_zhouwen',
        name: '张楚-周文军',
        factionId: 'tianchao',
        type: 'infantry'
    },
    {
        id: 'legion_tianchao_zhanger',
        name: '张楚-张耳军',
        factionId: 'tianchao',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_xiangliang',
        name: '楚-项梁军',
        factionId: 'tianchao',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_liubang_chu',
        name: '楚-刘邦军',
        factionId: 'tianchao',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_xiangyu',
        name: '楚-项羽军',
        factionId: 'tianchao',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_longju',
        name: '楚-龙且军',
        factionId: 'tianchao',
        type: 'mixed'
    },

    // 越军
    {
        id: 'legion_yuenan_yixusong',
        name: '越-译吁宋军',
        factionId: 'yuenan',
        type: 'mixed'
    },
    {
        id: 'legion_yuenan_jiejun',
        name: '越-桀骏军',
        factionId: 'yuenan',
        type: 'mixed'
    },



    // ═══════════════════════════════════════════════════════════════
    // 中华（汉）军团
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'legion_zhonghua_liubang',
        name: '汉-刘邦军',
        factionId: 'zhonghua',
        type: 'mixed'
    },
    {
        id: 'legion_zhonghua_fankuai',
        name: '汉-樊噲军',
        factionId: 'zhonghua',
        type: 'mixed'
    },
    {
        id: 'legion_zhonghua_hanxin',
        name: '汉-韩信军',
        factionId: 'zhonghua',
        type: 'mixed'
    },
    {
        id: 'legion_zhonghua_luwan',
        name: '汉-卢绾军',
        factionId: 'zhonghua',
        type: 'mixed'
    },

    // ═══════════════════════════════════════════════════════════════
    // 叛军军团
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'legion_huihui_chenxi',
        name: '代-陈豨军',
        factionId: 'huihui',
        type: 'mixed'
    },
    {
        id: 'legion_tianchao_yingbu',
        name: '淮南-黥布军',
        factionId: 'tianchao',
        type: 'mixed'
    },

    // ═══════════════════════════════════════════════════════════════
    // 朝鲜军团
    // ═══════════════════════════════════════════════════════════════
    {
        id: 'legion_chaoxian_weiman',
        name: '朝鲜-椎结义从',
        factionId: 'chaoxian',
        type: 'mixed'
    },

];
