# ── Build stage ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g @quasar/cli && npm install --ignore-scripts

COPY . .

# API_URL se bakeuje u SPA bundle u build-time
ARG API_URL
ENV API_URL=$API_URL

RUN quasar prepare && quasar build

# ── Serve stage ───────────────────────────────────────────────
FROM nginx:1.27-alpine

RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/selfsigned.key \
        -out    /etc/nginx/ssl/selfsigned.crt \
        -subj   "/C=HR/ST=Primorsko-goranska/L=Rijeka/O=Veleri/CN=localhost"

COPY --from=builder /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
