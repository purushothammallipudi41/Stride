# Dockerfile for Messaging Service
FROM node:20-alpine

WORKDIR /app

# Copy service specific package and shared code
COPY services/messaging-service/package.json ./services/messaging-service/
COPY shared ./shared

# Install dependencies
RUN npm install --prefix services/messaging-service --production

# Copy service source
COPY services/messaging-service ./services/messaging-service

WORKDIR /app/services/messaging-service

EXPOSE 5003

# Use tini for better process management
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
