FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# REPARAȚIE: Copiem TOT conținutul folderului curent în /app din container
# Asta va include auth_service.py, folderul tests/, etc.
COPY . .

EXPOSE 8000

CMD ["uvicorn", "auth_service:app", "--host", "0.0.0.0", "--port", "8000"]