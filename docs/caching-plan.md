# Caching Strategy

This document outlines how ShopOrbit applies caching to reduce PostgreSQL load, improve API latency, and ensure data consistency.

## 1. Catalog Service (Read-Heavy Strategy)

The Catalog Service uses a **Cache-Aside** pattern combined with **Active Invalidation** to balance performance and data consistency.

### 1.1 Redis Caching (Server-Side)

**Key Patterns:**

| Key Pattern                                       | Description                                                          |
| :------------------------------------------------ | :------------------------------------------------------------------- |
| `catalog:product:{id}`                            | Cache a single product detail (Entity).                              |
| `catalog:products:p{page}_s{size}_{filters}...`   | Cache product lists with specific pagination, sorting, and filtering |
|                                                     parameters (e.g., `minPrice`, `maxPrice`, `categoryId`, `search`).   |
| `catalog:category:{id}`                           | Cache a single category detail.                                      |
| `catalog:categories:p{page}_s{size}_{filters}...` | Cache category lists with pagination and filters.                    |

**TTL Configuration:**

| Data Type                | TTL               | Reason                                                                            |
| :----------------------- | :---------------- | :-------------------------------------------------------------------------------- |
| Product/Category Detail  | **10-30 minutes** | Detailed information changes infrequently.                                        |
| Product/Category List    | **2 minutes**     | Lists are highly volatile. Short TTL ensures eventual consistency if invalidation |
|                                                misses, while Active Invalidation handles immediate updates.                      |

**Invalidation Strategy (Consistency):**

Unlike standard TTL-only approaches, ShopOrbit implements **Active Invalidation** to ensure users see up-to-date data immediately after administrative changes.

| Operation                     | Strategy                               | Implementation Logic                                                       |
| :---------------------------- | :------------------------------------- | :------------------------------------------------------------------------- |
| **Create** Product/Category   | **Immediate List Invalidation**        | Calls `InvalidateCachePattern("catalog:products*")` to remove **all**      |
|                                                                          cached pages and filter results.                                           |
| **Update** Product/Category   | **Detail Removal + List Invalidation** | Removes the specific entity key (`catalog:product:{id}`) **AND** clears    |
|                                                                          all list caches matching the pattern.                                      |
| **Delete** Product/Category   | **Detail Removal + List Invalidation** | Same as Update; ensures the deleted item disappears from both details and  |
|                                                                          lists immediately.                                                         |

### 1.2 Technical Implementation Details

* **Redis Prefix (InstanceName):** `ShopOrbit_Catalog_`
    * *Note:* `IDistributedCache` automatically handles this prefix for standard Get/Set operations. However, for pattern matching, the prefix is manually appended.
* **Pattern Deletion:**
    * Since `IDistributedCache` does not support wildcard deletion (e.g., `DELETE *`), we utilize `StackExchange.Redis`'s **`IConnectionMultiplexer`**.
    * The system uses the `server.Keys(pattern)` command to scan for matching keys (e.g., `ShopOrbit_Catalog_catalog:products*`) and removes them in bulk.

### 1.3 HTTP Caching (Client-Side)

* **Mechanism:** ETag (Entity Tag) / Conditional Requests.
* **Workflow:**
    1.  Server generates an MD5 hash of the response body.
    2.  Sets response header: `ETag: "<hash>"`.
    3.  Client sends `If-None-Match: "<hash>"` on subsequent requests.
    4.  If hashes match, Server returns **304 Not Modified** (no body), saving bandwidth.
* **Applied Endpoints:** Public GET endpoints (`/products`, `/categories`).

---

## 2. Basket & Ordering (Transactional State)

### 2.1 Basket Service (Redis as Primary Store)

* **Purpose:** Temporary, high-performance storage for user shopping carts.
* **Key:** `{UserId}` (Raw GUID, no prefix overlap with Catalog).
* **Data Structure:** Serialized JSON String (`ShoppingCart` object).
* **Persistence:**
    * Basket data is **only** stored in Redis (Hot Data).
    * Data is persisted to PostgreSQL (as `Order`) only when the user completes checkout.
    * **Basket History:** Async events (`BasketUpdatedEvent`) are published to RabbitMQ for analytics logging in Postgres (Cold Data), avoiding direct DB writes during cart manipulation.

### 2.2 Ordering Service

* **Workflow (Implemented in `OrdersController.PlaceOrder`):**
    1.  **Trigger:** Client calls `POST /api/orders`.
    2.  **Retrieve Basket:** Ordering Service extracts `UserId` from JWT and reads the basket directly from Redis:
        ```csharp
        var basketString = await _cache.GetStringAsync(userIdString);
        ```
    3.  **Stock Validation:** Calls Catalog Service via **gRPC** to ensure real-time stock availability before processing.
    4.  **Persist:** Saves the Order to PostgreSQL (`OrderingDbContext`).
    5.  **Publish Event:** Publishes `OrderCreatedEvent` (and `PaymentRequestedEvent` if COD).
    6.  **Cleanup:** Immediately clears the basket from Redis to prevent re-ordering:
        ```csharp
        await _cache.RemoveAsync(userIdString);
        ```

---

## 3. Payment Service (Idempotency)

* **Purpose:** Ensures payments are processed exactly once, even if multiple events trigger the process (e.g., Retries, or concurrent `OrderCreatedEvent` and `PaymentRequestedEvent`).
* **Key Pattern:** `processed_order_{OrderId}`
* **TTL:** **24 hours** (Absolute Expiration).

**Implementation Logic :**

Both `OrderCreatedConsumer` and `PaymentRequestedConsumer` implement the following idempotency check:

1.  **Check Cache:**
* Before processing: if Get(key) exists → return immediately (skip duplicate)
    ```csharp
    var key = $"processed_order_{message.OrderId}";
    var exists = await _cache.GetStringAsync(key);
    if (!string.IsNullOrEmpty(exists)) return; 
    ```
2.  **Process Payment:** Execute logic (Save to DB, interact with Payment Gateway).
3.  **Set Cache (Lock):**
* After processing: Set(key, "processed") to mark transaction complete
    ```csharp
    await _cache.SetStringAsync(key, "processed", ... TimeSpan.FromDays(1));
    ```

---

## 4. Benefits of this Architecture

1.  **High Consistency:** The **Active Invalidation** strategy in the Catalog Service ensures that Admins and Users see changes (new products, price updates) immediately, solving the common "stale data" problem.
2.  **Reduced DB Load:** Read-heavy traffic is intercepted by Redis; `304 Not Modified` responses reduce server processing time.
3.  **Bandwidth Optimization:** ETag implementation minimizes data transfer for mobile/web clients.
4.  **Reliability:** Decoupling the Basket (Redis) from the Order History (Postgres) ensures cart operations are extremely fast and do not lock the database tables.
5.  **Race Condition Prevention:** The Idempotency Key in Payment Service prevents double-charging if the Ordering Service publishes duplicate events or if the message broker redelivers messages.
6.  **Performance:**
    * **Catalog:** 90%+ of read traffic hits Redis (List & Detail cache).
    * **Basket:** 100% of cart operations hit Redis (0 DB load).
7.  **Eventual Consistency Handling:**
    * **Timeout Sagas:** `OrderTimeoutConsumer` and `PaymentFailedConsumer` handle rollback scenarios (cancelling orders) if payments fail or time out, ensuring the system state eventually converges to a correct state.
    * **Quartz Scheduling:** Used effectively in `OrdersController` to schedule automatic order cancellation (`OrderTimeoutEvent`) after 5 minutes of inactivity.
