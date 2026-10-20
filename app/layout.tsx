import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'workManage 課題管理',
  description: 'GASバックエンドの通信フィルタリングを回避するサーバープロキシを内蔵した課題管理Webアプリケーション',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon/icon-192.jpg',
  },
  openGraph: {
    title: 'workManage 課題管理',
    description: 'GASバックエンドの通信フィルタリングを回避するサーバープロキシを内蔵した課題管理Webアプリケーション',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'workManage 課題管理',
    description: 'GASバックエンドの通信フィルタリングを回避するサーバープロキシを内蔵した課題管理Webアプリケーション',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
