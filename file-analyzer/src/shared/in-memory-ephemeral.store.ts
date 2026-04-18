export class InMemoryEphemeralStore {
  private store: Map<string, unknown> = new Map();

  set(key: string, value: unknown) {
    this.store.set(key, value);
  }

  get(key: string) {
    const value = this.store.get(key);
    this.store.delete(key); // Remove the value after retrieval

    return value;
  }

  async observe(key: string, timeoutMs: number): Promise<unknown> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkStore = () => {
        const value = this.get(key);
        if (value !== undefined) {
          resolve(value);
        } else if (Date.now() - startTime >= timeoutMs) {
          reject(new Error('Timeout while waiting for value'));
        } else {
          setTimeout(checkStore, 100); // Check every 100ms
        }
      };

      checkStore();
    });
  }
}
