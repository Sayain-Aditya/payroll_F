import { calcRow } from '../calc';
import { httpApi } from './http';
import { mockApi } from './mock';

export const IS_MOCK = !process.env.NEXT_PUBLIC_API_URL;
const raw = IS_MOCK ? mockApi : httpApi;

export const api = {
  ...raw,
  getSheet: async (m) => (await raw.getSheet(m)).map(calcRow),
  addToSheet: async (m, ids) => (await raw.addToSheet(m, ids)).map(calcRow),
  updateRow: async (id, p, m) => calcRow(await raw.updateRow(id, p, m)),
  deleteRow: (id, m) => raw.deleteRow(id, m),
  getHistory: async (id) => (await raw.getHistory(id)).map(calcRow),
  getAlerts: async (m) => raw.getAlerts(m),
  listHolidays: (m) => raw.listHolidays(m),
  createHoliday: (date, name) => raw.createHoliday(date, name),
  deleteHoliday: (id) => raw.deleteHoliday(id),
  applyHolidays: (m) => raw.applyHolidays(m),
  getDaily: (date, dept, company) => raw.getDaily(date, dept, company),
  saveDaily: (date, records) => raw.saveDaily(date, records),
  getEmployeeCalendar: (id, month) => raw.getEmployeeCalendar(id, month),
  syncMonth: (month) => raw.syncMonth(month),
  resetOverride: async (id, m) => calcRow(await raw.resetOverride(id, m)),
  setOverride: async (id, m) => calcRow(await raw.setOverride(id, m)),
  resetDemo: () => raw.reset?.(),
};
