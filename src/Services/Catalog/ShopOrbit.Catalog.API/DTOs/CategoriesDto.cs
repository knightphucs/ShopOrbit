namespace ShopOrbit.Catalog.API.DTOs;

public class CategorySpecParams
{
    private const int MaxPageSize = 50;

    public int PageIndex { get; set; } = 1;

    private int _pageSize = 10;
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
    }

    public string? Search { get; set; }
    public string? Sort { get; set; } = "nameAsc";
}

public record CategoryDto(
        Guid Id,
        string Name,
        string? Description,
        DateTime Updated_At,
        int ProductCount
    );