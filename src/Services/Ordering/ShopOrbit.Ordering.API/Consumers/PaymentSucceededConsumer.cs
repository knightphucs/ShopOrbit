using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class PaymentSucceededConsumer : IConsumer<PaymentSucceededEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<PaymentSucceededConsumer> _logger;
    private readonly IMessageScheduler _scheduler;
    private static readonly Uri OrderTimeoutQueue = new("queue:order-timeout");

    public PaymentSucceededConsumer(OrderingDbContext dbContext, ILogger<PaymentSucceededConsumer> logger, IMessageScheduler scheduler)
    {
        _dbContext = dbContext;
        _logger = logger;
        _scheduler = scheduler;
    }

    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"[Ordering Service] Received Payment Success for Order: {message.OrderId}");
        
        var order = await _dbContext.Orders.FindAsync(message.OrderId);
        
        if (order == null)
        {
            _logger.LogWarning($"Order {message.OrderId} not found!");
            return;
        }

        if (order.TimeoutTokenId.HasValue)
        {
            await _scheduler.CancelScheduledSend(OrderTimeoutQueue, order.TimeoutTokenId.Value);

            _logger.LogInformation(
                "Cancelled timeout job for Order {OrderId}",
                order.Id
            );

            order.TimeoutTokenId = null;
        }


        if (order.Status == "Pending") 
        {
            order.Status = "Paid";
            order.PaymentId = message.PaymentId;

            _logger.LogInformation($"Order {message.OrderId} status updated to Paid.");
        }
    }
}