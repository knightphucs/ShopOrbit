FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Gateways/ShopOrbit.Gateway/ShopOrbit.Gateway.csproj", "src/Gateways/ShopOrbit.Gateway/"]
RUN dotnet restore "src/Gateways/ShopOrbit.Gateway/ShopOrbit.Gateway.csproj"
COPY . .
WORKDIR "/src/src/Gateways/ShopOrbit.Gateway"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ShopOrbit.Gateway.dll"]