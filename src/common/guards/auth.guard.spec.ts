import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new AuthGuard(reflector);

  const createContext = (headers: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'false';
    process.env.DEFAULT_ORGANIZATION_ID = 'default-org';
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
  });

  it('allows public routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    expect(guard.canActivate(createContext({}))).toBe(true);
  });

  it('rejects missing bearer token', () => {
    expect(() => guard.canActivate(createContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts valid token with tenant auth disabled', () => {
    const token = jwt.sign({ sub: 'user-1' }, 'test-secret');
    const request = { headers: { authorization: `Bearer ${token}` } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(request).toHaveProperty('companyId', 'default-org');
  });

  it('accepts valid token with tenant auth enabled and matching company', () => {
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'true';
    const token = jwt.sign(
      { sub: 'user-1', accesses: [{ id: 'company-1' }] },
      'test-secret',
    );
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
        'x-company-id': 'company-1',
      },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(request).toHaveProperty('companyId', 'company-1');
  });

  it('rejects token when company access is invalid', () => {
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'true';
    const token = jwt.sign(
      { sub: 'user-1', accesses: [{ id: 'company-1' }] },
      'test-secret',
    );

    expect(() =>
      guard.canActivate(
        createContext({
          authorization: `Bearer ${token}`,
          'x-company-id': 'other-company',
        }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('uses first access id when tenant auth enabled without header', () => {
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'true';
    const token = jwt.sign(
      { sub: 'user-1', accesses: [{ _id: 'company-legacy' }] },
      'test-secret',
    );
    const request = { headers: { authorization: `Bearer ${token}` } };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(request).toHaveProperty('companyId', 'company-legacy');
  });

  it('rejects token without company access list', () => {
    process.env.IS_TENANT_BASED_AUTH_ENABLED = 'true';
    const token = jwt.sign({ sub: 'user-1' }, 'test-secret');

    expect(() =>
      guard.canActivate(
        createContext({ authorization: `Bearer ${token}` }),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('rejects invalid token', () => {
    expect(() =>
      guard.canActivate(
        createContext({ authorization: 'Bearer invalid-token' }),
      ),
    ).toThrow(UnauthorizedException);
  });
});
