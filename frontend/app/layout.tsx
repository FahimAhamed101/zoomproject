import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/src/providers';

export const metadata: Metadata = {
  title: 'Zoomit - File Management System',
  description: 'Secure file and folder management with subscription packages',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
