import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';

const VALID_CNPJ = '11.444.777/0001-61';

describe('AuthService', () => {
  let service: AuthService;
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const baseUser: User = {
    id: 'user-1',
    cnpj: '11444777000161',
    email: 'contato@mei.com.br',
    razaoSocial: 'MEI Teste LTDA',
    passwordHash: 'hash:SenhaSegura123!',
    refreshTokenHash: 'hash:refresh-token',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') {
                return 'test-secret';
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(async (value) => `hash:${value}`);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async (value, hash) => {
      return hash === `hash:${value}`;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates a user and returns tokens', async () => {
      usersRepository.findOne.mockResolvedValue(null);
      usersRepository.create.mockReturnValue(baseUser);
      usersRepository.save.mockResolvedValue(baseUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register({
        email: 'contato@mei.com.br',
        password: 'SenhaSegura123!',
        cnpj: VALID_CNPJ,
        razaoSocial: 'MEI Teste LTDA',
      });

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { cnpj: '11444777000161' },
      });
      expect(result.user.cnpj).toBe('11444777000161');
      expect(result.accessToken).toBe('access-token');
    });

    it('throws when CNPJ already exists', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce(baseUser)
        .mockResolvedValueOnce(null);

      await expect(
        service.register({
          email: 'outro@mei.com.br',
          password: 'SenhaSegura123!',
          cnpj: VALID_CNPJ,
          razaoSocial: 'Outro MEI',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      usersRepository.findOne.mockResolvedValue({
        ...baseUser,
        passwordHash: 'hash:SenhaSegura123!',
      });
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.login({
        email: 'contato@mei.com.br',
        password: 'SenhaSegura123!',
      });

      expect(result.accessToken).toBe('access-token');
    });

    it('throws when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'contato@mei.com.br',
          password: 'SenhaSegura123!',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: baseUser.id,
        cnpj: baseUser.cnpj,
        type: 'refresh',
      });
      usersRepository.findOne.mockResolvedValue(baseUser);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await service.refresh({
        refreshToken: 'refresh-token',
      });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });
});
