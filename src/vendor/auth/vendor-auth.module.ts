import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthService } from './vendor-auth.service';
import { UserModule } from '../../user/user.module';
import { EmailModule } from '../../email/email.module';
@Module({
  imports: [UserModule, EmailModule, JwtModule.register({})],
  controllers: [VendorAuthController],
  providers: [VendorAuthService],
  exports: [VendorAuthService],
})
export class VendorAuthModule {}
