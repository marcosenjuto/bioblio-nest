import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { getSecurityConfig } from './config/security.config';

// Core modules
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';

// Feature modules
import { UsersModule } from './modules/users/users.module';
import { MoleculesModule } from './modules/molecules/molecules.module';
import { ProteinsModule } from './modules/proteins/proteins.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { ObjectVersionsModule } from './modules/object-versions/object-versions.module';
import { ModerationModule } from './modules/moderation/moderation.module';

/**
 * 🏗️ Root Application Module
 * 
 * This is the main module that orchestrates all other modules in the application.
 * It follows the modular architecture pattern for maximum scalability and maintainability.
 * 
 * Features included:
 * - Environment configuration
 * - Rate limiting (throttling)
 * - Database connection (Prisma)
 * - Authentication system
 * - Collaboration system with versioning
 * - Moderation workflow and queue
 * - All business logic modules
 */
@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      envFilePath: '.env',
    }),

    // Rate limiting to prevent abuse
    ThrottlerModule.forRoot(getSecurityConfig().throttle),

    // Core infrastructure modules
    PrismaModule,
    AuthModule,

    // Business logic modules
    UsersModule,
    MoleculesModule,
    ProteinsModule,
    ReactionsModule,
    ArticlesModule,
    ObjectVersionsModule,
    ModerationModule,
  ],
})
export class AppModule {}
