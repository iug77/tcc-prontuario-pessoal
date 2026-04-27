# 🔍 Diagnóstico: Por que os Insights não aparecem?

## ❌ PROBLEMA IDENTIFICADO

Sua chave OpenAI retornou erro **429 - Quota Excedida**.

Isso significa:
- ❌ Sem créditos suficientes na conta
- ❌ Limite de requisições atingido
- ❌ Método de pagamento não vinculado

**Resultado:** OpenAI falha → Sistema volta para `heuristico-local-v1` (FALLBACK)

---

## ✅ SOLUÇÃO

O sistema **JÁ ESTÁ FUNCIONANDO**, mas está usando o método heurístico (fallback) em vez da OpenAI.

### O que fazer:

1. **Acesse sua conta OpenAI**
   - https://platform.openai.com/account/billing/overview

2. **Adicione método de pagamento**
   - Clique em "Billing" → "Add to credit balance"
   - Adicione $20-50 USD (suficiente para testes)

3. **Verifique se a chave está ativa**
   - https://platform.openai.com/account/api-keys
   - Clique em sua chave → "View last use"
   - Deve mostrar "Last used: N/A" ou data recente

4. **Reinicie o servidor**
   - Feche: `npm run dev`
   - Abra: `npm run dev`

5. **Teste novamente**
   - Vá para Profissional → Paciente → Inspirits IA
   - Clique "Gerar Insights"
   - Agora deve chamar a OpenAI em vez do fallback

---

## 📊 O que você deveria ver

### Sem Créditos (AGORA):
```json
{
  "modelo": "heuristico-local-v1",  ← FALLBACK
  "alertas": [
    { "titulo": "Sem registros...", "descricao": "..." }
  ],
  "tendencias": [...],
  "pendencias": [...]
}
```

**Nota:** O sistema ainda **mostra dados**, mas com modelo local.

### Com Créditos (DEPOIS):
```json
{
  "modelo": "openai-gpt-4o-mini",  ← OpenAI
  "alertas": [
    { "titulo": "Carência de registros recentes", "descricao": "..." }
  ],
  "resumoClinico": "Análise completa usando GPT..."
}
```

**Diferença:** Insights muito mais detalhados e contextualizados.

---

## 🧪 Teste de Conexão

Se quiser verificar se a chave funciona agora, rode:

```bash
cd backend
node -e "require('dotenv').config(); const {OpenAI} = require('openai'); const openai = new OpenAI(); openai.chat.completions.create({model:'gpt-4o-mini', messages:[{role:'user', content:'test'}], max_tokens: 10}).then(r => console.log('✅ Conexão OK:', r.choices[0].message.content)).catch(e => console.log('❌ Erro:', e.message))"
```

---

## 💡 Por enquanto...

Você pode:
- ✅ Testar toda a interface com dados heurísticos
- ✅ Saber que o sistema está completo e funcionando
- ✅ Aguardar adicionar créditos OpenAI para insights IA real

---

## ❓ Dúvidas?

- **"Por que o frontend não mostra nada?"**
  → Verifique se há erro no console (F12) ou no terminal backend (npm run dev)

- **"E se eu não quiser usar OpenAI?"**
  → Pode integrar Ollama (local), Claude, ou Google Gemini depois

- **"Quanto custa?"**
  → `gpt-4o-mini`: ~$0.01 por insight (muito barato!)

