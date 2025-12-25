using Microsoft.EntityFrameworkCore;
using ShopOrbit.Catalog.API.Models;
using MassTransit;

namespace ShopOrbit.Catalog.API.Data;

public class CatalogDbContext : DbContext
{
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options) : base(options)
    {
    }

    public DbSet<Product> Products { get; set; }
    public DbSet<Category> Categories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.AddInboxStateEntity();
        modelBuilder.AddOutboxMessageEntity();
        modelBuilder.AddOutboxStateEntity();
        modelBuilder.Entity<Product>()
        .Property(p => p.Specifications)
        .HasColumnType("jsonb");

        modelBuilder.Entity<Category>().HasData(
                new Category
                {
                    Id = Guid.Parse("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"),
                    Name = "Smartphones",
                    Description = "Mobile devices",
                    Updated_At = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new Category
                {
                    Id = Guid.Parse("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f"),
                    Name = "Laptops",
                    Description = "Portable computers",
                    Updated_At = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );

        modelBuilder.Entity<Product>().HasData(
            new Product { Id = Guid.Parse("d28888e9-2ba9-473a-a40f-e38cb54f9b35"), Name = "iPhone 15 Pro", Price = 999, StockQuantity = 100, CategoryId = Guid.Parse("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"),
            Specifications = new Dictionary<string, string>
            {
                { "Color", "Titanium Black" },
                { "Storage", "256GB" },
                { "Screen", "6.1 inch" }
            } 
        },
            new Product { Id = Guid.Parse("da2fd609-d754-4feb-8acd-c4f9ff13ba96"), Name = "Samsung Galaxy S24", Price = 899, StockQuantity = 50, CategoryId = Guid.Parse("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"),
            Specifications = new Dictionary<string, string>
            {
                { "CPU", "M3 Pro" },
                { "RAM", "18GB" },
                { "SSD", "512GB" }
            } }
        );
    }
}