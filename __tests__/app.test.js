const request = require('supertest');
const app = require('../app'); // Zorg ervoor dat dit pad correct is

// Server variabele om te kunnen sluiten na de tests
let server;

beforeAll((done) => {
  // Start de server voor de tests op een willekeurige poort
  server = app.listen(0, () => { // 0 wijst automatisch een beschikbare poort toe
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

// Verhoog de Jest timeout voor langlopende tests
jest.setTimeout(10000); // 10 seconden
