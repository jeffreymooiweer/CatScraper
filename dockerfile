# Gebruik een officiële Node.js runtime als basis image
FROM node:14

# Maak de werkdirectory in de container
WORKDIR /app

# Kopieer package.json en package-lock.json voor de afhankelijkheden
COPY package*.json ./

# Installeer afhankelijkheden
RUN npm install

# Kopieer de rest van de applicatiebestanden naar de container
COPY . .

# Exposeer poort 5000 (of welke je ook gebruikt in Unraid)
EXPOSE 5000

# Start het Node.js programma
CMD ["npm", "start"]
