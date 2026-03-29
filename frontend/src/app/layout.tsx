import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Video Generator',
  description:
    'Generate cinematic videos using AI. Create stunning videos from text prompts, images, and voice input.',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75" fill="%23a78bfa">🎬</text></svg>',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`font-sans bg-dark-900 text-white overflow-x-hidden`}
      >
        <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
          {children}
        </div>
      </body>
    </html>
  );
}
