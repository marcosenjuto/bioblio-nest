import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateArticleDto {
  @ApiProperty({ description: 'Title of the article' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Slug of the article' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Content of the article' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Summary' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateArticleDto extends CreateArticleDto {}
