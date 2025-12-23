import * as ddRum from './datadogRum';

export type RumContext = Record<string, unknown>;

export function initRum(): void {
  ddRum.initDatadogRum();
}

export function addError(error: unknown, context?: RumContext): void {
  ddRum.addError(error, context);
}

export function addAction(name: string, context?: RumContext): void {
  ddRum.addAction(name, context);
}

export function addTiming(name: string, time?: number): void {
  ddRum.addTiming(name, time);
}

export const rum = {
  init: initRum,
  addError,
  addAction,
  addTiming,
};


