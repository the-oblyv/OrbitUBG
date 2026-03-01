FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
RUN chmod +x /usr/local/bin/cloudflared

CMD cloudflared tunnel --no-autoupdate run & node server.js
