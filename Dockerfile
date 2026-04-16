# Stride v2.0 - GCP Cloud Run Heartbeat
FROM node:18-slim AS base

# Step 1: Dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Step 2: Runtime Pulse
FROM node:18-slim
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .

# Environment Defaults
ENV PORT=8080
ENV NODE_ENV=production

# Expose Stride Pulse
EXPOSE 8080

# Launch
CMD ["node", "server/index.cjs"]
