namespace ShopOrbit.Ordering.API.DTOs;

public class BasketItemDto
{
    public required string ProductId { get; set; }
    public required string ProductName { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string? ImageUrl { get; set; }
    public Dictionary<string, string> SelectedSpecifications { get; set; } = new();
}