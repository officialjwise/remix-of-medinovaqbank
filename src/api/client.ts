// Mock API layer. Real Axios client will replace this when backend exists.
// Keeps the same call surface so swapping is mechanical.

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const apiClient = {
  async get<T>(_path: string, mock: T): Promise<T> {
    await delay();
    return mock;
  },
  async post<T>(_path: string, _body: unknown, mock: T): Promise<T> {
    await delay();
    return mock;
  },
};
