const request = require('supertest');
const axios = require('axios');
const express = require('express');

// Importăm aplicația (va trebui să modifici server.js să facă module.exports, vezi pasul următor)
// Pentru moment, presupunem că am extras logica într-un fișier separat sau exportăm app.
const app = require('../server'); 

jest.mock('axios'); // Simulăm axios pentru a nu trimite cereri reale către bridge

describe('Blueprint Logic Service Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TEST 1: Regula de business - Titlu prea scurt
    test('POST /api/blueprints/share - should fail if title is too short', async () => {
        const response = await request(app)
            .post('/api/blueprints/share')
            .send({ title: "Ab", blueprintString: "0eJ..." });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Title too short");
    });

    // TEST 2: Succes Share Blueprint
    test('POST /api/blueprints/share - should succeed and forward to bridge', async () => {
        // Simulăm răspunsul de la Persistence Bridge
        axios.post.mockResolvedValue({ data: { _id: "12345" } });

        const response = await request(app)
            .post('/api/blueprints/share')
            .set('x-user-name', 'levent')
            .send({ title: "Great Factory", blueprintString: "0eJ..." });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toContain("successfully");
        expect(response.body.id).toBe("12345");
        // Verificăm dacă a trimis autorul corect către bridge
        expect(axios.post).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            author: "levent"
        }));
    });

    // TEST 3: Securitate - Delete Unauthorized
    test('DELETE /api/blueprints/:id - should block if user is not the author', async () => {
        // 1. Simulăm că bridge-ul returnează un blueprint creat de "Admin"
        axios.get.mockResolvedValue({ data: { _id: "99", author: "Admin", title: "Secret" } });

        // 2. Încercăm să îl ștergem ca "Hacker"
        const response = await request(app)
            .delete('/api/blueprints/99')
            .set('x-user-name', 'Hacker');

        expect(response.statusCode).toBe(403);
        expect(response.body.error).toContain("Unauthorized");
    });
});