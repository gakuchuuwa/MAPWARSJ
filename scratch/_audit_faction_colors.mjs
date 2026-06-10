import { readFileSync } from 'fs';

const factionsTs = readFileSync('src/data/factions.ts', 'utf8');
const capitalsTs = readFileSync('src/data/StartingCapitals.ts', 'utf8');
const citiesTs = readFileSync('src/data/cities_v2.ts', 'utf8');

const factionIds = [...factionsTs.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const STARTING_CAPITALS = Object.fromEntries(
    [...capitalsTs.matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]])
);

const cityById = new Map();
for (const m of citiesTs.matchAll(
    /id:\s*'(city_[^']+)'[\s\S]*?lat:\s*([-\d.]+)[\s\S]*?lng:\s*([-\d.]+)/g
)) {
    if (!cityById.has(m[1])) cityById.set(m[1], { lat: +m[2], lng: +m[3] });
}

const CLOSE_KM = 120;
const NEARBY_KM = 520;
const MIN_HUE = 55;
const GOLDEN_ANGLE = 137.50776405003785;

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

function rgbDistance(a, b) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    return Math.hypot((pa >> 16) - (pb >> 16), ((pa >> 8) & 255) - ((pb >> 8) & 255), (pa & 255) - (pb & 255));
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function buildPalette(count, offset) {
    const colors = [];
    let i = 0;
    while (colors.length < count && i < count * 12) {
        const h = (offset + i * GOLDEN_ANGLE) % 360;
        const s = 48 + (i % 6) * 7;
        const l = 34 + (Math.floor(i / 6) % 5) * 5;
        const hex = hslToHex(Math.round(h), s, l);
        if (!colors.some((c) => rgbDistance(c, hex) < 32 || hueDelta(c, hex) < 14)) colors.push(hex);
        i++;
    }
    while (colors.length < count && i < count * 24) {
        const h = (offset + i * GOLDEN_ANGLE) % 360;
        const s = 48 + (i % 6) * 7;
        const l = 34 + (Math.floor(i / 6) % 5) * 5;
        const hex = hslToHex(Math.round(h), s, l);
        if (!colors.includes(hex)) colors.push(hex);
        i++;
    }
    return colors;
}

function pickBestColor(available, closeColors, farColors, usedColors) {
    let pool = available;
    if (closeColors.length > 0) {
        const strict = available.filter((c) => closeColors.every((n) => hueDelta(c, n) >= MIN_HUE));
        if (strict.length > 0) pool = strict;
    }
    let best = pool[0];
    let bestScore = -1;
    for (const candidate of pool) {
        let score = 0;
        if (closeColors.length > 0) {
            const minCloseHue = Math.min(...closeColors.map((c) => hueDelta(candidate, c)));
            const minCloseRgb = Math.min(...closeColors.map((c) => rgbDistance(candidate, c)));
            score += minCloseHue * 12 + minCloseRgb * 0.4;
        }
        if (farColors.length > 0) {
            const minFarHue = Math.min(...farColors.map((c) => hueDelta(candidate, c)));
            const minFarRgb = Math.min(...farColors.map((c) => rgbDistance(candidate, c)));
            score += minFarHue * 4 + minFarRgb * 0.6;
        }
        if (usedColors.length > 0) {
            const minGlobalHue = Math.min(...usedColors.map((c) => hueDelta(candidate, c)));
            const minGlobalRgb = Math.min(...usedColors.map((c) => rgbDistance(candidate, c)));
            score += minGlobalHue * 1.5 + minGlobalRgb * 0.2;
        }
        if (score === 0) score = 999;
        if (score > bestScore) {
            bestScore = score;
            best = candidate;
        }
    }
    return best;
}

