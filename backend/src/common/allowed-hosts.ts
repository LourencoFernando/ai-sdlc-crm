import type { NextFunction, Request, Response } from 'express';

const ALLOWED = new Set(['localhost', '127.0.0.1', '[::1]']);

/** The host name from a Host header, without its port: "localhost:5173" → "localhost", "[::1]:3100" → "[::1]". */
export function hostName(host: string | undefined): string {
  const h = (host ?? '').trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1);
  return h.split(':')[0];
}

/**
 * Answers only requests addressed to this computer. A web page that points its own domain at
 * 127.0.0.1 (DNS rebinding) still sends its domain as the Host, so it can't read the data.
 */
export function allowedHosts(req: Request, res: Response, next: NextFunction): void {
  if (ALLOWED.has(hostName(req.headers.host))) {
    next();
    return;
  }
  res.status(403).json({ detail: 'Accountable only answers requests sent to this computer' });
}
