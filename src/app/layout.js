import "./globals.css";

export const metadata = {
  title: "Modelli 3D",
  description:
    "Visualizzatore di modelli 3D GLB: rotazione, zoom, tutto schermo, movimento di prova e apertura delle gambe sui modelli con scheletro.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>
        <a href="#contenuto" className="skip-link">
          Salta al contenuto
        </a>
        {children}
      </body>
    </html>
  );
}
