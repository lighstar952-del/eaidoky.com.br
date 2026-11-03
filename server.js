import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 10000);
const HANDLE = (process.env.YOUTUBE_HANDLE || '@eaidoky').replace(/^@/, '');
const CACHE_MS = 60_000;
let cache = { at: 0, items: [] };

function decodeXml(s = '') {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function value(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}(?:\s[^>]*)?>([\s\S]*?)<\/${tag}>`, 'i'));
  return m ? decodeXml(m[1].replace(/<[^>]+>/g, '').trim()) : '';
}
function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map(m => {
    const block = m[1];
    const id = value(block, 'yt:videoId');
    if (!id) return null;
    return { id, title: value(block, 'title') || 'Conteúdo do EAIDOKY',
      url: `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: value(block, 'published') };
  }).filter(Boolean);
}
async function getText(url) {
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 EAIDOKYSite/1.0' }, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}
async function channelId() {
  const html = await getText(`https://www.youtube.com/@${encodeURIComponent(HANDLE)}`);
  const m = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) || html.match(/channel_id=\?"(UC[a-zA-Z0-9_-]{22})/);
  if (!m) throw new Error('ID do canal não encontrado');
  return m[1];
}
async function classify(item) {
  // RSS does not expose a reliable Shorts flag; duration is a best-effort approximation.
  try {
    const html = await getText(`https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`);
    const m = html.match(/"lengthSeconds":"(\d+)"/);
    const seconds = m ? Number(m[1]) : null;
    return { ...item, type: seconds !== null && seconds <= 180 ? 'short' : 'live' };
  } catch { return { ...item, type: 'live' }; }
}
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'eaidoky-site' }));
app.get('/api/youtube-feed', async (_req, res) => {
  if (cache.at && Date.now() - cache.at < CACHE_MS) return res.json({ items: cache.items, source: 'youtube-rss', updatedAt: cache.at });
  try {
    const id = await channelId();
    const xml = await getText(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
    const raw = parseFeed(xml).slice(0, 20);
    const items = await Promise.all(raw.map(classify));
    cache = { at: Date.now(), items };
    return res.json({ items, source: 'youtube-rss', updatedAt: cache.at });
  } catch (e) {
    console.error('Falha no feed do YouTube:', e.message);
    return res.json({ items: cache.items, source: 'fallback', updatedAt: cache.at || Date.now(), warning: 'Consulta ao YouTube indisponível no momento.' });
  }
});
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`EAIDOKY rodando na porta ${PORT}`));
