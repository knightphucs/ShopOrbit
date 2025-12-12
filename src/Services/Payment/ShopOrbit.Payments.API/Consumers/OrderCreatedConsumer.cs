using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Payments.API.Data;
using ShopOrbit.Payments.API.Models;

namespace ShopOrbit.Payments.API.Consumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly PaymentDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrderCreatedConsumer> _logger;
    private readonly IDistributedCache _cache;

    public OrderCreatedConsumer(PaymentDbContext dbContext, IPublishEndpoint publishEndpoint, ILogger<OrderCreatedConsumer> logger, IDistributedCache cache)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _cache = cache;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Payment Service] Received Order: {message.OrderId} - Amount: {message.TotalAmount}");

        var key = $"processed_order_{message.OrderId}";
        var exists = await _cache.GetStringAsync(key);

        if (!string.IsNullOrEmpty(exists))
        {
            _logger.LogInformation($"Order {message.OrderId} đã được xử lý trước đó. Bỏ qua.");
            return;
        }

        var payment = new Payment
        {
            OrderId = message.OrderId,
            UserId = message.UserId,
            Amount = message.TotalAmount,
            Status = "Success"
        };

        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();

        await _cache.SetStringAsync(key, "processed", new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
        });
        
        _logger.LogInformation($"[Payment Service] Processed Payment: {payment.Id}");

        await _publishEndpoint.Publish(new PaymentSucceededEvent
        {
            OrderId = message.OrderId,
            PaymentId = payment.Id,
            ProcessedAt = DateTime.UtcNow
        });
    }
}