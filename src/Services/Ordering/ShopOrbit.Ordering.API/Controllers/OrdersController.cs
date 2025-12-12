using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;
using ShopOrbit.Ordering.API.DTOs;
using ShopOrbit.Ordering.API.Models;
using System.Security.Claims;
using System.Text.Json;

namespace ShopOrbit.Ordering.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderingDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrdersController> _logger;
    private readonly IDistributedCache _cache;

    public OrdersController(
        OrderingDbContext dbContext, 
        IPublishEndpoint publishEndpoint, 
        ILogger<OrdersController> logger,
        IDistributedCache cache)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _cache = cache;
    }

    [HttpPost]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequest request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var basketString = await _cache.GetStringAsync(userIdString);
        
        if (string.IsNullOrEmpty(basketString))
        {
            return BadRequest("Basket is empty. Please add items to your basket before placing an order.");
        }

        var basket = JsonSerializer.Deserialize<BasketDto>(basketString);

        if (basket == null)
        {
            return BadRequest("Invalid basket data.");
        }

        var newOrder = new Order
        {
            UserId = Guid.Parse(userIdString),
            Status = "Pending",
            OrderDate = DateTime.UtcNow,
            Items = basket.Items.Select(i => new OrderItem
            {
                ProductId = Guid.TryParse(i.ProductId, out var pid) ? pid : Guid.Empty, 
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.Price
            }).ToList()
        };

        newOrder.TotalAmount = newOrder.Items.Sum(x => x.UnitPrice * x.Quantity);

        _dbContext.Orders.Add(newOrder);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Order {newOrder.Id} created for User {newOrder.UserId}");

        var eventMessage = new OrderCreatedEvent
        {
            OrderId = newOrder.Id,
            UserId = newOrder.UserId,
            TotalAmount = newOrder.TotalAmount,
            CreatedAt = newOrder.OrderDate
        };
        await _publishEndpoint.Publish(eventMessage);

        await _cache.RemoveAsync(userIdString);

        return Ok(new 
        { 
            Message = "Order placed successfully", 
            OrderId = newOrder.Id 
        });
    }


    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public IActionResult GetAllOrders()
    {
        var orders = _dbContext.Orders.ToList();
        return Ok(orders);
    }
}