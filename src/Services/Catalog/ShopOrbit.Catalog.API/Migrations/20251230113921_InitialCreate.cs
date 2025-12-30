using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ShopOrbit.Catalog.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Updated_At = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "InboxState",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ConsumerId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Received = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReceiveCount = table.Column<int>(type: "integer", nullable: false),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Consumed = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InboxState", x => x.Id);
                    table.UniqueConstraint("AK_InboxState_MessageId_ConsumerId", x => new { x.MessageId, x.ConsumerId });
                });

            migrationBuilder.CreateTable(
                name: "OutboxState",
                columns: table => new
                {
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: false),
                    LockId = table.Column<Guid>(type: "uuid", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", rowVersion: true, nullable: true),
                    Created = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Delivered = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSequenceNumber = table.Column<long>(type: "bigint", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxState", x => x.OutboxId);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    ImageUrl = table.Column<string>(type: "text", nullable: true),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    Specifications = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OutboxMessage",
                columns: table => new
                {
                    SequenceNumber = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnqueueTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SentTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Headers = table.Column<string>(type: "text", nullable: true),
                    Properties = table.Column<string>(type: "text", nullable: true),
                    InboxMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    InboxConsumerId = table.Column<Guid>(type: "uuid", nullable: true),
                    OutboxId = table.Column<Guid>(type: "uuid", nullable: true),
                    MessageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    MessageType = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: true),
                    CorrelationId = table.Column<Guid>(type: "uuid", nullable: true),
                    InitiatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    SourceAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    DestinationAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ResponseAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    FaultAddress = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    ExpirationTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxMessage", x => x.SequenceNumber);
                    table.ForeignKey(
                        name: "FK_OutboxMessage_InboxState_InboxMessageId_InboxConsumerId",
                        columns: x => new { x.InboxMessageId, x.InboxConsumerId },
                        principalTable: "InboxState",
                        principalColumns: new[] { "MessageId", "ConsumerId" });
                    table.ForeignKey(
                        name: "FK_OutboxMessage_OutboxState_OutboxId",
                        column: x => x.OutboxId,
                        principalTable: "OutboxState",
                        principalColumn: "OutboxId");
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Description", "Name", "Updated_At" },
                values: new object[,]
                {
                    { new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "High-end mobile devices and flagship smartphones", "Smartphones", new DateTime(2025, 12, 30, 11, 39, 20, 433, DateTimeKind.Utc).AddTicks(2024) },
                    { new Guid("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f"), "High-performance portable computers and MacBooks", "Laptops", new DateTime(2025, 12, 30, 11, 39, 20, 433, DateTimeKind.Utc).AddTicks(2144) },
                    { new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "Mechanical keyboards and accessories", "Keyboards", new DateTime(2025, 12, 30, 11, 39, 20, 433, DateTimeKind.Utc).AddTicks(2146) },
                    { new Guid("d6e4f4a7-8b9c-6d4e-1f3a-4f4f4f4f4f4f"), "All-in-One computers and workstations", "Desktops", new DateTime(2025, 12, 30, 11, 39, 20, 433, DateTimeKind.Utc).AddTicks(2147) }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CategoryId", "Description", "ImageUrl", "Name", "Price", "Specifications", "StockQuantity" },
                values: new object[,]
                {
                    { new Guid("05408272-9aa5-4bee-887b-3075025d17be"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Experience the next generation of connectivity.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089907/iphone16e_llslov.png", "iPhone 16E Air", 949m, new Dictionary<string, string> { ["Display"] = "6.3 inch OLED", ["Processor"] = "A18 Pro", ["Features"] = "Action Button" }, 45 },
                    { new Guid("05b828e9-0c7c-4856-bed7-e4de975434ed"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "The world's thinnest smartphone, designed for the modern minimalist.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766823963/joll2fcyaslrkksooemw.png", "iPhone Air Slim", 899m, new Dictionary<string, string> { ["Thickness"] = "5.5mm", ["Weight"] = "140g", ["Display"] = "6.1 inch OLED" }, 100 },
                    { new Guid("14557cd6-bb6f-417d-bb3c-1e12e6cb435d"), new Guid("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f"), "Supercharged by M4. Lean. Mean. M4 machine.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093810/macbook-air-13-inch-m4-16gb-256gb-blackblue-removebg-preview_jamr6z.png", "MacBook Air 13 M4", 1099m, new Dictionary<string, string> { ["Chip"] = "Apple M4", ["Memory"] = "16GB Unified", ["Storage"] = "256GB SSD", ["Display"] = "13.6 inch Liquid Retina", ["Color"] = "Midnight" }, 50 },
                    { new Guid("16cba8b0-d37f-43b5-993f-30ddfb5d64f1"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Large display, impressive battery life, and vibrant colors.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766824071/ufhvv71ghkatibm4jwci.png", "iPhone 17 Plus", 999m, new Dictionary<string, string> { ["Display"] = "6.7 inch Super Retina", ["Processor"] = "A18", ["Charging"] = "45W USB-C" }, 60 },
                    { new Guid("39b4bd8a-6715-4304-a48c-46029558db42"), new Guid("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f"), "Impressively big. Impossibly thin.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093816/macbook-air-15-inch-m4-color-gold-removebg-preview_qb2u2m.png", "MacBook Air 15 M4", 1299m, new Dictionary<string, string> { ["Chip"] = "Apple M4", ["Display"] = "15.3 inch Liquid Retina", ["Memory"] = "16GB Unified", ["Color"] = "Starlight Gold" }, 40 },
                    { new Guid("4d4a154f-f928-4181-8e74-f1106e835a96"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Next-generation foldable with slimmer hinge and powerful AI features.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093399/samsung-galaxy-z-fold7-black-1_zif2q4.png", "Samsung Galaxy Z Fold 7", 1799m, new Dictionary<string, string> { ["Main Display"] = "7.6 inch Dynamic AMOLED 2X", ["Cover Display"] = "6.3 inch", ["Processor"] = "Snapdragon 8 Gen 4", ["RAM"] = "12GB", ["Color"] = "Phantom Black" }, 15 },
                    { new Guid("4e4097cf-3f33-4607-8391-f10c63ac032a"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Future technology breakthrough with an infinite bezel-less display.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766823636/sa8t0adigwdyqnsgj2n8.png", "iPhone 17 Pro Max Ultra", 1499m, new Dictionary<string, string> { ["Display"] = "6.9 inch Ultra Motion", ["Processor"] = "A19 Bionic", ["Camera"] = "Quad 64MP System" }, 10 },
                    { new Guid("5c228d2e-6840-4181-8c82-867a324fbcd2"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Raw titanium beauty with a professional-grade 48MP camera system.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766821222/iphone-15-pro-titan-halo_vkcmpu.png", "iPhone 15 Pro Natural Titanium", 1099m, new Dictionary<string, string> { ["Display"] = "6.1 inch Super Retina XDR", ["Storage"] = "256GB", ["Color"] = "Natural Titanium" }, 35 },
                    { new Guid("6384ca25-7a5d-42d6-a069-4b0af3f4b209"), new Guid("b4d2f2f5-6c7e-5d3f-8a2f-2f2f2f2f2f2f"), "Mind-blowing. Head-turning. The ultimate pro laptop.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093814/macbook-pro-14-inch-m4-pro-black-removebg-preview_tjnqvr.png", "MacBook Pro 14 M4 Pro", 1999m, new Dictionary<string, string> { ["Chip"] = "Apple M4 Pro", ["Memory"] = "18GB Unified", ["Display"] = "14.2 inch Liquid Retina XDR", ["Color"] = "Space Black" }, 20 },
                    { new Guid("6b914544-3ed1-46b1-8b2d-207d4446048f"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "Customized mechanical keyboard for enthusiasts.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089854/kb_aula_c7skwy.png", "Aula Custom Edition", 85m, new Dictionary<string, string> { ["Switches"] = "Leobog Reaper", ["Sound"] = "Thocky" }, 15 },
                    { new Guid("8bfea9f3-f81b-4ba6-a56c-ee473e276078"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Durable titanium design, featuring the A17 Pro chip.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766818588/tiz3if51ilnx4yudd6ci.png", "iPhone 15 Pro Black Titanium", 999m, new Dictionary<string, string> { ["Display"] = "6.1 inch Super Retina XDR", ["Processor"] = "A17 Pro", ["RAM"] = "8GB", ["Storage"] = "128GB", ["Color"] = "Black Titanium" }, 50 },
                    { new Guid("a1eba2b6-0a9c-421b-83de-af1c077b04bf"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "The smoothest low-profile mechanical keyboard with Gasket Mount.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093176/ban-phim-co-lofree-flow-84-key-white-removebg-preview_jcrb9f.png", "Lofree Flow 84 White", 159m, new Dictionary<string, string> { ["Type"] = "Low Profile", ["Switches"] = "Kailh Phantom (Ghost)", ["Material"] = "Aluminum", ["Color"] = "White" }, 30 },
                    { new Guid("ae744e56-edcc-47a5-b99f-5c3818780240"), new Guid("a3c1e1f4-5b6d-4c2e-9f1e-1f1e1f1e1f1e"), "Galaxy AI is here. Epic design and powerful performance.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1766818601/ymsdwjh5iy5dcipdsntt.jpg", "Samsung Galaxy S24 Cream", 799m, new Dictionary<string, string> { ["Display"] = "6.2 inch FHD+", ["Processor"] = "Exynos 2400 / Snapdragon 8 Gen 3", ["RAM"] = "8GB", ["Color"] = "Cream" }, 80 },
                    { new Guid("b07e3c70-4649-4c02-8908-4ee012639833"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "High-performance gaming mechanical keyboard.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089840/AULA_F75_MAX_%C4%90EN_z8gche.png", "Aula F75 Max Black", 75m, new Dictionary<string, string> { ["Layout"] = "75%", ["Polling Rate"] = "1000Hz" }, 100 },
                    { new Guid("e0dea770-2307-4c72-8707-f8cdc5db01fb"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "Wooden mechanical keyboard with multi-mode connectivity.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089822/149_AKKO_MU02_Mountain_Seclusion_Multi-Modes_zzhjao.png", "Akko MU02 Mountain Seclusion", 120m, new Dictionary<string, string> { ["Material"] = "Walnut Wood", ["Switches"] = "Akko V3 Piano Pro", ["Layout"] = "65%" }, 25 },
                    { new Guid("f0e51585-fab8-4068-b8c5-274a51c0bc9e"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "Gasket mount mechanical keyboard with transparent acrylic case.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089836/89_AKKO_5075B_Plus_Transparent_ASA_White_cal5fb.png", "Akko 5075B Plus Transparent", 95m, new Dictionary<string, string> { ["Structure"] = "Gasket Mount", ["Lighting"] = "SMD LED RGB" }, 40 },
                    { new Guid("f80f3800-425e-460c-bbea-b7aa1770fdb9"), new Guid("d6e4f4a7-8b9c-6d4e-1f3a-4f4f4f4f4f4f"), "The world's best all-in-one computer.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767089860/imac_m8bljd.png", "iMac 24-inch M3", 1299m, new Dictionary<string, string> { ["Processor"] = "Apple M3", ["Display"] = "24-inch 4.5K Retina", ["Color"] = "Blue" }, 20 },
                    { new Guid("fefa28f1-69bd-466b-b375-3ffc3a2b2a6f"), new Guid("c5d3e3f6-7a8b-5c3d-0e2f-3f3f3f3f3f3f"), "Classic high-end mechanical keyboard known for durability and typing feel.", "https://res.cloudinary.com/dwhgdtdli/image/upload/v1767093181/B%C3%A0n-ph%C3%ADm-Leopold-FC900R-BT-MX2A-Graphite---Blue-Font-removebg-preview_bt94kl.png", "Leopold FC900R BT Graphite", 140m, new Dictionary<string, string> { ["Switches"] = "Cherry MX2A", ["Keycaps"] = "1.5mm PBT Double-shot", ["Connectivity"] = "Bluetooth 5.1 / Wired", ["Layout"] = "Full-size" }, 20 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_InboxState_Delivered",
                table: "InboxState",
                column: "Delivered");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_EnqueueTime",
                table: "OutboxMessage",
                column: "EnqueueTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_ExpirationTime",
                table: "OutboxMessage",
                column: "ExpirationTime");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_InboxMessageId_InboxConsumerId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "InboxMessageId", "InboxConsumerId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxMessage_OutboxId_SequenceNumber",
                table: "OutboxMessage",
                columns: new[] { "OutboxId", "SequenceNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OutboxState_Created",
                table: "OutboxState",
                column: "Created");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId",
                table: "Products",
                column: "CategoryId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OutboxMessage");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "InboxState");

            migrationBuilder.DropTable(
                name: "OutboxState");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
