const fs = require('fs');

const citiesCode = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsCode = fs.readFileSync('src/data/factions.ts', 'utf8');
const flagsCode = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

// Parse all cities
const cities = [];
let currentCity = {};
citiesCode.split('\n').forEach(line => {
    const idMatch = line.match(/id:\s*['"](.*?)['"]/);
    const nameMatch = line.match(/name:\s*['"](.*?)['"]/);
    const factionMatch = line.match(/factionId:\s*['"](.*?)['"]/);
    const typeMatch = line.match(/type:\s*['"](.*?)['"]/);
    
    if(idMatch) currentCity.id = idMatch[1];
    if(nameMatch) currentCity.name = nameMatch[1];
    if(factionMatch) currentCity.factionId = factionMatch[1];
    if(typeMatch) currentCity.type = typeMatch[1];
    
    if (line.includes('},')) {
        if (currentCity.id) {
            cities.push({...currentCity});
        }
        currentCity = {};
    }
});

// Parse factions
const factions = {};
factionsCode.split('\n').forEach(line => {
    const idMatch = line.match(/id:\s*['"](.*?)['"]/);
    const nameMatch = line.match(/name:\s*['"](.*?)['"]/);
    if(idMatch && nameMatch) {
        factions[idMatch[1]] = nameMatch[1];
    }
});

// Parse flags
const flags = {};
flagsCode.split('\n').forEach(line => {
    const match = line.match(/(?:['"]?)(.*?)(?:['"]?)\s*:\s*['"](.*?)['"]/);
    if(match && !line.trim().startsWith('//')) {
        flags[match[1]] = match[2];
    }
});

const report = {
    multiCityFactions: [],
    nameConflicts: [],
    invalidFlags: [],
    missingFlags: []
};

// Check 1: Multi-city factions (1 faction = 1 city)
const factionCityCount = {};
cities.forEach(c => {
    if(!c.factionId || c.factionId === 'panjun') return;
    if(!factionCityCount[c.factionId]) factionCityCount[c.factionId] = [];
    factionCityCount[c.factionId].push(c.name);
});
for(const [fid, cnames] of Object.entries(factionCityCount)) {
    if(cnames.length > 1) {
        report.multiCityFactions.push({factionId: fid, cities: cnames});
    }
}

// Check 2: Name conflicts (City name === Faction name)
cities.forEach(c => {
    if(!c.factionId || c.factionId === 'panjun') return;
    const fname = factions[c.factionId];
    if(c.name === fname) {
        report.nameConflicts.push({city: c.name, factionId: c.factionId});
    }
});

// Check 3 & 4: Flags
Object.keys(factions).forEach(fid => {
    let flag = flags[fid];
    let isFallback = false;
    if(!flag) {
        const fname = factions[fid];
        flag = fname ? fname.substring(0, 2) : fid.substring(0, 2);
        isFallback = true;
        // Optional: track missing explicit flags, though not strictly an error if fallback is good
        // report.missingFlags.push({factionId: fid, fallback: flag});
    }
    
    if(flag.includes('州') || flag.includes('国')) {
        report.invalidFlags.push({factionId: fid, flag, reason: "包含禁字 '州/国'"});
    }
    if(flag.length > 2) {
        report.invalidFlags.push({factionId: fid, flag, reason: "长度超限(>2)"});
    }
});

fs.writeFileSync('audit_report.json', JSON.stringify(report, null, 2));
