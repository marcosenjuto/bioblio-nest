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
    const { data, ...reactionData } = createReactionDto;

    const reactionCompleteData = {
      ...reactionData,
      data,
    };

    const { object } = await this.objectVersionsService.createObject(
      reactionCompleteData,
      userId
    );

    const reaction = await this.prisma.reaction.create({
      data: {
        ...reactionData,
        data: data ? JSON.stringify(data) : undefined,
        object: {
          connect: { id: object.id }
        }
      },
    });

    return reaction;
  }

  async findAll() {
    const reactions = await this.prisma.reaction.findMany();
    return reactions.map(r => ({
      ...r,
      data: r.data ? JSON.parse(r.data) : null,
    }));
  }

  async findOne(id: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
      include: { object: true }
    });
    if (!reaction) throw new NotFoundException(`Reaction with ID ${id} not found`);
    
    return {
      ...reaction,
      data: reaction.data ? JSON.parse(reaction.data) : null,
    };
  }

  async update(id: string, updateReactionDto: UpdateReactionDto) {
    const { data, ...reactionData } = updateReactionDto;
    
    const reaction = await this.prisma.reaction.update({
      where: { id },
      data: {
        ...reactionData,
        data: data ? JSON.stringify(data) : undefined,
      }
    });

    return {
      ...reaction,
      data: reaction.data ? JSON.parse(reaction.data) : null,
    };
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
}
