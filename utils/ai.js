const { Configuration, OpenAIApi } = require('openai');

async function findSelectors(apiKey, loginURL, searchURL) {
    const configuration = new Configuration({
        apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `
You are a helpful assistant for web scraping using Puppeteer. Given the login URL and search URL of a supplier's website, provide the CSS selectors for the following elements:

1. Username input field
2. Password input field
3. Customer number input field (if applicable)
4. Search input field
5. Submit/login button
6. Search button
7. Output element selector after search

Login URL: ${loginURL}
Search URL: ${searchURL}

Please provide the selectors in the following JSON format:

{
    "usernameSelector": "",
    "passwordSelector": "",
    "customerNumberSelector": "",
    "searchSelector": "",
    "submitButtonSelector": "",
    "searchButtonSelector": "",
    "outputSelector": ""
}
`;

    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: prompt,
        max_tokens: 500,
        temperature: 0,
    });

    const text = response.data.choices[0].text.trim();
    let selectors;
    try {
        selectors = JSON.parse(text);
    } catch (err) {
        throw new Error('Failed to parse selectors from AI response.');
    }

    return selectors;
}

module.exports = {
    findSelectors,
};
