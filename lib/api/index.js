import { calcRow } from '../calc';
import { httpApi } from './http';
import { mockApi } from './mock';

export const IS_MOCK = !process.env.NEXT_PUBLIC_API_URL;
const raw = IS_MOCK ? mockApi : httpApi;

// Derived columns (Total Working, Deduction, Attendance, Net Salary) are always computed here,
// so the screen never disagrees with itself.
export const api = {
  ...raw,
  getSheet: async (m) => (await raw.getSheet(m)).map(calcRow),
  addToSheet: async (m, ids) => (await raw.addToSheet(m, ids)).map(calcRow),
  updateRow: async (id, p) => calcRow(await raw.updateRow(id, p)),
  getHistory: async (id) => (await raw.getHistory(id)).map(calcRow),
  resetDemo: () => raw.reset?.(),
};
