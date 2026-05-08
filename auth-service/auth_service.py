from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from passlib.context import CryptContext
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import jwt
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)

MONGO_DETAILS = os.getenv("MONGO_DETAILS", "mongodb://mongodb:27017")
SECRET_KEY = "factorio_super_secret_key"
ALGORITHM = "HS256"

client = AsyncIOMotorClient(MONGO_DETAILS)
client.get_io_loop = asyncio.get_event_loop
database = client.users_db
user_collection = database.get_collection("users")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=True)

class User(BaseModel):
    username: str
    password: str

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire, "iss": "factorio-auth-service" })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    if isinstance(encoded_jwt, bytes):
        return encoded_jwt.decode('utf-8')
    return encoded_jwt

@app.post("/register", status_code=201)
async def register(user: User):
    existing_user = await user_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Utilizatorul există deja")
    
    new_user = {
        "username": user.username,
        "password": get_password_hash(user.password),
        "created_at": datetime.now(timezone.utc)
    }

    await user_collection.insert_one(new_user)
    return {"message": "Utilizator înregistrat cu succes în Baza de date!"}

@app.post("/login")
async def login(user: User):
    user_in_db = await user_collection.find_one({"username": user.username})

    if not user_in_db or not verify_password(user.password, user_in_db["password"]):
        raise HTTPException(status_code=401, detail="Date incorecte")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}