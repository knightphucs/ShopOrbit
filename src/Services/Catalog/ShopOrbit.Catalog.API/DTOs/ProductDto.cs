namespace ShopOrbit.Catalog.API.DTOs;
using System.Text.Json.Serialization;
public class ProductSpecParams
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
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }

    public Guid? CategoryId { get; set; }
    
    public string? Sort { get; set; } // nameAsc, priceDesc...
}

// 2. Class trả về kết quả phân trang
public class PagedResult<T>
{

    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public List<T> Data { get; set; } = new();

    [JsonConstructor]
    public PagedResult(
        List<T> data,
        int totalCount,
        int pageIndex,
        int pageSize)
    {
        Data = data;
        TotalCount = totalCount;
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize);
    }

    // Constructor dùng khi tạo mới trong code
    public PagedResult(List<T> data, int count, int pageIndex, int pageSize, bool ignoreJson = true)
    {
        Data = data;
        TotalCount = count;
        PageIndex = pageIndex;
        PageSize = pageSize;
        TotalPages = (int)Math.Ceiling(count / (double)pageSize);
    }
}