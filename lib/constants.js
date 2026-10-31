import { getSettings } from './settings';

export const getDepts = () => getSettings().depts;
export const DEPTS = ['Sales', 'Service', 'Admin', 'HR', 'Account']; // fallback for SSR

export const COMPANIES = ['BKT', 'Volvoline', 'Schwing Setter', 'Kubota Escorts', 'Tata Hitachi'];

// normalise a raw string to a known company name (case-insensitive, ignores spaces/symbols)
const normStr = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const COMPANY_NORM = Object.fromEntries(COMPANIES.map((c) => [normStr(c), c]));
export const matchCompany = (raw) => COMPANY_NORM[normStr(raw)] || String(raw || '').trim();

export const DEPT_STYLE = {
  Sales: { bg: '#dbeafe', fg: '#1e40af' },
  Service: { bg: '#e0e7ff', fg: '#3730a3' },
  Admin: { bg: '#e2e8f0', fg: '#1e293b' },
  HR: { bg: '#fce7f3', fg: '#9d174d' },
  Account: { bg: '#dcfce7', fg: '#166534' },
};

export const DEDUCTION_PER_ABSENT = 1.5;
export const CL_AFTER_MONTHS = 6;
export const CL_PER_MONTH = 1;
