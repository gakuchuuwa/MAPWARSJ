const fs = require("fs");
const c = fs.readFileSync("C:/MAPWARSJ/src/data/cities_v2.ts", "utf8");
const targets = ["京都","平壤","龙泉府","龙源","哈拉和林","龟兹","木鹿","梅尔夫","拉萨","逻些","大理","番禺","广州","南京","洛阳","长安","成都","北京","阿瑜陀耶","吴哥","宁安","金城","江户","逻些城","龟兹城"];
for (const t of targets) {
    const re = new RegExp("name:\\s*'" + t + "'[^}]*region:\\s*'([^']+)'", "s");
    const m = c.match(re);
    if (m) {
        console.log(t + " -> region: " + m[1]);
    } else {
        const re2 = new RegExp("name:\\s*'" + t + "'");
        if (c.match(re2)) {
            console.log(t + " -> EXISTS (no region)");
        } else {
            console.log(t + " -> NOT FOUND");
        }
    }
}
