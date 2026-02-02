let getStore;
try { ({ getStore } = require('@netlify/blobs')); } catch (_) { getStore = null; }

const { rows: seedRows } = require('./_shared/dataset');
const crypto = require('crypto');

function hash(obj){ return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex'); }
function md5(obj){ return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex'); }

function makeNoopStore(){
  let memory = {};
  return {
    async get(key, { type } = {}) {
      const v = memory[key];
      if (!v) return null;
      if (type === 'json') return JSON.parse(v);
      return v;
    },
    async setJSON(key, val){ memory[key] = JSON.stringify(val); },
  };
}

function getSafeStore() {
  if (!getStore) return makeNoopStore();
  try { return getStore({ name: 'emesrt' }); }
  catch (_) { return makeNoopStore(); }
}

function delta(oldRows, newRows){
  const key = (r)=> `${r.Country}|${r['Jurisdiction/Body']}|${r.Title}|${r.URL}`;
  const oMap = new Map(oldRows.map(r=>[key(r), r]));
  const nMap = new Map(newRows.map(r=>[key(r), r]));
  const changed = [...nMap.keys()].filter(k=>oMap.has(k) && md5(oMap.get(k)) !== md5(nMap.get(k)));
  const added   = [...nMap.keys()].filter(k=>!oMap.has(k));
  const removed = [...oMap.keys()].filter(k=>!nMap.has(k));
  return { added, removed, changed };
}

exports.handler = async () => {
  const rows = seedRows();
  const store = getSafeStore();
  const prev = (await store.get('rows.json', { type: 'json' })) || [];
  let changelog = (await store.get('changelog.json', { type: 'json' })) || [];
  const entry = { ts: new Date().toISOString(), count: rows.length, hash: hash(rows), delta: delta(prev, rows) };
  changelog.unshift(entry);
  changelog = changelog.slice(0, 20);
  await Promise.all([
    store.setJSON('rows.json', rows),
    store.setJSON('changelog.json', changelog),
  ]);
  return { statusCode: 200, body: JSON.stringify({ ok: true, count: rows.length, ts: entry.ts }) };
};
``
