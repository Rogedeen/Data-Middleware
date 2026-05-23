FROM node:20-alpine

WORKDIR /app

# Dependency dosyalarını kopyala
COPY package.json tsconfig.json ./
COPY middleware/package.json ./middleware/

# Bağımlılıkları kur
RUN npm install --prefix middleware

# shared ve middleware kodlarını kopyala
COPY shared/ ./shared/
COPY middleware/ ./middleware/

# TypeScript derlemesini yap
RUN npm run build --prefix middleware

# TCP Server portunu dışarı aç (örnek 3000)
EXPOSE 3000

# Uygulamayı başlat
CMD ["npm", "run", "start:prod", "--prefix", "middleware"]
