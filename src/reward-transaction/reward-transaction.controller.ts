import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { RoleEnum } from '../roles/roles.enum';
import { RewardTransactionService } from './reward-transaction.service';
import { CreateRewardTransactionDto } from './dto/create-reward-transaction.dto';
import { UpdateRewardTransactionDto } from './dto/update-reward-transaction.dto';
import { RewardTransactionEntity } from './entity/reward-transaction.entity';
import { UserRole } from '../user/entity/user.entity';
@ApiTags('Reward Transactions')
@Controller({
  path: 'reward-transactions',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class RewardTransactionController {
  constructor(
    private readonly rewardTransactionService: RewardTransactionService,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Create a new reward transaction' })
  @ApiResponse({
    status: 201,
    description: 'Reward transaction created successfully',
    type: RewardTransactionEntity,
  })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createRewardTransactionDto: CreateRewardTransactionDto,
  ): Promise<RewardTransactionEntity> {
    return this.rewardTransactionService.create(createRewardTransactionDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all reward transactions with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'List of reward transactions',
    type: [RewardTransactionEntity],
  })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findAll(
    @Request() req: { user: { id: number | string; role: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    const uid =
      typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    return this.rewardTransactionService.findAll(
      page,
      limit,
      isAdmin ? undefined : uid,
    );
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get a reward transaction by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Reward transaction found',
    type: RewardTransactionEntity,
  })
  @ApiResponse({ status: 404, description: 'Reward transaction not found' })
  @Roles(RoleEnum.admin, RoleEnum.user)
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<RewardTransactionEntity> {
    return this.rewardTransactionService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update a reward transaction' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Reward transaction updated successfully',
    type: RewardTransactionEntity,
  })
  @ApiResponse({ status: 404, description: 'Reward transaction not found' })
  @Roles(RoleEnum.admin)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRewardTransactionDto: UpdateRewardTransactionDto,
  ): Promise<RewardTransactionEntity> {
    return this.rewardTransactionService.update(id, updateRewardTransactionDto);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reward transaction' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({
    status: 204,
    description: 'Reward transaction deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Reward transaction not found' })
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.rewardTransactionService.remove(id);
  }
}
