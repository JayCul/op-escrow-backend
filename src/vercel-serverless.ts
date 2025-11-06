import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const expressApp = express();
let cachedApp: any;

export const handler = async (req, res) => {
  if (!cachedApp) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    app.enableCors();

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('API Docs')
      .setDescription('Swagger UI for NestJS on Vercel')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // ✅ Add the Pro Tip fix here — to use Swagger UI assets from CDN
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'NestJS Swagger',
      swaggerOptions: { persistAuthorization: true },
      customJs: [
        'https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js',
      ],
      customCssUrl: 'https://unpkg.com/swagger-ui-dist/swagger-ui.css',
    });

    await app.init();
    cachedApp = expressApp;
  }

  return cachedApp(req, res);
};
