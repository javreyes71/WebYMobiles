using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Vento.Api.Data;
using Vento.Api.DTOs;
using Vento.Api.Middlewares;
using Vento.Api.Seeds;

var builder = WebApplication.CreateBuilder(args);

// Configuración de controladores y formato de respuesta JSON
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Valor inválido en la solicitud." : e.ErrorMessage)
                .ToList();

            var body = ApiResponse<object?>.Fail("Datos inválidos.", errors);
            return new BadRequestObjectResult(body);
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Conexión a PostgreSQL mediante Entity Framework Core
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Port=5432;Database=vento_bd2;Username=vento_app;Password=CAMBIAR_PASSWORD_SEGURO";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Autenticación JWT Bearer y autorización
var jwtKey = builder.Configuration["Jwt:Key"] ?? "Clave_Fallback_Solo_Desarrollo_Minimo_32_Bytes_2026!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Vento.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Vento.Frontend";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(
                    ApiResponse.Fail("Falta autenticarse para acceder.", "Token JWT ausente, inválido o expirado."));
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(
                    ApiResponse.Fail("Autenticado, pero sin permiso para esta acción.", "Su rol actual no está autorizado para este recurso."));
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<Vento.Api.Services.AuthAndUserService>();
builder.Services.AddScoped<Vento.Api.Services.CatalogoService>();

// Configuración de CORS para el frontend
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins.Length > 0 && !allowedOrigins.Contains("*"))
        {
            policy.SetIsOriginAllowed(origin =>
                    allowedOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase)
                    || origin.StartsWith("http://localhost:", StringComparison.OrdinalIgnoreCase)
                    || origin.StartsWith("http://127.0.0.1:", StringComparison.OrdinalIgnoreCase)
                    || origin.StartsWith("http://192.168.", StringComparison.OrdinalIgnoreCase)
                    || origin.StartsWith("http://10.", StringComparison.OrdinalIgnoreCase))
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
        else
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});

var app = builder.Build();

// Middleware global de excepciones (captura fallos inesperados y triggers BD2)
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Semilla automática opcional cuando PostgreSQL está accesible
if (app.Configuration.GetValue<bool>("Database:AutoApplyExtensionsAndSeed", true))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DbSeeder");
    await DbSeeder.SeedAsync(db, logger);
}

app.Run();
