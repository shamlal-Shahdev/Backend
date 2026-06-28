import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminKycModule } from './kyc/kyc.module';
import { AdminUsersModule } from './users/users.module';
import { AdminDashboardModule } from './dashboard/dashboard.module';
import { AdminAuditModule } from './audit/audit.module';
import { AdminInstallationModule } from './installation/installation.module';
import { AdminEnergyRequestModule } from './energy-request/energy-request.module';
import { AdminCertificateModule } from './certificate/admin-certificate.module';
import { AdminPredictionModule } from './prediction/admin-prediction.module';
import { AdminMarketplaceModule } from './marketplace/admin-marketplace.module';
@Module({
  imports: [
    AdminAuthModule,
    AdminKycModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminAuditModule,
    AdminInstallationModule,
    AdminEnergyRequestModule,
    AdminCertificateModule,
    AdminPredictionModule,
    AdminMarketplaceModule,
  ],
  exports: [
    AdminAuthModule,
    AdminKycModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminAuditModule,
    AdminInstallationModule,
    AdminEnergyRequestModule,
    AdminCertificateModule,
    AdminPredictionModule,
    AdminMarketplaceModule,
  ],
})
export class AdminModule {}
