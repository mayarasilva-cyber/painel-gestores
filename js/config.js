// ═══════════════════════════════════════════════
//  CONFIG — Painel Gestores ECGNow
// ═══════════════════════════════════════════════

const CSV_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTcbbHtFlaA3tt8Mv1NF22YPbetZRLM9chO6G1gqWSpO2RSPQu_7Gzi_V4RINu_CYG-tGCQI4evg3RF/pub?single=true&output=csv&gid=';

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
};

const COLS = {
  HOLTER:    { date:1, emerg:0, tempo:4, central:7 },
  MAPA:      { date:1, emerg:0, tempo:4, central:6 },
  ECG:       { date:2, emerg:0, tempo:4, central:6 },
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

// Hash SHA-256 da senha de acesso (a senha real não fica exposta no código).
// Para trocar a senha: no console do navegador, execute:
//   sha256hash('SUA_NOVA_SENHA').then(h => console.log(h))
// Cole o resultado abaixo.
// Hash atual corresponde à senha: ecgnow2026
const AUTH_HASH = '2f0921176b76b193c22319da1856df0d3bd5f42e6ccd51fecd59ed2be08a6d18';
