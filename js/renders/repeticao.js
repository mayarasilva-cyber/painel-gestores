// ═══════════════════════════════════════════════
//  RENDER: REPETIÇÃO
// ═══════════════════════════════════════════════

async function renderRepeticao() {
  const [{ data }, hR, i26R] = await Promise.all([
    fetchData('REPETICAO'),
    getHolterMerged(),
    fetchData('INFO_2026'),
  ]);
  const c  = COLS.REPETICAO;
  const ch = COLS.HOLTER;

  const all     = filterPeriod(data, c.date);
  const prevAll = filterPrevPeriod(data, c.date);

  const fin  = all.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const rep  = all.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const tot  = fin + rep;   // exames já processados no sistema de QA

  // Denominador real: total de Holter solicitados no período (mesma coluna de data que a planilha de Repetição usa)
  const holterTotal = filterPeriod(hR.data, ch.dateSolic).length;
  const pct  = holterTotal > 0 ? (rep / holterTotal * 100) : (tot > 0 ? rep/tot*100 : 0);

  const pFin = prevAll.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const pRep = prevAll.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const pTot = pFin + pRep;

  // Denominador do mês anterior via INFO_2026 com fator proporcional (tabela bruta incompleta)
  const pPct = (() => {
    const _ci = COLS.INFO;
    const _now2 = new Date();
    const _isCurrentMonth = selYear === _now2.getFullYear() && selMonth === _now2.getMonth();
    const _daysElapsed = _isCurrentMonth ? _now2.getDate() - 1 : new Date(selYear, selMonth + 1, 0).getDate();
    let _pm = selMonth - 1, _py = selYear; if (_pm < 0) { _pm = 11; _py--; }
    const _daysInPrevMonth = new Date(_py, _pm + 1, 0).getDate();
    const _propFactor = _daysInPrevMonth > 0 ? _daysElapsed / _daysInPrevMonth : 1;
    const _info26Prev = i26R.data.find(r => matchInfoMonth(r, _pm));
    const _holterPrevProp = _info26Prev
      ? Math.round(parseIntBR(_info26Prev[_ci.holter]) * _propFactor)
      : filterPrevPeriod(hR.data, ch.dateSolic).length;
    return _holterPrevProp > 0 ? (pRep / _holterPrevProp * 100) : (pTot > 0 ? pRep/pTot*100 : 0);
  })();

  // SAAS vs TD — proporção das repetições (não taxa interna de cada segmento)
  const isSaasRow = r => {
    const sl = (r[c.saaslaudo]||'').trim();
    if (sl === 'SAAS')   return true;
    if (sl === 'Laudos') return false;
    return (r[c.central]||'').trim().toLowerCase().startsWith('[saas]');
  };
  const repRows  = all.filter(r => (r[c.modalidade]||'').trim() === 'Repetição');
  const saasRep  = repRows.filter(r => isSaasRow(r)).length;
  const tdRep    = repRows.filter(r => !isSaasRow(r)).length;
  // % de cada segmento dentro do total de repetições
  const saasRepPct = rep > 0 ? (saasRep / rep * 100) : 0;
  const tdRepPct   = rep > 0 ? (tdRep   / rep * 100) : 0;

  // Motivos
  const motMap  = {};
  repRows.forEach(r => { const m = (r[c.motivo]||'').trim(); if (m && m !== '-') motMap[m] = (motMap[m]||0)+1; });
  const topMot  = Object.entries(motMap).sort((a,b) => b[1]-a[1]);
  const mxM     = topMot[0]?.[1] || 1;

  // Top centrais com repetição (por volume)
  const topCR = topN(repRows, c.central, 8);
  const mxC   = topCR[0]?.[1] || 1;

  // Top centrais com maior % de repetição (mín. 10 exames para ser relevante)
  const centralMap = {};
  all.forEach(r => {
    const nome = (r[c.central]||'').trim();
    if (!nome) return;
    if (!centralMap[nome]) centralMap[nome] = { tot: 0, rep: 0 };
    centralMap[nome].tot++;
    if ((r[c.modalidade]||'').trim() === 'Repetição') centralMap[nome].rep++;
  });
  const topCRpct = Object.entries(centralMap)
    .filter(([, v]) => v.tot >= 10)
    .map(([nome, v]) => ({ nome, rep: v.rep, tot: v.tot, pct: v.rep / v.tot * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);
  const mxCPct = topCRpct[0]?.pct || 1;

  // Trend mensal: rep / holterSolicitados (mesmo denominador do hero)
  const trend2026 = (() => {
    const bars = [];
    let m = 0, y = 2026;
    while (y < selYear || (y === selYear && m <= selMonth)) {
      const mm = m, yy = y;
      const holterM = hR.data.filter(r => { const d = parseDate(r[ch.dateSolic]); return d && d.getMonth()===mm && d.getFullYear()===yy; }).length;
      const repM    = data.filter(r => { const d = parseDate(r[c.date]); return d && d.getMonth()===mm && d.getFullYear()===yy && (r[c.modalidade]||'').trim()==='Repetição'; }).length;
      const val = holterM > 0 ? parseFloat((repM / holterM * 100).toFixed(2)) : 0;
      bars.push({ label: MONTHS_SHORT[mm], value: val, current: mm === selMonth && yy === selYear });
      m++; if (m > 11) { m = 0; y++; }
    }
    return bars;
  })();

  const circ = 2*Math.PI*50;
  const off  = circ - (pct/100)*circ;
  const cor  = pct > 3 ? 'var(--red)' : 'var(--cyan)';

  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">🔁 Taxa de Repetição</div>
        <div class="section-sub">${pLabel()}</div>
      </div>
    </div>

    <!-- Hero ring -->
    <div class="rep-hero">
      <div class="rep-ring-wrap">
        <svg class="rep-ring-svg" width="130" height="130" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="${cor}" stroke-width="10"
            stroke-dasharray="${circ}" stroke-dashoffset="${off}" stroke-linecap="round"/>
        </svg>
        <div class="rep-ring-text">
          <div class="rep-ring-num" style="color:${cor}">${fmtPct(pct)}</div>
          <div class="rep-ring-label">Repetição</div>
        </div>
      </div>
      <div class="rep-stats">
        <div>
          <div class="rep-stat-label">Holter Solicitados</div>
          <div class="rep-stat-val">${fmtNum(holterTotal)}</div>
          <div class="rep-stat-sub">exames no período</div>
        </div>
        <div>
          <div class="rep-stat-label">Repetições</div>
          <div class="rep-stat-val" style="color:var(--red)">${fmtNum(rep)}</div>
          <div class="rep-stat-sub">${fmtPct(pct)} do total solicitado</div>
          ${cmpHTML(pct, pPct, true)}
        </div>
        <div>
          <div class="rep-stat-label">SAAS</div>
          <div class="rep-stat-val">${fmtNum(saasRep)}</div>
          <div class="rep-stat-sub">${fmtPct(saasRepPct)} das repetições</div>
        </div>
        <div>
          <div class="rep-stat-label">TD</div>
          <div class="rep-stat-val">${fmtNum(tdRep)}</div>
          <div class="rep-stat-sub">${fmtPct(tdRepPct)} das repetições</div>
        </div>
      </div>
    </div>

    <!-- Motivos e centrais -->
    <div class="tables-grid">
      <div class="card">
        <div class="card-title">⚠️ Motivos de Repetição</div>
        ${!topMot.length ? '<p class="no-data">Sem repetições no período.</p>' : `
        <table>
          <thead><tr><th>#</th><th>Motivo</th><th style="width:80px"></th><th style="text-align:right">Qtd</th><th style="text-align:right;padding-left:6px">%</th></tr></thead>
          <tbody>${topMot.map(([n, cnt], i) => `<tr>
            <td class="td-rank">${i+1}</td>
            <td class="td-name">${esc(n)}</td>
            <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(cnt/mxM*100).toFixed(0)}%;background:linear-gradient(90deg,var(--red),#f87171)"></div></div></td>
            <td class="td-count">${fmtNum(cnt)}</td>
            <td class="td-pct">${rep > 0 ? ((cnt/rep)*100).toFixed(1) : 0}%</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
      <div class="card">
        <div class="card-title">🏢 Centrais com Mais Repetições</div>
        ${!topCR.length ? '<p class="no-data">Sem dados.</p>' : `
        <table>
          <thead><tr><th>#</th><th>Central</th><th style="width:80px"></th><th style="text-align:right">Qtd</th></tr></thead>
          <tbody>${topCR.map(([n, cnt], i) => `<tr>
            <td class="td-rank">${i+1}</td>
            <td class="td-name" title="${esc(n)}">${esc(n)}</td>
            <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(cnt/mxC*100).toFixed(0)}%;background:linear-gradient(90deg,var(--amber),#fbbf24)"></div></div></td>
            <td class="td-count">${fmtNum(cnt)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>

    <!-- Centrais com maior % de repetição -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">📊 Centrais com Maior % de Repetição <span style="font-size:11px;font-weight:400;color:var(--text-soft)">(mín. 10 exames no período)</span></div>
      ${!topCRpct.length ? '<p class="no-data">Sem dados suficientes.</p>' : `
      <table>
        <thead><tr><th>#</th><th>Central</th><th style="width:100px"></th><th style="text-align:right">Taxa</th><th style="text-align:right;padding-left:6px">Rep.</th><th style="text-align:right;padding-left:6px">Total</th></tr></thead>
        <tbody>${topCRpct.map((d, i) => `<tr>
          <td class="td-rank">${i+1}</td>
          <td class="td-name" title="${esc(d.nome)}">${esc(d.nome)}</td>
          <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(d.pct/mxCPct*100).toFixed(0)}%;background:linear-gradient(90deg,var(--red),#f87171)"></div></div></td>
          <td class="td-count" style="color:var(--red);font-weight:700">${d.pct.toFixed(1)}%</td>
          <td class="td-count">${fmtNum(d.rep)}</td>
          <td class="td-count" style="color:var(--text-soft)">${fmtNum(d.tot)}</td>
        </tr>`).join('')}</tbody>
      </table>`}
    </div>

    <!-- Tendência mensal 2026 -->
    <div class="yoy-wrap">
      <div class="yoy-title">Taxa de Repetição Mensal 2026 (%)</div>
      ${sparkHTML(trend2026)}
    </div>
  `;
}
