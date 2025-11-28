import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../prisma/prisma.service';
import { ObjectVersionsModule } from '../object-versions/object-versions.module';

/**
 * 🔍 Moderation Module
 * 
 * Handles moderation workflow and queue management:
 * - Moderation queue viewing and management
 * - Approval/rejection of pending versions
 * - Bulk operations for moderators
 * - Moderation statistics and history
 * - Moderator assignment system
 */
@Module({
  imports: [ObjectVersionsModule], // Import ObjectVersionsModule to access ObjectVersionsService
  controllers: [ModerationController],
  providers: [
    ModerationService,
    PrismaService,
  ],
  exports: [ModerationService],
})
export class ModerationModule {}