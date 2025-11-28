import { Module } from '@nestjs/common';
import { MoleculesService } from './molecules.service';
import { MoleculesController } from './molecules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ObjectVersionsModule } from '../object-versions/object-versions.module';

@Module({
  imports: [PrismaModule, ObjectVersionsModule],
  controllers: [MoleculesController],
  providers: [MoleculesService],
  exports: [MoleculesService],
})
export class MoleculesModule {}
