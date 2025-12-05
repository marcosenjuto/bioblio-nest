import { Molecule } from './molecule-model';
import { Names } from './names-model';

// --- Reagent Interface ---
export interface Reagent {
  compound: Molecule
  stoichiometry?: number
  conditions?: string
  role?: 'reactant' | 'reagent' | 'solvent' | 'catalyst' | 'product'
}

// --- Open Reaction Database (ORD) Schema Interfaces ---

export interface ORDIdentifier {
  type: string; // e.g., "REACTION_TYPE", "REACTION_CXSMILES", "SMILES", "NAME"
  value: string;
  details?: string;
}

export interface ORDCompound {
  identifiers: ORDIdentifier[];
  amount?: {
    mass?: { value: number; units: string };
    moles?: { value: number; units: string };
    volume?: { value: number; units: string };
  };
  reaction_role: 'REACTANT' | 'REAGENT' | 'SOLVENT' | 'CATALYST' | 'WORKUP' | 'INTERNAL_STANDARD' | 'PRODUCT';
  is_limiting?: boolean;
  preparations?: string[];
}

export interface ORDReactionInput {
  components: ORDCompound[];
  crude_components?: any[];
}

export interface ORDConditions {
  temperature?: {
    value: number;
    precision?: number;
    units: 'CELSIUS' | 'KELVIN';
  };
  pressure?: {
    value: number;
    precision?: number;
    units: 'PASCAL' | 'BAR' | 'ATMOSPHERE';
  };
  stirring?: {
    type?: string;
    rate?: { value: number; units: string };
  };
  illumination?: {
    type?: string;
    details?: string;
  };
  electrochemistry?: any;
  flow?: any;
  reflux?: boolean;
  ph?: number;
  conditions_are_dynamic?: boolean;
}

export interface ORDProductMeasurement {
  type: 'YIELD' | 'SELECTIVITY' | 'PURITY' | 'IDENTITY';
  details?: string;
  percentage?: { value: number; precision?: number };
  string_value?: string;
}

export interface ORDProductCompound extends ORDCompound {
  is_desired_product?: boolean;
  measurements?: ORDProductMeasurement[];
  isolated_color?: string;
  texture?: string;
}

export interface ORDReactionOutcome {
  reaction_time?: { value: number; units: string };
  conversion?: { value: number; precision?: number };
  products: ORDProductCompound[];
  analyses?: Record<string, any>;
}

export interface ORDProvenance {
  experimenter?: string;
  city?: string;
  experiment_start?: string;
  doi?: string;
  patent?: string;
  publication_url?: string;
  record_created?: {
    time: { value: string };
    person: { name: string; email: string };
  };
  record_modified?: any[];
}

export interface ORDTime {
  value: number;
  precision?: number;
  units: 'HOUR' | 'MINUTE' | 'SECOND';
}

export interface ORDData {
  value?: string;
  format?: string;
  bytes_value?: any; // Uint8Array or similar in JS
  description?: string;
}

export interface ORDVessel {
  type?: string;
  details?: string;
  material?: string;
  volume?: { value: number; units: string };
}

export interface ORDReactionSetup {
  vessel?: ORDVessel;
  is_automated?: boolean;
  automation_platform?: string;
  automation_code?: Record<string, ORDData>;
  environment?: {
    type?: string;
    details?: string;
  };
}

export interface ORDReactionObservation {
  time?: ORDTime;
  comment?: string;
  image?: ORDData;
}

export interface ORDReactionWorkup {
  type?: string; // e.g. "ADDITION", "TEMPERATURE", "WASH", "DRY", "FILTER", etc.
  details?: string;
  duration?: ORDTime;
  input?: ORDReactionInput;
  amount?: {
    mass?: { value: number; units: string };
    moles?: { value: number; units: string };
    volume?: { value: number; units: string };
  };
  temperature?: {
    value: number;
    units: 'CELSIUS' | 'KELVIN';
  };
  keep_phase?: string;
  stirring?: {
    type?: string;
    rate?: { value: number; units: string };
  };
  target_ph?: number;
  is_automated?: boolean;
}

export interface ORDReaction {
  reaction_id: string;
  identifiers?: ORDIdentifier[];
  inputs: Record<string, ORDReactionInput>; // e.g., "reactants": { ... }
  setup?: ORDReactionSetup;
  conditions?: ORDConditions;
  notes?: string;
  observations?: ORDReactionObservation[];
  workups?: ORDReactionWorkup[];
  outcomes?: ORDReactionOutcome[];
  provenance?: ORDProvenance;
}

// --- Bioblio Custom Extensions ---

export interface BioblioReaction {
  // Universal Identifiers
  id: string;
  name: string;
  names: Names;
  description: string; 
  category: string;
  tags?: string[];
  smarts?: string;

  // Visualization & Mechanism
  trajectory?: string;       // "sn2Trajectory"
  reaction_arrows?: string;  // "sn2Arrows"
  
  // UI/Display
  label?: string;            // "R-OH+PCC->R-CHO"
  
  // Extended Thermodynamics/Kinetics (Theoretical/Universal)
  deltaG?: string;
  deltaH?: string;
  k?: string;
  
  // External Resources
  links_ref?: string[];
  video_experiment?: string;
  
  // Integration with internal models (Universal reactants/products)
  reactants: Reagent[];
  products: Reagent[];
  
  // Helper fields for UI
  conditions?: string[];
  temperature?: string;
  solvent?: string;
  yield?: number;

  // Experimental Samples (ORD Data)
  reactions: ORDReaction[];
}

