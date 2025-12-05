import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReactionDto, UpdateReactionDto } from './dto/reaction.dto';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

@Injectable()
export class ReactionsService {
  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  async create(createReactionDto: CreateReactionDto, userId: string) {
    const { 
        names, description, category, smarts, 
        reactants, products, reactions, 
        ...otherData 
    } = createReactionDto;

    const dataJsonObj = {
        ...otherData,
        reactions
    };

    const reactionCompleteData = {
      ...createReactionDto
    };

    const { object } = await this.objectVersionsService.createObject(
      reactionCompleteData,
      userId
    );

    // Derive name for DB
    const dbName = names.common?.[0] || names.iupac || 'Unknown Reaction';

    const reaction = await this.prisma.reaction.create({
      data: {
        name: dbName,
        namesJson: JSON.stringify(names),
        description,
        category,
        reactionString: smarts,
        
        reactantsJson: JSON.stringify(reactants),
        productsJson: JSON.stringify(products),
        dataJson: JSON.stringify(dataJsonObj),
        
        object: {
          connect: { id: object.id }
        }
      },
    });

    return this.mapToDto(reaction);
  }

  async findAll() {
    const reactions = await this.prisma.reaction.findMany();
    return reactions.map(r => this.mapToDto(r));
  }

  async findOne(id: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
      include: { object: true }
    });
    if (!reaction) throw new NotFoundException(`Reaction with ID ${id} not found`);
    
    return this.mapToDto(reaction);
  }

  async update(id: string, updateReactionDto: UpdateReactionDto) {
    const { 
        names, description, category, smarts, 
        reactants, products, reactions, 
        ...otherData 
    } = updateReactionDto;
    
    const dataJsonObj = {
        ...otherData,
        reactions
    };

    const dbName = names ? (names.common?.[0] || names.iupac) : undefined;

    const reaction = await this.prisma.reaction.update({
      where: { id },
      data: {
        name: dbName,
        namesJson: names ? JSON.stringify(names) : undefined,
        description,
        category,
        reactionString: smarts,
        
        reactantsJson: reactants ? JSON.stringify(reactants) : undefined,
        productsJson: products ? JSON.stringify(products) : undefined,
        dataJson: JSON.stringify(dataJsonObj),
      }
    });

    return this.mapToDto(reaction);
  }

  async remove(id: string) {
    return this.prisma.reaction.delete({ where: { id } });
  }

  async proposeChanges(id: string, userId: string, updateReactionDto: UpdateReactionDto) {
    const reaction = await this.findOne(id);
    if (!reaction.objectId) {
        throw new Error("Reaction is not linked to an object versioning system");
    }

    return this.objectVersionsService.createVersion(
      reaction.objectId,
      userId,
      { data: updateReactionDto, comment: 'Proposed changes' }
    );
  }

  private mapToDto(reaction: any) {
    const data = reaction.dataJson ? JSON.parse(reaction.dataJson) : {};
    const { reactions, ...otherData } = data;
    
    return {
      id: reaction.id,
      names: reaction.namesJson ? JSON.parse(reaction.namesJson) : { common: [reaction.name], iupac: reaction.name },
      description: reaction.description,
      category: reaction.category,
      smarts: reaction.reactionString,
      reactants: reaction.reactantsJson ? JSON.parse(reaction.reactantsJson) : [],
      products: reaction.productsJson ? JSON.parse(reaction.productsJson) : [],
      reactions: reactions || [],
      ...otherData
    };
  }
}
