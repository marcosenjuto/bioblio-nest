import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateReactionDto {
  @ApiProperty({ description: 'Name of the reaction' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Reaction string (SMILES/SMARTS)' })
  @IsOptional()
  @IsString()
  reactionString?: string;

  @ApiPropertyOptional({ description: 'ORD Data (JSON)' })
  @IsOptional()
  @IsObject()
  data?: any;
}

export class UpdateReactionDto extends CreateReactionDto {}
