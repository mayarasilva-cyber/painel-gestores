// ═══════════════════════════════════════════════
//  FETCH — CSV direto do Google Sheets
// ═══════════════════════════════════════════════

let cache = {};

// ── Cache localStorage (TTL 5 min) ──
const LS_PREFIX  = 'ecgnow-v1-';
const CACHE_TTL  = 5 * 60 * 1000;

function lsGet(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const { ts, rows } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;   // expirado
    return { data: rows };
  } catch { return null; }
}

function lsSet(key, res) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ ts: Date.now(), rows: res.data }));
  } catch {
    // quota excedida: limpa tudo e tenta de novo
    try { Object.keys(CSV_GIDS).forEach(k => localStorage.removeItem(LS_PREFIX + k)); } catch {}
  }
}

function lsClear() {
  try { Object.keys(CSV_GIDS).forEach(k => localStorage.removeItem(LS_PREFIX + k)); } catch {}
}

// Retorna true se ao menos uma chave primária ainda está válida no localStorage
function lsHasData() {
  return ['HOLTER','MAPA','ECG','INFO_2026'].some(k => lsGet(k) !== null);
}

function csvParse(line) {
  const r = []; let c = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i+1] === '"') { c += '"'; i++; }
      else if (ch === '"') q = false;
      else c += ch;
    } else {
      if (ch === '"') q = true;
      else if (ch === ',') { r.push(c.trim()); c = ''; }
      else c += ch;
    }
  }
  r.push(c.trim());
  return r;
}

async function fetchData(key) {
  // 1) cache em memória (mais rápido)
  if (cache[key]) return cache[key];

  // 2) cache em localStorage (persiste entre reloads)
  const lsCached = lsGet(key);
  if (lsCached) { cache[key] = lsCached; return lsCached; }

  // 3) busca no Google Sheets
  const gid = CSV_GIDS[key];
  if (!gid && gid !== '0') throw new Error('GID não encontrado: ' + key);
  const r = await fetch(CSV_BASE + gid);
  if (!r.ok) throw new Error(`HTTP ${r.status} – ${key}`);
  const t = await r.text();
  if (t.trim().startsWith('<!') || t.trim().startsWith('<html')) {
    // Rate limit ou aba não publicada: NÃO cacheia para permitir retry
    console.warn(`${key}: resposta HTML – possível rate limit, não cacheado`);
    return { data: [] };
  }
  const lines = t.split('\n').filter(l => l.trim()), rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = csvParse(lines[i]);
    if (cols.length >= 2) rows.push(cols);
  }
  const res = { data: rows };
  cache[key] = res;
  lsSet(key, res);   // salva no localStorage para próxima abertura
  return res;
}

function clearCache() { cache = {}; lsClear(); }

async function getHolterMerged() {
  const { data: h } = await fetchData('HOLTER');
  let iem = [];
  try { iem = (await fetchData('HOLTER_IEM')).data; } catch (e) {}
  const mapped = iem.map(r => {
    const a = new Array(11).fill('');
    a[0] = 'Não'; a[1] = r[2] || ''; a[4] = ''; a[7] = '[Saas]Alemanha IEM';
    return a;
  });
  return { data: [...h, ...mapped] };
}

// Retorna linha do INFO_20xx para o mês/ano selecionado
function getInfoRow(infoData, month, year) {
  const prefix = MONTHS[month].toLowerCase().replace('ç','c').replace('ã','a').replace('é','e').replace('ê','e').replace('á','a').replace('ú','u').replace('o','o') + '/' + year;
  // tenta match flexível
  return infoData.find(r => {
    const m = (r[0] || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    return m.includes(MONTHS[month].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').substring(0,3));
  }) || null;
}

// Retorna todos os meses preenchidos de um conjunto INFO
function getInfoFilled(infoData) {
  return infoData.filter(r => r[COLS.INFO.fat] && r[COLS.INFO.fat] !== '');
}
