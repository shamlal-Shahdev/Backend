import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRepository } from '../../user.repository';
import { UserSchemaClass } from '../entities/user.schema';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../../../../domain/user';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class UsersDocumentRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly usersRepository: Model<UserSchemaClass>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    const newEntity = await this.usersRepository.create(persistenceModel);
    await newEntity.save();
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
    const query = this.usersRepository.find();

    if (sortOptions && sortOptions.length > 0) {
      const sort: Record<string, 1 | -1> = {};
      sortOptions.forEach((sortOption) => {
        sort[sortOption.orderBy] = sortOption.order === 'ASC' ? 1 : -1;
      });
      query.sort(sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    const skip = (paginationOptions.page - 1) * paginationOptions.limit;
    query.skip(skip).limit(paginationOptions.limit);

    const entities = await query.exec();
    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findById(id).exec();
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      _id: { $in: ids },
    });
    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;
    const entity = await this.usersRepository.findOne({ email }).exec();
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByVerificationToken(token: string): Promise<NullableType<User>> {
    if (!token) return null;
    const entity = await this.usersRepository
      .findOne({ verificationToken: token })
      .exec();
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByResetToken(token: string): Promise<NullableType<User>> {
    if (!token) return null;
    const entity = await this.usersRepository
      .findOne({ resetToken: token })
      .exec();
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async update(id: User['id'], payload: DeepPartial<User>): Promise<User | null> {
    const entity = await this.usersRepository.findById(id).exec();
    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    await entity.save();
    return UserMapper.toDomain(entity);
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.findByIdAndDelete(id).exec();
  }
}

