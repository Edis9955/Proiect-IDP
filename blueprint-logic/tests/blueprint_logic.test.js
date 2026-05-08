const request = require('supertest');
const axios = require('axios');
const express = require('express');

const app = require('../server'); 
jest.mock('axios');

describe('Blueprint Logic Service Tests', () => {
    // Wipes the slate clean before every single test.
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // It sends a title with only 2 letters ("Ab"). The service is expected to reject this immediately
    // with a 400 Bad Request before even trying to talk to the database.
    test('POST /api/blueprints/share - should fail if title is too short', async () => {
        const response = await request(app)
            .post('/api/blueprints/share')
            .send({ title: "Ab", blueprintString: "0eJ..." });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Title too short");
    });

    // It "primes" axios to return a fake ID (12345).
    // It sends a valid request with a custom header (x-user-name).
    // It verifies the service returns 201 Created and correctly passed the username "levent" to the backend bridge.
    test('POST /api/blueprints/share - should succeed and forward to bridge', async () => {
        axios.post.mockResolvedValue({ data: { _id: "12345" } });

        const response = await request(app)
            .post('/api/blueprints/share')
            .set('x-user-name', 'levent')
            .send({ title: "Great Factory", blueprintString: "0eJ..." });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toContain("successfully");
        expect(response.body.id).toBe("12345");
        expect(axios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            author: "levent"
        }));
    });

    // It mocks a situation where a blueprint belongs to "Admin".
    // A user named "Hacker" tries to delete it.
    // It verifies the service blocks the request with a 403 Forbidden error.
    test('DELETE /api/blueprints/:id - should block if user is not the author', async () => {
        axios.get.mockResolvedValue({ data: { _id: "99", author: "Admin", title: "Secret" } });

        const response = await request(app)
            .delete('/api/blueprints/99')
            .set('x-user-name', 'Hacker');

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toContain("Unauthorized");
    });
});