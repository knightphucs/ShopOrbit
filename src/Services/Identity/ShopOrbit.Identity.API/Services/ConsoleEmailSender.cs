using System.Text;

namespace ShopOrbit.Identity.API.Services;

public class ConsoleEmailSender : IEmailSender
{
    public Task SendEmailAsync(string toEmail, string subject, string body)
    {
        var sb = new StringBuilder();
        sb.AppendLine("     EMAIL DEMO     ");
        sb.AppendLine("To: " + toEmail);
        sb.AppendLine("Subject: " + subject);
        sb.AppendLine("About:");
        sb.AppendLine(body);
        sb.AppendLine("-----------------------");

        Console.WriteLine(sb.ToString());
        return Task.CompletedTask;
    }
}