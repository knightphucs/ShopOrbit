using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Payments.API.Data;
using ShopOrbit.Payments.API.Models;

namespace ShopOrbit.Payments.API.Consumers;

public class PaymentRequestedConsumer : IConsumer<PaymentRequestedEvent>
{
    private readonly PaymentDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PaymentRequestedConsumer> _logger;
    private readonly IDistributedCache _cache;
    private static readonly Random _random = new();

    public PaymentRequestedConsumer(
        PaymentDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<PaymentRequestedConsumer> logger,
        IDistributedCache cache)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _cache = cache;
    }

    public async Task Consume(ConsumeContext<PaymentRequestedEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "[Payment Service] Payment requested for Order {OrderId} - Amount: {Amount}",
            message.OrderId,
            message.Amount
        );

        var key = $"processed_order_{message.OrderId}";
        if (!string.IsNullOrEmpty(await _cache.GetStringAsync(key)))
        {
            _logger.LogInformation(
                "Order {OrderId} already processed. Skipping.",
                message.OrderId
            );
            return;
        }

        bool isSuccess = _random.Next(1, 10) > 2;

        var payment = new Payment
        {
            OrderId = message.OrderId,
            UserId = message.UserId,
            Amount = message.Amount,
            Currency = message.Currency,
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
            await context.Publish(new PaymentSucceededEvent
            {
                OrderId = message.OrderId,
                PaymentId = payment.Id,
                ProcessedAt = DateTime.UtcNow
            });
        }
        else
        {
            await context.Publish(new PaymentFailedEvent
            {
                OrderId = message.OrderId,
                Reason = payment.FailureReason!
            });
        }

        await _cache.SetStringAsync(
            key,
            "processed",
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
            });

        _logger.LogInformation(
            "[Payment Service] Processed Payment {PaymentId}",
            payment.Id
        );
    }
}
