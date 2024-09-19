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

// Upload route
app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const { column, hasHeader, supplier1, supplier2, loginFields1, loginFields2, urlField1, urlField2, selector1, selector2 } = req.body;
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: hasHeader ? 1 : undefined });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Loop door de rijen van de Excel sheet
        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const articleNumber = data[i][column];

            // Leverancier 1 scraping
            await page.goto(urlField1.replace('{articleNumber}', articleNumber));
            for (const [field, value] of Object.entries(loginFields1)) {
                await page.type(field, value);
            }
            await page.click(selector1.submitButton); // Klik op login button
            await page.waitForSelector(selector1.outputField); // Wacht op output
            const supplierCode = await page.$eval(selector1.outputField, el => el.innerText); // Vervang selector

            // Leverancier 2 scraping
            await page.goto(urlField2.replace('{supplierCode}', supplierCode));
            for (const [field, value] of Object.entries(loginFields2)) {
                await page.type(field, value);
            }
            await page.click(selector2.submitButton);
            await page.waitForSelector(selector2.outputField);
            const itsMeArticleNumber = await page.$eval(selector2.outputField, el => el.innerText); // Vervang selector

            // Update Excel kolom met het nieuwe artikelnummer
            data[i][column] = itsMeArticleNumber;
        }

        await browser.close();

        // Sla het gewijzigde Excel-bestand op
        const newSheet = xlsx.utils.json_to_sheet(data);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated');
        const outputFilename = path.join('uploads', 'AGM_bijgewerkt.xlsx');
        xlsx.writeFile(newWorkbook, outputFilename);

        res.download(outputFilename);
    } catch (error) {
        console.error(error);
        res.status(500).send('Fout bij verwerking');
    }
});

// Start de server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
