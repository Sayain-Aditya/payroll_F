export async function exportSheet(rows, month) {
  const mod = await import('xlsx');
  const XLSX = mod.default || mod;
  const data = rows.map((r) => ({
    'Sr.': r.srNo, Name: r.name, Designation: r.designation, 'Dept.': r.dept, Place: r.place,
    'CTC/Month': r.ctc, Day: r.day, Present: r.present, Leave: r.leave, EW: r.ew, CL: r.cl,
    Absent: r.absent, 'Total Working': r.totalWorking, 'Day Deduction': r.dayDeduction,
    'Total Attendance': r.totalAttendance, 'Net Salary': r.netSalary,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), month);
  XLSX.writeFile(wb, `payroll-${month}.xlsx`);
}
