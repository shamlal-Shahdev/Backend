import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domainEntity = new User();
    domainEntity.id = raw.id;
    domainEntity.name = raw.name;
    domainEntity.email = raw.email;
    // Handle phone - can be null in database, but expose as null (not undefined) for proper serialization
    domainEntity.phone = raw.phone !== null && raw.phone !== undefined ? raw.phone : null;
    domainEntity.password = raw.password;
    domainEntity.isVerified = raw.isVerified;
    domainEntity.verificationToken = raw.verificationToken;
    domainEntity.resetToken = raw.resetToken;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    return domainEntity;
  }

  static toPersistence(domainEntity: User): UserEntity {
    const persistenceEntity = new UserEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.name = domainEntity.name;
    persistenceEntity.email = domainEntity.email;
    persistenceEntity.phone = domainEntity.phone ?? null;
    persistenceEntity.password = domainEntity.password;
    persistenceEntity.isVerified = domainEntity.isVerified;
    persistenceEntity.verificationToken = domainEntity.verificationToken ?? null;
    persistenceEntity.resetToken = domainEntity.resetToken ?? null;
    if (domainEntity.createdAt) {
    persistenceEntity.createdAt = domainEntity.createdAt;
    }
    if (domainEntity.updatedAt) {
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    }
    return persistenceEntity;
  }
}
