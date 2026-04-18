import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceEntity } from './entity/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(DeviceEntity)
    private readonly deviceRepository: Repository<DeviceEntity>,
  ) {}
  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceEntity> {
    const existingDevice = await this.deviceRepository.findOne({
      where: { deviceUuid: createDeviceDto.deviceUuid },
    });
    if (existingDevice) {
      throw new ConflictException('Device with this UUID already exists');
    }
    const device = this.deviceRepository.create(createDeviceDto);
    return await this.deviceRepository.save(device);
  }
  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<[DeviceEntity[], number]> {
    const [data, total] = await this.deviceRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['installation'],
      order: { createdAt: 'DESC' },
    });
    return [data, total];
  }
  async findOne(id: number): Promise<DeviceEntity> {
    const device = await this.deviceRepository.findOne({
      where: { id },
      relations: ['installation', 'energyReadings'],
    });
    if (!device) {
      throw new NotFoundException(`Device with ID ${id} not found`);
    }
    return device;
  }
  async update(
    id: number,
    updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceEntity> {
    const device = await this.findOne(id);
    if (updateDeviceDto.deviceUuid) {
      const existingDevice = await this.deviceRepository.findOne({
        where: { deviceUuid: updateDeviceDto.deviceUuid },
      });
      if (existingDevice && existingDevice.id !== id) {
        throw new ConflictException('Device with this UUID already exists');
      }
    }
    Object.assign(device, updateDeviceDto);
    return await this.deviceRepository.save(device);
  }
  async remove(id: number): Promise<void> {
    const device = await this.findOne(id);
    await this.deviceRepository.remove(device);
  }
}
