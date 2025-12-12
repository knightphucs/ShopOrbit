FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Copy csproj và restore
COPY ["src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj", "src/Services/Identity/ShopOrbit.Identity.API/"]
COPY ["src/BuildingBlocks/ShopOrbit.BuildingBlocks/ShopOrbit.BuildingBlocks.csproj", "src/BuildingBlocks/ShopOrbit.BuildingBlocks/"]
RUN dotnet restore "src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj"
# Copy toàn bộ code
COPY . .
WORKDIR "/src/src/Services/Identity/ShopOrbit.Identity.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ShopOrbit.Identity.API.dll"]