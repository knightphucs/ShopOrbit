namespace ShopOrbit.Identity.API.Services;

public interface IEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}