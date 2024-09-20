// app.js

const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const ejs = require('ejs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialiseer Express-app
const app = express();

// Middleware beveiliging
app.use(helmet());

// Rate limiting om misbruik te voorkomen
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuten
    max: 100, // Max 100 verzoeken per IP
    message: 'Te veel verzoeken vanaf deze IP, probeer het later opnieuw.'
});
app.use(limiter);

// Configuratie voor Multer - Bestandsopslag en beperkingen
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // Max 5MB
    },
    fileFilter: (req, file, cb) => {
        const filetypes = /xlsx|xls/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Alleen Excel-bestanden (.xlsx, .xls) zijn toegestaan.'));
    }
});

// Instellingen voor Express
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // Voor het parsen van URL-gecodeerde gegevens

// Utility functie om kolomindex om te zetten naar letter (ondersteunt kolommen na 'Z')
function getColumnLetter(index) {
    let letter = '';
    while (index >= 0) {
        letter = String.fromCharCode((index % 26) + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
}

// Homepage Route
app.get('/', (req, res) => {
    res.render('index');
});

// Route om kolommen te scannen van het geüploade Excel-bestand
app.post('/scan-columns', upload.single('file'), (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const range = xlsx.utils.decode_range(sheet['!ref']);
        const columns = [];

        for (let i = range.s.c; i <= range.e.c; i++) {
            const letter = getColumnLetter(i);
            columns.push(letter);
        }

        // Verwijder het geüploade bestand na verwerking
        fs.unlink(filePath, (err) => {
            if (err) console.error('Fout bij het verwijderen van het bestand:', err);
        });

        res.json(columns);
    } catch (error) {
        console.error('Fout bij het scannen van kolommen:', error);
        res.status(500).send('Er is een fout opgetreden bij het scannen van de kolommen.');
    }
});

// Route voor upload en verwerking
app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    try {
        const {
            column,
            hasHeader,
            supplier1LoginURL,
            supplier1SearchURL,
            supplier2LoginURL,
            supplier2SearchURL,
            usernameSelector1,
            passwordSelector1,
            customerNumber1,
            customerNumberRequired1,
            customerNumberSelector1,
            searchSelector1,
            usernameSelector2,
            passwordSelector2,
            customerNumber2,
            customerNumberRequired2,
            customerNumberSelector2,
            searchSelector2
        } = req.body;

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let data;

        if (hasHeader) {
            data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        } else {
            data = xlsx.utils.sheet_to_json(sheet, { header: 0 });
        }

        // Converteer kolomletter naar index
        const columnIndex = xlsx.utils.decode_col(column);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const row = data[i];
            const articleNumber = hasHeader ? row[columnIndex] : row[column];

            if (!articleNumber) {
                console.warn(`Rij ${i + 1} mist het artikelnummers.`);
                continue;
            }

            try {
                // Leverancier 1 - Inloggen
                await page.goto(supplier1LoginURL, { waitUntil: 'networkidle2' });
                await page.type(`#${usernameSelector1}`, req.body.username1);
                await page.type(`#${passwordSelector1}`, req.body.password1);

                if (customerNumberRequired1 === 'on') {
                    await page.type(`#${customerNumberSelector1}`, customerNumber1);
                }

                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);

                // Leverancier 1 - Zoeken
                const supplier1SearchURLFormatted = supplier1SearchURL.replace('{articleNumber}', encodeURIComponent(articleNumber));
                await page.goto(supplier1SearchURLFormatted, { waitUntil: 'networkidle2' });
                await page.type(`#${searchSelector1}`, articleNumber);
                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForSelector('.selector1-output', { timeout: 5000 })
                ]);
                const supplierCode = await page.$eval('.selector1-output', el => el.innerText.trim());

                // Leverancier 2 - Inloggen
                await page.goto(supplier2LoginURL, { waitUntil: 'networkidle2' });
                await page.type(`#${usernameSelector2}`, req.body.username2);
                await page.type(`#${passwordSelector2}`, req.body.password2);

                if (customerNumberRequired2 === 'on') {
                    await page.type(`#${customerNumberSelector2}`, customerNumber2);
                }

                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForNavigation({ waitUntil: 'networkidle2' })
                ]);

                // Leverancier 2 - Zoeken
                const supplier2SearchURLFormatted = supplier2SearchURL.replace('{supplierCode}', encodeURIComponent(supplierCode));
                await page.goto(supplier2SearchURLFormatted, { waitUntil: 'networkidle2' });
                await page.type(`#${searchSelector2}`, supplierCode);
                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForSelector('.selector2-output', { timeout: 5000 })
                ]);
                const itsMeArticleNumber = await page.$eval('.selector2-output', el => el.innerText.trim());

                // Update Excel-data
                if (hasHeader) {
                    data[i][columnIndex] = itsMeArticleNumber;
                } else {
                    data[i][column] = itsMeArticleNumber;
                }
            } catch (rowError) {
                console.error(`Fout bij het verwerken van rij ${i + 1}:`, rowError);
                // Optioneel: Voeg een foutmelding toe aan de rij of sla deze over
                continue;
            }
        }

        await browser.close();

        // Converteer data terug naar sheet
        let newSheet;
        if (hasHeader) {
            newSheet = xlsx.utils.aoa_to_sheet(data);
        } else {
            newSheet = xlsx.utils.json_to_sheet(data);
        }
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated');

        const outputFilename = `AGM_bijgewerkt_${Date.now()}.xlsx`;
        const outputPath = path.join('uploads', outputFilename);
        xlsx.writeFile(newWorkbook, outputPath);

        // Verwijder het geüploade bestand na verwerking
        fs.unlink(filePath, (err) => {
            if (err) console.error('Fout bij het verwijderen van het geüploade bestand:', err);
        });

        // Verzend het bijgewerkte bestand voor download
        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                console.error('Fout bij het verzenden van het bestand:', err);
                res.status(500).send('Er is een fout opgetreden bij het verzenden van het bestand.');
            }

            // Optioneel: Verwijder het outputbestand na download
            fs.unlink(outputPath, (err) => {
                if (err) console.error('Fout bij het verwijderen van het outputbestand:', err);
            });
        });
    } catch (error) {
        console.error('Verwerkingsfout:', error);
        // Verwijder het geüploade bestand in geval van een fout
        fs.unlink(filePath, (err) => {
            if (err) console.error('Fout bij het verwijderen van het geüploade bestand na een fout:', err);
        });
        res.status(500).send('Er is een fout opgetreden tijdens de verwerking.');
    }
});

// Start de server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
});
