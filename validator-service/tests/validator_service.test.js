const request = require('supertest');
const app = require('../server');
const zlib = require('zlib');

describe('Validator Service Unit Tests', () => {
    // It creates a real, valid scenario from scratch. It takes a JavaScript object (dummyBlueprint),
    // turns it into a JSON string, compresses it using zlib, and adds the mandatory "0" at the beginning.
    test('POST /validate - should return isValid: true for a real Factorio blueprint string', async () => {
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

    // It sends a string starting with "1" instead of the required "0". It triggers the second if statement in your service code (if (data[0] !== '0')).
    test('POST /validate - should return 400 for string with invalid version byte', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "1eNqrVipSslIyUrJScs7PzU/XUUrOLy0qSExPLUotSszJL8pMzs9LzStRsqpWKkqNrQUAtXoO6w==" });

        expect(response.statusCode).toBe(400);
        expect(response.body.isValid).toBe(false);
        expect(response.body.error).toBe('Invalid version byte');
    });

    // It sends a request where the data field is just an empty string "". It verifies that the service returns a 400 status and isValid: false.
    test('POST /validate - should return 400 for empty data', async () => {
        const response = await request(app)
            .post('/validate')
            .send({ data: "" });

        expect(response.statusCode).toBe(400);
        expect(response.body.isValid).toBe(false);
    });
});