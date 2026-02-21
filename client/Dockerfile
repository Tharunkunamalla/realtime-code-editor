# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build-time environment variables for Vite
ARG VITE_PISTON_URL
ARG VITE_PISTON_API_KEY
ENV VITE_PISTON_URL=$VITE_PISTON_URL
ENV VITE_PISTON_API_KEY=$VITE_PISTON_API_KEY

RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
