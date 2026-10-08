import axios from 'axios';

const TOKEN_KEY = 'tally_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token logs the user out everywhere.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear();
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  const data = err.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message)).join('. ');
  }
  if (data?.message) return data.message;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check that the API is running.';
  return err.message || 'Something went wrong';
}

export default api;
