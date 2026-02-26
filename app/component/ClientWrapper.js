"use client";
import { usePathname } from 'next/navigation';
import Navbar from './navbar';

export default function ClientWrapper({ children }) {
  const pathname = usePathname();
  const hideNavbar = pathname.includes('/play');

  return (
    <div className="relative z-10 flex flex-col min-h-screen">
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}