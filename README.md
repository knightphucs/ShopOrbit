# ShopOrbit – Microservices E‑commerce Platform (.NET 8)

ShopOrbit is a backend E‑commerce system built with a **.NET 8 microservices architecture**, designed for scalability, resilience, and clear service boundaries. It demonstrates authentication/authorization (JWT + Identity), distributed caching (Redis), event‑driven communication (RabbitMQ + MassTransit), and an API Gateway (YARP), containerized with Docker.

## 🚀 Tech Stack

- Framework: .NET 8 (ASP.NET Core Web API)
- Database: PostgreSQL (EF Core Code‑First)
- Caching: Redis (Distributed Cache)
- Messaging: RabbitMQ (MassTransit)
- API Gateway: YARP (Yet Another Reverse Proxy)
- Containerization: Docker & Docker Compose
- Authentication: JWT + ASP.NET Core Identity

## 🏗 Architecture Overview

Primary microservices and infrastructure:

| Service          | Port  | Description                                                         |
| :--------------- | :---- | :------------------------------------------------------------------ |
| API Gateway      | 5000  | Single entry point; routing and JWT validation                      |
| Identity Service | 5051  | Manages users/roles; issues JWT                                     |
| Catalog Service  | 5052  | Product management; Redis cache + HTTP ETag                         |
| Ordering Service | 5053  | Order processing; publishes events to RabbitMQ                      |
| Payment Service  | (cfg) | Payment processing; publishes/consumes events (port in appsettings) |
| PostgreSQL       | 5432  | Primary database                                                    |
| Redis            | 6379  | Distributed cache                                                   |
| RabbitMQ         | 5672  | Message broker                                                      |

Note: The Payment Service port is configured in `appsettings.json`/`launchSettings.json`.

## 📦 Repository Structure

- `src/BuildingBlocks/ShopOrbit.BuildingBlocks`: shared contracts, proto files, common building blocks
- `src/Gateways/ShopOrbit.Gateway`: API Gateway (YARP)
- `src/Services/*`: microservices (Basket, Catalog, Identity, Ordering, Payment)
- `ui/`: Frontend app (Next.js/TypeScript)
- `docs/`: project docs (caching, events, security)
- `docker-compose.yml`: infrastructure containers for Postgres/Redis/RabbitMQ and services
- `start-all.ps1`: convenience script to start services

## 🛠 Prerequisites

- .NET 8 SDK
- Docker Desktop
- VS Code or Visual Studio 2022

## ⚙️ Bootstrap Infrastructure

```bash
docker-compose up -d
```

Quick checks:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ Management UI (if enabled): `http://localhost:15672`

## 🗃️ EF Core Migrations & Database Update

Create migrations per service (once on init or when schema changes):

```bash
dotnet ef migrations add InitialCreate --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj
```

Update databases:

```bash
dotnet ef database update --project src/Services/Identity/ShopOrbit.Identity.API
dotnet ef database update --project src/Services/Catalog/ShopOrbit.Catalog.API
dotnet ef database update --project src/Services/Ordering/ShopOrbit.Ordering.API
dotnet ef database update --project src/Services/Payment/ShopOrbit.Payments.API
```

## ▶️ Run Services

Start everything via PowerShell script:

```bash
./start-all.ps1
```

Or run services individually:

```bash
dotnet run --project src/Gateways/ShopOrbit.Gateway/ShopOrbit.Gateway.csproj
dotnet run --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj
dotnet run --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj
dotnet run --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj
dotnet run --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj
```

## 🌐 Frontend (UI)

```bash
cd ui
npm install
npm run dev
```

The UI uses Next.js/TypeScript and connects via the API Gateway (`http://localhost:5000`).

## 🔐 Key Environment Variables

- `ConnectionStrings__Default`: PostgreSQL connection string
- `Redis__ConnectionString`: Redis address
- `RabbitMQ__Host`: RabbitMQ host (e.g., `shoporbit-rabbitmq` in Docker network)
- `JwtSettings__Secret`: secret key for JWT signing
- `JwtSettings__Issuer`, `JwtSettings__Audience`, `JwtSettings__ExpiresMinutes`: token configuration

## 🧠 Design Principles

- Service boundaries with event‑driven communication
- Read‑heavy caching (Catalog) + HTTP ETag to reduce bandwidth
- Secure ordering: server reads basket from Redis, ignores client‑provided prices
- Payment idempotency: key `processed_order_{OrderId}` (TTL 24h)

## 🧰 Troubleshooting

- Postgres connection issues: verify `postgres` container, firewall, and `ConnectionStrings__Default`
- Redis not responding: check `redis` container and Docker network
- RabbitMQ auth errors: ensure correct user/pass or mount default config
- Migration errors: delete project `bin/obj` folders and recreate migrations

## 📚 Related Docs

- Caching: see `docs/caching-plan.md`
- Events: see `docs/events.md`
- Security: see `docs/security-spec.md`
- Consistency & Outbox: see `docs/consistency.md`
- Setup & Testing: see `docs/runbook.md` (includes Quartz schema setup)
