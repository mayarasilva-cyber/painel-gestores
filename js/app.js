// ═══════════════════════════════════════════════
//  APP — Init, tab switching, controles
// ═══════════════════════════════════════════════

let currentTab = 'GERAL';
let examFilter = { HOLTER:'all', MAPA:'all', ECG:'all' };

function initApp() {
  const now = new Date();
  selMonth = now.getMonth();
  selYear  = now.getFullYear();

  const mS = document.getElementById('selMonth');
  const yS = document.getElementById('selYear');

  if (!mS.options.length) {
    MONTHS.forEach((m, i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = m;
      if (i === selMonth) o.selected = true;
      mS.appendChild(o);
    });
    for (let y = 2024; y <= now.getFullYear()+1; y++) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      if (y === selYear) o.selected = true;
      yS.appendChild(o);
    }
    mS.addEventListener('change', () => { selMonth = +mS.value; refreshAll(); });
    yS.addEventListener('change', () => { selYear  = +yS.value; refreshAll(); });
  }

  preloadAll();
  setInterval(() => { clearCache(); preloadAll(); }, 5*60*1000);
}

async function preloadAll() {
  const keys = ['HOLTER','HOLTER_IEM','REPETICAO','MAPA','ECG','FINANCEIRO','NCTS','INFO_2025','INFO_2026'];

  // Só exibe spinner se não tiver dados em cache — se tiver, abre instantâneo
  if (!lsHasData()) showLoading();

  const results = await Promise.allSettled(keys.map(k => fetchData(k)));
  results.forEach((r, i) => { if (r.status === 'rejected') console.warn(keys[i]+' falhou:', r.reason); });
  loadTab(currentTab);
}

function refreshAll() { clearCache(); preloadAll(); }

function setViewMode(m) {
  viewMode = m;
  document.getElementById('viewMonth').classList.toggle('active', m === 'month');
  document.getElementById('viewWeek').classList.toggle('active',  m === 'week');
  loadTab(currentTab);
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  loadTab(tab);
}

window.setExamFilter = function(tab, f) { examFilter[tab] = f; loadTab(tab); };

function showLoading() {
  document.getElementById('mainContent').innerHTML =
    '<div class="loading"><div class="spinner"></div><span class="loading-text">Carregando dados…</span></div>';
}

async function loadTab(tab) {
  const el = document.getElementById('mainContent');
  el.innerHTML = '<div class="loading"><div class="spinner"></div><span class="loading-text">Carregando…</span></div>';
  try {
    if      (tab === 'GERAL')     await renderGeral();
    else if (tab === 'PRODUCAO')  await renderProducao();
    else if (tab === 'REPETICAO') await renderRepeticao();
    else if (tab === 'FINANCEIRO')await renderFinanceiro();
    else if (tab === 'NCTS')      await renderNCTs();
    document.getElementById('lastUpd').textContent =
      'Atualizado ' + new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  } catch (e) {
    el.innerHTML = `<div class="error-box">⚠️ Erro ao carregar: ${esc(e.message)}</div>`;
    console.error(e);
  }
}
