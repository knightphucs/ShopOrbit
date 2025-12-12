using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using ShopOrbit.Basket.API.Models;

namespace ShopOrbit.Basket.API.Data;

public interface IBasketRepository
{
    Task<ShoppingCart?> GetBasketAsync(string userName);
    Task<ShoppingCart?> UpdateBasketAsync(ShoppingCart basket);
    Task DeleteBasketAsync(string userName);
}

public class BasketRepository : IBasketRepository
{
    private readonly IDistributedCache _redisCache;

    public BasketRepository(IDistributedCache redisCache)
    {
        _redisCache = redisCache;
    }

    public async Task<ShoppingCart?> GetBasketAsync(string userName)
    {
        var basket = await _redisCache.GetStringAsync(userName);
        if (string.IsNullOrEmpty(basket))
            return null;

        return JsonSerializer.Deserialize<ShoppingCart>(basket);
    }

    public async Task<ShoppingCart?> UpdateBasketAsync(ShoppingCart basket)
    {
        var json = JsonSerializer.Serialize(basket);
        
        await _redisCache.SetStringAsync(basket.UserName, json);

        return await GetBasketAsync(basket.UserName);
    }

    public async Task DeleteBasketAsync(string userName)
    {
        await _redisCache.RemoveAsync(userName);
    }
}