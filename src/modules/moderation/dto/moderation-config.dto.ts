import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating moderation configuration
 */
export class UpdateModerationConfigDto {
  @ApiProperty({
    description: 'Reputation threshold for auto-approval',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Approval threshold must be at least 1' })
  approvalThreshold?: number;

  @ApiProperty({
    description: 'Reputation threshold for auto-rejection',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Rejection threshold must be at least 1' })
  rejectionThreshold?: number;

  @ApiProperty({
    description: 'Minimum reviews required before auto-decision',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Minimum reviews must be at least 1' })
  minReviewsRequired?: number;
}

/**
 * Response DTO for moderation configuration
 */
export class ModerationConfigDto {
  @ApiProperty({ description: 'Reputation threshold for auto-approval', example: 100 })
  approvalThreshold: number;

  @ApiProperty({ description: 'Reputation threshold for auto-rejection', example: 100 })
  rejectionThreshold: number;

  @ApiProperty({ description: 'Minimum reviews required before auto-decision', example: 1 })
  minReviewsRequired: number;

  @ApiProperty({ description: 'Last updated timestamp' })
  updatedAt: Date;

  @ApiProperty({ description: 'Updated by user ID', required: false })
  updatedBy?: string;
}
