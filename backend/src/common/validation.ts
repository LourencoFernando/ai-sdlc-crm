import { ValidationError, ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy, ValidationOptions } from 'class-validator';
import { ApiError } from './api-error';
import { isCalendarDate } from '../domain/dates';

/** The global pipe: strips unknown fields and answers bad input with 422 and one message per field. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const fields: Record<string, string> = {};
      for (const e of errors) {
        const messages = Object.values(e.constraints ?? {});
        if (messages.length) fields[e.property] = messages[messages.length - 1];
      }
      return ApiError.invalid(fields);
    },
  });
}

/** Trims text; an empty optional value becomes null. */
export function Trim(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));
}

export function TrimToNull(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? value.trim() || null : value));
}

export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    { name: 'isCalendarDate', validator: { validate: (value) => isCalendarDate(value) } },
    { message: 'Enter a date as YYYY-MM-DD', ...options },
  );
}
