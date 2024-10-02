FROM node:20 AS build-stage
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM php:8.2-apache
COPY --from=build-stage /app/dist /var/www/html