import pytest
from fastapi.testclient import TestClient
from auth_service import app
import os
from pymongo import MongoClient

# Folosim un client sincron (pymongo) pentru a curăța baza de date între teste
@pytest.fixture(scope="module", autouse=True)
def clean_db():
    mongo_uri = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
    db_client = MongoClient(mongo_uri)
    db_client.users_db.users.delete_many({})
    db_client.close()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_register_user(client):
    payload = {"username": "testuser", "password": "securepassword"}
    response = client.post("/register", json=payload)
    assert response.status_code == 201 or response.status_code == 200 # depinde ce ai pus in cod
    assert "message" in response.json()

def test_login_success(client):
    payload = {"username": "testuser", "password": "securepassword"}
    response = client.post("/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password(client):
    payload = {"username": "testuser", "password": "wrongpassword"}
    response = client.post("/login", json=payload)
    assert response.status_code == 401