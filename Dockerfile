# Stage 1: Build
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS production

# Copy built files
COPY --from=builder /app/dist /var/www/apps/arch-snap-sync/dist

# Copy nginx config
COPY nginx/storage.alazab.com /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
