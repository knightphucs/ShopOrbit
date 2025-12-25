using MassTransit;
using Microsoft.EntityFrameworkCore;
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
        _logger.LogInformation($"[Catalog] Checking stock for Order: {message.OrderId}");

        var productIds = message.OrderItems.Select(x => x.ProductId).ToList();
        
        var products = await _dbContext.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var outOfStockItems = new List<Guid>();

        foreach (var item in message.OrderItems)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId);
            
            if (product == null || product.StockQuantity < item.Quantity)
            {
                outOfStockItems.Add(item.ProductId);
            }
        }

        if (outOfStockItems.Count != 0)
        {
            _logger.LogWarning($"[Stock Failure] Order {message.OrderId} failed due to insufficient stock.");

            await context.Publish(new StockReservationFailedEvent
            {
                OrderId = message.OrderId,
                Reason = "Insufficient stock for items: " + string.Join(", ", outOfStockItems),
                FailedItemIds = outOfStockItems
            });
            
            return; 
        }

        foreach (var item in message.OrderItems)
        {
            var product = products.First(p => p.Id == item.ProductId);
            product.StockQuantity -= item.Quantity;
            _logger.LogInformation($"Reserved {item.Quantity} of {product.Name}. New Stock: {product.StockQuantity}");
        }

        _logger.LogInformation($"[Catalog] Stock reserved successfully for Order {message.OrderId}");
    }
}