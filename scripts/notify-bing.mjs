// Tells Bing (and other IndexNow search engines) about pages that changed in the latest commit.
// Usage: node scripts/notify-bing.mjs            -> pages changed in HEAD
//        node scripts/notify-bing.mjs <url> ...  -> specific URLs
import { readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const HOST = 'www.completehomerefresh.com';
const SITE = `https://${HOST}`;
const key = readdirSync('.').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace('.txt', '');
if (!key) throw new Error('IndexNow key file not found in repo root');

let urls = process.argv.slice(2);
if (!urls.length) {
  const files = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.html'));
  urls = files.map((f) => `${SITE}/${f.replace(/\.html$/, '').replace(/^index$/, '')}`);
  if (urls.length) urls.push(`${SITE}/sitemap.xml`);
}
urls = [...new Set(urls)];
if (!urls.length) { console.log('No changed pages to submit.'); process.exit(0); }

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${SITE}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow responded ${res.status} for ${urls.length} URL(s):\n${urls.join('\n')}`);
if (![200, 202].includes(res.status)) process.exit(1);
