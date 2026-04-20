import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';
import { UserModule } from '../../user/user.module';
import { EmailModule } from '../../email/email.module';
import { VendorCompanyProfileModule } from '../company-profile/vendor-company-profile.module';

@Module({
  imports: [
    UserModule,
    EmailModule,
    VendorCompanyProfileModule,
    JwtModule.register({}),
  ],
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
  exports: [VendorAuthService],
})
export class VendorAuthModule {}
