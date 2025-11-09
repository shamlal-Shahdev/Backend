import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository, In } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: User & { firstName?: string; lastName?: string }): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    
    // If firstName and lastName are provided, set them directly on the entity
    if (data.firstName) {
      persistenceModel.firstName = data.firstName;
    }
    if (data.lastName) {
      persistenceModel.lastName = data.lastName;
    }
    
    // If firstName/lastName not provided but name is, try to extract them
    if (!persistenceModel.firstName && !persistenceModel.lastName && persistenceModel.name) {
      const nameParts = persistenceModel.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        persistenceModel.firstName = nameParts[0];
        persistenceModel.lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        persistenceModel.firstName = nameParts[0];
        persistenceModel.lastName = '';
      }
    }
    
    // Ensure firstName and lastName are set (required fields)
    if (!persistenceModel.firstName) {
      persistenceModel.firstName = persistenceModel.name || 'User';
    }
    if (!persistenceModel.lastName) {
      persistenceModel.lastName = '';
    }
    
    // Log phone before saving
    console.log('📱 Creating user entity with phone:', {
      phone: persistenceModel.phone,
      email: persistenceModel.email,
      firstName: persistenceModel.firstName,
      lastName: persistenceModel.lastName,
    });
    
    const newEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );
    
    // Log phone after saving
    console.log('✅ User entity created with phone:', {
      id: newEntity.id,
      phone: newEntity.phone,
      email: newEntity.email,
    });
    
    return UserMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: FindOptionsWhere<UserEntity> = {};

    const entities = await this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ) || { createdAt: 'DESC' },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findOne({
      where: { id: id as string },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids as string[]) },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) {
      return null;
    }

    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = email.toLowerCase().trim();

    // Query with exact email match (case-insensitive comparison)
    // This ensures we don't get false positives from case differences
    const entity = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: normalizedEmail })
      .getOne();

    // Additional safety check: if entity found, verify exact match
    if (entity) {
      // Verify the stored email matches (case-insensitive)
      if (entity.email.toLowerCase().trim() !== normalizedEmail) {
        // This should never happen, but log it if it does
        console.warn(`Email mismatch: searched for "${normalizedEmail}", found "${entity.email}"`);
        return null;
      }
      return UserMapper.toDomain(entity);
    }

    return null;
  }

  async findByVerificationToken(token: string): Promise<NullableType<User>> {
    if (!token) return null;

    const entity = await this.usersRepository.findOne({
      where: { verificationToken: token },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByResetToken(token: string): Promise<NullableType<User>> {
    if (!token) return null;

    const entity = await this.usersRepository.findOne({
      where: { resetToken: token },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async update(id: User['id'], payload: Partial<User>): Promise<User | null> {
    const entity = await this.usersRepository.findOne({
      where: { id: id as string },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.usersRepository.save(
      this.usersRepository.create(
        UserMapper.toPersistence({
          ...UserMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UserMapper.toDomain(updatedEntity);
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.delete(id);
  }
}

