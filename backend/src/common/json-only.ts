import type { NextFunction, Request, Response } from 'express';

const READS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Refuses a change sent as anything but JSON. A web page on another site can make the browser
 * post a plain HTML form here, but it can't send JSON without the browser asking first, which we never allow.
 */
export function jsonOnly(req: Request, res: Response, next: NextFunction): void {
  const hasBody = Number(req.headers['content-length'] ?? 0) > 0 || req.headers['transfer-encoding'] !== undefined;
  if (READS.has(req.method) || (!hasBody && !req.headers['content-type']) || req.is('application/json')) {
    next();
    return;
  }
  res.status(415).json({ detail: 'Send changes as JSON' });
}
