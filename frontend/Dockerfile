# syntax=docker/dockerfile:1
# Static build of Solvd served by nginx.
#   docker build -t solvd-frontend .
#   docker run --rm -p 8080:8080 solvd-frontend

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
# pnpm version comes from "packageManager" in package.json
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
# Vite bakes VITE_* variables in at build time; pass them as build args
# (e.g. --build-arg VITE_STORAGE_MODE=server) once the full-stack version needs them.
RUN pnpm build

# ---- runtime ----
# nginx-unprivileged runs as a non-root user and listens on 8080
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
