# 🎨 Google Gemini Pro - Setup para TCC

## ✨ Por que Gemini é ideal para TCC?

| Aspecto | Gemini Pro | OpenAI | Ollama |
|---|---|---|---|
| Custo | **Grátis** (60 req/min) | $$ ($0.01/req) | Grátis (local) |
| Qualidade | ⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐⭐ Melhor | ⭐⭐⭐ Boa |
| Velocidade | ⚡ Rápido | ⚡ Rápido | 🐢 Lento (local) |
| Internet | 🌐 Precisa | 🌐 Precisa | ❌ Não precisa |
| Setup | ✅ 2 minutos | ⏱️ Precisa pagar | ⏱️ Instalar |

**Melhor para TCC:** ✅ **Gemini Pro** (grátis + rápido + qualidade)

---

## 🚀 Setup (5 minutos)

### 1️⃣ Obter API Key Gratuitamente

1. Acesse: https://makersuite.google.com/app/apikey
2. Clique em **"Create API Key"**
3. Escolha seu projeto ou crie um novo
4. Copie a chave (começa com `AIza...`)

**⚠️ IMPORTANTE:** Não compartilhe essa chave!

### 2️⃣ Adicionar no `.env`

Abra `backend/.env` e procure:

```diff
# Google Gemini Configuration (Gratuito - 60 req/min)
- GEMINI_API_KEY="sua-chave-aqui"
+ GEMINI_API_KEY="AIza_sua_chave_real_aqui"
```

**Exemplo (fictício):**
```
GEMINI_API_KEY="AIzaSyD7BgVZ_example_key_a1b2c3d4e5f6g7h8i9j0"
```

### 3️⃣ Reiniciar Backend

```bash
npm run dev
```

---

## 📊 Sistema de Fallback (Automático)

O backend **tenta em ordem**:

```
1. OpenAI (se API_KEY configurada) ❌ Sem créditos
   ↓
2. Google Gemini ✅ Usando essa agora!
   ↓
3. Ollama (local) ❌ Não instalado
   ↓
4. Heurístico (fallback) ✅ Sempre funciona
```

**O que você verá no frontend:**

```json
{
  "modelo": "gemini-pro",  ← Vindo do Gemini
  "resumoClinico": "Análise completa...",
  "alertas": [...]
}
```

---

## 🧪 Testar Gemini

Rode este comando para testar a conexão:

```bash
node << 'EOF'
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

model.generateContent('Teste: Responda com uma palavra')
  .then(r => {
    console.log('✅ Gemini conectado!');
    console.log('Resposta:', r.response.text());
  })
  .catch(e => console.log('❌ Erro:', e.message));
EOF
```

---

## 💡 Recursos Gemini Pro

- 60 requisições/minuto (bastante para testes!)
- 32K tokens de entrada
- Suporte a visão computacional (futuro: analisar PDFs de exames)
- Qualidade similar a GPT-3.5

---

## 🎯 Próximas Etapas

1. Obter chave em https://makersuite.google.com/app/apikey
2. Adicionar em `backend/.env`
3. Testar: `npm run dev`
4. Ir para Profissional → Paciente → "Insights IA"
5. Clicar "Gerar Insights"

**Resultado esperado:** Insights detalhados usando Gemini Pro! 🎉

---

## ❓ FAQ

### "Posso usar Gemini em produção?"
Sim! Mas com limite: 60 requisições/minuto. Para TCC está perfeito.

### "E se atingir o limite?"
O sistema cai para a próxima opção (Ollama ou Heurístico).

### "Precisa de cartão de crédito?"
Não! Gemini Pro é completamente grátis.

### "Quanto custa comparado a OpenAI?"
- Gemini: **$0** (gratuito, 60 req/min)
- OpenAI: $0.03 por 1M tokens

### "Posso mudar depois?"
Sim! Só mudar a chave no `.env`. O sistema tenta todas as opções automaticamente.

---

## 🔗 Links Úteis

- API Key: https://makersuite.google.com/app/apikey
- Documentação: https://ai.google.dev/
- Preços: https://ai.google.dev/pricing
- Status da API: https://status.cloud.google.com/

