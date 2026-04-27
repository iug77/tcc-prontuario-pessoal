FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar resto do projeto
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3000

# Start
CMD ["node", "server.js"]
