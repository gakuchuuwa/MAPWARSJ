/** 抽检 huangfu / xinping 贴脸邻邦色相差（不加载全表） */
const CLOSE_KM = 120;
const MIN_HUE = 55;
const GOLDEN_ANGLE = 137.50776405003785;

const huangfu = { id: 'huangfu', lat: 35.327451, lng: 107.358398 };
const xinping = { id: 'xinping', lat: 35.03, lng: 108.08 };

function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
            Math.cos((b.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function hexToHue(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    if (d < 1e-6) return 0;
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
}

function hueDelta(a, b) {
    const d = Math.abs(hexToHue(a) - hexToHue(b));
    return Math.min(d, 360 - d);
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbDistance(a, b) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    return Math.hypot((pa >> 16) - (pb >> 16), ((pa >> 8) & 255) - ((pb >> 8) & 255), (pa & 255) - (pb & 255));
}

function buildPalette(count, offset) {
    const colors = [];
    let i = 0;
    while (colors.length < count && i < count * 12) {
        const h = (offset + i * GOLDEN_ANGLE) % 360;
        const s = 48 + (i % 6) * 7;
        const l = 34 + (Math.floor(i / 6) % 5) * 5;
        const hex = hslToHex(Math.round(h), s, l);
        const tooClose = colors.some((c) => rgbDistance(c, hex) < 32 || hueDelta(c, hex) < 14);
        if (!tooClose) colors.push(hex);
        i++;
    }
    return colors;
}

function pickBest(available, closeColors) {
    let pool = available;
    if (closeColors.length > 0) {
        const strict = available.filter((c) => closeColors.every((n) => hueDelta(c, n) >= MIN_HUE));
        if (strict.length > 0) pool = strict;
    }
    let best = pool[0];
    let bestScore = -1;
    for (const c of pool) {
        const minHue = Math.min(...closeColors.map((n) => hueDelta(c, n)));
        const minRgb = Math.min(...closeColors.map((n) => rgbDistance(c, n)));
        const score = minHue * 12 + minRgb * 0.4;
        if (score > bestScore) {
            bestScore = score;
            best = c;
        }
    }
    return best;
}

const km = haversineKm(huangfu, xinping);
const palette = buildPalette(600, Math.random() * 360);
const available = [...palette];

const colorA = pickBest(available, []);
available.splice(available.indexOf(colorA), 1);
const colorB = pickBest(available, [colorA]);

const delta = hueDelta(colorA, colorB);
console.log(`distance: ${km.toFixed(1)} km (close neighbor: ${km <= CLOSE_KM})`);
console.log(`huangfu: ${colorA}  xinping: ${colorB}  hueDelta: ${delta.toFixed(1)}°`);
console.log(delta >= MIN_HUE ? 'PASS' : 'FAIL');
