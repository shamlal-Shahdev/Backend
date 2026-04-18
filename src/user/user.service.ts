import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entity/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: createUserDto.email },
        { walletAddress: createUserDto.walletAddress },
      ],
    });
    if (existingUser) {
      throw new ConflictException(
        'User with this email or wallet address already exists',
      );
    }
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[UserEntity[], number]> {
    const [data, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.findOne(id);
    if (updateUserDto.email || updateUserDto.walletAddress) {
      const existingUser = await this.userRepository.findOne({
        where: [
          updateUserDto.email ? { email: updateUserDto.email } : {},
          updateUserDto.walletAddress
            ? { walletAddress: updateUserDto.walletAddress }
            : {},
        ],
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException(
          'User with this email or wallet address already exists',
        );
      }
    }
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }
  async findByVerificationToken(token: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { verificationToken: token },
    });
  }
  async findByResetToken(token: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { resetToken: token },
    });
  }
  async findById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }
}
