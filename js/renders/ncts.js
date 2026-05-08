// ═══════════════════════════════════════════════
//  RENDER: NCTs — Narrativas, Compromissos, Tarefas
// ═══════════════════════════════════════════════

async function renderNCTs() {
  const { data } = await fetchData('NCTS');

  // Filtrar linhas válidas
  const rows = data.filter(r => {
    const setor = (r[10]||'').trim();
    const trim  = (r[4]||'').trim();
    const tarefa= (r[2]||'').trim();
    return setor && setor !== 'Setor' && setor !== '#REF!' && trim && /^T[1-4]$/.test(trim) && tarefa;
  });

  const isTrue = v => String(v).trim().toUpperCase() === 'TRUE';

  const totalTarefas = rows.length;
  const doneTarefas  = rows.filter(r => isTrue(r[3])).length;
  const globalPct    = totalTarefas > 0 ? (doneTarefas/totalTarefas*100) : 0;

  // Por trimestre
  const trims = {};
  ['T1','T2','T3','T4'].forEach(t => {
    const tRows = rows.filter(r => (r[4]||'').trim() === t);
    const done  = tRows.filter(r => isTrue(r[3])).length;
    trims[t] = { total: tRows.length, done, pct: tRows.length > 0 ? (done/tRows.length*100) : 0 };
  });

  // Por setor
  const sectors = {};
  rows.forEach(r => {
    const setor = (r[10]||'').trim();
    if (!sectors[setor]) sectors[setor] = { total:0, done:0, tasks:[] };
    sectors[setor].total++;
    const done = isTrue(r[3]);
    if (done) sectors[setor].done++;
    sectors[setor].tasks.push({ tarefa:(r[2]||'').trim(), compromisso:(r[1]||'').trim(), done, trim:(r[4]||'').trim() });
  });

  const sortedSectors = Object.entries(sectors).sort((a,b) => (b[1].done/b[1].total) - (a[1].done/a[1].total));

  const currentQ = 'T' + (Math.floor(new Date().getMonth()/3)+1);

  // Ring global
  const ringColor = globalPct >= 70 ? 'var(--green)' : globalPct >= 40 ? 'var(--amber)' : 'var(--red)';
  const circ = 2*Math.PI*26;
  const ringOff = circ - (globalPct/100)*circ;

  document.getElementById('mainContent').innerHTML = `
    <div class="section-bar">
      <div>
        <div class="section-title">🎯 NCTs 2026</div>
        <div class="section-sub">Narrativas · Compromissos · Tarefas</div>
      </div>
    </div>

    <!-- Progresso global -->
    <div class="ncts-header">
      <div class="ncts-global">
        <div class="ncts-ring-wrap">
          <svg class="ncts-ring-svg" width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border)" stroke-width="6"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="${ringColor}" stroke-width="6"
              stroke-dasharray="${circ}" stroke-dashoffset="${ringOff}" stroke-linecap="round"/>
          </svg>
          <div class="ncts-ring-text">${globalPct.toFixed(0)}%</div>
        </div>
        <div class="ncts-global-info">
          <div class="ncts-global-label">Progresso Geral</div>
          <div class="ncts-global-detail">${doneTarefas} de ${totalTarefas} tarefas concluídas</div>
          <div class="ncts-global-detail">${sortedSectors.length} setores · Trimestre atual: ${currentQ}</div>
        </div>
      </div>
    </div>

    <!-- Trimestrais -->
    <div class="ncts-trims">
      ${['T1','T2','T3','T4'].map(t => {
        const s = trims[t];
        const isCurrent = t === currentQ;
        const color = TRIM_COLORS[t];
        return `<div class="ncts-trim-card ${t.toLowerCase()}">
          <div class="ncts-trim-title">
            <span>${t}${isCurrent ? ' <span style="font-size:10px;color:var(--cyan)">atual</span>' : ''}</span>
            <span class="ncts-trim-pct" style="color:${color}">${s.pct.toFixed(0)}%</span>
          </div>
          <div class="ncts-trim-bar"><div class="ncts-trim-fill" style="width:${s.pct.toFixed(0)}%;background:${color}"></div></div>
          <div class="ncts-trim-detail">${s.done} de ${s.total} tarefas</div>
        </div>`;
      }).join('')}
    </div>

    <!-- Por setor (expandível) -->
    <div class="section-bar" style="margin-top:4px">
      <div class="section-title" style="font-size:16px">Por Setor</div>
    </div>
    <div class="ncts-sectors">
      ${sortedSectors.map(([setor, s]) => {
        const pct   = s.total > 0 ? (s.done/s.total*100) : 0;
        const color = pct >= 70 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--cyan)';
        const emoji = SECTOR_EMOJIS[setor] || '📋';
        const id    = 'ncts-' + setor.replace(/\s+/g,'-');
        const taskHTML = s.tasks.map(t =>
          `<div class="ncts-task">
            <span class="${t.done ? 'ncts-task-done' : 'ncts-task-pend'}">${t.done ? '✓' : '○'}</span>
            <span style="${t.done ? 'text-decoration:line-through;color:var(--text-soft)' : ''}">${esc(t.tarefa)}</span>
          </div>`
        ).join('');

        return `<div class="ncts-sector-card">
          <div class="ncts-sector-name">
            <span>${emoji} ${esc(setor)}</span>
            <span class="ncts-sector-pct" style="color:${color}">${pct.toFixed(0)}%</span>
          </div>
          <div class="ncts-sector-bar">
            <div class="ncts-sector-fill" style="width:${pct.toFixed(0)}%;background:${color}"></div>
          </div>
          <div class="ncts-sector-detail">${s.done}/${s.total} tarefas concluídas</div>
          <button class="ncts-expand-btn" onclick="toggleNcts('${id}')">▼ Ver tarefas</button>
          <div id="${id}" class="ncts-tasks" style="display:none">${taskHTML}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

window.toggleNcts = function(id) {
  const el  = document.getElementById(id);
  const btn = el.previousElementSibling;
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display  = open ? 'none' : 'flex';
  btn.textContent   = open ? '▼ Ver tarefas' : '▲ Ocultar tarefas';
};
