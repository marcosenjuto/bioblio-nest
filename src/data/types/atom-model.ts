export interface Atom {
  index: number;
  symbol: string;
  atomicNumber: number;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  charge?: number;
  isotope?: number;
  properties?: Record<string, any>;
}
