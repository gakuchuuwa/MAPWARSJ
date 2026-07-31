const fs = require('fs');

const extractProperty = (str, prop) => {
    const regex = new RegExp(`(?:${prop}['"]?\\s*:\\s*)(['"])(.*?)\\1`);
    const match = str.match(regex);
    return match ? match[2] : null;
};

const citiesCode = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsCode = fs.readFileSync('src/data/factions.ts', 'utf8');
const flagsCode = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

// Parse medium cities
const mediumCities = [];
let currentCityStr = '';
const lines = citiesCode.split('\n');

for(let line of lines) {
    if(line.includes('{ id: ') || line.includes('{id:')) {
        if(currentCityStr.includes('medium_city') || currentCityStr.includes('"medium_city"')) {
            mediumCities.push(currentCityStr);
        }
        currentCityStr = line;
    } else {
        currentCityStr += '\n' + line;
    }
}
if(currentCityStr.includes('medium_city')) {
    mediumCities.push(currentCityStr);
}

const parsedCities = mediumCities.map(str => {
    return {
        id: extractProperty(str, 'id'),
        name: extractProperty(str, 'name'),
        factionId: extractProperty(str, 'factionId')
    };
}).filter(c => c.factionId && c.factionId !== 'panjun');

// Parse factions
const factions = {};
factionsCode.split('\n').forEach(line => {
    const idMatch = line.match(/id:\s*['"](.*?)['"]/);
    const nameMatch = line.match(/name:\s*['"](.*?)['"]/);
    if(idMatch && nameMatch) {
        factions[idMatch[1]] = nameMatch[1];
    }
});

// Parse explicit flags
const flags = {};
flagsCode.split('\n').forEach(line => {
    const match = line.match(/(?:['"]?)(.*?)(?:['"]?)\s*:\s*['"](.*?)['"]/);
    if(match && !line.trim().startsWith('//')) {
        flags[match[1]] = match[2];
    }
});

const report = {
    totalMediumCities: parsedCities.length,
    nameConflicts: [],
    invalidFlags: [],
    missingFlags: [],
    allData: []
};

parsedCities.forEach(c => {
    const fname = factions[c.factionId] || '未知';
    let flag = flags[c.factionId];
    
    // Check name conflict
    if(c.name === fname) {
        report.nameConflicts.push({city: c.name, factionId: c.factionId});
    }

    if(!flag) {
        // missing explicit flag, use fallback logic
        const fallback = fname !== '未知' ? fname.substring(0, 2) : c.factionId.substring(0, 2);
        flag = fallback;
        report.missingFlags.push({factionId: c.factionId, fallback});
    }

    // Check invalid flag (contains 州 or 国)
    if(flag.includes('州') || flag.includes('国')) {
        report.invalidFlags.push({factionId: c.factionId, flag, factionName: fname, cityName: c.name});
    }

    report.allData.push(`${c.name} (${c.factionId}) - 势力: ${fname} | 旗号: ${flag}`);
});

fs.writeFileSync('medium_city_audit.json', JSON.stringify(report, null, 2));
