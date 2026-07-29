class MemoryStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const getSafeStorage = (type: "localStorage" | "sessionStorage") => {
  if (typeof window === "undefined") {
    return new MemoryStorage();
  }
  try {
    const storage = window[type];
    const testKey = "__storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch (e) {
    return new MemoryStorage();
  }
};

export const safeLocalStorage = getSafeStorage("localStorage");
export const safeSessionStorage = getSafeStorage("sessionStorage");
