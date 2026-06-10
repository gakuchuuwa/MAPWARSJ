const h = await fetch('https://mapwar.vercel.app/index.html').then((r) => r.text());
const m = h.match(/assets\/index-[^"]+\.js/);
console.log('bundle', m?.[0] ?? 'none');
if (!m) process.exit(1);
const js = await fetch(`https://mapwar.vercel.app/${m[0]}`).then((r) => r.text());
console.log('yue_d', js.includes('yue_d'));
console.log('FLAG_TEXT_WHITE', js.includes('FLAG_TEXT_WHITE') || js.includes('yue_d'));
console.log('HistoricalFactionColors', js.includes('HistoricalFactionColors') || js.includes('#3A8F83'));
