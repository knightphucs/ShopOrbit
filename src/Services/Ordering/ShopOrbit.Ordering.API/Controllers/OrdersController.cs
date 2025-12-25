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
    private readonly IDistributedLockFactory _lockFactory;

    public OrdersController(
        OrderingDbContext dbContext, 
        IPublishEndpoint publishEndpoint, 
        ILogger<OrdersController> logger,
        IDistributedCache cache,
        ProductGrpc.ProductGrpcClient grpcClient,
        IMessageScheduler scheduler,
        IDistributedLockFactory lockFactory)
    {
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
        _cache = cache;
        _grpcClient = grpcClient;
        _scheduler = scheduler;
        _lockFactory = lockFactory;
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
            var resource = $"lock:product:{item.ProductId}";
            var expiry = TimeSpan.FromSeconds(5);
            var wait = TimeSpan.FromSeconds(2);
            var retry = TimeSpan.FromMicroseconds(200);

            using (var redLock = await _lockFactory.CreateLockAsync(resource, expiry, wait, retry))
            {
                if (redLock.IsAcquired)
                {
                    var productInfo = await _grpcClient.GetProductAsync(new GetProductRequest { ProductId = item.ProductId });

                    if (!productInfo.Exists) 
                        return BadRequest($"Product with ID {item.ProductId} does not exist.");

                    if (productInfo.StockQuantity < item.Quantity)
                        return BadRequest($"Insufficient stock for product {productInfo.Name}. Available: {productInfo.StockQuantity}, Requested: {item.Quantity}");
                    
                    finalOrderItems.Add(new OrderItem
                    {
                        ProductId = Guid.Parse(item.ProductId),
                        ProductName = productInfo.Name,
                        Quantity = item.Quantity,
                        UnitPrice = (decimal)productInfo.Price
                    });

                    eventItems.Add(new OrderItemEvent
                    {
                        ProductId = Guid.Parse(item.ProductId),
                        Quantity = item.Quantity
                    });
                    _logger.LogInformation($"Reserved {item.Quantity} of Product {productInfo.Name} for User {userIdString}");
                }
                else
                {
                    _logger.LogWarning($"Could not acquire lock for product {item.ProductId}");
                    return StatusCode(409, $"System is busy processing product {item.ProductId}. Please try again.");
                }
            }
        }

        var newOrder = new Order
        {
            UserId = Guid.Parse(userIdString),
            Status = "Pending",
            OrderDate = DateTime.UtcNow,
            Items = finalOrderItems,
            TotalAmount = finalOrderItems.Sum(x => x.UnitPrice * x.Quantity),

            ShippingAddress = request.ShippingAddress,
            PaymentMethod = request.PaymentMethod,
            Notes = request.Notes,
            TimeoutTokenId = null
        };

        _dbContext.Orders.Add(newOrder);
        _logger.LogInformation($"Order {newOrder.Id} created for User {newOrder.UserId}");

        var eventMessage = new OrderCreatedEvent
        {
            OrderId = newOrder.Id,
            UserId = newOrder.UserId,
            TotalAmount = newOrder.TotalAmount,
            CreatedAt = newOrder.OrderDate,
            OrderItems = eventItems,
            PaymentMethod = newOrder.PaymentMethod
        };
        await _publishEndpoint.Publish(eventMessage);

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

        await _cache.RemoveAsync(userIdString);

        await _dbContext.SaveChangesAsync();

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
            OrderId = orderId
        });

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

        var order = await _dbContext.Orders.FindAsync(id);

        if (order == null)
            return NotFound();

        if (order.UserId != Guid.Parse(userIdString) && !User.IsInRole("Admin") && !User.IsInRole("Staff"))
            return Forbid();

        return Ok(order);
    }
}