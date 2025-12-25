using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ShopOrbit.Identity.API.Models;
using ShopOrbit.Identity.API.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Web;

namespace ShopOrbit.Identity.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IConfiguration configuration,
        IEmailSender emailSender)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _emailSender = emailSender;
    }

    // register

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest model)
    {
        var userExists = await _userManager.FindByNameAsync(model.Username);
        if (userExists != null)
            return BadRequest(new { Message = "User already exists!" });

        var emailExists = await _userManager.FindByEmailAsync(model.Email);
        if (emailExists != null)
            return BadRequest(new { Message = "Email already registered!" });

        ApplicationUser user = new()
        {
            Email = model.Email,
            SecurityStamp = Guid.NewGuid().ToString(),
            UserName = model.Username,
            FullName = model.FullName
        };

        var result = await _userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                Message = "User creation failed",
                Errors = result.Errors.Select(e => e.Description)
            });
        }

        // new role default as user
        if (!await _roleManager.RoleExistsAsync("User"))
            await _roleManager.CreateAsync(new IdentityRole("User"));

        await _userManager.AddToRoleAsync(user, "User");

        // send email confirm
        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var encodedToken = HttpUtility.UrlEncode(token);

        //var baseUrl = _configuration["FrontendSettings:BaseUrl"] ?? "http://localhost:5051/api/v1/auth";
        //var confirmUrl = $"{baseUrl}/confirm-email?userId={user.Id}&token={encodedToken}";
        
        var frontendBase = _configuration["FrontendSettings:BaseUrl"] ?? "http://localhost:3000";
        var confirmUrl = $"{frontendBase}/confirm-email?userId={user.Id}&token={encodedToken}";

        


        await _emailSender.SendEmailAsync(user.Email!, "Confirm your ShopOrbit account",
            $"Xin chào {user.FullName},\n\n" +
            $"Vui lòng xác nhận email bằng cách truy cập link sau:\n{confirmUrl}\n\n" +
            $"Nếu bạn không tạo tài khoản, hãy bỏ qua email này.");

        return Ok(new { Message = "User created successfully! Please check your email to confirm your account." });
    }

    // email confirm

    [HttpGet("confirm-email")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return BadRequest(new { Message = "Invalid user" });

        // IMPORTANT: token in URL is UrlEncoded in Register, so decode it here
        var decodedToken = HttpUtility.UrlDecode(token);

        var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                Message = "Email confirmation failed",
                Errors = result.Errors.Select(e => e.Description)
            });
        }

        return Ok(new { Message = "Email confirmed successfully. You can now log in." });
    }


    // login

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest model)
    {
        var user = await _userManager.FindByNameAsync(model.Username);
        if (user == null)
            return Unauthorized(new { Message = "Invalid username or password" });

        if (!await _userManager.CheckPasswordAsync(user, model.Password))
            return Unauthorized(new { Message = "Invalid username or password" });

        if (!user.EmailConfirmed)
            return BadRequest(new { Message = "Email is not confirmed yet" });

        var userRoles = await _userManager.GetRolesAsync(user);

        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        // Add role and role claims (permission)
        foreach (var role in userRoles)
        {
            authClaims.Add(new Claim(ClaimTypes.Role, role));

            var roleEntity = await _roleManager.FindByNameAsync(role);
            if (roleEntity != null)
            {
                var roleClaims = await _roleManager.GetClaimsAsync(roleEntity);
                foreach (var rc in roleClaims)
                {
                    authClaims.Add(rc);
                }
            }
        }

        var token = GetToken(authClaims);

        return Ok(new
        {
            token = new JwtSecurityTokenHandler().WriteToken(token),
            expiration = token.ValidTo
        });
    }

    // forgot password

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return Ok(new { Message = "If the email exists, a reset link has been sent." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encodedToken = HttpUtility.UrlEncode(token);

        var baseUrl = _configuration["FrontendSettings:BaseUrl"] ?? "http://localhost:5051/api/v1/auth";
        var resetUrl = $"{baseUrl}/reset-password?userId={user.Id}&token={encodedToken}";

        await _emailSender.SendEmailAsync(user.Email!, "Reset your ShopOrbit password",
            $"Xin chào {user.FullName},\n\n" +
            $"Bạn đã yêu cầu đặt lại mật khẩu. Truy cập link sau để đặt lại mật khẩu:\n{resetUrl}\n\n" +
            $"Nếu bạn không yêu cầu, hãy bỏ qua email này.");

        return Ok(new { Message = "If the email exists, a reset link has been sent." });
    }

    // password reset

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return BadRequest(new { Message = "Invalid user" });
        
        var decodedToken = HttpUtility.UrlDecode(request.Token);
        
        var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                Message = "Reset password failed",
                Errors = result.Errors.Select(e => e.Description)
            });
        }

        return Ok(new { Message = "Password reset successfully" });
    }

    // current user info

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userName = User.Identity?.Name;
        if (userName == null) return Unauthorized();

        var user = await _userManager.FindByNameAsync(userName);
        if (user == null) return Unauthorized();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.FullName,
            Roles = roles
        });
    }

    // password change

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userName = User.Identity?.Name;
        if (userName == null) return Unauthorized();

        var user = await _userManager.FindByNameAsync(userName);
        if (user == null) return Unauthorized();

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                Message = "Change password failed",
                Errors = result.Errors.Select(e => e.Description)
            });
        }

        return Ok(new { Message = "Password changed successfully" });
    }

    // create jwt

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        var authSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            expires: DateTime.Now.AddMinutes(double.Parse(_configuration["JwtSettings:ExpiryMinutes"]!)),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return token;
    }
    
    [Authorize(Roles = "Admin")]
    [HttpPost("assign-role")]
    public async Task<IActionResult> AssignRole([FromBody] AssignRoleRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return NotFound(new { Message = "User not found" });

        if (!await _roleManager.RoleExistsAsync(request.Role))
            return BadRequest(new { Message = "Role does not exist" });

        // Xoá role cũ nếu muốn user chỉ có 1 role
        var existingRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, existingRoles);

        // Gán role mới
        await _userManager.AddToRoleAsync(user, request.Role);

        return Ok(new { Message = $"Assigned role '{request.Role}' to user '{request.Email}'" });
    }

}

// DTOs

public record RegisterRequest(string Username, string Email, string Password, string FullName);
public record LoginRequest(string Username, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string UserId, string Token, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record AssignRoleRequest(string Email, string Role);
