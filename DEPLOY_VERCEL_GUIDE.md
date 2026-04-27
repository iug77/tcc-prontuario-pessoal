# 🚀 Guia de Deploy - Vercel + Render

## Arquitetura Recomendada
- **Frontend (React)**: Vercel (Gratuito)
- **Backend (Node.js)**: Render (Tier gratuito com suporte a PostgreSQL)
- **Banco de Dados**: PostgreSQL no Render (substitui SQLite)

---

## 📱 PASSO 1: Deploy do Frontend no Vercel

### 1.1 Criar conta Vercel
1. Acesse https://vercel.com
2. Clique em "Sign Up"
3. Autentique com GitHub (recomendado)

### 1.2 Preparar o Frontend
```bash
cd frontend
npm install
npm run build  # Verificar se compila sem erros
```

### 1.3 Importar Projeto no Vercel
1. No dashboard Vercel, clique em "Add New" → "Project"
2. Selecione seu repositório GitHub
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 1.4 Variáveis de Ambiente - Frontend
No Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL = https://seu-backend.onrender.com
```

### 1.5 Deploy
Clique em "Deploy". Seu frontend estará disponível em `https://seu-projeto.vercel.app`

---

## 🛠️ PASSO 2: Preparar Backend para Render

### 2.1 Migrar de SQLite para PostgreSQL

O Render fornece um banco PostgreSQL gratuito. Você precisa:

#### Opção A: Usar Docker + Render (Mais fácil)
1. Criar `Dockerfile` na raiz do backend
2. Fazer deploy

#### Opção B: Migrar manualmente (Recomendado)

Abra [schema.prisma](./backend/prisma/schema.prisma) e substitua:

```prisma
datasource db {
  provider = "postgresql"  // Mudou de "sqlite"
  url      = env("DATABASE_URL")
}
```

Depois, atualize o `backend/.env`:
```
DATABASE_URL="postgresql://user:password@host:port/dbname"
```

### 2.2 Criar arquivo `Dockerfile` (na raiz do backend)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "server.js"]
```

### 2.3 Criar `render.yaml` (na raiz do projeto)

```yaml
services:
  - type: web
    name: prontuario-backend
    env: node
    plan: free
    buildCommand: |
      npm install
      npx prisma generate
      npx prisma migrate deploy
    startCommand: node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        scope: build,runtime
      - key: JWT_SECRET
        scope: build,runtime
      - key: GEMINI_API_KEY
        scope: build,runtime
      - key: GEMINI_MODEL
        value: gemini-2.0-flash
```

---

## 🗄️ PASSO 3: Deploy do Backend no Render

### 3.1 Criar conta Render
1. Acesse https://render.com
2. Clique em "Sign Up"
3. Autentique com GitHub

### 3.2 Criar Banco de Dados PostgreSQL
1. No dashboard Render: "New +" → "PostgreSQL"
2. Configure:
   - Name: `prontuario-db`
   - Database: `prontuario`
   - User: `postgres`
3. Copie a connection string: `postgresql://user:password@...`

### 3.3 Fazer Deploy do Backend
1. Clique em "New +" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `prontuario-backend`
   - **Environment**: Node
   - **Build Command**: 
     ```
     npm install && npx prisma migrate deploy
     ```
   - **Start Command**: `node server.js`
   - **Plan**: Free

### 3.4 Adicionar Variáveis de Ambiente
Em Settings → Environment:
```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/dbname  # Da etapa 3.2
JWT_SECRET=sua-chave-secreta-aqui
GEMINI_API_KEY=sua-chave-gemini
GEMINI_MODEL=gemini-2.0-flash
GEMINI_TIMEOUT_MS=120000
```

### 3.5 Deploy
Clique em "Create Web Service". O Render fará deploy automático.

URL do backend: `https://prontuario-backend.onrender.com`

---

## ⚙️ PASSO 4: Atualizar Endpoints na Aplicação

### 4.1 Atualizar `frontend/.env.production`
```
VITE_API_URL=https://prontuario-backend.onrender.com
```

### 4.2 No código React, usar a variável:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const response = await fetch(`${API_URL}/api/endpoint`);
```

### 4.3 Atualizar CORS no Backend
Em [server.js](./backend/server.js), adicione:
```javascript
const corsOptions = {
  origin: [
    'https://seu-projeto.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
};
app.use(cors(corsOptions));
```

---

## 🔐 PASSO 5: Configurar Variáveis Secretas

### Backend (Render):
- `JWT_SECRET`: Gere uma chave segura com `openssl rand -base64 32`
- `GEMINI_API_KEY`: Sua chave Google AI Studio
- `DATABASE_URL`: Connection string PostgreSQL

### Frontend (Vercel):
- `VITE_API_URL`: URL do backend Render

---

## ✅ Checklist Final

- [ ] Frontend compila sem erros (`npm run build`)
- [ ] Backend roda localmente com `npm run dev`
- [ ] Banco de dados PostgreSQL criado no Render
- [ ] `vercel.json` está no `backend/` e `frontend/`
- [ ] Variáveis de ambiente configuradas em ambos
- [ ] CORS atualizado no backend
- [ ] `Dockerfile` criado no backend
- [ ] Teste uma requisição: `curl https://prontuario-backend.onrender.com/api/status`

---

## 🆘 Troubleshooting

### "Build failed on Vercel"
- Verifique `npm run build` localmente
- Confirme `Root Directory` está correto (`frontend`)

### "Database connection failed"
- Copie a connection string corret do Render
- Confirme a variável `DATABASE_URL` está set
- Execute `npx prisma migrate deploy` no Render

### "CORS error"
- Atualize `corsOptions` em `server.js`
- Reinicie o backend após mudança

### "Gemini API fails"
- Confirme `GEMINI_API_KEY` está correto
- Teste localmente primeiro

---

## 📊 URLs Finais

| Serviço | URL |
|---------|-----|
| **Frontend** | https://seu-projeto.vercel.app |
| **Backend** | https://prontuario-backend.onrender.com |
| **Database** | PostgreSQL no Render (interno) |

---

## 🔄 CI/CD Automático

Ao fazer push para `main` no GitHub:
- ✅ Frontend: Deploy automático no Vercel
- ✅ Backend: Deploy automático no Render
- ✅ Migrations: Executam automaticamente

Sem fazer nada! 🎉
