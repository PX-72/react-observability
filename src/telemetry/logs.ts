import type { LogLevel } from './logLevels';
import { initDatadogLogs, sendLog } from './datadogLogs';

export type LogsConfig = {
  /**
   * When true, disables remote log sending.
   * Default: false
   */
  localOnly?: boolean;
  /**
   * Minimum level that will be emitted remotely.
   * Default: 'info'
   */
  remoteLogLevel?: LogLevel;
};

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

let config: Required<LogsConfig> = {
  localOnly: false,
  remoteLogLevel: 'info',
};

function applyConfigUpdate(configUpdate: LogsConfig): void {
  config = { ...config, ...configUpdate };
}

export function initLogs(configUpdate?: LogsConfig): void {
  if (configUpdate) applyConfigUpdate(configUpdate);
  initDatadogLogs();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (value instanceof Error) return false;
  return Object.getPrototypeOf(value) === Object.prototype;
}

function splitContext(args: unknown[]): { logArgs: unknown[]; context?: Record<string, unknown> } {
  if (args.length === 0) return { logArgs: args };
  const last = args[args.length - 1];
  if (!isPlainObject(last)) return { logArgs: args };
  return { logArgs: args.slice(0, -1), context: last };
}

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function formatMessage(args: unknown[]): string {
  if (args.length === 0) return '';
  return args.map(stringifyArg).join(' ');
}

function shouldEmitRemote(level: LogLevel): boolean {
  if (config.localOnly) return false;
  return LEVEL_ORDER[level] >= LEVEL_ORDER[config.remoteLogLevel];
}

function localCall(level: LogLevel, args: unknown[]): void {
  // eslint-disable-next-line no-console
  (console[level] as (...a: unknown[]) => void)(...args);
}

function remoteCall(level: LogLevel, args: unknown[]): void {
  if (!shouldEmitRemote(level)) return;

  const { logArgs, context } = splitContext(args);
  const message = formatMessage(logArgs);

  const enrichedContext: Record<string, unknown> | undefined =
    context || logArgs.some((a) => a instanceof Error) ? { ...(context ?? {}), args: logArgs } : context;

  sendLog(level, message, enrichedContext);
}

export function debug(...args: unknown[]): void {
  localCall('debug', args);
  remoteCall('debug', args);
}

export function info(...args: unknown[]): void {
  localCall('info', args);
  remoteCall('info', args);
}

export function warn(...args: unknown[]): void {
  localCall('warn', args);
  remoteCall('warn', args);
}

export function error(...args: unknown[]): void {
  localCall('error', args);
  remoteCall('error', args);
}

export const log = {
  debug,
  info,
  warn,
  error,
  init: initLogs,
};


