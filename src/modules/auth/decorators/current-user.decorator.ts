import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAccessPayload } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtAccessPayload | undefined,
    ctx: ExecutionContext,
  ): string | JwtAccessPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtAccessPayload }>();
    const user = request.user;

    if (data) {
      return user[data];
    }

    return user;
  },
);
