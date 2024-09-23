const puppeteer = require('puppeteer');
const logger = require('./logger');

async function processData(options) {
    const {
        data,
        column,
        hasHeader,
        supplier1LoginURL,
        supplier1SearchURL,
        supplier2LoginURL,
        supplier2SearchURL,
        credentials1,
        credentials2
    } = options;

    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        await puppeteer.authenticate(page, supplier1LoginURL, credentials1);
        await puppeteer.authenticate(page, supplier2LoginURL, credentials2);

        await Promise.all(data.map(async (row, index) => {
            try {
                const articleNumber = row[column];
                const supplierCode = await puppeteer.searchArticle(page, supplier1SearchURL, credentials1, articleNumber);
                const itsMeArticleNumber = await puppeteer.searchSupplierCode(page, supplier2SearchURL, credentials2, supplierCode);
                data[index][column] = itsMeArticleNumber;
                logger.info(`Row ${index + (hasHeader ? 2 : 1)} processed successfully.`);
            } catch (err) {
                logger.error(`Row ${index + (hasHeader ? 2 : 1)} failed: ${err.message}`);
            }
        }));
    } catch (err) {
        logger.error(`Puppeteer processing failed: ${err.message}`);
    } finally {
        await browser.close();
    }

    return data;
}

async function authenticate(page, loginURL, credentials) {
    await page.goto(loginURL);
    await page.type(`#${credentials.usernameSelector}`, credentials.username);
    await page.type(`#${credentials.passwordSelector}`, credentials.password);
    if (credentials.customerNumberRequired) {
        await page.type(`#${credentials.customerNumberSelector}`, credentials.customerNumber);
    }
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation()
    ]);
    logger.info(`Authenticated at ${loginURL}`);
}

async function searchArticle(page, searchURL, credentials, articleNumber) {
    const url = searchURL.replace('{articleNumber}', articleNumber);
    await page.goto(url);
    await page.type(`#${credentials.searchSelector}`, articleNumber);
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForSelector('selector1-output')
    ]);
    const supplierCode = await page.$eval('selector1-output', el => el.innerText);
    logger.info(`Found supplier code: ${supplierCode} for article number: ${articleNumber}`);
    return supplierCode;
}

async function searchSupplierCode(page, searchURL, credentials, supplierCode) {
    const url = searchURL.replace('{supplierCode}', supplierCode);
    await page.goto(url);
    await page.type(`#${credentials.searchSelector}`, supplierCode);
    await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForSelector('selector2-output')
    ]);
    const itsMeArticleNumber = await page.$eval('selector2-output', el => el.innerText);
    logger.info(`Found itsMe article number: ${itsMeArticleNumber} for supplier code: ${supplierCode}`);
    return itsMeArticleNumber;
}

module.exports = {
    processData,
    authenticate,
    searchArticle,
    searchSupplierCode
};
