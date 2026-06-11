import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize:
          configService.get<string>('TYPEORM_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get<string>('TYPEORM_LOGGING', 'false') === 'true',
        migrations: ['dist/database/migrations/*.js'],
        migrationsRun: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
