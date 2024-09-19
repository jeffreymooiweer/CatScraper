# Catscraper

Catscraper is a web scraping tool built using Node.js, Puppeteer, and Excel processing libraries. The application automates the process of scraping product information from two different suppliers, comparing the data, and updating an Excel file with the relevant product codes.

## Features

- Upload an Excel file containing article numbers.
- Scrape product data from two suppliers based on input.
- Handle login forms and search functionality with dynamic selectors.
- Process the returned data and update the Excel file with new product codes.
- Download the updated Excel file.
- Customizable login and search fields for each supplier.
  
## Requirements

- Node.js
- Puppeteer
- Excel processing libraries (xlsx)
  
## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/catscraper.git
   cd catscraper
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm start
   ```

## Usage

1. Open the application in your browser at `http://localhost:5000`.
2. Upload an Excel file with article numbers.
3. Configure supplier login information, search URLs, and field selectors.
4. Download the updated Excel file with new product data.

## Configuration

- **Login URL**: The URL where the supplier login page is located.
- **Search URL**: The URL used for searching products by article number.
- **Selectors**: Specify the HTML element IDs for login fields, password fields, and search fields.
- **Customer Number**: Optional field if required by the supplier.

## Example

1. Upload an Excel file with article numbers.
2. Fill in the login URLs, search URLs, and selectors for both suppliers.
3. Click "Uploaden en Verwerken" to start the scraping process.
4. Download the updated Excel file with new product codes.

## License

This project is licensed under the MIT License.


