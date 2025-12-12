using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShopOrbit.Basket.API.Data;
using ShopOrbit.Basket.API.Models;

namespace ShopOrbit.Basket.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BasketController : ControllerBase
{
    private readonly IBasketRepository _repository;

    public BasketController(IBasketRepository repository)
    {
        _repository = repository;
    }

    private string GetUserIdFromToken()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "anonymous";
    }

    [HttpGet]
    public async Task<ActionResult<ShoppingCart>> GetBasket()
    {
        var userId = GetUserIdFromToken();
        var basket = await _repository.GetBasketAsync(userId);
        return Ok(basket ?? new ShoppingCart(userId));
    }

    [HttpPost]
    public async Task<ActionResult<ShoppingCart>> UpdateBasket([FromBody] ShoppingCart basket)
    {
        var userId = GetUserIdFromToken();
        basket.UserName = userId;

        return Ok(await _repository.UpdateBasketAsync(basket));
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteBasket()
    {
        var userId = GetUserIdFromToken();
        await _repository.DeleteBasketAsync(userId);
        return Ok();
    }
}