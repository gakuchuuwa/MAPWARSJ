const fs = require('fs');
let html = fs.readFileSync('C:/Users/GAKU/.gemini/antigravity/brain/c6c59dd1-cfb5-4ecd-ac65-7a6d48d489be/final_polygon_demo.html', 'utf-8');
html = html.replace(/延安/g, '肤施');
fs.writeFileSync('C:/Users/GAKU/.gemini/antigravity/brain/c6c59dd1-cfb5-4ecd-ac65-7a6d48d489be/final_polygon_demo.html', html, 'utf-8');
console.log('Updated final_polygon_demo.html');
