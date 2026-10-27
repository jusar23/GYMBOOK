# Multi-stage: build the React app, then serve it with nginx.
# Self-hosters never need Node locally — `docker compose up` builds everything.
#
# --platform=$BUILDPLATFORM pins the build stage to the host's native arch even when
# cross-building for other targets (e.g. amd64 host building an arm64 image). The build
# output (static JS/CSS/HTML) is arch-independent, so there's no reason to run it under
# QEMU — and QEMU-emulated npm installs are known to corrupt esbuild/rollup's platform-
# specific native binaries, which is what breaks `vite build` with unrelated-looking
# module-resolution errors.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY frontend/ ./
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:alpine
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
COPY web/limit-zones.conf /etc/nginx/conf.d/00-limit-zones.conf
COPY web/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
# exercise media (img/gif) is mounted at runtime from the media volume
