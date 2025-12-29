# ShopOrbit Runbook – Local Setup & Testing

This runbook provides step-by-step instructions to set up, run, and test ShopOrbit on your local development machine.

## 1) Prerequisites Check

Before starting, verify you have all required tools:

```bash
# Check .NET SDK version (should be 8.0 or higher)
dotnet --version

# Check Docker is running
docker --version
docker ps

# Check PowerShell (if on Windows)
$PSVersionTable.PSVersion
```

If any of these fail, install the missing tools:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 2) Clone & Open Project

```bash
# Clone repository
git clone https://github.com/your-org/ShopOrbit.git
cd ShopOrbit

# Open in VS Code
code .
```

---

## 3) Start Infrastructure (Docker)

ShopOrbit requires PostgreSQL, Redis, and RabbitMQ. Start them via Docker Compose:

```bash
# Start containers in background
docker-compose up -d

# Verify containers are running
docker-compose ps
```

Expected output:

```
NAME                   STATUS
postgres              Up 2 minutes
redis                 Up 2 minutes
rabbitmq              Up 2 minutes
```

Quick connectivity checks:

```bash
# PostgreSQL
psql -h localhost -U postgres -c "SELECT 1;"

# Redis
redis-cli -h localhost ping

# RabbitMQ Management UI
curl -I http://localhost:15672  # Should return 302 (redirect)
```

### 3.1 (Optional) Access RabbitMQ Management UI

Open browser: `http://localhost:15672`

- Username: `guest`
- Password: `guest`

---

## 4) Create & Apply EF Core Migrations

Each microservice has its own PostgreSQL database. Create migrations and apply them:

### 4.1 Identity Service

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj \
  --context IdentityDbContext

# Apply migration
dotnet ef database update \
  --project src/Services/Identity/ShopOrbit.Identity.API
```

### 4.2 Catalog Service

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj

# Apply migration
dotnet ef database update \
  --project src/Services/Catalog/ShopOrbit.Catalog.API
```

### 4.3 Ordering Service

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj

# Apply migration
dotnet ef database update \
  --project src/Services/Ordering/ShopOrbit.Ordering.API
```

### 4.4 Payment Service

```bash
# Create migration
dotnet ef migrations add InitialCreate \
  --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj

# Apply migration
dotnet ef database update \
  --project src/Services/Payment/ShopOrbit.Payments.API
```

**Verify migrations applied**:

```bash
# Connect to Postgres and list tables
psql -h localhost -U postgres -d identity_db -c "\dt"
psql -h localhost -U postgres -d catalog_db -c "\dt"
psql -h localhost -U postgres -d ordering_db -c "\dt"
psql -h localhost -U postgres -d payments_db -c "\dt"
```

### 4.5 Quartz Scheduler Tables (Optional)

If your project uses Quartz for job scheduling, compensation, or timeouts, create the Quartz tables:

**Option A: Using psql script file**

Save the following SQL to `schema-quartz-postgres.sql`:

```sql
DO $$
  DECLARE DropDb INT := 1;
BEGIN
  IF DropDb = 1 THEN
    SET client_min_messages = WARNING;
    DROP TABLE IF EXISTS qrtz_fired_triggers;
    DROP TABLE IF EXISTS qrtz_paused_trigger_grps;
    DROP TABLE IF EXISTS qrtz_scheduler_state;
    DROP TABLE IF EXISTS qrtz_locks;
    DROP TABLE IF EXISTS qrtz_simprop_triggers;
    DROP TABLE IF EXISTS qrtz_simple_triggers;
    DROP TABLE IF EXISTS qrtz_cron_triggers;
    DROP TABLE IF EXISTS qrtz_blob_triggers;
    DROP TABLE IF EXISTS qrtz_triggers;
    DROP TABLE IF EXISTS qrtz_job_details;
    DROP TABLE IF EXISTS qrtz_calendars;
    SET client_min_messages = NOTICE;
  END IF;
END $$;

CREATE TABLE qrtz_job_details (
  sched_name TEXT NOT NULL,
  job_name TEXT NOT NULL,
  job_group TEXT NOT NULL,
  description TEXT NULL,
  job_class_name TEXT NOT NULL,
  is_durable BOOL NOT NULL,
  is_nonconcurrent BOOL NOT NULL,
  is_update_data BOOL NOT NULL,
  requests_recovery BOOL NOT NULL,
  job_data BYTEA NULL,
  PRIMARY KEY (sched_name, job_name, job_group)
);

