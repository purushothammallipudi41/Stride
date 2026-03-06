# Dockerfile for API Gateway
FROM node:20-alpine

WORKDIR /app

# Copy root dependency files
COPY package.json package-lock.json ./

# Copy backend specific package and shared code
COPY backend/package.json ./backend/
COPY shared ./shared

# Install dependencies
RUN npm install --prefix backend --production

# Copy backend source
COPY backend ./backend

WORKDIR /app/backend

EXPOSE 3001

# Use tini for better process management in containers
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["npm", "start"]
