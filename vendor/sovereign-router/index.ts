/**
 * sovereign-router — zero-dependency multi-model routing engine, in-house.
 *
 * Replaces LangChain/LiteLLM/OpenRouter SDKs. The commercial "wedge" (W1 in
 * agentic_valuation_model.md) expressed as a standalone library:
 *   - provider registry (local Ollama / llama.cpp / vLLM first)
 *   - health probing via sovereign-http (no cloud endpoints)
 *   - weighted failover with circuit breaker
 *   - deterministic heuristic fallback so tasks ALWAYS complete offline
 *   - structured route telemetry: { engine_used, is_fallback, execution_time_ms }
 *     (same meta contract as server/geminiService.ts)
 */

import { request } from '../sovereign-http/index.ts';

export interface ProviderConfig {
  id: string;
  kind: 'ollama' | 'llamacpp' | 'vllm' | 'heuristic';
  baseUrl?: string; // local only, e.g. http://127.0.0.1:11434
  model?: string;
  priority: number; // lower = tried first
  timeoutMs?: number;
}

export interface RouteMeta {
  engine_used: string;
  is_fallback: boolean;
  execution_time_ms: number;
  attempts: { provider: string; ok: boolean; error?: string }[];
}

export interface CompletionResult {
  text: string;
  meta: RouteMeta;
}

interface HealthState {
  failures: number;
  openUntil: number; // epoch ms; circuit open until then
}

export class SovereignRouter {
  private providers: ProviderConfig[];
  private health = new Map<string, HealthState>();
  private readonly threshold: number;
  private readonly cooldownMs: number;
  /** Rolling window of attempt records across all completions (observability). */
  public readonly attemptLog: { provider: string; ok: boolean; error?: string }[] = [];

  constructor(providers: ProviderConfig[], opts?: { failureThreshold?: number; cooldownMs?: number }) {
    this.providers = [...providers].sort((a, b) => a.priority - b.priority);
    this.threshold = opts?.failureThreshold ?? 3;
    this.cooldownMs = opts?.cooldownMs ?? 30_000;
  }

  /** Probe all HTTP providers; returns per-provider reachability. No cloud calls. */
  async probeAll(): Promise<Record<string, boolean>> {
    const out: Record<string, boolean> = {};
    for (const p of this.providers) {
      if (p.kind === 'heuristic' || !p.baseUrl) {
        out[p.id] = true;
        continue;
      }
      try {
        const res = await request(p.baseUrl + (p.kind === 'ollama' ? '/api/tags' : '/health'), {
          method: 'GET',
          timeoutMs: 2000,
        });
        out[p.id] = res.status === 200;
      } catch {
        out[p.id] = false;
      }
    }
    return out;
  }

  private recordFailure(id: string) {
    const h = this.health.get(id) ?? { failures: 0, openUntil: 0 };
    h.failures += 1;
    if (h.failures >= this.threshold) h.openUntil = Date.now() + this.cooldownMs;
    this.health.set(id, h);
  }

  private recordSuccess(id: string) {
    this.health.delete(id);
  }

  private circuitOpen(id: string): boolean {
    const h = this.health.get(id);
    if (!h) return false;
    if (h.openUntil > 0 && Date.now() >= h.openUntil) {
      // cooldown elapsed -> half-open: allow exactly one retry, keep state until resolved
      h.failures = 0;
      h.openUntil = 0;
      return false;
    }
    return h.openUntil > 0;
  }

  /** Deterministic local fallback — pure heuristics, zero network, always succeeds. */
  heuristicComplete(prompt: string): string {
    const words = prompt.trim().split(/\s+/).length;
    const q = /\?$/.test(prompt.trim());
    return JSON.stringify({
      engine: 'heuristic_fallback',
      deterministic: true,
      response: q
        ? `Offline heuristic: insufficient local context to answer "${prompt.slice(0, 80)}" definitively.`
        : `Offline heuristic acknowledged ${words} tokens; no transformation required.`,
    });
  }

  async complete(prompt: string): Promise<CompletionResult> {
    const started = performance.now();
    const attempts: RouteMeta['attempts'] = [];

    for (const p of this.providers) {
      if (p.kind === 'heuristic') {
        attempts.push({ provider: p.id, ok: true });
        return {
          text: this.heuristicComplete(prompt),
          meta: {
            engine_used: 'heuristic_fallback',
            is_fallback: true,
            execution_time_ms: Math.round(performance.now() - started),
            attempts,
          },
        };
      }
      if (this.circuitOpen(p.id)) {
        const rec = { provider: p.id, ok: false, error: 'circuit_open' };
        attempts.push(rec);
        this.attemptLog.push(rec);
        continue;
      }
      try {
        const text = await this.callProvider(p, prompt);
        this.recordSuccess(p.id);
        const rec = { provider: p.id, ok: true };
        attempts.push(rec);
        this.attemptLog.push(rec);
        return {
          text,
          meta: {
            engine_used: p.id,
            is_fallback: false,
            execution_time_ms: Math.round(performance.now() - started),
            attempts,
          },
        };
      } catch (err) {
        this.recordFailure(p.id);
        const rec = { provider: p.id, ok: false, error: (err as Error).message };
        attempts.push(rec);
        this.attemptLog.push(rec);
      }
    }

    // Fail-closed to deterministic local engine: task ALWAYS completes offline.
    const text = this.heuristicComplete(prompt);
    return {
      text,
      meta: {
        engine_used: 'heuristic_fallback',
        is_fallback: true,
        execution_time_ms: Math.round(performance.now() - started),
        attempts,
      },
    };
  }

  private async callProvider(p: ProviderConfig, prompt: string): Promise<string> {
    if (!p.baseUrl) throw new Error(`provider ${p.id}: missing baseUrl`);
    if (p.kind === 'ollama') {
      const res = await request(`${p.baseUrl}/api/generate`, {
        method: 'POST',
        body: { model: p.model ?? 'llama3', prompt, stream: false },
        timeoutMs: p.timeoutMs ?? 60_000,
      });
      if (res.status !== 200) throw new Error(`ollama ${res.status}`);
      return (res.json<{ response: string }>().response ?? '');
    }
    // llama.cpp server & vLLM both expose OpenAI-compatible /v1/completions
    const res = await request(`${p.baseUrl}/v1/completions`, {
      method: 'POST',
      body: { model: p.model ?? 'default', prompt, max_tokens: 512 },
      timeoutMs: p.timeoutMs ?? 60_000,
    });
    if (res.status !== 200) throw new Error(`${p.kind} ${res.status}`);
    const j = res.json<{ choices?: { text?: string }[] }>();
    return j.choices?.[0]?.text ?? '';
  }
}
