# ⚠️ Gemini API Key Inválida - Como Corrigir

## 🔴 Problema

```
❌ Erro: API key not valid. Please pass a valid API key.
```

Sua chave Gemini atual não está ativa ou válida.

---

## ✅ Solução (5 minutos)

### 1️⃣ Acessar Google AI Studio

1. Abra: https://makersuite.google.com/app/apikey
2. Você deve estar logado com sua conta Google
3. Se não conseguir acessar, crie uma nova conta Google

### 2️⃣ Gerar Nova API Key

**Opção A - Criar uma Nova (Recomendado):**
1. Clique no botão **"Create API Key"** (azul)
2. Escolha **"Create API key in new project"**
3. Aguarde a criação
4. Copie a chave (começa com `AIza...`)

**Opção B - Usar Existente:**
1. Se já tiver uma chave, clique nela
2. Verifique se mostra **"Active"** (não "Inactive")
3. Se estiver inativa, delete e crie uma nova

### 3️⃣ Adicionar no `.env`

Abra `backend/.env`:

```env
# Google Gemini Configuration
GEMINI_API_KEY="AIza_NOVA_CHAVE_AQUI"
```

**Exemplo (fictício):**
```
GEMINI_API_KEY="AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567890"
```

### 4️⃣ Confirmar a Chave

```bash
# No terminal, dentro de /backend:
node -e "
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
model.generateContent('Teste')
  .then(r => console.log('✅ Gemini OK:', r.response.text()))
  .catch(e => console.log('❌ Erro:', e.message));
"
```

Se retornar **"✅ Gemini OK"** → Funcionando!

### 5️⃣ Reiniciar Backend

```bash
npm run dev
```

---

## 🔍 Diagnosticando

Agora o sistema mostra qual provedor está usando:

**Quando você gera um insight, o terminal mostrará:**

```
[INSIGHTS] Insight gerado com modelo: gemini-pro para paciente João
```

Ou se falhar:

```
[GEMINI][ERRO] API key not valid...
[GEMINI] Caindo para próximo provedor...
[INSIGHTS] Insight gerado com modelo: heuristico-local-v1 para paciente João
```

---

## 🆘 Ainda não funciona?

### Possíveis problemas:

1. **Chave errada**
   - Copie sem espaços em branco
   - Verifique se começa com `AIza`

2. **Gem não habilitada**
   - Acesse: https://console.cloud.google.com/
   - Procure por "Generative Language API"
   - Clique em "Enable"

3. **Conta sem acesso**
   - Tente com outra conta Google
   - Verifique se não tem bloqueio de país

4. **Limite atingido**
   - Máximo 60 requisições/minuto
   - Aguarde 1 minuto antes de tentar novamente

---

## 📚 Referência

- **API Key Dashboard:** https://makersuite.google.com/app/apikey
- **Documentação:** https://ai.google.dev/docs
- **Status da API:** https://status.cloud.google.com/

---

## 💡 Próxima Ação

1. Gere uma **NOVA** chave em https://makersuite.google.com/app/apikey
2. Cole no `.env`
3. Teste com o comando acima
4. Reinicie: `npm run dev`
5. Tente gerar insight novamente

Boa sorte! 🚀
