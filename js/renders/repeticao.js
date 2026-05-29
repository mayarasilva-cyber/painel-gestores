// ═══════════════════════════════════════════════
//  RENDER: REPETIÇÃO
// ═══════════════════════════════════════════════

async function renderRepeticao() {
  const { data } = await fetchData('REPETICAO');
  const c = COLS.REPETICAO;

  const all     = filterPeriod(data, c.date);
  const prevAll = filterPrevPeriod(data, c.date);

  const fin  = all.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const rep  = all.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const tot  = fin + rep;
  const pct  = tot > 0 ? (rep/tot*100) : 0;

  const pFin = prevAll.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const pRep = prevAll.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const pTot = pFin + pRep;
  const pPct = pTot > 0 ? (pRep/pTot*100) : 0;

  // SAAS vs TD
  // Classifica pelo campo saaslaudo; se vazio, usa prefixo [Saas] no nome da central
  const isSaasRow = r => {
    const sl = (r[c.saaslaudo]||'').trim();
    if (sl === 'SAAS')   return true;
    if (sl === 'Laudos') return false;
    return (r[c.central]||'').trim().toLowerCase().startsWith('[saas]');
  };
  const saasAll  = all.filter(r => isSaasRow(r));
  const tdAll    = all.filter(r => !isSaasRow(r));
  const saasRep  = saasAll.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const saasFin  = saasAll.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const saasT    = saasRep + saasFin;
  const saasPct  = saasT > 0 ? (saasRep/saasT*100) : 0;
  const tdRep    = tdAll.filter(r => (r[c.modalidade]||'').trim() === 'Repetição').length;
  const tdFin    = tdAll.filter(r => (r[c.modalidade]||'').trim() === 'Finalizado').length;
  const tdT      = tdRep + tdFin;
  const tdPct    = tdT > 0 ? (tdRep/tdT*100) : 0;

  // Motivos
  const repRows = all.filter(r => (r[c.modalidade]||'').trim() === 'Repetição');
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

  // Trend YoY de repetição
  const trend2026 = getMonthlyTrend(data, c.date, rows => {
    const f = rows.filter(r=>(r[c.modalidade]||'').trim()==='Finalizado').length;
    const r2= rows.filter(r=>(r[c.modalidade]||'').trim()==='Repetição').length;
    return (f+r2) > 0 ? parseFloat(((r2/(f+r2))*100).toFixed(2)) : 0;
  });

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
          <div class="rep-stat-label">Finalizados</div>
          <div class="rep-stat-val">${fmtNum(fin)}</div>
          <div class="rep-stat-sub">exames concluídos</div>
        </div>
        <div>
          <div class="rep-stat-label">Repetições</div>
          <div class="rep-stat-val" style="color:var(--red)">${fmtNum(rep)}</div>
          <div class="rep-stat-sub">${fmtPct(pct)} do total</div>
          ${cmpHTML(pct, pPct, true)}
        </div>
        <div>
          <div class="rep-stat-label">SAAS</div>
          <div class="rep-stat-val">${fmtPct(saasPct)}</div>
          <div class="rep-stat-sub">${fmtNum(saasRep)} rep. / ${fmtNum(saasT)} total</div>
        </div>
        <div>
          <div class="rep-stat-label">Laudos (TD)</div>
          <div class="rep-stat-val">${fmtPct(tdPct)}</div>
          <div class="rep-stat-sub">${fmtNum(tdRep)} rep. / ${fmtNum(tdT)} total</div>
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
