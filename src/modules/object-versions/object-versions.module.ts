import { Module } from '@nestjs/common';
import { ObjectVersionsService } from './object-versions.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 🔄 Object Versions Module
 * 
 * Handles collaborative editing with version control:
 * - Version creation and management
 * - Approval/rejection workflow
 * - Reputation-based auto-approval
 * - Current version tracking
 * 
 * Note: This module provides services only. Version operations are exposed through:
 * - /api/v1/centers/:id/propose-changes (user proposals)
 * - /api/v1/moderation/* endpoints (moderation workflow)
 */
@Module({
  controllers: [],
  providers: [
    ObjectVersionsService,
    PrismaService,
  ],
  exports: [ObjectVersionsService],
})
export class ObjectVersionsModule {}