CREATE TABLE qrtz_triggers (
  sched_name TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  job_name TEXT NOT NULL,
  job_group TEXT NOT NULL,
  description TEXT NULL,
  next_fire_time BIGINT NULL,
  prev_fire_time BIGINT NULL,
  priority INTEGER NULL,
  trigger_state TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NULL,
  calendar_name TEXT NULL,
  misfire_instr SMALLINT NULL,
  job_data BYTEA NULL,
  PRIMARY KEY (sched_name, trigger_name, trigger_group),
  FOREIGN KEY (sched_name, job_name, job_group)
    REFERENCES qrtz_job_details (sched_name, job_name, job_group)
);

CREATE TABLE qrtz_simple_triggers (
  sched_name TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  repeat_count BIGINT NOT NULL,
  repeat_interval BIGINT NOT NULL,
  times_triggered BIGINT NOT NULL,
  PRIMARY KEY (sched_name, trigger_name, trigger_group),
  FOREIGN KEY (sched_name, trigger_name, trigger_group)
    REFERENCES qrtz_triggers (sched_name, trigger_name, trigger_group)
    ON DELETE CASCADE
);

CREATE TABLE qrtz_simprop_triggers (
  sched_name TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  str_prop_1 TEXT NULL,
  str_prop_2 TEXT NULL,
  str_prop_3 TEXT NULL,
  int_prop_1 INTEGER NULL,
  int_prop_2 INTEGER NULL,
  long_prop_1 BIGINT NULL,
  long_prop_2 BIGINT NULL,
  dec_prop_1 NUMERIC NULL,
  dec_prop_2 NUMERIC NULL,
  bool_prop_1 BOOL NULL,
  bool_prop_2 BOOL NULL,
  time_zone_id TEXT NULL,
  PRIMARY KEY (sched_name, trigger_name, trigger_group),
  FOREIGN KEY (sched_name, trigger_name, trigger_group)
    REFERENCES qrtz_triggers (sched_name, trigger_name, trigger_group)
    ON DELETE CASCADE
);

CREATE TABLE qrtz_cron_triggers (
  sched_name TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  time_zone_id TEXT,
  PRIMARY KEY (sched_name, trigger_name, trigger_group),
  FOREIGN KEY (sched_name, trigger_name, trigger_group)
    REFERENCES qrtz_triggers (sched_name, trigger_name, trigger_group)
    ON DELETE CASCADE
);

CREATE TABLE qrtz_blob_triggers (
  sched_name TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  blob_data BYTEA NULL,
  PRIMARY KEY (sched_name, trigger_name, trigger_group),
  FOREIGN KEY (sched_name, trigger_name, trigger_group)
    REFERENCES qrtz_triggers (sched_name, trigger_name, trigger_group)
    ON DELETE CASCADE
);

CREATE TABLE qrtz_calendars (
  sched_name TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  calendar BYTEA NOT NULL,
  PRIMARY KEY (sched_name, calendar_name)
);

CREATE TABLE qrtz_paused_trigger_grps (
  sched_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  PRIMARY KEY (sched_name, trigger_group)
);

CREATE TABLE qrtz_fired_triggers (
  sched_name TEXT NOT NULL,
  entry_id TEXT NOT NULL,
  trigger_name TEXT NOT NULL,
  trigger_group TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  fired_time BIGINT NOT NULL,
  sched_time BIGINT NOT NULL,
  priority INTEGER NOT NULL,
  state TEXT NOT NULL,
  job_name TEXT NULL,
  job_group TEXT NULL,
  is_nonconcurrent BOOL NOT NULL,
  requests_recovery BOOL NULL,
  PRIMARY KEY (sched_name, entry_id)
);

CREATE TABLE qrtz_scheduler_state (
  sched_name TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  last_checkin_time BIGINT NOT NULL,
  checkin_interval BIGINT NOT NULL,
  PRIMARY KEY (sched_name, instance_name)
);

CREATE TABLE qrtz_locks (
  sched_name TEXT NOT NULL,
  lock_name TEXT NOT NULL,
  PRIMARY KEY (sched_name, lock_name)
);

