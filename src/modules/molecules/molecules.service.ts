import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMoleculeDto, UpdateMoleculeDto } from './dto/molecule.dto';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

@Injectable()
export class MoleculesService {
  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  async create(createMoleculeDto: CreateMoleculeDto, userId: string) {
    const { structure, properties, ...moleculeData } = createMoleculeDto;

    const moleculeCompleteData = {
      ...moleculeData,
      structure,
      properties,
    };

    // Create object with initial version
    const { object } = await this.objectVersionsService.createObject(
      moleculeCompleteData,
      userId
    );

    // Create the actual molecule
    const molecule = await this.prisma.molecule.create({
      data: {
        ...moleculeData,
        structure: structure ? JSON.stringify(structure) : undefined,
        properties: properties ? JSON.stringify(properties) : undefined,
        object: {
          connect: { id: object.id }
        }
      },
    });

    return molecule;
  }

  async findAll() {
    const molecules = await this.prisma.molecule.findMany();
    return molecules.map(m => ({
      ...m,
      structure: m.structure ? JSON.parse(m.structure) : null,
      properties: m.properties ? JSON.parse(m.properties) : null,
    }));
  }

  async findOne(id: string) {
    const molecule = await this.prisma.molecule.findUnique({
      where: { id },
      include: { object: true }
    });
    if (!molecule) throw new NotFoundException(`Molecule with ID ${id} not found`);
    
    return {
      ...molecule,
      structure: molecule.structure ? JSON.parse(molecule.structure) : null,
      properties: molecule.properties ? JSON.parse(molecule.properties) : null,
    };
  }

  async update(id: string, updateMoleculeDto: UpdateMoleculeDto) {
    const { structure, properties, ...moleculeData } = updateMoleculeDto;
    
    const molecule = await this.prisma.molecule.update({
      where: { id },
      data: {
        ...moleculeData,
        structure: structure ? JSON.stringify(structure) : undefined,
        properties: properties ? JSON.stringify(properties) : undefined,
      }
    });

    return {
      ...molecule,
      structure: molecule.structure ? JSON.parse(molecule.structure) : null,
      properties: molecule.properties ? JSON.parse(molecule.properties) : null,
    };
  }

  async remove(id: string) {
    return this.prisma.molecule.delete({ where: { id } });
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
}
