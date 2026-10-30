'use client';
import { usePathname } from 'next/navigation';
import Header from './Header';

export default function Shell({ children }) {
  const path = usePathname();
  if (path === '/login') return <>{children}</>;
  return (
    <>
      <Header />
      <main className="page">{children}</main>
    </>
  );
}
