import "./globals.css";

export const metadata = {
  title: "AMAC ZIP Coverage",
  description: "ZIP coverage checker",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
