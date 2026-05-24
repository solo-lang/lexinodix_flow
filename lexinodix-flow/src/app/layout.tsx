import type { Metadata, Viewport } from 'next';
import { Sora, Outfit } from 'next/font/google';
import '@/styles/globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'Lexinodix Flow',
    template: '%s — Lexinodix Flow',
  },
  description: 'The luxury ambient intelligence workspace. Organize files, manage notes, and interact with your knowledge through AI.',
  keywords: ['workspace', 'notes', 'AI', 'productivity', 'organization'],
  authors: [{ name: 'Lexinodix' }],
  creator: 'Lexinodix',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Lexinodix Flow',
    description: 'The luxury ambient intelligence workspace.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F5F1EE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sora.variable} ${outfit.variable}`}>
      <body className="bg-warm-bg text-dark-navy font-outfit antialiased">
        {children}
      </body>
    </html>
  );
}
