// ═══════════════════════════════════════════════
//  RENDER: VISÃO GERAL — KPIs + YoY
// ═══════════════════════════════════════════════

async function renderGeral() {
  const [hR, rR, mR, eR, fR, i25R, i26R] = await Promise.all([
    getHolterMerged(),
    fetchData('REPETICAO'),
    fetchData('MAPA'),
    fetchData('ECG'),
    fetchData('FINANCEIRO'),
    fetchData('INFO_2025'),
    fetchData('INFO_2026'),
  ]);

  const ch = COLS.HOLTER, cm = COLS.MAPA, ce = COLS.ECG, cr = COLS.REPETICAO, cf = COLS.FINANCEIRO;

  // Exames do período atual e anterior
  const hRows = filterPeriod(hR.data, ch.date);
  const mRows = filterPeriod(mR.data, cm.date);
  const eRows = filterPeriod(eR.data, ce.date);
  const hPrev = filterPrevPeriod(hR.data, ch.date);
  const mPrev = filterPrevPeriod(mR.data, cm.date);
  const ePrev = filterPrevPeriod(eR.data, ce.date);
  const tot  = hRows.length + mRows.length + eRows.length;
  const totP = hPrev.length + mPrev.length + ePrev.length;

  // Taxa de repetição
  const repAll  = filterPeriod(rR.data, cr.date);
  const repFin  = repAll.filter(r => (r[cr.modalidade]||'').trim() === 'Finalizado').length;
  const repRep  = repAll.filter(r => (r[cr.modalidade]||'').trim() === 'Repetição').length;
  const repT    = repFin + repRep;
  const repPct  = repT > 0 ? (repRep/repT*100) : 0;
  const repPrev = filterPrevPeriod(rR.data, cr.date);
  const rpFin   = repPrev.filter(r => (r[cr.modalidade]||'').trim() === 'Finalizado').length;
  const rpRep   = repPrev.filter(r => (r[cr.modalidade]||'').trim() === 'Repetição').length;
  const rpT     = rpFin + rpRep;
  const rpPct   = rpT > 0 ? (rpRep/rpT*100) : 0;

  // Financeiro do mês (via INFO_2026 se disponível, senão via FINANCEIRO bruto)
  const ci = COLS.INFO;
  const infoRow = i26R.data.find(r => {
    const mes = (r[ci.mes]||'').toLowerCase();
    return mes.includes(MONTHS[selMonth].toLowerCase().substring(0,3).normalize('NFD').replace(/[̀-ͯ]/g,'').substring(0,3));
  });

  const faturamento = infoRow ? parseNum(infoRow[ci.fat]) : 0;
  const margemBruta = infoRow ? parsePct(infoRow[ci.margem]) : 0;
  const ebitda      = infoRow ? parsePct(infoRow[ci.ebitda]) : 0;
  const lucroLiq    = infoRow ? parseNum(infoRow[ci.lucro]) : 0;

  // INFO_2025 row do mesmo mês
  const info25Row = i25R.data.find(r => {
    const mes = (r[ci.mes]||'').toLowerCase();
    return mes.includes(MONTHS[selMonth].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').substring(0,3));
  });
  const fat25    = info25Row ? parseNum(info25Row[ci.fat])     : 0;
  const margem25 = info25Row ? parsePct(info25Row[ci.margem])  : 0;
  const ecg25    = info25Row ? parseInt(info25Row[ci.ecg])||0  : 0;
  const hol25    = info25Row ? parseInt(info25Row[ci.holter])||0: 0;
  const map25    = info25Row ? parseInt(info25Row[ci.mapa])||0 : 0;
  const te25     = info25Row ? parseInt(info25Row[ci.te])||0   : 0;
  const tot25    = ecg25+hol25+map25+te25;

  // YoY: todos os meses disponíveis
  const filled25 = getInfoFilled(i25R.data);
  const filled26 = getInfoFilled(i26R.data);
  const maxMeses = Math.max(filled25.length, 1);

  const fat25arr  = filled25.map(r => parseNum(r[ci.fat]));
  const fat26arr  = filled26.map(r => parseNum(r[ci.fat]));
  const tot25arr  = filled25.map(r => (parseInt(r[ci.ecg])||0)+(parseInt(r[ci.holter])||0)+(parseInt(r[ci.mapa])||0)+(parseInt(r[ci.te])||0));

  // YoY exames 2026 — puxar dos dados reais (agrupados por mês)
  const tot26arr = MONTHS_SHORT.slice(0, filled26.length).map((_, idx) => {
    const m = idx, y = 2026;
    const h = hR.data.filter(r => { const d = parseDate(r[ch.date]); return d && d.getMonth()===m && d.getFullYear()===y; }).length;
    const mp = mR.data.filter(r => { const d = parseDate(r[cm.date]); return d && d.getMonth()===m && d.getFullYear()===y; }).length;
    const e  = eR.data.filter(r => { const d = parseDate(r[ce.date]); return d && d.getMonth()===m && d.getFullYear()===y; }).length;
    return h + mp + e;
  });

  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">🏠 Visão Geral</div>
        <div class="section-sub">${pLabel()}</div>
      </div>
    </div>

    <!-- KPIs principais -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card navy-card">
        <div class="kpi-label">Exames Laudados</div>
        <div class="kpi-value">${fmtNum(tot)}</div>
        <div class="kpi-sub">Holter + Mapa + ECG</div>
        ${cmpHTML(tot, totP)}
        ${tot25 ? yoyCmpHTML(tot, tot25) : ''}
      </div>
      <div class="kpi-card ${faturamento ? 'cyan-card' : ''}">
        <div class="kpi-label">Faturamento</div>
        <div class="kpi-value" style="${!faturamento?'color:var(--text-soft);font-size:20px':''}">${faturamento ? fmtCurrK(faturamento) : 'Ver Financeiro'}</div>
        <div class="kpi-sub">bruto no período</div>
        ${fat25 ? yoyCmpHTML(faturamento, fat25) : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Margem Bruta</div>
        <div class="kpi-value" style="font-size:28px;color:${margemBruta>50?'var(--green)':margemBruta>30?'var(--amber)':'var(--red)'}">${margemBruta ? fmtPct(margemBruta) : '—'}</div>
        <div class="kpi-sub">receita líquida / faturamento</div>
        ${margem25 ? yoyCmpHTML(margemBruta, margem25) : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa de Repetição</div>
        <div class="kpi-value" style="font-size:28px;color:${repPct>3?'var(--red)':'var(--green)'}">${fmtPct(repPct)}</div>
        <div class="kpi-sub">${fmtNum(repRep)} de ${fmtNum(repT)} exames</div>
        ${cmpHTML(repPct, rpPct, true)}
      </div>
    </div>

    <!-- Setor cards -->
    <div class="section-bar" style="margin-top:8px">
      <div class="section-title" style="font-size:16px">Produção por Modalidade</div>
      <div class="section-sub">${pLabel()}</div>
    </div>
    <div class="overview-grid">
      ${geralSectorCard('HOLTER','📊','Holter',hRows,hPrev,ch,hol25)}
      ${geralSectorCard('MAPA','🩺','Mapa',mRows,mPrev,cm,map25)}
      ${geralSectorCard('ECG','❤️','ECG',eRows,ePrev,ce,ecg25)}
      <div class="overview-sector" onclick="switchTab('REPETICAO')" style="cursor:pointer">
        <div class="sector-header"><span class="sector-emoji">🔁</span><span class="sector-name">Repetição</span></div>
        <div class="sector-kpis">
          <div><div class="sector-kpi-label">Finalizados</div><div class="sector-kpi-val">${fmtNum(repFin)}</div></div>
          <div><div class="sector-kpi-label">Repetições</div><div class="sector-kpi-val" style="color:var(--red)">${fmtNum(repRep)}</div><div class="sector-kpi-sub">${fmtPct(repPct)}</div></div>
        </div>
      </div>
    </div>

    <!-- YoY Charts -->
    <div class="section-bar" style="margin-top:8px">
      <div class="section-title" style="font-size:16px">Comparativo Anual — 2025 vs 2026</div>
    </div>
    <div class="two-col">
      <div class="yoy-wrap">
        <div class="yoy-title">Exames Laudados por Mês</div>
        <div class="yoy-chart">${yoyBarsHTML(tot25arr, tot26arr, v => fmtNum(v))}</div>
      </div>
      <div class="yoy-wrap">
        <div class="yoy-title">Faturamento por Mês</div>
        <div class="yoy-chart">${yoyBarsHTML(fat25arr, fat26arr, v => fmtCurrK(v))}</div>
      </div>
    </div>
  `;
}

function geralSectorCard(tab, emoji, name, rows, prev, c, count25) {
  const saas = rows.filter(r => isSaas(r[c.central])).length;
  const em   = rows.filter(r => (r[c.emerg]||'').toLowerCase() === 'sim').length;
  return `<div class="overview-sector" onclick="switchTab('PRODUCAO')" style="cursor:pointer">
    <div class="sector-header"><span class="sector-emoji">${emoji}</span><span class="sector-name">${name}</span></div>
    <div class="sector-kpis">
      <div>
        <div class="sector-kpi-label">Exames</div>
        <div class="sector-kpi-val">${fmtNum(rows.length)}</div>
        ${cmpHTML(rows.length, prev.length)}
        ${count25 ? yoyCmpHTML(rows.length, count25) : ''}
      </div>
      <div>
        <div class="sector-kpi-label">Média Laudo</div>
        <div class="sector-kpi-val" style="font-size:18px">${fmtHMS(avgSecs(rows, c.tempo))}</div>
      </div>
      <div>
        <div class="sector-kpi-label">SAAS</div>
        <div class="sector-kpi-val" style="font-size:20px">${fmtNum(saas)}</div>
        <div class="sector-kpi-sub">${rows.length ? ((saas/rows.length)*100).toFixed(0) : 0}%</div>
      </div>
      <div>
        <div class="sector-kpi-label">Emergências</div>
        <div class="sector-kpi-val" style="font-size:20px;color:var(--red)">${fmtNum(em)}</div>
      </div>
    </div>
  </div>`;
}
