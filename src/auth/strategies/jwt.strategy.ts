import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrNeverType } from '../../utils/types/or-never.type';
import { JwtPayloadType } from './types/jwt-payload.type';
import { AllConfigType } from '../../config/config.type';
import { UserEntity } from '../../user/entity/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService<AllConfigType>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow('auth.secret', { infer: true }),
    });
  }

  async validate(payload: JwtPayloadType): Promise<OrNeverType<UserEntity>> {
    if (!payload.id || !payload.email) {
      throw new UnauthorizedException();
    }

    // Load user from database to get role information
    const userId =
      typeof payload.id === 'string' ? parseInt(payload.id, 10) : payload.id;
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'role'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
