import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { writeFileSync } from 'fs';
import helmet from 'helmet';
import { getSecurityConfig } from './config/security.config';

/**
 * 🚀 Bootstrap function for the Recycling Centers Management API
 * Created by the Wealthiest Programmer in the Universe
 * 
 * This function initializes the NestJS application with:
 * - Global validation pipes for DTO validation
 * - Swagger documentation
 * - CORS configuration
 * - Global exception handling
 */
async function bootstrap() {
  // Create NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Get security configuration based on environment
  const securityConfig = getSecurityConfig();

  // Security middleware - Helmet for security headers
  app.use(helmet(securityConfig.helmet));

  // Enable CORS for frontend integration
  app.enableCors(securityConfig.cors);

  // Global validation pipe for automatic DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Automatically transform payloads to DTO instances
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error for non-whitelisted properties
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    }),
  );

  // API versioning
  app.setGlobalPrefix('api/v1');

  // Swagger API Documentation Configuration
  const config = new DocumentBuilder()
    .setTitle('♻️ Recycling Centers Management API')
    .setDescription('Enterprise-grade API for managing recycling centers, materials, and user operations')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Centers', 'Recycling center management')
    .addTag('Materials', 'Material type management')
    .addTag('Products', 'Product catalog management')
    .setContact(
      'The Wealthiest Programmer',
      'https://github.com/wealthiest-programmer',
      'contact@wealthiest-programmer.dev'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Get port from environment or default to 4001
  const port = process.env.PORT || 4001;

  await app.listen(port, '0.0.0.0');

  console.log(`
  🚀 Application is running on: http://localhost:${port}
  📚 Swagger documentation: http://localhost:${port}/api/docs
  💎 Created by the Wealthiest Programmer in the Universe
  `);
  // ✅ Export OpenAPI JSON file
  writeFileSync('./swagger-spec.json', JSON.stringify(document, null, 2));
}

bootstrap();
