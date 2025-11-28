import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { ObjectVersionsService } from '../object-versions/object-versions.service';

@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private objectVersionsService: ObjectVersionsService,
  ) {}

  async create(createArticleDto: CreateArticleDto, userId: string) {
    const { tags, ...articleData } = createArticleDto;

    const articleCompleteData = {
      ...articleData,
      tags,
    };

    const { object } = await this.objectVersionsService.createObject(
      articleCompleteData,
      userId
    );

    const article = await this.prisma.article.create({
      data: {
        ...articleData,
        tags: tags ? JSON.stringify(tags) : undefined,
        author: { connect: { id: userId } },
        object: {
          connect: { id: object.id }
        }
      },
    });

    return article;
  }

  async findAll() {
    const articles = await this.prisma.article.findMany();
    return articles.map(a => ({
      ...a,
      tags: a.tags ? JSON.parse(a.tags) : null,
    }));
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { object: true, author: true }
    });
    if (!article) throw new NotFoundException(`Article with ID ${id} not found`);
    
    return {
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : null,
    };
  }

  async update(id: string, updateArticleDto: UpdateArticleDto) {
    const { tags, ...articleData } = updateArticleDto;
    
    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
        tags: tags ? JSON.stringify(tags) : undefined,
      }
    });

    return {
      ...article,
      tags: article.tags ? JSON.parse(article.tags) : null,
    };
  }

  async remove(id: string) {
    return this.prisma.article.delete({ where: { id } });
  }

  async proposeChanges(id: string, userId: string, updateArticleDto: UpdateArticleDto) {
    const article = await this.findOne(id);
    if (!article.objectId) {
        throw new Error("Article is not linked to an object versioning system");
    }

    return this.objectVersionsService.createVersion(
      article.objectId,
      userId,
      { data: updateArticleDto, comment: 'Proposed changes' }
    );
  }
}
