FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Services/Basket/ShopOrbit.Basket.API/ShopOrbit.Basket.API.csproj", "src/Services/Basket/ShopOrbit.Basket.API/"]
RUN dotnet restore "src/Services/Basket/ShopOrbit.Basket.API/ShopOrbit.Basket.API.csproj"
COPY . .
WORKDIR "/src/src/Services/Basket/ShopOrbit.Basket.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ShopOrbit.Basket.API.dll"]