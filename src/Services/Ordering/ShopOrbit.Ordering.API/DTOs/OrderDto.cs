namespace ShopOrbit.Ordering.API.DTOs;

public record OrderItemDto(
    Guid ProductId, 
    string ProductName, 
    decimal UnitPrice, 
    int Quantity
);

public record CreateOrderRequest(
    List<OrderItemDto> Items
);