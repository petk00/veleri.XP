FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# bcrypt treba native kompajliranje na Alpine
RUN apk add --no-cache python3 make g++ && \
    npm ci --omit=dev && \
    apk del make g++

COPY . .

RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["node", "src/index.js"]
