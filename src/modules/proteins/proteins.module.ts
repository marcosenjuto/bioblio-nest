import { Module } from '@nestjs/common';
import { ProteinsService } from './proteins.service';
import { ProteinsController } from './proteins.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ObjectVersionsModule } from '../object-versions/object-versions.module';

@Module({
  imports: [PrismaModule, ObjectVersionsModule],
  controllers: [ProteinsController],
  providers: [ProteinsService],
  exports: [ProteinsService],
})
export class ProteinsModule {}
