import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID', 'Accept'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Lixy Emissor NF API')
    .setDescription('Backend API for Emissor NF MEI')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Company-ID',
        in: 'header',
        description: 'Organization / tenant ID',
      },
      'X-Company-ID',
    )
    .addBearerAuth()
    .addTag('Health', 'Service and database health checks')
    .addTag('Clients', 'Client management (PF/PJ)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.API_PORT ?? process.env.PORT ?? 3009);
  await app.listen(port);

  console.log(`Server started at http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
