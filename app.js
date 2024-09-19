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
        const range = xlsx.utils.decode_range(sheet['!ref']); // Het bereik van de kolommen bepalen
        const columns = [];

        for (let i = range.s.c; i <= range.e.c; i++) {
            const letter = String.fromCharCode(65 + i); // Converteer naar A, B, C, ...
            columns.push(letter);
        }

        res.json(columns); // Stuur de gedetecteerde kolommen terug naar de frontend
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
            supplier1,
            supplier2,
            usernameSelector1,
            passwordSelector1,
            customerNumber1,
            customerNumberRequired1,
            customerNumberSelector1,
            usernameSelector2,
            passwordSelector2,
            customerNumber2,
            customerNumberRequired2,
            customerNumberSelector2,
            urlField1,
            urlField2
        } = req.body;

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: hasHeader ? 1 : undefined });

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Loop door de rijen van de Excel-sheet
        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const articleNumber = data[i][column];

            // Scraping voor Leverancier 1
            await page.goto(urlField1.replace('{articleNumber}', articleNumber));
            await page.type(`#${usernameSelector1}`, req.body.username1);
            await page.type(`#${passwordSelector1}`, req.body.password1);

            if (customerNumberRequired1 === 'on') {
                await page.type(`#${customerNumberSelector1}`, customerNumber1);
            }

            await page.click('button[type="submit"]');
            await page.waitForSelector('selector1-output');
            const supplierCode = await page.$eval('selector1-output', el => el.innerText);

            // Scraping voor Leverancier 2
            await page.goto(urlField2.replace('{supplierCode}', supplierCode));
            await page.type(`#${usernameSelector2}`, req.body.username2);
            await page.type(`#${passwordSelector2}`, req.body.password2);

            if (customerNumberRequired2 === 'on') {
                await page.type(`#${customerNumberSelector2}`, customerNumber2);
            }

            await page.click('button[type="submit"]');
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
