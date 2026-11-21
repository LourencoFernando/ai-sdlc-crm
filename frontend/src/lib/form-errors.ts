import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, isUnreachable } from '../api/client';

/**
 * Puts the backend's field errors under their fields, and gives a message for the form.
 * The form keeps what the user typed either way (G9).
 */
export function handleSaveError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldNames: string[],
): string | null {
  if (isUnreachable(error)) return "Your changes weren't saved. Can't reach Accountable. Check that it's running.";
  if (error instanceof ApiError) {
    let placed = false;
    for (const [field, message] of Object.entries(error.fields)) {
      if (fieldNames.includes(field)) {
        setError(field as Path<T>, { type: 'server', message });
        placed = true;
      }
    }
    return placed ? null : error.detail;
  }
  return "Your changes weren't saved. Try again.";
}

export const emptyToNull = (value: string): string | null => (value.trim() === '' ? null : value.trim());
