import { Atom } from './atom-model';
import { FunctionalGroup } from './functional-group-model';
import { Names } from './names-model';

export interface Molecule {
  // Identifiers
  id: string;
  cid?: number;
  cas?: string;
  chemblId?: string;
  type: 'small-molecule' | 'protein' | 'enzyme' | 'nucleic-acid' | 'other';
  functionalGroups?: FunctionalGroup[];

  // Names
  names: Names;

  // Structure
  structure: {
    smiles: string;
    cxsmiles?: string;
    inchi: string;
    inchikey: string;
    molecularFormula: string;
    atoms?: Atom[];
    structuralFormula?: string;

    // NEW — 2D structure for RDKit
    structure2D?: {
      format: 'mol' | 'molblock' | 'svg';
      data: string;  // RDKit MolBlock or SVG
      source: 'rdkit' | 'pubchem' | 'generated';

      // Vector coordinates for 2D conformer
      coordinates?: {
        atoms: {
          atomIndex: number;
          x: number;
          y: number;
        }[];
        bonds?: {
          startAtom: number;
          endAtom: number;
          order?: number;
        }[];
      };
    };

    // Existing — 3D structure
    structure3D?: {
      format: 'sdf' | 'pdb' | 'mol2';
      data: string;
      source: 'pubchem' | 'generated' | 'uploaded';
    };
  };

  // Molecular properties
  molecular: {
    weight: number;
    exactMass: number;
    monoisotopicMass: number;
    charge?: number;
  };

  // Physical properties
  physical?: {
    meltingPoint?: { value: number; unit: 'K' | '°C' };
    boilingPoint?: { value: number; unit: 'K' | '°C' };
    density?: { value: number; unit: 'g/cm³' | 'g/mL' };
    flashPoint?: { value: number; unit: '°C' };
    refractiveIndex?: number;
    appearance?: string;
  };

  // Thermodynamic
  thermodynamic?: {
    enthalpyOfFormation?: { value: number; unit: 'kJ/mol' };
    entropyOfFormation?: { value: number; unit: 'J/(mol·K)' };
    gibbsFreeEnergy?: { value: number; unit: 'kJ/mol' };
    heatCapacity?: { value: number; unit: 'J/(mol·K)' };
  };

  // Chemical
  chemical?: {
    solubility?: { water?: string; organic?: string[] };
    pKa?: number[];
    logP?: number;
    polarSurfaceArea?: number;
  };

  // Spectroscopy
  spectroscopy?: {
    ir?: string;
    nmr?: { proton?: string; carbon13?: string };
    ms?: string;
    uv?: string;
  };

  // Safety
  safety?: {
    hazards?: string[];
    ghs?: string[];
    nfpa?: { health: number; fire: number; reactivity: number };
    handling?: string;
  };

  // Metadata
  sources: string[];
  lastUpdated: string;
}
