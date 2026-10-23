#!/usr/bin/env node
/**
 * 直播源可用性检测工具
 *
 * 用法：
 *   node scripts/check-live-source.mjs <m3u-url> [抽样数量]
 *   node scripts/check-live-source.mjs https://example.com/list.m3u 30
 *
 * 输出：频道总数、HTTP(S) 数量、抽样频道中可拉取的比例，以及失败示例。
 */

const url = process.argv[2];
const sampleSize = Number(process.argv[3] || 20);

if (!url) {
  console.error('用法: node scripts/check-live-source.mjs <m3u-url> [抽样数量]');
  process.exit(1);
}

function parsePlaylist(text) {
  const lines = text.split(/\r?\n/);
  const channels = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const name = line.split(',').pop()?.trim() || '';
      const group = /group-title="([^"]*)"/.exec(line)?.[1] || '';
      current = { name, group };
    } else if (line && !line.startsWith('#') && current) {
      current.url = line.trim();
      channels.push(current);
      current = null;
    }
  }
  return channels;
}

function sample(items, count) {
  if (items.length <= count) return items;
  const step = Math.floor(items.length / count);
  return items.filter((_, index) => index % step === 0).slice(0, count);
}

async function probe(channel) {
  try {
    const response = await fetch(channel.url, {
      headers: { 'user-agent': 'Mozilla/5.0', range: 'bytes=0-2048' },
      signal: AbortSignal.timeout(8000),
    });
    if (![200, 206, 301, 302].includes(response.status)) {
      return { ok: false, reason: `HTTP ${response.status}` };
    }
    const body = await response.text();
    return body.length > 0
      ? { ok: true }
      : { ok: false, reason: '空响应' };
  } catch (error) {
    return { ok: false, reason: String(error).split('\n')[0].slice(0, 60) };
  }
}

const response = await fetch(url, {
  headers: { 'user-agent': 'Mozilla/5.0' },
  signal: AbortSignal.timeout(20000),
});
if (!response.ok) {
  console.error(`拉取播放列表失败：HTTP ${response.status}`);
  process.exit(1);
}

const channels = parsePlaylist(await response.text());
const httpChannels = channels.filter((channel) => /^https?:\/\//.test(channel.url));
const httpsChannels = httpChannels.filter((channel) => channel.url.startsWith('https://'));
const picked = sample(httpChannels, sampleSize);

console.log(`播放列表：${url}`);
console.log(`频道总数：${channels.length}（HTTP/HTTPS：${httpChannels.length}，HTTPS：${httpsChannels.length}）`);

const results = [];
for (const channel of picked) {
  results.push({ channel, ...(await probe(channel)) });
}

const ok = results.filter((item) => item.ok);
const rate = picked.length ? Math.round((ok.length / picked.length) * 100) : 0;
console.log(`抽样 ${picked.length} 个频道：可用 ${ok.length} 个（${rate}%）`);

const failures = results.filter((item) => !item.ok);
if (failures.length) {
  console.log('\n不可用示例：');
  for (const failure of failures.slice(0, 8)) {
    console.log(`  - ${failure.channel.name || '(未命名)'} | ${failure.reason} | ${failure.channel.url.slice(0, 90)}`);
  }
}
