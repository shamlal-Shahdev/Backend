import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { UserSchemaClass } from '../../../../users/infrastructure/persistence/document/entities/user.schema';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly model: Model<UserSchemaClass>,
  ) {}

  async run() {
    const admin = await this.model.findOne({
      email: 'admin@example.com',
    });

    if (!admin) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      const data = new this.model({
        name: 'Super Admin',
        email: 'admin@example.com',
        password: password,
        installationType: 'commercial',
        isVerified: true,
        verificationToken: null,
        resetToken: null,
      });
      await data.save();
    }

    const user = await this.model.findOne({
      email: 'john.doe@example.com',
    });

    if (!user) {
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('secret', salt);

      const data = new this.model({
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: password,
        installationType: 'residential',
        isVerified: true,
        verificationToken: null,
        resetToken: null,
      });

      await data.save();
    }
  }
}