function runAudit(offset) {
    const capitalByFaction = new Map();
    for (const fid of factionIds) {
        const capId = STARTING_CAPITALS[fid];
        const city = capId ? cityById.get(capId) : null;
        if (city) capitalByFaction.set(fid, city);
    }

    const neighbors = new Map();
    for (let i = 0; i < factionIds.length; i++) {
        const a = factionIds[i];
        const posA = capitalByFaction.get(a);
        if (!posA) continue;
        for (let j = i + 1; j < factionIds.length; j++) {
            const b = factionIds[j];
            const posB = capitalByFaction.get(b);
            if (!posB) continue;
            const km = haversineKm(posA, posB);
            if (km > NEARBY_KM) continue;
            if (!neighbors.has(a)) neighbors.set(a, []);
            if (!neighbors.has(b)) neighbors.set(b, []);
            neighbors.get(a).push({ id: b, km });
            neighbors.get(b).push({ id: a, km });
        }
    }

    const palette = buildPalette(factionIds.length, offset);
    const available = [...palette];
    const order = [...factionIds].sort(
        (a, b) => (neighbors.get(b)?.length ?? 0) - (neighbors.get(a)?.length ?? 0)
    );
    const assigned = new Map();
    let strictFails = 0;
    let withClose = 0;

    for (const fid of order) {
        const edges = neighbors.get(fid) ?? [];
        const closeColors = edges
            .filter((e) => e.km <= CLOSE_KM)
            .map((e) => assigned.get(e.id))
            .filter(Boolean);
        const farColors = edges
            .filter((e) => e.km > CLOSE_KM)
            .map((e) => assigned.get(e.id))
            .filter(Boolean);
        const usedColors = [...assigned.values()];

        if (closeColors.length > 0) {
            withClose++;
            const strictPool = available.filter((c) =>
                closeColors.every((n) => hueDelta(c, n) >= MIN_HUE)
            );
            if (strictPool.length === 0) strictFails++;
        }

        const color = pickBestColor(available, closeColors, farColors, usedColors);
        assigned.set(fid, color);
        available.splice(available.indexOf(color), 1);
    }

    const closePairs = [];
    for (let i = 0; i < factionIds.length; i++) {
        for (let j = i + 1; j < factionIds.length; j++) {
            const a = factionIds[i];
            const b = factionIds[j];
            const posA = capitalByFaction.get(a);
            const posB = capitalByFaction.get(b);
            if (!posA || !posB) continue;
            const km = haversineKm(posA, posB);
            if (km > CLOSE_KM) continue;
            const ca = assigned.get(a);
            const cb = assigned.get(b);
            if (!ca || !cb) continue;
            closePairs.push({ a, b, km, hue: hueDelta(ca, cb), ca, cb });
        }
    }
    closePairs.sort((x, y) => x.hue - y.hue);

    return {
        closePairs,
        fail: closePairs.filter((p) => p.hue < MIN_HUE),
        strictFails,
        withClose,
        unique: new Set(assigned.values()).size,
        noCapital: factionIds.length - capitalByFaction.size,
        panjun: assigned.get('panjun'),
    };
}

// 10 random seeds
let totalFail = 0;
let totalPairs = 0;
let totalStrictFail = 0;
for (let s = 0; s < 5; s++) {
    const r = runAudit(Math.random() * 360);
    totalFail += r.fail.length;
    totalPairs += r.closePairs.length;
    totalStrictFail += r.strictFails;
    if (s === 0) {
        console.log('=== sample run 0 ===');
        console.log('factions:', factionIds.length);
        console.log('no capital coord:', r.noCapital);
        console.log('close pairs (<=120km):', r.closePairs.length);
        console.log('below 55°:', r.fail.length);
        console.log('strict pool empty:', r.strictFails, '/', r.withClose);
        console.log('unique colors:', r.unique);
        console.log('panjun color:', r.panjun);
        if (r.fail.length) {
            console.log('worst pairs:');
            for (const p of r.fail.slice(0, 10)) {
                console.log(`  ${p.a} vs ${p.b}  ${p.km.toFixed(0)}km  ${p.hue.toFixed(1)}°`);
            }
        }
        const huangfu = r.closePairs.find((p) => p.a === 'huangfu' || p.b === 'huangfu');
        const xinping = r.closePairs.find(
            (p) =>
                (p.a === 'xinping' || p.b === 'xinping') &&
                (p.a === 'huangfu' || p.b === 'huangfu')
        );
        if (xinping) {
            console.log(`huangfu/xinping: ${xinping.hue.toFixed(1)}°`);
        }
    }
}
const SEEDS = 5;
console.log(`\n=== ${SEEDS} seeds avg ===`);
console.log('close pairs per run:', (totalPairs / SEEDS).toFixed(0));
console.log('violations (<55°) per run:', (totalFail / SEEDS).toFixed(1));
console.log('strict-fail assignments per run:', (totalStrictFail / SEEDS).toFixed(1));
