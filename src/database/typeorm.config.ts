import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const databaseUrl = configService.get<string>('DATABASE_URL');

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const synchronize =
    configService.get<string>('TYPEORM_SYNCHRONIZE', 'false') === 'true';

  return {
    type: 'postgres',
    url: databaseUrl,
    autoLoadEntities: true,
    synchronize,
    migrations: ['dist/database/migrations/*.js'],
    migrationsRun:
      configService.get<string>('TYPEORM_MIGRATIONS_RUN', 'false') === 'true',
    logging: configService.get<string>('TYPEORM_LOGGING', 'false') === 'true',
  };
}
