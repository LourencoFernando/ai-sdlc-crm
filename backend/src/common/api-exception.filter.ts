import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Turns every error into `{detail, fields?}`. Bad input is 422 rather than 400,
 * a conflict is 409, and anything unexpected is a plain 500.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Api');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      let status = exception.getStatus();
      const body = exception.getResponse();
      if (status === HttpStatus.BAD_REQUEST) status = HttpStatus.UNPROCESSABLE_ENTITY;
      if (typeof body === 'object' && body !== null && 'detail' in body) {
        res.status(status).json(body);
        return;
      }
      const message =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? ((body as { message: string[] }).message).join(', ')
            : String((body as { message?: unknown }).message ?? exception.message);
      res.status(status).json({ detail: status === HttpStatus.NOT_FOUND ? 'Not found' : message });
      return;
    }

    if (isPrismaError(exception, 'P2025')) {
      res.status(HttpStatus.NOT_FOUND).json({ detail: 'Not found' });
      return;
    }
    if (isPrismaError(exception, 'P2002')) {
      res.status(HttpStatus.CONFLICT).json({ detail: 'That value is already used' });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ detail: 'Something went wrong' });
  }
}

function isPrismaError(e: unknown, code: string): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: unknown }).code === code;
}
