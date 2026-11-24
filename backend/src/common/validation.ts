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

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const WEB_ADDRESS = /^https?:\/\/[^\s/?#]+\.[^\s/?#]+[^\s]*$/i;

/** Trims a website and adds https:// when it has no scheme, so it always links to the web. */
export function WebsiteToNull(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const v = value.trim();
    if (!v) return null;
    return SCHEME.test(v) && !/^[^:]+:\d/.test(v) ? v : `https://${v}`;
  });
}

/** An http or https address with a dotted host name. */
export function IsWebsite(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    { name: 'isWebsite', validator: { validate: (value) => typeof value === 'string' && WEB_ADDRESS.test(value) } },
    { message: 'Enter a web address, such as acme.com', ...options },
  );
}

export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    { name: 'isCalendarDate', validator: { validate: (value) => isCalendarDate(value) } },
    { message: 'Enter a date as YYYY-MM-DD', ...options },
  );
}
