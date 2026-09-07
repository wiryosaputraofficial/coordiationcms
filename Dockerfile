FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY coordiation.config.json ./
COPY src ./src
COPY public ./public
COPY scripts/build-public-components.js scripts/build-statistics-chart.js scripts/statistics-chart-entry.js ./scripts/
ARG CMS_ORIGIN=https://app.coordiation.com
RUN node --input-type=module -e 'import fs from "node:fs"; const c=JSON.parse(fs.readFileSync("coordiation.config.json")); c.origin=process.env.CMS_ORIGIN || "https://app.coordiation.com"; fs.writeFileSync("coordiation.config.json",JSON.stringify(c));' && npm run build

FROM node:24-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3100 CMS_DATABASE=/data/cms.sqlite CMS_SECURE_COOKIES=true CMS_ORIGIN=https://app.coordiation.com
WORKDIR /app
COPY --from=build --chown=node:node /app/.coordiation ./.coordiation
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node src/server ./src/server
COPY --chown=node:node src/shared ./src/shared
COPY --chown=node:node src/themes ./src/themes
COPY package.json ./
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:3100/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/start-production.js"]
