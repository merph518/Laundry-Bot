# ---- builder stage ----
FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/

RUN npm run build

# ---- runtime stage ----
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY --from=builder /app/src/assets ./src/assets

RUN useradd --uid 1001 --create-home botuser
USER botuser

# Healthy while the bot keeps refreshing its heartbeat file (see src/services/heartbeat.ts).
HEALTHCHECK --interval=60s --timeout=5s --start-period=90s --retries=3 \
  CMD node -e "const f=process.env.HEARTBEAT_FILE||'/tmp/laundrybot.heartbeat';process.exit(Date.now()-require('fs').statSync(f).mtimeMs<120000?0:1)"

CMD ["node", "build/laundryBot.js"]
