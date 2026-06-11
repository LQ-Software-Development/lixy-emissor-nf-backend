import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;
    const companyIdHeader = request.headers['x-company-id'] as
      | string
      | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = process.env.JWT_SECRET ?? 'default_secret';
      const payload = jwt.verify(token, secret) as Record<string, unknown>;
      const tenantBased =
        (process.env.IS_TENANT_BASED_AUTH_ENABLED ?? 'true').toLowerCase() ===
        'true';

      const authRequest = request as AuthenticatedRequest;

      if (!tenantBased) {
        authRequest.user = payload;
        authRequest.companyId =
          companyIdHeader ?? process.env.DEFAULT_ORGANIZATION_ID ?? 'default';
        return true;
      }

      const accesses = (payload.accesses ?? []) as Array<{
        id?: string;
        _id?: string;
      }>;
      const companyId =
        companyIdHeader ?? accesses[0]?.id ?? accesses[0]?._id;

      if (
        !companyId ||
        !accesses.some(
          (access) => (access.id ?? access._id) === companyId,
        )
      ) {
        throw new UnauthorizedException('Invalid company access');
      }

      authRequest.user = payload;
      authRequest.companyId = companyId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
