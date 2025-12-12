# ShopOrbit - Microservices E-commerce Platform

ShopOrbit is a scalable E-commerce backend system built with **.NET 8 Microservices Architecture**. This project demonstrates advanced concepts such as Authentication/Authorization, Distributed Caching, Event-Driven Architecture, and API Gateway implementation.

## 🚀 Tech Stack

- **Framework:** .NET 8 (ASP.NET Core Web API)
- **Database:** PostgreSQL (Entity Framework Core Code-First)
- **Caching:** Redis (Distributed Cache)
- **Messaging:** RabbitMQ (via MassTransit)
- **API Gateway:** YARP (Yet Another Reverse Proxy)
- **Containerization:** Docker & Docker Compose
- **Authentication:** JWT (JSON Web Token) & ASP.NET Core Identity

## 🏗 Architecture Overview

The system is composed of the following microservices:

| Service              | Port   | Description                                             |
| :------------------- | :----- | :------------------------------------------------------ |
| **API Gateway**      | `5000` | Single entry point. Handles routing and JWT validation. |
| **Identity Service** | `5051` | Manages Users, Roles, and JWT Token issuance.           |
| **Catalog Service**  | `5052` | Manages Products. Implements Redis Caching & ETag.      |
| **Ordering Service** | `5053` | Handles Orders. Publishes events to RabbitMQ.           |
| **PostgreSQL**       | `5432` | Primary Database.                                       |
| **Redis**            | `6379` | Cache Store.                                            |
| **RabbitMQ**         | `5672` | Message Broker.                                         |

---

## 🛠 Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Visual Studio Code](https://code.visualstudio.com/) or Visual Studio 2022

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ShopOrbit.git
cd ShopOrbit
```

### 2. Start Infrastucture

```bash
docker-compose up -d
```

### 3. Add-Migrations

```bash
dotnet ef migrations add InitialCreate --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj
dotnet ef migrations add InitialCreate --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj

# Identity Service
dotnet ef database update --project src/Services/Identity/ShopOrbit.Identity.API

# Catalog Service
dotnet ef database update --project src/Services/Catalog/ShopOrbit.Catalog.API

# Ordering Service
dotnet ef database update --project src/Services/Ordering/ShopOrbit.Ordering.API

# Payment Service
dotnet ef database update --project src/Services/Payment/ShopOrbit.Payments.API
```

### 4. Run all services

```bash
./start-all.ps1

All services has deployed to Docker -> just run "docker-compose up -d"
```
