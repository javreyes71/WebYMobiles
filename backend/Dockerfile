# Multi-stage Dockerfile compatible con x86_64 (PC) y linux/arm64 (Raspberry Pi)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["Vento.sln", "./"]
COPY ["Vento.Api/Vento.Api.csproj", "Vento.Api/"]
RUN dotnet restore "Vento.Api/Vento.Api.csproj"

COPY ["Vento.Api/", "Vento.Api/"]
RUN dotnet publish "Vento.Api/Vento.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://0.0.0.0:5000
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 5000

USER $APP_UID
ENTRYPOINT ["dotnet", "Vento.Api.dll"]
