FROM node:20-slim

WORKDIR /app

# Copy shared core and service specific files
COPY package*.json ./
COPY shared ./shared/
COPY services/content-service ./services/content-service/

# Install dependencies from root for better caching
RUN npm install --include=dev

# Set working directory to the service
WORKDIR /app/services/content-service

EXPOSE 5004

CMD ["node", "server.js"]
