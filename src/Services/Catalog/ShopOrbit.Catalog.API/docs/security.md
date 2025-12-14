# Security Specification – Catalog Service

### 1. Overview

The Catalog Service uses **JWT-based authentication** combined with **role-based authorization**.

Authentication is handled by the **Identity Service**, while the **Catalog Service** is responsible only for **token validation and access control**.

---

### 2. Authentication Flow

1. The user sends email/password credentials to the **Identity Service** (/api/auth/login)

2. The **Identity Service** validates the credentials and returns an **Access Token**

3. The client sends subsequent requests through the **API Gateway**

4. The **API Gateway** forwards the request to the Catalog Service

5. The **Catalog Service** validates the JWT using authentication middleware

### Token Format (JWT)

The JWT payload contains the following claims:

```json
{
  "sub": "user-guid",
  "email": "admin@shoporbit.com",
  "role": "Admin",
  "exp": 1701768100
}
```

### 3. Roles & Permissions

| Role  | Permissions                          |
| ----- | ------------------------------------ |
| Admin | Full CRUD on Products and Categories |
| Staff | Read-only access                     |
| User  | Read-only access                     |


Administrative operations directly affect system data and therefore require strict access control.

### 4. Protected Endpoints

- Products

| Method | Endpoint           | Required Role      |
| ------ | ------------------ | ------------------ |
| GET    | /api/products      | User, Staff, Admin |
| GET    | /api/products/{id} | User, Staff, Admin |
| POST   | /api/products      | Admin              |
| PUT    | /api/products/{id} | Admin              |
| DELETE | /api/products/{id} | Admin              |


- Categories

| Method | Endpoint             | Required Role      |
| ------ | -------------------- | ------------------ |
| GET    | /api/categories      | User, Staff, Admin |
| GET    | /api/categories/{id} | User, Staff, Admin |
| POST   | /api/categories      | Admin              |
| PUT    | /api/categories/{id} | Admin              |
| DELETE | /api/categories/{id} | Admin              |

### 5. Security Risks & Mitigation

### 5.1 Token Tampering

→ Mitigation: JWT signature and expiration time are validated on every request.

### 5.2 Unauthorized Access

→ Role-based authorization policies are enforced, with a deny-by-default approach

### 5.3 Sensitive Data Exposure

→ Sensitive identity data is never exposed by the Catalog Service.
→ Only required claims are included in JWT tokens.

### 5.4 Replay Attacks

→ Access tokens have a short lifespan (15–30 minutes).

### 6. Summary

- JWT-based authentication

- Role-based authorization

- Protected endpoints for all sensitive operations
