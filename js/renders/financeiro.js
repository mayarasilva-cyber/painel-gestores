// ═══════════════════════════════════════════════
//  RENDER: FINANCEIRO — Completo + Margem por Modalidade
// ═══════════════════════════════════════════════

async function renderFinanceiro() {
  const [fR, hR, mR, eR, i25R, i26R] = await Promise.all([
    fetchData('FINANCEIRO'),
    getHolterMerged(),
    fetchData('MAPA'),
    fetchData('ECG'),
    fetchData('INFO_2025'),
    fetchData('INFO_2026'),
  ]);

  // FATURAMENTO buscado separadamente para não sobrecarregar o rate limit do Sheets
  const fatR = await fetchData('FATURAMENTO').catch(() => ({ data: [] }));

  const cf = COLS.FINANCEIRO, ci = COLS.INFO;
  const now = new Date();

  // INFO do mês selecionado
  const infoRow26 = i26R.data.find(r => matchInfoMonth(r, selMonth));
  const infoRow25 = i25R.data.find(r => matchInfoMonth(r, selMonth));

  // KPIs principais da aba INFO (pré-calculados, mais precisos)
  const faturamento  = infoRow26 ? parseNum(infoRow26[ci.fat])    : 0;
  const custo        = infoRow26 ? parseNum(infoRow26[ci.custo])   : 0;
  const margemBruta  = infoRow26 ? parsePct(infoRow26[ci.margem])  : 0;
  const despFixas    = infoRow26 ? parseNum(infoRow26[ci.despFixas]): 0;
  const ebitda       = infoRow26 ? parsePct(infoRow26[ci.ebitda])  : 0;
  const lucroLiq     = infoRow26 ? parseNum(infoRow26[ci.lucro])   : 0;

  const fat25        = infoRow25 ? parseNum(infoRow25[ci.fat])    : 0;
  const marg25       = infoRow25 ? parsePct(infoRow25[ci.margem]) : 0;
  const ebitda25     = infoRow25 ? parsePct(infoRow25[ci.ebitda]) : 0;

  // Inadimplência via FINANCEIRO bruto
  const inadimRows = fR.data.filter(r => {
    if ((r[cf.tipo]||'').toLowerCase() !== 'entrada') return false;
    if ((r[cf.status]||'').toLowerCase().includes('realizado')) return false;
    const d = parseDate(r[cf.dataPrev]);
    return d && d < now && d.getMonth() === selMonth && d.getFullYear() === selYear;
  });

  // Aging de inadimplência
  function ageDays(row) {
    const d = parseDate(row[cf.dataPrev]);
    if (!d) return 0;
    return Math.floor((now - d) / 86400000);
  }

  const aging = {
    ate7:  inadimRows.filter(r => ageDays(r) <= 7),
    de8a14:inadimRows.filter(r => { const d=ageDays(r); return d>=8&&d<=14; }),
    de15a30:inadimRows.filter(r => { const d=ageDays(r); return d>=15&&d<=30; }),
    mais30:inadimRows.filter(r => ageDays(r) > 30),
  };

  const inadimTotal = inadimRows.reduce((s,r) => s + parseNum(r[cf.valorPrev]), 0);
  const inadimPct   = faturamento > 0 ? (inadimTotal/faturamento*100) : 0;

  // Realização % (realizado / previsto)
  const proj = fR.data.filter(r => { const d = parseDate(r[cf.dataPrev]); return d && d.getMonth()===selMonth && d.getFullYear()===selYear; });
  const real = proj.filter(r => (r[cf.status]||'').toLowerCase().includes('realizado'));
  const recProj = receitaLiquida(proj, cf, cf.valorPrev);
  const recReal = receitaLiquida(real, cf, cf.valorReal);
  const realizPct = recProj.bruta > 0 ? (recReal.bruta/recProj.bruta*100) : 0;

  // Receita por banco
  const bancos = {};
  real.filter(r => (r[cf.tipo]||'').toLowerCase() === 'entrada').forEach(r => {
    const b = (r[cf.banco]||'').trim() || 'Não informado';
    bancos[b] = (bancos[b]||0) + parseNum(r[cf.valorReal]);
  });
  const topBancos = Object.entries(bancos).sort((a,b) => b[1]-a[1]);
  const mxB = topBancos[0]?.[1] || 1;

  // Receita por categoria
  const cats = {};
  proj.filter(r => (r[cf.tipo]||'').toLowerCase() === 'entrada').forEach(r => {
    const cat = (r[cf.categoria]||'').trim();
    if (cat && cat !== '-') cats[cat] = (cats[cat]||0) + parseNum(r[cf.valorPrev]);
  });
  const topCats = Object.entries(cats).sort((a,b) => b[1]-a[1]).slice(0,8);
  const mxCat   = topCats[0]?.[1] || 1;
  const totalCat= Object.values(cats).reduce((s,v) => s+v, 0);

  // ── Margem por Modalidade — dados reais da aba FATURAMENTO ──
  const _norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
  const _mesLabel = _norm(MONTHS[selMonth]);

  const fatMes = fatR.data.filter(r =>
    _norm(r[0]) === _mesLabel && Number(r[1]) === selYear
  );

  function recFat(tipo, mod) {
    const row = fatMes.find(r =>
      (r[2]||'').trim().toUpperCase() === tipo &&
      (r[3]||'').trim().toUpperCase() === mod
    );
    if (!row) return { qtde: 0, valor: 0, pm: 0 };
    return { qtde: parseNum(row[4]), valor: parseNum(row[5]), pm: parseNum(row[6]) };
  }

  const fatTdEcg      = recFat('TD',       'ECG');
  const fatTdHolter   = recFat('TD',       'HOLTER');
  const fatTdMapa     = recFat('TD',       'MAPA');
  const fatSaasEcg    = recFat('SAAS',     'ECG');
  const fatSaasHolter = recFat('SAAS',     'HOLTER');
  const fatSaasMapa   = recFat('SAAS',     'MAPA');
  const fatSaasTe     = recFat('SAAS',     'TE');

  const hasFatData   = fatMes.length > 0;
  const recSaasTotal = fatSaasEcg.valor + fatSaasHolter.valor + fatSaasMapa.valor + fatSaasTe.valor;
  const qtdeSaasTotal= fatSaasEcg.qtde  + fatSaasHolter.qtde  + fatSaasMapa.qtde  + fatSaasTe.qtde;

  // Custo unitário real: custo INFO / total exames faturados
  const totalQtdeFat = fatTdEcg.qtde + fatTdHolter.qtde + fatTdMapa.qtde + qtdeSaasTotal;
  const custoUnitFat = hasFatData && totalQtdeFat > 0 ? custo / totalQtdeFat : 0;

  function margemReal(rec, aplicarImposto) {
    if (rec.valor <= 0) return 0;
    const c = custoUnitFat * rec.qtde * (aplicarImposto ? (1 + TOTAL_IMPOSTOS) : 1);
    return (rec.valor - c) / rec.valor * 100;
  }

  const margEcgTdR    = margemReal(fatTdEcg,    false);
  const margHolterTdR = margemReal(fatTdHolter,  false);
  const margMapaTdR   = margemReal(fatTdMapa,    false);
  const margSaasR     = recSaasTotal > 0
    ? (recSaasTotal - custoUnitFat * qtdeSaasTotal * (1 + TOTAL_IMPOSTOS)) / recSaasTotal * 100
    : 0;

  const margemItens = hasFatData ? [
    { label: 'SAAS (todas modalidades)', pct: margSaasR,     cor: 'var(--cyan)',  detalhe: `Receita: ${fmtCurrK(recSaasTotal)} · ${fmtNum(qtdeSaasTotal)} exames` },
    { label: 'Holter TD',               pct: margHolterTdR, cor: '#10b981',      detalhe: `PM real: ${fmtCurrK(fatTdHolter.pm)} · ${fmtNum(fatTdHolter.qtde)} exames` },
    { label: 'Mapa TD',                 pct: margMapaTdR,   cor: '#ef4444',      detalhe: `PM real: ${fmtCurrK(fatTdMapa.pm)} · ${fmtNum(fatTdMapa.qtde)} exames` },
    { label: 'ECG TD',                  pct: margEcgTdR,    cor: '#9ca3af',      detalhe: `PM real: ${fmtCurrK(fatTdEcg.pm)} · ${fmtNum(fatTdEcg.qtde)} exames` },
  ].filter(i => i.pct > 0) : [];

  // YoY financeiro
  const filled25 = getInfoFilled(i25R.data);
  const filled26 = getInfoFilled(i26R.data);
  const fat25arr  = filled25.map(r => parseNum(r[ci.fat]));
  const fat26arr  = filled26.map(r => parseNum(r[ci.fat]));
  const marg25arr = filled25.map(r => parsePct(r[ci.margem]));
  const marg26arr = filled26.map(r => parsePct(r[ci.margem]));
  const ebit25arr = filled25.map(r => parsePct(r[ci.ebitda]));
  const ebit26arr = filled26.map(r => parsePct(r[ci.ebitda]));

  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">💰 Financeiro</div>
        <div class="section-sub">${pLabel()}</div>
        ${infoRow26 ? '' : '<div class="section-note">⚠️ Dados do mês ainda não disponíveis em INFORMAÇÕES_2026</div>'}
      </div>
    </div>

    <!-- KPIs principais -->
    <div class="fin-grid">
      <div class="fin-card fin-receita">
        <div class="fin-label">Faturamento Bruto</div>
        <div class="fin-value">${faturamento ? fmtCurrK(faturamento) : '—'}</div>
        <div class="fin-sub">receita total do período</div>
        ${yoyCmpHTML(faturamento, fat25)}
        <div class="fin-progress" style="margin-top:12px">
          <div class="fin-progress-label">Realização: ${fmtPct(realizPct)}</div>
          <div class="fin-progress-bar"><div class="fin-progress-fill" style="width:${Math.min(realizPct,100).toFixed(0)}%"></div></div>
          <div class="fin-progress-label">${fmtCurrK(recReal.bruta)} realizado de ${fmtCurrK(recProj.bruta)} previsto</div>
        </div>
      </div>
      <div class="fin-card fin-margem">
        <div class="fin-label">Margem Bruta</div>
        <div class="fin-value" style="color:${margemBruta>50?'var(--green)':margemBruta>30?'var(--amber)':'var(--red)'}">${margemBruta ? fmtPct(margemBruta) : '—'}</div>
        <div class="fin-sub">Custo serv.: ${faturamento ? fmtCurrK(custo) : '—'}</div>
        ${yoyCmpHTML(margemBruta, marg25)}
      </div>
      <div class="fin-card fin-margem" style="--accent:var(--purple)">
        <div class="fin-label">EBITDA</div>
        <div class="fin-value" style="color:${ebitda>0?'var(--green)':'var(--red)'}">${ebitda ? fmtPct(ebitda) : '—'}</div>
        <div class="fin-sub">Desp. fixas: ${faturamento ? fmtCurrK(despFixas) : '—'}</div>
        ${yoyCmpHTML(ebitda, ebitda25)}
      </div>
      <div class="fin-card fin-inadim">
        <div class="fin-label">Inadimplência</div>
        <div class="fin-value">${fmtCurrK(inadimTotal)}</div>
        <div class="fin-sub">${fmtPct(inadimPct)} do faturamento · ${inadimRows.length} recebíveis</div>
      </div>
    </div>

    <!-- Aging inadimplência -->
    <div class="section-bar" style="margin-top:4px">
      <div class="section-title" style="font-size:16px">Aging de Inadimplência</div>
      <div class="section-sub">vencimentos em atraso no mês selecionado</div>
    </div>
    <div class="aging-grid">
      ${agingCard('≤ 7 dias',  aging.ate7,   'var(--amber)')}
      ${agingCard('8–14 dias', aging.de8a14, 'var(--amber)')}
      ${agingCard('15–30 dias',aging.de15a30,'var(--red)')}
      ${agingCard('> 30 dias', aging.mais30, 'var(--red)')}
    </div>

    <!-- Margem por modalidade -->
    <div class="two-col">
      <div class="card">
        <div class="card-title">📐 Margem por Modalidade
          <span style="font-size:11px;font-weight:400;color:var(--text-soft)">${hasFatData ? 'dados reais de faturamento' : 'estimativa proporcional'}</span>
        </div>
        ${margemItens.length ? margemModHTML(margemItens) : '<p class="no-data">Sem dados de faturamento para ' + MONTHS[selMonth] + '/' + selYear + '</p>'}
      </div>

      <!-- Receita por categoria -->
      <div class="card">
        <div class="card-title">📂 Receita por Categoria</div>
        ${!topCats.length ? '<p class="no-data">Sem dados.</p>' : `
        <table>
          <thead><tr><th>Categoria</th><th style="width:80px"></th><th style="text-align:right">Previsto</th><th style="text-align:right;padding-left:6px">%</th></tr></thead>
          <tbody>${topCats.map(([n,v]) => `<tr>
            <td class="td-name" title="${esc(n)}">${esc(n)}</td>
            <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(v/mxCat*100).toFixed(0)}%"></div></div></td>
            <td class="td-curr">${fmtCurrK(v)}</td>
            <td class="td-pct">${totalCat>0?((v/totalCat)*100).toFixed(1):0}%</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>
    </div>

    <!-- Por banco -->
    <div class="two-col">
      <div class="card">
        <div class="card-title">🏦 Recebimentos por Banco</div>
        ${!topBancos.length ? '<p class="no-data">Sem recebimentos realizados no período.</p>' : `
        <table>
          <thead><tr><th>Banco</th><th style="width:80px"></th><th style="text-align:right">Realizado</th></tr></thead>
          <tbody>${topBancos.map(([n,v]) => `<tr>
            <td class="td-name">${esc(n)}</td>
            <td class="td-bar"><div class="bar-bg"><div class="bar-fill" style="width:${(v/mxB*100).toFixed(0)}%"></div></div></td>
            <td class="td-curr">${fmtCurrK(v)}</td>
          </tr>`).join('')}</tbody>
        </table>`}
      </div>

      <div class="card">
        <div class="card-title">📊 Resultado — ${pLabel()}</div>
        <div style="display:flex;flex-direction:column;gap:14px;margin-top:8px">
          ${resultRow('Faturamento', faturamento, 'var(--green)')}
          ${resultRow('(-) Custo do Serviço', -custo, 'var(--red)')}
          ${fmtResultDivider('= Margem Bruta', faturamento-custo, margemBruta)}
          ${resultRow('(-) Despesas Fixas', -despFixas, 'var(--amber)')}
          ${fmtResultDivider('= EBITDA', faturamento-custo-despFixas, ebitda)}
          ${lucroLiq !== 0 ? fmtResultDivider('= Lucro Líquido', lucroLiq, 0) : ''}
        </div>
      </div>
    </div>

    <!-- YoY Financeiro -->
    <div class="section-bar" style="margin-top:4px">
      <div class="section-title" style="font-size:16px">Comparativo Anual — 2025 vs 2026</div>
    </div>
    <div class="two-col">
      <div class="yoy-wrap">
        <div class="yoy-title">Faturamento por Mês</div>
        <div class="yoy-chart">${yoyBarsHTML(fat25arr, fat26arr, v => fmtCurrK(v))}</div>
      </div>
      <div class="yoy-wrap">
        <div class="yoy-title">Margem Bruta por Mês (%)</div>
        <div class="yoy-chart">${yoyBarsHTML(marg25arr, marg26arr, v => fmtPct(v))}</div>
      </div>
    </div>
    <div class="two-col">
      <div class="yoy-wrap">
        <div class="yoy-title">EBITDA por Mês (%)</div>
        <div class="yoy-chart">${yoyBarsHTML(ebit25arr, ebit26arr, v => fmtPct(v))}</div>
      </div>
    </div>
  `;
}

function agingCard(label, rows, cor) {
  const val = rows.reduce((s,r) => s + parseNum(r[COLS.FINANCEIRO.valorPrev]), 0);
  return `<div class="aging-card">
    <div class="aging-range">${label}</div>
    <div class="aging-count" style="color:${cor}">${rows.length}</div>
    <div class="aging-value">${fmtCurrK(val)}</div>
  </div>`;
}

function resultRow(label, val, cor) {
  return `<div style="display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:13px;font-weight:600;color:var(--text-soft)">${esc(label)}</span>
    <span style="font-family:Bricolage Grotesque,sans-serif;font-size:15px;font-weight:800;color:${cor}">${fmtCurrK(Math.abs(val))}</span>
  </div>`;
}

function fmtResultDivider(label, val, pct) {
  const cor = val >= 0 ? 'var(--green)' : 'var(--red)';
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:2px solid var(--border);margin-top:4px">
    <span style="font-size:13px;font-weight:800;color:var(--navy)">${esc(label)}</span>
    <span style="font-family:Bricolage Grotesque,sans-serif;font-size:16px;font-weight:800;color:${cor}">${fmtCurrK(val)}${pct ? ' · '+fmtPct(pct) : ''}</span>
  </div>`;
}
