import { initLogs } from './logs';
import { initRum } from './rum';

export function initTelemetry(): void {
  initRum();
  initLogs();
}


