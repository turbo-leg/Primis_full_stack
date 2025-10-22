import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'College Prep Platform',
  description: 'A comprehensive college preparation platform with student management, course delivery, and administrative tools.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}