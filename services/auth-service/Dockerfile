# Dockerfile for Auth Service
FROM node:20-alpine

WORKDIR /app

# Copy service specific package and shared code
COPY services/auth-service/package.json ./services/auth-service/
COPY shared ./shared

# Install dependencies
RUN npm install --prefix services/auth-service --production

# Copy service source
COPY services/auth-service ./services/auth-service

WORKDIR /app/services/auth-service

EXPOSE 5001

# Use tini for better process management
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
