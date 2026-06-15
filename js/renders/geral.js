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

  // Exames do período atual — por solicitação (col B) e conclusão (col C)
  const hRows = filterPeriod(hR.data, ch.dateSolic);
  const mRows = filterPeriod(mR.data, cm.dateSolic);
  const eRows = filterPeriod(eR.data, ce.dateSolic);
  const hConc = filterPeriod(hR.data, ch.dateConc);
  const mConc = filterPeriod(mR.data, cm.dateConc);
  const eConc = filterPeriod(eR.data, ce.dateConc);
  const hPrev = filterPrevPeriod(hR.data, ch.dateSolic);
  const mPrev = filterPrevPeriod(mR.data, cm.dateSolic);
  const ePrev = filterPrevPeriod(eR.data, ce.dateSolic);
  const hPrevConc = filterPrevPeriod(hR.data, ch.dateConc);
  const mPrevConc = filterPrevPeriod(mR.data, cm.dateConc);
  const ePrevConc = filterPrevPeriod(eR.data, ce.dateConc);
  const tot     = hRows.length + mRows.length + eRows.length;   // solicitados
  const totConc = hConc.length + mConc.length + eConc.length;   // concluídos
  const totP    = hPrev.length + mPrev.length + ePrev.length;
  const totPConc= hPrevConc.length + mPrevConc.length + ePrevConc.length;

  // Taxa de repetição — denominador = total Holter solicitados (mesma data que REPETICAO usa)
  const repAll  = filterPeriod(rR.data, cr.date);
  const repFin  = repAll.filter(r => (r[cr.modalidade]||'').trim() === 'Finalizado').length;
  const repRep  = repAll.filter(r => (r[cr.modalidade]||'').trim() === 'Repetição').length;
  const repT    = repFin + repRep;
  const repPct  = hRows.length > 0 ? (repRep / hRows.length * 100) : (repT > 0 ? repRep/repT*100 : 0);
  const repPrev = filterPrevPeriod(rR.data, cr.date);
  const rpRep   = repPrev.filter(r => (r[cr.modalidade]||'').trim() === 'Repetição').length;
  // Denominador do mês anterior via INFO_2026 com fator proporcional (tabela bruta incompleta)
  const rpPct = (() => {
    const _ci = COLS.INFO;
    const _now = new Date();
    const _isCurrentMonth = selYear === _now.getFullYear() && selMonth === _now.getMonth();
    const _daysElapsed = _isCurrentMonth ? _now.getDate() - 1 : new Date(selYear, selMonth + 1, 0).getDate();
    let _pm = selMonth - 1, _py = selYear; if (_pm < 0) { _pm = 11; _py--; }
    const _daysInPrevMonth = new Date(_py, _pm + 1, 0).getDate();
    const _propFactor = _daysInPrevMonth > 0 ? _daysElapsed / _daysInPrevMonth : 1;
    const _info26Prev = i26R.data.find(r => matchInfoMonth(r, _pm));
    const _holterPrevProp = _info26Prev
      ? Math.round(parseIntBR(_info26Prev[_ci.holter]) * _propFactor)
      : hPrev.length;
    return _holterPrevProp > 0 ? (rpRep / _holterPrevProp * 100) : 0;
  })();

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
  const ecg25    = info25Row ? parseIntBR(info25Row[ci.ecg])   : 0;
  const hol25    = info25Row ? parseIntBR(info25Row[ci.holter]): 0;
  const map25    = info25Row ? parseIntBR(info25Row[ci.mapa])  : 0;
  const te25     = info25Row ? parseIntBR(info25Row[ci.te])    : 0;
  const tot25    = ecg25+hol25+map25+te25;

  // YoY: todos os meses disponíveis
  const filled25 = getInfoFilled(i25R.data);
  const filled26 = getInfoFilled(i26R.data);
  const maxMeses = Math.max(filled25.length, 1);

  const fat25arr  = filled25.map(r => parseNum(r[ci.fat]));
  const fat26arr  = filled26.map(r => parseNum(r[ci.fat]));
  const tot25arr  = filled25.map(r => parseIntBR(r[ci.ecg])+parseIntBR(r[ci.holter])+parseIntBR(r[ci.mapa])+parseIntBR(r[ci.te]));

  // YoY exames 2026 — INFO-aware: meses fechados via INFORMAÇÕES_2026, mês corrente ao vivo
  const hol26arr = infoTrendArr(filled26, ci.holter, hR.data, ch.dateConc);
  const map26arr = infoTrendArr(filled26, ci.mapa,   mR.data, cm.dateConc);
  const ecg26arr = infoTrendArr(filled26, ci.ecg,    eR.data, ce.dateConc);
  const tot26arr = hol26arr.map((v, i) => v + (map26arr[i] || 0) + (ecg26arr[i] || 0));

  // Hero executivo — financeiro do mês selecionado se fechado, senão último mês fechado
  const heroRow  = faturamento ? infoRow : (filled26[filled26.length - 1] || null);
  const heroIdx  = heroRow ? infoMonthIdxFor(heroRow) : selMonth;
  const heroRow25 = filled25.find(r => infoMonthIdxFor(r) === heroIdx) || null;
  const heroEmAndamento = !faturamento && heroRow;

  // Mês corrente (incompleto): comparativos mês-a-mês / YoY de exames seriam parcial-vs-cheio → enganosos
  const hoje = new Date();
  const isMesCorrente = selMonth === hoje.getMonth() && selYear === hoje.getFullYear();

  document.getElementById('mainContent').innerHTML = `
    ${geralExecHero(heroRow, heroIdx, heroRow25, heroEmAndamento)}

    <div class="section-bar">
      <div>
        <div class="section-title">🏠 Visão Geral</div>
        <div class="section-sub">${pLabel()}</div>
      </div>
    </div>

    <!-- KPIs principais -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card navy-card">
        <div class="kpi-label">Exames Concluídos</div>
        <div class="kpi-value">${fmtNum(totConc)}</div>
        <div class="kpi-sub" style="display:flex;gap:10px;flex-wrap:wrap">
          <span>📋 Solicitados: <strong>${fmtNum(tot)}</strong></span>
        </div>
        ${isMesCorrente
          ? `<div class="cmp neutral">🔵 mês em andamento</div>`
          : `${cmpHTML(totConc, totPConc)}${tot25 ? yoyCmpHTML(totConc, tot25) : ''}`}
      </div>
      <div class="kpi-card ${faturamento ? 'cyan-card' : ''}">
        <div class="kpi-label">Faturamento</div>
        <div class="kpi-value" style="${!faturamento?'color:var(--text-soft);font-size:20px':''}">${faturamento ? fmtCurrK(faturamento) : 'Ver Financeiro'}</div>
        <div class="kpi-sub">bruto no período</div>
        ${(faturamento && fat25) ? yoyCmpHTML(faturamento, fat25) : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Margem Bruta</div>
        <div class="kpi-value" style="font-size:28px;color:${margemBruta>50?'var(--green)':margemBruta>30?'var(--amber)':'var(--red)'}">${margemBruta ? fmtPct(margemBruta) : '—'}</div>
        <div class="kpi-sub">receita líquida / faturamento</div>
        ${(margemBruta && margem25) ? yoyCmpHTML(margemBruta, margem25) : ''}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Taxa de Repetição</div>
        <div class="kpi-value" style="font-size:28px;color:${repPct>3?'var(--red)':'var(--green)'}">${fmtPct(repPct)}</div>
        <div class="kpi-sub">${fmtNum(repRep)} de ${fmtNum(hRows.length)} holters</div>
        ${cmpHTML(repPct, rpPct, true)}
      </div>
    </div>

    <!-- Setor cards -->
    <div class="section-bar" style="margin-top:8px">
      <div class="section-title" style="font-size:16px">Produção por Modalidade</div>
      <div class="section-sub">${pLabel()}</div>
    </div>
    <div class="overview-grid">
      ${geralSectorCard('HOLTER','📊','Holter',hRows,hPrev,ch,hol25,hConc,isMesCorrente)}
      ${geralSectorCard('MAPA','🩺','Mapa',mRows,mPrev,cm,map25,mConc,isMesCorrente)}
      ${geralSectorCard('ECG','❤️','ECG',eRows,ePrev,ce,ecg25,eConc,isMesCorrente)}
      <div class="overview-sector" onclick="switchTab('REPETICAO')" style="cursor:pointer">
        <div class="sector-header"><span class="sector-emoji">🔁</span><span class="sector-name">Repetição</span></div>
        <div class="sector-kpis">
          <div><div class="sector-kpi-label">Holter Solic.</div><div class="sector-kpi-val">${fmtNum(hRows.length)}</div></div>
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

// ── Hero executivo · escopo .exec-* · dados ao vivo / INFO ──
function execDelta(cur, prev, invert = false) {
  if (!prev || !cur) return '';
  const d = (cur - prev) / prev * 100;
  const positivo = d >= 0;
  const bom = invert ? !positivo : positivo;
  return `<span class="exec-d ${Math.abs(d) < 0.05 ? 'flat' : (bom ? 'up' : 'down')}">${positivo ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}% <small>vs 2025</small></span>`;
}

function geralExecHero(row, monthIdx, row25, emAndamento) {
  const ci = COLS.INFO;
  if (!row) return '';

  const faturamento = parseNum(row[ci.fat]);
  const margemBruta = parsePct(row[ci.margem]);
  const ebitda      = parsePct(row[ci.ebitda]);
  const lucroLiq    = parseNum(row[ci.lucro]);
  const exames      = parseIntBR(row[ci.holter]) + parseIntBR(row[ci.mapa]) + parseIntBR(row[ci.ecg]) + parseIntBR(row[ci.te]);

  const fat25    = row25 ? parseNum(row25[ci.fat])     : 0;
  const margem25 = row25 ? parsePct(row25[ci.margem])  : 0;
  const exames25 = row25 ? (parseIntBR(row25[ci.holter]) + parseIntBR(row25[ci.mapa]) + parseIntBR(row25[ci.ecg]) + parseIntBR(row25[ci.te])) : 0;

  const mesLabel = `${MONTHS[monthIdx]} ${selYear}`;
  const kicker = emAndamento
    ? `Resumo Executivo · Último mês fechado`
    : `Resumo Executivo · Controladoria 2026`;

  // Veredito orientado a dados
  let verdict;
  if (lucroLiq < 0)                          verdict = 'Atenção: resultado líquido negativo no mês — revisar estrutura de custos.';
  else if (ebitda >= 20 && margemBruta >= 50) verdict = 'Mês saudável: margens dentro da meta e geração de caixa operacional consistente.';
  else if (margemBruta >= 40)                verdict = 'Resultado dentro do esperado; acompanhar a evolução das margens.';
  else                                       verdict = 'Margens pressionadas no período — atenção ao mix de custos e despesas.';

  return `<div class="exec-hero">
    <div class="exec-left">
      <div class="exec-kicker">${kicker}</div>
      <div class="exec-title">${mesLabel}</div>
      <div class="exec-verdict">${verdict}</div>
      <div class="exec-fat-label">Faturamento Bruto · Realizado</div>
      <div class="exec-fat">${faturamento ? fmtCurrK(faturamento) : '—'}</div>
      ${fat25 ? execDelta(faturamento, fat25) : ''}
    </div>
    <div class="exec-stats">
      <div class="exec-stat">
        <div class="l">EBITDA</div>
        <div class="v">${ebitda ? fmtPct(ebitda) : '—'}</div>
      </div>
      <div class="exec-stat">
        <div class="l">Margem Bruta</div>
        <div class="v">${margemBruta ? fmtPct(margemBruta) : '—'}</div>
        ${margem25 ? execDelta(margemBruta, margem25) : ''}
      </div>
      <div class="exec-stat">
        <div class="l">Lucro Líquido</div>
        <div class="v">${lucroLiq ? fmtCurrK(lucroLiq) : '—'}</div>
      </div>
      <div class="exec-stat">
        <div class="l">Exames no Mês</div>
        <div class="v">${fmtNum(exames)}</div>
        ${exames25 ? execDelta(exames, exames25) : ''}
      </div>
    </div>
  </div>`;
}

function geralSectorCard(tab, emoji, name, rows, prev, c, count25, concRows, isMesCorrente) {
  const saas = rows.filter(r => isSaas(r[c.central])).length;
  const em   = rows.filter(r => (r[c.emerg]||'').toLowerCase() === 'sim').length;
  const conc = concRows ? concRows.length : null;
  return `<div class="overview-sector" onclick="switchTab('PRODUCAO')" style="cursor:pointer">
    <div class="sector-header"><span class="sector-emoji">${emoji}</span><span class="sector-name">${name}</span></div>
    <div class="sector-kpis">
      <div>
        <div class="sector-kpi-label">Concluídos</div>
        <div class="sector-kpi-val">${conc !== null ? fmtNum(conc) : fmtNum(rows.length)}</div>
        <div class="sector-kpi-sub" style="color:var(--text-soft);font-size:11px">Solic.: ${fmtNum(rows.length)}</div>
        ${isMesCorrente
          ? `<div class="cmp neutral" style="font-size:11px">🔵 em andamento</div>`
          : `${cmpHTML(rows.length, prev.length)}${count25 ? yoyCmpHTML(rows.length, count25) : ''}`}
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
