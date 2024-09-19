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

        // Puppeteer launch with no-sandbox
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Loop through the rows of the Excel sheet
        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const articleNumber = data[i][column];

            // Supplier 1 scraping
            await page.goto(urlField1.replace('{articleNumber}', articleNumber));
            for (const [field, value] of Object.entries(loginFields1)) {
                await page.type(field, value);
            }
            await page.click(selector1.submitButton);
            await page.waitForSelector(selector1.outputField);
            const supplierCode = await page.$eval(selector1.outputField, el => el.innerText);

            // Supplier 2 scraping
            await page.goto(urlField2.replace('{supplierCode}', supplierCode));
            for (const [field, value] of Object.entries(loginFields2)) {
                await page.type(field, value);
            }
            await page.click(selector2.submitButton);
            await page.waitForSelector(selector2.outputField);
            const itsMeArticleNumber = await page.$eval(selector2.outputField, el => el.innerText);

            // Update Excel column with new article number
            data[i][column] = itsMeArticleNumber;
        }

        await browser.close();

        // Save the updated Excel file
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

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
