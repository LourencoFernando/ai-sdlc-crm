import { HttpException, HttpStatus } from '@nestjs/common';

/** An error the client can act on, sent as `{detail, fields?, ...}`. */
export class ApiError extends HttpException {
  constructor(status: number, detail: string, extra: Record<string, unknown> = {}) {
    super({ detail, ...extra }, status);
  }

  static notFound(what: string): ApiError {
    return new ApiError(HttpStatus.NOT_FOUND, `${what} not found`);
  }

  static conflict(detail: string, extra: Record<string, unknown> = {}): ApiError {
    return new ApiError(HttpStatus.CONFLICT, detail, extra);
  }

  static invalid(fields: Record<string, string>, detail = 'Some fields need attention'): ApiError {
    return new ApiError(HttpStatus.UNPROCESSABLE_ENTITY, detail, { fields });
  }
}
