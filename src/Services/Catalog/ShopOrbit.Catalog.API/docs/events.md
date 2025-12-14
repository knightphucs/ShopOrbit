# Event Messaging Specification – Catalog Service

## 1. Overview

> The Catalog Service publishes domain events whenever important data changes occur.
> These events enable other microservices to stay synchronized in a loosely coupled manner.

Message Broker : **RabbitMQ**  
Pattern: **Publish / Subscribe**

---

## 2. Exchange Design

| Exchange Name               | Type   | Description                              |
| --------------------------- | ------ | ---------------------------------------- |
| `catalog.product.exchange`  | fanout | Publishes events when a Product changes  |
| `catalog.category.exchange` | fanout | Publishes events when a Category changes |


---

## 3. Event Contracts

### 3.1 ProductCreatedEvent

```json
{
  "ProductId": "guid-xxx",
  "Name": "iPhone 15 Pro",
  "Price": 999.0,
  "CategoryId": "guid-yyy",
  "OccurredAt": "2025-12-01T10:00:00Z"
}
```

### 3.2 ProductUpdatedEvent

```json
{
  "ProductId": "guid-xxx",
  "UpdatedFields": ["Price", "StockQuantity"],
  "OccurredAt": "2025-12-01T10:05:00Z"
}
```

### 3.2 ProductDeletedEvent

```json
{
  "ProductId": "guid-xxx",
  "OccurredAt": "2025-12-01T10:10:00Z"
}
```

### 4. Potential Consumers

| Service                 | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| Ordering Service        | Store product price snapshot during user checkout    |
| Search Service (future) | Re-index product data in Elasticsearch               |
| Notification Service    | Notify administrators when products are out of stock |


### 5. Retry Strategy
The Catalog Service uses MassTransit retry policies to handle transient failures.

```yaml
Retry: 3 lần
Delay intervals: 2s → 5s → 10s
Backoff: Incremental
```
> If all retry attempts fail, the message is moved to a Dead Letter Queue (DLQ) for later inspection.

### 6. Summary

- Events are published only when Product or Category data changes

- Messages use JSON format

- Fanout exchanges are used for loose coupling

- Retry policies and DLQ are configured for reliability