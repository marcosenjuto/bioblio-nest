import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ProteinsService } from './proteins.service';
import { CreateProteinDto, UpdateProteinDto } from './dto/protein.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Proteins')
@Controller('proteins')
export class ProteinsController {
  constructor(private readonly proteinsService: ProteinsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new protein' })
  create(@Body() createProteinDto: CreateProteinDto, @Request() req) {
    return this.proteinsService.create(createProteinDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all proteins' })
  findAll() {
    return this.proteinsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a protein by id' })
  findOne(@Param('id') id: string) {
    return this.proteinsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a protein' })
  update(@Param('id') id: string, @Body() updateProteinDto: UpdateProteinDto) {
    return this.proteinsService.update(id, updateProteinDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a protein' })
  remove(@Param('id') id: string) {
    return this.proteinsService.remove(id);
  }

  @Post(':id/propose-changes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose changes to a protein' })
  proposeChanges(@Param('id') id: string, @Body() updateProteinDto: UpdateProteinDto, @Request() req) {
    return this.proteinsService.proposeChanges(id, req.user.id, updateProteinDto);
  }
}
