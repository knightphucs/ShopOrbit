using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;

namespace ShopOrbit.Ordering.API.Consumers;

public class OrderTimeoutConsumer : IConsumer<OrderTimeoutEvent>
{
    private readonly OrderingDbContext _dbContext;
    private readonly ILogger<OrderTimeoutConsumer> _logger;

    public OrderTimeoutConsumer(OrderingDbContext dbContext, ILogger<OrderTimeoutConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }
    
    public async Task Consume(ConsumeContext<OrderTimeoutEvent> context)
    {
        var order = await _dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(x => x.Id == context.Message.OrderId);

        if (order == null || order.Status != "Pending")
            return;
        
        order.Status = "Cancelled";
            
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