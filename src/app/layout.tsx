import React from 'react';
import { Navbar } from '@/components/common/Navbar';
import '@/styles/globals.css';

export const metadata = {
  title: 'Aeria',
  description: 'A Writing Project - Novel and Characters',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="light">
        {/* Общий контейнер для всего контента включая навбар */}
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  );
}
