FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p /tmp/uploads

EXPOSE 4000

CMD ["node", "src/server.js"]
