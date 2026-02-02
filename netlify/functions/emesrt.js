const crypto = require('crypto');
const { stringify } = require('csv-stringify/sync');

let getStore;
try { ({ getStore } = require('@netlify/blobs')); } catch (_) { getStore = null; }

const { rows: seedRows } = require('./_shared/dataset');

function hash(obj) { return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex'); }
function md5(obj)  { return crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex'); }

function filterRows(rows, toggles){
  return rows.filter(r => {
    if (r.Type === 'Government mandate' && toggles.mandates) return true;
    if (r.Type === 'Sub-national guidance' && toggles.subnational) return true;
    if (r.Type === 'Industry framework/standard' && toggles.frameworks) return true;
    return false;
  });
}

function makeNoopStore(){
  // in-memory “store” – resets every invocation (no persistence)
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

async function refreshDataset(){
  const rows = seedRows();
  const store = getSafeStore();
  const prevRows = (await store.get('rows.json', { type: 'json' })) || [];
  const diff = delta(prevRows, rows);

  let changelog = (await store.get('changelog.json', { type: 'json' })) || [];
  const entry = { ts: new Date().toISOString(), count: rows.length, hash: hash(rows), delta: diff };
  changelog.unshift(entry);
  changelog = changelog.slice(0, 20);

  await Promise.all([
    store.setJSON('rows.json', rows),
    store.setJSON('changelog.json', changelog),
  ]);

  return { rows, changelog, generated_at: entry.ts };
}

function delta(oldRows, newRows){
  const key = (r)=> `${r.Country}|${r['Jurisdiction/Body']}|${r.Title}|${r.URL}`;
  const oMap = new Map(oldRows.map(r=>[key(r), r]));
  const nMap = new Map(newRows.map(r=>[key(r), r]));
  const added   = [...nMap.keys()].filter(k=>!oMap.has(k));
  const removed = [...oMap.keys()].filter(k=>!nMap.has(k));
  const changed = [...nMap.keys()].filter(k=>oMap.has(k) && md5(oMap.get(k)) !== md5(nMap.get(k)));
  return { added, removed, changed };
}

exports.handler = async (event) => {
  const qs = new URLSearchParams(event.rawQuery || '');
  const useCached        = qs.get('cached') === '1';
  const includeChangelog = qs.get('include_changelog') === '1';
  const wantCSV          = qs.get('format') === 'csv';
  const toggles = {
    mandates:   qs.get('mandates')   !== '0',
    subnational:qs.get('subnational')!== '0',
    frameworks: qs.get('frameworks') !== '0',
  };

  const store = getSafeStore();

  let rows = [];
  let changelog = [];
  let generated_at = new Date().toISOString();

  if (useCached) {
    const [cachedRows, cachedLog] = await Promise.all([
      store.get('rows.json', { type: 'json' }),
      store.get('changelog.json', { type: 'json' }),
    ]);
    if (Array.isArray(cachedRows) && cachedRows.length) {
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
// --- INDIA ---
{
  'Jurisdiction/Body': 'DGMS – Directorate General of Mines Safety',
  Country: 'India',
  Title: 'DGMS (Tech) Circular 06 of 2020 – Safety features for HEMM & heavy/light vehicles in opencast mines',
  Type: 'Government mandate',
  'Publication Date': '2020-02-27',
  Status: 'Circular (design requirements)',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://www.dgms.net/DGMS%28Tech%29%20Circular%2006%20of%202020.pdf',
  Notes: 'Minimum design/functional safety features for HEMM and mine light vehicles (rear-vision camera, fatigue warning, seat-belt reminder, etc.).' // [1](https://www.gov.za/sites/default/files/gcis_document/202212/47790gon2908.pdf)
},
{
  'Jurisdiction/Body': 'Government of India – CMR 2017',
  Country: 'India',
  Title: 'Coal Mines Regulations, 2017 – Reg. 216 (HEMM design, safety features incl. trucks/tippers)',
  Type: 'Government mandate',
  'Publication Date': '2017-11-27',
  Status: 'In force',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM',
  URL: 'https://indiankanoon.org/doc/2092395/',
  Notes: 'Reg. 216 requires all-round visibility for large machines and empowers DGMS to specify safety features for HEMM and trucks/tippers.' // [2](https://emesrt.org/)
},
{
  'Jurisdiction/Body': 'DGMS – Directorate General of Mines Safety',
  Country: 'India',
  Title: 'DGMS (Tech) Circular (20 Nov 2025) – Ensuring safety features in HEMM (G.S.R. 987(E), BIS IS 17055‑6)',
  Type: 'Government mandate',
  'Publication Date': '2025-11-20',
  Status: 'Circular',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://www.dgms.gov.in/writereaddata/UploadFile/circular7New_24112025.pdf',
  Notes: 'Reinforces statutory fitment of safety systems for wheeled trackless transport machinery; cites CMR 2017 Reg. 216(2) and BIS IS 17055‑6:2021 for dumpers/tippers.' // [3](https://schauenburg.co.za/products/collision-avoidance-systems/)
},

// --- EUROPE (EU level) ---
{
  'Jurisdiction/Body': 'European Union',
  Country: 'European Union',
  Title: 'Regulation (EU) 2023/1230 on machinery (replaces 2006/42/EC)',
  Type: 'Government mandate',
  'Publication Date': '2023-06-29',
  Status: 'In force; applicable from 2027-01-20',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM',
  URL: 'https://eur-lex.europa.eu/eli/reg/2023/1230/oj/eng',
  Notes: 'EU product law for machinery (incl. mobile machinery), with updated essential safety requirements and digital/cyber elements.' // [4](https://www.resources.nsw.gov.au/sites/default/files/2023-03/Tony-Egan-ICMM-ICSV-Update-CA-Forum.pdf)
},
{
  'Jurisdiction/Body': 'EU‑OSHA / EU',
  Country: 'European Union',
  Title: 'Directive 2009/104/EC – Use of work equipment (mobile work equipment)',
  Type: 'Government mandate',
  'Publication Date': '2009-09-16',
  Status: 'In force (transposed by Member States)',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://eur-lex.europa.eu/eli/dir/2009/104/oj/eng',
  Notes: 'Employer obligations for safe use of work equipment incl. mobile equipment and lifting equipment (traffic/operation controls on worksites).' // [5](https://www.canlii.org/en/bc/laws/regu/bc-reg-296-97/latest/bc-reg-296-97.html)
},

// --- CHILE ---
{
  'Jurisdiction/Body': 'Ministerio de Minería / SERNAGEOMIN',
  Country: 'Chile',
  Title: 'Reglamento de Seguridad Minera (D.S. N°132) – actualización 2024',
  Type: 'Government mandate',
  'Publication Date': '2024-04-09',
  Status: 'In force (modification to DS 132)',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://www.diariooficial.interior.gob.cl/publicaciones/2024/04/09/43821/01/2475752.pdf',
  Notes: 'National mining safety regulation applied and enforced by SERNAGEOMIN; covers internal transport and operations.' // [6](https://safetyline.wa.gov.au/consultations/draft-code-of-practice-road-and-traffic-management-at-western-australian-mines/)
},

// --- PERU ---
{
  'Jurisdiction/Body': 'Ministerio de Energía y Minas (MINEM)',
  Country: 'Peru',
  Title: 'Reglamento de Seguridad y Salud Ocupacional en Minería (D.S. 024‑2016‑EM + D.S. 023‑2017‑EM) – edición 2024',
  Type: 'Government mandate',
  'Publication Date': '2024-06-04',
  Status: 'In force (consolidated)',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://www.gob.pe/institucion/minem/informes-publicaciones/5631689-reglamento-de-seguridad-y-salud-ocupacional-en-mineria-ed-2024',
  Notes: 'Comprehensive obligations for mine transit, mobile equipment and underground/surface operations.' // [7](https://app.leg.wa.gov/wac/default.aspx?cite=296-59-090)
},

// --- BRAZIL ---
{
  'Jurisdiction/Body': 'Ministério do Trabalho e Emprego',
  Country: 'Brazil',
  Title: 'NR‑22 – Segurança e Saúde Ocupacional na Mineração (2024 update)',
  Type: 'Government mandate',
  'Publication Date': '2024-05-27',
  Status: 'In force',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'HEMM + LVs',
  URL: 'https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes/nr-22-atualizada-2024-2-arq-temporario.pdf',
  Notes: 'Includes sections on circulation/transport, signage and machinery—baseline for traffic management at Brazilian mines.' // [8](https://stacks.cdc.gov/view/cdc/226488/cdc_226488_DS1.pdf)
},

// --- COLOMBIA ---
{
  'Jurisdiction/Body': 'Ministerio de Minas y Energía',
  Country: 'Colombia',
  Title: 'Decreto 1886 de 2015 – Reglamento de Seguridad en las Labores Mineras Subterráneas (Título V: Transporte)',
  Type: 'Government mandate',
  'Publication Date': '2015-09-21',
  Status: 'In force',
  'EMESRT Scope (L7/L8/L9)?': 'General CAS',
  'Vehicle scope': 'Underground transport',
  URL: 'https://www.corpoboyaca.gov.co/cms/wp-content/uploads/2020/12/Decreto-1886-de-2015-Reglamento-Seguridad-Mineria-Subterranea.pdf',
  Notes: 'Underground transport (locomotives, inclined planes, bands); not focused on mine LVs.' // 
}
``
