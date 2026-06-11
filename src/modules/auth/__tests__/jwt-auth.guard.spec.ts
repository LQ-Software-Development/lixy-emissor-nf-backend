import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwtService = {
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configService = {
    get: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(false),
  } as unknown as Reflector;

  const guard = new JwtAuthGuard(jwtService, configService, reflector);

  const createContext = (authorization?: string): ExecutionContext => {
    const request = {
      headers: { authorization },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
  });

  it('allows public routes', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(jwtService.verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects missing bearer token', async () => {
    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('accepts valid access token', async () => {
    const payload = {
      sub: 'user-id',
      cnpj: '12345678000190',
      type: 'access' as const,
    };

    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);

    const context = createContext('Bearer valid-token');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().user).toEqual(payload);
  });

  it('rejects refresh token type', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-id',
      cnpj: '12345678000190',
      type: 'refresh',
    });

    await expect(
      guard.canActivate(createContext('Bearer refresh-token')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
