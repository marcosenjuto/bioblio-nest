import { Names } from './names-model';

export interface Atom {
  id: string;
  symbol: string;       // e.g., "C", "H", "O", "Fe"
  atomicNumber: number;
  name: string;         // e.g., "Carbon"
  names: Names;
  mass: number;         // Atomic mass
  
  // 3D Coordinates (Angstroms)
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };

  // Chemical properties specific to this atom instance
  properties?: {
    charge?: number;
    isHeteroatom?: boolean; // True for non-standard residues in proteins
    bfactor?: number;       // Temperature factor (for PDB)
    occupancy?: number;     // For PDB
  };
}
