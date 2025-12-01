using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Ordering.API.Data;
using ShopOrbit.Ordering.API.DTOs;
using ShopOrbit.Ordering.API.Models;
using System.Security.Claims;

namespace ShopOrbit.Ordering.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderingDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(OrderingDbContext dbContext, IPublishEndpoint publishEndpoint, ILogger<OrdersController> logger)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpPost]
    [Authorize(Roles = "User")]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequest request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString))
        {
            return Unauthorized("User ID not found in token");
        }

        var newOrder = new Order
        {
            UserId = Guid.Parse(userIdString),
            Status = "Pending",
            OrderDate = DateTime.UtcNow,
            Items = request.Items.Select(i => new OrderItem
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        };

        newOrder.TotalAmount = newOrder.Items.Sum(x => x.UnitPrice * x.Quantity);

        _dbContext.Orders.Add(newOrder);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation($"Order {newOrder.Id} created successfully for User {newOrder.UserId}");

        var eventMessage = new OrderCreatedEvent
        {
            OrderId = newOrder.Id,
            UserId = newOrder.UserId,
            TotalAmount = newOrder.TotalAmount,
            CreatedAt = newOrder.OrderDate
        };

        await _publishEndpoint.Publish(eventMessage);

        return Ok(new 
        { 
            Message = "Order placed successfully", 
            OrderId = newOrder.Id,
            newOrder.TotalAmount 
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