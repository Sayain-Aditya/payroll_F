const KEY = 'payrolldesk.token';
const COOKIE = 'pd_token';

export const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem(KEY) : null);

export function setToken(t) {
  localStorage.setItem(KEY, t);
  // also set as cookie so Next.js middleware can read it
  document.cookie = `${COOKIE}=${t};path=/;max-age=${7 * 24 * 3600};SameSite=Strict`;
}

export function clearToken() {
  localStorage.removeItem(KEY);
  document.cookie = `${COOKIE}=;path=/;max-age=0`;
}
