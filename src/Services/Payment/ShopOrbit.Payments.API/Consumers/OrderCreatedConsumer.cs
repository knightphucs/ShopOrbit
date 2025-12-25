using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Payments.API.Data;
using ShopOrbit.Payments.API.Models;

namespace ShopOrbit.Payments.API.Consumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly PaymentDbContext _dbContext;
    private readonly ILogger<OrderCreatedConsumer> _logger;
    private readonly IDistributedCache _cache;
    private static readonly Random _random = new();

    public OrderCreatedConsumer(PaymentDbContext dbContext, ILogger<OrderCreatedConsumer> logger, IDistributedCache cache)
    {
        _dbContext = dbContext;
        _logger = logger;
        _cache = cache;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Payment Service] Received Order: {message.OrderId} - Amount: {message.TotalAmount}");

        // Idempotency Check
        var key = $"processed_order_{message.OrderId}";
        var exists = await _cache.GetStringAsync(key);

        if (!string.IsNullOrEmpty(exists))
        {
            _logger.LogInformation($"Order {message.OrderId} has already been processed. Skipping duplicate.");
            return;
        }

        bool isSuccess = _random.Next(1, 10) > 2;

        var payment = new Payment
        {
            OrderId = message.OrderId,
            UserId = message.UserId,
            Amount = message.TotalAmount,
            Currency = "VND",
            PaymentMethod = message.PaymentMethod,
            TransactionType = "Sale",
            Status = isSuccess ? "Success" : "Failed",
            CreatedAt = DateTime.UtcNow,
            PaymentDate = isSuccess ? DateTime.UtcNow : null,
            FailureReason = isSuccess ? null : "Simulated Failure"
        };

        _dbContext.Payments.Add(payment);

        if (isSuccess)
        {
            _logger.LogInformation($"[Payment Service] Payment Success: {payment.Id}");
            await context.Publish(new PaymentSucceededEvent
            {
                OrderId = message.OrderId,
                PaymentId = payment.Id,
                ProcessedAt = DateTime.UtcNow
            });
        }
        else
        {
            _logger.LogWarning($"[Payment Service] Payment Failed: {payment.Id}");
            await context.Publish(new PaymentFailedEvent
            {
                OrderId = message.OrderId,
                Reason = payment.FailureReason ?? "Payment processing failed."
            });
        }

        await _cache.SetStringAsync(key, "processed", new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
        });
        
        _logger.LogInformation($"[Payment Service] Processed Payment: {payment.Id}");
    }
}