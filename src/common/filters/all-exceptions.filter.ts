import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

type ErrorResponse = {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
  requestId?: string;
  details?: unknown;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly config: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    const requestId = req.id ?? (req.headers['x-request-id'] as string | undefined);
    const path = req.originalUrl ?? req.url ?? '';

    const isProd = process.env.NODE_ENV === 'production';

    const base: Omit<ErrorResponse, 'statusCode' | 'code' | 'message'> = {
      path,
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' && response && 'message' in response
            ? (response as any).message
            : exception.message;

      res.status(statusCode).json({
        statusCode,
        code: 'HTTP_EXCEPTION',
        message: Array.isArray(message) ? message.join('; ') : String(message),
        ...base,
        ...(isProd ? {} : { details: typeof response === 'object' ? response : undefined }),
      } satisfies ErrorResponse);
      return;
    }

    if (exception instanceof QueryFailedError) {
      const driverError = (exception as any).driverError as { code?: string; detail?: string } | undefined;
      const code = driverError?.code ?? 'DB_ERROR';
      const statusCode = code === '23505' ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;

      res.status(statusCode).json({
        statusCode,
        code: 'DATABASE_QUERY_FAILED',
        message: statusCode === HttpStatus.CONFLICT ? 'Resource already exists.' : 'Database query failed.',
        ...base,
        ...(isProd ? {} : { details: { code, detail: driverError?.detail } }),
      } satisfies ErrorResponse);
      return;
    }

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = 'Internal server error.';

    res.status(statusCode).json({
      statusCode,
      code: 'INTERNAL_SERVER_ERROR',
      message,
      ...base,
      ...(isProd
        ? {}
        : {
            details:
              exception instanceof Error
                ? { name: exception.name, message: exception.message, stack: exception.stack }
                : exception,
          }),
    } satisfies ErrorResponse);
  }
}
