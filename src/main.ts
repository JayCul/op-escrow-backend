import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(new ValidationPipe());

  // CORS
  app.enableCors();

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Escrow Service API')
    .setDescription('Blockchain escrow service API documentation')
    .setVersion('1.0')
    .addTag('escrow')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 Escrow service running on: ${await app.getUrl()}`);
  console.log(`📚 API Documentation: ${await app.getUrl()}/docs`);
}
bootstrap();
