// ═══════════════════════════════════════════════
//  SCORECARD NATIVO — DRE Cascata · Despesas · Forecast 2026
//  Dados da Controladoria (Jan–Jul realizado + Ago–Dez projetado).
//  Escopo isolado em IIFE → expõe apenas window.SC.
// ═══════════════════════════════════════════════
window.SC = (function () {
  'use strict';

  const MESES      = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'];
  const MESES_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho'];
  const MESES_F    = ['Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // ── Dados realizados (competência) — Jan a Jul/2026 ──
  const D = {
    fat:      [535147.10, 505719.87, 601539.47, 670697.29, 636552.67, 660409.28, 690940.34],
    recBruta: [531526.57, 486583.35, 581914.64, 645530.53, 593022.15, 630225.39, 644830.17],
    rl:       [503869.83, 461987.52, 557081.14, 617673.68, 582064.04, 619659.03, 633153.98],
    lb:       [341164.78, 290566.44, 376742.60, 408769.53, 397284.21, 414928.23, 426233.80],
    mc:       [333152.07, 279730.31, 370829.16, 402246.73, 393002.68, 413373.57, 423875.43],
    ebitda:   [40271.35, -41222.59, 60818.88, 96716.99, 108969.06, 128557.33, 152729.47],
    ll:       [6041.17, -84236.14, 20360.42, 10943.43, 26373.99, 51998.28, 76097.96],
    impFat:   [27656.74, 24595.83, 24833.50, 27856.85, 10958.11, 10566.36, 11676.19],
    csp:      [162705.05, 171421.08, 180338.55, 208904.15, 184779.83, 204730.80, 206920.19],
    despVar:  [8012.71, 10836.13, 5913.44, 6522.80, 4281.53, 1554.66, 2358.37],
    pessoal8: [143479.04, 150827.16, 155402.03, 137319.56, 120657.86, 132189.92, 119925.53],
    pj:       [40408.31, 44244.70, 38011.31, 43890.14, 35312.75, 32726.48, 34882.56],
    ti:       [73868.91, 93396.94, 83959.70, 91865.88, 95353.96, 88491.17, 84943.37],
    tribut:   [11771.38, 9955.74, 9929.06, 11140.27, 11914.48, 11251.57, 10677.44],
    escrit:   [22585.23, 21796.15, 22039.06, 20613.77, 19804.40, 19133.02, 19551.17],
    finFix:   [767.85, 732.21, 669.12, 700.12, 990.17, 1024.08, 1165.89],
    invest:   [9413.74, 11072.88, 8178.31, 14496.81, 9312.68, 10787.27, 4116.60],
    despFin:  [10496.28, 9565.87, 9617.63, 14168.60, 14437.89, 14241.22, 14767.15],
    irCsll:   [22493.46, 22718.36, 22943.29, 58323.92, 58907.15, 59531.22, 57748.20],
    resFin:   [-2322.98, -9222.31, -9336.86, -12952.83, -14375.24, -6240.56, -14766.71],
    despFixas:[292880.72, 320952.90, 310010.28, 305529.74, 284033.62, 284816.24, 271145.96],
    pessoal:  [310880.65, 312212.43, 326772.13, 353369.73, 302357.93, 333523.51, 326845.72],
    caixa:    [315142.20, 230226.09, 251790.12, 263360.47, 290844.92, 345752.22, 424524.06],
  };

  // ── Forecast Ago–Dez/2026 ──
  const F = {
    fat:    [708614.87, 715701.02, 744329.06, 707112.61, 657614.72],
    rl:     [644839.53, 651287.93, 677339.44, 643472.47, 598429.40],
    ebitda: [146995.51, 157179.39, 165448.62, 119597.03, 77446.68],
    ll:     [56615.37, 66165.20, 74945.19, 29031.30, -13754.46],
    caixa:  [450845.46, 517010.66, 591955.85, 620987.15, 607232.69],
  };

  const pct = (a, b) => a / b * 100;
  const sum = a => a.reduce((x, y) => x + y, 0);
  const sumTo = (a, i) => a.slice(0, i + 1).reduce((x, y) => x + y, 0);

  D.mbP = D.lb.map((v, i) => pct(v, D.rl[i]));
  D.mcP = D.mc.map((v, i) => pct(v, D.rl[i]));
  D.ebP = D.ebitda.map((v, i) => pct(v, D.rl[i]));
  D.llP = D.ll.map((v, i) => pct(v, D.fat[i]));
  D.hcP = D.pessoal.map((v, i) => pct(v, D.fat[i]));
  F.ebP = F.ebitda.map((v, i) => pct(v, F.rl[i]));

  const ANO = {
    fat: sum(D.fat) + sum(F.fat),
    rl:  sum(D.rl) + sum(F.rl),
    eb:  sum(D.ebitda) + sum(F.ebitda),
    ll:  sum(D.ll) + sum(F.ll),
  };
  ANO.ebP = pct(ANO.eb, ANO.rl);
  ANO.llP = pct(ANO.ll, ANO.fat);

  // ── Formatação pt-BR ──
  const fmtRk = v => 'R$ ' + (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' mil';
  const fmtMi = v => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
  const fmtSmart = v => Math.abs(v) >= 1e6 ? fmtMi(v) : fmtRk(v);
  const fmtP = (v, d = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }) + '%';

  // ── Helpers SVG ──
  const NS = 'http://www.w3.org/2000/svg';
  function svgEl(w, h) { const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${h}`); s.style.width = '100%'; return s; }
  function el(tag, attrs, txt) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; return e; }
  function niceMax(v) { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; }
  function byId(id) { return document.getElementById(id); }

  // ── Estado ──
  let SEL = 6;          // mês de referência (0=Jan … 6=Jul)
  let WFMODE = 'mes';   // 'mes' | 'ytd'

  // ── KPIs executivos (farol vs média do ano) ──
  function renderKPIs() {
    const m = SEL, p = SEL - 1;
    const ytdFat = sumTo(D.fat, m), ytdRL = sumTo(D.rl, m);
    const ytdMB = pct(sumTo(D.lb, m), ytdRL), ytdMC = pct(sumTo(D.mc, m), ytdRL);
    const ytdEB = pct(sumTo(D.ebitda, m), ytdRL), ytdLL = pct(sumTo(D.ll, m), ytdFat);
    const ytdHC = pct(sumTo(D.pessoal, m), ytdFat);
    const kpis = [
      { label: 'Faturamento Bruto', val: fmtRk(D.fat[m]), ytd: 'YTD ' + fmtMi(ytdFat), delta: p >= 0 ? pct(D.fat[m] - D.fat[p], D.fat[p]) : null, good: 'high', avg: sum(D.fat) / 7, cur: D.fat[m] },
      { label: '% Margem Bruta', val: fmtP(D.mbP[m]), ytd: 'YTD ' + fmtP(ytdMB), delta: p >= 0 ? D.mbP[m] - D.mbP[p] : null, pp: true, good: 'high', avg: sum(D.mbP) / 7, cur: D.mbP[m] },
      { label: '% Margem Contrib.', val: fmtP(D.mcP[m]), ytd: 'YTD ' + fmtP(ytdMC), delta: p >= 0 ? D.mcP[m] - D.mcP[p] : null, pp: true, good: 'high', avg: sum(D.mcP) / 7, cur: D.mcP[m] },
      { label: '% EBITDA', val: fmtP(D.ebP[m]), ytd: 'YTD ' + fmtP(ytdEB), delta: p >= 0 ? D.ebP[m] - D.ebP[p] : null, pp: true, good: 'high', avg: sum(D.ebP) / 7, cur: D.ebP[m] },
      { label: '% Lucro Líquido', val: fmtP(D.llP[m]), ytd: 'YTD ' + fmtP(ytdLL), delta: p >= 0 ? D.llP[m] - D.llP[p] : null, pp: true, good: 'high', avg: sum(D.llP) / 7, cur: D.llP[m] },
      { label: '% Headcount s/ Fat.', val: fmtP(D.hcP[m]), ytd: 'YTD ' + fmtP(ytdHC), delta: p >= 0 ? D.hcP[m] - D.hcP[p] : null, pp: true, good: 'low', avg: sum(D.hcP) / 7, cur: D.hcP[m] },
    ];
    const grid = byId('scKpis'); if (!grid) return;
    grid.innerHTML = kpis.map(k => {
      const diff = k.good === 'high' ? k.cur - k.avg : k.avg - k.cur;
      const farol = diff > (k.pp ? 1 : k.avg * 0.02) ? 'g' : (diff < -(k.pp ? 1 : k.avg * 0.02) ? 'r' : 'y');
      let deltaHtml = '<span class="sc-delta flat">— primeiro mês</span>';
      if (k.delta != null) {
        const up = k.delta >= 0, goodMove = k.good === 'high' ? up : !up;
        const dTxt = k.pp ? Math.abs(k.delta).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' p.p.' : fmtP(Math.abs(k.delta));
        deltaHtml = `<span class="sc-delta ${goodMove ? 'up' : 'down'}">${up ? '▲' : '▼'} ${dTxt} vs ${MESES[p]}</span>`;
      }
      return `<div class="sc-kpi">
        <div class="sc-kpi-label"><span>${k.label}</span><span class="sc-farol ${farol}"></span></div>
        <div class="sc-kpi-value">${k.val}</div>
        <div class="sc-kpi-ytd">${k.ytd}</div>
        ${deltaHtml}
      </div>`;
    }).join('');
  }

  // ── DRE em Cascata (waterfall) ──
  function wfData() {
    if (WFMODE === 'ytd') {
      const t = a => sumTo(a, SEL);
      return [
        { n: 'Receita Bruta', v: t(D.recBruta), t: 'base' },
        { n: 'Impostos s/ fat.', v: -t(D.impFat) },
        { n: 'CSP', v: -t(D.csp) },
        { n: 'Desp. variáveis', v: -t(D.despVar) },
        { n: 'Desp. fixas', v: -t(D.despFixas) },
        { n: 'EBITDA', v: t(D.ebitda), t: 'sub' },
        { n: 'Investimentos', v: -t(D.invest) },
        { n: 'Result. financeiro', v: t(D.resFin) },
        { n: 'IRPJ + CSLL', v: -t(D.irCsll) },
        { n: 'Lucro Líquido', v: t(D.ll), t: 'end' }];
    }
    const i = SEL;
    return [
      { n: 'Receita Bruta', v: D.recBruta[i], t: 'base' },
      { n: 'Impostos s/ fat.', v: -D.impFat[i] },
      { n: 'CSP', v: -D.csp[i] },
      { n: 'Desp. variáveis', v: -D.despVar[i] },
      { n: 'Desp. fixas', v: -D.despFixas[i] },
      { n: 'EBITDA', v: D.ebitda[i], t: 'sub' },
      { n: 'Investimentos', v: -D.invest[i] },
      { n: 'Result. financeiro', v: D.resFin[i] },
      { n: 'IRPJ + CSLL', v: -D.irCsll[i] },
      { n: 'Lucro Líquido', v: D.ll[i], t: 'end' }];
  }

  function drawWaterfall(containerId, data, opts = {}) {
    const c = byId(containerId); if (!c) return; c.innerHTML = '';
    const w = 1140, h = 360, padL = 70, padR = 16, padT = 24, padB = 58;
    let acc = 0;
    const steps = data.map(d => {
      if (d.t === 'base') { acc = d.v; return { ...d, from: 0, to: d.v }; }
      if (d.t === 'sub' || d.t === 'end') { return { ...d, from: 0, to: acc }; }
      const from = acc; acc += d.v; return { ...d, from: Math.min(from, acc), to: Math.max(from, acc) };
    });
    const rawMax = Math.max(...steps.map(s => s.to));
    const pw = Math.pow(10, Math.floor(Math.log10(rawMax)));
    const maxV = Math.ceil(rawMax / (pw / 4)) * (pw / 4);
    const minV = Math.min(0, ...steps.map(s => Math.min(s.from, s.to)));
    const s = svgEl(w, h);
    const n = steps.length;
    const x = i => padL + i * (w - padL - padR) / n + (w - padL - padR) / n * 0.12;
    const bw = (w - padL - padR) / n * 0.76;
    const y = v => padT + (h - padT - padB) * (1 - (v - minV) / (maxV - minV));
    for (let g = 0; g <= 4; g++) { const v = minV + (maxV - minV) * g / 4;
      s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(v), y2: y(v), stroke: '#eef3f8' }));
      s.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#5b7187' }, Math.round(v / 1000) + 'k')); }
    if (minV < 0) s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(0), y2: y(0), stroke: '#94a3b8', 'stroke-dasharray': '4 4' }));
    steps.forEach((st, i) => {
      let fill;
      if (st.t === 'base') fill = '#0a3d6e';
      else if (st.t === 'sub') fill = '#0ea5e9';
      else if (st.t === 'end') fill = st.to >= 0 ? '#10b981' : '#ef4444';
      else fill = opts.bridge ? (st.v >= 0 ? '#34d399' : '#f0879b') : '#f0879b';
      const top = y(Math.max(st.from, st.to)), bot = y(Math.min(st.from, st.to));
      s.appendChild(el('rect', { x: x(i), y: top, width: bw, height: Math.max(bot - top, 2), fill, rx: 5 }));
      if (i < n - 1 && !steps[i + 1].t) {
        const lvl = st.t ? st.to : (st.v < 0 ? Math.min(st.from, st.to) : st.to);
        s.appendChild(el('line', { x1: x(i) + bw, x2: x(i + 1), y1: y(lvl), y2: y(lvl), stroke: '#cbd5e1', 'stroke-dasharray': '3 3' }));
      }
      const lblV = st.t ? st.to : st.v;
      const lblTxt = (lblV > 0 && !st.t ? '+' : '') + (Math.abs(lblV) >= 1500 ? Math.round(lblV / 1000).toLocaleString('pt-BR') + 'k' : lblV.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '');
      s.appendChild(el('text', { x: x(i) + bw / 2, y: top - 7, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 800, fill: '#0D2137' }, lblTxt));
      const words = st.n.split(' ');
      if (words.length > 1 && st.n.length > 12) {
        s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 32, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#5b7187' }, words.slice(0, Math.ceil(words.length / 2)).join(' ')));
        s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 19, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#5b7187' }, words.slice(Math.ceil(words.length / 2)).join(' ')));
      } else {
        s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 26, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 700, fill: '#5b7187' }, st.n));
      }
    });
    c.appendChild(s);
  }

  // ── Despesas: barras empilhadas (anual) ──
  function drawDespChart() {
    const c = byId('scDespChart'); if (!c) return; c.innerHTML = '';
    const series = [D.csp, D.pessoal8, D.ti, D.pj, D.escrit, D.despVar, D.tribut, D.finFix];
    const colors = ['#0a3d6e', '#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#a855f7', '#94a3b8', '#f0879b'];
    const fmt = v => Math.round(v / 1000) + 'k';
    const w = 560, h = 270, padL = 50, padR = 14, padT = 14, padB = 30, n = MESES.length;
    const totals = MESES.map((_, i) => sum(series.map(sr => sr[i])));
    const max = niceMax(Math.max(...totals));
    const s = svgEl(w, h);
    const x = i => padL + i * (w - padL - padR) / n + (w - padL - padR) / n * 0.18;
    const bw = (w - padL - padR) / n * 0.64;
    const y = v => padT + (h - padT - padB) * (1 - v / max);
    for (let g = 0; g <= 4; g++) { const v = max * g / 4;
      s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(v), y2: y(v), stroke: '#eef3f8' }));
      s.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#5b7187' }, fmt(v))); }
    MESES.forEach((m, i) => {
      let acc = 0;
      series.forEach((sr, si) => { const v = sr[i], yTop = y(acc + v), yBot = y(acc);
        s.appendChild(el('rect', { x: x(i), y: yTop, width: bw, height: Math.max(yBot - yTop, 0), fill: colors[si], rx: si === series.length - 1 ? 5 : 0 })); acc += v; });
      s.appendChild(el('text', { x: x(i) + bw / 2, y: y(acc) - 6, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 800, fill: '#0D2137' }, fmt(acc)));
      s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 8, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#5b7187' }, m));
    });
    c.appendChild(s);
  }

  // ── Despesas: tabela comparativa mês × mês anterior ──
  function renderDespTable() {
    const i = SEL, p = SEL - 1;
    const cats = [
      { n: 'Impostos s/ faturamento', a: D.impFat },
      { n: 'Custo do Serviço Prestado', a: D.csp },
      { n: 'Despesas variáveis', a: D.despVar },
      { n: 'Despesas com Pessoal', a: D.pessoal8 },
      { n: 'Despesas com PJ', a: D.pj },
      { n: 'Despesas com TI', a: D.ti },
      { n: 'Despesas Tributárias', a: D.tribut },
      { n: 'Despesas com Escritório', a: D.escrit },
      { n: 'Desp. Financeiras (fixas)', a: D.finFix },
      { n: 'Investimentos', a: D.invest },
      { n: 'Desp. Financeiras (result.)', a: D.despFin },
      { n: 'IRPJ + CSLL', a: D.irCsll },
    ];
    const totI = cats.reduce((s, c) => s + c.a[i], 0);
    const totP = p >= 0 ? cats.reduce((s, c) => s + c.a[p], 0) : null;
    const fmt2 = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    let rows = cats.map(c => {
      const cur = c.a[i], ant = p >= 0 ? c.a[p] : null;
      let varTxt = '—';
      if (ant != null && ant !== 0) { const v = (cur - ant) / ant * 100;
        const cls = v > 5 ? 'r' : (v < -5 ? 'g' : 'y');
        varTxt = `<span class="sc-pill ${cls}">${v >= 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>`; }
      const pesoRL = cur / D.rl[i] * 100;
      return `<tr><td>${c.n}</td><td>${fmt2(cur)}</td><td>${ant != null ? fmt2(ant) : '—'}</td><td>${varTxt}</td><td>${pesoRL.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</td></tr>`;
    }).join('');
    let totVar = '—';
    if (totP) { const v = (totI - totP) / totP * 100;
      totVar = `<span class="sc-pill ${v > 5 ? 'r' : (v < -5 ? 'g' : 'y')}">${v >= 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>`; }
    rows += `<tr class="sc-total"><td>Total de despesas</td><td>${fmt2(totI)}</td><td>${totP ? fmt2(totP) : '—'}</td><td>${totVar}</td><td>${(totI / D.rl[i] * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</td></tr>`;
    const t = byId('scDespTable'); if (!t) return;
    t.innerHTML = `<table class="sc-table"><thead><tr><th>Categoria</th><th>${MESES[i]} (R$)</th><th>${p >= 0 ? MESES[p] + ' (R$)' : '—'}</th><th>Var.</th><th>% Rec. Líq.</th></tr></thead><tbody>${rows}</tbody></table>`;
    const tag = byId('scDespTag'); if (tag) tag.textContent = p >= 0 ? `${MESES_FULL[i]}/26 vs ${MESES_FULL[p]}/26` : `${MESES_FULL[i]}/26`;
  }

  // ── Forecast 2026 ──
  function renderForecastKpis() {
    const g = byId('scFcKpis'); if (!g) return;
    const items = [
      { l: 'Faturamento projetado 2026', v: fmtMi(ANO.fat), s: `${fmtMi(sum(D.fat))} realizado + ${fmtMi(sum(F.fat))} projetado`, f: 'g' },
      { l: 'EBITDA projetado 2026', v: fmtSmart(ANO.eb), s: `${fmtP(ANO.ebP)} da Receita Líquida do ano`, f: 'g' },
      { l: 'Lucro Líquido projetado 2026', v: fmtRk(ANO.ll), s: `${fmtP(ANO.llP)} do faturamento · dez projeta −R$ 14 mil`, f: ANO.ll >= 0 ? 'g' : 'y' },
      { l: 'Caixa em Dez/26', v: fmtRk(F.caixa[4]), s: 'Pico de R$ 621 mil em Nov/26', f: 'g' },
    ];
    g.innerHTML = items.map(it => `<div class="sc-kpi">
      <div class="sc-kpi-label"><span>${it.l}</span><span class="sc-farol ${it.f}"></span></div>
      <div class="sc-kpi-value" style="font-size:22px">${it.v}</div>
      <div class="sc-kpi-ytd">${it.s}</div>
    </div>`).join('');
  }

  function drawForecastCombo() {
    const c = byId('scFcChart'); if (!c) return; c.innerHTML = '';
    const M12 = MESES.concat(MESES_F);
    const fat12 = D.fat.concat(F.fat), eb12 = D.ebP.concat(F.ebP);
    const w = 1140, h = 320, padL = 64, padR = 52, padT = 20, padB = 30, n = 12, cut = 7;
    const max = niceMax(Math.max(...fat12));
    const eMin = -12, eMax = 26;
    const s = svgEl(w, h);
    const x = i => padL + i * (w - padL - padR) / n + (w - padL - padR) / n * 0.16;
    const bw = (w - padL - padR) / n * 0.68;
    const y = v => padT + (h - padT - padB) * (1 - v / max);
    const ye = v => padT + (h - padT - padB) * (1 - (v - eMin) / (eMax - eMin));
    for (let g2 = 0; g2 <= 4; g2++) { const v = max * g2 / 4;
      s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(v), y2: y(v), stroke: '#eef3f8' }));
      s.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#5b7187' }, (v / 1000) + 'k')); }
    [0, 10, 20].forEach(v => s.appendChild(el('text', { x: w - padR + 8, y: ye(v) + 4, 'font-size': 10, fill: '#0ea5e9', 'font-weight': 700 }, v + '%')));
    const xDiv = (x(cut - 1) + bw + x(cut)) / 2;
    s.appendChild(el('line', { x1: xDiv, x2: xDiv, y1: padT - 6, y2: h - padB, stroke: '#94a3b8', 'stroke-dasharray': '5 4' }));
    s.appendChild(el('text', { x: xDiv - 7, y: padT + 4, 'text-anchor': 'end', 'font-size': 9.5, 'font-weight': 800, fill: '#5b7187' }, 'REALIZADO'));
    s.appendChild(el('text', { x: xDiv + 7, y: padT + 4, 'font-size': 9.5, 'font-weight': 800, fill: '#94a3b8' }, 'PROJETADO'));
    M12.forEach((m, i) => {
      const proj = i >= cut;
      s.appendChild(el('rect', { x: x(i), y: y(fat12[i]), width: bw, height: y(0) - y(fat12[i]), fill: proj ? '#9dc3e0' : '#0a3d6e', rx: 4, ...(proj ? { stroke: '#5b8db4', 'stroke-width': 1, 'stroke-dasharray': '4 3' } : {}) }));
      s.appendChild(el('text', { x: x(i) + bw / 2, y: y(0) - 8, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 800, fill: proj ? '#1e4f74' : '#cfe7f7' }, Math.round(fat12[i] / 1000) + 'k'));
      s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 8, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, fill: proj ? '#94a3b8' : '#5b7187' }, m));
    });
    s.appendChild(el('line', { x1: padL, x2: w - padR, y1: ye(0), y2: ye(0), stroke: '#cbd5e1', 'stroke-dasharray': '4 4' }));
    const pt = i => `${x(i) + bw / 2},${ye(eb12[i])}`;
    s.appendChild(el('polyline', { points: eb12.slice(0, cut).map((_, i) => pt(i)).join(' '), fill: 'none', stroke: '#10b981', 'stroke-width': 2.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    s.appendChild(el('polyline', { points: eb12.slice(cut - 1).map((_, k) => pt(cut - 1 + k)).join(' '), fill: 'none', stroke: '#10b981', 'stroke-width': 2.4, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    eb12.forEach((v, i) => {
      s.appendChild(el('circle', { cx: x(i) + bw / 2, cy: ye(v), r: 3.4, fill: '#fff', stroke: '#10b981', 'stroke-width': 2.2 }));
      s.appendChild(el('text', { x: x(i) + bw / 2, y: ye(v) - 9, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 800, fill: '#047857', stroke: '#ffffff', 'stroke-width': 3, 'paint-order': 'stroke' }, fmtP(v)));
    });
    c.appendChild(s);
  }

  function drawForecastCaixa() {
    const c = byId('scFcCaixa'); if (!c) return; c.innerHTML = '';
    const M12 = MESES.concat(MESES_F);
    const cx12 = D.caixa.concat(F.caixa);
    const w = 560, h = 270, padL = 64, padR = 16, padT = 24, padB = 30, n = 12, cut = 7;
    const min = 200000, max = 650000;
    const s = svgEl(w, h);
    const x = i => padL + i * (w - padL - padR) / (n - 1);
    const y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
    [200000, 300000, 400000, 500000].forEach(v => { s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(v), y2: y(v), stroke: '#eef3f8' }));
      s.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#5b7187' }, Math.round(v / 1000) + 'k')); });
    const pt = i => `${x(i)},${y(cx12[i])}`;
    s.appendChild(el('polyline', { points: cx12.map((_, i) => pt(i)).join(' ') + ` ${x(n - 1)},${y(min)} ${x(0)},${y(min)}`, fill: '#0a3d6e', opacity: .06 }));
    s.appendChild(el('polyline', { points: cx12.slice(0, cut).map((_, i) => pt(i)).join(' '), fill: 'none', stroke: '#0a3d6e', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    s.appendChild(el('polyline', { points: cx12.slice(cut - 1).map((_, k) => pt(cut - 1 + k)).join(' '), fill: 'none', stroke: '#0ea5e9', 'stroke-width': 2.6, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
    cx12.forEach((v, i) => {
      const proj = i >= cut, peak = v === Math.max(...cx12), last = i === n - 1;
      s.appendChild(el('circle', { cx: x(i), cy: y(v), r: peak || last ? 4.4 : 3, fill: '#fff', stroke: proj ? '#0ea5e9' : '#0a3d6e', 'stroke-width': 2.2 }));
      if (peak || last || i === 0 || i === cut - 1) s.appendChild(el('text', { x: x(i), y: y(v) - 10, 'text-anchor': 'middle', 'font-size': 10, 'font-weight': 800, fill: proj ? '#0284c7' : '#0D2137', stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' }, Math.round(v / 1000) + 'k'));
      s.appendChild(el('text', { x: x(i), y: h - 8, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: proj ? '#94a3b8' : '#5b7187' }, M12[i]));
    });
    c.appendChild(s);
  }

  function drawForecastLL() {
    const c = byId('scFcLL'); if (!c) return; c.innerHTML = '';
    const M12 = MESES.concat(MESES_F);
    const ll12 = D.ll.concat(F.ll);
    const w = 560, h = 270, padL = 58, padR = 14, padT = 20, padB = 30, n = 12, cut = 7;
    const min = -100000, max = 60000;
    const s = svgEl(w, h);
    const x = i => padL + i * (w - padL - padR) / n + (w - padL - padR) / n * 0.16;
    const bw = (w - padL - padR) / n * 0.68;
    const y = v => padT + (h - padT - padB) * (1 - (v - min) / (max - min));
    [-80000, -40000, 0, 40000].forEach(v => { s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(v), y2: y(v), stroke: '#eef3f8' }));
      s.appendChild(el('text', { x: padL - 8, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#5b7187' }, Math.round(v / 1000) + 'k')); });
    s.appendChild(el('line', { x1: padL, x2: w - padR, y1: y(0), y2: y(0), stroke: '#94a3b8', 'stroke-dasharray': '4 4' }));
    ll12.forEach((v, i) => {
      const proj = i >= cut, pos = v >= 0;
      s.appendChild(el('rect', { x: x(i), y: pos ? y(v) : y(0), width: bw, height: Math.abs(y(0) - y(v)), fill: pos ? '#10b981' : '#ef4444', rx: 4, opacity: proj ? .55 : 1, ...(proj ? { stroke: pos ? '#059669' : '#b91c1c', 'stroke-width': 1, 'stroke-dasharray': '3 3' } : {}) }));
      if (Math.abs(v) > 3500) s.appendChild(el('text', { x: x(i) + bw / 2, y: pos ? y(v) - 6 : y(v) + 13, 'text-anchor': 'middle', 'font-size': 8.8, 'font-weight': 800, fill: pos ? '#047857' : '#b91c1c' }, (v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + 'k'));
      s.appendChild(el('text', { x: x(i) + bw / 2, y: h - 8, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, fill: proj ? '#94a3b8' : '#5b7187' }, M12[i]));
    });
    c.appendChild(s);
  }

  // ── API pública ──
  function drawAll() {
    renderKPIs();
    byId('scWfMesLbl') && (byId('scWfMesLbl').textContent = MESES_FULL[SEL] + '/26');
    drawWaterfall('scWaterfall', wfData());
    drawDespChart();
    renderDespTable();
    renderForecastKpis();
    drawForecastCombo();
    drawForecastCaixa();
    drawForecastLL();
  }

  function setMes(i) { SEL = i; drawAll(); }
  function setWfMode(mode, btn) {
    WFMODE = mode;
    if (btn) { btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on')); btn.classList.add('on'); }
    drawWaterfall('scWaterfall', wfData());
  }
  function getSel() { return SEL; }
  function monthOptions() {
    return MESES_FULL.map((m, i) => `<option value="${i}" ${i === SEL ? 'selected' : ''}>${m}/26</option>`).join('');
  }

  return { drawAll, setMes, setWfMode, getSel, monthOptions };
})();
