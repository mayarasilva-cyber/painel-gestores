// ═══════════════════════════════════════════════
//  AUTH — Controle de acesso com hash SHA-256
//  A senha nunca é armazenada em texto puro.
// ═══════════════════════════════════════════════

const AUTH_KEY = 'ecgnow-gestores-v1';

async function sha256hash(str) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function checkAuth() {
  return sessionStorage.getItem(AUTH_KEY) === '1';
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  document.getElementById('authOverlay').style.display = 'flex';
  document.getElementById('appContent').style.display = 'none';
  document.getElementById('authInput').value = '';
  document.getElementById('authError').style.display = 'none';
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const pwd = document.getElementById('authInput').value;
  sha256hash(pwd).then(hash => {
    if (hash === AUTH_HASH) {
      sessionStorage.setItem(AUTH_KEY, '1');
      document.getElementById('authOverlay').style.display = 'none';
      document.getElementById('appContent').style.display = 'block';
      initApp();
    } else {
      document.getElementById('authError').style.display = 'block';
      document.getElementById('authInput').value = '';
      document.getElementById('authInput').focus();
    }
  });
}

// Ao carregar: verificar sessão ativa
window.addEventListener('DOMContentLoaded', () => {
  if (checkAuth()) {
    document.getElementById('authOverlay').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
    initApp();
  } else {
    document.getElementById('authOverlay').style.display = 'flex';
    document.getElementById('appContent').style.display = 'none';
    setTimeout(() => document.getElementById('authInput').focus(), 100);
  }
});
