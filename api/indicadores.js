// /api/indicadores.js — agrega indicadores de mercado de fontes públicas oficiais.
// Fontes: Banco Central (dólar PTAX) e ANP (diesel S10). Soja e milho (CEPEA)
// são carregados direto no navegador do visitante (ver index.html), pois o
// CEPEA bloqueia requisições vindas de datacenters (403), assim como a
// AwesomeAPI limita IPs compartilhados da Vercel (429).
// O resultado fica em cache na borda da Vercel por 6h (s-maxage), então as
// fontes são consultadas poucas vezes por dia, independente do tráfego do site.

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
};

async function buscarDolar() {
  // Série SGS 1 do Banco Central: dólar comercial (venda) PTAX, diário oficial
  const r = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/2?formato=json', {
    headers: UA
  });
  if (!r.ok) throw new Error('bcb ' + r.status);
  const serie = await r.json();
  if (!Array.isArray(serie) || !serie.length) throw new Error('bcb: serie vazia');
  const hoje = serie[serie.length - 1];
  const ontem = serie.length > 1 ? serie[serie.length - 2] : null;
  const valor = parseFloat(hoje.valor);
  return {
    valor,
    variacao: ontem ? ((valor - parseFloat(ontem.valor)) / parseFloat(ontem.valor)) * 100 : null,
    data: hoje.data
  };
}

async function buscarDieselS10() {
  // CSV oficial da ANP com preços de postos das últimas 4 semanas (~3,5 MB).
  // Calculamos a média nacional do DIESEL S10 da semana mais recente.
  const url =
    'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/shpc/qus/ultimas-4-semanas-diesel-gnv.csv';
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error('anp ' + r.status);
  const texto = await r.text();
  const linhas = texto.split('\n');
  const cab = linhas[0].split(';');
  const iProd = cab.findIndex((c) => c.includes('Produto'));
  const iData = cab.findIndex((c) => c.includes('Data da Coleta'));
  const iValor = cab.findIndex((c) => c.includes('Valor de Venda'));
  let maxT = 0;
  const amostras = [];
  for (let i = 1; i < linhas.length; i++) {
    const c = linhas[i].split(';');
    if (c[iProd] !== 'DIESEL S10') continue;
    const valor = parseFloat((c[iValor] || '').replace(',', '.'));
    if (!valor) continue;
    const [dd, mm, aa] = c[iData].split('/');
    const t = new Date(+aa, mm - 1, +dd).getTime();
    if (!t) continue;
    amostras.push({ t, valor });
    if (t > maxT) maxT = t;
  }
  const recentes = amostras.filter((a) => a.t > maxT - 7 * 864e5);
  if (!recentes.length) throw new Error('anp: sem amostras recentes');
  const media = recentes.reduce((s, a) => s + a.valor, 0) / recentes.length;
  const d = new Date(maxT);
  const fmt = (n) => String(n).padStart(2, '0');
  return {
    valor: Math.round(media * 100) / 100,
    unidade: 'R$/litro',
    postos: recentes.length,
    semana: fmt(d.getDate()) + '/' + fmt(d.getMonth() + 1) + '/' + d.getFullYear()
  };
}

export default async function handler(req, res) {
  const [dolar, diesel] = await Promise.allSettled([buscarDolar(), buscarDieselS10()]);
  const ok = (p) => (p.status === 'fulfilled' ? p.value : null);
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const saida = {
    dolar: ok(dolar),
    diesel: ok(diesel),
    atualizado: new Date().toISOString()
  };
  if ((req.url || '').includes('debug')) {
    saida.erros = [dolar, diesel]
      .filter((p) => p.status === 'rejected')
      .map((p) => String(p.reason && p.reason.message ? p.reason.message : p.reason));
  }
  return res.status(200).json(saida);
}
