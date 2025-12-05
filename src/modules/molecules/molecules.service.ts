import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMoleculeDto, UpdateMoleculeDto, MoleculeType } from './dto/molecule.dto';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

@Injectable()
export class MoleculesService {
  private readonly logger = new Logger(MoleculesService.name);

  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  async create(createMoleculeDto: CreateMoleculeDto, userId: string) {
    const { structure, names, molecular, physical, thermodynamic, chemical, spectroscopy, safety, sources, ...moleculeData } = createMoleculeDto;

    const properties = {
        physical, thermodynamic, chemical, spectroscopy, safety, sources
    };

    const moleculeCompleteData = {
      ...moleculeData,
      structure,
      names,
      molecular,
      ...properties
    };

    // Create object with initial version
    const { object } = await this.objectVersionsService.createObject(
      moleculeCompleteData,
      userId
    );

    // Derive name for DB
    const dbName = names.common?.[0] || names.iupac || 'Unknown Molecule';

    // Create the actual molecule
    const molecule = await this.prisma.molecule.create({
      data: {
        name: dbName,
        description: `Imported molecule: ${dbName}`, 
        type: moleculeData.type,
        cid: moleculeData.cid,
        cas: moleculeData.cas,
        chemblId: moleculeData.chemblId,
        smiles: structure?.smiles,
        inchi: structure?.inchi,
        formula: structure?.molecularFormula,
        weight: molecular?.weight,
        
        namesJson: JSON.stringify(names),
        structureJson: structure ? JSON.stringify(structure) : undefined,
        propertiesJson: JSON.stringify(properties),
        
        object: {
          connect: { id: object.id }
        }
      },
    });

    return this.mapToDto(molecule);
  }

  async findAll() {
    const molecules = await this.prisma.molecule.findMany();
    return molecules.map(m => this.mapToDto(m));
  }

  async findOne(id: string) {
    const molecule = await this.prisma.molecule.findUnique({
      where: { id },
      include: { object: true }
    });
    
    if (molecule) {
      return this.mapToDto(molecule);
    }

    // If not found in DB, try PubChem if ID looks like a CID (numeric)
    if (/^\d+$/.test(id)) {
      const cid = parseInt(id);

      // Check if we already have this CID in the database
      const existingByCid = await this.prisma.molecule.findFirst({
        where: { cid },
        include: { object: true }
      });

      if (existingByCid) {
        return this.mapToDto(existingByCid);
      }

      try {
        return await this.importFromPubChem(cid);
      } catch (error) {
        this.logger.error(`Failed to import CID ${id} from PubChem: ${error.message}`);
        // Fall through to throw NotFoundException
      }
    } else {
      // Try to find by name in DB
      const existingByName = await this.prisma.molecule.findFirst({
        where: { 
            OR: [
                { name: id },
                { iupacName: id }
            ]
        },
        include: { object: true }
      });

      if (existingByName) {
        return this.mapToDto(existingByName);
      }

      // Try PubChem by name
      try {
        return await this.importFromPubChemByName(id);
      } catch (error) {
        this.logger.error(`Failed to import molecule '${id}' from PubChem: ${error.message}`);
      }
    }

    throw new NotFoundException(`Molecule with ID ${id} not found`);
  }

  async update(id: string, updateMoleculeDto: UpdateMoleculeDto) {
    const { structure, names, molecular, physical, thermodynamic, chemical, spectroscopy, safety, sources, ...moleculeData } = updateMoleculeDto;
    
    const properties = {
        physical, thermodynamic, chemical, spectroscopy, safety, sources
    };

    const molecule = await this.prisma.molecule.update({
      where: { id },
      data: {
        ...moleculeData,
        name: names?.common?.[0] || names?.iupac, // Update name if names changed
        weight: molecular?.weight,
        namesJson: names ? JSON.stringify(names) : undefined,
        structureJson: structure ? JSON.stringify(structure) : undefined,
        propertiesJson: JSON.stringify(properties),
      }
    });

    return this.mapToDto(molecule);
  }

  async remove(id: string) {
    const molecule = await this.prisma.molecule.delete({ where: { id } });
    return this.mapToDto(molecule);
  }

