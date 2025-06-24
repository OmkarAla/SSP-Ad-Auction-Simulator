# backend/Dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /

# Install runtime dependencies for sqlite3
RUN apk add --no-cache sqlite-libs

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
# Note: database.sqlite will be created by db.ts on startup

EXPOSE 3001

CMD ["node", "dist/server.js"]