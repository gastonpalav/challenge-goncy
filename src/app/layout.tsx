import type { Metadata, Viewport } from "next";
import {
  Atkinson_Hyperlegible,
  Caprasimo,
  Permanent_Marker,
} from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible: tipografía diseñada para personas con baja visión.
const texto = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--letra-texto",
});
// Caprasimo: letra gruesa y redondeada para el cartel y los nombres de las piezas.
const cartel = Caprasimo({
  weight: "400",
  subsets: ["latin"],
  variable: "--letra-cartel",
});
// Trazo de marcador para el cartelito, hasta que llegue la letra escrita a mano.
const marcador = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--letra-marcador",
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
      className={`${texto.variable} ${cartel.variable} ${marcador.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
