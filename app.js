require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const uploadRoutes = require('./routes/upload');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.use('/', uploadRoutes);

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}`);
});
