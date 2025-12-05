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
    const { metadata, chains, names, ...proteinData } = createProteinDto;

    const proteinCompleteData = {
      ...proteinData,
      names,
      metadata,
      chains,
    };

    const { object } = await this.objectVersionsService.createObject(
      proteinCompleteData,
      userId
    );

    // Derive name for DB
    const dbName = names.common?.[0] || names.iupac || 'Unknown Protein';

    const protein = await this.prisma.protein.create({
      data: {
        ...proteinData,
        name: dbName,
        namesJson: JSON.stringify(names),
        metadataJson: metadata ? JSON.stringify(metadata) : undefined,
        chainsJson: chains ? JSON.stringify(chains) : undefined,
        object: {
          connect: { id: object.id }
        }
      },
    });

    return this.mapToDto(protein);
  }

  async findAll() {
    const proteins = await this.prisma.protein.findMany();
    return proteins.map(p => this.mapToDto(p));
  }

  async findOne(id: string) {
    const protein = await this.prisma.protein.findUnique({
      where: { id },
      include: { object: true }
    });
    if (!protein) throw new NotFoundException(`Protein with ID ${id} not found`);
    
    return this.mapToDto(protein);
  }

  async update(id: string, updateProteinDto: UpdateProteinDto) {
    const { metadata, chains, names, ...proteinData } = updateProteinDto;
    
    const dbName = names ? (names.common?.[0] || names.iupac) : undefined;

    const protein = await this.prisma.protein.update({
      where: { id },
      data: {
        ...proteinData,
        name: dbName,
        namesJson: names ? JSON.stringify(names) : undefined,
        metadataJson: metadata ? JSON.stringify(metadata) : undefined,
        chainsJson: chains ? JSON.stringify(chains) : undefined,
      }
    });

    return this.mapToDto(protein);
  }

  async remove(id: string) {
    const protein = await this.prisma.protein.delete({ where: { id } });
    return this.mapToDto(protein);
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

  private mapToDto(protein: any) {
    const { namesJson, metadataJson, chainsJson, detailsJson, ...cleanProtein } = protein;
    
    return {
      ...cleanProtein,
      names: namesJson ? JSON.parse(namesJson) : null,
      metadata: metadataJson ? JSON.parse(metadataJson) : null,
      chains: chainsJson ? JSON.parse(chainsJson) : null,
      details: detailsJson ? JSON.parse(detailsJson) : null,
    };
  }
}
