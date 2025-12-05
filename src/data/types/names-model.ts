export interface Names {
  iupac: string;
  common: string[];
  trivial?: string;

  // Localized names
  commonLocalized?: { [languageCode: string]: string[] };   // e.g., { es: ["tolueno"], fr: ["toluène"] }
  trivialLocalized?: { [languageCode: string]: string };    // e.g., { es: "acetona clásica" }
}
