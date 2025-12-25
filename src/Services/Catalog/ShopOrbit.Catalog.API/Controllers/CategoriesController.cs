using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using ShopOrbit.Catalog.API.Data;
using ShopOrbit.Catalog.API.DTOs;
using ShopOrbit.Catalog.API.Models;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Asp.Versioning;

namespace ShopOrbit.Catalog.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly CatalogDbContext _context;
    private readonly IDistributedCache _cache;

    public CategoriesController(CatalogDbContext context, IDistributedCache cache)
    {
        _context = context;
        _cache = cache;
    }

    // GET ALL
    [HttpGet]
    [Authorize(Roles = "Admin,Staff,User")]
    public async Task<IActionResult> GetCategories([FromQuery] CategorySpecParams spec)
    {
        string cacheKey = GenerateCacheKeyFromParams(spec);

        // A. Check REDIS cache
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            if (CheckETag(cached)) return StatusCode(304);

            return Ok(JsonSerializer.Deserialize<PagedResult<CategoryDto>>(cached));
        }

        // B. Query DB
        var query = _context.Categories.AsQueryable();

        // Filtering
        if (!string.IsNullOrEmpty(spec.Search))
        {
            query = query.Where(c => c.Name.ToLower().Contains(spec.Search.ToLower()));
        }

        // Sorting
        query = spec.Sort switch
        {
            "nameDesc" => query.OrderByDescending(c => c.Name),
            _ => query.OrderBy(c => c.Name)
        };

        // Pagination
        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((spec.PageIndex - 1) * spec.PageSize)
            .Take(spec.PageSize)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description, c.Updated_At))
            .ToListAsync();

        var result = new PagedResult<CategoryDto>(items, totalCount, spec.PageIndex, spec.PageSize);

        // Save to Redis
        var options = new DistributedCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(2))
            .SetSlidingExpiration(TimeSpan.FromMinutes(1));

        string jsonData = JsonSerializer.Serialize(result);
        await _cache.SetStringAsync(cacheKey, jsonData, options);

        // Set HTTP ETag
        SetETag(jsonData);

        return Ok(result);
    }

    // GET BY ID
    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Staff,User")]
    public async Task<IActionResult> GetCategoryById(Guid id)
    {
        string cacheKey = $"catalog:category:{id}";

        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
            return Ok(JsonSerializer.Deserialize<Category>(cached));

        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(category),
            new DistributedCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromMinutes(10)));

        return Ok(category);
    }

    // CREATE — Admin only
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCategory([FromBody] Category category)
    {
        category.Id = Guid.NewGuid();
        category.Updated_At = DateTime.UtcNow;

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategoryById), new { id = category.Id }, category);
    }

    // UPDATE 
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] Category update)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        category.Name = update.Name;
        category.Description = update.Description;
        category.Updated_At = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Remove cache
        await _cache.RemoveAsync($"catalog:category:{id}");

        return NoContent();
    }

    // DELETE — Admin only + Prevent delete if referenced in Products
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        bool inUse = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (inUse)
            return BadRequest("Category is currently used by products and cannot be deleted.");

        var category = await _context.Categories.FindAsync(id);
        if (category == null) return NotFound();

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        await _cache.RemoveAsync($"catalog:category:{id}");

        return NoContent();
    }

    // Helpers
    private string GenerateCacheKeyFromParams(CategorySpecParams spec)
    {
        return $"catalog:categories:p{spec.PageIndex}_s{spec.PageSize}_q{spec.Search}_sort{spec.Sort}";
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

        string requestEtag = Request.Headers.IfNoneMatch!;
        string currentEtag = GenerateETag(content);

        return requestEtag == currentEtag;
    }

    private static string GenerateETag(string content)
    {
        var hash = MD5.HashData(Encoding.UTF8.GetBytes(content));
        return "\"" + Convert.ToBase64String(hash) + "\"";
    }
}

