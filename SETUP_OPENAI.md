# 🚀 Guia de Integração OpenAI

## ✅ O que foi feito

1. ✅ Instalado `openai` package (v4.x)
2. ✅ Instalado `dotenv` para variáveis de ambiente
3. ✅ Adicionado arquivo `.env` com placeholders
4. ✅ Modificado `InsightsIAController.js` com suporte OpenAI
5. ✅ Código validado sem erros de sintaxe

## 📋 Próximos passos

### 1. Obter API Key do OpenAI

1. Acesse: https://platform.openai.com/account/api-keys
2. Clique em **"Create new secret key"**
3. Copie a chave (ela começará com `sk-...`)
4. **IMPORTANTE**: Nunca compartilhe ou comite essa chave em Git!

### 2. Adicionar chave no `.env`

Abra `backend/.env` e substitua:

```diff
- OPENAI_API_KEY="sk-YOUR_API_KEY_HERE"
+ OPENAI_API_KEY="sk-sua-chave-aqui"
```

**Exemplo (FICTÍCIO):**
```
OPENAI_API_KEY="sk-proj-ABC123defGHI456jklMNO789"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
```

### 3. Verificar créditos disponíveis

Você precisa ter créditos na conta OpenAI:
- Acesse: https://platform.openai.com/account/billing/overview
- Verifique **"Billing"** → **"Usage"**

**Orçamentos recomendados:**
- Desenvolvimento/testes: $5-10
- Produção: Definir limite de gastos em **"Billing limits"**

### 4. Testes

O sistema agora faz:

**Fluxo quando gera insights:**
```
1. Profissional clica "Insights IA" para paciente
2. Sistema chama OpenAI com contexto dos registros
3. OpenAI retorna análise estruturada (JSON)
4. Sistema salva análise no banco de dados
```

**Logs:** Os erros aparecem no console do backend (npm run dev)

### 5. Entender a integração

- **Modelo padrão**: `gpt-4o-mini` (mais barato e rápido)
- **Temperatura**: 0.7 (valor padrão, 0-1, controla criatividade)
- **Max tokens**: 1000 (máximo de tokens na resposta)

Se quiser testar um modelo mais avançado, mude em `.env`:
```
OPENAI_MODEL="gpt-4-turbo"  # Mais preciso, mais caro
```

### 6. Fallback automático

**Importante:** Se a API falhar, o sistema voltar para o método heurístico local!
- Conexão internet fora?
- Chave inválida?
- Limite de requisições atingido?

→ Sistema continua funcionando com insights heurísticos

## 🔐 Segurança

- ✅ Chave de API no `.env` (não comitada em Git)
- ✅ Validação de permissões antes de chamar API
- ✅ Limite de tokens para evitar custos altos
- ✅ Fallback seguro se API falhar
- ✅ Audit log de todas as operações

## 💰 Custos estimados

`gpt-4o-mini` é o modelo mais barato:
- Entrada: $0.15 por 1M tokens
- Saída: $0.60 por 1M tokens

**Exemplo:** Se gerar 100 insights com ~500 tokens cada:
- Custo estimado: ~$0.03 - $0.10

## 🐛 Troubleshooting

### Erro: "401 Unauthorized"
→ Chave de API inválida ou expirada. Gere uma nova em https://platform.openai.com/account/api-keys

### Erro: "Rate limit exceeded"
→ Muitas requisições. Aguarde 60 segundos antes de tentar novamente.

### Erro: "Insufficient quota"
→ Sem créditos. Adicione um método de pagamento em https://platform.openai.com/account/billing/overview

### Resposta em markdown em vez de JSON
→ O código já trata isso automaticamente removendo delimitadores de código.

## 📝 Exemplo de resposta do OpenAI

```json
{
  "resumoClinico": "Paciente com 3 registros de exames nos últimos 6 meses.",
  "alertas": [
    {
      "tipo": "acompanhamento",
      "severidade": "media",
      "titulo": "Carência de registros recentes",
      "descricao": "Último registro há 45 dias."
    }
  ],
  "tendencias": [
    {
      "parametro": "exame",
      "direcao": "estavel",
      "descricao": "Padrão de exames regulares observado."
    }
  ],
  "pendencias": [
    {
      "tipo": "seguimento",
      "descricao": "Agendar nova consulta de rotina."
    }
  ],
  "recomendacoes": [
    "Revisar resultados com paciente",
    "Planejar próximas investigações se necessário"
  ]
}
```

## ✨ Próximos passos (opcional)

- [ ] Integrar com Claude (Anthropic) como alternativa
- [ ] Adicionar mais contexto dos registros (extrair dados de PDFs)
- [ ] Fine-tuning com históricos locais
- [ ] Integrar com Azure OpenAI (versão corporativa)
