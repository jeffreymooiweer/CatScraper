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

// Route to scan columns from the uploaded Excel file
app.post('/scan-columns', upload.single('file'), (req, res) => {
    try {
        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const firstRow = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];

        const columns = [];
        firstRow.forEach((col, index) => {
            if (col) {
                columns.push(String.fromCharCode(65 + index)); // Convert to A, B, C...
            }
        });

        res.json(columns);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error scanning columns');
    }
});

// Upload route
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
            customerNumberRequired1,
            customerNumberSelector1,
            usernameSelector2,
            passwordSelector2,
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

        // Loop through rows of the Excel sheet
        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const articleNumber = data[i][column];

            // Supplier 1 scraping
            await page.goto(urlField1.replace('{articleNumber}', articleNumber));
            await page.type(`#${usernameSelector1}`, 'your-username');
            await page.type(`#${passwordSelector1}`, 'your-password');

            if (customerNumberRequired1) {
                await page.type(`#${customerNumberSelector1}`, 'your-customer-number');
            }

            await page.click('button[type="submit"]');
            await page.waitForSelector('selector1-output');
            const supplierCode = await page.$eval('selector1-output', el => el.innerText);

            // Supplier 2 scraping
            await page.goto(urlField2.replace('{supplierCode}', supplierCode));
            await page.type(`#${usernameSelector2}`, 'your-username');
            await page.type(`#${passwordSelector2}`, 'your-password');

            if (customerNumberRequired2) {
                await page.type(`#${customerNumberSelector2}`, 'your-customer-number');
            }

            await page.click('button[type="submit"]');
            await page.waitForSelector('selector2-output');
            const itsMeArticleNumber = await page.$eval('selector2-output', el => el.innerText);

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
        res.status(500).send('Error processing the file');
    }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
