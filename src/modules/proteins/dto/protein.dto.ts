import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsEnum, IsArray, IsNumber } from 'class-validator';

export enum ProteinType {
  PROTEIN = 'protein',
  ENZYME = 'enzyme',
}

export class CreateProteinDto {
  @ApiProperty({ description: 'Type of the protein', enum: ProteinType })
  @IsEnum(ProteinType)
  type: ProteinType;

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

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'PDB ID' })
  @IsOptional()
  @IsString()
  pdbId?: string;

  // Deep biological structure
  @ApiPropertyOptional({ description: 'Chains data' })
  @IsOptional()
  @IsArray()
  chains?: any[];

  // PDB Specific Data
  @ApiPropertyOptional({ description: 'PDB Metadata' })
  @IsOptional()
  @IsObject()
  pdbMetadata?: any;

  @ApiPropertyOptional({ description: 'Polymer Entities' })
  @IsOptional()
  @IsArray()
  polymerEntities?: any[];

  @ApiPropertyOptional({ description: 'Non-Polymer Entities' })
  @IsOptional()
  @IsArray()
  nonPolymerEntities?: any[];

  @ApiPropertyOptional({ description: 'Assemblies' })
  @IsOptional()
  @IsArray()
  assemblies?: any[];

  @ApiPropertyOptional({ description: 'Annotations' })
  @IsOptional()
  @IsObject()
  annotations?: any;

  @ApiPropertyOptional({ description: 'Validation metrics' })
  @IsOptional()
  @IsObject()
  validation?: any;

  // Ligands
  @ApiPropertyOptional({ description: 'Ligands bound to the protein' })
  @IsOptional()
  @IsArray()
  ligands?: any[];

  // Classification & Source
  @ApiPropertyOptional({ description: 'Classification' })
  @IsOptional()
  @IsString()
  classification?: string;

  @ApiPropertyOptional({ description: 'Organism source' })
  @IsOptional()
  @IsObject()
  organism?: {
    scientificName: string;
    commonName?: string;
    taxId?: string;
  };

  // Experimental Data
  @ApiPropertyOptional({ description: 'Experimental data' })
  @IsOptional()
  @IsObject()
  experimental?: {
    method: string;
    resolution?: number;
  };

  // Enzyme specific fields
  @ApiPropertyOptional({ description: 'EC Number (for enzymes)' })
  @IsOptional()
  @IsString()
  ecNumber?: string;

  @ApiPropertyOptional({ description: 'Enzyme Class' })
  @IsOptional()
  @IsString()
  enzymeClass?: string;

  @ApiPropertyOptional({ description: 'Active Site data' })
  @IsOptional()
  @IsObject()
  activeSite?: any;

  @ApiPropertyOptional({ description: 'Cofactors' })
  @IsOptional()
  @IsArray()
  cofactors?: any[];

  @ApiPropertyOptional({ description: 'Coenzymes' })
  @IsOptional()
  @IsArray()
  coenzymes?: any[];

  @ApiPropertyOptional({ description: 'Inhibitors' })
  @IsOptional()
  @IsArray()
  inhibitors?: any[];

  @ApiPropertyOptional({ description: 'Kinetic parameters' })
  @IsOptional()
  @IsObject()
  kinetics?: {
    km?: number;
    kcat?: number;
    vmax?: number;
  };

  // Legacy/Convenience fields
  @ApiPropertyOptional({ description: 'Amino acid sequence (convenience field)' })
  @IsOptional()
  @IsString()
  sequence?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}

export class UpdateProteinDto extends CreateProteinDto {}
