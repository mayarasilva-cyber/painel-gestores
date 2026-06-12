// ═══════════════════════════════════════════════
//  RENDER: PRODUÇÃO — Exames por modalidade + YoY
// ═══════════════════════════════════════════════

async function renderProducao() {
  const [hR, mR, eR, i25R, i26R] = await Promise.all([
    getHolterMerged(),
    fetchData('MAPA'),
    fetchData('ECG'),
    fetchData('INFO_2025'),
    fetchData('INFO_2026'),
  ]);

  const ci = COLS.INFO;
  const filled25 = getInfoFilled(i25R.data);
  const filled26 = getInfoFilled(i26R.data);
  const nMeses   = filled25.length;

  // Arrays mensais 2025 (das abas INFO)
  const ecg25arr = filled25.map(r => parseIntBR(r[ci.ecg]));
  const hol25arr = filled25.map(r => parseIntBR(r[ci.holter]));
  const map25arr = filled25.map(r => parseIntBR(r[ci.mapa]));
  const te25arr  = filled25.map(r => parseIntBR(r[ci.te]));

  // Arrays mensais 2026 — INFO-aware: meses fechados via INFORMAÇÕES_2026, mês corrente ao vivo
  const ch = COLS.HOLTER, cm = COLS.MAPA, ce = COLS.ECG;

  const hol26arr = infoTrendArr(filled26, ci.holter, hR.data, ch.dateConc);
  const map26arr = infoTrendArr(filled26, ci.mapa,   mR.data, cm.dateConc);
  const ecg26arr = infoTrendArr(filled26, ci.ecg,    eR.data, ce.dateConc);
  // TE: sem aba live ainda — usar INFO_2026 quando preenchido
  const te26arr  = filled26.map(r => parseIntBR(r[ci.te]));

  // Período atual — solicitação (col B) e conclusão (col C/D)
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

  // INFO do mês selecionado 2025
  const info25 = i25R.data.find(r => matchInfoMonth(r, selMonth));
  const hol25m = info25 ? parseIntBR(info25[ci.holter]) : 0;
  const map25m = info25 ? parseIntBR(info25[ci.mapa])   : 0;
  const ecg25m = info25 ? parseIntBR(info25[ci.ecg])    : 0;
  const te25m  = info25 ? parseIntBR(info25[ci.te])     : 0;

  const tot26     = hRows.length + mRows.length + eRows.length;        // solicitados
  const tot26Conc = hConc.length + mConc.length + eConc.length;        // concluídos
  const tot26P    = hPrev.length + mPrev.length + ePrev.length;
  const tot26PConc= hPrevConc.length + mPrevConc.length + ePrevConc.length;
  const tot25m   = hol25m + map25m + ecg25m + te25m;
  const tot26arr = hol26arr.map((v,i) => v + (map26arr[i]||0) + (ecg26arr[i]||0));
  const tot25arr = hol25arr.map((v,i) => v + (map25arr[i]||0) + (ecg25arr[i]||0) + (te25arr[i]||0));

  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">📊 Produção de Exames</div>
        <div class="section-sub">${pLabel()}</div>
      </div>
    </div>

    <!-- KPIs totais -->
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card navy-card">
        <div class="kpi-label">Exames Concluídos</div>
        <div class="kpi-value">${fmtNum(tot26Conc)}</div>
        <div class="kpi-sub">📋 Solicitados: <strong>${fmtNum(tot26)}</strong></div>
        ${cmpHTML(tot26Conc, tot26PConc)}
        ${yoyCmpHTML(tot26Conc, tot25m)}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Holter</div>
        <div class="kpi-value">${fmtNum(hConc.length)}</div>
        <div class="kpi-sub">Solic.: ${fmtNum(hRows.length)} · SAAS: ${fmtNum(hRows.filter(r=>isSaas(r[ch.central])).length)}</div>
        ${cmpHTML(hConc.length, hPrevConc.length)}
        ${yoyCmpHTML(hConc.length, hol25m)}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Mapa</div>
        <div class="kpi-value">${fmtNum(mConc.length)}</div>
        <div class="kpi-sub">Solic.: ${fmtNum(mRows.length)} · SAAS: ${fmtNum(mRows.filter(r=>isSaas(r[cm.central])).length)}</div>
        ${cmpHTML(mConc.length, mPrevConc.length)}
        ${yoyCmpHTML(mConc.length, map25m)}
      </div>
      <div class="kpi-card">
        <div class="kpi-label">ECG</div>
        <div class="kpi-value">${fmtNum(eConc.length)}</div>
        <div class="kpi-sub">Solic.: ${fmtNum(eRows.length)} · SAAS: ${fmtNum(eRows.filter(r=>isSaas(r[ce.central])).length)}</div>
        ${cmpHTML(eConc.length, ePrevConc.length)}
        ${yoyCmpHTML(eConc.length, ecg25m)}
      </div>
    </div>

    <!-- Cards de detalhe por modalidade -->
    <div class="mod-grid">
      ${producaoModCard('HOLTER','📊','Holter', hRows, hPrev, ch, hR.data, hConc, filled26, ci.holter)}
      ${producaoModCard('MAPA','🩺','Mapa', mRows, mPrev, cm, mR.data, mConc, filled26, ci.mapa)}
      ${producaoModCard('ECG','❤️','ECG', eRows, ePrev, ce, eR.data, eConc, filled26, ci.ecg)}
    </div>

    <!-- YoY por modalidade -->
    <div class="section-bar" style="margin-top:4px">
      <div class="section-title" style="font-size:16px">Comparativo Anual por Modalidade</div>
    </div>
    <div class="two-col">
      <div class="yoy-wrap">
        <div class="yoy-title">📊 Total Exames — 2025 vs 2026</div>
        <div class="yoy-chart">${yoyBarsHTML(tot25arr, tot26arr, null, '#1e3a5f', '#0ea5e9')}</div>
      </div>
      <div class="yoy-wrap">
        <div class="yoy-title">💚 Holter</div>
        <div class="yoy-chart">${yoyBarsHTML(hol25arr, hol26arr, null, '#064e3b', '#10b981')}</div>
      </div>
    </div>
    <div class="two-col">
      <div class="yoy-wrap">
        <div class="yoy-title">🔴 Mapa</div>
        <div class="yoy-chart">${yoyBarsHTML(map25arr, map26arr, null, '#7f1d1d', '#ef4444')}</div>
      </div>
      <div class="yoy-wrap">
        <div class="yoy-title">🩶 ECG</div>
        <div class="yoy-chart">${yoyBarsHTML(ecg25arr, ecg26arr, null, '#374151', '#9ca3af')}</div>
      </div>
    </div>

    <!-- Centrais Top por modalidade -->
    <div class="section-bar" style="margin-top:4px">
      <div class="section-title" style="font-size:16px">Centrais — ${pLabel()}</div>
    </div>
    <div class="tables-grid">
      ${producaoTopCentral('Holter', hRows, ch)}
      ${producaoTopCentral('ECG', eRows, ce)}
    </div>
    <div class="tables-grid">
      ${producaoTopCentral('Mapa', mRows, cm)}
      ${producaoSaasTd('HOLTER','📊','Holter', hRows, ch)}
    </div>
  `;
}

function matchInfoMonth(row, month) {
  const mes = (row[COLS.INFO.mes]||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const nome = MONTHS[month].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').substring(0,3);
  return mes.includes(nome);
}

function producaoModCard(tab, emoji, name, rows, prev, c, allData, concRows, filled26, infoCol) {
  const saas    = rows.filter(r => isSaas(r[c.central]));
  const em      = rows.filter(r => (r[c.emerg]||'').toLowerCase() === 'sim').length;
  const avgT    = avgSecs(rows, c.tempo);
  const avgPrev = avgSecs(prev, c.tempo);
  const conc    = concRows ? concRows.length : null;

  return `<div class="mod-card">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="font-size:22px">${emoji}</span>
      <span class="mod-name" style="margin:0">${name}</span>
    </div>
    <div class="kpi-grid" style="grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div>
        <div class="kpi-label">Concluídos</div>
        <div class="kpi-value" style="font-size:28px">${conc !== null ? fmtNum(conc) : fmtNum(rows.length)}</div>
        <div class="kpi-sub" style="font-size:11px">Solic.: ${fmtNum(rows.length)}</div>
        ${cmpHTML(rows.length, prev.length)}
      </div>
      <div>
        <div class="kpi-label">Média Laudo</div>
        <div class="kpi-value" style="font-size:20px">${fmtHMS(avgT)}</div>
        ${avgT && avgPrev ? cmpHTML(avgT, avgPrev, true) : ''}
      </div>
      <div>
        <div class="kpi-label">SAAS</div>
        <div class="kpi-value" style="font-size:22px">${fmtNum(saas.length)}</div>
        <div class="kpi-sub">${rows.length ? ((saas.length/rows.length)*100).toFixed(0) : 0}%</div>
      </div>
      <div>
        <div class="kpi-label">Emergências</div>
        <div class="kpi-value" style="font-size:22px;color:var(--red)">${fmtNum(em)}</div>
        <div class="kpi-sub">${rows.length ? ((em/rows.length)*100).toFixed(1) : 0}%</div>
      </div>
    </div>
    <div class="kpi-label">Evolução 2026</div>
    ${sparkHTML(filled26 ? infoTrendBars(filled26, infoCol, allData || rows, c.dateConc) : getMonthlyTrend(allData || rows, c.dateSolic))}
  </div>`;
}

function producaoTopCentral(name, rows, c) {
  const top = topN(rows, c.central, 8);
  const mx  = top[0]?.[1] || 1;
  return `<div class="card">
    <div class="card-title">🏆 Top Centrais ${name}</div>
    ${mkTable(top, mx, rows.length)}
  </div>`;
}

function producaoSaasTd(tab, emoji, name, rows, c) {
  const saas = rows.filter(r => isSaas(r[c.central]));
  const td   = rows.filter(r => !isSaas(r[c.central]));
  return `<div class="card">
    <div class="card-title">⚡ SAAS vs TD — ${name}</div>
    <table>
      <thead><tr><th>Tipo</th><th style="text-align:right">Exames</th><th style="text-align:right">Média Laudo</th><th style="text-align:right">Emerg.</th></tr></thead>
      <tbody>
        <tr><td><span class="badge badge-blue">SAAS</span></td>
          <td class="td-count">${fmtNum(saas.length)}</td>
          <td class="td-count">${fmtHMS(avgSecs(saas, c.tempo))}</td>
          <td class="td-count" style="color:var(--red)">${fmtNum(saas.filter(r=>(r[c.emerg]||'').toLowerCase()==='sim').length)}</td>
        </tr>
        <tr><td><span class="badge badge-navy">TD</span></td>
          <td class="td-count">${fmtNum(td.length)}</td>
          <td class="td-count">${fmtHMS(avgSecs(td, c.tempo))}</td>
          <td class="td-count" style="color:var(--red)">${fmtNum(td.filter(r=>(r[c.emerg]||'').toLowerCase()==='sim').length)}</td>
        </tr>
      </tbody>
    </table>
  </div>`;
}
