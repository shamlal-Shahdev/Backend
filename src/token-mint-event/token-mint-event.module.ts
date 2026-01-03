import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenMintEventService } from './token-mint-event.service';
import { TokenMintEventController } from './token-mint-event.controller';
import { TokenMintEventEntity } from './entity/token-mint-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TokenMintEventEntity])],
  controllers: [TokenMintEventController],
  providers: [TokenMintEventService],
  exports: [TokenMintEventService],
})
export class TokenMintEventModule {}
