// ═══════════════════════════════════════════════
//  CHARTS — Trend bars, YoY, Ring, Tables
// ═══════════════════════════════════════════════

// ── Trend bars (mensal 2026 ou 4 semanas rolling) ──
function getMonthlyTrend(data, dateCol, countFn) {
  const bars = [];
  let m = 0, y = 2026;
  while (y < selYear || (y === selYear && m <= selMonth)) {
    const mm = m, yy = y;
    const rows = data.filter(r => { const d = parseDate(r[dateCol]); return d && d.getMonth() === mm && d.getFullYear() === yy; });
    const val = countFn ? countFn(rows) : rows.length;
    bars.push({ label: MONTHS_SHORT[mm], value: val, current: mm === selMonth && yy === selYear });
    m++; if (m > 11) { m = 0; y++; }
  }
  return bars;
}

function getWeeklyTrend(data, dateCol, countFn) {
  const today = new Date(); today.setHours(0,0,0,0);
  const bars = [];
  for (let w = 3; w >= 0; w--) {
    const end   = new Date(today.getTime()-(1+w*7)*86400000);
    const start = new Date(end.getTime()-6*86400000);
    const st = start.getTime(), en = end.getTime()+86399999;
    const rows = data.filter(r => { const d = parseDate(r[dateCol]); if (!d) return false; const t = d.getTime(); return t >= st && t <= en; });
    const val = countFn ? countFn(rows) : rows.length;
    bars.push({ label: `${start.getDate()}/${start.getMonth()+1}`, value: val, current: w === 0 });
  }
  return bars;
}

function getTrend(data, dateCol, countFn) {
  return viewMode === 'month' ? getMonthlyTrend(data, dateCol, countFn) : getWeeklyTrend(data, dateCol, countFn);
}

function sparkHTML(bars) {
  if (!bars.length) return '';
  const mx = Math.max(...bars.map(b => b.value), 1);
  return `<div class="trend">${bars.map(b => {
    const h = Math.max((b.value/mx)*100, 4);
    const cls = b.current ? 'trend-bar-current' : 'trend-bar-default';
    const valStr = b.value >= 1000 ? (b.value/1000).toFixed(1)+'k' : fmtNum(b.value);
    return `<div class="trend-bar ${cls}" style="height:${h}%" title="${b.label}: ${fmtNum(b.value)}"><span class="trend-bar-val">${valStr}</span><span class="trend-bar-lbl">${b.label}</span></div>`;
  }).join('')}</div>`;
}

// ── YoY grouped bars: 2025 (navy) vs 2026 (cyan) ──
function yoyBarsHTML(vals25, vals26, fmtFn) {
  const n = Math.max(vals26.length, 1);
  const start  = Math.max(0, n - 6);
  const sl25   = vals25.slice(start, start + 6);
  const sl26   = vals26.slice(start, start + 6);
  const months = MONTHS_SHORT.slice(start, start + sl26.length);

  const all = [...sl25, ...sl26].filter(v => v > 0);
  if (!all.length) return '<p class="no-data">Sem dados comparativos</p>';
  const mx  = Math.max(...all, 1);
  const fmt = fmtFn || (v => fmtNum(v));

  const lbl = v => {
    if (!v) return '';
    if (fmtFn) return fmtFn(v);
    return v >= 1000 ? (Math.round(v / 100) / 10) + 'k' : String(v);
  };

  return `
    <div class="yoy-legend">
      <span class="yoy-dot" style="background:var(--navy)"></span><span>2025</span>
      <span class="yoy-dot" style="background:var(--cyan)"></span><span>2026</span>
    </div>
    <div class="yoy-bars">
      ${months.map((mo, i) => {
        const v5 = sl25[i] || 0, v6 = sl26[i] || 0;
        const h5 = v5 > 0 ? Math.max((v5 / mx) * 100, 4) : 0;
        const h6 = v6 > 0 ? Math.max((v6 / mx) * 100, 4) : 0;
        const delta  = (v5 > 0 && v6 > 0) ? ((v6 - v5) / v5 * 100) : null;
        const dHtml  = delta !== null
          ? `<div class="yoy-delta ${delta >= 0 ? 'yoy-up' : 'yoy-dn'}">${delta >= 0 ? '▲' : '▼'}${Math.abs(delta).toFixed(0)}%</div>`
          : '';
        return `<div class="yoy-group">
          <div class="yoy-pair">
            <div class="yoy-bwrap" style="height:${h5}%" title="2025 ${mo}: ${fmt(v5)}">
              <span class="yoy-val">${lbl(v5)}</span>
              <div class="yoy-bar" style="background:var(--navy)"></div>
            </div>
            <div class="yoy-bwrap" style="height:${h6}%" title="2026 ${mo}: ${fmt(v6)}">
              <span class="yoy-val yoy-val-cur">${lbl(v6)}</span>
              <div class="yoy-bar" style="background:var(--cyan)"></div>
            </div>
          </div>
          <div class="yoy-lbl">${mo}</div>
          ${dHtml}
        </div>`;
      }).join('')}
    </div>`;
}

// ── Ring SVG ──
function ringHTML(pct, size = 110, color = null) {
  const c = color || (pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--red)');
  const circ = 2 * Math.PI * 50;
  const off  = circ - (pct/100)*circ;
  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" style="transform:rotate(-90deg)">
    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>
    <circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="10"
      stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
  </svg>`;
}

// ── Table helper ──
function mkTable(arr, mx, tot, showPct = true) {
  if (!arr.length) return '<p class="no-data">Sem dados.</p>';
  return `<table>
    <thead><tr><th>#</th><th>Nome</th><th style="width:80px"></th><th style="text-align:right">Qtd</th>${showPct ? '<th style="text-align:right;padding-left:6px">%</th>' : ''}</tr></thead>
    <tbody>${arr.map(([n, cnt], i) => `<tr>
      <td class="td-rank">${i+1}</td>
      <td class="td-name" title="${esc(n)}">${esc(n)}</td>
      <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(cnt/mx*100).toFixed(0)}%"></div></div></td>
      <td class="td-count">${fmtNum(cnt)}</td>
      ${showPct ? `<td class="td-pct">${((cnt/tot)*100).toFixed(1)}%</td>` : ''}
    </tr>`).join('')}</tbody>
  </table>`;
}

// ── Margem por modalidade: barras horizontais ──
function margemModHTML(items) {
  // items = [{label, pct, receita, cor}]
  const mx = Math.max(...items.map(i => i.pct), 1);
  return `<div class="margem-list">
    ${items.map(item => `
      <div class="margem-row">
        <div class="margem-header">
          <span class="margem-label">${esc(item.label)}</span>
          <span class="margem-pct" style="color:${item.cor || 'var(--navy)'}">${fmtPct(item.pct)}</span>
        </div>
        <div class="margem-bar-bg">
          <div class="margem-bar-fill" style="width:${(item.pct/100*100).toFixed(1)}%;background:${item.cor || 'var(--cyan)'}"></div>
        </div>
        <div class="margem-detail">${item.detalhe || ''}</div>
      </div>
    `).join('')}
  </div>`;
}
