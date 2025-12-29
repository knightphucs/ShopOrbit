# Data Consistency & Reliability Patterns

This document describes the mechanisms ShopOrbit uses to ensure data consistency across microservices in an event-driven architecture: the Outbox Pattern, Saga choreography, and Retry strategies.

## 1) Outbox Pattern

### 1.1 Purpose

The Outbox Pattern solves the dual-write problem: ensuring that a local database transaction and an event publish to a message broker are atomic (all-or-nothing).

**Without Outbox**: Service writes to DB → publishes event. If the publish fails, the DB change exists but the event never reaches RabbitMQ. Consumers are out of sync.

**With Outbox**: Service writes to DB _and_ an Outbox table in a single transaction. A separate background worker polls the Outbox, publishes events, and marks them as sent.

### 1.2 Outbox Schema

Typical Outbox table in PostgreSQL:

```sql
CREATE TABLE Outbox (
    Id UUID PRIMARY KEY,
    EventType VARCHAR(255) NOT NULL,
    EventData JSON NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PublishedAt TIMESTAMP NULL,
    RetryCount INT DEFAULT 0,
    MaxRetries INT DEFAULT 3
);

CREATE INDEX idx_outbox_published_at ON Outbox (PublishedAt)
    WHERE PublishedAt IS NULL;
```

**Columns**:

- `Id`: unique event identifier
- `EventType`: fully qualified event class name (e.g., `ShopOrbit.BuildingBlocks.Contracts.OrderCreatedEvent`)
- `EventData`: serialized event payload (JSON)
- `CreatedAt`: insertion timestamp
- `PublishedAt`: null until the event is published to RabbitMQ
- `RetryCount`: increments on each failed publish attempt
- `MaxRetries`: max attempts before marking as dead-letter

### 1.3 Publishing Flow

```
1. Service receives HTTP request
   ↓
2. Open database transaction
   ↓
3. Insert/update domain entity
   ↓
4. Insert into Outbox table (same transaction)
   ↓
5. Commit transaction (atomic)
   ↓
6. Background worker polls Outbox (PublishedAt IS NULL)
   ↓
7. Publish to RabbitMQ
   ↓
8. On success: UPDATE Outbox SET PublishedAt = NOW()
   ↓
9. On failure: increment RetryCount, retry after delay
```

### 1.4 Implementation in ShopOrbit

In the Ordering Service (`OrdersController`):

```csharp
// Inside a transaction
using (var transaction = await _context.Database.BeginTransactionAsync())
{
    // Create order entity
    var order = new Order { OrderId = orderId, UserId = userId, ... };
    _context.Orders.Add(order);

    // Create outbox event (same transaction)
    var outboxEvent = new OutboxEvent
    {
        Id = Guid.NewGuid(),
        EventType = typeof(OrderCreatedEvent).FullName,
        EventData = JsonConvert.SerializeObject(new OrderCreatedEvent
        {
            OrderId = orderId,
            UserId = userId,
            TotalAmount = totalAmount,
            CreatedAt = DateTime.UtcNow
        }),
        CreatedAt = DateTime.UtcNow
    };
    _context.OutboxEvents.Add(outboxEvent);

    await _context.SaveChangesAsync();
    await transaction.CommitAsync();
}

// Background worker (separate process)
var unsentEvents = await _context.OutboxEvents
    .Where(e => e.PublishedAt == null && e.RetryCount < e.MaxRetries)
    .ToListAsync();

foreach (var outboxEvent in unsentEvents)
{
    try
    {
        var eventData = JsonConvert.DeserializeObject(outboxEvent.EventData);
        await _publishEndpoint.Publish(eventData);

        outboxEvent.PublishedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }
    catch (Exception ex)
    {
        outboxEvent.RetryCount++;
        if (outboxEvent.RetryCount >= outboxEvent.MaxRetries)
        {
            // Log to DLQ or alert
        }
        await _context.SaveChangesAsync();
    }
}
```

### 1.5 Monitoring & Cleanup

- **Stuck Events**: Query `WHERE PublishedAt IS NULL AND CreatedAt < NOW() - INTERVAL '1 hour'`
- **DLQ**: Move events with `RetryCount >= MaxRetries` to a separate `OutboxDLQ` table
- **Cleanup**: Archive or delete successfully published events older than 30 days

---

## 2) Saga Pattern (Choreography)

### 2.1 Saga Overview

A Saga is a distributed transaction that spans multiple services, orchestrated via asynchronous events. ShopOrbit uses **Choreography** (event-driven), not Orchestration (centralized state machine).

**Flow**: Service A emits Event X → Service B consumes it and emits Event Y → Service C consumes Event Y, etc.

### 2.2 Order Processing Saga

