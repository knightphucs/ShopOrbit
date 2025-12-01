using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.Models;

namespace ShopOrbit.Catalog.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ProductsController : ControllerBase
{
    private readonly IDistributedCache _cache;
    private readonly CatalogDbContext _context;

    public ProductsController(IDistributedCache cache, CatalogDbContext context)
    {
        _cache = cache;
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff,User")]
    public async Task<IActionResult> GetProducts()
    {
        string cacheKey = "catalog:products:all";
        
        // Check Redis Cache
        var cachedData = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cachedData))
        {
            if (CheckETag(cachedData)) return StatusCode(304);

            return Ok(JsonSerializer.Deserialize<List<ProductDto>>(cachedData));
        }

        var products = new List<ProductDto> 
        { 
            new(Guid.NewGuid(), "IPhone 15", 999), 
            new(Guid.NewGuid(), "Samsung S24", 888) 
        };

        var options = new DistributedCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
            .SetSlidingExpiration(TimeSpan.FromMinutes(2));
        
        string jsonData = JsonSerializer.Serialize(products);
        await _cache.SetStringAsync(cacheKey, jsonData, options);

        // Set HTTP Cache Headers
        Response.Headers.Append("Cache-Control", "public, max-age=60"); // Client cache 60s
        SetETag(jsonData);

        return Ok(products);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateProduct([FromBody] Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        
        await _cache.RemoveAsync("catalog:products:all");

        return Ok(new { Message = "Product created", Id = product.Id });
    }

    private void SetETag(string content)
    {
        var etag = GenerateETag(content);
        Response.Headers.Append("ETag", etag);
    }

    private bool CheckETag(string content)
    {
        var requestETag = Request.Headers.IfNoneMatch.ToString();
        var currentETag = GenerateETag(content);
        return requestETag == currentETag;
    }

    private static string GenerateETag(string content)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(content));
        return "\"" + Convert.ToBase64String(hash) + "\"";
    }
}

public record ProductDto(Guid Id, string Name, decimal Price);