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

  getAlerts: (month) => req(`/alerts?month=${month}`),

  getSheet: (month) => req(`/sheet?month=${month}`).then((r) => r.rows ?? r),
  addToSheet: (month, employeeIds) => req('/sheet/add', json('POST', { month, employeeIds })).then((r) => r.rows ?? r),
  updateRow: (id, patch, month) => req(`/sheet/${id}?month=${month}`, json('PUT', patch)),
  deleteRow: (id, month) => req(`/sheet/${id}?month=${month}`, { method: 'DELETE' }),
  getDaily: (date, dept = '', company = '') => req(`/daily?date=${date}${dept ? `&dept=${dept}` : ''}${company ? `&company=${company}` : ''}`),
  saveDaily: (date, records) => req('/daily', json('POST', { date, records })),
  getEmployeeCalendar: (id, month) => req(`/daily/employee/${id}?month=${month}`),

  syncMonth: (month) => req(`/daily/sync?month=${month}`, { method: 'POST' }),

  resetOverride: (id, month) => req(`/sheet/${id}/override?month=${month}`, { method: 'DELETE' }),
  setOverride: (id, month) => req(`/sheet/${id}/override?month=${month}`, { method: 'POST' }),
  importExcel: (file, month, company = '') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('month', month);
    if (company) fd.append('company', company);
    return req('/sheet/import', { method: 'POST', body: fd });
  },
};
