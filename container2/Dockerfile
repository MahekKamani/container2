FROM node:alpine
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node","server.js"]