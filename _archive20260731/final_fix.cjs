const fs = require('fs');
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

c = c.replace(/note:\s*'【界城】襄平作为区域核心边界点'\s*\}/, "note: '【界城】襄平作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】归化城作为区域核心边界点'\s*\}/, "note: '【界城】归化城作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】威海卫作为区域核心边界点'\s*\}/, "note: '【界城】威海卫作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】扬州作为区域核心边界点'\s*\}/, "note: '【界城】扬州作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】汉中作为区域核心边界点'\s*\}/, "note: '【界城】汉中作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】天水作为区域核心边界点'\s*\}/, "note: '【界城】天水作为区域核心边界点' },");
c = c.replace(/note:\s*'【界城】肤施作为区域核心边界点'\s*\}/, "note: '【界城】肤施作为区域核心边界点' },");

fs.writeFileSync('src/data/cities_v2.ts', c);
