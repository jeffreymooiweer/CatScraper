# Gebruik een officiële Node.js runtime als basis image
FROM node:14

# Installeer de vereiste bibliotheken voor Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libglib2.0-0 \
    libnss3 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    libgbm1 \
    libnspr4 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    xdg-utils \
    libnss3-tools

# Maak de werkdirectory in de container
WORKDIR /app

# Kopieer package.json en package-lock.json voor de afhankelijkheden
COPY package*.json ./

# Installeer afhankelijkheden
RUN npm install

# Kopieer de rest van de applicatiebestanden naar de container
COPY . .

# Exposeer poort 5000
EXPOSE 5000

# Start het Node.js programma
CMD ["npm", "start"]
