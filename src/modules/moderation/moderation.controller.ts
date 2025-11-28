import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { ApproveVersionDto, RejectVersionDto } from '../object-versions/dto/object-version.dto';
import { CreateVersionReviewDto } from './dto/version-review.dto';
import { UpdateModerationConfigDto } from './dto/moderation-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * 🔎 Moderation Controller
 * 
 * Handles community-driven moderation workflow:
 * - GET /moderation/queue - View pending items (ALL USERS)
 * - POST /moderation/versions/:id/review - Submit community review (ALL USERS)
 * - GET /moderation/versions/:id/reviews - Get review statistics
 * - POST /moderation/:id/approve - Admin override approve
 * - POST /moderation/:id/reject - Admin override reject
 * - GET /moderation/stats - Moderation statistics
 */
@ApiTags('Collaboration - Moderation')
@Controller('moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  /**
   * 📋 Get moderation queue
   * View all pending items that need review (OPEN TO ALL USERS)
   */
  @Get('queue')
  @ApiOperation({ 
    summary: 'Get moderation queue',
    description: 'Retrieve all pending items waiting for community review. Any logged user can view and review these items.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ 
    name: 'objectType', 
    required: false, 
    enum: ['molecule', 'protein', 'reaction', 'article'],
    description: 'Filter by object type (molecule, protein, reaction, article)' 
  })
  @ApiResponse({ status: 200, description: 'Queue retrieved successfully' })
  async getQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('objectType') objectType?: 'molecule' | 'protein' | 'reaction' | 'article',
    @Request() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const moderatorId = req?.user?.id;

    return this.moderationService.getModerationQueue(moderatorId, pageNum, limitNum, objectType);
  }

  /**
   * ✅ Submit community review for a version
   * ANY logged user can submit a review (except for their own changes)
   */
  @Post('versions/:versionId/review')
  @ApiOperation({ 
    summary: 'Submit community review',
    description: 'Submit your review (approve/reject) for a pending version. Your reputation score will be added to the total. Versions auto-approve when approval votes reach 100 reputation points, or auto-reject when rejection votes reach 100.'
  })
  @ApiParam({ name: 'versionId', description: 'Version ID to review' })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 403, description: 'Cannot review own changes or already reviewed' })
  @ApiResponse({ status: 404, description: 'Version not found' })
  async submitReview(
    @Param('versionId') versionId: string,
    @Body() reviewDto: CreateVersionReviewDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.moderationService.submitReview(versionId, userId, reviewDto.vote, reviewDto.comment);
  }

  /**
   * 📊 Get review statistics for a version
   */
  @Get('versions/:versionId/reviews')
  @ApiOperation({ 
    summary: 'Get version review statistics',
    description: 'View all reviews, reputation scores, and approval/rejection progress for a specific version'
  })
  @ApiParam({ name: 'versionId', description: 'Version ID' })
  @ApiResponse({ status: 200, description: 'Review statistics retrieved' })
  async getVersionReviews(@Param('versionId') versionId: string) {
    return this.moderationService.getVersionReviewStats(versionId);
  }

  /**
   * ✅ Approve item from queue (ADMIN OVERRIDE)
   * Admins can directly approve without reputation threshold
   */
  @Post('queue/:id/approve')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: '[ADMIN] Force approve item',
    description: 'Admin override: Directly approve a pending version bypassing community review process'
  })
  @ApiParam({ name: 'id', description: 'Moderation queue item ID' })
  @ApiResponse({ status: 200, description: 'Item approved successfully' })
  @ApiResponse({ status: 404, description: 'Queue item not found' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async approveFromQueue(
    @Param('id') queueItemId: string,
    @Request() req: any,
    @Body() approveDto: ApproveVersionDto,
  ) {
    const moderatorId = req.user.id;
    return this.moderationService.approveFromQueue(queueItemId, moderatorId, approveDto.notes);
  }

  /**
   * ❌ Reject item from queue (ADMIN OVERRIDE)
   * Admins can directly reject without reputation threshold
   */
  @Post('queue/:id/reject')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ 
    summary: '[ADMIN] Force reject item',
    description: 'Admin override: Directly reject a pending version bypassing community review process'
  })
  @ApiParam({ name: 'id', description: 'Moderation queue item ID' })
  @ApiResponse({ status: 200, description: 'Item rejected successfully' })
  @ApiResponse({ status: 404, description: 'Queue item not found' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async rejectFromQueue(
    @Param('id') queueItemId: string,
    @Request() req: any,
    @Body() rejectDto: RejectVersionDto,
  ) {
    const moderatorId = req.user.id;
    return this.moderationService.rejectFromQueue(queueItemId, moderatorId, rejectDto.notes);
  }

  /**
   * 👥 Assign moderator to queue item
   */
  @Post('queue/:id/assign')
  @ApiOperation({ 
    summary: 'Assign moderator to queue item',
    description: 'Assign a moderator to review a specific queue item'
  })
  @ApiParam({ name: 'id', description: 'Moderation queue item ID' })
  @ApiResponse({ status: 200, description: 'Moderator assigned successfully' })
  @ApiResponse({ status: 404, description: 'Queue item not found' })
  async assignModerator(
    @Param('id') queueItemId: string,
    @Request() req: any,
  ) {
    const moderatorId = req.user.id;
    return this.moderationService.assignModerator(queueItemId, moderatorId);
  }

  /**
   * 🔍 Get specific queue item details
   */
  @Get('queue/:id')
  @ApiOperation({ 
    summary: 'Get queue item details',
    description: 'Retrieve detailed information about a specific moderation queue item'
  })
  @ApiParam({ name: 'id', description: 'Moderation queue item ID' })
  async getQueueItem(@Param('id') queueItemId: string) {
    return this.moderationService.getQueueItem(queueItemId);
  }

  /**
   * 📊 Get moderation statistics
   */
  @Get('stats')
  @ApiOperation({ 
    summary: 'Get moderation statistics',
    description: 'Retrieve comprehensive moderation statistics and metrics'
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@Request() req?: any) {
    const moderatorId = req?.user?.role === 'ADMIN' ? undefined : req?.user?.id;
    return this.moderationService.getModerationStats(moderatorId);
  }

  /**
   * 📈 Get moderation history
   */
  @Get('history')
  @ApiOperation({ 
    summary: 'Get moderation history',
    description: 'Retrieve history of reviewed items'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'History retrieved successfully' })
  async getHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Request() req?: any,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const moderatorId = req?.user?.role === 'ADMIN' ? undefined : req?.user?.id;

    return this.moderationService.getModerationHistory(moderatorId, pageNum, limitNum);
  }

  /**
   * 🚀 Bulk approve multiple items
   */
  @Post('bulk/approve')
  @ApiOperation({ 
    summary: 'Bulk approve queue items',
    description: 'Approve multiple queue items at once'
  })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  async bulkApprove(
    @Body() body: { queueItemIds: string[]; notes?: string },
    @Request() req: any,
  ) {
    const moderatorId = req.user.id;
    return this.moderationService.bulkApprove(body.queueItemIds, moderatorId, body.notes);
  }

  /**
   * 🚀 Bulk reject multiple items
   */
  @Post('bulk/reject')
  @ApiOperation({ 
    summary: 'Bulk reject queue items',
    description: 'Reject multiple queue items at once'
  })
  @ApiResponse({ status: 200, description: 'Bulk operation completed' })
  async bulkReject(
    @Body() body: { queueItemIds: string[]; notes?: string },
    @Request() req: any,
  ) {
    const moderatorId = req.user.id;
    return this.moderationService.bulkReject(body.queueItemIds, moderatorId, body.notes);
  }

  /**
   * 🏆 Get top moderators
   */
  @Get('top-moderators')
  @Roles('ADMIN') // Only admins can see this
  @ApiOperation({ 
    summary: 'Get top moderators by activity',
    description: 'Retrieve list of most active moderators'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of top moderators to return' })
  async getTopModerators(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.moderationService.getTopModerators(limitNum);
  }

  /**
   * ⚙️ Get moderation configuration
   */
  @Get('config')
  @ApiOperation({ 
    summary: 'Get moderation configuration',
    description: 'Retrieve current moderation thresholds and settings'
  })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  async getConfig() {
    return this.moderationService.getModerationConfig();
  }

  /**
   * ⚙️ Update moderation configuration (ADMIN ONLY)
   */
  @Patch('config')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Update moderation configuration',
    description: 'Update moderation thresholds and settings. Only admins can modify these settings.'
  })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 403, description: 'Admin privileges required' })
  async updateConfig(
    @Body() updateDto: UpdateModerationConfigDto,
    @Request() req: any,
  ) {
    const adminId = req.user.id;
    return this.moderationService.updateModerationConfig(updateDto, adminId);
  }
}