CREATE INDEX idx_qrtz_j_req_recovery ON qrtz_job_details (requests_recovery);
CREATE INDEX idx_qrtz_t_next_fire_time ON qrtz_triggers (next_fire_time);
CREATE INDEX idx_qrtz_t_state ON qrtz_triggers (trigger_state);
CREATE INDEX idx_qrtz_t_nft_st ON qrtz_triggers (next_fire_time, trigger_state);
CREATE INDEX idx_qrtz_ft_trig_name ON qrtz_fired_triggers (trigger_name);
CREATE INDEX idx_qrtz_ft_trig_group ON qrtz_fired_triggers (trigger_group);
CREATE INDEX idx_qrtz_ft_trig_nm_gp ON qrtz_fired_triggers (sched_name, trigger_name, trigger_group);
CREATE INDEX idx_qrtz_ft_trig_inst_name ON qrtz_fired_triggers (instance_name);
CREATE INDEX idx_qrtz_ft_job_name ON qrtz_fired_triggers (job_name);
CREATE INDEX idx_qrtz_ft_job_group ON qrtz_fired_triggers (job_group);
CREATE INDEX idx_qrtz_ft_job_req_recovery ON qrtz_fired_triggers (requests_recovery);
```

Then run:

```bash
psql -h localhost -U postgres -d ordering_db -f schema-quartz-postgres.sql
```

**Option B: Direct psql command**

```bash
psql -h localhost -U postgres -d ordering_db << 'EOF'
-- Paste the SQL from above here
EOF
```

**Verify Quartz tables created**:

```bash
psql -h localhost -U postgres -d ordering_db -c "\dt qrtz*"
```

Expected output (list of Quartz tables):

```
qrtz_blob_triggers
qrtz_calendars
qrtz_cron_triggers
qrtz_fired_triggers
qrtz_job_details
qrtz_locks
qrtz_paused_trigger_grps
qrtz_scheduler_state
qrtz_simple_triggers
qrtz_simprop_triggers
qrtz_triggers
```

---

## 5) Start All Microservices

### 5.1 Option A: Using start-all.ps1 (Recommended for Windows)

```bash
./start-all.ps1
```

This script launches all services in separate terminal windows.

### 5.2 Option B: Manual Run (Cross-platform)

Open separate terminal windows and run each service:

**Terminal 1 – API Gateway**:

```bash
dotnet run --project src/Gateways/ShopOrbit.Gateway/ShopOrbit.Gateway.csproj
```

**Terminal 2 – Identity Service**:

```bash
dotnet run --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj
```

**Terminal 3 – Catalog Service**:

```bash
dotnet run --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj
```

**Terminal 4 – Ordering Service**:

```bash
dotnet run --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj
```

**Terminal 5 – Payment Service**:

```bash
dotnet run --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj
```

### 5.3 Option C: Build & Run with Docker (Production-like)

```bash
# Build all images
docker-compose build

# Run all services
docker-compose up
```

Wait for output like:

```
ShopOrbit.Gateway listening on http://localhost:5000
ShopOrbit.Identity listening on http://localhost:5051
ShopOrbit.Catalog listening on http://localhost:5052
ShopOrbit.Ordering listening on http://localhost:5053
ShopOrbit.Payments listening on http://localhost:5054 (or configured port)
```

---

## 6) Run Frontend (Optional)

In a new terminal:

```bash
cd ui
npm install
npm run dev
```

The UI will start on `http://localhost:3000`.

---

## 7) Test the System

### 7.1 Health Checks

Verify all services are running:

```bash
# API Gateway
curl -i http://localhost:5000/health

# Each service
curl -i http://localhost:5051/health
curl -i http://localhost:5052/health
curl -i http://localhost:5053/health
curl -i http://localhost:5054/health  # Payment (port may vary)
```

Expected response: `200 OK`

### 7.2 Register a User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@shoporbit.test",
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

Response (example):

```json
{
  "message": "Registration successful. Please confirm your email.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 7.3 Confirm Email (Bypass for Testing)

For testing, you can skip email confirmation by directly updating the DB:

```bash
psql -h localhost -U postgres -d identity_db -c \
  "UPDATE aspnetusers SET email_confirmed = true WHERE username = 'testuser';"
```

Or find the confirmation link in logs if email is configured.

### 7.4 Login & Get JWT

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "SecurePass123!"
  }'
```

Response (example):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@shoporbit.test",
    "roles": ["User"]
  }
}
```

**Save the token**:

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 7.5 Create a Product (Admin Only)

First, register/login as admin. For testing, directly insert a product or use an admin account:

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "iPhone 15 Pro",
    "price": 999.99,
    "stockQuantity": 100,
    "categoryId": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

Or insert directly into DB:

```bash
psql -h localhost -U postgres -d catalog_db -c \
  "INSERT INTO products (id, name, price, stock_quantity, category_id, created_at) \
   VALUES ('550e8400-e29b-41d4-a716-446655440002', 'iPhone 15 Pro', 999.99, 100, '550e8400-e29b-41d4-a716-446655440001', NOW());"
