import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { MoleculesService } from './molecules.service';
import { CreateMoleculeDto, UpdateMoleculeDto } from './dto/molecule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Molecules')
@Controller('molecules')
export class MoleculesController {
  constructor(private readonly moleculesService: MoleculesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new molecule' })
  create(@Body() createMoleculeDto: CreateMoleculeDto, @Request() req) {
    return this.moleculesService.create(createMoleculeDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all molecules' })
  findAll() {
    return this.moleculesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a molecule by id' })
  findOne(@Param('id') id: string) {
    return this.moleculesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a molecule' })
  update(@Param('id') id: string, @Body() updateMoleculeDto: UpdateMoleculeDto) {
    return this.moleculesService.update(id, updateMoleculeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a molecule' })
  remove(@Param('id') id: string) {
    return this.moleculesService.remove(id);
  }

  @Post(':id/propose-changes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Propose changes to a molecule' })
  proposeChanges(@Param('id') id: string, @Body() updateMoleculeDto: UpdateMoleculeDto, @Request() req) {
    return this.moleculesService.proposeChanges(id, req.user.id, updateMoleculeDto);
  }
}
