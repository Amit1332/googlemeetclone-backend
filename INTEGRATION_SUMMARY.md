# Backend Integration & Projects Summary

This file summarizes the backend changes made to support **Organization-based Projects** and **Multi-platform Integrations (n8n, MS Teams, etc.)**.

## 1. Project Management Feature
We added the ability to group users into projects within an organization for targeted notifications.

### Backend Components:
- **Model:** `src/model/project.schema.js` (Stores project name, org, owner, and members).
- **Service:** `src/services/project.service.js` (CRUD logic).
- **Controller:** `src/controller/projectController.js`.
- **Routes:** `POST /api/v1/projects` (Create), `GET /api/v1/projects` (List), `POST /api/v1/projects/add-members`.

---

## 2. Multi-Platform Integration (Client ID/Secret)
We moved away from a static API key to a professional, database-backed authentication system. This allows multiple external platforms (n8n, MS Teams, etc.) to connect securely.

### Backend Components:
- **Model:** `src/model/appCredential.schema.js` (Stores `clientId` and hashed `clientSecret` per organization).
- **Middleware:** `src/middleware/apiAuth.js` (Validates `x-client-id` and `x-client-secret` headers).
- **Service:** `src/services/integration.service.js` (Handles credential generation and broadcast logic).
- **Controller:** `src/controller/integrationController.js`.
- **Routes:**
  - `POST /api/v1/integrations/credentials`: Generate new credentials (JWT Auth).
  - `GET /api/v1/integrations/credentials`: List active credentials (JWT Auth).
  - `POST /api/v1/integrations/broadcast`: Send a message to all members of a project (Client ID/Secret Auth).

---

## 3. API Reference for UI Implementation

### Manage Projects
- `GET /api/v1/projects`: Returns list of projects for the user's organization.
- `POST /api/v1/projects`: Creates a new project. 
  - Body: `{ "name": "Project Name", "organization": "ORG_ID", "members": ["USER_ID_1"] }`

### Manage Integration Credentials
- `GET /api/v1/integrations/credentials`: Returns list of apps connected (clientId, appName).
- `POST /api/v1/integrations/credentials`: Generates a new pair.
  - Body: `{ "appName": "n8n" }`
  - Response: `{ "clientId": "...", "clientSecret": "..." }` (**Note:** clientSecret is only shown once).

### Broadcast (For External Platforms)
- `POST /api/v1/integrations/broadcast`
  - Headers: `x-client-id`, `x-client-secret`
  - Body: `{ "projectId": "...", "senderId": "...", "message": "..." }`

---

## 4. Modified Files List
- `src/model/project.schema.js` (New)
- `src/model/appCredential.schema.js` (New)
- `src/middleware/apiAuth.js` (New)
- `src/services/project.service.js` (New)
- `src/services/integration.service.js` (New)
- `src/controller/projectController.js` (New)
- `src/controller/integrationController.js` (New)
- `src/routes/projectRoutes/index.js` (New)
- `src/routes/integrationRoutes/index.js` (New)
- `src/routes/index.js` (Updated)
- `src/controller/index.js` (Updated)
- `src/services/index.js` (Updated)

---

## 5. Next Steps (UI Session)
1. Navigate to Settings -> Organization.
2. Add a **Projects** section to list/create projects.
3. Add an **Integrations** section to generate and display Client ID/Secrets.
4. Ensure the `clientSecret` is presented to the user in a "Copy" dialog as it is never shown again by the API.
