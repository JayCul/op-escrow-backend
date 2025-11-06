import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const expressApp = express();

let cachedServer: any;

export const handler = async (req: Request, res: Response) => {
  if (!cachedServer) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    app.enableCors();

    // Swagger Config
    const config = new DocumentBuilder()
      .setTitle('API Docs')
      .setDescription('Swagger UI running on Vercel Serverless')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // ✅ FIX: Use CDN assets instead of local swagger-ui-dist
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'NestJS Swagger on Vercel',
      swaggerOptions: { persistAuthorization: true },
      customCssUrl: 'https://unpkg.com/swagger-ui-dist/swagger-ui.css',
      customJs: [
        'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js',
      ],
    });

    await app.init();
    cachedServer = expressApp;
  }

  return cachedServer(req, res);
};
