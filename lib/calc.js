import { getSettings } from './settings';

export const daysInMonth = (month) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
};

export function clEligible(doj, month) {
  const { clAfterMonths } = getSettings();
  const [dy, dm, dd] = String(doj || '').slice(0, 10).split('-').map(Number);
  if (!dy) return false;
  const [y, m] = month.split('-').map(Number);
  let months = (y - dy) * 12 + (m - dm);
  if (new Date(y, m, 0).getDate() < dd) months -= 1;
  return months >= clAfterMonths;
}

export const autoCl = (doj, month) => {
  const { clPerMonth } = getSettings();
  return clEligible(doj, month) ? clPerMonth : 0;
};

export function calcRow(r) {
  const { deductionPerAbsent, workingDaysMode, fixedWorkingDays } = getSettings();
  const n = (v) => Number(v) || 0;
  const day = workingDaysMode === 'fixed' ? fixedWorkingDays : n(r.day);

  // if employee is not CL-eligible, force cl to 0 regardless of what's stored
  const eligible = clEligible(r.doj, r.month);
  const cl = eligible ? n(r.cl) : 0;

  const absent = r.absentOverride != null
    ? n(r.absentOverride)
    : Math.max(0, day - n(r.present) - n(r.leave) - cl - n(r.ew));

  const totalWorking = n(r.present) + n(r.ew) + cl;
  const dayDeduction = absent * deductionPerAbsent;
  const totalAttendance = Math.max(0, day - dayDeduction + n(r.leave));

  const perDay = day > 0 ? n(r.ctc) / day : 0;
  const netSalary = Math.max(0, Math.round(perDay * totalAttendance));
  return { ...r, cl, absent, totalWorking, dayDeduction, totalAttendance, netSalary, clEligible: eligible };
}
