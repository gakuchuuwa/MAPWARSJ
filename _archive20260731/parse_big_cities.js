import * as fs from 'fs';

const extractProperty = (str, prop) => {
    const regex = new RegExp(`(?:${prop}['"]?\\s*:\\s*)(['"])(.*?)\\1`);
    const match = str.match(regex);
    return match ? match[2] : '无';
};

const extractObj = (fileContent, startPattern, objName) => {
    const idx = fileContent.indexOf(startPattern);
    if(idx === -1) return {};
    // very naive parsing
    return {};
}

// Read cities_v2
const citiesCode = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const bigCities = [];
const citiesLines = citiesCode.split('\n');
let currentCityStr = '';
for(let line of citiesLines) {
    if(line.includes('{ id: ') || line.includes('{id:')) {
        if(currentCityStr.includes('big_city')) {
            bigCities.push(currentCityStr);
        }
        currentCityStr = line;
    } else {
        currentCityStr += '\n' + line;
    }
}
if(currentCityStr.includes('big_city')) {
    bigCities.push(currentCityStr);
}

// Map parsed big cities
const parsedBigCities = bigCities.map(str => {
    return {
        id: extractProperty(str, 'id'),
        name: extractProperty(str, 'name'),
        factionId: extractProperty(str, 'factionId')
    };
});

// factions
const factionsCode = fs.readFileSync('src/data/factions.ts', 'utf8');
const getFactionName = (id) => {
    const regex = new RegExp(`id:\\s*['"]${id}['"].*?name:\\s*['"](.*?)['"]`);
    const match = factionsCode.match(regex);
    return match ? match[1] : '未知';
};

// flags
const flagsCode = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const getFlag = (id) => {
    const regex = new RegExp(`['"]${id}['"]\\s*:\\s*['"](.*?)['"]`);
    const match = flagsCode.match(regex);
    return match ? match[1] : '未知';
};

const report = parsedBigCities.map(c => {
    return `${c.name}(${c.factionId}) - 势力全名: ${getFactionName(c.factionId)} | 旗号: ${getFlag(c.factionId)}`;
});

fs.writeFileSync('big_cities_report.txt', report.join('\n'));
