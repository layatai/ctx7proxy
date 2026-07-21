export class AccountPool {
  #accounts;
  #cursor = 0;
  #cooldownMs;
  #now;

  constructor(keys, { cooldownMs = 60_000, now = Date.now } = {}) {
    if (!Array.isArray(keys) || keys.length === 0) throw new Error('At least one API key is required');
    this.#accounts = keys.map((key, index) => ({ id: index + 1, key, disabled: false, cooldownUntil: 0 }));
    this.#cooldownMs = cooldownMs;
    this.#now = now;
  }

  acquire(excludedIds = new Set()) {
    const currentTime = this.#now();
    for (let offset = 0; offset < this.#accounts.length; offset += 1) {
      const index = (this.#cursor + offset) % this.#accounts.length;
      const account = this.#accounts[index];
      if (!account.disabled && account.cooldownUntil <= currentTime && !excludedIds.has(account.id)) {
        this.#cursor = (index + 1) % this.#accounts.length;
        return account;
      }
    }
    return null;
  }

  report(account, status, retryAfterSeconds) {
    if (status === 401 || status === 403) {
      account.disabled = true;
      return;
    }
    if (status === 429 || status >= 500) {
      const delay = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : this.#cooldownMs;
      account.cooldownUntil = this.#now() + delay;
    }
  }

  status() {
    const currentTime = this.#now();
    return this.#accounts.map(({ id, disabled, cooldownUntil }) => ({
      id,
      state: disabled ? 'disabled' : cooldownUntil > currentTime ? 'cooldown' : 'ready',
      retryAfterMs: Math.max(0, cooldownUntil - currentTime)
    }));
  }
}
