import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { CreateReactionDto, UpdateReactionDto } from './dto/reaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reactions')
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new reaction' })
  create(@Body() createReactionDto: CreateReactionDto, @Request() req) {
    return this.reactionsService.create(createReactionDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reactions' })
  findAll() {
    return this.reactionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reaction by id' })
  findOne(@Param('id') id: string) {
    return this.reactionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a reaction' })
  update(@Param('id') id: string, @Body() updateReactionDto: UpdateReactionDto) {
    return this.reactionsService.update(id, updateReactionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a reaction' })
  remove(@Param('id') id: string) {
    return this.reactionsService.remove(id);
  }

  @Post(':id/propose-changes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose changes to a reaction' })
  proposeChanges(@Param('id') id: string, @Body() updateReactionDto: UpdateReactionDto, @Request() req) {
    return this.reactionsService.proposeChanges(id, req.user.id, updateReactionDto);
  }
}
