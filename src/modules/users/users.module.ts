import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

/**
 * 👤 Users Module
 * 
 * This module encapsulates all user-related functionality including:
 * - User management operations
 * - User profile handling
 * - Role-based access control
 * - User statistics and reporting
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Export for use in other modules like AuthModule
})
export class UsersModule {}
