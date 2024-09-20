
<p align="center">
  <img src="https://github.com/jeffreymooiweer/CatScraper/blob/main/public/images/favicon.png?raw=true" alt="favicon" width="300"/>
</p>

# CatScraper

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Docker Image Size](https://img.shields.io/docker/image-size/jeffersonmouze/catscraper/latest)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/jeffersonmouze/catscraper/Build%20and%20Push%20Docker%20Image)

CatScraper is a robust Node.js web scraping application designed to extract and process data from suppliers such as Technische Unie and It's Me. Leveraging powerful tools like Puppeteer and Excel file manipulation, CatScraper automates data extraction, transformation, and delivery, ensuring efficiency and accuracy.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Docker](#docker)
- [Continuous Integration](#continuous-integration)
- [Testing](#testing)
- [Logging](#logging)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Automated Web Scraping:** Utilize Puppeteer to navigate, login, and extract data from multiple supplier websites.
- **Excel Integration:** Seamlessly read from and write to Excel files, supporting `.xlsx` and `.xls` formats.
- **File Uploads:** Securely upload Excel files through a user-friendly web interface.
- **Dynamic Column Selection:** Automatically detect and allow users to select the column containing article numbers.
- **Rate Limiting & Security:** Protect the application from abuse with rate limiting and secure HTTP headers using Helmet.
- **Logging:** Comprehensive logging with Winston for easy debugging and monitoring.
- **Dockerized Deployment:** Easy deployment using Docker with optimized multi-stage builds.
- **Continuous Integration:** Automated builds and deployments using GitHub Actions.

## Prerequisites

- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **Docker:** v20.x or higher (optional, for containerized deployment)
- **Docker Hub Account:** For pushing Docker images

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/jeffersonmouze/catscraper.git
   cd catscraper

2. Install Dependencies

npm install


3. Set Up Environment Variables

Create a .env file in the root directory:

touch .env

Populate .env with the following variables:

PORT=5000
DOCKER_USERNAME=your_dockerhub_username
DOCKER_PASSWORD=your_dockerhub_password

Note: Ensure that .env is added to .gitignore to prevent sensitive information from being exposed.


4. Start the Application

npm start

For development with automatic restarts:

npm run dev


5. Access the Application

Open your browser and navigate to http://localhost:5000.



Configuration

CatScraper requires specific configurations to interact with supplier websites. When uploading an Excel file, you will need to provide:

Column Selection: Choose the column containing article numbers.

Header Information: Indicate if the Excel file contains a header row.

Supplier 1 & 2 Details:

Login URLs: The URLs for logging into each supplier's website.

Search URLs: The URLs used to search for articles, with placeholders for dynamic values.

Selectors: CSS selectors for username, password, search bars, and output elements.

Credentials: Usernames, passwords, and optional customer numbers required for login.



Usage

1. Upload Excel File

Navigate to the homepage.

Click on the "Upload Excel-bestand" button to select your .xlsx or .xls file.

The application will automatically scan and populate the column selection dropdown.



2. Configure Supplier Details

Fill in the required fields for both suppliers, including login URLs, search URLs, selectors, and credentials.

Indicate if customer numbers are required for each supplier and provide the necessary information if applicable.



3. Start Processing

Click on the "Uploaden en Verwerken" button.

The application will process the file, scrape the necessary data, and provide an updated Excel file for download.




Docker

CatScraper can be easily containerized using Docker, ensuring consistency across different environments.

Building the Docker Image

docker build -t jeffersonmouze/catscraper:latest .

Running the Docker Container

docker run -d -p 5000:5000 -v /path/to/local/uploads:/app/uploads jeffersonmouze/catscraper:latest

Port Mapping: Maps port 5000 of the container to port 5000 of the host.

Volume Mounting: Mounts the local uploads directory to the container for persistent storage.


Pushing to Docker Hub

Ensure you are logged in to Docker Hub:

docker login

Push the image:

docker push jeffersonmouze/catscraper:latest

Continuous Integration

CatScraper uses GitHub Actions for automated building and pushing of Docker images.

Workflow Configuration

The CI workflow is defined in .github/workflows/docker-image.yml and triggers on pushes and pull requests to the main branch. It performs the following steps:

1. Checkout Code: Retrieves the repository code.


2. Set Up Docker Buildx: Prepares Docker for building multi-platform images.


3. Cache Docker Layers: Caches Docker layers to speed up subsequent builds.


4. Login to Docker Hub: Authenticates with Docker Hub using secrets.


5. Build and Push Docker Image: Builds the Docker image and pushes it to Docker Hub with both latest and commit SHA tags.


6. Notify: Provides success or failure notifications.



Secrets Management

Ensure the following secrets are set in your GitHub repository:

DOCKER_USERNAME: Your Docker Hub username.

DOCKER_PASSWORD: Your Docker Hub password.


Testing

CatScraper includes basic tests to ensure functionality.

Running Tests

npm test

Example Test

An example test checks if the homepage loads correctly:

// test/app.test.js

const request = require('supertest');
const app = require('../app'); // Ensure app.js exports the Express app

describe('GET /', () => {
    it('should return 200 OK and contain CatScraper text', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('CatScraper');
    });
});

Logging

CatScraper uses Winston for comprehensive logging. Logs are stored in app.log and printed to the console.

Log Configuration

Levels: info, warn, error

Transports:

Console: For real-time logging.

File: Logs are saved to app.log for persistent storage.



Security

CatScraper implements several security best practices:

Helmet: Secures HTTP headers.

Rate Limiting: Prevents abuse by limiting the number of requests per IP.

Non-Root User: Runs the application as a non-root user within Docker.

Input Validation: Ensures only Excel files are accepted for upload.


Environment Variables

Sensitive information, such as Docker credentials and application settings, are managed through environment variables defined in the .env file.

Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Repository


2. Create a Feature Branch

git checkout -b feature/YourFeature


3. Commit Your Changes

git commit -m "Add your feature"


4. Push to the Branch

git push origin feature/YourFeature


5. Open a Pull Request



Please ensure your code follows the project's coding standards and includes relevant tests.

License

This project is licensed under the MIT License.


---

Developed with ❤️ by Jeffrey Mooiweer




