using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class PaymentFailedConsumer : IConsumer<PaymentFailedEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<PaymentFailedConsumer> _logger;
    private readonly IMessageScheduler _scheduler;
    private static readonly Uri OrderTimeoutQueue = new("queue:order-timeout");

    public PaymentFailedConsumer(OrderingDbContext dbContext, ILogger<PaymentFailedConsumer> logger, IMessageScheduler scheduler)
    {
        _dbContext = dbContext;
        _logger = logger;
        _scheduler = scheduler;
    }

    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        var order = await _dbContext.Orders
        .Include(o => o.Items)
        .FirstOrDefaultAsync(x => x.Id == context.Message.OrderId);

        if (order == null || order.Status != "Pending")
            return;

        // Cancel Quartz timeout
        if (order.TimeoutTokenId.HasValue)
        {
            await _scheduler.CancelScheduledSend(
                OrderTimeoutQueue,
                order.TimeoutTokenId.Value
            );

            order.TimeoutTokenId = null;
        }

        order.Status = "Cancelled";
        order.PaymentId = null;

        _logger.LogWarning(
            "Order {OrderId} cancelled due to payment failure",
            order.Id
        );

        await context.Publish(new OrderCancelledEvent
        {
            OrderId = order.Id,
            OrderItems = order.Items.Select(i => new OrderItemEvent
            {
                ProductId = i.ProductId,
                Quantity = i.Quantity
            }).ToList()
        });
    }
}