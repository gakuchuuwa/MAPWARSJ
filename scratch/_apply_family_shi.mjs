import fs from 'fs';

const familyAudit = JSON.parse(fs.readFileSync('./scratch/family_state_audit.json', 'utf8'));
const familyIds = new Set(
    familyAudit.entries.filter((e) => e.priority === 4).map((e) => e.id),
);

const ethnicSingleAlready = new Set([
    'jie', 'di', 'qiang', 'kumo', 'ava', 'mon', 'jing', 'muong', 'she_ethnic',
    'miao', 'pyu', 'dai', 'liren', 'liao', 'sou', 'tu', 'cong', 'nong2',
]);

let text = fs.readFileSync('./src/data/factions.ts', 'utf8');
const lines = text.split('\n');
const changes = [];

for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/);
    if (!m) continue;
    const [, id, name] = m;
    if ([...name].length !== 1) continue;
    if (name.endsWith('氏') || name.endsWith('国') || name.endsWith('族')) continue;
    if (ethnicSingleAlready.has(id)) continue;

    const lineCtx = lines[i] ?? '';
    const commentCtx = (lineCtx.match(/\/\/(.*)$/)?.[1] ?? '');
    const fromAudit = familyIds.has(id);
    const fromComment =
        /氏|世家|门阀|望族|名族|家族/.test(commentCtx) &&
        !/民族|族后|族前|古族|政权|国号/.test(commentCtx);
    const fromSuffix =
        (id.endsWith('_d') || id.endsWith('_clan') || id.endsWith('_shi') || id.endsWith('_s')) &&
        fromComment;

    if (fromAudit || fromComment || fromSuffix) {
        changes.push({ id, from: name, to: name + '氏' });
    }
}

for (const { id, from, to } of changes) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pat = new RegExp(`(\\{\\s*id:\\s*'${esc(id)}',\\s*name:\\s*')${esc(from)}(')`);
    const next = text.replace(pat, `$1${to}$2`);
    if (next === text) console.warn('miss', id, from);
    else text = next;
}

fs.writeFileSync('./src/data/factions.ts', text);
console.log('count', changes.length);
changes.sort((a, b) => a.id.localeCompare(b.id));
for (const c of changes) console.log(`${c.id}: ${c.from} → ${c.to}`);
