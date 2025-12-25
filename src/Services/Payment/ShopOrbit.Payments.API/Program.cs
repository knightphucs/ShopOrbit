using MassTransit;
using Microsoft.EntityFrameworkCore;
using ShopOrbit.Payments.API.Consumers;
using ShopOrbit.Payments.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
    options.InstanceName = "ShopOrbit_Payments_";
});

builder.Services.AddMassTransit(x =>
{
    // x.AddConsumer<OrderCreatedConsumer>();
    x.AddConsumer<PaymentRequestedConsumer>();

    x.AddEntityFrameworkOutbox<PaymentDbContext>(o =>
    {
        o.UsePostgres();
        o.UseBusOutbox();
    });

    x.UsingRabbitMq((context, cfg) =>
    {
        var rabbitHost = builder.Configuration["RabbitMq:Host"] ?? "localhost";
        var rabbitUser = builder.Configuration["RabbitMq:UserName"] ?? "guest";
        var rabbitPass = builder.Configuration["RabbitMq:Password"] ?? "guest";

        cfg.Host(rabbitHost, "/", h =>
        {
            h.Username(rabbitUser);
            h.Password(rabbitPass);
        });

        // cfg.ReceiveEndpoint("payment-service-queue", e =>
        // {
        //     e.UseMessageRetry(r => r.Interval(3, TimeSpan.FromSeconds(5)));
            
        //     e.ConfigureConsumer<OrderCreatedConsumer>(context);
        // });

        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    db.Database.Migrate();
}

app.MapControllers();

app.Run();