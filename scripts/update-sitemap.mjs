// Refreshes <lastmod> in sitemap.xml for every URL listed.
// A page's date is today if its file has uncommitted changes, otherwise the date of its last commit.
// Run from the repo root before committing: node scripts/update-sitemap.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const SITE = 'https://www.completehomerefresh.com';
const today = new Date().toISOString().slice(0, 10);
const xml = readFileSync('sitemap.xml', 'utf8');
const dirty = new Set(
  execSync('git status --porcelain', { encoding: 'utf8' })
    .split('\n').filter(Boolean).map((l) => l.slice(3).trim())
);

function fileFor(url) {
  const path = url.replace(SITE, '').replace(/\/$/, '');
  return path === '' ? 'index.html' : `${path.slice(1)}.html`;
}

const out = xml.replace(/<url>[\s\S]*?<\/url>/g, (block) => {
  const url = /<loc>(.*?)<\/loc>/.exec(block)[1];
  const file = fileFor(url);
  if (!existsSync(file)) return block;
  let date;
  if (dirty.has(file)) date = today;
  else {
    date = execSync(`git log -1 --format=%cs -- "${file}"`, { encoding: 'utf8' }).trim() || today;
  }
  return block.replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${date}</lastmod>`);
});
writeFileSync('sitemap.xml', out);
console.log('sitemap.xml updated');
