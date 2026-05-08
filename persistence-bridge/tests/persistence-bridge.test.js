const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');
const app = require('../server');

jest.mock('axios'); // Simulăm apelul către validator-service

describe('Persistence Bridge Integration Tests', () => {
    
    // Înainte de teste, ne asigurăm că suntem conectați la baza de date de test
    beforeAll(async () => {
        const url = process.env.MONGO_URI || 'mongodb://mongodb:27017/test_db';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(url);
        }
    });

    // După teste, curățăm baza de date și închidem conexiunea
    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.db.dropDatabase();
            await mongoose.connection.close(); // MODIFICAT AICI
        }
    });

    test('POST /blueprints - should save blueprint when validator returns true', async () => {
        // Simulăm răspunsul pozitiv de la validator-service
        axios.post.mockResolvedValue({ data: { isValid: true } });

        const response = await request(app)
            .post('/blueprints')
            .send({
                title: "Test Factory",
                blueprintString: "0eJ...",
                author: "Levent"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe("Test Factory");
        expect(response.body).toHaveProperty('_id');
    });

    test('POST /blueprints - should fail when validator returns false', async () => {
        // Simulăm un string invalid
        axios.post.mockResolvedValue({ data: { isValid: false } });

        const response = await request(app)
            .post('/blueprints')
            .send({
                title: "Bad String",
                blueprintString: "invalid",
                author: "Levent"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Invalid Factorio String');
    });
});