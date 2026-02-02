// netlify/functions/emesrt.js
const crypto = require('crypto');
const { stringify } = require('csv-stringify/sync');
const { getStore } = require('@netlify/blobs');
const { rows: seedRows } = require('./_shared/dataset');

function hash(obj) { return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex'); }
function md5(obj) { return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex'); }

function filterRows(rows, toggles){
  return rows.filter(r => {
    if (r.Type === 'Government mandate' && toggles.mandates) return true;
    if (r.Type === 'Sub-national guidance' && toggles.subnational) return true;
    if (r.Type === 'Industry framework/standard' && toggles.frameworks) return true;
    return false;
  });
}

async function refreshDataset(){
  // Here we could run live scrapers; for reliability we use curated seed first
  const rows = seedRows();
  const store = getStore({ name: 'emesrt' });
  const prevRows = await store.get('rows.json', { type: 'json' });
  const prevHash = prevRows ? hash(prevRows) : '';
  const newHash = hash(rows);
  const diff = delta(prevRows || [], rows);
  let changelog = await store.get('changelog.json', { type: 'json' });
  changelog = Array.isArray(changelog) ? changelog : [];
  const entry = { ts: new Date().toISOString(), count: rows.length, hash: newHash, delta: diff };
  changelog.unshift(entry);
  changelog = changelog.slice(0, 20);
  await Promise.all([
    store.setJSON('rows.json', rows),
    store.setJSON('changelog.json', changelog)
  ]);
  return { rows, changelog, generated_at: entry.ts };
}

function delta(oldRows, newRows){
  const key = (r)=> `${r.Country}|${r['Jurisdiction/Body']}|${r.Title}|${r.URL}`;
  const oMap = new Map(oldRows.map(r=>[key(r), r]));
  const nMap = new Map(newRows.map(r=>[key(r), r]));
  const added = [...nMap.keys()].filter(k=>!oMap.has(k));
  const removed = [...oMap.keys()].filter(k=>!nMap.has(k));
  const changed = [...nMap.keys()].filter(k=>oMap.has(k) && md5(oMap.get(k)) !== md5(nMap.get(k)));
  return { added, removed, changed };
}

exports.handler = async (event) => {
  const qs = new URLSearchParams(event.rawQuery || '');
  const useCached = qs.get('cached') === '1';
  const includeChangelog = qs.get('include_changelog') === '1';
  const wantCSV = qs.get('format') === 'csv';
  const toggles = {
    mandates: qs.get('mandates') !== '0',
    subnational: qs.get('subnational') !== '0',
    frameworks: qs.get('frameworks') !== '0',
  };

  const store = getStore({ name: 'emesrt' });

  let rows = [];
  let changelog = [];
  let generated_at = new Date().toISOString();

  if (useCached){
    const [cachedRows, cachedLog] = await Promise.all([
      store.get('rows.json', { type: 'json' }),
      store.get('changelog.json', { type: 'json' }),
    ]);
    if (Array.isArray(cachedRows) && cachedRows.length){
      rows = cachedRows;
      changelog = Array.isArray(cachedLog) ? cachedLog : [];
      generated_at = changelog?.[0]?.ts || generated_at;
    } else {
      const out = await refreshDataset();
      rows = out.rows; changelog = out.changelog; generated_at = out.generated_at;
    }
  } else {
    const out = await refreshDataset();
    rows = out.rows; changelog = out.changelog; generated_at = out.generated_at;
  }

  const filtered = filterRows(rows, toggles);

  if (wantCSV){
    const headers = Object.keys(filtered[0] || {
      'Jurisdiction/Body': '', Country: '', Title: '', Type: '', 'Publication Date': '', Status: '', 'EMESRT Scope (L7/L8/L9)?': '', URL: '', Notes: ''
    });
    const data = filtered.map(r => headers.map(h => (r[h] ?? '')));
    const csv = stringify([headers, ...data]);
    return { statusCode: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="emesrt_l7l8l9.csv"' }, body: csv };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ generated_at, count: filtered.length, rows: filtered, changelog: includeChangelog ? changelog : undefined })
  };
};
