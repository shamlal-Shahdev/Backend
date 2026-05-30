import { Module } from '@nestjs/common';
import { AdminCertificateController } from './admin-certificate.controller';
import { CertificateModule } from '../../certificate/certificate.module';

@Module({
  imports: [CertificateModule],
  controllers: [AdminCertificateController],
})
export class AdminCertificateModule {}
