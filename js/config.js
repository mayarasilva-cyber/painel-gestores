// ═══════════════════════════════════════════════
//  CONFIG — Painel Gestores ECGNow
// ═══════════════════════════════════════════════

// ── Proxy de dados (Google Apps Script) ──────────────────────────
// Substitui a planilha pública. A planilha pode ficar privada.
// PROXY_URL: cole aqui a URL gerada após implantar apps-script/proxy.gs
const PROXY_URL = 'https://script.google.com/macros/s/AKfycbzvUhuGOhBjRu74swBBS5sjgjQO5s0WFXIunxG9n9JlMLe8TQhjkt9YiKVEEHltG2U/exec';
const PROXY_KEY = '51e1f9023eb17a43fc50769d096428d75eb6241831827f3d';
const CSV_BASE  = PROXY_URL + '?key=' + PROXY_KEY + '&gid=';

const CSV_GIDS = {
  HOLTER:        '0',
  HOLTER_IEM:    '935984391',
  REPETICAO:     '65846932',
  MAPA:          '1563131554',
  ECG:           '135941513',
  CHAMADOS:      '1748165610',
  FINANCEIRO:    '558473626',
  NCTS:          '1774453101',
  INFO_2025:     '2085163821',
  INFO_2026:     '1499671050',
  FATURAMENTO:   '728532394',
};

const COLS = {
  HOLTER:    { date:1, dateSolic:1, dateConc:2, emerg:0, tempo:4, central:7 },
  MAPA:      { date:1, dateSolic:1, dateConc:2, emerg:0, tempo:4, central:6 },
  ECG:       { date:2, dateSolic:2, dateConc:3, emerg:0, tempo:4, central:6 },
  REPETICAO: { date:0, central:1, analista:2, motivo:3, saaslaudo:9, modalidade:10 },
  CHAMADOS:  { status:0, date:1, atendente:4, origem:6, tipoSolic:8, tempo:11 },
  FINANCEIRO:{ tipo:0, categoria:1, status:4, banco:5, valorPrev:6, valorReal:7, dataPrev:8, dataReal:9 },
  // INFO_2025 / INFO_2026: mes(0), faturamento(1), custo(2), margemBruta(3),
  //   despFixas(4), pctDF(5), ebitda(6), lucroLiq(7), ecg(8), holter(9), mapa(10), te(11)
  INFO: { mes:0, fat:1, custo:2, margem:3, despFixas:4, pctDF:5, ebitda:6, lucro:7, ecg:8, holter:9, mapa:10, te:11 },
};

const MONTHS       = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const SECTOR_EMOJIS = {
  Comercial:'💼', CS:'🎧', 'Educação':'📚', Financeiro:'💰',
  'Gestão de Pessoas':'👥', Holter:'📊', Marketing:'📣', TI:'💻',
};

const TRIM_COLORS = { T1:'var(--cyan)', T2:'var(--amber)', T3:'var(--green)', T4:'var(--purple)' };

// Impostos Lucro Presumido sobre receita de serviços
const IMPOSTOS_RECEITA  = { PIS:0.0065, COFINS:0.03, CSLL:0.0288, IR:0.048 };
const TOTAL_IMPOSTOS    = Object.values(IMPOSTOS_RECEITA).reduce((a,b) => a+b, 0); // ~10.53%
const CATS_DESCONTO_20  = ['1.2 Pacote de laudos'];
const CATS_SAAS_DESCONTO= ['3.1 Licença de uso'];

// Hash SHA-256 da senha de acesso (a senha real NUNCA deve ser escrita aqui).
// Para trocar a senha: no console do navegador, execute:
//   sha256hash('SUA_NOVA_SENHA').then(h => console.log(h))
// Cole o hash resultante abaixo.
const AUTH_HASH = '6d4d1066c45ddbad19d6c7a0c257975cc1c4a65d444e3f62e1b9a6844c6222a1';
