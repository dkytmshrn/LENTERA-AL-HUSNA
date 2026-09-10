import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isDevelopment = process.env.NODE_ENV !== 'production';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload =
      exception instanceof HttpException
        ? (exception.getResponse() as any)
        : {
            message: exception instanceof Error ? exception.message : 'Internal server error',
            stack: exception instanceof Error ? exception.stack : undefined,
          };

    const safeMessage =
      typeof payload === 'object' && payload !== null
        ? payload.message || 'Request failed'
        : 'Request failed';

    const safeErrors =
      typeof payload === 'object' && payload !== null && Array.isArray(payload.errors)
        ? payload.errors
        : undefined;

    const actualError =
      isDevelopment && exception instanceof Error
        ? {
            name: exception.name,
            message: exception.message,
            stack: exception.stack,
          }
        : undefined;

    response.status(status).json({
      statusCode: status,
      message: isDevelopment ? safeMessage : this.formatMessage(safeMessage),
      path: request.url,
      ...(isDevelopment && actualError ? { error: actualError } : {}),
      ...(safeErrors ? { errors: safeErrors } : {}),
    });
  }

  private formatMessage(message: string): string {
    if (!message || typeof message !== 'string') {
      return 'Request failed';
    }

    const normalized = message.trim();

    if (normalized.toLowerCase().includes('duplicate')) {
      return 'This email is already in use.';
    }

    if (normalized.toLowerCase().includes('invalid') || normalized.toLowerCase().includes('required')) {
      return 'The submitted data is invalid.';
    }

    if (normalized.toLowerCase().includes('not found')) {
      return 'The requested resource was not found.';
    }

    if (normalized.toLowerCase().includes('unauthorized')) {
      return 'You are not authorized to perform this action.';
    }

    if (normalized.toLowerCase().includes('forbidden')) {
      return 'Access is forbidden.';
    }

    if (normalized.toLowerCase().includes('expired')) {
      return 'This request has expired. Please try again.';
    }

    if (normalized.toLowerCase().includes('ai ') || normalized.toLowerCase().includes('gemini')) {
      return normalized;
    }

    return 'Request failed';
  }
}
