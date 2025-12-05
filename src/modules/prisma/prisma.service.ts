import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 💎 Prisma Service - Database Connection Management
 * 
 * This service manages the Prisma database connection and provides
 * a centralized way to access the database throughout the application.
 * 
 * Features:
 * - Automatic connection on module initialization
 * - Graceful disconnection on module destruction
 * - Connection pooling and optimization
 * - Error handling and logging
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      // Connection configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Logging configuration for development
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    });
  }

  /**
   * Initialize the database connection when the module starts
   */
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('💎 Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  /**
   * Gracefully disconnect from the database when the module is destroyed
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }

  /**
   * Helper method to handle database operations with error logging
   */
  async executeWithErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }
}
