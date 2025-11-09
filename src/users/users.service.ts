import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NullableType } from '../utils/types/nullable.type';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeepPartial } from '../utils/types/deep-partial.type';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UserRepository) {}

  async create(createUserDto: {
    name?: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string | null;
    isVerified: boolean;
    verificationToken: string | null;
    resetToken: string | null;
  }): Promise<User> {
    const userObject = await this.usersRepository.findByEmail(createUserDto.email);
      if (userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailAlreadyExists',
          },
        });
    }

    // Create User domain object with firstName and lastName
    const userData: User & { firstName: string; lastName: string } = {
      name: createUserDto.name || createUserDto.firstName + ' ' + createUserDto.lastName,
      email: createUserDto.email,
      password: createUserDto.password,
      phone: createUserDto.phone || null,
      isVerified: createUserDto.isVerified,
      verificationToken: createUserDto.verificationToken,
      resetToken: createUserDto.resetToken,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    } as any;

    return this.usersRepository.create(userData);
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions: null,
      sortOptions: null,
      paginationOptions: {
        page: 1,
        limit: 1000,
      },
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findByVerificationToken(token: string): Promise<NullableType<User>> {
    return this.usersRepository.findByVerificationToken(token);
  }

  findByResetToken(token: string): Promise<NullableType<User>> {
    return this.usersRepository.findByResetToken(token);
  }

  async update(
    id: User['id'],
    updateData: DeepPartial<User> | UpdateUserDto,
  ): Promise<User | null> {
    return this.usersRepository.update(id, updateData);
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.remove(id);
  }
}
