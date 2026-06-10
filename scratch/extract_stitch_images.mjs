import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';

function extract(jsonPath, outPath) {
  const raw = readFileSync(jsonPath, 'utf8').replace(/^\uFEFF/, '');
  const data = JSON.parse(raw);
  const text = data?.content?.[0]?.text ?? data?.result?.content?.[0]?.text;
  const parsed = text ? (typeof text === 'string' ? JSON.parse(text) : text) : data;
  const b64 =
    data?.imageContent ??
    parsed?.imageContent ??
    parsed?.imageBase64 ??
    parsed?.image ??
    parsed?.data ??
    parsed?.screenshotBase64;
  if (!b64 || typeof b64 !== 'string') {
    throw new Error(`No base64 image in ${jsonPath}: keys=${Object.keys(parsed ?? {}).join(',')}`);
  }
  const buf = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${buf.length} bytes)`);
}

extract(
  join('scratch', 'stitch_screen_a.json'),
  join('public', 'trees', 'central_forest_a.png'),
);
extract(
  join('scratch', 'stitch_screen_b.json'),
  join('public', 'trees', 'central_forest_b.png'),
);
