namespace ShopOrbit.BuildingBlocks.Contracts;

public record PaymentSucceededEvent
{
    public Guid OrderId { get; init; }
    public Guid PaymentId { get; init; }
    public DateTime ProcessedAt { get; init; }
}

public record PaymentFailedEvent
{
    public Guid OrderId { get; init; }
    public required string Reason { get; init; }
}