import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OW2 Pick Coach',
  description: 'Get statistically-informed hero picks for Overwatch 2',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
