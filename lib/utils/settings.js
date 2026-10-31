const KEY = 'payrolldesk.settings.v1';

export const DEFAULTS = {
  companyName: 'PayrollDesk',
  deductionPerAbsent: 1.5,
  clAfterMonths: 6,
  clPerMonth: 1,
  workingDaysMode: 'actual',   // 'actual' | 'fixed'
  fixedWorkingDays: 26,
  depts: ['Sales', 'Service', 'Admin', 'HR', 'Account'],
};

export function getSettings() {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
