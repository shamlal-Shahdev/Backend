import { Module } from '@nestjs/common';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminKycModule } from './kyc/kyc.module';
import { AdminUsersModule } from './users/users.module';
import { AdminDashboardModule } from './dashboard/dashboard.module';
import { AdminAuditModule } from './audit/audit.module';
import { AdminInstallationModule } from './installation/installation.module';
import { AdminEnergyRequestModule } from './energy-request/energy-request.module';

@Module({
  imports: [
    AdminAuthModule,
    AdminKycModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminAuditModule,
    AdminInstallationModule,
    AdminEnergyRequestModule,
  ],
  exports: [
    AdminAuthModule,
    AdminKycModule,
    AdminUsersModule,
    AdminDashboardModule,
    AdminAuditModule,
    AdminInstallationModule,
    AdminEnergyRequestModule,
  ],
})
export class AdminModule {}
