# syntax=docker/dockerfile:1

# AdonisJS production image.
# Node is used to run the compiled server; Bun is used for fast,
# lockfile-aware dependency installs.

# --- Base: Node runtime + Bun binary ------------------------------------
FROM node:24-bookworm-slim AS base
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun
WORKDIR /app

# --- Dependencies: install everything (incl. dev) for the build ---------
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Build: compile TypeScript + bundle Vite assets --------------------
# `node ace build` only runs tsc + Vite; it does not boot the app or read
# the runtime env, so no app/DB variables are needed here.
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Produces a self-contained ./build directory.
RUN node ace build
# Install production-only dependencies inside the compiled output.
RUN cp package.json bun.lock build/ \
 && cd build \
 && bun install --frozen-lockfile --production

# --- Production: minimal runtime image ---------------------------------
FROM base AS production
ENV NODE_ENV=production \
    PORT=3333 \
    HOST=0.0.0.0
COPY --from=build --chown=node:node /app/build ./
COPY --chown=node:node ecosystem.config.cjs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
USER node
EXPOSE 3333
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["./node_modules/.bin/pm2-runtime", "start", "ecosystem.config.cjs"]
