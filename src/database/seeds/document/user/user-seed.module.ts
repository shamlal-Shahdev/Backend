import { Module } from '@nestjs/common';
import { UserSeedService } from './user-seed.service';
// MongoDB user schema not available - old users module removed
// import {
//   UserSchemaClass,
//   UserSchema,
// } from '../../../../users/infrastructure/persistence/document/entities/user.schema';

@Module({
  imports: [
    // MongoDB user seed disabled - user schema not available
    // MongooseModule.forFeature([
    //   {
    //     name: UserSchemaClass.name,
    //     schema: UserSchema,
    //   },
    // ]),
  ],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
