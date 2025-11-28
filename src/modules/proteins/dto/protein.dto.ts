import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateProteinDto {
  @ApiProperty({ description: 'Name of the protein' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Amino acid sequence' })
  @IsOptional()
  @IsString()
  sequence?: string;

  @ApiPropertyOptional({ description: 'PDB ID' })
  @IsOptional()
  @IsString()
  pdbId?: string;

  @ApiPropertyOptional({ description: 'Metadata (JSON)' })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Chains data (JSON)' })
  @IsOptional()
  @IsObject()
  chains?: any;
}

export class UpdateProteinDto extends CreateProteinDto {}
