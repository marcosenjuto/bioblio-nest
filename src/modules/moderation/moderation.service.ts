import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

/**
 * 🔎 Moderation Queue Service
 * 
 * This service handles the community-driven moderation workflow:
 * - Queue management for pending versions
 * - Community review system with reputation-based voting
 * - Automatic approval when reputation threshold is reached
 * - Moderation statistics and analytics
 * 
 * RULES:
 * - Every logged user can review changes
 * - Each review contributes the reviewer's reputation score
 * - Versions auto-approve when accumulated approval votes reach threshold (default: 100)
 * - Versions auto-reject when accumulated reject votes reach threshold (default: 100)
 * - Users cannot review their own changes
 * - Each user can only review a version once
 */
@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  /**
   * 🔧 Get current moderation configuration from database
   */
  private async getConfig() {
    const config = await this.prisma.moderationConfig.findFirst();
    if (!config) {
      // Fallback to defaults if config doesn't exist
      return {
        approvalThreshold: 1,
        rejectionThreshold: 1,
        minReviewsRequired: 1,
      };
    }
    return config;
  }

  /**
   * ✅ Submit a community review for a version
   * Any logged user can review changes (except their own)
   * Each review contributes the user's reputation score
   * Auto-approves/rejects when threshold is reached
   */
  async submitReview(versionId: string, userId: string, vote: 'approve' | 'reject', comment?: string) {
    // Get the version to review
    const version = await this.prisma.objectVersion.findUnique({
      where: { id: versionId },
      include: {
        reviews: {
          include: {
            user: {
              select: { id: true, username: true, reputation: true },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    // Check if version is still pending
    if (version.status !== 'pending') {
      throw new ForbiddenException(`This version has already been ${version.status}`);
    }

    // Prevent users from reviewing their own changes
    if (version.userId === userId) {
      throw new ForbiddenException('You cannot review your own changes');
    }

    // Check if user already reviewed this version
    const existingReview = version.reviews.find(r => r.userId === userId);
    if (existingReview) {
      throw new ForbiddenException('You have already reviewed this version');
    }

    // Get user's current reputation
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { reputation: true, username: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create the review
    const review = await this.prisma.versionReview.create({
      data: {
        versionId,
        userId,
        vote,
        comment,
        reputationValue: user.reputation, // Snapshot reputation at review time
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            reputation: true,
          },
        },
      },
    });

    // Calculate total reputation scores
    const allReviews = await this.prisma.versionReview.findMany({
      where: { versionId },
    });

    const approvalScore = allReviews
      .filter(r => r.vote === 'approve')
      .reduce((sum, r) => sum + r.reputationValue, 0);

    const rejectionScore = allReviews
      .filter(r => r.vote === 'reject')
      .reduce((sum, r) => sum + r.reputationValue, 0);

    // Get current moderation configuration
    const config = await this.getConfig();

    // Check if thresholds are reached
    let autoDecision: 'approved' | 'rejected' | null = null;

    if (approvalScore >= config.approvalThreshold) {
      autoDecision = 'approved';
      // Auto-approve the version
      await this.objectVersionsService.approveVersion(versionId, userId, 
        `Auto-approved by community review (${approvalScore} reputation points)`);
    } else if (rejectionScore >= config.rejectionThreshold) {
      autoDecision = 'rejected';
      // Auto-reject the version
      await this.objectVersionsService.rejectVersion(versionId, userId,
        `Auto-rejected by community review (${rejectionScore} reputation points)`);
    }

    return {
      review,
      scores: {
        approvalScore,
        rejectionScore,
        approvalThreshold: config.approvalThreshold,
        rejectionThreshold: config.rejectionThreshold,
      },
      autoDecision,
      message: autoDecision 
        ? `Version ${autoDecision} automatically based on community reviews`
        : `Review submitted. Current scores - Approval: ${approvalScore}/${config.approvalThreshold}, Rejection: ${rejectionScore}/${config.rejectionThreshold}`,
    };
  }

  /**
   * 📊 Get review statistics for a version
   */
  async getVersionReviewStats(versionId: string) {
    const reviews = await this.prisma.versionReview.findMany({
      where: { versionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            reputation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const approvalReviews = reviews.filter(r => r.vote === 'approve');
    const rejectionReviews = reviews.filter(r => r.vote === 'reject');

    const approvalScore = approvalReviews.reduce((sum, r) => sum + r.reputationValue, 0);
    const rejectionScore = rejectionReviews.reduce((sum, r) => sum + r.reputationValue, 0);

    // Get current moderation configuration
    const config = await this.getConfig();

    return {
      totalReviews: reviews.length,
      approvalCount: approvalReviews.length,
      rejectionCount: rejectionReviews.length,
      approvalScore,
      rejectionScore,
      approvalThreshold: config.approvalThreshold,
      rejectionThreshold: config.rejectionThreshold,
      approvalProgress: (approvalScore / config.approvalThreshold) * 100,
      rejectionProgress: (rejectionScore / config.rejectionThreshold) * 100,
      reviews,
    };
  }

  /**
   * 📋 Get pending items in moderation queue
   */
  async getModerationQueue(
    moderatorId?: string, 
    page = 1, 
    limit = 10,
    objectType?: 'molecule' | 'protein' | 'reaction' | 'article' // Filter by object type
  ) {
    const skip = (page - 1) * limit;
    
    // First, get all pending items
    const allPendingItems = await this.prisma.moderationQueue.findMany({
      where: {
        decision: null, // Only pending items
        reviewedAt: null,
      },
      include: {
        version: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                reputation: true,
              },
            },
            object: {
              include: {
                molecule: true,
                protein: true,
                reaction: true,
                article: true,
              },
            },
            reviews: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    reputation: true,
                  },
                },
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // FIFO order
    });

    // Filter by object type if specified
    let filteredItems = allPendingItems;
    if (objectType) {
      filteredItems = allPendingItems.filter(item => {
        const objectVar = item.version.object;
        switch (objectType) {
          case 'molecule': return !!objectVar.molecule;
          case 'protein': return !!objectVar.protein;
          case 'reaction': return !!objectVar.reaction;
          case 'article': return !!objectVar.article;
          default: return true;
        }
      });
    }

    // Apply pagination
    const total = filteredItems.length;
    const paginatedItems = filteredItems.slice(skip, skip + limit);

    // Transform data to include parsed JSON and object type
    const transformedItems = paginatedItems.map(item => {
      const objectVar = item.version.object;
      let detectedType = 'unknown';
      if (objectVar.molecule) detectedType = 'molecule';
      else if (objectVar.protein) detectedType = 'protein';
      else if (objectVar.reaction) detectedType = 'reaction';
      else if (objectVar.article) detectedType = 'article';
      
      // Parse the JSON fields
      const newData = JSON.parse(item.version.dataJson);
      const previousData = item.version.previousDataJson 
        ? JSON.parse(item.version.previousDataJson) 
        : null;
      const changedFields = item.version.changedFields 
        ? JSON.parse(item.version.changedFields) 
        : [];
      
      // Check if current user has already reviewed this version
      const userReview = moderatorId 
        ? item.version.reviews.find(review => review.userId === moderatorId)
        : null;
      
      return {
        ...item,
        objectType: detectedType,
        userReview: userReview ? {
          vote: userReview.vote,
          comment: userReview.comment,
          createdAt: userReview.createdAt,
        } : null,
        version: {
          ...item.version,
          data: newData,
          previousData, // Add parsed previous data
          changedFields, // Add parsed changed fields array
          // Remove redundant JSON strings from response
          dataJson: undefined,
          previousDataJson: undefined,
        },
      };
    });

    return {
      items: transformedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        objectType: objectType || 'all',
      },
    };
  }

  /**
   * ✅ Approve a version from moderation queue
   */
  async approveFromQueue(queueItemId: string, moderatorId: string, notes?: string) {
    const queueItem = await this.prisma.moderationQueue.findUnique({
      where: { id: queueItemId },
      include: { version: true },
    });

    if (!queueItem) {
      throw new NotFoundException(`Moderation queue item with ID ${queueItemId} not found`);
    }

    if (queueItem.decision !== null) {
      throw new ForbiddenException('This item has already been reviewed');
    }

    // Use the object versions service to approve
    return this.objectVersionsService.approveVersion(
      queueItem.versionId,
      moderatorId,
      notes,
    );
  }

  /**
   * ❌ Reject a version from moderation queue
   */
  async rejectFromQueue(queueItemId: string, moderatorId: string, notes?: string) {
    const queueItem = await this.prisma.moderationQueue.findUnique({
      where: { id: queueItemId },
      include: { version: true },
    });

    if (!queueItem) {
      throw new NotFoundException(`Moderation queue item with ID ${queueItemId} not found`);
    }

    if (queueItem.decision !== null) {
      throw new ForbiddenException('This item has already been reviewed');
    }

    // Use the object versions service to reject
    return this.objectVersionsService.rejectVersion(
      queueItem.versionId,
      moderatorId,
      notes,
    );
  }

  /**
   * 👥 Assign moderator to queue item
   */
  async assignModerator(queueItemId: string, moderatorId: string) {
    const queueItem = await this.prisma.moderationQueue.findUnique({
      where: { id: queueItemId },
    });

    if (!queueItem) {
      throw new NotFoundException(`Moderation queue item with ID ${queueItemId} not found`);
    }

    if (queueItem.decision !== null) {
      throw new ForbiddenException('This item has already been reviewed');
    }

    return this.prisma.moderationQueue.update({
      where: { id: queueItemId },
      data: { moderatorId },
      include: {
        version: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * 📊 Get moderation statistics
   */
  async getModerationStats(moderatorId?: string) {
    const baseWhere = moderatorId ? { moderatorId } : {};

    const [
      totalPending,
      totalApproved,
      totalRejected,
      totalAssigned,
      avgProcessingTime,
      allPendingItems,
    ] = await Promise.all([
      this.prisma.moderationQueue.count({
        where: { ...baseWhere, decision: null },
      }),
      this.prisma.moderationQueue.count({
        where: { ...baseWhere, decision: 'approved' },
      }),
      this.prisma.moderationQueue.count({
        where: { ...baseWhere, decision: 'rejected' },
      }),
      this.prisma.moderationQueue.count({
        where: { ...baseWhere, moderatorId: { not: null }, decision: null },
      }),
      this.getAverageProcessingTime(moderatorId),
      // Get all pending items to calculate object type breakdown
      this.prisma.moderationQueue.findMany({
        where: { ...baseWhere, decision: null },
        include: {
          version: {
            include: {
              object: {
                include: {
                  molecule: true,
                  protein: true,
                  reaction: true,
                  article: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Calculate object type breakdown
    const objectTypeBreakdown = {
      molecules: 0,
      proteins: 0,
      reactions: 0,
      articles: 0,
      unknown: 0,
    };

    allPendingItems.forEach(item => {
      const objectVar = item.version.object;
      if (objectVar.molecule) objectTypeBreakdown.molecules++;
      else if (objectVar.protein) objectTypeBreakdown.proteins++;
      else if (objectVar.reaction) objectTypeBreakdown.reactions++;
      else if (objectVar.article) objectTypeBreakdown.articles++;
      else objectTypeBreakdown.unknown++;
    });

    return {
      pending: totalPending,
      approved: totalApproved,
      rejected: totalRejected,
      assigned: totalAssigned,
      unassigned: totalPending - totalAssigned,
      averageProcessingTimeHours: avgProcessingTime,
      total: totalPending + totalApproved + totalRejected,
      byObjectType: objectTypeBreakdown,
    };
  }

  /**
   * 📈 Get moderation history
   */
  async getModerationHistory(moderatorId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const whereClause = {
      ...(moderatorId && { moderatorId }),
      decision: { not: null }, // Only reviewed items
    };

    const [items, total] = await Promise.all([
      this.prisma.moderationQueue.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { reviewedAt: 'desc' },
        include: {
          version: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          moderator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.moderationQueue.count({ where: whereClause }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 🔍 Get specific moderation queue item
   */
  async getQueueItem(queueItemId: string) {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id: queueItemId },
      include: {
        version: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                reputation: true,
              },
            },
            object: {
              include: {
                molecule: true,
                protein: true,
                reaction: true,
                article: true,
              },
            },
          },
        },
        moderator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Moderation queue item with ID ${queueItemId} not found`);
    }

    // Detect object type
    const objectVar = item.version.object;
    let objectType = 'unknown';
    if (objectVar.molecule) objectType = 'molecule';
    else if (objectVar.protein) objectType = 'protein';
    else if (objectVar.reaction) objectType = 'reaction';
    else if (objectVar.article) objectType = 'article';

    // Parse the JSON fields
    const newData = JSON.parse(item.version.dataJson);
    const previousData = item.version.previousDataJson 
      ? JSON.parse(item.version.previousDataJson) 
      : null;
    const changedFields = item.version.changedFields 
      ? JSON.parse(item.version.changedFields) 
      : [];

    return {
      ...item,
      objectType,
      version: {
        ...item.version,
        data: newData,
        previousData, // Add parsed previous data
        changedFields, // Add parsed changed fields array
        // Remove redundant JSON strings from response
        dataJson: undefined,
        previousDataJson: undefined,
      },
    };
  }

  /**
   * 🚀 Bulk approve multiple items
   */
  async bulkApprove(queueItemIds: string[], moderatorId: string, notes?: string) {
    const results = [];
    
    for (const itemId of queueItemIds) {
      try {
        const result = await this.approveFromQueue(itemId, moderatorId, notes);
        results.push({ itemId, status: 'approved', result });
      } catch (error) {
        results.push({ itemId, status: 'error', error: error.message });
      }
    }

    return {
      totalProcessed: queueItemIds.length,
      successful: results.filter(r => r.status === 'approved').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    };
  }

  /**
   * 🚀 Bulk reject multiple items
   */
  async bulkReject(queueItemIds: string[], moderatorId: string, notes?: string) {
    const results = [];
    
    for (const itemId of queueItemIds) {
      try {
        const result = await this.rejectFromQueue(itemId, moderatorId, notes);
        results.push({ itemId, status: 'rejected', result });
      } catch (error) {
        results.push({ itemId, status: 'error', error: error.message });
      }
    }

    return {
      totalProcessed: queueItemIds.length,
      successful: results.filter(r => r.status === 'rejected').length,
      failed: results.filter(r => r.status === 'error').length,
      results,
    };
  }

  /**
   * ⏱️ Private helper: Calculate average processing time
   */
  private async getAverageProcessingTime(moderatorId?: string): Promise<number> {
    const whereClause = {
      ...(moderatorId && { moderatorId }),
      decision: { not: null },
      reviewedAt: { not: null },
    };

    const processedItems = await this.prisma.moderationQueue.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        reviewedAt: true,
      },
    });

    if (processedItems.length === 0) return 0;

    const totalHours = processedItems.reduce((acc, item) => {
      const diffMs = item.reviewedAt!.getTime() - item.createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return acc + diffHours;
    }, 0);

    return totalHours / processedItems.length;
  }

  /**
   * 🏆 Get top moderators by activity
   */
  async getTopModerators(limit = 10) {
    const moderators = await this.prisma.moderationQueue.groupBy({
      by: ['moderatorId'],
      where: {
        moderatorId: { not: null },
        decision: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    // Get moderator details
    const moderatorDetails = await Promise.all(
      moderators.map(async (mod) => {
        const user = await this.prisma.user.findUnique({
          where: { id: mod.moderatorId! },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        });
        return {
          moderator: user,
          reviewCount: mod._count.id,
        };
      })
    );

    return moderatorDetails.filter(mod => mod.moderator !== null);
  }

  /**
   * ⚙️ Get current moderation configuration
   */
  async getModerationConfig() {
    const config = await this.prisma.moderationConfig.findFirst();
    
    if (!config) {
      throw new NotFoundException('Moderation configuration not found');
    }

    return {
      approvalThreshold: config.approvalThreshold,
      rejectionThreshold: config.rejectionThreshold,
      minReviewsRequired: config.minReviewsRequired,
      updatedAt: config.updatedAt,
      updatedBy: config.updatedBy,
    };
  }

  /**
   * ⚙️ Update moderation configuration (ADMIN ONLY)
   */
  async updateModerationConfig(updateDto: any, adminId: string) {
    const config = await this.prisma.moderationConfig.findFirst();
    
    if (!config) {
      // Create if doesn't exist
      const newConfig = await this.prisma.moderationConfig.create({
        data: {
          approvalThreshold: updateDto.approvalThreshold ?? 1,
          rejectionThreshold: updateDto.rejectionThreshold ?? 1,
          minReviewsRequired: updateDto.minReviewsRequired ?? 1,
          updatedBy: adminId,
        },
      });

      return {
        message: 'Moderation configuration created successfully',
        config: {
          approvalThreshold: newConfig.approvalThreshold,
          rejectionThreshold: newConfig.rejectionThreshold,
          minReviewsRequired: newConfig.minReviewsRequired,
          updatedAt: newConfig.updatedAt,
          updatedBy: newConfig.updatedBy,
        },
      };
    }

    // Update existing config
    const updatedConfig = await this.prisma.moderationConfig.update({
      where: { id: config.id },
      data: {
        ...(updateDto.approvalThreshold !== undefined && { approvalThreshold: updateDto.approvalThreshold }),
        ...(updateDto.rejectionThreshold !== undefined && { rejectionThreshold: updateDto.rejectionThreshold }),
        ...(updateDto.minReviewsRequired !== undefined && { minReviewsRequired: updateDto.minReviewsRequired }),
        updatedBy: adminId,
      },
    });

    return {
      message: 'Moderation configuration updated successfully',
      config: {
        approvalThreshold: updatedConfig.approvalThreshold,
        rejectionThreshold: updatedConfig.rejectionThreshold,
        minReviewsRequired: updatedConfig.minReviewsRequired,
        updatedAt: updatedConfig.updatedAt,
        updatedBy: updatedConfig.updatedBy,
      },
    };
  }
}
