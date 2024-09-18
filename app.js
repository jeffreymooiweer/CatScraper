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
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        for (const row of data) {
            const articleNumber = row["Artikelnummer"];

            // Technische Unie scraping (vervang URL en selectors door werkende waarden)
            await page.goto(`https://technischeunie.nl/search/${articleNumber}`);
            const supplierCode = await page.$eval('.supplier-code-selector', el => el.innerText); // Vervang selector

            // It's Me scraping
            await page.goto(`https://itsme.nl/search/${supplierCode}`);
            const itsMeArticleNumber = await page.$eval('.article-number-selector', el => el.innerText); // Vervang selector

            row["Artikelnummer"] = itsMeArticleNumber; // Vervang met nieuw artikelnummer
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
