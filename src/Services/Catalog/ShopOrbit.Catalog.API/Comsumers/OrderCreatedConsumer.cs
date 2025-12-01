using MassTransit;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.Models;

namespace ShopOrbit.Catalog.API.Consumers;

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
        _logger.LogInformation($"[RabbitMQ] Received Order Created: {message.OrderId} - Amount: {message.TotalAmount}");

        // Logic giả lập: Trừ tồn kho (Ở đây mình hardcode trừ ID mẫu, thực tế bạn sẽ loop qua Items)
        // Để đơn giản cho demo, mình chỉ log ra màn hình.
        
        // Nếu muốn code thật:
        /*
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == message.ProductId);
        if(product != null) {
            product.StockQuantity -= 1;
            await _dbContext.SaveChangesAsync();
        }
        */
        
        await Task.CompletedTask;
    }
}