const fs = require("fs");
const c = fs.readFileSync("C:/MAPWARSJ/src/data/cities_v2.ts", "utf8");
["归化","呼和浩特","盛乐","云中","定襄","襄平","辽阳","辽东","锦州","徒河","昌黎","平州","营州"].forEach(t => {
    const re = new RegExp("name:\\s*'([^']*" + t + "[^']*)'[^}]*lat:\\s*([0-9.]+)[^}]*lng:\\s*([0-9.]+)", "s");
    const m = c.match(re);
    if (m) console.log(m[1] + " (" + m[2] + ", " + m[3] + ")");
    else console.log(t + " -> NOT FOUND");
});
