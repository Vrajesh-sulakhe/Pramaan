export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    throw new Error('API Client not implemented in Mock Mode');
  },
  post: async <T>(url: string, data: any): Promise<T> => {
    throw new Error('API Client not implemented in Mock Mode');
  }
};
