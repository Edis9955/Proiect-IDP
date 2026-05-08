import pytest
from fastapi.testclient import TestClient
from auth_service import app
import os
from pymongo import MongoClient

# Deletes all existing users, providing a "clean slate".
@pytest.fixture(scope="module", autouse=True)
def clean_db():
    mongo_uri = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
    db_client = MongoClient(mongo_uri)
    db_client.users_db.users.delete_many({})
    db_client.close()

# Creates a TestClient.
@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

# The system should successfully save the user and return a success message.
def test_register_user(client):
    payload = {"username": "testuser", "password": "securepassword"}
    response = client.post("/register", json=payload)
    assert response.status_code == 201
    assert "message" in response.json()

# The system should validate the user and return an 'access_token'.
def test_login_success(client):
    payload = {"username": "testuser", "password": "securepassword"}
    response = client.post("/login", json=payload)
    assert response.status_code == 200
    assert "access_token" in response.json()

# The system should reject the attempt and deny access.
def test_login_wrong_password(client):
    payload = {"username": "testuser", "password": "wrongpassword"}
    response = client.post("/login", json=payload)
    assert response.status_code == 401