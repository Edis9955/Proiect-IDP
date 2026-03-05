# Proiect-IDP


Blueprint Sharing & Versioning Portal:

# I.Microservices:
## 1.Blueprint-Manager
The "CRUD" service. It handles uploading new blueprint strings, editing titles/descriptions, and deleting them.
## 2.Validator-Service: 
A specialized service that takes a Factorio blueprint string (which is usually Base64 encoded JSON) and decodes/validates it to ensure it’s a real blueprint before it's saved.

## 3.User-Interaction-Service: 
Manages user "likes," "favorites," and comments on specific blueprints.


# II.Infrastructure
## Database:
MongoDB. It’s perfect for blueprints because different blueprint types (rails, reactors, belts) might have different metadata fields
## DB Utility: 
TODO

## API Gateway
TODO (Kong)

# III. Networking & Deployment

Network A (frontend-net): Connects Kong to your Blueprint-Manager and User-Interaction services.

Network B (backend-net): Connects the Blueprint-Manager to the Validator-Service and the MongoDB database

Deployment Tags

# IV. Observability & CI/CD

## Monitoring
TODO
## Logging
TODO
## GitLab CI/CD
TODO














