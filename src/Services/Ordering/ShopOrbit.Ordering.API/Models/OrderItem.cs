using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ShopOrbit.Ordering.API.Models;

public class OrderItem
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ProductId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }
    public string? ImageUrl { get; set; }
    public Dictionary<string, string> Specifications { get; set; } = new();

    public Guid OrderId { get; set; }
    
    [JsonIgnore]
    public Order Order { get; set; } = null!;
}