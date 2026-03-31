import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ id?: string; headers?: Record<string, unknown> }>();
    const res = http.getResponse<{ setHeader: (name: string, value: string) => void }>();

    const requestId =
      req?.id ??
      (typeof req?.headers?.['x-request-id'] === 'string'
        ? (req.headers['x-request-id'] as string)
        : undefined);

    if (requestId) res.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      tap(() => {
        if (requestId) res.setHeader('x-request-id', requestId);
      }),
    );
  }
}

