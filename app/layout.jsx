import './globals.css';
import AppProvider from '@/components/AppProvider';
import Shell from '@/components/Shell';

export const metadata = {
  title: 'PayrollDesk',
  description: 'Attendance and salary sheet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Shell>{children}</Shell>
        </AppProvider>
      </body>
    </html>
  );
}
