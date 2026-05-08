const request = require('supertest');
const app = require('../server');
const zlib = require('zlib');

describe('Validator Service Unit Tests', () => {
    test('POST /validate - should return isValid: true for a real Factorio blueprint string', async () => {
        // Generăm noi un string valid pe care Zlib îl va recunoaște 100%
        const dummyBlueprint = { blueprint: { item: "wooden-chest", label: "Test" } };
        const compressed = zlib.deflateSync(JSON.stringify(dummyBlueprint));
        const validFactorioStr = "0" + compressed.toString('base64');

        const response = await request(app)
            .post('/validate')
            .send({ data: validFactorioStr });

        if (response.statusCode !== 200) {
            console.error("DEBUG ERROR:", response.body.error);
        }

        expect(response.statusCode).toBe(200);
        expect(response.body.isValid).toBe(true);
        expect(response.body.content.blueprint.item).toBe("wooden-chest");
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