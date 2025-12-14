# Caching Strategy Plan – Catalog Service

## 1. Overview

The Catalog Service is a read-heavy service.
Therefore, caching is applied to reduce PostgreSQL load, improve API response time, and save network bandwidth.

The system uses two caching mechanisms:

- **Redis Caching (Server-side)**
- **HTTP Caching (Client-side) using ETag**

---

## 2. Redis Caching Strategy

Redis is used to cache product and category data.

### 2.1 Cache Key Design

| Cache Key Pattern                               | Description                              |
| ----------------------------------------------- | ---------------------------------------- |
| `catalog:product:{id}`                          | Cache a single product detail            |
| `catalog:products:p{page}_s{size}_filters...`   | Cache product list with paging & filters |
| `catalog:category:{id}`                         | Cache a single category detail           |
| `catalog:categories:p{page}_s{size}_filters...` | Cache category list with paging          |


### 2.2 TTL (Time to Live)

| Data Type             | TTL        |
| --------------------- | ---------- |
| Product Detail        | 30 minutes |
| Product List (paging) | 2 minutes  |
| Category List         | 2 minutes  |

> Product list cache uses a short TTL because product data can be frequently modified by administrators (CRUD operations).

---

## 3. Cache Invalidation

| Operation       | Invalidation Strategy                                                               |
| --------------- | ----------------------------------------------------------------------------------- |
| Create Product  | Product list cache is not immediately removed. It expires naturally based on TTL.   |
| Update Product  | Remove product detail cache (`catalog:product:{id}`); list cache updates via TTL.   |
| Delete Product  | Remove product detail cache (`catalog:product:{id}`); list cache updates via TTL.   |
| Update Category | Remove category detail cache (`catalog:category:{id}`); list cache updates via TTL. |
| Delete Category | Remove category detail cache; list cache updates via TTL.                           |


> List caches use short TTL and are not fully invalidated on write operations.
> This approach follows the eventual consistency model, which is common in microservices architectures.
> It reduces cache invalidation overhead and avoids wildcard cache deletion.
---

## 4. HTTP Caching (ETag)

HTTP caching is applied on the client/browser side.

### 4.1 How It Works

1. The server generates an ETag using an MD5 hash of the response content.

2. The client stores the ETag.

3. Subsequent requests include the If-None-Match header.

4. The server compares ETags:
   - Match → **304 Not Modified** (response body is not returned)
   - Not match → return updated data

### 4.2 HTTP Headers Used
Cache-Control: public, max-age=60
ETag: "<hash>"

### 4.3 Applied Endpoints

- GET /products  
- GET /products/{id}  
- GET /categories  

---

## 5. Summary

The caching strategy provides the following benefits:

- Reduced database load

- Lower API latency

- Reduced network bandwidth usage

- Improved system scalability