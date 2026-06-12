// /api/noticias.js — busca notícias do setor em feeds RSS públicos e devolve
// as mais recentes em JSON. Cache de 1h na borda da Vercel: as notícias se
// renovam sozinhas, sem manutenção manual.

const UA = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
};

const FONTES = [
  { nome: 'Canal Rural', url: 'https://www.canalrural.com.br/feed/' },
  { nome: 'G1 Agronegócios', url: 'https://g1.globo.com/rss/g1/economia/agronegocios/' }
];

function decodificar(s) {
  return (s || '')
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#8217;|&rsquo;/g, '’')
    .trim();
}

function parseRss(xml, fonte) {
  const itens = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const bloco = m[1];
    const tag = (nome) => {
      const r = bloco.match(new RegExp('<' + nome + '[^>]*>([\\s\\S]*?)</' + nome + '>'));
      return r ? decodificar(r[1]) : '';
    };
    const titulo = tag('title');
    const link = tag('link');
    if (!titulo || !link) continue;
    itens.push({
      titulo,
      link,
      categoria: tag('category') || 'Agronegócio',
      pubDate: tag('pubDate'),
      fonte
    });
  }
  return itens;
}

export default async function handler(req, res) {
  const resultados = await Promise.allSettled(
    FONTES.map(async (f) => {
      const r = await fetch(f.url, { headers: UA });
      if (!r.ok) throw new Error(f.nome + ' ' + r.status);
      return parseRss(await r.text(), f.nome);
    })
  );

  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const vistos = new Set();
  const noticias = resultados
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .map((n) => ({ ...n, ts: new Date(n.pubDate).getTime() || 0 }))
    .sort((a, b) => b.ts - a.ts)
    .filter((n) => {
      const chave = n.titulo.toLowerCase();
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    })
    .slice(0, 6)
    .map((n) => {
      const d = new Date(n.ts);
      return {
        titulo: n.titulo,
        link: n.link,
        categoria: n.categoria,
        fonte: n.fonte,
        data: n.ts ? d.getDate() + ' ' + meses[d.getMonth()] + ' ' + d.getFullYear() : ''
      };
    });

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=21600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({ noticias, atualizado: new Date().toISOString() });
}
