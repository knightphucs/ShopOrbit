using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using ShopOrbit.Identity.API.Models;

namespace ShopOrbit.Identity.API.Data;

public static class SeedData
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        string[] roleNames = ["Admin", "Staff", "User"];

        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        // Seed Admin user
        var adminEmail = "admin@shoporbit.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = "admin",
                Email = adminEmail,
                FullName = "System Administrator",
                // no need to confirm the email for the test accout
                EmailConfirmed = true
            };
            await userManager.CreateAsync(adminUser, "Admin@123");
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }

        // Seed Staff user
        var staffEmail = "staff@shoporbit.com";
        var staffUser = await userManager.FindByEmailAsync(staffEmail);
        if (staffUser == null)
        {
            staffUser = new ApplicationUser
            {
                UserName = "staff",
                Email = staffEmail,
                FullName = "Support Staff",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(staffUser, "Staff@123");
            await userManager.AddToRoleAsync(staffUser, "Staff");
        }

        // Seed permissions cho roles
        string[] adminPermissions =
        {
            "product.manage",   // CRUD product
            "order.manage"      // CRUD order
        };
        
        //  Staff 

        string[] staffPermissions =
        {
            "product.manage",   
            "order.manage"     
        };
        
        //user

        string[] userPermissions =
        {
            "order.create",     
            "order.view-own"    
        };

        await AddPermissionsToRole("Admin", adminPermissions, roleManager);
        await AddPermissionsToRole("Staff", staffPermissions, roleManager);
        await AddPermissionsToRole("User", userPermissions, roleManager);
        
        
    }
    
    
    

    private static async Task AddPermissionsToRole(string roleName, string[] permissions, RoleManager<IdentityRole> roleManager)
    {
        var role = await roleManager.FindByNameAsync(roleName);
        if (role == null) return;

        var existingClaims = await roleManager.GetClaimsAsync(role);

        foreach (var permission in permissions)
        {
            if (!existingClaims.Any(c => c.Type == "permission" && c.Value == permission))
            {
                await roleManager.AddClaimAsync(role, new Claim("permission", permission));
            }
        }
    }
}
