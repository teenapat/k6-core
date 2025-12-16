/**
 * K6 Global Type Declarations
 * K6 runtime provides these globals
 */

interface Console {
  log(...args: unknown[]): void
  warn(...args: unknown[]): void
  error(...args: unknown[]): void
  info(...args: unknown[]): void
  debug(...args: unknown[]): void
}

declare const console: Console

