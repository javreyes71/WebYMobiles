# Contenedor Frontend React + Vite compatible con x86_64 y linux/arm64 (Raspberry Pi)
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV VITE_API_URL=http://localhost:5000/api
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