```
┌─────────────────────────────────────────────────────────────────────┐
│                       ORDER PROCESSING SAGA                          │
└─────────────────────────────────────────────────────────────────────┘

Step 1: User submits order via API Gateway
         │
         ▼
    ┌────────────────────┐
    │ Ordering Service   │ POST /api/orders (UserId from JWT)
    │ ─────────────────  │ • Create Order (Pending status)
    │ • Read basket      │ • Emit OrderCreatedEvent
    │ • Reserve stock    │ • Update Outbox
    │ • Clear basket     │ • Return OrderId
    └────────────────────┘
         │
         │ OrderCreatedEvent
         │ (OrderId, UserId, TotalAmount)
         │
         ▼
    ┌────────────────────┐
    │ Payment Service    │ Consume OrderCreatedEvent
    │ ─────────────────  │ • Create Payment record (Processing)
    │ • Process payment  │ • Call payment gateway
    │ • Emit success/fail│ • Emit PaymentSucceededEvent
    └────────────────────┘
         │
         ├──► PaymentSucceededEvent
         │    (OrderId, PaymentId, ProcessedAt)
         │
         │    PaymentFailedEvent (on failure)
         │    (OrderId, Reason, OccurredAt)
         │
         ▼
    ┌────────────────────┐
    │ Ordering Service   │ Consume PaymentSucceededEvent
    │ ─────────────────  │ • Update Order (Completed)
    │ • Finalize order   │ • Emit OrderConfirmedEvent
    │ • Notify customer  │ • Send confirmation email (optional)
    │ • Update Outbox    │
    └────────────────────┘
         │
         │ OrderConfirmedEvent
         │
         ▼
    ┌────────────────────┐
    │ Notification Svc   │ (optional)
    │ ─────────────────  │ • Send order confirmation email
    │ • Email confirm    │ • SMS notification
    └────────────────────┘


On Payment Failure:
    PaymentFailedEvent
         │
         ▼
    ┌────────────────────┐
    │ Ordering Service   │ Consume PaymentFailedEvent
    │ ─────────────────  │ • Update Order (Cancelled)
    │ • Cancel order     │ • Restore stock
    │ • Revert changes   │ • Notify customer
    │ • Update Outbox    │
    └────────────────────┘
```

### 2.3 State Transitions

**Order State Machine**:

```
[Pending] --payment_succeeded--> [Completed]
   ↑                                  │
   │                                  └──> [Shipped] --confirmed--> [Delivered]
   │
   └──payment_failed--> [Cancelled]
```

**Payment State Machine**:

```
[Processing] --succeeded--> [Success]
    ↑                            │
    │                            └──> [Confirmed]
    │
    └──failed--> [Failed]
```

### 2.4 Compensating Transactions

If a step fails, compensate by reversing changes:

**Example**: If PaymentFailedEvent arrives:

1. Ordering Service receives event
2. Retrieves order by OrderId
3. Updates order status to Cancelled
4. If stock was reserved, releases it (compensating transaction)
5. Emits OrderCancelledEvent for downstream consumers

```csharp
public class PaymentFailedConsumer : IConsumer<PaymentFailedEvent>
{
    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        var paymentFailedEvent = context.Message;

        var order = await _context.Orders.FirstOrDefaultAsync(
            o => o.OrderId == paymentFailedEvent.OrderId);

        if (order == null) return;

        // Compensating transaction: cancel order
        order.Status = OrderStatus.Cancelled;
        order.CancelledAt = DateTime.UtcNow;

        // Release reserved stock (if implemented)
        foreach (var item in order.OrderItems)
        {
            // Publish StockReleasedEvent or call Catalog API
            await _publishEndpoint.Publish(new StockReleasedEvent
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity
            });
        }

        // Outbox for OrderCancelledEvent
        var outboxEvent = new OutboxEvent { ... };
        _context.OutboxEvents.Add(outboxEvent);

        await _context.SaveChangesAsync();
    }
}
```

---

## 3) Retry Logic & Exponential Backoff

### 3.1 MassTransit Retry Configuration

ShopOrbit configures retries in `Program.cs`:

```csharp
var busControl = Bus.Factory.CreateUsingRabbitMq(cfg =>
{
    cfg.Host("shoporbit-rabbitmq", h => { });

    cfg.ReceiveEndpoint("order-processing", e =>
    {
        // Incremental backoff: 2s → 5s → 10s
        e.UseMessageRetry(r =>
            r.Incremental(
                retryLimit: 3,
                initialInterval: TimeSpan.FromSeconds(2),
                intervalIncrement: TimeSpan.FromSeconds(3)
            )
        );

        // Consumers
        e.Consumer<OrderCreatedConsumer>();
        e.Consumer<PaymentSucceededConsumer>();
    });

    // Dead Letter Queue setup
    cfg.ReceiveEndpoint("order-processing_error", e =>
    {
        e.Handler<InvoiceCreatedEvent>(async context =>
        {
            // Handle poisoned messages
            await context.NotifySuspendedFault();
        });
    });
});
```

