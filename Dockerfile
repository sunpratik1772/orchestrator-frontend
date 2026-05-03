# ---- builder ----
  FROM node:20-alpine AS builder
  WORKDIR /app
  ENV BASE_PATH=/
  COPY package.json ./
  RUN npm install --no-audit --no-fund
  COPY . .
  ENV VITE_API_BASE_URL=""
  RUN npm run build

  # ---- runtime ----
  FROM nginx:1.27-alpine
  COPY --from=builder /app/dist /usr/share/nginx/html
  COPY nginx.conf.template /etc/nginx/templates/default.conf.template
  ENV PORT=8080 API_BACKEND_URL=http://localhost:8000
  EXPOSE 8080
  CMD ["nginx", "-g", "daemon off;"]
  