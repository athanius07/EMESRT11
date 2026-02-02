// netlify/functions/refresh.js
// Scheduled function to refresh the cached dataset weekly
const { getStore } = require('@netlify/blobs');
const { rows: seedRows } = require('./_shared/dataset');
const crypto = require('crypto');

function hash(obj){ return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex'); }
function md5(obj){ return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex'); }

function delta(oldRows, newRows){
  const key = (r)=> `${r.Country}|${r['Jurisdiction/Body']}|${r.Title}|${r.URL}`;
  const oMap = new Map(oldRows.map(r=>[key(r), r]));
  const nMap = new Map(newRows.map(r=>[key(r), r]));
  const added = [...nMap.keys()].filter(k=>!oMap.has(k));
  const removed = [...oMap.keys()].filter(k=>!nMap.has(k));
  const changed = [...nMap.keys()].filter(k=>oMap.has(k) && md5(oMap.get(k)) !== md5(nMap.get(k)));
  return { added, removed, changed };
}

exports.handler = async () => {
  const rows = seedRows();
  const store = getStore({ name: 'emesrt' });
  const prev = await store.get('rows.json', { type: 'json' }) || [];
  let changelog = await store.get('changelog.json', { type: 'json' });
  changelog = Array.isArray(changelog) ? changelog : [];
  const entry = { ts: new Date().toISOString(), count: rows.length, hash: hash(rows), delta: delta(prev, rows) };
  changelog.unshift(entry);
  changelog = changelog.slice(0, 20);
  await Promise.all([
    store.setJSON('rows.json', rows),
    store.setJSON('changelog.json', changelog)
  ]);
  return { statusCode: 200, body: JSON.stringify({ ok: true, count: rows.length, ts: entry.ts }) };
};
