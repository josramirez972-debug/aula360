import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'AULA360 - Plataforma de Gestión y Seguimiento Académico',
  description: 'Sistema integral de gestión escolar para profesores y consulta privada para padres de familia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
