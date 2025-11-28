import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProteinDto, UpdateProteinDto } from './dto/protein.dto';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

@Injectable()
export class ProteinsService {
  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  async create(createProteinDto: CreateProteinDto, userId: string) {
    const { metadata, chains, ...proteinData } = createProteinDto;

    const proteinCompleteData = {
      ...proteinData,
      metadata,
      chains,
    };

    const { object } = await this.objectVersionsService.createObject(
      proteinCompleteData,
      userId
    );

    const protein = await this.prisma.protein.create({
      data: {
        ...proteinData,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        chains: chains ? JSON.stringify(chains) : undefined,
        object: {
          connect: { id: object.id }
        }
      },
    });

    return protein;
  }

  async findAll() {
    const proteins = await this.prisma.protein.findMany();
    return proteins.map(p => ({
      ...p,
      metadata: p.metadata ? JSON.parse(p.metadata) : null,
      chains: p.chains ? JSON.parse(p.chains) : null,
    }));
  }

  async findOne(id: string) {
    const protein = await this.prisma.protein.findUnique({
      where: { id },
      include: { object: true }
    });
    if (!protein) throw new NotFoundException(`Protein with ID ${id} not found`);
    
    return {
      ...protein,
      metadata: protein.metadata ? JSON.parse(protein.metadata) : null,
      chains: protein.chains ? JSON.parse(protein.chains) : null,
    };
  }

  async update(id: string, updateProteinDto: UpdateProteinDto) {
    const { metadata, chains, ...proteinData } = updateProteinDto;
    
    const protein = await this.prisma.protein.update({
      where: { id },
      data: {
        ...proteinData,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        chains: chains ? JSON.stringify(chains) : undefined,
      }
    });

    return {
      ...protein,
      metadata: protein.metadata ? JSON.parse(protein.metadata) : null,
      chains: protein.chains ? JSON.parse(protein.chains) : null,
    };
  }

  async remove(id: string) {
    return this.prisma.protein.delete({ where: { id } });
  }

  async proposeChanges(id: string, userId: string, updateProteinDto: UpdateProteinDto) {
    const protein = await this.findOne(id);
    if (!protein.objectId) {
        throw new Error("Protein is not linked to an object versioning system");
    }

    return this.objectVersionsService.createVersion(
      protein.objectId,
      userId,
      { data: updateProteinDto, comment: 'Proposed changes' }
    );
  }
}
