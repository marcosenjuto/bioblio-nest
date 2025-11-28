import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateObjectVersionDto {
  @IsNotEmpty()
  @IsObject()
  @ApiProperty({ 
    description: 'The object data being proposed as JSON (Center, Material, etc.)',
    example: {
      name: 'Updated Center Name',
      description: 'Updated description',
      latitude: -32.9442,
      longitude: -60.6505
    }
  })
  data: any;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Optional comment explaining the proposed change',
    example: 'Updated contact information and location coordinates'
  })
  comment?: string;
}

export class UpdateObjectVersionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Update the comment for this version',
    example: 'Revised based on feedback'
  })
  comment?: string;
}

export class ApproveVersionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Moderator notes for the approval',
    example: 'Approved after verification of coordinates'
  })
  notes?: string;
}

export class RejectVersionDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Moderator notes explaining the rejection',
    example: 'Coordinates appear to be incorrect'
  })
  notes?: string;
}