using Microsoft.EntityFrameworkCore;
using ShopOrbit.Catalog.API.Models;

namespace ShopOrbit.Catalog.API.Data;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Product>().HasData(
            new Product { Id = Guid.Parse("d28888e9-2ba9-473a-a40f-e38cb54f9b35"), Name = "iPhone 15 Pro", Price = 999, StockQuantity = 100 },
            new Product { Id = Guid.Parse("da2fd609-d754-4feb-8acd-c4f9ff13ba96"), Name = "Samsung Galaxy S24", Price = 899, StockQuantity = 50 }
        );
    }
}