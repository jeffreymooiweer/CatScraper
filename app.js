require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const uploadRoutes = require('./routes/upload');
const i18n = require('i18n');

const app = express();
const upload = multer({ dest: 'uploads/' });

i18n.configure({
    locales: ['en', 'nl'],
    directory: path.join(__dirname, 'public', 'locales'),
    defaultLocale: 'nl',
    queryParameter: 'lang',
    autoReload: true,
    updateFiles: false,
    objectNotation: true
});

app.use(i18n.init);
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Middleware to set locale based on query parameter
app.use((req, res, next) => {
    if (req.query.lang) {
        res.setLocale(req.query.lang);
    }
    next();
});

// Routes.
app.use('/', uploadRoutes);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});
