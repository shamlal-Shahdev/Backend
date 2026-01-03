import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from './roles.enum';
import { UserRole } from '../user/entity/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<(number | string)[]>(
      'roles',
      [context.getClass(), context.getHandler()],
    );
    if (!roles.length) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user has role object with id (legacy support)
    if (user?.role?.id) {
      return roles.map(String).includes(String(user.role.id));
    }

    // If user has string role (current implementation)
    if (user?.role) {
      // Map string role to RoleEnum
      const roleId =
        user.role === UserRole.ADMIN ? RoleEnum.admin : RoleEnum.user;
      return roles.map(String).includes(String(roleId));
    }

    return false;
  }
}
