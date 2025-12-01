using Microsoft.AspNetCore.Identity;

namespace ShopOrbit.Identity.API.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = default!;
}