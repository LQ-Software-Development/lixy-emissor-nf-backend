import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

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
      user: {
        id: '1',
        cnpj: '11444777000161',
        email: 'a@b.com',
        razaoSocial: 'MEI LTDA',
      },
      accessToken: 'a',
      refreshToken: 'r',
    };
    authService.register.mockResolvedValue(payload);

    await expect(
      controller.register({
        email: 'a@b.com',
        password: 'SenhaSegura123!',
        cnpj: '11.444.777/0001-61',
        razaoSocial: 'MEI LTDA',
      }),
    ).resolves.toEqual(payload);
  });

  it('delegates login to AuthService', async () => {
    const payload = {
      user: {
        id: '1',
        cnpj: '11444777000161',
        email: 'a@b.com',
        razaoSocial: 'MEI LTDA',
      },
      accessToken: 'a',
      refreshToken: 'r',
    };
    authService.login.mockResolvedValue(payload);

    await expect(
      controller.login({
        email: 'a@b.com',
        password: 'SenhaSegura123!',
      }),
    ).resolves.toEqual(payload);
  });

  it('delegates refresh to AuthService', async () => {
    const payload = { accessToken: 'a', refreshToken: 'r' };
    authService.refresh.mockResolvedValue(payload);

    await expect(controller.refresh({ refreshToken: 'r' })).resolves.toEqual(
      payload,
    );
  });
});
