import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import {
  AuthResponseDto,
  AuthTokensDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { User } from './entities/user.entity';
import { normalizeCnpj } from './validators/is-cnpj.validator';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL = '7d';

interface JwtPayload {
  sub: string;
  cnpj: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const cnpj = normalizeCnpj(dto.cnpj);
    const email = dto.email.toLowerCase();

    const [existingCnpj, existingEmail] = await Promise.all([
      this.usersRepository.findOne({ where: { cnpj } }),
      this.usersRepository.findOne({ where: { email } }),
    ]);

    if (existingCnpj) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    if (existingEmail) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepository.create({
      cnpj,
      email,
      razaoSocial: dto.razaoSocial,
      passwordHash,
      refreshTokenHash: null,
    });

    const saved = await this.usersRepository.save(user);
    const tokens = await this.issueTokens(saved);

    return this.toAuthResponse(saved, tokens);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.issueTokens(user);
    return this.toAuthResponse(user, tokens);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthTokensDto> {
    const refreshSecret = this.getRefreshSecret();
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        dto.refreshToken,
        { secret: refreshSecret },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokenMatches = await bcrypt.compare(
      dto.refreshToken,
      user.refreshTokenHash,
    );

    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokens = await this.issueTokens(user);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async issueTokens(user: User): Promise<AuthTokensDto & { expiresIn: number }> {
    const accessSecret = this.getAccessSecret();
    const refreshSecret = this.getRefreshSecret();

    const accessPayload: JwtPayload = {
      sub: user.id,
      cnpj: user.cnpj,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: user.id,
      cnpj: user.cnpj,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: REFRESH_TOKEN_TTL,
      }),
    ]);

    user.refreshTokenHash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.usersRepository.save(user);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private toAuthResponse(
    user: User,
    tokens: AuthTokensDto,
  ): AuthResponseDto {
    return {
      user: {
        id: user.id,
        cnpj: user.cnpj,
        email: user.email,
        razaoSocial: user.razaoSocial,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private getAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    return secret;
  }

  private getRefreshSecret(): string {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      `${this.getAccessSecret()}-refresh`
    );
  }
}
