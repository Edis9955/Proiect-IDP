const request = require('supertest');
const app = require('../server');

describe('Validator Service Unit Tests', () => {
    test('POST /validate - should return isValid: true for non-empty string', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "0eJyrVipSslIyUrJSCjZVAAsXAnU=" });

        expect(response.statusCode).toBe(200);
        expect(response.body.isValid).toBe(true);
    });

    test('POST /validate - should return isValid: false for empty string', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "" });

        expect(response.statusCode).toBe(400); // Sau 200, depinde cum ai scris logica
        expect(response.body.isValid).toBe(false);
    });
});