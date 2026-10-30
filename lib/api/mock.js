// Demo backend: everything lives in this browser's localStorage. Same interface as http.js.
import { autoCl, daysInMonth } from '../calc';
import { parseExcel } from '../parseExcel';
import { seed } from './seed';

const KEY = 'payrolldesk.demo.v1';
const NUM = ['ctc', 'day', 'present', 'leave', 'ew', 'cl', 'absent'];

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const d = seed();
  save(d);
  return d;
}
const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
const nid = (d, p) => `${p}${++d.seq}`;

const join = (d, r) => {
  const e = d.employees.find((x) => x.id === r.employeeId) || {};
  return { ...r, name: e.name, designation: e.designation, dept: e.dept, place: e.place, doj: e.doj };
};
const sheetRows = (d, month) => d.rows.filter((r) => r.month === month).map((r, i) => ({ ...join(d, r), srNo: i + 1 }));
const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const mockApi = {
  reset: () => localStorage.removeItem(KEY),

  async listEmployees() {
    return load().employees.slice();
  },
  async createEmployee(data) {
    const d = load();
    const name = String(data.name || '').trim();
    if (!name) throw new Error('Name is required');
    if (d.employees.some((e) => sameName(e.name, name))) throw new Error('An employee with this name already exists');
    const e = { id: nid(d, 'e'), name, designation: data.designation || '', dept: data.dept || '', place: data.place || '', ctc: Number(data.ctc) || 0, doj: data.doj || '' };
    d.employees.push(e);
    save(d);
    return e;
  },
  async updateEmployee(id, data) {
    const d = load();
    const e = d.employees.find((x) => x.id === id);
    if (!e) throw new Error('Employee not found');
    if (data.name != null) {
      const name = String(data.name).trim();
      if (!name) throw new Error('Name is required');
      if (d.employees.some((x) => x.id !== id && sameName(x.name, name))) throw new Error('An employee with this name already exists');
      e.name = name;
    }
    ['designation', 'dept', 'place', 'doj'].forEach((k) => { if (k in data) e[k] = data[k] || ''; });
    if ('ctc' in data) e.ctc = Number(data.ctc) || 0;
    save(d);
    return e;
  },
  async deleteEmployee(id) {
    const d = load();
    d.employees = d.employees.filter((e) => e.id !== id);
    d.rows = d.rows.filter((r) => r.employeeId !== id);
    save(d);
    return { ok: true };
  },
  async getHistory(employeeId) {
    const d = load();
    return d.rows.filter((r) => r.employeeId === employeeId).sort((a, b) => b.month.localeCompare(a.month)).map((r) => join(d, r));
  },

  async getSheet(month) {
    return sheetRows(load(), month);
  },
  async addToSheet(month, ids) {
    const d = load();
    const added = [];
    for (const eid of ids) {
      const e = d.employees.find((x) => x.id === eid);
      if (!e || d.rows.some((r) => r.month === month && r.employeeId === eid)) continue;
      const day = daysInMonth(month);
      const cl = autoCl(e.doj, month);
      // default: full attendance (present + CL = days)
      const row = { id: nid(d, 'r'), employeeId: eid, month, ctc: e.ctc, day, present: day - cl, leave: 0, ew: 0, cl, absent: 0 };
      d.rows.push(row);
      added.push(row.id);
    }
    save(d);
    return sheetRows(d, month).filter((r) => added.includes(r.id));
  },
  async updateRow(id, patch) {
    const d = load();
    const row = d.rows.find((r) => r.id === id);
    if (!row) throw new Error('Row not found');
    for (const k of NUM) {
      if (!(k in patch)) continue;
      const n = Number(patch[k]);
      if (!Number.isFinite(n) || n < 0) throw new Error(`${k} must be a non-negative number`);
      row[k] = n;
    }
    save(d);
    return sheetRows(d, row.month).find((r) => r.id === id);
  },
  async deleteRow(id) {
    const d = load();
    d.rows = d.rows.filter((r) => r.id !== id);
    save(d);
    return { ok: true };
  },

  async importExcel(file, month) {
    const { rows, warnings } = await parseExcel(file);
    if (!rows.length) throw new Error('No employee rows found in the sheet');
    const d = load();
    let created = 0;
    let updated = 0;
    for (const p of rows) {
      let e = d.employees.find((x) => sameName(x.name, p.name));
      if (!e) {
        e = { id: nid(d, 'e'), name: p.name, designation: p.designation, dept: p.dept, place: p.place, ctc: p.ctc || 0, doj: p.doj };
        d.employees.push(e);
      } else {
        if (p.designation) e.designation = p.designation;
        if (p.dept) e.dept = p.dept;
        if (p.place) e.place = p.place;
        if (p.ctc) e.ctc = p.ctc;
        if (p.doj) e.doj = p.doj;
      }
      const day = p.day || daysInMonth(month);
      const present = p.present ?? 0;
      const leave = p.leave ?? 0;
      const cl = p.cl ?? autoCl(e.doj, month);
      const values = { ctc: p.ctc || e.ctc, day, present, leave, ew: p.ew ?? 0, cl, absent: p.absent ?? Math.max(0, day - present - leave - cl) };
      const ex = d.rows.find((r) => r.month === month && r.employeeId === e.id);
      if (ex) { Object.assign(ex, values); updated++; }
      else { d.rows.push({ id: nid(d, 'r'), employeeId: e.id, month, ...values }); created++; }
    }
    save(d);
    return { total: rows.length, created, updated, warnings };
  },
};
