using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore; 
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.Models;
using ShopOrbit.Catalog.API.DTOs;
using Asp.Versioning;
using StackExchange.Redis;

namespace ShopOrbit.Catalog.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IDistributedCache _cache;
    private readonly CatalogDbContext _context;
    private readonly IConnectionMultiplexer _redis;
    public ProductsController(IDistributedCache cache, CatalogDbContext context, IConnectionMultiplexer redis)
    {
        _cache = cache;
        _context = context;
        _redis = redis;
    }

    // GET ALL 
    [HttpGet]
    [Authorize(Roles = "Admin,Staff,User")]
    public async Task<IActionResult> GetProducts([FromQuery] ProductSpecParams spec)
    {
        string cacheKey = GenerateCacheKeyFromParams(spec);

        // A. Check Redis Cache
        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            if (CheckETag(cachedData)) return StatusCode(304);
            return Ok(JsonSerializer.Deserialize<PagedResult<ProductDto>>(cachedData));
        }

        // B. Query Database
        var query = _context.Products.Include(p => p.Category).AsQueryable();

        // -- Filtering --
        if (!string.IsNullOrEmpty(spec.Search))
            query = query.Where(p => p.Name.ToLower().Contains(spec.Search.ToLower()));
        
        if (spec.MinPrice.HasValue)
            query = query.Where(p => p.Price >= spec.MinPrice);
        
        if (spec.MaxPrice.HasValue)
            query = query.Where(p => p.Price <= spec.MaxPrice);

        if (spec.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == spec.CategoryId);
        // -- Sorting --
        query = spec.Sort switch
        {
            "priceAsc" => query.OrderBy(p => p.Price),
            "priceDesc" => query.OrderByDescending(p => p.Price),
            _ => query.OrderBy(p => p.Name) // Default
        };

        // -- Pagination --
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((spec.PageIndex - 1) * spec.PageSize)
            .Take(spec.PageSize)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Price,
                p.Description,  
                p.StockQuantity,
                p.Category!.Name,
                p.CategoryId,    
                p.ImageUrl,
                p.Specifications
            )) // Map Entity -> DTO
            .ToListAsync();

        var result = new PagedResult<ProductDto>(items, totalCount, spec.PageIndex, spec.PageSize);

        // Save to Redis
        var options = new DistributedCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(2)) 
            .SetSlidingExpiration(TimeSpan.FromMinutes(1));
        
        string jsonData = JsonSerializer.Serialize(result);
        await _cache.SetStringAsync(cacheKey, jsonData, options);

        // D. HTTP Cache Headers
        SetETag(jsonData);

        return Ok(result);
    }

    // GET BY ID
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff,User")]
    public async Task<IActionResult> GetProductById(Guid id)
    {
        string cacheKey = $"catalog:product:{id}";

        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            return Ok(JsonSerializer.Deserialize<ProductDto>(cachedData));
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();

        var dto = new ProductDto(
            product.Id,
            product.Name,
            product.Price,
            product.Description, 
            product.StockQuantity,
            product.Category!.Name,
            product.CategoryId,  
            product.ImageUrl,
            product.Specifications
        );

        var options = new DistributedCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(dto), options);

        return Ok(dto);
    }

    // CREATE
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        product.Id = Guid.NewGuid();
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        await InvalidateCachePattern("catalog:products*");
        return CreatedAtAction(nameof(GetProductById), new { id = product.Id }, product);
    }

    // UPDATE
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] Product productUpdate)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = productUpdate.Name;
        product.Price = productUpdate.Price;
        product.Description = productUpdate.Description;
        product.StockQuantity = productUpdate.StockQuantity;
        product.ImageUrl = productUpdate.ImageUrl;
        product.CategoryId = productUpdate.CategoryId;

        product.Specifications = productUpdate.Specifications;
        
        await _context.SaveChangesAsync();

        await _cache.RemoveAsync($"catalog:product:{id}");
        await InvalidateCachePattern("catalog:products*");
        return NoContent();
    }

    // DELETE (Admin Only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        // Invalidation
        await _cache.RemoveAsync($"catalog:product:{id}");
        await InvalidateCachePattern("catalog:products*");
        return NoContent();
    }

    // HELPERS
    private string GenerateCacheKeyFromParams(ProductSpecParams spec)
    {
        return $"catalog:products:p{spec.PageIndex}_s{spec.PageSize}_q{spec.Search}_cat{spec.CategoryId}_min{spec.MinPrice}_max{spec.MaxPrice}_sort{spec.Sort}";
    }

    private void SetETag(string content)
    {
        var etag = GenerateETag(content);
        if (!Response.Headers.ContainsKey("ETag"))
            Response.Headers.Append("ETag", etag);
    }

    private bool CheckETag(string content)
    {
        if (!Request.Headers.ContainsKey("If-None-Match")) return false;
        
        var requestETag = Request.Headers.IfNoneMatch.ToString();
        var currentETag = GenerateETag(content);
        return requestETag == currentETag;
    }

    private static string GenerateETag(string content)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(content));
        return "\"" + Convert.ToBase64String(hash) + "\"";
    }

    private async Task InvalidateCachePattern(string pattern)
    {
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        var db = _redis.GetDatabase();
        
        // Phải khớp với InstanceName trong Program.cs
        string fullPattern = "ShopOrbit_Catalog_" + pattern; 

        var keys = server.Keys(pattern: fullPattern).ToArray();
        
        if (keys.Any())
        {
            await db.KeyDeleteAsync(keys);
        }
    }
}

public record ProductDto(
    Guid Id,
    string Name,
    decimal Price,
    string Description,
    int StockQuantity, 
    string CategoryName,
    Guid CategoryId,    
    string? ImageUrl,
    Dictionary<string, string>? Specifications
);