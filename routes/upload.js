const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Joi = require('joi');
const puppeteer = require('../utils/puppeteer');
const ai = require('../utils/ai');
const logger = require('../utils/logger');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Validation schema
const uploadSchema = Joi.object({
    column: Joi.string().required(),
    hasHeader: Joi.boolean(),
    supplier1LoginURL: Joi.string().uri().required(),
    supplier1SearchURL: Joi.string().uri().required(),
    supplier2LoginURL: Joi.string().uri().required(),
    supplier2SearchURL: Joi.string().uri().required(),
    usernameSelector1: Joi.string().required(),
    passwordSelector1: Joi.string().required(),
    username1: Joi.string().required(),
    password1: Joi.string().required(),
    searchSelector1: Joi.string().required(),
    customerNumberRequired1: Joi.boolean(),
    customerNumberSelector1: Joi.string().when('customerNumberRequired1', { is: true, then: Joi.required() }),
    customerNumber1: Joi.string().when('customerNumberRequired1', { is: true, then: Joi.required() }),
    usernameSelector2: Joi.string().required(),
    passwordSelector2: Joi.string().required(),
    username2: Joi.string().required(),
    password2: Joi.string().required(),
    searchSelector2: Joi.string().required(),
    customerNumberRequired2: Joi.boolean(),
    customerNumberSelector2: Joi.string().when('customerNumberRequired2', { is: true, then: Joi.required() }),
    customerNumber2: Joi.string().when('customerNumberRequired2', { is: true, then: Joi.required() })
});

// Homepage
router.get('/', (req, res) => {
    res.render('index');
});

// Scan columns
router.post('/scan-columns', upload.single('file'), (req, res) => {
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

        fs.unlinkSync(filePath);
        res.json(columns);
    } catch (error) {
        logger.error(`Error scanning columns: ${error.message}`);
        res.status(500).send('Error scanning columns');
    }
});

// Upload and process
router.post('/upload', upload.single('file'), async (req, res) => {
    const { error, value } = uploadSchema.validate(req.body);
    if (error) {
        logger.error(`Validation error: ${error.details[0].message}`);
        return res.status(400).send(`Invalid input: ${error.details[0].message}`);
    }

    try {
        const filePath = req.file.path;
        const {
            column,
            hasHeader,
            supplier1LoginURL,
            supplier1SearchURL,
            supplier2LoginURL,
            supplier2SearchURL,
            usernameSelector1,
            passwordSelector1,
            username1,
            password1,
            searchSelector1,
            customerNumberRequired1,
            customerNumberSelector1,
            customerNumber1,
            usernameSelector2,
            passwordSelector2,
            username2,
            password2,
            searchSelector2,
            customerNumberRequired2,
            customerNumberSelector2,
            customerNumber2
        } = value;

        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet, { header: hasHeader ? 1 : undefined });

        fs.unlinkSync(filePath);

        const updatedData = await puppeteer.processData({
            data,
            column,
            hasHeader,
            supplier1LoginURL,
            supplier1SearchURL,
            supplier2LoginURL,
            supplier2SearchURL,
            credentials1: {
                username: username1,
                password: password1,
                usernameSelector: usernameSelector1,
                passwordSelector: passwordSelector1,
                customerNumberRequired: customerNumberRequired1,
                customerNumberSelector: customerNumberSelector1,
                customerNumber: customerNumber1,
                searchSelector: searchSelector1
            },
            credentials2: {
                username: username2,
                password: password2,
                usernameSelector: usernameSelector2,
                passwordSelector: passwordSelector2,
                customerNumberRequired: customerNumberRequired2,
                customerNumberSelector: customerNumberSelector2,
                customerNumber: customerNumber2,
                searchSelector: searchSelector2
            }
        });

        const newSheet = xlsx.utils.json_to_sheet(updatedData);
        const newWorkbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkbook, newSheet, 'Updated');
        const outputFilename = path.join('uploads', `AGM_bijgewerkt_${Date.now()}.xlsx`);
        xlsx.writeFile(newWorkbook, outputFilename);

        res.download(outputFilename, 'AGM_bijgewerkt.xlsx', (err) => {
            if (err) {
                logger.error(`Error downloading file: ${err.message}`);
            }
            fs.unlinkSync(outputFilename);
        });
    } catch (error) {
        logger.error(`Error processing file: ${error.message}`);
        res.status(500).send('Error processing the file');
    }
});

// Find selectors using AI
router.post('/find-selectors', async (req, res) => {
    const { apiKey, supplier1LoginURL, supplier1SearchURL, supplier2LoginURL, supplier2SearchURL } = req.body;

    if (!apiKey || !supplier1LoginURL || !supplier1SearchURL || !supplier2LoginURL || !supplier2SearchURL) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    try {
        const selectorsSupplier1 = await ai.findSelectors(apiKey, supplier1LoginURL, supplier1SearchURL);
        const selectorsSupplier2 = await ai.findSelectors(apiKey, supplier2LoginURL, supplier2SearchURL);

        res.json({
            success: true,
            selectors: {
                supplier1: selectorsSupplier1,
                supplier2: selectorsSupplier2
            }
        });
    } catch (error) {
        logger.error(`AI Selector Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Failed to find selectors using AI.' });
    }
});

module.exports = router;
