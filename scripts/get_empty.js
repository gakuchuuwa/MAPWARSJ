const { CITIES_V2 } = require('./src/data/cities_v2.js');

const panjun = CITIES_V2.filter(c => c.factionId === 'panjun' || !c.factionId);
console.log('Count:', panjun.length);
console.log(panjun.map(c => c.name).join(', '));
