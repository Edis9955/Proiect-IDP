const request = require('supertest');
const app = require('../server');

describe('Validator Service Unit Tests', () => {
    test('POST /validate - should return isValid: true for a real Factorio blueprint string', async () => {
        // Un string valid de Factorio (Wooden Chest)
        const validFactorioStr = "0eNqrVipSslIyUrJScs7PzU/XUUrOLy0qSExPLUotSszJL8pMzs9LzStRsqpWKkqNrQUAtXoO6w==";

        const response = await request(app)
            .post('/validate')
            .send({ data: validFactorioStr });

        expect(response.statusCode).toBe(200);
        expect(response.body.isValid).toBe(true);
        expect(response.body.content).toHaveProperty('blueprint');
    });

    test('POST /validate - should return 400 for string with invalid version byte', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "1eNqrVipSslIyUrJScs7PzU/XUUrOLy0qSExPLUotSszJL8pMzs9LzStRsqpWKkqNrQUAtXoO6w==" });

        expect(response.statusCode).toBe(400);
        expect(response.body.isValid).toBe(false);
        expect(response.body.error).toBe('Invalid version byte');
    });

    test('POST /validate - should return 400 for empty data', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "" });

        expect(response.statusCode).toBe(400);
        expect(response.body.isValid).toBe(false);
    });
});