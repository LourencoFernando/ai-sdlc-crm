import { Injectable, PipeTransform } from '@nestjs/common';
import { ApiError } from './api-error';

/** A record id from the URL; anything that isn't a positive whole number is simply not found. */
@Injectable()
export class IdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new ApiError(404, 'Not found');
    return id;
  }
}
