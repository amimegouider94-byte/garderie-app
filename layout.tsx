import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Les Petits Champions 🎈 — Système de Gestion de Garderie & Crèche',
  description: 'Application de gestion de garderie moderne, suivi de présence quotidien, facturation et reçus PDF, journal des éducatrices et portail parents.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎈</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-nursery-cream text-slate-800">
        {children}
      </body>
    </html>
  );
}
