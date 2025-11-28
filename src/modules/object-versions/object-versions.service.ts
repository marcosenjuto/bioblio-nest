import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateObjectVersionDto, UpdateObjectVersionDto } from './dto/object-version.dto';

/**
 * 🔄 Object Versions Service
 * 
 * This service handles the collaboration system for object management:
 * - Version creation and approval workflow
 * - Reputation-based auto-approval
 * - Object version history management
 * - Integration with moderation queue
 */
@Injectable()
export class ObjectVersionsService {
  constructor(private prisma: PrismaService) {}

  // Reputation threshold for auto-approval (configurable)
  private readonly AUTO_APPROVAL_REPUTATION_THRESHOLD = 100;

  // Valid entity types for centers (fetched from database)
  // These are the actual entity types that exist in the centers table
  private readonly VALID_ENTITY_TYPES = new Set([
    'collection_schedule',
    'private_recycling_center',
    'reception_center',
    'special_waste_center',
    'street_container',
  ]);

  /**
   * 📝 Step 1: User proposes a change
   * Creates a new object version with status='pending'
   * Auto-approves if user has high reputation
   */
  async createVersion(objectId: string, userId: string, createVersionDto: CreateObjectVersionDto) {
    try {
      console.log('🔍 [createVersion] ==> START', { objectId, userId });
      
      // Check if object exists
      const object = await this.prisma.bioEntity.findUnique({
        where: { id: objectId },
      });

      console.log('🔍 [createVersion] Object lookup:', { exists: !!object, objectId });

      if (!object) {
        console.error('❌ [createVersion] OBJECT_NOT_FOUND:', objectId);
        throw new NotFoundException({
          statusCode: 404,
          message: `Object with ID ${objectId} not found`,
          error: 'OBJECT_NOT_FOUND',
          details: 'Make sure the center has an associated object before proposing changes',
          objectId,
        });
      }

      // Get user information for reputation check
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, reputation: true, role: true },
      });

      console.log('🔍 [createVersion] User lookup:', { exists: !!user, userId, reputation: user?.reputation });

      if (!user) {
        console.error('❌ [createVersion] USER_NOT_FOUND:', userId);
        throw new NotFoundException({
          statusCode: 404,
          message: `User with ID ${userId} not found`,
          error: 'USER_NOT_FOUND',
          userId,
        });
      }

      // Determine initial status based on user reputation and role
      // 🚫 REMOVED AUTO-APPROVAL: All proposals must go through review process
      // This enforces separation of responsibilities - no one can approve their own changes
      const initialStatus = 'pending';

      console.log('🔍 [createVersion] Status determined:', { initialStatus, reputation: user.reputation, role: user.role });

      // 🔒 VALIDATE AND CLEAN DATA
      const dataToSave = { ...createVersionDto.data };
      
      // 1. Remove comment from object data (it's version metadata, not object data)
      if ('comment' in dataToSave) {
        delete dataToSave.comment;
        console.log('🔍 [createVersion] Removed comment from object data');
      }
      
      // 2. Remove id and objectId fields - these are metadata managed separately
      // The center's id should not be in version data
      if ('id' in dataToSave) {
        delete dataToSave.id;
        console.log('🔍 [createVersion] Removed id field from object data');
      }
      if ('objectId' in dataToSave) {
        delete dataToSave.objectId;
        console.log('🔍 [createVersion] Removed objectId field from object data');
      }
      
      // 3. Validate entityType if present
      if ('entityType' in dataToSave && dataToSave.entityType) {
        if (!this.VALID_ENTITY_TYPES.has(dataToSave.entityType)) {
          console.warn('⚠️ [createVersion] Invalid entityType:', dataToSave.entityType);
          throw new BadRequestException({
            statusCode: 400,
            message: 'Invalid entity type',
            error: 'INVALID_ENTITY_TYPE',
            details: `Entity type must be one of: ${Array.from(this.VALID_ENTITY_TYPES).join(', ')}`,
            providedValue: dataToSave.entityType,
            validValues: Array.from(this.VALID_ENTITY_TYPES),
          });
        }
      }

      // Get current version data to compare and calculate changes
      let previousData = null;
      let changedFieldsArray: string[] = [];
      
      if (object.currentVersionId) {
        const currentVersion = await this.prisma.objectVersion.findUnique({
          where: { id: object.currentVersionId },
          select: { dataJson: true },
        });
        
        if (currentVersion) {
          previousData = JSON.parse(currentVersion.dataJson);
          
          // Calculate which fields changed (using cleaned data)
          changedFieldsArray = this.calculateChangedFields(previousData, dataToSave);
          console.log('🔍 [createVersion] Changed fields:', changedFieldsArray);
        }
      }

      // Create the object version with old data, new data, and changed fields
      const objectVersion = await this.prisma.objectVersion.create({
        data: {
          objectId,
          userId,
          dataJson: JSON.stringify(dataToSave), // Use cleaned data
          previousDataJson: previousData ? JSON.stringify(previousData) : null,
          changedFields: changedFieldsArray.length > 0 ? JSON.stringify(changedFieldsArray) : null,
          status: initialStatus,
          comment: createVersionDto.comment, // Comment stays here, not in object data
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
          object: true,
        },
      });

      console.log('✅ [createVersion] Version created:', { versionId: objectVersion.id, status: objectVersion.status, changedFields: changedFieldsArray.length });

      // Always add to moderation queue for manual review
      console.log('🟡 [createVersion] Adding to moderation queue');
      await this.prisma.moderationQueue.create({
        data: {
          versionId: objectVersion.id,
        },
      });

      console.log('✅ [createVersion] ==> SUCCESS');
      return {
        ...objectVersion,
        data: JSON.parse(objectVersion.dataJson),
        previousData: objectVersion.previousDataJson ? JSON.parse(objectVersion.previousDataJson) : null,
        changedFields: objectVersion.changedFields ? JSON.parse(objectVersion.changedFields) : [],
        // Remove the JSON string versions
        dataJson: undefined,
        previousDataJson: undefined,
        autoApproved: false,
      };

    } catch (error) {
      console.error('❌ [createVersion] ==> FATAL ERROR', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorMeta: error.meta,
        prismaCode: error.code,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        fullErrorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // Prisma foreign key constraint error
      if (error.code === 'P2003') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Foreign key constraint failed',
          error: 'FOREIGN_KEY_CONSTRAINT_FAILED',
          details: `Referenced ${error.meta?.field_name || 'object'} does not exist in the database`,
          prismaCode: 'P2003',
          field: error.meta?.field_name,
          modelName: error.meta?.model_name,
          objectId,
          userId,
        });
      }

      // Prisma unique constraint error
      if (error.code === 'P2002') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Unique constraint violated',
          error: 'UNIQUE_CONSTRAINT_VIOLATED',
          details: `Duplicate value for ${error.meta?.target?.join(', ') || 'field'}`,
          prismaCode: 'P2002',
          target: error.meta?.target,
        });
      }

      // Re-throw if already a NestJS exception
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Wrap any other error
      throw new BadRequestException({
        statusCode: 500,
        message: 'Failed to create object version',
        error: error.code || 'INTERNAL_SERVER_ERROR',
        details: error.message,
        errorName: error.name,
        prismaCode: error.code,
      });
    }
  }

  /**
   * 🟩 Step 3: Approve a version and make it official
   */
  async approveVersion(versionId: string, moderatorId: string, notes?: string) {
    const version = await this.prisma.objectVersion.findUnique({
      where: { id: versionId },
      include: { 
        object: {
          include: {
            molecule: true,
            protein: true,
            reaction: true,
            article: true,
          }
        } 
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    // 🚫 SEPARATION OF RESPONSIBILITIES: Users cannot approve their own changes
    if (version.userId === moderatorId) {
      throw new BadRequestException(
        'You cannot approve your own changes. Another moderator must review and approve this version.'
      );
    }

    if (version.status === 'approved') {
      throw new BadRequestException('Version is already approved');
    }

    if (version.status === 'rejected') {
      throw new BadRequestException('Cannot approve a rejected version');
    }

    // Start transaction to ensure consistency
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update version status
      const updatedVersion = await prisma.objectVersion.update({
        where: { id: versionId },
        data: { status: 'approved' },
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
      });

      // Update object's current version
      await prisma.bioEntity.update({
        where: { id: version.objectId },
        data: { currentVersionId: versionId },
      });

      // Update moderation queue if exists
      await prisma.moderationQueue.updateMany({
        where: { versionId },
        data: {
          moderatorId,
          decision: 'approved',
          notes,
          reviewedAt: new Date(),
        },
      });

      // Apply changes to concrete entity
      const data = JSON.parse(version.dataJson);
      
      if (version.object.molecule) {
        const { structure, properties, ...moleculeData } = data;
        await prisma.molecule.update({
          where: { id: version.object.molecule.id },
          data: {
            ...moleculeData,
            structure: structure ? JSON.stringify(structure) : undefined,
            properties: properties ? JSON.stringify(properties) : undefined,
          }
        });
      } else if (version.object.protein) {
        const { metadata, chains, ...proteinData } = data;
        await prisma.protein.update({
          where: { id: version.object.protein.id },
          data: {
            ...proteinData,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            chains: chains ? JSON.stringify(chains) : undefined,
          }
        });
      } else if (version.object.reaction) {
        const { data: reactionDataJson, ...reactionData } = data;
        await prisma.reaction.update({
          where: { id: version.object.reaction.id },
          data: {
            ...reactionData,
            data: reactionDataJson ? JSON.stringify(reactionDataJson) : undefined,
          }
        });
      } else if (version.object.article) {
        const { tags, ...articleData } = data;
        await prisma.article.update({
          where: { id: version.object.article.id },
          data: {
            ...articleData,
            tags: tags ? JSON.stringify(tags) : undefined,
          }
        });
      }

      // Increase user reputation for approved contribution
      await prisma.user.update({
        where: { id: version.userId },
        data: {
          reputation: {
            increment: 10, // Award 10 reputation points for approved contribution
          },
        },
      });

      return updatedVersion;
    });

    return result;
  }

  /**
   * ❌ Reject a version
   */
  async rejectVersion(versionId: string, moderatorId: string, notes?: string) {
    const version = await this.prisma.objectVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    // 🚫 SEPARATION OF RESPONSIBILITIES: Users cannot reject their own changes
    // (though unlikely, we enforce this for consistency)
    if (version.userId === moderatorId) {
      throw new BadRequestException(
        'You cannot reject your own changes. Another moderator must review this version.'
      );
    }

    if (version.status === 'rejected') {
      throw new BadRequestException('Version is already rejected');
    }

    if (version.status === 'approved') {
      throw new BadRequestException('Cannot reject an approved version');
    }

    // Update version status and moderation queue
    const result = await this.prisma.$transaction(async (prisma) => {
      const updatedVersion = await prisma.objectVersion.update({
        where: { id: versionId },
        data: { status: 'rejected' },
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
      });

      // Update moderation queue
      await prisma.moderationQueue.updateMany({
        where: { versionId },
        data: {
          moderatorId,
          decision: 'rejected',
          notes,
          reviewedAt: new Date(),
        },
      });

      return updatedVersion;
    });

    return result;
  }

  /**
   * 📋 Get all versions for an object
   */
  async getObjectVersions(objectId: string, includeRejected = false) {
    const whereClause = includeRejected 
      ? { objectId }
      : { objectId, status: { not: 'rejected' } };

    return this.prisma.objectVersion.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
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
        moderationItem: {
          include: {
            moderator: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 📖 Get a specific version
   */
  async getVersion(versionId: string) {
    const version = await this.prisma.objectVersion.findUnique({
      where: { id: versionId },
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
        object: true,
        moderationItem: {
          include: {
            moderator: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException(`Version with ID ${versionId} not found`);
    }

    return {
      ...version,
      data: JSON.parse(version.dataJson),
    };
  }

  /**
   * 🏢 Get current official version of an object
   */
  async getCurrentVersion(objectId: string) {
    const object = await this.prisma.bioEntity.findUnique({
      where: { id: objectId },
      include: {
        currentVersion: {
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
      },
    });

    if (!object) {
      throw new NotFoundException(`Object with ID ${objectId} not found`);
    }

    if (!object.currentVersion) {
      return null; // No approved version yet
    }

    return {
      ...object.currentVersion,
      data: JSON.parse(object.currentVersion.dataJson),
    };
  }

  /**
   * 📊 Get version statistics for an object
   */
  async getVersionStats(objectId: string) {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.objectVersion.count({ where: { objectId } }),
      this.prisma.objectVersion.count({ where: { objectId, status: 'pending' } }),
      this.prisma.objectVersion.count({ where: { objectId, status: 'approved' } }),
      this.prisma.objectVersion.count({ where: { objectId, status: 'rejected' } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  /**
   * 🔍 Private helper: Determine if a version should be auto-approved
   */
  private shouldAutoApprove(userReputation: number, userRole: string): boolean {
    // Admins and managers can auto-approve
    if (userRole === 'ADMIN' || userRole === 'MANAGER') {
      return true;
    }

    // Users with high reputation can auto-approve
    return userReputation >= this.AUTO_APPROVAL_REPUTATION_THRESHOLD;
  }

  /**
   * 🔍 Private helper: Calculate which fields changed between old and new data
   */
  private calculateChangedFields(oldData: any, newData: any): string[] {
    const changedFields: string[] = [];
    
    // Fields that should NEVER be tracked as changes
    const excludedFields = new Set([
      'id',           // ID never changes
      'objectId',     // Internal reference
      'comment',      // Version metadata, not object data
      'materials',    // Relationship array - managed separately
      'materialIds',  // Relationship IDs - managed separately
      'managers',     // Relationship array - managed separately
    ]);
    
    // Get all unique keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldData || {}),
      ...Object.keys(newData || {}),
    ]);
    
    // Compare each field
    for (const key of allKeys) {
      // Skip excluded fields
      if (excludedFields.has(key)) continue;
      
      const oldValue = oldData?.[key];
      const newValue = newData?.[key];
      
      // Check if values are different
      // Handle null/undefined as equal
      if (oldValue === newValue) continue;
      if (oldValue == null && newValue == null) continue;
      
      // Treat empty string "" and null as equivalent (no change)
      if ((oldValue === '' || oldValue == null) && (newValue === '' || newValue == null)) {
        continue;
      }
      
      // Treat empty objects {} and null/undefined as equivalent (no change)
      if (this.isEmptyObject(oldValue) && this.isEmptyObject(newValue)) {
        continue;
      }
      
      // Treat empty arrays [] and null/undefined as equivalent (no change)
      if (this.isEmptyArray(oldValue) && this.isEmptyArray(newValue)) {
        continue;
      }
      
      // For objects and arrays, do deep comparison
      if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changedFields.push(key);
        }
      } else {
        changedFields.push(key);
      }
    }
    
    return changedFields;
  }

  /**
   * 🔍 Private helper: Check if value is an empty object
   */
  private isEmptyObject(value: any): boolean {
    if (value == null) return true;
    if (typeof value !== 'object') return false;
    if (Array.isArray(value)) return false;
    return Object.keys(value).length === 0;
  }

  /**
   * 🔍 Private helper: Check if value is an empty array
   */
  private isEmptyArray(value: any): boolean {
    if (value == null) return true;
    if (!Array.isArray(value)) return false;
    return value.length === 0;
  }

  /**
   * 🏗️ Create object (used when creating new centers)
   * @param initialData - The initial center data
   * @param userId - The user creating the object
   * @param objectId - Optional: specific ID to use (for center-object ID matching)
   */
  async createObject(initialData: any, userId: string, objectId?: string) {
    try {
      console.log('🔍 [createObject] ==> START', { userId, objectId, dataKeys: Object.keys(initialData) });

      return await this.prisma.$transaction(async (prisma) => {
        console.log('🔍 [createObject] Creating object...');
        
        // Create the object with specific ID if provided, otherwise auto-generate
        const object = await prisma.bioEntity.create({
          data: {
            ...(objectId && { id: objectId }),  // Use provided ID if available
            status: 'active',
          },
        });

        console.log('✅ [createObject] Object created:', object.id);

        console.log('🔍 [createObject] Creating initial version...');
        
        // Create the initial version
        const initialVersion = await prisma.objectVersion.create({
          data: {
            objectId: object.id,
            userId,
            dataJson: JSON.stringify(initialData),
            status: 'approved', // Initial version is always approved
            comment: 'Initial version',
          },
        });

        console.log('✅ [createObject] Initial version created:', initialVersion.id);

        console.log('🔍 [createObject] Setting as current version...');
        
        // Set as current version
        await prisma.bioEntity.update({
          where: { id: object.id },
          data: { currentVersionId: initialVersion.id },
        });

        console.log('✅ [createObject] ==> SUCCESS', { objectId: object.id, versionId: initialVersion.id });

        return { object, initialVersion };
      });

    } catch (error) {
      console.error('❌ [createObject] ==> FATAL ERROR', {
        errorName: error.name,
        errorMessage: error.message,
        errorCode: error.code,
        errorMeta: error.meta,
        prismaCode: error.code,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        fullErrorJSON: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      });

      // Prisma foreign key constraint error
      if (error.code === 'P2003') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Foreign key constraint failed in createObject',
          error: 'FOREIGN_KEY_CONSTRAINT_FAILED',
          details: `The userId "${userId}" does not exist in the database. User must be registered first.`,
          prismaCode: 'P2003',
          field: error.meta?.field_name,
          modelName: error.meta?.model_name,
          userId,
        });
      }

      // Prisma unique constraint error
      if (error.code === 'P2002') {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Unique constraint violated in createObject',
          error: 'UNIQUE_CONSTRAINT_VIOLATED',
          details: `Duplicate value for ${error.meta?.target?.join(', ') || 'field'}`,
          prismaCode: 'P2002',
          target: error.meta?.target,
        });
      }

      // Wrap any other error
      throw new BadRequestException({
        statusCode: 500,
        message: 'Failed to create object',
        error: error.code || 'CREATE_OBJECT_FAILED',
        details: error.message,
        errorName: error.name,
        prismaCode: error.code,
        userId,
      });
    }
  }
}