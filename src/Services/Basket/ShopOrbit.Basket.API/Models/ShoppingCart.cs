namespace ShopOrbit.Basket.API.Models;

public class ShoppingCart
{
    public string UserName { get; set; } = string.Empty;
    public List<ShoppingCartItem> Items { get; set; } = new();

    public ShoppingCart() { }

    public ShoppingCart(string userName)
    {
        UserName = userName;
    }

    public decimal TotalPrice => Items.Sum(x => x.Price * x.Quantity);
}

public class ShoppingCartItem
{
    public string ProductId { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public Dictionary<string, string> SelectedSpecifications { get; set; } = new();
}