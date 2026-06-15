// ═══════════════════════════════════════════════════════════════
//  PAINEL GESTORES ECGNOW — Proxy de Dados (Google Apps Script)
//
//  Substitui as URLs públicas da planilha. A planilha pode ficar
//  privada; apenas este script lê os dados, e só responde se
//  receber a chave secreta correta.
//
//  COMO IMPLANTAR:
//  1. Abra script.google.com → Novo projeto → cole este código
//  2. Clique em "Implantar" → "Novo implante"
//  3. Tipo: App da Web
//     Executar como: Eu (seuemail@ecgnow.com.br)
//     Quem tem acesso: Qualquer pessoa
//  4. Clique em Implantar → copie a URL gerada
//  5. Cole a URL em js/config.js no campo PROXY_URL
// ═══════════════════════════════════════════════════════════════

const SHEET_ID   = '1i4edK-b4bhnlR5SvxJlR9wVojgolEeW2mJoV6QrMm4Y';
const SECRET_KEY = '51e1f9023eb17a43fc50769d096428d75eb6241831827f3d';

function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};

  // ── Verificação da chave secreta ──
  if (p.key !== SECRET_KEY) {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const gid = parseInt(p.gid, 10);
  if (isNaN(gid)) {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const ss     = SpreadsheetApp.openById(SHEET_ID);
    const sheet  = ss.getSheets().find(s => s.getSheetId() === gid);

    if (!sheet) {
      return ContentService
        .createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // getDisplayValues() retorna o texto visível da célula (igual ao CSV exportado),
    // evitando que datas virem objetos Date e números percam a formatação.
    const values = sheet.getDataRange().getDisplayValues();
    const csv = values.map(row =>
      row.map(cell => {
        const s = cell == null ? '' : cell;
        return (s.includes(',') || s.includes('"') || s.includes('\n'))
          ? '"' + s.replace(/"/g, '""') + '"'
          : s;
      }).join(',')
    ).join('\n');

    return ContentService
      .createTextOutput(csv)
      .setMimeType(ContentService.MimeType.CSV);

  } catch (err) {
    return ContentService
      .createTextOutput('')
      .setMimeType(ContentService.MimeType.TEXT);
  }
}
