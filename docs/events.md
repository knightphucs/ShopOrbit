# Event Messaging Specification

This document describes the event communication across ShopOrbit microservices using RabbitMQ and MassTransit to ensure reliability, scalability, and loose coupling.

## 1) Message Broker

- Technology: RabbitMQ
- Exchange: Fanout or Topic (per flow)
- Queue: durable, auto‑delete = false
- Routing key: event‑based (e.g., `catalog.product.created`, `ordering.order.created`)

## 2) Event Contracts

Domain events are published when significant changes occur.

### 2.1 Catalog Service

Publishes events for product CRUD operations.

ProductCreatedEvent

```json
{
  "ProductId": "guid-xxx",
  "Name": "iPhone 15 Pro",
  "Price": 999.0,
  "CategoryId": "guid-yyy",
  "OccurredAt": "2025-12-01T10:00:00Z"
}
```

ProductUpdatedEvent

```json
{
  "ProductId": "guid-xxx",
  "UpdatedFields": ["Price", "StockQuantity"],
  "OccurredAt": "2025-12-01T10:05:00Z"
}
```

ProductDeletedEvent

```json
{
  "ProductId": "guid-xxx",
  "OccurredAt": "2025-12-01T10:10:00Z"
}
```

Potential consumers:

| Service                 | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| Ordering Service        | Persist product price snapshot during checkout |
| Search Service (future) | Re‑index product data in Elasticsearch         |
| Notification Service    | Alert admins when products are out of stock    |

### 2.2 Ordering Service

OrderCreatedEvent (when an order is created successfully):

```json
{
  "OrderId": "guid-xxx",
  "UserId": "guid-yyy",
  "TotalAmount": 150.0,
  "CreatedAt": "2025-12-01T10:00:00Z"
}
```

### 2.3 Payment Service

PaymentSucceededEvent (when payment is processed successfully):

```json
{
  "OrderId": "guid-xxx",
  "PaymentId": "guid-zzz",
  "ProcessedAt": "2025-12-01T10:15:00Z"
}
```

PaymentFailedEvent (optional):

```json
{
  "OrderId": "guid-xxx",
  "Reason": "Insufficient funds",
  "OccurredAt": "2025-12-01T10:15:30Z"
}
```

## 3) Retry Policy & DLQ

- Retries: 3 attempts with incremental backoff (2s → 5s → 10s)
- On failure: move message to the Dead Letter Queue (DLQ) for inspection/recovery

Example MassTransit configuration in `Program.cs`:

```csharp
cfg.UseMessageRetry(r => r.Incremental(3, TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(3)));
cfg.Publish<PaymentSucceededEvent>(x =>
{
    x.Durable = true;
});
```

## 4) Saga Choreography (Event Flows)

### Flow 1: Order Created → Payment

- Trigger: Client calls `POST /api/orders` (Pending status)
- Publisher: Ordering Service
- Consumer: Payment Service (`OrderCreatedConsumer`)
- Result: create payment transaction in DB (Payments)

### Flow 2: Payment Succeeded → Finalize Order

- Event: `PaymentSucceededEvent`
- Publisher: Payment Service
- Consumer: Ordering Service (`PaymentSucceededConsumer`)
- Result: update order status to Completed, optionally notify/email

### Flow 3 (optional): Payment Failed → Cancel Order

- Event: `PaymentFailedEvent`
- Consumer: Ordering Service
- Result: mark order as Cancelled, restore stock if applicable

## 5) Naming & Observability

- Exchange/Queue: domain prefixes (`catalog.*`, `ordering.*`, `payment.*`)
- Routing key: event types (`*.created`, `*.updated`, `*.deleted`, `*.succeeded`, `*.failed`)
- Observability: enable consumer metrics/logs; monitor DLQ; trace with `CorrelationId`

## 6) References

- Shared event contracts: `src/BuildingBlocks/ShopOrbit.BuildingBlocks/Contracts/*`
- RabbitMQ host: environment var `RabbitMQ__Host` (e.g., `shoporbit-rabbitmq`)
