import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateMoleculeDto {
  @ApiProperty({ description: 'Name of the molecule' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the molecule' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'SMILES string' })
  @IsOptional()
  @IsString()
  smiles?: string;

  @ApiPropertyOptional({ description: 'InChI string' })
  @IsOptional()
  @IsString()
  inchi?: string;

  @ApiPropertyOptional({ description: 'Molecular formula' })
  @IsOptional()
  @IsString()
  formula?: string;

  @ApiPropertyOptional({ description: 'Molecular weight' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Structure data (JSON)' })
  @IsOptional()
  @IsObject()
  structure?: any;

  @ApiPropertyOptional({ description: 'Properties data (JSON)' })
  @IsOptional()
  @IsObject()
  properties?: any;
}

export class UpdateMoleculeDto extends CreateMoleculeDto {}
