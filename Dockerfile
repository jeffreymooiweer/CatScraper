# Stage 1: Build Stage
FROM node:20-alpine AS build

# Installeer benodigde dependencies voor Puppeteer
RUN apk add --no-cache \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    chromium \
    bash \
    chromium-chromedriver

# Stel de werkdirectory in
WORKDIR /app

# Kopieer package.json en package-lock.json
COPY package*.json ./

# Installeer applicatie dependencies
RUN npm install --production

# Kopieer de rest van de applicatie
COPY . .

# Stage 2: Production Stage
FROM node:20-alpine

# Installeer alleen de runtime dependencies
RUN apk add --no-cache \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    chromium \
    chromium-chromedriver

# Stel de werkdirectory in
WORKDIR /app

# Kopieer node_modules en applicatiebestanden van de build stage
COPY --from=build /app /app

# Zet omgevingsvariabelen voor Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Voeg een non-root gebruiker toe
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Exposeer poort 5000
EXPOSE 5000

# Start de applicatie
CMD ["npm", "start"]
