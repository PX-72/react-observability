import { useMemo, useState, type FormEvent } from 'react';
import { fetchWithTrace } from '../api/fetchWithTrace';
import { log } from '../telemetry/logs';
import { rum } from '../telemetry/rum';
import { generateTraceparent } from '../telemetry/w3cTraceContext';

type OperationType = 'create' | 'update' | 'delete';
type Priority = 'low' | 'normal' | 'high';

type FormState = {
  requestName: string;
  operationType: OperationType;
  priority: Priority;
  includeDebugMetadata: boolean;
  notes: string;
};

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting'; traceparent: string }
  | { kind: 'success'; traceparent: string; status: number }
  | { kind: 'error'; traceparent: string; status?: number; message: string };

const initialFormState: FormState = {
  requestName: '',
  operationType: 'create',
  priority: 'normal',
  includeDebugMetadata: false,
  notes: '',
};

function validate(state: FormState): { isValid: boolean; errors: Partial<Record<keyof FormState, string>> } {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!state.requestName.trim()) errors.requestName = 'Request name is required.';
  return { isValid: Object.keys(errors).length === 0, errors };
}

export function RequestForm() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: 'idle' });

  const validation = useMemo(() => validate(form), [form]);
  const isSubmitting = submitState.kind === 'submitting';

  const canSubmit = validation.isValid && !isSubmitting;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validation.isValid) return;

    const { traceparent } = generateTraceparent();
    setSubmitState({ kind: 'submitting', traceparent });

    rum.addAction('submit_request', {
      traceparent,
      requestName: form.requestName.trim(),
      operation: form.operationType,
      priority: form.priority,
      includeDebugMetadata: form.includeDebugMetadata,
    });
    rum.addTiming('submit_request_start');
    log.info('Submitting request', { traceparent, operation: form.operationType, priority: form.priority });

    try {
      const { response } = await fetchWithTrace(
        '/api/requests',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: form.requestName.trim(),
            operation: form.operationType,
            priority: form.priority,
            includeDebugMetadata: form.includeDebugMetadata,
            notes: form.notes,
            clientTimestamp: new Date().toISOString(),
          }),
        },
        { traceparent },
      );

      if (!response.ok) {
        rum.addError(new Error('Request failed'), { traceparent, status: response.status });
        log.warn('Request failed', { traceparent, status: response.status });
        setSubmitState({
          kind: 'error',
          traceparent,
          status: response.status,
          message: `Request failed (${response.status}).`,
        });
        return;
      }

      rum.addTiming('submit_request_success');
      log.info('Request succeeded', { traceparent, status: response.status });
      setSubmitState({ kind: 'success', traceparent, status: response.status });
    } catch (err) {
      rum.addError(err, { traceparent });
      log.error(err, { traceparent });
      const message = err instanceof Error ? err.message : 'Request failed.';
      setSubmitState({ kind: 'error', traceparent, message });
    }
  }

  const traceparentForAttempt =
    submitState.kind === 'submitting' ||
    submitState.kind === 'success' ||
    submitState.kind === 'error'
      ? submitState.traceparent
      : null;

  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor='requestName' style={{ fontWeight: 600 }}>
          Request name
        </label>
        <input
          id='requestName'
          name='requestName'
          type='text'
          value={form.requestName}
          onChange={(e) => setForm((s) => ({ ...s, requestName: e.target.value }))}
          autoComplete='off'
          disabled={isSubmitting}
        />
        {validation.errors.requestName ? (
          <div role='alert' style={{ color: 'var(--danger)', fontSize: 12 }}>
            {validation.errors.requestName}
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor='operationType' style={{ fontWeight: 600 }}>
          Operation type
        </label>
        <select
          id='operationType'
          name='operationType'
          value={form.operationType}
          onChange={(e) => setForm((s) => ({ ...s, operationType: e.target.value as OperationType }))}
          disabled={isSubmitting}
        >
          <option value='create'>create</option>
          <option value='update'>update</option>
          <option value='delete'>delete</option>
        </select>
      </div>

      <fieldset style={{ padding: 10 }}>
        <legend style={{ fontWeight: 600 }}>Priority</legend>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['low', 'normal', 'high'] as const).map((p) => (
            <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type='radio'
                name='priority'
                value={p}
                checked={form.priority === p}
                onChange={() => setForm((s) => ({ ...s, priority: p }))}
                disabled={isSubmitting}
              />
              {p}
            </label>
          ))}
        </div>
      </fieldset>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type='checkbox'
          checked={form.includeDebugMetadata}
          onChange={(e) => setForm((s) => ({ ...s, includeDebugMetadata: e.target.checked }))}
          disabled={isSubmitting}
        />
        Include debug metadata
      </label>

      <div style={{ display: 'grid', gap: 6 }}>
        <label htmlFor='notes' style={{ fontWeight: 600 }}>
          Notes
        </label>
        <textarea
          id='notes'
          name='notes'
          value={form.notes}
          onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          disabled={isSubmitting}
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type='submit' disabled={!canSubmit} data-dd-action-name='Submit request'>
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
        {!validation.isValid ? (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Fix validation errors to submit.</span>
        ) : null}
      </div>

      {submitState.kind === 'success' ? (
        <div
          role='status'
          style={{
            padding: 10,
            border: '1px solid rgba(58, 223, 139, 0.35)',
            background: 'rgba(58, 223, 139, 0.10)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>Success</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>HTTP {submitState.status}</div>
        </div>
      ) : null}

      {submitState.kind === 'error' ? (
        <div
          role='alert'
          style={{
            padding: 10,
            border: '1px solid rgba(255, 123, 123, 0.35)',
            background: 'rgba(255, 123, 123, 0.10)',
            borderRadius: 10,
          }}
        >
          <div style={{ fontWeight: 600 }}>Error</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {submitState.message}
            {submitState.status ? ` HTTP ${submitState.status}.` : null}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ fontWeight: 600 }}>traceparent</div>
        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}>
          {traceparentForAttempt ? (
            traceparentForAttempt
          ) : (
            <span style={{ color: 'var(--muted)' }}>—</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Inspect the request in DevTools Network to see the header on the wire.
        </div>
      </div>
    </form>
  );
}


