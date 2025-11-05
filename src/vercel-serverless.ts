import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const expressServer = express();
let cachedServer: any;

export const handler = async (req, res) => {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressServer),
    );

    // Enable CORS for Swagger UI
    app.enableCors();

    // ✅ Set up Swagger only once
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('NestJS Swagger API Docs')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    await app.init();
    cachedServer = expressServer;
  }

  return cachedServer(req, res);
};
