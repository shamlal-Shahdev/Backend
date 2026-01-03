import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceItemService } from './marketplace-item.service';
import { MarketplaceItemController } from './marketplace-item.controller';
import { MarketplaceItemEntity } from './entity/marketplace-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceItemEntity])],
  controllers: [MarketplaceItemController],
  providers: [MarketplaceItemService],
  exports: [MarketplaceItemService],
})
export class MarketplaceItemModule {}
