/** A refusal from the backend, carrying its `{detail, fields}` body. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly fields: Record<string, string> = {},
    readonly body: Record<string, unknown> = {},
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

/** The backend didn't answer: it isn't running, or the network is down (G9). */
export class UnreachableError extends Error {
  constructor() {
    super("Can't reach Accountable. Check that it's running.");
    this.name = 'UnreachableError';
  }
}

export function isUnreachable(error: unknown): error is UnreachableError {
  return error instanceof UnreachableError;
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new UnreachableError();
  }
  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  // Our backend always answers errors in JSON; anything else came from a proxy with no backend behind it.
  if (!isJson && (res.status >= 500 || res.status === 404) && !res.ok) throw new UnreachableError();
  if (res.status === 204) return undefined as T;
  const data = isJson ? await res.json() : undefined;
  if (!res.ok) {
    const b = (data ?? {}) as Record<string, unknown>;
    throw new ApiError(
      res.status,
      String(b.detail ?? 'Something went wrong'),
      (b.fields as Record<string, string>) ?? {},
      b,
    );
  }
  return data as T;
}
