
<p align="center">
  <img src="https://github.com/jeffreymooiweer/CatScraper/blob/main/public/images/favicon.png?raw=true" alt="favicon" width="300"/>
</p>

# CatScraper

**CatScraper** is a web-based scraping tool built with Node.js and Puppeteer. It allows users to extract product data from multiple suppliers, compare article numbers, and synchronize results across different vendors. The tool is designed for use with Excel files and supports custom login configurations for each supplier.

## Features
- Upload and process Excel files with article numbers.
- Supports multiple suppliers with configurable login fields, including customer number options.
- Automatic column scanning for Excel files.
- Web scraping with Puppeteer to extract data from supplier websites.
- Replace article numbers and export updated Excel files.

## Requirements
- Node.js v14+ or higher
- Docker (for deployment in container environments)
- Unraid (optional, for server deployment)

## Installation

### Local Setup
1. Clone the repository:
    ```bash
    git clone https://github.com/jeffreymooiweer/CatScraper.git
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Run the application:
    ```bash
    npm start
    ```

### Docker Setup
For deployment using Docker, you can pull the container directly from Docker Hub:
```bash
docker pull jeffersonmouze/catscraper:latest
```

When configuring in **Unraid**, use the following port mapping:
- `5000:5000`

For volume mappings:
- `/uploads`: Path for storing uploaded Excel files.
- `/config`: Path for saving configuration data.

### Unraid XML Configuration
For **Unraid** users, use the following XML configuration to set up CatScraper easily:

```xml
<Container>
    <Name>CatScraper</Name>
    <Repository>jeffersonmouze/catscraper:latest</Repository>
    <Network>bridge</Network>
    <MyPorts>
        <Port>
            <HostPort>5000</HostPort>
            <ContainerPort>5000</ContainerPort>
            <Protocol>tcp</Protocol>
        </Port>
    </MyPorts>
    <MyVolumes>
        <Volume>
            <HostDir>/path/to/uploads</HostDir>
            <ContainerDir>/uploads</ContainerDir>
        </Volume>
        <Volume>
            <HostDir>/path/to/config</HostDir>
            <ContainerDir>/config</ContainerDir>
        </Volume>
    </MyVolumes>
    <WebUI>http://[IP]:[PORT:5000]</WebUI>
    <Icon>https://raw.githubusercontent.com/jeffreymooiweer/CatScraper/main/public/images/favicon.png</Icon>
    <Description>Web scraper to sync article numbers between suppliers, built with Node.js and Puppeteer.</Description>
</Container>
```

You need to specify the host paths for `/uploads` and `/config` during setup.

## Usage
1. Upload an Excel file containing article numbers.
2. Select the column containing article numbers.
3. Configure supplier login details, including selectors for username, password, and customer numbers (if applicable).
4. Start the scraping process and download the updated Excel file.

## Screenshots
![Screenshot of CatScraper](https://github.com/jeffreymooiweer/CatScraper/public/images/catscraper.png)

## Contributing
Contributions are welcome! Please submit pull requests and issues to improve the application.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

