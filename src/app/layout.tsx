import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Permanent_Marker } from 'next/font/google';
import './globals.css';

// Atkinson Hyperlegible: tipografía diseñada para personas con baja visión.
const texto = Atkinson_Hyperlegible({ weight: ['400', '700'], subsets: ['latin'], variable: '--letra-texto' });
// Trazo de marcador para el cartelito, hasta que llegue la letra escrita a mano.
const marcador = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--letra-marcador' });

export const metadata: Metadata = {
  title: 'Cerámicas de Norma',
  description: 'Piezas de cerámica hechas a mano en el taller de Norma.',
};

export const viewport: Viewport = { themeColor: '#f3ead9' };

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es-AR" className={`${texto.variable} ${marcador.variable}`}>
      <body>{children}</body>
    </html>
  );
}