```

### 7.6 Get Products

```bash
curl -i http://localhost:5000/api/products \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `200 OK` with product list.

### 7.7 Add to Basket

```bash
curl -X POST http://localhost:5000/api/basket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440002",
        "quantity": 2,
        "price": 999.99
      }
    ]
  }'
```

### 7.8 Place an Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "shippingAddress": "123 Main St, Springfield, USA",
    "shippingCity": "Springfield",
    "shippingZip": "12345"
  }'
```

Response (example):

```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440003",
  "status": "Pending",
  "totalAmount": 1999.98,
  "createdAt": "2025-12-30T10:30:00Z"
}
```

### 7.9 Monitor Order Processing

Check order status:

```bash
curl http://localhost:5000/api/orders/550e8400-e29b-41d4-a716-446655440003 \
  -H "Authorization: Bearer $TOKEN"
```

Watch RabbitMQ queue for events:

- Open `http://localhost:15672` (Admin UI)
- Navigate to **Queues** → observe `OrderCreatedEvent` and `PaymentSucceededEvent` queues

### 7.10 Check Payment Status

```bash
psql -h localhost -U postgres -d payments_db -c \
  "SELECT id, order_id, status, created_at FROM payments LIMIT 5;"
```

---

## 8) Common Troubleshooting

### 8.1 Postgres Connection Failed

**Error**: `unable to connect to database server: could not translate host name "postgres" to address`

**Solution**:

```bash
# Restart Docker containers
docker-compose restart postgres

# Or check if container is running
docker-compose ps postgres
```

### 8.2 Migration Errors

**Error**: `The table 'Users' already exists`

**Solution**:

```bash
# Clean previous migrations (be careful in production!)
rm -rf src/Services/*/Migrations

# Recreate migrations
dotnet ef migrations add InitialCreate --project ...
```

### 8.3 JWT Authentication Fails

**Error**: `401 Unauthorized`

**Solution**:

- Ensure the token is not expired: `exp` claim in JWT
- Verify `JwtSettings__Secret` environment variable matches across services
- Check `Authorization` header format: `Bearer <token>`

### 8.4 RabbitMQ Not Responding

**Error**: `Failed to connect to RabbitMQ host`

**Solution**:

```bash
# Check RabbitMQ logs
docker-compose logs rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### 8.5 Redis Connection Issues

**Error**: `Timeout connecting to Redis`

**Solution**:

```bash
# Test Redis connection
redis-cli -h localhost ping

# Restart Redis
docker-compose restart redis
```

---

## 9) Performance Testing

### 9.1 Load Testing with k6

Create `test-load.js`:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  vus: 10,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<500"],
  },
};

export default function () {
  let res = http.get("http://localhost:5000/api/products");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

Run:

```bash
k6 run test-load.js
```

### 9.2 Check Redis Cache Hit Rate

```bash
redis-cli -h localhost
> INFO stats
```

Look for `keyspace_hits` and `keyspace_misses` to calculate hit rate.

---

## 10) Stop & Cleanup

### 10.1 Stop Services

Kill the terminal windows or press `Ctrl+C`.

### 10.2 Stop Infrastructure

```bash
# Stop containers (preserve data)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything (including volumes – data deleted)
docker-compose down -v
```

---

## 11) Quick Reference

| Task               | Command                                                                               |
| :----------------- | :------------------------------------------------------------------------------------ |
| Start infra        | `docker-compose up -d`                                                                |
| Check infra        | `docker-compose ps`                                                                   |
| View logs          | `docker-compose logs -f <service>`                                                    |
| Run migrations     | `dotnet ef database update --project ...`                                             |
| Start all services | `./start-all.ps1` or run manually                                                     |
| Register user      | `curl -X POST http://localhost:5000/api/v1/auth/register ...`                         |
| Login              | `curl -X POST http://localhost:5000/api/v1/auth/login ...`                            |
| Get products       | `curl http://localhost:5000/api/products -H "Authorization: Bearer $TOKEN"`           |
| Place order        | `curl -X POST http://localhost:5000/api/orders -H "Authorization: Bearer $TOKEN" ...` |

---

## 12) Related Docs

- Architecture: see `README.md`
- Events: see `docs/events.md`
- Caching: see `docs/caching-plan.md`
- Security: see `docs/security-spec.md`
- Consistency: see `docs/consistency.md`
