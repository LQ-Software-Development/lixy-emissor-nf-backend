import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AuthGuard } from './common/guards/auth.guard';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalGuards(new AuthGuard(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Emissor NF MEI API')
    .setDescription('API fiscal para emissão de NF MEI')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'x-company-id', in: 'header' },
      'x-company-id',
    )
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.API_PORT ?? 3009);
  await app.listen(port, '0.0.0.0');
}

bootstrap().then(() => {
  const port = Number(process.env.API_PORT ?? 3009);
  console.log(`Server started at http://0.0.0.0:${port}`);
  console.log(`Swagger docs at http://0.0.0.0:${port}/docs`);
});
