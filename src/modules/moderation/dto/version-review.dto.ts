import { IsString, IsIn, IsOptional, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for submitting a review/vote on a version
 */
export class CreateVersionReviewDto {
  @IsString()
  @IsIn(['approve', 'reject'])
  vote: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value === '' ? undefined : value) // Convert empty string to undefined
  comment?: string;
}
