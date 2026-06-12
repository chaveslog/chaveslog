// /api/indicadores.js — agrega indicadores de mercado de fontes públicas oficiais.
// Fontes: AwesomeAPI (dólar), CEPEA/ESALQ-USP (soja e milho), ANP (diesel S10).
// O resultado fica em cache na borda da Vercel por 6h (s-maxage), então as
// fontes são consultadas poucas vezes por dia, independente do tráfego do site.

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
};

async function buscarDolar() {
  const r = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
  if (!r.ok) throw new Error('awesomeapi ' + r.status);
  const d = (await r.json()).USDBRL;
  return {
    valor: parseFloat(d.bid),
    variacao: parseFloat(d.pctChange),
    data: (d.create_date || '').slice(0, 10)
  };
}

async function buscarCepea() {
  // Widget público oficial do CEPEA (id 92 = Soja Paranaguá, id 77 = Milho)
  const url =
    'https://www.cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=ffffff&cortexto=333333&corlinha=cccccc&id_indicador%5B%5D=92&id_indicador%5B%5D=77';
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error('cepea ' + r.status);
  const html = await r.text();
  const linhas = html.matchAll(
    /<tr>\s*<td>([\d/]+)<\/td>\s*<td><span class="maior">([^<]+)<\/span>[\s\S]*?R\$\s*<span class="maior">([\d.,]+)<\/span>/g
  );
  const out = {};
  for (const m of linhas) {
    const item = {
      valor: parseFloat(m[3].replace(/\./g, '').replace(',', '.')),
      unidade: 'sc 60kg',
      data: m[1]
    };
    if (/soja/i.test(m[2])) out.soja = item;
    else if (/milho/i.test(m[2])) out.milho = item;
  }
  if (!out.soja && !out.milho) throw new Error('cepea: nenhuma cotação encontrada');
  return out;
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
  const [dolar, cepea, diesel] = await Promise.allSettled([
    buscarDolar(),
    buscarCepea(),
    buscarDieselS10()
  ]);
  const ok = (p) => (p.status === 'fulfilled' ? p.value : null);
  const c = ok(cepea) || {};
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    dolar: ok(dolar),
    diesel: ok(diesel),
    soja: c.soja || null,
    milho: c.milho || null,
    atualizado: new Date().toISOString()
  });
}
