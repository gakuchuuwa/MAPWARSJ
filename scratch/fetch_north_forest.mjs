import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const gcloud = 'C:\\Users\\GAKU\\.stitch-mcp\\google-cloud-sdk\\bin\\gcloud.cmd';
const env = {
  ...process.env,
  CLOUDSDK_CONFIG: 'C:\\Users\\GAKU\\.stitch-mcp\\config',
  GOOGLE_APPLICATION_CREDENTIALS:
    'C:\\Users\\GAKU\\.stitch-mcp\\config\\application_default_credentials.json',
  STITCH_PROJECT_ID: 'gaku-6d968',
  GOOGLE_CLOUD_PROJECT: 'gaku-6d968',
};

const token = execSync(`"${gcloud}" auth application-default print-access-token`, {
  env,
  encoding: 'utf8',
}).trim();
env.STITCH_ACCESS_TOKEN = token;

const dataFile = join('scratch', 'fetch_screen_north.json');
const raw = execSync(
  `npx -y @_davideast/stitch-mcp tool get_screen_image -f "${dataFile}" -o json`,
  { env, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
);

const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
const b64 = data.imageContent;
if (!b64) throw new Error(`No imageContent: ${Object.keys(data).join(',')}`);

const buf = Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
const outPath = join('public', 'trees', 'north_forest_a.png');
mkdirSync(join('public', 'trees'), { recursive: true });
writeFileSync(outPath, buf);
console.log(`Wrote ${outPath} (${buf.length} bytes)`);
