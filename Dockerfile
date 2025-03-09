# Etapa de construcción
FROM node:18-alpine as builder

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache openssl openssl-dev

# Copiar archivos de dependencias
COPY package*.json ./
COPY api/prisma ./prisma/

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Compilar TypeScript
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache openssl openssl-dev

# Copiar archivos necesarios de la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000

# Exponer puerto
EXPOSE 4000

# Comando de inicio
CMD ["npm", "start"] 