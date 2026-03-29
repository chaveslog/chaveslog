# Guia de Atualização de Notícias - ChavesLog

## Como Atualizar as Notícias do Site

As notícias do site são carregadas automaticamente do arquivo `noticias.json`. Você **não precisa editar o HTML**, apenas o JSON!

### 📝 Para Adicionar/Editar uma Notícia:

1. **Abra o arquivo:** `noticias.json` (na raiz do projeto)

2. **Estrutura de uma notícia:**
```json
{
  "id": 1,
  "titulo": "Seu título aqui",
  "categoria": "AGRONEGÓCIO",
  "categoriaSlug": "agronegocio",
  "emoji": "🌾",
  "cor": "amber",
  "descricao": "Descrição da notícia...",
  "data": "26 de março de 2026"
}
```

### 🎨 Cores Disponíveis:
- `"amber"` - Laranja (Agronegócio)
- `"blue"` - Azul (Regulamentação)
- `"green"` - Verde (Logística)
- `"yellow"` - Amarelo (Mercado)
- `"purple"` - Roxo (Sustentabilidade)
- `"red"` - Vermelho (Análise)

### 😊 Emojis Sugeridos:
- 🌾 - Agronegócio
- 📋 - Regulamentação/Documentos
- 🚚 - Logística/Transporte
- 💰 - Mercado/Preços
- ♻️ - Sustentabilidade
- 📊 - Análise/Dados

### 📱 Exemplo Prático:

**Para adicionar uma nova notícia:**

```json
{
  "noticias": [
    // ... notícias existentes ...
    {
      "id": 7,
      "titulo": "Frota ChavesLog Alcança 50 Novos Veículos",
      "categoria": "EMPRESA",
      "categoriaSlug": "empresa",
      "emoji": "🚛",
      "cor": "amber",
      "descricao": "ChavesLog expande sua frota com 50 novos caminhões equipados com tecnologia GPS avançada.",
      "data": "29 de março de 2026"
    }
  ]
}
```

### ⚠️ Importante:

1. **Mantenha a estrutura JSON válida** - certifique-se que há vírgulas entre os objetos
2. **O `id` deve ser único** - incremente em relação à última notícia
3. **Respeite as categorias conhecidas** - use cores e emojis de acordo com o tipo
4. **Não edite o `index.html`** - tudo é atualizado automaticamente via JSON

### 🔄 Como Funciona:

1. Você edita o `noticias.json`
2. Faz commit e push para GitHub
3. Vercel faz deploy automaticamente
4. O site carrega as notícias do JSON via JavaScript
5. As notícias aparecem assim que o site é carregado!

### 🚀 Frequência de Atualização:

Recomendamos atualizar:
- **Notícias importantes**: Assim que ocorrem
- **Mercado/Preços**: Semanalmente
- **Dicas de logística**: Mensalmente

---

**Dúvidas?** Entre em contato com o time de desenvolvimento.
