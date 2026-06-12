# ChavesLog Transportes — Site Institucional

Site single-page da **ChavesLog Transportes** (Chaves & Ardito Ltda.), transportadora
rodoviária de granéis sólidos fundada em 1997. Objetivo: visual premium,
cinematográfico, comparável às maiores transportadoras do setor.

**Anos de empresa são calculados automaticamente** via JS (`[data-anos]`, fundação 1997)
e o ano do copyright via `#anoAtual` — nunca escrever "27 anos"/"29 anos" fixo no HTML.

## Stack & Deploy
- **HTML/CSS/JS puro** (sem framework). Tudo em `index.html`.
- Fontes: **Barlow** + **Barlow Condensed** (Google Fonts).
- Hospedagem: **GitHub** (fonte) + **Vercel** (deploy automático no `git push` pra `main`).
- Após push, a Vercel publica sozinha (~30s). Se não atualizar no navegador: Ctrl+Shift+R (cache).

## Identidade Visual
- Verde institucional `#1a7a3c`, verde claro `#2bc25f`, amarelo `#f0b429`.
- Fundo escuro `#070b09` / `#0d130f` / `#121a14`.
- Estilo: editorial, escuro, premium. **Animações ligadas ao scroll (estilo Apple):**
  parallax no hero, seção fixa que troca números (pinned narrative), timeline com
  linha que se preenche, contadores animados, reveal on scroll, marquee, barra de progresso.
- Performance: um único loop `requestAnimationFrame`; só `transform`/`opacity`;
  respeita `prefers-reduced-motion`.

## Imagens (pasta `img/`)
- `hero-granel.jpg` → hero (foto real do Volvo + Randon, cortada 3:2).
- `sobre.jpg` → seção Quem Somos (frota ao pôr do sol).
- `frota-exemplo.jpg` → seção Frota (Volvo + bicaçambas na estrada).
- `logo-chaveslog-oficial.png` → logo (fundo transparente, verde+amarelo).
- `logo-chaveslog-branco.png` → variante branca p/ fundo escuro (opcional).

### Processamento de imagens (importante)
- Fotos reais chegam via WhatsApp; **sempre processar antes de subir**:
  corte para o enquadramento certo, redimensionar (~1760–1920px no hero),
  comprimir JPEG progressivo (qualidade ~80, alvo < 300 KB).
- **Nunca** trocar a foto real do hero por imagem de IA (a original tinha texto
  embaralhado nos caminhões — "Cmvenog", "Tanbri"). Foto real sempre vence.
- Logo: manter fundo transparente (técnica white-to-alpha com recuperação de cor).

## Dados da Empresa (não alterar sem confirmação)
- Razão social: Chaves & Ardito Ltda. — CNPJ 02.499.966/0001-40
- Fundada em 1997 (Americana/SP); sede própria em Nova Odessa/SP desde 2006.
- WhatsApp/Tel: (19) 99266-3933 — operacional@chaveslog.com.br
- Pátio: Av. Marginal, 95 — Nova Odessa/SP — coords -22.768984730836888, -47.27463853295079
- Escritório: Rua Haiti, 15 — Americana/SP — CEP 13465-681
- KPIs: OTIF 98,7% · 24/7 · +1.000 viagens/mês · ~1.000.000 t/ano · pátio 15.000 m²
- Certificações: SASSMAQ, CR Exército, Polícia Civil, CETESB, IBAMA.
- Conformidade: ANTT, piso mínimo, vale-pedágio, RCV, RCTR-C, RC-DC.

## Seções (ordem no index.html)
navbar → hero → marquee → KPIs → Sobre → pinned narrative → Especialidades →
Conformidade → Frota → Estrutura (mapa) → Certificações → História/timeline →
**Mercado & Notícias (#noticias, automática)** → CTA band → Contato (form vira
mensagem WhatsApp) → footer → WhatsApp flutuante.

## APIs serverless (pasta `api/`, rodam na Vercel)
- `api/indicadores.js` → JSON com dólar (AwesomeAPI), diesel S10 média nacional
  (CSV aberto da ANP, ~3,5 MB, semana mais recente) e soja Paranaguá + milho
  (widget público CEPEA, ids 92 e 77). Cache de borda: 6h.
- `api/noticias.js` → 6 notícias mais recentes dos feeds RSS do Canal Rural e
  G1 Agronegócios (título, link, categoria, fonte, data). Cache de borda: 1h.
- A seção #noticias começa `display:none` e só aparece se alguma API responder —
  abrindo o `index.html` localmente (sem Vercel) ela fica oculta, é o esperado.
- Todas as fontes exigem User-Agent de navegador (gov.br e CEPEA bloqueiam bots).
- SEO: head tem JSON-LD LocalBusiness + favicon (`img/favicon.svg` e
  `img/apple-touch-icon.png`).

## Workflow
1. Pedir alterações em linguagem natural.
2. Testar localmente com `node .claude/dev-server.mjs` → http://localhost:8123
   (serve o site **e** as APIs da pasta `api/`, igual à Vercel).
3. Publicar: `git add . && git commit -m "..." && git push`
4. Conferir em chaveslog.com.br após o deploy da Vercel.

## Backlog / ideias futuras
- Trocar a foto do Volvo por uma sem as fitas azuis de proteção (veículo novo).
- Conseguir fotos do hero em resolução maior (as atuais vieram do WhatsApp, 1280px).
- Seção de depoimentos / clientes.
