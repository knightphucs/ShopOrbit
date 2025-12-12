using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class PaymentSucceededConsumer : IConsumer<PaymentSucceededEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<PaymentSucceededConsumer> _logger;

    public PaymentSucceededConsumer(OrderingDbContext dbContext, ILogger<PaymentSucceededConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentSucceededEvent> context)
    {
        var message = context.Message;
        
        var order = await _dbContext.Orders.FindAsync(message.OrderId);
        
        if (order != null)
        {
            order.Status = "Paid";
            await _dbContext.SaveChangesAsync();
            
            _logger.LogInformation($"Order {message.OrderId} status updated to PAID");
        }
    }
}