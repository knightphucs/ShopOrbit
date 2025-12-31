# Security Specification – ShopOrbit

This document outlines the security architecture implemented in ShopOrbit’s microservices. A centralized **Identity Service** handles authentication and authorization. Downstream services (Catalog, Ordering, Basket) validate JWT tokens issued by Identity to enforce permissions.

## 1) Security Architecture

### 1.1 Identity Service

- Purpose: manage accounts, registration/login, issue JWT
- Token contents: identity, roles, and permission claims
- Tech stack: ASP.NET Core Identity, PostgreSQL (User Store), MassTransit (email/events integration)

### 1.2 Authentication Flow (JWT)

1. Client sends credentials to `Identity Service` (`/api/v1/auth/login`)
2. Identity validates and returns an Access Token (JWT)
3. Client sends API requests through the Gateway with `Authorization: Bearer <token>`
4. API Gateway routes to the appropriate service
5. Downstream services verify signature, expiration, and claims before processing

## 2) Authentication Implementation

### 2.1 Token Configuration

- Signing Algorithm: HMAC‑SHA256
- Issuer: `ShopOrbitIdentity`
- Audience: `ShopOrbitClient`
- Expiration: 60 minutes
- Secret Key: `JwtSettings__Secret`

### 2.2 Registration & Email Confirmation

- `POST /api/v1/auth/register`: creates account with default role `User`; rejects if username/email exists
- `GET /api/v1/auth/confirm-email`: requires confirmation (`options.SignIn.RequireConfirmedEmail = true`); token is URL‑encoded

### 2.3 Login

- Validates username/password and `EmailConfirmed == true`
- Loads roles and permission claims
- Returns JWT to the client

### 2.4 Password Management

- Forgot Password: generate reset token; return generic response to prevent user enumeration
- Reset Password: accepts `userId`, `token`, `newPassword`
- Change Password: requires a valid JWT to change the current user’s password

## 3) Authorization (Roles & Claims)

### 3.1 Roles

| Role  | Description                                                     |
| :---- | :-------------------------------------------------------------- |
| Admin | Full access (CRUD products, manage users, view all orders)      |
| Staff | Operational access (update order status, view products)         |
| User  | Customer access (view products, place orders, view own history) |

### 3.2 Permission Claims

- Admin/Staff: `product.manage`, `order.manage`
- User: `order.create`, `order.view_own`

### 3.3 JWT Payload (example)

```json
{
  "sub": "guid-user-id",
  "email": "admin@shoporbit.com",
  "name": "admin_user",
  "role": ["Admin"],
  "permission": ["product.manage", "order.manage"],
  "iss": "ShopOrbitIdentity",
  "aud": "ShopOrbitClient",
  "exp": 1733461200
}
```

## 4) Service‑Level Security

### 4.1 Basket Service (IDOR Protection)

- `[Authorize]` on `BasketController`
- Does not accept `userName`/`userId` from URL/body
- Extract `UserId` from JWT context to access Redis basket:

```csharp
var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
```

### 4.2 Ordering Service (Data Integrity)

- `[Authorize]` on `OrdersController`
- Server reads basket from Redis using `UserId` in the token (ignores client prices)

### 4.3 Catalog Service (Access Control)

- Read: all authenticated users
- Write: only `Admin` can CRUD products/categories

## 5) Endpoint Matrix

### Identity Service

| Endpoint                       | Method | Auth | Notes                  |
| :----------------------------- | :----: | :--: | :--------------------- |
| `/api/v1/auth/register`        |  POST  |  No  | Public                 |
| `/api/v1/auth/confirm-email`   |  GET   |  No  | Public                 |
| `/api/v1/auth/login`           |  POST  |  No  | Public                 |
| `/api/v1/auth/forgot-password` |  POST  |  No  | Public                 |
| `/api/v1/auth/reset-password`  |  POST  |  No  | Public                 |
| `/api/v1/auth/me`              |  GET   | Yes  | Any authenticated user |
| `/api/v1/auth/change-password` |  POST  | Yes  | Any authenticated user |

### Catalog Service

| Resource   | Method | Endpoint                  | Role             |
| :--------- | :----: | :------------------------ | :--------------- |
| Products   |  GET   | `/api/v1/products`        | User/Staff/Admin |
|            |  GET   | `/api/v1/products/{id}`   | User/Staff/Admin |
|            |  POST  | `/api/v1/products`        | Admin            |
|            |  PUT   | `/api/v1/products/{id}`   | Admin            |
|            | DELETE | `/api/v1/products/{id}`   | Admin            |
| Categories |  GET   | `/api/v1/categories`      | User/Staff/Admin |
|            |  GET   | `/api/v1/categories/{id}` | User/Staff/Admin |
|            |  POST  | `/api/v1/categories`      | Admin            |
|            |  PUT   | `/api/v1/categories/{id}` | Admin            |
|            | DELETE | `/api/v1/categories/{id}` | Admin            |

### Ordering Service

| Endpoint                   | Method | Role        | Description       |
| :------------------------- | :----: | :---------- | :---------------- |
| `/api/v1/orders`           |  GET   | Admin/Staff | View all orders   |
| `/api/v1/orders/my-orders` |  GET   | User        | View own history  |
| `/api/v1/orders`           |  POST  | User        | Place a new order |
| `/api/v1/orders/{id}`      |  GET   | User/Admin  | View order detail |

### Basket Service

| Endpoint                   | Method  | Role        | Description       |
| :------------------------- | :-----: | :---------- | :---------------- |
| `/api/v1/basket`           |  GET    | User        | Get current cart  |
| `/api/v1/basket`           |  POST   | User        | Update/Add items  |
| `/api/v1/basket`           |  DELETE | User        | Clear cart        |

## 6) Threat Model & Mitigations

| Threat                  | Mitigation                                                      |
| :---------------------- | :-------------------------------------------------------------- |
| Token tampering         | JWT signed with HMAC‑SHA256; changes invalidate the signature   |
| Unauthorized access     | `[Authorize]` + role/claim policies; deny‑by‑default            |
| Account takeover        | Strong password policies enforced by ASP.NET Identity           |
| Email bypass            | Reject login when `EmailConfirmed == false`                     |
| User enumeration        | Forgot Password returns a generic response                      |
| Price manipulation      | Server rebuilds order from Redis basket; ignores client pricing |
| Sensitive data exposure | JWT includes only minimal required claims                       |
| Replay attacks          | Access tokens have short lifetime (60 minutes)                  |
