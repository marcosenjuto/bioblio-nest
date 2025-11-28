import { Module } from '@nestjs/common';
import { ReactionsService } from './reactions.service';
import { ReactionsController } from './reactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ObjectVersionsModule } from '../object-versions/object-versions.module';

@Module({
  imports: [PrismaModule, ObjectVersionsModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
