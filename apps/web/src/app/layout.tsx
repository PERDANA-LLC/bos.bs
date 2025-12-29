import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Bible Study - Advanced Scripture Study with RAG Technology',
  description: 'Experience Bible study like never before with AI-powered insights, cross-references, and personalized learning pathways using King James Version.',
  keywords: ['Bible study', 'AI Bible', 'Scripture study', 'KJV', 'Christian', 'theology'],
  authors: [{ name: 'AI Bible Study Team' }],
  openGraph: {
    title: 'AI Bible Study - Advanced Scripture Study',
    description: 'Deepen your understanding of Scripture with AI-powered insights',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Bible Study',
    description: 'Experience Bible study with AI-powered insights',
    images: ['/og-image.jpg'],
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}