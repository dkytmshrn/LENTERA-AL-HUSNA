import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as dotenv from 'dotenv';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import express from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const backendEnvPath = path.resolve(process.cwd(), 'apps/backend/.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');

dotenv.config({ path: backendEnvPath });
dotenv.config({ path: rootEnvPath });

// Fungsi helper untuk menyamakan konfigurasi (CORS, Pipes, Filters, dll)
function setupApp(app: any) {
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://lenteraalhusna-git-main-sexy-cc.vercel.app',
      process.env.FRONTEND_URL || 'http://localhost:3000',
    ].filter((value, index, self) => value && self.indexOf(value) === index),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Account-ID', 'Cookie', 'Set-Cookie'],
  });

  app.use(cookieParser());

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((err) => {
          const constraints = err.constraints ? Object.values(err.constraints) : [];
          return constraints.length ? constraints : ['Invalid input.'];
        });

        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed. Please check your input.',
          errors: messages.slice(0, 5),
        });
      },
    }),
  );
}

// Variabel cache untuk Vercel Serverless
let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );
    
    setupApp(app);
    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

// 1. Handler khusus untuk Vercel (Production Serverless)
export default async function handler(req: any, res: any) {
  const server = await bootstrapServer();
  return server(req, res);
}

// 2. Jalankan secara lokal jika bukan di Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    setupApp(app);

    const port = process.env.APP_PORT || 3001;
    await app.listen(port);

    console.log(`LENTERA Backend Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }

  bootstrap().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
