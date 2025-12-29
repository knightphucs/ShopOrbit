# Caching Strategy

This document outlines how ShopOrbit applies caching to reduce PostgreSQL load, improve API latency, and optimize bandwidth.

## 1) Catalog Service (Read‑heavy)

### 1.1 Redis Caching (Server‑Side)

Key patterns:

| Key Pattern                                     | Description                              |
| :---------------------------------------------- | :--------------------------------------- |
| `catalog:product:{id}`                          | Cache a single product detail            |
| `catalog:products:p{page}_s{size}_filters...`   | Cache product list with paging & filters |
| `catalog:category:{id}`                         | Cache a single category detail           |
| `catalog:categories:p{page}_s{size}_filters...` | Cache category list with paging          |

TTL:

| Data Type               | TTL        | Reason                                                                   |
| :---------------------- | :--------- | :----------------------------------------------------------------------- |
| Product/Category Detail | 30 minutes | Data changes infrequently                                                |
| Product/Category List   | 2 minutes  | Lists are often affected by CRUD; short TTL ensures eventual consistency |

Invalidation strategy:

| Operation               | Logic                                                               |
| :---------------------- | :------------------------------------------------------------------ |
| Create Product/Category | Do not remove list cache immediately; let it expire naturally (TTL) |
| Update Product/Category | Remove detail cache (`catalog:product:{id}`); list updates via TTL  |
| Delete Product/Category | Remove detail cache; list updates via TTL                           |

### 1.2 HTTP Caching (Client‑Side)

- Mechanism: ETag (Entity Tag)
  1. Server generates a content hash (e.g., MD5)
  2. Client stores the ETag and sends `If-None-Match` on subsequent requests
  3. If matched → return `304 Not Modified` (no body)
- Configuration: `Cache-Control: public, max-age=60`, `ETag: "<hash>"`
- Applied endpoints: `GET /products`, `GET /products/{id}`, `GET /categories`

## 2) Basket & Ordering (Transactional State)

### 2.1 Basket Service (Redis as primary store)

- Purpose: temporary storage for user shopping cart (stateful)
- Key: `{UserId}` (raw GUID) – the `InstanceName` prefix is removed so Ordering can read directly
- Data structure: JSON string (serialized `ShoppingCart`)
- TTL: persist (no automatic expiration; cleared after a successful order)
- Logic: overwrite entire value on write; read JSON for client responses

### 2.2 Ordering Service (Redis reader)

- Purpose: read basket to create secure orders
- Flow:
  1. Trigger: `POST /api/orders`
  2. Extract `UserId` from JWT → read Redis key `{UserId}`
  3. After persisting to PostgreSQL (`SaveChanges`) → call `RemoveAsync(userId)` to clear the basket

## 3) Payment Service (Idempotency)

- Key: `processed_order_{OrderId}`
- TTL: 24 hours
- Logic:
  - Before processing: if `Get(key)` exists → return immediately (skip duplicate)
  - After processing: `Set(key, "processed")` to mark transaction complete

## 4) Benefits

- Reduced DB load: intercept read‑heavy operations with Redis
- Bandwidth efficiency: `304 Not Modified` avoids sending redundant bodies
- Consistency balance: immediate (Basket) vs. eventual (Catalog lists)
- Reliability: Payment idempotency prevents double‑charging
