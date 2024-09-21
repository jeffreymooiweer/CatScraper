// __tests__/app.test.js

const request = require('supertest');
const app = require('../app'); // Zorg ervoor dat dit pad correct is

// Server variabele om te kunnen sluiten na de tests
let server;

beforeAll((done) => {
  // Start de server voor de tests
  server = app.listen(5000, () => {
    done();
  });
});

afterAll((done) => {
  // Sluit de server na alle tests
  server.close(done);
});

describe('GET /', () => {
  it('should return 200 OK and render the homepage', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);

    // Controleer of specifieke elementen van het ejs-bestand aanwezig zijn
    expect(res.text).toContain('<title>CatScraper</title>');
    expect(res.text).toContain('<h1>CatScraper</h1>');
    expect(res.text).toContain('<form id="uploadForm"');
    expect(res.text).toContain('Upload Excel-bestand');
  });
});
