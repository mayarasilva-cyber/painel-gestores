// ═══════════════════════════════════════════════
//  RENDER: VISÃO GERENCIAL — Scorecard Financeiro (nativo)
//  DRE Cascata · Despesas por Categoria · Forecast 2026
//  Dados fixos da Controladoria (Jan–Mai realizado, Jun–Dez projetado).
// ═══════════════════════════════════════════════

function renderGerencial() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">📋 Visão Gerencial</div>
        <div class="section-sub">Scorecard Financeiro · Controladoria 2026</div>
      </div>
      <div class="sc-bar-tools">
        <label class="sc-mes-pick">Mês de referência
          <select onchange="SC.setMes(+this.value)">${SC.monthOptions()}</select>
        </label>
        <a href="scorecard.html" target="_blank" class="hdr-btn" style="text-decoration:none;padding:6px 14px">↗ Abrir completo</a>
      </div>
    </div>

    <!-- KPIs executivos do mês -->
    <div class="sc-kpi-grid" id="scKpis"></div>

    <!-- DRE em Cascata -->
    <div class="card" style="margin-top:4px">
      <div class="card-title">
        🪜 DRE em Cascata — <span id="scWfMesLbl" style="color:var(--cyan)">Maio/26</span>
        <span class="sc-wf-toggle">
          <button class="on" onclick="SC.setWfMode('mes', this)">Mês</button>
          <button onclick="SC.setWfMode('ytd', this)">Acumulado (YTD)</button>
        </span>
      </div>
      <div class="sc-chart-wrap" id="scWaterfall"></div>
      <div class="sc-legend">
        <span><i style="background:#0a3d6e"></i>Receita</span>
        <span><i style="background:#f0879b"></i>Deduções/Custos</span>
        <span><i style="background:#0ea5e9"></i>EBITDA</span>
        <span><i style="background:#10b981"></i>Lucro Líquido</span>
      </div>
    </div>

    <!-- Despesas por categoria -->
    <div class="two-col" style="margin-top:4px">
      <div class="card">
        <div class="card-title">📊 Despesas por Categoria <span class="sc-card-sub">empilhadas · Jan–Jul/26</span></div>
        <div class="sc-chart-wrap" id="scDespChart"></div>
      </div>
      <div class="card">
        <div class="card-title">📋 Despesas — <span id="scDespTag" style="color:var(--cyan);font-weight:600">Maio/26</span></div>
        <div class="sc-table-wrap" id="scDespTable"></div>
      </div>
    </div>

    <!-- Forecast 2026 -->
    <div class="section-bar" style="margin-top:8px">
      <div>
        <div class="section-title" style="font-size:16px">🔮 Forecast 2026</div>
        <div class="section-sub">realizado Jan–Jul + projeção Ago–Dez</div>
      </div>
    </div>
    <div class="sc-kpi-grid" id="scFcKpis"></div>

    <div class="card" style="margin-top:4px">
      <div class="card-title">📈 Faturamento × EBITDA% — 12 meses</div>
      <div class="sc-chart-wrap" id="scFcChart"></div>
    </div>

    <div class="two-col" style="margin-top:4px">
      <div class="card">
        <div class="card-title">💵 Evolução do Caixa</div>
        <div class="sc-chart-wrap" id="scFcCaixa"></div>
      </div>
      <div class="card">
        <div class="card-title">📉 Lucro Líquido mensal</div>
        <div class="sc-chart-wrap" id="scFcLL"></div>
      </div>
    </div>
  `;

  SC.drawAll();
}
