import { Molecule } from './molecule-model';
import { Atom } from './atom-model';
import { Names } from './names-model';

export interface Residue {
  id: string;
  name: string;         // e.g., "ALA", "HIS"
  names: Names;
  sequenceNumber: number;
  chainIdentifier: string;
  atoms: Atom[];
  secondaryStructure?: 'helix' | 'sheet' | 'coil';
}

export interface PdbMetadata {
  pdbId: string;
  title: string;
  classification: string;
  depositionDate: string;
  releaseDate: string;
  experimentalMethod: string;
  resolutionAngstrom?: number;
  rFree?: number;
  rWork?: number;
  structureDetermination: {
    method: string;
    temperatureKelvin?: number;
    ph?: number;
    software: string[];
    collectionWavelengthAngstrom?: number;
    collectionDetails?: string;
  };
  sourceOrganism: {
    scientificName: string;
    taxId: string;
    commonName?: string;
    strain?: string;
    expressionSystem?: string;
    expressionTaxId?: string;
  };
  citation: {
    doi?: string;
    pmid?: string;
    authors: string[];
    journal?: string;
    year?: number;
    title?: string;
  };
}

export interface PolymerEntity {
  entityId: string;
  entityType: 'protein' | 'dna' | 'rna' | 'other';
  description: string;
  sequence: string;
  length: number;
  uniprotAccessions?: string[];
  chains: string[]; // Chain IDs
  ecNumbers?: string[];
  geneNames?: string[];
  mutations?: string[];
  sequenceConflicts?: string[];
  secondaryStructure?: {
    helices: { start: number; end: number; type: string }[];
    sheets: { start: number; end: number; type: string }[];
  };
}

export interface NonPolymerEntity {
  entityId: string;
  chemicalName: string;
  names: Names;
  chemicalId: string;
  type: 'ligand' | 'ion' | 'cofactor' | 'other';
  formula: string;
  molecularWeight?: number;
  count: number;
  chains: string[]; // Chain IDs where it is present
}

export interface Assembly {
  assemblyId: string;
  form: 'biological' | 'asymmetric';
  description: string;
  stoichiometry: string;
  symmetry?: string;
  chains: string[];
}

export interface PdbAnnotations {
  functionalSites: {
    siteId: string;
    description: string;
    residues: { chainId: string; residueNumber: number; residueName: string }[];
  }[];
  activeSites?: any[];
  bindingSites?: any[];
  ptms?: any[];
}

export interface PdbValidation {
  clashscore?: number;
  ramachandran?: {
    favoredPercent?: number;
    allowedPercent?: number;
    outlierPercent?: number;
  };
  rotamerOutliersPercent?: number;
  bondLengthRmsz?: number;
  bondAngleRmsz?: number;
}

export interface Chain {
  id: string;           // Chain ID (e.g., "A")
  entityId?: string;    // Link to PolymerEntity
  type?: 'polypeptide' | 'nucleotide' | 'other';
  sequence: string;     // Amino acid sequence string
  length: number;
  residues: Residue[];
}

export interface Protein extends Molecule {
  type: 'protein' | 'enzyme';
  pdbId?: string;
  
  // Deep biological structure
  chains: Chain[];
  
  // PDB Specific Data
  pdbMetadata?: PdbMetadata;
  polymerEntities?: PolymerEntity[];
  nonPolymerEntities?: NonPolymerEntity[];
  assemblies?: Assembly[];
  annotations?: PdbAnnotations;
  validation?: PdbValidation;

  // Ligands bound to the protein
  ligands?: Molecule[];

  // Classification & Source
  classification?: string;
  organism?: {
    scientificName: string;
    commonName?: string;
    taxId?: string;
  };
  
  // Experimental Data
  experimental?: {
    method: string; // e.g., "X-RAY DIFFRACTION"
    resolution?: number; // Angstroms
  };
}

export interface Enzyme extends Protein {
  type: 'enzyme';
  ecNumber: string;     // e.g., "1.1.1.1"
  enzymeClass?: string; // e.g., "Oxidoreductase"
  
  // Catalytic properties
  activeSite?: {
    residues: string[]; // IDs of residues in the active site
    description?: string;
    geometry?: string; // e.g., "tetrahedral"
  };
  
  // Cofactors and Coenzymes
  cofactors?: Molecule[]; // Inorganic ions or small molecules
  coenzymes?: Molecule[]; // Organic non-protein molecules
  
  inhibitors?: Molecule[];
  
  // Kinetic parameters (optional)
  kinetics?: {
    km?: number;
    kcat?: number;
    vmax?: number;
  };
}
