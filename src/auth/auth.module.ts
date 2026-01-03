import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AnonymousStrategy } from './strategies/anonymous.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { EmailModule } from '../email/email.module';
import { UserModule } from '../user/user.module';
import { KycModule } from '../kyc/kyc.module';
import { KycEntity } from '../kyc/entity/kyc.entity';
import { UserEntity } from '../user/entity/user.entity';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    UserModule,
    KycModule,
    PassportModule,
    EmailModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([KycEntity, UserEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, AnonymousStrategy],
  exports: [AuthService],
})
export class AuthModule {}
