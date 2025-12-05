import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsEnum, IsArray } from 'class-validator';

export enum MoleculeType {
  SMALL_MOLECULE = 'small-molecule',
  PROTEIN = 'protein',
  ENZYME = 'enzyme',
  NUCLEIC_ACID = 'nucleic-acid',
  OTHER = 'other',
}

export class CreateMoleculeDto {
  @ApiProperty({ description: 'Type of the molecule', enum: MoleculeType })
  @IsEnum(MoleculeType)
  type: MoleculeType;

  // Identifiers
  @ApiPropertyOptional({ description: 'PubChem CID' })
  @IsOptional()
  @IsNumber()
  cid?: number;

  @ApiPropertyOptional({ description: 'CAS Registry Number' })
  @IsOptional()
  @IsString()
  cas?: string;

  @ApiPropertyOptional({ description: 'ChEMBL ID' })
  @IsOptional()
  @IsString()
  chemblId?: string;

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

  // Structure
  @ApiProperty({ description: 'Structure data (SMILES, InChI, etc.)' })
  @IsObject()
  structure: {
    smiles: string;
    cxsmiles?: string;
    inchi: string;
    inchikey: string;
    molecularFormula: string;
    atoms?: any[];
    structuralFormula?: string;
    structure2D?: any;
    structure3D?: any;
  };

  // Molecular properties
  @ApiProperty({ description: 'Molecular properties (weight, mass, charge)' })
  @IsObject()
  molecular: {
    weight: number;
    exactMass: number;
    monoisotopicMass: number;
    charge?: number;
  };

  // Physical properties
  @ApiPropertyOptional({ description: 'Physical properties' })
  @IsOptional()
  @IsObject()
  physical?: any;

  // Thermodynamic
  @ApiPropertyOptional({ description: 'Thermodynamic properties' })
  @IsOptional()
  @IsObject()
  thermodynamic?: any;

  // Chemical
  @ApiPropertyOptional({ description: 'Chemical properties' })
  @IsOptional()
  @IsObject()
  chemical?: any;

  // Spectroscopy
  @ApiPropertyOptional({ description: 'Spectroscopy data' })
  @IsOptional()
  @IsObject()
  spectroscopy?: any;

  // Safety
  @ApiPropertyOptional({ description: 'Safety information' })
  @IsOptional()
  @IsObject()
  safety?: any;

  // Metadata
  @ApiPropertyOptional({ description: 'Data sources' })
  @IsOptional()
  @IsArray()
  sources?: string[];
}

export class UpdateMoleculeDto extends CreateMoleculeDto {}
