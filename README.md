# Catscraper

**Catscraper** is een Node.js-gebaseerde webapplicatie die gegevens verzamelt van twee leveranciers: **Technische Unie** en **It's Me**. De applicatie voert webscraping uit om artikelgegevens te synchroniseren tussen de twee leveranciers.

## Functies:
- Upload een Excel-bestand met artikelnummers.
- Scraping van gegevens van de Technische Unie en It’s Me.
- Synchronisatie van artikelinformatie tussen beide leveranciers.
- Download het bijgewerkte Excel-bestand.

## Vereisten:
- **Node.js** v14+
- **Docker** (optioneel, voor gebruik in containers)
- **Puppeteer** voor webscraping
- **Express.js** voor serverbeheer
- **Multer** voor bestandsuploads
- **xlsx** voor Excel-verwerking

## Installatie:

1. Clone de repository:

    ```bash
    git clone https://github.com/jeffreymooiweer/catscraper.git
    cd catscraper
    ```

2. Installeer de benodigde pakketten:

    ```bash
    npm install
    ```

3. Start de applicatie:

    ```bash
    npm start
    ```

4. Bezoek de applicatie op:

    ```
    http://localhost:5000
    ```

## Docker-gebruik:

1. Bouw het Docker-image:

    ```bash
    docker build -t catscraper .
    ```

2. Start de container:

    ```bash
    docker run -p 5000:5000 catscraper
    ```

3. Bezoek de applicatie op:

    ```
    http://localhost:5000
    ```

## GitHub Actions:

Er is een GitHub Actions workflow ingesteld om het Docker-image te bouwen en naar Docker Hub te pushen. Controleer de **`docker-image.yml`** in de `.github/workflows` map.

## Bijdragen:

Voel je vrij om bij te dragen aan dit project. Maak een pull request aan en leg uit welke verbeteringen je hebt aangebracht!

## Licentie:

Dit project is gelicenseerd onder de MIT-licentie - zie het **LICENSE** bestand voor details.
