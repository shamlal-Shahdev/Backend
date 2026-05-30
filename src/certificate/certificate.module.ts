import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificateService } from './certificate.service';
import { CertificateController } from './certificate.controller';
import { CertificatePublicController } from './certificate-public.controller';
import { CertificateEntity } from './entity/certificate.entity';
import { CertificateEligibilityService } from './certificate-eligibility.service';
import { CertificatePdfService } from './certificate-pdf.service';
import { CertificateGenerationService } from './certificate-generation.service';
import { KycEntity } from '../kyc/entity/kyc.entity';
import { InstallationEntity } from '../installation/entity/installation.entity';
import { UserEntity } from '../user/entity/user.entity';
import { EnergyRequestEntity } from '../energy-request/entity/energy-request.entity';
import { RewardTransactionEntity } from '../reward-transaction/entity/reward-transaction.entity';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';
import { UserWalletModule } from '../user-wallet/user-wallet.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CertificateEntity,
      KycEntity,
      InstallationEntity,
      UserEntity,
      EnergyRequestEntity,
      RewardTransactionEntity,
    ]),
    FilesModule,
    EmailModule,
    UserWalletModule,
    forwardRef(() => UserModule),
  ],
  controllers: [CertificateController, CertificatePublicController],
  providers: [
    CertificateService,
    CertificateEligibilityService,
    CertificatePdfService,
    CertificateGenerationService,
  ],
  exports: [CertificateService, CertificateGenerationService],
})
export class CertificateModule {}
