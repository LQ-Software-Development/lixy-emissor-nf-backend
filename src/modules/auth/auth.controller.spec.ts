import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('delegates register to AuthService', async () => {
    const payload = {
      user: { id: '1', cnpj: '11444777000161', email: 'a@b.com', name: 'MEI' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    };
    authService.register.mockResolvedValue(payload);

    await expect(
      controller.register({
        cnpj: '11.444.777/0001-61',
        email: 'a@b.com',
        name: 'MEI',
        password: 'SenhaSegura123!',
      }),
    ).resolves.toEqual(payload);
  });

  it('delegates login to AuthService', async () => {
    const payload = {
      user: { id: '1', cnpj: '11444777000161', email: 'a@b.com', name: 'MEI' },
      tokens: { accessToken: 'a', refreshToken: 'r', expiresIn: 900 },
    };
    authService.login.mockResolvedValue(payload);

    await expect(
      controller.login({
        cnpj: '11.444.777/0001-61',
        password: 'SenhaSegura123!',
      }),
    ).resolves.toEqual(payload);
  });

  it('delegates refresh to AuthService', async () => {
    const tokens = { accessToken: 'a', refreshToken: 'r', expiresIn: 900 };
    authService.refresh.mockResolvedValue(tokens);

    await expect(
      controller.refresh({ refreshToken: 'refresh-token' }),
    ).resolves.toEqual(tokens);
  });
});
