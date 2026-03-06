# Dockerfile for User Service
FROM node:20-alpine

WORKDIR /app

# Copy service specific package and shared code
COPY services/user-service/package.json ./services/user-service/
COPY shared ./shared

# Install dependencies
RUN npm install --prefix services/user-service --production

# Copy service source
COPY services/user-service ./services/user-service

WORKDIR /app/services/user-service

EXPOSE 5002

# Use tini for better process management
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
