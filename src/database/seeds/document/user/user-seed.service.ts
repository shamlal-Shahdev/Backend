import { Injectable } from '@nestjs/common';
// import { UserSchemaClass } from '../../../../users/infrastructure/persistence/document/entities/user.schema'; // Old users module not found

// MongoDB user seed disabled - user schema not available
@Injectable()
export class UserSeedService {
  constructor() {} // private readonly model: Model<UserSchemaClass>, // @InjectModel(UserSchemaClass.name)

  async run() {
    // MongoDB user seed disabled - user schema not available
    // const admin = await this.model.findOne({
    //   email: 'admin@example.com',
    // });
    // ... rest of method commented out
  }
}
