using Asp.Versioning;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using RedLockNet;
using ShopOrbit.BuildingBlocks.Contracts;
using ShopOrbit.Grpc;
using ShopOrbit.Ordering.API.Consumers;
using ShopOrbit.Ordering.API.Data;
using ShopOrbit.Ordering.API.DTOs;
using ShopOrbit.Ordering.API.Models;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace ShopOrbit.Ordering.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
[ApiController]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderingDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OrdersController> _logger;
    private readonly IDistributedCache _cache;
    private readonly ProductGrpc.ProductGrpcClient _grpcClient;
    private readonly IMessageScheduler _scheduler;

    public OrdersController(
        OrderingDbContext dbContext, 
        IPublishEndpoint publishEndpoint, 
        ILogger<OrdersController> logger,
        IDistributedCache cache,
        ProductGrpc.ProductGrpcClient grpcClient,
        IMessageScheduler scheduler)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _cache = cache;
        _grpcClient = grpcClient;
        _scheduler = scheduler;
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> PlaceOrder([FromBody] CreateOrderRequest request)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var basketString = await _cache.GetStringAsync(userIdString);
        if (string.IsNullOrEmpty(basketString))
            return BadRequest("Basket is empty. Please add items to your basket before placing an order.");

        var options = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        var basket = JsonSerializer.Deserialize<BasketDto>(basketString, options);
        if (basket == null || basket.Items.Count == 0) return BadRequest("Invalid basket data.");

        var finalOrderItems = new List<OrderItem>();
        var eventItems = new List<OrderItemEvent>();

        foreach (var item in basket.Items)
        {
            var productInfo = await _grpcClient.GetProductAsync(new GetProductRequest { ProductId = item.ProductId });

            if (!productInfo.Exists)
                return BadRequest($"Product {item.ProductId} not found.");

            if (productInfo.StockQuantity < item.Quantity)
                return BadRequest($"Insufficient stock for {productInfo.Name}. Available: {productInfo.StockQuantity}");

            finalOrderItems.Add(new OrderItem
            {
                ProductId = Guid.Parse(item.ProductId),
                ProductName = productInfo.Name,
                Quantity = item.Quantity,
                UnitPrice = (decimal)productInfo.Price,
                ImageUrl = item.ImageUrl, 
                Specifications = item.SelectedSpecifications ?? new Dictionary<string, string>()
            });

            eventItems.Add(new OrderItemEvent
            {
                ProductId = Guid.Parse(item.ProductId),
                Quantity = item.Quantity
            });
        }

        var newOrder = new Order
        {
            UserId = Guid.Parse(userIdString),
            Status = "Pending",
            OrderDate = DateTime.UtcNow,
            Items = finalOrderItems,
            TotalAmount = finalOrderItems.Sum(x => x.UnitPrice * x.Quantity),
            ShippingAddress = new Address
            {
                FirstName = request.ShippingAddress.FirstName,
                LastName = request.ShippingAddress.LastName,
                EmailAddress = request.ShippingAddress.EmailAddress,
                AddressLine = request.ShippingAddress.AddressLine,
                Country = request.ShippingAddress.Country,
                State = request.ShippingAddress.State,
                ZipCode = request.ShippingAddress.ZipCode
            },
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            TimeoutTokenId = null
        };

        _dbContext.Orders.Add(newOrder);
        _logger.LogInformation($"Order {newOrder.Id} created for User {newOrder.UserId}");

        await _publishEndpoint.Publish(new OrderCreatedEvent
        {
            OrderId = newOrder.Id,
            UserId = newOrder.UserId,
            TotalAmount = newOrder.TotalAmount,
            CreatedAt = newOrder.OrderDate,
            OrderItems = eventItems,
            PaymentMethod = newOrder.PaymentMethod
        });

        try 
        {
            var destinationUri = new Uri("queue:order-timeout"); 

            var scheduled = await _scheduler.ScheduleSend(
                destinationUri, 
                DateTime.UtcNow.AddMinutes(5),
                new OrderTimeoutEvent { OrderId = newOrder.Id }
            );
            
            newOrder.TimeoutTokenId = scheduled.TokenId;

            _logger.LogInformation(
                "Scheduled timeout for Order {OrderId}, Token {TokenId}",
                newOrder.Id,
                scheduled.TokenId
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to schedule timeout message.");
        }

        await _dbContext.SaveChangesAsync();
        await _cache.RemoveAsync(userIdString);

        return Ok(new 
        { 
            Message = "Order placed successfully", 
            OrderId = newOrder.Id 
        });
    }

    [HttpPost("{orderId}/pay")]
    [Authorize]
    public async Task<IActionResult> PayOrder(Guid orderId)
    {
        var order = await _dbContext.Orders.FindAsync(orderId);

        if (order == null)
            return NotFound();

        if (order.Status != "Pending")
            return BadRequest("Order is not payable.");

        await _publishEndpoint.Publish(new PaymentRequestedEvent
        {
            OrderId = orderId,
            UserId = order.UserId,
            Amount = order.TotalAmount,
            PaymentMethod = order.PaymentMethod,
            Currency = "VND"
        });

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            Message = "Payment started",
            OrderId = orderId
        });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff")]
    public IActionResult GetAllOrders()
    {
        var orders = _dbContext.Orders.ToList();
        return Ok(orders);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString)) return Unauthorized();

        var order = await _dbContext.Orders
            .Include(o => o.Items) 
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        // Logic check quyền xem đơn (User chỉ xem đơn mình, Admin/Staff xem hết)
        if (order.UserId != Guid.Parse(userIdString) && !User.IsInRole("Admin") && !User.IsInRole("Staff"))
            return Forbid();

        return Ok(order);
    }
}