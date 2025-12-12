using System.ComponentModel.DataAnnotations;

namespace ShopOrbit.Catalog.API.Models
{
    public class Category
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }
        public DateTime Updated_At { get; set; }
    }
}
