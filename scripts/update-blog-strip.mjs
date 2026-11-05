// Rebuilds the "Latest from the blog" strip on the home page from the newest posts in /blog.
// Reads each post's JSON-LD headline + datePublished, meta description and og:image.
// Run from the repo root before committing: node scripts/update-blog-strip.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const SITE = 'https://www.completehomerefresh.com';
const COUNT = 3;
const START = '<!-- BLOG-STRIP:START -->';
const END = '<!-- BLOG-STRIP:END -->';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const posts = readdirSync('blog').filter((f) => f.endsWith('.html')).map((f) => {
  const t = readFileSync(`blog/${f}`, 'utf8');
  const headline = /"headline"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(t)?.[1];
  const date = /"datePublished"\s*:\s*"([^"]+)"/.exec(t)?.[1];
  const desc = /<meta name="description" content="([^"]*)"/.exec(t)?.[1];
  const img = /property="og:image" content="([^"]*)"/.exec(t)?.[1] || '';
  if (!headline || !date || !desc) throw new Error(`Missing headline/date/description in blog/${f}`);
  return { slug: f.replace(/\.html$/, ''), headline: JSON.parse(`"${headline}"`), date, desc: unesc(desc), img: img.replace(SITE, '') };
}).sort((a, b) => b.date.localeCompare(a.date)).slice(0, COUNT);

const card = (p) => {
  const [y, m] = p.date.split('-');
  const photo = p.img && !p.img.endsWith('Logo.png')
    ? `<a href="/blog/${p.slug}" tabindex="-1" aria-hidden="true"><img src="${p.img}" alt="" loading="lazy" class="w-full h-48 object-cover"></a>`
    : `<a href="/blog/${p.slug}" tabindex="-1" aria-hidden="true" class="flex items-center justify-center h-48" style="background:linear-gradient(135deg,#0A3530,#0D9488)"><i class="fas fa-home text-white text-5xl opacity-60"></i></a>`;
  return `      <article class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col">
        ${photo}
        <div class="p-6 flex flex-col flex-grow">
          <span class="text-xs text-gray-400 mb-2">${MONTHS[Number(m) - 1]} ${y}</span>
          <h3 class="font-heading text-xl font-bold text-gray-900 mb-3 leading-snug"><a href="/blog/${p.slug}" class="hover:text-teal-700 transition-colors">${esc(p.headline)}</a></h3>
          <p class="text-gray-600 text-sm leading-relaxed flex-grow">${esc(p.desc)}</p>
          <a href="/blog/${p.slug}" class="inline-flex items-center gap-2 mt-4 text-sm font-bold" style="color:#0D9488">Read More <i class="fas fa-arrow-right text-xs"></i></a>
        </div>
      </article>`;
};

const block = `${START}
<section class="py-20 bg-white" id="latest-from-the-blog">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <p class="text-sm font-semibold uppercase tracking-widest mb-3" style="color:#0D9488">From the Blog</p>
      <h2 class="font-heading text-4xl font-bold text-gray-900 mb-3">Latest from the Blog</h2>
      <p class="text-gray-500 text-lg max-w-2xl mx-auto">Practical tips for Tampa Bay sellers, agents, and property managers.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
${posts.map(card).join('\n')}
    </div>
    <p class="text-center mt-10"><a href="/blog" class="text-sm font-bold underline" style="color:#0D9488">See all posts &rarr;</a></p>
  </div>
</section>
${END}`;

let html = readFileSync('index.html', 'utf8');
if (html.includes(START)) {
  html = html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), () => block);
} else {
  const marker = '<!-- ================================================================\n     CONTACT';
  if (!html.includes(marker)) throw new Error('Could not find the CONTACT marker in index.html');
  html = html.replace(marker, () => `${block}\n\n\n${marker}`);
}
writeFileSync('index.html', html);
console.log('index.html blog strip updated:', posts.map((p) => p.slug).join(', '));
