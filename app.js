// app.js

require('dotenv').config(); // Add this for using .env variables
const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');

// Initialize Express app
const app = express();

// Configure Winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'app.log' })
    ]
});

// Security middleware
app.use(helmet());

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per IP
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Express settings
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data

// Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration - File storage and limits
const upload = multer({
    dest: uploadsDir,
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
        cb(new Error('Only Excel files (.xlsx, .xls) are allowed.'));
    }
});

// Utility function to convert column index to letter (supports columns beyond 'Z')
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

// Route to scan columns of the uploaded Excel file
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

        // Delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) logger.error(`Error deleting file: ${err.message}`);
        });

        res.json(columns);
    } catch (error) {
        logger.error(`Error scanning columns: ${error.message}`);
        res.status(500).send('An error occurred while scanning the columns.');
    }
});

// Route for upload and processing
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

        // Convert column letter to index
        const columnIndex = xlsx.utils.decode_col(column);

        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        for (let i = hasHeader ? 1 : 0; i < data.length; i++) {
            const row = data[i];
            const articleNumber = hasHeader ? row[columnIndex] : row[column];

            if (!articleNumber) {
                logger.warn(`Row ${i + 1} is missing the article number.`);
                continue;
            }

            try {
                // Supplier 1 - Login
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

                // Supplier 1 - Search
                const supplier1SearchURLFormatted = supplier1SearchURL.replace('{articleNumber}', encodeURIComponent(articleNumber));
                await page.goto(supplier1SearchURLFormatted, { waitUntil: 'networkidle2' });
                await page.type(`#${searchSelector1}`, articleNumber);
                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForSelector('.selector1-output', { timeout: 5000 })
                ]);
                const supplierCode = await page.$eval('.selector1-output', el => el.innerText.trim());

                // Supplier 2 - Login
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

                // Supplier 2 - Search
                const supplier2SearchURLFormatted = supplier2SearchURL.replace('{supplierCode}', encodeURIComponent(supplierCode));
                await page.goto(supplier2SearchURLFormatted, { waitUntil: 'networkidle2' });
                await page.type(`#${searchSelector2}`, supplierCode);
                await Promise.all([
                    page.click('button[type="submit"]'),
                    page.waitForSelector('.selector2-output', { timeout: 5000 })
                ]);
                const itsMeArticleNumber = await page.$eval('.selector2-output', el => el.innerText.trim());

                // Update Excel data
                if (hasHeader) {
                    data[i][columnIndex] = itsMeArticleNumber;
                } else {
                    data[i][column] = itsMeArticleNumber;
                }
            } catch (rowError) {
                logger.error(`Error processing row ${i + 1}: ${rowError.message}`);
                // Optionally: Add an error message to the row or skip it
                continue;
            }
        }

        await browser.close();

        // Convert data back to sheet
        let newSheet;
        if (hasHeader) {
            newSheet = xlsx.utils.aoa_to_sheet(data);
        } else {
            newSheet = xlsx.utils.json_to_sheet(data);
        }
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated');

        const outputFilename = `AGM_bijgewerkt_${Date.now()}.xlsx`;
        const outputPath = path.join(uploadsDir, outputFilename);
        xlsx.writeFile(newWorkbook, outputPath);

        // Delete the uploaded file after processing
        fs.unlink(filePath, (err) => {
            if (err) logger.error(`Error deleting uploaded file: ${err.message}`);
        });

        // Send the updated file for download
        res.download(outputPath, outputFilename, (err) => {
            if (err) {
                logger.error(`Error sending file: ${err.message}`);
                res.status(500).send('An error occurred while sending the file.');
            }

            // Optionally: Delete the output file after download
            fs.unlink(outputPath, (err) => {
                if (err) logger.error(`Error deleting output file: ${err.message}`);
            });
        });
    } catch (error) {
        logger.error(`Error during upload and processing: ${error.message}`);
        res.status(500).send('An error occurred during the upload and processing of the file.');
    }
});

// Global error handler (optional but recommended)
app.use((err, req, res, next) => {
    logger.error(`Unhandled error: ${err.message}`);
    res.status(500).send('An unexpected error occurred.');
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
});

module.exports = app; // For testing
