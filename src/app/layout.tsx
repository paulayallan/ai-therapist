import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mentara — a calmer place to check in",
    template: "%s · Mentara",
  },
  description:
    "A quiet, self-guided space for anxiety: a rescue flow for hard moments, short regulation tools, daily check-ins and journalling, and honest patterns over time.",
  applicationName: "Mentara",
  formatDetection: { telephone: false },
  openGraph: {
    title: "Mentara",
    description: "A calmer place to check in.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#161513" },
  ],
};

/**
 * Applies the stored theme before first paint. Without this the page flashes
 * light before switching, which is a bad first second for an app about calm.
 */
const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('mentara-theme');
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
