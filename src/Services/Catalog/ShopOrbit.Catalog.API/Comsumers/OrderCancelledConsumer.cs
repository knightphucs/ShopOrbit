using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Catalog.API.Data;

namespace ShopOrbit.Catalog.API.Comsumers;

public class OrderCancelledConsumer : IConsumer<OrderCancelledEvent>
{
    private readonly CatalogDbContext _dbContext;
    private readonly ILogger<OrderCancelledConsumer> _logger;
    
    public OrderCancelledConsumer(CatalogDbContext dbContext, ILogger<OrderCancelledConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
        
    }

    public async Task Consume(ConsumeContext<OrderCancelledEvent> context)
    {
        _logger.LogInformation($"Restoring stock for Order {context.Message.OrderId}");
        

        foreach (var item in context.Message.OrderItems)
        {
            var product = await _dbContext.Products.FindAsync(item.ProductId);
            if (product != null)
            {
                product.StockQuantity += item.Quantity;
            }
        }
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Restored stock for Order {context.Message.OrderId}");
    }
}