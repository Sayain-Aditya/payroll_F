import { getSettings } from './settings';

export const getDepts = () => getSettings().depts;
export const DEPTS = ['Sales', 'Service', 'Admin', 'HR', 'Account']; // fallback for SSR

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
