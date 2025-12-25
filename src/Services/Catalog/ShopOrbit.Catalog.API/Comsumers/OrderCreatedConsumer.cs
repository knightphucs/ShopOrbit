using MassTransit;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.Models;

namespace ShopOrbit.Catalog.API.Comsumers;

public class OrderCreatedConsumer : IConsumer<OrderCreatedEvent>
{
    private readonly CatalogDbContext _dbContext;
    private readonly ILogger<OrderCreatedConsumer> _logger;

    public OrderCreatedConsumer(CatalogDbContext dbContext, ILogger<OrderCreatedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<OrderCreatedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation($"Processing Order: {message.OrderId}");

        foreach (var item in message.OrderItems)
        {
            var product = await _dbContext.Products.FindAsync(item.ProductId);
            if (product == null)
            {
                _logger.LogError($"Product {item.ProductId} not found!");
                continue;
            }
            if (product.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException($"Not enough stock for Product {product.Id}. Available: {product.StockQuantity}, Requested: {item.Quantity}");
            }
            product.StockQuantity -= item.Quantity;
        }
        
        await _dbContext.SaveChangesAsync();
        _logger.LogInformation($"Stock updated for Order: {message.OrderId}");
    }
}