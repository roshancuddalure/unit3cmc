import type { AppEnv } from "../../config/env";
import { HttpError } from "../../shared/http-error";

interface AttemptState {
  failures: number[];
  lockedUntil: number | null;
}

export class LoginThrottleService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;

  constructor(env: AppEnv) {
    this.maxAttempts = env.LOGIN_THROTTLE_MAX_ATTEMPTS;
    this.windowMs = env.LOGIN_THROTTLE_WINDOW_MINUTES * 60 * 1000;
    this.lockoutMs = env.LOGIN_THROTTLE_LOCKOUT_MINUTES * 60 * 1000;
  }

  assertCanAttempt(identity: string, ipAddress: string): void {
    const key = this.buildKey(identity, ipAddress);
    const now = Date.now();
    const state = this.cleanup(this.attempts.get(key), now);

    if (state?.lockedUntil && state.lockedUntil > now) {
      const minutesRemaining = Math.max(1, Math.ceil((state.lockedUntil - now) / 60000));
      throw new HttpError(
        429,
        `Too many failed sign-in attempts. Please wait about ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"} before trying again.`
      );
    }
  }

  recordFailure(identity: string, ipAddress: string): void {
    const key = this.buildKey(identity, ipAddress);
    const now = Date.now();
    const state = this.cleanup(this.attempts.get(key), now) ?? { failures: [], lockedUntil: null };
    state.failures.push(now);

    if (state.failures.length >= this.maxAttempts) {
      state.lockedUntil = now + this.lockoutMs;
      state.failures = [];
    }

    this.attempts.set(key, state);
  }

  recordSuccess(identity: string, ipAddress: string): void {
    this.attempts.delete(this.buildKey(identity, ipAddress));
  }

  private buildKey(identity: string, ipAddress: string): string {
    return `${identity.trim().toLowerCase()}::${ipAddress.trim().toLowerCase()}`;
  }

  private cleanup(state: AttemptState | undefined, now: number): AttemptState | null {
    if (!state) {
      return null;
    }

    const failures = state.failures.filter((timestamp) => now - timestamp <= this.windowMs);
    const lockedUntil = state.lockedUntil && state.lockedUntil > now ? state.lockedUntil : null;

    if (!failures.length && !lockedUntil) {
      return null;
    }

    return { failures, lockedUntil };
  }
}