  async proposeChanges(id: string, userId: string, updateMoleculeDto: UpdateMoleculeDto) {
    const molecule = await this.findOne(id);
    if (!molecule.objectId) {
        throw new Error("Molecule is not linked to an object versioning system");
    }

    return this.objectVersionsService.createVersion(
      molecule.objectId,
      userId,
      { data: updateMoleculeDto, comment: 'Proposed changes' }
    );
  }

  private mapToDto(molecule: any) {
    const { namesJson, structureJson, propertiesJson, ...cleanMolecule } = molecule;
    const properties = propertiesJson ? JSON.parse(propertiesJson) : {};
    
    return {
      ...cleanMolecule,
      names: namesJson ? JSON.parse(namesJson) : null,
      structure: structureJson ? JSON.parse(structureJson) : null,
      molecular: { weight: molecule.weight }, // Reconstruct molecular object partially
      ...properties // Spread physical, thermodynamic, etc.
    };
  }

  private async importFromPubChem(cid: number) {
    this.logger.log(`[PubChem] Fetching CID ${cid}...`);
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/JSON`);
    
    if (!response.ok) {
      throw new Error(`PubChem API error: ${response.statusText}`);
    }

    const data = await response.json();
    const compound = data.PC_Compounds?.[0];

    if (!compound) {
      throw new Error('No compound data found in PubChem response');
    }

    // Fetch synonyms for common name
    let commonName = `CID ${cid}`;
    try {
        const synonymsRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`);
        if (synonymsRes.ok) {
            const synData = await synonymsRes.json();
            const synonyms = synData.InformationList?.Information?.[0]?.Synonym || [];
            if (synonyms.length > 0) commonName = synonyms[0];
        }
    } catch (e) {
        this.logger.warn(`Failed to fetch synonyms for CID ${cid}`);
    }

    // Map PubChem data to DTO
    const props = compound.props || [];
    const getValue = (label: string, name?: string) => {
      const prop = props.find((p: any) => p.urn.label === label && (!name || p.urn.name === name));
      return prop?.value?.sval || prop?.value?.fval || prop?.value?.ival || prop?.value?.binary;
    };

    const iupacName = getValue('IUPAC Name', 'Preferred') || getValue('IUPAC Name', 'Systematic') || getValue('IUPAC Name', 'Traditional') || commonName;
    const smiles = getValue('SMILES', 'Canonical') || getValue('SMILES', 'Isomeric') || getValue('SMILES', 'Absolute') || getValue('SMILES', 'Connectivity');
    const inchi = getValue('InChI', 'Standard') || getValue('InChI');
    const inchikey = getValue('InChIKey', 'Standard') || getValue('InChIKey');
    const formula = getValue('Molecular Formula');
    const weight = getValue('Molecular Weight');

    // Create DTO
    const dto: CreateMoleculeDto = {
      type: MoleculeType.SMALL_MOLECULE,
      cid: cid,
      names: {
        iupac: iupacName as string,
        common: [commonName],
      },
      structure: {
        smiles: smiles as string,
        inchi: inchi as string,
        inchikey: inchikey as string,
        molecularFormula: formula as string,
      },
      molecular: {
        weight: parseFloat(weight as string) || 0,
        exactMass: 0, 
        monoisotopicMass: 0,
        charge: compound.charge || 0
      }
    };

    // Get a system user
    const systemUser = await this.prisma.user.findFirst(); 
    if (!systemUser) throw new Error('No user found to attribute import to');

    return this.create(dto, systemUser.id);
  }

  private async importFromPubChemByName(name: string) {
    this.logger.log(`[PubChem] Searching for name '${name}'...`);
    const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/JSON`);
    
    if (!response.ok) {
      if (response.status === 404) {
         throw new NotFoundException(`Molecule '${name}' not found in PubChem`);
      }
      throw new Error(`PubChem API error: ${response.statusText}`);
    }

    const data = await response.json();
    const compound = data.PC_Compounds?.[0];

    if (!compound || !compound.id?.id?.cid) {
      throw new Error('No CID found in PubChem response');
    }

    const cid = compound.id.id.cid;
    
    // Check if we already have this CID in the database
    const existingByCid = await this.prisma.molecule.findFirst({
        where: { cid },
        include: { object: true }
    });

    if (existingByCid) {
        return this.mapToDto(existingByCid);
    }

    return this.importFromPubChem(cid);
  }
}
