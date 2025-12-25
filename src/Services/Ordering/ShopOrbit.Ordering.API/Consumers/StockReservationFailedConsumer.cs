using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class StockReservationFailedConsumer : IConsumer<StockReservationFailedEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<StockReservationFailedConsumer> _logger;
    private readonly IMessageScheduler _scheduler;
    private static readonly Uri OrderTimeoutQueue = new("queue:order-timeout");

    public StockReservationFailedConsumer(OrderingDbContext dbContext, ILogger<StockReservationFailedConsumer> logger, IMessageScheduler scheduler)
    {
        _dbContext = dbContext;
        _logger = logger;
        _scheduler = scheduler;
    }

    public async Task Consume(ConsumeContext<StockReservationFailedEvent> context)
    {
        var message = context.Message;
        
        var order = await _dbContext.Orders.FindAsync(message.OrderId);
        
        if (order != null && order.Status == "Pending")
        {
            if (order.TimeoutTokenId.HasValue)
            {
                try 
                {
                    await _scheduler.CancelScheduledSend(OrderTimeoutQueue, order.TimeoutTokenId.Value);
                    order.TimeoutTokenId = null;
                    _logger.LogInformation($"Cancelled timeout job for Order {order.Id} due to Stock Failure.");
                }
                catch(Exception ex)
                {
                    _logger.LogWarning($"Failed to cancel timeout job: {ex.Message}");
                }
            }

            order.Status = "Cancelled";
            order.Notes = $"Cancelled by System: {message.Reason}";
            
            _logger.LogWarning($"Order {message.OrderId} cancelled because: {message.Reason}");
        }
    }
}