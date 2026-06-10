import { CITIES_V2 } from '../src/data/cities_v2';
import { FACTIONS } from '../src/data/factions';
import * as fs from 'fs';

const proposals = [
    { city: '婼羌', flag: '羌', fallbackId: 'ruoqiang' },
    { city: '涿邪山', flag: '匈', fallbackId: 'xiongnu_minor' },
    { city: '燕然山', flag: '敕', fallbackId: 'chile' },
    { city: '狼居胥山', flag: '匈', fallbackId: 'xiongnu_minor' },
    { city: '乌蒙山', flag: '乌', fallbackId: 'wuman' },
    { city: '多玛', flag: '藏', fallbackId: 'zang' },
    { city: '龙木错', flag: '羌', fallbackId: 'ruoqiang' },
    { city: '汀州', flag: '客', fallbackId: 'kejia' },
    { city: '子午谷', flag: '魏', fallbackId: 'wei_d' },
    { city: '飞狐', flag: '代', fallbackId: 'dai_d' },
    { city: '燕然勒石', flag: '汉', fallbackId: 'han_d' },
    { city: '海州', flag: '高', fallbackId: 'goryeo' },
    { city: '息城', flag: '渤', fallbackId: 'balhae' },
    { city: '穹窿银城', flag: '象', fallbackId: 'xiangxiong' },
    { city: '大斗拔谷', flag: '隋', fallbackId: 'sui_d' },
    { city: '博尔巴任', flag: '回', fallbackId: 'huihu' },
    { city: '独逻河', flag: '薛', fallbackId: 'xueyantuo' },
    { city: '忽毡', flag: '帖', fallbackId: 'tiemuer' },
    { city: '普兰', flag: '格', fallbackId: 'guge' },
    { city: '孽多城', flag: '勃', fallbackId: 'bolu' },
    { city: '咸兴', flag: '李', fallbackId: 'yi_clan' },
    { city: '永宁', flag: '奢', fallbackId: 'she' },
    { city: '钓鱼城', flag: '冉', fallbackId: 'ran_clan' },
    { city: '淮阴', flag: '淮', fallbackId: 'huaiyin' },
    { city: '街亭', flag: '街', fallbackId: 'jieting' },
    { city: '当阳', flag: '当', fallbackId: 'dangyang' },
    { city: '夏阳渡', flag: '夏', fallbackId: 'xiayang' },
    { city: '泾州', flag: '泾', fallbackId: 'jingzhou' },
    { city: '果州', flag: '充', fallbackId: 'guozhou' },
    { city: '资州', flag: '资', fallbackId: 'zizhou' },
    { city: '景州', flag: '景', fallbackId: 'jingzhou_hebei' },
    { city: '陇州', flag: '陇', fallbackId: 'longzhou' },
    { city: '松州', flag: '松', fallbackId: 'songzhou' },
    { city: '朐城', flag: '朐', fallbackId: 'qucheng' },
    { city: '迭州', flag: '迭', fallbackId: 'diezhou' },
    { city: '潘州', flag: '潘', fallbackId: 'panzhou' },
    { city: '茂州', flag: '茂', fallbackId: 'maozhou' },
    { city: '东胜州', flag: '胜', fallbackId: 'dongsheng' },
    { city: '隆桥驿', flag: '隆', fallbackId: 'longqiao' },
    { city: '且末', flag: '且', fallbackId: 'qiemo' },
    { city: '星星峡', flag: '凉', fallbackId: 'xingxingxia' },
    { city: '漂渝津', flag: '津', fallbackId: 'piaoyu' },
    { city: '金山', flag: '金', fallbackId: 'jinshan' },
    { city: '福海', flag: '福', fallbackId: 'fuhai' },
    { city: '武定州', flag: '武', fallbackId: 'wuding' },
    { city: '庆州', flag: '庆', fallbackId: 'qingzhou' },
    { city: '三陇沙', flag: '沙', fallbackId: 'sanlongsha' },
    { city: '赛尔乌苏', flag: '漠', fallbackId: 'saierwusu' },
    { city: '布尔根军台', flag: '台', fallbackId: 'buergen' },
    { city: '昆岗', flag: '昆', fallbackId: 'kungang' },
    { city: '大通', flag: '通', fallbackId: 'datong' },
    { city: '赛音山达', flag: '赛', fallbackId: 'saiyinshanda' },
    { city: '尉头城', flag: '尉', fallbackId: 'weitou' }
];

const newFactionsToCreate: any[] = [];
const cityUpdates: { cityName: string, factionId: string }[] = [];

proposals.forEach(p => {
    // Check if flag already exists in FACTIONS
    const existing = FACTIONS.find(f => f.name === p.flag);
    if (existing) {
        cityUpdates.push({ cityName: p.city, factionId: existing.id });
    } else {
        // We need to create a new faction
        const newFaction = {
            id: p.fallbackId,
            name: p.flag,
            color: '#708090' // Default SlateGray for these minor factions
        };
        newFactionsToCreate.push(newFaction);
        cityUpdates.push({ cityName: p.city, factionId: newFaction.id });
    }
});

console.log('--- Factions to Create ---');
console.log(newFactionsToCreate.map(f => `{ id: '${f.id}', name: '${f.name}', color: '${f.color}' },`).join('\n'));

fs.writeFileSync('c:\\MAPWARSJ\\scratch\\city_updates.json', JSON.stringify(cityUpdates, null, 2));
console.log(`\nWritten ${cityUpdates.length} city updates to city_updates.json`);
