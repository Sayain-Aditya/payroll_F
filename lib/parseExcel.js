import { DEPTS } from './constants';

const HEADERS = {
  sr: 'srNo', place: 'place', name: 'name', designation: 'designation', dept: 'dept',
  ctcmonth: 'ctc', ctc: 'ctc', doj: 'doj', day: 'day', present: 'present', leave: 'leave',
  ew: 'ew', cl: 'cl', totalabsent: 'absent', absent: 'absent',
  bankname: 'bankName', bank: 'bankName',
  accountno: 'accountNo', accno: 'accountNo', accountnumber: 'accountNo', bankaccountno: 'accountNo',
  ifsc: 'ifsc', ifsccode: 'ifsc',
};
const norm = (h) => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const empty = (v) => v === '' || v == null;

function normDept(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  return DEPTS.find((d) => d.toLowerCase() === s.toLowerCase()) || s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function toIso(v) {
  if (empty(v)) return '';
  let d = v instanceof Date ? v : new Date(v);
  if (isNaN(d)) return '';
  d = new Date(d.getTime() + 12 * 3600 * 1000); // guard against timezone skew from Excel dates
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Reads the first sheet. Blank numeric cells become null (so rules can fill them in). */
export async function parseExcel(file) {
  const mod = await import('xlsx');
  const XLSX = mod.default || mod;
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });

  const rows = [];
  const warnings = [];
  raw.forEach((r, i) => {
    const o = {};
    for (const [k, v] of Object.entries(r)) {
      const f = HEADERS[norm(k)];
      if (f) o[f] = v;
    }
    const name = String(o.name || '').trim();
    if (!name) return;
    if (/^rent$/i.test(String(o.designation || '').trim())) return;
    const line = i + 2;
    const num = (f) => {
      if (empty(o[f])) return null;
      const n = Number(o[f]);
      if (Number.isFinite(n) && n >= 0) return n;
      warnings.push(`Row ${line} (${name}): ${f} has invalid value "${o[f]}" - ignored`);
      return null;
    };
    rows.push({
      name, place: String(o.place || '').trim(), designation: String(o.designation || '').trim(),
      dept: normDept(o.dept), doj: toIso(o.doj),
      ctc: num('ctc'), day: num('day'), present: num('present'), leave: num('leave'),
      ew: num('ew'), cl: num('cl'), absent: num('absent'),
      bankName: String(o.bankName || '').trim(),
      accountNo: String(o.accountNo || '').trim(),
      ifsc: String(o.ifsc || '').trim().toUpperCase(),
    });
  });
  return { rows, warnings };
}
