// ═══════════════════════════════════════════════
//  RENDER: VISÃO GERENCIAL — Scorecard Financeiro
// ═══════════════════════════════════════════════

function renderGerencial() {
  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">📋 Visão Gerencial</div>
        <div class="section-sub">Scorecard Financeiro · Controladoria 2026</div>
      </div>
      <a href="scorecard.html" target="_blank" class="hdr-btn" style="text-decoration:none;padding:6px 14px">
        ↗ Abrir em nova aba
      </a>
    </div>
    <div style="margin:0 -16px;height:calc(100vh - 128px)">
      <iframe
        src="scorecard.html"
        style="width:100%;height:100%;border:none;display:block"
        title="Scorecard Financeiro ECGNow 2026"
      ></iframe>
    </div>
  `;
}
