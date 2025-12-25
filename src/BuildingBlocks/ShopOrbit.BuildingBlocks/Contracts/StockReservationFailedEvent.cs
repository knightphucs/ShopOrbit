namespace ShopOrbit.BuildingBlocks.Contracts;

public record StockReservationFailedEvent
{
    public Guid OrderId { get; init; }
    public string Reason { get; init; } = default!;
    public List<Guid> FailedItemIds { get; init; } = new();
}