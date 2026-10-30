// Real backend. Endpoints are listed in README.md (the backend will be updated to match).
import { getToken } from '../auth';

const BASE = process.env.NEXT_PUBLIC_API_URL;

async function req(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(BASE + path, { cache: 'no-store', ...options, headers });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  if (res.status === 401) {
    if (typeof window !== 'undefined') { window.location.href = '/login'; }
    throw new Error('Session expired. Please log in again.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}
const json = (method, data) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

export const httpApi = {
  listEmployees: () => req('/employees').then((r) => r.data ?? r),
  createEmployee: (d) => req('/employees', json('POST', d)),
  updateEmployee: (id, d) => req(`/employees/${id}`, json('PUT', d)),
  deleteEmployee: (id) => req(`/employees/${id}`, { method: 'DELETE' }),
  getHistory: (id) => req(`/employees/${id}/history`).then((r) => r.rows ?? r),

  getSheet: (month) => req(`/sheet?month=${month}`).then((r) => r.rows ?? r),
  addToSheet: (month, employeeIds) => req('/sheet/add', json('POST', { month, employeeIds })).then((r) => r.rows ?? r),
  updateRow: (id, patch) => req(`/sheet/${id}`, json('PUT', patch)),
  deleteRow: (id) => req(`/sheet/${id}`, { method: 'DELETE' }),
  importExcel: (file, month) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('month', month);
    return req('/sheet/import', { method: 'POST', body: fd });
  },
};
