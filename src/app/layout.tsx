import type { Metadata, Viewport } from "next";
import {
  Atkinson_Hyperlegible,
  Caprasimo,
  Caveat,
} from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible: tipografía diseñada para personas con baja visión.
const texto = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--letra-texto",
});
// Caprasimo: letra gruesa y redondeada para el cartel, los nombres de las piezas y los precios.
const cartel = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--letra-cartel",
});
// Caveat: letra escrita a mano para lo que dice Norma (su refrán, la despedida, el cartel del taller).
const mano = Caveat({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--letra-mano",
});

export const metadata: Metadata = {
  title: "La manito de Norma",
  description: "Piezas de cerámica hechas a mano en el taller de Norma.",
};

export const viewport: Viewport = { themeColor: "#fbfcfe" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${texto.variable} ${cartel.variable} ${mano.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