### 3.2 Retry Scenarios

| Scenario                                            | Behavior                                               | Next Action                                            |
| :-------------------------------------------------- | :----------------------------------------------------- | :----------------------------------------------------- |
| **Transient Failure** (network timeout, DB busy)    | Retry after 2s, then 5s, then 10s                      | On success: process continues; on failure: move to DLQ |
| **Poison Message** (malformed JSON, invalid schema) | Fails immediately on first attempt                     | Moves to Dead Letter Queue; manual inspection needed   |
| **Service Unavailable**                             | Each retry uses backoff delay                          | If all retries exhausted → DLQ                         |
| **Idempotency Key Exists**                          | Consumer detects duplicate (via Redis key or DB check) | Skips processing, returns success                      |

### 3.3 Consumer Idempotency

Prevent duplicate processing with an idempotency check:

```csharp
public class PaymentSucceededConsumer : IConsumer<PaymentSucceededEvent>
{
    private readonly IDistributedCache _cache;
    private readonly ShopOrbitContext _context;

    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var paymentEvent = context.Message;
        var idempotencyKey = $"payment_succeeded_{paymentEvent.PaymentId}";

        // Check if already processed
        var cached = await _cache.GetAsync(idempotencyKey);
        if (cached != null)
        {
            // Already processed; skip
            return;
        }

        try
        {
            // Update order
            var order = await _context.Orders.FirstOrDefaultAsync(
                o => o.OrderId == paymentEvent.OrderId);
            if (order == null) return;

            order.Status = OrderStatus.Completed;
            order.PaymentId = paymentEvent.PaymentId;

            // Mark in Outbox
            var outboxEvent = new OutboxEvent { ... };
            _context.OutboxEvents.Add(outboxEvent);
            await _context.SaveChangesAsync();

            // Set idempotency cache (24h TTL)
            await _cache.SetAsync(
                idempotencyKey,
                BitConverter.GetBytes(1),
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
                });
        }
        catch (Exception ex)
        {
            // Log and rethrow; let MassTransit retry
            _logger.LogError(ex, "Failed to process PaymentSucceededEvent");
            throw;
        }
    }
}
```

### 3.4 Dead Letter Queue Handling

Once retries are exhausted, the message moves to the DLQ for inspection:

```csharp
// Configure DLQ endpoint
cfg.ReceiveEndpoint("order-processing_error", e =>
{
    e.Handler<ProcessingFaultEvent>(async context =>
    {
        _logger.LogCritical(
            "Message moved to DLQ: {MessageId}. Exception: {Exception}",
            context.Message.CorrelationId,
            context.Message.Exceptions);

        // Option 1: Store in error table for manual review
        var deadLetterEntry = new DeadLetterEvent
        {
            MessageId = context.Message.CorrelationId,
            MessageBody = context.Message.Message,
            ExceptionMessage = string.Join(", ", context.Message.Exceptions),
            ReceivedAt = DateTime.UtcNow
        };
        _context.DeadLetterEvents.Add(deadLetterEntry);
        await _context.SaveChangesAsync();

        // Option 2: Alert ops team
        await _alertingService.SendAlert(
            "Critical: Message in DLQ",
            $"OrderId: {context.Message.CorrelationId}"
        );
    });
});
```

### 3.5 Observability

Monitor retry behavior with structured logging and metrics:

```csharp
// Log retry attempts
public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var retryCount = context.GetRetryAttempt();
        _logger.LogInformation(
            "Processing OrderCreatedEvent (Retry {RetryCount}/3): OrderId={OrderId}",
            retryCount, context.Message.OrderId);

        // Processing logic...
    }
}
```

---

## 4) Best Practices Summary

| Practice                      | Benefit                                  |
| :---------------------------- | :--------------------------------------- |
| **Outbox Pattern**            | Atomic writes; guaranteed event delivery |
| **Idempotent Consumers**      | Safe retry without side effects          |
| **Exponential Backoff**       | Gracefully handle transient failures     |
| **Dead Letter Queue**         | Capture poisoned messages for inspection |
| **Compensating Transactions** | Rollback across services on failure      |
| **Structured Logging**        | Trace saga execution for debugging       |
| **Monitoring & Alerts**       | Proactive detection of DLQ messages      |

---

## 5) Related Docs

- Events: see `docs/events.md`
- Caching: see `docs/caching-plan.md`
- Runbook: see `docs/runbook.md`
