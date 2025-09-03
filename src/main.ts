import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(process.env.PORT || 3001);
  console.log(`Server running on http://localhost:${process.env.PORT || 3001}`);
}
bootstrap();
