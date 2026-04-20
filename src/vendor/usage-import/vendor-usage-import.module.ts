import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorUsageImportController } from './vendor-usage-import.controller';
import { VendorUsageImportService } from './vendor-usage-import.service';
import { VendorUsageImportParserService } from './vendor-usage-import-parser.service';
import { VendorUsageImportCronService } from './vendor-usage-import.cron';
import { VendorUsageImportBatchEntity } from './entity/vendor-usage-import-batch.entity';
import { VendorUsageImportRowEntity } from './entity/vendor-usage-import-row.entity';
import { InstallationEntity } from '../../installation/entity/installation.entity';
import { RewardTransactionEntity } from '../../reward-transaction/entity/reward-transaction.entity';
import { TokenMintEventEntity } from '../../token-mint-event/entity/token-mint-event.entity';
import { FilesModule } from '../../files/files.module';
import { VendorCompanyProfileModule } from '../company-profile/vendor-company-profile.module';
import { BlockchainModule } from '../../blockchain/blockchain.module';
import { UserWalletModule } from '../../user-wallet/user-wallet.module';

@Module({
  imports: [
    VendorCompanyProfileModule,
    TypeOrmModule.forFeature([
      VendorUsageImportBatchEntity,
      VendorUsageImportRowEntity,
      InstallationEntity,
      RewardTransactionEntity,
      TokenMintEventEntity,
    ]),
    FilesModule,
    BlockchainModule,
    UserWalletModule,
  ],
  controllers: [VendorUsageImportController],
  providers: [
    VendorUsageImportService,
    VendorUsageImportParserService,
    VendorUsageImportCronService,
  ],
  exports: [VendorUsageImportService],
})
export class VendorUsageImportModule {}
