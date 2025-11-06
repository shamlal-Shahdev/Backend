import { User } from '../../../../domain/user';
import { UserSchemaClass } from '../entities/user.schema';

export class UserMapper {
  static toDomain(raw: UserSchemaClass): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.email = raw.email;
    domainEntity.password = raw.password;
    domainEntity.isVerified = raw.isVerified;
    domainEntity.verificationToken = raw.verificationToken;
    domainEntity.resetToken = raw.resetToken;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserSchemaClass {
    const persistenceEntity = new UserSchemaClass();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.email = domainEntity.email;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.isVerified = domainEntity.isVerified;
    persistenceEntity.verificationToken = domainEntity.verificationToken;
    persistenceEntity.resetToken = domainEntity.resetToken;
    return persistenceEntity;
  }
}

