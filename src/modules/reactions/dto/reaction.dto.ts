import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsArray, IsNumber } from 'class-validator';

export class CreateReactionDto {
  // Universal Identifiers
  // Names
  @ApiProperty({ description: 'Names object (iupac, common, etc.)' })
  @IsObject()
  names: {
    iupac: string;
    common: string[];
    trivial?: string;
    commonLocalized?: { [languageCode: string]: string[] };
    trivialLocalized?: { [languageCode: string]: string };
  };

  @ApiProperty({ description: 'Description of the reaction' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Category of the reaction' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'SMARTS string' })
  @IsOptional()
  @IsString()
  smarts?: string;

  // Visualization & Mechanism
  @ApiPropertyOptional({ description: 'Trajectory identifier' })
  @IsOptional()
  @IsString()
  trajectory?: string;

  @ApiPropertyOptional({ description: 'Reaction arrows identifier' })
  @IsOptional()
  @IsString()
  reaction_arrows?: string;

  @ApiPropertyOptional({ description: 'Display label' })
  @IsOptional()
  @IsString()
  label?: string;

  // Extended Thermodynamics/Kinetics
  @ApiPropertyOptional({ description: 'Delta G' })
  @IsOptional()
  @IsString()
  deltaG?: string;

  @ApiPropertyOptional({ description: 'Delta H' })
  @IsOptional()
  @IsString()
  deltaH?: string;

  @ApiPropertyOptional({ description: 'Rate constant k' })
  @IsOptional()
  @IsString()
  k?: string;

  // External Resources
  @ApiPropertyOptional({ description: 'Reference links' })
  @IsOptional()
  @IsArray()
  links_ref?: string[];

  @ApiPropertyOptional({ description: 'Video experiment URL' })
  @IsOptional()
  @IsString()
  video_experiment?: string;

  // Integration with internal models
  @ApiProperty({ description: 'Reactants' })
  @IsArray()
  reactants: any[];

  @ApiProperty({ description: 'Products' })
  @IsArray()
  products: any[];

  // Helper fields for UI
  @ApiPropertyOptional({ description: 'Conditions list' })
  @IsOptional()
  @IsArray()
  conditions?: string[];

  @ApiPropertyOptional({ description: 'Temperature' })
  @IsOptional()
  @IsString()
  temperature?: string;

  @ApiPropertyOptional({ description: 'Solvent' })
  @IsOptional()
  @IsString()
  solvent?: string;

  @ApiPropertyOptional({ description: 'Yield percentage' })
  @IsOptional()
  @IsNumber()
  yield?: number;

  // Experimental Samples (ORD Data)
  @ApiPropertyOptional({ description: 'ORD Reaction Data' })
  @IsOptional()
  @IsArray()
  reactions?: any[];
}

export class UpdateReactionDto extends CreateReactionDto {}
