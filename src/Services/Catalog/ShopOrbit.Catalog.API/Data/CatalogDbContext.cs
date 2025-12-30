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

    var smartphoneId = Guid.Parse("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e");
    var laptopId = Guid.Parse("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f");
    var keyboardId = Guid.Parse("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f");
    var desktopId = Guid.Parse("d6e4f4a7-8b9c-6d4e-1f3a-4f4f4f4f4f4f");

    modelBuilder.Entity<Category>().HasData(
        new Category
        {
            Id = smartphoneId,
            Name = "Smartphones",
            Description = "High-end mobile devices and flagship smartphones",
            Updated_At = DateTime.UtcNow
        },
        new Category
        {
            Id = laptopId,
            Name = "Laptops",
            Description = "High-performance portable computers and MacBooks",
            Updated_At = DateTime.UtcNow
        },
        new Category
        {
            Id = keyboardId,
            Name = "Keyboards",
            Description = "Mechanical keyboards and accessories",
            Updated_At = DateTime.UtcNow
        },
        new Category
        {
            Id = desktopId,
            Name = "Desktops",
            Description = "All-in-One computers and workstations",
            Updated_At = DateTime.UtcNow
        }
    );

    modelBuilder.Entity<Product>().HasData(
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone 15 Pro Black Titanium",
            Description = "Durable titanium design, featuring the A17 Pro chip.",
            Price = 999,
            StockQuantity = 50,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766818588/tiz3if51ilnx4yudd6ci.png",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.1 inch Super Retina XDR" },
                { "Processor", "A17 Pro" },
                { "RAM", "8GB" },
                { "Storage", "128GB" },
                { "Color", "Black Titanium" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone 15 Pro Natural Titanium",
            Description = "Raw titanium beauty with a professional-grade 48MP camera system.",
            Price = 1099,
            StockQuantity = 35,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766821222/iphone-15-pro-titan-halo_vkcmpu.png",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.1 inch Super Retina XDR" },
                { "Storage", "256GB" },
                { "Color", "Natural Titanium" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone 17 Pro Max Ultra",
            Description = "Future technology breakthrough with an infinite bezel-less display.",
            Price = 1499,
            StockQuantity = 10,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766823636/sa8t0adigwdyqnsgj2n8.png",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.9 inch Ultra Motion" },
                { "Processor", "A19 Bionic" },
                { "Camera", "Quad 64MP System" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone Air Slim",
            Description = "The world's thinnest smartphone, designed for the modern minimalist.",
            Price = 899,
            StockQuantity = 100,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766823963/joll2fcyaslrkksooemw.png",
            Specifications = new Dictionary<string, string>
            {
                { "Thickness", "5.5mm" },
                { "Weight", "140g" },
                { "Display", "6.1 inch OLED" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone 17 Plus",
            Description = "Large display, impressive battery life, and vibrant colors.",
            Price = 999,
            StockQuantity = 60,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766824071/ufhvv71ghkatibm4jwci.png",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.7 inch Super Retina" },
                { "Processor", "A18" },
                { "Charging", "45W USB-C" }
            }
        },

        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iPhone 16E Air",
            Description = "Experience the next generation of connectivity.",
            Price = 949,
            StockQuantity = 45,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089907/iphone16e_llslov.png",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.3 inch OLED" },
                { "Processor", "A18 Pro" },
                { "Features", "Action Button" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Samsung Galaxy Z Fold 7",
            Description = "Next-generation foldable with slimmer hinge and powerful AI features.",
            Price = 1799,
            StockQuantity = 15,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093399/samsung-galaxy-z-fold7-black-1_zif2q4.png",
            Specifications = new Dictionary<string, string>
            {
                { "Main Display", "7.6 inch Dynamic AMOLED 2X" },
                { "Cover Display", "6.3 inch" },
                { "Processor", "Snapdragon 8 Gen 4" },
                { "RAM", "12GB" },
                { "Color", "Phantom Black" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Samsung Galaxy S24 Cream",
            Description = "Galaxy AI is here. Epic design and powerful performance.",
            Price = 799,
            StockQuantity = 80,
            CategoryId = smartphoneId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766818601/ymsdwjh5iy5dcipdsntt.jpg",
            Specifications = new Dictionary<string, string>
            {
                { "Display", "6.2 inch FHD+" },
                { "Processor", "Exynos 2400 / Snapdragon 8 Gen 3" },
                { "RAM", "8GB" },
                { "Color", "Cream" }
            }
        },

        new Product
        {
            Id = Guid.NewGuid(),
            Name = "MacBook Air 13 M4",
            Description = "Supercharged by M4. Lean. Mean. M4 machine.",
            Price = 1099,
            StockQuantity = 50,
            CategoryId = laptopId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093810/macbook-air-13-inch-m4-16gb-256gb-blackblue-removebg-preview_jamr6z.png",
            Specifications = new Dictionary<string, string>
            {
                { "Chip", "Apple M4" },
                { "Memory", "16GB Unified" },
                { "Storage", "256GB SSD" },
                { "Display", "13.6 inch Liquid Retina" },
                { "Color", "Midnight" }
            }
        },

        new Product
        {
            Id = Guid.NewGuid(),
            Name = "MacBook Pro 14 M4 Pro",
            Description = "Mind-blowing. Head-turning. The ultimate pro laptop.",
            Price = 1999,
            StockQuantity = 20,
            CategoryId = laptopId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093814/macbook-pro-14-inch-m4-pro-black-removebg-preview_tjnqvr.png",
            Specifications = new Dictionary<string, string>
            {
                { "Chip", "Apple M4 Pro" },
                { "Memory", "18GB Unified" },
                { "Display", "14.2 inch Liquid Retina XDR" },
                { "Color", "Space Black" }
            }
        },

        new Product
        {
            Id = Guid.NewGuid(),
            Name = "MacBook Air 15 M4",
            Description = "Impressively big. Impossibly thin.",
            Price = 1299,
            StockQuantity = 40,
            CategoryId = laptopId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093816/macbook-air-15-inch-m4-color-gold-removebg-preview_qb2u2m.png",
            Specifications = new Dictionary<string, string>
            {
                { "Chip", "Apple M4" },
                { "Display", "15.3 inch Liquid Retina" },
                { "Memory", "16GB Unified" },
                { "Color", "Starlight Gold" }
            }
        },

        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Akko MU02 Mountain Seclusion",
            Description = "Wooden mechanical keyboard with multi-mode connectivity.",
            Price = 120,
            StockQuantity = 25,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089822/149_AKKO_MU02_Mountain_Seclusion_Multi-Modes_zzhjao.png",
            Specifications = new Dictionary<string, string>
            {
                { "Material", "Walnut Wood" },
                { "Switches", "Akko V3 Piano Pro" },
                { "Layout", "65%" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Akko 5075B Plus Transparent",
            Description = "Gasket mount mechanical keyboard with transparent acrylic case.",
            Price = 95,
            StockQuantity = 40,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089836/89_AKKO_5075B_Plus_Transparent_ASA_White_cal5fb.png",
            Specifications = new Dictionary<string, string>
            {
                { "Structure", "Gasket Mount" },
                { "Lighting", "SMD LED RGB" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Aula F75 Max Black",
            Description = "High-performance gaming mechanical keyboard.",
            Price = 75,
            StockQuantity = 100,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089840/AULA_F75_MAX_%C4%90EN_z8gche.png",
            Specifications = new Dictionary<string, string>
            {
                { "Layout", "75%" },
                { "Polling Rate", "1000Hz" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Aula Custom Edition",
            Description = "Customized mechanical keyboard for enthusiasts.",
            Price = 85,
            StockQuantity = 15,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089854/kb_aula_c7skwy.png",
            Specifications = new Dictionary<string, string>
            {
                { "Switches", "Leobog Reaper" },
                { "Sound", "Thocky" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Lofree Flow 84 White",
            Description = "The smoothest low-profile mechanical keyboard with Gasket Mount.",
            Price = 159,
            StockQuantity = 30,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093176/ban-phim-co-lofree-flow-84-key-white-removebg-preview_jcrb9f.png",
            Specifications = new Dictionary<string, string>
            {
                { "Type", "Low Profile" },
                { "Switches", "Kailh Phantom (Ghost)" },
                { "Material", "Aluminum" },
                { "Color", "White" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "Leopold FC900R BT Graphite",
            Description = "Classic high-end mechanical keyboard known for durability and typing feel.",
            Price = 140,
            StockQuantity = 20,
            CategoryId = keyboardId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093181/B%C3%A0n-ph%C3%ADm-Leopold-FC900R-BT-MX2A-Graphite---Blue-Font-removebg-preview_bt94kl.png",
            Specifications = new Dictionary<string, string>
            {
                { "Switches", "Cherry MX2A" },
                { "Keycaps", "1.5mm PBT Double-shot" },
                { "Connectivity", "Bluetooth 5.1 / Wired" },
                { "Layout", "Full-size" }
            }
        },
        new Product
        {
            Id = Guid.NewGuid(),
            Name = "iMac 24-inch M3",
            Description = "The world's best all-in-one computer.",
            Price = 1299,
            StockQuantity = 20,
            CategoryId = desktopId,
            ImageUrl = "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089860/imac_m8bljd.png",
            Specifications = new Dictionary<string, string>
            {
                { "Processor", "Apple M3" },
                { "Display", "24-inch 4.5K Retina" },
                { "Color", "Blue" }
            }
        }
    );
}
}