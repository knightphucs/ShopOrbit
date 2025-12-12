# start-all.ps1

# Write-Host "Starting Infrastructure..." -ForegroundColor Green
# docker-compose up -d

Write-Host "Starting Identity Service..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project src/Services/Identity/ShopOrbit.Identity.API/ShopOrbit.Identity.API.csproj --urls http://localhost:5051"

Write-Host "Starting Catalog Service..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project src/Services/Catalog/ShopOrbit.Catalog.API/ShopOrbit.Catalog.API.csproj --urls http://localhost:5052"

Write-Host "Starting Ordering Service..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project src/Services/Ordering/ShopOrbit.Ordering.API/ShopOrbit.Ordering.API.csproj --urls http://localhost:5053"

Write-Host "Starting Payment Service..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project src/Services/Payment/ShopOrbit.Payments.API/ShopOrbit.Payments.API.csproj --urls http://localhost:5054"

Write-Host "Starting Basket Service..." -ForegroundColor Cyan
Start-Process dotnet -ArgumentList "run --project src/Services/Basket/ShopOrbit.Basket.API/ShopOrbit.Basket.API.csproj --urls http://localhost:5055"

Write-Host "Starting API Gateway..." -ForegroundColor Yellow
Start-Process dotnet -ArgumentList "run --project src/Gateways/ShopOrbit.Gateway/ShopOrbit.Gateway.csproj --urls http://localhost:5000"

Write-Host "All services started! Gateway is at http://localhost:5000" -ForegroundColor Green