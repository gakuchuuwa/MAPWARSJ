const fs = require('fs');
const content = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const regionStr = content.substring(content.indexOf('const REGIONS:'), content.indexOf('];', content.indexOf('const REGIONS:')) + 2);
let functionStr = content.substring(content.indexOf('export function getRegion(lat'), content.indexOf('return \\'CENTRAL\\';\n}') + 19);
functionStr = functionStr.replace('export ', '');

const script = regionStr + '\n' + functionStr + '\nconsole.log(getRegion(12.77, 105.97));';
fs.writeFileSync('check_sanpu.cjs', script);
