// ═══════════════════════════════════════════════
//  UTILS — Parsing, formatting, filtragem
// ═══════════════════════════════════════════════

// ── State (gerenciado pelo app.js) ──
let selMonth, selYear, viewMode = 'month';

// ── Parse ──
function parseDate(s) {
  if (!s || s === '-') return null;
  s = String(s).trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(+m[3], +m[2]-1, +m[1]);
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNum(s) {
  if (s === '' || s == null || s === '-') return 0;
  if (typeof s === 'number') return s;
  s = String(s);
  if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
  return parseFloat(s.replace(/[R$\s]/g,'').replace(/\./g,'').replace(',','.')) || 0;
}

function parsePct(s) {
  if (!s || s === '-') return 0;
  return parseFloat(String(s).replace('%','').replace(',','.')) || 0;
}

function parseDur(s) {
  if (!s || s === '-' || s === '') return null;
  const p = String(s).split(':');
  if (p.length < 2) return null;
  return (parseFloat(p[0])||0)*3600 + (parseFloat(p[1])||0)*60 + (parseFloat(p[2])||0);
}

// ── Format ──
function fmtCurr(v) {
  if (isNaN(v)) return 'R$ —';
  return v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}

function fmtCurrK(v) {
  if (isNaN(v)) return '—';
  if (Math.abs(v) >= 1e6) return 'R$ ' + (v/1e6).toFixed(2).replace('.',',') + 'M';
  if (Math.abs(v) >= 1e3) return 'R$ ' + (v/1e3).toFixed(1).replace('.',',') + 'k';
  return fmtCurr(v);
}

function fmtNum(n) { return (n || 0).toLocaleString('pt-BR'); }
function fmtPct(v) { return (v || 0).toFixed(1) + '%'; }

function fmtHMS(sec) {
  if (sec === null || isNaN(sec)) return '—';
  const h = Math.floor(sec/3600), m = Math.floor((sec%3600)/60), s = Math.round(sec%60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Helpers ──
function avgSecs(data, col) {
  const v = data.map(r => parseDur(r[col])).filter(x => x !== null && x > 0);
  if (!v.length) return null;
  return v.reduce((a,b) => a+b, 0) / v.length;
}

function isSaas(c) { return c && c.toUpperCase().startsWith('[SAAS]'); }

function topN(data, col, n = 10) {
  const c = {};
  data.forEach(r => { const v = (r[col]||'').trim(); if (v && v !== '-') c[v] = (c[v]||0)+1; });
  return Object.entries(c).sort((a,b) => b[1]-a[1]).slice(0, n);
}

// ── Período ──
function getWeekRange() {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(today); end.setDate(end.getDate()-1);
  const start = new Date(end); start.setDate(start.getDate()-6);
  return { startDate: start, endDate: end };
}

function filterPeriod(data, col) {
  if (viewMode === 'week') {
    const { startDate, endDate } = getWeekRange();
    const st = startDate.getTime(), en = endDate.getTime()+86399999;
    return data.filter(r => { const d = parseDate(r[col]); if (!d) return false; const t = d.getTime(); return t >= st && t <= en; });
  }
  return data.filter(r => { const d = parseDate(r[col]); return d && d.getMonth() === selMonth && d.getFullYear() === selYear; });
}

function filterPrevPeriod(data, col) {
  if (viewMode === 'week') {
    const { startDate } = getWeekRange();
    const prevEnd = new Date(startDate.getTime()-86400000);
    const prevStart = new Date(prevEnd.getTime()-6*86400000);
    const st = prevStart.getTime(), en = prevEnd.getTime()+86399999;
    return data.filter(r => { const d = parseDate(r[col]); if (!d) return false; const t = d.getTime(); return t >= st && t <= en; });
  }
  let pm = selMonth-1, py = selYear; if (pm < 0) { pm = 11; py--; }
  const now = new Date();
  const maxDay = (selYear === now.getFullYear() && selMonth === now.getMonth()) ? now.getDate()-1 : new Date(selYear, selMonth+1, 0).getDate();
  return data.filter(r => { const d = parseDate(r[col]); if (!d || d.getMonth() !== pm || d.getFullYear() !== py) return false; return d.getDate() <= maxDay; });
}

function pLabel() {
  if (viewMode === 'week') {
    const { startDate, endDate } = getWeekRange();
    return `${startDate.getDate()}/${startDate.getMonth()+1} a ${endDate.getDate()}/${endDate.getMonth()+1}`;
  }
  return `${MONTHS[selMonth]} ${selYear}`;
}

function getPrevMonthLabel() {
  let pm = selMonth-1, py = selYear; if (pm < 0) { pm = 11; py--; }
  return MONTHS_SHORT[pm];
}

// ── Comparativos ──
function cmpHTML(cur, prev, invert = false) {
  if (prev === 0 || prev === null || prev === undefined) return '<div class="cmp neutral">—</div>';
  const p = (cur-prev)/prev*100;
  const up = invert ? p < 0 : p > 0;
  const dn = invert ? p > 0 : p < 0;
  const cls = up ? 'up' : dn ? 'down' : 'neutral';
  const ar  = up ? '↑' : dn ? '↓' : '→';
  const ref = viewMode === 'week' ? 'semana ant.' : `${getPrevMonthLabel()} (prop.)`;
  return `<div class="cmp ${cls}">${ar} ${Math.abs(p).toFixed(1)}% vs ${ref}</div>`;
}

function yoyCmpHTML(cur, prev) {
  if (!prev) return '';
  const p = (cur-prev)/prev*100;
  const cls = p > 0 ? 'up' : p < 0 ? 'down' : 'neutral';
  const ar  = p > 0 ? '↑' : p < 0 ? '↓' : '→';
  return `<span class="cmp ${cls}" style="font-size:11px">${ar} ${Math.abs(p).toFixed(1)}% vs 2025</span>`;
}

// ── Financeiro ──
function receitaLiquida(rows, c, campo) {
  let bruta = 0, descontos = 0, impostos = 0;
  rows.filter(r => (r[c.tipo]||'').toLowerCase() === 'entrada').forEach(r => {
    const val = parseNum(r[campo]);
    const cat = (r[c.categoria]||'').trim();
    let liquido = val;
    const temDesconto = CATS_DESCONTO_20.some(p => cat.startsWith(p)) || CATS_SAAS_DESCONTO.some(p => cat.startsWith(p));
    if (temDesconto) { const desc = val*0.20; descontos += desc; liquido -= desc; }
    if (cat.startsWith('1.') || cat.startsWith('3.')) { const imp = liquido*TOTAL_IMPOSTOS; impostos += imp; liquido -= imp; }
    bruta += val;
  });
  return { bruta, descontos, impostos, liquida: bruta-descontos-impostos };
}
