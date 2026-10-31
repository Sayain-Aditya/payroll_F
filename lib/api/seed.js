import { autoCl, daysInMonth } from '../utils/calc';

const EMPLOYEES = [
  ['Rahul Sharma', 'Sales Manager', 'Sales', 'Pune', 46000, '2021-04-12'],
  ['Priya Nair', 'Sales Executive', 'Sales', 'Mumbai', 24000, '2022-06-01'],
  ['Amit Verma', 'Sales Executive', 'Sales', 'Pune', 18000, '2026-06-15'],
  ['Neha Gupta', 'Service Engineer', 'Service', 'Pune', 25000, '2021-09-10'],
  ['Suresh Yadav', 'Service Technician', 'Service', 'Nashik', 22000, '2023-01-05'],
  ['Karan Mehta', 'Service Technician', 'Service', 'Mumbai', 20000, '2026-08-01'],
  ['Anita Desai', 'Office Administrator', 'Admin', 'Mumbai', 22000, '2020-03-02'],
  ['Vikram Singh', 'Admin Assistant', 'Admin', 'Pune', 18000, '2026-05-20'],
  ['Sneha Kulkarni', 'HR Manager', 'HR', 'Mumbai', 48000, '2019-11-18'],
  ['Rohit Jain', 'HR Executive', 'HR', 'Pune', 34000, '2024-02-12'],
  ['Deepak Rao', 'Accountant', 'Account', 'Mumbai', 30000, '2022-08-22'],
  ['Pooja Iyer', 'Accounts Assistant', 'Account', 'Pune', 21000, '2026-07-01'],
  ['Test Import', 'Clerk', 'Admin', 'Mumbai', 30000, '2026-01-10'], // no attendance yet
];

// October 2026: [present, leave, ew, cl, absent] for the first 12 employees
const OCT = [
  [28, 0, 0, 1, 2], [29, 0, 0, 1, 1], [29, 0, 0, 0, 2], [28, 1, 2, 1, 1], [28, 0, 0, 1, 2], [28, 2, 0, 0, 1],
  [30, 0, 1, 1, 0], [28, 2, 0, 0, 1], [27, 2, 0, 1, 1], [27, 1, 0, 1, 2], [26, 1, 1, 1, 3], [27, 2, 0, 0, 2],
];
// Rahul's Aug / Sep
const RAHUL = { '2026-08': [30, 0, 0, 1, 0], '2026-09': [26, 1, 0, 1, 2] };

const rnd = (s) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

export function seed() {
  let seq = 0;
  const employees = EMPLOYEES.map(([name, designation, dept, place, ctc, doj]) => ({
    id: `e${++seq}`, name, designation, dept, place, ctc, doj,
  }));
  const rows = [];

  ['2026-08', '2026-09', '2026-10'].forEach((month, mi) => {
    const day = daysInMonth(month);
    employees.slice(0, 12).forEach((e, ei) => {
      let v;
      if (month === '2026-10') v = OCT[ei];
      else if (ei === 0) v = RAHUL[month];
      else {
        const cl = autoCl(e.doj, month);
        const absent = Math.floor(rnd(ei * 10 + mi) * 3);
        const leave = rnd(ei * 10 + mi + 50) > 0.7 ? 1 : 0;
        const ew = rnd(ei * 10 + mi + 90) > 0.85 ? 1 : 0;
        v = [day - absent - leave - cl, leave, ew, cl, absent];
      }
      const [present, leave, ew, cl, absent] = v;
      const ctc = ei === 0 ? 45000 : e.ctc; // Rahul got a raise later
      rows.push({ id: `r${++seq}`, employeeId: e.id, month, ctc, day, present, leave, ew, cl, absent });
    });
  });
  return { seq, employees, rows };
}
