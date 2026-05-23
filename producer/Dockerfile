FROM node:20-alpine

WORKDIR /app

# Dependency dosyalarını kopyala
COPY package.json tsconfig.json ./
COPY producer/package.json ./producer/

# Bağımlılıkları kur
RUN npm install --prefix producer

# shared ve producer kodlarını kopyala
COPY shared/ ./shared/
COPY producer/ ./producer/

# TypeScript derlemesini yap
RUN npm run build --prefix producer

# Uygulamayı başlat
CMD ["npm", "run", "start:prod", "--prefix", "producer"]
