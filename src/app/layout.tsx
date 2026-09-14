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
 * Two things that have to happen before the first pixel.
 *
 * The theme, because otherwise the page flashes light before switching, which
 * is a bad first second for an app about calm.
 *
 * And `data-native`, because Apple's Guideline 3.1.1 forbids an app from
 * showing buttons, links or calls to action that send someone to a purchasing
 * mechanism other than in-app purchase — and the practitioner side sells a
 * $30/month listing through Stripe. Every entrance to it is marked
 * `data-web-only`, and the stylesheet hides those whenever this attribute is
 * set.
 *
 * It has to be a blocking script rather than a component effect: an effect
 * runs after paint, so the link would show for a frame and then vanish, and a
 * frame is enough to be a screenshot. It also has to live in the ROOT layout,
 * because the landing page, /auth and /therapists all render outside the (app)
 * group where NativeShell is mounted — they would otherwise never learn they
 * are inside the shell at all.
 *
 * Capacitor defines its global before page scripts run, so this is reliable.
 * In any browser, mobile Safari included, the check is false and the web is
 * left entirely alone — which is the point. A user-agent test would hide the
 * practitioner entrance from every psychologist browsing on an iPhone.
 */
const BOOT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('mentara-theme');
    var dark = stored ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
  try {
    var c = window.Capacitor;
    if (c && typeof c.isNativePlatform === 'function' && c.isNativePlatform()) {
      document.documentElement.setAttribute('data-native', 'true');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
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
