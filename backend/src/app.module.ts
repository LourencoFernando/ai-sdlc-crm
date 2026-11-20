import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MetaModule } from './meta/meta.module';

@Module({ imports: [PrismaModule, MetaModule] })
export class AppModule {}
