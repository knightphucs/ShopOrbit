namespace ShopOrbit.Ordering.API.DTOs;

public class BasketDto
{
    public required string UserName { get; set; }
    public List<BasketItemDto> Items { get; set; } = new();
}