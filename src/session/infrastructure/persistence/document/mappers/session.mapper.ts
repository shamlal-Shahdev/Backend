// import { UserSchemaClass } from '../../../../../users/infrastructure/persistence/document/entities/user.schema'; // Old users module not found
// import { UserMapper } from '../../../../../users/infrastructure/persistence/document/mappers/user.mapper'; // Old users module not found
import { Session } from '../../../../domain/session';
import { SessionSchemaClass } from '../entities/session.schema';

export class SessionMapper {
  static toDomain(raw: SessionSchemaClass): Session {
    const domainEntity = new Session();
    domainEntity.id = raw._id.toString();

    if (raw.user) {
      // UserMapper not available - direct mapping
      domainEntity.user = raw.user as any;
    }

    domainEntity.hash = raw.hash;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.deletedAt = raw.deletedAt;
    return domainEntity;
  }
  static toPersistence(domainEntity: Session): SessionSchemaClass {
    // UserSchemaClass not available - using temporary object
    const persistenceSchema = { _id: domainEntity.user.id.toString() } as any;
    const sessionEntity = new SessionSchemaClass();
    if (domainEntity.id && typeof domainEntity.id === 'string') {
      sessionEntity._id = domainEntity.id;
    }
    sessionEntity.user = persistenceSchema;
    sessionEntity.hash = domainEntity.hash;
    sessionEntity.createdAt = domainEntity.createdAt;
    sessionEntity.updatedAt = domainEntity.updatedAt;
    sessionEntity.deletedAt = domainEntity.deletedAt;
    return sessionEntity;
  }
}
