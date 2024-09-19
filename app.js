const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Route om kolommen te scannen van het geüploade Excel-bestand
app.post('/scan-columns', upload.single('file'), (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const range = xlsx.utils.decode_range(sheet['!ref']);
        const columns = [];

        for (let i = range.s.c; i <= range.e.c; i++) {
            const letter = String.fromCharCode(65 + i);
            columns.push(letter);
        }

        res.json(columns);
    } catch (error) {
        console.error(error);
        res.status(500).send('Fout bij het scannen van kolommen');
    }
});

// Upload route voor verwerking
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const {
            column,
            hasHeader,
            supplier1LoginURL,
            supplier1SearchURL,
            usernameSelector1,
            passwordSelector1,
            customerNumber1,
            customerNumberRequired1,
            customerNumberSelector1,
            username1,
            password1,
            supplier2LoginURL,
            supplier2SearchURL,
            usernameSelector2,
            passwordSelector2,
            customerNumber2,
            customerNumberRequired2,
            customerNumberSelector2,
            username2,
            password2
        } = req.body;

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: hasHeader ? 1 : undefined });

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Leverancier 1 - Inloggen en zoeken
        await page.goto(supplier1LoginURL);
        await page.type(`#${usernameSelector1}`, username1);
        await page.type(`#${passwordSelector1}`, password1);
        if (customerNumberRequired1 === 'on') {
            await page.type(`#${customerNumberSelector1}`, customerNumber1);
        }
        await page.click('button[type="submit"]');
        await page.waitForNavigation();

        // Leverancier 1 - Artikelnummer zoeken
        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const articleNumber = data[i][column];
            await page.goto(supplier1SearchURL.replace('{articleNumber}', articleNumber));
            await page.waitForSelector('selector1-output');
            const supplierCode = await page.$eval('selector1-output', el => el.innerText);

            // Leverancier 2 - Inloggen en zoeken
            await page.goto(supplier2LoginURL);
            await page.type(`#${usernameSelector2}`, username2);
            await page.type(`#${passwordSelector2}`, password2);
            if (customerNumberRequired2 === 'on') {
                await page.type(`#${customerNumberSelector2}`, customerNumber2);
            }
            await page.click('button[type="submit"]');
            await page.waitForNavigation();

            // Leverancier 2 - Zoeken met leverancier code
            await page.goto(supplier2SearchURL.replace('{supplierCode}', supplierCode));
            await page.waitForSelector('selector2-output');
            const itsMeArticleNumber = await page.$eval('selector2-output', el => el.innerText);

            // Update Excel-kolom met nieuw artikelnummer
            data[i][column] = itsMeArticleNumber;
        }

        await browser.close();

        // Sla het bijgewerkte Excel-bestand op
        const newSheet = xlsx.utils.json_to_sheet(data);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated');
        const outputFilename = path.join('uploads', 'AGM_bijgewerkt.xlsx');
        xlsx.writeFile(newWorkbook, outputFilename);

        res.download(outputFilename);
    } catch (error) {
        console.error(error);
        res.status(500).send('Fout bij de verwerking');
    }
});

// Start de server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server draait op http://localhost:${port}`);
});
