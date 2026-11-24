import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: 'PUNDA — Real-Time Web Messenger',
  description: 'Fast, secure, WhatsApp-style real-time messaging, statuses, voice notes, and WebRTC calls.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body className="h-full overflow-hidden antialiased bg-[#f0f2f5] dark:bg-[#0c1317] text-[#111b21] dark:text-[#e9edef]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
